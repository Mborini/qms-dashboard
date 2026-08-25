"use client";

import {
  Table,
  Group,
  Text,
  ActionIcon,
  Card,
  useMantineTheme,
} from "@mantine/core";
import { IconEdit, IconMapPin } from "@tabler/icons-react";

type Row = {
  id: number;
  name: string;
  created_at: string;
};

interface Props {
  data: Row[];
  onEdit: (row: Row) => void;
  onDelete: (id: number) => void;
}

export function CollectionTable({ data, onEdit }: Props) {
  const theme = useMantineTheme();

  return (
    <Card
      radius="xl"
      shadow="sm"
      p="md"
      style={{
        border: `1px solid ${theme.colors.gray[2]}`,
      }}
    >
      <Table
        highlightOnHover
        verticalSpacing="sm"
        horizontalSpacing="md"
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>المنطقة</Table.Th>
            <Table.Th>تاريخ الإنشاء</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {data.map((row) => (
            <Table.Tr key={row.id}>
              <Table.Td>
                <Text size="xs" c="dimmed">
                  #{row.id}
                </Text>
              </Table.Td>

              <Table.Td>
                <Group gap={6}>
                  <IconMapPin size={16} color={theme.colors.green[6]} />
                  <Text fw={500}>{row.name}</Text>
                </Group>
              </Table.Td>

              <Table.Td>
                <Text size="sm" c="dimmed">
                  {new Date(row.created_at).toLocaleDateString()}
                </Text>
              </Table.Td>

              <Table.Td>
                <Group gap={4} justify="flex-end">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    radius="xl"
                    onClick={() => onEdit(row)}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}