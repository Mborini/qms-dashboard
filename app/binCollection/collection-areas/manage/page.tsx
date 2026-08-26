"use client";


import { AreaDrawer } from "@/app/components/binCollection/Area/AreaDrawer";
import { CollectionTable } from "@/app/components/binCollection/Area/AreaTable";
import { bungee } from "@/app/layout";
import {
  Button,
  Group,
  Stack,
  Title,
  Container,
  Badge,
  Text,
  Box,
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
        
      <Box
  style={{
    textAlign: "center",
    marginBottom: 12,
  }}
>
  <Box
    style={{
      display: "inline-flex",
      alignItems: "baseline",
      justifyContent: "center",
      gap: 6,
    }}
  >
    <Text
      component="span"
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "clamp(36px, 5vw, 56px)",
        fontWeight: 600,
        letterSpacing: "-2px",
        color: "#263746",
        lineHeight: 1,
      }}
    >
      Ops
    </Text>

    <Text
      component="span"
      className={bungee.className}
      style={{
        fontSize: "clamp(32px, 4.5vw, 52px)",
        lineHeight: 1,

        background:
          "linear-gradient(110deg, #1864ab 0%, #228be6 40%, #15aabf 75%, #12b886 100%)",

        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",

        display: "inline-block",

        letterSpacing: "0px",
      }}
    >
      Matrix
    </Text>
  </Box>

  <Text
    mt={16}
    style={{
      fontFamily: "Inter, sans-serif",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: "2.4px",
      textTransform: "uppercase",
      color: "rgba(30,50,65,0.52)",
    }}
  >
    Operations Intelligence
  </Text>
</Box>
        <Title
          ta="center"
          style={{
            fontSize: "clamp(20px, 4vw, 30px)",
            fontWeight: 700,
          }}
        >
          إدارة مناطق جمع النفايات
        </Title>

    

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