"use client";

import { Card, Text, Group, Progress } from "@mantine/core";

export default function ProgressCard({ title, value, color }) {
  return (
    <Card radius="xl" p="lg" shadow="sm">
      <Group justify="space-between" mb="md">
        <Text fw={800}>{title}</Text>

        <Text fw={900} size="xl">
          {value}%
        </Text>
      </Group>

      <Progress value={Number(value)} size="xl" radius="xl" color={color} />
    </Card>
  );
}
