"use client";

import { Card, Text, Button, Stack, Group } from "@mantine/core";
import {
  IconMapPin,
  IconDownload,
  IconWorldDownload,
} from "@tabler/icons-react";
import { useState } from "react";
import { useMantineTheme } from "@mantine/core";

interface Props {
  zone: {
    id: number;
    name: string;
   
  };
}

export default function BinsCard({ zone }: Props) {
  const [loading, setLoading] = useState(false);
  const theme = useMantineTheme();

  const handleDownload = async (type: "excel" | "kml") => {
    try {
      setLoading(true);

      const res = await fetch(`/api/export-bins?area=${zone.id}&type=${type}`);

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;

      const ext = type === "kml" ? "kml" : "xlsx";

      a.download = `bins-${zone.name}.${ext}`;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("❌ فشل تحميل الملف");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      radius="xl"
      shadow="sm"
      p="lg"
      style={{
        border: `1px solid ${theme.colors.gray[2]}`,
        textAlign: "center",
      }}
    >
      <Stack gap="sm">
        <Group justify="center">
          <IconMapPin size={36} color={theme.colors.green[6]} />
        </Group>

        <Text fw={700} size="lg">
          {zone.name}
        </Text>

        <Text size="sm" c="dimmed">
          تحميل بيانات الحاويات
        </Text>
       <Group grow>
          {/* Excel */}
          <Button
            leftSection={<IconDownload size={16} />}
            loading={loading}
            radius="xl"
            variant="light"
            color="green"
            onClick={() => handleDownload("excel")}
            fullWidth
          >
            Excel
          </Button>

          {/* KML */}
          <Button
            leftSection={<IconWorldDownload stroke={2} />}
            radius="xl"
            variant="light"
            color="blue"
            onClick={() => handleDownload("kml")}
            fullWidth
          >
            KML
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
