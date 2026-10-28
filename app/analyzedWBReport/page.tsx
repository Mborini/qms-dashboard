"use client";

import { Fragment, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import {
  Alert,
  Badge,
  Button,
  Card,
  FileInput,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import {
  IconDownload,
  IconFileSpreadsheet,
  IconSearch,
  IconUpload,
} from "@tabler/icons-react";

type DailyTrip = {
  vehicle: string;
  date: string; // yyyy-MM-dd
  net: number;
};

/* ---------------------------- Helpers ---------------------------- */

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

function fmt(v: number) {
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatDate(key: string) {
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanHeader(value: unknown): string {
  return normalize(value)
    .replace(/[\u064B-\u065F\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/\s/g, "");
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const text = normalize(value)
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/[٬,\s]/g, "")
    .replace(/[^0-9.\-]/g, "");

  if (!text) return 0;
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

function isValidDate(y: number, m: number, d: number) {
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

function makeKey(y: number, m: number, d: number) {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(
    d
  ).padStart(2, "0")}`;
}

function getDateKey(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return makeKey(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const p = XLSX.SSF.parse_date_code(value);
    if (!p) return null;
    return makeKey(p.y, p.m, p.d);
  }

  const text = normalize(value).replace(/[٠-٩]/g, (d) =>
    String("٠١٢٣٤٥٦٧٨٩".indexOf(d))
  );

  const dmy = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  if (dmy) {
    const d = Number(dmy[1]);
    const m = Number(dmy[2]);
    const y = Number(dmy[3]);
    return isValidDate(y, m, d) ? makeKey(y, m, d) : null;
  }

  const ymd = text.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (ymd) {
    const y = Number(ymd[1]);
    const m = Number(ymd[2]);
    const d = Number(ymd[3]);
    return isValidDate(y, m, d) ? makeKey(y, m, d) : null;
  }

  return null;
}

/* ---------------------------- Component ---------------------------- */

export default function DailyVehicleWeightsTab() {
  const [file, setFile] = useState<File | null>(null);
  const [trips, setTrips] = useState<DailyTrip[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------- قراءة الملف ---------- */
  async function handleRead() {
    if (!file) {
      setError("يرجى اختيار ملف Excel أولاً.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setTrips([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      if (workbook.SheetNames.length === 0) {
        throw new Error("الملف لا يحتوي على أوراق عمل.");
      }

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
        raw: true,
        blankrows: false,
      });

      let headerRow = -1;
      let idx = { vehicle: -1, entry: -1, net: -1 };

      for (let r = 0; r < Math.min(rows.length, 30); r++) {
        const headers = (rows[r] || []).map(cleanHeader);

        const vehicle = headers.findIndex(
          (h) => h.includes("رقم") && h.includes("الي")
        );
        const entry = headers.findIndex((h) => h.startsWith("دخول"));
        const net = headers.findIndex((h) => h.includes("صافي"));

        if (vehicle !== -1 && entry !== -1 && net !== -1) {
          headerRow = r;
          idx = { vehicle, entry, net };
          break;
        }
      }

      if (headerRow === -1) {
        const seen = rows
          .slice(0, 5)
          .map(
            (row, i) =>
              `صف ${i + 1}: ${(row || [])
                .map(normalize)
                .filter(Boolean)
                .join(" | ")}`
          )
          .join("\n");

        throw new Error(
          `لم يتم العثور على أعمدة "رقم الآلية" و"دخول" و"الصافي".\nالعناوين التي ظهرت في الملف:\n${seen}`
        );
      }

      const result: DailyTrip[] = [];
      let skippedDate = 0;

      for (let r = headerRow + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row) continue;

        const vehicle = normalize(row[idx.vehicle]);
        if (!vehicle) continue;

        const date = getDateKey(row[idx.entry]);
        if (!date) {
          skippedDate++;
          continue;
        }

        result.push({ vehicle, date, net: toNumber(row[idx.net]) });
      }

      if (result.length === 0) {
        throw new Error(
          `لم يتم العثور على نقلات صالحة.${
            skippedDate > 0
              ? ` (تعذّر قراءة التاريخ في ${skippedDate} صف، تأكد من صيغة عمود دخول)`
              : ""
          }`
        );
      }

      setTrips(result);
      setMessage(
        `تمت القراءة بنجاح: ${result.length} نقلة.${
          skippedDate > 0
            ? ` (تم تجاهل ${skippedDate} صف بتاريخ غير مفهوم)`
            : ""
        }`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء قراءة الملف."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ---------- التجميع: آلية × يوم ---------- */
  const data = useMemo(() => {
    const dateSet = new Set<string>();
    const map = new Map<string, Map<string, number>>();

    for (const t of trips) {
      dateSet.add(t.date);
      if (!map.has(t.vehicle)) map.set(t.vehicle, new Map());
      const dm = map.get(t.vehicle)!;
      dm.set(t.date, (dm.get(t.date) ?? 0) + t.net);
    }

    const dates = Array.from(dateSet).sort();

    const rows = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "en", { numeric: true }))
      .map(([vehicle, dm]) => {
        const perDay = dates.map((d) => round2(dm.get(d) ?? 0));
        const total = round2(perDay.reduce((s, v) => s + v, 0));
        return { vehicle, perDay, total };
      });

    return { dates, rows };
  }, [trips]);

  const visibleRows = useMemo(() => {
    const q = search.trim();
    if (!q) return data.rows;
    return data.rows.filter((r) => r.vehicle.includes(q));
  }, [data.rows, search]);

  const dayTotals = useMemo(
    () =>
      data.dates.map((_, i) =>
        round2(visibleRows.reduce((s, r) => s + r.perDay[i], 0))
      ),
    [data.dates, visibleRows]
  );

  const grandTotal = useMemo(
    () => round2(dayTotals.reduce((s, v) => s + v, 0)),
    [dayTotals]
  );

  /* ---------- تصدير Excel ---------- */
  function handleExport() {
    if (visibleRows.length === 0) {
      setError("لا توجد بيانات لتصديرها.");
      return;
    }

    const header1 = [
      "رقم الآلية",
      ...data.dates.flatMap((d) => [formatDate(d), "", ""]),
      "مجموع الأوزان",
    ];
    const header2 = [
      "",
      ...data.dates.flatMap(() => ["الوزن", "الساعات", "المبلغ"]),
      "",
    ];
    const body = visibleRows.map((r) => [
      r.vehicle,
      ...r.perDay.flatMap((v) => [v > 0 ? v : "", "", ""]),
      r.total,
    ]);
    const totalRow = [
      "الإجمالي",
      ...dayTotals.flatMap((v) => [v, "", ""]),
      grandTotal,
    ];

    const ws = XLSX.utils.aoa_to_sheet([header1, header2, ...body, totalRow]);
    const lastCol = 1 + data.dates.length * 3;
    ws["!cols"] = header1.map((_, i) => ({ wch: i === 0 ? 16 : 12 }));
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
      ...data.dates.map((_, i) => ({
        s: { r: 0, c: 1 + i * 3 },
        e: { r: 0, c: 3 + i * 3 },
      })),
      { s: { r: 0, c: lastCol }, e: { r: 1, c: lastCol } },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "أوزان الآليات اليومية");
    wb.Workbook = { Views: [{ RTL: true }] };

    const first = data.dates[0];
    const last = data.dates[data.dates.length - 1];
    XLSX.writeFile(wb, `أوزان_الآليات_اليومية_${first}_${last}.xlsx`);
  }

  /* ------------------------------ UI ------------------------------ */
  return (
    <Stack gap="lg">
      <Card withBorder radius="lg" padding="lg">
        <Stack gap="md">
          <Group gap="xs">
            <IconFileSpreadsheet size={24} />
            <Title order={4}>استيراد ملف (أوزان الآليات اليومية)</Title>
          </Group>

          <Text size="sm" c="dimmed">
            يُقرأ من الملف: رقم الآلية، دخول (التاريخ)، الصافي. يتم جمع أوزان
            كل آلية في كل يوم.
          </Text>

          <FileInput
            label="ملف الحركات"
            placeholder="اختر ملف Excel"
            accept=".xlsx,.xls"
            value={file}
            onChange={(f: any) => {
              setFile(f);
              setTrips([]);
              setSearch("");
              setError("");
              setMessage("");
            }}
            leftSection={<IconUpload size={18} />}
            clearable
          />

          <Group>
            <Button
              onClick={handleRead}
              loading={loading}
              disabled={!file || loading}
              leftSection={<IconFileSpreadsheet size={18} />}
            >
              قراءة وتحليل الملف
            </Button>
          </Group>

          {error && (
            <Alert color="red" title="تعذر إكمال العملية">
              <Text size="sm" style={{ whiteSpace: "pre-line" }}>
                {error}
              </Text>
            </Alert>
          )}

          {message && (
            <Alert color="green" title="تمت العملية">
              {message}
            </Alert>
          )}
        </Stack>
      </Card>

      {trips.length > 0 && (
        <>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Paper withBorder radius="lg" p="md">
              <Text c="dimmed" size="sm">
                عدد الآليات
              </Text>
              <Title order={2} mt="sm">
                {visibleRows.length}
              </Title>
            </Paper>
            <Paper withBorder radius="lg" p="md">
              <Text c="dimmed" size="sm">
                عدد الأيام
              </Text>
              <Title order={2} c="orange" mt="sm">
                {data.dates.length}
              </Title>
            </Paper>
            <Paper withBorder radius="lg" p="md">
              <Text c="dimmed" size="sm">
                إجمالي الأوزان
              </Text>
              <Title order={2} c="blue" mt="sm">
                {fmt(grandTotal)}
              </Title>
            </Paper>
          </SimpleGrid>

          <Card withBorder radius="lg" padding="md">
            <Group justify="space-between" mb="sm" align="flex-end">
              <TextInput
                label="بحث برقم الآلية"
                placeholder="مثال: 60_60746"
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                leftSection={<IconSearch size={16} />}
                maw={280}
              />
              <Button
                variant="light"
                color="green"
                onClick={handleExport}
                leftSection={<IconDownload size={18} />}
              >
                تصدير Excel
              </Button>
            </Group>

            <ScrollArea>
              <Table
                withTableBorder
                withColumnBorders
                striped
                highlightOnHover
                styles={{
                  th: { textAlign: "center", whiteSpace: "nowrap" },
                  td: { textAlign: "center", whiteSpace: "nowrap" },
                }}
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th rowSpan={2}>رقم الآلية</Table.Th>
                    {data.dates.map((d) => (
                      <Table.Th key={d} colSpan={3}>
                        {formatDate(d)}
                      </Table.Th>
                    ))}
                    <Table.Th rowSpan={2}>مجموع الأوزان</Table.Th>
                  </Table.Tr>
                  <Table.Tr>
                    {data.dates.map((d) => (
                      <Fragment key={d}>
                        <Table.Th>الوزن</Table.Th>
                        <Table.Th>الساعات</Table.Th>
                        <Table.Th>المبلغ</Table.Th>
                      </Fragment>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {visibleRows.map((r) => (
                    <Table.Tr key={r.vehicle}>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {r.vehicle}
                        </Text>
                      </Table.Td>
                      {r.perDay.map((v, i) => (
                        <Fragment key={data.dates[i]}>
                          <Table.Td>{v > 0 ? fmt(v) : ""}</Table.Td>
                          <Table.Td />
                          <Table.Td />
                        </Fragment>
                      ))}
                      <Table.Td>
                        <Badge color="blue" variant="light">
                          {fmt(r.total)}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  <Table.Tr style={{ fontWeight: 700 }}>
                    <Table.Td>الإجمالي</Table.Td>
                    {dayTotals.map((v, i) => (
                      <Fragment key={data.dates[i]}>
                        <Table.Td>{fmt(v)}</Table.Td>
                        <Table.Td />
                        <Table.Td />
                      </Fragment>
                    ))}
                    <Table.Td>{fmt(grandTotal)}</Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Card>
        </>
      )}
    </Stack>
  );
}
