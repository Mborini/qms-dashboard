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
} from "@tabler/icons-react";

export default function StatsPage() {
  // =====================================================
  // TODAY
  // =====================================================

  function getToday() {
    const date = new Date();

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  }

  // =====================================================
  // STATES
  // =====================================================

  const [items, setItems] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

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

    const year =
      current.getFullYear();

    const month = String(
      current.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      current.getDate()
    ).padStart(2, "0");

    const previous =
      new Date(current);

    previous.setDate(
      previous.getDate() - 1
    );

    const previousYear =
      previous.getFullYear();

    const previousMonth =
      String(
        previous.getMonth() + 1
      ).padStart(2, "0");

    const previousDay =
      String(
        previous.getDate()
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
        range.from
      );

      params.append(
        "dateTo",
        range.to
      );

      params.append(
        "limit",
        "1000"
      );

      params.append(
        "offset",
        "0"
      );

      console.log(
        "KPI REQUEST:",
        {
          dateFrom: range.from,
          dateTo: range.to,
        }
      );

      const response =
        await fetch(
          `/api/kpis?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
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
        result.length
      );
    } catch (error) {
      console.error(
        "KPI ERROR:",
        error
      );

      setItems([]);

      setError(
        error?.message ||
          "حدث خطأ أثناء تحميل البيانات"
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
        className="background-glow-blue"
        style={{
          position: "fixed",

          width: 500,

          height: 500,

          borderRadius: "50%",

          background:
            "rgba(34,139,230,0.10)",

          filter:
            "blur(110px)",

          top: -180,

          right: -160,

          pointerEvents: "none",
        }}
      />

      {/* =================================================
          BACKGROUND GREEN GLOW
      ================================================= */}

      <Box
        className="background-glow-green"
        style={{
          position: "fixed",

          width: 450,

          height: 450,

          borderRadius: "50%",

          background:
            "rgba(18,184,134,0.08)",

          filter:
            "blur(110px)",

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
      alignItems: "baseline",
      justifyContent: "center",
      gap: 6,
    }}
  >
    <Text
      component="span"
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "clamp(36px, 5vw, 56px)",
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
      className={bungee.className}
      style={{
        fontSize: "clamp(32px, 4.5vw, 52px)",
        lineHeight: 1,

        background:
          "linear-gradient(110deg, #1864ab 0%, #228be6 40%, #15aabf 75%, #12b886 100%)",

        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",

        display: "inline-block",

        letterSpacing: "0px",
      }}
    >
      Matrix
    </Text>
  </Box>

  <Text
    mt={16}
    style={{
      fontFamily: "Inter, sans-serif",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: "2.4px",
      textTransform: "uppercase",
      color: "rgba(30,50,65,0.52)",
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
          <Group
            className="filters"
            justify="center"
            align="flex-end"
            gap="md"
            wrap="nowrap"
          >
            {/* =================================================
                DATE FROM
            ================================================= */}

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
                  من تاريخ
                </Text>
              </Group>

              <input
                className="date-input"
                type="date"
                value={dateFrom}
                onChange={(e) =>
                  setDateFrom(
                    e.target.value
                  )
                }
              />
            </Box>

            {/* =================================================
                DATE TO
            ================================================= */}

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
                  إلى تاريخ
                </Text>
              </Group>

              <input
                className="date-input"
                type="date"
                value={dateTo}
                onChange={(e) =>
                  setDateTo(
                    e.target.value
                  )
                }
              />
            </Box>

            {/* =================================================
                SEARCH
            ================================================= */}

            <Button
              className="search-button"
              size="sm"
              radius="xl"
              loading={loading}
              leftSection={
                <IconSearch
                  size={15}
                />
              }
              onClick={getData}
              style={{
                height: 36,

                padding:
                  "0 20px",

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
              className="switch-box"
              style={{
                height: 36,

                padding:
                  "0 12px",

                display: "flex",

                alignItems:
                  "center",

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
                checked={
                  showCollapsible
                }
                onChange={(event) =>
                  setShowCollapsible(
                    event
                      .currentTarget
                      .checked
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

                    color:
                      "#e03131",

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

                  color:
                    "#94a3b8",
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

      {/* =====================================================
          RESPONSIVE CSS
          DESKTOP لا يتأثر
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

        /* ===================================================
           DATE INPUT
        =================================================== */

        .date-input {
          height: 36px;

          width: 145px;

          border-radius: 11px;

          border:
            1px solid #dbe4ee;

          padding:
            0 10px;

          font-size: 12px;

          background:
            rgba(255,255,255,0.9);

          color: #334155;

          outline: none;
        }

        .date-input:focus {
          border-color:
            #74c0fc;

          box-shadow:
            0 0 0 3px
            rgba(34,139,230,0.08);
        }

        /* ===================================================
           RESULTS
        =================================================== */

        .results-wrapper {
          width: 100%;

          max-width: 100%;

          min-width: 0;
        }

        /* ===================================================
           MOBILE ONLY
        =================================================== */

        @media (max-width: 576px) {
          .stats-container {
            width: 100% !important;

            max-width: 100% !important;

            padding:
              16px 10px 25px !important;
          }

          /* ===============================================
             HEADER
          =============================================== */

          .stats-header {
            margin-bottom:
              16px !important;
          }

          .stats-title {
            font-size:
              25px !important;
          }

          .stats-subtitle {
            font-size:
              11px !important;

            line-height:
              1.7;

            max-width:
              300px;

            margin-left:
              auto;

            margin-right:
              auto;
          }

          /* ===============================================
             FILTER CARD
          =============================================== */

          .filter-card {
            padding:
              12px !important;

            margin-bottom:
              16px !important;

            border-radius:
              18px !important;
          }

          /* ===============================================
             FILTERS
          =============================================== */

          .filters {
            width:
              100% !important;

            display:
              flex !important;

            flex-direction:
              column !important;

            align-items:
              stretch !important;

            justify-content:
              stretch !important;

            gap:
              10px !important;

            flex-wrap:
              nowrap !important;
          }

          /* ===============================================
             DATE
          =============================================== */

          .filter-item {
            width:
              100% !important;

            min-width:
              0 !important;

            flex:
              none !important;
          }

          .date-input {
            width:
              100% !important;

            height:
              42px !important;

            border-radius:
              12px !important;

            font-size:
              14px !important;
          }

          /* ===============================================
             SEARCH
          =============================================== */

          .search-button {
            width:
              100% !important;

            min-width:
              0 !important;

            height:
              42px !important;

            margin-top:
              2px;
          }

          /* ===============================================
             SWITCH
          =============================================== */

          .switch-box {
            width:
              100% !important;

            height:
              42px !important;

            justify-content:
              center !important;

            border-radius:
              12px !important;
          }

          /* ===============================================
             ERROR
          =============================================== */

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

          /* ===============================================
             STATES
          =============================================== */

          .state-card {
            min-height:
              250px !important;

            border-radius:
              20px !important;
          }

          /* ===============================================
             RESULTS
          =============================================== */

          .results-wrapper {
            width:
              100% !important;

            max-width:
              100% !important;

            min-width:
              0 !important;

            overflow-x:
              auto;

            -webkit-overflow-scrolling:
              touch;
          }
        }

        /* ===================================================
           VERY SMALL PHONES
        =================================================== */

        @media (max-width: 380px) {
          .stats-container {
            padding-left:
              8px !important;

            padding-right:
              8px !important;
          }

          .stats-title {
            font-size:
              22px !important;
          }

          .stats-subtitle {
            font-size:
              10px !important;
          }

          .filter-card {
            padding:
              10px !important;
          }

          .date-input {
            height:
              40px !important;

            font-size:
              13px !important;
          }
        }
      `}</style>
    </Box>
  );
}