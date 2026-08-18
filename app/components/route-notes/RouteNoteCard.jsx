"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";

import {
  IconAlertTriangle,
  IconBox,
  IconClock,
  IconEdit,
  IconMapPin,
  IconRoad,
  IconTrash,
  IconTruck,
} from "@tabler/icons-react";

import {
  getNoteType,
} from "@/data/routeNotes";

export default function RouteNoteCard({
  note,
  onEdit,
  onDelete,
}) {
  const type = getNoteType(
    note.noteType
  );

  const createdAt = note.createdAt
    ? new Date(note.createdAt)
    : null;

  const totalContainers =
    note.streets?.reduce(
      (total, street) =>
        total +
        Number(
          street.containerCount || 0
        ),
      0
    ) || 0;

  return (
    <Paper
      radius="lg"
      p="md"
      withBorder
      style={{
        borderColor: "#edf0f2",
        background: "#ffffff",
        transition:
          "transform 150ms ease, box-shadow 150ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform =
          "translateY(-2px)";

        event.currentTarget.style.boxShadow =
          "0 8px 25px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform =
          "translateY(0)";

        event.currentTarget.style.boxShadow =
          "none";
      }}
    >
      <Stack gap="sm">

        {/* ================================= */}
        {/* Header */}
        {/* ================================= */}

        <Group
          justify="space-between"
          align="center"
        >
          <Group gap="sm">

            <ThemeIcon
              size={38}
              radius="xl"
              variant="light"
              color={
                type?.color || "gray"
              }
            >
              <IconAlertTriangle
                size={19}
                stroke={1.6}
              />
            </ThemeIcon>

            <Box>
              <Text
                size="sm"
                fw={700}
              >
                {type?.label ||
                  note.noteType}
              </Text>

              <Group
                gap={4}
                mt={3}
              >
                <IconClock
                  size={12}
                />

                <Text
                  size="xs"
                  c="dimmed"
                >
                  {createdAt
                    ? createdAt.toLocaleTimeString(
                        "ar-JO",
                        {
                          hour: "2-digit",
                          minute:
                            "2-digit",
                        }
                      )
                    : "الآن"}
                </Text>
              </Group>
            </Box>

          </Group>

          {/* Actions */}

          <Group gap={3}>

            <Tooltip label="تعديل">
              <ActionIcon
                variant="subtle"
                color="blue"
                radius="xl"
                onClick={() =>
                  onEdit?.(note)
                }
              >
                <IconEdit
                  size={17}
                />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="حذف">
              <ActionIcon
                variant="subtle"
                color="red"
                radius="xl"
                onClick={() =>
                  onDelete?.(
                    note.id
                  )
                }
              >
                <IconTrash
                  size={17}
                />
              </ActionIcon>
            </Tooltip>

          </Group>
        </Group>

        {/* ================================= */}
        {/* Type */}
        {/* ================================= */}

        <Badge
          size="sm"
          radius="xl"
          variant="light"
          color={
            type?.color || "gray"
          }
          w="fit-content"
        >
          {type?.label ||
            note.noteType}
        </Badge>

        {/* ================================= */}
        {/* Information */}
        {/* ================================= */}

        <SimpleGrid
          cols={2}
          spacing="xs"
        >
          <Info
            icon={
              <IconMapPin
                size={15}
              />
            }
            label="المنطقة"
            value={note.district}
          />

          <Info
            icon={
              <IconMapPin
                size={15}
              />
            }
            label="القطعة"
            value={note.block}
          />

          <Info
            icon={
              <IconTruck
                size={15}
              />
            }
            label="المركبة"
            value={note.vehicle}
          />

          {note.streets?.length >
            0 && (
            <Info
              icon={
                <IconBox
                  size={15}
                />
              }
              label="إجمالي الحاويات"
              value={
                totalContainers
              }
            />
          )}
        </SimpleGrid>

        {/* ================================= */}
        {/* Streets */}
        {/* ================================= */}

        {note.streets?.length >
          0 && (
          <>
            <Divider
              color="gray.2"
            />

            <Group
              justify="space-between"
            >
              <Group gap={6}>

                <ThemeIcon
                  size={28}
                  radius="xl"
                  variant="light"
                  color="orange"
                >
                  <IconRoad
                    size={15}
                  />
                </ThemeIcon>

                <Text
                  size="xs"
                  fw={700}
                >
                  الشوارع
                </Text>

              </Group>

              <Badge
                size="xs"
                radius="xl"
                variant="light"
                color="gray"
              >
                {note.streets.length}
              </Badge>
            </Group>

            <Stack gap={5}>

              {note.streets.map(
                (
                  street,
                  index
                ) => (
                  <Group
                    key={`${street.name}-${index}`}
                    justify="space-between"
                    wrap="nowrap"
                    px="xs"
                    py={6}
                    style={{
                      borderRadius: 8,
                      background:
                        "#f8f9fa",
                    }}
                  >

                    <Group
                      gap="xs"
                      wrap="nowrap"
                    >
                      <Text
                        size="xs"
                        c="dimmed"
                        fw={600}
                        w={18}
                      >
                        {index + 1}
                      </Text>

                      <Text
                        size="xs"
                        fw={600}
                      >
                        {street.name}
                      </Text>
                    </Group>

                    <Badge
                      size="xs"
                      radius="xl"
                      variant="light"
                      color="teal"
                      leftSection={
                        <IconBox
                          size={11}
                        />
                      }
                    >
                      {
                        street.containerCount
                      }
                    </Badge>

                  </Group>
                )
              )}

            </Stack>
          </>
        )}

      </Stack>
    </Paper>
  );
}

// ========================================
// Info Component
// ========================================

function Info({
  icon,
  label,
  value,
}) {
  return (
    <Group
      gap="xs"
      wrap="nowrap"
    >
      <ThemeIcon
        size={30}
        radius="xl"
        variant="light"
        color="gray"
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
          size="xs"
          fw={650}
          mt={2}
          truncate
        >
          {value || "-"}
        </Text>
      </Box>
    </Group>
  );
}