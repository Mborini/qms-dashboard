"use client";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";

import {
  Text,
  Group,
  Stack,
  Divider,
  SimpleGrid,
  Modal,
  Button,
  Box,
  ScrollArea,
  Table,
  Progress,
  ActionIcon,
} from "@mantine/core";

import {
  IconBuildings,
  IconCopy,
  IconDownload,
  IconMapPin,
  IconUser,
  IconChartBar,
  IconTrophy,
  IconChevronLeft,
  IconAlertCircle,
} from "@tabler/icons-react";

import { toPng } from "html-to-image";
import * as XLSX from "xlsx-js-style";
import { useSession } from "next-auth/react";

import FailureListModal from "../FailureListModal";
import { statusConfig, summaryOnlyStatuses } from "./statusConfig";

/* =========================================================
   TYPES
========================================================= */

type UserData = {
  count?: number;
  total?: number;
  ids?: (string | number)[];
};

type FailureItem = {
  id: string | number;
  block?: string;
  blockName?: string;
  district?: string;
  districtName?: string;
  status?: string;
  userName?: string;
};

type SelectedUser = {
  name: string;
  failures: FailureItem[];
};

type StatusKey = keyof typeof statusConfig;

/* =========================================================
   DESIGN TOKENS  (Navy + Champagne Gold + لون المنطقة)
========================================================= */

const INK = "#1A2A4A"; // الهيدر
const SURFACE = "#213459"; // خلفية الـ body
const SURFACE_2 = "#2A4070"; // البطاقات الداخلية
const SURFACE_3 = "#324D84"; // صفوف الحالات
const GOLD = "#C9A66B";
const GOLD_LIGHT = "#E6CF9D";
const TEXT = "#F3F6FC";
const MUTED = "rgba(240,244,252,.72)";
const FAINT = "rgba(240,244,252,.5)";
const LINE = "rgba(255,255,255,.12)";
const LINE_STRONG = "rgba(255,255,255,.22)";

const FONT =
  '"IBM Plex Sans Arabic", "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif';

/* =========================================================
   STATUS HELPERS
========================================================= */

const isStatusKey = (status: string): status is StatusKey =>
  Object.prototype.hasOwnProperty.call(statusConfig, status);

const getStatusConfig = (status: string) =>
  isStatusKey(status) ? statusConfig[status] : undefined;

const getUserCount = (userData: UserData) => {
  if (typeof userData.count === "number") return userData.count;
  if (typeof userData.total === "number") return userData.total;
  return userData.ids?.length ?? 0;
};

const getStatusColor = (status: string): string =>
  (getStatusConfig(status)?.color as string | undefined) ?? "gray";

const getStatusLabel = (status: string) =>
  getStatusConfig(status)?.label ??
  (status === "Unknown" ? "غير محدد" : status);

const getStatusIcon = (status: string) => getStatusConfig(status)?.icon ?? null;

/* =========================================================
   COLOR HELPERS (تدعم أسماء ألوان Mantine و hex)
========================================================= */

const isHex = (c: string) => c.startsWith("#");

/** شفافية للون hex */
const hexA = (hex: string, a: number) =>
  `${hex}${Math.round(a * 255)
    .toString(16)
    .padStart(2, "0")}`;

/** لون بدرجة محددة */
const shade = (color: string, n: number) =>
  isHex(color) ? color : `var(--mantine-color-${color}-${n})`;

/* =========================================================
   MICRO INTERACTIONS
========================================================= */

const lift = {
  onMouseEnter: (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = "0 16px 32px -16px rgba(10,20,45,.6)";
    e.currentTarget.style.borderColor = hexA(GOLD, 0.5);
  },
  onMouseLeave: (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "none";
    e.currentTarget.style.boxShadow = "none";
    e.currentTarget.style.borderColor = LINE;
  },
};

const modalProps = {
  radius: 20,
  centered: true,
  overlayProps: { backgroundOpacity: 0.7, blur: 6, color: INK },
  styles: {
    content: {
      background: SURFACE,
      border: `1px solid ${LINE_STRONG}`,
      boxShadow: "0 40px 80px -30px rgba(10,20,45,.7)",
      fontFamily: FONT,
    },
    header: {
      background: SURFACE,
      borderBottom: `1px solid ${LINE}`,
    },
    title: { fontWeight: 700, fontSize: 18, color: TEXT, fontFamily: FONT },
    close: { color: MUTED },
  },
};

const tabular = { fontVariantNumeric: "tabular-nums" as const };

const ghostBtn = {
  background: "transparent",
  border: `1px solid ${LINE_STRONG}`,
  color: TEXT,
  fontWeight: 600,
};

const goldBtn = {
  background: hexA(GOLD, 0.1),
  border: `1px solid ${hexA(GOLD, 0.55)}`,
  color: GOLD_LIGHT,
  fontWeight: 600,
};

/** عدّاد صغير بنمط موحّد */
const CountPill = ({
  color = "gray",
  children,
}: {
  color?: string;
  children: ReactNode;
}) => (
  <Box
    component="span"
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "1px 9px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      lineHeight: "18px",
      color: shade(color, 3),
      background: "rgba(255,255,255,.05)",
      border: `1px solid ${LINE}`,
      ...tabular,
    }}
  >
    {children}
  </Box>
);

/* =========================================================
   ACHIEVEMENT STATUSES
========================================================= */

const ACHIEVEMENT_STATUSES = [
  "PendingFieldMonitorVerification",
  "Resolved",
  "PendingSupervisorReview",
  "Rejected",
] as const;

const isAchievementStatus = (status: string) =>
  ACHIEVEMENT_STATUSES.includes(
    status as (typeof ACHIEVEMENT_STATUSES)[number],
  );

/* =========================================================
   BLOCK / KPI HELPERS
========================================================= */

const isKpiBlock = (blockName: string) =>
  /^KPI:/i.test(String(blockName).trim());

const getBlockDisplayName = (blockName: string) => {
  const value = String(blockName ?? "").trim();
  if (isKpiBlock(value)) return value.replace(/^KPI:\s*/i, "").trim();
  return value;
};

const normalizeBlockName = (blockName: string) =>
  getBlockDisplayName(blockName).replace(/\s+/g, " ").trim().toLowerCase();

const sortFailuresByBlock = (failures: FailureItem[]) =>
  failures.sort((a, b) => {
    const blockA = String(a.blockName ?? a.block ?? "");
    const blockB = String(b.blockName ?? b.block ?? "");

    const blockCompare = blockA.localeCompare(blockB, "ar", {
      sensitivity: "base",
    });

    if (blockCompare !== 0) return blockCompare;

    return String(a.id).localeCompare(String(b.id), "ar");
  });

/* =========================================================
   KPI NORMALIZER
========================================================= */

const normalizeKpiGroups = (data: any) => {
  const result: Record<string, any> = {};

  const addKpi = (name: string, value: any) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;

    const statuses = value?.statuses;

    if (!statuses || typeof statuses !== "object" || Array.isArray(statuses)) {
      return;
    }

    const calculatedTotal = Object.values(statuses).reduce(
      (sum: number, statusData: any) => sum + Number(statusData?.total ?? 0),
      0,
    );

    const rawTotal = Number(value?.total);

    const total =
      Number.isFinite(rawTotal) &&
      value?.total !== undefined &&
      value?.total !== null
        ? rawTotal
        : calculatedTotal;

    const cleanName = String(
      name ||
        value?.kpiNameAr ||
        value?.kpiName ||
        value?.nameAr ||
        value?.name ||
        value?.title ||
        "مخالفات حسب مؤشرات الأداء",
    )
      .replace(/^KPI:\s*/i, "")
      .trim();

    if (!cleanName) return;

    result[`KPI:${cleanName}`] = { ...value, total, statuses };
  };

  const consumeKpiSource = (source: any) => {
    if (!source) return;

    if (Array.isArray(source)) {
      source.forEach((item: any, index: number) => {
        if (
          item?.groups &&
          (Array.isArray(item.groups) || typeof item.groups === "object")
        ) {
          consumeKpiSource(item.groups);
          return;
        }

        const name =
          item?.kpiNameAr ??
          item?.kpiName ??
          item?.nameAr ??
          item?.name ??
          item?.title ??
          `مؤشر الأداء ${index + 1}`;

        addKpi(name, item);
      });

      return;
    }

    if (typeof source !== "object") return;

    if (source?.statuses) {
      const name =
        source?.kpiNameAr ??
        source?.kpiName ??
        source?.nameAr ??
        source?.name ??
        source?.title ??
        "مخالفات حسب مؤشرات الأداء";

      addKpi(name, source);
      return;
    }

    if (source?.groups) consumeKpiSource(source.groups);

    Object.entries(source).forEach(([name, value]) => {
      if (name === "groups") return;

      if (value && typeof value === "object" && !Array.isArray(value)) {
        if ((value as any)?.statuses) {
          const v = value as any;

          const displayName =
            v?.kpiNameAr ??
            v?.kpiName ??
            v?.nameAr ??
            v?.name ??
            v?.title ??
            name;

          addKpi(displayName, value);
        }
      }
    });
  };

  consumeKpiSource(data?.kpis);
  consumeKpiSource(data?.performanceIndicators);
  consumeKpiSource(data?.kpiGroups);
  consumeKpiSource(data?.kpi);
  consumeKpiSource(data?.kpiData);
  consumeKpiSource(data?.kpiGroupsData);

  if (
    data?.statuses &&
    typeof data.statuses === "object" &&
    (data?.kpiNameAr || data?.kpiName || data?.isKpi || data?.type === "kpi")
  ) {
    const name =
      data?.kpiNameAr ?? data?.kpiName ?? "مخالفات حسب مؤشرات الأداء";

    addKpi(name, data);
  }

  return result;
};

/* =========================================================
   DISTRICT COLORS (تكحيلة الزاوية لكل منطقة)
========================================================= */

const districtColors: Record<string, { main: string; light: string }> = {
  "منطقة طارق": { main: "#F76707", light: "#FFF4E6" },
  "منطقة الجبيهة": { main: "#40C057", light: "#EBF7EE" },
  "منطقة الجبيهه": { main: "#40C057", light: "#EBF7EE" },
  "منطقة ابو نصير": { main: "#FA5252", light: "#FFF0F0" },
  "منطقة أبو نصير": { main: "#FA5252", light: "#FFF0F0" },
  "منطقة ابونصير": { main: "#FA5252", light: "#FFF0F0" },
  "منطقة شفا بدران": { main: "#FCC419", light: "#FFF9DB" },
  "منطقة احد": { main: "#845EF7", light: "#F3F0FF" },
  "منطقة أحد": { main: "#845EF7", light: "#F3F0FF" },
  "منطقة ماركا": { main: "#F06595", light: "#FFF0F6" },
  "منطقة النصر": { main: "#20C997", light: "#E6FCF5" },
  "منطقة تلاع العلي وام السماق وخلدا": { main: "#A1887F", light: "#EFEBE9" },
  "منطقة تلاع العلي وأم السماق وخلدا": { main: "#A1887F", light: "#EFEBE9" },
  "مخالفات حسب مؤشرات الأداء": { main: "#22B8CF", light: "#E3FAFC" },
};

/* =========================================================
   COMPONENT
========================================================= */

export default function DistrictCard({
  district,
  data,
}: {
  district: string;
  data: any;
}) {
  const { data: session } = useSession();

  const isAdmin =
    session?.user?.role === "Admin" || session?.user?.roleId === 1;

  const [failureModalOpened, setFailureModalOpened] = useState(false);
  const [selectedFailures, setSelectedFailures] = useState<FailureItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedStatusKey, setSelectedStatusKey] = useState("");
  const [opened, setOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [summaryModalOpened, setSummaryModalOpened] = useState(false);
  const [usersModalOpened, setUsersModalOpened] = useState(false);

  const usersModalRef = useRef<HTMLDivElement | null>(null);

  /* لون المنطقة يظهر كتكحيلة في الزاوية فقط */
  const districtTheme = districtColors[district] || {
    main: "#74A7FF",
    light: SURFACE_2,
  };
  const [accumulatedTotal, setAccumulatedTotal] = useState(0);
  const [accumulatedIds, setAccumulatedIds] = useState<(string | number)[]>([]);
  const [accumulatedLoading, setAccumulatedLoading] = useState(true);
  const [accumulatedModalOpened, setAccumulatedModalOpened] = useState(false);
  useEffect(() => {
    const controller = new AbortController();

    const fetchAccumulated = async () => {
      try {
        setAccumulatedLoading(true);

        const response = await fetch(
          `/api/kpis/district/${encodeURIComponent(
            district.replace(/^منطقة\s*/i, "").trim(),
          )}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch accumulated failures");
        }

        const result = await response.json();

        setAccumulatedTotal(Number(result.total ?? 0));
        setAccumulatedIds(result.ids ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Accumulated failures error:", error);
          setAccumulatedTotal(0);
          setAccumulatedIds([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setAccumulatedLoading(false);
        }
      }
    };

    fetchAccumulated();

    return () => controller.abort();
  }, [district]);
  /* NORMALIZED BLOCKS */

  const normalizedBlocks = useMemo(() => {
    const blocks: Record<string, any> = { ...(data?.blocks || {}) };

    const kpiGroups = normalizeKpiGroups(data);

    Object.entries(kpiGroups).forEach(([key, value]) => {
      const existingKey = Object.keys(blocks).find(
        (blockKey) => normalizeBlockName(blockKey) === normalizeBlockName(key),
      );

      if (existingKey) return;

      blocks[key] = value;
    });

    return blocks;
  }, [data]);

  /* METRIC BLOCKS */

  const metricBlocks = useMemo(() => {
    const entries = Object.entries(normalizedBlocks);

    const normalBlocks = entries.filter(
      ([blockName]) => !isKpiBlock(blockName),
    );

    const source = normalBlocks.length ? normalBlocks : entries;

    return Object.fromEntries(source);
  }, [normalizedBlocks]);

  /* DISTRICT STATUS TOTALS */

  const districtStatuses = useMemo(() => {
    const result: Record<string, number> = {};

    Object.keys(statusConfig).forEach((status) => {
      result[status] = 0;
    });

    Object.values(metricBlocks).forEach((block: any) => {
      Object.entries(block?.statuses || {}).forEach(([status, statusData]) => {
        if (result[status] === undefined) result[status] = 0;

        result[status] += Number((statusData as any)?.total ?? 0);
      });
    });

    return result;
  }, [metricBlocks]);

  /* USER ACHIEVEMENT
     الإنجاز يعتمد على:
     PendingFieldMonitorVerification + Resolved
     + PendingSupervisorReview + Rejected */

  const rankedUsers = useMemo(() => {
    const users: Record<
      string,
      {
        name: string;
        resolved: number;
        field: number;
        review: number;
        rejected: number;
        total: number;
        ids: (string | number)[];
      }
    > = {};

    Object.entries(metricBlocks).forEach(([, block]) => {
      Object.entries(block?.statuses || {}).forEach(([status, statusData]) => {
        if (!isAchievementStatus(status)) return;

        Object.entries((statusData as any)?.users || {}).forEach(
          ([user, rawUserData]) => {
            const userData = rawUserData as UserData;
            const count = getUserCount(userData);

            if (!users[user]) {
              users[user] = {
                name: user,
                resolved: 0,
                field: 0,
                review: 0,
                rejected: 0,
                total: 0,
                ids: [],
              };
            }

            if (status === "Resolved") users[user].resolved += count;

            if (status === "PendingFieldMonitorVerification") {
              users[user].field += count;
            }

            if (status === "PendingSupervisorReview") {
              users[user].review += count;
            }

            if (status === "Rejected") users[user].rejected += count;

            users[user].ids.push(...(userData.ids || []));
          },
        );
      });
    });

    return Object.values(users)
      .map((user) => ({
        ...user,
        total: user.resolved + user.field + user.review + user.rejected,
        ids: [...new Set(user.ids)],
      }))
      .sort((a, b) => b.total - a.total);
  }, [metricBlocks]);

  /* TOTALS */

  const calculatedTotal = useMemo(
    () =>
      Object.values(metricBlocks).reduce(
        (sum: number, block: any) => sum + Number(block?.total || 0),
        0,
      ),
    [metricBlocks],
  );

  const districtTotal = Number(data?.total || 0) || calculatedTotal;

  /* ACHIEVEMENT */

  const fieldCount = districtStatuses["PendingFieldMonitorVerification"] || 0;
  const resolvedCount = districtStatuses["Resolved"] || 0;
  const reviewCount = districtStatuses["PendingSupervisorReview"] || 0;
  const rejectedCount = districtStatuses["Rejected"] || 0;

  const achievementCount =
    fieldCount + resolvedCount + reviewCount + rejectedCount;

  /* المنجز = تم الحل + مراجعة AVTR + مرفوض + انتظار التحقق الميداني
   (نفس achievementCount) */
  const completedCount = achievementCount;

  /* المتبقي لليوم = رفض الحل + قيد التنفيذ + في انتظار القبول */
  const remainingCount =
    (districtStatuses["ResolutionRejected"] || 0) +
    (districtStatuses["InProgress"] || 0) +
    (districtStatuses["PendingSpValidation"] || 0);
  const achievement = districtTotal
    ? Number(((achievementCount / districtTotal) * 100).toFixed(1))
    : 0;

  /* OPEN STATUS FAILURES */

  const openStatusFailures = (status: string) => {
    const failureMap = new Map<string | number, FailureItem>();

    Object.entries(metricBlocks).forEach(([blockName, blockData]) => {
      const statusData = (blockData as any)?.statuses?.[status];

      if (!statusData) return;

      Object.entries(statusData.users || {}).forEach(([user, rawUserData]) => {
        const userData = rawUserData as UserData;

        (userData.ids || []).forEach((id) => {
          if (failureMap.has(id)) return;

          failureMap.set(id, {
            id,
            district,
            districtName: district,
            block: blockName,
            blockName,
            status,
            userName: user,
          });
        });
      });

      (statusData.ids || []).forEach((id: string | number) => {
        if (failureMap.has(id)) return;

        failureMap.set(id, {
          id,
          district,
          districtName: district,
          block: blockName,
          blockName,
          status,
        });
      });
    });

    const failures = sortFailuresByBlock(Array.from(failureMap.values()));

    setSelectedFailures(failures);
    setSelectedStatus(getStatusLabel(status));
    setSelectedStatusKey(status);
    setFailureModalOpened(true);
  };

  /* OPEN USER STATUS FAILURES */

  const openUserStatusFailures = (
    user: string,
    status: string,
    selectedBlockName: string,
  ) => {
    const failureMap = new Map<string | number, FailureItem>();

    const blockData =
      normalizedBlocks[selectedBlockName] ?? metricBlocks[selectedBlockName];

    if (!blockData) {
      setSelectedUser({ name: user, failures: [] });
      setOpened(true);
      return;
    }

    const currentStatus = blockData?.statuses?.[status];

    if (!currentStatus) {
      setSelectedUser({ name: user, failures: [] });
      setOpened(true);
      return;
    }

    const currentUser = currentStatus?.users?.[user] as UserData | undefined;

    if (currentUser) {
      (currentUser.ids || []).forEach((id) => {
        if (failureMap.has(id)) return;

        failureMap.set(id, {
          id,
          district,
          districtName: district,
          block: selectedBlockName,
          blockName: selectedBlockName,
          status,
          userName: user,
        });
      });
    }

    const failures = Array.from(failureMap.values());

    failures.sort((a, b) => String(a.id).localeCompare(String(b.id), "ar"));

    setSelectedUser({ name: user, failures });
    setOpened(true);
  };

  /* OPEN ACHIEVEMENT USER */

  const openAchievementUser = (userName: string) => {
    const failureMap = new Map<string | number, FailureItem>();

    Object.entries(metricBlocks).forEach(([blockName, blockData]) => {
      Object.entries(blockData?.statuses || {}).forEach(
        ([status, statusData]) => {
          if (!isAchievementStatus(status)) return;

          const userData = (statusData as any)?.users?.[userName] as
            | UserData
            | undefined;

          if (!userData) return;

          (userData.ids || []).forEach((id) => {
            if (failureMap.has(id)) return;

            failureMap.set(id, {
              id,
              district,
              districtName: district,
              block: blockName,
              blockName,
              status,
              userName,
            });
          });
        },
      );
    });

    const failures = sortFailuresByBlock(Array.from(failureMap.values()));

    setSelectedUser({ name: userName, failures });
    setOpened(true);
  };

  /* EXPORT EXCEL
     نفس معادلة الإنجاز:
     Field Verification + Resolved + AVTR Review + Rejected */

  const exportDistrictExcel = () => {
    const rows: any[] = [];

    Object.entries(normalizedBlocks).forEach(([block, blockData]) => {
      const isKpiGroup = isKpiBlock(block);
      const displayName = getBlockDisplayName(block);

      const row: any = {
        المنطقة: district,
        الحي: isKpiGroup ? `مؤشر الأداء: ${displayName}` : displayName,
        "إجمالي المخالفات": Number((blockData as any)?.total || 0),
        "في انتظار القبول": 0,
        "قيد التنفيذ": 0,
        "قيد مراجعة AVTR": 0,
        "في انتظار التحقق الميداني": 0,
        "تم الحل": 0,
        "AVTR قبلت الرفض": 0,
        مرفوض: 0,
      };

      const statusMap: Record<string, string> = {
        PendingSpValidation: "في انتظار القبول",
        InProgress: "قيد التنفيذ",
        PendingSupervisorReview: "قيد مراجعة AVTR",
        PendingFieldMonitorVerification: "في انتظار التحقق الميداني",
        Resolved: "تم الحل",
        ResolutionRejected: "AVTR قبلت الرفض",
        Rejected: "مرفوض",
      };

      Object.entries((blockData as any)?.statuses || {}).forEach(
        ([status, statusData]) => {
          const key = statusMap[status];

          if (key) row[key] = Number((statusData as any)?.total || 0);
        },
      );

      const field = Number(row["في انتظار التحقق الميداني"] || 0);
      const resolved = Number(row["تم الحل"] || 0);
      const review = Number(row["قيد مراجعة AVTR"] || 0);
      const rejected = Number(row["مرفوض"] || 0);
      const total = Number(row["إجمالي المخالفات"] || 0);

      row["نسبة الإنجاز"] = total
        ? `${(((field + resolved + review + rejected) / total) * 100).toFixed(1)}%`
        : "0%";

      rows.push(row);
    });

    if (!rows.length) return;

    const total: any = {
      المنطقة: "",
      الحي: "المجموع",
      "إجمالي المخالفات": districtTotal,
      "في انتظار القبول": districtStatuses["PendingSpValidation"] || 0,
      "قيد التنفيذ": districtStatuses["InProgress"] || 0,
      "قيد مراجعة AVTR": reviewCount,
      "في انتظار التحقق الميداني": fieldCount,
      "تم الحل": resolvedCount,
      "AVTR قبلت الرفض": districtStatuses["ResolutionRejected"] || 0,
      مرفوض: rejectedCount,
    };

    total["نسبة الإنجاز"] = districtTotal
      ? `${(
          ((fieldCount + resolvedCount + reviewCount + rejectedCount) /
            districtTotal) *
          100
        ).toFixed(1)}%`
      : "0%";

    rows.push(total);

    const sheet = XLSX.utils.json_to_sheet(rows);

    sheet["!views"] = [{ rightToLeft: true }];

    sheet["!cols"] = [
      { wch: 24 },
      { wch: 42 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 24 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, sheet, district.substring(0, 31));

    XLSX.writeFile(workbook, `تقرير_${district}.xlsx`);
  };

  /* EXPORT USERS IMAGE */

  const exportUsersImage = async () => {
    if (!usersModalRef.current) return;

    try {
      const image = await toPng(usersModalRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");

      link.download = `إنجازات_المستخدمين_${district}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error(error);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  const metals = [
    { from: "#EBD59B", to: "#B8935A", ring: "#D9BC84" },
    { from: "#E6E9EE", to: "#98A1B0", ring: "#C3CAD5" },
    { from: "#E3B48A", to: "#9C6A3E", ring: "#CF9A6E" },
  ];

  const achievementStats = [
    { label: "انتظار التحقق", value: fieldCount },
    { label: "تم الحل", value: resolvedCount },
    { label: "مراجعة AVTR", value: reviewCount },
    { label: "مرفوض", value: rejectedCount },
  ];

  const thStyle = {
    color: GOLD_LIGHT,
    fontWeight: 600,
    background: hexA(GOLD, 0.1),
    borderBottom: `1px solid ${hexA(GOLD, 0.35)}`,
  };

  return (
    <Box
      dir="rtl"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 22,
        background: SURFACE,
        color: TEXT,
        fontFamily: FONT,
        border: `1px solid ${LINE_STRONG}`,
        boxShadow: "0 30px 60px -30px rgba(10,20,45,.55)",
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <Box
        p="lg"
        style={{
          position: "relative",
          background: `radial-gradient(55% 150% at 100% 0%, ${hexA(
            districtTheme.main,
            0.42,
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
            background: `linear-gradient(90deg, ${districtTheme.main}, ${hexA(districtTheme.main, 0)})`,
          }}
        />

        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
            <Box
              style={{
                width: 46,
                height: 46,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: 14,
                color: GOLD_LIGHT,
                background: hexA(GOLD, 0.1),
                border: `1px solid ${hexA(GOLD, 0.45)}`,
              }}
            >
              <IconBuildings size={22} stroke={1.5} />
            </Box>

            <Box style={{ minWidth: 0 }}>
              <Text
                fw={700}
                lh={1.3}
                c={TEXT}
                truncate
                style={{ fontSize: 19 }}
              >
                {district}
              </Text>

              <Text size="xs" fw={500} c={MUTED}>
                ملخص المخالفات والأداء
              </Text>
            </Box>
          </Group>

          <Group gap="md" wrap="nowrap">
            <ActionIcon
              variant="transparent"
              radius="xl"
              size={38}
              onClick={exportDistrictExcel}
              aria-label="تصدير إلى Excel"
              style={{
                color: GOLD_LIGHT,
                border: `1px solid ${hexA(GOLD, 0.5)}`,
                transition: "all .18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = hexA(GOLD, 0.16);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <IconDownload size={17} stroke={1.6} />
            </ActionIcon>
          </Group>
        </Group>

        <Box
          mt="md"
          pt="md"
          style={{
            borderTop: `1px solid ${LINE}`,
          }}
        >
          {/* نسبة الإنجاز */}
          <Box
            mb="sm"
            p="sm"
            style={{
              borderRadius: 12,
              background:
                "linear-gradient(135deg, rgba(39,65,105,.22), rgba(20,35,58,.32))",
              border: "1px solid rgba(112,153,205,.18)",
            }}
          >
            <Group justify="space-between" align="center" mb={9}>
              <Group gap={8}>
                <Box
                  w={28}
                  h={28}
                  style={{
                    borderRadius: 8,
                    background: "rgba(91,151,218,.13)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconChartBar size={16} color="#83B7EC" />
                </Box>

                <Text size="sm" fw={700} c="#DCE8F5">
                  نسبة الإنجاز
                </Text>
              </Group>

              <Text
                size="lg"
                fw={800}
                c="#8DCDBB"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {achievement}%
              </Text>
            </Group>

            <Progress
              value={achievement}
              size={7}
              radius="xl"
              color="#55B99A"
              styles={{
                root: { backgroundColor: "rgba(255,255,255,.08)" },
                section: { transition: "width .5s ease" },
              }}
            />

            <Group justify="space-between" mt={8}>
              <Group gap={5}>
                <Box
                  w={7}
                  h={7}
                  style={{ borderRadius: 50, background: "#55B99A" }}
                />
                <Text size="xs" c="#A7B9CC">
                  المنجز: {completedCount}
                </Text>
              </Group>

              <Group gap={5}>
                <Box
                  w={7}
                  h={7}
                  style={{ borderRadius: 50, background: "#D6A85C" }}
                />
                <Text size="xs" c="#A7B9CC">
                  المتبقي: {remainingCount}
                </Text>
              </Group>
            </Group>
          </Box>

          {/* بطاقات الإحصائيات */}
          <SimpleGrid
            cols={{ base: 3, sm: 3, md: 5 }}
            spacing="xs"
            verticalSpacing="xs"
          >
            {/* الإجمالي (أزرق) */}
            <Box
              p="sm"
              style={{
                borderRadius: 11,
                minHeight: 86,
                background:
                  "linear-gradient(145deg, rgba(65,111,166,.13), rgba(35,57,83,.18))",
                border: "1px solid rgba(104,157,213,.20)",
              }}
            >
              <Group justify="space-between" align="center" mb={8}>
                <Text size="md" fw={600} c="#AFC2D8">
                مخالفات اليوم
                </Text>
                <IconChartBar size={17} color="#79AEE3" />
              </Group>

              <Text size="xl" fw={800} c="#E5EFFA" lh={1.1}>
                {districtTotal}
              </Text>
            </Box>

            {/* المنجز (أخضر) */}
            <Box
              p="sm"
              style={{
                borderRadius: 11,
                minHeight: 86,
                background:
                  "linear-gradient(145deg, rgba(51,139,113,.12), rgba(30,77,67,.18))",
                border: "1px solid rgba(85,185,154,.20)",
              }}
            >
              <Group justify="space-between" align="center" mb={8}>
                <Text size="md" fw={600} c="#AFC9C1">
                  المنجز اليوم
                </Text>
                <IconTrophy size={17} color="#65C5A4" />
              </Group>

              <Text size="xl" fw={800} c="#76D0B1" lh={1.1}>
                {completedCount}
              </Text>
            </Box>

            {/* المتبقي (كهرماني) */}
            <Box
              p="sm"
              style={{
                borderRadius: 11,
                minHeight: 86,
                background:
                  "linear-gradient(145deg, rgba(166,124,57,.11), rgba(94,72,37,.17))",
                border: "1px solid rgba(214,168,92,.20)",
              }}
            >
              <Group justify="space-between" align="center" mb={8}>
                <Text size="md" fw={600} c="#C9B995">
                  المتبقي اليوم
                </Text>
                <IconAlertCircle size={17} color="#D6AD68" />
              </Group>

              <Text size="xl" fw={800} c="#E5BD78" lh={1.1}>
                {remainingCount}
              </Text>
            </Box>
            {/* المخالفات المتأخرة (أحمر + فلاش) */}
         {/* المخالفات المتأخرة (أحمر + فلاش) */}
<Box
  component={motion.button}
  onClick={() => setAccumulatedModalOpened(true)}
  animate={
    accumulatedTotal > 0 && !accumulatedLoading
      ? {
          opacity: [1, 0.85, 1],
          boxShadow: [
            "0 0 0 0 rgba(232,122,122,0)",
            "0 0 12px 2px rgba(232,122,122,.35)",
            "0 0 0 0 rgba(232,122,122,0)",
          ],
        }
      : {
          opacity: 1,
          boxShadow: "0 0 0 0 rgba(232,122,122,0)",
        }
  }
  transition={{
    duration: 2,
    repeat: accumulatedTotal > 0 && !accumulatedLoading ? Infinity : 0,
    ease: "easeInOut",
    times: [0, 0.5, 1],
  }}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  p="sm"
  style={{
    borderRadius: 11,
    minHeight: 86,
    width: "100%",
    textAlign: "right",
    cursor: "pointer",
    color: "white",
    background:
      "linear-gradient(145deg, rgba(190,80,80,.16), rgba(100,40,45,.24))",
    border: "1px solid rgba(232,122,122,.34)",
  }}
>
  <Group justify="space-between" align="center" mb={8}>
    <Text size="xs" fw={600} c="#E8B4B4">
      المخالفات المتأخرة
    </Text>
    <IconAlertCircle size={17} color="#EE8A8A" />
  </Group>

  <Group justify="space-between" align="center">
    <Text size="xl" fw={800} c="#F5AAAA" lh={1.1}>
      {accumulatedLoading ? "..." : accumulatedTotal}
    </Text>
    <IconChevronLeft size={15} color="#EE8A8A" />
  </Group>
</Box>
            <Box
              onClick={() => setUsersModalOpened(true)}
              p="sm"
              style={{
                borderRadius: 11,
                minHeight: 86,
                cursor: "pointer",
                background:
                  "linear-gradient(145deg, rgba(59,130,246,.13), rgba(30,64,120,.20))",
                border: "1px solid rgba(96,165,250,.25)",
              
              }}
            >
              <Group justify="space-between" align="center" mb={8}>
                <Text size="md" fw={600} c="#B8D2F0">
                  أداء المشرفين
                </Text>
                <IconTrophy size={17} color="#60A5FA" />
              </Group>

              <Group justify="space-between" align="flex-end">
                <Text size="xl" fw={800} c="#7DB8FF" lh={1.1}>
                  {completedCount}
                </Text>
              </Group>
            </Box>

          </SimpleGrid>
        </Box>
      </Box>

      {/* =====================================================
          BODY
      ===================================================== */}

      <Box
        p="lg"
        style={{
          background: `radial-gradient(45% 35% at 0% 100%, ${hexA(
            districtTheme.main,
            0.16,
          )} 0%, transparent 70%)`,
        }}
      >
        <SimpleGrid cols={{ base: 2, sm: 4, md: 4 }} spacing={8} mb="xl">
          {Object.entries(districtStatuses).map(([status, count]) => {
            const color = getStatusColor(status);

            return (
              <Box
                key={status}
                onClick={() => openStatusFailures(status)}
                px={10}
                py={9}
                {...lift}
                style={{
                  cursor: "pointer",
                  borderRadius: 12,
                  background: SURFACE_2,
                  border: `1px solid ${LINE}`,
                  borderInlineStart: `3px solid ${shade(color, 5)}`,
                  transition: "all .18s ease",
                }}
              >
                <Group justify="space-between" gap={6} wrap="nowrap">
                  <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                    <Box style={{ display: "flex", color: shade(color, 4) }}>
                      {getStatusIcon(status)}
                    </Box>

                    <Text size="11px" fw={600} c={MUTED} truncate>
                      {getStatusLabel(status)}
                    </Text>
                  </Group>

                  <Text fw={800} c={TEXT} style={{ fontSize: 16, ...tabular }}>
                    {count.toLocaleString("en-US")}
                  </Text>
                </Group>
              </Box>
            );
          })}
        </SimpleGrid>

        {/* ---------- BLOCKS + KPI ---------- */}

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={12}>
          {Object.entries(normalizedBlocks)
            .sort(
              ([, a], [, b]) =>
                Number((b as any)?.total || 0) - Number((a as any)?.total || 0),
            )
            .map(([block, blockData]) => {
              const isKpiGroup = isKpiBlock(block);
              const displayName = getBlockDisplayName(block);

              return (
                <Box
                  key={block}
                  p="sm"
                  {...lift}
                  style={{
                    borderRadius: 16,
                    background: isKpiGroup
                      ? `linear-gradient(180deg, ${hexA(GOLD, 0.1)}, ${SURFACE_2})`
                      : SURFACE_2,
                    border: `1px solid ${LINE}`,
                    transition: "all .18s ease",
                  }}
                >
                  <Group
                    justify="space-between"
                    mb={10}
                    pb={10}
                    wrap="nowrap"
                    style={{ borderBottom: `1px solid ${LINE}` }}
                  >
                    <Group gap={10} wrap="nowrap" style={{ minWidth: 0 }}>
                      <Box
                        style={{
                          width: 32,
                          height: 32,
                          flexShrink: 0,
                          display: "grid",
                          placeItems: "center",
                          borderRadius: 10,
                          color: isKpiGroup ? GOLD_LIGHT : MUTED,
                          background: isKpiGroup
                            ? hexA(GOLD, 0.14)
                            : "rgba(255,255,255,.05)",
                          border: `1px solid ${
                            isKpiGroup ? hexA(GOLD, 0.4) : LINE
                          }`,
                        }}
                      >
                        {isKpiGroup ? (
                          <IconChartBar size={16} stroke={1.6} />
                        ) : (
                          <IconMapPin size={16} stroke={1.6} />
                        )}
                      </Box>

                      <Box style={{ minWidth: 0 }}>
                        <Text
                          fw={700}
                          c={TEXT}
                          truncate
                          style={{ fontSize: 14 }}
                        >
                          {isKpiGroup ? displayName : `حي ${displayName}`}
                        </Text>

                        {isKpiGroup && (
                          <Text size="10px" c={GOLD} fw={600}>
                            مؤشر الأداء
                          </Text>
                        )}
                      </Box>
                    </Group>

                    <Text
                      fw={800}
                      c={isKpiGroup ? GOLD_LIGHT : TEXT}
                      style={{ fontSize: 19, ...tabular }}
                    >
                      {Number((blockData as any)?.total || 0).toLocaleString(
                        "en-US",
                      )}
                    </Text>
                  </Group>

                  <Stack gap={6}>
                    {Object.entries((blockData as any)?.statuses || {})
                      .sort(
                        ([, a], [, b]) =>
                          Number((b as any)?.total || 0) -
                          Number((a as any)?.total || 0),
                      )
                      .map(([status, statusData]) => {
                        const statusColor = getStatusColor(status);
                        const usersEntries = Object.entries(
                          (statusData as any)?.users || {},
                        );

                        return (
                          <Box
                            key={status}
                            px={9}
                            py={7}
                            style={{
                              borderRadius: 10,
                              background: SURFACE_3,
                              borderInlineStart: `2px solid ${shade(
                                statusColor,
                                5,
                              )}`,
                            }}
                          >
                            <Group justify="space-between" align="center">
                              <Group
                                gap={6}
                                wrap="nowrap"
                                style={{ minWidth: 0 }}
                              >
                                <Box
                                  style={{
                                    display: "flex",
                                    color: shade(statusColor, 4),
                                  }}
                                >
                                  {getStatusIcon(status)}
                                </Box>

                                <Text size="11px" fw={600} c={TEXT} truncate>
                                  {getStatusLabel(status)}
                                </Text>
                              </Group>

                              <CountPill color={statusColor}>
                                {Number(
                                  (statusData as any)?.total || 0,
                                ).toLocaleString("en-US")}
                              </CountPill>
                            </Group>

                            {!summaryOnlyStatuses.includes(status) &&
                              usersEntries.length > 0 && (
                                <Stack mt={6} gap={2}>
                                  {usersEntries
                                    .sort(
                                      ([, a], [, b]) =>
                                        getUserCount(b as UserData) -
                                        getUserCount(a as UserData),
                                    )
                                    .map(([user, rawUserData]) => {
                                      const userCount = getUserCount(
                                        rawUserData as UserData,
                                      );

                                      return (
                                        <Group
                                          key={user}
                                          justify="space-between"
                                          align="center"
                                          gap={5}
                                          px={6}
                                          py={4}
                                          onClick={() =>
                                            openUserStatusFailures(
                                              user,
                                              status,
                                              block,
                                            )
                                          }
                                          style={{
                                            cursor: "pointer",
                                            borderRadius: 8,
                                            transition: "all .15s ease",
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.background =
                                              "rgba(255,255,255,.06)";
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.background =
                                              "transparent";
                                          }}
                                        >
                                          <Group
                                            gap={6}
                                            wrap="nowrap"
                                            style={{ minWidth: 0, flex: 1 }}
                                          >
                                            <Box
                                              style={{
                                                display: "flex",
                                                color: FAINT,
                                              }}
                                            >
                                              <IconUser
                                                size={12}
                                                stroke={1.6}
                                              />
                                            </Box>

                                            <Text
                                              size="11px"
                                              fw={500}
                                              c={MUTED}
                                              truncate
                                            >
                                              {user}
                                            </Text>
                                          </Group>

                                          <Text
                                            size="11px"
                                            fw={700}
                                            c={TEXT}
                                            style={tabular}
                                          >
                                            {userCount.toLocaleString("en-US")}
                                          </Text>
                                        </Group>
                                      );
                                    })}
                                </Stack>
                              )}
                          </Box>
                        );
                      })}
                  </Stack>
                </Box>
              );
            })}
        </SimpleGrid>
      </Box>

      {/* =====================================================
          USER STATUS MODAL
      ===================================================== */}

      <Modal
        dir="rtl"
        {...modalProps}
        opened={opened}
        onClose={() => setOpened(false)}
        size="md"
        title={selectedUser ? `مخالفات ${selectedUser.name}` : ""}
      >
        <Stack gap="sm">
          <Group justify="space-between">
            <Box>
              <Text size="xs" c={MUTED}>
                عدد المخالفات
              </Text>

              <Text
                fw={800}
                c={GOLD_LIGHT}
                style={{ fontSize: 32, lineHeight: 1.1, ...tabular }}
              >
                {selectedUser?.failures?.length || 0}
              </Text>
            </Box>

            <Button
              size="xs"
              radius="xl"
              variant="default"
              leftSection={<IconCopy size={15} stroke={1.6} />}
              style={goldBtn}
              onClick={() => {
                const text = (selectedUser?.failures || [])
                  .map((item) => {
                    const blockName = String(
                      item.blockName ?? item.block ?? "",
                    );

                    return `${item.id} - ${
                      isKpiBlock(blockName)
                        ? `مؤشر الأداء: ${getBlockDisplayName(blockName)}`
                        : blockName
                    }`;
                  })
                  .join("\n");

                navigator.clipboard.writeText(text);
              }}
            >
              نسخ
            </Button>
          </Group>

          <Divider color={LINE} />

          <ScrollArea h={450} offsetScrollbars>
            <Stack gap={6}>
              {selectedUser?.failures?.map((item, index) => {
                const blockName = String(item.blockName ?? item.block ?? "");
                const isKpi = isKpiBlock(blockName);
                const displayBlock = getBlockDisplayName(blockName);
                const color = getStatusColor(item.status || "");

                return (
                  <Box
                    key={`${item.id}-${index}`}
                    px="sm"
                    py={9}
                    style={{
                      borderRadius: 12,
                      background: SURFACE_2,
                      border: `1px solid ${LINE}`,
                      borderInlineStart: `3px solid ${shade(color, 5)}`,
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Text
                          fw={800}
                          c={TEXT}
                          style={{ fontSize: 15, ...tabular }}
                        >
                          {item.id}
                        </Text>

                        <Box>
                          <Text size="9px" c={FAINT}>
                            {isKpi ? "مؤشر الأداء" : "الحي"}
                          </Text>

                          <Text size="xs" fw={600} c={MUTED}>
                            {displayBlock || "غير محدد"}
                          </Text>
                        </Box>
                      </Group>

                      <CountPill color={color}>
                        {getStatusLabel(item.status || "")}
                      </CountPill>
                    </Group>
                  </Box>
                );
              })}

              {!selectedUser?.failures?.length && (
                <Box
                  p="xl"
                  style={{
                    borderRadius: 14,
                    background: SURFACE_2,
                    border: `1px dashed ${LINE_STRONG}`,
                  }}
                >
                  <Text ta="center" size="sm" c={MUTED}>
                    لا توجد مخالفات
                  </Text>
                </Box>
              )}
            </Stack>
          </ScrollArea>
        </Stack>
      </Modal>

      {/* =====================================================
          SUMMARY MODAL
      ===================================================== */}

      <Modal
        dir="rtl"
        {...modalProps}
        opened={summaryModalOpened}
        onClose={() => setSummaryModalOpened(false)}
        size="lg"
        title="ملخص حالات المخالفات"
      >
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
          {Object.entries(districtStatuses).map(([status, count]) => {
            const color = getStatusColor(status);

            return (
              <Box
                key={status}
                px="sm"
                py={12}
                {...lift}
                onClick={() => {
                  setSummaryModalOpened(false);
                  openStatusFailures(status);
                }}
                style={{
                  cursor: "pointer",
                  borderRadius: 14,
                  background: SURFACE_2,
                  border: `1px solid ${LINE}`,
                  borderInlineStart: `3px solid ${shade(color, 5)}`,
                  transition: "all .18s ease",
                }}
              >
                <Group justify="space-between" gap={5}>
                  <Text size="xs" fw={600} c={MUTED}>
                    {getStatusLabel(status)}
                  </Text>

                  <Text fw={800} c={TEXT} style={{ fontSize: 17, ...tabular }}>
                    {count.toLocaleString("en-US")}
                  </Text>
                </Group>
              </Box>
            );
          })}
        </SimpleGrid>
      </Modal>

      {/* =====================================================
          USERS ACHIEVEMENT MODAL
      ===================================================== */}

      <Modal
        dir="rtl"
        {...modalProps}
        opened={usersModalOpened}
        onClose={() => setUsersModalOpened(false)}
        size="lg"
        title="إنجازات المستخدمين"
      >
        <Group justify="flex-end" mb="xs">
          <ActionIcon
            variant="transparent"
            radius="xl"
            size={34}
            onClick={exportUsersImage}
            aria-label="تصدير كصورة"
            style={{
              color: GOLD_LIGHT,
              border: `1px solid ${hexA(GOLD, 0.5)}`,
            }}
          >
            <IconDownload size={16} stroke={1.6} />
          </ActionIcon>
        </Group>

        <Box ref={usersModalRef} p={6} style={{ background: SURFACE }}>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" mb="lg">
            {rankedUsers.slice(0, 3).map((user, index) => {
              const metal = metals[index];

              return (
                <Box
                  key={user.name}
                  px="sm"
                  py="md"
                  {...lift}
                  onClick={() => openAchievementUser(user.name)}
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    borderRadius: 16,
                    transition: "all .18s ease",
                    background: SURFACE_2,
                    border: `1px solid ${LINE}`,
                    borderTop: `3px solid ${metal.ring}`,
                  }}
                >
                  <Box
                    mx="auto"
                    style={{
                      width: 38,
                      height: 38,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "50%",
                      color: INK,
                      fontWeight: 800,
                      fontSize: 17,
                      background: `linear-gradient(145deg, ${metal.from}, ${metal.to})`,
                    }}
                  >
                    {index + 1}
                  </Box>

                  <Text size="sm" fw={600} c={TEXT} mt={10} truncate>
                    {user.name}
                  </Text>

                  <Text
                    fw={800}
                    c={GOLD_LIGHT}
                    style={{ fontSize: 26, lineHeight: 1.2, ...tabular }}
                  >
                    {user.total}
                  </Text>
                </Box>
              );
            })}
          </SimpleGrid>

          <Table
            highlightOnHover
            withTableBorder
            fz="xs"
            dir="rtl"
            verticalSpacing={8}
            style={
              {
                borderRadius: 14,
                overflow: "hidden",
                "--table-border-color": LINE,
                "--table-hover-color": "rgba(255,255,255,.04)",
                background: SURFACE_2,
              } as CSSProperties
            }
          >
            <Table.Thead>
              <Table.Tr>
                {[
                  "#",
                  "المستخدم",
                  "تم الحل",
                  "انتظار التحقق",
                  "قيد مراجعة AVTR",
                  "مرفوض",
                  "الإجمالي",
                ].map((h) => (
                  <Table.Th key={h} style={thStyle}>
                    {h}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {rankedUsers.map((user, index) => (
                <Table.Tr
                  key={user.name}
                  style={{ cursor: "pointer" }}
                  onClick={() => openAchievementUser(user.name)}
                >
                  <Table.Td>
                    <Text
                      fw={700}
                      c={index < 3 ? GOLD_LIGHT : FAINT}
                      style={{ fontSize: 12, ...tabular }}
                    >
                      {index + 1}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Text size="xs" fw={600} c={TEXT} truncate>
                      {user.name}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Text size="xs" fw={600} c="green.4" style={tabular}>
                      {user.resolved}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Text size="xs" fw={600} c="blue.3" style={tabular}>
                      {user.field}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Text size="xs" fw={600} c="orange.4" style={tabular}>
                      {user.review}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Text size="xs" fw={600} c="red.4" style={tabular}>
                      {user.rejected}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Text
                      fw={800}
                      c={TEXT}
                      style={{ fontSize: 13, ...tabular }}
                    >
                      {user.total}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      </Modal>
      <Modal
        dir="rtl"
        {...modalProps}
        opened={accumulatedModalOpened}
        onClose={() => setAccumulatedModalOpened(false)}
        size="md"
        title={`المخالفات المتأخرة - ${district}`}
      >
        <Stack gap="md">
          <Box
            p="lg"
            style={{
              textAlign: "center",
              borderRadius: 16,
              background: SURFACE_2,
              border: `1px solid ${LINE}`,
            }}
          >
            <Text size="xs" c={MUTED} mb={6}>
              إجمالي المخالفات المتأخرة
            </Text>

            <Text
              fw={800}
              style={{
                fontSize: 38,
                color: "#74A7FF",
                ...tabular,
              }}
            >
              {accumulatedTotal.toLocaleString("en-US")}
            </Text>

            <Text size="xs" c={FAINT} mt={5}>
              رفض الحل · قيد التنفيذ · في انتظار القبول
            </Text>
          </Box>

          <Group justify="space-between">
            <Text fw={700} c={TEXT}>
              أرقام المخالفات
            </Text>

            <Button
              size="xs"
              radius="xl"
              variant="default"
              leftSection={<IconCopy size={14} />}
              style={goldBtn}
              disabled={!accumulatedIds.length}
              onClick={() => {
                navigator.clipboard.writeText(accumulatedIds.join("\n"));
              }}
            >
              نسخ الأرقام
            </Button>
          </Group>

          <ScrollArea h={350} offsetScrollbars>
            <Stack gap={6}>
              {accumulatedIds.map((id, index) => (
                <Box
                  key={`${id}-${index}`}
                  px="md"
                  py={10}
                  style={{
                    borderRadius: 10,
                    background: SURFACE_2,
                    border: `1px solid ${LINE}`,
                  }}
                >
                  <Group justify="space-between">
                    <Text size="xs" c={FAINT}>
                      {index + 1}
                    </Text>

                    <Text fw={700} c={TEXT} style={tabular}>
                      {id}
                    </Text>
                  </Group>
                </Box>
              ))}

              {!accumulatedIds.length && (
                <Text ta="center" c={MUTED} py="xl">
                  لا توجد مخالفات متراكمة
                </Text>
              )}
            </Stack>
          </ScrollArea>
        </Stack>
      </Modal>
      {/* =====================================================
          FAILURE LIST MODAL
      ===================================================== */}

      <FailureListModal
        opened={failureModalOpened}
        onClose={() => setFailureModalOpened(false)}
        title={`قائمة المخالفات - ${selectedStatus}`}
        failures={selectedFailures}
        status={selectedStatusKey}
      />
    </Box>
  );
}
