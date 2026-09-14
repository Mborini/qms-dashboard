"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Accordion,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import { DateInput } from "@mantine/dates";

import {
  IconCalendar,
  IconCar,
  IconChevronDown,
  IconMapPin,
  IconRefresh,
  IconRoute,
  IconSearch,
  IconUser,
  IconX,
} from "@tabler/icons-react";

import { bungee } from "../../layout";
import ExportMovementsExcel from "@/utils/ExportMovementsExcel";

/* =========================================================
   Types
========================================================= */

type Movement = {
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
};

/* =========================================================
   Helpers
========================================================= */

function getToday() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const parts = value.split("-");

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateTime(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ar-JO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeAreaName(value: string) {
  return String(value ?? "").trim();
}

function dateStringToDate(
  value: string | null
) {
  if (!value) {
    return null;
  }

  const parts = value.split("-");

  if (parts.length !== 3) {
    return null;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day
  );
}

function dateToString(
  value: Date | null
) {
  if (!value) {
    return null;
  }

  const year =
    value.getFullYear();

  const month = String(
    value.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    value.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* =========================================================
   Page
========================================================= */

export default function VehicleMovementsHistoryPage() {
  const [movements, setMovements] =
    useState<Movement[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     Search Filters

     IMPORTANT:
     هذه ليست Selects.

     لا يوجد أي data داخل الفلاتر.
     المستخدم يكتب القيمة بنفسه.
  ======================================================= */

  const [areaSearch, setAreaSearch] =
    useState("");

  const [dateFilter, setDateFilter] =
    useState<string | null>(
      getToday()
    );

  const [shiftSearch, setShiftSearch] =
    useState("");

  const [vehicleSearch, setVehicleSearch] =
    useState("");

  /* =======================================================
     Applied Filters

     نستخدمها حتى لا تتغير النتائج مع كل حرف.
     المستخدم يكتب ثم يضغط "بحث".
  ======================================================= */

  const [appliedArea, setAppliedArea] =
    useState("");

  const [appliedDate, setAppliedDate] =
    useState<string | null>(
      getToday()
    );

  const [appliedShift, setAppliedShift] =
    useState("");

  const [appliedVehicle, setAppliedVehicle] =
    useState("");

  /* =========================================================
     Load movements
  ========================================================= */

  const loadMovements = async () => {
    try {
      setError("");

      const response = await fetch(
        "/api/vehicle-movements/list",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result?.success
      ) {
        setError(
          result?.error ||
            "فشل تحميل حركات السيارات."
        );

        return;
      }

      setMovements(
        result.data || []
      );
    } catch (error) {
      console.error(
        "Vehicle movements history error:",
        error
      );

      setError(
        "حدث خطأ أثناء تحميل حركات السيارات."
      );
    }
  };

  /* =========================================================
     Initial load
  ========================================================= */

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      await loadMovements();

      setLoading(false);
    };

    load();
  }, []);

  /* =========================================================
     Refresh
  ========================================================= */

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadMovements();

    setRefreshing(false);
  };

  /* =========================================================
     Apply Search
  ========================================================= */

  const handleSearch = () => {
    setAppliedArea(
      areaSearch.trim()
    );

    setAppliedDate(
      dateFilter
    );

    setAppliedShift(
      shiftSearch.trim()
    );

    setAppliedVehicle(
      vehicleSearch.trim()
    );
  };

  /* =========================================================
     Clear Filters
  ========================================================= */

  const clearFilters = () => {
    setAreaSearch("");
    setDateFilter(getToday());
    setShiftSearch("");
    setVehicleSearch("");

    setAppliedArea("");
    setAppliedDate(getToday());
    setAppliedShift("");
    setAppliedVehicle("");
  };

  /* =========================================================
     Filtered Data
  ========================================================= */

  const filteredMovements =
    useMemo(() => {
      const areaQuery =
        normalizeText(
          appliedArea
        );

      const shiftQuery =
        normalizeText(
          appliedShift
        );

      const vehicleQuery =
        normalizeText(
          appliedVehicle
        );

      return movements.filter(
        (movement) => {
          /* ==============================================
             Area
          ============================================== */

          if (areaQuery) {
            const areaName =
              normalizeText(
                movement.area_name
              );

            if (
              !areaName.includes(
                areaQuery
              )
            ) {
              return false;
            }
          }

          /* ==============================================
             Date
          ============================================== */

          if (
            appliedDate &&
            movement.movement_date !==
              appliedDate
          ) {
            return false;
          }

          /* ==============================================
             Shift
          ============================================== */

          if (shiftQuery) {
            const shift =
              normalizeText(
                movement.shift
              );

            if (
              !shift.includes(
                shiftQuery
              )
            ) {
              return false;
            }
          }

          /* ==============================================
             Vehicle
          ============================================== */

          if (vehicleQuery) {
            const plate =
              normalizeText(
                movement.plate_number
              );

            if (
              !plate.includes(
                vehicleQuery
              )
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      movements,
      appliedArea,
      appliedDate,
      appliedShift,
      appliedVehicle,
    ]);

  /* =========================================================
     Group:

     Area
       Date
         Shift
           Table
  ========================================================= */

  const groupedData =
    useMemo(() => {
      type ShiftGroup = {
        shift: string;
        movements: Movement[];
      };

      type DateGroup = {
        date: string;
        shifts: ShiftGroup[];
      };

      type AreaGroup = {
        areaId: number;
        areaName: string;
        dates: DateGroup[];
      };

      const areas =
        new Map<
          number,
          {
            areaId: number;
            areaName: string;
            dates: Map<
              string,
              {
                date: string;
                shifts: Map<
                  string,
                  ShiftGroup
                >;
              }
            >;
          }
        >();

      filteredMovements.forEach(
        (movement) => {
          const areaId =
            movement.area_id;

          const areaName =
            normalizeAreaName(
              movement.area_name
            ) ||
            "غير محدد";

          if (
            !areas.has(areaId)
          ) {
            areas.set(
              areaId,
              {
                areaId,
                areaName,
                dates:
                  new Map(),
              }
            );
          }

          const area =
            areas.get(
              areaId
            )!;

          if (
            !area.dates.has(
              movement.movement_date
            )
          ) {
            area.dates.set(
              movement.movement_date,
              {
                date:
                  movement.movement_date,
                shifts:
                  new Map(),
              }
            );
          }

          const date =
            area.dates.get(
              movement.movement_date
            )!;

          if (
            !date.shifts.has(
              movement.shift
            )
          ) {
            date.shifts.set(
              movement.shift,
              {
                shift:
                  movement.shift,
                movements: [],
              }
            );
          }

          date.shifts
            .get(
              movement.shift
            )!
            .movements.push(
              movement
            );
        }
      );

      return Array.from(
        areas.values()
      )
        .sort((a, b) =>
          a.areaName.localeCompare(
            b.areaName,
            "ar"
          )
        )
        .map(
          (area) => ({
            areaId:
              area.areaId,

            areaName:
              area.areaName,

            dates:
              Array.from(
                area.dates.values()
              )
                .sort((a, b) =>
                  b.date.localeCompare(
                    a.date
                  )
                )
                .map(
                  (date) => ({
                    date:
                      date.date,

                    shifts:
                      Array.from(
                        date.shifts.values()
                      ).sort(
                        (a, b) =>
                          a.shift.localeCompare(
                            b.shift
                          )
                      ),
                  })
                ),
          })
        );
    }, [
      filteredMovements,
    ]);

  /* =========================================================
     Summary
  ========================================================= */

  const totalCount =
    filteredMovements.length;

  const totalAreas =
    groupedData.length;

  const totalVehicles =
    new Set(
      filteredMovements.map(
        (movement) =>
          movement.vehicle_id
      )
    ).size;

  /* =========================================================
     Loading
  ========================================================= */

  if (loading) {
    return (
      <Container
        size="xl"
        py="xl"
      >
        <Center h={400}>
          <Stack align="center">
            <Loader size="lg" />

            <Text c="dimmed">
              جاري تحميل حركات السيارات...
            </Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  /* =========================================================
     Render
  ========================================================= */

  return (
    <Box
      dir="rtl"
      style={{
        minHeight: "100vh",
      }}
    >
      <Container
        size="xl"
        py="xl"
      >
        <Stack gap="lg">

          {/* =====================================================
              Header
          ===================================================== */}

          <Group
            justify="space-between"
            align="center"
          >
            <Box>
              <Title
                order={2}
                className={
                  bungee.className
                }
              >
                حركات السيارات
              </Title>

              <Text
                size="sm"
                c="dimmed"
                mt={5}
              >
                البحث في سجل حركات السيارات
              </Text>
            </Box>

            <Group>
 <ExportMovementsExcel
  movements={filteredMovements}
  filterDate={appliedDate}
  filterShift={appliedShift}
  filterArea={appliedArea}
  filterVehicle={appliedVehicle}
/>

  <Button
    variant="light"
    leftSection={
      <IconRefresh size={17} />
    }
    loading={refreshing}
    onClick={handleRefresh}
  >
    تحديث
  </Button>
</Group>
          </Group>

          {/* =====================================================
              Error
          ===================================================== */}

          {error && (
            <Paper
              p="md"
              radius="md"
              withBorder
            >
              <Text
                c="red"
                fw={600}
              >
                {error}
              </Text>
            </Paper>
          )}

          {/* =====================================================
              Search
          ===================================================== */}

          <Paper
            p="md"
            radius="lg"
            withBorder
          >
            <Stack gap="md">

              <Group
                justify="space-between"
                align="center"
              >
                <Group gap="xs">

                  <Box
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      background:
                        "var(--mantine-color-blue-light)",
                    }}
                  >
                    <IconSearch
                      size={19}
                    />
                  </Box>

                  <Box>
                    <Text fw={700}>
                      البحث
                    </Text>

                    <Text
                      size="xs"
                      c="dimmed"
                    >
                      اكتب القيم المطلوبة
                      ثم اضغط بحث
                    </Text>
                  </Box>

                </Group>

                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  leftSection={
                    <IconX
                      size={15}
                    />
                  }
                  onClick={
                    clearFilters
                  }
                >
                  مسح
                </Button>
              </Group>

              <Divider />

              <Box
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 12,
                }}
              >

                {/* =================================================
                    Area
                ================================================= */}

                <TextInput
                  label="المنطقة"
                  placeholder="اكتب اسم المنطقة"
                  leftSection={
                    <IconMapPin
                      size={17}
                    />
                  }
                  value={
                    areaSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setAreaSearch(
                      event.currentTarget
                        .value
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleSearch();
                    }
                  }}
                />

                {/* =================================================
                    Date
                ================================================= */}

                <DateInput
                  label="التاريخ"
                  placeholder="اختر التاريخ"
                  leftSection={
                    <IconCalendar
                      size={17}
                    />
                  }
                  value={dateStringToDate(
                    dateFilter
                  )}
                  onChange={(
                    value
                  ) => {
                    setDateFilter(
                      dateToString(
                        value as any
                      )
                    );
                  }}
                  clearable
                  valueFormat="DD/MM/YYYY"
                  locale="ar"
                />

                {/* =================================================
                    Shift
                ================================================= */}

                <TextInput
                  label="الشفت"
                  placeholder="اكتب A أو B"
                  value={
                    shiftSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setShiftSearch(
                      event.currentTarget
                        .value
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleSearch();
                    }
                  }}
                />

                {/* =================================================
                    Vehicle
                ================================================= */}

                <TextInput
                  label="السيارة"
                  placeholder="اكتب رقم السيارة"
                  leftSection={
                    <IconCar
                      size={17}
                    />
                  }
                  value={
                    vehicleSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setVehicleSearch(
                      event.currentTarget
                        .value
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleSearch();
                    }
                  }}
                />

              </Box>

              {/* =================================================
                  Search Button
              ================================================= */}

              <Group
                justify="flex-start"
              >
                <Button
                  leftSection={
                    <IconSearch
                      size={17}
                    />
                  }
                  onClick={
                    handleSearch
                  }
                >
                  بحث
                </Button>
              </Group>

              {/* =================================================
                  Active Search Information
              ================================================= */}

              <Group gap="xs">

                {appliedArea && (
                  <Badge
                    variant="light"
                    color="blue"
                  >
                    المنطقة:{" "}
                    {appliedArea}
                  </Badge>
                )}

                {appliedDate && (
                  <Badge
                    variant="light"
                    color="gray"
                  >
                    التاريخ:{" "}
                    {formatDate(
                      appliedDate
                    )}
                  </Badge>
                )}

                {appliedShift && (
                  <Badge
                    variant="light"
                    color="teal"
                  >
                    الشفت:{" "}
                    {appliedShift}
                  </Badge>
                )}

                {appliedVehicle && (
                  <Badge
                    variant="light"
                    color="orange"
                  >
                    السيارة:{" "}
                    {appliedVehicle}
                  </Badge>
                )}

              </Group>

            </Stack>
          </Paper>

          {/* =====================================================
              Summary
          ===================================================== */}

          <Group gap="sm">

            <Badge
              size="lg"
              variant="light"
              color="blue"
            >
              الحركات:{" "}
              {totalCount}
            </Badge>

            <Badge
              size="lg"
              variant="light"
              color="green"
            >
              المناطق:{" "}
              {totalAreas}
            </Badge>

            <Badge
              size="lg"
              variant="light"
              color="orange"
            >
              السيارات:{" "}
              {totalVehicles}
            </Badge>

          </Group>

          {/* =====================================================
              No Data
          ===================================================== */}

          {filteredMovements.length ===
          0 ? (
            <Paper
              p="xl"
              radius="lg"
              withBorder
            >
              <Center py="xl">
                <Stack align="center">

                  <IconRoute
                    size={42}
                    stroke={1.5}
                  />

                  <Text
                    fw={700}
                    size="lg"
                  >
                    لا توجد حركات
                  </Text>

                  <Text
                    size="sm"
                    c="dimmed"
                  >
                    لا توجد بيانات مطابقة
                    للبحث المحدد.
                  </Text>

                </Stack>
              </Center>
            </Paper>
          ) : (

            /* =====================================================
               Area
            ===================================================== */

            <Accordion
              multiple
              chevron={
                <IconChevronDown
                  size={18}
                />
              }
              variant="separated"
              radius="md"
            >

              {groupedData.map(
                (area) => {

                  const areaCount =
                    area.dates.reduce(
                      (
                        total,
                        date
                      ) =>
                        total +
                        date.shifts.reduce(
                          (
                            shiftTotal,
                            shift
                          ) =>
                            shiftTotal +
                            shift
                              .movements
                              .length,
                          0
                        ),
                      0
                    );

                  return (
                    <Accordion.Item
                      key={
                        area.areaId
                      }
                      value={`area-${area.areaId}`}
                    >

                      {/* =================================================
                          Area Header
                      ================================================= */}

                      <Accordion.Control>
                        <Group
                          justify="space-between"
                          pr="sm"
                        >

                          <Group gap="sm">

                            <Box
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                background:
                                  "var(--mantine-color-blue-light)",
                              }}
                            >
                              <IconMapPin
                                size={20}
                              />
                            </Box>

                            <Box>

                              <Text fw={700}>
                                {
                                  area.areaName
                                }
                              </Text>

                              <Text
                                size="xs"
                                c="dimmed"
                              >
                                {
                                  area
                                    .dates
                                    .length
                                }{" "}
                                تاريخ
                              </Text>

                            </Box>

                          </Group>

                          <Badge
                            size="lg"
                            variant="light"
                          >
                            {
                              areaCount
                            }{" "}
                            حركة
                          </Badge>

                        </Group>
                      </Accordion.Control>

                      <Accordion.Panel>

                        {/* =================================================
                            Date
                        ================================================= */}

                        <Accordion
                          multiple
                          variant="contained"
                          radius="md"
                        >

                          {area.dates.map(
                            (
                              date
                            ) => {

                              const dateCount =
                                date.shifts.reduce(
                                  (
                                    total,
                                    shift
                                  ) =>
                                    total +
                                    shift
                                      .movements
                                      .length,
                                  0
                                );

                              return (
                                <Accordion.Item
                                  key={
                                    date.date
                                  }
                                  value={`date-${area.areaId}-${date.date}`}
                                >

                                  <Accordion.Control>
                                    <Group
                                      justify="space-between"
                                      pr="sm"
                                    >

                                      <Group gap="sm">

                                        <IconCalendar
                                          size={18}
                                        />

                                        <Text fw={600}>
                                          {formatDate(
                                            date.date
                                          )}
                                        </Text>

                                      </Group>

                                      <Badge
                                        variant="light"
                                        color="gray"
                                      >
                                        {
                                          dateCount
                                        }{" "}
                                        حركة
                                      </Badge>

                                    </Group>
                                  </Accordion.Control>

                                  <Accordion.Panel>

                                    {/* =================================================
                                        Shift
                                    ================================================= */}

                                    <Accordion
                                      multiple
                                      variant="default"
                                    >

                                      {date.shifts.map(
                                        (
                                          shift
                                        ) => (
                                          <Accordion.Item
                                            key={
                                              shift.shift
                                            }
                                            value={`shift-${area.areaId}-${date.date}-${shift.shift}`}
                                          >

                                            <Accordion.Control>
                                              <Group
                                                justify="space-between"
                                                pr="sm"
                                              >

                                                <Group gap="sm">

                                                  <Badge
                                                    size="lg"
                                                    color={
                                                      shift.shift ===
                                                      "A"
                                                        ? "blue"
                                                        : "orange"
                                                    }
                                                    variant="light"
                                                  >
                                                    {
                                                      shift.shift
                                                    }
                                                  </Badge>

                                                  <Text fw={600}>
                                                    الشفت{" "}
                                                    {
                                                      shift.shift
                                                    }
                                                  </Text>

                                                </Group>

                                                <Badge variant="light">
                                                  {
                                                    shift
                                                      .movements
                                                      .length
                                                  }{" "}
                                                  حركة
                                                </Badge>

                                              </Group>
                                            </Accordion.Control>

                                            {/* =================================================
                                                Table
                                            ================================================= */}

                                            <Accordion.Panel>

                                              <Box
                                                style={{
                                                  overflowX:
                                                    "auto",
                                                }}
                                              >

                                                <Table
                                                  striped
                                                  highlightOnHover
                                                  withTableBorder
                                                  withColumnBorders
                                                  verticalSpacing="sm"
                                                  miw={
                                                    1100
                                                  }
                                                >

                                                  <Table.Thead>

                                                    <Table.Tr>

                                                      <Table.Th>
                                                        #
                                                      </Table.Th>

                                                      <Table.Th>
                                                        رقم السيارة
                                                      </Table.Th>

                                                      <Table.Th>
                                                        اسم السائق
                                                      </Table.Th>

                                                      <Table.Th>
                                                        النوع
                                                      </Table.Th>

                                                      <Table.Th>
                                                        الموديل
                                                      </Table.Th>

                                                      <Table.Th>
                                                        السعة
                                                      </Table.Th>

                                                      <Table.Th>
                                                        مسار العمل
                                                      </Table.Th>

                                                      <Table.Th>
                                                        المسجل
                                                      </Table.Th>

                                                      <Table.Th>
                                                        وقت التسجيل
                                                      </Table.Th>

                                                    </Table.Tr>

                                                  </Table.Thead>

                                                  <Table.Tbody>

                                                    {shift.movements.map(
                                                      (
                                                        movement,
                                                        index
                                                      ) => (
                                                        <Table.Tr
                                                          key={
                                                            movement.id
                                                          }
                                                        >

                                                          <Table.Td>
                                                            <Text
                                                              size="sm"
                                                              fw={600}
                                                            >
                                                              {
                                                                index +
                                                                1
                                                              }
                                                            </Text>
                                                          </Table.Td>

                                                          <Table.Td>

                                                            <Group
                                                              gap={
                                                                6
                                                              }
                                                              wrap="nowrap"
                                                            >

                                                              <IconCar
                                                                size={
                                                                  16
                                                                }
                                                              />

                                                              <Text
                                                                fw={
                                                                  700
                                                                }
                                                              >
                                                                {
                                                                  movement.plate_number
                                                                }
                                                              </Text>

                                                            </Group>

                                                          </Table.Td>

                                                          <Table.Td>

                                                            <Group
                                                              gap={
                                                                6
                                                              }
                                                              wrap="nowrap"
                                                            >

                                                              <IconUser
                                                                size={
                                                                  16
                                                                }
                                                              />

                                                              <Text
                                                                fw={
                                                                  600
                                                                }
                                                              >
                                                                {
                                                                  movement.driver_name ||
                                                                  "-"
                                                                }
                                                              </Text>

                                                            </Group>

                                                          </Table.Td>

                                                          <Table.Td>
                                                            {
                                                              movement.type ||
                                                              "-"
                                                            }
                                                          </Table.Td>

                                                          <Table.Td>
                                                            {
                                                              movement.model ||
                                                              "-"
                                                            }
                                                          </Table.Td>

                                                          <Table.Td>
                                                            {
                                                              movement.capacity ??
                                                              "-"
                                                            }
                                                          </Table.Td>

                                                          <Table.Td>

                                                            <Group
                                                              gap={
                                                                6
                                                              }
                                                              wrap="nowrap"
                                                            >

                                                              <IconRoute
                                                                size={
                                                                  16
                                                                }
                                                              />

                                                              <Text
                                                                size="sm"
                                                                maw={
                                                                  300
                                                                }
                                                                truncate
                                                                title={
                                                                  movement.work_route
                                                                }
                                                              >
                                                                {
                                                                  movement.work_route
                                                                }
                                                              </Text>

                                                            </Group>

                                                          </Table.Td>

                                                          <Table.Td>

                                                            <Text
                                                              size="sm"
                                                            >
                                                              {
                                                                movement.created_by_name ||
                                                                movement.created_by_username ||
                                                                "-"
                                                              }
                                                            </Text>

                                                          </Table.Td>

                                                          <Table.Td>

                                                            <Text
                                                              size="sm"
                                                              c="dimmed"
                                                            >
                                                              {formatDateTime(
                                                                movement.created_at
                                                              )}
                                                            </Text>

                                                          </Table.Td>

                                                        </Table.Tr>
                                                      )
                                                    )}

                                                  </Table.Tbody>

                                                </Table>

                                              </Box>

                                            </Accordion.Panel>

                                          </Accordion.Item>
                                        )
                                      )}

                                    </Accordion>

                                  </Accordion.Panel>

                                </Accordion.Item>
                              );
                            }
                          )}

                        </Accordion>

                      </Accordion.Panel>

                    </Accordion.Item>
                  );
                }
              )}

            </Accordion>
          )}

        </Stack>
      </Container>
    </Box>
  );
}