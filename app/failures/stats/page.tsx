
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  Box,
  Container,
  Loader,
  Button,
  Group,
  Switch,
  Text,
  Stack,
  Badge,
  Paper,
  SegmentedControl,
  ThemeIcon,
  Divider,
} from "@mantine/core";

import {
  IconSearch,
  IconCalendar,
  IconChartBar,
  IconChartBarOff,
  IconAlertCircle,
  IconRefresh,
  IconActivity,
  IconClock,
  IconLayoutList,
  IconLayoutGrid,
} from "@tabler/icons-react";

import { bungee } from "../../layout";

import FailureStatsCollapsible from "../../components/FailureStats1";
import FailureStats from "../../components/Failures/FailureStats";

// =====================================================
// PAGE
// =====================================================

export default function StatsPage() {
  // =====================================================
  // GET TODAY
  // =====================================================

  function getToday() {
    const date = new Date();

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;
  }

  // =====================================================
  // STATES
  // =====================================================

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCollapsible, setShowCollapsible] =
    useState(false);

  // =====================================================
  // SINGLE SELECTED DATE
  // =====================================================

  const [selectedDate, setSelectedDate] =
    useState(getToday());

  // =====================================================
  // LIVE
  // =====================================================

  const [liveMode, setLiveMode] = useState(false);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const liveIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null,
    );

  // =====================================================
  // BUILD API DATE RANGE
  // =====================================================

  function getDateRange(date: string) {
    const current = new Date(`${date}T00:00:00`);

    const year = current.getFullYear();

    const month = String(
      current.getMonth() + 1,
    ).padStart(2, "0");

    const day = String(
      current.getDate(),
    ).padStart(2, "0");

    // Previous calendar day
    const previous = new Date(current);

    previous.setDate(
      previous.getDate() - 1,
    );

    const previousYear =
      previous.getFullYear();

    const previousMonth = String(
      previous.getMonth() + 1,
    ).padStart(2, "0");

    const previousDay = String(
      previous.getDate(),
    ).padStart(2, "0");

    return {
      from: `${previousYear}-${previousMonth}-${previousDay}T21:00:00.000Z`,
      to: `${year}-${month}-${day}T20:59:59.999Z`,
    };
  }

  // =====================================================
  // GET DATA
  // =====================================================

  const getData = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        setError("");

        if (!selectedDate) {
          throw new Error(
            "يرجى تحديد التاريخ",
          );
        }

        const range =
          getDateRange(selectedDate);

        const params =
          new URLSearchParams();

        params.append(
          "dateFrom",
          range.from,
        );

        params.append(
          "dateTo",
          range.to,
        );

        params.append(
          "limit",
          "1000000",
        );

        params.append(
          "offset",
          "0",
        );

        console.log(
          "KPI REQUEST:",
          {
            selectedDate,
            dateFrom: range.from,
            dateTo: range.to,
            liveMode,
          },
        );

        const response = await fetch(
          `/api/kpis?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              "Cache-Control":
                "no-cache",
            },
          },
        );

        if (!response.ok) {
          let message =
            "تعذر تحميل بيانات الإحصائيات";

          try {
            const data =
              await response.json();

            message =
              data?.error ||
              message;
          } catch {
            // Ignore JSON parsing error
          }

          throw new Error(message);
        }

        const data =
          await response.json();

        const result =
          Array.isArray(data?.items)
            ? data.items
            : [];

        setItems(result);

        setLastUpdated(
          new Date(),
        );
      } catch (error: any) {
        console.error(
          "KPI ERROR:",
          error,
        );

        if (!silent) {
          setItems([]);
        }

        setError(
          error?.message ||
            "حدث خطأ أثناء تحميل البيانات",
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [selectedDate, liveMode],
  );

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    getData(false);
  }, []);

  // =====================================================
  // LIVE AUTO REFRESH
  // =====================================================

  useEffect(() => {
    if (liveIntervalRef.current) {
      clearInterval(
        liveIntervalRef.current,
      );

      liveIntervalRef.current = null;
    }

    if (!liveMode) {
      return;
    }

    liveIntervalRef.current =
      setInterval(() => {
        getData(true);
      }, 5 * 60 * 1000);

    return () => {
      if (liveIntervalRef.current) {
        clearInterval(
          liveIntervalRef.current,
        );

        liveIntervalRef.current = null;
      }
    };
  }, [liveMode, getData]);

  // =====================================================
  // FINAL CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(
          liveIntervalRef.current,
        );
      }
    };
  }, []);

  // =====================================================
  // FORMAT LAST UPDATED
  // =====================================================

  function formatLastUpdated(
    date: Date | null,
  ) {
    if (!date) {
      return "لم يتم التحديث بعد";
    }

    return date.toLocaleTimeString(
      "en-JO",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      },
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Box
      dir="rtl"
      style={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100vw",
        position: "relative",
        overflowX: "hidden",
        background:
          "linear-gradient(135deg, #f8fbff 0%, #eef6ff 45%, #f4fbf8 100%)",
      }}
    >
      {/* =================================================
          BACKGROUND GLOW
      ================================================= */}

      <Box
        style={{
          position: "fixed",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "rgba(34,139,230,0.10)",
          filter: "blur(110px)",
          top: -180,
          right: -160,
          pointerEvents: "none",
        }}
      />

      <Box
        style={{
          position: "fixed",
          width: 450,
          height: 450,
          borderRadius: "50%",
          background:
            "rgba(18,184,134,0.08)",
          filter: "blur(110px)",
          bottom: -180,
          left: -150,
          pointerEvents: "none",
        }}
      />

      {/* =================================================
          MAIN CONTAINER
      ================================================= */}

      <Container
        size="xl"
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          paddingTop: 30,
          paddingBottom: 40,
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <Box
          style={{
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <Box
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Text
              component="span"
              style={{
                fontFamily:
                  "Inter, sans-serif",
                fontSize:
                  "clamp(30px, 5vw, 40px)",
                fontWeight: 600,
                letterSpacing: "-2px",
                color: "#263746",
                lineHeight: 1,
              }}
            >
              Ops
            </Text>

            <Text
              component="span"
              className={
                bungee.className
              }
              style={{
                fontSize:
                  "clamp(32px, 4.5vw, 52px)",
                lineHeight: 1,
                background:
                  "linear-gradient(110deg, #1864ab 0%, #228be6 40%, #15aabf 75%, #12b886 100%)",
                WebkitBackgroundClip:
                  "text",
                WebkitTextFillColor:
                  "transparent",
                backgroundClip:
                  "text",
                display:
                  "inline-block",
              }}
            >
              Matrix
            </Text>
          </Box>

          <Text
            mt={14}
            style={{
              fontFamily:
                "Inter, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "2.4px",
              textTransform:
                "uppercase",
              color:
                "rgba(30,50,65,0.52)",
            }}
          >
            Operations Intelligence
          </Text>
        </Box>

        {/* =================================================
            PREMIUM FILTER PANEL
        ================================================= */}

        <Paper
          radius="xl"
          p={{
            base: "md",
            sm: "lg",
          }}
          mb="lg"
          withBorder
          shadow="sm"
          style={{
            background:
              "rgba(255,255,255,0.82)",
            borderColor:
              "rgba(255,255,255,0.95)",
            backdropFilter:
              "blur(18px)",
          }}
        >
          {/* =================================================
              FILTER HEADER
          ================================================= */}

          <Group
            justify="space-between"
            align="center"
            mb="md"
          >
            <Group
              gap="sm"
              wrap="nowrap"
            >
              <ThemeIcon
                size={38}
                radius="md"
                variant="light"
                color="blue"
              >
                <IconChartBar
                  size={20}
                />
              </ThemeIcon>

              <Box>
                <Text
                  fw={850}
                  size="sm"
                  c="#1e293b"
                >
                  خيارات الإحصائيات
                </Text>

                <Text
                  size="xs"
                  c="dimmed"
                  mt={2}
                >
                  اختر التاريخ وطريقة عرض البيانات
                </Text>
              </Box>
            </Group>

            <Badge
              variant="light"
              color={
                liveMode
                  ? "teal"
                  : "gray"
              }
              radius="xl"
              leftSection={
                <IconActivity
                  size={12}
                />
              }
            >
              {liveMode
                ? "LIVE"
                : "MANUAL"}
            </Badge>
          </Group>

          <Divider
            mb="md"
            color="#edf1f5"
          />

          {/* =================================================
              CONTROLS
          ================================================= */}

          <Group
            align="flex-end"
            gap="md"
            wrap="wrap"
          >
            {/* =================================================
                DATE
            ================================================= */}

            <Box
              style={{
                flex:
                  "1 1 220px",
                minWidth: 190,
              }}
            >
              <Stack gap={6}>
                <Group
                  gap={6}
                  wrap="nowrap"
                >
                  <IconCalendar
                    size={15}
                    color="#228be6"
                  />

                  <Text
                    size="xs"
                    fw={800}
                    c="#475569"
                  >
                    تاريخ الاستعلام
                  </Text>
                </Group>

                <input
                  type="date"
                  value={
                    selectedDate
                  }
                  onChange={(e) =>
                    setSelectedDate(
                      e.target.value,
                    )
                  }
                  style={{
                    width: "100%",
                    height: 40,
                    borderRadius: 10,
                    border:
                      "1px solid #dbe4ee",
                    padding:
                      "0 12px",
                    fontSize: 13,
                    fontWeight: 600,
                    background:
                      "#ffffff",
                    color:
                      "#334155",
                    outline: "none",
                    boxSizing:
                      "border-box",
                  }}
                />
              </Stack>
            </Box>

            {/* =================================================
                SEARCH
            ================================================= */}

            <Button
              size="md"
              radius="md"
              loading={loading}
              disabled={liveMode}
              leftSection={
                <IconSearch
                  size={17}
                />
              }
              onClick={() =>
                getData(false)
              }
              style={{
                minWidth: 130,
                height: 40,
                flexShrink: 0,
                border: "none",
                fontWeight: 800,
                background:
                  liveMode
                    ? "#cbd5e1"
                    : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 55%, #1e40af 100%)",
                boxShadow:
                  liveMode
                    ? "none"
                    : "0 8px 20px rgba(37,99,235,.20)",
              }}
            >
              استعلام
            </Button>

            {/* =================================================
                VIEW MODE
            ================================================= */}

            <Box
              style={{
                flex:
                  "0 1 auto",
                minWidth: 220,
              }}
            >
              <Text
                size="xs"
                fw={800}
                c="#475569"
                mb={6}
              >
                طريقة العرض
              </Text>

              <SegmentedControl
                fullWidth
                size="sm"
                radius="md"
                value={
                  showCollapsible
                    ? "detailed"
                    : "compact"
                }
                onChange={(value) =>
                  setShowCollapsible(
                    value ===
                      "detailed",
                  )
                }
                data={[
                  {
                    value:
                      "compact",
                    label: (
                      <Group
                        gap={6}
                        justify="center"
                        wrap="nowrap"
                      >
                        <IconLayoutList
                          size={15}
                        />
                        <span>
                          مختصر
                        </span>
                      </Group>
                    ),
                  },
                  {
                    value:
                      "detailed",
                    label: (
                      <Group
                        gap={6}
                        justify="center"
                        wrap="nowrap"
                      >
                        <IconLayoutGrid
                          size={15}
                        />
                        <span>
                          تفصيلي
                        </span>
                      </Group>
                    ),
                  },
                ]}
              />
            </Box>

            {/* =================================================
                LIVE
            ================================================= */}

            <Paper
              radius="md"
              px="md"
              h={40}
              withBorder
              style={{
                display: "flex",
                alignItems:
                  "center",
                flexShrink: 0,
                background:
                  liveMode
                    ? "rgba(18,184,134,0.07)"
                    : "#f8fafc",
                borderColor:
                  liveMode
                    ? "rgba(18,184,134,0.25)"
                    : "#e5eaf0",
                transition:
                  "all 180ms ease",
              }}
            >
              <Group
                gap={9}
                wrap="nowrap"
              >
                <Box
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius:
                      "50%",
                    background:
                      liveMode
                        ? "#12b886"
                        : "#94a3b8",
                    boxShadow:
                      liveMode
                        ? "0 0 0 4px rgba(18,184,134,.10)"
                        : "none",
                  }}
                />

                <Switch
                  size="sm"
                  checked={
                    liveMode
                  }
                  onChange={(event) =>
                    setLiveMode(
                      event
                        .currentTarget
                        .checked,
                    )
                  }
                  label={
                    <Text
                      size="xs"
                      fw={900}
                      c={
                        liveMode
                          ? "#087f5b"
                          : "#475569"
                      }
                    >
                      LIVE
                    </Text>
                  }
                />
              </Group>
            </Paper>
          </Group>

          {/* =================================================
              LIVE STATUS
          ================================================= */}

          <Paper
            mt="md"
            radius="md"
            px="md"
            py="xs"
            withBorder
            style={{
              background:
                liveMode
                  ? "rgba(18,184,134,0.045)"
                  : "rgba(248,250,252,0.75)",
              borderColor:
                liveMode
                  ? "rgba(18,184,134,0.13)"
                  : "#edf1f5",
            }}
          >
            <Group
              justify="space-between"
              gap="sm"
              wrap="wrap"
            >
              <Group
                gap={8}
                wrap="nowrap"
              >
                <IconActivity
                  size={15}
                  color={
                    liveMode
                      ? "#12b886"
                      : "#94a3b8"
                  }
                />

                <Text
                  size="xs"
                  fw={800}
                  c={
                    liveMode
                      ? "#087f5b"
                      : "#64748b"
                  }
                >
                  {liveMode
                    ? "التحديث التلقائي مفعل"
                    : "التحديث التلقائي متوقف"}
                </Text>

                {liveMode && (
                  <>
                    <Badge
                      size="xs"
                      color="teal"
                      variant="light"
                      radius="xl"
                    >
                      LIVE
                    </Badge>

                    <Text
                      size="xs"
                      c="dimmed"
                    >
                      كل 5 دقائق
                    </Text>
                  </>
                )}
              </Group>

              <Group
                gap={6}
                wrap="nowrap"
              >
                <IconClock
                  size={13}
                  color="#94a3b8"
                />

                <Text
                  size="xs"
                  c="dimmed"
                >
                  آخر تحديث
                </Text>

                <Text
                  size="xs"
                  fw={800}
                  c={
                    lastUpdated
                      ? "#334155"
                      : "#94a3b8"
                  }
                >
                  {formatLastUpdated(
                    lastUpdated,
                  )}
                </Text>
              </Group>
            </Group>
          </Paper>
        </Paper>

        {/* =================================================
            ERROR CARD
        ================================================= */}

        {error && !loading && (
          <Paper
            mb="lg"
            radius="lg"
            p="md"
            withBorder
            style={{
              background:
                "rgba(255,255,255,.82)",
              borderColor:
                "#ffc9c9",
            }}
          >
            <Group
              justify="space-between"
              align="center"
              gap="md"
            >
              <Group
                gap="sm"
                wrap="nowrap"
              >
                <ThemeIcon
                  size={38}
                  radius="xl"
                  color="red"
                  variant="light"
                >
                  <IconAlertCircle
                    size={20}
                  />
                </ThemeIcon>

                <Box>
                  <Text
                    size="sm"
                    fw={800}
                    c="#c92a2a"
                  >
                    تعذر تحميل البيانات
                  </Text>

                  <Text
                    size="xs"
                    c="dimmed"
                    mt={2}
                  >
                    {error}
                  </Text>
                </Box>
              </Group>

              <Button
                variant="light"
                color="red"
                size="xs"
                radius="xl"
                leftSection={
                  <IconRefresh
                    size={14}
                  />
                }
                onClick={() =>
                  getData(false)
                }
                disabled={liveMode}
              >
                إعادة المحاولة
              </Button>
            </Group>
          </Paper>
        )}

        {/* =================================================
            DATA STATES
        ================================================= */}

        {loading ? (
          <Paper
            mih={320}
            radius="xl"
            withBorder
            shadow="sm"
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              background:
                "rgba(255,255,255,.70)",
              borderColor:
                "rgba(255,255,255,.9)",
              backdropFilter:
                "blur(18px)",
            }}
          >
            <Stack
              align="center"
              gap="sm"
            >
              <Loader
                size="md"
                color="blue"
              />

              <Text
                size="sm"
                fw={700}
                c="dimmed"
              >
                جاري تحميل الإحصائيات...
              </Text>
            </Stack>
          </Paper>
        ) : error ? (
          <Paper
            mih={300}
            radius="xl"
            withBorder
            shadow="sm"
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              background:
                "rgba(255,255,255,.65)",
              borderColor:
                "rgba(255,255,255,.9)",
            }}
          >
            <Stack
              align="center"
              gap="xs"
            >
              <IconChartBarOff
                size={42}
                stroke={1.4}
                color="#adb5bd"
              />

              <Text
                fw={800}
                c="dark"
              >
                لم يتم تحميل الإحصائيات
              </Text>

              <Text
                size="xs"
                c="dimmed"
              >
                تحقق من الاتصال ثم حاول مرة أخرى
              </Text>

              <Button
                size="xs"
                radius="xl"
                variant="light"
                leftSection={
                  <IconRefresh
                    size={14}
                  />
                }
                onClick={() =>
                  getData(false)
                }
                disabled={liveMode}
              >
                إعادة المحاولة
              </Button>
            </Stack>
          </Paper>
        ) : items.length === 0 ? (
          <Paper
            mih={300}
            radius="xl"
            withBorder
            shadow="sm"
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              background:
                "rgba(255,255,255,.68)",
              borderColor:
                "rgba(255,255,255,.9)",
            }}
          >
            <Stack
              align="center"
              gap={7}
            >
              <ThemeIcon
                size={50}
                radius="xl"
                color="gray"
                variant="light"
              >
                <IconChartBar
                  size={24}
                />
              </ThemeIcon>

              <Text
                fw={800}
                c="dark"
              >
                لا توجد مخالفات
              </Text>

              <Text
                size="xs"
                c="dimmed"
              >
                لا توجد بيانات ضمن الفترة المحددة
              </Text>

              <Badge
                size="sm"
                color="gray"
                variant="light"
              >
                0 مخالفة
              </Badge>
            </Stack>
          </Paper>
        ) : (
          <Box
            style={{
              position:
                "relative",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            {showCollapsible ? (
              <FailureStatsCollapsible
                items={
                  items as unknown as never[]
                }
              />
            ) : (
              <FailureStats
                items={
                  items as unknown as never[]
                }
              />
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}

