"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Title,
  SimpleGrid,
  Text,
  Badge,
  Group,
} from "@mantine/core";
import BinsCard from "@/app/components/binCollection/export-bins/BinsCard";

interface CollectionZone {
  id: number;
  name: string;
}

export default function ExportBinsPage() {
  const [zones, setZones] = useState<CollectionZone[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/collection-areas");
        const data = await res.json();
        setZones(data);
      } catch (err) {
        console.error("خطأ جلب البيانات", err);
      }
    };

    load();
  }, []);

  return (
    <Container size="lg" py={{ base: "md", md: "xl" }}>
      {/* Header نفس الستايل */}
      <Group justify="center">
        <Badge color="green" size="lg" radius="xl">
          بيانات الجمع 
        </Badge>
      </Group>

      <Title
        ta="center"
        mt="md"
        style={{
          fontSize: "clamp(20px, 4vw, 32px)",
          fontWeight: 700,
        }}
      >
        تحميل بيانات الحاويات حسب المناطق
      </Title>

      <Text
        ta="center"
        c="dimmed"
        mt="sm"
        maw={500}
        mx="auto"
        style={{ fontSize: "clamp(14px, 3.5vw, 16px)" }}
      >
        اختر المنطقة لتحميل بيانات الحاويات بسهولة بصيغة Excel
      </Text>

      {/* Grid */}
      <SimpleGrid
        cols={{ base: 1, sm: 2, md: 3 }}
        spacing="lg"
        mt="xl"
      >
        {zones.map((zone) => (
          <BinsCard key={zone.id} zone={zone} />
        ))}
      </SimpleGrid>
    </Container>
  );
}