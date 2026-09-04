"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
  ThemeIcon,
  Progress,
  Box,
  Center,
  Loader,
} from "@mantine/core";

import {
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconCheck,
  IconX,
  IconCategory,
  IconChartBar,
  IconCircleCheck,
  IconCircleX,
  IconListCheck,
  IconSettings,
  IconSparkles,
  IconArrowDown,
  IconArrowUp,
} from "@tabler/icons-react";

/* =========================================================
   TYPES
   ========================================================= */

type KPIApiRow = {
  kpi_id: number;
  kpi_name: string;
  sub_kpi_id: number | null;
  sub_kpi_name: string | null;
  sub_kpi_parent_id: number | null;
};

type SubKPI = {
  id: number;
  kpi_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
};

type KPI = {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  sub_kpis: SubKPI[];
};

/* =========================================================
   PAGE
   ========================================================= */

export default function MaintenanceKPIPage() {
  /* =========================================================
     DATA
     ========================================================= */

  const [kpis, setKpis] = useState<KPI[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     SEARCH
     ========================================================= */

  const [search, setSearch] = useState("");

  /* =========================================================
     EXPANDED
     ========================================================= */

  const [expandedKpis, setExpandedKpis] =
    useState<Set<number>>(new Set());

  /* =========================================================
     KPI MODAL
     ========================================================= */

  const [kpiModalOpened, setKpiModalOpened] = useState(false);

  const [editingKpi, setEditingKpi] =
    useState<KPI | null>(null);

  const [kpiName, setKpiName] = useState("");
  const [kpiDescription, setKpiDescription] =
    useState("");

  /* =========================================================
     SUB KPI MODAL
     ========================================================= */

  const [subKpiModalOpened, setSubKpiModalOpened] =
    useState(false);

  const [editingSubKpi, setEditingSubKpi] =
    useState<SubKPI | null>(null);

  const [subKpiName, setSubKpiName] = useState("");

  const [subKpiDescription, setSubKpiDescription] =
    useState("");

  const [subKpiParentId, setSubKpiParentId] =
    useState<string | null>(null);

  /* =========================================================
     LOAD DATA
     ========================================================= */

  const loadKpis = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/maintenance/kpis",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "فشل تحميل KPIs"
        );
      }

      const rows: KPIApiRow[] = result.data || [];

      const map = new Map<number, KPI>();

      for (const row of rows) {
        if (!map.has(row.kpi_id)) {
          map.set(row.kpi_id, {
            id: row.kpi_id,
            name: row.kpi_name,
            description: null,
            is_active: true,
            sub_kpis: [],
          });
        }

        const kpi = map.get(row.kpi_id)!;

        if (
          row.sub_kpi_id !== null &&
          row.sub_kpi_name !== null
        ) {
          const exists = kpi.sub_kpis.some(
            (sub) => sub.id === row.sub_kpi_id
          );

          if (!exists) {
            kpi.sub_kpis.push({
              id: row.sub_kpi_id,
              kpi_id:
                row.sub_kpi_parent_id ??
                row.kpi_id,
              name: row.sub_kpi_name,
              description: null,
              is_active: true,
            });
          }
        }
      }

      /* -------------------------------------------------------
         LOAD SUB KPIs DETAILS
         ------------------------------------------------------- */

      try {
        const subResponse = await fetch(
          "/api/maintenance/sub-kpis",
          {
            cache: "no-store",
          }
        );

        if (subResponse.ok) {
          const subResult =
            await subResponse.json();

          if (subResult.success) {
            const subRows =
              subResult.data || [];

            for (const sub of subRows) {
              const kpi = map.get(
                Number(sub.kpi_id)
              );

              if (!kpi) continue;

              const index =
                kpi.sub_kpis.findIndex(
                  (item) =>
                    item.id === Number(sub.id)
                );

              const normalizedSub: SubKPI = {
                id: Number(sub.id),
                kpi_id: Number(sub.kpi_id),
                name: sub.name,
                description:
                  sub.description ?? null,
                is_active:
                  Boolean(sub.is_active),
              };

              if (index >= 0) {
                kpi.sub_kpis[index] =
                  normalizedSub;
              } else {
                kpi.sub_kpis.push(
                  normalizedSub
                );
              }
            }
          }
        }
      } catch {
        // Optional endpoint
      }

      /* -------------------------------------------------------
         LOAD KPI DETAILS
         ------------------------------------------------------- */

      try {
        const detailResponse =
          await fetch(
            "/api/maintenance/kpis/details",
            {
              cache: "no-store",
            }
          );

        if (detailResponse.ok) {
          const detailResult =
            await detailResponse.json();

          if (detailResult.success) {
            for (const item of
              detailResult.data || []) {
              const kpi = map.get(
                Number(item.id)
              );

              if (!kpi) continue;

              kpi.description =
                item.description ?? null;

              kpi.is_active =
                Boolean(item.is_active);
            }
          }
        }
      } catch {
        // Optional endpoint
      }

      setKpis(
        Array.from(map.values())
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل البيانات"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKpis();
  }, []);

  /* =========================================================
     SUCCESS MESSAGE
     ========================================================= */

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  /* =========================================================
     FILTER
     ========================================================= */

  const filteredKpis = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) return kpis;

    return kpis.filter((kpi) => {
      const kpiMatch =
        kpi.name
          .toLowerCase()
          .includes(value) ||
        (kpi.description || "")
          .toLowerCase()
          .includes(value);

      const subMatch =
        kpi.sub_kpis.some(
          (sub) =>
            sub.name
              .toLowerCase()
              .includes(value) ||
            (sub.description || "")
              .toLowerCase()
              .includes(value)
        );

      return kpiMatch || subMatch;
    });
  }, [kpis, search]);

  /* =========================================================
     KPI OPTIONS
     ========================================================= */

  const kpiOptions = useMemo(() => {
    return kpis.map((kpi) => ({
      value: String(kpi.id),
      label: `${kpi.name}${
        !kpi.is_active
          ? " — غير فعال"
          : ""
      }`,
      disabled: !kpi.is_active,
    }));
  }, [kpis]);

  /* =========================================================
     STATS
     ========================================================= */

  const totalKpis = kpis.length;

  const activeKpis = kpis.filter(
    (kpi) => kpi.is_active
  ).length;

  const inactiveKpis =
    totalKpis - activeKpis;

  const totalSubKpis = kpis.reduce(
    (sum, kpi) =>
      sum + kpi.sub_kpis.length,
    0
  );

  const activeSubKpis = kpis.reduce(
    (sum, kpi) =>
      sum +
      kpi.sub_kpis.filter(
        (sub) => sub.is_active
      ).length,
    0
  );

  const inactiveSubKpis =
    totalSubKpis - activeSubKpis;

  const kpiActivationRate =
    totalKpis > 0
      ? Math.round(
          (activeKpis / totalKpis) *
            100
        )
      : 0;

  const subKpiActivationRate =
    totalSubKpis > 0
      ? Math.round(
          (activeSubKpis /
            totalSubKpis) *
            100
        )
      : 0;

  /* =========================================================
     HELPERS
     ========================================================= */

  const toggleExpanded = (id: number) => {
    setExpandedKpis((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const expandAll = () => {
    setExpandedKpis(
      new Set(
        filteredKpis.map(
          (kpi) => kpi.id
        )
      )
    );
  };

  const collapseAll = () => {
    setExpandedKpis(new Set());
  };

  /* =========================================================
     KPI MODALS
     ========================================================= */

  const openCreateKpi = () => {
    setEditingKpi(null);
    setKpiName("");
    setKpiDescription("");
    setKpiModalOpened(true);
  };

  const openEditKpi = (kpi: KPI) => {
    setEditingKpi(kpi);
    setKpiName(kpi.name);
    setKpiDescription(
      kpi.description || ""
    );
    setKpiModalOpened(true);
  };

  /* =========================================================
     SUB KPI MODALS
     ========================================================= */

  const openCreateSubKpi = (
    parentId?: number
  ) => {
    setEditingSubKpi(null);

    setSubKpiName("");
    setSubKpiDescription("");

    if (parentId) {
      setSubKpiParentId(
        String(parentId)
      );
    } else {
      const firstActive = kpis.find(
        (kpi) => kpi.is_active
      );

      setSubKpiParentId(
        firstActive
          ? String(firstActive.id)
          : null
      );
    }

    setSubKpiModalOpened(true);
  };

  const openEditSubKpi = (
    subKpi: SubKPI
  ) => {
    setEditingSubKpi(subKpi);

    setSubKpiName(subKpi.name);

    setSubKpiDescription(
      subKpi.description || ""
    );

    setSubKpiParentId(
      String(subKpi.kpi_id)
    );

    setSubKpiModalOpened(true);
  };

  /* =========================================================
     SAVE KPI
     ========================================================= */

  const saveKpi = async () => {
    const name = kpiName.trim();

    if (!name) {
      setError(
        "يرجى إدخال اسم KPI"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const method = editingKpi
        ? "PATCH"
        : "POST";

      const body = editingKpi
        ? {
            id: editingKpi.id,
            name,
            description:
              kpiDescription.trim() ||
              null,
          }
        : {
            name,
            description:
              kpiDescription.trim() ||
              null,
          };

      const response = await fetch(
        "/api/maintenance/kpis",
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "فشل حفظ KPI"
        );
      }

      setKpiModalOpened(false);

      setSuccess(
        editingKpi
          ? "تم تعديل نوع صيانة بنجاح"
          : "تمت إضافة نوع صيانة بنجاح"
      );

      await loadKpis();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حفظ KPI"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     TOGGLE KPI
     ========================================================= */

  const toggleKpi = async (
    kpi: KPI
  ) => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "/api/maintenance/kpis",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: kpi.id,
            is_active:
              !kpi.is_active,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "فشل تغيير حالة KPI"
        );
      }

      setSuccess(
        !kpi.is_active
          ? "تم تفعيل KPI"
          : "تم تعطيل KPI"
      );

      await loadKpis();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE KPI
     ========================================================= */

  const deleteKpi = async (
    kpi: KPI
  ) => {
    const confirmed =
      window.confirm(
        `هل أنت متأكد من حذف KPI "${kpi.name}"؟\n\nسيتم حذف الـ Sub KPIs التابعة له أيضًا إذا لم يكن مستخدمًا في سجلات الصيانة.`
      );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/maintenance/kpis?id=${kpi.id}`,
        {
          method: "DELETE",
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "فشل حذف KPI"
        );
      }

      setSuccess(
        "تم حذف KPI بنجاح"
      );

      await loadKpis();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حذف KPI"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     SAVE SUB KPI
     ========================================================= */

  const saveSubKpi = async () => {
    const name =
      subKpiName.trim();

    if (!subKpiParentId) {
      setError(
        "يرجى اختيار KPI الأب"
      );
      return;
    }

    if (!name) {
      setError(
        "يرجى إدخال اسم Sub KPI"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const method = editingSubKpi
        ? "PATCH"
        : "POST";

      const body = editingSubKpi
        ? {
            id: editingSubKpi.id,
            kpi_id: Number(
              subKpiParentId
            ),
            name,
            description:
              subKpiDescription.trim() ||
              null,
          }
        : {
            kpi_id: Number(
              subKpiParentId
            ),
            name,
            description:
              subKpiDescription.trim() ||
              null,
          };

      const response = await fetch(
        "/api/maintenance/sub-kpis",
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "فشل حفظ نوع صيانة فرعي"
        );
      }

      setSubKpiModalOpened(false);

      setSuccess(
        editingSubKpi
          ? "تم تعديل نوع صيانة فرعي بنجاح"
          : "تمت إضافة نوع صيانة فرعي بنجاح"
      );

      await loadKpis();

      setExpandedKpis(
        (previous) => {
          const next = new Set(
            previous
          );

          next.add(
            Number(
              subKpiParentId
            )
          );

          return next;
        }
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حفظ Sub KPI"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     TOGGLE SUB KPI
     ========================================================= */

  const toggleSubKpi = async (
    subKpi: SubKPI
  ) => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "/api/maintenance/sub-kpis",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: subKpi.id,
            is_active:
              !subKpi.is_active,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "فشل تغيير حالة Sub KPI"
        );
      }

      setSuccess(
        !subKpi.is_active
          ? "تم تفعيل Sub KPI"
          : "تم تعطيل Sub KPI"
      );

      await loadKpis();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE SUB KPI
     ========================================================= */

  const deleteSubKpi = async (
    subKpi: SubKPI
  ) => {
    const confirmed =
      window.confirm(
        `هل أنت متأكد من حذف Sub KPI "${subKpi.name}"؟`
      );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/maintenance/sub-kpis?id=${subKpi.id}`,
        {
          method: "DELETE",
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "فشل حذف Sub KPI"
        );
      }

      setSuccess(
        "تم حذف Sub KPI بنجاح"
      );

      await loadKpis();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حذف Sub KPI"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <Box
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      }}
    >
      <Container
        size="xl"
        py={32}
      >
        <Stack gap={24}>
          {/* =================================================
              HERO HEADER
             ================================================= */}

          <Card
            radius="xl"
            padding={0}
            withBorder
            style={{
              overflow: "hidden",
              background:
                "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
              border: "none",
            }}
          >
            <Box
              p={{
                base: 20,
                sm: 28,
              }}
            >
              <Group
                justify="space-between"
                align="center"
                gap="xl"
              >
                <Group
                  align="center"
                  gap="lg"
                >
                  <ThemeIcon
                    size={64}
                    radius="xl"
                    variant="light"
                    color="blue"
                    style={{
                      background:
                        "rgba(255,255,255,.12)",
                      color: "white",
                    }}
                  >
                    <IconSettings
                      size={32}
                    />
                  </ThemeIcon>

                  <div>
                    <Group
                      gap="xs"
                      mb={5}
                    >
                      <Text
                        size="xs"
                        fw={700}
                        tt="uppercase"
                        style={{
                          color:
                            "rgba(255,255,255,.65)",
                          letterSpacing:
                            "1px",
                        }}
                      >
                        Maintenance
                      </Text>

                      
                    </Group>

                    <Title
                      order={1}
                      c="white"
                      size="clamp(24px, 4vw, 34px)"
                    >
                      إدارة انواع الصيانة
                    </Title>

                    <Text
                      mt={6}
                      size="sm"
                      style={{
                        color:
                          "rgba(255,255,255,.72)",
                      }}
                    >
                      إدارة وتنظيم انواع
                      الصيانة الرئيسية والانواع الفرعية
                      الخاصة بعمليات الصيانة
                    </Text>
                  </div>
                </Group>

                <Group gap="sm">
                  <Button
                    variant="light"
                    color="gray"
                    leftSection={
                      <IconRefresh
                        size={17}
                      />
                    }
                    onClick={loadKpis}
                    loading={loading}
                    styles={{
                      root: {
                        background:
                          "rgba(255,255,255,.1)",
                        color: "white",
                        border:
                          "1px solid rgba(255,255,255,.15)",
                      },
                    }}
                  >
                    تحديث
                  </Button>

                  <Button
                  c="black"
                    color="white"
                    leftSection={
                      <IconPlus
                        size={18}
                      />
                    }
                    onClick={
                      openCreateKpi
                    }
                    styles={{
                      root: {
                        boxShadow:
                          "0 8px 20px rgba(0,0,0,.2)",
                      },
                    }}
                  >
                    إضافة نوع صيانة
                  </Button>
                </Group>
              </Group>
            </Box>

          
          </Card>

          {/* =================================================
              ALERTS
             ================================================= */}

          {error && (
            <Alert
              radius="lg"
              color="red"
              variant="light"
              icon={
                <IconAlertCircle
                  size={20}
                />
              }
              withCloseButton
              onClose={() =>
                setError("")
              }
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              radius="lg"
              color="green"
              variant="light"
              icon={
                <IconCheck
                  size={20}
                />
              }
              withCloseButton
              onClose={() =>
                setSuccess("")
              }
            >
              {success}
            </Alert>
          )}

          {/* =================================================
              STATISTICS
             ================================================= */}

          <SimpleGrid
            cols={{
              base: 1,
              xs: 2,
              md: 2,
            }}
            spacing="md"
          >
            {/* KPI */}

            <Card
              withBorder
              radius="xl"
              padding="lg"
              style={{
                background:
                  "rgba(255,255,255,.9)",
              }}
            >
              <Group
                justify="space-between"
                align="flex-start"
              >
                <div>
                  <Text
                    size="xs"
                    fw={700}
                    c="dimmed"
                    tt="uppercase"
                  >
                    إجمالي انواع الصيانة الرئيسية
                  </Text>

                  <Text
                    size="32px"
                    fw={800}
                    mt={5}
                    lh={1}
                  >
                    {totalKpis}
                  </Text>

                  
                </div>

                <ThemeIcon
                  size={46}
                  radius="lg"
                  variant="light"
                  color="blue"
                >
                  <IconChartBar
                    size={23}
                  />
                </ThemeIcon>
              </Group>
            </Card>

          

            {/* Sub KPI */}

            <Card
              withBorder
              radius="xl"
              padding="lg"
              style={{
                background:
                  "rgba(255,255,255,.9)",
              }}
            >
              <Group
                justify="space-between"
                align="flex-start"
              >
                <div>
                  <Text
                    size="xs"
                    fw={700}
                    c="dimmed"
                    tt="uppercase"
                  >
                    إجمالي انواع الصيانة الفرعية
                  </Text>

                  <Text
                    size="32px"
                    fw={800}
                    mt={5}
                    lh={1}
                  >
                    {totalSubKpis}
                  </Text>

                 
                </div>

                <ThemeIcon
                  size={46}
                  radius="lg"
                  variant="light"
                  color="violet"
                >
                  <IconListCheck
                    size={23}
                  />
                </ThemeIcon>
              </Group>
            </Card>

          </SimpleGrid>

          {/* =================================================
              SEARCH / TOOLBAR
             ================================================= */}

          <Card
            withBorder
            radius="xl"
            padding="md"
            style={{
              background:
                "rgba(255,255,255,.92)",
            }}
          >
            <Group
              justify="space-between"
              align="center"
              gap="md"
            >
              <TextInput
                style={{
                  flex: 1,
                }}
                size="md"
                radius="lg"
                placeholder="ابحث عن نوع صيانة أو نوع فرعي..."
                leftSection={
                  <IconSearch
                    size={19}
                  />
                }
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.currentTarget
                      .value
                  )
                }
                rightSection={
                  search ? (
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() =>
                        setSearch("")
                      }
                    >
                      <IconX
                        size={16}
                      />
                    </ActionIcon>
                  ) : null
                }
              />

              <Group
                gap="xs"
                wrap="nowrap"
              >
                <Button
                  variant="subtle"
                  color="gray"
                  leftSection={
                    <IconArrowDown
                      size={16}
                    />
                  }
                  onClick={expandAll}
                >
                  فتح الكل
                </Button>

                <Button
                  variant="subtle"
                  color="gray"
                  leftSection={
                    <IconArrowUp
                      size={16}
                    />
                  }
                  onClick={collapseAll}
                >
                  إغلاق الكل
                </Button>

                <Button
                  variant="light"
                  leftSection={
                    <IconPlus
                      size={17}
                    />
                  }
                  onClick={() =>
                    openCreateSubKpi()
                  }
                  disabled={
                    activeKpis === 0
                  }
                >
                  إضافة نوع جديد

                </Button>
              </Group>
            </Group>

            
          </Card>

          {/* =================================================
              CONTENT
             ================================================= */}

          {loading ? (
            <Card
              withBorder
              radius="xl"
              padding={60}
              style={{
                background:
                  "rgba(255,255,255,.9)",
              }}
            >
              <Center>
                <Stack
                  align="center"
                  gap="md"
                >
                  <Loader
                    size="md"
                    color="blue"
                  />

                  <Text
                    fw={600}
                  >
                    جاري تحميل مؤشرات الصيانة...
                  </Text>

                  <Text
                    size="sm"
                    c="dimmed"
                  >
                    يتم تجهيز البيانات
                  </Text>
                </Stack>
              </Center>
            </Card>
          ) : filteredKpis.length ===
            0 ? (
            <Card
              withBorder
              radius="xl"
              padding={60}
              style={{
                background:
                  "rgba(255,255,255,.9)",
              }}
            >
              <Center>
                <Stack
                  align="center"
                  gap="sm"
                >
                  <ThemeIcon
                    size={70}
                    radius="xl"
                    variant="light"
                    color="gray"
                  >
                    <IconCategory
                      size={34}
                    />
                  </ThemeIcon>

                  <Text
                    fw={700}
                    size="lg"
                    mt="sm"
                  >
                    لا توجد بيانات
                  </Text>

                  <Text
                    size="sm"
                    c="dimmed"
                    ta="center"
                    maw={420}
                  >
                    {search
                      ? "لم يتم العثور على نتائج مطابقة لبحثك."
                      : "لم تتم إضافة أي نوع صيانة حتى الآن."}
                  </Text>

                  {!search && (
                    <Button
                      mt="sm"
                      leftSection={
                        <IconPlus
                          size={17}
                        />
                      }
                      onClick={
                        openCreateKpi
                      }
                    >
                      إضافة أول نوع صيانة
                    </Button>
                  )}
                </Stack>
              </Center>
            </Card>
          ) : (
            <Stack gap="md">
              {filteredKpis.map(
                (kpi, kpiIndex) => {
                  const expanded =
                    expandedKpis.has(
                      kpi.id
                    );

                  const activeSubs =
                    kpi.sub_kpis.filter(
                      (sub) =>
                        sub.is_active
                    ).length;

                  const subRate =
                    kpi.sub_kpis.length >
                    0
                      ? Math.round(
                          (activeSubs /
                            kpi
                              .sub_kpis
                              .length) *
                            100
                        )
                      : 0;

                  return (
                    <Card
                      key={kpi.id}
                      withBorder
                      radius="xl"
                      padding={0}
                      style={{
                        overflow:
                          "hidden",
                        background:
                          "rgba(255,255,255,.95)",
                        transition:
                          "all .2s ease",
                      }}
                    >
                      {/* =====================================
                          KPI HEADER
                         ===================================== */}

                      <Box
                        p={{
                          base: 16,
                          sm: 20,
                        }}
                      >
                        <Group
                          justify="space-between"
                          align="center"
                          wrap="nowrap"
                        >
                          <Group
                            gap="md"
                            style={{
                              flex: 1,
                              minWidth: 0,
                            }}
                            wrap="nowrap"
                          >
                            {/* Number */}

                            <ThemeIcon
                              size={48}
                              radius="lg"
                              variant={
                                kpi.is_active
                                  ? "light"
                                  : "light"
                              }
                              color={
                                kpi.is_active
                                  ? "blue"
                                  : "gray"
                              }
                              style={{
                                flexShrink: 0,
                              }}
                            >
                              <Text
                                fw={800}
                                size="sm"
                              >
                                {String(
                                  kpiIndex +
                                    1
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </Text>
                            </ThemeIcon>

                            {/* Expand */}

                            <ActionIcon
                              size={40}
                              radius="lg"
                              variant="subtle"
                              color="gray"
                              onClick={() =>
                                toggleExpanded(
                                  kpi.id
                                )
                              }
                              style={{
                                flexShrink: 0,
                              }}
                            >
                              {expanded ? (
                                <IconChevronUp
                                  size={
                                    20
                                  }
                                />
                              ) : (
                                <IconChevronDown
                                  size={
                                    20
                                  }
                                />
                              )}
                            </ActionIcon>

                            {/* Main Info */}

                            <Box
                              style={{
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <Group
                                gap="xs"
                                wrap="wrap"
                              >
                                <Text
                                  fw={750}
                                  size="lg"
                                  truncate
                                >
                                  {kpi.name}
                                </Text>

                                
                              </Group>

                              <Group
                                gap="xs"
                                mt={5}
                              >
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color="blue"
                                >
                                  {
                                    kpi
                                      .sub_kpis
                                      .length
                                  }{" "}
                                  نوع فرعي
                                </Badge>

                               
                              </Group>

                              {kpi.description && (
                                <Text
                                  size="sm"
                                  c="dimmed"
                                  mt={7}
                                  lineClamp={1}
                                >
                                  {
                                    kpi.description
                                  }
                                </Text>
                              )}
                            </Box>
                          </Group>

                          {/* KPI Actions */}

                          <Group
                            gap={5}
                            wrap="nowrap"
                          >
                          

                            <Tooltip label="تعديل ">
                              <ActionIcon
                                size={38}
                                radius="lg"
                                variant="light"
                                color="orange"
                                onClick={() =>
                                  openEditKpi(
                                    kpi
                                  )
                                }
                              >
                                <IconEdit
                                  size={
                                    17
                                  }
                                />
                              </ActionIcon>
                            </Tooltip>

                            <Tooltip label="حذف ">
                              <ActionIcon
                                size={38}
                                radius="lg"
                                variant="light"
                                color="red"
                                onClick={() =>
                                  deleteKpi(
                                    kpi
                                  )
                                }
                                loading={
                                  saving
                                }
                              >
                                <IconTrash
                                  size={
                                    17
                                  }
                                />
                              </ActionIcon>
                            </Tooltip>

                            <Button
                              size="sm"
                              radius="xl"
                              color="green"
                              variant="light"
                              leftSection={
                                <IconPlus
                                  size={
                                    16
                                  }
                                />
                              }
                              disabled={
                                !kpi.is_active
                              }
                              onClick={() => {
                                openCreateSubKpi(
                                  kpi.id
                                );

                                setExpandedKpis(
                                  (
                                    previous
                                  ) => {
                                    const next =
                                      new Set(
                                        previous
                                      );

                                    next.add(
                                      kpi.id
                                    );

                                    return next;
                                  }
                                );
                              }}
                            >
                              <Text
                                visibleFrom="sm"
                              >
                                اسناد نوع فرعي
                              </Text>
                              <Text
                                hiddenFrom="sm"
                              >
                                إضافة
                              </Text>
                            </Button>
                          </Group>
                        </Group>
                      </Box>

                      {/* =====================================
                          KPI FOOTER
                         ===================================== */}

                     

                  

                      {/* =====================================
                          SUB KPIs
                         ===================================== */}

                      {expanded && (
                        <Box
                          p={{
                            base: 12,
                            sm: 20,
                          }}
                          style={{
                            background:
                              "#f8fafc",
                          }}
                        >
                          {kpi.sub_kpis
                            .length ===
                          0 ? (
                            <Paper
                              withBorder
                              radius="lg"
                              p={35}
                              style={{
                                background:
                                  "white",
                                borderStyle:
                                  "dashed",
                              }}
                            >
                              <Center>
                                <Stack
                                  align="center"
                                  gap="xs"
                                >
                                  <ThemeIcon
                                    size={52}
                                    radius="xl"
                                    variant="light"
                                    color="gray"
                                  >
                                    <IconListCheck
                                      size={
                                        25
                                      }
                                    />
                                  </ThemeIcon>

                                  <Text
                                    fw={650}
                                    mt="xs"
                                  >
                                    لا يوجد أنواع صيانة فرعية
                                  </Text>

                                  <Text
                                    size="sm"
                                    c="dimmed"
                                  >
                                    لم تتم إضافة
                                    أنواع صيانة فرعية
                                    لهذا النوع
                                  </Text>

                                  {kpi.is_active && (
                                    <Button
                                      size="sm"
                                      mt="xs"
                                      variant="light"
                                      leftSection={
                                        <IconPlus
                                          size={
                                            16
                                          }
                                        />
                                      }
                                      onClick={() =>
                                        openCreateSubKpi(
                                          kpi.id
                                        )
                                      }
                                    >
                                      إضافة نوع صيانة فرعي
                                    </Button>
                                  )}
                                </Stack>
                              </Center>
                            </Paper>
                          ) : (
                            <Paper
                              withBorder
                              radius="lg"
                              style={{
                                overflow:
                                  "hidden",
                                background:
                                  "white",
                              }}
                            >
                              <ScrollArea
                                type="auto"
                                offsetScrollbars
                              >
                                <Table
                                  highlightOnHover
                                  verticalSpacing="md"
                                  horizontalSpacing="lg"
                                  style={{
                                    minWidth:
                                      720,
                                  }}
                                >
                                  <Table.Thead
                                    style={{
                                      background:
                                        "#f8fafc",
                                    }}
                                  >
                                    <Table.Tr>
                                      <Table.Th
                                        style={{
                                          width: 55,
                                        }}
                                      >
                                        #
                                      </Table.Th>

                                      <Table.Th>
                                         النوع الفرعي
                                      </Table.Th>

                                      

                                      <Table.Th>
                                        وصف
                                      </Table.Th>

                                      <Table.Th
                                        ta="center"
                                        style={{
                                          width: 150,
                                        }}
                                      >
                                        الإجراءات
                                      </Table.Th>
                                    </Table.Tr>
                                  </Table.Thead>

                                  <Table.Tbody>
                                    {kpi.sub_kpis.map(
                                      (
                                        subKpi,
                                        index
                                      ) => (
                                        <Table.Tr
                                          key={
                                            subKpi.id
                                          }
                                        >
                                          <Table.Td>
                                            <Text
                                              size="xs"
                                              fw={
                                                700
                                              }
                                              c="dimmed"
                                            >
                                              {String(
                                                index +
                                                  1
                                              ).padStart(
                                                2,
                                                "0"
                                              )}
                                            </Text>
                                          </Table.Td>

                                          <Table.Td>
                                            <Group
                                              gap="sm"
                                              wrap="nowrap"
                                            >
                                              <ThemeIcon
                                                size={
                                                  34
                                                }
                                                radius="md"
                                                variant="light"
                                                color={
                                                  subKpi.is_active
                                                    ? "blue"
                                                    : "gray"
                                                }
                                              >
                                                <IconListCheck
                                                  size={
                                                    17
                                                  }
                                                />
                                              </ThemeIcon>

                                              <Box>
                                                <Text
                                                  fw={
                                                    650
                                                  }
                                                  size="sm"
                                                >
                                                  {
                                                    subKpi.name
                                                  }
                                                </Text>

                                                
                                              </Box>
                                            </Group>
                                          </Table.Td>

                                          <Table.Td>
                                            <Text
                                              size="sm"
                                              c={
                                                subKpi.description
                                                  ? "dark"
                                                  : "dimmed"
                                              }
                                              lineClamp={
                                                2
                                              }
                                              maw={
                                                380
                                              }
                                            >
                                              {subKpi.description ||
                                                "لا يوجد وصف"}
                                            </Text>
                                          </Table.Td>

                                         

                                          <Table.Td>
                                            <Group
                                              justify="center"
                                              gap={
                                                5
                                              }
                                            >
                                              
                                                

                                              <Tooltip label="تعديل">
                                                <ActionIcon
                                                  size={
                                                    34
                                                  }
                                                  radius="md"
                                                  variant="light"
                                                  color="orange"
                                                  onClick={() =>
                                                    openEditSubKpi(
                                                      subKpi
                                                    )
                                                  }
                                                >
                                                  <IconEdit
                                                    size={
                                                      15
                                                    }
                                                  />
                                                </ActionIcon>
                                              </Tooltip>

                                              <Tooltip label="حذف">
                                                <ActionIcon
                                                  size={
                                                    34
                                                  }
                                                  radius="md"
                                                  variant="light"
                                                  color="red"
                                                  onClick={() =>
                                                    deleteSubKpi(
                                                      subKpi
                                                    )
                                                  }
                                                  loading={
                                                    saving
                                                  }
                                                >
                                                  <IconTrash
                                                    size={
                                                      15
                                                    }
                                                  />
                                                </ActionIcon>
                                              </Tooltip>
                                            </Group>
                                          </Table.Td>
                                        </Table.Tr>
                                      )
                                    )}
                                  </Table.Tbody>
                                </Table>
                              </ScrollArea>
                            </Paper>
                          )}
                        </Box>
                      )}
                    </Card>
                  );
                }
              )}
            </Stack>
          )}
        </Stack>
      </Container>

      {/* =====================================================
          KPI MODAL
         ===================================================== */}

      <Modal
        opened={kpiModalOpened}
        onClose={() =>
          setKpiModalOpened(false)
        }
        centered
        radius="xl"
        size="md"
        title={
          <Group gap="sm">
            <ThemeIcon
              size={40}
              radius="lg"
              variant="light"
              color="blue"
            >
              {editingKpi ? (
                <IconEdit
                  size={20}
                />
              ) : (
                <IconPlus
                  size={20}
                />
              )}
            </ThemeIcon>

            <Box>
              <Text
                fw={750}
                size="lg"
              >
                {editingKpi
                  ? "تعديل نوع صيانة"
                  : "إضافة نوع صيانة جديد"}
              </Text>

              <Text
                size="xs"
                c="dimmed"
              >
                {editingKpi
                  ? "تعديل بيانات النوع"
                  : "إنشاء نوع صيانة جديد"}
              </Text>
            </Box>
          </Group>
        }
      >
        <Stack gap="md" mt="sm">
          <TextInput
            label="اسم نوع الصيانة"
            placeholder="مثال: الصيانة الدورية"
            value={kpiName}
            onChange={(event) =>
              setKpiName(
                event.currentTarget
                  .value
              )
            }
            required
            size="md"
            radius="md"
            autoFocus
          />

          <Textarea
            label="الوصف"
            description="  اختياري  "
            placeholder="اكتب وصفًا مختصرًا  ..."
            minRows={4}
            autosize
            value={kpiDescription}
            onChange={(event) =>
              setKpiDescription(
                event.currentTarget
                  .value
              )
            }
            size="md"
            radius="md"
          />

          <Divider />

          <Group
            justify="flex-start"
            gap="sm"
          >
            <Button
              onClick={saveKpi}
              loading={saving}
              leftSection={
                editingKpi ? (
                  <IconCheck
                    size={17}
                  />
                ) : (
                  <IconPlus
                    size={17}
                  />
                )
              }
            >
              {editingKpi
                ? "حفظ التعديلات"
                : "إضافة نوع صيانة جديد"}
            </Button>

            <Button
              variant="default"
              onClick={() =>
                setKpiModalOpened(
                  false
                )
              }
            >
              إلغاء
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* =====================================================
          SUB KPI MODAL
         ===================================================== */}

      <Modal
      dir={"rtl"}
        opened={subKpiModalOpened}
        onClose={() =>
          setSubKpiModalOpened(
            false
          )
        }
        centered
        radius="xl"
        size="md"
        title={
          <Group gap="sm">
            <ThemeIcon
              size={40}
              radius="lg"
              variant="light"
              color="violet"
            >
              {editingSubKpi ? (
                <IconEdit
                  size={20}
                />
              ) : (
                <IconPlus
                  size={20}
                />
              )}
            </ThemeIcon>

            <Box>
              <Text
                fw={750}
                size="lg"
              >
                {editingSubKpi
                  ? "تعديل نوع صيانة فرعي"
                  : "إضافة نوع صيانة فرعي"}
              </Text>

              <Text
                size="xs"
                c="dimmed"
              >
                {editingSubKpi
                  ? "تعديل بيانات النوع الفرعي"
                  : "إضافة نوع صيانة فرعي جديد"}
              </Text>
            </Box>
          </Group>
        }
      >
        <Stack gap="md" mt="sm">
          <Select
            label="اسم نوع الصيانة الرئيسي  "
            placeholder="اختر نوع الصيانة"
            data={kpiOptions}
            value={subKpiParentId}
            onChange={
              setSubKpiParentId
            }
            searchable
            clearable={false}
            required
            size="md"
            radius="md"
          />

          <TextInput
            label="اسم نوع صيانة فرعي"
            placeholder="مثال: فحص الزيت"
            value={subKpiName}
            onChange={(event) =>
              setSubKpiName(
                event.currentTarget
                  .value
              )
            }
            required
            size="md"
            radius="md"
            autoFocus
          />

          <Textarea
            label="الوصف"
            description="  اختياري "
            placeholder="اكتب وصفًا مختصرًا  "
            minRows={4}
            autosize
            value={
              subKpiDescription
            }
            onChange={(event) =>
              setSubKpiDescription(
                event.currentTarget
                  .value
              )
            }
            size="md"
            radius="md"
          />

          <Divider />

          <Group
            justify="flex-start"
            gap="sm"
          >
            <Button
              onClick={
                saveSubKpi
              }
              loading={saving}
              color="violet"
              leftSection={
                editingSubKpi ? (
                  <IconCheck
                    size={17}
                  />
                ) : (
                  <IconPlus
                    size={17}
                  />
                )
              }
            >
              {editingSubKpi
                ? "حفظ التعديلات"
                : "إضافة نوع صيانة فرعي"}
            </Button>

            <Button
              variant="default"
              onClick={() =>
                setSubKpiModalOpened(
                  false
                )
              }
            >
              إلغاء
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}