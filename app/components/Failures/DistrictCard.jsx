"use client";

import { useState, useRef } from "react";
import { motion } from "motion/react";
import {
  Card,
  Text,
  Group,
  Badge,
  Stack,
  Divider,
  SimpleGrid,
  Avatar,
  Modal,
  Button,
  Box,
  ScrollArea,
  Table,
  Progress,
} from "@mantine/core";

import {
  IconBuildings,
  IconDownload,
  IconEye,
  IconLiveView,
  IconMapPin,
  IconUser,
} from "@tabler/icons-react";
import { toPng } from "html-to-image";
import { ActionIcon } from "@mantine/core";
import FailureListModal from "../FailureListModal";
import { statusConfig, summaryOnlyStatuses } from "./statusConfig";

export default function DistrictCard({ district, data }) {
  const [failureModalOpened, setFailureModalOpened] = useState(false);

  const [selectedFailures, setSelectedFailures] = useState([]);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedStatusKey, setSelectedStatusKey] = useState("");
  const [opened, setOpened] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  // Modal ملخص الحالات
  const [summaryModalOpened, setSummaryModalOpened] = useState(false);

  // Modal ملخص المستخدمين
  const [usersModalOpened, setUsersModalOpened] = useState(false);
  const usersModalRef = useRef(null);
  // ==================================
  // تجميع الحالات لكل منطقة
  // ==================================

  const districtStatuses = {};

  // ==================================
  // تجميع المستخدمين حسب الحالة
  // ==================================

  const districtUsersByStatus = {};

  const usersAchievement = {};

  Object.values(data.blocks || {}).forEach((block) => {
    Object.entries(block.statuses || {}).forEach(([status, statusData]) => {
      if (!districtUsersByStatus[status]) {
        districtUsersByStatus[status] = {};
      }

      Object.entries(statusData.users || {}).forEach(([user, userData]) => {
        if (!districtUsersByStatus[status][user]) {
          districtUsersByStatus[status][user] = {
            count: 0,
            ids: [],
          };
        }

        districtUsersByStatus[status][user].count += userData.count;

        districtUsersByStatus[status][user].ids = [
          ...districtUsersByStatus[status][user].ids,
          ...(userData.ids || []),
        ];
      });
    });
  }); // ================================
  // تجميع إنجاز المستخدمين
  // Resolved + PendingFieldMonitorVerification
  // ================================

  Object.values(data.blocks || {}).forEach((block) => {
    Object.entries(block.statuses || {}).forEach(([status, statusData]) => {
      if (status !== "Resolved" && status !== "PendingFieldMonitorVerification")
        return;

      Object.entries(statusData.users || {}).forEach(([user, userData]) => {
        if (!usersAchievement[user]) {
          usersAchievement[user] = {
            name: user,
            resolved: 0,
            field: 0,
            total: 0,
            ids: [],
          };
        }

        if (status === "Resolved") {
          usersAchievement[user].resolved += userData.count;
        }

        if (status === "PendingFieldMonitorVerification") {
          usersAchievement[user].field += userData.count;
        }

        usersAchievement[user].ids.push(...(userData.ids || []));
      });
    });
  });
  const rankedUsers = Object.values(usersAchievement)
    .map((user) => ({
      ...user,

      total: user.resolved + user.field,
    }))
    .sort((a, b) => b.total - a.total);
  Object.keys(statusConfig).forEach((status) => {
    districtStatuses[status] = 0;
  });

  Object.values(data.blocks || {}).forEach((block) => {
    Object.entries(block.statuses || {}).forEach(([status, statusData]) => {
      if (districtStatuses[status] === undefined) {
        districtStatuses[status] = 0;
      }

      districtStatuses[status] += statusData.total;
    });
  });

  const usersByStatus = {};

  Object.keys(statusConfig).forEach((status) => {
    usersByStatus[status] = {};
  });

  Object.values(data.blocks || {}).forEach((block) => {
    Object.entries(block.statuses || {}).forEach(([status, statusData]) => {
      if (summaryOnlyStatuses.includes(status)) return;

      Object.entries(statusData.users || {}).forEach(([user, userData]) => {
        if (!usersByStatus[status]) {
          usersByStatus[status] = {};
        }

        if (!usersByStatus[status][user]) {
          usersByStatus[status][user] = 0;
        }

        usersByStatus[status][user] += userData.count;
      });
    });
  });
  const districtColors = {
    طارق: {
      main: "#228be6",
      light: "#e7f5ff",
    },

    الجبيهة: {
      main: "#099268",
      light: "#ebfbee",
    },

    "ابو نصير": {
      main: "#fa5252",
      light: "#ffe3e3",
    },

    "شفا بدران": {
      main: "#f59f00",
      light: "#fff9db",
    },

    أحد: {
      main: "#fa5252",
      light: "#fff5f5",
    },

    ماركا: {
      main: "#15aabf",
      light: "#e3fafc",
    },
  };

  const districtTotal = data.total || 0;

  const fieldCount = districtStatuses.PendingFieldMonitorVerification || 0;

  const resolvedCount = districtStatuses.Resolved || 0;

  const fieldPercentage = districtTotal
    ? ((fieldCount / districtTotal) * 100).toFixed(1)
    : 0;

  const resolvedPercentage = districtTotal
    ? ((resolvedCount / districtTotal) * 100).toFixed(1)
    : 0;

  const achievement = (
    Number(fieldPercentage) + Number(resolvedPercentage)
  ).toFixed(1);

  const districtTheme = districtColors[district] || {
    main: "#868e96",
    light: "#f1f3f5",
  };

  const exportDistrictExcel = () => {
    const rows = [];

    Object.entries(data.blocks || {}).forEach(([block, blockData]) => {
      const row = {
        المنطقة: district,

        الحي: block,

        "إجمالي المخالفات": blockData.total,

        "في انتظار القبول": 0,

        "قيد التنفيذ": 0,

        "قيد مراجعة AVTR": 0,

        "انتظار التحقق الميداني": 0,

        "تم الحل": 0,

        "تم رفض الحل": 0,

        مرفوض: 0,
      };

      Object.entries(blockData.statuses || {}).forEach(
        ([status, statusData]) => {
          const map = {
            PendingSpValidation: "في انتظار القبول",

            InProgress: "قيد التنفيذ",

            PendingSupervisorReview: "قيد مراجعة AVTR",

            PendingFieldMonitorVerification: "انتظار التحقق الميداني",

            Resolved: "تم الحل",

            ResolutionRejected: "تم رفض الحل",

            Rejected: "مرفوض",
          };

          const key = map[status];

          if (key) {
            row[key] = statusData.total;
          }
        },
      );

      const field = row["انتظار التحقق الميداني"] || 0;

      const resolved = row["تم الحل"] || 0;

      row["نسبة الإنجاز"] = blockData.total
        ? (((field + resolved) / blockData.total) * 100).toFixed(1) + "%"
        : "0%";

      rows.push(row);
    });

    // إضافة Footer

    const total = {
      الحي: "المجموع",
    };

    Object.keys(rows[0]).forEach((key) => {
      if (key !== "المنطقة" && key !== "الحي" && key !== "نسبة الإنجاز") {
        total[key] = rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
      }
    });

    rows.push(total);

    const sheet = XLSX.utils.json_to_sheet(rows);

    const book = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(book, sheet, district);

    XLSX.writeFile(book, `تقرير_${district}.xlsx`);
  };
  return (
    <Card radius="xl" p="md" shadow="xs">
      {/* ================= HEADER ================= */}

      <Group
        justify="space-between"
        align="center"
        mb="xs"
        style={{
          position: "relative",
          minHeight: 50,
        }}
      >
        {/* اسم المنطقة بالمنتصف الحقيقي */}
        <Group
          gap="sm"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: "max-content",
            maxWidth: "70%",
          }}
        >
          <Badge
            size="xl"
            radius="xl"
            variant="filled"
            p={8}
            style={{
              background: districtTheme.main,
              flexShrink: 0,
            }}
          >
            <IconBuildings size={20} />
          </Badge>

          <Text
            fw={900}
            c={districtTheme.main}
            ta="center"
            style={{
              fontSize: "clamp(20px, 4vw, 32px)",
              lineHeight: 1.1,
              letterSpacing: "-0.5px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            منطقة {district}
          </Text>
        </Group>

        {/* الزر يمين */}
      </Group>
      <Card
        radius="30"
        p="lg"
        mt="md"
        mb={10}
        withBorder
        style={{
          background: "#ffffff",

          boxShadow: "0 10px 30px rgba(0,0,0,.05)",
        }}
      >
        <Stack gap="md">
          <Box
            style={{
              textAlign: "center",
            }}
          >
            <Text ta="center" fw={900} size="48px" c={districtTheme.main}>
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
            spacing="sm"
          >
            <BoxStat title="الاجمالي الكلي" value={districtTotal} />

            <BoxStat
              title="نسبة التحقق الميداني"
              value={`${fieldPercentage}%`}
            />

            <BoxStat title="نسبة تم الحل" value={`${resolvedPercentage}%`} />
          </SimpleGrid>
        </Stack>
        <Card
          radius="24"
          p="xs"
          mt="md"
          mb="md"
          style={{
            background: "#f8f9fa",

            display: "flex",

            flexDirection: "column",

            alignItems: "center",

            gap: "sm",
          }}
        >
          <Text fw={900} mb={10} size="xl" c="gray">
            توزيع اعداد المخالفات حسب الحالة
          </Text>

          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
            {Object.entries(districtStatuses).map(([status, count]) => (
              <Badge
                key={status}
                size="md"
                radius="xl"
                px="xs"
                py={10}
                variant="light"
                color={statusConfig[status]?.color || "gray"}
                style={{
                  width: "100%",
                  height: "auto",
                  minHeight: 55,
                  cursor: "pointer",

                  justifyContent: "center",
                }}
                onClick={() => {
                  const failureMap = new Map();

                  Object.entries(data.blocks || {}).forEach(
                    ([blockName, blockData]) => {
                      const statusData = blockData.statuses?.[status];

                      if (!statusData) return;

                      Object.values(statusData.users || {}).forEach((user) => {
                        (user.ids || []).forEach((id) => {
                          failureMap.set(id, {
                            id,

                            district,

                            block: blockName,
                          });
                        });
                      });

                      (statusData.ids || []).forEach((id) => {
                        failureMap.set(id, {
                          id,

                          district,

                          block: blockName,
                        });
                      });
                    },
                  );

                  const failures = Array.from(failureMap.values());

                  setSelectedFailures(failures);

                  setSelectedStatus(statusConfig[status]?.label || status);

                  setSelectedStatusKey(status);

                  setFailureModalOpened(true);
                }}
              >
                <Stack gap={2} align="center" justify="center">
                  <Text size="xs" fw={700} ta="center" lh={1.2}>
                    {statusConfig[status]?.label || status}
                  </Text>

                  <Text size="sm" fw={900} lh={1}>
                    {count}
                  </Text>
                </Stack>
              </Badge>
            ))}

            <motion.div
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                background:
                  "linear-gradient(90deg, #748ffc, #91a7ff, #dbe4ff, #91a7ff, #748ffc)",
                backgroundSize: "300% 300%",
                borderRadius: "999px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(116,143,252,0.35)",
                width: "100%",
              }}
              onClick={() => setUsersModalOpened(true)}
            >
              <Badge
                radius="md"
                size="md"
                variant="transparent"
                style={{
                  width: "100%",
                  color: "#2f3e9e",
                  fontWeight: 900,
                  fontSize: "13px",
                  padding: "10px 18px",
                  justifyContent: "center",
                }}
              >
                🏆 إنجازات المستخدمين
              </Badge>
            </motion.div>
          </SimpleGrid>
        </Card>
      </Card>

      {/* ================= BLOCKS ================= */}

      {/* ================= STATUS SUMMARY ================= */}

      <SimpleGrid
        cols={{
          base: 1,

          sm: 4,

          md: 5,
        }}
        spacing="xs"
      >
        {Object.entries(data.blocks || {}).map(([block, blockData]) => (
          <Card
            key={block}
            radius="md"
            p="xs"
            shadow="xs"
            style={{
              background: "rgba(255,255,255,0.45)",

              backdropFilter: "blur(14px)",

              WebkitBackdropFilter: "blur(14px)",

              border: "1px solid rgba(255,255,255,0.6)",

              boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            }}
          >
            {/* HEADER BLOCK */}

            <Group justify="space-between" mb={5}>
              <Group gap={5}>
                <Badge size="sm" radius="xl" variant="light" color="blue" p={5}>
                  <IconMapPin size={14} />
                </Badge>

                <Text fw={700} size="md">
                  حي {block}
                </Text>
              </Group>

              <Badge size="md" radius="xl" variant="filled" color="blue">
                {blockData.total}
              </Badge>
            </Group>

            <Stack gap={4}>
              {Object.entries(blockData.statuses || {}).map(
                ([status, statusData]) => (
                  <Card
                    key={status}
                    radius="sm"
                    p={6}
                    style={{
                      background: statusConfig[status]?.bg || "#fff",

                      border: "none",
                    }}
                  >
                    <Group justify="space-between">
                      <Group gap={5}>
                        {statusConfig[status]?.icon}

                        <Text fw={600} size="xs">
                          {statusConfig[status]?.label || status}
                        </Text>
                      </Group>

                      <Badge
                        size="xs"
                        color={statusConfig[status]?.color || "gray"}
                        variant="light"
                      >
                        {statusData.total}
                      </Badge>
                    </Group>

                    {!summaryOnlyStatuses.includes(status) && (
                      <Stack mt={5} gap={4}>
                        {Object.entries(statusData.users || {}).map(
                          ([user, count]) => (
                            <Group
                              key={user}
                              justify="space-between"
                              p={4}
                              style={{
                                background: "rgba(255,255,255,.7)",

                                borderRadius: 6,
                              }}
                            >
                              <Group gap={5}>
                                <Avatar
                                  size="xs"
                                  radius="xl"
                                  color="blue"
                                  variant="light"
                                >
                                  <IconUser size={11} />
                                </Avatar>

                                <Text
                                  size="10px"
                                  fw={700}
                                  style={{
                                    cursor: "pointer",
                                  }}
                                  onClick={() => {
                                    setSelectedUser({
                                      name: user,

                                      ids: count.ids,
                                    });

                                    setOpened(true);
                                  }}
                                >
                                  {user}
                                </Text>
                              </Group>

                              <Badge size="xs" variant="outline">
                                {count.count}
                              </Badge>
                            </Group>
                          ),
                        )}
                      </Stack>
                    )}
                  </Card>
                ),
              )}
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {/* ================= USER MODAL ================= */}

      <Modal
        dir="rtl"
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          selectedUser
            ? `قائمة المخالفات التي قام ${selectedUser.name} بإجراء عليها`
            : ""
        }
        centered
        styles={{
          title: {
            fontSize: "14px",
            fontWeight: 700,
          },
        }}
      >
        <Stack>
          <Text size="sm" c="dimmed" fw={700}>
            عدد المخالفات: {selectedUser?.ids?.length || 0}
          </Text>

          {selectedUser?.ids?.map((id, index) => (
            <Card key={`${id}-${index}`} withBorder radius="md" p="sm">
              <Group justify="space-between">
                <Text fw={700}>رقم المخالفة</Text>

                <Badge size="lg" variant="light" color="blue">
                  {id}
                </Badge>
              </Group>
            </Card>
          ))}
        </Stack>
      </Modal>

      <Modal
        dir="rtl"
        opened={summaryModalOpened}
        onClose={() => setSummaryModalOpened(false)}
        centered
        size="lg"
        title="ملخص حالات المخالفات حسب المنطقة"
        styles={{
          title: {
            fontSize: "15px",
            fontWeight: 800,
          },
        }}
      >
        <SimpleGrid
          cols={{
            base: 1,
            sm: 3,
          }}
          spacing="sm"
        >
          {Object.entries(districtStatuses).map(([status, count]) => (
            <Card
              key={status}
              radius="lg"
              p="md"
              style={{
                textAlign: "center",

                background: statusConfig[status]?.bg || "#fff",

                border: "1px solid #edf2f7",
              }}
            >
              <Text size="sm" fw={700} c="dimmed" mb={5}>
                {statusConfig[status]?.label || status}
              </Text>

              <Text size="xl" fw={900}>
                {count}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      </Modal>
      <Modal
        dir="rtl"
        opened={usersModalOpened}
        onClose={() => setUsersModalOpened(false)}
        centered
        size="lg"
        title="🏆 ترتيب إنجاز المستخدمين"
        styles={{
          title: {
            fontSize: "15px",
            fontWeight: 800,
          },
        }}
      >
        <ActionIcon
          color="green"
          variant="light"
          onClick={async () => {
            if (!usersModalRef.current) return;

            const image = await toPng(usersModalRef.current, {
              quality: 1,
              pixelRatio: 2,
              backgroundColor: "#ffffff",
            });

            const link = document.createElement("a");

            link.download = "ترتيب_إنجاز_المستخدمين.png";

            link.href = image;

            link.click();
          }}
        >
          <IconDownload color="green" stroke={2} />
        </ActionIcon>
        <div ref={usersModalRef}>
          <Box
            mb="md"
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Group align="end" gap="sm">
              {rankedUsers
                .slice(0, 3)
                .reverse()
                .map((user, index) => {
                  const topUsersCount = Math.min(rankedUsers.length, 3);

                  const realIndex = topUsersCount - 1 - index;

                  return (
                    <Card
                      key={user.name}
                      radius="xl"
                      p="xs"
                      style={{
                        width: 100,

                        minHeight:
                          realIndex === 0 ? 130 : realIndex === 1 ? 115 : 100,

                        background:
                          realIndex === 0
                            ? "linear-gradient(135deg,#ffd43b,#fab005)"
                            : realIndex === 1
                              ? "linear-gradient(135deg,#dee2e6,#adb5bd)"
                              : "linear-gradient(135deg,#ffa94d,#e67700)",

                        textAlign: "center",

                        display: "flex",

                        flexDirection: "column",

                        alignItems: "center",

                        justifyContent: "center",

                        overflow: "visible",
                      }}
                    >
                      <Text size="30px">
                        {realIndex === 0 ? "🥇" : realIndex === 1 ? "🥈" : "🥉"}
                      </Text>

                      <Text fw={800} size="xs" mt={8} ta="center">
                        {user.name}
                      </Text>

                      <Badge mt={5} variant="filled" color="dark">
                        {user.total}
                      </Badge>
                    </Card>
                  );
                })}
            </Group>
          </Box>

          <Stack gap="md">
            <Table striped highlightOnHover withTableBorder dir="rtl" fz="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    <Text size="xs" fw={700}>
                      المستخدم
                    </Text>
                  </Table.Th>

                  <Table.Th>
                    <Text size="xs" fw={700}>
                      تم الحل
                    </Text>
                  </Table.Th>

                  <Table.Th>
                    <Text size="xs" fw={700}>
                      انتظار التحقق
                    </Text>
                  </Table.Th>

                  <Table.Th>
                    <Text size="xs" fw={700}>
                      الإجمالي
                    </Text>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {rankedUsers.map((user) => (
                  <Table.Tr key={user.name}>
                    <Table.Td
                      style={{
                        padding: "6px 8px",
                      }}
                    >
                      <Group gap={5} wrap="nowrap">
                        <Avatar size={22} color="blue" variant="light">
                          {user.name.charAt(0)}
                        </Avatar>

                        <Text fw={700} size="xs" truncate>
                          {user.name}
                        </Text>
                      </Group>
                    </Table.Td>

                    <Table.Td
                      style={{
                        padding: "6px 8px",
                      }}
                    >
                      <Badge size="xs" color="green" variant="light">
                        {user.resolved}
                      </Badge>
                    </Table.Td>

                    <Table.Td
                      style={{
                        padding: "6px 8px",
                      }}
                    >
                      <Badge size="xs" color="blue" variant="light">
                        {user.field}
                      </Badge>
                    </Table.Td>

                    <Table.Td
                      style={{
                        padding: "6px 8px",
                      }}
                    >
                      <Badge size="xs" color="gray" variant="light">
                        {user.total}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        </div>
      </Modal>

      <FailureListModal
        opened={failureModalOpened}
        onClose={() => setFailureModalOpened(false)}
        title={`قائمة مخالفات ${selectedStatus}`}
        failures={selectedFailures}
        status={selectedStatusKey}
      />
    </Card>
  );

  function BoxStat({ title, value }) {
    return (
      <Card
        radius="20"
        p="md"
        style={{
          background: "#f8f9fa",

          textAlign: "center",
        }}
      >
        <Text size="xs" fw={700} c="dimmed">
          {title}
        </Text>

        <Text size="28px" fw={900}>
          {value}
        </Text>
      </Card>
    );
  }
}
