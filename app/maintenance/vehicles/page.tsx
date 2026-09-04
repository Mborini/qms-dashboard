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
  IconCar,
  IconCheck,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconTruck,
  IconWeight,
  IconX,
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
    type:string| null;

};

type VehicleForm = {
  plate_number: string;
  weight: number | string;
  capacity: number | string;
  manufacture_year: number | string;
  model: string;
  area: string | null;
  type:string| null;
};

const PAGE_SIZE = 10;

/*
=========================================================
المناطق الثابتة
=========================================================
*/

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
  type: "",
  area: null,
};

export default function MaintenanceVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<string | null>(
    null
  );

  const [page, setPage] = useState(1);

  const [formOpened, formHandlers] = useDisclosure(false);
  const [deleteOpened, deleteHandlers] = useDisclosure(false);

  const [editingVehicle, setEditingVehicle] =
    useState<Vehicle | null>(null);

  const [vehicleToDelete, setVehicleToDelete] =
    useState<Vehicle | null>(null);

  const [form, setForm] =
    useState<VehicleForm>(EMPTY_FORM);

  /*
  =========================================================
  LOAD VEHICLES
  =========================================================
  */

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/maintenance/vehicles",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Failed to load vehicles"
        );
      }

      setVehicles(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      console.error(err);
      setError(
        "حدث خطأ أثناء تحميل مركبات الصيانة"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  /*
  =========================================================
  FILTER
  =========================================================
  */

  const filteredVehicles = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        !query ||
        String(
          vehicle.plate_number ?? ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          vehicle.model ?? ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          vehicle.area ?? ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          vehicle.manufacture_year ?? ""
        )
          .toLowerCase()
          .includes(query);

      const matchesArea =
        !areaFilter ||
        vehicle.area === areaFilter;

      return (
        matchesSearch &&
        matchesArea
      );
    });
  }, [
    vehicles,
    search,
    areaFilter,
  ]);

  /*
  =========================================================
  PAGINATION
  =========================================================
  */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredVehicles.length /
        PAGE_SIZE
    )
  );

  const paginatedVehicles = useMemo(() => {
    const start =
      (page - 1) * PAGE_SIZE;

    return filteredVehicles.slice(
      start,
      start + PAGE_SIZE
    );
  }, [
    filteredVehicles,
    page,
  ]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [
    page,
    totalPages,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    areaFilter,
  ]);

  /*
  =========================================================
  STATS
  =========================================================
  */

  const stats = useMemo(() => {
    const total = vehicles.length;

    const withArea =
      vehicles.filter(
        (vehicle) =>
          Boolean(
            vehicle.area?.trim()
          )
      ).length;

    const totalCapacity =
      vehicles.reduce(
        (sum, vehicle) =>
          sum +
          Number(
            vehicle.capacity || 0
          ),
        0
      );

    const totalWeight =
      vehicles.reduce(
        (sum, vehicle) =>
          sum +
          Number(
            vehicle.weight || 0
          ),
        0
      );

    return {
      total,
      withArea,
      totalCapacity,
      totalWeight,
    };
  }, [vehicles]);

  /*
  =========================================================
  ADD
  =========================================================
  */

  const handleAdd = () => {
    setEditingVehicle(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    formHandlers.open();
  };

  /*
  =========================================================
  EDIT
  =========================================================
  */

  const handleEdit = (
    vehicle: Vehicle
  ) => {
    setEditingVehicle(vehicle);

    setForm({
      plate_number:
        vehicle.plate_number ?? "",

      weight:
        vehicle.weight ?? "",

      capacity:
        vehicle.capacity ?? "",

      manufacture_year:
        vehicle.manufacture_year ??
        "",

      model:
        vehicle.model ?? "",
        
      type:
        vehicle.type ?? null,

      area:
        vehicle.area &&
        AREAS.includes(
          vehicle.area
        )
          ? vehicle.area
          : null,
    });

    setError("");
    setSuccess("");

    formHandlers.open();
  };

  /*
  =========================================================
  UPDATE FORM
  =========================================================
  */

  const updateForm = (
    key: keyof VehicleForm,
    value: any
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  /*
  =========================================================
  SAVE
  =========================================================
  */

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (
        !form.plate_number.trim()
      ) {
        setError(
          "يرجى إدخال رقم الآلية"
        );
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
        setError(
          "الوزن غير صحيح"
        );
        return;
      }

      if (
        payload.capacity !== null &&
        Number.isNaN(
          payload.capacity
        )
      ) {
        setError(
          "السعة غير صحيحة"
        );
        return;
      }

      if (
        payload.manufacture_year !==
          null &&
        Number.isNaN(
          payload.manufacture_year
        )
      ) {
        setError(
          "سنة الصنع غير صحيحة"
        );
        return;
      }

      const isEdit =
        Boolean(editingVehicle);

      const response =
        await fetch(
          "/api/maintenance/vehicles",
          {
            method: isEdit
              ? "PATCH"
              : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              isEdit
                ? {
                    id:
                      editingVehicle!.id,
                    ...payload,
                  }
                : payload
            ),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "حدث خطأ أثناء حفظ المركبة"
        );
      }

      formHandlers.close();

      setEditingVehicle(null);
      setForm(EMPTY_FORM);

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

  /*
  =========================================================
  OPEN DELETE
  =========================================================
  */

  const openDelete = (
    vehicle: Vehicle
  ) => {
    setVehicleToDelete(vehicle);
    deleteHandlers.open();
  };

  /*
  =========================================================
  DELETE
  =========================================================
  */

  const handleDelete = async () => {
    if (!vehicleToDelete) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/maintenance/vehicles?id=${vehicleToDelete.id}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "Failed to delete vehicle"
        );
      }

      deleteHandlers.close();

      setVehicleToDelete(null);

      setSuccess(
        "تم حذف المركبة بنجاح"
      );

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

  /*
  =========================================================
  CLEAR FILTERS
  =========================================================
  */

  const clearFilters = () => {
    setSearch("");
    setAreaFilter(null);
    setPage(1);
  };

  return (
    <Container
      size="xl"
      py="xl"
      dir="rtl"
    >
      <Stack gap="xl">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <Group
          justify="space-between"
          align="center"
        >
          <Group gap="md">
            <ThemeIcon
              size={52}
              radius="lg"
              variant="light"
              color="blue"
            >
              <IconTruck size={27} />
            </ThemeIcon>

            <div>
              <Title order={2}>
                مركبات الصيانة
              </Title>

              <Text
                size="sm"
                c="dimmed"
                mt={3}
              >
                إدارة بيانات مركبات وآليات الصيانة
              </Text>
            </div>
          </Group>

          <Group>
            <Tooltip label="تحديث البيانات">
              <ActionIcon
                variant="light"
                color="gray"
                size="lg"
                onClick={
                  loadVehicles
                }
                loading={loading}
              >
                <IconRefresh
                  size={19}
                />
              </ActionIcon>
            </Tooltip>

            <Button
              leftSection={
                <IconPlus size={18} />
              }
              onClick={handleAdd}
              radius="md"
            >
              إضافة مركبة
            </Button>
          </Group>
        </Group>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <Alert
            color="red"
            variant="light"
            icon={
              <IconAlertCircle
                size={20}
              />
            }
            title="حدث خطأ"
            withCloseButton
            onClose={() =>
              setError("")
            }
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            color="green"
            variant="light"
            icon={
              <IconCheck size={20} />
            }
            title="تمت العملية بنجاح"
            withCloseButton
            onClose={() =>
              setSuccess("")
            }
          >
            {success}
          </Alert>
        )}

     

        {/* =================================================
            FILTERS
        ================================================= */}

        <Card
          radius="lg"
          padding="lg"
          withBorder
        >
          <Stack gap="md">

            <Group justify="space-between">
              <div>
                <Text fw={700}>
                  البحث والتصفية
                </Text>

                <Text
                  size="xs"
                  c="dimmed"
                  mt={2}
                >
                  ابحث برقم الآلية أو الموديل أو المنطقة
                </Text>
              </div>

              {(search ||
                areaFilter) && (
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  leftSection={
                    <IconX size={15} />
                  }
                  onClick={
                    clearFilters
                  }
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
                placeholder="رقم الآلية، الموديل..."
                leftSection={
                  <IconSearch
                    size={17}
                  />
                }
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.currentTarget
                      .value
                  )
                }
              />

              <Select
                label="المنطقة"
                placeholder="كل المناطق"
                clearable
                searchable
                data={AREA_OPTIONS}
                value={areaFilter}
                onChange={
                  setAreaFilter
                }
              />
            </SimpleGrid>
          </Stack>
        </Card>

        {/* =================================================
            TABLE
        ================================================= */}

        <Card
          radius="lg"
          padding={0}
          withBorder
          style={{
            overflow: "hidden",
          }}
        >
          <Group
            justify="space-between"
            px="lg"
            py="md"
          >
            <div>
              <Text fw={800}>
                قائمة المركبات
              </Text>

              <Text
                size="xs"
                c="dimmed"
                mt={2}
              >
                عرض{" "}
                {filteredVehicles.length}{" "}
                مركبة
              </Text>
            </div>

            <Badge
              variant="light"
              color="blue"
              size="lg"
            >
              {filteredVehicles.length} مركبة
            </Badge>
          </Group>

          <Divider />

          {loading ? (
            <Stack
              p="lg"
              gap="sm"
            >
              {Array.from({
                length: 7,
              }).map(
                (_, index) => (
                  <Skeleton
                    key={`vehicle-skeleton-${index}`}
                    height={48}
                    radius="md"
                  />
                )
              )}
            </Stack>
          ) : filteredVehicles.length ===
            0 ? (
            <Paper
              p="xl"
              radius={0}
              ta="center"
            >
              <ThemeIcon
                size={60}
                radius="xl"
                variant="light"
                color="gray"
                mx="auto"
              >
                <IconTruck
                  size={30}
                />
              </ThemeIcon>

              <Text
                fw={700}
                mt="md"
              >
                لا توجد مركبات
              </Text>

              <Text
                size="sm"
                c="dimmed"
                mt={5}
              >
                لم يتم العثور على مركبات مطابقة
              </Text>

              {(search ||
                areaFilter) && (
                <Button
                  mt="md"
                  variant="light"
                  onClick={
                    clearFilters
                  }
                >
                  مسح البحث
                </Button>
              )}
            </Paper>
          ) : (
            <>
              <Table.ScrollContainer
                minWidth={950}
              >
                <Table
                  verticalSpacing="md"
                  horizontalSpacing="lg"
                  highlightOnHover
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>
                        #
                      </Table.Th>

                      <Table.Th>
                        رقم الآلية
                      </Table.Th>

                      <Table.Th>
                        الموديل
                      </Table.Th>
                      <Table.Th>
                        النوع
                      </Table.Th>

                      <Table.Th>
                        الوزن
                      </Table.Th>

                      <Table.Th>
                        السعة
                      </Table.Th>

                      <Table.Th>
                        سنة الصنع
                      </Table.Th>

                      <Table.Th>
                        المنطقة
                      </Table.Th>

                      <Table.Th ta="center">
                        الإجراءات
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>

                  <Table.Tbody>
                    {paginatedVehicles.map(
                      (
                        vehicle,
                        index
                      ) => {
                        const rowNumber =
                          (page -
                            1) *
                            PAGE_SIZE +
                          index +
                          1;

                        return (
                          <Table.Tr
                            key={
                              vehicle.id
                            }
                          >
                            <Table.Td>
                              <Text
                                size="sm"
                                fw={600}
                                c="dimmed"
                              >
                                {rowNumber}
                              </Text>
                            </Table.Td>

                            <Table.Td>
                              <Group gap="sm">
                                <ThemeIcon
                                  size={36}
                                  radius="md"
                                  variant="light"
                                  color="blue"
                                >
                                  <IconTruck
                                    size={
                                      18
                                    }
                                  />
                                </ThemeIcon>

                                <Text
                                  fw={700}
                                >
                                  {vehicle.plate_number ||
                                    "—"}
                                </Text>
                              </Group>
                            </Table.Td>

                            <Table.Td>
                              <Text size="sm">
                                {vehicle.model ||
                                  "—"}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">
                                {vehicle.type ||
                                  "—"}
                              </Text>
                            </Table.Td>

                            <Table.Td>
                              {vehicle.weight !==
                                null &&
                              vehicle.weight !==
                                undefined ? (
                                <Badge
                                  variant="light"
                                  color="violet"
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
                                  —
                                </Text>
                              )}
                            </Table.Td>

                            <Table.Td>
                              {vehicle.capacity !==
                                null &&
                              vehicle.capacity !==
                                undefined ? (
                                <Badge
                                  variant="light"
                                  color="orange"
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
                                  —
                                </Text>
                              )}
                            </Table.Td>

                            <Table.Td>
                              {vehicle.manufacture_year ||
                                "—"}
                            </Table.Td>

                            <Table.Td>
                              {vehicle.area ? (
                                <Badge
                                  variant="light"
                                  color="green"
                                >
                                  {
                                    vehicle.area
                                  }
                                </Badge>
                              ) : (
                                <Badge
                                  variant="light"
                                  color="gray"
                                >
                                  بدون منطقة
                                </Badge>
                              )}
                            </Table.Td>

                            <Table.Td>
                              <Group
                                justify="center"
                                gap={6}
                              >
                                <Tooltip label="تعديل">
                                  <ActionIcon
                                    variant="light"
                                    color="blue"
                                    size="lg"
                                    onClick={() =>
                                      handleEdit(
                                        vehicle
                                      )
                                    }
                                  >
                                    <IconEdit
                                      size={
                                        17
                                      }
                                    />
                                  </ActionIcon>
                                </Tooltip>

                                <Tooltip label="حذف">
                                  <ActionIcon
                                    variant="light"
                                    color="red"
                                    size="lg"
                                    onClick={() =>
                                      openDelete(
                                        vehicle
                                      )
                                    }
                                  >
                                    <IconTrash
                                      size={
                                        17
                                      }
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
                    py="md"
                  >
                    <Pagination
                      total={
                        totalPages
                      }
                      value={page}
                      onChange={
                        setPage
                      }
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
       dir={"rtl"}
        opened={formOpened}
        onClose={
          formHandlers.close
        }
        title={
          <Group gap="sm">
            <ThemeIcon
              variant="light"
              color="blue"
              radius="md"
            >
              {editingVehicle ? (
                <IconEdit
                  size={19}
                />
              ) : (
                <IconPlus
                  size={19}
                />
              )}
            </ThemeIcon>

            <div>
              <Text fw={800}>
                {editingVehicle
                  ? "تعديل مركبة"
                  : "إضافة مركبة جديدة"}
              </Text>

              <Text
                size="xs"
                c="dimmed"
                mt={2}
              >
                أدخل بيانات مركبة الصيانة
              </Text>
            </div>
          </Group>
        }
        centered
        size="lg"
        radius="lg"
      >
        <Stack gap="md">

          <SimpleGrid
            cols={{
              base: 1,
              sm: 2,
            }}
          >
            <TextInput
              label="رقم الآلية"
              placeholder="مثال: 05-21529"
              required
              value={
                form.plate_number
              }
              onChange={(event) =>
                updateForm(
                  "plate_number",
                  event
                    .currentTarget
                    .value
                )
              }
            />

            <TextInput
              label="الموديل"
              placeholder="مثال: Mercedes"
              value={form.model}
              onChange={(event) =>
                updateForm(
                  "model",
                  event
                    .currentTarget
                    .value
                )
              }
            />

            <NumberInput
              label="الوزن"
              placeholder="أدخل الوزن"
              min={0}
              thousandSeparator=","
              value={form.weight}
              onChange={(value) =>
                updateForm(
                  "weight",
                  value
                )
              }
            />

            <NumberInput
              label="السعة"
              placeholder="أدخل السعة"
              min={0}
              thousandSeparator=","
              value={
                form.capacity
              }
              onChange={(value) =>
                updateForm(
                  "capacity",
                  value
                )
              }
            />

            <NumberInput
              label="سنة الصنع"
              placeholder="مثال: 2022"
              min={1900}
              max={
                new Date().getFullYear() +
                1
              }
              value={
                form.manufacture_year
              }
              onChange={(value) =>
                updateForm(
                  "manufacture_year",
                  value
                )
              }
            />

            <Select
              label="المنطقة"
              placeholder="اختر المنطقة"
              data={
                AREA_OPTIONS
              }
              value={form.area}
              onChange={(value) =>
                updateForm(
                  "area",
                  value
                )
              }
              searchable
              clearable
            />
          </SimpleGrid>

          <Divider />

          <Group>
            <Button
              onClick={
                handleSubmit
              }
              loading={saving}
              leftSection={
                editingVehicle ? (
                  <IconCheck
                    size={18}
                  />
                ) : (
                  <IconPlus
                    size={18}
                  />
                )
              }
            >
              {editingVehicle
                ? "حفظ التعديلات"
                : "إضافة المركبة"}
            </Button>

            <Button
              variant="light"
              color="gray"
              onClick={
                formHandlers.close
              }
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
        opened={deleteOpened}
        onClose={
          deleteHandlers.close
        }
        centered
        size="sm"
        title={
          <Group gap="sm">
            <ThemeIcon
              color="red"
              variant="light"
              radius="md"
            >
              <IconTrash
                size={19}
              />
            </ThemeIcon>

            <Text fw={800}>
              حذف المركبة
            </Text>
          </Group>
        }
      >
        <Stack gap="lg">

          <Text>
            هل أنت متأكد من حذف المركبة{" "}
            <Text
              component="span"
              fw={800}
            >
              {
                vehicleToDelete?.plate_number
              }
            </Text>
            ؟
          </Text>

          <Alert
            color="red"
            variant="light"
            icon={
              <IconAlertCircle
                size={18}
              />
            }
          >
            لا يمكن التراجع عن عملية الحذف بعد
            تنفيذها.
          </Alert>

          <Group>
            <Button
              color="red"
              loading={deleting}
              leftSection={
                <IconTrash
                  size={17}
                />
              }
              onClick={
                handleDelete
              }
            >
              حذف المركبة
            </Button>

            <Button
              variant="light"
              color="gray"
              onClick={
                deleteHandlers.close
              }
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