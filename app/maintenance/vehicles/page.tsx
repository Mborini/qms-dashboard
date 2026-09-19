
"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  Loader,
  Modal,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";

import {
  IconActivity,
  IconCar,
  IconCheck,
  IconCircleCheck,
  IconCircleX,
  IconEdit,
  IconGauge,
  IconId,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconShieldCheck,
  IconSteeringWheel,
  IconTrash,
  IconTruck,
  IconUser,
  IconUsers,
  IconX,
} from "@tabler/icons-react";

/* =========================================================
   TYPES
========================================================= */

type Area = {
  id: number;
  name: string;
};

type Vehicle = {
  id: number;
  plate_number: string;
  weight: number | null;
  capacity: number | null;
  manufacture_year: number | null;
  model: string | null;
  type: string | null;

  area_id: number | null;
  area: string | null;

  is_active: boolean;

  driver_1: string | null;
  driver_2: string | null;
  driver_3: string | null;

  fuel_card_status: string | null;
  tracking_device_status: string | null;

  created_at?: string;
  updated_at?: string;
};

type VehicleForm = {
  plate_number: string;

  weight: number | string;
  capacity: number | string;
  manufacture_year: number | string;

  model: string;
  type: string;

  area_id: string;

  driver_1: string;
  driver_2: string;
  driver_3: string;

  fuel_card_status: string;
  tracking_device_status: string;

  is_active: boolean;
};

type ApiResult<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const EMPTY_FORM: VehicleForm = {
  plate_number: "",

  weight: "",
  capacity: "",
  manufacture_year: "",

  model: "",
  type: "",

  area_id: "",

  driver_1: "",
  driver_2: "",
  driver_3: "",

  fuel_card_status: "active",
tracking_device_status: "active",
  is_active: true,
};

const FUEL_CARD_OPTIONS = [
  { value: "active", label: "فعالة" },
  { value: "suspended", label: "موقوفة" },
  { value: "missing", label: "غير موجودة" },
  { value: "expired", label: "منتهية" },
];

const TRACKING_OPTIONS = [
  { value: "active", label: "فعال" },
  { value: "inactive", label: "متوقف" },
  { value: "missing", label: "غير موجود" },
  { value: "maintenance", label: "صيانة" },
];

/* =========================================================
   HELPERS
========================================================= */

function getFuelCardColor(status: string | null) {
  switch (status) {
    case "active":
      return "green";

    case "suspended":
      return "red";

    case "missing":
      return "orange";

    case "expired":
      return "yellow";

    default:
      return "gray";
  }
}

function getFuelCardLabel(status: string | null) {
  switch (status) {
    case "active":
      return "فعالة";

    case "suspended":
      return "موقوفة";

    case "missing":
      return "غير موجودة";

    case "expired":
      return "منتهية";

    default:
      return "غير محددة";
  }
}

function getTrackingColor(status: string | null) {
  switch (status) {
    case "active":
      return "green";

    case "inactive":
      return "red";

    case "missing":
      return "orange";

    case "maintenance":
      return "yellow";

    default:
      return "gray";
  }
}

function getTrackingLabel(status: string | null) {
  switch (status) {
    case "active":
      return "فعال";

    case "inactive":
      return "متوقف";

    case "missing":
      return "غير موجود";

    case "maintenance":
      return "صيانة";

    default:
      return "غير محدد";
  }
}



function formatNumber(
  value: number | null | undefined,
) {
  if (
    value === null ||
    value === undefined 
  ) {
    return "—";
  }

  return Number(value).toLocaleString("en-US");
}

/* =========================================================
   PAGE
========================================================= */

export default function VehiclesPage() {
  /* =======================================================
     DATA
  ======================================================= */

  const [vehicles, setVehicles] = useState<
    Vehicle[]
  >([]);

  const [areas, setAreas] = useState<Area[]>(
    [],
  );

  /* =======================================================
     LOADING
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  /* =======================================================
     FILTERS
  ======================================================= */

  const [search, setSearch] =
    useState("");

  const [areaFilter, setAreaFilter] =
    useState<string | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<string | null>("active");

  const [fuelFilter, setFuelFilter] =
    useState<string | null>(null);

  const [trackingFilter, setTrackingFilter] =
    useState<string | null>(null);

  /* =======================================================
     MODALS
  ======================================================= */

  const [modalOpened, setModalOpened] =
    useState(false);

  const [editingVehicle, setEditingVehicle] =
    useState<Vehicle | null>(null);

  const [
    deleteModalOpened,
    setDeleteModalOpened,
  ] = useState(false);

  const [vehicleToDelete, setVehicleToDelete] =
    useState<Vehicle | null>(null);

  /* =======================================================
     FORM
  ======================================================= */

  const [form, setForm] =
    useState<VehicleForm>({
      ...EMPTY_FORM,
    });

  const [error, setError] =
    useState("");

  /* =======================================================
     FETCH VEHICLES
     + BUILD AREAS FROM VEHICLES
  ======================================================= */

  async function loadVehicles() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/maintenance/vehicles",
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result: ApiResult<Vehicle[]> =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "تعذر تحميل الآليات",
        );
      }

      const vehicleData =
        result.data || [];

      setVehicles(vehicleData);

      /* =================================================
         BUILD UNIQUE AREAS
         
         نعتمد على:
         area_id
         area_name
      ================================================= */

      const areaMap = new Map<
        number,
        Area
      >();

      vehicleData.forEach((vehicle) => {
        if (
          vehicle.area_id === null ||
          vehicle.area_id === undefined
        ) {
          return;
        }

        const areaName =
          vehicle.area?.trim();

        areaMap.set(vehicle.area_id, {
          id: vehicle.area_id,
          name:
            areaName ||
            `منطقة ${vehicle.area_id}`,
        });
      });

      const uniqueAreas =
        Array.from(
          areaMap.values(),
        ).sort((a, b) =>
          a.name.localeCompare(
            b.name,
            "ar",
          ),
        );

      setAreas(uniqueAreas);

      console.log(
        "Vehicles:",
        vehicleData,
      );

      console.log(
        "Areas:",
        uniqueAreas,
      );
    } catch (err) {
      console.error(
        "Failed to load vehicles:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل الآليات",
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadVehicles();
  }, []);

  /* =======================================================
     AREA OPTIONS
  ======================================================= */

  const areaOptions = useMemo(
    () =>
      areas.map((area) => ({
        value: String(area.id),
        label: area.name,
      })),
    [areas],
  );

  /* =======================================================
     FILTERED VEHICLES
  ======================================================= */

  const filteredVehicles = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return vehicles.filter((vehicle) => {
      /* SEARCH */

      const matchesSearch =
        !query ||
        [
          vehicle.plate_number,
          vehicle.model,
          vehicle.type,
          vehicle.area,
          vehicle.driver_1,
          vehicle.driver_2,
          vehicle.driver_3,
          vehicle.fuel_card_status,
          vehicle.tracking_device_status,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        );

      /* AREA */

      const matchesArea =
        !areaFilter ||
        String(
          vehicle.area_id ?? "",
        ) === areaFilter;

      /* ACTIVE */

      const matchesStatus =
        !statusFilter ||
        statusFilter === "all" ||
        (statusFilter === "active" &&
          vehicle.is_active) ||
        (statusFilter === "inactive" &&
          !vehicle.is_active);

      /* FUEL */

      const matchesFuel =
        !fuelFilter ||
        vehicle.fuel_card_status ===
          fuelFilter;

      /* TRACKING */

      const matchesTracking =
        !trackingFilter ||
        vehicle.tracking_device_status ===
          trackingFilter;

      return (
        matchesSearch &&
        matchesArea &&
        matchesStatus &&
        matchesFuel &&
        matchesTracking
      );
    });
  }, [
    vehicles,
    search,
    areaFilter,
    statusFilter,
    fuelFilter,
    trackingFilter,
  ]);

  /* =======================================================
     RESET FILTERS
  ======================================================= */

  function resetFilters() {
    setSearch("");
    setAreaFilter(null);
    setStatusFilter("active");
    setFuelFilter(null);
    setTrackingFilter(null);
  }

  /* =======================================================
     OPEN ADD
  ======================================================= */

  function openAddModal() {
    setEditingVehicle(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
    setModalOpened(true);
  }

  /* =======================================================
     OPEN EDIT
  ======================================================= */

 function openEditModal(vehicle: Vehicle) {
  setEditingVehicle(vehicle);

  setForm({
    plate_number: vehicle.plate_number || "",
    weight: vehicle.weight ?? "",
    capacity: vehicle.capacity ?? "",
    manufacture_year: vehicle.manufacture_year ?? "",
    model: vehicle.model || "",
    type: vehicle.type || "",

    area_id:
      vehicle.area_id !== null &&
      vehicle.area_id !== undefined
        ? String(vehicle.area_id)
        : "",

    driver_1: vehicle.driver_1 || "",
    driver_2: vehicle.driver_2 || "",
    driver_3: vehicle.driver_3 || "",

    fuel_card_status:
      vehicle.fuel_card_status &&
      ["active", "suspended", "missing", "expired"].includes(
        vehicle.fuel_card_status,
      )
        ? vehicle.fuel_card_status
        : "active",

    tracking_device_status:
      vehicle.tracking_device_status &&
      ["active", "inactive", "missing", "maintenance"].includes(
        vehicle.tracking_device_status,
      )
        ? vehicle.tracking_device_status
        : "active",

    is_active: vehicle.is_active,
  });

  setError("");
  setModalOpened(true);
}
  /* =======================================================
     FORM UPDATE
  ======================================================= */

  function updateForm<
    K extends keyof VehicleForm,
  >(
    field: K,
    value: VehicleForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit() {
    try {
      setSaving(true);
      setError("");

      /* VALIDATION */

      if (
        !form.plate_number.trim()
      ) {
        setError(
          "يرجى إدخال رقم الآلية",
        );
        return;
      }

      if (!form.area_id) {
        setError(
          "يرجى اختيار المنطقة",
        );
        return;
      }

      /* PAYLOAD */

      const payload = {
        plate_number:
          form.plate_number.trim(),

        weight:
          form.weight === "" ||
          form.weight === null
            ? null
            : Number(form.weight),

        capacity:
          form.capacity === "" ||
          form.capacity === null
            ? null
            : Number(form.capacity),

        manufacture_year:
          form.manufacture_year === "" ||
          form.manufacture_year === null
            ? null
            : Number(
                form.manufacture_year,
              ),

        model:
          form.model.trim() || null,

        type:
          form.type.trim() || null,

        area_id: Number(
          form.area_id,
        ),

        driver_1:
          form.driver_1.trim() ||
          null,

        driver_2:
          form.driver_2.trim() ||
          null,

        driver_3:
          form.driver_3.trim() ||
          null,

       fuel_card_status: form.fuel_card_status || "active",
tracking_device_status: form.tracking_device_status || "active",

        is_active:
          form.is_active,
      };

      const url = editingVehicle
        ? `/api/maintenance/vehicles/${editingVehicle.id}`
        : "/api/maintenance/vehicles";

      const method = editingVehicle
        ? "PATCH"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload,
          ),
        },
      );

      const result: ApiResult<Vehicle> =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "تعذر حفظ بيانات الآلية",
        );
      }

      setModalOpened(false);
      setEditingVehicle(null);

      setForm({
        ...EMPTY_FORM,
      });

      await loadVehicles();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حفظ البيانات",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  function openDeleteModal(
    vehicle: Vehicle,
  ) {
    setVehicleToDelete(vehicle);
    setDeleteModalOpened(true);
  }

  async function handleDelete() {
    if (!vehicleToDelete) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/maintenance/vehicles/${vehicleToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      const result: ApiResult<Vehicle> =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "تعذر حذف الآلية",
        );
      }

      setDeleteModalOpened(false);
      setVehicleToDelete(null);

      await loadVehicles();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حذف الآلية",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     STATISTICS
  ======================================================= */

  const activeVehicles =
    vehicles.filter(
      (vehicle) =>
        vehicle.is_active,
    ).length;

  const vehiclesWithFuelCard =
    vehicles.filter(
      (vehicle) =>
        vehicle.fuel_card_status ===
        "active",
    ).length;

  const vehiclesWithTracking =
    vehicles.filter(
      (vehicle) =>
        vehicle.tracking_device_status ===
        "active",
    ).length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Box
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f4f8ff 0%, #eef4ff 45%, #f8fbff 100%)",
        padding:
          "20px 0 50px",
      }}
    >
      <Container size="xl">
        {/* HEADER */}

        <Card
          radius="xl"
          p="lg"
          mb="lg"
          style={{
            background:
              "linear-gradient(135deg, #0f4c81 0%, #1769aa 55%, #2687d8 100%)",
            border: "none",
            boxShadow:
              "0 18px 45px rgba(15, 76, 129, 0.18)",
          }}
        >
          <Group
            justify="space-between"
            align="center"
            wrap="wrap"
            gap="md"
          >
            <Group gap="md">
              <Box
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  background:
                    "rgba(255,255,255,0.15)",
                  border:
                    "1px solid rgba(255,255,255,0.20)",
                }}
              >
                <IconTruck
                  size={29}
                  color="white"
                />
              </Box>

              <Box>
                <Title
                  order={2}
                  c="white"
                  fw={800}
                >
                  إدارة الآليات
                </Title>

                <Text
                  c="rgba(255,255,255,0.78)"
                  size="sm"
                  mt={3}
                >
                  إدارة الآليات والسائقين
                  وبطاقات الوقود وأجهزة التتبع
                </Text>
              </Box>
            </Group>

            <Group gap="sm">
              <Tooltip label="تحديث البيانات">
                <ActionIcon
                  variant="light"
                  color="white"
                  size="lg"
                  radius="md"
                  onClick={
                    loadVehicles
                  }
                  disabled={loading}
                >
                  <IconRefresh
                    size={19}
                  />
                </ActionIcon>
              </Tooltip>

              <Button
                leftSection={
                  <IconPlus
                    size={18}
                  />
                }
                onClick={
                  openAddModal
                }
                radius="md"
                color="white"
                variant="white"
                c="#1769aa"
                fw={700}
              >
                إضافة آلية
              </Button>
            </Group>
          </Group>
        </Card>

        {/* ERROR */}

        {error && (
          <Paper
            mb="lg"
            p="md"
            radius="lg"
            withBorder
            style={{
              borderColor:
                "#ffc9c9",
              background:
                "#fff5f5",
            }}
          >
            <Group
              justify="space-between"
            >
              <Group gap="sm">
                <IconCircleX
                  size={22}
                  color="#e03131"
                />

                <Text
                  c="red.7"
                  fw={600}
                  size="sm"
                >
                  {error}
                </Text>
              </Group>

              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() =>
                  setError("")
                }
              >
                <IconX
                  size={18}
                />
              </ActionIcon>
            </Group>
          </Paper>
        )}

        {/* STATS */}

        <SimpleGrid
          cols={{
            base: 2,
            sm: 2,
            md: 4,
          }}
          spacing="md"
          mb="lg"
        >
          <StatCard
            label="إجمالي الآليات"
            value={vehicles.length}
            icon={
              <IconTruck
                size={22}
              />
            }
            iconBackground="#e8f3ff"
            iconColor="#1971c2"
          />

          <StatCard
            label="آليات فعالة"
            value={activeVehicles}
            icon={
              <IconCircleCheck
                size={22}
              />
            }
            iconBackground="#e9f9ef"
            iconColor="#2f9e44"
          />

          <StatCard
            label="بطاقات وقود فعالة"
            value={
              vehiclesWithFuelCard
            }
            icon={
              <IconGauge
                size={22}
              />
            }
            iconBackground="#fff4e6"
            iconColor="#f08c00"
          />

          <StatCard
            label="أجهزة تتبع فعالة"
            value={
              vehiclesWithTracking
            }
            icon={
              <IconActivity
                size={22}
              />
            }
            iconBackground="#e7f5ff"
            iconColor="#1971c2"
          />
        </SimpleGrid>

        {/* FILTERS */}

        <Card
          radius="xl"
          p="md"
          mb="lg"
          style={{
            background:
              "rgba(255,255,255,0.92)",
            border:
              "1px solid #e4ecf7",
            boxShadow:
              "0 8px 28px rgba(20, 70, 120, 0.06)",
          }}
        >
          <Group
            justify="space-between"
            mb="md"
          >
            <Group gap="sm">
              <Box
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  background:
                    "#eaf3ff",
                }}
              >
                <IconSearch
                  size={18}
                  color="#1769aa"
                />
              </Box>

              <Box>
                <Text fw={800}>
                  الفلاتر والبحث
                </Text>

                <Text
                  size="xs"
                  c="dimmed"
                >
                  استخدم الفلاتر للوصول إلى الآليات المطلوبة
                </Text>
              </Box>
            </Group>

            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={
                resetFilters
              }
            >
              إعادة ضبط الفلاتر
            </Button>
          </Group>

          <Grid>
            <Grid.Col
              span={{
                base: 12,
                sm: 6,
                md: 4,
              }}
            >
              <TextInput
                label="بحث"
                placeholder="رقم الآلية، السائق، النوع، الموديل..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                leftSection={
                  <IconSearch
                    size={17}
                  />
                }
                radius="md"
              />
            </Grid.Col>

            <Grid.Col
              span={{
                base: 12,
                sm: 6,
                md: 2,
              }}
            >
              <Select
                label="المنطقة"
                placeholder="كل المناطق"
                value={areaFilter}
                onChange={
                  setAreaFilter
                }
                data={
                  areaOptions
                }
                searchable
                clearable
                radius="md"
                nothingFoundMessage="لا توجد مناطق"
              />
            </Grid.Col>

            <Grid.Col
              span={{
                base: 12,
                sm: 6,
                md: 2,
              }}
            >
              <Select
                label="حالة الآلية"
                placeholder="كل الحالات"
                value={
                  statusFilter
                }
                onChange={
                  setStatusFilter
                }
                data={[
                  {
                    value:
                      "active",
                    label:
                      "فعالة فقط",
                  },
                  {
                    value:
                      "inactive",
                    label:
                      "غير فعالة",
                  },
                  {
                    value:
                      "all",
                    label:
                      "جميع الآليات",
                  },
                ]}
                radius="md"
              />
            </Grid.Col>

            <Grid.Col
              span={{
                base: 12,
                sm: 6,
                md: 2,
              }}
            >
              <Select
                label="بطاقة الوقود"
                placeholder="كل الحالات"
                value={fuelFilter}
                onChange={
                  setFuelFilter
                }
                data={
                  FUEL_CARD_OPTIONS
                }
                clearable
                radius="md"
              />
            </Grid.Col>

            <Grid.Col
              span={{
                base: 12,
                sm: 6,
                md: 2,
              }}
            >
              <Select
                label="جهاز التتبع"
                placeholder="كل الحالات"
                value={
                  trackingFilter
                }
                onChange={
                  setTrackingFilter
                }
                data={
                  TRACKING_OPTIONS
                }
                clearable
                radius="md"
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" />

          <Group
            justify="space-between"
          >
            <Group gap="xs">
              <Text
                size="sm"
                c="dimmed"
              >
                النتائج:
              </Text>

              <Badge
                size="lg"
                radius="md"
                variant="light"
                color="blue"
              >
                {
                  filteredVehicles.length
                }
              </Badge>
            </Group>

            <Text
              size="xs"
              c="dimmed"
            >
              من أصل{" "}
              {vehicles.length} آلية
            </Text>
          </Group>
        </Card>

        {/* DESKTOP */}

        <Card
          radius="xl"
          p={0}
          visibleFrom="md"
          style={{
            background:
              "rgba(255,255,255,0.94)",
            border:
              "1px solid #e3ebf6",
            boxShadow:
              "0 10px 35px rgba(20, 70, 120, 0.07)",
            overflow: "hidden",
          }}
        >
          <Box
            px="lg"
            py="md"
            style={{
              borderBottom:
                "1px solid #edf1f7",
              background:
                "linear-gradient(90deg, #f8fbff, #ffffff)",
            }}
          >
            <Group
              justify="space-between"
            >
              <Group gap="sm">
                <IconCar
                  size={21}
                  color="#1769aa"
                />

                <Text fw={800}>
                  قائمة الآليات
                </Text>
              </Group>

              <Badge
                variant="light"
                color="blue"
              >
                {
                  filteredVehicles.length
                } آلية
              </Badge>
            </Group>
          </Box>

          {loading ? (
            <LoadingState />
          ) : filteredVehicles.length ===
            0 ? (
            <EmptyState />
          ) : (
            <Box
              style={{
                overflow: "hidden",
              }}
            >
              <Table
                striped
                highlightOnHover
                verticalSpacing="xs"
                horizontalSpacing="xs"
                withTableBorder={false}
                style={{
                  tableLayout:
                    "fixed",
                  width: "100%",
                  fontSize: 12,
                }}
              >
                <Table.Thead>
                  <Table.Tr
                    style={{
                      background:
                        "#f7faff",
                    }}
                  >
                    <Table.Th
                      style={{
                        width: "11%",
                      }}
                    >
                      الآلية
                    </Table.Th>

                    <Table.Th
                      style={{
                        width: "9%",
                      }}
                    >
                      المنطقة
                    </Table.Th>

                    <Table.Th
                      style={{
                        width: "8%",
                      }}
                    >
                      النوع
                    </Table.Th>

                    <Table.Th
                      style={{
                        width: "18%",
                      }}
                    >
                      السائقون
                    </Table.Th>

                    <Table.Th
                      style={{
                        width: "7%",
                      }}
                    >
                      الوزن
                    </Table.Th>

                    <Table.Th
                      style={{
                        width: "7%",
                      }}
                    >
                      الحمولة
                    </Table.Th>

                    <Table.Th
                      style={{
                        width: "7%",
                      }}
                    >
                      السنة
                    </Table.Th>

                    <Table.Th
                      style={{
                        width: "10%",
                      }}
                    >
                      بطاقة الوقود
                    </Table.Th>

                    <Table.Th
                      style={{
                        width: "10%",
                      }}
                    >
                      جهاز التتبع
                    </Table.Th>

                    <Table.Th
                      style={{
                        width: "6%",
                      }}
                    >
                      الحالة
                    </Table.Th>

                    <Table.Th
                      style={{
                        width: "7%",
                        textAlign:
                          "center",
                      }}
                    >
                      إجراء
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {filteredVehicles.map(
                    (vehicle) => (
                      <Table.Tr
                        key={
                          vehicle.id
                        }
                      >
                        <Table.Td>
                          <Box
                            style={{
                              minWidth: 0,
                            }}
                          >
                            <Text
                              fw={800}
                              size="xs"
                              truncate
                            >
                              {
                                vehicle.plate_number
                              }
                            </Text>

                            <Text
                              size="10px"
                              c="dimmed"
                              truncate
                            >
                              {
                                vehicle.model ||
                                "—"
                              }
                            </Text>
                          </Box>
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            variant="light"
                            color="blue"
                            radius="sm"
                            size="sm"
                          >
                            <Text
                              size="10px"
                              truncate
                            >
                              {vehicle.area ||
                                "غير محددة"}
                            </Text>
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <Text
                            size="xs"
                            truncate
                          >
                            {vehicle.type ||
                              "—"}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Stack
                            gap={2}
                          >
                            {vehicle.driver_1 && (
                              <DriverLine
                                name={
                                  vehicle.driver_1
                                }
                              />
                            )}

                            {vehicle.driver_2 && (
                              <DriverLine
                                name={
                                  vehicle.driver_2
                                }
                              />
                            )}

                            {vehicle.driver_3 && (
                              <DriverLine
                                name={
                                  vehicle.driver_3
                                }
                              />
                            )}

                            {!vehicle.driver_1 &&
                              !vehicle.driver_2 &&
                              !vehicle.driver_3 && (
                                <Text
                                  size="10px"
                                  c="dimmed"
                                >
                                  لا يوجد
                                </Text>
                              )}
                          </Stack>
                        </Table.Td>

                        <Table.Td>
                          <Text size="xs">
                            {formatNumber(
                              vehicle.weight,
                            )}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Text size="xs">
                            {formatNumber(
                              vehicle.capacity,
                            )}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Text size="xs">
                            {
                              vehicle.manufacture_year ||
                              "—"
                            }
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            variant="light"
                            color={getFuelCardColor(
                              vehicle.fuel_card_status,
                            )}
                            radius="sm"
                            size="sm"
                          >
                            {
                              vehicle.fuel_card_status ||
                              "غير محددة"
                            }
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            variant="light"
                            color={getTrackingColor(
                              vehicle.tracking_device_status,
                            )}
                            radius="sm"
                            size="sm"
                          >
                            {
                              vehicle.tracking_device_status ||
                              "غير محدد"
                            }
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            color={
                              vehicle.is_active
                                ? "green"
                                : "gray"
                            }
                            variant="light"
                            radius="sm"
                            size="sm"
                          >
                            {vehicle.is_active
                              ? "فعالة"
                              : "غير فعالة"}
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <Group
                            justify="center"
                            gap={3}
                            wrap="nowrap"
                          >
                            <Tooltip label="تعديل">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                radius="md"
                                onClick={() =>
                                  openEditModal(
                                    vehicle,
                                  )
                                }
                              >
                                <IconEdit
                                  size={15}
                                />
                              </ActionIcon>
                            </Tooltip>

                            <Tooltip label="حذف">
                              <ActionIcon
                                variant="light"
                                color="red"
                                size="sm"
                                radius="md"
                                onClick={() =>
                                  openDeleteModal(
                                    vehicle,
                                  )
                                }
                              >
                                <IconTrash
                                  size={15}
                                />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ),
                  )}
                </Table.Tbody>
              </Table>
            </Box>
          )}
        </Card>

        {/* MOBILE */}

        <Stack
          hiddenFrom="md"
          gap="sm"
        >
          {loading ? (
            <Card
              radius="xl"
              p="xl"
            >
              <LoadingState />
            </Card>
          ) : filteredVehicles.length ===
            0 ? (
            <Card
              radius="xl"
              p="xl"
            >
              <EmptyState />
            </Card>
          ) : (
            filteredVehicles.map(
              (vehicle) => (
                <MobileVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onEdit={() =>
                    openEditModal(
                      vehicle,
                    )
                  }
                  onDelete={() =>
                    openDeleteModal(
                      vehicle,
                    )
                  }
                />
              ),
            )
          )}
        </Stack>
      </Container>

      {/* ===================================================
          ADD / EDIT MODAL
      =================================================== */}

      <Modal
        opened={modalOpened}
        onClose={() => {
          if (!saving) {
            setModalOpened(false);
          }
        }}
        title={
          <Group gap="sm">
            <Box
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                background:
                  "linear-gradient(135deg, #e8f3ff, #dcecff)",
              }}
            >
              {editingVehicle ? (
                <IconEdit
                  size={20}
                  color="#1769aa"
                />
              ) : (
                <IconPlus
                  size={20}
                  color="#1769aa"
                />
              )}
            </Box>

            <Box>
              <Text fw={800}>
                {editingVehicle
                  ? "تعديل بيانات الآلية"
                  : "إضافة آلية جديدة"}
              </Text>

              <Text
                size="xs"
                c="dimmed"
              >
                بيانات الآلية والسائقين والتجهيزات
              </Text>
            </Box>
          </Group>
        }
        centered
        size="xl"
        radius="xl"
        closeOnClickOutside={!saving}
        closeOnEscape={!saving}
      >
        <Stack gap="lg">
          {/* BASIC */}

          <Box>
            <Group
              gap="xs"
              mb="sm"
            >
              <IconTruck
                size={18}
                color="#1769aa"
              />

              <Text
                fw={800}
                size="sm"
              >
                بيانات الآلية
              </Text>
            </Group>

            <Divider mb="md" />

            <Grid>
              <Grid.Col
                span={{
                  base: 12,
                  sm: 6,
                  md: 4,
                }}
              >
                <TextInput
                  label="رقم الآلية"
                  placeholder="مثال: 60-60746"
                  value={
                    form.plate_number
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "plate_number",
                      event.target
                        .value,
                    )
                  }
                  required
                  radius="md"
                  leftSection={
                    <IconId
                      size={17}
                    />
                  }
                />
              </Grid.Col>

              <Grid.Col
                span={{
                  base: 12,
                  sm: 6,
                  md: 4,
                }}
              >
                <Select
                  label="المنطقة"
                  placeholder="اختر المنطقة"
                  value={
                    form.area_id ||
                    null
                  }
                  onChange={(
                    value,
                  ) =>
                    updateForm(
                      "area_id",
                      value || "",
                    )
                  }
                  data={
                    areaOptions
                  }
                  searchable
                  clearable
                  required
                  radius="md"
                  nothingFoundMessage="لا توجد مناطق"
                />
              </Grid.Col>

              <Grid.Col
                span={{
                  base: 12,
                  sm: 6,
                  md: 4,
                }}
              >
                <TextInput
                  label="نوع الآلية"
                  placeholder="مثال: Compactor"
                  value={form.type}
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "type",
                      event.target
                        .value,
                    )
                  }
                  radius="md"
                />
              </Grid.Col>

              <Grid.Col
                span={{
                  base: 12,
                  sm: 6,
                  md: 4,
                }}
              >
                <TextInput
                  label="الموديل"
                  placeholder="مثال: MAN"
                  value={
                    form.model
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "model",
                      event.target
                        .value,
                    )
                  }
                  radius="md"
                />
              </Grid.Col>

              <Grid.Col
                span={{
                  base: 12,
                  sm: 6,
                  md: 4,
                }}
              >
                <NumberInput
                  label="سنة الصنع"
                  placeholder="مثال: 2015"
                  value={
                    form.manufacture_year
                  }
                  onChange={(
                    value,
                  ) =>
                    updateForm(
                      "manufacture_year",
                      value,
                    )
                  }
                  min={1900}
                  max={2100}
                  hideControls
                  radius="md"
                />
              </Grid.Col>

              <Grid.Col
                span={{
                  base: 12,
                  sm: 6,
                  md: 4,
                }}
              >
                <NumberInput
                  label="الوزن"
                  placeholder="الوزن"
                  value={
                    form.weight
                  }
                  onChange={(
                    value,
                  ) =>
                    updateForm(
                      "weight",
                      value,
                    )
                  }
                  min={0}
                  hideControls
                  radius="md"
                />
              </Grid.Col>

              <Grid.Col
                span={{
                  base: 12,
                  sm: 6,
                  md: 4,
                }}
              >
                <NumberInput
                  label="الحمولة"
                  placeholder="الحمولة"
                  value={
                    form.capacity
                  }
                  onChange={(
                    value,
                  ) =>
                    updateForm(
                      "capacity",
                      value,
                    )
                  }
                  min={0}
                  hideControls
                  radius="md"
                />
              </Grid.Col>
            </Grid>
          </Box>

          {/* DRIVERS */}

          <Box>
            <Group
              gap="xs"
              mb="sm"
            >
              <IconUsers
                size={18}
                color="#1769aa"
              />

              <Text
                fw={800}
                size="sm"
              >
                السائقون
              </Text>
            </Group>

            <Divider mb="md" />

            <Grid>
              {[
                [
                  "driver_1",
                  "السائق الأول",
                ],
                [
                  "driver_2",
                  "السائق الثاني",
                ],
                [
                  "driver_3",
                  "السائق الثالث",
                ],
              ].map(
                ([field, label]) => (
                  <Grid.Col
                    key={field}
                    span={{
                      base: 12,
                      md: 4,
                    }}
                  >
                    <TextInput
                      label={label}
                      placeholder={
                        "اسم " +
                        label
                      }
                      value={
                        form[
                          field as keyof VehicleForm
                        ] as string
                      }
                      onChange={(
                        event,
                      ) =>
                        updateForm(
                          field as keyof VehicleForm,
                          event.target
                            .value as never,
                        )
                      }
                      leftSection={
                        <IconSteeringWheel
                          size={17}
                        />
                      }
                      radius="md"
                    />
                  </Grid.Col>
                ),
              )}
            </Grid>
          </Box>

          {/* FUEL / TRACKING */}

          <Box>
            <Group
              gap="xs"
              mb="sm"
            >
              <IconShieldCheck
                size={18}
                color="#1769aa"
              />

              <Text
                fw={800}
                size="sm"
              >
                البطاقات والأجهزة
              </Text>
            </Group>

            <Divider mb="md" />

            <Grid>
              <Grid.Col
                span={{
                  base: 12,
                  md: 6,
                }}
              >
                <Select
                  label="حالة بطاقة الوقود"
                  placeholder="اختر الحالة"
                  value={
                    form.fuel_card_status
                  }
                  onChange={(
                    value,
                  ) =>
                    updateForm(
                      "fuel_card_status",
                      value ||
                        "غير محددة",
                    )
                  }
                  data={
                    FUEL_CARD_OPTIONS
                  }
                  allowDeselect={
                    false
                  }
                  radius="md"
                  leftSection={
                    <IconGauge
                      size={17}
                    />
                  }
                />
              </Grid.Col>

              <Grid.Col
                span={{
                  base: 12,
                  md: 6,
                }}
              >
                <Select
                  label="حالة جهاز التتبع"
                  placeholder="اختر الحالة"
                  value={
                    form.tracking_device_status
                  }
                  onChange={(
                    value,
                  ) =>
                    updateForm(
                      "tracking_device_status",
                      value ||
                        "غير محدد",
                    )
                  }
                  data={
                    TRACKING_OPTIONS
                  }
                  allowDeselect={
                    false
                  }
                  radius="md"
                  leftSection={
                    <IconActivity
                      size={17}
                    />
                  }
                />
              </Grid.Col>
            </Grid>
          </Box>

          {/* ACTIVE */}

          <Box
            p="md"
            style={{
              borderRadius: 14,
              background:
                "#f7faff",
              border:
                "1px solid #e5edf7",
            }}
          >
            <Group
              justify="space-between"
            >
              <Group gap="sm">
                {form.is_active ? (
                  <IconCircleCheck
                    size={21}
                    color="#2f9e44"
                  />
                ) : (
                  <IconCircleX
                    size={21}
                    color="#868e96"
                  />
                )}

                <Box>
                  <Text
                    fw={700}
                    size="sm"
                  >
                    حالة الآلية
                  </Text>

                  <Text
                    size="xs"
                    c="dimmed"
                  >
                    تحديد ما إذا كانت الآلية فعالة
                  </Text>
                </Box>
              </Group>

              <Button
                variant="light"
                color={
                  form.is_active
                    ? "green"
                    : "gray"
                }
                radius="md"
                onClick={() =>
                  updateForm(
                    "is_active",
                    !form.is_active,
                  )
                }
              >
                {form.is_active
                  ? "فعالة"
                  : "غير فعالة"}
              </Button>
            </Group>
          </Box>

          {/* MODAL ERROR */}

          {error && (
            <Paper
              p="sm"
              radius="md"
              style={{
                background:
                  "#fff5f5",
                border:
                  "1px solid #ffc9c9",
              }}
            >
              <Group gap="xs">
                <IconCircleX
                  size={18}
                  color="#e03131"
                />

                <Text
                  size="sm"
                  c="red.7"
                >
                  {error}
                </Text>
              </Group>
            </Paper>
          )}

          {/* ACTIONS */}

          <Group>
            <Button
              onClick={
                handleSubmit
              }
              loading={saving}
              leftSection={
                !saving ? (
                  editingVehicle ? (
                    <IconCheck
                      size={18}
                    />
                  ) : (
                    <IconPlus
                      size={18}
                    />
                  )
                ) : undefined
              }
              radius="md"
              size="md"
              color="blue"
            >
              {editingVehicle
                ? "حفظ التعديلات"
                : "إضافة الآلية"}
            </Button>

            <Button
              variant="light"
              color="gray"
              radius="md"
              size="md"
              disabled={saving}
              onClick={() =>
                setModalOpened(
                  false,
                )
              }
            >
              إلغاء
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* DELETE MODAL */}

      <Modal
        opened={
          deleteModalOpened
        }
        onClose={() => {
          if (!saving) {
            setDeleteModalOpened(
              false,
            );
          }
        }}
        centered
        size="sm"
        radius="xl"
        title={
          <Group gap="sm">
            <Box
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                background:
                  "#fff1f1",
              }}
            >
              <IconTrash
                size={20}
                color="#e03131"
              />
            </Box>

            <Text fw={800}>
              حذف الآلية
            </Text>
          </Group>
        }
      >
        <Stack gap="md">
          <Text size="sm">
            هل أنت متأكد من حذف الآلية
            <Text
              component="span"
              fw={800}
              mx={5}
            >
              {
                vehicleToDelete?.plate_number
              }
            </Text>
            ؟
          </Text>

          <Text
            size="xs"
            c="dimmed"
          >
            سيتم حذف بيانات الآلية من قائمة الآليات.
          </Text>

          <Group>
            <Button
              color="red"
              radius="md"
              loading={saving}
              leftSection={
                !saving ? (
                  <IconTrash
                    size={17}
                  />
                ) : undefined
              }
              onClick={
                handleDelete
              }
            >
              حذف الآلية
            </Button>

            <Button
              variant="light"
              color="gray"
              radius="md"
              disabled={saving}
              onClick={() =>
                setDeleteModalOpened(
                  false,
                )
              }
            >
              إلغاء
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  icon,
  iconBackground,
  iconColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBackground: string;
  iconColor: string;
}) {
  return (
    <Card
      radius="lg"
      p="md"
      style={{
        background:
          "rgba(255,255,255,0.88)",
        border:
          "1px solid #e7eef8",
        boxShadow:
          "0 8px 25px rgba(20, 70, 120, 0.06)",
      }}
    >
      <Group
        justify="space-between"
      >
        <Box>
          <Text
            size="xs"
            c="dimmed"
            fw={600}
          >
            {label}
          </Text>

          <Text
            size="xl"
            fw={800}
            c="#145b96"
            mt={4}
          >
            {value}
          </Text>
        </Box>

        <Box
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            background:
              iconBackground,
            color: iconColor,
          }}
        >
          {icon}
        </Box>
      </Group>
    </Card>
  );
}

/* =========================================================
   DRIVER LINE
========================================================= */

function DriverLine({
  name,
}: {
  name: string;
}) {
  return (
    <Group
      gap={4}
      wrap="nowrap"
      style={{
        minWidth: 0,
      }}
    >
      <IconUser
        size={12}
        color="#1971c2"
        style={{
          flexShrink: 0,
        }}
      />

      <Text
        size="10px"
        fw={600}
        truncate
      >
        {name}
      </Text>
    </Group>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <Box
      py={70}
      style={{
        display: "flex",
        justifyContent:
          "center",
      }}
    >
      <Stack
        align="center"
        gap="sm"
      >
        <Loader
          size="md"
          color="blue"
        />

        <Text
          size="sm"
          c="dimmed"
        >
          جاري تحميل الآليات...
        </Text>
      </Stack>
    </Box>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState() {
  return (
    <Box
      py={60}
      style={{
        display: "flex",
        justifyContent:
          "center",
      }}
    >
      <Stack
        align="center"
        gap="sm"
      >
        <Box
          style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            background:
              "#eef5ff",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
          }}
        >
          <IconTruck
            size={30}
            color="#6c8ebf"
          />
        </Box>

        <Text fw={700}>
          لا توجد آليات
        </Text>

        <Text
          size="sm"
          c="dimmed"
        >
          لم يتم العثور على نتائج مطابقة للفلاتر
        </Text>
      </Stack>
    </Box>
  );
}

/* =========================================================
   MOBILE VEHICLE CARD
========================================================= */

function MobileVehicleCard({
  vehicle,
  onEdit,
  onDelete,
}: {
  vehicle: Vehicle;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      radius="xl"
      p="md"
      style={{
        background:
          "rgba(255,255,255,0.95)",
        border:
          "1px solid #e3ebf6",
        boxShadow:
          "0 8px 25px rgba(20, 70, 120, 0.06)",
      }}
    >
      <Group
        justify="space-between"
        align="flex-start"
        wrap="nowrap"
      >
        <Group
          gap="sm"
          wrap="nowrap"
        >
          <Box
            style={{
              width: 44,
              height: 44,
              minWidth: 44,
              borderRadius: 13,
              background:
                "linear-gradient(135deg, #e8f3ff, #dcecff)",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
            }}
          >
            <IconTruck
              size={21}
              color="#1769aa"
            />
          </Box>

          <Box
            style={{
              minWidth: 0,
            }}
          >
            <Text
              fw={800}
              size="sm"
              truncate
            >
              {
                vehicle.plate_number
              }
            </Text>

            <Text
              size="xs"
              c="dimmed"
              truncate
            >
              {vehicle.type ||
                "نوع غير محدد"}
              {" • "}
              {vehicle.model ||
                "موديل غير محدد"}
            </Text>
          </Box>
        </Group>

        <Badge
          color={
            vehicle.is_active
              ? "green"
              : "gray"
          }
          variant="light"
          radius="sm"
        >
          {vehicle.is_active
            ? "فعالة"
            : "غير فعالة"}
        </Badge>
      </Group>

      <Divider my="md" />

      <SimpleGrid
        cols={2}
        spacing="sm"
      >
        <MobileInfo
          label="المنطقة"
          value={
            vehicle.area ||
            "غير محددة"
          }
        />

        <MobileInfo
          label="سنة الصنع"
          value={
            vehicle.manufacture_year
              ? String(
                  vehicle.manufacture_year,
                )
              : "—"
          }
        />

        <MobileInfo
          label="الوزن"
          value={formatNumber(
            vehicle.weight,
          )}
        />

        <MobileInfo
          label="الحمولة"
          value={formatNumber(
            vehicle.capacity,
          )}
        />
      </SimpleGrid>

      <Box mt="md">
        <Text
          size="xs"
          fw={700}
          c="dimmed"
          mb={7}
        >
          السائقون
        </Text>

        <Stack gap={5}>
          {vehicle.driver_1 && (
            <DriverLine
              name={
                vehicle.driver_1
              }
            />
          )}

          {vehicle.driver_2 && (
            <DriverLine
              name={
                vehicle.driver_2
              }
            />
          )}

          {vehicle.driver_3 && (
            <DriverLine
              name={
                vehicle.driver_3
              }
            />
          )}

          {!vehicle.driver_1 &&
            !vehicle.driver_2 &&
            !vehicle.driver_3 && (
              <Text
                size="xs"
                c="dimmed"
              >
                لا يوجد سائقون
              </Text>
            )}
        </Stack>
      </Box>

      <SimpleGrid
        cols={2}
        spacing="xs"
        mt="md"
      >
        <Box>
          <Text
            size="xs"
            c="dimmed"
            mb={5}
          >
            بطاقة الوقود
          </Text>

          <Badge
  variant="light"
  color={getFuelCardColor(vehicle.fuel_card_status)}
  radius="sm"
  size="sm"
>
  {getFuelCardLabel(vehicle.fuel_card_status)}
</Badge>
        </Box>

        <Box>
          <Text
            size="xs"
            c="dimmed"
            mb={5}
          >
            جهاز التتبع
          </Text>

          <Badge
  variant="light"
  color={getTrackingColor(vehicle.tracking_device_status)}
  radius="sm"
  size="sm"
>
  {getTrackingLabel(vehicle.tracking_device_status)}
</Badge>
        </Box>
      </SimpleGrid>

      <Group
        grow
        mt="md"
      >
        <Button
          variant="light"
          color="blue"
          radius="md"
          leftSection={
            <IconEdit
              size={16}
            />
          }
          onClick={onEdit}
        >
          تعديل
        </Button>

        <Button
          variant="light"
          color="red"
          radius="md"
          leftSection={
            <IconTrash
              size={16}
            />
          }
          onClick={onDelete}
        >
          حذف
        </Button>
      </Group>
    </Card>
  );
}

/* =========================================================
   MOBILE INFO
========================================================= */

function MobileInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Box>
      <Text
        size="10px"
        c="dimmed"
      >
        {label}
      </Text>

      <Text
        size="xs"
        fw={600}
        mt={2}
      >
        {value}
      </Text>
    </Box>
  );
}

