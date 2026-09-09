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
  PasswordInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";

import {
  IconEdit,
  IconPlus,
  IconTrash,
  IconUsers,
  IconRefresh,
} from "@tabler/icons-react";

type User = {
  id: number;
  name: string;
  username: string;
  password: string;
  role_id: number;
};

type Role = {
  id: number;
  name: string;
  description: string | null;
};

type UserForm = {
  name: string;
  username: string;
  password: string;
  role_id: number;
};

const emptyForm: UserForm = {
  name: "",
  username: "",
  password: "",
  role_id: 0,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  const [roles, setRoles] = useState<Role[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [modalOpened, setModalOpened] = useState(false);

  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [form, setForm] =
    useState<UserForm>(emptyForm);

  const [error, setError] = useState("");

  /* =====================================================
     LOAD USERS
  ===================================================== */

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/users",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to load users"
        );
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     LOAD ROLES
  ===================================================== */

  const loadRoles = async () => {
    try {
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
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  /* =====================================================
     OPEN ADD MODAL
  ===================================================== */

  const openAddModal = () => {
    setEditingUser(null);

    setForm({
      ...emptyForm,

      // أول Role موجود في قاعدة البيانات
      role_id:
        roles.length > 0
          ? roles[0].id
          : 0,
    });

    setError("");

    setModalOpened(true);
  };

  /* =====================================================
     OPEN EDIT MODAL
  ===================================================== */

  const openEditModal = (user: User) => {
    setEditingUser(user);

    setForm({
      name: user.name,
      username: user.username,
      password: user.password,
      role_id: user.role_id,
    });

    setError("");

    setModalOpened(true);
  };

  /* =====================================================
     SAVE USER
  ===================================================== */

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!form.username.trim()) {
      setError("Username is required");
      return;
    }

    if (!form.password.trim()) {
      setError("Password is required");
      return;
    }

    if (!form.role_id) {
      setError("Please select a role");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const method = editingUser
        ? "PUT"
        : "POST";

      const body = editingUser
        ? {
            id: editingUser.id,
            ...form,
          }
        : form;

      const response = await fetch(
        "/api/users",
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
          data.error || "Failed to save user"
        );
      }

      setModalOpened(false);

      setEditingUser(null);

      setForm(emptyForm);

      await loadUsers();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save user"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE USER
  ===================================================== */

  const handleDelete = async (user: User) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${user.username}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `/api/users?id=${user.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to delete user"
        );
      }

      await loadUsers();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete user"
      );
    }
  };

  /* =====================================================
     GET ROLE
  ===================================================== */

  const getRole = (roleId: number) => {
    return roles.find(
      (role) => role.id === roleId
    );
  };

  /* =====================================================
     ROLE LABEL
  ===================================================== */

  const getRoleLabel = (roleId: number) => {
    const role = getRole(roleId);

    return role?.name || `Role ${roleId}`;
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
        return "gray";
    }
  };

  return (
    <Box
      dir="rtl"
      style={{
        minHeight: "100vh",

        backgroundImage:
          "linear-gradient(135deg, #f8fafc 0%, #eef5f9 50%, #f5f7fb 100%)",

        backgroundSize: "cover",

        backgroundPosition: "center",

        paddingTop: 40,

        paddingBottom: 60,
      }}
    >
      {/* ===================================================
          BACKGROUND GLOW
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
              <IconUsers size={30} />
            </Box>

            <Box>
              <Title
                order={2}
                style={{
                  color: "#172b3a",
                }}
              >
                User Management
              </Title>

              <Text
                size="sm"
                c="dimmed"
                mt={4}
              >
                Manage system users and roles
              </Text>
            </Box>
          </Group>

          <Group>
            <Tooltip label="Refresh">
              <ActionIcon
                variant="light"
                size="lg"
                radius="xl"
                onClick={() => {
                  loadUsers();
                  loadRoles();
                }}
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
              Add User
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
            USERS TABLE
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
          ) : users.length === 0 ? (
            <Box
              style={{
                minHeight: 300,

                display: "flex",

                alignItems: "center",

                justifyContent: "center",
              }}
            >
              <Stack
                align="center"
                gap="xs"
              >
                <IconUsers
                  size={42}
                  stroke={1.5}
                  color="gray"
                />

                <Text
                  fw={700}
                  c="dimmed"
                >
                  No users found
                </Text>

                <Button
                  variant="light"
                  onClick={openAddModal}
                >
                  Add First User
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

                  <Table.Th>Name</Table.Th>

                  <Table.Th>
                    Username
                  </Table.Th>

                  <Table.Th>
                    Password
                  </Table.Th>

                  <Table.Th>
                    Role ID
                  </Table.Th>

                  <Table.Th>
                    Role
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
                {users.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Text fw={700}>
                        {user.id}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text fw={700}>
                        {user.name}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text
                        fw={600}
                        c="indigo"
                      >
                        {user.username}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text
                        style={{
                          fontFamily:
                            "monospace",
                        }}
                      >
                        {user.password}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Badge
                        variant="light"
                        color="dark"
                      >
                        {user.role_id}
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      <Badge
                        variant="light"
                        color={getRoleColor(
                          user.role_id
                        )}
                      >
                        {getRoleLabel(
                          user.role_id
                        )}
                      </Badge>
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
                                user
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
                                user
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
          editingUser
            ? "Edit User"
            : "Add User"
        }
        centered
        radius="xl"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Enter name"
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

          <TextInput
            label="Username"
            placeholder="Enter username"
            value={form.username}
            onChange={(event) =>
              setForm({
                ...form,
                username:
                  event.currentTarget
                    .value,
              })
            }
          />

          <PasswordInput
            label="Password"
            placeholder="Enter password"
            value={form.password}
            onChange={(event) =>
              setForm({
                ...form,
                password:
                  event.currentTarget
                    .value,
              })
            }
          />

          {/* ROLE SELECT */}

          <Select
            label="Role"
            placeholder="Select role"
            value={
              form.role_id
                ? String(form.role_id)
                : null
            }
            onChange={(value) =>
              setForm({
                ...form,
                role_id: value
                  ? Number(value)
                  : 0,
              })
            }
            data={roles.map((role) => ({
              value: String(role.id),
              label: role.name,
            }))}
            searchable
            clearable={false}
            nothingFoundMessage="No roles found"
          />

          {roles.length === 0 && (
            <Text
              size="sm"
              c="red"
            >
              No roles available. Please create a role first.
            </Text>
          )}

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
              {editingUser
                ? "Save Changes"
                : "Create User"}
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
            min-width: 850px;
          }
        }
      `}</style>
    </Box>
  );
}