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

import { statusConfig, summaryOnlyStatuses } from "./statusConfig";

import * as XLSX from "xlsx";
import { IconFileSpreadsheet } from "@tabler/icons-react";

export default function FailureStats({ items = [] }) {
  // ==================================
  // تجميع المناطق والمستخدمين
  // ==================================

  const stats = useMemo(() => {
    const result = {};

    items.forEach((item) => {
const district = item.districtName
  ? `منطقة ${item.districtName}`
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

  const exportExcel = () => {
    const rows = Object.entries(stats).map(([district, data]) => {
      const statuses = {};

      Object.keys(statusConfig).forEach((status) => {
        statuses[status] = 0;
      });

      Object.values(data.blocks || {}).forEach((block) => {
        Object.entries(block.statuses || {}).forEach(([status, statusData]) => {
          statuses[status] += statusData.total || 0;
        });
      });

      const total = data.total || 0;

      const field = statuses.PendingFieldMonitorVerification || 0;

      const resolved = statuses.Resolved || 0;

      const achievement = total
        ? (((field + resolved) / total) * 100).toFixed(1)
        : 0;

      return {
        المنطقة: district,

        "الإجمالي الكلي": total,

        "في انتظار القبول": statuses.PendingSpValidation,

        "قيد التنفيذ": statuses.InProgress,

        "قيد مراجعة AVTR": statuses.PendingSupervisorReview,

        "انتظار التحقق الميداني": statuses.PendingFieldMonitorVerification,

        "تم الحل": statuses.Resolved,

        "تم رفض الحل": statuses.ResolutionRejected,

        مرفوض: statuses.Rejected,

        "نسبة الإنجاز": `${achievement}%`,
      };
    });

    // =========================
    // Footer المجموع
    // =========================

    const totalRow = {
      المنطقة: "المجموع",
    };

    Object.keys(rows[0]).forEach((key) => {
      if (key !== "المنطقة" && key !== "نسبة الإنجاز") {
        totalRow[key] = rows.reduce(
          (sum, row) => sum + Number(row[key] || 0),
          0,
        );
      }
    });

    const total = totalRow["الإجمالي الكلي"];

    totalRow["نسبة الإنجاز"] = total
      ? (
          ((totalRow["انتظار التحقق الميداني"] + totalRow["تم الحل"]) / total) *
          100
        ).toFixed(1) + "%"
      : "0%";

    rows.push(totalRow);

    const worksheet = XLSX.utils.json_to_sheet(rows);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "ملخص المخالفات");

    XLSX.writeFile(workbook, "تقرير_المخالفات.xlsx");
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
                توزيع الأعداد حسب الحالة
              </Text>

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
          </Stack>
        </Card>

        {/* ============================
      DISTRICTS
============================ */}

        <Stack gap="md">
          {Object.entries(stats)

            .map(([district, data]) => (
              <DistrictCard key={district} district={district} data={data} />
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
