
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
  PasswordInput,
  Divider,
  ActionIcon,
} from "@mantine/core";

import {
  IconFileSpreadsheet,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";

import { useState } from "react";

import * as XLSX from "xlsx";

export default function FailureListModal({
  opened,
  onClose,
  title,
  failures = [],
  status,
}) {
  const [selectedIds, setSelectedIds] = useState([]);

  const [confirmOpened, setConfirmOpened] =
    useState(false);

  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);

  // حالة النسخ
  const [copied, setCopied] = useState(false);

  const allowPayment =
    status === "PendingSpValidation";

  // =============================
  // تحديد الكل
  // =============================

  const selectAll = () => {
    if (
      selectedIds.length ===
      failures.length
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(
        failures.map((item) => item.id)
      );
    }
  };

  // =============================
  // تحديد مخالفة
  // =============================

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter(
          (x) => x !== id
        );
      }

      return [...prev, id];
    });
  };

  // =============================
  // نسخ المخالفات مع معلوماتها
  // =============================

 const copyViolations = async () => {
  const items =
    selectedIds.length > 0
      ? failures.filter((item) =>
          selectedIds.includes(item.id)
        )
      : failures;

  if (items.length === 0) {
    alert("لا توجد مخالفات للنسخ");
    return;
  }

  const text = items
    .map((item) => {
      const id = item.id ?? "";
      const block = item.block ?? "";

      return `${id} - ${block}`;
    })
    .join("\n");

  try {
    await navigator.clipboard.writeText(text);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  } catch (error) {
    console.error("Copy failed:", error);
    alert("تعذر نسخ المخالفات");
  }
};

  // =============================
  // Excel
  // =============================

  const exportExcel = () => {
    const exportItems =
      selectedIds.length > 0
        ? failures.filter((item) =>
            selectedIds.includes(item.id)
          )
        : failures;

    const rows = exportItems.map(
      (item) => ({
        "رقم المخالفة":
          item.id,

        "اسم المنطقة":
          item.district,

        "اسم الحي":
          item.block,
      })
    );

    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "المخالفات"
    );

    XLSX.writeFile(
      workbook,
      "المخالفات.xlsx"
    );
  };

  // =============================
  // تنفيذ التسديد
  // =============================

  async function validateFailures() {
    if (!code) {
      alert(
        "يرجى إدخال كلمة المرور"
      );

      return;
    }

    if (
      selectedIds.length === 0
    ) {
      alert(
        "لم يتم تحديد مخالفات"
      );

      return;
    }

    try {
      setLoading(true);

      let success = 0;

      for (const id of selectedIds) {
        const response =
          await fetch(
            `/api/validate-failure/${id}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                password: code,
              }),
            }
          );

        const data =
          await response.json();

        if (response.ok) {
          success++;
        } else if (
          response.status === 401
        ) {
          alert(
            "كلمة المرور غير صحيحة"
          );

          return;
        } else if (
          response.status === 504
        ) {
          alert(
            "تعذر الاتصال بخادم AVTR"
          );

          return;
        } else {
          console.log(
            "Validation error:",
            data
          );
        }
      }

      alert(
        `تم تسديد ${success} من ${selectedIds.length} مخالفة`
      );

      if (success > 0) {
        exportExcel();
      }

      setSelectedIds([]);

      setCode("");

      setConfirmOpened(false);

      onClose();
    } catch (error) {
      console.error(error);

      alert(
        "حدث خطأ أثناء التسديد"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ===========================
          قائمة المخالفات
      ============================ */}

      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group
            justify="space-between"
            w="100%"
          >
            <Text
              fw={800}
              size="md"
            >
              {title}
            </Text>
          </Group>
        }
        centered
        size="sm"
        radius="lg"
        shadow="lg"
        dir="rtl"
      >
        <Stack gap="sm">

          {/* ===========================
              معلومات المخالفات
          ============================ */}

          <Card
            radius="md"
            p="xs"
            withBorder
            style={{
              background:
                "rgba(255,255,255,.6)",

              backdropFilter:
                "blur(8px)",
            }}
          >
            <Group
              justify="space-between"
            >

              <Stack gap={4}>
                <Text
                  fw={700}
                  size="xs"
                >
                  عدد المخالفات
                </Text>

                <Badge
                  size="sm"
                  radius="xl"
                  variant="light"
                  color="orange"
                >
                  {failures.length} مخالفة
                </Badge>
              </Stack>

              <Group gap={6}>

                {/* ===========================
                    نسخ المخالفات
                ============================ */}

                <ActionIcon
                  variant="light"
                  color={
                    copied
                      ? "green"
                      : "blue"
                  }
                  size="md"
                  radius="xl"
                  onClick={
                    copyViolations
                  }
                  title={
                    selectedIds.length > 0
                      ? "نسخ المخالفات المحددة"
                      : "نسخ جميع المخالفات"
                  }
                >
                  {copied ? (
                    <IconCheck
                      size={18}
                    />
                  ) : (
                    <IconCopy
                      size={18}
                    />
                  )}
                </ActionIcon>

                {/* ===========================
                    Excel
                ============================ */}

                <ActionIcon
                  variant="light"
                  color="green"
                  size="md"
                  radius="xl"
                  onClick={
                    exportExcel
                  }
                  title="تصدير Excel"
                >
                  <IconFileSpreadsheet
                    size={18}
                  />
                </ActionIcon>

                {/* ===========================
                    تحديد الكل
                ============================ */}

                {allowPayment && (
                  <Button
                    size="xs"
                    radius="xl"
                    variant="light"
                    onClick={
                      selectAll
                    }
                  >
                    {selectedIds.length ===
                    failures.length
                      ? "إلغاء التحديد"
                      : "تحديد الكل"}
                  </Button>
                )}

              </Group>
            </Group>
          </Card>

          <Divider />

          {/* ===========================
              قائمة المخالفات
          ============================ */}

          <Stack
            gap="xs"
            style={{
              overflowY:
                "auto",
            }}
          >
            {failures.map(
              (item, index) => (
                <Card
                  dir="rtl"
                  key={`${item.id}-${index}`}
                  withBorder
                  radius="md"
                  p="xs"
                  shadow="xs"
                >
                  <Group
                    justify="space-between"
                    align="center"
                    w="100%"
                  >

                    <Group gap="xs">

                      {/* رقم المخالفة */}

                      <Badge
                        size="sm"
                        radius="xl"
                        color="blue"
                        variant="light"
                      >
                        {item.id}
                      </Badge>

                      {/* المنطقة والحي */}

                      <Text
                        size="xs"
                        fw={700}
                      >
                        {item.district !==
                          "مخالفات حسب مؤشرات الأداء" && (
                          <>
                            {
                              item.district
                            }

                            {" - "}
                          </>
                        )}

                        {item.block}
                      </Text>

                    </Group>

                    {/* Checkbox */}

                    {allowPayment && (
                      <Checkbox
                        size="xs"
                        checked={selectedIds.includes(
                          item.id
                        )}
                        onChange={() =>
                          toggleSelect(
                            item.id
                          )
                        }
                      />
                    )}

                  </Group>
                </Card>
              )
            )}
          </Stack>

          {/* ===========================
              زر التسديد
          ============================ */}

          {allowPayment && (
            <Button
              fullWidth
              size="sm"
              radius="xl"
              color="green"
              disabled={
                selectedIds.length ===
                0
              }
              onClick={() =>
                setConfirmOpened(
                  true
                )
              }
            >
              تسديد المحدد (
              {selectedIds.length})
            </Button>
          )}

        </Stack>
      </Modal>

      {/* ===========================
          تأكيد الكود
      ============================ */}

      <Modal
        opened={confirmOpened}
        onClose={() =>
          setConfirmOpened(
            false
          )
        }
        centered
        title="تأكيد التسديد"
        dir="rtl"
      >
        <Stack gap="md">

          <Text fw={700}>
            سيتم تسديد{" "}
            {selectedIds.length}{" "}
            مخالفة
          </Text>

          <PasswordInput
            label="كود التأكيد"
            placeholder="ادخل الكود"
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
              )
            }
          />

          <Button
            color="green"
            loading={loading}
            radius="xl"
            onClick={
              validateFailures
            }
          >
            تأكيد التسديد
          </Button>

        </Stack>
      </Modal>
    </>
  );
}

