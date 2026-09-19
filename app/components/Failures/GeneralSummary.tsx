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
  Progress,
  Divider,
} from "@mantine/core";

import {
  IconMapPin,
  IconChartBar,
  IconCircleCheck,
  IconClock,
  IconAlertCircle,
  IconChartPie,
} from "@tabler/icons-react";

import {
  statusConfig,
} from "./statusConfig";
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
  items?: FailureItem[] ;
};

/* =========================================================
   DISTRICT COLORS
========================================================= */

const DISTRICT_COLORS: Record<string, string> = {
  طارق: "#f59e0b",
  الجبيهة: "#16a34a",
  الجبيهه: "#16a34a",

  "ابو نصير": "#dc2626",
  "أبو نصير": "#dc2626",
  "ابونصير": "#dc2626",

  "شفا بدران": "#eab308",

  احد: "#8b5cf6",
  أحد: "#8b5cf6",

  النصر: "#0891b2",

  ماركا: "#ec4899",

  "تلاع العلي": "#92400e",
  "ام السماق": "#92400e",
  "أم السماق": "#92400e",
  خلدا: "#92400e",
};

/* =========================================================
   HELPERS
========================================================= */

const getDistrictColor = (district: string) => {
  const normalized = district
    .replace(/^منطقة\s+/u, "")
    .trim();

  return (
    DISTRICT_COLORS[normalized] ??
    "#2563eb"
  );
};

const getStatusLabel = (status: string) => {
  const config =
    statusConfig[
      status as keyof typeof statusConfig
    ];

  return config?.label ?? (
    status === "Unknown"
      ? "غير محدد"
      : status
  );
};

const getStatusColor = (status: string) => {
  const config =
    statusConfig[
      status as keyof typeof statusConfig
    ];

  if (!config) {
    return "#64748b";
  }

  return (
    config.color ??
    "#64748b"
  );
};

/* =========================================================
   COMPONENT
========================================================= */

export default function GeneralSummary({
  items = [],
}: GeneralSummaryProps) {
  /* =======================================================
     MODAL STATE
  ======================================================= */

  const [modalOpened, setModalOpened] =
    useState(false);

  const [modalTitle, setModalTitle] =
    useState("");

  const [modalItems, setModalItems] =
    useState<FailureItem[]>([]);

  const [modalStatus, setModalStatus] =
    useState<string | undefined>(
      undefined
    );

  /* =======================================================
     OPEN MODAL
  ======================================================= */

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

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeFailuresModal = () => {
    setModalOpened(false);
  };

  /* =======================================================
     DISTRICT DISTRIBUTION
  ======================================================= */

  const districtStats = useMemo(() => {
    const result: Record<
      string,
      FailureItem[]
    > = {};

    items.forEach((item) => {
      const district =
        item.districtName?.trim()
          ? item.districtName.trim()
          : "حسب مؤشرات الأداء";

      if (!result[district]) {
        result[district] = [];
      }

      result[district].push(item);
    });

    return Object.entries(result)
      .sort(
        ([, a], [, b]) =>
          b.length - a.length
      )
      .map(
        ([district, failures]) => ({
          district,
          count: failures.length,
          failures,
        })
      );
  }, [items]);

  /* =======================================================
     STATUS DISTRIBUTION
  ======================================================= */

  const statusStats = useMemo(() => {
    const result: Record<
      string,
      FailureItem[]
    > = {};

    items.forEach((item) => {
      const status =
        item.status || "Unknown";

      if (!result[status]) {
        result[status] = [];
      }

      result[status].push(item);
    });

    return Object.entries(result)
      .sort(
        ([, a], [, b]) =>
          b.length - a.length
      )
      .map(
        ([status, failures]) => ({
          status,
          count: failures.length,
          failures,
        })
      );
  }, [items]);
  /* =======================================================
     TOTAL
  ======================================================= */

  const total = items.length;

  /* =======================================================
     EMPTY
  ======================================================= */

  if (total === 0) {
    return null;
  }

  /* =======================================================
     STATUS ICON
  ======================================================= */

  const getStatusIcon = (
    status: string
  ) => {
    if (
      status === "Resolved"
    ) {
      return (
        <IconCircleCheck
          size={18}
        />
      );
    }

    if (
      status ===
        "PendingFieldMonitorVerification" ||
      status === "InProgress"
    ) {
      return (
        <IconClock
          size={18}
        />
      );
    }

    if (
      status === "Rejected" ||
      status ===
        "ResolutionRejected"
    ) {
      return (
        <IconAlertCircle
          size={18}
        />
      );
    }

    return (
      <IconChartBar
        size={18}
      />
    );
  };

  return (
    <>
      {/* =====================================================
          FAILURE LIST MODAL
      ===================================================== */}

      <FailureListModal
        opened={modalOpened}
        onClose={closeFailuresModal}
        title={modalTitle}
        failures={modalItems}
        status={modalStatus}
      />

      <Stack gap="md">
        {/* ===================================================
            MAIN SUMMARY HEADER
        =================================================== */}

        <Card
          radius={28}
          p={{
            base: "md",
            sm: "xl",
          }}
          withBorder
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,.98), rgba(248,250,252,.96))",
            border:
              "1px solid rgba(15,23,42,.07)",
            boxShadow:
              "0 18px 50px rgba(15,23,42,.07)",
          }}
        >
          <Stack gap="xl">
            {/* HEADER */}

            <Group
              justify="space-between"
              align="center"
              gap="md"
              wrap="wrap"
            >
              <Group
                gap="sm"
                wrap="nowrap"
              >
                <Box
                  style={{
                    width: 46,
                    height: 46,
                    minWidth: 46,
                    borderRadius: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "white",
                    boxShadow:
                      "0 10px 25px rgba(37,99,235,.20)",
                  }}
                >
                  <IconChartPie
                    size={24}
                  />
                </Box>

                <Stack gap={2}>
                  <Text
                    fw={900}
                    style={{
                      fontSize:
                        "clamp(18px, 3vw, 26px)",
                      lineHeight: 1.2,
                    }}
                  >
                    الملخص العام للمخالفات
                  </Text>

                  <Text
                    size="sm"
                    c="dimmed"
                  >
                    توزيع إجمالي المخالفات حسب
                    المناطق والحالات
                  </Text>
                </Stack>
              </Group>

              <Badge
                size="lg"
                radius="xl"
                variant="light"
                color="blue"
                leftSection={
                  <IconChartBar
                    size={17}
                  />
                }
              >
                {total.toLocaleString(
                  "en-US"
                )}{" "}
                مخالفة
              </Badge>
            </Group>

            <Divider />

            {/* =================================================
                TOTAL HERO
            ================================================= */}

            <Box
              p={{
                base: "md",
                sm: "xl",
              }}
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 24,
                background:
                  "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%)",
                color: "white",
                boxShadow:
                  "0 18px 45px rgba(15,23,42,.15)",
              }}
            >
              <Box
                style={{
                  position: "absolute",
                  width: 220,
                  height: 220,
                  borderRadius: "50%",
                  background:
                    "rgba(255,255,255,.06)",
                  top: -120,
                  left: -60,
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
                gap="lg"
                wrap="wrap"
                style={{
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Stack gap={3}>
                  <Text
                    size="sm"
                    fw={700}
                    style={{
                      opacity: 0.72,
                    }}
                  >
                    إجمالي المخالفات المعروضة
                  </Text>

                  <Text
                    fw={900}
                    style={{
                      fontSize:
                        "clamp(42px, 8vw, 68px)",
                      lineHeight: 1,
                      letterSpacing:
                        "-2px",
                    }}
                  >
                    {total.toLocaleString(
                      "en-US"
                    )}
                  </Text>

                  <Text
                    size="sm"
                    style={{
                      opacity: 0.7,
                    }}
                  >
                    حسب المصدر المحدد حاليًا
                  </Text>
                </Stack>

                <Box
                  style={{
                    width: 90,
                    height: 90,
                    minWidth: 90,
                    borderRadius: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "rgba(255,255,255,.10)",
                    border:
                      "1px solid rgba(255,255,255,.15)",
                    backdropFilter:
                      "blur(10px)",
                  }}
                >
                  <IconChartPie
                    size={42}
                    stroke={1.5}
                  />
                </Box>
              </Group>
            </Box>

            {/* =================================================
                DISTRICTS
            ================================================= */}

            <Stack gap="md">
              <Group
                justify="space-between"
                align="center"
              >
                <Group
                  gap="xs"
                  wrap="nowrap"
                >
                  <Box
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "rgba(37,99,235,.09)",
                      color:
                        "#2563eb",
                    }}
                  >
                    <IconMapPin
                      size={18}
                    />
                  </Box>

                  <Stack gap={0}>
                    <Text fw={900}>
                      توزيع المخالفات حسب المناطق
                    </Text>

                    <Text
                      size="xs"
                      c="dimmed"
                    >
                      اضغط على أي منطقة لعرض
                      مخالفاتها
                    </Text>
                  </Stack>
                </Group>

                <Badge
                  variant="light"
                  color="blue"
                  radius="xl"
                >
                  {districtStats.length}{" "}
                  مناطق
                </Badge>
              </Group>

              <SimpleGrid
                cols={{
                  base: 1,
                  xs: 2,
                  md: 3,
                  lg: 4,
                }}
                spacing="sm"
              >
                {districtStats.map(
                  ({
                    district,
                    count,
                    failures,
                  }) => {
                    const percentage =
                      total
                        ? (count / total) *
                          100
                        : 0;

                    const color =
                      getDistrictColor(
                        district
                      );

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
                        radius={20}
                        style={{
                          cursor: "pointer",
                          textAlign: "right",
                          background:
                            "#ffffff",
                          border:
                            "1px solid rgba(15,23,42,.07)",
                          boxShadow:
                            "0 8px 25px rgba(15,23,42,.045)",
                          transition:
                            "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
                        }}
                        styles={{
                          root: {
                            "&:hover": {
                              transform:
                                "translateY(-3px)",
                              boxShadow:
                                "0 14px 32px rgba(15,23,42,.10)",
                              borderColor:
                                `${color}55`,
                            },
                          },
                        }}
                      >
                        <Stack gap="sm">
                          <Group
                            justify="space-between"
                            align="flex-start"
                            gap="xs"
                          >
                            <Group
                              gap="xs"
                              wrap="nowrap"
                              style={{
                                minWidth: 0,
                              }}
                            >
                              <Box
                                style={{
                                  width: 10,
                                  height: 10,
                                  minWidth: 10,
                                  borderRadius:
                                    "50%",
                                  background:
                                    color,
                                  boxShadow: `0 0 0 4px ${color}18`,
                                }}
                              />

                              <Text
                                fw={800}
                                size="sm"
                                truncate
                              >
                                {district}
                              </Text>
                            </Group>

                            <Badge
                              radius="xl"
                              variant="light"
                              style={{
                                color,
                                background:
                                  `${color}12`,
                                flexShrink: 0,
                              }}
                            >
                              {count.toLocaleString(
                                "en-US"
                              )}
                            </Badge>
                          </Group>

                          <Group
                            justify="space-between"
                            gap="xs"
                          >
                            <Text
                              size="xs"
                              c="dimmed"
                            >
                              نسبة المنطقة
                            </Text>

                            <Text
                              size="xs"
                              fw={800}
                            >
                              {percentage.toFixed(
                                1
                              )}
                              %
                            </Text>
                          </Group>

                          <Progress
                            value={percentage}
                            size="sm"
                            radius="xl"
                            styles={{
                              root: {
                                background:
                                  "#eef2f7",
                              },
                              section: {
                                background:
                                  color,
                              },
                            }}
                          />

                          <Text
                            size="xs"
                            c="blue"
                            fw={700}
                            ta="center"
                          >
                            اضغط لعرض المخالفات
                          </Text>
                        </Stack>
                      </Card>
                    );
                  }
                )}
              </SimpleGrid>
            </Stack>
          </Stack>
        </Card>

        {/* =====================================================
            STATUS DISTRIBUTION
        ===================================================== */}

        <Card
          radius={28}
          p={{
            base: "md",
            sm: "xl",
          }}
          withBorder
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,.98), rgba(248,250,252,.96))",
            border:
              "1px solid rgba(15,23,42,.07)",
            boxShadow:
              "0 18px 50px rgba(15,23,42,.07)",
          }}
        >
          <Stack gap="xl">
            <Group
              justify="space-between"
              align="center"
              gap="md"
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
                    borderRadius: 11,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "rgba(124,58,237,.10)",
                    color: "#7c3aed",
                  }}
                >
                  <IconChartBar
                    size={19}
                  />
                </Box>

                <Stack gap={0}>
                  <Text fw={900}>
                    توزيع أعداد المخالفات حسب الحالة
                  </Text>

                  <Text
                    size="xs"
                    c="dimmed"
                  >
                    اضغط على أي حالة لعرض
                    المخالفات التابعة لها
                  </Text>
                </Stack>
              </Group>

              <Badge
                radius="xl"
                variant="light"
                color="violet"
              >
                {statusStats.length} حالات
              </Badge>
            </Group>

            <SimpleGrid
              cols={{
                base: 1,
                xs: 2,
                md: 3,
                lg: 4,
              }}
              spacing="sm"
            >
              {statusStats.map(
                ({
                  status,
                  count,
                  failures,
                }) => {
                  const percentage =
                    total
                      ? (count / total) *
                        100
                      : 0;

                  const color =
                    getStatusColor(
                      status
                    );

                  return (
                    <Card
                      key={status}
                      component="button"
                      type="button"
                      onClick={() =>
                        openFailuresModal({
                          title: `مخالفات الحالة: ${getStatusLabel(
                            status
                          )}`,
                          failures,
                          status:
                            status ===
                            "Unknown"
                              ? undefined
                              : status,
                        })
                      }
                      p="md"
                      radius={20}
                      style={{
                        cursor: "pointer",
                        textAlign: "right",
                        background:
                          "#ffffff",
                        border:
                          "1px solid rgba(15,23,42,.07)",
                        boxShadow:
                          "0 8px 25px rgba(15,23,42,.045)",
                        transition:
                          "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
                      }}
                      styles={{
                        root: {
                          "&:hover": {
                            transform:
                              "translateY(-3px)",
                            boxShadow:
                              "0 14px 32px rgba(15,23,42,.10)",
                            borderColor:
                              `${color}55`,
                          },
                        },
                      }}
                    >
                      <Stack gap="sm">
                        <Group
                          justify="space-between"
                          align="flex-start"
                          gap="xs"
                        >
                          <Group
                            gap="xs"
                            wrap="nowrap"
                            style={{
                              minWidth: 0,
                            }}
                          >
                            <Box
                              style={{
                                width: 34,
                                height: 34,
                                minWidth: 34,
                                borderRadius: 11,
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                color,
                                background:
                                  `${color}12`,
                              }}
                            >
                              {getStatusIcon(
                                status
                              )}
                            </Box>

                            <Text
                              fw={800}
                              size="sm"
                              lineClamp={2}
                            >
                              {getStatusLabel(
                                status
                              )}
                            </Text>
                          </Group>

                          <Badge
                            radius="xl"
                            variant="light"
                            style={{
                              color,
                              background:
                                `${color}12`,
                              flexShrink: 0,
                            }}
                          >
                            {count.toLocaleString(
                              "en-US"
                            )}
                          </Badge>
                        </Group>

                        <Group
                          justify="space-between"
                          gap="xs"
                        >
                          <Text
                            size="xs"
                            c="dimmed"
                          >
                            من الإجمالي
                          </Text>

                          <Text
                            size="xs"
                            fw={800}
                          >
                            {percentage.toFixed(
                              1
                            )}
                            %
                          </Text>
                        </Group>

                        <Progress
                          value={
                            percentage
                          }
                          size="sm"
                          radius="xl"
                          styles={{
                            root: {
                              background:
                                "#eef2f7",
                            },
                            section: {
                              background:
                                color,
                            },
                          }}
                        />

                        <Text
                          size="xs"
                          c="blue"
                          fw={700}
                          ta="center"
                        >
                          اضغط لعرض المخالفات
                        </Text>
                      </Stack>
                    </Card>
                  );
                }
              )}
            </SimpleGrid>

            {/* =================================================
                STATUS TOTAL
            ================================================= */}

            <Box
              p="md"
              style={{
                borderRadius: 20,
                background:
                  "linear-gradient(135deg, #f8fafc, #eef2ff)",
                border:
                  "1px solid rgba(37,99,235,.08)",
              }}
            >
              <Group
                justify="space-between"
                align="center"
                gap="md"
                wrap="wrap"
              >
                <Group
                  gap="sm"
                  wrap="nowrap"
                >
                  <Box
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "rgba(37,99,235,.10)",
                      color:
                        "#2563eb",
                    }}
                  >
                    <IconChartBar
                      size={20}
                    />
                  </Box>

                  <Stack gap={0}>
                    <Text
                      fw={900}
                      size="sm"
                    >
                      الإجمالي العام
                    </Text>

                    <Text
                      size="xs"
                      c="dimmed"
                    >
                      مجموع جميع الحالات
                    </Text>
                  </Stack>
                </Group>

                <Text
                  fw={900}
                  style={{
                    fontSize: 26,
                    color: "#1d4ed8",
                  }}
                >
                  {total.toLocaleString(
                    "en-US"
                  )}
                </Text>
              </Group>
            </Box>
          </Stack>
        </Card>
      </Stack>
    </>
  );
}