"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import {
  Box,
  Paper,
  SimpleGrid,
  Select,
  Button,
  Text,
  Group,
  Badge,
} from "@mantine/core";

// =====================================================
// Dynamic OpenStreetMap
// =====================================================

const OsmMap = dynamic(() => import("./OsmMap"), {
  ssr: false,

  loading: () => (
    <Box
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
      }}
    >
      جاري تحميل الخريطة...
    </Box>
  ),
});

// =====================================================
// Date Helper
// =====================================================

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// =====================================================
// Get Default Dates
// =====================================================

const today = new Date();

const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

// =====================================================
// Districts
// =====================================================

const DISTRICTS = [
  "طارق",
  "ابو نصير",
  "احد",
  "الجبيهة",
  "النصر",
  "تلاع العلي وام السماق وخلدا",
  "شفا بدران",
  "ماركا",
];

// =====================================================
// KPIs
// =====================================================

const KPIS = [
  "1.1 - وجود القمامة والمخلفات والنفايات في مناطق الخدمة (الشوارع والأرصفة والجزر الوسطى والممرات والسلالم والجسور والأنفاق وممرات المشاة وأنفاقهم والمنحدرات والساحات المفتوحة)",
  "1.2 - وجود مكبات نفايات سرية",
  "1.3 - تحديد موقع حاويات النفايات بشكل غير لائق يعيق حركة المشاة والسيارات",
  "1.4 - نقاط تجميع غير مخدومة بنسبة امتلاء تزيد عن 80%",
  "1.5 - عدم انتظام خدمة الجمع وفقاً لخطة تقديم الخدمة",
  "1.6 - الإخفاق في الالتزام بمسارات جمع ونقل النفايات وفقاً لخطة تقديم الخدمة دون الحصول على موافقة AVTR",
  "1.7 - وجود نفايات حول حاويات النفايات",
  "1.8 - الحالة الجيدة لحاويات النفايات (العجلات، عدم التلف أو الكسر)، ونظافة الحاويات (الغسيل المنتظم)",
  "2.1 - الإخفاق في تسليم النفايات المجمعة إلى موقع التخلص المحدد",
  "2.2 - التخلص السري من النفايات من قِبل مزود الخدمة",
  "2.3 - وجود نفايات داخل الخنادق وغرف التفتيش بسبب مزود الخدمة",
  "2.5 - الإخفاق في اتباع توجيهات مشغل موقع التخلص المحدد أثناء تفريغ النفايات",
  "2.6 - الجمع والنقل المتعمد لأنواع النفايات غير المرخصة (الخاصة أو الخطرة)",
  "4.2 - تسرب من خزان الترسيب في المركبات",
  "4.3 - تساقط وتطاير النفايات من المركبات أثناء الجمع والنقل",
  "4.4 - الإخفاق في صيانة المركبات والحفاظ عليها في حالة جيدة (الأضرار والنظافة وعمل آلية جمع النفايات)",
  "5.2 - عدم توافر معدات الحماية الشخصية مع العمال أثناء عمليات الجمع والنقل",
  "5.3 - عمل العمال دون الزي الرسمي المعتمد",
  "5.4 - عدم توافر أدوات على المركبة لتحميل النفايات السائبة",
  "5.6 - الوضع التشغيلي لأضواء المركبة (الأضواء الليلية وأضواء الفرامل وأضواء الرجوع للخلف)",
  "6.1 - وجود أفراد غير مرخصين",
];

// =====================================================
// Statuses
// =====================================================

const STATUSES = [
  {
    value: "Resolved",
    label: "تم الحل",
    color: "green",
    bg: "#e9f8ee",
  },
  {
    value: "ResolutionRejected",
    label: "رفض الحل",
    color: "red",
    bg: "#ffeaea",
  },
  {
    value: "PendingSpValidation",
    label: "بانتظار القبول",
    color: "gray",
    bg: "#f1f3f5",
  },
  {
    value: "InProgress",
    label: "قيد التنفيذ",
    color: "orange",
    bg: "#fff4e0",
  },
  {
    value: "PendingFieldMonitorVerification",
    label: "في انتظار التحقق الميداني",
    color: "cyan",
    bg: "#e7f5ff",
  },
  {
    value: "PendingSupervisorReview",
    label: "قيد مراجعة AVTR",
    color: "violet",
    bg: "#f3f0ff",
  },
];

// =====================================================
// Status Dot Colors
// =====================================================

const STATUS_DOT_COLORS = {
  green: "#40c057",
  red: "#fa5252",
  gray: "#868e96",
  orange: "#fd7e14",
  cyan: "#15aabf",
  violet: "#7950f2",
};

// =====================================================
// Component
// =====================================================

export default function OsmMapClient() {
  // ===================================================
  // Filters
  // ===================================================

  const [district, setDistrict] = useState(null);
  const [kpiNameAr, setKpiNameAr] = useState(null);
  const [status, setStatus] = useState(null);

  // ===================================================
  // Heatmap
  // ===================================================

  const [heatmap, setHeatmap] = useState(false);

  // ===================================================
  // Dates
  // ===================================================

  const [dateFrom, setDateFrom] = useState(
    getLocalDateString(yesterday)
  );

  const [dateTo, setDateTo] = useState(
    getLocalDateString(today)
  );

  // ===================================================
  // Map Data
  // ===================================================

  const [locations, setLocations] = useState([]);

  // ===================================================
  // Loading
  // ===================================================

  const [loadingMap, setLoadingMap] = useState(false);

  // ===================================================
  // Error
  // ===================================================

  const [error, setError] = useState("");

  // ===================================================
  // Has Executed
  // ===================================================

  const [hasExecuted, setHasExecuted] = useState(false);

  // ===================================================
  // Options
  // ===================================================

  const districtOptions = DISTRICTS.map((item) => ({
    value: item,
    label: item,
  }));

  const kpiOptions = KPIS.map((item) => ({
    value: item,
    label: item,
  }));

  const statusOptions = STATUSES.map((item) => ({
    value: item.value,
    label: item.label,
  }));

  // ===================================================
  // Status Counts
  // ===================================================

  const statusCounts = STATUSES.map((item) => ({
    ...item,

    count: locations.filter(
      (location) => location?.status === item.value
    ).length,
  }));

  const activeStatusCounts = statusCounts.filter(
    (item) => item.count > 0
  );

  // ===================================================
  // Execute
  // ===================================================

  const handleExecute = async () => {
    try {
      setLoadingMap(true);
      setError("");
      setHasExecuted(true);

      const params = new URLSearchParams();

      if (district) {
        params.set("districtNames", district);
      }

     if (kpiNameAr) {
  const kpiNameWithoutNumber =
    kpiNameAr.replace(
      /^\s*\d+(?:\.\d+)?\s*-\s*/,
      ""
    );

  params.set(
    "kpiNameAr",
    kpiNameWithoutNumber
  );
}

      if (status) {
        params.set("status", status);
      }

      if (dateFrom) {
        params.set(
          "dateFrom",
          `${dateFrom}T21:00:00.000Z`
        );
      }

      if (dateTo) {
        params.set(
          "dateTo",
          `${dateTo}T20:59:59.999Z`
        );
      }

      const url =
        `/api/service-provider/map?${params.toString()}`;

      console.log("MAP REQUEST:", url);

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "فشل تحميل المواقع"
        );
      }

      const items = Array.isArray(data?.items)
        ? data.items
        : [];

      console.log("MAP RESPONSE:", data);
      console.log("COUNT:", items.length);

      setLocations(items);
      setHeatmap(false);
    } catch (error) {
      console.error("MAP ERROR:", error);

      setError(
        error?.message ||
          "حدث خطأ أثناء تحميل المواقع"
      );

      setLocations([]);
      setHeatmap(false);
    } finally {
      setLoadingMap(false);
    }
  };

  // ===================================================
  // Clear
  // ===================================================

  const handleClear = () => {
    setDistrict(null);
    setKpiNameAr(null);
    setStatus(null);

    setDateFrom(
      getLocalDateString(yesterday)
    );

    setDateTo(
      getLocalDateString(today)
    );

    setLocations([]);
    setHeatmap(false);
    setError("");
    setHasExecuted(false);
  };

  // ===================================================
  // Selected Status Label
  // ===================================================

  const selectedStatusLabel =
    STATUSES.find(
      (item) => item.value === status
    )?.label;

  // ===================================================
  // Shared Glass Style
  // ===================================================

  const glassStyle = {
    background:
      "rgba(255,255,255,0.88)",

    backdropFilter:
      "blur(18px)",

    WebkitBackdropFilter:
      "blur(18px)",

    border:
      "1px solid rgba(255,255,255,0.65)",

    boxShadow:
      "0 12px 35px rgba(15,23,42,0.16)",
  };

  // ===================================================
  // Render
  // ===================================================

  return (
    <Box
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* =================================================
          MAP
      ================================================= */}

      <Box
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
        }}
      >
        <OsmMap
          locations={locations}
          heatmap={heatmap}
        />
      </Box>

      {/* =================================================
          TOP FILTER GLASS CARD
      ================================================= */}

      <Paper
        radius={18}
        p="sm"
        className="map-filter-card"
        style={{
          ...glassStyle,

          position: "absolute",

          top: 14,
          left: "50%",

          width:
            "min(1050px, calc(100vw - 28px))",

          transform: "translateX(-50%)",

          zIndex: 2000,

          direction: "rtl",

          overflow: "visible",

          boxSizing: "border-box",

          transition:
            "box-shadow 200ms ease, width 200ms ease",
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <Group
          justify="space-between"
          align="center"
          mb={8}
          px={3}
        >
          <Box>
            <Text
              size="xs"
              fw={900}
              c="dark"
            >
              خريطة المخالفات
            </Text>

            <Text
              size="9px"
              c="dimmed"
              mt={1}
            >
              حدد التصفية ثم اضغط تنفيذ
            </Text>
          </Box>

          {hasExecuted && !loadingMap && (
            <Badge
              size="sm"
              variant="light"
              color={
                locations.length
                  ? "green"
                  : "gray"
              }
            >
              {locations.length} مخالفة
            </Badge>
          )}
        </Group>

        {/* =================================================
            FILTER ROW
        ================================================= */}

        <Group
          gap={7}
          align="end"
          className="map-filter-row"
          style={{
            width: "100%",
            flexWrap: "nowrap",
          }}
        >
          {/* =================================================
              DATE FROM
          ================================================= */}

          <Box
            className="filter-field"
            style={{
              flex: "1 1 0",
              minWidth: 0,
            }}
          >
            <Text
              size="9px"
              fw={800}
              mb={3}
              c="dimmed"
            >
              التاريخ من
            </Text>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) =>
                setDateFrom(
                  event.target.value
                )
              }
              style={{
                direction: "rtl",
                width: "100%",
                height: 32,
                border:
                  "1px solid rgba(0,0,0,0.10)",
                borderRadius: 9,
                padding: "0 7px",
                fontSize: 11,
                background:
                  "rgba(255,255,255,0.72)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </Box>

          {/* =================================================
              DATE TO
          ================================================= */}

          <Box
            className="filter-field"
            style={{
              flex: "1 1 0",
              minWidth: 0,
            }}
          >
            <Text
              size="9px"
              fw={800}
              mb={3}
              c="dimmed"
            >
              التاريخ إلى
            </Text>

            <input
              type="date"
              value={dateTo}
              onChange={(event) =>
                setDateTo(
                  event.target.value
                )
              }
              style={{
                direction: "rtl",
                width: "100%",
                height: 32,
                border:
                  "1px solid rgba(0,0,0,0.10)",
                borderRadius: 9,
                padding: "0 7px",
                fontSize: 11,
                background:
                  "rgba(255,255,255,0.72)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </Box>

          {/* =================================================
              DISTRICT
          ================================================= */}

          <Select
            className="filter-field"
            dir="rtl"
            label="المنطقة"
            placeholder="المنطقة"
            searchable
            clearable
            size="xs"
            value={district}
            onChange={setDistrict}
            data={districtOptions}
            nothingFoundMessage="لا توجد مناطق"
            style={{
              flex: "1 1 0",
              minWidth: 0,
            }}
            comboboxProps={{
              withinPortal: true,
              zIndex: 10000,
            }}
            styles={{
              label: {
                fontSize: 9,
                fontWeight: 800,
                marginBottom: 3,
                textAlign: "right",
                color: "#868e96",
              },

              input: {
                height: 32,
                minHeight: 32,
                fontSize: 11,
                borderRadius: 9,
                paddingLeft: 8,
                paddingRight: 8,
                textAlign: "right",
                direction: "rtl",
                background:
                  "rgba(255,255,255,0.72)",
                border:
                  "1px solid rgba(0,0,0,0.10)",
              },

              dropdown: {
                zIndex: 10000,
                direction: "rtl",
                textAlign: "right",
              },

              option: {
                direction: "rtl",
                textAlign: "right",
                justifyContent:
                  "flex-start",
              },
            }}
          />

          {/* =================================================
              KPI
          ================================================= */}

          <Select
            className="filter-field kpi-field"
            dir="rtl"
            label="KPI"
            placeholder="KPI"
            searchable
            clearable
            size="xs"
            value={kpiNameAr}
            onChange={setKpiNameAr}
            data={kpiOptions}
            nothingFoundMessage="لا توجد KPIs"
            maxDropdownHeight={350}
            style={{
              flex: "2 1 0",
              minWidth: 0,
            }}
            comboboxProps={{
              withinPortal: true,
              zIndex: 10000,
            }}
            renderOption={({ option }) => {
              const parts =
                option.label.split(" - ");

              const number = parts[0];

              const text = parts
                .slice(1)
                .join(" - ");

              return (
                <div
                  dir="rtl"
                  style={{
                    display: "flex",
                    alignItems:
                      "flex-start",
                    gap: 7,
                    width: "100%",
                    textAlign: "right",
                  }}
                >
                  <span
                    style={{
                      color: "#2f9e44",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {number}
                  </span>

                  <span
                    style={{
                      color: "#212529",
                      fontWeight: 500,
                    }}
                  >
                    {text}
                  </span>
                </div>
              );
            }}
            styles={{
              label: {
                fontSize: 9,
                fontWeight: 800,
                marginBottom: 3,
                textAlign: "right",
                color: "#868e96",
              },

              input: {
                height: 32,
                minHeight: 32,
                fontSize: 11,
                borderRadius: 9,
                paddingLeft: 8,
                paddingRight: 8,
                textAlign: "right",
                direction: "rtl",
                background:
                  "rgba(255,255,255,0.72)",
                border:
                  "1px solid rgba(0,0,0,0.10)",
              },

              dropdown: {
                zIndex: 10000,
                direction: "rtl",
                textAlign: "right",
              },

              option: {
                direction: "rtl",
                textAlign: "right",
                justifyContent:
                  "flex-start",
              },
            }}
          />

          {/* =================================================
              STATUS
          ================================================= */}

          <Select
            className="filter-field"
            dir="rtl"
            label="الحالة"
            placeholder="الحالة"
            searchable
            clearable
            size="xs"
            value={status}
            onChange={setStatus}
            data={statusOptions}
            nothingFoundMessage="لا توجد حالات"
            style={{
              flex: "1 1 0",
              minWidth: 0,
            }}
            comboboxProps={{
              withinPortal: true,
              zIndex: 10000,
            }}
            styles={{
              label: {
                fontSize: 9,
                fontWeight: 800,
                marginBottom: 3,
                textAlign: "right",
                color: "#868e96",
              },

              input: {
                height: 32,
                minHeight: 32,
                fontSize: 11,
                borderRadius: 9,
                paddingLeft: 8,
                paddingRight: 8,
                textAlign: "right",
                direction: "rtl",
                background:
                  "rgba(255,255,255,0.72)",
                border:
                  "1px solid rgba(0,0,0,0.10)",
              },

              dropdown: {
                zIndex: 10000,
                direction: "rtl",
                textAlign: "right",
              },

              option: {
                direction: "rtl",
                textAlign: "right",
                justifyContent:
                  "flex-start",
              },
            }}
          />

          {/* =================================================
              BUTTONS
          ================================================= */}

          <Group
            gap={5}
            className="map-action-buttons"
            style={{
              flex: "1.35 1 0",
              minWidth: 175,
              flexShrink: 0,
            }}
          >
            {/* EXECUTE */}

            <Button
              size="xs"
              fullWidth
              onClick={handleExecute}
              loading={loadingMap}
              radius="md"
              style={{
                height: 32,
                minWidth: 0,
                fontSize: 11,
                padding: "0 10px",
                whiteSpace: "nowrap",
                flex: 1,
                boxShadow:
                  "0 4px 12px rgba(34,139,230,0.22)",
              }}
            >
              تنفيذ
            </Button>

            {/* HEATMAP */}

            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={() =>
                setHeatmap((prev) => !prev)
              }
              fullWidth
              disabled={
                locations.length === 0
              }
              radius="md"
              style={{
                height: 32,
                minWidth: 0,
                fontSize: 11,
                padding: "0 10px",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {heatmap
                ? "النقاط"
                : "حرارية"}
            </Button>

            {/* CLEAR */}

            <Button
              size="xs"
              variant="light"
              color="gray"
              fullWidth
              onClick={handleClear}
              disabled={loadingMap}
              radius="md"
              style={{
                height: 32,
                minWidth: 0,
                fontSize: 11,
                padding: "0 10px",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              مسح
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* =================================================
          RESULT SUMMARY
      ================================================= */}

      {hasExecuted && !loadingMap && (
        <Box
          style={{
            position: "absolute",
            bottom: 10,
            left: 14,
            width: 310,
            maxWidth:
              "calc(100vw - 28px)",
            zIndex: 2000,
            direction: "rtl",
          }}
        >
          {/* =================================================
              ERROR
          ================================================= */}

          {error ? (
            <Box
              style={{
                ...glassStyle,

                border:
                  "1px solid rgba(250,82,82,0.35)",

                borderRadius: 18,

                padding: "12px 14px",
              }}
            >
              <Group
                justify="space-between"
                align="center"
                gap={8}
                wrap="nowrap"
              >
                <Box>
                  <Text
                    size="xs"
                    fw={900}
                    c="red"
                  >
                    تعذر تحميل البيانات
                  </Text>

                  <Text
                    size="10px"
                    c="dimmed"
                    mt={3}
                  >
                    {error}
                  </Text>
                </Box>

                <Badge
                  color="red"
                  variant="light"
                  size="sm"
                >
                  خطأ
                </Badge>
              </Group>
            </Box>
          ) : locations.length === 0 ? (
            /* =================================================
               NO DATA
            ================================================= */

            <Box
              style={{
                ...glassStyle,

                border:
                  "1px solid rgba(134,142,150,0.25)",

                borderRadius: 18,

                padding: "13px 14px",
              }}
            >
              <Group
                align="center"
                gap={10}
                wrap="nowrap"
              >
                <Box
                  style={{
                    width: 38,
                    height: 38,
                    minWidth: 38,
                    borderRadius: 13,
                    background:
                      "rgba(134,142,150,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 17,
                    color: "#868e96",
                  }}
                >
                  ✓
                </Box>

                <Box
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    size="sm"
                    fw={900}
                  >
                    لا توجد مخالفات
                  </Text>

                  <Text
                    size="10px"
                    c="dimmed"
                    mt={2}
                  >
                    لا توجد مخالفات حسب
                    التصفية المحددة
                  </Text>
                </Box>

                <Badge
                  color="gray"
                  variant="light"
                  size="sm"
                >
                  0
                </Badge>
              </Group>

              <Group
                gap={4}
                mt={9}
                wrap="wrap"
              >
                <Badge
                  size="xs"
                  variant="outline"
                  color="gray"
                >
                  {dateFrom} ← {dateTo}
                </Badge>

                {district && (
                  <Badge
                    size="xs"
                    variant="light"
                  >
                    {district}
                  </Badge>
                )}

                {kpiNameAr && (
                  <Badge
                    size="xs"
                    variant="light"
                    color="green"
                  >
                    KPI محدد
                  </Badge>
                )}

                {status && (
                  <Badge
                    size="xs"
                    variant="light"
                    color="blue"
                  >
                    {selectedStatusLabel}
                  </Badge>
                )}
              </Group>
            </Box>
          ) : (
            /* =================================================
               HAS DATA
            ================================================= */

            <Box
              style={{
                ...glassStyle,

                border:
                  "1px solid rgba(64,192,87,0.28)",

                borderRadius: 18,

                padding: "13px 14px",
              }}
            >
              {/* HEADER */}

              <Group
                justify="space-between"
                align="center"
                mb={9}
                wrap="nowrap"
              >
                <Group
                  gap={9}
                  wrap="nowrap"
                >
                  <Box
                    style={{
                      width: 38,
                      height: 38,
                      minWidth: 38,
                      borderRadius: 13,
                      background:
                        "rgba(64,192,87,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 17,
                      color: "#40c057",
                    }}
                  >
                    ✓
                  </Box>

                  <Box>
                    <Text
                      size="sm"
                      fw={900}
                    >
                      تم العثور على مخالفات
                    </Text>

                    <Text
                      size="10px"
                      c="dimmed"
                      mt={2}
                    >
                      النتائج المطابقة للتصفية
                    </Text>
                  </Box>
                </Group>

                <Badge
                  color="green"
                  variant="filled"
                  size="lg"
                  radius="md"
                >
                  {locations.length}
                </Badge>
              </Group>

              {/* BASIC STATISTICS */}

              <SimpleGrid
                cols={3}
                spacing={5}
              >
                <Box
                  style={{
                    background:
                      "rgba(255,255,255,0.62)",

                    border:
                      "1px solid rgba(0,0,0,0.06)",

                    borderRadius: 10,

                    padding: "7px 5px",

                    textAlign: "center",
                  }}
                >
                  <Text
                    size="9px"
                    c="dimmed"
                    fw={700}
                  >
                    المواقع
                  </Text>

                  <Text
                    size="sm"
                    fw={900}
                    c="green"
                  >
                    {locations.length}
                  </Text>
                </Box>

                <Box
                  style={{
                    background:
                      "rgba(255,255,255,0.62)",

                    border:
                      "1px solid rgba(0,0,0,0.06)",

                    borderRadius: 10,

                    padding: "7px 5px",

                    textAlign: "center",
                  }}
                >
                  <Text
                    size="9px"
                    c="dimmed"
                    fw={700}
                  >
                    المنطقة
                  </Text>

                  <Text
                    size="xs"
                    fw={900}
                    truncate
                  >
                    {district || "الكل"}
                  </Text>
                </Box>

                <Box
                  style={{
                    background:
                      "rgba(255,255,255,0.62)",

                    border:
                      "1px solid rgba(0,0,0,0.06)",

                    borderRadius: 10,

                    padding: "7px 5px",

                    textAlign: "center",
                  }}
                >
                  <Text
                    size="9px"
                    c="dimmed"
                    fw={700}
                  >
                    الحالة
                  </Text>

                  <Text
                    size="xs"
                    fw={900}
                    truncate
                  >
                    {selectedStatusLabel ||
                      "الكل"}
                  </Text>
                </Box>
              </SimpleGrid>

              {/* STATUS COUNTS */}

              <Box mt={9}>
                <Group
                  justify="space-between"
                  align="center"
                  mb={5}
                >
                  <Text
                    size="9px"
                    c="dimmed"
                    fw={800}
                  >
                    توزيع الحالات
                  </Text>

                  <Text
                    size="9px"
                    c="dimmed"
                  >
                    {activeStatusCounts.length} حالات
                  </Text>
                </Group>

                <Box
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  {activeStatusCounts.map(
                    (item) => (
                      <Group
                        key={item.value}
                        justify="space-between"
                        gap={6}
                        wrap="nowrap"
                        style={{
                          minHeight: 26,

                          padding: "4px 7px",

                          borderRadius: 9,

                          background: item.bg,

                          border:
                            `1px solid ${item.bg}`,

                          transition:
                            "transform 150ms ease",
                        }}
                      >
                        <Group
                          gap={7}
                          wrap="nowrap"
                          style={{
                            minWidth: 0,
                          }}
                        >
                          <Box
                            style={{
                              width: 8,
                              height: 8,
                              minWidth: 8,
                              borderRadius: "50%",
                              background:
                                STATUS_DOT_COLORS[
                                  item.color
                                ],
                              boxShadow:
                                `0 0 0 3px ${item.bg}`,
                            }}
                          />

                          <Text
                            size="10px"
                            fw={650}
                            truncate
                          >
                            {item.label}
                          </Text>
                        </Group>

                        <Badge
                          size="xs"
                          variant="light"
                          color={item.color}
                          radius="md"
                          style={{
                            minWidth: 30,
                            justifyContent:
                              "center",
                            fontWeight: 900,
                          }}
                        >
                          {item.count}
                        </Badge>
                      </Group>
                    )
                  )}
                </Box>
              </Box>

              {/* FILTER SUMMARY */}

              <Group
                gap={4}
                mt={9}
                wrap="wrap"
              >
                <Badge
                  size="xs"
                  variant="outline"
                  color="gray"
                >
                  {dateFrom} ← {dateTo}
                </Badge>

                {kpiNameAr && (
                  <Badge
                    size="xs"
                    variant="light"
                    color="green"
                  >
                    KPI محدد
                  </Badge>
                )}

                {heatmap && (
                  <Badge
                    size="xs"
                    variant="light"
                    color="red"
                  >
                    عرض حراري
                  </Badge>
                )}
              </Group>
            </Box>
          )}
        </Box>
      )}

      {/* =================================================
          RESPONSIVE CSS
      ================================================= */}

      <style jsx>{`
        .map-filter-card {
          transition:
            box-shadow 200ms ease,
            width 200ms ease;
        }

        .map-filter-row {
          align-items: flex-end;
        }

        .map-action-buttons {
          flex-shrink: 0;
        }

        .map-action-buttons button {
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: clip !important;
        }

        @media (max-width: 1100px) {
          .map-filter-card {
            width: calc(100vw - 24px) !important;
          }

          .map-filter-row {
            gap: 5px;
          }

          .map-action-buttons {
            min-width: 170px !important;
          }
        }

        @media (max-width: 850px) {
          .map-filter-card {
            width: calc(100vw - 20px) !important;
          }

          .map-filter-row {
            flex-wrap: wrap !important;
          }

          .map-filter-row > .filter-field {
            flex: 1 1 calc(25% - 5px) !important;
            min-width: 130px !important;
          }

          .map-filter-row > .kpi-field {
            flex: 2 1 calc(50% - 5px) !important;
            min-width: 220px !important;
          }

          .map-filter-row
            .map-action-buttons {
            flex: 1 1 100% !important;
            min-width: 100% !important;
          }
        }

        @media (max-width: 600px) {
          .map-filter-card {
            top: 8px !important;
            width: calc(100vw - 16px) !important;
            border-radius: 15px !important;
          }

          .map-filter-row {
            gap: 6px !important;
          }

          .map-filter-row
            > .filter-field,
          .map-filter-row
            > .kpi-field {
            flex: 1 1 calc(50% - 6px) !important;
            min-width: 0 !important;
          }

          .map-filter-row
            > .kpi-field {
            flex-basis: 100% !important;
          }

          .map-filter-row
            .map-action-buttons {
            display: grid !important;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 5px !important;
            width: 100% !important;
          }

          .map-filter-row
            .map-action-buttons
            button {
            width: 100% !important;
            min-width: 0 !important;
            padding-left: 5px !important;
            padding-right: 5px !important;
          }
        }

        @media (max-width: 380px) {
          .map-filter-row
            > .filter-field {
            flex: 1 1 100% !important;
          }

          .map-filter-row
            > .kpi-field {
            flex-basis: 100% !important;
          }

          .map-filter-row
            .map-action-buttons {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </Box>
  );
}