"use client";


import { AreaDrawer } from "@/app/components/binCollection/Area/AreaDrawer";
import { CollectionTable } from "@/app/components/binCollection/Area/AreaTable";
import {
  Button,
  Group,
  Stack,
  Title,
  Container,
  Badge,
  Text,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export default function ManageAreas() {
  const [data, setData] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);

  async function load() {
    const res = await fetch("/api/collection-areas");
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function save(payload: { name: string }) {
    await fetch(
      edit
        ? `/api/collection-areas/${edit.id}`
        : "/api/collection-areas",
      {
        method: edit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }
    );

    setOpen(false);
    setEdit(null);
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/collection-areas/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <Container size="lg" py={{ base: "md", md: "xl" }}>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="center">
          <Badge color="green" size="lg" radius="xl">
            إدارة المناطق
          </Badge>
        </Group>

        <Title
          ta="center"
          style={{
            fontSize: "clamp(20px, 4vw, 30px)",
            fontWeight: 700,
          }}
        >
          إدارة مناطق جمع النفايات
        </Title>

        <Text ta="center" c="dimmed" maw={500} mx="auto">
          يمكنك إضافة وتعديل مناطق جمع الحاويات بكل سهولة
        </Text>

        <Group justify="flex-end">
          <Button
            leftSection={<IconPlus size={16} />}
            radius="xl"
            color="green"
            onClick={() => setOpen(true)}
          >
            إضافة منطقة
          </Button>
        </Group>

        {/* Table */}
        <CollectionTable
          data={data}
          onEdit={(row) => {
            setEdit(row);
            setOpen(true);
          }}
          onDelete={remove}
        />
      </Stack>

      {/* Drawer */}
      <AreaDrawer
        open={open}
        initial={edit}
        onClose={() => {
          setOpen(false);
          setEdit(null);
        }}
        onSave={save}
      />
    </Container>
  );
}