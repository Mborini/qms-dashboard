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
  ThemeIcon,
  Title,
} from "@mantine/core";

import {
  IconAlertCircle,
  IconCar,
  IconCircleCheck,
  IconClock,
  IconEye,
  IconFileDescription,
  IconHistory,
  IconInfoCircle,
  IconLogin,
  IconLogout,
  IconNotes,
  IconReportMoney,
  IconTimeline,
  IconTool,
  IconTrash,
  IconMapPin,
} from "@tabler/icons-react";

import * as XLSX from "xlsx-js-style";

import { exportMaintenanceExcel } from "@/utils/maintenanceExcel";

type MaintenanceRecord = {
  id: number;

  vehicle_id: number;
  vehicle_number?: string | null;
  plate_number: string;
  vehicle_type?: string | null;

  weight: number | null;
  capacity: number | null;
  manufacture_year: number | null;
  model: string | null;

  area: string | null;

  kpi_id: number;
  kpi_name: string;

  sub_kpi_id: number;
  sub_kpi_name: string;

  maintenance_location: string | null;

  entry_at: string;
  exit_at: string | null;

  status: "open" | "closed";

  description: string | null;
  notes: string | null;

  cost: number | null;

  created_by: string | null;
  updated_by: string | null;

  created_at: string;
  updated_at: string;
};

type Vehicle = {
  id: number;
  vehicle_number?: string | null;
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

  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [kpis, setKpis] = useState<KPI[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /**
   * ========================================
   * Current Time
   * ========================================
   */

  const [now, setNow] = useState(() =>
    Date.now()
  );

  /**
   * ========================================
   * Pagination
   * ========================================
   */

  const [page, setPage] = useState(1);

  const limit = 10;

  /**
   * ========================================
   * Filters
   * ========================================
   */

  const [search, setSearch] =
    useState("");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
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
   * ========================================
   * Details Modal
   * ========================================
   */

  const [selectedRecord, setSelectedRecord] =
    useState<MaintenanceRecord | null>(
      null
    );

  const [detailsOpened, setDetailsOpened] =
    useState(false);

  /**
   * ========================================
   * Cost Modal
   * ========================================
   */

  const [costOpened, setCostOpened] =
    useState(false);

  const [
    selectedCostRecord,
    setSelectedCostRecord,
  ] = useState<MaintenanceRecord | null>(
    null
  );

  const [costValue, setCostValue] =
    useState("");

  const [savingCost, setSavingCost] =
    useState(false);

  /**
   * ========================================
   * Delete
   * ========================================
   */

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  /**
   * ========================================
   * Monthly Report
   * ========================================
   */

  const [monthlyReportOpened, setMonthlyReportOpened] =
    useState(false);

  const currentDate = new Date();

  const [monthlyReportMonth, setMonthlyReportMonth] =
    useState(
      `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}`
    );

  const [monthlyReportLoading, setMonthlyReportLoading] =
    useState(false);

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
   * Export Existing Excel
   * ========================================
   */

  const handleExportExcel =
    async () => {
      try {
        setError("");

        if (
          filteredRecords.length === 0
        ) {
          setError(
            "لا توجد سجلات مطابقة للفلاتر لتصديرها"
          );

          return;
        }

        const selectedVehicle =
          vehicles.find(
            (vehicle) =>
              String(vehicle.id) ===
              vehicleId
          );

        const selectedKpi =
          kpis.find(
            (kpi) =>
              String(kpi.id) ===
              kpiId
          );

        const selectedSubKpi =
          selectedKpi?.sub_kpis.find(
            (subKpi) =>
              String(subKpi.id) ===
              subKpiId
          );

        await exportMaintenanceExcel({
          records: filteredRecords,

          filters: {
            search,

            dateFrom,
            dateTo,

            vehicle:
              selectedVehicle?.plate_number,

            kpi:
              selectedKpi?.name,

            subKpi:
              selectedSubKpi?.name,

            status:
              status === "open"
                ? "داخل الصيانة"
                : status === "closed"
                ? "خارج الصيانة"
                : undefined,
          },
        });
      } catch (error) {
        console.error(
          "Excel export error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تصدير ملف Excel"
        );
      }
    };

  /**
   * ========================================
   * Load Filter Data
   * ========================================
   */

  const loadFilterData =
    async () => {
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
        console.error(
          "Load filter data error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء تحميل بيانات الفلاتر"
        );
      }
    };

  /**
   * ========================================
   * Load Maintenance History
   * ========================================
   */

  const loadHistory =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        if (dateFrom) {
          params.set(
            "dateFrom",
            dateFrom
          );
        }

        if (dateTo) {
          params.set(
            "dateTo",
            dateTo
          );
        }

        const query =
          params.toString();

        const url =
          `/api/maintenance/history${
            query
              ? `?${query}`
              : ""
          }`;

        console.log(
          "Loading maintenance history:",
          url
        );

        const response =
          await fetch(url, {
            method: "GET",
            cache: "no-store",
          });

        const data =
          await response.json();

        console.log(
          "MAINTENANCE HISTORY STATUS:",
          response.status
        );

        console.log(
          "MAINTENANCE HISTORY RESPONSE:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.details ||
              data?.detail ||
              "Failed to load maintenance history"
          );
        }

        if (
          data?.success === false
        ) {
          throw new Error(
            data?.error ||
              data?.details ||
              "Failed to load maintenance history"
          );
        }

        setRecords(
          Array.isArray(data?.data)
            ? data.data
            : []
        );
      } catch (err) {
        console.error(
          "Load maintenance history error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء تحميل سجل الصيانة"
        );

        setRecords([]);
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
  }, []);

  /**
   * ========================================
   * Reload History When Date Changes
   * ========================================
   */

  useEffect(() => {
    loadHistory();
  }, [dateFrom, dateTo]);

  /**
   * ========================================
   * Delete Maintenance Record
   * ========================================
   */

  const deleteRecord =
    async (
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
        setDeletingId(
          record.id
        );

        setError("");

        const response =
          await fetch(
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

        setRecords(
          (currentRecords) =>
            currentRecords.filter(
              (item) =>
                item.id !==
                record.id
            )
        );

        if (
          selectedRecord?.id ===
          record.id
        ) {
          setDetailsOpened(
            false
          );

          setSelectedRecord(
            null
          );
        }

        if (
          selectedCostRecord?.id ===
          record.id
        ) {
          setCostOpened(
            false
          );

          setSelectedCostRecord(
            null
          );

          setCostValue("");
        }
      } catch (err) {
        console.error(
          "Delete maintenance record error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء حذف سجل الصيانة"
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  /**
   * ========================================
   * Vehicle Options
   * ========================================
   */

  const vehicleOptions =
    useMemo(() => {
      const map =
        new Map<
          string,
          string
        >();

      vehicles.forEach(
        (vehicle) => {
          map.set(
            String(
              vehicle.id
            ),
            vehicle.plate_number
          );
        }
      );

      return Array.from(
        map.entries()
      ).map(
        ([
          value,
          label,
        ]) => ({
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

  const kpiOptions =
    useMemo(() => {
      const map =
        new Map<
          string,
          string
        >();

      kpis.forEach(
        (kpi) => {
          map.set(
            String(kpi.id),
            kpi.name
          );
        }
      );

      return Array.from(
        map.entries()
      ).map(
        ([
          value,
          label,
        ]) => ({
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

  const subKpiOptions =
    useMemo(() => {
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
          label:
            subKpi.name,
        })
      );
    }, [
      kpis,
      kpiId,
    ]);

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
          if (query) {
            const searchableText =
              [
                record.id,
                record.vehicle_number,
                record.plate_number,
                record.model,
                record.area,
                record.kpi_name,
                record.sub_kpi_name,
                record.maintenance_location,
                record.description,
                record.notes,
                record.created_by,
                record.updated_by,
                record.cost,
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

          if (
            dateFrom ||
            dateTo
          ) {
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
              )
            ) {
              return false;
            }

            if (dateFrom) {
              const fromTime =
                new Date(
                  `${dateFrom}T00:00:00`
                ).getTime();

              if (
                exitTime <
                fromTime
              ) {
                return false;
              }
            }

            if (dateTo) {
              const toTime =
                new Date(
                  `${dateTo}T23:59:59.999`
                ).getTime();

              if (
                entryTime >
                toTime
              ) {
                return false;
              }
            }
          }

          if (
            vehicleId &&
            String(
              record.vehicle_id
            ) !== vehicleId
          ) {
            return false;
          }

          if (
            kpiId &&
            String(
              record.kpi_id
            ) !== kpiId
          ) {
            return false;
          }

          if (
            subKpiId &&
            String(
              record.sub_kpi_id
            ) !==
              subKpiId
          ) {
            return false;
          }

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
      dateFrom,
      dateTo,
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
    dateFrom,
    dateTo,
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

  const formatDuration =
    (
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
          difference /
            1000
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

      if (
        minutes > 0
      ) {
        parts.push(
          `${minutes} دقيقة`
        );
      }

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

  const formatDateTime =
    (
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
        "en-JO",
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
   * Open Cost Modal
   * ========================================
   */

  const openCostModal = (
    record: MaintenanceRecord
  ) => {
    setSelectedCostRecord(
      record
    );

    setCostValue(
      record.cost !==
        null &&
      record.cost !==
        undefined
        ? String(
            record.cost
          )
        : ""
    );

    setCostOpened(
      true
    );
  };

  /**
   * ========================================
   * Save Cost
   * ========================================
   */

  const saveCost =
    async () => {
      if (
        !selectedCostRecord
      ) {
        return;
      }

      const trimmedValue =
        costValue.trim();

      const cost =
        trimmedValue ===
        ""
          ? null
          : Number(
              trimmedValue
            );

      if (
        cost !== null &&
        (!Number.isFinite(
          cost
        ) ||
          cost < 0)
      ) {
        setError(
          "يرجى إدخال قيمة تكلفة صحيحة"
        );

        return;
      }

      try {
        setSavingCost(
          true
        );

        setError("");

        const response =
          await fetch(
            `/api/maintenance/history/${selectedCostRecord.id}`,
            {
              method:
                "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                {
                  cost,
                }
              ),
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
              "Failed to save maintenance cost"
          );
        }

        setRecords(
          (
            currentRecords
          ) =>
            currentRecords.map(
              (item) =>
                item.id ===
                selectedCostRecord.id
                  ? {
                      ...item,
                      cost,
                      updated_at:
                        data
                          .data
                          ?.updated_at ??
                        item.updated_at,
                    }
                  : item
            )
        );

        setSelectedRecord(
          (
            currentRecord
          ) =>
            currentRecord &&
            currentRecord.id ===
              selectedCostRecord.id
              ? {
                  ...currentRecord,
                  cost,
                  updated_at:
                    data
                      .data
                      ?.updated_at ??
                    currentRecord.updated_at,
                }
              : currentRecord
        );

        setCostOpened(
          false
        );

        setSelectedCostRecord(
          null
        );

        setCostValue(
          ""
        );
      } catch (err) {
        console.error(
          "Save maintenance cost error:",
          err
        );

        setError(
          err instanceof
            Error
            ? err.message
            : "حدث خطأ أثناء حفظ تكلفة الصيانة"
        );
      } finally {
        setSavingCost(
          false
        );
      }
    };

  /**
   * ========================================
   * Clear Filters
   * ========================================
   */

  const clearFilters =
    () => {
      setSearch("");
      setDateFrom("");
      setDateTo("");
      setVehicleId("");
      setKpiId("");
      setSubKpiId("");
      setStatus("");
      setPage(1);
    };

  /**
   * ========================================
   * Monthly Maintenance Report
   * ========================================
   *
   * التقرير:
   *
   * رقم المركبة | المنطقة | 1/10 | 2/10 | ...
   *
   * المدة تخزن كرقم Excel حقيقي
   * ويتم عرضها [h]:mm.
   *
   * مثال:
   *
   * دخول:
   * 01/10 22:00
   *
   * خروج:
   * 02/10 02:00
   *
   * النتيجة:
   * 01/10 = 02:00
   * 02/10 = 02:00
   *
   * وليس 04:00 في يوم واحد.
   */

  const handleMonthlyMaintenanceReport =
    async () => {
      if (!monthlyReportMonth) {
        setError(
          "يرجى اختيار الشهر"
        );

        return;
      }

      const [
        yearText,
        monthText,
      ] =
        monthlyReportMonth.split(
          "-"
        );

      const year =
        Number(yearText);

      const month =
        Number(monthText);

      if (
        !Number.isFinite(
          year
        ) ||
        !Number.isFinite(
          month
        ) ||
        month < 1 ||
        month > 12
      ) {
        setError(
          "الشهر المحدد غير صحيح"
        );

        return;
      }

      try {
        setMonthlyReportLoading(
          true
        );

        setError("");

        /**
         * أول يوم في الشهر.
         */
        const dateFrom =
          `${year}-${String(
            month
          ).padStart(
            2,
            "0"
          )}-01`;

        /**
         * آخر يوم في الشهر.
         */
        const lastDay =
          new Date(
            year,
            month,
            0
          ).getDate();

        const dateTo =
          `${year}-${String(
            month
          ).padStart(
            2,
            "0"
          )}-${String(
            lastDay
          ).padStart(
            2,
            "0"
          )}`;

        /**
         * نطلب الشهر المطلوب
         * بشكل مستقل عن فلاتر الصفحة.
         */
        const params =
          new URLSearchParams();

        params.set(
          "dateFrom",
          dateFrom
        );

        params.set(
          "dateTo",
          dateTo
        );

        const response =
          await fetch(
            `/api/maintenance/history?${params.toString()}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.details ||
              data?.detail ||
              "فشل تحميل بيانات التقرير الشهري"
          );
        }

        if (
          data?.success === false
        ) {
          throw new Error(
            data?.error ||
              data?.details ||
              "فشل تحميل بيانات التقرير الشهري"
          );
        }

        const monthlyRecords: MaintenanceRecord[] =
          Array.isArray(
            data?.data
          )
            ? data.data
            : [];

        /**
         * عدد أيام الشهر.
         */
        const daysInMonth =
          new Date(
            year,
            month,
            0
          ).getDate();

        /**
         * بداية الشهر.
         */
        const monthStart =
          new Date(
            year,
            month - 1,
            1,
            0,
            0,
            0,
            0
          ).getTime();

        /**
         * بداية الشهر التالي.
         *
         * نستخدمه كـ exclusive end.
         */
        const monthEnd =
          new Date(
            year,
            month,
            1,
            0,
            0,
            0,
            0
          ).getTime();

        const DAY_MS =
          24 *
          60 *
          60 *
          1000;

        /**
         * Map للمركبات.
         *
         * كل مركبة لها صف واحد.
         */
        type MonthlyRow = {
          vehicleId: number;
          vehicleNumber: string;
          area: string;
          days: number[];
          total: number;
        };

        const vehicleMap =
          new Map<
            number,
            MonthlyRow
          >();

        /**
         * نضيف كل المركبات أولاً.
         *
         * هذا يعني أن المركبة التي ليس
         * لديها صيانة خلال الشهر ستظهر
         * أيضًا بقيم 00:00.
         */
        for (const vehicle of vehicles) {
          const id =
            Number(
              vehicle.id
            );

          if (!id) {
            continue;
          }

          const vehicleNumber =
            String(
              vehicle.vehicle_number ??
                ""
            ).trim() ||
            String(
              vehicle.plate_number ??
                ""
            ).trim() ||
            "-";

          vehicleMap.set(
            id,
            {
              vehicleId: id,

              vehicleNumber,

              area:
                vehicle.area ||
                "-",

              days:
                Array(
                  daysInMonth
                ).fill(0),

              total: 0,
            }
          );
        }

        /**
         * نوزع كل سجل صيانة
         * على الأيام.
         */
        for (const record of monthlyRecords) {
          const vehicleId =
            Number(
              record.vehicle_id
            );

          if (!vehicleId) {
            continue;
          }

          const entryTime =
            new Date(
              record.entry_at
            ).getTime();

          if (
            !Number.isFinite(
              entryTime
            )
          ) {
            continue;
          }

          /**
           * إذا الصيانة مفتوحة:
           * نحسب حتى الآن.
           */
          const exitTime =
            record.exit_at
              ? new Date(
                  record.exit_at
                ).getTime()
              : Date.now();

          if (
            !Number.isFinite(
              exitTime
            )
          ) {
            continue;
          }

          /**
           * تجاهل السجل إذا كان
           * بالكامل خارج الشهر.
           */
          if (
            exitTime <=
              monthStart ||
            entryTime >=
              monthEnd
          ) {
            continue;
          }

          /**
           * إذا المركبة غير موجودة
           * في قائمة vehicles نضيفها
           * من بيانات السجل.
           */
          if (
            !vehicleMap.has(
              vehicleId
            )
          ) {
            const vehicleNumber =
              String(
                record.vehicle_number ??
                  ""
              ).trim() ||
              String(
                record.plate_number ??
                  ""
              ).trim() ||
              "-";

            vehicleMap.set(
              vehicleId,
              {
                vehicleId,

                vehicleNumber,

                area:
                  record.area ||
                  "-",

                days:
                  Array(
                    daysInMonth
                  ).fill(0),

                total: 0,
              }
            );
          }

          const row =
            vehicleMap.get(
              vehicleId
            );

          if (!row) {
            continue;
          }

          /**
           * توزيع المدة على كل يوم.
           */
          for (
            let day = 1;
            day <=
            daysInMonth;
            day++
          ) {
            const dayStart =
              new Date(
                year,
                month - 1,
                day,
                0,
                0,
                0,
                0
              ).getTime();

            const dayEnd =
              dayStart +
              DAY_MS;

            /**
             * بداية التداخل.
             */
            const overlapStart =
              Math.max(
                entryTime,
                dayStart
              );

            /**
             * نهاية التداخل.
             */
            const overlapEnd =
              Math.min(
                exitTime,
                dayEnd
              );

            if (
              overlapEnd <=
              overlapStart
            ) {
              continue;
            }

            const durationMs =
              overlapEnd -
              overlapStart;

            /**
             * Excel يخزن الوقت
             * كنسبة من اليوم.
             *
             * 1 ساعة =
             * 1 / 24
             */
            const excelDuration =
              durationMs /
              DAY_MS;

            row.days[
              day - 1
            ] +=
              excelDuration;

            row.total +=
              excelDuration;
          }
        }

        /**
         * ترتيب المركبات.
         */
        const monthlyRows =
          Array.from(
            vehicleMap.values()
          ).sort(
            (a, b) =>
              a.vehicleNumber.localeCompare(
                b.vehicleNumber,
                "ar",
                {
                  numeric: true,
                  sensitivity:
                    "base",
                }
              )
          );

        /**
         * ====================================
         * Excel Headers
         * ====================================
         */

        const headers: string[] =
          [
            "رقم المركبة",
            "المنطقة",
          ];

        for (
          let day = 1;
          day <=
          daysInMonth;
          day++
        ) {
          headers.push(
            `${day}/${month}`
          );
        }

        headers.push(
          "الإجمالي"
        );

        /**
         * ====================================
         * Excel Rows
         * ====================================
         */

        const excelRows: (
          | string
          | number
        )[][] =
          [];

        for (const row of monthlyRows) {
          excelRows.push([
            row.vehicleNumber,

            row.area,

            ...row.days,

            row.total,
          ]);
        }

        /**
         * ====================================
         * Create Worksheet
         * ====================================
         */

        const worksheet =
          XLSX.utils.aoa_to_sheet([
            headers,
            ...excelRows,
          ]);

        /**
         * RTL.
         */
        worksheet["!views"] =
          [
            {
              RTL: true,
            },
          ];

        /**
         * Column widths.
         */
        worksheet["!cols"] =
          [
            {
              wch: 18,
            },
            {
              wch: 20,
            },

            ...Array.from(
              {
                length:
                  daysInMonth,
              },
              () => ({
                wch: 11,
              })
            ),

            {
              wch: 14,
            },
          ];

        /**
         * ====================================
         * Header Style
         * ====================================
         */

        const headerStyle = {
          font: {
            bold: true,
            color: "FFFFFF",
            sz: 12,
          },

          fill: {
            fgColor: {
              rgb: "1F4E78",
            },
          },

          alignment: {
            horizontal:
              "center",
            vertical:
              "center",
            wrapText: true,
          },

          border: {
            top: {
              style: "thin",
              color: {
                rgb: "D9E2F3",
              },
            },

            bottom: {
              style: "thin",
              color: {
                rgb: "D9E2F3",
              },
            },

            left: {
              style: "thin",
              color: {
                rgb: "D9E2F3",
              },
            },

            right: {
              style: "thin",
              color: {
                rgb: "D9E2F3",
              },
            },
          },
        };

        for (
          let col = 0;
          col <
          headers.length;
          col++
        ) {
          const address =
            XLSX.utils.encode_cell(
              {
                r: 0,
                c: col,
              }
            );

          if (
            worksheet[address]
          ) {
            worksheet[
              address
            ].s =
              headerStyle;
          }
        }

        /**
         * ====================================
         * Data Cell Style
         * ====================================
         */

        const dataStyle = {
          alignment: {
            horizontal:
              "center",
            vertical:
              "center",
          },

          border: {
            top: {
              style: "thin",
              color: {
                rgb: "E5E7EB",
              },
            },

            bottom: {
              style: "thin",
              color: {
                rgb: "E5E7EB",
              },
            },

            left: {
              style: "thin",
              color: {
                rgb: "E5E7EB",
              },
            },

            right: {
              style: "thin",
              color: {
                rgb: "E5E7EB",
              },
            },
          },
        };

        /**
         * أول عمودين.
         */
        for (
          let rowIndex = 1;
          rowIndex <=
          excelRows.length;
          rowIndex++
        ) {
          for (
            let col = 0;
            col <= 1;
            col++
          ) {
            const address =
              XLSX.utils.encode_cell(
                {
                  r: rowIndex,
                  c: col,
                }
              );

            if (
              worksheet[address]
            ) {
              worksheet[
                address
              ].s =
                dataStyle;
            }
          }
        }

        /**
         * خلايا المدة.
         *
         * [h]:mm مهم جدًا لأنه يسمح
         * بعرض إجمالي أكبر من 24 ساعة.
         */
        for (
          let rowIndex = 1;
          rowIndex <=
          excelRows.length;
          rowIndex++
        ) {
          for (
            let col = 2;
            col <
            headers.length;
            col++
          ) {
            const address =
              XLSX.utils.encode_cell(
                {
                  r: rowIndex,
                  c: col,
                }
              );

            const cell =
              worksheet[
                address
              ];

            if (!cell) {
              continue;
            }

            cell.t = "n";

            cell.z =
              "[h]:mm";

            cell.s =
              dataStyle;
          }
        }

        /**
         * ارتفاع Header.
         */
        worksheet["!rows"] =
          [
            {
              hpt: 30,
            },
          ];

        /**
         * ====================================
         * Workbook
         * ====================================
         */

        const workbook =
          XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          "مدة الصيانة"
        );

        /**
         * ====================================
         * Filename
         * ====================================
         */

        const monthFormatted =
          String(
            month
          ).padStart(
            2,
            "0"
          );

        const fileName =
          `تقرير_مدة_الصيانة_${year}-${monthFormatted}.xlsx`;

        XLSX.writeFile(
          workbook,
          fileName
        );

        /**
         * إغلاق النافذة بعد النجاح.
         */
        setMonthlyReportOpened(
          false
        );
      } catch (err) {
        console.error(
          "Monthly maintenance report error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء إنشاء التقرير الشهري"
        );
      } finally {
        setMonthlyReportLoading(
          false
        );
      }
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

          <Group gap="sm">
            <Button
              radius="xl"
              color="green"
              variant="light"
              leftSection={
                <IconFileDescription
                  size={18}
                />
              }
              onClick={
                handleExportExcel
              }
              disabled={
                loading ||
                filteredRecords.length ===
                  0
              }
            >
              تصدير Excel
            </Button>

            <Button
              radius="xl"
              color="blue"
              variant="light"
              leftSection={
                <IconTimeline
                  size={18}
                />
              }
              onClick={() =>
                setMonthlyReportOpened(
                  true
                )
              }
              disabled={
                loading
              }
            >
              تقرير مدة الصيانة الشهري
            </Button>
          </Group>
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
                placeholder="رقم المركبة، الموديل، المنطقة، نوع الصيانة، مكان الصيانة..."
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

              {/* Date From */}

              <Text
                component="label"
                size="sm"
                fw={500}
              >
                من تاريخ

                <input
                  type="date"
                  value={
                    dateFrom
                  }
                  onChange={(
                    event
                  ) =>
                    setDateFrom(
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

              {/* Date To */}

              <Text
                component="label"
                size="sm"
                fw={500}
              >
                إلى تاريخ

                <input
                  type="date"
                  value={
                    dateTo
                  }
                  min={
                    dateFrom ||
                    undefined
                  }
                  onChange={(
                    event
                  ) =>
                    setDateTo(
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
                    value ?? ""
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
                    value ?? ""
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
                    value ?? ""
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
                      "داخل الصيانة",
                  },
                  {
                    value:
                      "closed",
                    label:
                      "خارج الصيانة",
                  },
                ]}
                value={
                  status
                }
                onChange={(
                  value
                ) =>
                  setStatus(
                    value ?? ""
                  )
                }
                clearable
              />
            </SimpleGrid>

            {(dateFrom ||
              dateTo) && (
              <Text
                size="sm"
                c="dimmed"
              >
                الفترة المحددة:{" "}
                <Text
                  component="span"
                  fw={700}
                >
                  {dateFrom ||
                    "البداية"}
                </Text>{" "}
                إلى{" "}
                <Text
                  component="span"
                  fw={700}
                >
                  {dateTo ||
                    "النهاية"}
                </Text>
              </Text>
            )}
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
                    المنطقة
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
                    مكان الصيانة
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
                {loading ? (
                  <tr>
                    <td
                      colSpan={10}
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
                  <tr>
                    <td
                      colSpan={10}
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

                        <td
                          style={{
                            padding:
                              14,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          <Text
                            size="sm"
                            fw={600}
                          >
                            {record.area ||
                              "-"}
                          </Text>
                        </td>

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

                        <td
                          style={{
                            padding:
                              14,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          <Group
                            gap={5}
                            wrap="nowrap"
                          >
                            <IconMapPin
                              size={
                                16
                              }
                            />

                            <Text
                              size="sm"
                            >
                              {record.maintenance_location ||
                                "-"}
                            </Text>
                          </Group>
                        </td>

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

                        <td
                          style={{
                            padding:
                              14,
                          }}
                        >
                          {record.status ===
                          "open" ? (
                            <Badge
                              variant="light"
                              color="orange"
                            >
                              داخل الصيانة
                            </Badge>
                          ) : (
                            <Badge
                              variant="light"
                              color="green"
                            >
                              خارج الصيانة
                            </Badge>
                          )}
                        </td>

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
                            <Button
                              size="xs"
                              variant="light"
                              onClick={() =>
                                openDetails(
                                  record
                                )
                              }
                            >
                              <IconEye
                                size={
                                  15
                                }
                              />
                            </Button>

                            <Button
                              size="xs"
                              color={
                                record.cost !==
                                null
                                  ? "red"
                                  : "green"
                              }
                              variant="light"
                              onClick={() =>
                                openCostModal(
                                  record
                                )
                              }
                            >
                              <IconReportMoney
                                size={
                                  15
                                }
                                stroke={
                                  2
                                }
                              />
                            </Button>

                            <Button
                              size="xs"
                              color="red"
                              variant="light"
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
                              <IconTrash
                                size={
                                  15
                                }
                              />
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

      {/* ===================================================== */}
      {/* Monthly Maintenance Report Modal */}
      {/* ===================================================== */}

      <Modal
        dir="rtl"
        opened={
          monthlyReportOpened
        }
        onClose={() => {
          if (
            monthlyReportLoading
          ) {
            return;
          }

          setMonthlyReportOpened(
            false
          );
        }}
        centered
        size="sm"
        radius="lg"
        title={
          <Group gap="sm">
            <ThemeIcon
              size={40}
              radius="md"
              variant="light"
              color="blue"
            >
              <IconTimeline
                size={21}
              />
            </ThemeIcon>

            <div>
              <Text
                fw={700}
                size="md"
              >
                تقرير مدة الصيانة الشهري
              </Text>

              <Text
                size="xs"
                c="dimmed"
                mt={2}
              >
                مدة الصيانة لكل مركبة حسب اليوم
              </Text>
            </div>
          </Group>
        }
      >
        <Stack gap="lg">

          <Text
            size="sm"
            c="dimmed"
            lh={1.7}
          >
            اختر الشهر المطلوب لإنشاء تقرير
            يحتوي على مدة صيانة كل مركبة في
            كل يوم من الشهر.
          </Text>

          <div>
            <Text
              size="sm"
              fw={600}
              mb={6}
            >
              الشهر
            </Text>

            <input
              type="month"
              value={
                monthlyReportMonth
              }
              onChange={(
                event
              ) =>
                setMonthlyReportMonth(
                  event
                    .currentTarget
                    .value
                )
              }
              style={{
                width:
                  "100%",
                height: 42,
                border:
                  "1px solid #ced4da",
                borderRadius: 8,
                padding:
                  "0 12px",
                fontSize: 15,
                boxSizing:
                  "border-box",
                direction:
                  "ltr",
              }}
            />
          </div>

          <Alert
            color="blue"
            variant="light"
            icon={
              <IconInfoCircle
                size={18}
              />
            }
          >
            <Text
              size="sm"
              lh={1.7}
            >
              سيتم تقسيم مدة الصيانة على
              الأيام بشكل دقيق. إذا بدأت
              الصيانة في يوم وانتهت في اليوم
              التالي، سيتم توزيع الساعات بين
              اليومين.
            </Text>
          </Alert>

          <Card
            withBorder
            radius="md"
            padding="md"
          >
            <Stack gap="xs">
              <Text
                size="xs"
                c="dimmed"
              >
                شكل التقرير
              </Text>

              <Text
                size="sm"
                fw={700}
              >
                رقم المركبة | المنطقة | 1/10 |
                2/10 | 3/10 | ... | الإجمالي
              </Text>

              <Text
                size="xs"
                c="dimmed"
              >
                القيم في Excel ستكون بصيغة
                ساعات ودقائق ويمكن جمعها مباشرة.
              </Text>
            </Stack>
          </Card>

          <Group
            justify="flex-end"
            gap="sm"
          >
            <Button
              variant="default"
              onClick={() =>
                setMonthlyReportOpened(
                  false
                )
              }
              disabled={
                monthlyReportLoading
              }
            >
              إلغاء
            </Button>

            <Button
              color="blue"
              onClick={
                handleMonthlyMaintenanceReport
              }
              loading={
                monthlyReportLoading
              }
              leftSection={
                <IconFileDescription
                  size={18}
                />
              }
            >
              إنشاء التقرير
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ===================================================== */}
      {/* Details Modal */}
      {/* ===================================================== */}

      <Modal
        dir="rtl"
        opened={detailsOpened}
        onClose={() => {
          setDetailsOpened(
            false
          );

          setSelectedRecord(
            null
          );
        }}
        size="xl"
        centered
        radius="lg"
        padding={20}
        withCloseButton
        title={
          <Group
            gap="sm"
            px="xs"
          >
            <ThemeIcon
              size={38}
              radius="md"
              variant="light"
              color="blue"
            >
              <IconTool
                size={21}
              />
            </ThemeIcon>

            <div>
              <Text
                fw={700}
                size="md"
              >
                تفاصيل سجل الصيانة
              </Text>

              <Text
                size="xs"
                c="dimmed"
              >
                معلومات الصيانة والتوقيت وسجل الإجراءات
              </Text>
            </div>
          </Group>
        }
      >
        {selectedRecord && (
          <Stack gap="lg">

            <Card
              withBorder
              radius="lg"
              padding="lg"
              bg="var(--mantine-color-gray-0)"
            >
              <Group
                justify="space-between"
                align="center"
                wrap="nowrap"
              >
                <Group
                  gap="md"
                  wrap="nowrap"
                >
                  <ThemeIcon
                    size={54}
                    radius="xl"
                    variant="light"
                    color="blue"
                  >
                    <IconCar
                      size={30}
                    />
                  </ThemeIcon>

                  <div>
                    <Text
                      size="xs"
                      c="dimmed"
                      fw={500}
                    >
                      المركبة
                    </Text>

                    <Text
                      size="xl"
                      fw={800}
                      lh={1.2}
                    >
                      {selectedRecord.plate_number ||
                        "-"}
                    </Text>

                    <Text
                      size="sm"
                      c="dimmed"
                      mt={3}
                    >
                      {selectedRecord.model ||
                        "-"}
                    </Text>
                  </div>
                </Group>

                <Badge
                  size="lg"
                  radius="md"
                  variant="light"
                  color={
                    selectedRecord.status ===
                    "open"
                      ? "orange"
                      : "green"
                  }
                  leftSection={
                    selectedRecord.status ===
                    "open" ? (
                      <IconClock
                        size={
                          15
                        }
                      />
                    ) : (
                      <IconCircleCheck
                        size={
                          15
                        }
                      />
                    )
                  }
                >
                  {selectedRecord.status ===
                  "open"
                    ? "داخل الصيانة"
                    : "خارج الصيانة"}
                </Badge>
              </Group>
            </Card>

            <SimpleGrid
              cols={{
                base: 1,
                sm: 2,
              }}
            >
              <Card
                withBorder
                radius="lg"
                padding="lg"
              >
                <Group
                  gap="md"
                  align="flex-start"
                  wrap="nowrap"
                >
                  <ThemeIcon
                    size={42}
                    radius="md"
                    variant="light"
                    color="orange"
                  >
                    <IconTool
                      size={22}
                    />
                  </ThemeIcon>

                  <div>
                    <Text
                      size="xs"
                      c="dimmed"
                      fw={500}
                    >
                      نوع الصيانة
                    </Text>

                    <Text
                      fw={700}
                      size="md"
                      mt={2}
                    >
                      {selectedRecord.kpi_name ||
                        "-"}
                    </Text>

                    <Text
                      size="sm"
                      c="dimmed"
                      mt={3}
                    >
                      {selectedRecord.sub_kpi_name ||
                        "-"}
                    </Text>
                  </div>
                </Group>
              </Card>

              <Card
                withBorder
                radius="lg"
                padding="lg"
              >
                <Group
                  gap="md"
                  align="flex-start"
                  wrap="nowrap"
                >
                  <ThemeIcon
                    size={42}
                    radius="md"
                    variant="light"
                    color="blue"
                  >
                    <IconMapPin
                      size={22}
                    />
                  </ThemeIcon>

                  <div>
                    <Text
                      size="xs"
                      c="dimmed"
                      fw={500}
                    >
                      مكان الصيانة
                    </Text>

                    <Text
                      fw={700}
                      size="md"
                      mt={2}
                    >
                      {selectedRecord.maintenance_location ||
                        "-"}
                    </Text>
                  </div>
                </Group>
              </Card>
            </SimpleGrid>

            <div>
              <Group
                gap="xs"
                mb="sm"
              >
                <IconTimeline
                  size={18}
                />

                <Text
                  fw={700}
                  size="sm"
                >
                  دورة الصيانة
                </Text>
              </Group>

              <SimpleGrid
                cols={{
                  base: 1,
                  sm: 2,
                }}
                spacing="md"
              >
                <Card
                  withBorder
                  radius="lg"
                  padding="lg"
                >
                  <Group gap="sm">
                    <ThemeIcon
                      size={40}
                      radius="xl"
                      variant="light"
                      color="green"
                    >
                      <IconLogin
                        size={20}
                      />
                    </ThemeIcon>

                    <div>
                      <Text
                        size="xs"
                        c="dimmed"
                      >
                        وقت الدخول
                      </Text>

                      <Text
                        fw={700}
                        size="sm"
                        mt={2}
                      >
                        دخول الصيانة
                      </Text>
                    </div>
                  </Group>

                  <Divider my="md" />

                  <Text
                    fw={600}
                    size="sm"
                  >
                    {formatDateTime(
                      selectedRecord.entry_at
                    )}
                  </Text>
                </Card>

                <Card
                  withBorder
                  radius="lg"
                  padding="lg"
                >
                  <Group gap="sm">
                    <ThemeIcon
                      size={40}
                      radius="xl"
                      variant="light"
                      color="red"
                    >
                      <IconLogout
                        size={20}
                      />
                    </ThemeIcon>

                    <div>
                      <Text
                        size="xs"
                        c="dimmed"
                      >
                        وقت الخروج
                      </Text>

                      <Text
                        fw={700}
                        size="sm"
                        mt={2}
                      >
                        إخراج من الصيانة
                      </Text>
                    </div>
                  </Group>

                  <Divider my="md" />

                  <Text
                    fw={600}
                    size="sm"
                  >
                    {selectedRecord.exit_at
                      ? formatDateTime(
                          selectedRecord.exit_at
                        )
                      : "المركبة ما زالت في الصيانة"}
                  </Text>
                </Card>
              </SimpleGrid>
            </div>

            <Card
              withBorder
              radius="lg"
              padding="lg"
            >
              <Group gap="sm">
                <ThemeIcon
                  size={42}
                  radius="md"
                  variant="light"
                  color="violet"
                >
                  <IconClock
                    size={22}
                  />
                </ThemeIcon>

                <div>
                  <Text
                    size="xs"
                    c="dimmed"
                  >
                    مدة الصيانة
                  </Text>

                  <Text
                    fw={800}
                    size="lg"
                    mt={2}
                  >
                    {formatDuration(
                      selectedRecord.entry_at,
                      selectedRecord.exit_at
                    )}
                  </Text>
                </div>
              </Group>
            </Card>

            <Card
              withBorder
              radius="lg"
              padding="lg"
            >
              <Group
                justify="space-between"
                align="center"
              >
                <Group gap="sm">
                  <ThemeIcon
                    size={42}
                    radius="md"
                    variant="light"
                    color="teal"
                  >
                    <IconFileDescription
                      size={22}
                    />
                  </ThemeIcon>

                  <div>
                    <Text
                      size="xs"
                      c="dimmed"
                    >
                      تكلفة الصيانة
                    </Text>

                    <Text
                      fw={800}
                      size="lg"
                      mt={2}
                    >
                      {selectedRecord.cost !==
                        null &&
                      selectedRecord.cost !==
                        undefined
                        ? Number(
                            selectedRecord.cost
                          ).toFixed(2)
                        : "غير مسجلة"}
                    </Text>
                  </div>
                </Group>

                <Button
                  size="xs"
                  color="teal"
                  variant="light"
                  onClick={() =>
                    openCostModal(
                      selectedRecord
                    )
                  }
                >
                  {selectedRecord.cost !==
                  null
                    ? "تعديل"
                    : "إضافة تكلفة"}
                </Button>
              </Group>
            </Card>

            {(selectedRecord.description ||
              selectedRecord.notes) && (
              <SimpleGrid
                cols={{
                  base: 1,
                  sm: 2,
                }}
                spacing="md"
              >
                {selectedRecord.description && (
                  <Card
                    withBorder
                    radius="lg"
                    padding="lg"
                  >
                    <Group
                      gap="sm"
                      mb="sm"
                    >
                      <ThemeIcon
                        size={34}
                        radius="md"
                        variant="light"
                        color="blue"
                      >
                        <IconFileDescription
                          size={18}
                        />
                      </ThemeIcon>

                      <Text
                        fw={700}
                        size="sm"
                      >
                        وصف الصيانة
                      </Text>
                    </Group>

                    <Text
                      size="sm"
                      c="dimmed"
                      lh={1.7}
                    >
                      {
                        selectedRecord.description
                      }
                    </Text>
                  </Card>
                )}

                {selectedRecord.notes && (
                  <Card
                    withBorder
                    radius="lg"
                    padding="lg"
                  >
                    <Group
                      gap="sm"
                      mb="sm"
                    >
                      <ThemeIcon
                        size={34}
                        radius="md"
                        variant="light"
                        color="yellow"
                      >
                        <IconNotes
                          size={18}
                        />
                      </ThemeIcon>

                      <Text
                        fw={700}
                        size="sm"
                      >
                        الملاحظات
                      </Text>
                    </Group>

                    <Text
                      size="sm"
                      c="dimmed"
                      lh={1.7}
                    >
                      {
                        selectedRecord.notes
                      }
                    </Text>
                  </Card>
                )}
              </SimpleGrid>
            )}

            <div>
              <Group
                gap="xs"
                mb="sm"
              >
                <IconInfoCircle
                  size={18}
                />

                <Text
                  fw={700}
                  size="sm"
                >
                  معلومات المركبة
                </Text>
              </Group>

              <Card
                withBorder
                radius="lg"
                padding="lg"
              >
                <SimpleGrid
                  cols={{
                    base: 2,
                    sm: 5,
                  }}
                  spacing="lg"
                >
                  <div>
                    <Text
                      size="xs"
                      c="dimmed"
                      mb={4}
                    >
                      المنطقة
                    </Text>

                    <Text
                      size="sm"
                      fw={700}
                    >
                      {selectedRecord.area ||
                        "-"}
                    </Text>
                  </div>

                  <div>
                    <Text
                      size="xs"
                      c="dimmed"
                      mb={4}
                    >
                      سنة الصنع
                    </Text>

                    <Text
                      size="sm"
                      fw={700}
                    >
                      {selectedRecord.manufacture_year ||
                        "-"}
                    </Text>
                  </div>

                  <div>
                    <Text
                      size="xs"
                      c="dimmed"
                      mb={4}
                    >
                      الوزن
                    </Text>

                    <Text
                      size="sm"
                      fw={700}
                    >
                      {selectedRecord.weight ??
                        "-"}
                    </Text>
                  </div>

                  <div>
                    <Text
                      size="xs"
                      c="dimmed"
                      mb={4}
                    >
                      السعة
                    </Text>

                    <Text
                      size="sm"
                      fw={700}
                    >
                      {selectedRecord.capacity ??
                        "-"}
                    </Text>
                  </div>

                  <div>
                    <Text
                      size="xs"
                      c="dimmed"
                      mb={4}
                    >
                      مكان الصيانة
                    </Text>

                    <Text
                      size="sm"
                      fw={700}
                    >
                      {selectedRecord.maintenance_location ||
                        "-"}
                    </Text>
                  </div>
                </SimpleGrid>
              </Card>
            </div>

            <div>
              <Group
                gap="xs"
                mb="sm"
              >
                <IconHistory
                  size={18}
                />

                <Text
                  fw={700}
                  size="sm"
                >
                  سجل الإجراءات
                </Text>
              </Group>

              <Card
                withBorder
                radius="lg"
                padding="lg"
              >
                <Stack gap="md">

                  <Group
                    justify="space-between"
                    align="center"
                    wrap="nowrap"
                  >
                    <Group
                      gap="sm"
                      wrap="nowrap"
                    >
                      <ThemeIcon
                        size={34}
                        radius="xl"
                        variant="light"
                        color="green"
                      >
                        <IconLogin
                          size={17}
                        />
                      </ThemeIcon>

                      <div>
                        <Text
                          size="sm"
                          fw={600}
                        >
                          إدخال المركبة
                        </Text>

                        <Text
                          size="xs"
                          c="dimmed"
                        >
                          بواسطة{" "}
                          <Text
                            component="span"
                            fw={600}
                          >
                            {selectedRecord.created_by ||
                              "-"}
                          </Text>
                        </Text>
                      </div>
                    </Group>

                    <Text
                      size="xs"
                      c="dimmed"
                      ta="left"
                    >
                      {formatDateTime(
                        selectedRecord.created_at
                      )}
                    </Text>
                  </Group>

                  <Divider />

                  <Group
                    justify="space-between"
                    align="center"
                    wrap="nowrap"
                  >
                    <Group
                      gap="sm"
                      wrap="nowrap"
                    >
                      <ThemeIcon
                        size={34}
                        radius="xl"
                        variant="light"
                        color="red"
                      >
                        <IconLogout
                          size={17}
                        />
                      </ThemeIcon>

                      <div>
                        <Text
                          size="sm"
                          fw={600}
                        >
                          إخراج المركبة
                        </Text>

                        {selectedRecord.status ===
                        "open" ? (
                          <Text
                            size="xs"
                            c="dimmed"
                            mt={2}
                          >
                            لم يتم إخراج المركبة بعد
                          </Text>
                        ) : (
                          <Text
                            size="xs"
                            c="dimmed"
                            mt={2}
                          >
                            بواسطة{" "}
                            <Text
                              component="span"
                              fw={600}
                            >
                              {selectedRecord.updated_by ||
                                "-"}
                            </Text>
                          </Text>
                        )}
                      </div>
                    </Group>

                    <Text
                      size="xs"
                      c="dimmed"
                      ta="left"
                    >
                      {selectedRecord.updated_at
                        ? formatDateTime(
                            selectedRecord.updated_at
                          )
                        : "-"}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            </div>

            <Divider />

            <Button
              fullWidth
              size="md"
              radius="md"
              color="red"
              variant="light"
              leftSection={
                <IconTrash
                  size={18}
                />
              }
              loading={
                deletingId ===
                selectedRecord.id
              }
              disabled={
                deletingId !==
                null
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

      {/* ===================================================== */}
      {/* Cost Modal */}
      {/* ===================================================== */}

      <Modal
        dir="rtl"
        opened={costOpened}
        onClose={() => {
          if (savingCost) {
            return;
          }

          setCostOpened(
            false
          );

          setSelectedCostRecord(
            null
          );

          setCostValue("");
        }}
        centered
        size="sm"
        radius="lg"
        title={
          <Group gap="sm">
            <ThemeIcon
              size={40}
              radius="md"
              variant="light"
              color="teal"
            >
              <IconFileDescription
                size={21}
              />
            </ThemeIcon>

            <div>
              <Text
                fw={700}
                size="md"
              >
                تكلفة الصيانة
              </Text>

              <Text
                size="xs"
                c="dimmed"
                mt={2}
              >
                إدخال أو تعديل تكلفة سجل الصيانة
              </Text>
            </div>
          </Group>
        }
      >
        {selectedCostRecord && (
          <Stack gap="lg">

            <Card
              withBorder
              radius="lg"
              padding="md"
              bg="var(--mantine-color-gray-0)"
            >
              <Group
                justify="space-between"
                align="center"
              >
                <Group gap="sm">
                  <ThemeIcon
                    size={42}
                    radius="xl"
                    variant="light"
                    color="blue"
                  >
                    <IconCar
                      size={22}
                    />
                  </ThemeIcon>

                  <div>
                    <Text
                      size="xs"
                      c="dimmed"
                    >
                      المركبة
                    </Text>

                    <Text
                      fw={800}
                      size="md"
                    >
                      {
                        selectedCostRecord.plate_number
                      }
                    </Text>
                  </div>
                </Group>

                {selectedCostRecord.cost !==
                  null && (
                  <Badge
                    color="teal"
                    variant="light"
                    size="lg"
                  >
                    {Number(
                      selectedCostRecord.cost
                    ).toFixed(2)}
                  </Badge>
                )}
              </Group>

              <Divider my="md" />

              <Text
                size="sm"
                fw={700}
              >
                {
                  selectedCostRecord.kpi_name
                }
              </Text>

              <Text
                size="xs"
                c="dimmed"
                mt={3}
              >
                {
                  selectedCostRecord.sub_kpi_name
                }
              </Text>

              <Text
                size="xs"
                c="dimmed"
                mt="sm"
              >
                المنطقة:{" "}
                <Text
                  component="span"
                  fw={600}
                >
                  {selectedCostRecord.area ||
                    "-"}
                </Text>
              </Text>

              <Text
                size="xs"
                c="dimmed"
                mt={3}
              >
                مكان الصيانة:{" "}
                <Text
                  component="span"
                  fw={600}
                >
                  {selectedCostRecord.maintenance_location ||
                    "-"}
                </Text>
              </Text>
            </Card>

            <div>
              <Text
                size="sm"
                fw={600}
                mb={6}
              >
                قيمة التكلفة
              </Text>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  costValue
                }
                onChange={(
                  event
                ) =>
                  setCostValue(
                    event
                      .currentTarget
                      .value
                  )
                }
                placeholder="مثال: 150.00"
                inputMode="decimal"
                style={{
                  width:
                    "100%",
                  height: 42,
                  border:
                    "1px solid #ced4da",
                  borderRadius: 8,
                  padding:
                    "0 12px",
                  fontSize: 15,
                  outline:
                    "none",
                  direction:
                    "ltr",
                  boxSizing:
                    "border-box",
                }}
              />
            </div>

            <Group
              justify="flex-end"
              gap="sm"
            >
              <Button
                variant="default"
                onClick={() => {
                  setCostOpened(
                    false
                  );

                  setSelectedCostRecord(
                    null
                  );

                  setCostValue(
                    ""
                  );
                }}
                disabled={
                  savingCost
                }
              >
                إلغاء
              </Button>

              <Button
                color="teal"
                onClick={
                  saveCost
                }
                loading={
                  savingCost
                }
              >
                {selectedCostRecord.cost !==
                null
                  ? "تحديث التكلفة"
                  : "حفظ التكلفة"}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}