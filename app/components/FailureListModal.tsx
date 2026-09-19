
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
  Box,
  Center,
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

  const [selectedIds, setSelectedIds] = useState<
    Array<string | number>
  >([]);

  const [confirmOpened, setConfirmOpened] =
    useState(false);

  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  /* =======================================================
     PAYMENT PERMISSION
  ======================================================= */

  const allowPayment =
    status === "PendingSpValidation";

  /* =======================================================
     SORT FAILURES
     
     الترتيب:
     1. الحي أبجديًا
     2. رقم المخالفة تصاعديًا
  ======================================================= */

  const sortedFailures = useMemo(() => {
    return [...failures].sort((a, b) => {
      const blockA = String(
        a.blockName ??
          a.block ??
          ""
      ).trim();

      const blockB = String(
        b.blockName ??
          b.block ??
          ""
      ).trim();

      const blockCompare =
        blockA.localeCompare(
          blockB,
          "ar",
          {
            sensitivity: "base",
          }
        );

      if (blockCompare !== 0) {
        return blockCompare;
      }

      const idA = Number(a.id);
      const idB = Number(b.id);

      if (
        !Number.isNaN(idA) &&
        !Number.isNaN(idB)
      ) {
        return idA - idB;
      }

      return String(
        a.id ?? ""
      ).localeCompare(
        String(b.id ?? ""),
        "ar"
      );
    });
  }, [failures]);

  /* =======================================================
     SELECTABLE IDS
  ======================================================= */

  const selectableIds = useMemo(() => {
    return failures
      .map((item) => item.id)
      .filter(
        (
          id
        ): id is string | number =>
          id !== undefined &&
          id !== null
      );
  }, [failures]);

  /* =======================================================
     ALL SELECTED
  ======================================================= */

  const allSelected =
    selectableIds.length > 0 &&
    selectedIds.length ===
      selectableIds.length;

  /* =======================================================
     SELECT ALL
  ======================================================= */

  const selectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(selectableIds);
  };

  /* =======================================================
     TOGGLE SELECT
  ======================================================= */

  const toggleSelect = (
    id?: string | number
  ) => {
    if (
      id === undefined ||
      id === null
    ) {
      return;
    }

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter(
          (x) => x !== id
        );
      }

      return [
        ...prev,
        id,
      ];
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
    setCode("");
  };

  /* =======================================================
     COPY VIOLATIONS
  ======================================================= */

  const copyViolations = async () => {
    const items =
      selectedIds.length > 0
        ? failures.filter(
            (item) =>
              item.id !==
                undefined &&
              item.id !== null &&
              selectedIds.includes(
                item.id
              )
          )
        : sortedFailures;

    if (items.length === 0) {
      alert(
        "لا توجد مخالفات للنسخ"
      );
      return;
    }

    const text = items
      .map((item) => {
        const id =
          item.id ?? "";

        const district =
          item.districtName ??
          item.district ??
          "";

        const block =
          item.blockName ??
          item.block ??
          "";

        const location =
          district && block
            ? `${district} - ${block}`
            : district ||
              block;

        return `${id} - ${location}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );

      alert(
        "تعذر نسخ المخالفات"
      );
    }
  };

  /* =======================================================
     EXPORT EXCEL
  ======================================================= */

  const exportExcel = () => {
    const exportItems =
      selectedIds.length > 0
        ? failures.filter(
            (item) =>
              item.id !==
                undefined &&
              item.id !== null &&
              selectedIds.includes(
                item.id
              )
          )
        : sortedFailures;

    if (exportItems.length === 0) {
      alert(
        "لا توجد مخالفات للتصدير"
      );
      return;
    }

    const rows =
      exportItems.map(
        (item) => ({
          "رقم المخالفة":
            item.id ?? "",

          "اسم المنطقة":
            item.districtName ??
            item.district ??
            "",

          "اسم الحي":
            item.blockName ??
            item.block ??
            "",

          "الحالة":
            item.status ?? "",

          "مؤشر الأداء":
            item.kpiNameAr ??
            "",

          "مصدر البلاغ":
            item.complaintSource ??
            "",
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );

    worksheet["!cols"] = [
      {
        wch: 18,
      },
      {
        wch: 20,
      },
      {
        wch: 28,
      },
      {
        wch: 30,
      },
      {
        wch: 55,
      },
      {
        wch: 22,
      },
    ];

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

  /* =======================================================
     VALIDATE / PAY FAILURES
  ======================================================= */

  async function validateFailures() {
    if (!code.trim()) {
      alert(
        "يرجى إدخال كلمة المرور"
      );

      return;
    }

    if (
      selectedIds.length === 0
    ) {
      alert(
        "لم يتم تحديد أي مخالفات"
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
                password:
                  code,
              }),
            }
          );

        const data =
          await response.json();

        if (response.ok) {
          success++;
        } else if (
          response.status ===
          401
        ) {
          alert(
            "كلمة المرور غير صحيحة"
          );

          return;
        } else if (
          response.status ===
          504
        ) {
          alert(
            "تعذر الاتصال بخادم AVTR"
          );

          return;
        } else {
          console.error(
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
      console.error(
        error
      );

      alert(
        "حدث خطأ أثناء التسديد"
      );
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
        radius="xl"
        padding="md"
        shadow="xl"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 5,
        }}
        styles={{
          content: {
            overflow: "hidden",
          },

          header: {
            padding:
              "18px 20px 12px",
            borderBottom:
              "1px solid #edf0f2",
          },

          body: {
            padding:
              "14px 20px 20px",
          },
        }}
        title={
          <Group
            gap="sm"
            wrap="nowrap"
            w="100%"
          >
            <Box
              w={38}
              h={38}
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                borderRadius:
                  12,
                background:
                  "linear-gradient(135deg, #eff6ff, #dbeafe)",
                border:
                  "1px solid #bfdbfe",
              }}
            >
              <IconAlertCircle
                size={21}
                stroke={2}
                color="#2563eb"
              />
            </Box>

            <Box
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <Text
                fw={850}
                size="md"
                c="#172033"
                truncate
              >
                {title}
              </Text>

              <Text
                size="xs"
                c="dimmed"
                mt={2}
              >
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
            radius="xl"
            p="md"
            withBorder
            style={{
              background:
                "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              border:
                "1px solid #e7ebf0",
              boxShadow:
                "0 8px 30px rgba(15,23,42,.05)",
            }}
          >
            <Group
              justify="space-between"
              align="center"
              gap="md"
            >
              {/* العدد */}

              <Group
                gap="sm"
                wrap="nowrap"
              >
                <Box
                  w={46}
                  h={46}
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    borderRadius:
                      14,
                    background:
                      "linear-gradient(135deg, #fff7ed, #ffedd5)",
                    border:
                      "1px solid #fed7aa",
                  }}
                >
                  <Text
                    fw={900}
                    size="lg"
                    c="#ea580c"
                  >
                    {
                      failures.length
                    }
                  </Text>
                </Box>

                <Stack gap={1}>
                  <Text
                    size="xs"
                    fw={700}
                    c="dimmed"
                  >
                    إجمالي المخالفات
                  </Text>

                  <Text
                    size="sm"
                    fw={850}
                    c="#172033"
                  >
                    {failures.length ===
                    1
                      ? "مخالفة واحدة"
                      : `${failures.length} مخالفة`}
                  </Text>
                </Stack>
              </Group>

              {/* الأدوات */}

              <Group
                gap={7}
                wrap="nowrap"
              >
                <ActionIcon
                  variant="light"
                  color={
                    copied
                      ? "green"
                      : "blue"
                  }
                  size={38}
                  radius="xl"
                  onClick={
                    copyViolations
                  }
                  title={
                    selectedIds.length >
                    0
                      ? "نسخ المخالفات المحددة"
                      : "نسخ جميع المخالفات"
                  }
                  style={{
                    border:
                      "1px solid rgba(37,99,235,.12)",
                  }}
                >
                  {copied ? (
                    <IconCheck
                      size={19}
                      stroke={2.5}
                    />
                  ) : (
                    <IconCopy
                      size={19}
                    />
                  )}
                </ActionIcon>

                <ActionIcon
                  variant="light"
                  color="green"
                  size={38}
                  radius="xl"
                  onClick={
                    exportExcel
                  }
                  title="تصدير Excel"
                  style={{
                    border:
                      "1px solid rgba(22,163,74,.12)",
                  }}
                >
                  <IconFileSpreadsheet
                    size={19}
                  />
                </ActionIcon>

                {allowPayment && (
                  <Button
                    size="xs"
                    radius="xl"
                    variant={
                      allSelected
                        ? "filled"
                        : "light"
                    }
                    color={
                      allSelected
                        ? "red"
                        : "blue"
                    }
                    leftSection={
                      allSelected ? (
                        <IconX
                          size={15}
                        />
                      ) : (
                        <IconCheck
                          size={15}
                        />
                      )
                    }
                    onClick={
                      selectAll
                    }
                  >
                    {allSelected
                      ? "إلغاء التحديد"
                      : "تحديد الكل"}
                  </Button>
                )}
              </Group>
            </Group>
          </Card>

          {/* ==================================================
              SELECTION INFO
          ================================================== */}

          {selectedIds.length >
            0 && (
            <Box
              style={{
                padding:
                  "10px 14px",
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, #eff6ff, #f0f9ff)",
                border:
                  "1px solid #bfdbfe",
              }}
            >
              <Group
                justify="space-between"
                align="center"
              >
                <Group gap="xs">
                  <IconCheck
                    size={17}
                    color="#2563eb"
                  />

                  <Text
                    size="xs"
                    fw={750}
                    c="#1e40af"
                  >
                    تم تحديد{" "}
                    {
                      selectedIds.length
                    }{" "}
                    مخالفة
                  </Text>
                </Group>

                <Text
                  size="xs"
                  c="dimmed"
                >
                  جاهزة للإجراء
                </Text>
              </Group>
            </Box>
          )}

          <Divider />

          {/* ==================================================
              FAILURES LIST
          ================================================== */}

          <Box
            style={{
              position:
                "relative",
            }}
          >
            {sortedFailures.length ===
            0 ? (
              <Card
                radius="xl"
                p="xl"
                withBorder
                style={{
                  background:
                    "#f8fafc",
                  border:
                    "1px dashed #d9dee7",
                }}
              >
                <Center>
                  <Stack
                    align="center"
                    gap="xs"
                  >
                    <IconAlertCircle
                      size={32}
                      color="#94a3b8"
                    />

                    <Text
                      fw={750}
                      c="#475569"
                    >
                      لا توجد مخالفات
                    </Text>

                    <Text
                      size="xs"
                      c="dimmed"
                    >
                      لا توجد بيانات لعرضها
                    </Text>
                  </Stack>
                </Center>
              </Card>
            ) : (
              <Stack
                gap="xs"
                style={{
                  overflowY:
                    "auto",
                  maxHeight:
                    "min(52vh, 520px)",
                  padding:
                    "2px 4px 4px 2px",
                }}
              >
                {sortedFailures.map(
                  (
                    item,
                    index
                  ) => {
                    const district =
                      item.districtName ??
                      item.district ??
                      "";

                    const block =
                      item.blockName ??
                      item.block ??
                      "";

                    const isSelected =
                      item.id !==
                        undefined &&
                      item.id !==
                        null &&
                      selectedIds.includes(
                        item.id
                      );

                    return (
                      <Card
                        key={`${item.id ?? "failure"}-${index}`}
                        dir="rtl"
                        withBorder
                        radius="lg"
                        p={0}
                        mih={58}
                        style={{
                          overflow:
                            "hidden",
                          background:
                            isSelected
                              ? "linear-gradient(135deg, #eff6ff, #ffffff)"
                              : "#ffffff",
                          border:
                            isSelected
                              ? "1px solid #93c5fd"
                              : "1px solid #e7ebf0",
                          boxShadow:
                            isSelected
                              ? "0 5px 18px rgba(37,99,235,.10)"
                              : "0 3px 12px rgba(15,23,42,.035)",
                          transition:
                            "all .18s ease",
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
                            style={{
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            {/* رقم المخالفة */}

                            <Box
                              style={{
                                flexShrink: 0,
                              }}
                            >
                              <Badge
                                size="md"
                                radius="md"
                                color="blue"
                                variant={
                                  isSelected
                                    ? "filled"
                                    : "light"
                                }
                                styles={{
                                  root: {
                                    minWidth:
                                      82,
                                    height:
                                      30,
                                    padding:
                                      "0 10px",
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "center",
                                    fontWeight:
                                      850,
                                    letterSpacing:
                                      ".2px",
                                  },
                                }}
                              >
                                {item.id ??
                                  "—"}
                              </Badge>
                            </Box>

                            {/* الفاصل */}

                            <Box
                              w={1}
                              h={25}
                              style={{
                                background:
                                  isSelected
                                    ? "#bfdbfe"
                                    : "#e5e7eb",
                                flexShrink: 0,
                              }}
                            />

                            {/* المنطقة والحي */}

                            <Box
                              style={{
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              <Group
                                gap={6}
                                align="center"
                                wrap="nowrap"
                              >
                                {district &&
                                  district !==
                                    "مخالفات حسب مؤشرات الأداء" && (
                                    <Text
                                      size="sm"
                                      fw={750}
                                      c="#334155"
                                      truncate
                                    >
                                      {
                                        district
                                      }
                                    </Text>
                                  )}

                                {district &&
                                  block &&
                                  district !==
                                    "مخالفات حسب مؤشرات الأداء" && (
                                    <Text
                                      size="sm"
                                      fw={600}
                                      c="#94a3b8"
                                    >
                                      -
                                    </Text>
                                  )}

                                <Text
                                  size="sm"
                                  fw={850}
                                  c={
                                    isSelected
                                      ? "#1d4ed8"
                                      : "#172033"
                                  }
                                  truncate
                                >
                                  {block ||
                                    "غير محدد"}
                                </Text>
                              </Group>

                              <Text
                                size="10px"
                                c="dimmed"
                                mt={2}
                              >
                                مخالفة رقم{" "}
                                {item.id ??
                                  "—"}
                              </Text>
                            </Box>
                          </Group>

                          {/* التحديد */}

                          {allowPayment && (
                            <Checkbox
                              size="sm"
                              radius="sm"
                              checked={
                                isSelected
                              }
                              disabled={
                                item.id ===
                                  undefined ||
                                item.id ===
                                  null
                              }
                              onChange={() =>
                                toggleSelect(
                                  item.id
                                )
                              }
                              styles={{
                                input: {
                                  cursor:
                                    "pointer",
                                },
                              }}
                            />
                          )}
                        </Group>
                      </Card>
                    );
                  }
                )}
              </Stack>
            )}
          </Box>

          {/* ==================================================
              PAYMENT ACTION
          ================================================== */}

          {allowPayment && (
            <Card
              radius="xl"
              p="sm"
              withBorder
              style={{
                background:
                  "linear-gradient(135deg, #f0fdf4, #ffffff)",
                border:
                  "1px solid #bbf7d0",
              }}
            >
              <Group
                justify="space-between"
                align="center"
                gap="sm"
              >
                <Group
                  gap="sm"
                  wrap="nowrap"
                >
                  <Box
                    w={38}
                    h={38}
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      borderRadius:
                        12,
                      background:
                        "#dcfce7",
                    }}
                  >
                    <IconShieldCheck
                      size={20}
                      color="#16a34a"
                    />
                  </Box>

                  <Stack gap={0}>
                    <Text
                      size="xs"
                      fw={800}
                      c="#166534"
                    >
                      جاهز للتسديد
                    </Text>

                    <Text
                      size="xs"
                      c="dimmed"
                    >
                      {selectedIds.length >
                      0
                        ? `تم تحديد ${selectedIds.length} مخالفة`
                        : "حدد المخالفات المطلوبة أولًا"}
                    </Text>
                  </Stack>
                </Group>

                <Button
                  size="sm"
                  radius="xl"
                  color="green"
                  disabled={
                    selectedIds.length ===
                    0
                  }
                  leftSection={
                    <IconShieldCheck
                      size={17}
                    />
                  }
                  onClick={() =>
                    setConfirmOpened(
                      true
                    )
                  }
                >
                  تسديد المحدد
                  {selectedIds.length >
                    0 &&
                    ` (${selectedIds.length})`}
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
        radius="xl"
        shadow="xl"
        title={
          <Group gap="sm">
            <Box
              w={38}
              h={38}
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                borderRadius:
                  12,
                background:
                  "#dcfce7",
              }}
            >
              <IconShieldCheck
                size={20}
                color="#16a34a"
              />
            </Box>

            <Stack gap={0}>
              <Text
                fw={850}
                size="sm"
              >
                تأكيد التسديد
              </Text>

              <Text
                size="xs"
                c="dimmed"
              >
                تحقق من العملية قبل التنفيذ
              </Text>
            </Stack>
          </Group>
        }
        styles={{
          header: {
            borderBottom:
              "1px solid #edf0f2",
          },
        }}
        dir="rtl"
      >
        <Stack gap="md">
          <Card
            radius="lg"
            p="md"
            withBorder
            style={{
              background:
                "linear-gradient(135deg, #f0fdf4, #ffffff)",
              border:
                "1px solid #bbf7d0",
            }}
          >
            <Group
              justify="space-between"
              align="center"
            >
              <Stack gap={2}>
                <Text
                  size="xs"
                  c="dimmed"
                  fw={650}
                >
                  عدد المخالفات المحددة
                </Text>

                <Text
                  size="xl"
                  fw={900}
                  c="#166534"
                >
                  {
                    selectedIds.length
                  }
                </Text>
              </Stack>

              <Badge
                size="lg"
                radius="xl"
                color="green"
                variant="light"
              >
                جاهز للتسديد
              </Badge>
            </Group>
          </Card>

          <PasswordInput
            label="كود التأكيد"
            placeholder="أدخل كود التأكيد"
            value={code}
            onChange={(e) =>
              setCode(
                e.currentTarget.value
              )
            }
            disabled={loading}
            radius="md"
            size="md"
          />

          <Group
            grow
            gap="sm"
          >
            <Button
              variant="light"
              color="gray"
              radius="xl"
              disabled={loading}
              onClick={
                closeConfirm
              }
            >
              إلغاء
            </Button>

            <Button
              color="green"
              loading={loading}
              radius="xl"
              leftSection={
                !loading && (
                  <IconShieldCheck
                    size={18}
                  />
                )
              }
              onClick={
                validateFailures
              }
            >
              تأكيد التسديد
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

