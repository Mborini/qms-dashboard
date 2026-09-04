"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Modal,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";

import {
  IconAlertCircle,
  IconCar,
  IconClock,
  IconLogin,
  IconLogout,
  IconTool,
  IconTrash,
} from "@tabler/icons-react";

type MaintenanceRecord = {
  id: number;

  vehicle_id: number;
  plate_number: string;
  weight: number | null;
  capacity: number | null;
  manufacture_year: number | null;
  model: string | null;
  area: string | null;

  kpi_id: number;
  kpi_name: string;

  sub_kpi_id: number;
  sub_kpi_name: string;

  entry_at: string;
  exit_at: string | null;

  status: "open" | "closed";

  description: string | null;
  notes: string | null;

  created_by: string | null;
  updated_by: string | null;

  created_at: string;
  updated_at: string;
};

type Vehicle = {
  id: number;
  plate_number: string;
  weight?: number | null;
  capacity?: number | null;
  manufacture_year?: number | null;
  model?: string | null;
  area?: string | null;
};

type SubKPI = {
  id: number;
  name: string;
};

type KPI = {
  id: number;
  name: string;
  sub_kpis: SubKPI[];
};

type KPIApiRow = {
  kpi_id: number;
  kpi_name: string;
  sub_kpi_id: number;
  sub_kpi_name: string;
};

export default function MaintenanceHistoryPage() {
  const [records, setRecords] = useState<
    MaintenanceRecord[]
  >([]);

  const [vehicles, setVehicles] = useState<Vehicle[]>(
    []
  );

  const [kpis, setKpis] = useState<KPI[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  /**
   * الوقت الحالي
   * يستخدم لتحديث مدة الصيانة المفتوحة Live
   */
  const [now, setNow] = useState(() =>
    Date.now()
  );

  /**
   * Pagination
   */
  const [page, setPage] = useState(1);

  const limit = 10;

  /**
   * Filters
   */
  const [search, setSearch] =
    useState("");

  const [date, setDate] =
    useState("");

  const [vehicleId, setVehicleId] =
    useState("");

  const [kpiId, setKpiId] =
    useState("");

  const [subKpiId, setSubKpiId] =
    useState("");

  const [status, setStatus] =
    useState("");

  /**
   * Details Modal
   */
  const [selectedRecord, setSelectedRecord] =
    useState<MaintenanceRecord | null>(
      null
    );

  const [detailsOpened, setDetailsOpened] =
    useState(false);

  /**
   * Delete
   */
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  /**
   * ========================================
   * Live Timer
   * ========================================
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  /**
   * ========================================
   * Normalize KPIs
   * ========================================
   */
  const normalizeKpis = (
    rows: KPIApiRow[]
  ): KPI[] => {
    const kpiMap = new Map<number, KPI>();

    for (const row of rows) {
      if (!kpiMap.has(row.kpi_id)) {
        kpiMap.set(row.kpi_id, {
          id: row.kpi_id,
          name: row.kpi_name,
          sub_kpis: [],
        });
      }

      const kpi =
        kpiMap.get(row.kpi_id)!;

      if (
        !kpi.sub_kpis.some(
          (subKpi) =>
            subKpi.id ===
            row.sub_kpi_id
        )
      ) {
        kpi.sub_kpis.push({
          id: row.sub_kpi_id,
          name: row.sub_kpi_name,
        });
      }
    }

    return Array.from(
      kpiMap.values()
    );
  };

  /**
   * ========================================
   * Load Filter Data
   * ========================================
   */
  const loadFilterData = async () => {
    try {
      const [
        vehiclesResponse,
        kpisResponse,
      ] = await Promise.all([
        fetch(
          "/api/maintenance/vehicles",
          {
            cache: "no-store",
          }
        ),

        fetch(
          "/api/maintenance/kpis",
          {
            cache: "no-store",
          }
        ),
      ]);

      if (!vehiclesResponse.ok) {
        throw new Error(
          "Failed to load vehicles"
        );
      }

      if (!kpisResponse.ok) {
        throw new Error(
          "Failed to load KPIs"
        );
      }

      const vehiclesData =
        await vehiclesResponse.json();

      const kpisData =
        await kpisResponse.json();

      setVehicles(
        vehiclesData.data ?? []
      );

      const rows: KPIApiRow[] =
        kpisData.data ?? [];

      setKpis(
        normalizeKpis(rows)
      );
    } catch (err) {
      console.error(err);

      setError(
        "حدث خطأ أثناء تحميل بيانات الفلاتر"
      );
    }
  };

  /**
   * ========================================
   * Load Maintenance History
   * ========================================
   */
  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/maintenance/history",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load maintenance history"
        );
      }

      const data =
        await response.json();

      setRecords(
        data.data ?? []
      );
    } catch (err) {
      console.error(err);

      setError(
        "حدث خطأ أثناء تحميل سجل الصيانة"
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * ========================================
   * Initial Load
   * ========================================
   */
  useEffect(() => {
    loadFilterData();
    loadHistory();
  }, []);

  /**
   * ========================================
   * Delete Maintenance Record
   * ========================================
   */
  const deleteRecord = async (
    record: MaintenanceRecord
  ) => {
    const confirmed =
      window.confirm(
        `هل أنت متأكد من حذف سجل الصيانة للمركبة ${record.plate_number}؟\n\nهذا الإجراء لا يمكن التراجع عنه.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(record.id);
      setError("");

      const response = await fetch(
        `/api/maintenance/history/${record.id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to delete maintenance record"
        );
      }

      /**
       * إزالة السجل من الجدول
       */
      setRecords(
        (currentRecords) =>
          currentRecords.filter(
            (item) =>
              item.id !== record.id
          )
      );

      /**
       * إغلاق Modal إذا كان مفتوح
       */
      if (
        selectedRecord?.id ===
        record.id
      ) {
        setDetailsOpened(false);
        setSelectedRecord(null);
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حذف سجل الصيانة"
      );
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * ========================================
   * Vehicle Options
   * ========================================
   */
  const vehicleOptions = useMemo(() => {
    const map =
      new Map<string, string>();

    vehicles.forEach(
      (vehicle) => {
        map.set(
          String(vehicle.id),
          vehicle.plate_number
        );
      }
    );

    return Array.from(
      map.entries()
    ).map(
      ([value, label]) => ({
        value,
        label,
      })
    );
  }, [vehicles]);

  /**
   * ========================================
   * KPI Options
   * ========================================
   */
  const kpiOptions = useMemo(() => {
    const map =
      new Map<string, string>();

    kpis.forEach((kpi) => {
      map.set(
        String(kpi.id),
        kpi.name
      );
    });

    return Array.from(
      map.entries()
    ).map(
      ([value, label]) => ({
        value,
        label,
      })
    );
  }, [kpis]);

  /**
   * ========================================
   * Sub KPI Options
   * ========================================
   */
  const subKpiOptions = useMemo(() => {
    const selectedKpi =
      kpis.find(
        (kpi) =>
          String(kpi.id) ===
          kpiId
      );

    if (!selectedKpi) {
      return [];
    }

    return selectedKpi.sub_kpis.map(
      (subKpi) => ({
        value: String(
          subKpi.id
        ),
        label: subKpi.name,
      })
    );
  }, [kpis, kpiId]);

  /**
   * ========================================
   * Filter Records
   * ========================================
   */
  const filteredRecords =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return records.filter(
        (record) => {
          /**
           * Search
           */
          if (query) {
            const searchableText = [
              record.id,
              record.plate_number,
              record.model,
              record.area,
              record.kpi_name,
              record.sub_kpi_name,
              record.description,
              record.notes,
              record.created_by,
              record.updated_by,
            ]
              .filter(
                (value) =>
                  value !==
                    null &&
                  value !==
                    undefined
              )
              .join(" ")
              .toLowerCase();

            if (
              !searchableText.includes(
                query
              )
            ) {
              return false;
            }
          }

          /**
           * Date
           */
          if (date) {
            const dayStart =
              new Date(
                `${date}T00:00:00`
              ).getTime();

            const dayEnd =
              new Date(
                `${date}T23:59:59.999`
              ).getTime();

            const entryTime =
              new Date(
                record.entry_at
              ).getTime();

            const exitTime =
              record.exit_at
                ? new Date(
                    record.exit_at
                  ).getTime()
                : Infinity;

            if (
              Number.isNaN(
                entryTime
              ) ||
              entryTime >=
                dayEnd ||
              exitTime <
                dayStart
            ) {
              return false;
            }
          }

          /**
           * Vehicle
           */
          if (
            vehicleId &&
            String(
              record.vehicle_id
            ) !== vehicleId
          ) {
            return false;
          }

          /**
           * KPI
           */
          if (
            kpiId &&
            String(
              record.kpi_id
            ) !== kpiId
          ) {
            return false;
          }

          /**
           * Sub KPI
           */
          if (
            subKpiId &&
            String(
              record.sub_kpi_id
            ) !==
              subKpiId
          ) {
            return false;
          }

          /**
           * Status
           */
          if (
            status &&
            record.status !==
              status
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      records,
      search,
      date,
      vehicleId,
      kpiId,
      subKpiId,
      status,
    ]);

  /**
   * ========================================
   * Total Pages
   * ========================================
   */
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredRecords.length /
          limit
      )
    );

  /**
   * ========================================
   * Reset Page On Filter
   * ========================================
   */
  useEffect(() => {
    setPage(1);
  }, [
    search,
    date,
    vehicleId,
    kpiId,
    subKpiId,
    status,
  ]);

  /**
   * ========================================
   * Protect Current Page
   * ========================================
   */
  useEffect(() => {
    if (
      page > totalPages
    ) {
      setPage(
        totalPages
      );
    }
  }, [
    page,
    totalPages,
  ]);

  /**
   * ========================================
   * Pagination
   * ========================================
   */
  const paginatedRecords =
    useMemo(() => {
      const start =
        (page - 1) *
        limit;

      return filteredRecords.slice(
        start,
        start + limit
      );
    }, [
      filteredRecords,
      page,
    ]);

  /**
   * ========================================
   * Format Duration
   * ========================================
   */
  const formatDuration = (
    entryAt: string,
    exitAt: string | null
  ) => {
    const start =
      new Date(
        entryAt
      ).getTime();

    if (
      Number.isNaN(start)
    ) {
      return "-";
    }

    const end = exitAt
      ? new Date(
          exitAt
        ).getTime()
      : now;

    if (
      Number.isNaN(end)
    ) {
      return "-";
    }

    const difference =
      Math.max(
        0,
        end - start
      );

    const totalSeconds =
      Math.floor(
        difference / 1000
      );

    const days =
      Math.floor(
        totalSeconds /
          86400
      );

    const hours =
      Math.floor(
        (totalSeconds %
          86400) /
          3600
      );

    const minutes =
      Math.floor(
        (totalSeconds %
          3600) /
          60
      );

    const seconds =
      totalSeconds % 60;

    const parts: string[] =
      [];

    if (days > 0) {
      parts.push(
        `${days} يوم`
      );
    }

    if (hours > 0) {
      parts.push(
        `${hours} ساعة`
      );
    }

    if (minutes > 0) {
      parts.push(
        `${minutes} دقيقة`
      );
    }

    /**
     * إذا أقل من دقيقة
     */
    if (
      days === 0 &&
      hours === 0 &&
      minutes === 0
    ) {
      if (
        seconds > 0
      ) {
        return `${seconds} ثانية`;
      }

      return "أقل من دقيقة";
    }

    return parts.join(
      " و "
    );
  };

  /**
   * ========================================
   * Format Date
   * ========================================
   */
  const formatDateTime = (
    value: string | null
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return date.toLocaleString(
      "EN-JO",
      {
        dateStyle:
          "medium",
        timeStyle:
          "short",
      }
    );
  };

  /**
   * ========================================
   * Open Details
   * ========================================
   */
  const openDetails = (
    record: MaintenanceRecord
  ) => {
    setSelectedRecord(
      record
    );

    setDetailsOpened(
      true
    );
  };

  /**
   * ========================================
   * Clear Filters
   * ========================================
   */
  const clearFilters =
    () => {
      setSearch("");
      setDate("");
      setVehicleId("");
      setKpiId("");
      setSubKpiId("");
      setStatus("");
      setPage(1);
    };

  return (
    <Container
      size="xl"
      dir="rtl"
      py="xl"
    >
      <Stack gap="lg">

        {/* ================= Header ================= */}

        <Group
          justify="space-between"
          align="center"
        >
          <div>
            <Title order={2}>
              سجل الصيانة
            </Title>

            <Text
              c="dimmed"
              size="sm"
              mt={4}
            >
              سجل جميع عمليات صيانة المركبات
            </Text>
          </div>

          <Badge
            size="lg"
            variant="light"
          >
            {filteredRecords.length} سجل
          </Badge>
        </Group>

        {/* ================= Error ================= */}

        {error && (
          <Alert
            icon={
              <IconAlertCircle
                size={18}
              />
            }
            color="red"
            title="حدث خطأ"
          >
            {error}
          </Alert>
        )}

        {/* ================= Filters ================= */}

        <Card
          withBorder
          radius="md"
          padding="lg"
        >
          <Stack gap="md">

            <Group
              justify="space-between"
            >
              <Text fw={700}>
                الفلاتر
              </Text>

              <Button
                variant="subtle"
                color="gray"
                onClick={
                  clearFilters
                }
              >
                مسح الفلاتر
              </Button>
            </Group>

            <SimpleGrid
              cols={{
                base: 1,
                sm: 2,
                md: 3,
              }}
            >
              {/* Search */}

              <Textarea
                label="بحث"
                placeholder="رقم المركبة، الموديل، المنطقة، نوع الصيانة..."
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event
                      .currentTarget
                      .value
                  )
                }
                autosize
                minRows={1}
                maxRows={3}
              />

              {/* Date */}

              <Text
                component="label"
                size="sm"
                fw={500}
              >
                التاريخ

                <input
                  type="date"
                  value={date}
                  onChange={(
                    event
                  ) =>
                    setDate(
                      event
                        .currentTarget
                        .value
                    )
                  }
                  style={{
                    width:
                      "100%",
                    height: 36,
                    marginTop: 5,
                    borderRadius: 6,
                    border:
                      "1px solid #ced4da",
                    padding:
                      "0 10px",
                    fontSize: 14,
                  }}
                />
              </Text>

              {/* Vehicle */}

              <Select
                label="المركبة"
                placeholder="كل المركبات"
                data={
                  vehicleOptions
                }
                value={
                  vehicleId
                }
                onChange={(
                  value
                ) =>
                  setVehicleId(
                    value ??
                      ""
                  )
                }
                searchable
                clearable
              />

              {/* KPI */}

              <Select
                label="نوع الصيانة"
                placeholder="كل الأنواع"
                data={
                  kpiOptions
                }
                value={kpiId}
                onChange={(
                  value
                ) => {
                  setKpiId(
                    value ??
                      ""
                  );

                  setSubKpiId(
                    ""
                  );
                }}
                searchable
                clearable
              />

              {/* Sub KPI */}

              <Select
                label="التصنيف الفرعي"
                placeholder={
                  kpiId
                    ? "كل التصنيفات"
                    : "اختر نوع الصيانة أولا"
                }
                data={
                  subKpiOptions
                }
                value={
                  subKpiId
                }
                onChange={(
                  value
                ) =>
                  setSubKpiId(
                    value ??
                      ""
                  )
                }
                searchable
                clearable
                disabled={
                  !kpiId
                }
              />

              {/* Status */}

              <Select
                label="الحالة"
                placeholder="كل الحالات"
                data={[
                  {
                    value:
                      "open",
                    label:
                      "مفتوحة",
                  },
                  {
                    value:
                      "closed",
                    label:
                      "مغلقة",
                  },
                ]}
                value={
                  status
                }
                onChange={(
                  value
                ) =>
                  setStatus(
                    value ??
                      ""
                  )
                }
                clearable
              />
            </SimpleGrid>
          </Stack>
        </Card>

        {/* ================= Table ================= */}

        <Card
          withBorder
          radius="md"
          padding={0}
        >
          <div
            style={{
              overflowX:
                "auto",
            }}
          >
            <table
              style={{
                width:
                  "100%",
                borderCollapse:
                  "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    background:
                      "var(--mantine-color-gray-0)",
                  }}
                >
                  <th
                    style={{
                      padding: 14,
                      textAlign:
                        "right",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    #
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign:
                        "right",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    المركبة
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign:
                        "right",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    نوع الصيانة
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign:
                        "right",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    الدخول
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign:
                        "right",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    الخروج
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign:
                        "right",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    المدة
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign:
                        "right",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    الحالة
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign:
                        "right",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    الإجراء
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* Loading */}

                {loading ? (
                  <tr>
                    <td
                      colSpan={
                        8
                      }
                      style={{
                        padding:
                          40,
                        textAlign:
                          "center",
                      }}
                    >
                      <Text c="dimmed">
                        جاري تحميل السجل...
                      </Text>
                    </td>
                  </tr>
                ) : paginatedRecords.length ===
                  0 ? (
                  /* Empty */

                  <tr>
                    <td
                      colSpan={
                        8
                      }
                      style={{
                        padding:
                          40,
                        textAlign:
                          "center",
                      }}
                    >
                      <Text c="dimmed">
                        لا توجد سجلات
                        مطابقة للفلاتر
                      </Text>
                    </td>
                  </tr>
                ) : (
                  /* Records */

                  paginatedRecords.map(
                    (
                      record,
                      index
                    ) => (
                      <tr
                        key={
                          record.id
                        }
                        style={{
                          borderTop:
                            "1px solid var(--mantine-color-gray-2)",
                        }}
                      >
                        {/* Number */}

                        <td
                          style={{
                            padding:
                              14,
                          }}
                        >
                          {(page -
                            1) *
                            limit +
                            index +
                            1}
                        </td>

                        {/* Vehicle */}

                        <td
                          style={{
                            padding:
                              14,
                          }}
                        >
                          <Group gap="xs">
                            <IconCar
                              size={
                                18
                              }
                            />

                            <div>
                              <Text
                                fw={
                                  600
                                }
                              >
                                {
                                  record.plate_number
                                }
                              </Text>

                              <Text
                                size="xs"
                                c="dimmed"
                              >
                                {
                                  record.model ||
                                  "-"
                                }
                              </Text>
                            </div>
                          </Group>
                        </td>

                        {/* Maintenance */}

                        <td
                          style={{
                            padding:
                              14,
                          }}
                        >
                          <div>
                            <Text
                              fw={
                                600
                              }
                            >
                              {
                                record.kpi_name
                              }
                            </Text>

                            <Text
                              size="xs"
                              c="dimmed"
                            >
                              {
                                record.sub_kpi_name
                              }
                            </Text>
                          </div>
                        </td>

                        {/* Entry */}

                        <td
                          style={{
                            padding:
                              14,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          <Group gap={5}>
                            <IconLogin
                              size={
                                16
                              }
                            />

                            <Text size="sm">
                              {formatDateTime(
                                record.entry_at
                              )}
                            </Text>
                          </Group>
                        </td>

                        {/* Exit */}

                        <td
                          style={{
                            padding:
                              14,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          <Group gap={5}>
                            <IconLogout
                              size={
                                16
                              }
                            />

                            <Text size="sm">
                              {formatDateTime(
                                record.exit_at
                              )}
                            </Text>
                          </Group>
                        </td>

                        {/* Duration */}

                        <td
                          style={{
                            padding:
                              14,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          <Group gap={5}>
                            <IconClock
                              size={
                                16
                              }
                            />

                            <Text size="sm">
                              {formatDuration(
                                record.entry_at,
                                record.exit_at
                              )}
                            </Text>
                          </Group>
                        </td>

                        {/* Status */}

                        <td
                          style={{
                            padding:
                              14,
                          }}
                        >
                          {record.status ===
                          "open" ? (
                            <Badge color="orange">
                              مفتوحة
                            </Badge>
                          ) : (
                            <Badge color="green">
                              مغلقة
                            </Badge>
                          )}
                        </td>

                        {/* Actions */}

                        <td
                          style={{
                            padding:
                              14,
                          }}
                        >
                          <Group
                            gap="xs"
                            wrap="nowrap"
                          >
                            {/* Details */}

                            <Button
                              size="xs"
                              variant="light"
                              onClick={() =>
                                openDetails(
                                  record
                                )
                              }
                            >
                              التفاصيل
                            </Button>

                            {/* Delete */}

                            <Button
                              size="xs"
                              color="red"
                              variant="light"
                              leftSection={
                                <IconTrash
                                  size={
                                    15
                                  }
                                />
                              }
                              loading={
                                deletingId ===
                                record.id
                              }
                              disabled={
                                deletingId !==
                                  null &&
                                deletingId !==
                                  record.id
                              }
                              onClick={() =>
                                deleteRecord(
                                  record
                                )
                              }
                            >
                              حذف
                            </Button>
                          </Group>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ================= Pagination ================= */}

        {!loading &&
          filteredRecords.length >
            0 && (
            <>
              <Group
                justify="center"
                mt="sm"
              >
                <Pagination
                  total={
                    totalPages
                  }
                  value={page}
                  onChange={
                    setPage
                  }
                  withEdges
                />
              </Group>

              <Text
                ta="center"
                size="sm"
                c="dimmed"
              >
                عرض{" "}
                {(page - 1) *
                  limit +
                  1}{" "}
                -{" "}
                {Math.min(
                  page * limit,
                  filteredRecords.length
                )}{" "}
                من{" "}
                {
                  filteredRecords.length
                }{" "}
                سجل
              </Text>
            </>
          )}
      </Stack>

      {/* ================= Details Modal ================= */}

      <Modal
        opened={
          detailsOpened
        }
        onClose={() => {
          setDetailsOpened(
            false
          );

          setSelectedRecord(
            null
          );
        }}
        title={
          <Group gap="sm">
            <IconTool
              size={22}
            />

            <Text fw={700}>
              تفاصيل الصيانة
            </Text>
          </Group>
        }
        size="lg"
        centered
      >
        {selectedRecord && (
          <Stack gap="md">

            {/* Vehicle */}

            <Card
              withBorder
              radius="md"
              padding="md"
            >
              <Group>
                <IconCar
                  size={25}
                />

                <div>
                  <Text
                    size="sm"
                    c="dimmed"
                  >
                    المركبة
                  </Text>

                  <Text fw={700}>
                    {
                      selectedRecord.plate_number
                    }
                  </Text>

                  <Text
                    size="sm"
                    c="dimmed"
                  >
                    {
                      selectedRecord.model ||
                      "-"
                    }
                  </Text>
                </div>
              </Group>
            </Card>

            {/* Maintenance */}

            <Card
              withBorder
              radius="md"
              padding="md"
            >
              <Group
                justify="space-between"
              >
                <div>
                  <Text
                    size="sm"
                    c="dimmed"
                  >
                    نوع الصيانة
                  </Text>

                  <Text fw={700}>
                    {
                      selectedRecord.kpi_name
                    }
                  </Text>

                  <Text
                    size="sm"
                    c="dimmed"
                  >
                    {
                      selectedRecord.sub_kpi_name
                    }
                  </Text>
                </div>

                <Badge
                  color={
                    selectedRecord.status ===
                    "open"
                      ? "orange"
                      : "green"
                  }
                >
                  {selectedRecord.status ===
                  "open"
                    ? "مفتوحة"
                    : "مغلقة"}
                </Badge>
              </Group>
            </Card>

            <Divider />

            {/* Timeline */}

            <SimpleGrid
              cols={{
                base: 1,
                sm: 2,
              }}
            >
              {/* Entry */}

              <Card
                withBorder
                radius="md"
                padding="md"
              >
                <Group gap="xs">
                  <IconLogin
                    size={20}
                  />

                  <Text fw={600}>
                    وقت الدخول
                  </Text>
                </Group>

                <Text
                  mt="xs"
                  size="sm"
                >
                  {formatDateTime(
                    selectedRecord.entry_at
                  )}
                </Text>
              </Card>

              {/* Exit */}

              <Card
                withBorder
                radius="md"
                padding="md"
              >
                <Group gap="xs">
                  <IconLogout
                    size={20}
                  />

                  <Text fw={600}>
                    وقت الخروج
                  </Text>
                </Group>

                <Text
                  mt="xs"
                  size="sm"
                >
                  {formatDateTime(
                    selectedRecord.exit_at
                  )}
                </Text>
              </Card>
            </SimpleGrid>

            {/* Duration */}

            <Card
              withBorder
              radius="md"
              padding="md"
            >
              <Group gap="xs">
                <IconClock
                  size={20}
                />

                <Text fw={600}>
                  مدة الصيانة
                </Text>
              </Group>

              <Text
                mt="xs"
                fw={700}
                size="lg"
              >
                {formatDuration(
                  selectedRecord.entry_at,
                  selectedRecord.exit_at
                )}
              </Text>
            </Card>

            {/* Description */}

            {selectedRecord.description && (
              <Card
                withBorder
                radius="md"
                padding="md"
              >
                <Text fw={600}>
                  الوصف
                </Text>

                <Text
                  size="sm"
                  mt="xs"
                >
                  {
                    selectedRecord.description
                  }
                </Text>
              </Card>
            )}

            {/* Notes */}

            {selectedRecord.notes && (
              <Card
                withBorder
                radius="md"
                padding="md"
              >
                <Text fw={600}>
                  الملاحظات
                </Text>

                <Text
                  size="sm"
                  mt="xs"
                >
                  {
                    selectedRecord.notes
                  }
                </Text>
              </Card>
            )}

            {/* Vehicle Information */}

            <SimpleGrid
              cols={{
                base: 1,
                sm: 2,
              }}
            >
              <div>
                <Text
                  size="xs"
                  c="dimmed"
                >
                  المنطقة
                </Text>

                <Text
                  size="sm"
                  fw={600}
                >
                  {
                    selectedRecord.area ||
                    "-"
                  }
                </Text>
              </div>

              <div>
                <Text
                  size="xs"
                  c="dimmed"
                >
                  سنة الصنع
                </Text>

                <Text
                  size="sm"
                  fw={600}
                >
                  {
                    selectedRecord.manufacture_year ||
                    "-"
                  }
                </Text>
              </div>

              <div>
                <Text
                  size="xs"
                  c="dimmed"
                >
                  الوزن
                </Text>

                <Text
                  size="sm"
                  fw={600}
                >
                  {
                    selectedRecord.weight ??
                    "-"
                  }
                </Text>
              </div>

              <div>
                <Text
                  size="xs"
                  c="dimmed"
                >
                  السعة
                </Text>

                <Text
                  size="sm"
                  fw={600}
                >
                  {
                    selectedRecord.capacity ??
                    "-"
                  }
                </Text>
              </div>
            </SimpleGrid>

            <Divider />

            {/* Created Information */}

            <Group
            dir="ltr"
              justify="space-between"
              align="center"
            >
              <Text
                size="xs"
                c="dimmed"
              >
               
                {
                  selectedRecord.created_by ||
                  "-"
                } : أنشأ بواسطة
              </Text>

              <Text
                size="xs"
                c="dimmed"
              >
               
                {formatDateTime(
                  selectedRecord.created_at
                )} : تاريخ الإنشاء:{" "}
              </Text>
            </Group>

            {/* Delete */}

            <Divider />

            <Button
              fullWidth
              color="red"
              variant="light"
              leftSection={
                <IconTrash
                  size={17}
                />
              }
              loading={
                deletingId ===
                selectedRecord.id
              }
              disabled={
                deletingId !== null
              }
              onClick={() =>
                deleteRecord(
                  selectedRecord
                )
              }
            >
              حذف سجل الصيانة
            </Button>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}