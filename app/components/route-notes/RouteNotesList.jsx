"use client";

import {
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconFileSpreadsheet,
} from "@tabler/icons-react";

import {
  exportRouteNotesExcel,
} from "@/utils/routeNotesExcel";
import {
  IconClipboardList,
  IconFileTypePdf,
  IconNotes,
  IconRoute,
} from "@tabler/icons-react";

import RouteNoteCard from "./RouteNoteCard";

import {
  exportRouteNotesPdf,
} from "@/utils/routeNotesPdf";

export default function RouteNotesList({
  district,
  notes = [],
  onEdit,
  onDelete,
}) {
  // =====================================================
  // Export PDF
  // =====================================================

const handleExportPDF = () => {
  exportRouteNotesPdf({
    notes,
    district,
  });
};

  // =====================================================
  // Empty State
  // =====================================================

  if (notes.length === 0) {
    return (
      <Paper
        radius="xl"
        p="lg"
        withBorder
        style={{
          borderColor: "#edf0f2",
          background: "#fafbfc",
        }}
      >
        <Stack gap="md">

          {/* Header */}

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
                <IconClipboardList
                  size={21}
                  stroke={1.7}
                />
              </ThemeIcon>

              <Box>

                <Title
                  order={4}
                  fw={700}
                >
                  الملاحظات المسجلة
                </Title>

                <Text
                  size="xs"
                  c="dimmed"
                  mt={3}
                >
                  لا توجد ملاحظات مسجلة
                </Text>

              </Box>

            </Group>

          </Group>

          <Divider color="gray.2" />

          {/* Empty */}

          <Center py={70}>

            <Stack
              align="center"
              gap="sm"
            >

              <ThemeIcon
                size={64}
                radius="xl"
                variant="light"
                color="gray"
              >
                <IconRoute
                  size={30}
                  stroke={1.4}
                />
              </ThemeIcon>

              <Box ta="center">

                <Text
                  size="sm"
                  fw={600}
                >
                  لا توجد ملاحظات بعد
                </Text>

                <Text
                  size="xs"
                  c="dimmed"
                  mt={4}
                >
                  قم بتسجيل ملاحظة من
                  النموذج وستظهر هنا
                </Text>

              </Box>

            </Stack>

          </Center>

        </Stack>
      </Paper>
    );
  }

  // =====================================================
  // List
  // =====================================================

  return (
    <Paper
      radius="xl"
      p="lg"
      withBorder
      style={{
        borderColor: "#edf0f2",
        background: "#fafbfc",
      }}
    >
      <Stack gap="md">

        {/* =================================================
            Header
            ================================================= */}

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
              <IconClipboardList
                size={21}
                stroke={1.7}
              />
            </ThemeIcon>

            <Box>

              <Group gap={8}>

                <Title
                  order={4}
                  fw={700}
                >
                  الملاحظات المسجلة
                </Title>

                <Badge
                  size="sm"
                  radius="xl"
                  variant="light"
                  color="blue"
                >
                  {notes.length}
                </Badge>

              </Group>

              <Text
                size="xs"
                c="dimmed"
                mt={3}
              >
                {district
                  ? `الملاحظات في ${district}`
                  : "جميع الملاحظات المسجلة"}
              </Text>

            </Box>

          </Group>

          {/* =================================================
              Actions
              ================================================= */}

          <Group gap="xs">

            <Group
              gap={5}
              c="dimmed"
            >

              <IconNotes
                size={16}
              />

              <Text size="xs">
                {notes.length} ملاحظة
              </Text>

            </Group>

           <Button
  size="sm"
  radius="md"
  variant="light"
  color="red"
  leftSection={
    <IconFileTypePdf size={18} />
  }
  onClick={handleExportPDF}
>
  تصدير PDF
</Button>
<Button
  size="sm"
  radius="md"
  variant="light"
  color="green"
  leftSection={
    <IconFileSpreadsheet size={17} />
  }
  onClick={() =>
    exportRouteNotesExcel({
      notes,
    })
  }
>
  تصدير Excel
</Button>
          </Group>

        </Group>

        <Divider color="gray.2" />

        {/* =================================================
            Cards
            ================================================= */}

        <ScrollArea
          h={620}
          offsetScrollbars
          scrollbarSize={5}
        >

          <SimpleGrid
            cols={{
              base: 1,
              xl: 2,
            }}
            spacing="sm"
            pr="xs"
          >

            {notes.map(
              (note) => (
                <RouteNoteCard
                  key={note.id}
                  note={note}
                  onEdit={
                    onEdit
                  }
                  onDelete={
                    onDelete
                  }
                />
              )
            )}

          </SimpleGrid>

        </ScrollArea>

      </Stack>
    </Paper>
  );
}