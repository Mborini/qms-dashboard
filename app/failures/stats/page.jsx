"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Container,
  Loader,
  Title,
  Button,
  Group,
  Switch,
  Text,
  Center,
  Stack,
  Badge,
} from "@mantine/core";

import FailureStatsCollapsible from "../../components/FailureStats1";
import FailureStats from "../../components/Failures/FailureStats";

import {
  IconSearch,
  IconCalendar,
  IconChartBar,
  IconChartBarOff,
  IconAlertCircle,
  IconRefresh,
} from "@tabler/icons-react";

export default function StatsPage() {
  // =====================================================
  // TODAY
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

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [showCollapsible, setShowCollapsible] =
    useState(false);

  const [dateFrom, setDateFrom] =
    useState(getToday());

  const [dateTo, setDateTo] =
    useState(getToday());

  // =====================================================
  // DATE RANGE
  // =====================================================

  function getDateRange(date) {
    const current = new Date(date);

    const year = current.getFullYear();

    const month = String(
      current.getMonth() + 1,
    ).padStart(2, "0");

    const day = String(
      current.getDate(),
    ).padStart(2, "0");

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

  async function getData() {
    try {
      setLoading(true);

      setError("");

      const params =
        new URLSearchParams();

      const range =
        getDateRange(dateFrom);

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
        "1000",
      );

      params.append(
        "offset",
        "0",
      );

      console.log(
        "KPI REQUEST:",
        {
          dateFrom: range.from,
          dateTo: range.to,
        },
      );

      const response = await fetch(
        `/api/kpis?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      // =================================================
      // RESPONSE ERROR
      // =================================================

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
          // ignore
        }

        throw new Error(message);
      }

      const data =
        await response.json();

      // =================================================
      // ITEMS
      // =================================================

      const result =
        Array.isArray(data?.items)
          ? data.items
          : [];

      setItems(result);

      console.log(
        "KPI ITEMS:",
        result.length,
      );
    } catch (error) {
      console.error(
        "KPI ERROR:",
        error,
      );

      setItems([]);

      setError(
        error?.message ||
          "حدث خطأ أثناء تحميل البيانات",
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    getData();
  }, []);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Box
      dir="rtl"
      style={{
        minHeight: "100vh",

        position: "relative",

        overflow: "hidden",

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
          CONTENT
      ================================================= */}

      <Container
        size="xl"
        style={{
          position: "relative",

          zIndex: 2,

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

            marginBottom: 25,
          }}
        >
          <Text
            size="xs"
            fw={800}
            style={{
              color: "#228be6",

              letterSpacing: 2,

              marginBottom: 7,
            }}
          >
            AVTR • OPERATIONS
          </Text>

          <Title
            order={1}
            fw={900}
            style={{
              color: "#1f2937",

              fontSize:
                "clamp(24px, 4vw, 38px)",

              lineHeight: 1.2,
            }}
          >
            إحصائيات المخالفات
          </Title>

          <Text
            size="sm"
            mt={7}
            style={{
              color: "#64748b",
            }}
          >
            منصة الرصد والتحليل التشغيلي
            للمخالفات ومؤشرات الأداء
          </Text>
        </Box>

        {/* =================================================
            FILTER GLASS CARD
        ================================================= */}

       <Box
  style={{
    width: "100%",
    borderRadius: 22,
    padding: "14px 18px",
    marginBottom: 22,

    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.9)",

    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",

    boxShadow:
      "0 12px 40px rgba(31,41,55,0.07)",
  }}
>
  <Group
    justify="center"
    align="flex-end"
    gap="md"
    wrap="nowrap"
  >
    {/* =================================================
        DATE FROM
    ================================================= */}

    <Box>
      <Group
        gap={5}
        mb={4}
        wrap="nowrap"
      >
        <IconCalendar
          size={14}
          color="#228be6"
        />

        <Text
          size="xs"
          fw={800}
          c="#475569"
          style={{
            whiteSpace: "nowrap",
          }}
        >
          من تاريخ
        </Text>
      </Group>

      <input
        type="date"
        value={dateFrom}
        onChange={(e) =>
          setDateFrom(e.target.value)
        }
        style={{
          height: 36,
          borderRadius: 11,
          border: "1px solid #dbe4ee",
          padding: "0 10px",
          fontSize: 12,
          background:
            "rgba(255,255,255,0.9)",
          width: 145,
          outline: "none",
        }}
      />
    </Box>

    {/* =================================================
        DATE TO
    ================================================= */}

    <Box>
      <Group
        gap={5}
        mb={4}
        wrap="nowrap"
      >
        <IconCalendar
          size={14}
          color="#228be6"
        />

        <Text
          size="xs"
          fw={800}
          c="#475569"
          style={{
            whiteSpace: "nowrap",
          }}
        >
          إلى تاريخ
        </Text>
      </Group>

      <input
        type="date"
        value={dateTo}
        onChange={(e) =>
          setDateTo(e.target.value)
        }
        style={{
          height: 36,
          borderRadius: 11,
          border: "1px solid #dbe4ee",
          padding: "0 10px",
          fontSize: 12,
          background:
            "rgba(255,255,255,0.9)",
          width: 145,
          outline: "none",
        }}
      />
    </Box>

    {/* =================================================
        SEARCH
    ================================================= */}

    <Button
      size="sm"
      radius="xl"
      loading={loading}
      leftSection={
        <IconSearch size={15} />
      }
      onClick={getData}
      style={{
        height: 36,
        padding: "0 20px",
        flexShrink: 0,

        boxShadow:
          "0 6px 18px rgba(34,139,230,0.20)",
      }}
    >
      استعلام
    </Button>

    {/* =================================================
        VIEW SWITCH
    ================================================= */}

    <Box
      style={{
        height: 36,
        padding: "0 12px",

        display: "flex",
        alignItems: "center",

        borderRadius: 12,

        background:
          "rgba(248,250,252,0.85)",

        border:
          "1px solid #e5eaf0",

        flexShrink: 0,
      }}
    >
      <Switch
        size="sm"
        label={
          showCollapsible
            ? "العرض التفصيلي"
            : "العرض المختصر"
        }
        checked={showCollapsible}
        onChange={(event) =>
          setShowCollapsible(
            event.currentTarget.checked
          )
        }
      />
    </Box>
  </Group>
</Box>
        {/* =================================================
            ERROR CARD
        ================================================= */}

        {error && !loading && (
          <Box
            style={{
              marginBottom: 20,

              borderRadius: 18,

              padding:
                "13px 16px",

              background:
                "rgba(255,255,255,0.78)",

              border:
                "1px solid #ffc9c9",

              backdropFilter:
                "blur(14px)",

              boxShadow:
                "0 10px 30px rgba(220,38,38,0.07)",
            }}
          >
            <Group
              justify="space-between"
              wrap="nowrap"
              gap="md"
            >
              <Group
                gap={10}
                wrap="nowrap"
              >
                <Box
                  style={{
                    width: 36,

                    height: 36,

                    minWidth: 36,

                    borderRadius:
                      "50%",

                    background:
                      "#fff0f0",

                    color: "#e03131",

                    display: "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",
                  }}
                >
                  <IconAlertCircle
                    size={19}
                  />
                </Box>

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
                onClick={getData}
              >
                إعادة المحاولة
              </Button>
            </Group>
          </Box>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <Box
            style={{
              minHeight: 320,

              borderRadius: 24,

              background:
                "rgba(255,255,255,0.68)",

              border:
                "1px solid rgba(255,255,255,0.9)",

              backdropFilter:
                "blur(18px)",

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              boxShadow:
                "0 15px 45px rgba(31,41,55,0.06)",
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
          </Box>
        ) : error ? (
          /* =================================================
              ERROR EMPTY STATE
          ================================================= */

          <Box
            style={{
              minHeight: 300,

              borderRadius: 24,

              background:
                "rgba(255,255,255,0.62)",

              border:
                "1px solid rgba(255,255,255,0.9)",

              backdropFilter:
                "blur(18px)",

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              boxShadow:
                "0 15px 45px rgba(31,41,55,0.06)",
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
                تحقق من الاتصال ثم حاول
                مرة أخرى
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
                onClick={getData}
              >
                إعادة المحاولة
              </Button>
            </Stack>
          </Box>
        ) : items.length === 0 ? (
          /* =================================================
              NO DATA
          ================================================= */

          <Box
            style={{
              minHeight: 300,

              borderRadius: 24,

              background:
                "rgba(255,255,255,0.68)",

              border:
                "1px solid rgba(255,255,255,0.9)",

              backdropFilter:
                "blur(18px)",

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              boxShadow:
                "0 15px 45px rgba(31,41,55,0.06)",
            }}
          >
            <Stack
              align="center"
              gap={7}
            >
              <Box
                style={{
                  width: 50,

                  height: 50,

                  borderRadius:
                    "50%",

                  background:
                    "#f1f5f9",

                  display: "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  color: "#94a3b8",
                }}
              >
                <IconChartBar
                  size={24}
                />
              </Box>

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
                لا توجد بيانات ضمن الفترة
                المحددة
              </Text>

              <Badge
                size="sm"
                color="gray"
                variant="light"
              >
                0 مخالفة
              </Badge>
            </Stack>
          </Box>
        ) : (
          /* =================================================
              RESULTS
          ================================================= */

          <Box
            style={{
              position: "relative",
            }}
          >
          

            {/* =================================================
                STATISTICS
            ================================================= */}

            {showCollapsible ? (
              <FailureStatsCollapsible
                items={items}
              />
            ) : (
              <FailureStats
                items={items}
              />
            )}
          </Box>
        )}
      </Container>

      {/* =================================================
          MOBILE
      ================================================= */}

      <style jsx>{`
        input[type="date"]:focus {
          border-color: #74c0fc !important;
          box-shadow:
            0 0 0 3px
            rgba(34, 139, 230, 0.08);
        }

        @media (max-width: 576px) {
          input[type="date"] {
            width: 130px !important;
          }
        }
      `}</style>
    </Box>
  );
}