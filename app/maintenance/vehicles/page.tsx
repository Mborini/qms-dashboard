
"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Modal,
  NumberInput,
  Pagination,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";

import {
  IconAlertCircle,
  IconCheck,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconTruck,
  IconX,
  IconMapPin,
  IconCalendar,
  IconGauge,
  IconWeight,
  IconDatabase,
} from "@tabler/icons-react";

import { useDisclosure } from "@mantine/hooks";

type Vehicle = {
  id: number;
  plate_number: string | null;
  weight: number | null;
  capacity: number | null;
  manufacture_year: number | null;
  model: string | null;
  area: string | null;
  type: string | null;
};

type VehicleForm = {
  plate_number: string;
  weight: number | string;
  capacity: number | string;
  manufacture_year: number | string;
  model: string;
  area: string | null;
  type: string | null;
};

const PAGE_SIZE = 10;

const AREAS = [
  "طارق",
  "الجبيهة",
  "أبو نصير",
  "النصر",
  "ماركا",
  "أحد",
  "شفا بدران",
  "تلاع العلي",
  "خلدا",
  "أم السماق",
];

const AREA_OPTIONS = AREAS.map((area) => ({
  value: area,
  label: area,
}));

const EMPTY_FORM: VehicleForm = {
  plate_number: "",
  weight: "",
  capacity: "",
  manufacture_year: "",
  model: "",
  area: null,
  type: "",
};

export default function MaintenanceVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  const [formOpened, formHandlers] = useDisclosure(false);
  const [deleteOpened, deleteHandlers] = useDisclosure(false);

  const [editingVehicle, setEditingVehicle] =
    useState<Vehicle | null>(null);

  const [vehicleToDelete, setVehicleToDelete] =
    useState<Vehicle | null>(null);

  const [form, setForm] = useState<VehicleForm>(EMPTY_FORM);

  // =========================================================
  // LOAD
  // =========================================================

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/maintenance/vehicles", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to load vehicles"
        );
      }

      setVehicles(
        Array.isArray(result.data) ? result.data : []
      );
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل مركبات الصيانة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        !query ||
        String(vehicle.plate_number ?? "")
          .toLowerCase()
          .includes(query) ||
        String(vehicle.model ?? "")
          .toLowerCase()
          .includes(query) ||
        String(vehicle.type ?? "")
          .toLowerCase()
          .includes(query) ||
        String(vehicle.area ?? "")
          .toLowerCase()
          .includes(query) ||
        String(vehicle.manufacture_year ?? "")
          .toLowerCase()
          .includes(query);

      const matchesArea =
        !areaFilter || vehicle.area === areaFilter;

      return matchesSearch && matchesArea;
    });
  }, [vehicles, search, areaFilter]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredVehicles.length / PAGE_SIZE)
  );

  const paginatedVehicles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredVehicles.slice(
      start,
      start + PAGE_SIZE
    );
  }, [filteredVehicles, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, areaFilter]);

  // =========================================================
  // STATS
  // =========================================================

  const stats = useMemo(() => {
    const total = vehicles.length;

    const withArea = vehicles.filter((vehicle) =>
      Boolean(vehicle.area?.trim())
    ).length;

    const totalCapacity = vehicles.reduce(
      (sum, vehicle) =>
        sum + Number(vehicle.capacity || 0),
      0
    );

    const totalWeight = vehicles.reduce(
      (sum, vehicle) =>
        sum + Number(vehicle.weight || 0),
      0
    );

    return {
      total,
      withArea,
      totalCapacity,
      totalWeight,
    };
  }, [vehicles]);

  // =========================================================
  // FORM
  // =========================================================

  const handleAdd = () => {
    setEditingVehicle(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setSuccess("");
    formHandlers.open();
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);

    setForm({
      plate_number: vehicle.plate_number ?? "",
      weight: vehicle.weight ?? "",
      capacity: vehicle.capacity ?? "",
      manufacture_year:
        vehicle.manufacture_year ?? "",
      model: vehicle.model ?? "",
      type: vehicle.type ?? "",
      area: AREAS.includes(vehicle.area ?? "")
        ? vehicle.area
        : null,
    });

    setError("");
    setSuccess("");

    formHandlers.open();
  };

  const updateForm = <K extends keyof VehicleForm>(
    key: K,
    value: VehicleForm[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // =========================================================
  // SAVE
  // =========================================================

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.plate_number.trim()) {
        setError("يرجى إدخال رقم الآلية");
        return;
      }

      const payload = {
        plate_number: form.plate_number.trim(),

        weight:
          form.weight === ""
            ? null
            : Number(form.weight),

        capacity:
          form.capacity === ""
            ? null
            : Number(form.capacity),

        manufacture_year:
          form.manufacture_year === ""
            ? null
            : Number(form.manufacture_year),

        model: form.model.trim() || null,

        type: form.type?.trim() || null,

        area: form.area || null,
      };

      if (
        payload.weight !== null &&
        Number.isNaN(payload.weight)
      ) {
        setError("الوزن غير صحيح");
        return;
      }

      if (
        payload.capacity !== null &&
        Number.isNaN(payload.capacity)
      ) {
        setError("السعة غير صحيحة");
        return;
      }

      if (
        payload.manufacture_year !== null &&
        Number.isNaN(payload.manufacture_year)
      ) {
        setError("سنة الصنع غير صحيحة");
        return;
      }

      const isEdit = Boolean(editingVehicle);

      const response = await fetch(
        "/api/maintenance/vehicles",
        {
          method: isEdit ? "PATCH" : "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(
            isEdit
              ? {
                  id: editingVehicle!.id,
                  ...payload,
                }
              : payload
          ),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "حدث خطأ أثناء حفظ المركبة"
        );
      }

      formHandlers.close();

      setEditingVehicle(null);
      setForm({ ...EMPTY_FORM });

      setSuccess(
        isEdit
          ? "تم تعديل المركبة بنجاح"
          : "تمت إضافة المركبة بنجاح"
      );

      await loadVehicles();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حفظ البيانات"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const openDelete = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    deleteHandlers.open();
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/maintenance/vehicles?id=${vehicleToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Failed to delete vehicle"
        );
      }

      deleteHandlers.close();
      setVehicleToDelete(null);

      setSuccess("تم حذف المركبة بنجاح");

      await loadVehicles();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حذف المركبة"
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================================================
  // FILTER RESET
  // =========================================================

  const clearFilters = () => {
    setSearch("");
    setAreaFilter(null);
    setPage(1);
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <Container
      size="xl"
      py={{ base: "md", md: "xl" }}
      dir="rtl"
    >
      <Stack gap="xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <Card
          radius="xl"
         
          withBorder
          style={{
            background:
              "linear-gradient(135deg, var(--mantine-color-blue-0), var(--mantine-color-body))",
          }}
        >
          <Group
            justify="space-between"
            align="center"
            wrap="wrap"
          >
            <Group gap="md">
              <ThemeIcon
                size={58}
                radius="xl"
                variant="gradient"
                gradient={{
                  from: "blue",
                  to: "cyan",
                  deg: 135,
                }}
              >
                <IconTruck size={29} />
              </ThemeIcon>

              <div>
                <Title
                  order={2}
                  fw={900}
                  style={{
                    letterSpacing: "-0.5px",
                  }}
                >
ادارة المركبات                </Title>

                <Text
                  size="sm"
                  c="dimmed"
                  mt={4}
                >
                  إدارة ومتابعة بيانات مركبات وآليات الاسطول
                </Text>
              </div>
            </Group>

            <Group gap="sm">
              <Tooltip label="تحديث البيانات">
                <ActionIcon
                  variant="default"
                  size="xl"
                  radius="md"
                  onClick={loadVehicles}
                  loading={loading}
                >
                  <IconRefresh size={20} />
                </ActionIcon>
              </Tooltip>

              <Button
                size="md"
                radius="md"
                leftSection={
                  <IconPlus size={19} />
                }
                onClick={handleAdd}
              >
                إضافة مركبة
              </Button>
            </Group>
          </Group>
        </Card>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <Alert
            radius="lg"
            color="red"
            variant="light"
            icon={<IconAlertCircle size={20} />}
            title="حدث خطأ"
            withCloseButton
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            radius="lg"
            color="green"
            variant="light"
            icon={<IconCheck size={20} />}
            title="تمت العملية بنجاح"
            withCloseButton
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        {/* =================================================
            FILTERS
        ================================================= */}

        <Card
          radius="xl"
          padding="lg"
          withBorder
        >
          <Stack gap="lg">

            <Group justify="space-between">
              <Group gap="sm">
                <ThemeIcon
                  size={38}
                  radius="md"
                  variant="light"
                  color="blue"
                >
                  <IconSearch size={19} />
                </ThemeIcon>

                <div>
                  <Text fw={800}>
                    البحث والتصفية
                  </Text>

                  <Text
                    size="xs"
                    c="dimmed"
                    mt={2}
                  >
                    ابحث عن المركبات باستخدام البيانات المتاحة
                  </Text>
                </div>
              </Group>

              {(search || areaFilter) && (
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  leftSection={<IconX size={15} />}
                  onClick={clearFilters}
                >
                  مسح الفلاتر
                </Button>
              )}
            </Group>

            <SimpleGrid
              cols={{
                base: 1,
                sm: 2,
              }}
            >
              <TextInput
                label="بحث"
                placeholder="رقم الآلية، النوع، الموديل، المنطقة..."
                leftSection={
                  <IconSearch size={17} />
                }
                radius="md"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.currentTarget.value
                  )
                }
              />

              <Select
                label="المنطقة"
                placeholder="كل المناطق"
                clearable
                searchable
                radius="md"
                data={AREA_OPTIONS}
                value={areaFilter}
                onChange={setAreaFilter}
              />
            </SimpleGrid>

          </Stack>
        </Card>

        {/* =================================================
            TABLE
        ================================================= */}

        <Card
          radius="xl"
          padding={0}
          withBorder
          style={{
            overflow: "hidden",
          }}
        >
          <Group
            justify="space-between"
            px={{ base: "md", md: "xl" }}
            py="lg"
          >
            <Group gap="sm">
              <ThemeIcon
                size={40}
                radius="md"
                variant="light"
                color="blue"
              >
                <IconDatabase size={20} />
              </ThemeIcon>

              <div>
                <Text fw={850}>
                  قائمة المركبات
                </Text>

                <Text
                  size="xs"
                  c="dimmed"
                  mt={2}
                >
                  {filteredVehicles.length} مركبة مطابقة
                </Text>
              </div>
            </Group>

            <Badge
              size="lg"
              radius="md"
              variant="light"
              color="blue"
            >
              {filteredVehicles.length}
            </Badge>
          </Group>

          <Divider />

          {loading ? (
            <Stack p="xl" gap="sm">
              {Array.from({ length: 8 }).map(
                (_, index) => (
                  <Skeleton
                    key={index}
                    height={54}
                    radius="md"
                  />
                )
              )}
            </Stack>
          ) : filteredVehicles.length === 0 ? (
            <Paper
              p="xl"
              radius={0}
              ta="center"
            >
              <ThemeIcon
                size={70}
                radius="xl"
                variant="light"
                color="gray"
                mx="auto"
              >
                <IconTruck size={32} />
              </ThemeIcon>

              <Text
                fw={800}
                mt="lg"
              >
                لا توجد مركبات
              </Text>

              <Text
                size="sm"
                c="dimmed"
                mt={5}
              >
                لم يتم العثور على مركبات مطابقة لمعايير البحث
              </Text>

              {(search || areaFilter) && (
                <Button
                  mt="lg"
                  variant="light"
                  radius="md"
                  onClick={clearFilters}
                >
                  مسح الفلاتر
                </Button>
              )}
            </Paper>
          ) : (
            <>
              <Table.ScrollContainer minWidth={1100}>
                <Table
                  verticalSpacing="md"
                  horizontalSpacing="lg"
                  highlightOnHover
                  striped
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>#</Table.Th>
                      <Table.Th>رقم الآلية</Table.Th>
                      <Table.Th>النوع</Table.Th>
                      <Table.Th>الموديل</Table.Th>
                      <Table.Th>الوزن</Table.Th>
                      <Table.Th>السعة</Table.Th>
                      <Table.Th>سنة الصنع</Table.Th>
                      <Table.Th>المنطقة</Table.Th>
                      <Table.Th ta="center">
                        الإجراءات
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>

                  <Table.Tbody>
                    {paginatedVehicles.map(
                      (vehicle, index) => {
                        const rowNumber =
                          (page - 1) *
                            PAGE_SIZE +
                          index +
                          1;

                        return (
                          <Table.Tr
                            key={vehicle.id}
                          >
                            <Table.Td>
                              <Text
                                size="sm"
                                fw={700}
                                c="dimmed"
                              >
                                {rowNumber}
                              </Text>
                            </Table.Td>

                            {/* PLATE */}

                            <Table.Td>
                              <Group gap="sm">
                                <ThemeIcon
                                  size={38}
                                  radius="md"
                                  variant="light"
                                  color="blue"
                                >
                                  <IconTruck
                                    size={19}
                                  />
                                </ThemeIcon>

                                <div>
                                  <Text
                                    fw={800}
                                    size="sm"
                                  >
                                    {vehicle.plate_number ||
                                      "—"}
                                  </Text>

                                  
                                </div>
                              </Group>
                            </Table.Td>

                            {/* TYPE */}

                            <Table.Td>
                              {vehicle.type ? (
                                <Badge
                                  variant="light"
                                  color="cyan"
                                  radius="xl"
                                >
                                  {vehicle.type}
                                </Badge>
                              ) : (
                                <Text
                                  size="sm"
                                  c="dimmed"
                                >
                                  —
                                </Text>
                              )}
                            </Table.Td>

                            {/* MODEL */}

                            <Table.Td>
                              <Text size="sm" fw={600}>
                                {vehicle.model || "—"}
                              </Text>
                            </Table.Td>

                            {/* WEIGHT */}

                            <Table.Td>
                              {vehicle.weight !== null &&
                              vehicle.weight !==
                                undefined ? (
                                <Badge
                                  variant="light"
                                  color="violet"
                                  radius="xl"
                                >
                                  {Number(
                                    vehicle.weight
                                  ).toLocaleString()}
                                </Badge>
                              ) : (
                                <Text
                                  size="sm"
                                  c="dimmed"
                                >
                                 غير محدد
                                </Text>
                              )}
                            </Table.Td>

                            {/* CAPACITY */}

                            <Table.Td>
                              {vehicle.capacity !== null &&
                              vehicle.capacity !==
                                undefined ? (
                                <Badge
                                  variant="light"
                                  color="orange"
                                  radius="xl"
                                >
                                  {Number(
                                    vehicle.capacity
                                  ).toLocaleString()}
                                </Badge>
                              ) : (
                                <Text
                                  size="sm"
                                  c="dimmed"
                                >
                                  غير محدد
                                </Text>
                              )}
                            </Table.Td>

                            {/* YEAR */}

                            <Table.Td>
                              {vehicle.manufacture_year ? (
                                <Group gap={6}>
                                  <IconCalendar
                                    size={16}
                                    style={{
                                      opacity: 0.6,
                                    }}
                                  />

                                  <Text
                                    size="sm"
                                    fw={700}
                                  >
                                    {
                                      vehicle.manufacture_year
                                    }
                                  </Text>
                                </Group>
                              ) : (
                                <Text
                                  size="sm"
                                  c="dimmed"
                                >
                                  غير محدد
                                </Text>
                              )}
                            </Table.Td>

                            {/* AREA */}

                            <Table.Td>
                              {vehicle.area ? (
                                <Badge
                                  variant="light"
                                  color="green"
                                  radius="xl"
                                  leftSection={
                                    <IconMapPin
                                      size={13}
                                    />
                                  }
                                >
                                  {vehicle.area}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="light"
                                  color="gray"
                                  radius="xl"
                                >
                                  غير محدد
                                </Badge>
                              )}
                            </Table.Td>

                            {/* ACTIONS */}

                            <Table.Td>
                              <Group
                                justify="center"
                                gap={6}
                              >
                                <Tooltip label="تعديل المركبة">
                                  <ActionIcon
                                    variant="light"
                                    color="blue"
                                    size="lg"
                                    radius="md"
                                    onClick={() =>
                                      handleEdit(
                                        vehicle
                                      )
                                    }
                                  >
                                    <IconEdit
                                      size={17}
                                    />
                                  </ActionIcon>
                                </Tooltip>

                                <Tooltip label="حذف المركبة">
                                  <ActionIcon
                                  disabled={true}
                                    variant="light"
                                    color="red"
                                    size="lg"
                                    radius="md"
                                    onClick={() =>
                                      openDelete(
                                        vehicle
                                      )
                                    }
                                  >
                                    <IconTrash
                                      size={17}
                                    />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        );
                      }
                    )}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>

              {totalPages > 1 && (
                <>
                  <Divider />

                  <Group
                    justify="center"
                    py="lg"
                  >
                    <Pagination
                      total={totalPages}
                      value={page}
                      onChange={setPage}
                      radius="md"
                    />
                  </Group>
                </>
              )}
            </>
          )}
        </Card>
      </Stack>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      <Modal
        dir="rtl"
        opened={formOpened}
        onClose={formHandlers.close}
        centered
        size="lg"
        radius="xl"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        title={
          <Group gap="sm">
            <ThemeIcon
              size={40}
              radius="md"
              variant="light"
              color="blue"
            >
              {editingVehicle ? (
                <IconEdit size={20} />
              ) : (
                <IconPlus size={20} />
              )}
            </ThemeIcon>

            <div>
              <Text fw={850}>
                {editingVehicle
                  ? "تعديل بيانات المركبة"
                  : "إضافة مركبة جديدة"}
              </Text>

              <Text
                size="xs"
                c="dimmed"
                mt={2}
              >
                {editingVehicle
                  ? "قم بتعديل بيانات المركبة ثم احفظ التغييرات"
                  : "أدخل بيانات مركبة الصيانة الجديدة"}
              </Text>
            </div>
          </Group>
        }
      >
        <Stack gap="lg">

          <SimpleGrid
            cols={{
              base: 1,
              sm: 2,
            }}
          >
            <TextInput
              label="رقم الآلية"
              placeholder="مثال: 5-21529"
              required
              radius="md"
              value={form.plate_number}
              onChange={(event) =>
                updateForm(
                  "plate_number",
                  event.currentTarget.value
                )
              }
            />

            <Select
              label="النوع"
              placeholder="اختر نوع الآلية"
              searchable
              clearable
              radius="md"
              data={[
                "Compactor",
                "sweeper",
                "loader",
                "skip loader",
                "Dyna",
                "VAN",
                "Taxi",
                "Water Truck",
                "Tripper Truck",
              ]}
              value={form.type}
              onChange={(value) =>
                updateForm("type", value)
              }
            />

            <TextInput
              label="الموديل"
              placeholder="مثال: MAN"
              radius="md"
              value={form.model}
              onChange={(event) =>
                updateForm(
                  "model",
                  event.currentTarget.value
                )
              }
            />

            <Select
              label="المنطقة"
              placeholder="اختر المنطقة"
              data={AREA_OPTIONS}
              value={form.area}
              onChange={(value) =>
                updateForm("area", value)
              }
              searchable
              clearable
              radius="md"
            />

            <NumberInput
              label="الوزن"
              placeholder="أدخل الوزن"
              min={0}
              thousandSeparator=","
              radius="md"
              value={form.weight}
              onChange={(value) =>
                updateForm("weight", value)
              }
            />

            <NumberInput
              label="السعة"
              placeholder="أدخل السعة"
              min={0}
              thousandSeparator=","
              radius="md"
              value={form.capacity}
              onChange={(value) =>
                updateForm("capacity", value)
              }
            />

            <NumberInput
              label="سنة الصنع"
              placeholder="مثال: 2022"
              min={1900}
              max={new Date().getFullYear() + 1}
              radius="md"
              value={form.manufacture_year}
              onChange={(value) =>
                updateForm(
                  "manufacture_year",
                  value
                )
              }
            />
          </SimpleGrid>

          <Divider />

          <Group
            justify="flex-start"
            gap="sm"
          >
            <Button
              size="md"
              radius="md"
              onClick={handleSubmit}
              loading={saving}
              leftSection={
                editingVehicle ? (
                  <IconCheck size={18} />
                ) : (
                  <IconPlus size={18} />
                )
              }
            >
              {editingVehicle
                ? "حفظ التعديلات"
                : "إضافة المركبة"}
            </Button>

            <Button
              size="md"
              radius="md"
              variant="light"
              color="gray"
              onClick={formHandlers.close}
              disabled={saving}
            >
              إلغاء
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* =================================================
          DELETE MODAL
      ================================================= */}

      <Modal
        dir="rtl"
        opened={deleteOpened}
        onClose={deleteHandlers.close}
        centered
        size="sm"
        radius="xl"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        title={
          <Group gap="sm">
            <ThemeIcon
              size={40}
              radius="md"
              color="red"
              variant="light"
            >
              <IconTrash size={20} />
            </ThemeIcon>

            <Text fw={850}>
              حذف المركبة
            </Text>
          </Group>
        }
      >
        <Stack gap="lg">

          <Paper
            p="md"
            radius="lg"
            withBorder
          >
            <Text size="sm" c="dimmed">
              أنت على وشك حذف المركبة:
            </Text>

            <Text
              fw={900}
              size="xl"
              mt={4}
            >
              {vehicleToDelete?.plate_number}
            </Text>
          </Paper>

          <Alert
            color="red"
            variant="light"
            radius="lg"
            icon={
              <IconAlertCircle size={18} />
            }
          >
            لا يمكن التراجع عن عملية الحذف بعد تنفيذها.
          </Alert>

          <Group>
            <Button
              color="red"
              radius="md"
              loading={deleting}
              leftSection={
                <IconTrash size={17} />
              }
              onClick={handleDelete}
            >
              حذف المركبة
            </Button>

            <Button
              variant="light"
              color="gray"
              radius="md"
              onClick={deleteHandlers.close}
              disabled={deleting}
            >
              إلغاء
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

// =========================================================
// KPI CARD
// =========================================================

type KpiCardProps = {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
};

function KpiCard({
  title,
  value,
  suffix,
  icon,
  color,
}: KpiCardProps) {
  return (
    <Card
      radius="xl"
      padding="lg"
      withBorder
      style={{
        transition:
          "transform 150ms ease, box-shadow 150ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform =
          "translateY(-2px)";
        event.currentTarget.style.boxShadow =
          "var(--mantine-shadow-md)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform =
          "translateY(0)";
        event.currentTarget.style.boxShadow =
          "none";
      }}
    >
      <Group justify="space-between" align="flex-start">
        <div>
          <Text
            size="xs"
            c="dimmed"
            fw={700}
          >
            {title}
          </Text>

          <Group
            gap={5}
            align="baseline"
            mt={8}
          >
            <Text
              fw={900}
              size="xl"
              style={{
                fontSize: 26,
              }}
            >
              {Number(value).toLocaleString()}
            </Text>

            {suffix && (
              <Text
                size="xs"
                c="dimmed"
              >
                {suffix}
              </Text>
            )}
          </Group>
        </div>

        <ThemeIcon
          size={44}
          radius="md"
          variant="light"
          color={color}
        >
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  );
}

