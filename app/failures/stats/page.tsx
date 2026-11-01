"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Box,
  Container,
  Loader,
  Button,
  Group,
  Switch,
  Text,
  Stack,
  Paper,
  SegmentedControl,
} from "@mantine/core";

import {
  IconLogout,
  IconSearch,
  IconCalendar,
  IconChartBar,
  IconAlertCircle,
  IconRefresh,
  IconActivity,
  IconClock,
  IconLayoutList,
  IconLayoutGrid,
  IconPhoneCall,
  IconArrowRight,
  IconArrowBadgeLeftFilled,
  IconArrowLeft,
} from "@tabler/icons-react";

import { bungee } from "../../layout";

import FailureStatsCollapsible from "../../components/FailureStats1";
import FailureStats from "../../components/Failures/FailureStats";
import { useRouter } from "next/navigation";
/* =========================================================
   DESIGN TOKENS  (Navy + Champagne Gold)
========================================================= */

const INK = "#1A2A4A";
const SURFACE = "#213459";
const SURFACE_2 = "#2A4070";
const PAGE = "#182646";
const GOLD = "#C9A66B";
const GOLD_LIGHT = "#E6CF9D";
const LIVE = "#5EDDB8";
const DANGER = "#FF8787";
const TEXT = "#F3F6FC";
const MUTED = "rgba(240,244,252,.72)";
const FAINT = "rgba(240,244,252,.5)";
const LINE = "rgba(255,255,255,.12)";
const LINE_STRONG = "rgba(255,255,255,.22)";

const FONT =
  '"IBM Plex Sans Arabic", "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif';

const hexA = (hex: string, a: number) =>
  `${hex}${Math.round(a * 255)
    .toString(16)
    .padStart(2, "0")}`;

const panelStyle = {
  position: "relative" as const,
  overflow: "hidden",
  background: SURFACE,
  color: TEXT,
  fontFamily: FONT,
  border: `1px solid ${LINE_STRONG}`,
  boxShadow: "0 30px 60px -30px rgba(10,20,45,.55)",
};

const iconBoxStyle = {
  display: "grid",
  placeItems: "center",
  color: GOLD_LIGHT,
  background: hexA(GOLD, 0.1),
  border: `1px solid ${hexA(GOLD, 0.45)}`,
};

const pill = (color: string) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "3px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  color,
  background: hexA(color, 0.1),
  border: `1px solid ${hexA(color, 0.5)}`,
});

// =====================================================
// PAGE
// =====================================================

export default function StatsPage() {
  // =====================================================
  // GET TODAY
  // =====================================================

  function getToday() {
    const date = new Date();

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;
  }

  // =====================================================
  // STATES
  // =====================================================

  const { data: session } = useSession();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCollapsible, setShowCollapsible] = useState(false);

  // =====================================================
  // SINGLE SELECTED DATE
  // =====================================================
const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(getToday());

  // =====================================================
  // LIVE
  // =====================================================

  const [liveMode, setLiveMode] = useState(false);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);




  // =====================================================
  // BUILD API DATE RANGE
  // =====================================================

  function getDateRange(date: string) {
    const current = new Date(`${date}T00:00:00`);

    const year = current.getFullYear();

    const month = String(current.getMonth() + 1).padStart(2, "0");

    const day = String(current.getDate()).padStart(2, "0");

    // Previous calendar day
    const previous = new Date(current);

    previous.setDate(previous.getDate() - 1);

    const previousYear = previous.getFullYear();

    const previousMonth = String(previous.getMonth() + 1).padStart(2, "0");

    const previousDay = String(previous.getDate()).padStart(2, "0");

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
          throw new Error("يرجى تحديد التاريخ");
        }

        const range = getDateRange(selectedDate);

        const params = new URLSearchParams();

        params.append("dateFrom", range.from);

        params.append("dateTo", range.to);

        params.append("limit", "1000000");

        params.append("offset", "0");

        console.log("KPI REQUEST:", {
          selectedDate,
          dateFrom: range.from,
          dateTo: range.to,
          liveMode,
        });

        const response = await fetch(`/api/kpis?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          let message = "تعذر تحميل بيانات الإحصائيات";

          try {
            const data = await response.json();

            message = data?.error || message;
          } catch {
            // Ignore JSON parsing error
          }

          throw new Error(message);
        }

        const data = await response.json();

        const result = Array.isArray(data?.items) ? data.items : [];

        setItems(result);

        setLastUpdated(new Date());
      } catch (error: any) {
        console.error("KPI ERROR:", error);

        if (!silent) {
          setItems([]);
        }

        setError(error?.message || "حدث خطأ أثناء تحميل البيانات");
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
      clearInterval(liveIntervalRef.current);

      liveIntervalRef.current = null;
    }

    if (!liveMode) {
      return;
    }

    liveIntervalRef.current = setInterval(() => {
      getData(true);
    }, 5 * 60 * 1000);

    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);

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
        clearInterval(liveIntervalRef.current);
      }
    };
  }, []);

  // =====================================================
  // FORMAT LAST UPDATED
  // =====================================================

  function formatLastUpdated(date: Date | null) {
    if (!date) {
      return "لم يتم التحديث بعد";
    }

    return date.toLocaleTimeString("en-JO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
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
        fontFamily: FONT,
        background: PAGE,
      }}
    >
      {/* BACKGROUND GLOW */}

      <Box
        style={{
          position: "fixed",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: hexA(GOLD, 0.16),
          filter: "blur(120px)",
          top: -200,
          right: -160,
          pointerEvents: "none",
        }}
      />

      <Box
        style={{
          position: "fixed",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "rgba(74,120,220,.22)",
          filter: "blur(120px)",
          bottom: -200,
          left: -160,
          pointerEvents: "none",
        }}
      />

      {/* =================================================
          GLASS NAVBAR
      ================================================= */}

      <Box className="glass-nav-wrap">
        <Box className="glass-nav">
          {/* USER */}
          <Group gap={10} wrap="nowrap">
            <Box
              style={{
                width: 38,
                height: 38,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                color: INK,
                fontWeight: 800,
                fontSize: 15,
                background: `linear-gradient(145deg, ${GOLD_LIGHT}, ${GOLD})`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.6)",
              }}
            >
              {(session?.user?.name || "?").trim().charAt(0)}
            </Box>

            {session?.user?.name && (
              <Box style={{ minWidth: 0 }}>
                <Text size="sm" fw={700} c={TEXT} truncate>
                  {session.user.name}
                </Text>

                <Text size="10px" c={MUTED} fw={500} truncate>
                  {session.user.role}
                </Text>
              </Box>
            )}
          </Group>

          {/* BRAND */}
          <Box
            dir="ltr"
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 5,
              justifySelf: "center",
            }}
          >
           

            <Text
              component="span"
              className={bungee.className}
              style={{
                fontSize: 24,
                lineHeight: 1,
                                background:                   "linear-gradient(110deg, #1864ab 0%, #228be6 40%, #15aabf 75%, #12b886 100%)",

                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Matrix
            </Text>
             <Text
              component="span"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "-1px",
                color: TEXT,
                lineHeight: 1,
              }}
            >
              Ops
            </Text>
          </Box>

          {/* LOGOUT */}
          <Box style={{ justifySelf: "end" }}>
         {/* BACK */}
<Box style={{ justifySelf: "end" }}>
  <button
    type="button"
    className="glass-logout"
    onClick={() => router.back()}
    aria-label="رجوع"
  >
    <span className="glass-logout-label">رجوع</span>
    <IconArrowLeft size={16} />
  </button>
</Box>
          </Box>
        </Box>
      </Box>

      {/* MAIN CONTAINER */}

      <Container
        size="xl"
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          paddingTop: 100,
          paddingBottom: 40,
        }}
      >
        {/* =================================================
            FILTER PANEL
        ================================================= */}

       <Paper
  radius={26}
  p={{ base: "md", sm: "lg" }}
  mb="lg"
  style={{
    position: "relative",
    overflow: "hidden",
    color: TEXT,
    fontFamily: FONT,
    background:
      "linear-gradient(145deg, rgba(255,255,255,.08), rgba(255,255,255,.03))",
    WebkitBackdropFilter: "blur(14px)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,.14)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,.18), 0 20px 40px -24px rgba(10,20,45,.6)",
  }}
>
  {/* HEADER */}

  <Group justify="space-between" align="center" mb="lg">
    <Group gap="sm" wrap="nowrap">
      <Box
        style={{
          ...iconBoxStyle,
          width: 42,
          height: 42,
          borderRadius: 14,
        }}
      >
        <IconChartBar size={20} stroke={1.6} />
      </Box>

      <Box>
        <Text fw={700} c={TEXT} style={{ fontSize: 16 }}>
          خيارات الإحصائيات
        </Text>

        <Text size="xs" c={MUTED} mt={2}>
          اختر التاريخ ثم اضغط استعلام
        </Text>
      </Box>
    </Group>

    <Box component="span" style={pill(liveMode ? LIVE : GOLD_LIGHT)}>
      <IconActivity size={12} />
      {liveMode ? "LIVE" : "MANUAL"}
    </Box>
  </Group>

  {/* CONTROLS */}

  <Group align="center" gap="sm" wrap="wrap">
    {/* DATE */}

    <Box
      style={{
        flex: "1 1 220px",
        minWidth: 190,
        height: 44,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 16px",
        borderRadius: 999,
        background: "rgba(255,255,255,.06)",
        border: `1px solid ${LINE}`,
      }}
    >
      <IconCalendar size={17} color={GOLD_LIGHT} stroke={1.6} />

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        aria-label="تاريخ الاستعلام"
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          border: "none",
          outline: "none",
          background: "transparent",
          color: TEXT,
          colorScheme: "dark",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: FONT,
        }}
      />
    </Box>

    {/* SEARCH */}

    <Button
      radius="xl"
      variant="default"
      loading={loading}
      disabled={liveMode}
      leftSection={<IconSearch size={17} stroke={1.8} />}
      onClick={() => getData(false)}
      style={{
        minWidth: 140,
        height: 44,
        flexShrink: 0,
        border: "none",
        fontWeight: 700,
        fontFamily: FONT,
        color: liveMode ? FAINT : INK,
        background: liveMode
          ? "rgba(255,255,255,.08)"
          : `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
        boxShadow: liveMode
          ? "none"
          : `0 10px 22px -12px ${hexA(GOLD, 0.8)}`,
      }}
    >
      استعلام
    </Button>

    {/* LIVE */}

    <Box
      style={{
        height: 44,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "0 16px",
        borderRadius: 999,
        background: liveMode ? hexA(LIVE, 0.1) : "rgba(255,255,255,.06)",
        border: `1px solid ${liveMode ? hexA(LIVE, 0.45) : LINE}`,
        transition: "all 180ms ease",
      }}
    >
      <Box
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: liveMode ? LIVE : FAINT,
          boxShadow: liveMode ? `0 0 0 4px ${hexA(LIVE, 0.2)}` : "none",
        }}
      />

      <Switch
        size="sm"
        color="teal"
        checked={liveMode}
        onChange={(event) => setLiveMode(event.currentTarget.checked)}
        label={
          <Text size="xs" fw={800} c={liveMode ? LIVE : MUTED}>
            LIVE
          </Text>
        }
      />
    </Box>
  </Group>

  {/* STATUS */}

  <Group
    justify="space-between"
    gap="sm"
    wrap="wrap"
    mt="lg"
    pt="md"
    style={{ borderTop: `1px solid ${LINE}` }}
  >
    <Group gap={8} wrap="nowrap">
      <IconActivity size={15} color={liveMode ? LIVE : FAINT} />

      <Text size="xs" fw={600} c={liveMode ? LIVE : MUTED}>
        {liveMode
          ? "التحديث التلقائي مفعل · كل 5 دقائق"
          : "التحديث التلقائي متوقف"}
      </Text>
    </Group>

    <Group gap={6} wrap="nowrap">
      <IconClock size={13} color={FAINT} />

      <Text size="xs" c={MUTED}>
        آخر تحديث
      </Text>

      <Text
        size="xs"
        fw={700}
        c={lastUpdated ? TEXT : FAINT}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {formatLastUpdated(lastUpdated)}
      </Text>
    </Group>
  </Group>
</Paper>

        {/* =================================================
            DATA STATES
        ================================================= */}

        {loading ? (
          <Paper
            mih={320}
            radius={22}
            style={{
              ...panelStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Stack align="center" gap="sm">
              <Loader size="md" color={GOLD} />

              <Text size="sm" fw={600} c={MUTED}>
                جاري تحميل الإحصائيات...
              </Text>
            </Stack>
          </Paper>
        ) : error ? (
          <Paper
            mih={320}
            radius={22}
            p="xl"
            style={{
              ...panelStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Stack align="center" gap="md" maw={420} w="100%">
              <Box
                style={{
                  ...iconBoxStyle,
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  boxShadow: `0 0 0 8px ${hexA(GOLD, 0.08)}`,
                }}
              >
                <IconPhoneCall size={38} stroke={1.5} />
              </Box>

              <Text fw={700} c={TEXT} style={{ fontSize: 18 }}>
                لم يتم تحميل الإحصائيات
              </Text>

              <Box
                w="100%"
                style={{
                  padding: "14px 16px",
                  borderRadius: 16,
                  background: hexA(DANGER, 0.08),
                  border: `1px solid ${hexA(DANGER, 0.45)}`,
                  textAlign: "center",
                }}
              >
                <Group justify="center" gap={6} mb={6}>
                  <IconAlertCircle size={16} color={DANGER} />

                  <Text size="xs" fw={700} c={DANGER}>
                    إجراء مطلوب
                  </Text>
                </Group>

                <Text fw={700} size="sm" c={TEXT} lh={1.7}>
                  اطلب الدعم من وحدة التحكم والسيطرة فورًا
                </Text>

                <Box component="span" mt={8} style={{ ...pill(DANGER), marginTop: 8 }}>
                  Command & Control
                </Box>
              </Box>

              <Button
                size="sm"
                radius="xl"
                variant="default"
                leftSection={<IconRefresh size={15} stroke={1.6} />}
                onClick={() => getData(false)}
                disabled={liveMode}
                style={{
                  background: "transparent",
                  border: `1px solid ${LINE_STRONG}`,
                  color: TEXT,
                  fontWeight: 600,
                  fontFamily: FONT,
                }}
              >
                إعادة المحاولة
              </Button>
            </Stack>
          </Paper>
        ) : items.length === 0 ? (
          <Paper
            mih={300}
            radius={22}
            style={{
              ...panelStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Stack align="center" gap={8}>
              <Box style={{ ...iconBoxStyle, width: 54, height: 54, borderRadius: 16 }}>
                <IconChartBar size={26} stroke={1.5} />
              </Box>

              <Text fw={700} c={TEXT} style={{ fontSize: 17 }}>
                لا توجد مخالفات
              </Text>

              <Text size="xs" c={MUTED}>
                لا توجد بيانات ضمن الفترة المحددة
              </Text>

              <Box component="span" style={pill(GOLD_LIGHT)}>
                0 مخالفة
              </Box>
            </Stack>
          </Paper>
        ) : (
          <Box
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            {showCollapsible ? (
              <FailureStatsCollapsible items={items as unknown as never[]} />
            ) : (
              <FailureStats items={items as unknown as never[]} />
            )}
          </Box>
        )}
      </Container>

      {/* =====================================================
          CSS
      ===================================================== */}

      <style>{`
        /* ================================================
           LIQUID GLASS NAVBAR
        ================================================ */

        .glass-nav-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 14px 16px 0;
}

        .glass-nav {
          position: relative;
          max-width: 1300px;
          margin: 0 auto;
          padding: 9px 14px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 12px;
          border-radius: 999px;
          overflow: hidden;

          background: rgba(255,255,255,.04);
          -webkit-backdrop-filter: blur(14px) saturate(160%);
          backdrop-filter: blur(14px) saturate(160%);
          border: 1px solid rgba(255,255,255,.16);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.30),
            inset 0 -1px 0 rgba(255,255,255,.05),
            0 10px 28px -14px rgba(10,20,45,.5);
        }

        .glass-nav::before {
          content: "";
          position: absolute;
          inset: 0 0 55% 0;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0));
          pointer-events: none;
        }

        .glass-nav > * { position: relative; }

        .glass-logout {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 999px;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: ${TEXT};
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.18);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.35);
          transition: background .18s ease, border-color .18s ease;
        }

        .glass-logout:hover:not(:disabled) {
          background: rgba(255,255,255,.14);
          border-color: ${hexA(GOLD, 0.6)};
        }

        .glass-logout:disabled {
          opacity: .6;
          cursor: default;
        }

        .glass-logout:focus-visible {
          outline: 2px solid ${GOLD_LIGHT};
          outline-offset: 2px;
        }

        @media (max-width: 576px) {
          .glass-logout-label { display: none; }
          .glass-logout { padding: 9px; }
          .glass-nav { padding: 8px 10px; }
        }
      `}</style>
    </Box>
  );
}
