
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import {
  Box,
  Drawer,
  Select,
  Button,
  Text,
  Group,
  Badge,
  Stack,
  Divider,
  ActionIcon,
  Paper,
  SimpleGrid,
} from "@mantine/core";

import {
  IconSearch,
  IconX,
  IconMap,
  IconFlame,
  IconFilter,
  IconCalendar,
  IconMapPin,
  IconClipboardList,
  IconAdjustmentsHorizontal,
  IconRefresh,
  IconChevronLeft,
} from "@tabler/icons-react";

import { bungee } from "../../layout";

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
        background: "#f5f7fa",
        color: "#64748b",
        fontSize: 14,
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
// Default Dates
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
  // Drawer
  // ===================================================

  const [searchOpened, setSearchOpened] = useState(false);

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
  // Selected Status
  // ===================================================

  const selectedStatus = STATUSES.find(
    (item) => item.value === status
  );

  const selectedStatusLabel = selectedStatus?.label;

  // ===================================================
  // Active Filters Count
  // ===================================================

  const activeFiltersCount =
    Number(Boolean(district)) +
    Number(Boolean(kpiNameAr)) +
    Number(Boolean(status));

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
  // Execute Search
  // ===================================================

  const handleExecute = async () => {
    try {
      setLoadingMap(true);
      setError("");
      setHasExecuted(true);

      const params = new URLSearchParams();

      // =================================================
      // District
      // =================================================

      if (district) {
        params.set("districtNames", district);
      }

      // =================================================
      // KPI
      // =================================================

      if (kpiNameAr) {
        const kpiNameWithoutNumber = kpiNameAr.replace(
          /^\d+(?:\.\d+)?\s*-\s*/,
          ""
        );

        params.set(
          "kpiNameAr",
          kpiNameWithoutNumber
        );
      }

      // =================================================
      // Status
      // =================================================

      if (status) {
        params.set("status", status);
      }

      // =================================================
      // Date From
      // =================================================

      if (dateFrom) {
        params.set(
          "dateFrom",
          `${dateFrom}T21:00:00.000Z`
        );
      }

      // =================================================
      // Date To
      // =================================================

      if (dateTo) {
        params.set(
          "dateTo",
          `${dateTo}T20:59:59.999Z`
        );
      }

      // =================================================
      // API URL
      // =================================================

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

      // =================================================
      // IMPORTANT:
      // Drawer stays OPEN after search
      // =================================================
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
  // Clear Filters
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
  // Shared Panel Style
  // ===================================================

  const panelShadow =
    "0 8px 30px rgba(15, 23, 42, 0.16)";

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
        background: "#eef2f6",
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
          SEARCH BUTTON
      ================================================= */}
<Paper
  radius="xl"
  shadow="md"
  style={{
    position: "absolute",
    top: 18,
    left: 18,
    zIndex: searchOpened ? 100 : 2000,
    overflow: "hidden",
  }}
>
        <Button
          variant="white"
          color="dark"
          radius="xl"
          size="md"
          leftSection={
            <IconSearch
              size={18}
              stroke={2.2}
            />
          }
          
          onClick={() => setSearchOpened(true)}
          loading={loadingMap}
          styles={{
            root: {
              height: 44,
              paddingLeft: 16,
              paddingRight: 16,
              border:
                "1px solid rgba(0,0,0,0.08)",
              boxShadow: panelShadow,
              fontWeight: 700,
            },

            label: {
              fontSize: 13,
            },
          }}
        >
          بحث
        </Button>
      </Paper>

      {/* =================================================
          BRAND - CENTER
      ================================================= */}

      <Box
        style={{
          position: "absolute",
          top: 18,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1900,
          direction: "ltr",
          pointerEvents: "none",
        }}
      >
        <Paper
          radius="xl"
          shadow="sm"
          px={18}
          py={10}
          style={{
            background:
              "rgba(255, 255, 255, 0.30)",
            backdropFilter: "blur(1px)",
            WebkitBackdropFilter:
              "blur(1px)",
            border:
              "1px solid rgba(255, 255, 255, 0.55)",
            boxShadow:
              "0 6px 24px rgba(0, 0, 0, 0.10), inset 0 1px 0 rgba(255,255,255,0.45)",
            whiteSpace: "nowrap",
          }}
        >
          <Group
            gap={5}
            align="baseline"
            justify="center"
          >
            <Text
              component="span"
              className={bungee.className}
              style={{
                fontSize: 28,
                lineHeight: 1,
                background:
                  "linear-gradient(110deg, #1864ab 0%, #228be6 40%, #15aabf 75%, #12b886 100%)",
                WebkitBackgroundClip:
                  "text",
                WebkitTextFillColor:
                  "transparent",
                backgroundClip: "text",
              }}
            >
              Matrix
            </Text>

            <Text
              component="span"
              style={{
                fontFamily:
                  "Inter, sans-serif",
                fontSize: 21,
                fontWeight: 650,
                color: "#263746",
                lineHeight: 1,
              }}
            >
              Ops
            </Text>
          </Group>

          <Text
            ta="center"
            mt={4}
            style={{
              fontFamily:
                "Inter, sans-serif",
              fontSize: 7,
              fontWeight: 700,
              letterSpacing: "1.5px",
              color:
                "rgba(30,50,65,0.48)",
            }}
          >
            OPERATIONS INTELLIGENCE
          </Text>
        </Paper>
      </Box>

      {/* =================================================
          ACTIVE FILTER INDICATOR
      ================================================= */}

      {activeFiltersCount > 0 && (
        <Paper
          radius="xl"
          shadow="sm"
          style={{
            position: "absolute",
            top: 75,
            left: 18,
            zIndex: 1900,
            padding: "5px 10px",
            background:
              "rgba(255,255,255,0.94)",
            border:
              "1px solid rgba(34,139,230,0.18)",
          }}
        >
          <Group gap={6}>
            <IconFilter
              size={13}
              color="#228be6"
            />

            <Text
              size="xs"
              fw={700}
              c="blue"
            >
              {activeFiltersCount} فلاتر نشطة
            </Text>
          </Group>
        </Paper>
      )}

      {/* =================================================
          SEARCH DRAWER
      ================================================= */}

     <Drawer
  opened={searchOpened}
  onClose={() => setSearchOpened(false)}
  position="left"
  size={390}
  withCloseButton={false}
  closeOnClickOutside={false}
  closeOnEscape={false}
  withOverlay={false}
  styles={{
    root: {
      zIndex: 5000,
    },

    content: {
      direction: "rtl",
      zIndex: 5000,
      boxShadow: "8px 0 40px rgba(15,23,42,0.14)",
    },

    body: {
      padding: 0,
      height: "100%",
    },

    header: {
      padding: 0,
    },
  }}
>
        <Box
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
          }}
        >
          {/* =================================================
              DRAWER HEADER
          ================================================= */}

          <Box
            style={{
              padding:
                "18px 18px 15px",
              borderBottom:
                "1px solid #edf0f3",
              background:
                "linear-gradient(180deg, #ffffff 0%, #fafbfd 100%)",
            }}
          >
            <Group
              justify="space-between"
              align="center"
            >
              <Group gap={11}>
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background:
                      "linear-gradient(135deg, #e7f5ff, #d0ebff)",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    color: "#1971c2",
                  }}
                >
                  <IconSearch
                    size={20}
                    stroke={2}
                  />
                </Box>

                <Box>
                  <Text
                    fw={800}
                    size="md"
                    style={{
                      color: "#1f2937",
                    }}
                  >
                    بحث وتصفية
                  </Text>

                  <Text
                    size="xs"
                    c="dimmed"
                    mt={2}
                  >
                    حدد المعايير لعرض المخالفات
                  </Text>
                </Box>
              </Group>

           <ActionIcon
  variant="subtle"
  color="gray"
  size={38}
  radius="xl"
  onClick={() => setSearchOpened(false)}
  aria-label="إغلاق البحث"
  title="إغلاق"
  styles={{
    root: {
      transition: "all 0.2s ease",
      "&:hover": {
        background: "#f1f3f5",
        color: "#228be6",
      },
    },
  }}
>
  <IconChevronLeft size={22} stroke={2.2} />
</ActionIcon>
            </Group>

            {/* Active filters */}

            {activeFiltersCount > 0 && (
              <Box
                mt={13}
                style={{
                  background:
                    "#f0f7ff",
                  border:
                    "1px solid #dbeafe",
                  borderRadius: 11,
                  padding:
                    "8px 10px",
                }}
              >
                <Group
                  gap={7}
                  wrap="nowrap"
                >
                  <IconAdjustmentsHorizontal
                    size={15}
                    color="#228be6"
                  />

                  <Text
                    size="xs"
                    fw={700}
                    c="blue"
                  >
                    {activeFiltersCount} معايير محددة
                  </Text>
                </Group>
              </Box>
            )}
          </Box>

          {/* =================================================
              DRAWER BODY
          ================================================= */}

          <Box
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 18,
            }}
          >
            <Stack gap={17}>
              {/* =================================================
                  DATE SECTION
              ================================================= */}

              <Box>
                <Group
                  gap={7}
                  mb={10}
                >
                  <IconCalendar
                    size={16}
                    color="#228be6"
                  />

                  <Text
                    size="sm"
                    fw={800}
                    c="#343a40"
                  >
                    الفترة الزمنية
                  </Text>
                </Group>

                <SimpleGrid
                  cols={2}
                  spacing={9}
                >
                  {/* FROM */}

                  <Box>
                    <Text
                      size="xs"
                      fw={700}
                      c="dimmed"
                      mb={5}
                    >
                      من
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
                        width: "100%",
                        height: 38,
                        border:
                          "1px solid #dfe3e8",
                        borderRadius: 9,
                        padding:
                          "0 9px",
                        fontSize: 12,
                        background:
                          "#ffffff",
                        color:
                          "#343a40",
                        outline: "none",
                        boxSizing:
                          "border-box",
                        direction: "ltr",
                      }}
                    />
                  </Box>

                  {/* TO */}

                  <Box>
                    <Text
                      size="xs"
                      fw={700}
                      c="dimmed"
                      mb={5}
                    >
                      إلى
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
                        width: "100%",
                        height: 38,
                        border:
                          "1px solid #dfe3e8",
                        borderRadius: 9,
                        padding:
                          "0 9px",
                        fontSize: 12,
                        background:
                          "#ffffff",
                        color:
                          "#343a40",
                        outline: "none",
                        boxSizing:
                          "border-box",
                        direction: "ltr",
                      }}
                    />
                  </Box>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* =================================================
                  DISTRICT
              ================================================= */}

              <Box>
                <Group
                  gap={7}
                  mb={8}
                >
                  <IconMapPin
                    size={16}
                    color="#228be6"
                  />

                  <Text
                    size="sm"
                    fw={800}
                    c="#343a40"
                  >
                    المنطقة
                  </Text>
                </Group>

                <Select
                  dir="rtl"
                  placeholder="جميع المناطق"
                  searchable
                  clearable
                  value={district}
                  onChange={setDistrict}
                  data={districtOptions}
                  nothingFoundMessage="لا توجد مناطق"
                  size="sm"
                  comboboxProps={{
                    withinPortal: true,
                    zIndex: 10000,
                  }}
                  styles={{
                    input: {
                      height: 40,
                      minHeight: 40,
                      borderRadius: 10,
                      fontSize: 12,
                      textAlign: "right",
                      background: "#fff",
                    },

                    dropdown: {
                      direction: "rtl",
                    },

                    option: {
                      direction: "rtl",
                      textAlign: "right",
                    },
                  }}
                />
              </Box>

              {/* =================================================
                  KPI
              ================================================= */}

              <Box>
                <Group
                  gap={7}
                  mb={8}
                >
                  <IconClipboardList
                    size={16}
                    color="#40c057"
                  />

                  <Text
                    size="sm"
                    fw={800}
                    c="#343a40"
                  >
                    نوع المخالفة KPI
                  </Text>
                </Group>

                <Select
                  dir="rtl"
                  placeholder="جميع المخالفات"
                  searchable
                  clearable
                  value={kpiNameAr}
                  onChange={setKpiNameAr}
                  data={kpiOptions}
                  nothingFoundMessage="لا توجد KPIs"
                  maxDropdownHeight={350}
                  size="sm"
                  comboboxProps={{
                    withinPortal: true,
                    zIndex: 10000,
                  }}
                  renderOption={({ option }) => {
                    const parts =
                      option.label.split(" - ");

                    const number =
                      parts[0];

                    const text =
                      parts
                        .slice(1)
                        .join(" - ");

                    return (
                      <Box
                        dir="rtl"
                        style={{
                          display: "flex",
                          alignItems:
                            "flex-start",
                          gap: 8,
                          width: "100%",
                          textAlign:
                            "right",
                        }}
                      >
                        <Text
                          component="span"
                          size="xs"
                          fw={800}
                          c="green"
                          style={{
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {number}
                        </Text>

                        <Text
                          component="span"
                          size="xs"
                          fw={500}
                          c="dark"
                        >
                          {text}
                        </Text>
                      </Box>
                    );
                  }}
                  styles={{
                    input: {
                      height: 40,
                      minHeight: 40,
                      borderRadius: 10,
                      fontSize: 12,
                      textAlign: "right",
                      direction: "rtl",
                      background: "#fff",
                    },

                    dropdown: {
                      direction: "rtl",
                    },

                    option: {
                      direction: "rtl",
                      textAlign: "right",
                    },
                  }}
                />
              </Box>

              {/* =================================================
                  STATUS
              ================================================= */}

              <Box>
                <Group
                  gap={7}
                  mb={8}
                >
                  <Box
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg,#228be6,#15aabf)",
                    }}
                  />

                  <Text
                    size="sm"
                    fw={800}
                    c="#343a40"
                  >
                    الحالة
                  </Text>
                </Group>

                <Select
                  dir="rtl"
                  placeholder="جميع الحالات"
                  searchable
                  clearable
                  value={status}
                  onChange={setStatus}
                  data={statusOptions}
                  nothingFoundMessage="لا توجد حالات"
                  size="sm"
                  comboboxProps={{
                    withinPortal: true,
                    zIndex: 10000,
                  }}
                  renderOption={({ option }) => {
                    const item =
                      STATUSES.find(
                        (x) =>
                          x.value ===
                          option.value
                      );

                    return (
                      <Group
                        gap={8}
                        wrap="nowrap"
                      >
                        <Box
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius:
                              "50%",
                            background:
                              STATUS_DOT_COLORS[
                                item?.color
                              ] ||
                              "#868e96",
                            flexShrink: 0,
                          }}
                        />

                        <Text
                          size="xs"
                          fw={600}
                        >
                          {option.label}
                        </Text>
                      </Group>
                    );
                  }}
                  styles={{
                    input: {
                      height: 40,
                      minHeight: 40,
                      borderRadius: 10,
                      fontSize: 12,
                      textAlign: "right",
                      direction: "rtl",
                      background: "#fff",
                    },

                    dropdown: {
                      direction: "rtl",
                    },

                    option: {
                      direction: "rtl",
                      textAlign: "right",
                    },
                  }}
                />
              </Box>

              {/* =================================================
                  CURRENT FILTER SUMMARY
              ================================================= */}

              {(district ||
                kpiNameAr ||
                status) && (
                <>
                  <Divider />

                  <Box>
                    <Group
                      gap={7}
                      mb={9}
                    >
                      <IconFilter
                        size={16}
                        color="#868e96"
                      />

                      <Text
                        size="sm"
                        fw={800}
                        c="#343a40"
                      >
                        الفلاتر الحالية
                      </Text>
                    </Group>

                    <Stack gap={6}>
                      {/* District */}

                      {district && (
                        <Box
                          style={{
                            padding:
                              "7px 9px",
                            borderRadius: 9,
                            background:
                              "#f8f9fa",
                            border:
                              "1px solid #edf0f2",
                          }}
                        >
                          <Text
                            size="xs"
                            c="dimmed"
                          >
                            المنطقة
                          </Text>

                          <Text
                            size="xs"
                            fw={700}
                            mt={2}
                          >
                            {district}
                          </Text>
                        </Box>
                      )}

                      {/* KPI */}

                      {kpiNameAr && (
                        <Box
                          style={{
                            padding:
                              "7px 9px",
                            borderRadius: 9,
                            background:
                              "#f6fff8",
                            border:
                              "1px solid #d3f9d8",
                          }}
                        >
                          <Text
                            size="xs"
                            c="dimmed"
                          >
                            KPI
                          </Text>

                          <Text
                            size="xs"
                            fw={700}
                            mt={2}
                            lineClamp={2}
                          >
                            {kpiNameAr}
                          </Text>
                        </Box>
                      )}

                      {/* Status */}

                      {status && (
                        <Box
                          style={{
                            padding:
                              "7px 9px",
                            borderRadius: 9,
                            background:
                              selectedStatus?.bg ||
                              "#f8f9fa",
                            border:
                              `1px solid ${
                                selectedStatus?.bg ||
                                "#edf0f2"
                              }`,
                          }}
                        >
                          <Text
                            size="xs"
                            c="dimmed"
                          >
                            الحالة
                          </Text>

                          <Group
                            gap={6}
                            mt={2}
                          >
                            <Box
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius:
                                  "50%",
                                background:
                                  STATUS_DOT_COLORS[
                                    selectedStatus?.color
                                  ],
                              }}
                            />

                            <Text
                              size="xs"
                              fw={700}
                            >
                              {
                                selectedStatusLabel
                              }
                            </Text>
                          </Group>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </>
              )}
            </Stack>

            {/* =================================================
                SEARCH RESULTS
            ================================================= */}

            {hasExecuted &&
              !loadingMap && (
                <Box mt={18}>
                  <Divider mb={16} />

                  {/* =================================================
                      ERROR
                  ================================================= */}

                  {error ? (
                    <Paper
                      radius="lg"
                      p="sm"
                      style={{
                        border:
                          "1px solid rgba(250,82,82,0.25)",
                        background:
                          "#fff5f5",
                      }}
                    >
                      <Group
                        justify="space-between"
                        align="center"
                        wrap="nowrap"
                      >
                        <Group
                          gap={9}
                          wrap="nowrap"
                        >
                          <Box
                            style={{
                              width: 36,
                              height: 36,
                              minWidth: 36,
                              borderRadius: 10,
                              background:
                                "#ffe3e3",
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              color:
                                "#fa5252",
                            }}
                          >
                            <IconX
                              size={17}
                            />
                          </Box>

                          <Box>
                            <Text
                              size="sm"
                              fw={900}
                              c="red"
                            >
                              تعذر تحميل البيانات
                            </Text>

                            <Text
                              size="10px"
                              c="dimmed"
                              mt={2}
                            >
                              {error}
                            </Text>
                          </Box>
                        </Group>

                        <Badge
                          color="red"
                          variant="light"
                          size="sm"
                        >
                          خطأ
                        </Badge>
                      </Group>
                    </Paper>
                  ) : locations.length ===
                    0 ? (
                    /* =================================================
                       NO DATA
                    ================================================= */

                    <Paper
                      radius="lg"
                      p="sm"
                      style={{
                        border:
                          "1px solid rgba(134,142,150,0.18)",
                        background:
                          "#f8f9fa",
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
                            borderRadius: 11,
                            background:
                              "#e9ecef",
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            color:
                              "#868e96",
                          }}
                        >
                          <IconSearch
                            size={17}
                          />
                        </Box>

                        <Box
                          style={{
                            flex: 1,
                            minWidth: 0,
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
                            لا توجد نتائج حسب التصفية
                          </Text>
                        </Box>

                        <Badge
                          color="gray"
                          variant="light"
                          size="lg"
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
                          {dateFrom} ←{" "}
                          {dateTo}
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
                            {
                              selectedStatusLabel
                            }
                          </Badge>
                        )}
                      </Group>
                    </Paper>
                  ) : (
                    /* =================================================
                       HAS DATA
                    ================================================= */

                    <Paper
                      radius="lg"
                      p="sm"
                      style={{
                        border:
                          "1px solid rgba(64,192,87,0.22)",
                        background:
                          "#f8fff9",
                      }}
                    >
                      {/* RESULTS HEADER */}

                      <Group
                        justify="space-between"
                        align="center"
                        mb={10}
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
                              borderRadius: 11,
                              background:
                                "#e9f8ee",
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              color:
                                "#40c057",
                            }}
                          >
                            <IconMap
                              size={18}
                            />
                          </Box>

                          <Box>
                            <Text
                              size="sm"
                              fw={900}
                            >
                              نتائج البحث
                            </Text>

                            <Text
                              size="10px"
                              c="dimmed"
                              mt={2}
                            >
                              المواقع المطابقة للفلاتر
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
                        {/* Locations */}

                        <Box
                          style={{
                            background:
                              "#ffffff",
                            border:
                              "1px solid #edf0f2",
                            borderRadius: 9,
                            padding:
                              "8px 4px",
                            textAlign:
                              "center",
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

                        {/* District */}

                        <Box
                          style={{
                            background:
                              "#ffffff",
                            border:
                              "1px solid #edf0f2",
                            borderRadius: 9,
                            padding:
                              "8px 4px",
                            textAlign:
                              "center",
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

                        {/* Status */}

                        <Box
                          style={{
                            background:
                              "#ffffff",
                            border:
                              "1px solid #edf0f2",
                            borderRadius: 9,
                            padding:
                              "8px 4px",
                            textAlign:
                              "center",
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

                      {activeStatusCounts.length >
                        0 && (
                        <Box mt={10}>
                          <Group
                            justify="space-between"
                            mb={6}
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
                              {
                                activeStatusCounts.length
                              }{" "}
                              حالات
                            </Text>
                          </Group>

                          <Stack gap={4}>
                            {activeStatusCounts.map(
                              (item) => (
                                <Group
                                  key={
                                    item.value
                                  }
                                  justify="space-between"
                                  gap={6}
                                  wrap="nowrap"
                                  style={{
                                    minHeight: 28,
                                    padding:
                                      "4px 7px",
                                    borderRadius: 8,
                                    background:
                                      item.bg,
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
                                        width: 7,
                                        height: 7,
                                        minWidth: 7,
                                        borderRadius:
                                          "50%",
                                        background:
                                          STATUS_DOT_COLORS[
                                            item.color
                                          ],
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
                                    color={
                                      item.color
                                    }
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
                          </Stack>
                        </Box>
                      )}

                      {/* FILTER SUMMARY */}

                      <Group
                        gap={4}
                        mt={10}
                        wrap="wrap"
                      >
                        <Badge
                          size="xs"
                          variant="outline"
                          color="gray"
                        >
                          {dateFrom} ←{" "}
                          {dateTo}
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
                            {
                              selectedStatusLabel
                            }
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
                    </Paper>
                  )}
                </Box>
              )}
          </Box>

          {/* =================================================
              DRAWER FOOTER
          ================================================= */}

          <Box
            style={{
              padding: 14,
              borderTop:
                "1px solid #edf0f3",
              background: "#ffffff",
            }}
          >
            <Group
              grow
              gap={8}
              wrap="nowrap"
            >
              {/* Clear */}

              <Button
                variant="light"
                color="gray"
                size="sm"
                radius="md"
                leftSection={
                  <IconRefresh
                    size={16}
                  />
                }
                onClick={handleClear}
                disabled={loadingMap}
                styles={{
                  root: {
                    height: 40,
                  },
                }}
              >
                مسح
              </Button>

              {/* Search */}

              <Button
                size="sm"
                radius="md"
                color="blue"
                leftSection={
                  <IconSearch
                    size={17}
                  />
                }
                onClick={handleExecute}
                loading={loadingMap}
                styles={{
                  root: {
                    height: 40,
                    boxShadow:
                      "0 5px 15px rgba(34,139,230,0.20)",
                  },
                }}
              >
                بحث في الخريطة
              </Button>
            </Group>
          </Box>
        </Box>
      </Drawer>

      {/* =================================================
          MAP CONTROLS
      ================================================= */}

      <Box
        style={{
          position: "absolute",
          right: 18,
          bottom: 20,
          zIndex: 1900,
        }}
      >
        <Paper
          radius="xl"
          shadow="md"
          p={5}
          style={{
            background:
              "rgba(255,255,255,0.96)",
            border:
              "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <Group
            gap={3}
            style={{
              padding: 4,
              borderRadius: 999,
              background:
                "rgba(10, 15, 20, 0.72)",
              backdropFilter:
                "blur(8px)",
              WebkitBackdropFilter:
                "blur(8px)",
              border:
                "1px solid rgba(34, 139, 230, 0.25)",
              boxShadow:
                "0 6px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Map */}

            <ActionIcon
              variant="subtle"
              size={40}
              radius="xl"
              disabled={
                locations.length === 0
              }
              onClick={() =>
                setHeatmap(false)
              }
              title="عرض النقاط"
              styles={{
                root: {
                  background: !heatmap
                    ? "linear-gradient(110deg, #1864ab 0%, #228be6 40%, #15aabf 75%, #12b886 100%)"
                    : "transparent",

                  color: !heatmap
                    ? "#fff"
                    : "#8ed8e8",

                  border: "none",
                },
              }}
            >
              <IconMap
                size={19}
                stroke={2.2}
              />
            </ActionIcon>

            {/* Heatmap */}

            <ActionIcon
              variant="subtle"
              size={40}
              radius="xl"
              disabled={
                locations.length === 0
              }
              onClick={() =>
                setHeatmap(true)
              }
              title="الخريطة الحرارية"
              styles={{
                root: {
                  background: heatmap
                    ? "linear-gradient(110deg, #1864ab 0%, #228be6 40%, #15aabf 75%, #12b886 100%)"
                    : "transparent",

                  color: heatmap
                    ? "#fff"
                    : "#8ed8e8",

                  border: "none",
                },
              }}
            >
              <IconFlame
                size={19}
                stroke={2.2}
              />
            </ActionIcon>
          </Group>
        </Paper>
      </Box>

      {/* =================================================
          RESPONSIVE
      ================================================= */}

      <style jsx>{`
        @media (max-width: 600px) {
          .mantine-Drawer-content {
            width: 100% !important;
          }
        }
      `}</style>
    </Box>
  );
}

