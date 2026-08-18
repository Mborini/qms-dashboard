"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Box,
  Button,
  Divider,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  ActionIcon,
} from "@mantine/core";

import {
  IconAlertCircle,
  IconBox,
  IconEdit,
  IconMapPin,
  IconPlus,
  IconRoad,
  IconRoute,
  IconSend,
  IconTrash,
  IconTruck,
  IconX,
} from "@tabler/icons-react";

import {
  districts,
  noteTypes,
  getBlocksByDistrict,
  getVehiclesByDistrict,
} from "@/data/routeNotes";

export default function RouteNotesForm({
  district,
  onDistrictChange,
  onSaveNote,
  editingNote,
  onCancelEdit,
}) {
  // ========================================
  // State
  // ========================================

  const [block, setBlock] =
    useState(null);

  const [vehicle, setVehicle] =
    useState(null);

  const [noteType, setNoteType] =
    useState(null);

  const [streets, setStreets] =
    useState([
      {
        name: "",
        containerCount: "",
      },
    ]);

  const [loading, setLoading] =
    useState(false);

  // ========================================
  // Available Data
  // ========================================

  const availableBlocks =
    getBlocksByDistrict(district);

  const availableVehicles =
    getVehiclesByDistrict(district);

  const selectedNoteType =
    noteTypes.find(
      (item) =>
        item.value === noteType
    );

  // ========================================
  // Reset Form
  // ========================================

  const resetForm = () => {
    setBlock(null);

    setVehicle(null);

    setNoteType(null);

    setStreets([
      {
        name: "",
        containerCount: "",
      },
    ]);
  };

  // ========================================
  // Load Editing Data
  // ========================================

  useEffect(() => {
    if (!editingNote) {
      resetForm();
      return;
    }

    // --------------------------------------
    // District
    // --------------------------------------

    onDistrictChange(
      editingNote.district
    );

    // --------------------------------------
    // Vehicle
    // --------------------------------------

    setVehicle(
      editingNote.vehicle
    );

    // --------------------------------------
    // Note Type
    // --------------------------------------

    setNoteType(
      editingNote.noteType
    );

    // --------------------------------------
    // Block
    // --------------------------------------

    const editBlocks =
      getBlocksByDistrict(
        editingNote.district
      );

    const selectedBlock =
      editBlocks.find(
        (item) =>
          item.label ===
            editingNote.block ||
          item.value ===
            editingNote.block
      );

    setBlock(
      selectedBlock?.value ||
        editingNote.block
    );

    // --------------------------------------
    // Streets
    // --------------------------------------

    if (
      editingNote.streets?.length
    ) {
      setStreets(
        editingNote.streets.map(
          (street) => ({
            name:
              street.name || "",

            containerCount:
              street.containerCount ??
              "",
          })
        )
      );
    } else {
      setStreets([
        {
          name: "",
          containerCount: "",
        },
      ]);
    }
  }, [editingNote]);

  // ========================================
  // District Change
  // ========================================

  const handleDistrictChange = (
    value
  ) => {
    onDistrictChange(value);

    setBlock(null);

    setVehicle(null);

    setNoteType(null);

    setStreets([
      {
        name: "",
        containerCount: "",
      },
    ]);
  };

  // ========================================
  // Note Type Change
  // ========================================

  const handleNoteTypeChange = (
    value
  ) => {
    setNoteType(value);

    const selected =
      noteTypes.find(
        (item) =>
          item.value === value
      );

    if (
      selected?.requiresStreet
    ) {
      setStreets([
        {
          name: "",
          containerCount: "",
        },
      ]);
    } else {
      setStreets([]);
    }
  };

  // ========================================
  // Street Name
  // ========================================

  const handleStreetNameChange = (
    index,
    value
  ) => {
    setStreets((current) =>
      current.map(
        (street, i) =>
          i === index
            ? {
                ...street,
                name: value,
              }
            : street
      )
    );
  };

  // ========================================
  // Container Count
  // ========================================

  const handleContainerChange = (
    index,
    value
  ) => {
    setStreets((current) =>
      current.map(
        (street, i) =>
          i === index
            ? {
                ...street,
                containerCount:
                  value,
              }
            : street
      )
    );
  };

  // ========================================
  // Add Street
  // ========================================

  const addStreet = () => {
    setStreets((current) => [
      ...current,
      {
        name: "",
        containerCount: "",
      },
    ]);
  };

  // ========================================
  // Remove Street
  // ========================================

  const removeStreet = (
    index
  ) => {
    setStreets((current) =>
      current.filter(
        (_, i) =>
          i !== index
      )
    );
  };

  // ========================================
  // Cancel
  // ========================================

  const handleCancel = () => {
    resetForm();

    onCancelEdit();
  };

  // ========================================
  // Submit
  // ========================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    // --------------------------------------
    // Validation
    // --------------------------------------

    if (
      !district ||
      !block ||
      !vehicle ||
      !noteType
    ) {
      return;
    }

    // --------------------------------------
    // Find Block
    // --------------------------------------

    const selectedBlock =
      availableBlocks.find(
        (item) =>
          item.value === block
      );

    // مهم:
    // نخزن الاسم وليس الرقم

    const blockName =
      selectedBlock?.label ||
      block;

    // --------------------------------------
    // Streets
    // --------------------------------------

    let cleanStreets = [];

    if (
      selectedNoteType?.requiresStreet
    ) {
      cleanStreets = streets
        .map((street) => ({
          name:
            street.name.trim(),

          containerCount:
            Number(
              street.containerCount ||
                0
            ),
        }))
        .filter(
          (street) =>
            street.name.length > 0
        );

      // يجب وجود شارع
      if (
        cleanStreets.length === 0
      ) {
        return;
      }

      // كل شارع يجب أن يحتوي
      // على عدد حاويات
      const invalidStreet =
        cleanStreets.some(
          (street) =>
            street.containerCount <=
            0
        );

      if (invalidStreet) {
        return;
      }
    }

    // --------------------------------------
    // Build Note
    // --------------------------------------

    const note = {
      id:
        editingNote?.id ||
        crypto.randomUUID(),

      district,

      block: blockName,

      vehicle,

      noteType,

      streets: cleanStreets,

      createdAt:
        editingNote?.createdAt ||
        new Date(),
    };

    // --------------------------------------
    // Save
    // --------------------------------------

    try {
      setLoading(true);

      const saved =
        onSaveNote(note);

      // إذا فشل الحفظ بسبب التكرار
      // الـ Page ستلغي التعديل
      // وننظف الفورم

      if (saved === false) {
        resetForm();
        return;
      }

      resetForm();
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <Paper
      withBorder
      radius="xl"
      p="xl"
      shadow="sm"
      style={{
        borderColor:
          editingNote
            ? "#ffe8cc"
            : "#edf0f2",
      }}
    >
      <Stack gap="lg">

        {/* ================================= */}
        {/* Header */}
        {/* ================================= */}

        <Group gap="sm">

          <ThemeIcon
            size={44}
            radius="md"
            variant="light"
            color={
              editingNote
                ? "orange"
                : "blue"
            }
          >
            {editingNote ? (
              <IconEdit
                size={23}
              />
            ) : (
              <IconRoute
                size={23}
              />
            )}
          </ThemeIcon>

          <Box>
            <Title order={3}>
              {editingNote
                ? "تعديل الملاحظة"
                : "تسجيل ملاحظة"}
            </Title>

            <Text
              size="sm"
              c="dimmed"
              mt={4}
            >
              {editingNote
                ? "قم بتعديل البيانات ثم احفظ التغييرات"
                : "تسجيل ملاحظات مسارات المركبات"}
            </Text>
          </Box>

        </Group>

        <Divider />

        {/* ================================= */}
        {/* Form */}
        {/* ================================= */}

        <form
          onSubmit={handleSubmit}
        >
          <Stack gap="md">

            {/* المنطقة */}

            <Select
              label="المنطقة"
              placeholder="اختر المنطقة"
              data={districts}
              value={district}
              onChange={
                handleDistrictChange
              }
              searchable
              clearable
              required
              leftSection={
                <IconMapPin
                  size={18}
                />
              }
            />

            {/* القطعة */}

            <Select
              label="القطعة"
              placeholder="اختر القطعة"
              data={availableBlocks}
              value={block}
              onChange={setBlock}
              searchable
              clearable
              disabled={!district}
              required
              leftSection={
                <IconMapPin
                  size={18}
                />
              }
            />

            {/* المركبة */}

            <Select
              label="المركبة"
              placeholder="اختر المركبة"
              data={availableVehicles}
              value={vehicle}
              onChange={setVehicle}
              searchable
              clearable
              disabled={!district}
              required
              leftSection={
                <IconTruck
                  size={18}
                />
              }
            />

            {/* نوع الملاحظة */}

            <Select
              label="نوع الملاحظة"
              placeholder="اختر نوع الملاحظة"
              data={noteTypes}
              value={noteType}
              onChange={
                handleNoteTypeChange
              }
              searchable
              clearable
              required
              leftSection={
                <IconAlertCircle
                  size={18}
                />
              }
            />

            {/* ================================= */}
            {/* Streets */}
            {/* ================================= */}

            {selectedNoteType
              ?.requiresStreet && (
              <Stack gap="sm">

                <Group
                  justify="space-between"
                >

                  <Box>
                    <Text
                      size="sm"
                      fw={700}
                    >
                      الشوارع
                    </Text>

                    <Text
                      size="xs"
                      c="dimmed"
                    >
                      أضف كل شارع وعدد
                      الحاويات الموجودة عليه
                    </Text>
                  </Box>

                  <Button
                    type="button"
                    size="xs"
                    variant="light"
                    leftSection={
                      <IconPlus
                        size={15}
                      />
                    }
                    onClick={
                      addStreet
                    }
                  >
                    إضافة شارع
                  </Button>

                </Group>

                <Stack gap="xs">

                  {streets.map(
                    (
                      street,
                      index
                    ) => (
                      <Paper
                        key={index}
                        withBorder
                        p="sm"
                        radius="md"
                      >
                        <Group
                          align="flex-end"
                          wrap="nowrap"
                        >

                          <TextInput
                            style={{
                              flex: 1,
                            }}
                            label={`الشارع ${
                              index + 1
                            }`}
                            placeholder="اكتب اسم الشارع"
                            value={
                              street.name
                            }
                            onChange={(
                              event
                            ) =>
                              handleStreetNameChange(
                                index,
                                event
                                  .currentTarget
                                  .value
                              )
                            }
                            leftSection={
                              <IconRoad
                                size={18}
                              />
                            }
                            required
                          />

                          <NumberInput
                            w={145}
                            label="الحاويات"
                            placeholder="العدد"
                            min={1}
                            allowDecimal={
                              false
                            }
                            value={
                              street.containerCount
                            }
                            onChange={(
                              value
                            ) =>
                              handleContainerChange(
                                index,
                                value
                              )
                            }
                            leftSection={
                              <IconBox
                                size={18}
                              />
                            }
                            required
                          />

                          {streets.length >
                            1 && (
                            <ActionIcon
                              type="button"
                              color="red"
                              variant="light"
                              size="lg"
                              onClick={() =>
                                removeStreet(
                                  index
                                )
                              }
                            >
                              <IconTrash
                                size={18}
                              />
                            </ActionIcon>
                          )}

                        </Group>
                      </Paper>
                    )
                  )}

                </Stack>

              </Stack>
            )}

            <Divider my="xs" />

            {/* ================================= */}
            {/* Buttons */}
            {/* ================================= */}

            <Group grow>

              {editingNote && (
                <Button
                  type="button"
                  variant="light"
                  color="gray"
                  leftSection={
                    <IconX
                      size={18}
                    />
                  }
                  onClick={
                    handleCancel
                  }
                >
                  إلغاء التعديل
                </Button>
              )}

              <Button
                type="submit"
                loading={loading}
                disabled={
                  !district ||
                  !block ||
                  !vehicle ||
                  !noteType
                }
                color={
                  editingNote
                    ? "orange"
                    : "blue"
                }
                leftSection={
                  editingNote ? (
                    <IconEdit
                      size={18}
                    />
                  ) : (
                    <IconSend
                      size={18}
                    />
                  )
                }
              >
                {editingNote
                  ? "حفظ التعديل"
                  : "تسجيل الملاحظة"}
              </Button>

            </Group>

          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}