"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";

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

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>(
    []
  );

  // Add Permission
  const [permissionName, setPermissionName] = useState("");
  const [permissionDescription, setPermissionDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================
  // Load Roles + Permissions
  // =========================================

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [rolesRes, permissionsRes] = await Promise.all([
        fetch("/api/roles"),
        fetch("/api/permissions"),
      ]);

      const rolesData = await rolesRes.json();
      const permissionsData = await permissionsRes.json();

      if (!rolesRes.ok) {
        throw new Error(rolesData.error || "Failed to load roles");
      }

      if (!permissionsRes.ok) {
        throw new Error(
          permissionsData.error || "Failed to load permissions"
        );
      }

      setRoles(rolesData);
      setPermissions(permissionsData);

      if (rolesData.length > 0) {
        setSelectedRole(String(rolesData[0].id));
      }
    } catch (error) {
      console.error("Failed to load permissions data:", error);
      setError("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // =========================================
  // When Role Changes
  // =========================================

  useEffect(() => {
    if (!selectedRole) {
      setSelectedPermissions([]);
      return;
    }

    const role = roles.find(
      (role) => role.id === Number(selectedRole)
    );

    if (!role) {
      setSelectedPermissions([]);
      return;
    }

    setSelectedPermissions(
      role.permissions.map((permission) => permission.id)
    );
  }, [selectedRole, roles]);

  // =========================================
  // Toggle Permission
  // =========================================

  function togglePermission(permissionId: number) {
    setSelectedPermissions((current) => {
      if (current.includes(permissionId)) {
        return current.filter((id) => id !== permissionId);
      }

      return [...current, permissionId];
    });
  }

  // =========================================
  // Add Permission
  // =========================================

  async function addPermission() {
    setError("");
    setSuccess("");

    if (!permissionName.trim()) {
      setError("اسم الصلاحية مطلوب");
      return;
    }

    try {
      setAdding(true);

      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: permissionName.trim(),
          description: permissionDescription.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create permission"
        );
      }

      // Add new permission to list
      setPermissions((current) => [...current, data]);

      // Clear form
      setPermissionName("");
      setPermissionDescription("");

      setSuccess("تمت إضافة الصلاحية بنجاح");
    } catch (error) {
      console.error("Add permission error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إضافة الصلاحية"
      );
    } finally {
      setAdding(false);
    }
  }

  // =========================================
  // Save Permissions
  // =========================================

  async function savePermissions() {
    if (!selectedRole) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/roles/${selectedRole}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            permissions: selectedPermissions,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save permissions"
        );
      }

      // Update local roles data
      setRoles((currentRoles) =>
        currentRoles.map((role) => {
          if (role.id !== Number(selectedRole)) {
            return role;
          }

          return {
            ...role,
            permissions: permissions.filter((permission) =>
              selectedPermissions.includes(permission.id)
            ),
          };
        })
      );

      setSuccess("تم حفظ الصلاحيات بنجاح");
    } catch (error) {
      console.error("Save permissions error:", error);

      setError("حدث خطأ أثناء حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  }

  // =========================================
  // Loading
  // =========================================

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Group justify="center">
          <Loader />
        </Group>
      </Container>
    );
  }

  // =========================================
  // UI
  // =========================================

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">

        {/* ===================================== */}
        {/* Header */}
        {/* ===================================== */}

        <div>
          <Title order={2}>إدارة الصلاحيات</Title>

          <Text c="dimmed" mt={5}>
            إدارة الصلاحيات وتحديدها لكل Role
          </Text>
        </div>

        {/* ===================================== */}
        {/* Alerts */}
        {/* ===================================== */}

        {error && (
          <Alert
            color="red"
            title="خطأ"
            withCloseButton
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            color="green"
            title="تم"
            withCloseButton
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        {/* ===================================== */}
        {/* Add Permission */}
        {/* ===================================== */}

        <Card withBorder radius="md" p="lg">
          <Stack gap="md">

            <div>
              <Title order={4}>
                إضافة صلاحية جديدة
              </Title>

              <Text size="sm" c="dimmed" mt={4}>
                أضف Permission جديدة إلى النظام
              </Text>
            </div>

            <Divider />

            <SimpleGrid
              cols={{
                base: 1,
                sm: 2,
              }}
            >
              <TextInput
                label="اسم الصلاحية"
                placeholder="مثال: view_dashboard"
                value={permissionName}
                onChange={(event) =>
                  setPermissionName(
                    event.currentTarget.value
                  )
                }
              />

              <Textarea
                label="الوصف"
                placeholder="وصف الصلاحية"
                value={permissionDescription}
                onChange={(event) =>
                  setPermissionDescription(
                    event.currentTarget.value
                  )
                }
              />
            </SimpleGrid>

            <Group justify="flex-end">
              <Button
                onClick={addPermission}
                loading={adding}
              >
                إضافة الصلاحية
              </Button>
            </Group>

          </Stack>
        </Card>

        {/* ===================================== */}
        {/* Role Permissions */}
        {/* ===================================== */}

        <Card withBorder radius="md" p="lg">
          <Stack gap="lg">

            <div>
              <Title order={4}>
                صلاحيات الـ Role
              </Title>

              <Text size="sm" c="dimmed" mt={4}>
                حدد الصلاحيات التي يمتلكها كل Role
              </Text>
            </div>

            <Select
              label="الدور"
              placeholder="اختر الدور"
              value={selectedRole}
              onChange={setSelectedRole}
              data={roles.map((role) => ({
                value: String(role.id),
                label: role.name,
              }))}
            />

            <Divider />

            {/* Permissions */}

            <div>
              <Group justify="space-between" mb="md">
                <Text fw={600}>
                  الصلاحيات
                </Text>

                <Text size="sm" c="dimmed">
                  {selectedPermissions.length} /{" "}
                  {permissions.length}
                </Text>
              </Group>

              <SimpleGrid
                cols={{
                  base: 1,
                  sm: 2,
                  md: 3,
                }}
                spacing="md"
              >
                {permissions.map((permission) => (
                  <Card
                    key={permission.id}
                    withBorder
                    p="md"
                    radius="md"
                  >
                    <Checkbox
                      label={permission.name}
                      checked={selectedPermissions.includes(
                        permission.id
                      )}
                      onChange={() =>
                        togglePermission(permission.id)
                      }
                    />

                    {permission.description && (
                      <Text
                        size="xs"
                        c="dimmed"
                        mt={5}
                        ml={25}
                      >
                        {permission.description}
                      </Text>
                    )}
                  </Card>
                ))}
              </SimpleGrid>
            </div>

            {/* Save */}

            <Group justify="flex-end">
              <Button
                onClick={savePermissions}
                loading={saving}
                disabled={!selectedRole}
              >
                حفظ الصلاحيات
              </Button>
            </Group>

          </Stack>
        </Card>

      </Stack>
    </Container>
  );
}