"use client";

import {
  Drawer,
  Button,
  Group,
  TextInput,
  Stack,
  Divider,
} from "@mantine/core";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string }) => void;
  initial?: { name?: string };
}

export function AreaDrawer({ open, onClose, onSave, initial }: Props) {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(initial?.name || "");
  }, [initial, open]);

  return (
    <Drawer
      opened={open}
      onClose={onClose}
      position="right"
      size={360}
      title={initial ? "Edit Area" : "New Area"}
      padding="lg"
      closeOnClickOutside={false}
    >
      <Stack gap="lg">
        <TextInput
          label="Name"
          placeholder="Collection area name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
        />

        <Divider />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave({ name })} disabled={!name.trim()}>
            Save
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
}