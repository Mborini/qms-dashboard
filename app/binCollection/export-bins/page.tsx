"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Title,
  SimpleGrid,
  Text,
  Badge,
  Group,
  Box,
} from "@mantine/core";
import BinsCard from "@/app/components/binCollection/export-bins/BinsCard";
import { bungee } from "@/app/layout";

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
    

     

            <Box
  style={{
    textAlign: "center",
    marginBottom: 44,
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
        mt="md"
        style={{
          fontSize: "clamp(20px, 4vw, 32px)",
          fontWeight: 700,
        }}
      >
بيانات المناطق       </Title>
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