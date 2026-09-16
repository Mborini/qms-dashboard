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

import DistrictCard from "./DistrictCard";

import {
  DistrictConfig,
  statusConfig,
  summaryOnlyStatuses,
} from "./statusConfig";

import * as XLSX from "xlsx-js-style";
import { IconFileSpreadsheet } from "@tabler/icons-react";

export default function FailureStats({ items = [] }) {
  // ==================================
  // COMPLAINT SOURCE FILTER
  // ==================================

  const [complaintSourceFilter, setComplaintSourceFilter] =
    useState("all");

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

  // ==================================
  // تجميع المناطق والمستخدمين
  // ==================================

  const stats = useMemo(() => {
    const result = {};

    filteredItems.forEach((item) => {
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

        if (
          !blockData.statuses[status].users[lastUser].ids.includes(
            item.id
          )
        ) {
          blockData.statuses[status].users[lastUser].ids.push(
            item.id
          );
        }
      }
    });

    return result;
  }, [filteredItems]);

  // ==================================
  // الحالات العامة
  // ==================================

  const totalStatuses = useMemo(() => {
    const result = {};

    Object.keys(statusConfig).forEach((status) => {
      result[status] = 0;
    });

    filteredItems.forEach((item) => {
      const status = item.status || "Unknown";

      result[status] = (result[status] || 0) + 1;
    });

    return result;
  }, [filteredItems]);

  // ==================================
  // KPI
  // ==================================

  const kpis = useMemo(() => {
    const total = filteredItems.length;

    const field =
      totalStatuses.PendingFieldMonitorVerification || 0;

    const resolved = totalStatuses.Resolved || 0;

    return {
      total,

      fieldPercentage: total
        ? ((field / total) * 100).toFixed(1)
        : 0,

      resolvedPercentage: total
        ? ((resolved / total) * 100).toFixed(1)
        : 0,
    };
  }, [filteredItems, totalStatuses]);

  const achievement = (
    Number(kpis.fieldPercentage) +
    Number(kpis.resolvedPercentage)
  ).toFixed(1);

  // ==================================
  // FOCUS DISTRICT
  // ==================================

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

  // =========================================================
  // EXPORT CURRENT DETAILED REPORT
  // =========================================================

  const exportExcel = () => {
    const STATUS = {
      PENDING_ACCEPTANCE: "PendingSpValidation",
      IN_PROGRESS: "InProgress",
      FIELD_VERIFICATION:
        "PendingFieldMonitorVerification",
      RESOLVED: "Resolved",
      AVTR_REVIEW: "PendingSupervisorReview",

      // تبقى كحالة مستقلة فقط
      // ولا تدخل في نسبة الإنجاز
      AVTR_ACCEPTED_REJECTION: "ResolutionRejected",

      // هذه تدخل في نسبة الإنجاز
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
    // نسبة الإنجاز
    //
    // يدخل فيها:
    // PendingFieldMonitorVerification
    // Resolved
    // Rejected
    //
    // لا يدخل فيها:
    // ResolutionRejected
    // =====================================================

    const getAchievement = (data) => {
      if (!data.total) return 0;

      return (
        (
          data.fieldVerification +
          data.resolved +
          data.avtrRejectedSolution
        ) /
          data.total *
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

    const formatArabicDate = (date) => {
      if (!date) return "غير محدد";

      return date.toLocaleDateString("ar-JO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const hierarchy = {};

    filteredItems.forEach((item) => {
      const district = item.districtName?.trim()
        ? `منطقة ${item.districtName.trim()}`
        : "مخالفات حسب مؤشرات الأداء";

      const block = item.blockName?.trim()
        ? item.blockName.trim()
        : `KPI: ${item.kpiNameAr || "غير محدد"}`;

      const user =
        item.userName?.trim() || "غير معروف";

      const status = item.status || "Unknown";

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

      const normalizedUser = user
        .trim()
        .toUpperCase();

      if (normalizedUser.includes("C&C")) {
        return;
      }

      if (
        summaryOnlyStatuses.includes(status)
      ) {
        return;
      }

      if (!blockData.users[user]) {
        blockData.users[user] =
          createEmptyStats();
      }

      addStatus(
        blockData.users[user],
        status
      );
    });

    const sortedDistricts =
      Object.entries(hierarchy).sort(
        ([, a], [, b]) =>
          b.stats.total -
          a.stats.total
      );

    const worksheet =
      XLSX.utils.aoa_to_sheet([]);

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

    const districtMergeRanges = [];
    const blockMergeRanges = [];

    sortedDistricts.forEach(
      ([district, districtData]) => {
        const districtStartRow =
          currentRow;

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

    worksheet["!merges"].push(
      ...districtMergeRanges,
      ...blockMergeRanges
    );

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

    const workbook =
      XLSX.utils.book_new();

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

  // =========================================================
  // EXPORT COMPLAINT SOURCE BY DISTRICT
  // =========================================================

  const exportComplaintSourceExcel = () => {
    // =====================================================
    // الحالات التي تعتبر "تم حلها"
    //
    // ResolutionRejected لا تدخل
    // Rejected تدخل
    // =====================================================

    const RESOLVED_STATUSES = new Set([
      "PendingFieldMonitorVerification",
      "Resolved",
      "PendingSupervisorReview",
      "Rejected",
    ]);

    const createSourceStats = () => ({
      total: 0,
      resolved: 0,
    });

    const districts = {};

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

      const districtData = districts[district];

      const status = item.status || "Unknown";

      const isResolved =
        RESOLVED_STATUSES.has(status);

      // ===================================================
      // مصدر المخالفة
      // ===================================================

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

      // ===================================================
      // الإجمالي العام
      // ===================================================

      districtData.total++;

      if (isResolved) {
        districtData.resolved++;
      }
    });

    // =====================================================
    // ترتيب المناطق حسب الإجمالي
    // =====================================================

    const sortedDistricts = Object.entries(
      districts
    ).sort(
      ([, a], [, b]) =>
        b.total - a.total
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

      callCenter: "D9EAF7",
      citizenPortal: "E2F0D9",
      avtrTeam: "E4DFEC",

      total: "FFF2CC",
      resolved: "D9EAD3",

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
        sz: 10,
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

    const normalStyle = {
      font: {
        name: "Arial",
        sz: 10,
        color: {
          rgb: COLORS.text,
        },
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
        color: {
          rgb: COLORS.text,
        },
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
        color: {
          rgb: COLORS.text,
        },
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
        color: {
          rgb: COLORS.text,
        },
      },
    };

    // =====================================================
    // TITLE
    // =====================================================

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

    // =====================================================
    // HEADER
    // =====================================================

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
          c: 9,
        },
      },

      {
        s: {
          r: 1,
          c: 0,
        },

        e: {
          r: 1,
          c: 9,
        },
      },
    ];

    worksheet["A1"].s =
      titleStyle;

    worksheet["A2"].s =
      subtitleStyle;

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
    // DATA
    // =====================================================

    let currentRow = 4;

    sortedDistricts.forEach(
      ([district, data]) => {
        const total = data.total;

        const resolved =
          data.resolved;

        const percentage = total
          ? ((resolved / total) * 100).toFixed(
              1
            )
          : "0.0";

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

    // =====================================================
    // TOTAL ROW
    // =====================================================

    const grandTotal = {
      callCenter: createSourceStats(),
      citizenPortal: createSourceStats(),
      avtrTeam: createSourceStats(),
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
      {
        origin: `A${
          currentRow + 1
        }`,
      }
    );

    // =====================================================
    // STYLE TOTAL
    // =====================================================

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

    // =====================================================
    // COLUMN WIDTH
    // =====================================================

    worksheet["!cols"] = [
      {
        wch: 26,
      },

      {
        wch: 18,
      },

      {
        wch: 22,
      },

      {
        wch: 20,
      },

      {
        wch: 25,
      },

      {
        wch: 18,
      },

      {
        wch: 22,
      },

      {
        wch: 20,
      },

      {
        wch: 20,
      },

      {
        wch: 15,
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
    // =====================================================

    worksheet["!freeze"] = {
      xSplit: 0,
      ySplit: 4,
    };

    // =====================================================
    // FILTER
    // =====================================================

    worksheet["!autofilter"] = {
      ref: `A4:J${currentRow + 1}`,
    };

    // =====================================================
    // PRINT
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
      "مصادر المخالفات"
    );

    // =====================================================
    // EXPORT
    // =====================================================

    XLSX.writeFile(
      workbook,
      "تقرير_مصادر_المخالفات_حسب_المنطقة.xlsx"
    );
  };

  // =========================================================
  // UI
  // =========================================================

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
            boxShadow:
              "0 10px 30px rgba(0,0,0,.05)",
          }}
        >
          <Stack gap="xl">
            <Group
              justify="center"
              align="center"
              gap="sm"
              wrap="wrap"
            >
              <Text
                ta="center"
                size="xl"
                fw={900}
              >
                ملخص المخالفات لجميع المناطق
              </Text>

              {/* التصدير الحالي */}
              <ActionIcon
                variant="light"
                color="green"
                size="lg"
                radius="xl"
                onClick={exportExcel}
                title="تصدير التقرير التفصيلي"
              >
                <IconFileSpreadsheet
                  size={22}
                />
              </ActionIcon>

              {/* التصدير الجديد */}
                         </Group>

            {/* ============================
                COMPLAINT SOURCE FILTER
            ============================ */}

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
              <Text
                fw={900}
                pb={10}
                size="xl"
              >
                مصدر المخالفة  
<Button
                leftSection={
                  <IconFileSpreadsheet
                    size={18}
                  />
                }
                color="green"
                variant="light"
                radius="xl"
                onClick={
                  exportComplaintSourceExcel
                }
              >
            </Button>
              </Text>

              <Group
                gap="sm"
                justify="center"
                wrap="wrap"
              >
                {/* الكل */}
                <Badge
                  radius="xl"
                  px="md"
                  py={10}
                  size="lg"
                  variant={
                    complaintSourceFilter ===
                    "all"
                      ? "filled"
                      : "light"
                  }
                  color="gray"
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setComplaintSourceFilter(
                      "all"
                    )
                  }
                >
                  <Group
                    gap={8}
                    wrap="nowrap"
                  >
                    <Text
                      size="xs"
                      fw={700}
                    >
                      الكل
                    </Text>

                    <Text
                      size="sm"
                      fw={900}
                    >
                      {items.length}
                    </Text>
                  </Group>
                </Badge>

                {/* Call Center */}
                <Badge
                  radius="xl"
                  px="md"
                  py={10}
                  size="lg"
                  variant={
                    complaintSourceFilter ===
                    "call-center"
                      ? "filled"
                      : "light"
                  }
                  color="blue"
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setComplaintSourceFilter(
                      "call-center"
                    )
                  }
                >
                  <Group
                    gap={8}
                    wrap="nowrap"
                  >
                    <Text
                      size="xs"
                      fw={700}
                    >
                      مركز الاتصال
                    </Text>

                    <Text
                      size="sm"
                      fw={900}
                    >
                      {
                        items.filter(
                          (item) =>
                            item.complaintSource ===
                            "call-center"
                        ).length
                      }
                    </Text>
                  </Group>
                </Badge>

                {/* Citizen Portal */}
                <Badge
                  radius="xl"
                  px="md"
                  py={10}
                  size="lg"
                  variant={
                    complaintSourceFilter ===
                    "citizen-portal"
                      ? "filled"
                      : "light"
                  }
                  color="green"
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setComplaintSourceFilter(
                      "citizen-portal"
                    )
                  }
                >
                  <Group
                    gap={8}
                    wrap="nowrap"
                  >
                    <Text
                      size="xs"
                      fw={700}
                    >
                      بوابة المواطن
                    </Text>

                    <Text
                      size="sm"
                      fw={900}
                    >
                      {
                        items.filter(
                          (item) =>
                            item.complaintSource ===
                            "citizen-portal"
                        ).length
                      }
                    </Text>
                  </Group>
                </Badge>

                {/* AVTR Team */}
                <Badge
                  radius="xl"
                  px="md"
                  py={10}
                  size="lg"
                  variant={
                    complaintSourceFilter ===
                    "avtr-team"
                      ? "filled"
                      : "light"
                  }
                  color="violet"
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setComplaintSourceFilter(
                      "avtr-team"
                    )
                  }
                >
                  <Group
                    gap={8}
                    wrap="nowrap"
                  >
                    <Text
                      size="xs"
                      fw={700}
                    >
                      AVTR Team
                    </Text>

                    <Text
                      size="sm"
                      fw={900}
                    >
                      {
                        items.filter(
                          (item) =>
                            item.complaintSource ==
                            null
                        ).length
                      }
                    </Text>
                  </Group>
                </Badge>
              </Group>
            </Card>

            {/* ACHIEVEMENT */}
            <Box
              style={{
                textAlign: "center",
              }}
            >
              <Text
                fw={900}
                size="64px"
                c="#228be6"
              >
                {achievement}%
              </Text>

              <Text
                fw={700}
                c="dimmed"
              >
                نسبة الإنجاز الكلي
              </Text>
            </Box>

            {/* KPI */}
            <SimpleGrid
              cols={{
                base: 1,
                sm: 3,
              }}
              spacing="md"
            >
              <MiniStat
                title="الاجمالي الكلي "
                value={kpis.total}
              />

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
              <Text
                fw={900}
                pb={10}
                size="sm"
              >
                توزيع أعداد المخالفات حسب الحالة
              </Text>

              <Group
                gap="sm"
                justify="center"
                wrap="wrap"
              >
                {Object.entries(
                  totalStatuses
                ).map(
                  ([status, count]) => (
                    <Badge
                      key={status}
                      radius="xl"
                      px="md"
                      py={10}
                      size="lg"
                      variant="light"
                      color={
                        statusConfig[status]
                          ?.color ||
                        "gray"
                      }
                    >
                      <Group
                        gap={8}
                        wrap="nowrap"
                      >
                        <Text
                          size="xs"
                          fw={700}
                        >
                          {statusConfig[
                            status
                          ]?.label ||
                            status}
                        </Text>

                        <Text
                          size="sm"
                          fw={900}
                        >
                          {Number(
                            count || 0
                          )}
                        </Text>
                      </Group>
                    </Badge>
                  )
                )}
              </Group>
            </Card>

            {/* المناطق */}

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
              <Text
                fw={900}
                pb={10}
                size="sm"
              >
                توزيع المخالفات حسب المناطق
              </Text>

              <Group
                gap="sm"
                justify="center"
                wrap="wrap"
              >
                {Object.entries(stats)
                  .sort(
                    ([, a], [, b]) =>
                      b.total -
                      a.total
                  )
                  .map(
                    ([district, data]) => (
                      <Badge
                        key={district}
                        radius="xl"
                        px="md"
                        py={10}
                        size="lg"
                        variant="light"
                        color={
                          DistrictConfig[
                            district
                          ]?.main ||
                          "gray"
                        }
                        style={{
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          focusDistrict(
                            district
                          )
                        }
                      >
                        <Group
                          gap={8}
                          wrap="nowrap"
                        >
                          <Text
                            size="xs"
                            fw={700}
                          >
                            {district}
                          </Text>

                          <Text
                            size="sm"
                            fw={900}
                          >
                            {Number(
                              data.total ||
                                0
                            )}
                          </Text>
                        </Group>
                      </Badge>
                    )
                  )}
              </Group>
            </Card>
          </Stack>
        </Card>

        {/* ============================
            DISTRICTS
        ============================ */}

        <Stack gap="md">
          {Object.entries(stats)
            .sort(
              ([, a], [, b]) =>
                b.total -
                a.total
            )
            .map(
              ([district, data]) => (
                <Box
                  key={district}
                  id={`district-${encodeURIComponent(
                    district
                  )}`}
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

// =========================================================
// MINI STAT
// =========================================================

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
      <Text
        size="xs"
        fw={700}
        c="dimmed"
      >
        {title}
      </Text>

      <Text
        size="30px"
        fw={900}
      >
        {value}
      </Text>
    </Box>
  );
}