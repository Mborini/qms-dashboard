
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
} from "@mantine/core";

import { bungee } from "../../layout";

import FailureStatsCollapsible from "../../components/FailureStats1";
import FailureStats from "../../components/Failures/FailureStats";

import {
  IconSearch,
  IconCalendar,
  IconChartBar,
  IconChartBarOff,
  IconAlertCircle,
  IconRefresh,
  IconActivity,
  IconClock,
} from "@tabler/icons-react";

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
    ).padStart(2, "0")}-${String(date.getDate()).padStart(
      2,
      "0",
    )}`;
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
  //
  // Example:
  //
  // selectedDate:
  // 2026-09-24
  //
  // dateFrom:
  // 2026-09-23T21:00:00.000Z
  //
  // dateTo:
  // 2026-09-24T20:59:59.999Z
  // =====================================================

  function getDateRange(date: string) {
    const current = new Date(
      `${date}T00:00:00`,
    );

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
        // -------------------------------------------------
        // LOADING
        // -------------------------------------------------

        if (!silent) {
          setLoading(true);
        }

        setError("");

        // -------------------------------------------------
        // VALIDATE SELECTED DATE
        // -------------------------------------------------

        if (!selectedDate) {
          throw new Error(
            "يرجى تحديد التاريخ",
          );
        }

        // -------------------------------------------------
        // BUILD DATE RANGE
        // -------------------------------------------------

        const range =
          getDateRange(selectedDate);

        // -------------------------------------------------
        // API PARAMETERS
        // -------------------------------------------------

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

        // -------------------------------------------------
        // DEBUG
        // -------------------------------------------------

        console.log(
          "KPI REQUEST:",
          {
            selectedDate,

            dateFrom: range.from,

            dateTo: range.to,

            liveMode,
          },
        );

        // -------------------------------------------------
        // REQUEST
        // -------------------------------------------------

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

        // -------------------------------------------------
        // HTTP ERROR
        // -------------------------------------------------

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

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        const data =
          await response.json();

        const result =
          Array.isArray(data?.items)
            ? data.items
            : [];

        // -------------------------------------------------
        // SET DATA
        // -------------------------------------------------

        setItems(result);

        // -------------------------------------------------
        // LAST UPDATE
        // -------------------------------------------------

        setLastUpdated(
          new Date(),
        );
      } catch (error: any) {
        console.error(
          "KPI ERROR:",
          error,
        );

        /*
         * إذا كان LIVE:
         *
         * لا نمسح البيانات القديمة
         * عند فشل التحديث الصامت.
         */

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
  //
  // EVERY 5 MINUTES
  // =====================================================

  useEffect(() => {
    // -------------------------------------------------
    // CLEAR OLD INTERVAL
    // -------------------------------------------------

    if (liveIntervalRef.current) {
      clearInterval(
        liveIntervalRef.current,
      );

      liveIntervalRef.current =
        null;
    }

    // -------------------------------------------------
    // LIVE OFF
    // -------------------------------------------------

    if (!liveMode) {
      return;
    }

    // -------------------------------------------------
    // START LIVE INTERVAL
    // -------------------------------------------------

    liveIntervalRef.current =
      setInterval(() => {
        /*
         * silent = true
         *
         * حتى لا يظهر Loader
         * عند كل تحديث تلقائي.
         */

        getData(true);
      }, 5 * 60 * 1000);

    // -------------------------------------------------
    // CLEANUP
    // -------------------------------------------------

    return () => {
      if (liveIntervalRef.current) {
        clearInterval(
          liveIntervalRef.current,
        );

        liveIntervalRef.current =
          null;
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
      className="stats-page"
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
          BACKGROUND BLUE GLOW
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

      {/* =================================================
          BACKGROUND GREEN GLOW
      ================================================= */}

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
        className="stats-container"
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

            marginBottom: 22,
          }}
        >
          <Box
            style={{
              display: "inline-flex",

              alignItems:
                "baseline",

              justifyContent:
                "center",

              gap: 6,
            }}
          >
            <Text
              component="span"
              style={{
                fontFamily:
                  "Inter, sans-serif",

                fontSize:
                  "clamp(36px, 5vw, 30px)",

                fontWeight: 600,

                letterSpacing:
                  "-2px",

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

                backgroundClip: "text",

                display:
                  "inline-block",

                letterSpacing: "0px",
              }}
            >
              Matrix
            </Text>
          </Box>

          <Text
            mt={16}
            style={{
              fontFamily:
                "Inter, sans-serif",

              fontSize: 12,

              fontWeight: 600,

              letterSpacing:
                "2.4px",

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
            FILTER CARD
        ================================================= */}

        <Box
          className="filter-card"
          style={{
            width: "100%",

            borderRadius: 22,

            padding: "14px 18px",

            marginBottom: 22,

            background:
              "rgba(255,255,255,0.72)",

            border:
              "1px solid rgba(255,255,255,0.9)",

            backdropFilter:
              "blur(18px)",

            WebkitBackdropFilter:
              "blur(18px)",

            boxShadow:
              "0 12px 40px rgba(31,41,55,0.07)",
          }}
        >
          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="filters">
            {/* =============================================
                SINGLE DATE
            ============================================= */}

            <Box className="filter-item">
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
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  التاريخ
                </Text>
              </Group>

              <input
                className="date-input"
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  setSelectedDate(
                    e.target.value,
                  )
                }
              />
            </Box>

            {/* =============================================
                SEARCH BUTTON
            ============================================= */}

            <Button
              className="search-button"
              size="sm"
              radius="xl"
              loading={loading}
              disabled={liveMode}
              leftSection={
                <IconSearch
                  size={15}
                />
              }
              onClick={() =>
                getData(false)
              }
              style={{
                height: 36,

                padding:
                  "0 22px",

                flexShrink: 0,

                border: "none",

                color: "white",

                fontWeight: 800,

                background:
                  "linear-gradient(135deg, #2563eb 0%, #1d4ed8 55%, #1e40af 100%)",

                boxShadow:
                  liveMode
                    ? "none"
                    : "0 10px 24px rgba(37,99,235,.22)",

                transition:
                  "all 180ms ease",
              }}
            >
              استعلام
            </Button>

            {/* =============================================
                VIEW SWITCH
            ============================================= */}

            <Box className="switch-box">
              <Switch
                size="sm"
                label={
                  showCollapsible
                    ? "العرض التفصيلي"
                    : "العرض المختصر"
                }
                checked={
                  showCollapsible
                }
                onChange={(event) =>
                  setShowCollapsible(
                    event
                      .currentTarget
                      .checked,
                  )
                }
              />
            </Box>

            {/* =============================================
                LIVE SWITCH
            ============================================= */}

            <Box
              className="live-box"
              style={{
                background:
                  liveMode
                    ? "rgba(18,184,134,0.08)"
                    : "rgba(248,250,252,0.85)",

                border:
                  liveMode
                    ? "1px solid rgba(18,184,134,0.25)"
                    : "1px solid #e5eaf0",
              }}
            >
              <Box
                className={
                  liveMode
                    ? "live-dot active"
                    : "live-dot"
                }
                style={{
                  width: 8,

                  height: 8,

                  minWidth: 10,

                  borderRadius:
                    "50%",

                  background:
                    liveMode
                      ? "#12b886"
                      : "#94a3b8",

                  boxShadow:
                    liveMode
                      ? "0 0 0 4px rgba(18,184,134,0.12)"
                      : "none",
                }}
              />

              <Switch
                size="sm"
                checked={liveMode}
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
                    style={{
                      color:
                        liveMode
                          ? "#087f5b"
                          : "#475569",

                      letterSpacing:
                        "0.6px",
                    }}
                  >
                    LIVE
                  </Text>
                }
              />
            </Box>
          </div>

          {/* =================================================
              LIVE STATUS
          ================================================= */}

          <Box
            className="live-status"
            style={{
              marginTop: 12,

              padding:
                "8px 12px",

              borderRadius: 12,

              background:
                liveMode
                  ? "rgba(18,184,134,0.045)"
                  : "rgba(248,250,252,0.55)",

              border:
                liveMode
                  ? "1px solid rgba(18,184,134,0.12)"
                  : "1px solid rgba(226,232,240,0.75)",
            }}
          >
            <Group
              justify="space-between"
              wrap="wrap"
              gap={8}
            >
              <Group
                gap={8}
                wrap="nowrap"
              >
                <IconActivity
                  size={14}
                  color={
                    liveMode
                      ? "#12b886"
                      : "#94a3b8"
                  }
                />

                <Text
                  size="xs"
                  fw={800}
                  style={{
                    color:
                      liveMode
                        ? "#087f5b"
                        : "#64748b",
                  }}
                >
                  {liveMode
                    ? "التحديث التلقائي مفعل"
                    : "التحديث التلقائي متوقف"}
                </Text>

                {liveMode && (
                  <Badge
                    size="xs"
                    color="teal"
                    variant="light"
                    radius="xl"
                  >
                    LIVE
                  </Badge>
                )}

                {liveMode && (
                  <Text
                    size="xs"
                    c="dimmed"
                  >
                    كل 5 دقائق
                  </Text>
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
                  آخر تحديث:
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
          </Box>
        </Box>

        {/* =================================================
            ERROR CARD
        ================================================= */}

        {error && !loading && (
          <Box
            className="error-card"
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
              className="error-content"
              justify="space-between"
              wrap="nowrap"
              gap="md"
            >
              <Group
                gap={10}
                wrap="nowrap"
                style={{
                  minWidth: 0,
                }}
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

                    display:
                      "flex",

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

                <Box
                  style={{
                    minWidth: 0,
                  }}
                >
                  <Text
                    size="sm"
                    fw={800}
                    c="#c92a2a"
                  >
                    تعذر تحميل البيانات
                  </Text>

                  <Text
                    className="error-message"
                    size="xs"
                    c="dimmed"
                    mt={2}
                  >
                    {error}
                  </Text>
                </Box>
              </Group>

              <Button
                className="retry-button"
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
          </Box>
        )}

        {/* =================================================
            DATA STATES
        ================================================= */}

        {loading ? (
          <Box
            className="state-card"
            style={{
              minHeight: 320,

              borderRadius: 24,

              background:
                "rgba(255,255,255,0.68)",

              border:
                "1px solid rgba(255,255,255,0.9)",

              backdropFilter:
                "blur(18px)",

              display:
                "flex",

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
          <Box
            className="state-card"
            style={{
              minHeight: 300,

              borderRadius: 24,

              background:
                "rgba(255,255,255,0.62)",

              border:
                "1px solid rgba(255,255,255,0.9)",

              backdropFilter:
                "blur(18px)",

              display:
                "flex",

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
          </Box>
        ) : items.length === 0 ? (
          <Box
            className="state-card"
            style={{
              minHeight: 300,

              borderRadius: 24,

              background:
                "rgba(255,255,255,0.68)",

              border:
                "1px solid rgba(255,255,255,0.9)",

              backdropFilter:
                "blur(18px)",

              display:
                "flex",

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

                  display:
                    "flex",

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
          </Box>
        ) : (
          <Box
            className="results-wrapper"
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

      {/* =====================================================
          RESPONSIVE CSS
      ===================================================== */}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .stats-page {
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .date-input {
          height: 36px;
          width: 145px;

          border-radius: 11px;
          border: 1px solid #dbe4ee;

          padding: 0 10px;

          font-size: 12px;

          background:
            rgba(255, 255, 255, 0.9);

          color: #334155;

          outline: none;
          box-sizing: border-box;

          transition:
            all 160ms ease;
        }

        .date-input:focus {
          border-color: #74c0fc;

          box-shadow:
            0 0 0 3px
            rgba(34, 139, 230, 0.08);
        }

        .filters {
          width: 100%;

          display: flex;

          align-items: flex-end;

          justify-content: center;

          gap: 16px;

          flex-wrap: nowrap;
        }

        .filter-item {
          flex: 0 0 auto;

          min-width: 0;
        }

        .search-button:not(:disabled):hover {
          transform:
            translateY(-1px);

          box-shadow:
            0 14px 30px
            rgba(37, 99, 235, 0.28) !important;
        }

        .search-button:not(:disabled):active {
          transform:
            translateY(0);
        }

        .search-button:disabled {
          opacity: 0.52;

          cursor:
            not-allowed;

          background:
            linear-gradient(
              135deg,
              #94a3b8,
              #64748b
            ) !important;

          box-shadow:
            none !important;
        }

        .switch-box {
          height: 36px;

          padding: 0 12px;

          display: flex;

          align-items: center;

          border-radius: 12px;

          background:
            rgba(248, 250, 252, 0.85);

          border:
            1px solid #e5eaf0;

          flex-shrink: 0;
        }

        .live-box {
          height: 36px;

          padding: 0 13px;

          display: flex;

          align-items: center;

          gap: 8px;

          border-radius: 12px;

          flex-shrink: 0;

          transition:
            background 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease;
        }

        .live-box:has(input:checked) {
          box-shadow:
            0 8px 22px
            rgba(18, 184, 134, 0.08);
        }

        .live-dot {
          transition:
            background 180ms ease,
            box-shadow 180ms ease;
        }

        .live-dot.active {
          animation:
            livePulse 1.8s ease-in-out infinite;
        }

        @keyframes livePulse {
          0% {
            transform:
              scale(1);
            opacity: 1;
          }

          50% {
            transform:
              scale(1.18);
            opacity: 0.7;
          }

          100% {
            transform:
              scale(1);
            opacity: 1;
          }
        }

        .results-wrapper {
          width: 100%;

          max-width: 100%;

          min-width: 0;
        }

        @media screen and (max-width: 576px) {
          .stats-container {
            width: 100% !important;

            max-width: 100% !important;

            padding:
              16px 10px 25px !important;
          }

          .filter-card {
            width: 100% !important;

            padding: 12px !important;

            margin-bottom: 16px !important;

            border-radius:
              18px !important;

            overflow: hidden;
          }

          .filters {
            width: 100% !important;

            display:
              flex !important;

            flex-direction:
              column !important;

            align-items:
              stretch !important;

            justify-content:
              flex-start !important;

            gap: 12px !important;

            flex-wrap:
              nowrap !important;
          }

          .filter-item {
            width: 100% !important;

            min-width:
              0 !important;

            max-width:
              100% !important;

            flex: none !important;
          }

          .date-input {
            display:
              block !important;

            width:
              100% !important;

            max-width:
              100% !important;

            height:
              42px !important;

            min-height:
              42px !important;

            border-radius:
              12px !important;

            padding:
              0 12px !important;

            font-size:
              14px !important;
          }

          .search-button {
            width:
              100% !important;

            max-width:
              100% !important;

            height:
              42px !important;

            min-height:
              42px !important;

            margin:
              0 !important;

            padding:
              0 15px !important;
          }

          .switch-box,
          .live-box {
            width:
              100% !important;

            max-width:
              100% !important;

            height:
              42px !important;

            min-height:
              42px !important;

            margin:
              0 !important;

            padding:
              0 12px !important;

            display:
              flex !important;

            align-items:
              center !important;

            justify-content:
              center !important;

            border-radius:
              12px !important;
          }

          .live-status {
            margin-top:
              12px !important;

            padding:
              10px !important;
          }

          .error-card {
            padding:
              12px !important;

            border-radius:
              16px !important;
          }

          .error-content {
            flex-direction:
              column !important;

            align-items:
              stretch !important;
          }

          .retry-button {
            width:
              100% !important;

            height:
              40px !important;
          }

          .error-message {
            overflow-wrap:
              anywhere;

            word-break:
              break-word;

            line-height:
              1.7;
          }

          .state-card {
            min-height:
              250px !important;

            border-radius:
              20px !important;
          }

          .results-wrapper {
            width:
              100% !important;

            max-width:
              100% !important;

            min-width:
              0 !important;

            overflow-x:
              auto !important;

            -webkit-overflow-scrolling:
              touch;
          }
        }

        @media screen and (max-width: 380px) {
          .stats-container {
            padding-left:
              8px !important;

            padding-right:
              8px !important;
          }

          .filter-card {
            padding:
              10px !important;

            border-radius:
              16px !important;
          }

          .filters {
            gap:
              10px !important;
          }

          .date-input {
            height:
              40px !important;

            min-height:
              40px !important;

            font-size:
              13px !important;
          }

          .search-button,
          .switch-box,
          .live-box {
            height:
              40px !important;

            min-height:
              40px !important;
          }
        }
      `}</style>
    </Box>
  );
}

