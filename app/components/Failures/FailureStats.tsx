"use client";

import { useMemo, useState } from "react";

import {
  Box,
  Card,
  Group,
  Text,
  Stack,
  SimpleGrid,
  Badge,
  Button,
  ActionIcon,
} from "@mantine/core";

import {
  IconFileSpreadsheet,
  IconFilter,
  IconPhone,
  IconWorld,
  IconUsers,
  IconChartBar,
  IconRefresh,
} from "@tabler/icons-react";

import * as XLSX from "xlsx-js-style";

import DistrictCard from "./DistrictCard";

import {
  statusConfig,
  summaryOnlyStatuses,
} from "./statusConfig";
import GeneralSummary from "./GeneralSummary";

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
   STATUS HELPERS
========================================================= */

type StatusKey = keyof typeof statusConfig;

const getStatusConfig = (status?: string | null) => {
  if (!status) return null;

  return status in statusConfig
    ? statusConfig[status as StatusKey]
    : null;
};

/* =========================================================
   SOURCE CONFIG
========================================================= */

const SOURCE_OPTIONS = [
  {
    key: "all",
    label: "الكل",
    description: "جميع مصادر المخالفات",
    icon: <IconChartBar size={20} />,
    color: "blue",
  },
  {
    key: "call-center",
    label: "Call Center",
    description: "مخالفات مركز الاتصال",
    icon: <IconPhone size={20} />,
    color: "cyan",
  },
  {
    key: "citizen-portal",
    label: "بوابة المواطن",
    description: "المخالفات الواردة من البوابة",
    icon: <IconWorld size={20} />,
    color: "green",
  },
  {
    key: "avtr-team",
    label: "AVTR Team",
    description: "المخالفات التابعة لفريق AVTR",
    icon: <IconUsers size={20} />,
    color: "violet",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function FailureStats({
  items = [],
}: FailureStatsProps) {
  const [complaintSourceFilter, setComplaintSourceFilter] =
    useState("all");

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredItems = useMemo(() => {
    if (complaintSourceFilter === "all") {
      return items;
    }

    return items.filter((item) => {
      if (complaintSourceFilter === "avtr-team") {
        return item.complaintSource == null;
      }

      return item.complaintSource === complaintSourceFilter;
    });
  }, [items, complaintSourceFilter]);

  /* =========================================================
     SOURCE COUNTS
  ========================================================= */

  const sourceCounts = useMemo(() => {
    let callCenter = 0;
    let citizenPortal = 0;
    let avtrTeam = 0;

    items.forEach((item) => {
      if (item.complaintSource === "call-center") {
        callCenter++;
      } else if (item.complaintSource === "citizen-portal") {
        citizenPortal++;
      } else if (item.complaintSource == null) {
        avtrTeam++;
      }
    });

    return {
      all: items.length,
      "call-center": callCenter,
      "citizen-portal": citizenPortal,
      "avtr-team": avtrTeam,
    };
  }, [items]);

  /* =========================================================
     STATS
  ========================================================= */

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

  /* =========================================================
     TOTAL STATUSES
  ========================================================= */

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

  /* =========================================================
     KPIs
  ========================================================= */

  const kpis = useMemo(() => {
    const total = filteredItems.length;

    const field =
      totalStatuses.PendingFieldMonitorVerification || 0;

    const resolved = totalStatuses.Resolved || 0;

    return {
      total,

      fieldPercentage: total
        ? ((field / total) * 100).toFixed(1)
        : "0.0",

      resolvedPercentage: total
        ? ((resolved / total) * 100).toFixed(1)
        : "0.0",
    };
  }, [filteredItems, totalStatuses]);

  const achievement = (
    Number(kpis.fieldPercentage) +
    Number(kpis.resolvedPercentage)
  ).toFixed(1);

  /* =========================================================
     ACTIVE SOURCE
  ========================================================= */

  const activeSource =
    SOURCE_OPTIONS.find(
      (source) => source.key === complaintSourceFilter
    ) ?? SOURCE_OPTIONS[0];

  /* =========================================================
     FOCUS DISTRICT
  ========================================================= */

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
      FIELD_VERIFICATION:
        "PendingFieldMonitorVerification",
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

    const getAchievement = (
      data: ReturnType<typeof createEmptyStats>
    ) => {
      if (!data.total) return "0.0";

      return (
        (
          ((data.fieldVerification +
            data.resolved +
            data.avtrRejectedSolution) /
            data.total) *
          100
        ).toFixed(1)
      );
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

      if (!firstItem) return null;

      const rawDate =
        firstItem.date ||
        firstItem.createdAt ||
        firstItem.created_at ||
        firstItem.violationDate ||
        firstItem.failureDate;

      if (!rawDate) return null;

      const date = new Date(rawDate);

      if (Number.isNaN(date.getTime())) {
        return null;
      }

      return date;
    };

    const reportDate = getReportDate();

    const getArabicDayName = (date: Date | null) => {
      if (!date) return "غير محدد";

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
      if (!date) return "غير محدد";

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
            users: Record<
              string,
              ReturnType<typeof createEmptyStats>
            >;
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

    const border = {
      top: {
        style: "thin",
        color: { rgb: COLORS.border },
      },
      bottom: {
        style: "thin",
        color: { rgb: COLORS.border },
      },
      left: {
        style: "thin",
        color: { rgb: COLORS.border },
      },
      right: {
        style: "thin",
        color: { rgb: COLORS.border },
      },
    };

    const titleStyle = {
      font: {
        name: "Arial",
        sz: 20,
        bold: true,
        color: { rgb: COLORS.white },
      },
      fill: {
        fgColor: { rgb: COLORS.primaryDark },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    };

    const subtitleStyle = {
      font: {
        name: "Arial",
        sz: 11,
        bold: true,
        color: { rgb: COLORS.text },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    };

    const headerStyle = {
      font: {
        name: "Arial",
        sz: 11,
        bold: true,
        color: { rgb: COLORS.white },
      },
      fill: {
        fgColor: { rgb: COLORS.primary },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border,
    };

    const districtStyle = {
      font: {
        name: "Arial",
        sz: 11,
        bold: true,
        color: { rgb: COLORS.text },
      },
      fill: {
        fgColor: { rgb: COLORS.district },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border,
    };

    const blockStyle = {
      font: {
        name: "Arial",
        sz: 10,
        bold: true,
        color: { rgb: COLORS.text },
      },
      fill: {
        fgColor: { rgb: COLORS.block },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border,
    };

    const userStyle = {
      font: {
        name: "Arial",
        sz: 10,
        color: { rgb: COLORS.text },
      },
      fill: {
        fgColor: { rgb: COLORS.user },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border,
    };

    const totalStyle = {
      font: {
        name: "Arial",
        sz: 10,
        bold: true,
        color: { rgb: COLORS.text },
      },
      fill: {
        fgColor: { rgb: COLORS.total },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border,
    };

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["تقرير المخالفات"],
        [
          `اليوم: ${getArabicDayName(
            reportDate
          )} | التاريخ: ${formatArabicDate(reportDate)}`,
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

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [headers],
      { origin: "A4" }
    );

    worksheet["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: 11 },
      },
      {
        s: { r: 1, c: 0 },
        e: { r: 1, c: 11 },
      },
    ];

    worksheet["A1"].s = titleStyle;
    worksheet["A2"].s = subtitleStyle;

    for (let c = 0; c < headers.length; c++) {
      const cell =
        worksheet[
          XLSX.utils.encode_cell({
            r: 3,
            c,
          })
        ];

      if (cell) {
        cell.s = headerStyle;
      }
    }

    let currentRow = 4;

    const districtMergeRanges: XLSX.Range[] = [];
    const blockMergeRanges: XLSX.Range[] = [];

    sortedDistricts.forEach(
      ([district, districtData]) => {
        const districtStartRow = currentRow;

        XLSX.utils.sheet_add_aoa(
          worksheet,
          [[
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
            `${getAchievement(
              districtData.stats
            )}%`,
          ]],
          {
            origin: `A${currentRow + 1}`,
          }
        );

        for (let c = 0; c < 12; c++) {
          const cell =
            worksheet[
              XLSX.utils.encode_cell({
                r: currentRow,
                c,
              })
            ];

          if (cell) {
            cell.s = totalStyle;
          }
        }

        currentRow++;

        const sortedBlocks = Object.entries(
          districtData.blocks
        ).sort(
          ([, a], [, b]) =>
            b.stats.total - a.stats.total
        );

        sortedBlocks.forEach(
          ([block, blockData]) => {
            const blockStartRow = currentRow;

            XLSX.utils.sheet_add_aoa(
              worksheet,
              [[
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
                `${getAchievement(
                  blockData.stats
                )}%`,
              ]],
              {
                origin: `A${currentRow + 1}`,
              }
            );

            for (let c = 0; c < 12; c++) {
              const cell =
                worksheet[
                  XLSX.utils.encode_cell({
                    r: currentRow,
                    c,
                  })
                ];

              if (cell) {
                cell.s = blockStyle;
              }
            }

            currentRow++;

            const sortedUsers = Object.entries(
              blockData.users
            ).sort(
              ([, a], [, b]) =>
                b.total - a.total
            );

            sortedUsers.forEach(
              ([user, userData]) => {
                XLSX.utils.sheet_add_aoa(
                  worksheet,
                  [[
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
                    `${getAchievement(
                      userData
                    )}%`,
                  ]],
                  {
                    origin: `A${currentRow + 1}`,
                  }
                );

                for (let c = 0; c < 12; c++) {
                  const cell =
                    worksheet[
                      XLSX.utils.encode_cell({
                        r: currentRow,
                        c,
                      })
                    ];

                  if (cell) {
                    cell.s = userStyle;
                  }
                }

                const achievementCell =
                  worksheet[
                    XLSX.utils.encode_cell({
                      r: currentRow,
                      c: 11,
                    })
                  ];

                if (achievementCell) {
                  achievementCell.s = {
                    ...userStyle,
                    fill: {
                      fgColor: {
                        rgb: COLORS.achievement,
                      },
                    },
                    font: {
                      name: "Arial",
                      sz: 10,
                      bold: true,
                      color: {
                        rgb: COLORS.text,
                      },
                    },
                  };
                }

                currentRow++;
              }
            );

            const blockEndRow =
              currentRow - 1;

            if (blockEndRow >= blockStartRow) {
              blockMergeRanges.push({
                s: {
                  r: blockStartRow,
                  c: 1,
                },
                e: {
                  r: blockEndRow,
                  c: 1,
                },
              });
            }
          }
        );

        const districtEndRow =
          currentRow - 1;

        if (districtEndRow >= districtStartRow) {
          districtMergeRanges.push({
            s: {
              r: districtStartRow,
              c: 0,
            },
            e: {
              r: districtEndRow,
              c: 0,
            },
          });
        }
      }
    );

    worksheet["!merges"]?.push(
      ...districtMergeRanges,
      ...blockMergeRanges
    );

    districtMergeRanges.forEach(
      (range) => {
        const cell =
          worksheet[
            XLSX.utils.encode_cell(range.s)
          ];

        if (cell) {
          cell.s = districtStyle;
        }
      }
    );

    blockMergeRanges.forEach(
      (range) => {
        const cell =
          worksheet[
            XLSX.utils.encode_cell(range.s)
          ];

        if (cell) {
          cell.s = blockStyle;
        }
      }
    );

    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 30 },
      { wch: 25 },
      { wch: 12 },
      { wch: 18 },
      { wch: 15 },
      { wch: 25 },
      { wch: 14 },
      { wch: 20 },
      { wch: 19 },
      { wch: 19 },
      { wch: 17 },
    ];

    worksheet["!rows"] = [];
    worksheet["!rows"][0] = {
      hpt: 36,
    };
    worksheet["!rows"][1] = {
      hpt: 24,
    };
    worksheet["!rows"][3] = {
      hpt: 42,
    };

    worksheet["!sheetViews"] = [
      {
        rightToLeft: true,
      },
    ];

    worksheet["!freeze"] = {
      xSplit: 0,
      ySplit: 4,
    };

    worksheet["!autofilter"] = {
      ref: `A4:L${currentRow}`,
    };

    worksheet["!pageSetup"] = {
      orientation: "landscape",
      fitToWidth: 1,
      fitToHeight: 0,
    };

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "تقرير المخالفات"
    );

    XLSX.writeFile(
      workbook,
      "تقرير_المخالفات.xlsx"
    );
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

    const districts: Record<
      string,
      SourceDistrictData
    > = {};

    items.forEach((item) => {
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

      const districtData =
        districts[district];

      const status =
        item.status || "Unknown";

      const isResolved =
        RESOLVED_STATUSES.has(status);

      if (
        item.complaintSource ===
        "call-center"
      ) {
        districtData.callCenter.total++;

        if (isResolved) {
          districtData.callCenter.resolved++;
        }
      } else if (
        item.complaintSource ===
        "citizen-portal"
      ) {
        districtData.citizenPortal.total++;

        if (isResolved) {
          districtData.citizenPortal.resolved++;
        }
      } else if (
        item.complaintSource == null
      ) {
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

    const sortedDistricts =
      Object.entries(districts).sort(
        ([, a], [, b]) =>
          b.total - a.total
      );

    const worksheet =
      XLSX.utils.aoa_to_sheet([]);

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

    const border = {
      top: {
        style: "thin",
        color: { rgb: COLORS.border },
      },
      bottom: {
        style: "thin",
        color: { rgb: COLORS.border },
      },
      left: {
        style: "thin",
        color: { rgb: COLORS.border },
      },
      right: {
        style: "thin",
        color: { rgb: COLORS.border },
      },
    };

    const titleStyle = {
      font: {
        name: "Arial",
        sz: 20,
        bold: true,
        color: { rgb: COLORS.white },
      },
      fill: {
        fgColor: {
          rgb: COLORS.primaryDark,
        },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    };

    const subtitleStyle = {
      font: {
        name: "Arial",
        sz: 11,
        bold: true,
        color: { rgb: COLORS.text },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    };

    const headerStyle = {
      font: {
        name: "Arial",
        sz: 10,
        bold: true,
        color: { rgb: COLORS.white },
      },
      fill: {
        fgColor: {
          rgb: COLORS.primary,
        },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border,
    };

    const normalStyle = {
      font: {
        name: "Arial",
        sz: 10,
        color: { rgb: COLORS.text },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border,
    };

    const callCenterStyle = {
      ...normalStyle,
      fill: {
        fgColor: {
          rgb: COLORS.callCenter,
        },
      },
    };

    const citizenPortalStyle = {
      ...normalStyle,
      fill: {
        fgColor: {
          rgb: COLORS.citizenPortal,
        },
      },
    };

    const avtrTeamStyle = {
      ...normalStyle,
      fill: {
        fgColor: {
          rgb: COLORS.avtrTeam,
        },
      },
    };

    const resolvedStyle = {
      ...normalStyle,
      fill: {
        fgColor: {
          rgb: COLORS.resolved,
        },
      },
      font: {
        name: "Arial",
        sz: 10,
        bold: true,
        color: { rgb: COLORS.text },
      },
    };

    const totalStyle = {
      ...normalStyle,
      fill: {
        fgColor: {
          rgb: COLORS.total,
        },
      },
      font: {
        name: "Arial",
        sz: 10,
        bold: true,
        color: { rgb: COLORS.text },
      },
    };

    const percentageStyle = {
      ...normalStyle,
      fill: {
        fgColor: {
          rgb: COLORS.resolved,
        },
      },
      font: {
        name: "Arial",
        sz: 10,
        bold: true,
        color: { rgb: COLORS.text },
      },
    };

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [
          "تقرير مصادر المخالفات حسب المناطق",
        ],
        [
          "Call Center | بوابة المواطن | AVTR Team",
        ],
        [],
      ],
      {
        origin: "A1",
      }
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

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [headers],
      {
        origin: "A4",
      }
    );

    worksheet["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: 9 },
      },
      {
        s: { r: 1, c: 0 },
        e: { r: 1, c: 9 },
      },
    ];

    worksheet["A1"].s =
      titleStyle;

    worksheet["A2"].s =
      subtitleStyle;

    for (
      let c = 0;
      c < headers.length;
      c++
    ) {
      const cell =
        worksheet[
          XLSX.utils.encode_cell({
            r: 3,
            c,
          })
        ];

      if (cell) {
        cell.s = headerStyle;
      }
    }

    let currentRow = 4;

    sortedDistricts.forEach(
      ([district, data]) => {
        const total = data.total;
        const resolved = data.resolved;

        const percentage = total
          ? (
              (resolved / total) *
              100
            ).toFixed(1)
          : "0.0";

        XLSX.utils.sheet_add_aoa(
          worksheet,
          [[
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
          ]],
          {
            origin: `A${
              currentRow + 1
            }`,
          }
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

        for (
          let c = 0;
          c < headers.length;
          c++
        ) {
          const cell =
            worksheet[
              XLSX.utils.encode_cell({
                r: currentRow,
                c,
              })
            ];

          if (cell) {
            cell.s =
              rowStyles[c];
          }
        }

        currentRow++;
      }
    );

    const grandTotal = {
      callCenter:
        createSourceStats(),

      citizenPortal:
        createSourceStats(),

      avtrTeam:
        createSourceStats(),

      total: 0,
      resolved: 0,
    };

    Object.values(districts).forEach(
      (district) => {
        grandTotal.callCenter.total +=
          district.callCenter.total;

        grandTotal.callCenter.resolved +=
          district.callCenter.resolved;

        grandTotal.citizenPortal.total +=
          district.citizenPortal.total;

        grandTotal.citizenPortal.resolved +=
          district.citizenPortal.resolved;

        grandTotal.avtrTeam.total +=
          district.avtrTeam.total;

        grandTotal.avtrTeam.resolved +=
          district.avtrTeam.resolved;

        grandTotal.total +=
          district.total;

        grandTotal.resolved +=
          district.resolved;
      }
    );

    const grandPercentage =
      grandTotal.total
        ? (
            (grandTotal.resolved /
              grandTotal.total) *
            100
          ).toFixed(1)
        : "0.0";

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [[
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
      ]],
      {
        origin: `A${
          currentRow + 1
        }`,
      }
    );

    for (
      let c = 0;
      c < headers.length;
      c++
    ) {
      const cell =
        worksheet[
          XLSX.utils.encode_cell({
            r: currentRow,
            c,
          })
        ];

      if (cell) {
        cell.s = {
          ...totalStyle,
          fill: {
            fgColor: {
              rgb:
                c === 2 ||
                c === 4 ||
                c === 6 ||
                c === 8 ||
                c === 9
                  ? COLORS.resolved
                  : COLORS.total,
            },
          },
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

    worksheet["!rows"][0] = {
      hpt: 36,
    };

    worksheet["!rows"][1] = {
      hpt: 24,
    };

    worksheet["!rows"][3] = {
      hpt: 42,
    };

    worksheet["!sheetViews"] = [
      {
        rightToLeft: true,
      },
    ];

    worksheet["!freeze"] = {
      xSplit: 0,
      ySplit: 4,
    };

    worksheet["!autofilter"] = {
      ref: `A4:J${
        currentRow + 1
      }`,
    };

    worksheet["!pageSetup"] = {
      orientation: "landscape",
      fitToWidth: 1,
      fitToHeight: 0,
    };

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "مصادر المخالفات"
    );

    XLSX.writeFile(
      workbook,
      "تقرير_مصادر_المخالفات_حسب_المنطقة.xlsx"
    );
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Box
      dir="rtl"
      style={{
        minHeight: "100vh",
        overflowX: "hidden",
              }}
      p={{
        base: "xs",
        sm: "md",
        md: "lg",
      }}
    >
      <Stack
        
        maw={1600}
        mx="auto"
      >
        {/* =====================================================
            MAIN HEADER
        ===================================================== */}

        <Card
         
          p={{
            base: "md",
            sm: "xl",
          }}
          withBorder
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,.98), rgba(248,250,252,.94))",
            border:
              "1px solid rgba(15,23,42,.07)",
            boxShadow:
              "0 20px 60px rgba(15,23,42,.08)",
          }}
        >
          <Stack gap="xl">
            {/* Header */}

            <Group
              justify="space-between"
              align="center"
              gap="md"
              wrap="wrap"
            >
              <Group
                gap="sm"
                wrap="nowrap"
                style={{
                  minWidth: 0,
                }}
              >
                <Box
                  style={{
                    width: 46,
                    height: 46,
                    minWidth: 46,
                    borderRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "white",
                    boxShadow:
                      "0 10px 24px rgba(37,99,235,.22)",
                  }}
                >
                  <IconChartBar
                    size={24}
                  />
                </Box>

                <Stack
                  gap={2}
                  style={{
                    minWidth: 0,
                  }}
                >
                  <Text
                    fw={900}
                    style={{
                      fontSize:
                        "clamp(18px, 3vw, 28px)",
                      lineHeight: 1.2,
                    }}
                  >
                    ملخص المخالفات
                    لجميع المناطق
                  </Text>

                  <Text
                    size="sm"
                    c="dimmed"
                    style={{
                      fontSize:
                        "clamp(11px, 2vw, 14px)",
                    }}
                  >
                    تحليل مركزي لحالة
                    المخالفات ومصادرها
                    ونسب الإنجاز
                  </Text>
                </Stack>
              </Group>

              <Badge
                size="lg"
                radius="xl"
                variant="light"
                color={
                  activeSource.color
                }
                leftSection={
                  activeSource.icon
                }
                style={{
                  maxWidth: "100%",
                }}
              >
                {activeSource.label}
              </Badge>
            </Group>

            {/* =================================================
                KPI HERO
            ================================================= */}

            <Box
              p={{
                base: "md",
                sm: "xl",
              }}
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 28,
                background:
                  "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%)",
                color: "white",
                boxShadow:
                  "0 20px 50px rgba(15,23,42,.18)",
              }}
            >
              <Box
                style={{
                  position: "absolute",
                  width: 220,
                  height: 220,
                  borderRadius: "50%",
                  background:
                    "rgba(255,255,255,.07)",
                  top: -110,
                  left: -70,
                }}
              />

              <Box
                style={{
                  position: "absolute",
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  background:
                    "rgba(255,255,255,.05)",
                  bottom: -100,
                  right: -50,
                }}
              />

              <Group
                justify="space-between"
                align="center"
                gap="xl"
                wrap="wrap"
                style={{
                  position:
                    "relative",
                  zIndex: 1,
                }}
              >
                <Stack gap={3}>
                  <Text
                    size="sm"
                    fw={700}
                    style={{
                      opacity: 0.75,
                    }}
                  >
                    نسبة الإنجاز الكلي
                  </Text>

                  <Text
                    fw={900}
                    style={{
                      fontSize:
                        "clamp(44px, 9vw, 72px)",
                      lineHeight: 1,
                      letterSpacing:
                        "-2px",
                    }}
                  >
                    {achievement}%
                  </Text>

                  <Text
                    size="sm"
                    style={{
                      opacity: 0.75,
                    }}
                  >
                    بناءً على المخالفات
                    المعروضة حالياً
                  </Text>
                </Stack>

                <SimpleGrid
                  cols={{
                    base: 2,
                    xs: 3,
                  }}
                  spacing="xs"
                  style={{
                    width:
                      "min(100%, 430px)",
                  }}
                >
                  <HeroMiniStat
                    label="الإجمالي"
                    value={kpis.total}
                  />

                  <HeroMiniStat
                    label="ميداني التحقق في انتظار"
                    value={
                      totalStatuses
                        .PendingFieldMonitorVerification ||
                      0
                    }
                  />

                  <HeroMiniStat
                    label="تم الحل"
                    value={
                      totalStatuses.Resolved ||
                      0
                    }
                  />
                </SimpleGrid>
              </Group>
            </Box>

            {/* =================================================
                SOURCE FILTER
            ================================================= */}

            <Card
              radius="24"
              p={{
                base: "sm",
                sm: "lg",
              }}
              withBorder
              style={{
                background:
                  "rgba(248,250,252,.92)",
                border:
                  "1px solid rgba(15,23,42,.06)",
              }}
            >
              <Stack gap="md">
                <Group
                  justify="space-between"
                  align="center"
                  gap="sm"
                  wrap="wrap"
                >
                  <Group
                    gap="xs"
                    wrap="nowrap"
                  >
                    <Box
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        background:
                          "rgba(37,99,235,.10)",
                        color:
                          "#2563eb",
                      }}
                    >
                      <IconFilter
                        size={19}
                      />
                    </Box>

                    <Stack gap={0}>
                      <Text
                        fw={900}
                        size="md"
                      >
                        مصدر المخالفة
                      </Text>

                      <Text
                        size="xs"
                        c="dimmed"
                      >
                        اختر المصدر لعرض
                        البيانات الخاصة به
                      </Text>
                    </Stack>
                  </Group>

                  <Group
                    gap="xs"
                    wrap="wrap"
                  >
                    <Badge
                      variant="light"
                      radius="xl"
                      color={
                        activeSource.color
                      }
                    >
                      {activeSource.label}
                    </Badge>

                    <Badge
                      variant="light"
                      radius="xl"
                      color="gray"
                    >
                      {filteredItems.length.toLocaleString(
                        "en-US"
                      )}{" "}
                      مخالفة
                    </Badge>
                  </Group>
                </Group>

                <SimpleGrid
                  cols={{
                    base: 1,
                    xs: 2,
                    sm: 4,
                  }}
                  spacing={{
                    base: "xs",
                    sm: "sm",
                  }}
                >
                  {SOURCE_OPTIONS.map(
                    (source) => {
                      const active =
                        complaintSourceFilter ===
                        source.key;

                      return (
                        <Button
                          key={
                            source.key
                          }
                          fullWidth
                          variant={
                            active
                              ? "filled"
                              : "light"
                          }
                          color={
                            source.color
                          }
                          radius="xl"
                          size="md"
                          leftSection={
                            source.icon
                          }
                          onClick={() =>
                            setComplaintSourceFilter(
                              source.key
                            )
                          }
                          styles={{
                            root: {
                              minHeight: 52,
                              justifyContent:
                                "flex-start",
                              transition:
                                "all .2s ease",
                              boxShadow:
                                active
                                  ? "0 8px 20px rgba(37,99,235,.15)"
                                  : "none",
                            },

                            label: {
                              width:
                                "100%",
                            },
                          }}
                        >
                          <Group
                            justify="space-between"
                            wrap="nowrap"
                            style={{
                              width:
                                "100%",
                            }}
                          >
                            <Stack
                              gap={0}
                              style={{
                                minWidth: 0,
                                textAlign:
                                  "right",
                              }}
                            >
                              <Text
                                fw={800}
                                size="sm"
                                truncate
                              >
                                {
                                  source.label
                                }
                              </Text>

                              <Text
                                size="xs"
                                style={{
                                  opacity:
                                    0.75,
                                }}
                              >
                                {
                                  sourceCounts[
                                    source
                                      .key as keyof typeof sourceCounts
                                  ]
                                }{" "}
                                مخالفة
                              </Text>
                            </Stack>
                          </Group>
                        </Button>
                      );
                    }
                  )}
                </SimpleGrid>

                {complaintSourceFilter !==
                  "all" && (
                  <Button
                    variant="subtle"
                    color="gray"
                    radius="xl"
                    leftSection={
                      <IconRefresh
                        size={17}
                      />
                    }
                    onClick={() =>
                      setComplaintSourceFilter(
                        "all"
                      )
                    }
                    fullWidth
                  >
                    إعادة عرض جميع المصادر
                  </Button>
                )}
              </Stack>
            </Card>

            {/* =================================================
                EXPORT ACTIONS
            ================================================= */}

            <SimpleGrid
              cols={{
                base: 1,
                sm: 2,
              }}
              spacing="sm"
            >
              <Button
                size="md"
                radius="xl"
                color="blue"
                leftSection={
                  <IconFileSpreadsheet
                    size={19}
                  />
                }
                onClick={
                  exportExcel
                }
                fullWidth
              >
                تصدير التقرير التفصيلي
              </Button>

              <Button
                size="md"
                radius="xl"
                color="green"
                variant="light"
                leftSection={
                  <IconFileSpreadsheet
                    size={19}
                  />
                }
                onClick={
                  exportComplaintSourceExcel
                }
                fullWidth
              >
                تصدير مصادر المخالفات
              </Button>
            </SimpleGrid>
          </Stack>
        </Card>
<GeneralSummary items={filteredItems} />
        {/* =====================================================
            DISTRICT NAVIGATION
        ===================================================== */}

        {Object.keys(stats).length >
          0 && (
          <Card
            radius="24"
            p={{
              base: "sm",
              sm: "md",
            }}
            withBorder
            style={{
              background:
                "rgba(255,255,255,.86)",
              border:
                "1px solid rgba(15,23,42,.06)",
            }}
          >
            <Group
              gap="xs"
              wrap="wrap"
            >
              {Object.entries(stats)
                .sort(
                  ([, a], [, b]) =>
                    b.total - a.total
                )
                .map(
                  ([district, data]) => (
                    <Button
                      key={district}
                      variant="light"
                      color="blue"
                      radius="xl"
                      size="sm"
                      onClick={() =>
                        focusDistrict(
                          district
                        )
                      }
                    >
                      {district}
                      <Badge
                        ml={6}
                        size="sm"
                        variant="white"
                        color="blue"
                      >
                        {
                          data.total
                        }
                      </Badge>
                    </Button>
                  )
                )}
            </Group>
          </Card>
        )}

        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {filteredItems.length ===
          0 && (
          <Card
            radius="28"
            p={{
              base: "xl",
              sm: 60,
            }}
            withBorder
            style={{
              textAlign: "center",
              background:
                "rgba(255,255,255,.9)",
            }}
          >
            <Stack
              align="center"
              gap="sm"
            >
              <Box
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  background:
                    "rgba(37,99,235,.08)",
                  color:
                    "#2563eb",
                }}
              >
                <IconFilter
                  size={30}
                />
              </Box>

              <Text
                fw={900}
                size="lg"
              >
                لا توجد مخالفات
              </Text>

              <Text
                size="sm"
                c="dimmed"
              >
                لا توجد بيانات مطابقة
                للفلاتر الحالية.
              </Text>

              {complaintSourceFilter !==
                "all" && (
                <Button
                  variant="light"
                  color="blue"
                  radius="xl"
                  leftSection={
                    <IconRefresh
                      size={17}
                    />
                  }
                  onClick={() =>
                    setComplaintSourceFilter(
                      "all"
                    )
                  }
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
            .sort(
              ([, a], [, b]) =>
                b.total - a.total
            )
            .map(
              ([district, data]) => (
                <Box
                  key={district}
                  id={`district-${encodeURIComponent(
                    district
                  )}`}
                  style={{
                    scrollMarginTop:
                      20,
                  }}
                >
                  <DistrictCard
                    district={district}
                    data={data}
                  />
                </Box>
              )
            )}
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
}: {
  label: string;
  value: number;
}) {
  return (
    <Box
      p={{
        base: "sm",
        sm: "md",
      }}
      style={{
        borderRadius: 18,
        background:
          "rgba(255,255,255,.09)",
        border:
          "1px solid rgba(255,255,255,.12)",
        backdropFilter:
          "blur(10px)",
        textAlign: "center",
      }}
    >
      <Text
        size="xs"
        fw={700}
        style={{
          opacity: 0.7,
        }}
      >
        {label}
      </Text>

      <Text
        fw={900}
        style={{
          fontSize:
            "clamp(20px, 4vw, 28px)",
          lineHeight: 1.2,
          marginTop: 4,
        }}
      >
        {value.toLocaleString(
          "en-US"
        )}
      </Text>
    </Box>
  );
}