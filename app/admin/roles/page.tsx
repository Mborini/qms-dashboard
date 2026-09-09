"use client";

import { useEffect, useState } from "react";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";

import {
  IconEdit,
  IconPlus,
  IconRefresh,
  IconShield,
  IconTrash,
} from "@tabler/icons-react";

type Permission = {
  id: number;
  name: string;
  description: string | null;
};

type Role = {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
};

type RoleForm = {
  name: string;
  description: string;
};

const emptyForm: RoleForm = {
  name: "",
  description: "",
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [modalOpened, setModalOpened] = useState(false);

  const [editingRole, setEditingRole] =
    useState<Role | null>(null);

  const [form, setForm] =
    useState<RoleForm>(emptyForm);

  const [error, setError] = useState("");

  /* =====================================================
     LOAD ROLES
  ===================================================== */

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/roles",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !Array.isArray(data)) {
        throw new Error(
          data?.error || "Failed to load roles"
        );
      }

      setRoles(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load roles"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadRoles();
  }, []);

  /* =====================================================
     OPEN ADD MODAL
  ===================================================== */

  const openAddModal = () => {
    setEditingRole(null);

    setForm(emptyForm);

    setError("");

    setModalOpened(true);
  };

  /* =====================================================
     OPEN EDIT MODAL
  ===================================================== */

  const openEditModal = (role: Role) => {
    setEditingRole(role);

    setForm({
      name: role.name,
      description: role.description || "",
    });

    setError("");

    setModalOpened(true);
  };

  /* =====================================================
     SAVE ROLE
  ===================================================== */

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Role name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const method = editingRole
        ? "PUT"
        : "POST";

      const body = editingRole
        ? {
            id: editingRole.id,
            name: form.name.trim(),
            description:
              form.description.trim(),
          }
        : {
            name: form.name.trim(),
            description:
              form.description.trim(),
          };

      const response = await fetch(
        "/api/roles",
        {
          method,

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to save role"
        );
      }

      setModalOpened(false);

      setEditingRole(null);

      setForm(emptyForm);

      await loadRoles();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save role"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE ROLE
  ===================================================== */

  const handleDelete = async (role: Role) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${role.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `/api/roles?id=${role.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to delete role"
        );
      }

      await loadRoles();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete role"
      );
    }
  };

  /* =====================================================
     ROLE COLOR
  ===================================================== */

  const getRoleColor = (roleId: number) => {
    switch (roleId) {
      case 1:
        return "red";

      case 2:
        return "orange";

      case 3:
        return "blue";

      case 4:
        return "violet";

      case 5:
        return "teal";

      default:
        return "indigo";
    }
  };

  return (
    <Box
      dir="rtl"
      style={{
        minHeight: "100vh",

        backgroundImage:
          "linear-gradient(135deg, #f8fafc 0%, #eef5f9 50%, #f5f7fb 100%)",

        paddingTop: 40,

        paddingBottom: 60,
      }}
    >
      {/* ===================================================
          BACKGROUND
      =================================================== */}

      <Box
        style={{
          position: "fixed",

          width: 450,
          height: 450,

          borderRadius: "50%",

          backgroundColor:
            "rgba(72,84,255,0.10)",

          filter: "blur(110px)",

          top: -180,
          right: -150,

          pointerEvents: "none",
        }}
      />

      <Box
        style={{
          position: "fixed",

          width: 400,
          height: 400,

          borderRadius: "50%",

          backgroundColor:
            "rgba(18,184,134,0.08)",

          filter: "blur(110px)",

          bottom: -180,
          left: -150,

          pointerEvents: "none",
        }}
      />

      {/* ===================================================
          CONTENT
      =================================================== */}

      <Container
        size="xl"
        style={{
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <Group
          justify="space-between"
          align="center"
          mb={30}
        >
          <Group gap="md">
            <Box
              style={{
                width: 58,
                height: 58,

                borderRadius: 18,

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                backgroundColor:
                  "rgba(72,84,255,0.10)",

                border:
                  "1px solid rgba(72,84,255,0.18)",

                color: "#4c6ef5",
              }}
            >
              <IconShield size={30} />
            </Box>

            <Box>
              <Title
                order={2}
                style={{
                  color: "#172b3a",
                }}
              >
                Role Management
              </Title>

              <Text
                size="sm"
                c="dimmed"
                mt={4}
              >
                Manage system roles
              </Text>
            </Box>
          </Group>

          <Group>
            <Tooltip label="Refresh">
              <ActionIcon
                variant="light"
                size="lg"
                radius="xl"
                onClick={loadRoles}
              >
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>

            <Button
              leftSection={
                <IconPlus size={18} />
              }
              color="indigo"
              radius="xl"
              onClick={openAddModal}
            >
              Add Role
            </Button>
          </Group>
        </Group>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <Card
            radius="lg"
            mb="lg"
            withBorder
            style={{
              borderColor:
                "rgba(250,82,82,0.25)",

              backgroundColor:
                "rgba(250,82,82,0.06)",
            }}
          >
            <Text
              c="red"
              fw={700}
            >
              {error}
            </Text>
          </Card>
        )}

        {/* =================================================
            TABLE
        ================================================= */}

        <Card
          radius={24}
          padding="lg"
          withBorder
          style={{
            backgroundColor:
              "rgba(255,255,255,0.70)",

            backdropFilter:
              "blur(18px)",

            WebkitBackdropFilter:
              "blur(18px)",

            border:
              "1px solid rgba(255,255,255,0.85)",

            boxShadow:
              "0 20px 60px rgba(40,70,90,0.12)",
          }}
        >
          {loading ? (
            <Box
              style={{
                minHeight: 300,

                display: "flex",

                alignItems: "center",

                justifyContent: "center",
              }}
            >
              <Loader color="indigo" />
            </Box>
          ) : roles.length === 0 ? (
            <Box
              style={{
                minHeight: 300,

                display: "flex",

                alignItems: "center",

                justifyContent: "center",
              }}
            >
              <Stack align="center">
                <IconShield
                  size={42}
                  stroke={1.5}
                  color="gray"
                />

                <Text
                  fw={700}
                  c="dimmed"
                >
                  No roles found
                </Text>

                <Button
                  variant="light"
                  onClick={openAddModal}
                >
                  Add First Role
                </Button>
              </Stack>
            </Box>
          ) : (
            <Table
              striped
              highlightOnHover
              withTableBorder={false}
              verticalSpacing="md"
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>

                  <Table.Th>Role</Table.Th>

                  <Table.Th>
                    Description
                  </Table.Th>

                  <Table.Th>
                    Permissions
                  </Table.Th>

                  <Table.Th
                    style={{
                      textAlign: "center",
                    }}
                  >
                    Actions
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {roles.map((role) => (
                  <Table.Tr key={role.id}>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color="dark"
                      >
                        {role.id}
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      <Badge
                        variant="light"
                        color={getRoleColor(
                          role.id
                        )}
                        size="lg"
                      >
                        {role.name}
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      <Text
                        size="sm"
                        c={
                          role.description
                            ? "dark"
                            : "dimmed"
                        }
                      >
                        {role.description ||
                          "No description"}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Group
                        gap={5}
                        wrap="wrap"
                      >
                        <Badge
                          variant="light"
                          color="indigo"
                        >
                          {role.permissions
                            ?.length || 0}{" "}
                          permissions
                        </Badge>

                        {role.permissions
                          ?.slice(0, 3)
                          .map(
                            (permission) => (
                              <Badge
                                key={
                                  permission.id
                                }
                                variant="outline"
                                size="sm"
                              >
                                {
                                  permission.name
                                }
                              </Badge>
                            )
                          )}

                        {role.permissions &&
                          role.permissions.length >
                            3 && (
                            <Badge
                              variant="light"
                              color="gray"
                              size="sm"
                            >
                              +
                              {role
                                .permissions
                                .length -
                                3}
                            </Badge>
                          )}
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Group
                        justify="center"
                        gap="xs"
                      >
                        <Tooltip label="Edit">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            radius="xl"
                            onClick={() =>
                              openEditModal(
                                role
                              )
                            }
                          >
                            <IconEdit
                              size={17}
                            />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Delete">
                          <ActionIcon
                            variant="light"
                            color="red"
                            radius="xl"
                            onClick={() =>
                              handleDelete(
                                role
                              )
                            }
                          >
                            <IconTrash
                              size={17}
                            />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>
      </Container>

      {/* ===================================================
          ADD / EDIT MODAL
      =================================================== */}

      <Modal
        opened={modalOpened}
        onClose={() => {
          if (!saving) {
            setModalOpened(false);
          }
        }}
        title={
          editingRole
            ? "Edit Role"
            : "Add Role"
        }
        centered
        radius="xl"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Role Name"
            placeholder="Enter role name"
            value={form.name}
            onChange={(event) =>
              setForm({
                ...form,
                name:
                  event.currentTarget
                    .value,
              })
            }
          />

          <Textarea
            label="Description"
            placeholder="Enter role description"
            minRows={3}
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description:
                  event.currentTarget
                    .value,
              })
            }
          />

          {error && (
            <Text
              size="sm"
              c="red"
              fw={600}
            >
              {error}
            </Text>
          )}

          <Group
            justify="flex-end"
            mt="md"
          >
            <Button
              variant="default"
              disabled={saving}
              onClick={() =>
                setModalOpened(false)
              }
            >
              Cancel
            </Button>

            <Button
              color="indigo"
              loading={saving}
              onClick={handleSubmit}
            >
              {editingRole
                ? "Save Changes"
                : "Create Role"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ===================================================
          RESPONSIVE
      =================================================== */}

      <style>{`
        @media (max-width: 768px) {
          .mantine-Table-table {
            min-width: 900px;
          }
        }
      `}</style>
    </Box>
  );
}