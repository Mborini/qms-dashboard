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
  Select,
  SelectProps,
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
  IconMapPin,
  IconTool,
  IconWeight,
} from "@tabler/icons-react";

import { useSession } from "next-auth/react";

// =====================================================
// Types
// =====================================================

type Vehicle = {
  id: number | string;

  plate_number?: string | null;
  vehicle_number?: string | null;
  name?: string | null;
  plate?: string | null;
  model?: string | null;

  // الجديد
  area?: string | null;
  capacity?: number | string | null;
};

type KPI = {
  id: number | string;
  name?: string | null;
  title?: string | null;
  kpi_name?: string | null;
};

type SubKPI = {
  id: number | string;
  kpi_id?: number | string | null;
  name?: string | null;
  title?: string | null;
  sub_kpi_name?: string | null;
};

type MaintenanceRecord = {
  id: number | string;

  vehicle_id: number | string;

  vehicle_name?: string | null;
  plate_number?: string | null;

  // الجديد
  area?: string | null;
  capacity?: number | string | null;

  kpi_id: number | string;
  kpi_name?: string | null;

  sub_kpi_id?: number | string | null;
  sub_kpi_name?: string | null;

  description?: string | null;
  notes?: string | null;

  entry_at: string;
  exit_at?: string | null;

  created_at?: string | null;
};

type Message = {
  type: "success" | "error";
  text: string;
};

// =====================================================
// Helpers
// =====================================================

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getCurrentDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;
}

function getCurrentTime(date = new Date()) {
  return `${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

/**
 * تحويل التاريخ والوقت المحلي الذي اختاره المستخدم
 * إلى ISO UTC.
 *
 * مثال في الأردن:
 *
 * 2026-09-04 + 12:00
 *
 * تصبح:
 *
 * 2026-09-04T09:00:00.000Z
 */
function localDateTimeToISOString(
  date: string,
  time: string
) {
  if (!date || !time) {
    return null;
  }

  const localDate = new Date(
    `${date}T${time}:00`
  );

  if (Number.isNaN(localDate.getTime())) {
    return null;
  }

  return localDate.toISOString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getDateTimeTimestamp(
  date: string,
  time: string
) {
  if (!date || !time) {
    return NaN;
  }

  const value = new Date(
    `${date}T${time}:00`
  );

  return value.getTime();
}

function isFutureDateTime(
  date: string,
  time: string,
  now: Date
) {
  const timestamp = getDateTimeTimestamp(
    date,
    time
  );

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return timestamp > now.getTime();
}

function calculateDuration(
  entryAt?: string | null,
  exitAt?: string | null,
  now = new Date()
) {
  if (!entryAt) return "-";

  const entry = new Date(entryAt);

  if (Number.isNaN(entry.getTime())) {
    return "-";
  }

  const end = exitAt
    ? new Date(exitAt)
    : now;

  if (Number.isNaN(end.getTime())) {
    return "-";
  }

  let milliseconds =
    end.getTime() - entry.getTime();

  if (milliseconds < 0) {
    milliseconds = 0;
  }

  const totalSeconds = Math.floor(
    milliseconds / 1000
  );

  const days = Math.floor(
    totalSeconds / 86400
  );

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(
      minutes
    )}m`;
  }

  if (hours > 0) {
    return `${hours}h ${pad(minutes)}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${pad(seconds)}s`;
  }

  return `${seconds}s`;
}

// =====================================================
// Safe API array extractor
// =====================================================

function extractArray(
  response: any,
  keys: string[] = []
): any[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (
    response.data &&
    typeof response.data === "object"
  ) {
    for (const key of keys) {
      if (Array.isArray(response.data[key])) {
        return response.data[key];
      }
    }
  }

  if (Array.isArray(response.rows)) {
    return response.rows;
  }

  return [];
}

// =====================================================
// Component
// =====================================================

export default function MaintenancePage() {
  // ===================================================
  // Session
  // ===================================================

  const { data: session } = useSession();

  const username =
    session?.user?.username ?? null;

  // ===================================================
  // Data
  // ===================================================

  const [vehicles, setVehicles] = useState<
    Vehicle[]
  >([]);

  const [kpis, setKpis] = useState<KPI[]>([]);

  const [subKpis, setSubKpis] = useState<
    SubKPI[]
  >([]);

  const [
    currentMaintenance,
    setCurrentMaintenance,
  ] = useState<MaintenanceRecord[]>([]);

  // ===================================================
  // Loading
  // ===================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [savingEntry, setSavingEntry] =
    useState(false);

  const [savingExit, setSavingExit] =
    useState(false);

  // ===================================================
  // Messages
  // ===================================================

  const [message, setMessage] =
    useState<Message | null>(null);

  // ===================================================
  // Live clock
  // ===================================================

  const [now, setNow] = useState(
    new Date()
  );

  // ===================================================
  // Entry modal
  // ===================================================

  const [
    entryModalOpened,
    setEntryModalOpened,
  ] = useState(false);

  // ===================================================
  // Exit modal
  // ===================================================

  const [
    exitModalOpened,
    setExitModalOpened,
  ] = useState(false);

  const [
    selectedExitRecord,
    setSelectedExitRecord,
  ] =
    useState<MaintenanceRecord | null>(
      null
    );

  // ===================================================
  // Entry form
  // ===================================================

  const [entryVehicle, setEntryVehicle] =
    useState<string | null>(null);

  const [entryKpi, setEntryKpi] =
    useState<string | null>(null);

  const [entrySubKpi, setEntrySubKpi] =
    useState<string | null>(null);

  const [entryDate, setEntryDate] =
    useState(getCurrentDate());

  const [entryTime, setEntryTime] =
    useState(getCurrentTime());

  const [
    entryDescription,
    setEntryDescription,
  ] = useState("");

  const [entryNotes, setEntryNotes] =
    useState("");

  // ===================================================
  // Exit form
  // ===================================================

  const [exitDate, setExitDate] =
    useState(getCurrentDate());

  const [exitTime, setExitTime] =
    useState(getCurrentTime());

  const [exitNotes, setExitNotes] =
    useState("");

  // ===================================================
  // Live clock
  // ===================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ===================================================
  // Initial date/time
  // ===================================================

  useEffect(() => {
    const current = new Date();

    setEntryDate(
      getCurrentDate(current)
    );

    setEntryTime(
      getCurrentTime(current)
    );

    setExitDate(
      getCurrentDate(current)
    );

    setExitTime(
      getCurrentTime(current)
    );
  }, []);

  // ===================================================
  // Load all data
  // ===================================================

  const loadData = async (
    initialLoad = false
  ) => {
    try {
      if (initialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [
        vehiclesRes,
        kpisRes,
        currentRes,
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

        fetch(
          "/api/maintenance/current",
          {
            cache: "no-store",
          }
        ),
      ]);

      // =================================================
      // Vehicles
      // =================================================

      const vehiclesJson =
        await vehiclesRes.json();

      console.log(
        "VEHICLES API:",
        vehiclesJson
      );

      if (!vehiclesRes.ok) {
        throw new Error(
          vehiclesJson?.error ||
            "Failed to load vehicles"
        );
      }

      const vehicleRows =
        extractArray(
          vehiclesJson,
          [
            "vehicles",
            "items",
            "results",
          ]
        );

      const normalizedVehicles =
        vehicleRows
          .map(
            (item: any): Vehicle => ({
              id:
                item.id ??
                item.vehicle_id ??
                item.vehicleId,

              plate_number:
                item.plate_number ??
                item.plate ??
                null,

              vehicle_number:
                item.vehicle_number ??
                item.vehicle_no ??
                null,

              name:
                item.name ??
                item.model ??
                null,

              plate:
                item.plate ??
                item.plate_number ??
                null,

              model:
                item.model ??
                null,

              // =========================================
              // الجديد
              // =========================================

              area:
                item.area ??
                null,

              capacity:
                item.capacity ??
                null,
            })
          )
          .filter(
            (item: Vehicle) =>
              item.id !== undefined &&
              item.id !== null
          );

      console.log(
        "NORMALIZED VEHICLES:",
        normalizedVehicles
      );

      setVehicles(
        normalizedVehicles
      );

      // =================================================
      // KPIs
      // =================================================

      const kpisJson =
        await kpisRes.json();

      console.log(
        "KPIS API:",
        kpisJson
      );

      if (!kpisRes.ok) {
        throw new Error(
          kpisJson?.error ||
            "Failed to load KPIs"
        );
      }

      const kpiRows =
        extractArray(
          kpisJson,
          [
            "kpis",
            "items",
            "results",
          ]
        );

      console.log(
        "KPI ROWS:",
        kpiRows
      );

      // =================================================
      // KPI Map
      // =================================================

      const kpiMap =
        new Map<string, KPI>();

      // =================================================
      // Sub KPI Map
      // =================================================

      const subKpiMap =
        new Map<string, SubKPI>();

      kpiRows.forEach(
        (item: any) => {
          // ---------------------------------------------
          // KPI
          // ---------------------------------------------

          const kpiId =
            item.id ??
            item.kpi_id ??
            item.kpiId;

          const kpiName =
            item.name ??
            item.kpi_name ??
            item.kpiName ??
            item.title;

          if (
            kpiId !== undefined &&
            kpiId !== null
          ) {
            const key =
              String(kpiId);

            if (!kpiMap.has(key)) {
              kpiMap.set(key, {
                id: kpiId,
                name:
                  kpiName ??
                  `KPI ${kpiId}`,
              });
            }
          }

          // ---------------------------------------------
          // Sub KPI
          // ---------------------------------------------

          const subKpiId =
            item.sub_kpi_id ??
            item.subKpiId ??
            item.sub_id;

          const subKpiName =
            item.sub_kpi_name ??
            item.subKpiName ??
            item.sub_name ??
            item.sub_title;

          const parentKpiId =
            item.sub_kpi_parent_id ??
            item.kpi_id ??
            item.kpiId ??
            item.parent_kpi_id ??
            item.parentKpiId;

          if (
            subKpiId !== undefined &&
            subKpiId !== null &&
            parentKpiId !==
              undefined &&
            parentKpiId !== null
          ) {
            const key =
              String(subKpiId);

            if (
              !subKpiMap.has(key)
            ) {
              subKpiMap.set(
                key,
                {
                  id: subKpiId,

                  kpi_id:
                    parentKpiId,

                  name:
                    subKpiName ??
                    `Sub KPI ${subKpiId}`,
                }
              );
            }
          }
        }
      );

      const normalizedKpis =
        Array.from(
          kpiMap.values()
        );

      const normalizedSubKpis =
        Array.from(
          subKpiMap.values()
        );

      console.log(
        "NORMALIZED KPIS:",
        normalizedKpis
      );

      console.log(
        "NORMALIZED SUB KPIS:",
        normalizedSubKpis
      );

      setKpis(
        normalizedKpis
      );

      setSubKpis(
        normalizedSubKpis
      );

      // =================================================
      // Current maintenance
      // =================================================

      const currentJson =
        await currentRes.json();

      console.log(
        "CURRENT API:",
        currentJson
      );

      if (!currentRes.ok) {
        throw new Error(
          currentJson?.error ||
            "Failed to load current maintenance"
        );
      }

      const currentRows =
        extractArray(
          currentJson,
          [
            "maintenance",
            "records",
            "items",
            "results",
          ]
        );

      const normalizedCurrent =
        currentRows.map(
          (
            item: any,
            index: number
          ): MaintenanceRecord => ({
            id:
              item.id ??
              item.maintenance_id ??
              item.record_id ??
              `temp-${item.vehicle_id}-${item.entry_at}-${index}`,

            vehicle_id:
              item.vehicle_id ??
              item.vehicleId,

            vehicle_name:
              item.vehicle_name ??
              item.model ??
              null,

            plate_number:
              item.plate_number ??
              item.plate ??
              null,

            // الجديد
            area:
              item.area ??
              null,

            capacity:
              item.capacity ??
              null,

            kpi_id:
              item.kpi_id ??
              item.kpiId,

            kpi_name:
              item.kpi_name ??
              item.kpiName ??
              null,

            sub_kpi_id:
              item.sub_kpi_id ??
              item.subKpiId ??
              null,

            sub_kpi_name:
              item.sub_kpi_name ??
              item.subKpiName ??
              null,

            description:
              item.description ??
              null,

            notes:
              item.notes ??
              null,

            entry_at:
              item.entry_at,

            exit_at:
              item.exit_at ??
              null,

            created_at:
              item.created_at ??
              null,
          })
        );

      setCurrentMaintenance(
        normalizedCurrent
      );
    } catch (error) {
      console.error(
        "LOAD DATA ERROR:",
        error
      );

      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "تعذر تحميل بيانات الصيانة",
      });
    } finally {
      if (initialLoad) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  // ===================================================
  // Initial load
  // ===================================================

  useEffect(() => {
    loadData(true);
  }, []);

  // ===================================================
  // Vehicle options
  // ===================================================

  const vehiclesInMaintenance =
    useMemo(() => {
      return new Set(
        currentMaintenance.map(
          (record) =>
            String(record.vehicle_id)
        )
      );
    }, [currentMaintenance]);

const vehicleOptions = useMemo(() => {
  const map = new Map<
    string,
    {
      value: string;
      label: string;
      disabled?: boolean;
      vehicleNumber: string;
      capacity: string;
      area: string;
      isInMaintenance: boolean;
    }
  >();

  vehicles.forEach((vehicle) => {
    if (
      vehicle.id === undefined ||
      vehicle.id === null
    ) {
      return;
    }

    const value = String(vehicle.id);

    const isInMaintenance =
      vehiclesInMaintenance.has(value);

    // رقم المركبة
    const vehicleNumber =
      vehicle.plate_number ||
      vehicle.vehicle_number ||
      vehicle.plate ||
      vehicle.name ||
      vehicle.model ||
      `مركبة ${value}`;

    // السعة
    const capacity =
      vehicle.capacity !== undefined &&
      vehicle.capacity !== null &&
      String(vehicle.capacity).trim() !== ""
        ? String(vehicle.capacity)
        : "غير محددة";

    // المنطقة
    const area =
      vehicle.area &&
      String(vehicle.area).trim() !== ""
        ? String(vehicle.area)
        : "غير محددة";

    if (!map.has(value)) {
      map.set(value, {
        value,

        // مهم للبحث
        label: `${vehicleNumber} ${capacity} ${area}`,

        disabled: isInMaintenance,

        vehicleNumber: String(vehicleNumber),
        capacity,
        area,
        isInMaintenance,
      });
    }
  });

  return Array.from(map.values());
}, [
  vehicles,
  vehiclesInMaintenance,
]);

  // ===================================================
  // KPI options
  // ===================================================

  const kpiOptions =
    useMemo(() => {
      const map =
        new Map<
          string,
          {
            value: string;
            label: string;
          }
        >();

      kpis.forEach(
        (kpi) => {
          if (
            kpi.id ===
              undefined ||
            kpi.id === null
          ) {
            return;
          }

          const value =
            String(kpi.id);

          const label =
            kpi.name ||
            kpi.title ||
            kpi.kpi_name ||
            `KPI ${value}`;

          if (!map.has(value)) {
            map.set(value, {
              value,
              label: String(label),
            });
          }
        }
      );

      return Array.from(
        map.values()
      );
    }, [kpis]);

  // ===================================================
  // Sub KPI options
  // ===================================================

  const subKpiOptions =
    useMemo(() => {
      if (!entryKpi) {
        return [];
      }

      const map =
        new Map<
          string,
          {
            value: string;
            label: string;
          }
        >();

      subKpis.forEach(
        (subKpi) => {
          if (
            subKpi.id ===
              undefined ||
            subKpi.id === null
          ) {
            return;
          }

          if (
            subKpi.kpi_id ===
              undefined ||
            subKpi.kpi_id === null
          ) {
            return;
          }

          if (
            String(
              subKpi.kpi_id
            ) !==
            String(entryKpi)
          ) {
            return;
          }

          const value =
            String(subKpi.id);

          const label =
            subKpi.name ||
            subKpi.title ||
            subKpi.sub_kpi_name ||
            `Sub KPI ${value}`;

          if (!map.has(value)) {
            map.set(value, {
              value,
              label: String(label),
            });
          }
        }
      );

      return Array.from(
        map.values()
      );
    }, [
      subKpis,
      entryKpi,
    ]);

  // ===================================================
  // Validation
  // ===================================================

  const entryFuture =
    isFutureDateTime(
      entryDate,
      entryTime,
      now
    );

  const exitFuture =
    isFutureDateTime(
      exitDate,
      exitTime,
      now
    );

  const entryDateTimeError =
    !entryDate || !entryTime
      ? "تاريخ ووقت الدخول مطلوبان"
      : entryFuture
        ? "لا يمكن إدخال تاريخ أو وقت مستقبلي"
        : null;

  const exitDateTimeError =
    !exitDate || !exitTime
      ? "تاريخ ووقت الخروج مطلوبان"
      : exitFuture
        ? "لا يمكن إدخال تاريخ أو وقت مستقبلي"
        : null;

  // ===================================================
  // Max date/time
  // ===================================================

  const maxDate =
    getCurrentDate(now);

  const maxTime =
    getCurrentTime(now);

  // ===================================================
  // Open entry modal
  // ===================================================

  const openEntryModal = () => {
    const current =
      new Date();

    setEntryVehicle(null);
    setEntryKpi(null);
    setEntrySubKpi(null);

    setEntryDate(
      getCurrentDate(current)
    );

    setEntryTime(
      getCurrentTime(current)
    );

    setEntryDescription("");
    setEntryNotes("");

    setMessage(null);

    setEntryModalOpened(
      true
    );
  };

  // ===================================================
  // Close entry modal
  // ===================================================

  const closeEntryModal = () => {
    if (savingEntry) {
      return;
    }

    setEntryModalOpened(
      false
    );
  };

  // ===================================================
  // KPI change
  // ===================================================

  const handleKpiChange = (
    value: string | null
  ) => {
    setEntryKpi(value);
    setEntrySubKpi(null);
  };

  // ===================================================
  // Submit entry
  // ===================================================

  const handleEntry = async () => {
    setMessage(null);

    if (!entryVehicle) {
      setMessage({
        type: "error",
        text: "يرجى اختيار المركبة",
      });

      return;
    }

    if (!entryKpi) {
      setMessage({
        type: "error",
        text: "يرجى اختيار مؤشر الصيانة",
      });

      return;
    }

    if (!entrySubKpi) {
      setMessage({
        type: "error",
        text:
          "يرجى اختيار المؤشر الفرعي",
      });

      return;
    }

    if (entryDateTimeError) {
      setMessage({
        type: "error",
        text: entryDateTimeError,
      });

      return;
    }

    // ===============================================
    // Final client-side future check
    // ===============================================

    if (
      isFutureDateTime(
        entryDate,
        entryTime,
        new Date()
      )
    ) {
      setMessage({
        type: "error",
        text:
          "لا يمكن إدخال صيانة بتاريخ أو وقت مستقبلي",
      });

      return;
    }

    // ===============================================
    // Convert local Jordan time -> UTC ISO
    // ===============================================

    const entryAt =
      localDateTimeToISOString(
        entryDate,
        entryTime
      );

    if (!entryAt) {
      setMessage({
        type: "error",
        text:
          "تاريخ ووقت الدخول غير صحيح",
      });

      return;
    }

    console.log(
      "LOCAL ENTRY:",
      `${entryDate}T${entryTime}:00`
    );

    console.log(
      "UTC ENTRY:",
      entryAt
    );

    try {
      setSavingEntry(true);

      const response =
        await fetch(
          "/api/maintenance",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              vehicle_id:
                Number(entryVehicle),

              kpi_id:
                Number(entryKpi),

              sub_kpi_id:
                Number(entrySubKpi),

              entry_at:
                entryAt,

              description:
                entryDescription.trim() ||
                null,

              notes:
                entryNotes.trim() ||
                null,

              created_by:
                username,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "تعذر تسجيل الصيانة"
        );
      }

      setMessage({
        type: "success",
        text:
          "تم إدخال المركبة إلى الصيانة بنجاح",
      });

      setEntryModalOpened(
        false
      );

      await loadData(false);

      setEntryVehicle(null);
      setEntryKpi(null);
      setEntrySubKpi(null);
      setEntryDescription("");
      setEntryNotes("");
    } catch (error) {
      console.error(
        "ENTRY ERROR:",
        error
      );

      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "تعذر تسجيل الصيانة",
      });
    } finally {
      setSavingEntry(false);
    }
  };

  // ===================================================
  // Open exit modal
  // ===================================================

  const openExitModal = (
    record: MaintenanceRecord
  ) => {
    const current =
      new Date();

    setSelectedExitRecord(
      record
    );

    setExitDate(
      getCurrentDate(current)
    );

    setExitTime(
      getCurrentTime(current)
    );

    setExitNotes(
      record.notes || ""
    );

    setMessage(null);

    setExitModalOpened(
      true
    );
  };

  // ===================================================
  // Close exit modal
  // ===================================================

  const closeExitModal = () => {
    if (savingExit) {
      return;
    }

    setExitModalOpened(
      false
    );

    setSelectedExitRecord(
      null
    );

    setExitNotes("");
  };

  // ===================================================
  // Submit exit
  // ===================================================

  const handleExit = async () => {
    if (!selectedExitRecord) {
      return;
    }

    setMessage(null);

    if (exitDateTimeError) {
      setMessage({
        type: "error",
        text: exitDateTimeError,
      });

      return;
    }

    // ===============================================
    // Future protection
    // ===============================================

    if (
      isFutureDateTime(
        exitDate,
        exitTime,
        new Date()
      )
    ) {
      setMessage({
        type: "error",
        text:
          "لا يمكن تسجيل خروج بتاريخ أو وقت مستقبلي",
      });

      return;
    }

    // ===============================================
    // Convert local exit time -> UTC ISO
    // ===============================================

    const exitAt =
      localDateTimeToISOString(
        exitDate,
        exitTime
      );

    if (!exitAt) {
      setMessage({
        type: "error",
        text:
          "تاريخ ووقت الخروج غير صحيح",
      });

      return;
    }

    console.log(
      "LOCAL EXIT:",
      `${exitDate}T${exitTime}:00`
    );

    console.log(
      "UTC EXIT:",
      exitAt
    );

    // ===============================================
    // Exit cannot be before entry
    // ===============================================

    const entryTimestamp =
      new Date(
        selectedExitRecord.entry_at
      ).getTime();

    // مهم:
    // نستخدم exitAt بعد تحويله إلى UTC
    // حتى تكون المقارنة بنفس المنطقة الزمنية
    const exitTimestamp =
      new Date(exitAt).getTime();

    if (
      !Number.isNaN(
        entryTimestamp
      ) &&
      !Number.isNaN(
        exitTimestamp
      ) &&
      exitTimestamp <
        entryTimestamp
    ) {
      setMessage({
        type: "error",
        text:
          "وقت الخروج لا يمكن أن يكون قبل وقت الدخول",
      });

      return;
    }

    try {
      setSavingExit(true);

      const response =
        await fetch(
          `/api/maintenance/${selectedExitRecord.id}/exit`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              exit_at:
                exitAt,

              notes:
                exitNotes.trim() ||
                null,

              updated_by:
                username,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "تعذر إنهاء الصيانة"
        );
      }

      setMessage({
        type: "success",
        text:
          "تم إخراج المركبة من الصيانة بنجاح",
      });

      setExitModalOpened(
        false
      );

      setSelectedExitRecord(
        null
      );

      await loadData(false);
    } catch (error) {
      console.error(
        "EXIT ERROR:",
        error
      );

      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "تعذر إنهاء الصيانة",
      });
    } finally {
      setSavingExit(false);
    }
  };

  // ===================================================
  // Loading screen
  // ===================================================
const renderVehicleOption: SelectProps["renderOption"] = ({
  option,
  checked,
}) => {
  const vehicle = vehicleOptions.find(
    (item) => item.value === option.value
  );

  if (!vehicle) {
    return option.label;
  }

  return (
    <Group
    dir={"rtl"}
      wrap="nowrap"
      gap="sm"
      w="100%"
      py={4}
    >
      {/* Vehicle Icon */}

      <Card
        withBorder
        radius="md"
        p={7}
        style={{
          flexShrink: 0,
          background: vehicle.isInMaintenance
            ? "var(--mantine-color-red-0)"
            : "var(--mantine-color-blue-0)",
        }}
      >
        <IconCar
          size={21}
          stroke={1.8}
        />
      </Card>

      {/* Main Information */}

      <Stack
        gap={3}
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Vehicle Number */}

        <Group
          justify="space-between"
          gap="xs"
          wrap="nowrap"
        >
          <Text
            fw={700}
            size="sm"
            truncate
          >
            {vehicle.vehicleNumber}
          </Text>

          {vehicle.isInMaintenance && (
            <Badge
              color="red"
              variant="light"
              size="xs"
              radius="sm"
            >
              قيد الصيانة
            </Badge>
          )}
        </Group>

        {/* Details */}

        <Group
          gap="md"
          wrap="wrap"
        >
          <Group gap={4}>
            <IconWeight
              size={14}
              stroke={1.7}
            />

            <Text
              size="xs"
              c="dimmed"
            >
              {vehicle.capacity}
            </Text>
          </Group>

          <Group gap={4}>
            <IconMapPin
              size={14}
              stroke={1.7}
            />

            <Text
              size="xs"
              c="dimmed"
              truncate
            >
              {vehicle.area}
            </Text>
          </Group>
        </Group>
      </Stack>

      {/* Selected indicator */}

      {checked && (
        <Badge
          color="blue"
          variant="light"
          size="xs"
        >
          محددة
        </Badge>
      )}
    </Group>
  );
};
  if (loading) {
    return (
      <Container
        dir="rtl"
        size="xl"
        py="xl"
      >
        <Stack
          align="center"
          justify="center"
          mih="60vh"
        >
          <IconTool
            size={42}
            stroke={1.5}
          />

          <Title order={3}>
            جاري تحميل بيانات الصيانة...
          </Title>

          <Text c="dimmed">
            يرجى الانتظار
          </Text>
        </Stack>
      </Container>
    );
  }

  // ===================================================
  // Render
  // ===================================================

  return (
    <Container
      dir="rtl"
      size="xl"
      py="xl"
    >
      <Stack gap="xl">

        {/* ============================================
            Header
        ============================================ */}

        <Group
          justify="space-between"
          align="center"
        >
          <Group gap="md">
            <IconTool
              size={34}
              stroke={1.7}
            />

            <div>
              <Title order={2}>
                صيانة المركبات
              </Title>

              <Text
                size="sm"
                c="dimmed"
              >
                إدارة ومتابعة المركبات
                الموجودة قيد الصيانة
              </Text>
            </div>
          </Group>

          <Group>
            {refreshing && (
              <Text
                size="sm"
                c="dimmed"
              >
                جاري تحديث البيانات...
              </Text>
            )}

            <Button
              leftSection={
                <IconLogin size={18} />
              }
              onClick={
                openEntryModal
              }
            >
              إدخال للصيانة
            </Button>
          </Group>
        </Group>

        {/* ============================================
            Message
        ============================================ */}

        {message && (
          <Alert
            color={
              message.type ===
              "success"
                ? "green"
                : "red"
            }
            icon={
              <IconAlertCircle
                size={20}
              />
            }
            withCloseButton
            onClose={() =>
              setMessage(null)
            }
          >
            {message.text}
          </Alert>
        )}

        {/* ============================================
            Stats
        ============================================ */}

        <SimpleGrid
          cols={{
            base: 1,
            sm: 2,
            md: 2,
          }}
        >
          <Card
            withBorder
            radius="lg"
            p="lg"
          >
            <Group>
              <IconCar
                size={28}
              />

              <div>
                <Text
                  size="sm"
                  c="dimmed"
                >
                  المركبات قيد الصيانة
                </Text>

                <Text
                  fw={700}
                  size="xl"
                >
                  {
                    currentMaintenance.length
                  }
                </Text>
              </div>
            </Group>
          </Card>

          <Card
            withBorder
            radius="lg"
            p="lg"
          >
            <Group>
              <IconClock
                size={28}
              />

              <div>
                <Text
                  size="sm"
                  c="dimmed"
                >
                  الوقت الحالي
                </Text>

                <Text
                  fw={700}
                  size="xl"
                >
                  {now.toLocaleTimeString(
                    "en-GB"
                  )}
                </Text>
              </div>
            </Group>
          </Card>
        </SimpleGrid>

        <Divider />

        {/* ============================================
            Current Maintenance
        ============================================ */}

        <Group
          justify="space-between"
        >
          <div>
            <Title order={3}>
              المركبات الموجودة حاليا
            </Title>

            <Text
              size="sm"
              c="dimmed"
            >
              المركبات التي لم يتم تسجيل
              خروجها من الصيانة بعد
            </Text>
          </div>

          <Badge
            size="lg"
            variant="light"
          >
            {
              currentMaintenance.length
            }{" "}
            مركبة
          </Badge>
        </Group>

        {currentMaintenance.length ===
        0 ? (
          <Card
            withBorder
            radius="lg"
            p="xl"
          >
            <Stack
              align="center"
              py="xl"
            >
              <IconCar
                size={48}
                stroke={1.3}
              />

              <Title order={4}>
                لا توجد مركبات حاليا
                في الصيانة
              </Title>

              <Text
                c="dimmed"
                ta="center"
              >
                جميع المركبات خارج
                الصيانة حاليا
              </Text>

              <Button
                leftSection={
                  <IconLogin
                    size={18}
                  />
                }
                onClick={
                  openEntryModal
                }
              >
                إدخال مركبة للصيانة
              </Button>
            </Stack>
          </Card>
        ) : (
          <SimpleGrid
            cols={{
              base: 1,
              md: 2,
              lg: 3,
            }}
          >
            {currentMaintenance.map(
              (
                record,
                index
              ) => {
                const vehicleNumber =
                  record.plate_number ||
                  record.vehicle_name ||
                  `مركبة ${record.vehicle_id}`;

                const vehicleDetails =
                  `${vehicleNumber} -  ${
                    record.capacity ??
                    "الوزن غير محدد"
                  } - ${
                    record.area ??
                    "المنطقة غير محددة"
                  }`;

                const recordKey =
                  `maintenance-${String(
                    record.id
                  )}-${String(
                    record.vehicle_id
                  )}-${String(
                    record.entry_at
                  )}-${index}`;

                return (
                  <Card
                    key={recordKey}
                    withBorder
                    radius="lg"
                    p="lg"
                  >
                    <Stack gap="md">

                      {/* Vehicle */}

                      <Group
                        justify="space-between"
                        align="flex-start"
                      >
                        <Group
                          gap="sm"
                        >
                          <IconCar
                            size={26}
                          />

                          <div>
                            <Text
                              fw={700}
                            >
                              {
                                vehicleDetails
                              }
                            </Text>

                           
                          </div>
                        </Group>

                        <Badge
                          color="orange"
                          variant="light"
                        >
                          قيد الصيانة
                        </Badge>
                      </Group>

                      <Divider />

                      {/* KPI */}

                      <div>
                        <Text
                          size="xs"
                          c="dimmed"
                        >
                          نوع الصيانة
                        </Text>

                        <Text
                          fw={600}
                        >
                          {
                            record.kpi_name ||
                            "-"
                          }
                        </Text>
                      </div>

                      {/* Sub KPI */}

                      <div>
                        <Text
                          size="xs"
                          c="dimmed"
                        >
                          نوع الصيانة الفرعي
                        </Text>

                        <Text
                          fw={600}
                        >
                          {
                            record.sub_kpi_name ||
                            "-"
                          }
                        </Text>
                      </div>

                      {/* Description */}

                      {record.description && (
                        <div>
                          <Text
                            size="xs"
                            c="dimmed"
                          >
                            الوصف
                          </Text>

                          <Text
                            size="sm"
                          >
                            {
                              record.description
                            }
                          </Text>
                        </div>
                      )}

                      {/* Entry */}

                      <Group
                        justify="space-between"
                      >
                        <div>
                          <Text
                            size="xs"
                            c="dimmed"
                          >
                            وقت الدخول
                          </Text>

                          <Text
                            size="sm"
                          >
                            {formatDateTime(
                              record.entry_at
                            )}
                          </Text>
                        </div>

                        <div
                          style={{
                            textAlign:
                              "right",
                          }}
                        >
                          <Text
                            size="xs"
                            c="dimmed"
                          >
                            مدة الصيانة
                          </Text>

                          <Text
                            fw={700}
                          >
                            {calculateDuration(
                              record.entry_at,
                              record.exit_at,
                              now
                            )}
                          </Text>
                        </div>
                      </Group>

                      {/* Created */}

                      {record.created_at && (
                        <Text
                          size="xs"
                          c="dimmed"
                        >
                          تم إنشاء السجل:{" "}
                          {formatDateTime(
                            record.created_at
                          )}
                        </Text>
                      )}

                      <Button
                        color="red"
                        variant="light"
                        leftSection={
                          <IconLogout
                            size={18}
                          />
                        }
                        onClick={() =>
                          openExitModal(
                            record
                          )
                        }
                      >
                        إخراج من الصيانة
                      </Button>
                    </Stack>
                  </Card>
                );
              }
            )}
          </SimpleGrid>
        )}

        {/* ============================================
            Entry Modal
        ============================================ */}

        <Modal
          dir="rtl"
          opened={
            entryModalOpened
          }
          onClose={
            closeEntryModal
          }
          title={
            <Group gap="sm">
              <IconLogin
                size={22}
              />

              <Text fw={700}>
                إدخال مركبة للصيانة
              </Text>
            </Group>
          }
          centered
          size="lg"
        >
          <Stack gap="md">

            {/* Vehicle */}

            <Select
  label="المركبة"
  description="اختر المركبة المراد إدخالها إلى الصيانة"
  placeholder="ابحث عن رقم المركبة أو المنطقة..."
  data={vehicleOptions}
  value={entryVehicle}
  onChange={setEntryVehicle}
  searchable
  clearable
  nothingFoundMessage="لا توجد مركبات مطابقة"
  renderOption={renderVehicleOption}
  maxDropdownHeight={420}
  checkIconPosition="right"
  radius="md"
  size="md"
  filter={({ options, search }) => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return options;
    }

    return options.filter((option :any) => {
      const vehicle =
        vehicleOptions.find(
          (item) =>
            item.value === option.value 
        );

      if (!vehicle) {
        return false;
      }

      return [
        vehicle.vehicleNumber,
        vehicle.capacity,
        vehicle.area,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }}
/>

            {/* KPI */}

            <Select
              label="مؤشر الصيانة"
              placeholder="اختر مؤشر الصيانة"
              data={
                kpiOptions
              }
              value={
                entryKpi
              }
              onChange={
                handleKpiChange
              }
              searchable
              clearable
              nothingFoundMessage="لا توجد مؤشرات صيانة"
            />

            {/* Sub KPI */}

            <Select
              label="المؤشر الفرعي"
              placeholder={
                entryKpi
                  ? "اختر المؤشر الفرعي"
                  : "اختر مؤشر الصيانة أولا"
              }
              data={
                subKpiOptions
              }
              value={
                entrySubKpi
              }
              onChange={
                setEntrySubKpi
              }
              searchable
              clearable
              disabled={
                !entryKpi
              }
              nothingFoundMessage="لا توجد مؤشرات فرعية"
            />

            {/* Entry Date / Time */}

            <SimpleGrid
              cols={2}
            >
              <div>
                <Text
                  size="sm"
                  fw={500}
                  mb={6}
                >
                  تاريخ الدخول
                </Text>

                <input
                  type="date"
                  value={
                    entryDate
                  }
                  max={
                    maxDate
                  }
                  onChange={(
                    event
                  ) =>
                    setEntryDate(
                      event
                        .currentTarget
                        .value
                    )
                  }
                  style={{
                    width:
                      "100%",
                    height:
                      36,
                    padding:
                      "0 10px",
                    border:
                      "1px solid #ced4da",
                    borderRadius:
                      6,
                    fontSize:
                      14,
                  }}
                />
              </div>

              <div>
                <Text
                  size="sm"
                  fw={500}
                  mb={6}
                >
                  وقت الدخول
                </Text>

                <input
                  type="time"
                  value={
                    entryTime
                  }
                  max={
                    entryDate ===
                    maxDate
                      ? maxTime
                      : undefined
                  }
                  onChange={(
                    event
                  ) =>
                    setEntryTime(
                      event
                        .currentTarget
                        .value
                    )
                  }
                  style={{
                    width:
                      "100%",
                    height:
                      36,
                    padding:
                      "0 10px",
                    border:
                      "1px solid #ced4da",
                    borderRadius:
                      6,
                    fontSize:
                      14,
                  }}
                />
              </div>
            </SimpleGrid>

            {/* Entry error */}

            {entryDateTimeError && (
              <Alert
                color="red"
                icon={
                  <IconAlertCircle
                    size={18}
                  />
                }
              >
                {
                  entryDateTimeError
                }
              </Alert>
            )}

            {/* Description */}

            <Textarea
              label="وصف الصيانة"
              placeholder="اكتب وصف المشكلة أو أعمال الصيانة"
              value={
                entryDescription
              }
              onChange={(
                event
              ) =>
                setEntryDescription(
                  event
                    .currentTarget
                    .value
                )
              }
              minRows={3}
              autosize
            />

            {/* Notes */}

            <Textarea
              label="ملاحظات"
              placeholder="أي ملاحظات إضافية"
              value={
                entryNotes
              }
              onChange={(
                event
              ) =>
                setEntryNotes(
                  event
                    .currentTarget
                    .value
                )
              }
              minRows={3}
              autosize
            />

            <Divider />

            <Group
              justify="flex-end"
            >
              <Button
                variant="default"
                onClick={
                  closeEntryModal
                }
                disabled={
                  savingEntry
                }
              >
                إلغاء
              </Button>

              <Button
                leftSection={
                  <IconLogin
                    size={18}
                  />
                }
                loading={
                  savingEntry
                }
                disabled={
                  !!entryDateTimeError
                }
                onClick={
                  handleEntry
                }
              >
                تسجيل الدخول للصيانة
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* ============================================
            Exit Modal
        ============================================ */}

        <Modal
          dir="rtl"
          opened={
            exitModalOpened
          }
          onClose={
            closeExitModal
          }
          title={
            <Group gap="sm">
              <IconLogout
                size={22}
              />

              <Text fw={700}>
                إخراج المركبة من الصيانة
              </Text>
            </Group>
          }
          centered
          size="lg"
        >
          <Stack gap="md">

            {selectedExitRecord && (
              <Card
                withBorder
                radius="md"
                p="md"
              >
                <Group>
                  <IconCar
                    size={26}
                  />

                  <div>
                    <Text fw={700}>
                      {selectedExitRecord.plate_number ||
                        selectedExitRecord.vehicle_name ||
                        `مركبة ${selectedExitRecord.vehicle_id}`}
                    </Text>

                    <Text
                      size="sm"
                      c="dimmed"
                    >
                      {
                        selectedExitRecord.kpi_name
                      }

                      {selectedExitRecord.sub_kpi_name
                        ? ` - ${selectedExitRecord.sub_kpi_name}`
                        : ""}
                    </Text>
                  </div>
                </Group>

                <Divider my="md" />

                <Group
                  justify="space-between"
                >
                  <div>
                    <Text
                      size="xs"
                      c="dimmed"
                    >
                      وقت الدخول
                    </Text>

                    <Text
                      size="sm"
                    >
                      {formatDateTime(
                        selectedExitRecord.entry_at
                      )}
                    </Text>
                  </div>

                  <div
                    style={{
                      textAlign:
                        "right",
                    }}
                  >
                    <Text
                      size="xs"
                      c="dimmed"
                    >
                      المدة الحالية
                    </Text>

                    <Text
                      fw={700}
                    >
                      {calculateDuration(
                        selectedExitRecord.entry_at,
                        null,
                        now
                      )}
                    </Text>
                  </div>
                </Group>
              </Card>
            )}

            {/* Exit Date / Time */}

            <SimpleGrid
              cols={2}
            >
              <div>
                <Text
                  size="sm"
                  fw={500}
                  mb={6}
                >
                  تاريخ الخروج
                </Text>

                <input
                  type="date"
                  value={
                    exitDate
                  }
                  max={
                    maxDate
                  }
                  onChange={(
                    event
                  ) =>
                    setExitDate(
                      event
                        .currentTarget
                        .value
                    )
                  }
                  style={{
                    width:
                      "100%",
                    height:
                      36,
                    padding:
                      "0 10px",
                    border:
                      "1px solid #ced4da",
                    borderRadius:
                      6,
                    fontSize:
                      14,
                  }}
                />
              </div>

              <div>
                <Text
                  size="sm"
                  fw={500}
                  mb={6}
                >
                  وقت الخروج
                </Text>

                <input
                  type="time"
                  value={
                    exitTime
                  }
                  max={
                    exitDate ===
                    maxDate
                      ? maxTime
                      : undefined
                  }
                  onChange={(
                    event
                  ) =>
                    setExitTime(
                      event
                        .currentTarget
                        .value
                    )
                  }
                  style={{
                    width:
                      "100%",
                    height:
                      36,
                    padding:
                      "0 10px",
                    border:
                      "1px solid #ced4da",
                    borderRadius:
                      6,
                    fontSize:
                      14,
                  }}
                />
              </div>
            </SimpleGrid>

            {/* Exit error */}

            {exitDateTimeError && (
              <Alert
                color="red"
                icon={
                  <IconAlertCircle
                    size={18}
                  />
                }
              >
                {
                  exitDateTimeError
                }
              </Alert>
            )}

            {/* Notes */}

            <Textarea
              label="ملاحظات الخروج"
              placeholder="اكتب ملاحظات عند إخراج المركبة"
              value={
                exitNotes
              }
              onChange={(
                event
              ) =>
                setExitNotes(
                  event
                    .currentTarget
                    .value
                )
              }
              minRows={4}
              autosize
            />

            <Divider />

            <Group
              justify="flex-end"
            >
              <Button
                variant="default"
                onClick={
                  closeExitModal
                }
                disabled={
                  savingExit
                }
              >
                إلغاء
              </Button>

              <Button
                color="red"
                leftSection={
                  <IconLogout
                    size={18}
                  />
                }
                loading={
                  savingExit
                }
                disabled={
                  !!exitDateTimeError ||
                  !selectedExitRecord
                }
                onClick={
                  handleExit
                }
              >
                تأكيد الخروج
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
}