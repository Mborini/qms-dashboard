"use client";

import { useMemo, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

import {
  Box,
  Card,
  Group,
  Text,
  Stack,
  SimpleGrid,
  Progress,
} from "@mantine/core";

import {
  IconMapPin,
  IconChartBar,
  IconCircleCheck,
  IconClock,
  IconAlertCircle,
  IconChartPie,
} from "@tabler/icons-react";

import { statusConfig } from "./statusConfig";
import FailureListModal from "../FailureListModal";

/* =========================================================
   TYPES
========================================================= */

type FailureItem = {
  id?: string | number;
  districtName?: string | null;
  blockName?: string | null;
  kpiNameAr?: string | null;
  status?: string | null;
  userName?: string | null;
  complaintSource?: string | null;

  date?: string | Date | null;
  createdAt?: string | Date | null;
  created_at?: string | Date | null;
  violationDate?: string | Date | null;
  failureDate?: string | Date | null;
};

type GeneralSummaryProps = {
  items?: FailureItem[];
};

/* =========================================================
   DESIGN TOKENS  (Navy + Champagne Gold + لون المنطقة)
========================================================= */

const INK = "#1A2A4A";
const SURFACE = "#213459";
const SURFACE_2 = "#2A4070";
const SURFACE_3 = "#324D84";
const GOLD = "#C9A66B";
const GOLD_LIGHT = "#E6CF9D";
const TEXT = "#F3F6FC";
const MUTED = "rgba(240,244,252,.72)";
const FAINT = "rgba(240,244,252,.5)";
const LINE = "rgba(255,255,255,.12)";
const LINE_STRONG = "rgba(255,255,255,.22)";

const FONT =
  '"IBM Plex Sans Arabic", "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif';

const tabular = { fontVariantNumeric: "tabular-nums" as const };

/* =========================================================
   COLOR HELPERS (hex + أسماء ألوان Mantine)
========================================================= */

const isHex = (c: string) => c.startsWith("#");

const hexA = (hex: string, a: number) =>
  `${hex}${Math.round(a * 255)
    .toString(16)
    .padStart(2, "0")}`;

/** لون صلب */
const solid = (c: string) => (isHex(c) ? c : `var(--mantine-color-${c}-5)`);

/** لون فاتح للأيقونات والنصوص على الخلفية الداكنة */
const bright = (c: string) => (isHex(c) ? c : `var(--mantine-color-${c}-3)`);

/** لون بشفافية */
const tint = (c: string, a: number) =>
  isHex(c)
    ? hexA(c, a)
    : `color-mix(in srgb, var(--mantine-color-${c}-5) ${Math.round(
        a * 100
      )}%, transparent)`;

/** تكحيلة الزاوية */
const cornerGlow = (c: string, a = 0.3) =>
  `radial-gradient(75% 95% at 100% 0%, ${tint(c, a)} 0%, transparent 70%)`;

/* =========================================================
   DISTRICT COLORS
========================================================= */

const DISTRICT_COLORS: Record<string, string> = {
  طارق: "#F76707",
  الجبيهة: "#40C057",
  الجبيهه: "#40C057",

  "ابو نصير": "#FA5252",
  "أبو نصير": "#FA5252",
  ابونصير: "#FA5252",

  "شفا بدران": "#FCC419",

  احد: "#845EF7",
  أحد: "#845EF7",

  النصر: "#20C997",

  ماركا: "#F06595",

  "تلاع العلي": "#A1887F",
  "ام السماق": "#A1887F",
  "أم السماق": "#A1887F",
  خلدا: "#A1887F",
};

/* =========================================================
   HELPERS
========================================================= */

const getDistrictColor = (district: string) => {
  const normalized = district.replace(/^منطقة\s+/u, "").trim();

  return DISTRICT_COLORS[normalized] ?? "#74A7FF";
};

const getStatusLabel = (status: string) => {
  const config = statusConfig[status as keyof typeof statusConfig];

  return config?.label ?? (status === "Unknown" ? "غير محدد" : status);
};

const getStatusColor = (status: string): string => {
  const config = statusConfig[status as keyof typeof statusConfig];

  if (!config) return "#94A3B8";

  return (config.color as string | undefined) ?? "#94A3B8";
};

/* =========================================================
   SHARED UI
========================================================= */

const lift = {
  onMouseEnter: (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "translateY(-3px)";
    e.currentTarget.style.boxShadow = "0 18px 34px -16px rgba(10,20,45,.65)";
    e.currentTarget.style.borderColor = hexA(GOLD, 0.55);
  },
  onMouseLeave: (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "none";
    e.currentTarget.style.boxShadow = "none";
    e.currentTarget.style.borderColor = LINE;
  },
};

const SectionHeader = ({
  icon,
  title,
  hint,
  count,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  count: string;
}) => (
  <Group justify="space-between" align="center" gap="md" wrap="wrap">
    <Group gap="sm" wrap="nowrap">
      <Box
        style={{
          width: 38,
          height: 38,
          minWidth: 38,
          display: "grid",
          placeItems: "center",
          borderRadius: 12,
          color: GOLD_LIGHT,
          background: hexA(GOLD, 0.1),
          border: `1px solid ${hexA(GOLD, 0.45)}`,
        }}
      >
        {icon}
      </Box>

      <Stack gap={0}>
        <Text fw={700} c={TEXT} style={{ fontSize: 16 }}>
          {title}
        </Text>

        <Text size="xs" c={MUTED}>
          {hint}
        </Text>
      </Stack>
    </Group>

    <Box
      component="span"
      style={{
        padding: "3px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color: GOLD_LIGHT,
        border: `1px solid ${hexA(GOLD, 0.45)}`,
        background: hexA(GOLD, 0.08),
      }}
    >
      {count}
    </Box>
  </Group>
);

const panelStyle = {
  position: "relative" as const,
  overflow: "hidden",
  background: SURFACE,
  color: TEXT,
  fontFamily: FONT,
  border: `1px solid ${LINE_STRONG}`,
  boxShadow: "0 30px 60px -30px rgba(10,20,45,.55)",
};

const tileStyle = (color: string) => ({
  cursor: "pointer",
  textAlign: "right" as const,
  width: "100%",
  fontFamily: FONT,
  color: TEXT,
  background: `${cornerGlow(color, 0.3)}, ${SURFACE_2}`,
  border: `1px solid ${LINE}`,
  transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
});

/* =========================================================
   COMPONENT
========================================================= */

export default function GeneralSummary({ items = [] }: GeneralSummaryProps) {
  /* MODAL STATE */

  const [modalOpened, setModalOpened] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalItems, setModalItems] = useState<FailureItem[]>([]);
  const [modalStatus, setModalStatus] = useState<string | undefined>(undefined);

  const openFailuresModal = ({
    title,
    failures,
    status,
  }: {
    title: string;
    failures: FailureItem[];
    status?: string;
  }) => {
    setModalTitle(title);
    setModalItems(failures);
    setModalStatus(status);
    setModalOpened(true);
  };

  const closeFailuresModal = () => {
    setModalOpened(false);
  };

  /* DISTRICT DISTRIBUTION */

  const districtStats = useMemo(() => {
    const result: Record<string, FailureItem[]> = {};

    items.forEach((item) => {
      const district = item.districtName?.trim()
        ? item.districtName.trim()
        : "حسب مؤشرات الأداء";

      if (!result[district]) result[district] = [];

      result[district].push(item);
    });

    return Object.entries(result)
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([district, failures]) => ({
        district,
        count: failures.length,
        failures,
      }));
  }, [items]);

  /* STATUS DISTRIBUTION */

  const statusStats = useMemo(() => {
    const result: Record<string, FailureItem[]> = {};

    items.forEach((item) => {
      const status = item.status || "Unknown";

      if (!result[status]) result[status] = [];

      result[status].push(item);
    });

    return Object.entries(result)
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([status, failures]) => ({
        status,
        count: failures.length,
        failures,
      }));
  }, [items]);

  /* TOTAL */

  const total = items.length;

  if (total === 0) {
    return null;
  }

  /* STATUS ICON */

  const getStatusIcon = (status: string) => {
    if (status === "Resolved") return <IconCircleCheck size={18} stroke={1.6} />;

    if (status === "PendingFieldMonitorVerification" || status === "InProgress") {
      return <IconClock size={18} stroke={1.6} />;
    }

    if (status === "Rejected" || status === "ResolutionRejected") {
      return <IconAlertCircle size={18} stroke={1.6} />;
    }

    return <IconChartBar size={18} stroke={1.6} />;
  };

  return (
    <>
      <FailureListModal
        opened={modalOpened}
        onClose={closeFailuresModal}
        title={modalTitle}
        failures={modalItems}
        status={modalStatus}
      />

      <Stack gap="md" dir="rtl">
        {/* =====================================================
            DISTRICTS PANEL
        ===================================================== */}

        <Card radius={22} p={0} style={panelStyle}>
          {/* ---------- HERO ---------- */}

          <Box
            p={{ base: "md", sm: "xl" }}
            style={{
              position: "relative",
              background: `radial-gradient(55% 150% at 100% 0%, ${hexA(
                GOLD,
                0.22
              )} 0%, transparent 70%), linear-gradient(135deg, ${INK}, #20345A)`,
              borderBottom: `1px solid ${LINE}`,
            }}
          >
            <Box
              style={{
                position: "absolute",
                insetInline: 0,
                top: 0,
                height: 2,
                background: `linear-gradient(90deg, ${GOLD}, ${hexA(GOLD, 0)})`,
              }}
            />

            <Group justify="space-between" align="center" gap="lg" wrap="wrap">
              <Group gap="md" wrap="nowrap">
                <Box
                  style={{
                    width: 50,
                    height: 50,
                    minWidth: 50,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 15,
                    color: GOLD_LIGHT,
                    background: hexA(GOLD, 0.1),
                    border: `1px solid ${hexA(GOLD, 0.45)}`,
                  }}
                >
                  <IconChartPie size={25} stroke={1.5} />
                </Box>

                <Stack gap={2}>
                  <Text
                    fw={700}
                    c={TEXT}
                    style={{
                      fontSize: "clamp(18px, 3vw, 24px)",
                      lineHeight: 1.25,
                    }}
                  >
                    الملخص العام للمخالفات
                  </Text>

                  <Text size="sm" c={MUTED}>
                    توزيع إجمالي المخالفات حسب المناطق والحالات
                  </Text>
                </Stack>
              </Group>

              <Box ta="end">
                <Text
                  fw={800}
                  c={GOLD_LIGHT}
                  style={{
                    fontSize: "clamp(40px, 7vw, 60px)",
                    lineHeight: 1,
                    ...tabular,
                  }}
                >
                  {total.toLocaleString("en-US")}
                </Text>

                <Text size="xs" c={MUTED} fw={500} mt={6}>
                  إجمالي المخالفات · حسب المصدر المحدد حاليًا
                </Text>
              </Box>
            </Group>
          </Box>

          {/* ---------- DISTRICTS ---------- */}

          <Stack gap="md" p={{ base: "md", sm: "xl" }}>
            <SectionHeader
              icon={<IconMapPin size={19} stroke={1.6} />}
              title="توزيع المخالفات حسب المناطق"
              hint="اضغط على أي منطقة لعرض مخالفاتها"
              count={`${districtStats.length} مناطق`}
            />

            <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing="sm">
              {districtStats.map(({ district, count, failures }) => {
                const percentage = total ? (count / total) * 100 : 0;
                const color = getDistrictColor(district);

                return (
                  <Card
                    key={district}
                    component="button"
                    type="button"
                    onClick={() =>
                      openFailuresModal({
                        title: `مخالفات ${district}`,
                        failures,
                      })
                    }
                    p="md"
                    radius={16}
                    {...lift}
                    style={tileStyle(color)}
                  >
                    <Stack gap="sm">
                      <Group justify="space-between" align="center" gap="xs" wrap="nowrap">
                        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                          <Box
                            style={{
                              width: 9,
                              height: 9,
                              minWidth: 9,
                              borderRadius: "50%",
                              background: color,
                              boxShadow: `0 0 0 4px ${hexA(color, 0.22)}`,
                            }}
                          />

                          <Text fw={700} size="sm" c={TEXT} truncate>
                            {district}
                          </Text>
                        </Group>

                        <Text
                          fw={800}
                          c={TEXT}
                          style={{ fontSize: 20, lineHeight: 1, ...tabular }}
                        >
                          {count.toLocaleString("en-US")}
                        </Text>
                      </Group>

                      <Group justify="space-between" gap="xs">
                        <Text size="xs" c={MUTED}>
                          نسبة المنطقة
                        </Text>

                        <Text size="xs" fw={700} c={TEXT} style={tabular}>
                          {percentage.toFixed(1)}%
                        </Text>
                      </Group>

                      <Progress
                        value={percentage}
                        size={5}
                        radius="xl"
                        styles={{
                          root: { background: "rgba(255,255,255,.14)" },
                          section: { background: color },
                        }}
                      />
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          </Stack>
        </Card>

        {/* =====================================================
            STATUS PANEL
        ===================================================== */}

        <Card radius={22} p={{ base: "md", sm: "xl" }} style={panelStyle}>
          <Stack gap="xl">
            <SectionHeader
              icon={<IconChartBar size={19} stroke={1.6} />}
              title="توزيع أعداد المخالفات حسب الحالة"
              hint="اضغط على أي حالة لعرض المخالفات التابعة لها"
              count={`${statusStats.length} حالات`}
            />

            <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing="sm">
              {statusStats.map(({ status, count, failures }) => {
                const percentage = total ? (count / total) * 100 : 0;
                const color = getStatusColor(status);

                return (
                  <Card
                    key={status}
                    component="button"
                    type="button"
                    onClick={() =>
                      openFailuresModal({
                        title: `مخالفات الحالة: ${getStatusLabel(status)}`,
                        failures,
                        status: status === "Unknown" ? undefined : status,
                      })
                    }
                    p="md"
                    radius={16}
                    {...lift}
                    style={tileStyle(color)}
                  >
                    <Stack gap="sm">
                      <Group justify="space-between" align="center" gap="xs" wrap="nowrap">
                        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                          <Box
                            style={{
                              width: 34,
                              height: 34,
                              minWidth: 34,
                              display: "grid",
                              placeItems: "center",
                              borderRadius: 11,
                              color: bright(color),
                              background: "rgba(255,255,255,.07)",
                              border: `1px solid ${LINE}`,
                            }}
                          >
                            {getStatusIcon(status)}
                          </Box>

                          <Text fw={700} size="sm" c={TEXT} lineClamp={2}>
                            {getStatusLabel(status)}
                          </Text>
                        </Group>

                        <Text
                          fw={800}
                          c={TEXT}
                          style={{ fontSize: 20, lineHeight: 1, ...tabular }}
                        >
                          {count.toLocaleString("en-US")}
                        </Text>
                      </Group>

                      <Group justify="space-between" gap="xs">
                        <Text size="xs" c={MUTED}>
                          من الإجمالي
                        </Text>

                        <Text size="xs" fw={700} c={TEXT} style={tabular}>
                          {percentage.toFixed(1)}%
                        </Text>
                      </Group>

                      <Progress
                        value={percentage}
                        size={5}
                        radius="xl"
                        styles={{
                          root: { background: "rgba(255,255,255,.14)" },
                          section: { background: solid(color) },
                        }}
                      />
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>

            {/* ---------- STATUS TOTAL ---------- */}

            <Box
              p="md"
              style={{
                borderRadius: 16,
                background: SURFACE_3,
                border: `1px solid ${hexA(GOLD, 0.4)}`,
              }}
            >
              <Group justify="space-between" align="center" gap="md" wrap="wrap">
                <Group gap="sm" wrap="nowrap">
                  <Box
                    style={{
                      width: 38,
                      height: 38,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 12,
                      color: GOLD_LIGHT,
                      background: hexA(GOLD, 0.12),
                      border: `1px solid ${hexA(GOLD, 0.45)}`,
                    }}
                  >
                    <IconChartBar size={20} stroke={1.6} />
                  </Box>

                  <Stack gap={0}>
                    <Text fw={700} size="sm" c={TEXT}>
                      الإجمالي العام
                    </Text>

                    <Text size="xs" c={MUTED}>
                      مجموع جميع الحالات
                    </Text>
                  </Stack>
                </Group>

                <Text
                  fw={800}
                  c={GOLD_LIGHT}
                  style={{ fontSize: 28, lineHeight: 1, ...tabular }}
                >
                  {total.toLocaleString("en-US")}
                </Text>
              </Group>
            </Box>
          </Stack>
        </Card>
      </Stack>
    </>
  );
}
