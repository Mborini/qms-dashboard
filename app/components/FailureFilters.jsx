"use client";

import { Group, TextInput, Button } from "@mantine/core";

import { IconSearch } from "@tabler/icons-react";

export default function FailureFilters({
  district,
  setDistrict,

  searchId,
  setSearchId,

  searchStatus,
  setSearchStatus,

  searchBlock,
  setSearchBlock,

  searchDistrict,
  setSearchDistrict,

  searchUser,
  setSearchUser,

  onLoad,
}) {
  return (
    <Group mb="md" grow>
      {/* API District */}

      {/* ID */}
      <TextInput
        leftSection={<IconSearch size={16} />}
        placeholder="Search ID"
        value={searchId}
        onChange={(e) => setSearchId(e.target.value)}
      />

      {/* Status */}
      <TextInput
        leftSection={<IconSearch size={16} />}
        placeholder="Search Status"
        value={searchStatus}
        onChange={(e) => setSearchStatus(e.target.value)}
      />

      {/* Block */}
      <TextInput
        leftSection={<IconSearch size={16} />}
        placeholder="Search Block"
        value={searchBlock}
        onChange={(e) => setSearchBlock(e.target.value)}
      />

      {/* District */}
      <TextInput
        leftSection={<IconSearch size={16} />}
        placeholder="Search District"
        value={searchDistrict}
        onChange={(e) => setSearchDistrict(e.target.value)}
      />

      {/* User */}
      <TextInput
        leftSection={<IconSearch size={16} />}
        placeholder="Search User Name"
        value={searchUser}
        onChange={(e) => setSearchUser(e.target.value)}
      />
    </Group>
  );
}
