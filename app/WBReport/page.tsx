"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Container,
  FileInput,
  Group,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  TagsInput,
  Text,
  Title,
} from "@mantine/core";

import {
  IconDownload,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconMapPin,
  IconTruck,
  IconUpload,
  IconScale,
  IconTarget,
} from "@tabler/icons-react";

/*
  المكتبات المطلوبة (مرة واحدة):
  npm install exceljs jspdf html2canvas
*/

type Trip = {
  vehicle: string;
  type: string;
  region: string;
  driver: string;
  shift: string;
  date: string; // yyyy-MM-dd
  loaded: number;
  empty: number;
  net: number;
};

type RegionRow = {
  region: string;
  vehicles: number;
  trips: number;
  net: number;
};

type VehicleRow = {
  region: string;
  vehicle: string;
  type: string;
  trips: number;
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

/** Removes spaces, diacritics, tatweel, and unifies alef forms. */
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

/* ----------------------- Initial vehicle list ---------------------- */
// الآليات المحددة افتراضيًا. يمكن تعديلها من قائمة اختيار الآليات في الصفحة.
const INITIAL_VEHICLE_NUMBERS: string[] = [
  "60_60746",
  "60_72161",
  "60_86119",
  "60_75166",
  "66_56786",
  "66_68719",
  "66_35743",
  "60_95371",
  "5_21824",
  "42_26354",
  "60_71965",
  "60_86779",
  "60_81098",
  "60_69741",
  "60_82717",
  "60_89810",
  "05_26964",
  "5_26964",
  "66_38699",
  "66_64154",
  "66_40968",
  "60_87655",
  "60_71832",
  "60_81189",
  "60_26534",
  "60_84189",
  "66_46414",
  "66_25303",
  "66_10237",
  "66_11984",
  "44_87897",
];
/* ------------------- Daily targets (regions) ------------------- */
const DEFAULT_TARGET_REGIONS: string[] = [
  "الجبيهة",
  "النصر",
  "طارق",
  "ماركا",
  "أحد",
  "شفا بدران",
  "أبو نصير",
];

const TARGETS_STORAGE_KEY = "trips-report-daily-targets";

/** مفتاح موحّد لمطابقة اسم المنطقة (يتجاهل الهمزات والمسافات وكلمتي "منطقة" و"ال"). */
function regionKey(value: string): string {
  return cleanHeader(value)
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/^منطقه/, "")
    .replace(/^ال/, "");
}

/** الاسم المعتمد للمنطقة من قائمة الأهداف إن وُجد تطابق، وإلا الاسم كما هو. */
function targetNameFor(region: string): string {
  const k = regionKey(region);
  return DEFAULT_TARGET_REGIONS.find((d) => regionKey(d) === k) ?? region;
}

function dailyTargetOf(
  targets: Record<string, number | string>,
  region: string
): number {
  const value = Number(targets[targetNameFor(region)]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function pctColor(pct: number | null) {
  if (pct === null) return "gray";
  if (pct >= 100) return "green";
  if (pct >= 70) return "yellow";
  return "red";
}

/* ----------------------------- Page ------------------------------ */

export default function TripsReportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [period, setPeriod] = useState<{ from: string; to: string } | null>(
    null
  );
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>(
    INITIAL_VEHICLE_NUMBERS
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // الأهداف اليومية للمناطق (تُحفظ في المتصفح)
  const [targets, setTargets] = useState<Record<string, number | string>>({});
  const [targetsLoaded, setTargetsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TARGETS_STORAGE_KEY);
      if (raw) setTargets(JSON.parse(raw));
    } catch {}
    setTargetsLoaded(true);
  }, []);

  useEffect(() => {
    if (!targetsLoaded) return;
    try {
      localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(targets));
    } catch {}
  }, [targets, targetsLoaded]);

  const regionOptions = useMemo(
    () =>
      Array.from(new Set(trips.map((t) => t.region))).sort((a, b) =>
        a.localeCompare(b, "ar")
      ),
    [trips]
  );

  // كل الآليات الموجودة في الملف مع عدد نقلاتها
  const vehicleOptions = useMemo(() => {
    const counts = new Map<string, number>();
    trips.forEach((t) =>
      counts.set(t.vehicle, (counts.get(t.vehicle) ?? 0) + 1)
    );

    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "en", { numeric: true }))
      .map(([vehicle, count]) => ({ value: vehicle, label: vehicle, count }));
  }, [trips]);

  // آليات محددة لكنها غير موجودة في الملف
  const missingVehicles = useMemo(() => {
    const inFile = new Set(vehicleOptions.map((o) => o.value));
    return selectedVehicles.filter((v) => !inFile.has(v));
  }, [selectedVehicles, vehicleOptions]);

  const vehicleCountMap = useMemo(
    () => new Map(vehicleOptions.map((o) => [o.value, o.count])),
    [vehicleOptions]
  );

  // عند اختيار آليات، يتم عرض هذه الآليات فقط في جميع التقارير والتصدير.
  const filteredTrips = useMemo(() => {
    let result = trips;

    if (selectedVehicles.length > 0) {
      const selected = new Set(selectedVehicles);
      result = result.filter((trip) => selected.has(trip.vehicle));
    }

    if (regionFilter) {
      result = result.filter((trip) => trip.region === regionFilter);
    }

    return result;
  }, [trips, regionFilter, selectedVehicles]);

  const report = useMemo(() => {
    const regionMap = new Map<
      string,
      { vehicles: Set<string>; trips: number; net: number }
    >();
    const vehicleMap = new Map<string, VehicleRow>();

    let totalNet = 0;

    for (const t of filteredTrips) {
      totalNet += t.net;

      if (!regionMap.has(t.region)) {
        regionMap.set(t.region, { vehicles: new Set(), trips: 0, net: 0 });
      }
      const r = regionMap.get(t.region)!;
      r.vehicles.add(t.vehicle);
      r.trips++;
      r.net += t.net;

      const vKey = `${t.region}||${t.vehicle}`;
      if (!vehicleMap.has(vKey)) {
        vehicleMap.set(vKey, {
          region: t.region,
          vehicle: t.vehicle,
          type: t.type,
          trips: 0,
          net: 0,
        });
      }
      const v = vehicleMap.get(vKey)!;
      v.trips++;
      v.net += t.net;
    }

    const regions: RegionRow[] = Array.from(regionMap.entries())
      .map(([region, r]) => ({
        region,
        vehicles: r.vehicles.size,
        trips: r.trips,
        net: round2(r.net),
      }))
      .sort((a, b) => b.net - a.net);

    const vehicles: VehicleRow[] = Array.from(vehicleMap.values())
      .map((v) => ({
        ...v,
        net: round2(v.net),
      }))
      .sort((a, b) => a.region.localeCompare(b.region, "ar") || b.net - a.net);

    const uniqueVehicles = new Set(filteredTrips.map((t) => t.vehicle)).size;

    return {
      regions,
      vehicles,
      totalNet: round2(totalNet),
      totalTrips: filteredTrips.length,
      uniqueVehicles,
    };
  }, [filteredTrips]);

  const sortedTrips = useMemo(
    () =>
      [...filteredTrips].sort(
        (a, b) =>
          a.region.localeCompare(b.region, "ar") ||
          a.vehicle.localeCompare(b.vehicle, "ar", { numeric: true }) ||
          a.date.localeCompare(b.date)
      ),
    [filteredTrips]
  );

  // تفاصيل أوزان النقلات لكل آلية داخل المنطقة
  const vehicleTripWeights = useMemo(() => {
    const map = new Map<
      string,
      {
        region: string;
        vehicle: string;
        type: string;
        weights: number[];
        total: number;
      }
    >();

    for (const trip of sortedTrips) {
      const key = `${trip.region}||${trip.vehicle}`;
      if (!map.has(key)) {
        map.set(key, {
          region: trip.region,
          vehicle: trip.vehicle,
          type: trip.type,
          weights: [],
          total: 0,
        });
      }
      const row = map.get(key)!;
      row.weights.push(round2(trip.net));
      row.total += trip.net;
    }

    return Array.from(map.values())
      .map((row) => ({ ...row, total: round2(row.total) }))
      .sort(
        (a, b) =>
          a.region.localeCompare(b.region, "ar") ||
          a.vehicle.localeCompare(b.vehicle, "ar", { numeric: true })
      );
  }, [sortedTrips]);

  const maxVehicleTrips = useMemo(
    () => Math.max(0, ...vehicleTripWeights.map((row) => row.weights.length)),
    [vehicleTripWeights]
  );

  // تجميع صفوف الآليات حسب المنطقة (لدمج خلايا المنطقة) + الهدف والنسبة
  const weightGroups = useMemo(() => {
    const groups: {
      region: string;
      rows: typeof vehicleTripWeights;
      total: number;
    }[] = [];

    for (const row of vehicleTripWeights) {
      const last = groups[groups.length - 1];
      if (last && last.region === row.region) {
        last.rows.push(row);
        last.total += row.total;
      } else {
        groups.push({ region: row.region, rows: [row], total: row.total });
      }
    }

    return groups.map((g) => {
      const total = round2(g.total);
      const daily = dailyTargetOf(targets, g.region);
      const pct = daily > 0 ? round2((total / daily) * 100) : null;
      return { ...g, total, daily, pct };
    });
  }, [vehicleTripWeights, targets]);

  const weightsOverall = useMemo(() => {
    let total = 0;
    let target = 0;
    for (const g of weightGroups) {
      total += g.total;
      target += g.daily;
    }
    return {
      total: round2(total),
      target: round2(target),
      pct: target > 0 ? round2((total / target) * 100) : null,
    };
  }, [weightGroups]);

  // أسماء المناطق في تبويب الأهداف: الافتراضية + أي منطقة أخرى من الملف
  const targetNames = useMemo(() => {
    const names = [...DEFAULT_TARGET_REGIONS];
    for (const region of regionOptions) {
      const name = targetNameFor(region);
      if (!names.includes(name)) names.push(name);
    }
    return names;
  }, [regionOptions]);

  /* ------------------------- قراءة الملف ------------------------- */

  async function handleReadFile() {
    if (!file) {
      setError("يرجى اختيار ملف Excel أولاً.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setTrips([]);
    setPeriod(null);
    setRegionFilter(null);

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
      let idx = {
        vehicle: -1,
        type: -1,
        region: -1,
        driver: -1,
        shift: -1,
        entry: -1,
        loaded: -1,
        empty: -1,
        net: -1,
      };

      for (let r = 0; r < Math.min(rows.length, 30); r++) {
        const headers = (rows[r] || []).map(cleanHeader);

        const vehicle = headers.findIndex(
          (h) => h.includes("رقم") && h.includes("الي")
        );
        const region = headers.findIndex((h) => h.includes("منطق"));
        const entry = headers.findIndex((h) => h.startsWith("دخول"));
        const net = headers.findIndex((h) => h.includes("صافي"));

        if (vehicle !== -1 && region !== -1 && entry !== -1 && net !== -1) {
          headerRow = r;
          idx = {
            vehicle,
            region,
            entry,
            net,
            type: headers.findIndex((h) => h.includes("نوع")),
            driver: headers.findIndex((h) => h.includes("سائق")),
            shift: headers.findIndex((h) => h.includes("شفت")),
            loaded: headers.findIndex((h) => h.includes("قائم")),
            empty: headers.findIndex((h) => h.includes("فارغ")),
          };
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
          `لم يتم العثور على أعمدة "رقم الآلية" و"المنطقة" و"دخول" و"الصافي".\nالعناوين التي ظهرت في الملف:\n${seen}`
        );
      }

      const result: Trip[] = [];
      let skippedDate = 0;

      const get = (row: unknown[], i: number) => (i === -1 ? "" : row[i]);

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

        result.push({
          vehicle,
          type: normalize(get(row, idx.type)),
          region: normalize(row[idx.region]) || "بدون منطقة",
          driver: normalize(get(row, idx.driver)),
          shift: normalize(get(row, idx.shift)),
          date,
          loaded: toNumber(get(row, idx.loaded)),
          empty: toNumber(get(row, idx.empty)),
          net: toNumber(row[idx.net]),
        });
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

      const dates = result.map((t) => t.date).sort();
      setPeriod({ from: dates[0], to: dates[dates.length - 1] });

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

  /* ----------------------- تصدير Excel (منسّق) ----------------------- */

  async function handleExport() {
    if (filteredTrips.length === 0) {
      setError("لا توجد بيانات لتصديرها.");
      return;
    }

    const ExcelJS = (await import("exceljs")).default;

    /* ---------- الألوان ---------- */
    const C = {
      navy: "FF1F3864",
      header: "FF2F5597",
      headerWeights: "FF4472C4",
      light: "FFDDEBF7",
      band: "FFF5F7FA",
      white: "FFFFFFFF",
      indigo: "FF3949AB",
      orangeBg: "FFFCE4D6",
      orangeFg: "FF9C4A00",
      border: "FFBFC5CE",
      greenBg: "FFC6EFCE",
      greenFg: "FF006100",
      yellowBg: "FFFFEB9C",
      yellowFg: "FF7F6000",
      redBg: "FFFFC7CE",
      redFg: "FF9C0006",
      grayBg: "FFEDEDED",
      grayFg: "FF7F7F7F",
    };

    const thin = { style: "thin" as const, color: { argb: C.border } };
    const border = { top: thin, left: thin, bottom: thin, right: thin };

    const paint = (
      cell: any,
      o: {
        bg?: string;
        color?: string;
        bold?: boolean;
        size?: number;
        h?: "center" | "right" | "left";
        numFmt?: string;
      } = {}
    ) => {
      if (o.bg) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: o.bg },
        };
      }
      cell.font = {
        name: "Calibri",
        size: o.size ?? 11,
        bold: o.bold ?? false,
        color: { argb: o.color ?? "FF262626" },
      };
      cell.alignment = {
        horizontal: o.h ?? "center",
        vertical: "middle",
        wrapText: true,
        readingOrder: "rtl",
      };
      cell.border = border;
      if (o.numFmt) cell.numFmt = o.numFmt;
    };

    const pctStyle = (pct: number | null) => {
      if (pct === null) return { bg: C.grayBg, color: C.grayFg };
      if (pct >= 100) return { bg: C.greenBg, color: C.greenFg };
      if (pct >= 70) return { bg: C.yellowBg, color: C.yellowFg };
      return { bg: C.redBg, color: C.redFg };
    };

    /* ---------- أعمدة الجدول ---------- */
    const NUM = "#,##0.00";
    const colCount = 3; // المنطقة، رقم الآلية، عدد النقلات
    const firstWeightCol = 4;
    const vehicleTotalCol = 4 + maxVehicleTrips;
    const regionTotalCol = 5 + maxVehicleTrips;
    const targetCol = 6 + maxVehicleTrips;
    const pctCol = 7 + maxVehicleTrips;
    const totalCols = pctCol;

    const wb = new ExcelJS.Workbook();
    wb.creator = "تقرير النقلات";
    wb.created = new Date();

    const ws = wb.addWorksheet("أوزان النقلات لكل آلية", {
      views: [
        {
          rightToLeft: true,
          showGridLines: false,
          state: "frozen",
          xSplit: 2,
          ySplit: 5,
        },
      ],
      pageSetup: {
        orientation: "landscape",
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.4,
          right: 0.4,
          top: 0.5,
          bottom: 0.5,
          header: 0.3,
          footer: 0.3,
        },
      },
      properties: { tabColor: { argb: C.header } },
    });

    /* عرض الأعمدة */
    ws.getColumn(1).width = 22;
    ws.getColumn(2).width = 16;
    ws.getColumn(3).width = 12;
    for (let k = 0; k < maxVehicleTrips; k++) {
      ws.getColumn(firstWeightCol + k).width = 14;
    }
    ws.getColumn(vehicleTotalCol).width = 18;
    ws.getColumn(regionTotalCol).width = 20;
    ws.getColumn(targetCol).width = 16;
    ws.getColumn(pctCol).width = 18;

    /* ---------- العنوان ---------- */
    ws.mergeCells(1, 1, 1, totalCols);
    const title = ws.getCell(1, 1);
    title.value = "تقرير الأوزان ";
    paint(title, { bg: C.navy, color: C.white, bold: true, size: 18 });
    ws.getRow(1).height = 36;

    ws.mergeCells(2, 1, 2, totalCols);
    const sub = ws.getCell(2, 1);
    sub.value = period
      ? `التاريخ : ${formatDate(period.from)}}`
      : "";
    paint(sub, { bg: C.header, color: C.white, bold: true, size: 12 });
    ws.getRow(2).height = 24;

    ws.mergeCells(3, 1, 3, totalCols);
    const summary = ws.getCell(3, 1);
    summary.value = `عدد الآليات: ${report.uniqueVehicles}     |     عدد النقلات: ${fmt(
      report.totalTrips
    )}     |     إجمالي الأوزان: ${fmt(weightsOverall.total)}`;
    paint(summary, { bg: C.light, color: C.navy, bold: true, size: 12 });
    ws.getRow(3).height = 24;

    ws.getRow(4).height = 8; // فاصل

    /* ---------- صف العناوين ---------- */
    const headers: string[] = ["المنطقة", "رقم الآلية", "عدد النقلات"];
    for (let k = 0; k < maxVehicleTrips; k++)
      headers.push(`وزن النقلة ${k + 1}`);
    headers.push(
      "مجموع أوزان الآلية",
      "مجموع أوزان المنطقة",
      "الهدف اليومي",
      "نسبة تحقيق الهدف"
    );

    headers.forEach((text, i) => {
      const cell = ws.getCell(5, i + 1);
      cell.value = text;
      const isWeight = i + 1 >= firstWeightCol && i + 1 < vehicleTotalCol;
      paint(cell, {
        bg: isWeight ? C.headerWeights : C.header,
        color: C.white,
        bold: true,
        size: 11,
      });
    });
    ws.getRow(5).height = 34;

    /* ---------- البيانات ---------- */
    let r = 6;
    weightGroups.forEach((g, gi) => {
      const bandBg = gi % 2 === 0 ? C.white : C.band;
      const startRow = r;
      const endRow = r + g.rows.length - 1;

      g.rows.forEach((v) => {
        const row = ws.getRow(r);
        row.height = 22;

        // خلايا المنطقة (تُدمج لاحقًا)
        paint(ws.getCell(r, 1), {
          bg: C.light,
          color: C.navy,
          bold: true,
          size: 12,
          h: "right",
        });

        const veh = ws.getCell(r, 2);
        veh.value = v.vehicle;
        paint(veh, { bg: bandBg, bold: true });

        const cnt = ws.getCell(r, 3);
        cnt.value = v.weights.length;
        paint(cnt, { bg: C.orangeBg, color: C.orangeFg, bold: true });

        for (let k = 0; k < maxVehicleTrips; k++) {
          const c = ws.getCell(r, firstWeightCol + k);
          if (v.weights[k] !== undefined) {
            c.value = v.weights[k];
            paint(c, { bg: bandBg, numFmt: NUM });
          } else {
            c.value = "—";
            paint(c, { bg: bandBg, color: C.grayFg });
          }
        }

        const vt = ws.getCell(r, vehicleTotalCol);
        vt.value = v.total;
        paint(vt, { bg: C.light, color: C.navy, bold: true, numFmt: NUM });

        // خلايا مجموع المنطقة والهدف والنسبة (تُدمج لاحقًا)
        paint(ws.getCell(r, regionTotalCol), {
          bg: C.indigo,
          color: C.white,
          bold: true,
          size: 12,
          numFmt: NUM,
        });
        paint(ws.getCell(r, targetCol), {
          bg: bandBg,
          bold: true,
          numFmt: NUM,
        });
        const ps = pctStyle(g.pct);
        paint(ws.getCell(r, pctCol), {
          bg: ps.bg,
          color: ps.color,
          bold: true,
          size: 12,
          numFmt: "0.0%",
        });

        r++;
      });

      // قيم الخلايا المدموجة
      ws.getCell(startRow, 1).value = g.region;
      ws.getCell(startRow, regionTotalCol).value = g.total;
      if (g.daily > 0) {
        ws.getCell(startRow, targetCol).value = g.daily;
      } else {
        ws.getCell(startRow, targetCol).value = "لم يُحدد";
        ws.getCell(startRow, targetCol).font = {
          name: "Calibri",
          size: 10,
          italic: true,
          color: { argb: C.grayFg },
        };
      }
      ws.getCell(startRow, pctCol).value = g.pct !== null ? g.pct / 100 : "—";

      if (endRow > startRow) {
        for (const c of [1, regionTotalCol, targetCol, pctCol]) {
          ws.mergeCells(startRow, c, endRow, c);
        }
      }
    });

    /* ---------- صف الإجمالي ---------- */
    const tr = r;
    ws.getRow(tr).height = 28;

    for (let c = 1; c <= totalCols; c++) {
      paint(ws.getCell(tr, c), {
        bg: C.navy,
        color: C.white,
        bold: true,
        size: 12,
        numFmt: NUM,
      });
    }
    ws.getCell(tr, 1).value = "الإجمالي";
    ws.mergeCells(tr, 1, tr, colCount + maxVehicleTrips);

    ws.getCell(tr, vehicleTotalCol).value = weightsOverall.total;
    ws.mergeCells(tr, vehicleTotalCol, tr, regionTotalCol);

    ws.getCell(tr, targetCol).value =
      weightsOverall.target > 0 ? weightsOverall.target : "—";

    const tps = pctStyle(weightsOverall.pct);
    const tp = ws.getCell(tr, pctCol);
    tp.value = weightsOverall.pct === null ? "—" : weightsOverall.pct / 100;
    paint(tp, {
      bg: tps.bg,
      color: tps.color,
      bold: true,
      size: 12,
      numFmt: "0.0%",
    });



    /* ---------- تنزيل الملف ---------- */
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = period
      ? `أوزان_النقلات_${period.from}_${period.to}.xlsx`
      : "أوزان_النقلات.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* --------------------------- تصدير PDF --------------------------- */

 async function handleExportPdf() {
  if (weightGroups.length === 0) {
    setError("لا توجد بيانات لتصديرها.");
    return;
  }

  setPdfLoading(true);

  try {
    const esc = (v: unknown) =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const COL = {
      navy: "#1F3864",
      header: "#2F5597",
      headerW: "#4472C4",
      light: "#DDEBF7",
      band: "#F5F7FA",
      indigo: "#3949AB",
      orangeBg: "#FCE4D6",
      orangeFg: "#9C4A00",
      border: "#BFC5CE",
    };

    const pctColors = (pct: number | null): [string, string] => {
      if (pct === null) return ["#EDEDED", "#7F7F7F"];
      if (pct >= 100) return ["#C6EFCE", "#006100"];
      if (pct >= 70) return ["#FFEB9C", "#7F6000"];
      return ["#FFC7CE", "#9C0006"];
    };

    // حجم الخط (مصغّر) - يتقلص تلقائيًا عند كثرة أعمدة النقلات
    const fs = maxVehicleTrips > 14 ? 6.5 : maxVehicleTrips > 8 ? 7.5 : 9;

    const th = (text: string, cls = "") => `<th class="${cls}">${text}</th>`;
    const td = (content: string, style = "", attrs = "") =>
      `<td ${attrs} style="${style}">${content}</td>`;

    /* ---------- رأس الجدول ---------- */
    const head =
      th("المنطقة") +
      th("رقم الآلية") +
      th("عدد النقلات") +
      Array.from({ length: maxVehicleTrips }, (_, k) =>
        th(`وزن النقلة ${k + 1}`, "w")
      ).join("") +
      th("مجموع أوزان الآلية") +
      th("مجموع أوزان المنطقة") +
      th("الهدف اليومي") +
      th("نسبة تحقيق الهدف");

    /* ---------- الصفوف (tbody لكل منطقة حتى لا تنقسم بين صفحتين) ---------- */
    const body = weightGroups
      .map((g, gi) => {
        const bandBg = gi % 2 === 0 ? "#FFFFFF" : COL.band;
        const [pBg, pFg] = pctColors(g.pct);
        const span = `rowspan="${g.rows.length}"`;

        const rows = g.rows
          .map((v, i) => {
            let row = "<tr>";

            if (i === 0) {
              row += td(
                esc(g.region),
                `background:${COL.light};color:${COL.navy};font-weight:700;text-align:right;font-size:${fs + 1}px`,
                span
              );
            }

            row += td(esc(v.vehicle), `background:${bandBg};font-weight:700`);
            row += td(
              String(v.weights.length),
              `background:${COL.orangeBg};color:${COL.orangeFg};font-weight:700`
            );

            for (let k = 0; k < maxVehicleTrips; k++) {
              row +=
                v.weights[k] !== undefined
                  ? td(fmt(v.weights[k]), `background:${bandBg}`)
                  : td("—", `background:${bandBg};color:#9a9a9a`);
            }

            row += td(
              fmt(v.total),
              `background:${COL.light};color:${COL.navy};font-weight:700`
            );

            if (i === 0) {
              row += td(
                fmt(g.total),
                `background:${COL.indigo};color:#fff;font-weight:700;font-size:${fs + 1}px`,
                span
              );
              row += td(
                g.daily > 0
                  ? fmt(g.daily)
                  : `<span style="color:#9a9a9a">لم يُحدد</span>`,
                `background:${bandBg};font-weight:700`,
                span
              );
              row += td(
                g.pct === null ? "—" : `${fmt(g.pct)}%`,
                `background:${pBg};color:${pFg};font-weight:700;font-size:${fs + 1}px`,
                span
              );
            }

            return row + "</tr>";
          })
          .join("");

        return `<tbody class="grp">${rows}</tbody>`;
      })
      .join("");

    /* ---------- صف الإجمالي ---------- */
    const [tBg, tFg] = pctColors(weightsOverall.pct);
    const dark = `background:${COL.navy};color:#fff;font-weight:700;font-size:${fs + 1}px`;
    const totalRow = `<tbody class="grp"><tr>
      ${td("الإجمالي", dark, `colspan="${3 + maxVehicleTrips}"`)}
      ${td(fmt(weightsOverall.total), dark, 'colspan="2"')}
      ${td(weightsOverall.target > 0 ? fmt(weightsOverall.target) : "—", dark)}
      ${td(
        weightsOverall.pct === null ? "—" : `${fmt(weightsOverall.pct)}%`,
        `background:${tBg};color:${tFg};font-weight:700;font-size:${fs + 1}px`
      )}
    </tr></tbody>`;

    const chip = (text: string, bg: string, fg: string) =>
      `<span class="chip" style="background:${bg};color:${fg}">${text}</span>`;

    const fileName = period
      ? `أوزان_النقلات_${period.from}_${period.to}`
      : "أوزان_النقلات";

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<title>${fileName}</title>
<style>
  @page {
    size: A4 landscape;
    margin: 10mm 8mm 14mm 8mm;
    @bottom-center {
      content: "صفحة " counter(page) " من " counter(pages);
      font-family: Tahoma, Arial, sans-serif;
      font-size: 8px;
      color: #7F7F7F;
    }
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    direction: rtl;
    font-family: "Segoe UI", Tahoma, Arial, sans-serif;
    color: #262626;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .banner {
    background: ${COL.navy}; color: #fff; text-align: center;
    font-size: 18px; font-weight: 700; padding: 8px;
  }
  .sub {
    background: ${COL.header}; color: #fff; text-align: center;
    font-size: 11px; font-weight: 700; padding: 5px;
  }
  .sum {
    background: ${COL.light}; color: ${COL.navy}; text-align: center;
    font-size: 11px; font-weight: 700; padding: 5px; margin-bottom: 8px;
  }
  table { border-collapse: collapse; width: 100%; }
  thead { display: table-header-group; }          /* يتكرر في كل صفحة */
  th {
    background: ${COL.header}; color: #fff; font-weight: 700;
    padding: 4px 3px; border: 1px solid ${COL.border};
    font-size: ${fs}px; text-align: center; line-height: 1.25;
  }
  th.w { background: ${COL.headerW}; }
  td {
    padding: 3px 3px; border: 1px solid ${COL.border};
    font-size: ${fs}px; text-align: center; vertical-align: middle;
    white-space: nowrap; line-height: 1.25;
  }
  tbody.grp { break-inside: avoid; page-break-inside: avoid; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  .legend { margin-top: 10px; font-size: 9px; font-weight: 700; color: ${COL.navy}; break-inside: avoid; }
  .chip {
    display: inline-block; font-weight: 700; font-size: 9px;
    padding: 2px 6px; border: 1px solid ${COL.border}; margin-inline-start: 6px;
  }
</style>
</head>
<body>
  <div class="banner">تقرير الأوزان</div>
  <div class="sub">${period ? `التاريخ : ${formatDate(period.from)}` : ""}</div>
  <div class="sum">
    عدد الآليات: ${report.uniqueVehicles} &nbsp;|&nbsp;
    عدد النقلات: ${fmt(report.totalTrips)} &nbsp;|&nbsp;
    إجمالي الأوزان: ${fmt(weightsOverall.total)}
  </div>

  <table>
    <thead><tr>${head}</tr></thead>
    ${body}
    ${totalRow}
  </table>

  
</body>
</html>`;

    /* ---------- الطباعة عبر iframe مخفي ---------- */
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(iframe);

    const win = iframe.contentWindow!;
    const doc = win.document;
    doc.open();
    doc.write(html);
    doc.close();

    if (doc.fonts?.ready) await doc.fonts.ready;
    await new Promise((r) => setTimeout(r, 250));

    // اسم الملف الافتراضي في نافذة الحفظ يؤخذ من عنوان الصفحة
    const prevTitle = document.title;
    document.title = fileName;

    const cleanup = () => {
      document.title = prevTitle;
      setTimeout(() => iframe.remove(), 500);
    };
    win.onafterprint = cleanup;

    win.focus();
    win.print();
  } catch (err) {
    console.error(err);
    setError("تعذر إنشاء ملف PDF.");
  } finally {
    setPdfLoading(false);
  }
}

  /* ------------------------------ UI ------------------------------ */

  return (
    <Container size="xl" py="xl" dir="rtl">
      <Stack gap="lg">
        <Box>
          <Title order={2}>تقرير النقلات حسب المنطقة والآلية</Title>
          <Text c="dimmed" size="sm" mt={6}>
            {period
              ? `الفترة من ${formatDate(period.from)} إلى ${formatDate(
                  period.to
                )}`
              : "ارفع الملف لتحديد الفترة تلقائيًا"}
          </Text>
        </Box>

        <Card withBorder radius="lg" padding="lg">
          <Stack gap="md">
            <Group gap="xs">
              <IconFileSpreadsheet size={24} />
              <Title order={4}>استيراد ملف Excel</Title>
            </Group>

            <Text size="sm" c="dimmed">
              الأعمدة: رقم الآلية، نوع الآلية، المنطقة، اسم السائق، الشفت،
              دخول، خروج، القائم، الفارغ، الصافي. كل صف = نقلة.
            </Text>

            <FileInput
              label="ملف الحركات"
              placeholder="اختر ملف Excel"
              accept=".xlsx,.xls"
              value={file}
              onChange={(f: any) => {
                setFile(f);
                setTrips([]);
                setPeriod(null);
                setRegionFilter(null);
                setError("");
                setMessage("");
              }}
              leftSection={<IconUpload size={18} />}
              clearable
            />

            <Group>
              <Button
                onClick={handleReadFile}
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
            <Card withBorder radius="lg" padding="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconTruck size={20} />
                    <Title order={4}>اختيار الآليات</Title>
                  </Group>

                  <Group gap="xs">
                    <Button
                      variant="light"
                      size="xs"
                      onClick={() => {
                        setSelectedVehicles(vehicleOptions.map((o) => o.value));
                        setRegionFilter(null);
                      }}
                    >
                      تحديد الكل
                    </Button>
                    <Button
                      variant="light"
                      size="xs"
                      color="gray"
                      onClick={() => {
                        setSelectedVehicles(INITIAL_VEHICLE_NUMBERS);
                        setRegionFilter(null);
                      }}
                    >
                      القائمة الافتراضية
                    </Button>
                    <Button
                      variant="subtle"
                      size="xs"
                      color="red"
                      onClick={() => setSelectedVehicles([])}
                      disabled={selectedVehicles.length === 0}
                    >
                      مسح التحديد
                    </Button>
                  </Group>
                </Group>

                <TagsInput
                  placeholder={
                    selectedVehicles.length === 0
                      ? "كل الآليات معروضة، اختر أو اكتب رقم آلية للتصفية"
                      : "ابحث، أو اكتب رقم آلية جديدة واضغط Enter"
                  }
                  data={vehicleOptions.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  value={selectedVehicles}
                  onChange={(v) => {
                    setSelectedVehicles(
                      Array.from(
                        new Set(v.map((x) => x.trim()).filter(Boolean))
                      )
                    );
                    setRegionFilter(null);
                  }}
                  splitChars={[",", " ", "،", ";", "\n"]}
                  acceptValueOnBlur
                  clearable
                  maxDropdownHeight={280}
                  leftSection={<IconTruck size={16} />}
                  renderOption={({ option }) => (
                    <Group justify="space-between" w="100%" wrap="nowrap">
                      <Text size="sm" fw={500}>
                        {option.value}
                      </Text>
                      <Badge size="sm" variant="light" color="gray">
                        {vehicleCountMap.get(option.value) ?? 0} نقلة
                      </Badge>
                    </Group>
                  )}
                  styles={{
                    input: { maxHeight: 140, overflowY: "auto" },
                    pill: { fontWeight: 600 },
                  }}
                />

                <Group gap="xs">
                  <Badge color="blue" variant="light">
                    المحدد: {selectedVehicles.length || "الكل"}
                  </Badge>
                  <Badge color="green" variant="light">
                    آليات مطابقة: {report.uniqueVehicles}
                  </Badge>
                  <Badge color="orange" variant="light">
                    النقلات المعروضة: {filteredTrips.length}
                  </Badge>
                </Group>

                {missingVehicles.length > 0 && (
                  <Alert
                    color="yellow"
                    variant="light"
                    title="آليات غير موجودة في الملف"
                  >
                    <Group gap={6}>
                      {missingVehicles.map((v) => (
                        <Badge key={v} color="yellow" variant="outline">
                          {v}
                        </Badge>
                      ))}
                    </Group>
                  </Alert>
                )}
              </Stack>
            </Card>

            <Select
              label="تصفية حسب المنطقة"
              placeholder="كل المناطق"
              data={regionOptions}
              value={regionFilter}
              onChange={setRegionFilter}
              clearable
              searchable
              maw={320}
            />

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Paper withBorder radius="lg" p="md">
                <Text c="dimmed" size="sm">
                  عدد الآليات
                </Text>
                <Title order={2} mt="sm">
                  {report.uniqueVehicles}
                </Title>
              </Paper>

              <Paper withBorder radius="lg" p="md">
                <Text c="dimmed" size="sm">
                  عدد النقلات
                </Text>
                <Title order={2} c="orange" mt="sm">
                  {fmt(report.totalTrips)}
                </Title>
              </Paper>

              <Paper withBorder radius="lg" p="md">
                <Text c="dimmed" size="sm">
                  إجمالي الصافي
                </Text>
                <Title order={2} c="blue" mt="sm">
                  {fmt(report.totalNet)}
                </Title>
              </Paper>
            </SimpleGrid>

            <Card withBorder radius="lg" padding="md">
              <Tabs defaultValue="weights">
                <Tabs.List>
                  <Tabs.Tab
                    value="weights"
                    leftSection={<IconScale size={16} />}
                  >
                    أوزان النقلات لكل آلية
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="regions"
                    leftSection={<IconMapPin size={16} />}
                  >
                    حسب المنطقة
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="vehicles"
                    leftSection={<IconTruck size={16} />}
                  >
                    حسب الآلية
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="targets"
                    leftSection={<IconTarget size={16} />}
                  >
                    الأهداف اليومية
                  </Tabs.Tab>
                </Tabs.List>

                {/* Weight per trip by vehicle (default) */}
                <Tabs.Panel value="weights" pt="md">
                  <Group justify="space-between" mb="sm">
                    <Text size="sm" c="dimmed">
                      نسبة تحقيق الهدف = مجموع الأوزان ÷ الهدف اليومي (للمنطقة،
                      وفي صف الإجمالي: مجموع الأوزان ÷ مجموع الأهداف)
                    </Text>

                    <Group gap="xs">
                      <Button
                        variant="light"
                        color="green"
                        onClick={handleExport}
                        leftSection={<IconDownload size={18} />}
                      >
                        تصدير Excel
                      </Button>
                      <Button
                        variant="light"
                        color="red"
                        onClick={handleExportPdf}
                        loading={pdfLoading}
                        leftSection={<IconFileTypePdf size={18} />}
                      >
                        تصدير PDF
                      </Button>
                    </Group>
                  </Group>

                  <ScrollArea >
                    <Table
                      withTableBorder
                      withColumnBorders
                      withRowBorders
                      styles={{
                        th: { textAlign: "center", whiteSpace: "nowrap" },
                        td: { textAlign: "center", whiteSpace: "nowrap" },
                      }}
                    >
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th style={{ textAlign: "right" }}>
                            المنطقة
                          </Table.Th>
                          <Table.Th>رقم الآلية</Table.Th>
                          <Table.Th>عدد النقلات</Table.Th>
                          {Array.from({ length: maxVehicleTrips }, (_, i) => (
                            <Table.Th key={`weight-head-${i}`}>
                              وزن النقلة {i + 1}
                            </Table.Th>
                          ))}
                          <Table.Th>مجموع أوزان الآلية</Table.Th>
                          <Table.Th>مجموع أوزان المنطقة</Table.Th>
                          <Table.Th>الهدف اليومي</Table.Th>
                          <Table.Th>نسبة تحقيق الهدف</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {weightGroups.map((g) =>
                          g.rows.map((v, i) => (
                            <Table.Tr key={`${g.region}-${v.vehicle}`}>
                              {i === 0 && (
                                <Table.Td
                                  rowSpan={g.rows.length}
                                  style={{
                                    textAlign: "right",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  <Text fw={700} size="sm">
                                    {g.region}
                                  </Text>
                                </Table.Td>
                              )}
                              <Table.Td>
                                <Text fw={600} size="sm">
                                  {v.vehicle}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge color="orange" variant="light">
                                  {v.weights.length}
                                </Badge>
                              </Table.Td>
                              {Array.from(
                                { length: maxVehicleTrips },
                                (_, k) => (
                                  <Table.Td
                                    key={`${g.region}-${v.vehicle}-w-${k}`}
                                  >
                                    {v.weights[k] !== undefined
                                      ? fmt(v.weights[k])
                                      : "—"}
                                  </Table.Td>
                                )
                              )}
                              <Table.Td>
                                <Badge color="blue" variant="light">
                                  {fmt(v.total)}
                                </Badge>
                              </Table.Td>
                              {i === 0 && (
                                <Table.Td
                                  rowSpan={g.rows.length}
                                  style={{ verticalAlign: "middle" }}
                                >
                                  <Badge
                                    size="lg"
                                    color="indigo"
                                    variant="filled"
                                  >
                                    {fmt(g.total)}
                                  </Badge>
                                </Table.Td>
                              )}
                              {i === 0 && (
                                <Table.Td
                                  rowSpan={g.rows.length}
                                  style={{ verticalAlign: "middle" }}
                                >
                                  {g.daily > 0 ? (
                                    <Text fw={600} size="sm">
                                      {fmt(g.daily)}
                                    </Text>
                                  ) : (
                                    <Text size="xs" c="dimmed">
                                      لم يُحدد
                                    </Text>
                                  )}
                                </Table.Td>
                              )}
                              {i === 0 && (
                                <Table.Td
                                  rowSpan={g.rows.length}
                                  style={{ verticalAlign: "middle" }}
                                >
                                  {g.pct === null ? (
                                    "—"
                                  ) : (
                                    <Badge
                                      size="lg"
                                      color={pctColor(g.pct)}
                                      variant="light"
                                    >
                                      {fmt(g.pct)}%
                                    </Badge>
                                  )}
                                </Table.Td>
                              )}
                            </Table.Tr>
                          ))
                        )}
                        {weightGroups.length > 0 && (
                          <Table.Tr style={{ fontWeight: 700 }}>
                            <Table.Td colSpan={3 + maxVehicleTrips}>
                              الإجمالي
                            </Table.Td>
                            <Table.Td colSpan={2}>
                              {fmt(weightsOverall.total)}
                            </Table.Td>
                            <Table.Td>
                              {weightsOverall.target > 0
                                ? fmt(weightsOverall.target)
                                : "—"}
                            </Table.Td>
                            <Table.Td>
                              {weightsOverall.pct === null ? (
                                "—"
                              ) : (
                                <Badge
                                  color={pctColor(weightsOverall.pct)}
                                  variant="light"
                                >
                                  {fmt(weightsOverall.pct)}%
                                </Badge>
                              )}
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Tabs.Panel>

                {/* Regions */}
                <Tabs.Panel value="regions" pt="md">
                  <ScrollArea>
                    <Table
                      striped
                      highlightOnHover
                      withTableBorder
                      withColumnBorders
                      styles={{
                        th: { textAlign: "center", whiteSpace: "nowrap" },
                        td: { textAlign: "center", whiteSpace: "nowrap" },
                      }}
                    >
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th style={{ textAlign: "right" }}>
                            المنطقة
                          </Table.Th>
                          <Table.Th>عدد الآليات</Table.Th>
                          <Table.Th>عدد النقلات</Table.Th>
                          <Table.Th>إجمالي الصافي</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {report.regions.map((r) => (
                          <Table.Tr key={r.region}>
                            <Table.Td style={{ textAlign: "right" }}>
                              <Text fw={600} size="sm">
                                {r.region}
                              </Text>
                            </Table.Td>
                            <Table.Td>{r.vehicles}</Table.Td>
                            <Table.Td>
                              <Badge color="orange" variant="light">
                                {r.trips}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge color="blue" variant="light">
                                {fmt(r.net)}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                        <Table.Tr style={{ fontWeight: 700 }}>
                          <Table.Td style={{ textAlign: "right" }}>
                            الإجمالي
                          </Table.Td>
                          <Table.Td>{report.uniqueVehicles}</Table.Td>
                          <Table.Td>{fmt(report.totalTrips)}</Table.Td>
                          <Table.Td>{fmt(report.totalNet)}</Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Tabs.Panel>

                {/* Vehicles */}
                <Tabs.Panel value="vehicles" pt="md">
                  <ScrollArea >
                    <Table
                      striped
                      highlightOnHover
                      withTableBorder
                      withColumnBorders
                      styles={{
                        th: { textAlign: "center", whiteSpace: "nowrap" },
                        td: { textAlign: "center", whiteSpace: "nowrap" },
                      }}
                    >
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th style={{ textAlign: "right" }}>
                            المنطقة
                          </Table.Th>
                          <Table.Th>رقم الآلية</Table.Th>
                          <Table.Th>نوع الآلية</Table.Th>
                          <Table.Th>عدد النقلات</Table.Th>
                          <Table.Th>إجمالي الصافي</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {report.vehicles.map((v) => (
                          <Table.Tr key={`${v.region}-${v.vehicle}`}>
                            <Table.Td style={{ textAlign: "right" }}>
                              {v.region}
                            </Table.Td>
                            <Table.Td>
                              <Text fw={600} size="sm">
                                {v.vehicle}
                              </Text>
                            </Table.Td>
                            <Table.Td>{v.type}</Table.Td>
                            <Table.Td>
                              <Badge color="orange" variant="light">
                                {v.trips}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge color="blue" variant="light">
                                {fmt(v.net)}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Tabs.Panel>

                {/* Daily targets */}
                <Tabs.Panel value="targets" pt="md">
                  <Stack gap="md">
                    <Text size="sm" c="dimmed">
                      الهدف اليومي لكل منطقة (بنفس وحدة الصافي). تُحفظ القيم
                      تلقائيًا.
                    </Text>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                      {targetNames.map((name) => (
                        <NumberInput
                          key={name}
                          label={name}
                          placeholder="0"
                          value={targets[name] ?? ""}
                          onChange={(v) =>
                            setTargets((prev) => ({ ...prev, [name]: v }))
                          }
                          min={0}
                          thousandSeparator=","
                          hideControls
                        />
                      ))}
                    </SimpleGrid>
                  </Stack>
                </Tabs.Panel>
              </Tabs>
            </Card>
          </>
        )}
      </Stack>
    </Container>
  );
}
