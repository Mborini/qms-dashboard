"use client";

import {
  Modal,
  Stack,
  Card,
  Group,
  Text,
  Badge,
  Checkbox,
  Button,
  ActionIcon,
  Box,
  Center,
  ScrollArea,
} from "@mantine/core";

import {
  IconFileSpreadsheet,
  IconCopy,
  IconCheck,
  IconAlertCircle,
  IconX,
  IconShieldCheck,
} from "@tabler/icons-react";

import { useMemo, useState } from "react";

import * as XLSX from "xlsx";

/* =========================================================
   DESIGN TOKENS  (Navy + Champagne Gold)
   نفس القيم الموجودة في FailureStats
   الأفضل تنقلها لملف مشترك مثل theme.ts وتستوردها من الاثنين
========================================================= */

const INK = "#1A2A4A";
const SURFACE = "#213459";
const SURFACE_2 = "#2A4070";
const SURFACE_3 = "#324D84";
const GOLD = "#C9A66B";
const GOLD_LIGHT = "#E6CF9D";
const SUCCESS = "#8FE0B0";
const TEXT = "#F3F6FC";
const MUTED = "rgba(240,244,252,.72)";
const FAINT = "rgba(240,244,252,.5)";
const LINE = "rgba(255,255,255,.12)";
const LINE_STRONG = "rgba(255,255,255,.22)";

const FONT =
  '"IBM Plex Sans Arabic", "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif';

const tabular = { fontVariantNumeric: "tabular-nums" as const };

const hexA = (hex: string, a: number) =>
  `${hex}${Math.round(a * 255)
    .toString(16)
    .padStart(2, "0")}`;

const cornerGlow = (hex: string, a = 0.25) =>
  `radial-gradient(75% 95% at 100% 0%, ${hexA(hex, a)} 0%, transparent 70%)`;

const ghostBtn = {
  background: "transparent",
  border: `1px solid ${LINE_STRONG}`,
  color: TEXT,
  fontWeight: 600,
  fontFamily: FONT,
};

const goldOutlineBtn = {
  background: hexA(GOLD, 0.1),
  border: `1px solid ${hexA(GOLD, 0.6)}`,
  color: GOLD_LIGHT,
  fontWeight: 600,
  fontFamily: FONT,
};

const goldSolidBtn = {
  background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
  border: "none",
  color: INK,
  fontWeight: 700,
  fontFamily: FONT,
};

const iconBoxStyle = {
  display: "grid",
  placeItems: "center",
  color: GOLD_LIGHT,
  background: hexA(GOLD, 0.1),
  border: `1px solid ${hexA(GOLD, 0.45)}`,
};

const iconBtnStyle = {
  background: "rgba(255,255,255,.06)",
  border: `1px solid ${LINE_STRONG}`,
  color: GOLD_LIGHT,
};

const modalStyles = {
  content: {
    background: SURFACE,
    border: `1px solid ${LINE_STRONG}`,
    boxShadow: "0 40px 80px -30px rgba(10,20,45,.7)",
    fontFamily: FONT,
    overflow: "hidden",
  },
  header: {
    background: SURFACE,
    borderBottom: `1px solid ${LINE}`,
    padding: "18px 20px 12px",
  },
  title: { flex: 1, minWidth: 0, color: TEXT },
  close: { color: MUTED },
  body: { padding: "14px 20px 20px" },
};

/* =========================================================
   TYPES
========================================================= */

type FailureItem = {
  id?: string | number;

  districtName?: string | null;
  district?: string | null;

  blockName?: string | null;
  block?: string | null;

  kpiNameAr?: string | null;

  status?: string | null;

  userName?: string | null;

  complaintSource?: string | null;

  date?: string | Date | null;
  createdAt?: string | Date | null;
  created_at?: string | Date | null;
  violationDate?: string | Date | null;
  failureDate?: string | Date | null;
};

type FailureListModalProps = {
  opened: boolean;
  onClose: () => void;
  title: string;
  failures?: FailureItem[];
  status?: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function FailureListModal({
  opened,
  onClose,
  title,
  failures = [],
  status,
}: FailureListModalProps) {
  /* =======================================================
     STATE
  ======================================================= */

  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);
  const [confirmOpened, setConfirmOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  /* =======================================================
     PAYMENT PERMISSION
  ======================================================= */

  const allowPayment = status === "PendingSpValidation";

  /* =======================================================
     SORT FAILURES
     الترتيب:
     1. الحي أبجديًا
     2. رقم المخالفة تصاعديًا
  ======================================================= */

  const sortedFailures = useMemo(() => {
    return [...failures].sort((a, b) => {
      const blockA = String(a.blockName ?? a.block ?? "").trim();
      const blockB = String(b.blockName ?? b.block ?? "").trim();

      const blockCompare = blockA.localeCompare(blockB, "ar", {
        sensitivity: "base",
      });

      if (blockCompare !== 0) {
        return blockCompare;
      }

      const idA = Number(a.id);
      const idB = Number(b.id);

      if (!Number.isNaN(idA) && !Number.isNaN(idB)) {
        return idA - idB;
      }

      return String(a.id ?? "").localeCompare(String(b.id ?? ""), "ar");
    });
  }, [failures]);

  /* =======================================================
     SELECTABLE IDS
  ======================================================= */

  const selectableIds = useMemo(() => {
    return failures
      .map((item) => item.id)
      .filter((id): id is string | number => id !== undefined && id !== null);
  }, [failures]);

  const allSelected =
    selectableIds.length > 0 && selectedIds.length === selectableIds.length;

  /* =======================================================
     SELECTION
  ======================================================= */

  const selectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(selectableIds);
  };

  const toggleSelect = (id?: string | number) => {
    if (id === undefined || id === null) {
      return;
    }

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }

      return [...prev, id];
    });
  };

  /* =======================================================
     CLOSE CONFIRM MODAL
  ======================================================= */

  const closeConfirm = () => {
    if (loading) {
      return;
    }

    setConfirmOpened(false);
  };

  /* =======================================================
     HELPER: ITEMS TO USE (SELECTED OR ALL)
  ======================================================= */

  const getTargetItems = () => {
    if (selectedIds.length > 0) {
      return failures.filter(
        (item) =>
          item.id !== undefined &&
          item.id !== null &&
          selectedIds.includes(item.id)
      );
    }

    return sortedFailures;
  };

  /* =======================================================
     COPY VIOLATIONS
  ======================================================= */

  const copyViolations = async () => {
    const items = getTargetItems();

    if (items.length === 0) {
      alert("لا توجد مخالفات للنسخ");
      return;
    }

    const text = items
      .map((item) => {
        const id = item.id ?? "";
        const district = item.districtName ?? item.district ?? "";
        const block = item.blockName ?? item.block ?? "";

        const location =
          district && block ? `${district} - ${block}` : district || block;

        return `${id} - ${location}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Copy failed:", error);
      alert("تعذر نسخ المخالفات");
    }
  };

  /* =======================================================
     EXPORT EXCEL
  ======================================================= */

  const exportExcel = () => {
    const exportItems = getTargetItems();

    if (exportItems.length === 0) {
      alert("لا توجد مخالفات للتصدير");
      return;
    }

    const rows = exportItems.map((item) => ({
      "رقم المخالفة": item.id ?? "",
      "اسم المنطقة": item.districtName ?? item.district ?? "",
      "اسم الحي": item.blockName ?? item.block ?? "",
      "الحالة": item.status ?? "",
      "مؤشر الأداء": item.kpiNameAr ?? "",
      "مصدر البلاغ": item.complaintSource ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 28 },
      { wch: 30 },
      { wch: 55 },
      { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "المخالفات");

    XLSX.writeFile(workbook, "المخالفات.xlsx");
  };

  /* =======================================================
     VALIDATE / PAY FAILURES
  ======================================================= */

  async function validateFailures() {
    if (selectedIds.length === 0) {
      alert("لم يتم تحديد أي مخالفات");
      return;
    }

    try {
      setLoading(true);

      let success = 0;

      for (const id of selectedIds) {
        const response = await fetch(`/api/validate-failure/${id}`, {
          method: "POST",
        });

        if (response.ok) {
          success++;
        } else if (response.status === 401) {
          alert("انتهت صلاحية التوكن، أعد تسجيل الدخول");
          return;
        } else if (response.status === 504) {
          alert("تعذر الاتصال بخادم AVTR");
          return;
        } else {
          const data = await response.json().catch(() => null);
          console.error("Validation error:", data);
        }
      }

      alert(`تم تسديد ${success} من ${selectedIds.length} مخالفة`);

      if (success > 0) {
        exportExcel(); // يصدّر المحدد قبل تفريغ التحديد
      }

      setSelectedIds([]);
      setConfirmOpened(false);
      onClose();
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء التسديد");
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* ==================================================
          MAIN MODAL
      ================================================== */}

      <Modal
        opened={opened}
        onClose={onClose}
        centered
        size="lg"
        radius={22}
        padding="md"
        overlayProps={{
          backgroundOpacity: 0.7,
          blur: 6,
          color: INK,
        }}
        styles={modalStyles}
        title={
          <Group gap="sm" wrap="nowrap" w="100%">
            <Box
              w={40}
              h={40}
              style={{ ...iconBoxStyle, borderRadius: 12, flexShrink: 0 }}
            >
              <IconAlertCircle size={21} stroke={1.7} />
            </Box>

            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text fw={700} size="md" c={TEXT} truncate>
                {title}
              </Text>

              <Text size="xs" c={MUTED} mt={2}>
                تفاصيل المخالفات المسجلة
              </Text>
            </Box>
          </Group>
        }
        dir="rtl"
      >
        <Stack gap="md">
          {/* ==================================================
              INFO / TOOLS
          ================================================== */}

          <Card
            radius={18}
            p="md"
            style={{
              position: "relative",
              overflow: "hidden",
              background: `${cornerGlow(GOLD, 0.2)}, ${SURFACE_2}`,
              border: `1px solid ${LINE_STRONG}`,
              fontFamily: FONT,
            }}
          >
            <Box
              style={{
                position: "absolute",
                insetInline: 0,
                top: 0,
                height: 2,
                background: `linear-gradient(90deg, ${GOLD}, ${hexA(GOLD, 0)})`,
              }}
            />

            <Group justify="space-between" align="center" gap="md">
              {/* العدد */}
              <Group gap="sm" wrap="nowrap">
                <Box
                  w={48}
                  h={48}
                  style={{ ...iconBoxStyle, borderRadius: 14 }}
                >
                  <Text fw={800} size="lg" c={GOLD_LIGHT} style={tabular}>
                    {failures.length}
                  </Text>
                </Box>

                <Stack gap={1}>
                  <Text size="xs" fw={600} c={MUTED}>
                    إجمالي المخالفات
                  </Text>

                  <Text size="sm" fw={700} c={TEXT}>
                    {failures.length === 1
                      ? "مخالفة واحدة"
                      : `${failures.length} مخالفة`}
                  </Text>
                </Stack>
              </Group>

              {/* الأدوات */}
              <Group gap={8} wrap="nowrap">
                <ActionIcon
                  variant="default"
                  size={38}
                  radius="xl"
                  onClick={copyViolations}
                  title={
                    selectedIds.length > 0
                      ? "نسخ المخالفات المحددة"
                      : "نسخ جميع المخالفات"
                  }
                  style={{
                    ...iconBtnStyle,
                    color: copied ? SUCCESS : GOLD_LIGHT,
                    borderColor: copied ? hexA(SUCCESS, 0.6) : LINE_STRONG,
                  }}
                >
                  {copied ? (
                    <IconCheck size={19} stroke={2.2} />
                  ) : (
                    <IconCopy size={19} stroke={1.7} />
                  )}
                </ActionIcon>

                <ActionIcon
                  variant="default"
                  size={38}
                  radius="xl"
                  onClick={exportExcel}
                  title="تصدير Excel"
                  style={iconBtnStyle}
                >
                  <IconFileSpreadsheet size={19} stroke={1.7} />
                </ActionIcon>

                {allowPayment && (
                  <Button
                    size="xs"
                    radius="xl"
                    variant="default"
                    leftSection={
                      allSelected ? (
                        <IconX size={15} stroke={2} />
                      ) : (
                        <IconCheck size={15} stroke={2} />
                      )
                    }
                    onClick={selectAll}
                    style={allSelected ? ghostBtn : goldOutlineBtn}
                  >
                    {allSelected ? "إلغاء التحديد" : "تحديد الكل"}
                  </Button>
                )}
              </Group>
            </Group>
          </Card>

          {/* ==================================================
              SELECTION INFO
          ================================================== */}

          {selectedIds.length > 0 && (
            <Box
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                background: hexA(GOLD, 0.1),
                border: `1px solid ${hexA(GOLD, 0.5)}`,
              }}
            >
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <IconCheck size={17} color={GOLD_LIGHT} stroke={2} />

                  <Text size="xs" fw={700} c={GOLD_LIGHT} style={tabular}>
                    تم تحديد {selectedIds.length} مخالفة
                  </Text>
                </Group>

                <Text size="xs" c={MUTED}>
                  جاهزة للإجراء
                </Text>
              </Group>
            </Box>
          )}

          <Box style={{ height: 1, background: LINE }} />

          {/* ==================================================
              FAILURES LIST
          ================================================== */}

          <Box style={{ position: "relative" }}>
            {sortedFailures.length === 0 ? (
              <Card
                radius={18}
                p="xl"
                style={{
                  background: SURFACE_2,
                  border: `1px dashed ${LINE_STRONG}`,
                }}
              >
                <Center>
                  <Stack align="center" gap="xs">
                    <Box
                      w={56}
                      h={56}
                      style={{ ...iconBoxStyle, borderRadius: 18 }}
                    >
                      <IconAlertCircle size={28} stroke={1.5} />
                    </Box>

                    <Text fw={700} c={TEXT}>
                      لا توجد مخالفات
                    </Text>

                    <Text size="xs" c={MUTED}>
                      لا توجد بيانات لعرضها
                    </Text>
                  </Stack>
                </Center>
              </Card>
            ) : (
              <ScrollArea.Autosize
                mah="min(52vh, 520px)"
                type="never"
                offsetScrollbars={false}
              >
              <Stack gap="xs" style={{ padding: "2px 4px 4px 2px" }}>
                {sortedFailures.map((item, index) => {
                  const district = item.districtName ?? item.district ?? "";
                  const block = item.blockName ?? item.block ?? "";

                  const isSelected =
                    item.id !== undefined &&
                    item.id !== null &&
                    selectedIds.includes(item.id);

                  const showDistrict =
                    !!district && district !== "مخالفات حسب مؤشرات الأداء";

                  return (
                    <Card
                      key={`${item.id ?? "failure"}-${index}`}
                      dir="rtl"
                      radius={16}
                      p={0}
                      mih={58}
                      style={{
                        overflow: "hidden",
                        background: isSelected
                          ? `${cornerGlow(GOLD, 0.22)}, ${SURFACE_2}`
                          : SURFACE_2,
                        border: `1px solid ${isSelected ? GOLD : LINE}`,
                        boxShadow: isSelected
                          ? `0 0 0 3px ${hexA(GOLD, 0.16)}`
                          : "none",
                        transition: "all .18s ease",
                      }}
                    >
                      <Group
                        justify="space-between"
                        align="center"
                        wrap="nowrap"
                        w="100%"
                        h="100%"
                        px="sm"
                        py={9}
                      >
                        {/* محتوى المخالفة */}
                        <Group
                          gap="sm"
                          align="center"
                          wrap="nowrap"
                          style={{ minWidth: 0, flex: 1 }}
                        >
                          {/* رقم المخالفة */}
                          <Box style={{ flexShrink: 0 }}>
                            <Badge
                              size="md"
                              radius="md"
                              variant="default"
                              styles={{
                                root: {
                                  minWidth: 82,
                                  height: 30,
                                  padding: "0 10px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 800,
                                  letterSpacing: ".2px",
                                  fontFamily: FONT,
                                  fontVariantNumeric: "tabular-nums",
                                  color: isSelected ? INK : GOLD_LIGHT,
                                  background: isSelected
                                    ? `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`
                                    : hexA(GOLD, 0.1),
                                  border: isSelected
                                    ? "none"
                                    : `1px solid ${hexA(GOLD, 0.45)}`,
                                },
                              }}
                            >
                              {item.id ?? "—"}
                            </Badge>
                          </Box>

                          {/* الفاصل */}
                          <Box
                            w={1}
                            h={25}
                            style={{
                              background: isSelected
                                ? hexA(GOLD, 0.5)
                                : LINE_STRONG,
                              flexShrink: 0,
                            }}
                          />

                          {/* المنطقة والحي */}
                          <Box style={{ minWidth: 0, flex: 1 }}>
                            <Group gap={6} align="center" wrap="nowrap">
                              {showDistrict && (
                                <Text size="sm" fw={600} c={MUTED} truncate>
                                  {district}
                                </Text>
                              )}

                              {showDistrict && block && (
                                <Text size="sm" fw={600} c={FAINT}>
                                  -
                                </Text>
                              )}

                              <Text
                                size="sm"
                                fw={700}
                                c={isSelected ? GOLD_LIGHT : TEXT}
                                truncate
                              >
                                {block || "غير محدد"}
                              </Text>
                            </Group>

                            <Text size="10px" c={FAINT} mt={2}>
                              مخالفة رقم {item.id ?? "—"}
                            </Text>
                          </Box>
                        </Group>

                        {/* التحديد */}
                        {allowPayment && (
                          <Checkbox
                            size="sm"
                            radius="sm"
                            color={GOLD}
                            iconColor={INK}
                            checked={isSelected}
                            disabled={item.id === undefined || item.id === null}
                            onChange={() => toggleSelect(item.id)}
                            styles={{
                              input: {
                                cursor: "pointer",
                                background: isSelected ? GOLD : SURFACE_3,
                                borderColor: isSelected ? GOLD : LINE_STRONG,
                              },
                            }}
                          />
                        )}
                      </Group>
                    </Card>
                  );
                })}
              </Stack>
              </ScrollArea.Autosize>
            )}
          </Box>

          {/* ==================================================
              PAYMENT ACTION
          ================================================== */}

          {allowPayment && (
            <Card
              radius={18}
              p="sm"
              style={{
                background: `${cornerGlow(GOLD, 0.2)}, ${SURFACE_2}`,
                border: `1px solid ${hexA(GOLD, 0.45)}`,
              }}
            >
              <Group justify="space-between" align="center" gap="sm">
                <Group gap="sm" wrap="nowrap">
                  <Box
                    w={40}
                    h={40}
                    style={{ ...iconBoxStyle, borderRadius: 12 }}
                  >
                    <IconShieldCheck size={20} stroke={1.7} />
                  </Box>

                  <Stack gap={0}>
                    <Text size="xs" fw={700} c={GOLD_LIGHT}>
                      جاهز للتسديد
                    </Text>

                    <Text size="xs" c={MUTED}>
                      {selectedIds.length > 0
                        ? `تم تحديد ${selectedIds.length} مخالفة`
                        : "حدد المخالفات المطلوبة أولًا"}
                    </Text>
                  </Stack>
                </Group>

                <Button
                  size="sm"
                  radius="xl"
                  variant="default"
                  disabled={selectedIds.length === 0}
                  leftSection={<IconShieldCheck size={17} stroke={1.8} />}
                  onClick={() => setConfirmOpened(true)}
                  style={{
                    ...goldSolidBtn,
                    opacity: selectedIds.length === 0 ? 0.45 : 1,
                  }}
                >
                  تسديد المحدد
                  {selectedIds.length > 0 && ` (${selectedIds.length})`}
                </Button>
              </Group>
            </Card>
          )}
        </Stack>
      </Modal>

      {/* ==================================================
          CONFIRM PAYMENT MODAL
      ================================================== */}

      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        centered
        size="sm"
        radius={22}
        overlayProps={{
          backgroundOpacity: 0.7,
          blur: 6,
          color: INK,
        }}
        styles={modalStyles}
        title={
          <Group gap="sm" wrap="nowrap">
            <Box
              w={40}
              h={40}
              style={{ ...iconBoxStyle, borderRadius: 12, flexShrink: 0 }}
            >
              <IconShieldCheck size={20} stroke={1.7} />
            </Box>

            <Stack gap={0}>
              <Text fw={700} size="sm" c={TEXT}>
                تأكيد التسديد
              </Text>

              <Text size="xs" c={MUTED}>
                تحقق من العملية قبل التنفيذ
              </Text>
            </Stack>
          </Group>
        }
        dir="rtl"
      >
        <Stack gap="md">
          <Card
            radius={16}
            p="md"
            style={{
              background: `${cornerGlow(GOLD, 0.22)}, ${SURFACE_2}`,
              border: `1px solid ${hexA(GOLD, 0.45)}`,
            }}
          >
            <Group justify="space-between" align="center">
              <Stack gap={2}>
                <Text size="xs" c={MUTED} fw={600}>
                  عدد المخالفات المحددة
                </Text>

                <Text
                  fw={800}
                  c={GOLD_LIGHT}
                  style={{ fontSize: 30, lineHeight: 1.1, ...tabular }}
                >
                  {selectedIds.length}
                </Text>
              </Stack>

              <Badge
                size="lg"
                radius="xl"
                variant="default"
                styles={{
                  root: {
                    fontFamily: FONT,
                    color: GOLD_LIGHT,
                    background: hexA(GOLD, 0.1),
                    border: `1px solid ${hexA(GOLD, 0.5)}`,
                  },
                }}
              >
                جاهز للتسديد
              </Badge>
            </Group>
          </Card>

          <Group grow gap="sm">
            <Button
              variant="default"
              radius="xl"
              disabled={loading}
              onClick={closeConfirm}
              style={ghostBtn}
            >
              إلغاء
            </Button>

            <Button
              variant="default"
              loading={loading}
              radius="xl"
              leftSection={!loading && <IconShieldCheck size={18} stroke={1.8} />}
              onClick={validateFailures}
              style={goldSolidBtn}
            >
              تأكيد التسديد
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
