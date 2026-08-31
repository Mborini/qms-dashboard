"use client";

import { useMemo } from "react";

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

import DistrictCard from "./DistrictCard";

import { DistrictConfig, statusConfig, summaryOnlyStatuses } from "./statusConfig";
import * as XLSX from "xlsx-js-style";
import { IconFileSpreadsheet } from "@tabler/icons-react";

export default function FailureStats({ items = [] }) {
  // ==================================
  // تجميع المناطق والمستخدمين
  // ==================================

  const stats = useMemo(() => {
    const result = {};

    items.forEach((item) => {
const district = item.districtName?.trim()
  ? `منطقة ${item.districtName.trim()}`
  : "مخالفات حسب مؤشرات الأداء";
  const block = item.blockName?.trim()
  ? item.blockName
  : `KPI:${item.kpiNameAr || "غير محدد"}`;
      const status = item.status || "Unknown";

      let lastUser = null;

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

      blockData.statuses[status].total++;

      blockData.statuses[status].ids.push(item.id);

      if (lastUser) {
        if (!blockData.statuses[status].users[lastUser]) {
          blockData.statuses[status].users[lastUser] = {
            count: 0,

            ids: [],
          };
        }

        blockData.statuses[status].users[lastUser].count++;

        if (!blockData.statuses[status].users[lastUser].ids.includes(item.id)) {
          blockData.statuses[status].users[lastUser].ids.push(item.id);
        }
      }
    });

    return result;
  }, [items]);

  // ==================================
  // الحالات العامة
  // ==================================

  const totalStatuses = useMemo(() => {
    const result = {};

    Object.keys(statusConfig).forEach((status) => {
      result[status] = 0;
    });

    items.forEach((item) => {
      const status = item.status || "Unknown";

      result[status] = (result[status] || 0) + 1;
    });

    return result;
  }, [items]);

  // ==================================
  // KPI
  // ==================================

  const kpis = useMemo(() => {
    const total = items.length;

    const field = totalStatuses.PendingFieldMonitorVerification || 0;

    const resolved = totalStatuses.Resolved || 0;

    return {
      total,

      fieldPercentage: total ? ((field / total) * 100).toFixed(1) : 0,

      resolvedPercentage: total ? ((resolved / total) * 100).toFixed(1) : 0,
    };
  }, [items, totalStatuses]);

  const achievement = (
    Number(kpis.fieldPercentage) + Number(kpis.resolvedPercentage)
  ).toFixed(1);
const focusDistrict = (district) => {
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

const exportExcel = () => {
  // =====================================================
  // STATUS CONFIG
  // =====================================================

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

  // =====================================================
  // EMPTY STATS
  // =====================================================

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

  // =====================================================
  // ADD STATUS
  // =====================================================

  const addStatus = (target, status) => {
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

  // =====================================================
  // ACHIEVEMENT
  //
  // تحقق ميداني
  // + تم الحل
  // + AVTR قبلت الرفض
  // =====================================================

  const getAchievement = (data) => {
    if (!data.total) return 0;

    return (
      (
        data.fieldVerification +
        data.resolved +
        data.avtrAcceptedRejection
      ) /
      data.total *
      100
    ).toFixed(1);
  };

  // =====================================================
  // REPORT DATE
  //
  // لا نستخدم تاريخ اليوم
  // نأخذ التاريخ من البيانات
  // =====================================================

  const getReportDate = () => {
    const firstItem = items.find(
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

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const reportDate = getReportDate();

  // =====================================================
  // ARABIC DAY
  // =====================================================

  const getArabicDayName = (date) => {
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

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatArabicDate = (date) => {
    if (!date) return "غير محدد";

    return date.toLocaleDateString("ar-JO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // =====================================================
  // HIERARCHY
  //
  // المنطقة
  //   └── الحي / البلوك
  //         └── المستخدم
  // =====================================================

  const hierarchy = {};

  items.forEach((item) => {
    const district = item.districtName?.trim()
      ? `منطقة ${item.districtName.trim()}`
      : "مخالفات حسب مؤشرات الأداء";

    const block = item.blockName?.trim()
      ? item.blockName.trim()
      : `KPI: ${item.kpiNameAr || "غير محدد"}`;

    const user =
      item.userName?.trim() || "غير معروف";

    const status = item.status || "Unknown";

    // ===================================================
    // DISTRICT
    // ===================================================

    if (!hierarchy[district]) {
      hierarchy[district] = {
        stats: createEmptyStats(),
        blocks: {},
      };
    }

    const districtData = hierarchy[district];

    addStatus(
      districtData.stats,
      status
    );

    // ===================================================
    // BLOCK
    // ===================================================

    if (!districtData.blocks[block]) {
      districtData.blocks[block] = {
        stats: createEmptyStats(),
        users: {},
      };
    }

    const blockData =
      districtData.blocks[block];

    addStatus(
      blockData.stats,
      status
    );

    // ===================================================
    // EXCLUDE C&C
    //
    // المخالفة تبقى محسوبة
    // لكن المستخدم لا يظهر بالتقرير
    // ===================================================

    const normalizedUser = user
      .trim()
      .toUpperCase();

    if (normalizedUser.includes("C&C")) {
      return;
    }

    // ===================================================
    // SUMMARY STATUSES
    // ===================================================

    if (
      summaryOnlyStatuses.includes(status)
    ) {
      return;
    }

    // ===================================================
    // USER
    // ===================================================

    if (!blockData.users[user]) {
      blockData.users[user] =
        createEmptyStats();
    }

    addStatus(
      blockData.users[user],
      status
    );
  });

  // =====================================================
  // SORT DISTRICTS
  // =====================================================

  const sortedDistricts =
    Object.entries(hierarchy).sort(
      ([, a], [, b]) =>
        b.stats.total -
        a.stats.total
    );

  // =====================================================
  // WORKSHEET
  // =====================================================

  const worksheet =
    XLSX.utils.aoa_to_sheet([]);

  // =====================================================
  // COLORS
  // =====================================================

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

  // =====================================================
  // BORDER
  // =====================================================

  const border = {
    top: {
      style: "thin",
      color: {
        rgb: COLORS.border,
      },
    },

    bottom: {
      style: "thin",
      color: {
        rgb: COLORS.border,
      },
    },

    left: {
      style: "thin",
      color: {
        rgb: COLORS.border,
      },
    },

    right: {
      style: "thin",
      color: {
        rgb: COLORS.border,
      },
    },
  };

  // =====================================================
  // STYLES
  // =====================================================

  const titleStyle = {
    font: {
      name: "Arial",
      sz: 20,
      bold: true,
      color: {
        rgb: COLORS.white,
      },
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
      color: {
        rgb: COLORS.text,
      },
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
      color: {
        rgb: COLORS.white,
      },
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

  const districtStyle = {
    font: {
      name: "Arial",
      sz: 11,
      bold: true,
      color: {
        rgb: COLORS.text,
      },
    },

    fill: {
      fgColor: {
        rgb: COLORS.district,
      },
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
      color: {
        rgb: COLORS.text,
      },
    },

    fill: {
      fgColor: {
        rgb: COLORS.block,
      },
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
      color: {
        rgb: COLORS.text,
      },
    },

    fill: {
      fgColor: {
        rgb: COLORS.user,
      },
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
      color: {
        rgb: COLORS.text,
      },
    },

    fill: {
      fgColor: {
        rgb: COLORS.total,
      },
    },

    alignment: {
      horizontal: "center",
      vertical: "center",
      wrapText: true,
    },

    border,
  };

  // =====================================================
  // TITLE
  // =====================================================

  XLSX.utils.sheet_add_aoa(
    worksheet,
    [
      ["تقرير المخالفات"],
      [
        `اليوم: ${getArabicDayName(
          reportDate
        )} | التاريخ: ${formatArabicDate(
          reportDate
        )}`,
      ],
      [],
    ],
    {
      origin: "A1",
    }
  );

  // =====================================================
  // TABLE HEADER
  // =====================================================

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
    {
      origin: "A4",
    }
  );

  // =====================================================
  // MERGE TITLE
  // =====================================================

  worksheet["!merges"] = [
    {
      s: {
        r: 0,
        c: 0,
      },
      e: {
        r: 0,
        c: 11,
      },
    },

    {
      s: {
        r: 1,
        c: 0,
      },
      e: {
        r: 1,
        c: 11,
      },
    },
  ];

  // =====================================================
  // TITLE STYLE
  // =====================================================

  worksheet["A1"].s = titleStyle;
  worksheet["A2"].s = subtitleStyle;

  // =====================================================
  // HEADER STYLE
  // =====================================================

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

  // =====================================================
  // BUILD DATA
  // =====================================================

  let currentRow = 4;

  const districtMergeRanges = [];
  const blockMergeRanges = [];

  sortedDistricts.forEach(
    ([district, districtData]) => {
      const districtStartRow =
        currentRow;

      // =================================================
      // DISTRICT
      // =================================================

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
            `${getAchievement(
              districtData.stats
            )}%`,
          ],
        ],
        {
          origin: `A${
            currentRow + 1
          }`,
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

      // =================================================
      // BLOCKS
      // =================================================

      const sortedBlocks =
        Object.entries(
          districtData.blocks
        ).sort(
          ([, a], [, b]) =>
            b.stats.total -
            a.stats.total
        );

      sortedBlocks.forEach(
        ([block, blockData]) => {
          const blockStartRow =
            currentRow;

          // ---------------------------------------------
          // BLOCK
          // ---------------------------------------------

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
                `${getAchievement(
                  blockData.stats
                )}%`,
              ],
            ],
            {
              origin: `A${
                currentRow + 1
              }`,
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

          // ---------------------------------------------
          // USERS
          // ---------------------------------------------

          const sortedUsers =
            Object.entries(
              blockData.users
            ).sort(
              ([, a], [, b]) =>
                b.total -
                a.total
            );

          sortedUsers.forEach(
            ([user, userData]) => {
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
                    `${getAchievement(
                      userData
                    )}%`,
                  ],
                ],
                {
                  origin: `A${
                    currentRow + 1
                  }`,
                }
              );

              for (
                let c = 0;
                c < 12;
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
                  cell.s = userStyle;
                }
              }

              // لون خاص لنسبة الإنجاز
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
                      rgb:
                        COLORS.achievement,
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

          // ---------------------------------------------
          // MERGE BLOCK
          // ---------------------------------------------

          const blockEndRow =
            currentRow - 1;

          if (
            blockEndRow >=
            blockStartRow
          ) {
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

      // =================================================
      // MERGE DISTRICT
      // =================================================

      const districtEndRow =
        currentRow - 1;

      if (
        districtEndRow >=
        districtStartRow
      ) {
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

  // =====================================================
  // APPLY MERGES
  // =====================================================

  worksheet["!merges"].push(
    ...districtMergeRanges,
    ...blockMergeRanges
  );

  // =====================================================
  // MERGED DISTRICT STYLE
  // =====================================================

  districtMergeRanges.forEach(
    (range) => {
      const cell =
        worksheet[
          XLSX.utils.encode_cell(
            range.s
          )
        ];

      if (cell) {
        cell.s = districtStyle;
      }
    }
  );

  // =====================================================
  // MERGED BLOCK STYLE
  // =====================================================

  blockMergeRanges.forEach(
    (range) => {
      const cell =
        worksheet[
          XLSX.utils.encode_cell(
            range.s
          )
        ];

      if (cell) {
        cell.s = blockStyle;
      }
    }
  );

  // =====================================================
  // COLUMN WIDTH
  // =====================================================

  worksheet["!cols"] = [
    {
      wch: 24,
    },

    {
      wch: 30,
    },

    {
      wch: 25,
    },

    {
      wch: 12,
    },

    {
      wch: 18,
    },

    {
      wch: 15,
    },

    {
      wch: 25,
    },

    {
      wch: 14,
    },

    {
      wch: 20,
    },

    {
      wch: 19,
    },

    {
      wch: 19,
    },

    {
      wch: 17,
    },
  ];

  // =====================================================
  // ROW HEIGHT
  // =====================================================

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

  // =====================================================
  // RTL
  // =====================================================

  worksheet["!sheetViews"] = [
    {
      rightToLeft: true,
    },
  ];

  // =====================================================
  // FREEZE
  //
  // الصفوف:
  //
  // 1 = العنوان
  // 2 = التاريخ
  // 3 = فارغ
  // 4 = Header
  //
  // لذلك ySplit = 4
  // =====================================================

  worksheet["!freeze"] = {
    xSplit: 0,
    ySplit: 4,
  };

  // =====================================================
  // AUTO FILTER
  // =====================================================

  worksheet["!autofilter"] = {
    ref: `A4:L${currentRow}`,
  };

  // =====================================================
  // PRINT SETTINGS
  // =====================================================

  worksheet["!pageSetup"] = {
    orientation: "landscape",
    fitToWidth: 1,
    fitToHeight: 0,
  };

  // =====================================================
  // WORKBOOK
  // =====================================================

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "تقرير المخالفات"
  );

  // =====================================================
  // EXPORT
  // =====================================================

  XLSX.writeFile(
    workbook,
    "تقرير_المخالفات.xlsx"
  );
};

  return (
    <Box
      p={{ base: "sm", md: "lg" }}
      style={{
        minHeight: "100vh",
      }}
    >
      <Stack gap="lg">
        {/* ============================
      SUMMARY HEADER
============================ */}

        <Card
          radius="30"
          p="xl"
          withBorder
          style={{
            background: "#ffffff",

            boxShadow: "0 10px 30px rgba(0,0,0,.05)",
          }}
        >
          <Stack gap="xl">
            <Group justify="center" align="center" gap="sm">
              <Text ta="center" size="xl" fw={900}>
                ملخص المخالفات لجميع المناطق
              </Text>

              <ActionIcon
                variant="light"
                color="green"
                size="lg"
                radius="xl"
                onClick={exportExcel}
              >
                <IconFileSpreadsheet size={22} />
              </ActionIcon>
            </Group>

            <Box
              style={{
                textAlign: "center",
              }}
            >
              <Text fw={900} size="64px" c="#228be6">
                {achievement}%
              </Text>

              <Text fw={700} c="dimmed">
                نسبة الإنجاز الكلي
              </Text>
            </Box>

            <SimpleGrid
              cols={{
                base: 1,

                sm: 3,
              }}
              spacing="md"
            >

              <MiniStat title="الاجمالي الكلي " value={kpis.total} />
              <MiniStat
                title="نسبة التحقق الميداني"
                value={`${kpis.fieldPercentage}%`}
              />

              <MiniStat
                title="نسبة تم الحل"
                value={`${kpis.resolvedPercentage}%`}
              />
            </SimpleGrid>

            {/* الحالات */}

            <Card
              radius="24"
              p="lg"
              style={{
                background: "#f8f9fa",

                display: "flex",

                flexDirection: "column",

                alignItems: "center",

                gap: "md",
              }}
            >
              <Text fw={900} pb={10} size="sm">
توزيع أعداد المخالفات حسب الحالة              </Text>

              <Group gap="sm" justify="center" wrap="wrap">
                {Object.entries(totalStatuses).map(([status, count]) => (
                  <Badge
                    key={status}
                    radius="xl"
                    px="md"
                    py={10}
                    size="lg"
                    variant="light"
                    color={statusConfig[status]?.color || "gray"}
                  >
                    <Group gap={8} wrap="nowrap">
                      <Text size="xs" fw={700}>
                        {statusConfig[status]?.label || status}
                      </Text>

                      <Text size="sm" fw={900}>
                        {Number(count || 0)}
                      </Text>
                    </Group>
                  </Badge>
                ))}
              </Group>
            </Card>
            <Card
              radius="24"
              p="lg"
              style={{
                background: "#f8f9fa",

                display: "flex",

                flexDirection: "column",

                alignItems: "center",

                gap: "md",
              }}
            >
              <Text fw={900} pb={10} size="sm">
توزيع المخالفات حسب المناطق            </Text>

              <Group gap="sm" justify="center" wrap="wrap">
                {Object.entries(stats)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([district, data]) => (
                    <Badge
  key={district}
  radius="xl"
  px="md"
  py={10}
  size="lg"
  variant="light"
  color={DistrictConfig[district]?.main || "gray"}
  style={{
    cursor: "pointer",
  }}
  onClick={() => focusDistrict(district)}
>
                      <Group gap={8} wrap="nowrap">
                        <Text size="xs" fw={700}>
                          {district}
                        </Text>
                        <Text size="sm" fw={900}>
                          {Number(data.total || 0)}
                        </Text>
                      </Group>
                    </Badge>
                  ))}
              </Group>
            </Card>
          </Stack>
        </Card>

        {/* ============================
      DISTRICTS
============================ */}

      <Stack gap="md">
  {Object.entries(stats)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([district, data]) => (
      <Box
        key={district}
        id={`district-${encodeURIComponent(district)}`}
      >
        <DistrictCard
          district={district}
          data={data}
        />
      </Box>
    ))}
</Stack>
      </Stack>
    </Box>
  );
}

function MiniStat({
  title,

  value,
}) {
  return (
    <Box
      style={{
        background: "#f8f9fa",

        borderRadius: "20px",

        padding: "18px",

        textAlign: "center",
      }}
    >
      <Text size="xs" fw={700} c="dimmed">
        {title}
      </Text>

      <Text size="30px" fw={900}>
        {value}
      </Text>
    </Box>
  );
}
