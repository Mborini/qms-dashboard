"use client";

import { useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "@mantine/hooks";

import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Flex,
  Group,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";

import {
  IconAlertCircle,
  IconCalendar,
  IconCar,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconEdit,
  IconFilter,
  IconMapPin,
  IconPlus,
  IconRoute,
  IconSearch,
  IconTrash,
  IconUser,
  IconUsers,
  IconX,
} from "@tabler/icons-react";

/* =========================================================
   Types
========================================================= */

interface Area {
  id: number | null;
  name: string;
}

interface Vehicle {
  id: number;
  plate_number: string;
  capacity: number | null;
  model: string | null;
  type: string | null;
  area_id?: number;
  area_name?: string;
}

interface Movement {
  id: number;
  movement_date: string;
  shift: string;
  vehicle_id: number;
  work_route: string;
  driver_name: string;
  created_by: number;
  created_at: string;

  plate_number: string;
  capacity: number | null;
  model: string | null;
  type: string | null;

  area_id: number;
  area_name: string;

  created_by_name: string | null;
  created_by_username: string | null;
}

interface OptionsResponse {
  success: boolean;
  error?: string;
  area?: Area | null;
  vehicles?: Vehicle[];
  isAdmin?: boolean;
}

interface ListResponse {
  success: boolean;
  error?: string;
  area?: Area | null;
  isAdmin?: boolean;
  data?: Movement[];
}

/* =========================================================
   Theme
========================================================= */

const BLUE_GRADIENT = {
  from: "#1d4ed8",
  to: "#06b6d4",
  deg: 120,
};

const PAGE_BACKGROUND = `
  radial-gradient(
    circle at 100% 0%,
    rgba(37, 99, 235, 0.12),
    transparent 30%
  ),
  radial-gradient(
    circle at 0% 100%,
    rgba(6, 182, 212, 0.09),
    transparent 32%
  ),
  linear-gradient(
    135deg,
    #f8fbff 0%,
    #f1f6fc 50%,
    #edf5fb 100%
  )
`;

/* =========================================================
   Helpers
========================================================= */

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  if (!date) return "-";

  const parts = date.split("-");

  if (parts.length !== 3) return date;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getShiftColor(shift: string) {
  switch (shift) {
    case "A":
      return {
        color: "blue",
        label: "A",
      };

    case "B":
      return {
        color: "cyan",
        label: "B",
      };

    case "C":
      return {
        color: "indigo",
        label: "C",
      };

    default:
      return {
        color: "gray",
        label: shift || "-",
      };
  }
}

/* =========================================================
   Movement Card - Mobile
========================================================= */

function MovementCard({
  movement,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  movement: Movement;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (movement: Movement) => void;
  onDelete: (movement: Movement) => void;
}) {
  const shift = getShiftColor(movement.shift);

  return (
    <Card
      radius="xl"
      padding="md"
      withBorder
      style={{
        borderColor: "#dce7f3",
        background:
          "linear-gradient(145deg, #ffffff 0%, #f5f9ff 100%)",
        boxShadow:
          "0 8px 24px rgba(30, 64, 175, 0.065)",
      }}
    >
      <Stack gap="md">
        {/* Vehicle Header */}

        <Group
          justify="space-between"
          align="flex-start"
          wrap="nowrap"
        >
          <Group
            gap="sm"
            wrap="nowrap"
          >
            <ThemeIcon
              size={46}
              radius="xl"
              variant="gradient"
              gradient={BLUE_GRADIENT}
            >
              <IconCar size={23} />
            </ThemeIcon>

            <Box>
              <Text
                fw={800}
                size="lg"
                c="#172033"
                style={{
                  lineHeight: 1.2,
                }}
              >
                {movement.plate_number}
              </Text>

              <Text
                size="xs"
                c="dimmed"
                mt={3}
              >
                {movement.model ||
                  movement.type ||
                  "مركبة"}

                {movement.capacity
                  ? ` • سعة ${movement.capacity}`
                  : ""}
              </Text>
            </Box>
          </Group>

          <Badge
            size="lg"
            radius="md"
            color={shift.color}
            variant="light"
          >
            شفت {shift.label}
          </Badge>
        </Group>

        <Divider color="#e7eef6" />

        {/* Information */}

        <SimpleGrid
          cols={2}
          spacing="sm"
        >
          <InfoItem
            icon={
              <IconCalendar size={16} />
            }
            label="التاريخ"
            value={formatDate(
              movement.movement_date
            )}
          />

          <InfoItem
            icon={
              <IconMapPin size={16} />
            }
            label="المنطقة"
            value={
              movement.area_name || "-"
            }
          />

          <InfoItem
            icon={<IconUser size={16} />}
            label="السائق"
            value={
              movement.driver_name || "-"
            }
          />

          <InfoItem
            icon={
              <IconUsers size={16} />
            }
            label="المستخدم"
            value={
              movement.created_by_name ||
              movement.created_by_username ||
              "-"
            }
          />
        </SimpleGrid>

        {/* Route */}

        <Paper
          radius="lg"
          p="sm"
          style={{
            background:
              "linear-gradient(135deg, #f7faff, #eef6ff)",
            border:
              "1px solid #e3edf8",
          }}
        >
          <Group
            gap="xs"
            wrap="nowrap"
            align="flex-start"
          >
            <ThemeIcon
              size={30}
              radius="md"
              variant="light"
              color="blue"
            >
              <IconRoute size={16} />
            </ThemeIcon>

            <Box
              style={{
                minWidth: 0,
              }}
            >
              <Text
                size="xs"
                c="dimmed"
                fw={600}
              >
                مسار العمل
              </Text>

              <Text
                size="sm"
                fw={600}
                c="#273246"
                mt={2}
                style={{
                  overflowWrap:
                    "anywhere",
                }}
              >
                {movement.work_route ||
                  "-"}
              </Text>
            </Box>
          </Group>
        </Paper>

        {/* Actions */}

        {(canEdit || canDelete) && (
          <Group grow gap="sm">
            {canEdit && (
              <Button
                variant="light"
                color="blue"
                radius="md"
                leftSection={
                  <IconEdit size={17} />
                }
                onClick={() =>
                  onEdit(movement)
                }
              >
                تعديل
              </Button>
            )}

            {canDelete && (
              <Button
                variant="light"
                color="red"
                radius="md"
                leftSection={
                  <IconTrash size={17} />
                }
                onClick={() =>
                  onDelete(movement)
                }
              >
                حذف
              </Button>
            )}
          </Group>
        )}
      </Stack>
    </Card>
  );
}

/* =========================================================
   Info Item
========================================================= */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Group
      gap="xs"
      wrap="nowrap"
      align="flex-start"
    >
      <ThemeIcon
        size={30}
        radius="md"
        variant="light"
        color="blue"
        style={{
          flexShrink: 0,
        }}
      >
        {icon}
      </ThemeIcon>

      <Box
        style={{
          minWidth: 0,
        }}
      >
        <Text
          size="xs"
          c="dimmed"
        >
          {label}
        </Text>

        <Text
          size="sm"
          fw={700}
          c="#273246"
          truncate
          title={value}
        >
          {value}
        </Text>
      </Box>
    </Group>
  );
}

/* =========================================================
   Main Page
========================================================= */

export default function VehicleMovementsPage() {
  const isMobile =
    useMediaQuery("(max-width: 768px)");

  /* -------------------------------------------------------
     State
  ------------------------------------------------------- */

  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [movements, setMovements] =
    useState<Movement[]>([]);

  const [area, setArea] =
    useState<Area | null>(null);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [
    loadingOptions,
    setLoadingOptions,
  ] = useState(true);

  const [
    loadingMovements,
    setLoadingMovements,
  ] = useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /* -------------------------------------------------------
     Form
  ------------------------------------------------------- */

  const [movementDate, setMovementDate] =
    useState(getToday());

  const [shift, setShift] =
    useState<string | null>("A");

  const [vehicleId, setVehicleId] =
    useState<string | null>(null);

  const [driverName, setDriverName] =
    useState("");

  const [workRoute, setWorkRoute] =
    useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  /* -------------------------------------------------------
     Filters
  ------------------------------------------------------- */

  const [filterDate, setFilterDate] =
    useState<string | null>(null);

  const [filterShift, setFilterShift] =
    useState<string | null>(null);

  const [filterVehicle, setFilterVehicle] =
    useState<string | null>(null);

  /* -------------------------------------------------------
     Delete
  ------------------------------------------------------- */

  const [deleteMovement, setDeleteMovement] =
    useState<Movement | null>(null);

  /* =======================================================
     Load Options
  ======================================================= */

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      setError(null);

      const response = await fetch(
        "/api/vehicle-movements/options",
        {
          cache: "no-store",
        }
      );

      const result: OptionsResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "تعذر تحميل بيانات السيارات."
        );
      }

      setVehicles(
        result.vehicles || []
      );

      setArea(
        result.area || null
      );

      setIsAdmin(
        Boolean(result.isAdmin)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل البيانات."
      );
    } finally {
      setLoadingOptions(false);
    }
  };

  /* =======================================================
     Load Movements
  ======================================================= */

  const loadMovements = async () => {
    try {
      setLoadingMovements(true);

      const response = await fetch(
        "/api/vehicle-movements/list",
        {
          cache: "no-store",
        }
      );

      const result: ListResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "تعذر تحميل حركات السيارات."
        );
      }

      setMovements(
        result.data || []
      );

      if (result.area) {
        setArea(result.area);
      }

      if (
        typeof result.isAdmin ===
        "boolean"
      ) {
        setIsAdmin(
          result.isAdmin
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل الحركات."
      );
    } finally {
      setLoadingMovements(false);
    }
  };

  /* =======================================================
     Initial Load
  ======================================================= */

  useEffect(() => {
    loadOptions();
    loadMovements();
  }, []);

  /* =======================================================
     Vehicle Options
  ======================================================= */

  const vehicleOptions =
    useMemo(() => {
      return vehicles.map(
        (vehicle) => ({
          value: String(
            vehicle.id
          ),

          label: [
            vehicle.plate_number,

            vehicle.capacity
              ? `سعة ${vehicle.capacity}`
              : null,

            vehicle.model,

            isAdmin &&
            vehicle.area_name
              ? vehicle.area_name
              : null,
          ]
            .filter(Boolean)
            .join(" - "),
        })
      );
    }, [
      vehicles,
      isAdmin,
    ]);

  /* =======================================================
     Filter Vehicle Options
  ======================================================= */

  const filterVehicleOptions =
    useMemo(() => {
      return vehicles.map(
        (vehicle) => ({
          value: String(
            vehicle.id
          ),

          label: [
            vehicle.plate_number,

            isAdmin &&
            vehicle.area_name
              ? vehicle.area_name
              : null,
          ]
            .filter(Boolean)
            .join(" - "),
        })
      );
    }, [
      vehicles,
      isAdmin,
    ]);

  /* =======================================================
     Selected Vehicle
  ======================================================= */

  const selectedVehicle =
    useMemo(() => {
      if (!vehicleId) {
        return null;
      }

      return (
        vehicles.find(
          (vehicle) =>
            String(
              vehicle.id
            ) === vehicleId
        ) || null
      );
    }, [
      vehicleId,
      vehicles,
    ]);

  /* =======================================================
     Filtered Movements
  ======================================================= */

  const filteredMovements =
    useMemo(() => {
      return movements.filter(
        (movement) => {
          if (
            filterDate &&
            movement.movement_date !==
              filterDate
          ) {
            return false;
          }

          if (
            filterShift &&
            movement.shift !==
              filterShift
          ) {
            return false;
          }

          if (
            filterVehicle &&
            String(
              movement.vehicle_id
            ) !== filterVehicle
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      movements,
      filterDate,
      filterShift,
      filterVehicle,
    ]);

  /* =======================================================
     Today
  ======================================================= */

  const today = getToday();

  /* =======================================================
     Reset Form
  ======================================================= */

  const resetForm = () => {
    setEditingId(null);
    setMovementDate(today);
    setShift("A");
    setVehicleId(null);
    setDriverName("");
    setWorkRoute("");
  };

  /* =======================================================
     Edit
  ======================================================= */

  const handleEdit = (
    movement: Movement
  ) => {
    setEditingId(
      movement.id
    );

    setMovementDate(
      movement.movement_date
    );

    setShift(
      movement.shift
    );

    setVehicleId(
      String(
        movement.vehicle_id
      )
    );

    setDriverName(
      movement.driver_name ||
        ""
    );

    setWorkRoute(
      movement.work_route ||
        ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =======================================================
     Save
  ======================================================= */

  const handleSubmit =
    async () => {
      if (!movementDate) {
        setError(
          "يرجى اختيار التاريخ."
        );
        return;
      }

      if (!shift) {
        setError(
          "يرجى اختيار الشفت."
        );
        return;
      }

      if (!vehicleId) {
        setError(
          "يرجى اختيار السيارة."
        );
        return;
      }

      if (!driverName.trim()) {
        setError(
          "يرجى إدخال اسم السائق."
        );
        return;
      }

      if (!workRoute.trim()) {
        setError(
          "يرجى إدخال مسار العمل."
        );
        return;
      }

      try {
        setSaving(true);
        setError(null);

        const payload = {
          movement_date:
            movementDate,

          shift,

          vehicle_id:
            Number(vehicleId),

          driver_name:
            driverName.trim(),

          work_route:
            workRoute.trim(),
        };

        const response =
          await fetch(
            "/api/vehicle-movements",
            {
              method:
                editingId
                  ? "PUT"
                  : "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                editingId
                  ? {
                      id: editingId,
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
              "تعذر حفظ الحركة."
          );
        }

        resetForm();

        await loadMovements();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء حفظ الحركة."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     Delete
  ======================================================= */

  const confirmDelete =
    async () => {
      if (!deleteMovement) {
        return;
      }

      try {
        setDeleting(true);
        setError(null);

        const response =
          await fetch(
            `/api/vehicle-movements?id=${deleteMovement.id}`,
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
              "تعذر حذف الحركة."
          );
        }

        setDeleteMovement(null);

        await loadMovements();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء حذف الحركة."
        );
      } finally {
        setDeleting(false);
      }
    };

  /* =======================================================
     Clear Filters
  ======================================================= */

  const clearFilters = () => {
    setFilterDate(null);
    setFilterShift(null);
    setFilterVehicle(null);
  };

  const hasFilters =
    Boolean(filterDate) ||
    Boolean(filterShift) ||
    Boolean(filterVehicle);

  /* =======================================================
     Render
  ======================================================= */

  return (
    <Box
      dir="rtl"
      mih="100vh"
      style={{
        background:
          PAGE_BACKGROUND,
      }}
    >
      <Container
        size="xl"
        py={
          isMobile
            ? "md"
            : "xl"
        }
        px={
          isMobile
            ? "sm"
            : "lg"
        }
      >
        <Stack
          gap={
            isMobile
              ? "md"
              : "xl"
          }
        >
          {/* =================================================
              Header
          ================================================= */}

          <Card
            radius="xl"
            padding={
              isMobile
                ? "md"
                : "lg"
            }
            withBorder
            style={{
              background:
                "linear-gradient(135deg, #ffffff 0%, #f4f8ff 100%)",
              borderColor:
                "#dbe7f5",
              boxShadow:
                "0 12px 35px rgba(30, 64, 175, 0.08)",
            }}
          >
            <Flex
              justify="space-between"
              align={
                isMobile
                  ? "flex-start"
                  : "center"
              }
              direction={
                isMobile
                  ? "column"
                  : "row"
              }
              gap="md"
            >
              <Group
                gap="sm"
                wrap="nowrap"
                align="flex-start"
              >
                <ThemeIcon
                  size={
                    isMobile
                      ? 46
                      : 54
                  }
                  radius="xl"
                  variant="gradient"
                  gradient={
                    BLUE_GRADIENT
                  }
                >
                  <IconCar
                    size={
                      isMobile
                        ? 23
                        : 28
                    }
                  />
                </ThemeIcon>

                <Box>
                  <Group gap="xs">
                    <Title
                      order={
                        isMobile
                          ? 3
                          : 2
                      }
                      c="#182235"
                    >
                      حركات السيارات
                    </Title>

                    <Badge
                      size="sm"
                      radius="md"
                      variant="light"
                      color="blue"
                    >
                      {isAdmin
                        ? "Admin"
                        : "المستخدم"}
                    </Badge>
                  </Group>

                  <Text
                    size={
                      isMobile
                        ? "xs"
                        : "sm"
                    }
                    c="dimmed"
                    mt={5}
                  >
                    تسجيل ومتابعة حركة
                    السيارات اليومية
                  </Text>
                </Box>
              </Group>

              <Group
                gap="xs"
                wrap={
                  isMobile
                    ? "wrap"
                    : "nowrap"
                }
              >
                <Badge
                  size="lg"
                  radius="md"
                  variant="light"
                  color="blue"
                  leftSection={
                    <IconMapPin
                      size={14}
                    />
                  }
                >
                  {area?.name ||
                    (isAdmin
                      ? "جميع المناطق"
                      : "المنطقة")}
                </Badge>

                <Badge
                  size="lg"
                  radius="md"
                  variant="light"
                  color="cyan"
                  leftSection={
                    <IconCar
                      size={14}
                    />
                  }
                >
                  {
                    filteredMovements.length
                  }{" "}
                  حركة
                </Badge>
              </Group>
            </Flex>
          </Card>

          {/* =================================================
              Error
          ================================================= */}

          {error && (
            <Alert
              color="red"
              variant="light"
              radius="lg"
              icon={
                <IconAlertCircle
                  size={19}
                />
              }
              withCloseButton
              onClose={() =>
                setError(null)
              }
            >
              {error}
            </Alert>
          )}

          {/* =================================================
              Add / Edit
          ================================================= */}

          <Card
            radius="xl"
            padding={
              isMobile
                ? "md"
                : "xl"
            }
            withBorder
            style={{
              background:
                "linear-gradient(145deg, #ffffff 0%, #f5f9ff 100%)",
              borderColor:
                "#dce8f5",
              boxShadow:
                "0 10px 32px rgba(30, 64, 175, 0.06)",
            }}
          >
            <Stack gap="lg">
              <Group
                justify="space-between"
                align="center"
              >
                <Group gap="sm">
                  <ThemeIcon
                    size={38}
                    radius="lg"
                    variant="gradient"
                    gradient={
                      BLUE_GRADIENT
                    }
                  >
                    {editingId ? (
                      <IconEdit
                        size={20}
                      />
                    ) : (
                      <IconPlus
                        size={20}
                      />
                    )}
                  </ThemeIcon>

                  <Box>
                    <Text
                      fw={800}
                      size="lg"
                      c="#1b2538"
                    >
                      {editingId
                        ? "تعديل حركة السيارة"
                        : "إضافة حركة جديدة"}
                    </Text>

                    <Text
                      size="xs"
                      c="dimmed"
                      mt={2}
                    >
                      أدخل بيانات الحركة
                      بشكل صحيح قبل الحفظ
                    </Text>
                  </Box>
                </Group>

                {editingId && (
                  <Button
                    variant="subtle"
                    color="gray"
                    size="sm"
                    leftSection={
                      <IconX size={16} />
                    }
                    onClick={
                      resetForm
                    }
                  >
                    إلغاء التعديل
                  </Button>
                )}
              </Group>

              <Divider color="#e5edf6" />

              <SimpleGrid
                cols={{
                  base: 1,
                  sm: 2,
                  md: 3,
                  lg: 5,
                }}
                spacing="md"
              >
                {/* Date */}

                <TextInput
                  label="التاريخ"
                  placeholder="YYYY-MM-DD"
                  type="date"
                  value={
                    movementDate
                  }
                  onChange={(event) =>
                    setMovementDate(
                      event
                        .currentTarget
                        .value
                    )
                  }
                  leftSection={
                    <IconCalendar
                      size={17}
                    />
                  }
                  radius="md"
                  size="md"
                  styles={{
                    label: {
                      marginBottom: 7,
                      fontWeight: 700,
                      color: "#344054",
                    },
                  }}
                />

                {/* Shift */}

                <Select
                  label="الشفت"
                  placeholder="اختر الشفت"
                  value={shift}
                  onChange={setShift}
                  data={[
                    {
                      value: "A",
                      label: "A",
                    },
                    {
                      value: "B",
                      label: "B",
                    },
                    {
                      value: "C",
                      label: "C",
                    },
                  ]}
                  leftSection={
                    <IconClock
                      size={17}
                    />
                  }
                  rightSection={
                    <IconChevronDown
                      size={16}
                    />
                  }
                  radius="md"
                  size="md"
                  allowDeselect={
                    false
                  }
                  styles={{
                    label: {
                      marginBottom: 7,
                      fontWeight: 700,
                      color: "#344054",
                    },
                  }}
                />

                {/* Vehicle */}

                <Select
                styles={{
  label: {
    marginBottom: 7,
    fontWeight: 700,
    color: "#344054",
  },

  input: {
    fontSize: "13px",
  },

  option: {
    fontSize: "12px",
    padding: "8px 10px",
  },
}}
                  label="السيارة"
                  placeholder={
                    loadingOptions
                      ? "جاري التحميل..."
                      : "اختر السيارة"
                  }
                  searchable
                  clearable
                  value={vehicleId}
                  onChange={
                    setVehicleId
                  }
                  data={
                    vehicleOptions
                  }
                  disabled={
                    loadingOptions
                  }
                  leftSection={
                    loadingOptions ? (
                      <Loader
                        size={16}
                      />
                    ) : (
                      <IconCar
                        size={17}
                      />
                    )
                  }
                  rightSection={
                    <IconChevronDown
                      size={16}
                    />
                  }
                  radius="md"
                  size="md"
                  nothingFoundMessage="لا توجد سيارات"
                  
                />

                {/* Driver */}

                <TextInput
                  label="اسم السائق"
                  placeholder="أدخل اسم السائق"
                  value={
                    driverName
                  }
                  onChange={(event) =>
                    setDriverName(
                      event
                        .currentTarget
                        .value
                    )
                  }
                  leftSection={
                    <IconUser
                      size={17}
                    />
                  }
                  radius="md"
                  size="md"
                  styles={{
                    label: {
                      marginBottom: 7,
                      fontWeight: 700,
                      color: "#344054",
                    },
                  }}
                />

                {/* Area */}

                <TextInput
                  label="المنطقة"
                  value={
                    selectedVehicle?.area_name ||
                    area?.name ||
                    ""
                  }
                  readOnly
                  leftSection={
                    <IconMapPin
                      size={17}
                    />
                  }
                  radius="md"
                  size="md"
                  styles={{
                    input: {
                      background:
                        "#f0f6ff",
                      color:
                        "#64748b",
                      borderColor:
                        "#dce8f5",
                    },

                    label: {
                      marginBottom: 7,
                      fontWeight: 700,
                      color: "#344054",
                    },
                  }}
                />
              </SimpleGrid>

              {/* Route */}

              <TextInput
                label="مسار العمل"
                placeholder="أدخل مسار العمل"
                value={workRoute}
                onChange={(event) =>
                  setWorkRoute(
                    event
                      .currentTarget
                      .value
                  )
                }
                leftSection={
                  <IconRoute
                    size={17}
                  />
                }
                radius="md"
                size="md"
                styles={{
                  label: {
                    marginBottom: 7,
                    fontWeight: 700,
                    color: "#344054",
                  },
                }}
              />

              {/* Selected Vehicle */}

              {selectedVehicle && (
                <Paper
                  radius="lg"
                  p="sm"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(6,182,212,0.06))",
                    border:
                      "1px solid rgba(37,99,235,0.12)",
                  }}
                >
                  <Group
                    gap="md"
                    wrap="wrap"
                  >
                    <Group gap="xs">
                      <IconCar
                        size={17}
                        color="#2563eb"
                      />

                      <Text
                        size="sm"
                        fw={800}
                        c="#273246"
                      >
                        {
                          selectedVehicle.plate_number
                        }
                      </Text>
                    </Group>

                    {selectedVehicle.capacity && (
                      <Badge
                        variant="light"
                        color="blue"
                      >
                        سعة{" "}
                        {
                          selectedVehicle.capacity
                        }
                      </Badge>
                    )}

                    {selectedVehicle.model && (
                      <Badge
                        variant="light"
                        color="cyan"
                      >
                        {
                          selectedVehicle.model
                        }
                      </Badge>
                    )}

                    {isAdmin &&
                      selectedVehicle.area_name && (
                        <Badge
                          variant="light"
                          color="blue"
                          leftSection={
                            <IconMapPin
                              size={13}
                            />
                          }
                        >
                          {
                            selectedVehicle.area_name
                          }
                        </Badge>
                      )}
                  </Group>
                </Paper>
              )}

              {/* Submit */}

              <Group
                justify="flex-end"
                grow={isMobile}
              >
                {editingId && (
                  <Button
                    variant="light"
                    color="gray"
                    radius="md"
                    size="md"
                    onClick={
                      resetForm
                    }
                  >
                    إلغاء
                  </Button>
                )}

                <Button
                  radius="md"
                  size="md"
                  loading={saving}
                  leftSection={
                    editingId ? (
                      <IconCheck
                        size={18}
                      />
                    ) : (
                      <IconPlus
                        size={18}
                      />
                    )
                  }
                  variant="gradient"
                  gradient={
                    BLUE_GRADIENT
                  }
                  onClick={
                    handleSubmit
                  }
                >
                  {editingId
                    ? "حفظ التعديلات"
                    : "إضافة الحركة"}
                </Button>
              </Group>
            </Stack>
          </Card>

          {/* =================================================
              Filters
          ================================================= */}

          <Card
            radius="xl"
            padding={
              isMobile
                ? "md"
                : "lg"
            }
            withBorder
            style={{
              background:
                "linear-gradient(145deg, #f8fbff 0%, #eef5ff 100%)",
              borderColor:
                "#d7e5f5",
              boxShadow:
                "0 8px 26px rgba(30, 64, 175, 0.05)",
            }}
          >
            <Stack gap="md">
              <Flex
                justify="space-between"
                align={
                  isMobile
                    ? "flex-start"
                    : "center"
                }
                direction={
                  isMobile
                    ? "column"
                    : "row"
                }
                gap="sm"
              >
                <Group gap="sm">
                  <ThemeIcon
                    size={38}
                    radius="lg"
                    variant="gradient"
                    gradient={
                      BLUE_GRADIENT
                    }
                  >
                    <IconFilter
                      size={20}
                    />
                  </ThemeIcon>

                  <Box>
                    <Text
                      fw={800}
                      size="lg"
                      c="#1b2538"
                    >
                      الفلاتر
                    </Text>

                    <Text
                      size="xs"
                      c="dimmed"
                    >
                      تصفية الحركات حسب
                      التاريخ والشفت
                      والسيارة
                    </Text>
                  </Box>
                </Group>

                {hasFilters && (
                  <Button
                    variant="subtle"
                    color="blue"
                    size="sm"
                    leftSection={
                      <IconX size={16} />
                    }
                    onClick={
                      clearFilters
                    }
                  >
                    مسح الفلاتر
                  </Button>
                )}
              </Flex>

              <Divider color="#dfeaf6" />

              <SimpleGrid
                cols={{
                  base: 1,
                  sm: 2,
                  md: 3,
                }}
                spacing="md"
              >
                <TextInput
                  label="التاريخ"
                  placeholder="كل التواريخ"
                  type="date"
                  value={
                    filterDate || ""
                  }
                  onChange={(event) =>
                    setFilterDate(
                      event
                        .currentTarget
                        .value ||
                        null
                    )
                  }
                  leftSection={
                    <IconCalendar
                      size={17}
                    />
                  }
                  radius="md"
                  size="md"
                  styles={{
                    label: {
                      marginBottom: 7,
                      fontWeight: 700,
                      color: "#344054",
                    },
                  }}
                />

                <Select
                  label="الشفت"
                  placeholder="كل الشفتات"
                  clearable
                  value={
                    filterShift
                  }
                  onChange={
                    setFilterShift
                  }
                  data={[
                    {
                      value: "A",
                      label: "A",
                    },
                    {
                      value: "B",
                      label: "B",
                    },
                    {
                      value: "C",
                      label: "C",
                    },
                  ]}
                  leftSection={
                    <IconClock
                      size={17}
                    />
                  }
                  rightSection={
                    <IconChevronDown
                      size={16}
                    />
                  }
                  radius="md"
                  size="md"
                  styles={{
                    label: {
                      marginBottom: 7,
                      fontWeight: 700,
                      color: "#344054",
                    },
                  }}
                />

                <Select
                  label="السيارة"
                  placeholder="كل السيارات"
                  clearable
                  searchable
                  value={
                    filterVehicle
                  }
                  onChange={
                    setFilterVehicle
                  }
                  data={
                    filterVehicleOptions
                  }
                  leftSection={
                    <IconCar
                      size={17}
                    />
                  }
                  rightSection={
                    <IconChevronDown
                      size={16}
                    />
                  }
                  radius="md"
                  size="md"
                  nothingFoundMessage="لا توجد سيارات"
                  styles={{
                    label: {
                      marginBottom: 7,
                      fontWeight: 700,
                      color: "#344054",
                    },
                  }}
                />
              </SimpleGrid>

              {/* Results */}

              <Paper
                radius="lg"
                px="md"
                py="sm"
                style={{
                  background:
                    "rgba(255,255,255,0.78)",
                  border:
                    "1px solid #dfeaf6",
                }}
              >
                <Group
                  justify="space-between"
                >
                  <Group gap="xs">
                    <IconSearch
                      size={16}
                      color="#2563eb"
                    />

                    <Text
                      size="sm"
                      c="dimmed"
                    >
                      النتائج
                    </Text>
                  </Group>

                  <Badge
                    size="md"
                    radius="md"
                    variant="gradient"
                    gradient={
                      BLUE_GRADIENT
                    }
                  >
                    {
                      filteredMovements.length
                    }
                  </Badge>
                </Group>
              </Paper>
            </Stack>
          </Card>

          {/* =================================================
              Movements
          ================================================= */}

          <Card
            radius="xl"
            padding={
              isMobile
                ? "sm"
                : "lg"
            }
            withBorder
            style={{
              background:
                "rgba(255,255,255,0.90)",
              borderColor:
                "#dce7f3",
              boxShadow:
                "0 10px 30px rgba(30, 64, 175, 0.055)",
            }}
          >
            <Stack gap="md">
              {/* Header */}

              <Group
                justify="space-between"
                px={
                  isMobile
                    ? "xs"
                    : 0
                }
              >
                <Group gap="sm">
                  <ThemeIcon
                    size={38}
                    radius="lg"
                    variant="gradient"
                    gradient={
                      BLUE_GRADIENT
                    }
                  >
                    <IconClock
                      size={20}
                    />
                  </ThemeIcon>

                  <Box>
                    <Text
                      fw={800}
                      size="lg"
                      c="#1b2538"
                    >
                      سجل الحركات
                    </Text>

                    <Text
                      size="xs"
                      c="dimmed"
                    >
                      جميع الحركات المتاحة
                      حسب صلاحيات المستخدم
                    </Text>
                  </Box>
                </Group>

                {!isMobile && (
                  <Badge
                    size="lg"
                    variant="gradient"
                    gradient={
                      BLUE_GRADIENT
                    }
                  >
                    {
                      filteredMovements.length
                    }{" "}
                    حركة
                  </Badge>
                )}
              </Group>

              <Divider color="#e5edf6" />

              {/* Loading */}

              {loadingMovements ? (
                <Stack gap="sm">
                  {Array.from({
                    length:
                      isMobile
                        ? 4
                        : 5,
                  }).map(
                    (_, index) => (
                      <Skeleton
                        key={index}
                        height={
                          isMobile
                            ? 150
                            : 58
                        }
                        radius="lg"
                      />
                    )
                  )}
                </Stack>
              ) : filteredMovements.length ===
                0 ? (
                /* Empty */

                <Paper
                  radius="xl"
                  p="xl"
                  style={{
                    background:
                      "linear-gradient(145deg, #f8fbff, #f1f6fc)",
                    border:
                      "1px dashed #cbdbea",
                  }}
                >
                  <Stack
                    align="center"
                    gap="sm"
                  >
                    <ThemeIcon
                      size={60}
                      radius="xl"
                      variant="gradient"
                      gradient={
                        BLUE_GRADIENT
                      }
                    >
                      <IconSearch
                        size={28}
                      />
                    </ThemeIcon>

                    <Text
                      fw={800}
                      c="#344054"
                    >
                      لا توجد حركات
                    </Text>

                    <Text
                      size="sm"
                      c="dimmed"
                      ta="center"
                    >
                      لا توجد بيانات مطابقة
                      للفلاتر الحالية.
                    </Text>

                    {hasFilters && (
                      <Button
                        variant="light"
                        color="blue"
                        radius="md"
                        onClick={
                          clearFilters
                        }
                      >
                        مسح الفلاتر
                      </Button>
                    )}
                  </Stack>
                </Paper>
              ) : isMobile ? (
                /* =================================================
                   Mobile
                ================================================= */

                <Stack gap="sm">
                  {filteredMovements.map(
                    (movement) => {
                      const canEdit =
                        movement.movement_date ===
                        today;

                      const canDelete =
                        movement.movement_date ===
                        today;

                      return (
                        <MovementCard
                          key={
                            movement.id
                          }
                          movement={
                            movement
                          }
                          canEdit={
                            canEdit
                          }
                          canDelete={
                            canDelete
                          }
                          onEdit={
                            handleEdit
                          }
                          onDelete={
                            setDeleteMovement
                          }
                        />
                      );
                    }
                  )}
                </Stack>
              ) : (
                /* =================================================
                   Desktop Table
                ================================================= */

                <ScrollArea
                  type="auto"
                  offsetScrollbars
                  scrollbarSize={7}
                >
                  <Table
                    verticalSpacing="md"
                    horizontalSpacing="md"
                    highlightOnHover
                    style={{
                      minWidth: 1000,
                    }}
                  >
                    <Table.Thead>
                      <Table.Tr
                        style={{
                          background:
                            "linear-gradient(90deg, #f2f7ff, #eef8ff)",
                        }}
                      >
                        <Table.Th>
                          التاريخ
                        </Table.Th>

                        <Table.Th>
                          الشفت
                        </Table.Th>

                        <Table.Th>
                          السيارة
                        </Table.Th>

                        <Table.Th>
                          السائق
                        </Table.Th>

                        <Table.Th>
                          المنطقة
                        </Table.Th>

                        <Table.Th>
                          مسار العمل
                        </Table.Th>

                        <Table.Th>
                          المستخدم
                        </Table.Th>

                        <Table.Th ta="center">
                          الإجراءات
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                      {filteredMovements.map(
                        (movement) => {
                          const shift =
                            getShiftColor(
                              movement.shift
                            );

                          const canEdit =
                            movement.movement_date ===
                            today;

                          const canDelete =
                            movement.movement_date ===
                            today;

                          return (
                            <Table.Tr
                              key={
                                movement.id
                              }
                            >
                              <Table.Td>
                                <Group
                                  gap="xs"
                                  wrap="nowrap"
                                >
                                  <ThemeIcon
                                    size={32}
                                    radius="md"
                                    variant="light"
                                    color="blue"
                                  >
                                    <IconCalendar
                                      size={16}
                                    />
                                  </ThemeIcon>

                                  <Text
                                    size="sm"
                                    fw={700}
                                  >
                                    {formatDate(
                                      movement.movement_date
                                    )}
                                  </Text>
                                </Group>
                              </Table.Td>

                              <Table.Td>
                                <Badge
                                  color={
                                    shift.color
                                  }
                                  variant="light"
                                  radius="md"
                                >
                                  {
                                    shift.label
                                  }
                                </Badge>
                              </Table.Td>

                              <Table.Td>
                                <Group
                                  gap="xs"
                                  wrap="nowrap"
                                >
                                  <ThemeIcon
                                    size={34}
                                    radius="md"
                                    variant="gradient"
                                    gradient={
                                      BLUE_GRADIENT
                                    }
                                  >
                                    <IconCar
                                      size={17}
                                    />
                                  </ThemeIcon>

                                  <Box>
                                    <Text
                                      fw={800}
                                      size="sm"
                                    >
                                      {
                                        movement.plate_number
                                      }
                                    </Text>

                                    <Text
                                      size="xs"
                                      c="dimmed"
                                    >
                                      {[
                                        movement.model,

                                        movement.capacity
                                          ? `سعة ${movement.capacity}`
                                          : null,
                                      ]
                                        .filter(
                                          Boolean
                                        )
                                        .join(
                                          " • "
                                        )}
                                    </Text>
                                  </Box>
                                </Group>
                              </Table.Td>

                              <Table.Td>
                                <Text
                                  size="sm"
                                  fw={600}
                                >
                                  {movement.driver_name ||
                                    "-"}
                                </Text>
                              </Table.Td>

                              <Table.Td>
                                <Badge
                                  variant="light"
                                  color="blue"
                                  radius="md"
                                  leftSection={
                                    <IconMapPin
                                      size={13}
                                    />
                                  }
                                >
                                  {
                                    movement.area_name
                                  }
                                </Badge>
                              </Table.Td>

                              <Table.Td>
                                <Text
                                  size="sm"
                                  fw={600}
                                  maw={230}
                                  style={{
                                    overflowWrap:
                                      "anywhere",
                                  }}
                                >
                                  {
                                    movement.work_route
                                  }
                                </Text>
                              </Table.Td>

                              <Table.Td>
                                <Text
                                  size="sm"
                                  fw={600}
                                >
                                  {movement.created_by_name ||
                                    movement.created_by_username ||
                                    "-"}
                                </Text>
                              </Table.Td>

                              <Table.Td>
                                <Group
                                  justify="center"
                                  gap="xs"
                                >
                                  {canEdit && (
                                    <ActionIcon
                                      variant="light"
                                      color="blue"
                                      size="lg"
                                      radius="md"
                                      aria-label="تعديل"
                                      onClick={() =>
                                        handleEdit(
                                          movement
                                        )
                                      }
                                    >
                                      <IconEdit
                                        size={17}
                                      />
                                    </ActionIcon>
                                  )}

                                  {canDelete && (
                                    <ActionIcon
                                      variant="light"
                                      color="red"
                                      size="lg"
                                      radius="md"
                                      aria-label="حذف"
                                      onClick={() =>
                                        setDeleteMovement(
                                          movement
                                        )
                                      }
                                    >
                                      <IconTrash
                                        size={17}
                                      />
                                    </ActionIcon>
                                  )}
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          );
                        }
                      )}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              )}
            </Stack>
          </Card>
        </Stack>
      </Container>

      {/* =====================================================
          Delete Modal
      ===================================================== */}

      <Modal
        opened={Boolean(
          deleteMovement
        )}
        onClose={() =>
          !deleting &&
          setDeleteMovement(null)
        }
        centered
        fullScreen={
          Boolean(isMobile)
        }
        radius={
          isMobile
            ? 0
            : "xl"
        }
        title={
          <Group gap="sm">
            <ThemeIcon
              size={38}
              radius="lg"
              variant="light"
              color="red"
            >
              <IconTrash
                size={20}
              />
            </ThemeIcon>

            <Box>
              <Text
                fw={800}
                c="#182235"
              >
                حذف حركة السيارة
              </Text>

              <Text
                size="xs"
                c="dimmed"
              >
                تأكيد حذف السجل
              </Text>
            </Box>
          </Group>
        }
      >
        {deleteMovement && (
          <Stack gap="lg">
            <Paper
              radius="lg"
              p="md"
              style={{
                background:
                  "linear-gradient(135deg, #fff7f7, #fffafa)",
                border:
                  "1px solid #ffe0e0",
              }}
            >
              <Stack gap="sm">
                <Text
                  size="sm"
                  c="#344054"
                >
                  هل أنت متأكد من حذف حركة
                  السيارة التالية؟
                </Text>

                <Group gap="sm">
                  <Badge
                    size="lg"
                    color="blue"
                    variant="light"
                  >
                    {
                      deleteMovement.plate_number
                    }
                  </Badge>

                  <Badge
                    size="lg"
                    color="cyan"
                    variant="light"
                  >
                    شفت{" "}
                    {
                      deleteMovement.shift
                    }
                  </Badge>

                  <Badge
                    size="lg"
                    color="blue"
                    variant="light"
                  >
                    {
                      deleteMovement.area_name
                    }
                  </Badge>
                </Group>

                <Text
                  size="sm"
                  c="dimmed"
                >
                  التاريخ:{" "}
                  <Text
                    span
                    fw={700}
                    c="#344054"
                  >
                    {formatDate(
                      deleteMovement.movement_date
                    )}
                  </Text>
                </Text>
              </Stack>
            </Paper>

            <Alert
              color="red"
              variant="light"
              radius="lg"
              icon={
                <IconAlertCircle
                  size={18}
                />
              }
            >
              لا يمكن التراجع عن هذه
              العملية بعد الحذف.
            </Alert>

            <Group
              grow={isMobile}
              justify="flex-end"
            >
              <Button
                variant="light"
                color="gray"
                radius="md"
                disabled={deleting}
                onClick={() =>
                  setDeleteMovement(
                    null
                  )
                }
              >
                إلغاء
              </Button>

              <Button
                color="red"
                radius="md"
                loading={deleting}
                leftSection={
                  <IconTrash
                    size={17}
                  />
                }
                onClick={
                  confirmDelete
                }
              >
                حذف الحركة
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}