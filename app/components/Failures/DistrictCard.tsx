"use client";

import { useMemo, useRef, useState } from "react";
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
  ActionIcon,
} from "@mantine/core";

import {
  IconBuildings,
  IconCopy,
  IconDownload,
  IconMapPin,
  IconUser,
} from "@tabler/icons-react";

import { toPng } from "html-to-image";
import * as XLSX from "xlsx-js-style";

import FailureListModal from "../FailureListModal";

import {
  statusConfig,
  summaryOnlyStatuses,
} from "./statusConfig";

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
   HELPERS
========================================================= */

const isStatusKey = (
  status: string
): status is StatusKey => {
  return Object.prototype.hasOwnProperty.call(
    statusConfig,
    status
  );
};

const getStatusConfig = (
  status: string
) => {
  if (!isStatusKey(status)) {
    return undefined;
  }

  return statusConfig[status];
};

const getUserCount = (
  userData: UserData
) => {
  if (
    typeof userData.count === "number"
  ) {
    return userData.count;
  }

  if (
    typeof userData.total === "number"
  ) {
    return userData.total;
  }

  return userData.ids?.length ?? 0;
};

const getStatusColor = (
  status: string
) => {
  return (
    getStatusConfig(status)?.color ??
    "gray"
  );
};

const getStatusLabel = (
  status: string
) => {
  return (
    getStatusConfig(status)?.label ??
    (status === "Unknown"
      ? "غير محدد"
      : status)
  );
};

const getStatusIcon = (
  status: string
) => {
  return (
    getStatusConfig(status)?.icon ??
    null
  );
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
  /* =======================================================
     STATE
  ======================================================= */

  const [
    failureModalOpened,
    setFailureModalOpened,
  ] = useState(false);

  const [
    selectedFailures,
    setSelectedFailures,
  ] = useState<FailureItem[]>([]);

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("");

  const [
    selectedStatusKey,
    setSelectedStatusKey,
  ] = useState("");

  const [
    opened,
    setOpened,
  ] = useState(false);

  const [
    selectedUser,
    setSelectedUser,
  ] =
    useState<SelectedUser | null>(
      null
    );

  const [
    summaryModalOpened,
    setSummaryModalOpened,
  ] = useState(false);

  const [
    usersModalOpened,
    setUsersModalOpened,
  ] = useState(false);

  const usersModalRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /* =======================================================
     DISTRICT COLORS
  ======================================================= */

  const districtColors: Record<
    string,
    {
      main: string;
      light: string;
    }
  > = {
    "منطقة طارق": {
      main: "#E8590C",
      light: "#FFF4E6",
    },

    "منطقة الجبيهة": {
      main: "#2F9E44",
      light: "#EBF7EE",
    },

    "منطقة الجبيهه": {
      main: "#2F9E44",
      light: "#EBF7EE",
    },

    "منطقة ابو نصير": {
      main: "#C92A2A",
      light: "#FFF0F0",
    },

    "منطقة أبو نصير": {
      main: "#C92A2A",
      light: "#FFF0F0",
    },

    "منطقة ابونصير": {
      main: "#C92A2A",
      light: "#FFF0F0",
    },

    "منطقة شفا بدران": {
      main: "#FCC419",
      light: "#FFF9DB",
    },

    "منطقة احد": {
      main: "#7950F2",
      light: "#F3F0FF",
    },

    "منطقة أحد": {
      main: "#7950F2",
      light: "#F3F0FF",
    },

    "منطقة ماركا": {
      main: "#F06595",
      light: "#FFF0F6",
    },

    "منطقة النصر": {
      main: "#20C997",
      light: "#E6FCF5",
    },

    "منطقة تلاع العلي وام السماق وخلدا":
      {
        main: "#795548",
        light: "#EFEBE9",
      },

    "منطقة تلاع العلي وأم السماق وخلدا":
      {
        main: "#795548",
        light: "#EFEBE9",
      },

    "مخالفات حسب مؤشرات الأداء": {
      main: "#15AABF",
      light: "#E3FAFC",
    },
  };

  const districtTheme =
    districtColors[district] || {
      main: "#868e96",
      light: "#f1f3f5",
    };

  /* =======================================================
     DISTRICT STATUS TOTALS
  ======================================================= */

  const districtStatuses =
    useMemo(() => {
      const result: Record<
        string,
        number
      > = {};

      Object.keys(
        statusConfig
      ).forEach((status) => {
        result[status] = 0;
      });

      Object.values(
        data?.blocks || {}
      ).forEach((block: any) => {
        Object.entries(
          block?.statuses || {}
        ).forEach(
          ([
            status,
            statusData,
          ]) => {
            if (
              result[status] ===
              undefined
            ) {
              result[status] = 0;
            }

            result[status] +=
              Number(
                (statusData as any)
                  ?.total ?? 0
              );
          }
        );
      });

      return result;
    }, [data?.blocks]);

  /* =======================================================
     USER ACHIEVEMENT
     Resolved + PendingFieldMonitorVerification
  ======================================================= */

  const rankedUsers =
    useMemo(() => {
      const users: Record<
        string,
        {
          name: string;
          resolved: number;
          field: number;
          total: number;
          ids: (string | number)[];
        }
      > = {};

      Object.values(
        data?.blocks || {}
      ).forEach((block: any) => {
        Object.entries(
          block?.statuses || {}
        ).forEach(
          ([
            status,
            statusData,
          ]) => {
            if (
              status !==
                "Resolved" &&
              status !==
                "PendingFieldMonitorVerification"
            ) {
              return;
            }

            Object.entries(
              (statusData as any)
                ?.users || {}
            ).forEach(
              ([
                user,
                rawUserData,
              ]) => {
                const userData =
                  rawUserData as UserData;

                const count =
                  getUserCount(
                    userData
                  );

                if (!users[user]) {
                  users[user] = {
                    name: user,
                    resolved: 0,
                    field: 0,
                    total: 0,
                    ids: [],
                  };
                }

                if (
                  status ===
                  "Resolved"
                ) {
                  users[
                    user
                  ].resolved += count;
                }

                if (
                  status ===
                  "PendingFieldMonitorVerification"
                ) {
                  users[
                    user
                  ].field += count;
                }

                users[
                  user
                ].ids.push(
                  ...(userData.ids ||
                    [])
                );
              }
            );
          }
        );
      });

      return Object.values(
        users
      )
        .map((user) => ({
          ...user,
          total:
            user.resolved +
            user.field,
          ids: [
            ...new Set(
              user.ids
            ),
          ],
        }))
        .sort(
          (a, b) =>
            b.total - a.total
        );
    }, [data?.blocks]);

  /* =======================================================
     KPI
  ======================================================= */

  const districtTotal =
    Number(data?.total || 0);

  const fieldCount =
    districtStatuses[
      "PendingFieldMonitorVerification"
    ] || 0;

  const resolvedCount =
    districtStatuses[
      "Resolved"
    ] || 0;

  const fieldPercentage =
    districtTotal
      ? Number(
          (
            (fieldCount /
              districtTotal) *
            100
          ).toFixed(1)
        )
      : 0;

  const resolvedPercentage =
    districtTotal
      ? Number(
          (
            (resolvedCount /
              districtTotal) *
            100
          ).toFixed(1)
        )
      : 0;

  const achievement =
    Number(
      (
        fieldPercentage +
        resolvedPercentage
      ).toFixed(1)
    );

  /* =======================================================
     OPEN STATUS MODAL
  ======================================================= */

  const openStatusFailures = (
    status: string
  ) => {
    const failures: FailureItem[] =
      [];

    const seen = new Set<
      string | number
    >();

    Object.entries(
      data?.blocks || {}
    ).forEach(
      ([
        blockName,
        blockData,
      ]) => {
        const statusData =
          (blockData as any)
            ?.statuses?.[
            status
          ];

        if (!statusData) {
          return;
        }

        Object.entries(
          statusData.users || {}
        ).forEach(
          ([
            user,
            rawUserData,
          ]) => {
            const userData =
              rawUserData as UserData;

            (
              userData.ids || []
            ).forEach(
              (id) => {
                if (
                  seen.has(id)
                ) {
                  return;
                }

                seen.add(id);

                failures.push({
                  id,
                  district,
                  districtName:
                    district,
                  block:
                    blockName,
                  blockName:
                    blockName,
                  status,
                  userName: user,
                });
              }
            );
          }
        );
      }
    );

    failures.sort((a, b) => {
      const blockA =
        String(
          a.blockName ??
            a.block ??
            ""
        );

      const blockB =
        String(
          b.blockName ??
            b.block ??
            ""
        );

      const blockCompare =
        blockA.localeCompare(
          blockB,
          "ar",
          {
            sensitivity:
              "base",
          }
        );

      if (
        blockCompare !== 0
      ) {
        return blockCompare;
      }

      return String(
        a.id
      ).localeCompare(
        String(b.id),
        "ar"
      );
    });

    setSelectedFailures(
      failures
    );

    setSelectedStatus(
      getStatusLabel(status)
    );

    setSelectedStatusKey(
      status
    );

    setFailureModalOpened(
      true
    );
  };

  /* =======================================================
     OPEN USER UNDER SPECIFIC STATUS
  ======================================================= */

  const openUserStatusFailures =
    (
      user: string,
      status: string
    ) => {
      const failures: FailureItem[] =
        [];

      const seen = new Set<
        string | number
      >();

      Object.entries(
        data?.blocks || {}
      ).forEach(
        ([
          blockName,
          blockData,
        ]) => {
          const currentStatus =
            (blockData as any)
              ?.statuses?.[
              status
            ];

          if (!currentStatus) {
            return;
          }

          const currentUser =
            currentStatus.users?.[
              user
            ] as
              | UserData
              | undefined;

          if (!currentUser) {
            return;
          }

          (
            currentUser.ids || []
          ).forEach(
            (id) => {
              if (
                seen.has(id)
              ) {
                return;
              }

              seen.add(id);

              failures.push({
                id,
                district,
                districtName:
                  district,
                block:
                  blockName,
                blockName:
                  blockName,
                status,
                userName: user,
              });
            }
          );
        }
      );

      failures.sort((a, b) => {
        const blockA =
          String(
            a.blockName ??
              a.block ??
              ""
          );

        const blockB =
          String(
            b.blockName ??
              b.block ??
              ""
          );

        const blockCompare =
          blockA.localeCompare(
            blockB,
            "ar",
            {
              sensitivity:
                "base",
            }
          );

        if (
          blockCompare !== 0
        ) {
          return blockCompare;
        }

        return String(
          a.id
        ).localeCompare(
          String(b.id),
          "ar"
        );
      });

      setSelectedUser({
        name: user,
        failures,
      });

      setOpened(true);
    };

  /* =======================================================
     OPEN ACHIEVEMENT USER
  ======================================================= */

  const openAchievementUser =
    (userName: string) => {
      const failures: FailureItem[] =
        [];

      const seen = new Set<
        string | number
      >();

      Object.entries(
        data?.blocks || {}
      ).forEach(
        ([
          blockName,
          blockData,
        ]) => {
          Object.entries(
            (blockData as any)
              ?.statuses || {}
          ).forEach(
            ([
              status,
              statusData,
            ]) => {
              if (
                status !==
                  "Resolved" &&
                status !==
                  "PendingFieldMonitorVerification"
              ) {
                return;
              }

              const userData =
                (statusData as any)
                  ?.users?.[
                  userName
                ] as UserData;

              if (!userData) {
                return;
              }

              (
                userData.ids || []
              ).forEach(
                (id) => {
                  if (
                    seen.has(id)
                  ) {
                    return;
                  }

                  seen.add(id);

                  failures.push({
                    id,
                    district,
                    districtName:
                      district,
                    block:
                      blockName,
                    blockName:
                      blockName,
                    status,
                    userName:
                      userName,
                  });
                }
              );
            }
          );
        }
      );

      setSelectedUser({
        name: userName,
        failures,
      });

      setOpened(true);
    };

  /* =======================================================
     EXPORT EXCEL
  ======================================================= */

  const exportDistrictExcel =
    () => {
      const rows: any[] =
        [];

      Object.entries(
        data?.blocks || {}
      ).forEach(
        ([
          block,
          blockData,
        ]) => {
          const row: any = {
            المنطقة: district,
            الحي: block,
            "إجمالي المخالفات":
              Number(
                (blockData as any)
                  ?.total || 0
              ),
            "في انتظار القبول": 0,
            "قيد التنفيذ": 0,
            "قيد مراجعة AVTR": 0,
            "انتظار التحقق الميداني": 0,
            "تم الحل": 0,
            "تم رفض الحل": 0,
            مرفوض: 0,
          };

          const statusMap: Record<
            string,
            string
          > = {
            PendingSpValidation:
              "في انتظار القبول",

            InProgress:
              "قيد التنفيذ",

            PendingSupervisorReview:
              "قيد مراجعة AVTR",

            PendingFieldMonitorVerification:
              "انتظار التحقق الميداني",

            Resolved:
              "تم الحل",

            ResolutionRejected:
              "تم رفض الحل",

            Rejected:
              "مرفوض",
          };

          Object.entries(
            (blockData as any)
              ?.statuses || {}
          ).forEach(
            ([
              status,
              statusData,
            ]) => {
              const key =
                statusMap[status];

              if (key) {
                row[key] =
                  Number(
                    (
                      statusData as any
                    )?.total || 0
                  );
              }
            }
          );

          const field =
            Number(
              row[
                "انتظار التحقق الميداني"
              ] || 0
            );

          const resolved =
            Number(
              row[
                "تم الحل"
              ] || 0
            );

          const total =
            Number(
              row[
                "إجمالي المخالفات"
              ] || 0
            );

          row["نسبة الإنجاز"] =
            total
              ? `${(
                  ((field +
                    resolved) /
                    total) *
                  100
                ).toFixed(1)}%`
              : "0%";

          rows.push(row);
        }
      );

      if (!rows.length) {
        return;
      }

      const total: any = {
        المنطقة: "",
        الحي: "المجموع",
      };

      Object.keys(
        rows[0]
      ).forEach((key) => {
        if (
          key === "المنطقة" ||
          key === "الحي" ||
          key ===
            "نسبة الإنجاز"
        ) {
          return;
        }

        total[key] =
          rows.reduce(
            (
              sum,
              row
            ) =>
              sum +
              Number(
                row[key] || 0
              ),
            0
          );
      });

      total[
        "نسبة الإنجاز"
      ] =
        districtTotal
          ? `${(
              ((fieldCount +
                resolvedCount) /
                districtTotal) *
              100
            ).toFixed(1)}%`
          : "0%";

      rows.push(total);

      const sheet =
        XLSX.utils.json_to_sheet(
          rows
        );

      sheet["!views"] = [
        {
          rightToLeft: true,
        },
      ];

      sheet["!cols"] = [
        { wch: 24 },
        { wch: 34 },
        { wch: 18 },
        { wch: 20 },
        { wch: 16 },
        { wch: 22 },
        { wch: 24 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
      ];

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        sheet,
        district.substring(
          0,
          31
        )
      );

      XLSX.writeFile(
        workbook,
        `تقرير_${district}.xlsx`
      );
    };

  /* =======================================================
     EXPORT USERS IMAGE
  ======================================================= */

  const exportUsersImage =
    async () => {
      if (
        !usersModalRef.current
      ) {
        return;
      }

      try {
        const image =
          await toPng(
            usersModalRef.current,
            {
              quality: 1,
              pixelRatio: 2,
              backgroundColor:
                "#ffffff",
            }
          );

        const link =
          document.createElement(
            "a"
          );

        link.download =
          `إنجازات_المستخدمين_${district}.png`;

        link.href = image;

        link.click();
      } catch (error) {
        console.error(
          error
        );
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Card
      radius={24}
      p="md"
      shadow="xs"
      dir="rtl"
      style={{
        background:
          "#ffffff",
        border:
          "1px solid #edf0f2",
        overflow:
          "hidden",
      }}
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <Group
        justify="space-between"
        align="center"
        mb="sm"
      >
        <Group gap="xs">
          <Avatar
            size={36}
            radius="xl"
            variant="light"
            color={
              districtTheme.main
            }
          >
            <IconBuildings
              size={19}
            />
          </Avatar>

          <Box>
            <Text
              fw={900}
              size="md"
              c={
                districtTheme.main
              }
            >
              {district}
            </Text>

            <Text
              size="10px"
              c="dimmed"
              fw={600}
            >
              ملخص المخالفات والأداء
            </Text>
          </Box>
        </Group>

        <Group gap={5}>
          <Badge
            size="lg"
            radius="xl"
            variant="light"
            color="gray"
          >
            {districtTotal.toLocaleString(
              "en-US"
            )}
          </Badge>

          <ActionIcon
            variant="light"
            color="green"
            radius="xl"
            size={32}
            onClick={
              exportDistrictExcel
            }
          >
            <IconDownload
              size={16}
            />
          </ActionIcon>
        </Group>
      </Group>

      <Divider mb="sm" />

      {/* ===================================================
          PERFORMANCE
      =================================================== */}

      <Card
        radius="md"
        p="sm"
        mb="sm"
        style={{
          background:
            districtTheme.light,
          border:
            `1px solid ${districtTheme.main}18`,
        }}
      >
        <Group
          justify="space-between"
          align="center"
          mb={6}
        >
          <Group gap={6}>
            <Badge
              size="sm"
              radius="xl"
              color={
                districtTheme.main
              }
              variant="filled"
            >
              الأداء
            </Badge>

            <Text
              fw={800}
              size="xs"
            >
              نسبة الإنجاز
            </Text>
          </Group>

          <Text
            fw={900}
            size="lg"
            c={
              districtTheme.main
            }
          >
            {achievement}%
          </Text>
        </Group>

        <Progress
          value={Math.min(
            achievement,
            100
          )}
          color={
            districtTheme.main
          }
          radius="xl"
          size={7}
        />

        <Group
          justify="space-between"
          mt={6}
        >
          <Text
            size="10px"
            c="dimmed"
          >
            انتظار التحقق:{" "}
            <b>
              {fieldCount.toLocaleString(
                "en-US"
              )}
            </b>
          </Text>

          <Text
            size="10px"
            c="dimmed"
          >
            تم الحل:{" "}
            <b>
              {resolvedCount.toLocaleString(
                "en-US"
              )}
            </b>
          </Text>
        </Group>
      </Card>

      {/* ===================================================
          STATUS SUMMARY
      =================================================== */}

      <Group
        justify="space-between"
        mb={6}
      >
        <Text
          fw={800}
          size="xs"
        >
          توزيع الحالات
        </Text>

        <Button
          size="compact-xs"
          variant="subtle"
          color="gray"
          onClick={() =>
            setSummaryModalOpened(
              true
            )
          }
        >
          التفاصيل
        </Button>
      </Group>

      <SimpleGrid
        cols={{
          base: 2,
          sm: 4,
          md: 4,
        }}
        spacing={5}
        mb="sm"
      >
        {Object.entries(
          districtStatuses
        ).map(
          ([
            status,
            count,
          ]) => (
            <Card
              key={status}
              radius="md"
              p={7}
              withBorder
              onClick={() =>
                openStatusFailures(
                  status
                )
              }
              style={{
                cursor:
                  "pointer",
                background:
                  "#ffffff",
                border:
                  "1px solid #edf0f2",
                transition:
                  "all .15s ease",
              }}
            >
              <Group
                justify="space-between"
                align="center"
                gap={5}
              >
                <Group
                  gap={5}
                  wrap="nowrap"
                  style={{
                    minWidth: 0,
                  }}
                >
                  <Box
                    style={{
                      color:
                        getStatusColor(
                          status
                        ),
                      display:
                        "flex",
                    }}
                  >
                    {getStatusIcon(
                      status
                    )}
                  </Box>

                  <Text
                    size="9px"
                    fw={700}
                    truncate
                  >
                    {getStatusLabel(
                      status
                    )}
                  </Text>
                </Group>

                <Badge
                  size="xs"
                  radius="xl"
                  variant="light"
                  color={getStatusColor(
                    status
                  )}
                >
                  {count.toLocaleString(
                    "en-US"
                  )}
                </Badge>
              </Group>
            </Card>
          )
        )}
      </SimpleGrid>

      {/* ===================================================
          BLOCKS
      =================================================== */}

      <SimpleGrid
        cols={{
          base: 1,
          sm: 2,
          md: 3,
          lg: 4,
          xl: 5,
        }}
        spacing={7}
      >
        {Object.entries(
          data?.blocks || {}
        )
          .sort(
            ([, a], [, b]) =>
              Number(
                (b as any)
                  ?.total || 0
              ) -
              Number(
                (a as any)
                  ?.total || 0
              )
          )
          .map(
            ([
              block,
              blockData,
            ]) => {
              const isKpiGroup =
                block.startsWith(
                  "KPI:"
                );

              const displayName =
                isKpiGroup
                  ? block.replace(
                      "KPI:",
                      ""
                    )
                  : block;

              return (
                <Card
                  key={block}
                  radius="md"
                  p="xs"
                  withBorder
                  style={{
                    background:
                      "#fbfcfd",
                    border:
                      "1px solid #edf0f2",
                  }}
                >
                  {/* BLOCK HEADER */}

                  <Group
                    justify="space-between"
                    align="center"
                    mb={6}
                  >
                    <Group
                      gap={5}
                      wrap="nowrap"
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <Avatar
                        size={25}
                        radius="xl"
                        color={
                          isKpiGroup
                            ? "violet"
                            : "blue"
                        }
                        variant="light"
                      >
                        {isKpiGroup ? (
                          "K"
                        ) : (
                          <IconMapPin
                            size={
                              13
                            }
                          />
                        )}
                      </Avatar>

                      <Text
                        fw={800}
                        size="xs"
                        truncate
                      >
                        {isKpiGroup
                          ? displayName
                          : `حي ${displayName}`}
                      </Text>
                    </Group>

                    <Badge
                      size="xs"
                      radius="xl"
                      variant="light"
                      color="gray"
                    >
                      {Number(
                        (blockData as any)
                          ?.total || 0
                      ).toLocaleString(
                        "en-US"
                      )}
                    </Badge>
                  </Group>

                  <Divider
                    mb={5}
                  />

                  {/* STATUS CARDS */}

                  <Stack gap={4}>
                    {Object.entries(
                      (blockData as any)
                        ?.statuses ||
                        {}
                    )
                      .sort(
                        ([, a], [, b]) =>
                          Number(
                            (b as any)
                              ?.total ||
                              0
                          ) -
                          Number(
                            (a as any)
                              ?.total ||
                              0
                          )
                      )
                      .map(
                        ([
                          status,
                          statusData,
                        ]) => {
                          const statusColor =
                            getStatusColor(
                              status
                            );

                          return (
                            <Card
                              key={
                                status
                              }
                              radius="sm"
                              p={6}
                              withBorder
                              style={{
                                background:
                                  "#ffffff",
                                border:
                                  "1px solid #f0f2f4",
                              }}
                            >
                              {/* STATUS HEADER */}

                              <Group
                                justify="space-between"
                                align="center"
                              >
                                <Group
                                  gap={5}
                                  wrap="nowrap"
                                  style={{
                                    minWidth: 0,
                                  }}
                                >
                                  <Box
                                    style={{
                                      display:
                                        "flex",
                                      color:
                                        statusColor,
                                    }}
                                  >
                                    {getStatusIcon(
                                      status
                                    )}
                                  </Box>

                                  <Text
                                    size="10px"
                                    fw={
                                      700
                                    }
                                    truncate
                                  >
                                    {getStatusLabel(
                                      status
                                    )}
                                  </Text>
                                </Group>

                                <Badge
                                  size="xs"
                                  radius="xl"
                                  color={
                                    statusColor
                                  }
                                  variant="light"
                                >
                                  {Number(
                                    (
                                      statusData as any
                                    )?.total ||
                                      0
                                  ).toLocaleString(
                                    "en-US"
                                  )}
                                </Badge>
                              </Group>

                              {/* USERS */}

                              {!summaryOnlyStatuses.includes(
                                status
                              ) &&
                                Object.keys(
                                  (
                                    statusData as any
                                  )
                                    ?.users ||
                                    {}
                                ).length >
                                  0 && (
                                  <Stack
                                    mt={
                                      5
                                    }
                                    gap={
                                      3
                                    }
                                  >
                                    {Object.entries(
                                      (
                                        statusData as any
                                      )
                                        ?.users ||
                                        {}
                                    )
                                      .sort(
                                        (
                                          [
                                            ,
                                            a,
                                          ],
                                          [
                                            ,
                                            b,
                                          ]
                                        ) =>
                                          getUserCount(
                                            b as UserData
                                          ) -
                                          getUserCount(
                                            a as UserData
                                          )
                                      )
                                      .map(
                                        ([
                                          user,
                                          rawUserData,
                                        ]) => {
                                          const userData =
                                            rawUserData as UserData;

                                          const userCount =
                                            getUserCount(
                                              userData
                                            );

                                          return (
                                            <Group
                                              key={
                                                user
                                              }
                                              justify="space-between"
                                              align="center"
                                              gap={
                                                5
                                              }
                                              px={
                                                5
                                              }
                                              py={
                                                3
                                              }
                                              onClick={() =>
                                                openUserStatusFailures(
                                                  user,
                                                  status
                                                )
                                              }
                                              style={{
                                                cursor:
                                                  "pointer",
                                                borderRadius: 7,
                                                transition:
                                                  "background .15s ease, transform .15s ease",
                                              }}
                                              onMouseEnter={(
                                                e
                                              ) => {
                                                e.currentTarget.style.background =
                                                  "#f8f9fa";

                                                e.currentTarget.style.transform =
                                                  "translateX(-1px)";
                                              }}
                                              onMouseLeave={(
                                                e
                                              ) => {
                                                e.currentTarget.style.background =
                                                  "transparent";

                                                e.currentTarget.style.transform =
                                                  "translateX(0)";
                                              }}
                                            >
                                              <Group
                                                gap={
                                                  5
                                                }
                                                wrap="nowrap"
                                                style={{
                                                  minWidth: 0,
                                                  flex: 1,
                                                }}
                                              >
                                                <Avatar
                                                  size={
                                                    22
                                                  }
                                                  radius="xl"
                                                  color={
                                                    statusColor
                                                  }
                                                  variant="light"
                                                >
                                                  <IconUser
                                                    size={
                                                      11
                                                    }
                                                  />
                                                </Avatar>

                                                <Text
                                                  size="10px"
                                                  fw={
                                                    700
                                                  }
                                                  truncate
                                                  style={{
                                                    cursor:
                                                      "pointer",
                                                  }}
                                                >
                                                  {
                                                    user
                                                  }
                                                </Text>
                                              </Group>

                                              <Badge
                                                size="xs"
                                                radius="xl"
                                                color={
                                                  statusColor
                                                }
                                                variant="light"
                                              >
                                                {userCount.toLocaleString(
                                                  "en-US"
                                                )}
                                              </Badge>
                                            </Group>
                                          );
                                        }
                                      )}
                                  </Stack>
                                )}
                            </Card>
                          );
                        }
                      )}
                  </Stack>
                </Card>
              );
            }
          )}
      </SimpleGrid>

      {/* ===================================================
          USER STATUS MODAL
      =================================================== */}

      <Modal
        dir="rtl"
        opened={opened}
        onClose={() =>
          setOpened(false)
        }
        centered
        size="md"
        radius="lg"
        title={
          selectedUser
            ? `مخالفات ${selectedUser.name}`
            : ""
        }
      >
        <Stack gap="sm">
          <Group
            justify="space-between"
          >
            <Box>
              <Text
                size="xs"
                c="dimmed"
              >
                عدد المخالفات
              </Text>

              <Text
                fw={900}
                size="lg"
              >
                {selectedUser?.failures?.length ||
                  0}
              </Text>
            </Box>

            <Button
              size="xs"
              radius="xl"
              variant="light"
              leftSection={
                <IconCopy
                  size={15}
                />
              }
              onClick={() => {
                const text =
                  (
                    selectedUser?.failures ||
                    []
                  )
                    .map(
                      (item) =>
                        `${item.id} - ${
                          item.blockName ??
                          item.block ??
                          ""
                        }`
                    )
                    .join("\n");

                navigator.clipboard.writeText(
                  text
                );
              }}
            >
              نسخ
            </Button>
          </Group>

          <Divider />

          <ScrollArea
            h={450}
            offsetScrollbars
          >
            <Stack gap={5}>
              {selectedUser?.failures?.map(
                (
                  item,
                  index
                ) => (
                  <Card
                    key={`${item.id}-${index}`}
                    radius="sm"
                    p="xs"
                    withBorder
                    style={{
                      background:
                        "#fff",
                    }}
                  >
                    <Group
                      justify="space-between"
                      align="center"
                    >
                      <Group
                        gap="xs"
                      >
                        <Badge
                          size="sm"
                          radius="xl"
                          variant="light"
                          color={getStatusColor(
                            item.status ||
                              ""
                          )}
                        >
                          {
                            item.id
                          }
                        </Badge>

                        <Box>
                          <Text
                            size="9px"
                            c="dimmed"
                          >
                            الحي
                          </Text>

                          <Text
                            size="xs"
                            fw={800}
                          >
                            {item.blockName ??
                              item.block ??
                              "غير محدد"}
                          </Text>
                        </Box>
                      </Group>

                      <Badge
                        size="xs"
                        variant="light"
                        color={getStatusColor(
                          item.status ||
                            ""
                        )}
                      >
                        {getStatusLabel(
                          item.status ||
                            ""
                        )}
                      </Badge>
                    </Group>
                  </Card>
                )
              )}

              {!selectedUser
                ?.failures
                ?.length && (
                <Card
                  radius="md"
                  p="xl"
                  withBorder
                >
                  <Text
                    ta="center"
                    size="sm"
                    c="dimmed"
                  >
                    لا توجد مخالفات
                  </Text>
                </Card>
              )}
            </Stack>
          </ScrollArea>
        </Stack>
      </Modal>

      {/* ===================================================
          SUMMARY MODAL
      =================================================== */}

      <Modal
        dir="rtl"
        opened={
          summaryModalOpened
        }
        onClose={() =>
          setSummaryModalOpened(
            false
          )
        }
        centered
        size="lg"
        radius="lg"
        title="ملخص حالات المخالفات"
      >
        <SimpleGrid
          cols={{
            base: 2,
            sm: 3,
          }}
          spacing="xs"
        >
          {Object.entries(
            districtStatuses
          ).map(
            ([
              status,
              count,
            ]) => (
              <Card
                key={status}
                radius="md"
                p="sm"
                withBorder
                style={{
                  cursor:
                    "pointer",
                }}
                onClick={() => {
                  setSummaryModalOpened(
                    false
                  );

                  openStatusFailures(
                    status
                  );
                }}
              >
                <Group
                  justify="space-between"
                  gap={5}
                >
                  <Text
                    size="xs"
                    fw={700}
                  >
                    {getStatusLabel(
                      status
                    )}
                  </Text>

                  <Badge
                    size="sm"
                    color={getStatusColor(
                      status
                    )}
                    variant="light"
                  >
                    {count.toLocaleString(
                      "en-US"
                    )}
                  </Badge>
                </Group>
              </Card>
            )
          )}
        </SimpleGrid>
      </Modal>

      {/* ===================================================
          USERS ACHIEVEMENT MODAL
      =================================================== */}

      <Modal
        dir="rtl"
        opened={
          usersModalOpened
        }
        onClose={() =>
          setUsersModalOpened(
            false
          )
        }
        centered
        size="lg"
        radius="lg"
        title="🏆 إنجازات المستخدمين"
      >
        <Group
          justify="flex-end"
          mb="xs"
        >
          <ActionIcon
            variant="light"
            color="green"
            radius="xl"
            onClick={
              exportUsersImage
            }
          >
            <IconDownload
              size={16}
            />
          </ActionIcon>
        </Group>

        <Box
          ref={usersModalRef}
        >
          {/* TOP USERS */}

          <SimpleGrid
            cols={{
              base: 1,
              sm: 3,
            }}
            spacing="xs"
            mb="md"
          >
            {rankedUsers
              .slice(0, 3)
              .map(
                (
                  user,
                  index
                ) => (
                  <Card
                    key={
                      user.name
                    }
                    radius="md"
                    p="sm"
                    withBorder
                    onClick={() =>
                      openAchievementUser(
                        user.name
                      )
                    }
                    style={{
                      cursor:
                        "pointer",
                      textAlign:
                        "center",
                      background:
                        index === 0
                          ? "#fff9db"
                          : index ===
                              1
                            ? "#f8f9fa"
                            : "#fff4e6",
                      borderColor:
                        index === 0
                          ? "#ffd43b"
                          : index ===
                              1
                            ? "#ced4da"
                            : "#ffa94d",
                    }}
                  >
                    <Text
                      size="22px"
                    >
                      {index ===
                      0
                        ? "🥇"
                        : index ===
                            1
                          ? "🥈"
                          : "🥉"}
                    </Text>

                    <Text
                      size="xs"
                      fw={800}
                      mt={4}
                      truncate
                    >
                      {
                        user.name
                      }
                    </Text>

                    <Badge
                      mt={5}
                      radius="xl"
                      variant="light"
                      color="blue"
                    >
                      {
                        user.total
                      }
                    </Badge>
                  </Card>
                )
              )}
          </SimpleGrid>

          <Table
            striped
            highlightOnHover
            withTableBorder
            fz="xs"
            dir="rtl"
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  #
                </Table.Th>

                <Table.Th>
                  المستخدم
                </Table.Th>

                <Table.Th>
                  تم الحل
                </Table.Th>

                <Table.Th>
                  انتظار التحقق
                </Table.Th>

                <Table.Th>
                  الإجمالي
                </Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {rankedUsers.map(
                (
                  user,
                  index
                ) => (
                  <Table.Tr
                    key={
                      user.name
                    }
                    style={{
                      cursor:
                        "pointer",
                    }}
                    onClick={() =>
                      openAchievementUser(
                        user.name
                      )
                    }
                  >
                    <Table.Td>
                      <Badge
                        size="xs"
                        variant="light"
                        color="gray"
                      >
                        {index +
                          1}
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      <Group
                        gap={5}
                        wrap="nowrap"
                      >
                        <Avatar
                          size={22}
                          radius="xl"
                          color="blue"
                          variant="light"
                        >
                          {user.name.charAt(
                            0
                          )}
                        </Avatar>

                        <Text
                          size="xs"
                          fw={700}
                          truncate
                        >
                          {
                            user.name
                          }
                        </Text>
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Badge
                        size="xs"
                        color="green"
                        variant="light"
                      >
                        {
                          user.resolved
                        }
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      <Badge
                        size="xs"
                        color="blue"
                        variant="light"
                      >
                        {
                          user.field
                        }
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      <Badge
                        size="xs"
                        color="gray"
                        variant="light"
                      >
                        {
                          user.total
                        }
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                )
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Modal>

      {/* ===================================================
          FAILURE LIST MODAL
      =================================================== */}

      <FailureListModal
        opened={
          failureModalOpened
        }
        onClose={() =>
          setFailureModalOpened(
            false
          )
        }
        title={`قائمة المخالفات - ${selectedStatus}`}
        failures={
          selectedFailures
        }
        status={
          selectedStatusKey
        }
      />
    </Card>
  );
}