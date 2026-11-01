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
  Button,
  Modal,
  TextInput,
  Progress,
} from "@mantine/core";

import {
  IconFileSpreadsheet,
  IconFilter,
  IconPhone,
  IconWorld,
  IconUsers,
  IconChartBar,
  IconRefresh,
  IconCalendarStats,
  IconSum,
  IconCircleCheck,
} from "@tabler/icons-react";

import * as XLSX from "xlsx-js-style";

import DistrictCard from "./DistrictCard";

import { statusConfig, summaryOnlyStatuses } from "./statusConfig";

import GeneralSummary from "./GeneralSummary";
import { useSession } from "next-auth/react";

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

type FailureStatsProps = {
  items?: FailureItem[];
};

type StatusData = {
  total: number;
  users: Record<
    string,
    {
      count: number;
      ids: Array<string | number>;
    }
  >;
  ids: Array<string | number>;
};

type BlockData = {
  total: number;
  statuses: Record<string, StatusData>;
};

type DistrictData = {
  total: number;
  blocks: Record<string, BlockData>;
};

type Stats = Record<string, DistrictData>;

type SourceStats = {
  total: number;
  resolved: number;
};

type SourceDistrictData = {
  callCenter: SourceStats;
  citizenPortal: SourceStats;
  avtrTeam: SourceStats;
  total: number;
  resolved: number;
};

/* =========================================================
   DESIGN TOKENS  (Navy + Champagne Gold)
========================================================= */

const INK = "#1A2A4A";
const SURFACE = "#213459";
const SURFACE_2 = "#2A4070";
const SURFACE_3 = "#324D84";
const PAGE = "#182646";
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

const isHex = (c: string) => c.startsWith("#");

const hexA = (hex: string, a: number) =>
  `${hex}${Math.round(a * 255)
    .toString(16)
    .padStart(2, "0")}`;

/** لون بشفافية (يدعم hex وأسماء ألوان Mantine) */
const tint = (c: string, a: number) =>
  isHex(c)
    ? hexA(c, a)
    : `color-mix(in srgb, var(--mantine-color-${c}-5) ${Math.round(
        a * 100
      )}%, transparent)`;

const bright = (c: string) => (isHex(c) ? c : `var(--mantine-color-${c}-3)`);

/** توحيد اسم المنطقة للمقارنة (يتجاهل "منطقة" والهمزات والفراغات) */
const normalizeAr = (s: string) =>
  s
    .replace(/^\s*منطقة\s+/, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, "")
    .toLowerCase();

/** تكحيلة الزاوية */
const cornerGlow = (c: string, a = 0.3) =>
  `radial-gradient(75% 95% at 100% 0%, ${tint(c, a)} 0%, transparent 70%)`;

const panelStyle = {
  position: "relative" as const,
  overflow: "hidden",
  background: SURFACE,
  color: TEXT,
  fontFamily: FONT,
  border: `1px solid ${LINE_STRONG}`,
  boxShadow: "0 30px 60px -30px rgba(10,20,45,.55)",
};

const ghostBtn = {
  background: "transparent",
  border: `1px solid ${LINE_STRONG}`,
  color: TEXT,
  fontWeight: 600,
  fontFamily: FONT,
};

const goldOutlineBtn = {
  background: hexA(GOLD, 0.1),
  border: `1px solid ${hexA(GOLD, 0.6)}`,
  color: GOLD_LIGHT,
  fontWeight: 600,
  fontFamily: FONT,
};

const goldSolidBtn = {
  background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
  border: "none",
  color: INK,
  fontWeight: 700,
  fontFamily: FONT,
};

const modalStyles = {
  content: {
    background: SURFACE,
    border: `1px solid ${LINE_STRONG}`,
    boxShadow: "0 40px 80px -30px rgba(10,20,45,.7)",
    fontFamily: FONT,
  },
  header: { background: SURFACE, borderBottom: `1px solid ${LINE}` },
  title: { fontWeight: 700, fontSize: 18, color: TEXT },
  close: { color: MUTED },
};

const dateInputStyles = {
  label: { color: MUTED, fontWeight: 600, marginBottom: 6 },
  input: {
    background: SURFACE_2,
    border: `1px solid ${LINE_STRONG}`,
    color: TEXT,
    colorScheme: "dark" as const,
    borderRadius: 12,
  },
};

const liftHandlers = {
  onMouseEnter: (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.borderColor = hexA(GOLD, 0.55);
  },
  onMouseLeave: (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "none";
    e.currentTarget.style.borderColor = LINE;
  },
};

/* =========================================================
   STATUS HELPERS
========================================================= */

type StatusKey = keyof typeof statusConfig;

const getStatusConfig = (status?: string | null) => {
  if (!status) return null;

  return status in statusConfig ? statusConfig[status as StatusKey] : null;
};

/* =========================================================
   SOURCE CONFIG
========================================================= */

const SOURCE_OPTIONS = [
  {
    key: "all",
    label: "الكل",
    description: "جميع مصادر المخالفات",
    icon: <IconChartBar size={20} stroke={1.6} />,
    color: "blue",
  },
  {
    key: "call-center",
    label: "Call Center",
    description: "مخالفات مركز الاتصال",
    icon: <IconPhone size={20} stroke={1.6} />,
    color: "cyan",
  },
  {
    key: "citizen-portal",
    label: "بوابة المواطن",
    description: "المخالفات الواردة من البوابة",
    icon: <IconWorld size={20} stroke={1.6} />,
    color: "green",
  },
  {
    key: "avtr-team",
    label: "AVTR Team",
    description: "المخالفات التابعة لفريق AVTR",
    icon: <IconUsers size={20} stroke={1.6} />,
    color: "violet",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function FailureStats({ items = [] }: FailureStatsProps) {
  const [complaintSourceFilter, setComplaintSourceFilter] = useState("all");
  const [cumulativeModalOpened, setCumulativeModalOpened] = useState(false);
  const [cumulativeFromDate, setCumulativeFromDate] = useState("");
  const [cumulativeToDate, setCumulativeToDate] = useState("");
  const [cumulativeExporting, setCumulativeExporting] = useState(false);

  const { data: session } = useSession();
  const isAdmin = session?.user?.roleId === 1;
   const userDistricts = (session?.user as any)?.districtNames as string[] | undefined;
  /* SCOPE: المناطق المسندة للمستخدم (الأدمن يشوف الكل) */

  const scopedItems = useMemo(() => {
    if (isAdmin) return items;

    const allowed = new Set((userDistricts ?? []).map(normalizeAr));

    return items.filter(
      (item) =>
        !!item.districtName?.trim() &&
        allowed.has(normalizeAr(item.districtName))
    );
  }, [items, isAdmin, userDistricts]);

  /* FILTER */

  const filteredItems = useMemo(() => {
    if (complaintSourceFilter === "all") {
      return scopedItems;
    }

    return scopedItems.filter((item) => {
      if (complaintSourceFilter === "avtr-team") {
        return item.complaintSource == null;
      }

      return item.complaintSource === complaintSourceFilter;
    });
  }, [scopedItems, complaintSourceFilter]);

  /* SOURCE COUNTS */

  const sourceCounts = useMemo(() => {
    let callCenter = 0;
    let citizenPortal = 0;
    let avtrTeam = 0;

    scopedItems.forEach((item) => {
      if (item.complaintSource === "call-center") {
        callCenter++;
      } else if (item.complaintSource === "citizen-portal") {
        citizenPortal++;
      } else if (item.complaintSource == null) {
        avtrTeam++;
      }
    });

    return {
      all: scopedItems.length,
      "call-center": callCenter,
      "citizen-portal": citizenPortal,
      "avtr-team": avtrTeam,
    };
  }, [scopedItems]);

  /* STATS */

  const stats = useMemo<Stats>(() => {
    const result: Stats = {};

    filteredItems.forEach((item) => {
      const district = item.districtName?.trim()
        ? `منطقة ${item.districtName.trim()}`
        : "مخالفات حسب مؤشرات الأداء";

      const block = item.blockName?.trim()
        ? item.blockName.trim()
        : `KPI: ${item.kpiNameAr || "غير محدد"}`;

      const status = item.status || "Unknown";

      let lastUser: string | null = null;

      if (!summaryOnlyStatuses.includes(status)) {
        lastUser = item.userName || "غير معروف";
      }

      if (!result[district]) {
        result[district] = {
          total: 0,
          blocks: {},
        };
      }

      result[district].total++;

      if (!result[district].blocks[block]) {
        result[district].blocks[block] = {
          total: 0,
          statuses: {},
        };
      }

      const blockData = result[district].blocks[block];

      blockData.total++;

      if (!blockData.statuses[status]) {
        blockData.statuses[status] = {
          total: 0,
          users: {},
          ids: [],
        };
      }

      const statusData = blockData.statuses[status];

      statusData.total++;

      if (item.id !== undefined) {
        statusData.ids.push(item.id);
      }

      if (lastUser) {
        if (!statusData.users[lastUser]) {
          statusData.users[lastUser] = {
            count: 0,
            ids: [],
          };
        }

        statusData.users[lastUser].count++;

        if (
          item.id !== undefined &&
          !statusData.users[lastUser].ids.includes(item.id)
        ) {
          statusData.users[lastUser].ids.push(item.id);
        }
      }
    });

    return result;
  }, [filteredItems]);

  /* TOTAL STATUSES */

  const totalStatuses = useMemo<Record<string, number>>(() => {
    const result: Record<string, number> = {};

    Object.keys(statusConfig).forEach((status) => {
      result[status] = 0;
    });

    filteredItems.forEach((item) => {
      const status = item.status || "Unknown";

      result[status] = (result[status] || 0) + 1;
    });

    return result;
  }, [filteredItems]);

  /* KPIs */

  const kpis = useMemo(() => {
    const total = filteredItems.length;

    const field = totalStatuses.PendingFieldMonitorVerification || 0;
    const resolved = totalStatuses.Resolved || 0;
    const supervisorReview = totalStatuses.PendingSupervisorReview || 0;
    const rejected = totalStatuses.Rejected || 0;

    // المنجز = تم الحل + قيد التحقق الميداني + مرفوض + قيد مراجعة AVTR
    const completedCount = resolved + field + rejected + supervisorReview;

    // نسبة الإنجاز = المنجز ÷ الكلي
    const achievementPercentage = total
      ? ((completedCount / total) * 100).toFixed(1)
      : "0.0";

    return {
      total,
      field,
      resolved,
      supervisorReview,
      rejected,
      completedCount,
      achievementPercentage,
    };
  }, [filteredItems, totalStatuses]);

  const achievement = kpis.achievementPercentage;

  /* ACTIVE SOURCE */

  const activeSource =
    SOURCE_OPTIONS.find((source) => source.key === complaintSourceFilter) ??
    SOURCE_OPTIONS[0];

  /* FOCUS DISTRICT */

  const focusDistrict = (district: string) => {
    const element = document.getElementById(
      `district-${encodeURIComponent(district)}`
    );

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  /* =========================================================
     EXPORT 1
     DETAILED REPORT
  ========================================================= */

  const exportExcel = () => {
    const STATUS = {
      PENDING_ACCEPTANCE: "PendingSpValidation",
      IN_PROGRESS: "InProgress",
      FIELD_VERIFICATION: "PendingFieldMonitorVerification",
      RESOLVED: "Resolved",
      AVTR_REVIEW: "PendingSupervisorReview",
      AVTR_ACCEPTED_REJECTION: "ResolutionRejected",
      AVTR_REJECTED_SOLUTION: "Rejected",
    };

    const createEmptyStats = () => ({
      total: 0,
      pendingAcceptance: 0,
      inProgress: 0,
      fieldVerification: 0,
      resolved: 0,
      avtrReview: 0,
      avtrAcceptedRejection: 0,
      avtrRejectedSolution: 0,
    });

    const addStatus = (
      target: ReturnType<typeof createEmptyStats>,
      status: string
    ) => {
      target.total++;

      switch (status) {
        case STATUS.PENDING_ACCEPTANCE:
          target.pendingAcceptance++;
          break;

        case STATUS.IN_PROGRESS:
          target.inProgress++;
          break;

        case STATUS.FIELD_VERIFICATION:
          target.fieldVerification++;
          break;

        case STATUS.RESOLVED:
          target.resolved++;
          break;

        case STATUS.AVTR_REVIEW:
          target.avtrReview++;
          break;

        case STATUS.AVTR_ACCEPTED_REJECTION:
          target.avtrAcceptedRejection++;
          break;

        case STATUS.AVTR_REJECTED_SOLUTION:
          target.avtrRejectedSolution++;
          break;

        default:
          break;
      }
    };

    // تصحيح: النسبة = (مجموع حالات الإنجاز ÷ الإجمالي) × 100
    const getAchievement = (data: ReturnType<typeof createEmptyStats>) => {
      if (!data.total) {
        return "0.0";
      }

      return (
        ((data.avtrAcceptedRejection +
          data.fieldVerification +
          data.resolved +
          data.avtrReview) /
          data.total) *
        100
      ).toFixed(1);
    };

    const getReportDate = () => {
      const firstItem = filteredItems.find(
        (item) =>
          item.date ||
          item.createdAt ||
          item.created_at ||
          item.violationDate ||
          item.failureDate
      );

      if (!firstItem) {
        return null;
      }

      const rawDate =
        firstItem.date ||
        firstItem.createdAt ||
        firstItem.created_at ||
        firstItem.violationDate ||
        firstItem.failureDate;

      if (!rawDate) {
        return null;
      }

      const date = new Date(rawDate);

      if (Number.isNaN(date.getTime())) {
        return null;
      }

      return date;
    };

    const reportDate = getReportDate();

    const getArabicDayName = (date: Date | null) => {
      if (!date) {
        return "غير محدد";
      }

      const days = [
        "الأحد",
        "الاثنين",
        "الثلاثاء",
        "الأربعاء",
        "الخميس",
        "الجمعة",
        "السبت",
      ];

      return days[date.getDay()];
    };

    const formatArabicDate = (date: Date | null) => {
      if (!date) {
        return "غير محدد";
      }

      return date.toLocaleDateString("ar-JO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const hierarchy: Record<
      string,
      {
        stats: ReturnType<typeof createEmptyStats>;

        blocks: Record<
          string,
          {
            stats: ReturnType<typeof createEmptyStats>;

            users: Record<string, ReturnType<typeof createEmptyStats>>;
          }
        >;
      }
    > = {};

    filteredItems.forEach((item) => {
      const district = item.districtName?.trim()
        ? `منطقة ${item.districtName.trim()}`
        : "مخالفات حسب مؤشرات الأداء";

      const block = item.blockName?.trim()
        ? item.blockName.trim()
        : `KPI: ${item.kpiNameAr || "غير محدد"}`;

      const user = item.userName?.trim() || "غير معروف";

      const status = item.status || "Unknown";

      if (!hierarchy[district]) {
        hierarchy[district] = {
          stats: createEmptyStats(),
          blocks: {},
        };
      }

      const districtData = hierarchy[district];

      addStatus(districtData.stats, status);

      if (!districtData.blocks[block]) {
        districtData.blocks[block] = {
          stats: createEmptyStats(),
          users: {},
        };
      }

      const blockData = districtData.blocks[block];

      addStatus(blockData.stats, status);

      const normalizedUser = user.trim().toUpperCase();

      if (normalizedUser.includes("C&C")) {
        return;
      }

      if (summaryOnlyStatuses.includes(status)) {
        return;
      }

      if (!blockData.users[user]) {
        blockData.users[user] = createEmptyStats();
      }

      addStatus(blockData.users[user], status);
    });

    const sortedDistricts = Object.entries(hierarchy).sort(
      ([, a], [, b]) => b.stats.total - a.stats.total
    );

    const worksheet = XLSX.utils.aoa_to_sheet([]);

    const COLORS = {
      primary: "1F4E78",
      primaryDark: "17365D",
      district: "D9EAF7",
      block: "EAF2F8",
      user: "FFFFFF",
      total: "E2F0D9",
      achievement: "D9EAD3",
      white: "FFFFFF",
      text: "1F2937",
      border: "B7C9D6",
    };

    const side = { style: "thin", color: { rgb: COLORS.border } };

    const border = {
      top: side,
      bottom: side,
      left: side,
      right: side,
    };

    const center = {
      horizontal: "center",
      vertical: "center",
    };

    const centerWrap = { ...center, wrapText: true };

    const fontOf = (sz: number, bold: boolean, rgb: string) => ({
      name: "Arial",
      sz,
      bold,
      color: { rgb },
    });

    const fillOf = (rgb: string) => ({ fgColor: { rgb } });

    const titleStyle = {
      font: fontOf(20, true, COLORS.white),
      fill: fillOf(COLORS.primaryDark),
      alignment: center,
    };

    const subtitleStyle = {
      font: fontOf(11, true, COLORS.text),
      alignment: center,
    };

    const headerStyle = {
      font: fontOf(11, true, COLORS.white),
      fill: fillOf(COLORS.primary),
      alignment: centerWrap,
      border,
    };

    const districtStyle = {
      font: fontOf(11, true, COLORS.text),
      fill: fillOf(COLORS.district),
      alignment: centerWrap,
      border,
    };

    const blockStyle = {
      font: fontOf(10, true, COLORS.text),
      fill: fillOf(COLORS.block),
      alignment: centerWrap,
      border,
    };

    const userStyle = {
      font: { name: "Arial", sz: 10, color: { rgb: COLORS.text } },
      fill: fillOf(COLORS.user),
      alignment: centerWrap,
      border,
    };

    const totalStyle = {
      font: fontOf(10, true, COLORS.text),
      fill: fillOf(COLORS.total),
      alignment: centerWrap,
      border,
    };

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["تقرير المخالفات"],
        [
          `اليوم: ${getArabicDayName(reportDate)} | التاريخ: ${formatArabicDate(
            reportDate
          )}`,
        ],
        [],
      ],
      { origin: "A1" }
    );

    const headers = [
      "المنطقة",
      "الحي / البلوك",
      "المستخدم / المشرف",
      "الإجمالي",
      "بانتظار القبول",
      "قيد التنفيذ",
      "في انتظار التحقق الميداني",
      "تم الحل",
      "قيد مراجعة AVTR",
      "AVTR قبلت الرفض",
      "AVTR رفضت الحل",
      "نسبة الإنجاز",
    ];

    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A4" });

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
    ];

    worksheet["A1"].s = titleStyle;

    worksheet["A2"].s = subtitleStyle;

    for (let c = 0; c < headers.length; c++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 3, c })];

      if (cell) {
        cell.s = headerStyle;
      }
    }

    const styleRow = (row: number, style: any) => {
      for (let c = 0; c < 12; c++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c })];

        if (cell) {
          cell.s = style;
        }
      }
    };

    let currentRow = 4;

    const districtMergeRanges: XLSX.Range[] = [];

    const blockMergeRanges: XLSX.Range[] = [];

    sortedDistricts.forEach(([district, districtData]) => {
      const districtStartRow = currentRow;

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [
            district,
            "توزيعات المخالفات في المنطقة",
            "",
            districtData.stats.total,
            districtData.stats.pendingAcceptance,
            districtData.stats.inProgress,
            districtData.stats.fieldVerification,
            districtData.stats.resolved,
            districtData.stats.avtrReview,
            districtData.stats.avtrAcceptedRejection,
            districtData.stats.avtrRejectedSolution,
            `${getAchievement(districtData.stats)}%`,
          ],
        ],
        { origin: `A${currentRow + 1}` }
      );

      styleRow(currentRow, totalStyle);

      currentRow++;

      const sortedBlocks = Object.entries(districtData.blocks).sort(
        ([, a], [, b]) => b.stats.total - a.stats.total
      );

      sortedBlocks.forEach(([block, blockData]) => {
        const blockStartRow = currentRow;

        XLSX.utils.sheet_add_aoa(
          worksheet,
          [
            [
              "",
              block,
              "توزيعات المخالفات في الحي",
              blockData.stats.total,
              blockData.stats.pendingAcceptance,
              blockData.stats.inProgress,
              blockData.stats.fieldVerification,
              blockData.stats.resolved,
              blockData.stats.avtrReview,
              blockData.stats.avtrAcceptedRejection,
              blockData.stats.avtrRejectedSolution,
              `${getAchievement(blockData.stats)}%`,
            ],
          ],
          { origin: `A${currentRow + 1}` }
        );

        styleRow(currentRow, blockStyle);

        currentRow++;

        const sortedUsers = Object.entries(blockData.users).sort(
          ([, a], [, b]) => b.total - a.total
        );

        sortedUsers.forEach(([user, userData]) => {
          XLSX.utils.sheet_add_aoa(
            worksheet,
            [
              [
                "",
                "",
                user,
                userData.total,
                userData.pendingAcceptance,
                userData.inProgress,
                userData.fieldVerification,
                userData.resolved,
                userData.avtrReview,
                userData.avtrAcceptedRejection,
                userData.avtrRejectedSolution,
                `${getAchievement(userData)}%`,
              ],
            ],
            { origin: `A${currentRow + 1}` }
          );

          styleRow(currentRow, userStyle);

          const achievementCell =
            worksheet[XLSX.utils.encode_cell({ r: currentRow, c: 11 })];

          if (achievementCell) {
            achievementCell.s = {
              ...userStyle,
              fill: fillOf(COLORS.achievement),
              font: fontOf(10, true, COLORS.text),
            };
          }

          currentRow++;
        });

        const blockEndRow = currentRow - 1;

        if (blockEndRow >= blockStartRow) {
          blockMergeRanges.push({
            s: { r: blockStartRow, c: 1 },
            e: { r: blockEndRow, c: 1 },
          });
        }
      });

      const districtEndRow = currentRow - 1;

      if (districtEndRow >= districtStartRow) {
        districtMergeRanges.push({
          s: { r: districtStartRow, c: 0 },
          e: { r: districtEndRow, c: 0 },
        });
      }
    });

    worksheet["!merges"]?.push(...districtMergeRanges, ...blockMergeRanges);

    districtMergeRanges.forEach((range) => {
      const cell = worksheet[XLSX.utils.encode_cell(range.s)];

      if (cell) {
        cell.s = districtStyle;
      }
    });

    blockMergeRanges.forEach((range) => {
      const cell = worksheet[XLSX.utils.encode_cell(range.s)];

      if (cell) {
        cell.s = blockStyle;
      }
    });

    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 28 },
      { wch: 14 },
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
    ];

    worksheet["!rows"] = [];

    worksheet["!rows"][0] = { hpt: 36 };

    worksheet["!rows"][1] = { hpt: 24 };

    worksheet["!rows"][3] = { hpt: 42 };

    worksheet["!sheetViews"] = [{ rightToLeft: true }];

    worksheet["!freeze"] = { xSplit: 0, ySplit: 4 };

    worksheet["!autofilter"] = { ref: `A4:L${currentRow}` };

    worksheet["!pageSetup"] = {
      orientation: "landscape",
      fitToWidth: 1,
      fitToHeight: 0,
    };

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير المخالفات");

    XLSX.writeFile(workbook, "تقرير_المخالفات.xlsx");
  };

  /* =========================================================
     EXPORT 2
     COMPLAINT SOURCE REPORT
  ========================================================= */

  const exportComplaintSourceExcel = () => {
    const RESOLVED_STATUSES = new Set([
      "PendingFieldMonitorVerification",
      "Resolved",
      "PendingSupervisorReview",
      "Rejected",
    ]);

    const createSourceStats = (): SourceStats => ({
      total: 0,
      resolved: 0,
    });

    const districts: Record<string, SourceDistrictData> = {};

    scopedItems.forEach((item) => {
      const district = item.districtName?.trim()
        ? `منطقة ${item.districtName.trim()}`
        : "مخالفات حسب مؤشرات الأداء";

      if (!districts[district]) {
        districts[district] = {
          callCenter: createSourceStats(),
          citizenPortal: createSourceStats(),
          avtrTeam: createSourceStats(),
          total: 0,
          resolved: 0,
        };
      }

      const districtData = districts[district];

      const status = item.status || "Unknown";

      const isResolved = RESOLVED_STATUSES.has(status);

      if (item.complaintSource === "call-center") {
        districtData.callCenter.total++;

        if (isResolved) {
          districtData.callCenter.resolved++;
        }
      } else if (item.complaintSource === "citizen-portal") {
        districtData.citizenPortal.total++;

        if (isResolved) {
          districtData.citizenPortal.resolved++;
        }
      } else if (item.complaintSource == null) {
        districtData.avtrTeam.total++;

        if (isResolved) {
          districtData.avtrTeam.resolved++;
        }
      }

      districtData.total++;

      if (isResolved) {
        districtData.resolved++;
      }
    });

    const sortedDistricts = Object.entries(districts).sort(
      ([, a], [, b]) => b.total - a.total
    );

    const worksheet = XLSX.utils.aoa_to_sheet([]);

    const COLORS = {
      primary: "1F4E78",
      primaryDark: "17365D",
      callCenter: "D9EAF7",
      citizenPortal: "E2F0D9",
      avtrTeam: "E4DFEC",
      total: "FFF2CC",
      resolved: "D9EAD3",
      white: "FFFFFF",
      text: "1F2937",
      border: "B7C9D6",
    };

    const side = { style: "thin", color: { rgb: COLORS.border } };

    const border = {
      top: side,
      bottom: side,
      left: side,
      right: side,
    };

    const center = {
      horizontal: "center",
      vertical: "center",
    };

    const fontOf = (sz: number, bold: boolean, rgb: string) => ({
      name: "Arial",
      sz,
      bold,
      color: { rgb },
    });

    const fillOf = (rgb: string) => ({ fgColor: { rgb } });

    const titleStyle = {
      font: fontOf(20, true, COLORS.white),
      fill: fillOf(COLORS.primaryDark),
      alignment: center,
    };

    const subtitleStyle = {
      font: fontOf(11, true, COLORS.text),
      alignment: center,
    };

    const headerStyle = {
      font: fontOf(10, true, COLORS.white),
      fill: fillOf(COLORS.primary),
      alignment: { ...center, wrapText: true },
      border,
    };

    const normalStyle = {
      font: { name: "Arial", sz: 10, color: { rgb: COLORS.text } },
      alignment: { ...center, wrapText: true },
      border,
    };

    const callCenterStyle = { ...normalStyle, fill: fillOf(COLORS.callCenter) };

    const citizenPortalStyle = {
      ...normalStyle,
      fill: fillOf(COLORS.citizenPortal),
    };

    const avtrTeamStyle = { ...normalStyle, fill: fillOf(COLORS.avtrTeam) };

    const boldText = fontOf(10, true, COLORS.text);

    const resolvedStyle = {
      ...normalStyle,
      fill: fillOf(COLORS.resolved),
      font: boldText,
    };

    const totalStyle = {
      ...normalStyle,
      fill: fillOf(COLORS.total),
      font: boldText,
    };

    const percentageStyle = {
      ...normalStyle,
      fill: fillOf(COLORS.resolved),
      font: boldText,
    };

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["تقرير مصادر المخالفات حسب المناطق"],
        ["Call Center | بوابة المواطن | AVTR Team"],
        [],
      ],
      { origin: "A1" }
    );

    const headers = [
      "المنطقة",
      "Call Center",
      "Call Center - تم حلها",
      "بوابة المواطن",
      "بوابة المواطن - تم حلها",
      "AVTR Team",
      "AVTR Team - تم حلها",
      "إجمالي المخالفات",
      "إجمالي تم حلها",
      "نسبة الحل",
    ];

    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A4" });

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    ];

    worksheet["A1"].s = titleStyle;

    worksheet["A2"].s = subtitleStyle;

    for (let c = 0; c < headers.length; c++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 3, c })];

      if (cell) {
        cell.s = headerStyle;
      }
    }

    let currentRow = 4;

    sortedDistricts.forEach(([district, data]) => {
      const total = data.total;
      const resolved = data.resolved;

      const percentage = total ? ((resolved / total) * 100).toFixed(1) : "0.0";

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [
            district,
            data.callCenter.total,
            data.callCenter.resolved,
            data.citizenPortal.total,
            data.citizenPortal.resolved,
            data.avtrTeam.total,
            data.avtrTeam.resolved,
            total,
            resolved,
            `${percentage}%`,
          ],
        ],
        { origin: `A${currentRow + 1}` }
      );

      const rowStyles = [
        normalStyle,
        callCenterStyle,
        resolvedStyle,
        citizenPortalStyle,
        resolvedStyle,
        avtrTeamStyle,
        resolvedStyle,
        totalStyle,
        resolvedStyle,
        percentageStyle,
      ];

      for (let c = 0; c < headers.length; c++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: currentRow, c })];

        if (cell) {
          cell.s = rowStyles[c];
        }
      }

      currentRow++;
    });

    const grandTotal = {
      callCenter: createSourceStats(),
      citizenPortal: createSourceStats(),
      avtrTeam: createSourceStats(),
      total: 0,
      resolved: 0,
    };

    Object.values(districts).forEach((district) => {
      grandTotal.callCenter.total += district.callCenter.total;
      grandTotal.callCenter.resolved += district.callCenter.resolved;

      grandTotal.citizenPortal.total += district.citizenPortal.total;
      grandTotal.citizenPortal.resolved += district.citizenPortal.resolved;

      grandTotal.avtrTeam.total += district.avtrTeam.total;
      grandTotal.avtrTeam.resolved += district.avtrTeam.resolved;

      grandTotal.total += district.total;
      grandTotal.resolved += district.resolved;
    });

    const grandPercentage = grandTotal.total
      ? ((grandTotal.resolved / grandTotal.total) * 100).toFixed(1)
      : "0.0";

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [
          "الإجمالي العام",
          grandTotal.callCenter.total,
          grandTotal.callCenter.resolved,
          grandTotal.citizenPortal.total,
          grandTotal.citizenPortal.resolved,
          grandTotal.avtrTeam.total,
          grandTotal.avtrTeam.resolved,
          grandTotal.total,
          grandTotal.resolved,
          `${grandPercentage}%`,
        ],
      ],
      { origin: `A${currentRow + 1}` }
    );

    for (let c = 0; c < headers.length; c++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: currentRow, c })];

      if (cell) {
        cell.s = {
          ...totalStyle,
          fill: fillOf(
            c === 2 || c === 4 || c === 6 || c === 8 || c === 9
              ? COLORS.resolved
              : COLORS.total
          ),
        };
      }
    }

    worksheet["!cols"] = [
      { wch: 26 },
      { wch: 18 },
      { wch: 22 },
      { wch: 20 },
      { wch: 25 },
      { wch: 18 },
      { wch: 22 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
    ];

    worksheet["!rows"] = [];

    worksheet["!rows"][0] = { hpt: 36 };

    worksheet["!rows"][1] = { hpt: 24 };

    worksheet["!rows"][3] = { hpt: 42 };

    worksheet["!sheetViews"] = [{ rightToLeft: true }];

    worksheet["!freeze"] = { xSplit: 0, ySplit: 4 };

    worksheet["!autofilter"] = { ref: `A4:J${currentRow + 1}` };

    worksheet["!pageSetup"] = {
      orientation: "landscape",
      fitToWidth: 1,
      fitToHeight: 0,
    };

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "مصادر المخالفات");

    XLSX.writeFile(workbook, "تقرير_مصادر_المخالفات_حسب_المنطقة.xlsx");
  };

  /* =========================================================
     EXPORT 3
     CUMULATIVE REPORT
  ========================================================= */

  const openCumulativeModal = () => {
    setCumulativeFromDate("");
    setCumulativeToDate("");
    setCumulativeModalOpened(true);
  };

  const handleCumulativeExport = async () => {
    // VALIDATION

    if (!cumulativeFromDate || !cumulativeToDate) {
      alert("يرجى اختيار تاريخ البداية والنهاية");

      return;
    }

    if (cumulativeFromDate > cumulativeToDate) {
      alert("تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية");

      return;
    }

    if (cumulativeExporting) {
      return;
    }

    const exportStart = performance.now();

    try {
      setCumulativeExporting(true);

      // BUILD URL

      const params = new URLSearchParams({
        dateFrom: cumulativeFromDate,
        dateTo: cumulativeToDate,
      });

      // FETCH API
      // cache: "no-store" لأن الـ API نفسه يتحكم بالـ cache

      const response = await fetch(
        `/api/cumulative-report?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      // CHECK RESPONSE

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await response.text();

        console.error(
          "Cumulative report returned non-JSON:",
          text.substring(0, 500)
        );

        throw new Error(`الـ API لم يرجع JSON. Status: ${response.status}`);
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "حدث خطأ أثناء جلب التقرير");
      }

      // DISTRICTS

      const districts = Array.isArray(result?.districts)
        ? result.districts
        : [];

      // EXCEL DATA

      const excelData: (string | number | null)[][] = [];

      excelData.push(["التقرير التراكمي للمخالفات"]);

      excelData.push([
        `فترة التقرير: من ${cumulativeFromDate} إلى ${cumulativeToDate}`,
      ]);

      excelData.push([
        "المنطقة",
        "إجمالي المخالفات",
        "في انتظار القبول",
        "قيد التنفيذ",
        "في انتظار التحقق الميداني",
        "تم الحل",
        "تم قبول الرفض",
        "تم رفض الحل",
        "قيد مراجعة AVTR",
        "نسبة الإنجاز",
      ]);

      for (const district of districts) {
        excelData.push([
          district.districtName || "بدون منطقة",

          Number(district.total) || 0,

          Number(district.pendingAcceptance) || 0,

          Number(district.inProgress) || 0,

          Number(
            district.fieldVerification ??
              district.pendingFieldMonitorVerification ??
              0
          ),

          Number(district.resolved) || 0,

          Number(district.acceptedRejection ?? district.rejected ?? 0),

          Number(district.rejectedSolution ?? district.resolutionRejected ?? 0),

          Number(
            district.avtrReview ?? district.pendingSupervisorReview ?? 0
          ),

          `${Number(district.achievementPercentage) || 0}%`,
        ]);
      }

      // GRAND TOTAL

      excelData.push([
        "المجموع الكلي",

        Number(result.total) || 0,

        Number(result.pendingAcceptance) || 0,

        Number(result.inProgress) || 0,

        Number(result.fieldVerification) || 0,

        Number(result.resolved) || 0,

        Number(result.acceptedRejection) || 0,

        Number(result.rejectedSolution) || 0,

        Number(result.avtrReview) || 0,

        `${Number(result.achievementPercentage) || 0}%`,
      ]);

      // CREATE WORKSHEET

      const worksheet = XLSX.utils.aoa_to_sheet(excelData);

      worksheet["!cols"] = [
        { wch: 28 },
        { wch: 18 },
        { wch: 18 },
        { wch: 16 },
        { wch: 28 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
        { wch: 20 },
        { wch: 16 },
      ];

      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      ];

      // STYLES

      const thin = { style: "thin", color: { rgb: "D9D9D9" } };

      const border = {
        top: thin,
        bottom: thin,
        left: thin,
        right: thin,
      };

      const NAVY = "15233C";

      worksheet["A1"].s = {
        font: { bold: true, sz: 18, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: NAVY } },
        border,
      };

      worksheet["A2"].s = {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "E9EEF5" } },
        border,
      };

      // HEADER

      const headerRow = 2;

      for (let col = 0; col < 10; col++) {
        const cell =
          worksheet[XLSX.utils.encode_cell({ r: headerRow, c: col })];

        if (!cell) continue;

        cell.s = {
          font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          fill: { fgColor: { rgb: NAVY } },
          border,
        };
      }

      // DATA ROWS

      const firstDataRow = 3;

      const lastDataRow = firstDataRow + districts.length - 1;

      for (let row = firstDataRow; row <= lastDataRow; row++) {
        for (let col = 0; col < 10; col++) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];

          if (!cell) continue;

          cell.s = {
            alignment: {
              horizontal: col === 0 ? "right" : "center",
              vertical: "center",
              wrapText: true,
            },
            border,
          };
        }
      }

      // TOTAL ROW

      const totalRow = firstDataRow + districts.length;

      for (let col = 0; col < 10; col++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: totalRow, c: col })];

        if (!cell) continue;

        cell.s = {
          font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          fill: { fgColor: { rgb: NAVY } },
          border: {
            top: { style: "medium", color: { rgb: NAVY } },
            bottom: { style: "medium", color: { rgb: NAVY } },
            left: { style: "thin", color: { rgb: "808080" } },
            right: { style: "thin", color: { rgb: "808080" } },
          },
        };
      }

      // AUTOFILTER

      if (districts.length > 0) {
        worksheet["!autofilter"] = {
          ref: `A3:J${firstDataRow + districts.length}`,
        };
      }

      worksheet["!freeze"] = { xSplit: 0, ySplit: 4 };

      worksheet["!sheetViews"] = [{ rightToLeft: true }];

      worksheet["!pageSetup"] = {
        orientation: "landscape",
        fitToWidth: 1,
        fitToHeight: 0,
      };

      worksheet["!rows"] = [];

      worksheet["!rows"][0] = { hpt: 30 };

      worksheet["!rows"][1] = { hpt: 24 };

      worksheet["!rows"][2] = { hpt: 30 };

      // WORKBOOK

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "التقرير التراكمي");

      const fileName = `التقرير_التراكمي_${cumulativeFromDate}_إلى_${cumulativeToDate}.xlsx`;

      XLSX.writeFile(workbook, fileName);

      // CLOSE

      setCumulativeModalOpened(false);

      setCumulativeFromDate("");

      setCumulativeToDate("");

      console.log(
        `Cumulative export completed in ${Math.round(
          performance.now() - exportStart
        )}ms`
      );
    } catch (error) {
      console.error("Cumulative report error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إنشاء التقرير التراكمي"
      );
    } finally {
      setCumulativeExporting(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  const modalInvalid =
    !cumulativeFromDate ||
    !cumulativeToDate ||
    cumulativeFromDate > cumulativeToDate;

  return (
    <Box
      dir="rtl"
      style={{
        minHeight: "100vh",
        overflowX: "hidden",
        fontFamily: FONT,
      }}
      p={{
        base: "xs",
        sm: "md",
        md: "lg",
      }}
    >
      {/* =====================================================
          CUMULATIVE MODAL
      ===================================================== */}

      <Modal
        opened={cumulativeModalOpened}
        onClose={() => setCumulativeModalOpened(false)}
        title="التقرير التراكمي"
        centered
        radius={20}
        size="md"
        dir="rtl"
        overlayProps={{
          backgroundOpacity: 0.7,
          blur: 6,
          color: INK,
        }}
        styles={modalStyles}
      >
        <Stack gap="lg">
          <Text size="sm" c={MUTED} ta="center">
            اختر الفترة الزمنية التي تريد استخراج التقرير التراكمي لها
          </Text>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="من تاريخ"
              placeholder="YYYY-MM-DD"
              type="date"
              value={cumulativeFromDate}
              onChange={(event) =>
                setCumulativeFromDate(event.currentTarget.value)
              }
              required
              styles={dateInputStyles}
            />

            <TextInput
              label="إلى تاريخ"
              placeholder="YYYY-MM-DD"
              type="date"
              value={cumulativeToDate}
              onChange={(event) =>
                setCumulativeToDate(event.currentTarget.value)
              }
              required
              styles={dateInputStyles}
            />
          </SimpleGrid>

          {cumulativeFromDate &&
            cumulativeToDate &&
            cumulativeFromDate > cumulativeToDate && (
              <Text size="sm" c="red.3" fw={600} ta="center">
                تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية
              </Text>
            )}

          {cumulativeExporting && (
            <Stack gap={8}>
              <Progress
                value={100}
                size={6}
                radius="xl"
                animated
                w="100%"
                styles={{
                  root: { background: "rgba(255,255,255,.14)" },
                  section: {
                    background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
                  },
                }}
              />

              <Text size="sm" fw={600} c={GOLD_LIGHT} ta="center">
                جاري تجهيز التقرير التراكمي...
              </Text>
            </Stack>
          )}

          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              radius="xl"
              onClick={() => setCumulativeModalOpened(false)}
              disabled={cumulativeExporting}
              style={ghostBtn}
            >
              إلغاء
            </Button>

            <Button
              radius="xl"
              variant="default"
              leftSection={<IconFileSpreadsheet size={18} stroke={1.6} />}
              disabled={cumulativeExporting || modalInvalid}
              onClick={handleCumulativeExport}
              style={{
                ...goldSolidBtn,
                opacity: cumulativeExporting || modalInvalid ? 0.45 : 1,
              }}
            >
              تنزيل التقرير
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Stack maw={1600} mx="auto">
        {isAdmin && (
          <>
            {/* =================================================
                ADMIN PANEL
            ================================================= */}

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
                    background: `linear-gradient(90deg, ${GOLD}, ${hexA(
                      GOLD,
                      0
                    )})`,
                  }}
                />

                <Group
                  justify="space-between"
                  align="center"
                  gap="md"
                  wrap="wrap"
                  mb="xl"
                >
                  <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
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
                      <IconChartBar size={25} stroke={1.5} />
                    </Box>

                    <Stack gap={2} style={{ minWidth: 0 }}>
                      <Text
                        fw={700}
                        c={TEXT}
                        style={{
                          fontSize: "clamp(18px, 3vw, 26px)",
                          lineHeight: 1.25,
                        }}
                      >
                        ملخص المخالفات لجميع المناطق
                      </Text>

                      <Text
                        c={MUTED}
                        style={{ fontSize: "clamp(11px, 2vw, 14px)" }}
                      >
                        تحليل مركزي لحالة المخالفات ومصادرها ونسب الإنجاز
                      </Text>
                    </Stack>
                  </Group>

                  <Box
                    component="span"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 700,
                      color: GOLD_LIGHT,
                      background: hexA(GOLD, 0.1),
                      border: `1px solid ${hexA(GOLD, 0.5)}`,
                    }}
                  >
                    {activeSource.icon}
                    {activeSource.label}
                  </Box>
                </Group>

                <Group
                  justify="space-between"
                  align="flex-end"
                  gap="xl"
                  wrap="wrap"
                >
                  <Stack gap={4}>
                    <Text size="sm" fw={600} c={MUTED}>
                      نسبة الإنجاز الكلي
                    </Text>

                    <Text
                      fw={800}
                      c={TEXT}
                      style={{
                        fontSize: "clamp(46px, 9vw, 72px)",
                        lineHeight: 1,
                        ...tabular,
                      }}
                    >
                      {achievement}
                      <Text
                        span
                        fw={600}
                        c={GOLD_LIGHT}
                        style={{ fontSize: "0.5em" }}
                      >
                        %
                      </Text>
                    </Text>

                    <Text size="sm" c={MUTED}>
                      بناءً على المخالفات المعروضة حالياً
                    </Text>
                  </Stack>

                  <SimpleGrid
                    cols={{ base: 2, xs: 2 }}
                    spacing="sm"
                    style={{ width: "min(100%, 460px)" }}
                  >
                    <HeroMiniStat
                      label="الإجمالي"
                      value={kpis.total}
                      color="#8FB4FF"
                      icon={<IconSum size={18} stroke={1.7} />}
                    />

                    <HeroMiniStat
                      label="المخالفات المنجزة"
                      value={kpis.completedCount}
                      color={GOLD_LIGHT}
                      icon={<IconCircleCheck size={18} stroke={1.7} />}
                      highlight
                    />
                  </SimpleGrid>
                </Group>
              </Box>

              {/* ---------- BODY ---------- */}

              <Stack gap="lg" p={{ base: "md", sm: "xl" }}>
                {/* SOURCE FILTER */}

                <Group
                  justify="space-between"
                  align="center"
                  gap="sm"
                  wrap="wrap"
                >
                  <Group gap="sm" wrap="nowrap">
                    <Box
                      style={{
                        width: 38,
                        height: 38,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 12,
                        color: GOLD_LIGHT,
                        background: hexA(GOLD, 0.1),
                        border: `1px solid ${hexA(GOLD, 0.45)}`,
                      }}
                    >
                      <IconFilter size={19} stroke={1.6} />
                    </Box>

                    <Stack gap={0}>
                      <Text fw={700} c={TEXT} style={{ fontSize: 16 }}>
                        مصدر المخالفة
                      </Text>

                      <Text size="xs" c={MUTED}>
                        اختر المصدر لعرض البيانات الخاصة به
                      </Text>
                    </Stack>
                  </Group>

                  <Text fw={700} c={GOLD_LIGHT} style={tabular}>
                    {filteredItems.length.toLocaleString("en-US")} مخالفة
                  </Text>
                </Group>

                <SimpleGrid
                  cols={{ base: 1, xs: 2, sm: 4 }}
                  spacing={{ base: "xs", sm: "sm" }}
                >
                  {SOURCE_OPTIONS.map((source) => {
                    const active = complaintSourceFilter === source.key;

                    return (
                      <Box
                        key={source.key}
                        component="button"
                        type="button"
                        onClick={() => setComplaintSourceFilter(source.key)}
                        {...(active ? {} : liftHandlers)}
                        style={{
                          cursor: "pointer",
                          textAlign: "right",
                          width: "100%",
                          minHeight: 62,
                          padding: "10px 14px",
                          borderRadius: 16,
                          fontFamily: FONT,
                          color: TEXT,
                          background: `${cornerGlow(
                            source.color,
                            active ? 0.4 : 0.2
                          )}, ${SURFACE_2}`,
                          border: `1px solid ${active ? GOLD : LINE}`,
                          boxShadow: active
                            ? `0 0 0 3px ${hexA(GOLD, 0.18)}`
                            : "none",
                          transition: "all .18s ease",
                        }}
                      >
                        <Group gap="sm" wrap="nowrap">
                          <Box
                            style={{
                              display: "grid",
                              placeItems: "center",
                              width: 34,
                              height: 34,
                              minWidth: 34,
                              borderRadius: 11,
                              color: active ? GOLD_LIGHT : bright(source.color),
                              background: "rgba(255,255,255,.07)",
                              border: `1px solid ${LINE}`,
                            }}
                          >
                            {source.icon}
                          </Box>

                          <Stack gap={0} style={{ minWidth: 0 }}>
                            <Text fw={700} size="sm" c={TEXT} truncate>
                              {source.label}
                            </Text>

                            <Text size="xs" c={MUTED} style={tabular}>
                              {
                                sourceCounts[
                                  source.key as keyof typeof sourceCounts
                                ]
                              }{" "}
                              مخالفة
                            </Text>
                          </Stack>
                        </Group>
                      </Box>
                    );
                  })}
                </SimpleGrid>

                {complaintSourceFilter !== "all" && (
                  <Button
                    variant="default"
                    radius="xl"
                    leftSection={<IconRefresh size={17} stroke={1.6} />}
                    onClick={() => setComplaintSourceFilter("all")}
                    fullWidth
                    style={ghostBtn}
                  >
                    إعادة عرض جميع المصادر
                  </Button>
                )}

                {/* EXPORT ACTIONS */}

                <Box style={{ borderTop: `1px solid ${LINE}` }} pt="lg">
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                    <Button
                      size="md"
                      radius="xl"
                      variant="default"
                      leftSection={<IconCalendarStats size={19} stroke={1.6} />}
                      onClick={openCumulativeModal}
                      fullWidth
                      style={goldOutlineBtn}
                    >
                      التقرير التراكمي
                    </Button>

                    <Button
                      size="md"
                      radius="xl"
                      variant="default"
                      leftSection={<IconFileSpreadsheet size={19} stroke={1.6} />}
                      onClick={exportExcel}
                      fullWidth
                      style={goldSolidBtn}
                    >
                      تصدير التقرير التفصيلي
                    </Button>

                    <Button
                      size="md"
                      radius="xl"
                      variant="default"
                      leftSection={<IconFileSpreadsheet size={19} stroke={1.6} />}
                      onClick={exportComplaintSourceExcel}
                      fullWidth
                      style={ghostBtn}
                    >
                      تصدير مصادر المخالفات
                    </Button>
                  </SimpleGrid>
                </Box>
              </Stack>
            </Card>

            <GeneralSummary items={filteredItems} />
          </>
        )}

        {/* =====================================================
            DISTRICT NAVIGATION
        ===================================================== */}

        {Object.keys(stats).length > 0 && (
          <Card
            radius={20}
            p={{ base: "sm", sm: "md" }}
            style={panelStyle}
          >
            <Group gap="xs" wrap="wrap">
              {Object.entries(stats)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([district, data]) => (
                  <Button
                    key={district}
                    variant="default"
                    radius="xl"
                    size="sm"
                    onClick={() => focusDistrict(district)}
                    style={ghostBtn}
                    rightSection={
                      <Text
                        span
                        fw={800}
                        c={GOLD_LIGHT}
                        style={{ fontSize: 13, ...tabular }}
                      >
                        {data.total.toLocaleString("en-US")}
                      </Text>
                    }
                  >
                    {district}
                  </Button>
                ))}
            </Group>
          </Card>
        )}

        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {filteredItems.length === 0 && (
          <Card
            radius={22}
            p={{ base: "xl", sm: 60 }}
            style={{ ...panelStyle, textAlign: "center" }}
          >
            <Stack align="center" gap="sm">
              <Box
                style={{
                  width: 64,
                  height: 64,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 20,
                  color: GOLD_LIGHT,
                  background: hexA(GOLD, 0.1),
                  border: `1px solid ${hexA(GOLD, 0.45)}`,
                }}
              >
                <IconFilter size={30} stroke={1.5} />
              </Box>

              <Text fw={700} c={TEXT} style={{ fontSize: 18 }}>
                لا توجد مخالفات
              </Text>

              <Text size="sm" c={MUTED}>
                لا توجد بيانات مطابقة للفلاتر الحالية.
              </Text>

              {complaintSourceFilter !== "all" && (
                <Button
                  variant="default"
                  radius="xl"
                  leftSection={<IconRefresh size={17} stroke={1.6} />}
                  onClick={() => setComplaintSourceFilter("all")}
                  style={goldOutlineBtn}
                >
                  عرض جميع المصادر
                </Button>
              )}
            </Stack>
          </Card>
        )}

        {/* =====================================================
            DISTRICTS
        ===================================================== */}

        <Stack gap="md">
          {Object.entries(stats)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([district, data]) => (
              <Box
                key={district}
                id={`district-${encodeURIComponent(district)}`}
                style={{
                  scrollMarginTop: 20,
                }}
              >
                <DistrictCard district={district} data={data} />
              </Box>
            ))}
        </Stack>
      </Stack>
    </Box>
  );
}

/* =========================================================
   HERO MINI STAT
========================================================= */

function HeroMiniStat({
  label,
  value,
  color,
  icon,
  highlight = false,
}: {
  label: string;
  value: number;
  color: string;
  icon?: ReactNode;
  highlight?: boolean;
}) {
  return (
    <Box
      px="md"
      py="sm"
      style={{
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
        borderRadius: 16,
        background: `${cornerGlow(color, highlight ? 0.32 : 0.2)}, ${SURFACE_2}`,
        border: `1px solid ${highlight ? hexA(color, 0.6) : LINE_STRONG}`,
        boxShadow: highlight ? `0 0 0 3px ${hexA(color, 0.14)}` : "none",
      }}
    >
      {/* شريط ملوّن بالأعلى */}
      <Box
        style={{
          position: "absolute",
          insetInline: 0,
          top: 0,
          height: 2,
          background: `linear-gradient(90deg, ${color}, ${hexA(color, 0)})`,
        }}
      />

      <Group justify="center" gap={6} mb={4} wrap="nowrap">
        {icon && (
          <Box style={{ color, display: "grid", placeItems: "center" }}>
            {icon}
          </Box>
        )}

        <Text size="xs" fw={600} c={MUTED}>
          {label}
        </Text>
      </Group>

      <Text
        fw={800}
        style={{
          color: highlight ? color : TEXT,
          fontSize: "clamp(22px, 4vw, 30px)",
          lineHeight: 1.15,
          ...tabular,
        }}
      >
        {value.toLocaleString("en-US")}
      </Text>
    </Box>
  );
}
