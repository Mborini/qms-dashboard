"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMap,
} from "react-leaflet";

import { IconMap2, IconMenu2, IconMicrofrontends, IconTrash } from "@tabler/icons-react";

import { useEffect, useMemo, useState } from "react";

import { renderToStaticMarkup } from "react-dom/server";

import L from "leaflet";

import {
  FaTriangleExclamation,
  FaCircleCheck,
  FaClock,
  FaCircleXmark,
  FaHourglassHalf,
  FaMagnifyingGlass,
} from "react-icons/fa6";

import "leaflet/dist/leaflet.css";
import "leaflet.heat";

import {
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Text,
} from "@mantine/core";

// =====================================================
// STATUS CONFIG
// =====================================================

const STATUS_CONFIG = {
  PendingSpValidation: {
    label: "في انتظار القبول",
    color: "#212529",
    icon: FaHourglassHalf,
  },

  PendingSupervisorReview: {
    label: "قيد مراجعة AVTR",
    color: "#be4bdb",
    icon: FaMagnifyingGlass,
  },

  PendingFieldMonitorVerification: {
    label: "في انتظار التحقق الميداني",
    color: "#228be6",
    icon: FaMagnifyingGlass,
  },

  InProgress: {
    label: "قيد التنفيذ",
    color: "#f08c00",
    icon: FaClock,
  },

  ResolutionRejected: {
    label: "تم رفض الحل",
    color: "#fd7e14",
    icon: FaTriangleExclamation,
  },

  Resolved: {
    label: "تم الحل",
    color: "#2f9e44",
    icon: FaCircleCheck,
  },

  Rejected: {
    label: "مرفوض",
    color: "#e03131",
    icon: FaCircleXmark,
  },
};

// =====================================================
// DEFAULT STATUS
// =====================================================

const DEFAULT_STATUS = {
  label: "غير محدد",
  color: "#228be6",
  icon: FaTriangleExclamation,
};

// =====================================================
// CONTAINER LAYERS
// =====================================================

const CONTAINER_LAYERS = [
  {
    id: "container-abu-nuseir",
    name: "أبو نصير",
    file: "/bins/aboNsair.geojson",
    color: "#e03131",
  },

  {
    id: "container-al-nasr",
    name: "النصر",
    file: "/bins/Al-Nasir.geojson",
    color: "#1971c2",
  },

  {
    id: "container-jubeiha",
    name: "الجبيهة",
    file: "/bins/Jubiha.geojson",
    color: "#2f9e44",
  },

  {
    id: "container-marka",
    name: "ماركا",
    file: "/bins/Marka.geojson",
    color: "#f08c00",
  },

  {
    id: "container-shafa-badran",
    name: "شفا بدران",
    file: "/bins/ShafaBadran.geojson",
    color: "#7048e8",
  },

  {
    id: "container-tareq",
    name: "طارق",
    file: "/bins/Tareq.geojson",
    color: "#d6336c",
  },

  {
    id: "container-tlaa-ali",
    name: "تلاع العلي وخلدا",
    file: "/bins/tlaaAli_Khalda.geojson",
    color: "#0ca678",
  },

  {
    id: "container-uhod",
    name: "أحد",
    file: "/bins/Uhod.geojson",
    color: "#495057",
  },
];

// =====================================================
// GEOGRAPHICAL LAYERS
// =====================================================
//
// هنا تحط ملفات التقسيمات الجغرافية الجديدة.
// هذه الملفات مستقلة بالكامل عن ملفات الحاويات.
//
// مثال:
// /geography/districts.geojson
// /geography/blocks.geojson
// /geography/neighborhoods.geojson
//
// غيّر file حسب أسماء ملفاتك الفعلية.
// =====================================================

const GEOGRAPHICAL_LAYERS = [
  {
    id: "geo-Tariq",
    name: "احياء طارق",
    file: "/geography/Tariq.geojson",
    color: "#E03131",
  },
  {
    id: "geo-Aljubaiha",
    name: "احياء الجبيهة",
    file: "/geography/Aljubaiha.geojson",
    color: "#2F9E44",
  },
  {
    id: "geo-AbuNuseir",
    name: "احياء ابو نصير",
    file: "/geography/AbuNuseir.geojson",
    color: "#1971C2",
  },
  {
    id: "geo-ShafaBadran",
    name: "احياء شفا بدران",
    file: "/geography/ShafaBadran.geojson",
    color: "#7048E8",
  },
  {
    id: "geo-Uhod",
    name: "احياء احد",
    file: "/geography/Uhod.geojson",
    color: "#F08C00",
  },
  {
    id: "geo-Nasr",
    name: "احياء النصر",
    file: "/geography/Nasr.geojson",
    color: "#0CA678",
  },
  {
    id: "geo-Marka",
    name: "احياء ماركا",
    file: "/geography/Marka.geojson",
    color: "#D6336C",
  },
  {
    id: "geo-TlaaAli",
    name: "احياء تلاع العلي وخلدا",
    file: "/geography/TlaaAli_Khalda.geojson",
    color: "#15AABF",
  },
];

// =====================================================
// GEOJSON CACHE
// =====================================================

const geoJsonCache = new Map();

// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =====================================================
// SAFE VALUE FOR INLINE HTML EVENT
// =====================================================

function encodePopupValue(value) {
  return encodeURIComponent(String(value ?? "")).replace(
    /'/g,
    "%27",
  );
}

// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {
  if (!value) {
    return "";
  }

  try {
    return new Date(value).toLocaleString("ar-JO");
  } catch {
    return String(value);
  }
}

// =====================================================
// COPY TEXT
// =====================================================

function copyText(text, button) {
  if (
    text === null ||
    text === undefined ||
    text === ""
  ) {
    return;
  }

  const originalText = button?.innerHTML;

  const success = () => {
    if (!button) {
      return;
    }

    button.innerHTML = "✓ تم النسخ";

    button.style.opacity = "0.75";

    setTimeout(() => {
      button.innerHTML = originalText;

      button.style.opacity = "1";
    }, 1500);
  };

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof window !== "undefined" &&
    window.isSecureContext
  ) {
    navigator.clipboard
      .writeText(String(text))
      .then(success)
      .catch(() => {
        fallbackCopy(text, success);
      });

    return;
  }

  fallbackCopy(text, success);
}

// =====================================================
// FALLBACK COPY
// =====================================================

function fallbackCopy(text, callback) {
  if (typeof document === "undefined") {
    return;
  }

  const textarea = document.createElement("textarea");

  textarea.value = String(text);

  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();

  try {
    document.execCommand("copy");

    callback?.();
  } catch (error) {
    console.error("Copy failed:", error);
  }

  document.body.removeChild(textarea);
}

// =====================================================
// EXPOSE COPY FUNCTION
// =====================================================

if (typeof window !== "undefined") {
  window.copyFailureText = copyText;
}

// =====================================================
// COPY BUTTON HTML
// =====================================================

function createCopyButton({
  value,
  displayValue,
  style = "",
  title = "اضغط للنسخ",
}) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const encodedValue = encodePopupValue(value);

  return `
    <button
      type="button"
      onclick="
        window.copyFailureText(
          decodeURIComponent('${encodedValue}'),
          this
        )
      "
      title="${escapeHtml(title)}"
      style="
        border: 0;
        background: transparent;

        color: #343a40;

        font-size: 12px;
        font-weight: 700;

        cursor: pointer;

        padding: 3px 5px;

        text-align: right;

        font-family:
          Arial,
          Tahoma,
          sans-serif;

        transition:
          opacity 0.15s ease;

        ${style}
      "
    >
      ${escapeHtml(displayValue ?? value)}
    </button>
  `;
}

// =====================================================
// INFO ROW
// =====================================================

function createInfoRow(label, value, options = {}) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const {
    valueStyle = "",
    border = true,
  } = options;

  return `
    <div
      style="
        display: flex;

        align-items: center;

        justify-content:
          space-between;

        gap: 12px;

        padding:
          8px 10px;

        ${
          border
            ? `
              border-bottom:
                1px solid #f1f3f5;
            `
            : ""
        }
      "
    >

      <span
        style="
          color: #868e96;

          font-size: 11px;

          font-weight: 700;

          flex-shrink: 0;
        "
      >
        ${escapeHtml(label)}
      </span>

      ${createCopyButton({
        value,
        displayValue: value,
        style: `
          ${valueStyle}

          max-width: 68%;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;
        `,
      })}

    </div>
  `;
}

// =====================================================
// FAILURE POPUP
// =====================================================

function createFailurePopup(item) {
  const config =
    STATUS_CONFIG[item?.status] ||
    DEFAULT_STATUS;

  const latitude = Number(item?.latitude);

  const longitude = Number(item?.longitude);

  const hasCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const coordinates = hasCoordinates
    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    : "";

  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : "";

  const statusIcon = config.icon
    ? renderToStaticMarkup(
        config.icon({
          size: 17,
        }),
      )
    : "";

  const allDetails = [
    item?.id != null
      ? `رقم المخالفة: ${item.id}`
      : null,

    item?.kpiNameAr
      ? `KPI: ${item.kpiNameAr}`
      : null,

    item?.districtName
      ? `المنطقة: ${item.districtName}`
      : null,

    item?.blockName
      ? `الحي: ${item.blockName}`
      : null,

    `الحالة: ${config.label}`,

    item?.createdAt
      ? `التاريخ: ${formatDate(item.createdAt)}`
      : null,

    item?.username
      ? `المستخدم: ${item.username}`
      : null,

    hasCoordinates
      ? `الإحداثيات: ${coordinates}`
      : null,

    item?.description
      ? `الوصف: ${item.description}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const encodedAllDetails =
    encodePopupValue(allDetails);

  return `
<div
  dir="rtl"
  style="
    font-family: Arial, Tahoma, sans-serif;
    width: 100%;
    min-width: 270px;
    max-width: 330px;
    color: #212529;
    background: #ffffff;
    overflow: hidden;
    border-radius: 14px;
  "
>

  <!-- ================= HEADER ================= -->

  <div
    style="
      padding: 11px 12px;
      background:
        linear-gradient(
          135deg,
          ${config.color},
          ${config.color}dd
        );
      color: #ffffff;
    "
  >

    <div
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 7px;
      "
    >

      <div
        style="
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        "
      >

        <div
          style="
            width: 32px;
            height: 32px;
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.16);
            border: 1px solid rgba(255,255,255,0.22);
            flex-shrink: 0;
          "
        >
          ${statusIcon}
        </div>

        <div
          style="
            min-width: 0;
          "
        >

          <div
            style="
              font-size: 13px;
              font-weight: 800;
              line-height: 1.3;
            "
          >
            تفاصيل المخالفة
          </div>

          ${
            item?.id != null
              ? `
                <div
                  style="
                    margin-top: 2px;
                    font-size: 9px;
                    opacity: 0.8;
                  "
                >
                  #${escapeHtml(item.id)}
                </div>
              `
              : ""
          }

        </div>

      </div>

      <div
        style="
          padding: 4px 7px;
          border-radius: 14px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.2);
          font-size: 9px;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        "
      >
        ${escapeHtml(config.label)}
      </div>

    </div>

  </div>

  <!-- ================= CONTENT ================= -->

  <div
    style="
      padding: 10px;
      background: #ffffff;
    "
  >

    <!-- ================= KPI ================= -->

    ${
      item?.kpiNameAr
        ? `
          <div
            style="
              padding: 8px 9px;
              border: 1px solid #edf0f2;
              border-radius: 9px;
              background: #f8f9fa;
              margin-bottom: 6px;
            "
          >

            <div
              style="
                font-size: 9px;
                color: #868e96;
                font-weight: 700;
                margin-bottom: 2px;
              "
            >
              KPI
            </div>

            ${createCopyButton({
              value: item.kpiNameAr,
              displayValue: item.kpiNameAr,
              style: `
                width: 100%;
                padding: 0;
                font-size: 11px;
                line-height: 1.45;
                font-weight: 700;
                text-align: right;
              `,
            })}

          </div>
        `
        : ""
    }

    <!-- ================= BASIC INFO ================= -->

    <div
      style="
        display: flex;
        flex-direction: column;
      "
    >

      ${
        item?.id != null
          ? createInfoRow(
              "رقم المخالفة",
              String(item.id),
            )
          : ""
      }

      ${
        item?.districtName
          ? createInfoRow(
              "المنطقة",
              item.districtName,
            )
          : ""
      }

      ${
        item?.blockName
          ? createInfoRow(
              "الحي",
              item.blockName,
            )
          : ""
      }

      ${
        item?.username
          ? createInfoRow(
              "المستخدم",
              item.username,
            )
          : ""
      }

      ${
        item?.createdAt
          ? createInfoRow(
              "التاريخ",
              formatDate(item.createdAt),
              {
                valueStyle: `
                  font-size: 10px;
                `,
              },
            )
          : ""
      }

      <!-- STATUS -->

      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 6px 8px;
          border-bottom: 1px solid #f1f3f5;
        "
      >

        <span
          style="
            color: #868e96;
            font-size: 10px;
            font-weight: 700;
          "
        >
          الحالة
        </span>

        <span
          style="
            color: ${config.color};
            font-size: 10px;
            font-weight: 800;
          "
        >
          ${escapeHtml(config.label)}
        </span>

      </div>

    </div>

    <!-- ================= COORDINATES ================= -->

    ${
      hasCoordinates
        ? `
          <div
            style="
              margin-top: 9px;
              padding: 9px;
              border-radius: 10px;
              background:
                linear-gradient(
                  135deg,
                  #f8f9fa,
                  #f1f3f5
                );
              border: 1px solid #e9ecef;
            "
          >

            <div
              style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 6px;
                gap: 6px;
              "
            >

              <div
                style="
                  display: flex;
                  align-items: center;
                  gap: 5px;
                  font-size: 10px;
                  font-weight: 800;
                  color: #343a40;
                "
              >
                📍 الإحداثيات
              </div>

              <span
                style="
                  font-size: 8px;
                  color: #868e96;
                  direction: ltr;
                "
              >
                Lat / Lng
              </span>

            </div>

            ${createCopyButton({
              value: coordinates,
              displayValue: coordinates,
              style: `
                width: 100%;
                display: block;
                border: 1px solid #dee2e6;
                background: #ffffff;
                border-radius: 7px;
                padding: 7px 8px;
                color: #212529;
                font-family: Consolas, monospace;
                font-size: 11px;
                font-weight: 700;
                text-align: center;
                direction: ltr;
                box-sizing: border-box;
              `,
              title: "اضغط لنسخ الإحداثيات",
            })}

            <a
              href="${googleMapsUrl}"
              target="_blank"
              rel="noopener noreferrer"
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
                margin-top: 6px;
                padding: 7px;
                border-radius: 7px;
                background: ${config.color};
                color: #ffffff;
                text-decoration: none;
                font-size: 10px;
                font-weight: 800;
              "
            >
              Google Map
            </a>

          </div>
        `
        : ""
    }

    <!-- ================= DESCRIPTION ================= -->

    ${
      item?.description
        ? `
          <div
            style="
              margin-top: 9px;
              padding: 8px 9px;
              border-radius: 9px;
              background: #ffffff;
              border: 1px solid #e9ecef;
            "
          >

            <div
              style="
                font-size: 9px;
                color: #868e96;
                font-weight: 800;
                margin-bottom: 3px;
              "
            >
              الوصف
            </div>

            ${createCopyButton({
              value: item.description,
              displayValue: item.description,
              style: `
                width: 100%;
                padding: 0;
                color: #343a40;
                font-size: 10px;
                line-height: 1.55;
                font-weight: 400;
                white-space: normal;
                word-break: break-word;
                text-align: right;
              `,
              title: "اضغط لنسخ الوصف",
            })}

          </div>
        `
        : ""
    }

    <!-- ================= COPY ALL ================= -->

    <button
      type="button"
      onclick="
        window.copyFailureText(
          decodeURIComponent(
            '${encodedAllDetails}'
          ),
          this
        )
      "
      style="
        width: 100%;
        margin-top: 9px;
        padding: 8px 10px;
        border: 0;
        border-radius: 8px;
        background: #f1f3f5;
        color: #495057;
        cursor: pointer;
        font-size: 10px;
        font-weight: 800;
        font-family: Arial, Tahoma, sans-serif;
        transition: all 0.15s ease;
      "
    >
      📋 نسخ التفاصيل
    </button>

    ${
      item?.id != null
        ? `
          <a
            href="https://provider.avtr.jo/failures/${encodeURIComponent(
              item.id,
            )}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              width: 100%;
              margin-top: 10px;
              padding: 8px 10px;
              border-radius: 8px;
              background: #40C057;
              color: #ffffff;
              text-decoration: none;
              font-size: 10px;
              font-weight: 800;
              font-family: Arial, Tahoma, sans-serif;
              box-sizing: border-box;
            "
          >
            عرض المخالفة في QMS
          </a>
        `
        : ""
    }

  </div>

</div>
`;
}

// =====================================================
// FAILURE MARKER
// =====================================================

function FailureMarker({ item }) {
  const map = useMap();

  const latitude = Number(item?.latitude);

  const longitude = Number(item?.longitude);

  const config =
    STATUS_CONFIG[item?.status] ||
    DEFAULT_STATUS;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return (
    <CircleMarker
      center={[latitude, longitude]}
      radius={7}
      pathOptions={{
        color: "#ffffff",
        weight: 2,
        fillColor: config.color,
        fillOpacity: 0.95,
      }}
      eventHandlers={{
        click: () => {
          const POPUP_OFFSET_Y = -250;

          const popup = L.popup({
            maxWidth: 430,
            minWidth: 330,
            closeButton: true,
            autoPan: false,
            className: "failure-details-popup",
          })
            .setLatLng([
              latitude,
              longitude,
            ])
            .setContent(
              createFailurePopup(item),
            );

          popup.openOn(map);

          setTimeout(() => {
            map.panTo(
              [latitude, longitude],
              {
                animate: true,
                duration: 1.2,
                easeLinearity: 0.08,
              },
            );

            setTimeout(() => {
              map.panBy(
                [0, POPUP_OFFSET_Y],
                {
                  animate: true,
                  duration: 1,
                  easeLinearity: 0.08,
                },
              );
            }, 300);
          }, 100);
        },
      }}
    />
  );
}

// =====================================================
// FAILURE LAYERS
// =====================================================

function FailureLayers({ locations }) {
  return (
    <>
      {locations.map((item, index) => (
        <FailureMarker
          key={`failure-${
            item?.id ??
            `${item?.latitude}-${item?.longitude}-${index}`
          }`}
          item={item}
        />
      ))}
    </>
  );
}

// =====================================================
// HEATMAP
// =====================================================

function HeatmapLayer({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    if (
      !Array.isArray(locations) ||
      locations.length === 0
    ) {
      return;
    }

    const points = [];

    for (const item of locations) {
      const latitude = Number(
        item.latitude,
      );

      const longitude = Number(
        item.longitude,
      );

      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
      ) {
        points.push([
          latitude,
          longitude,
          1,
        ]);
      }
    }

    if (points.length === 0) {
      return;
    }

    const heatLayer = L.heatLayer(
      points,
      {
        radius: 28,
        blur: 22,
        maxZoom: 17,
        minOpacity: 0.35,
        max: 1,
      },
    );

    heatLayer.addTo(map);

    return () => {
      if (map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, locations]);

  return null;
}

// =====================================================
// GEOJSON LAYERS
// =====================================================
//
// مهم:
// هذا المكون الآن لا يعرف إذا كانت البيانات
// حاويات أو تقسيمات جغرافية.
//
// فقط يأخذ layers.
// =====================================================
function GeoJsonLayers({
  layers,
  activeLayers,
  setLoadedLayers,
  setFailedLayers,
}) {
  const map = useMap();

  const activeKey = useMemo(
    () =>
      layers
        .filter((layer) => activeLayers[layer.id])
        .map((layer) => layer.id)
        .join("|"),
    [layers, activeLayers],
  );

  useEffect(() => {
    if (!map) {
      return;
    }

    let cancelled = false;

    const leafletLayers = [];

    // =====================================================
    // COOL COLORS
    // =====================================================

    const COOL_COLORS = [
      "#4dabf7",
      "#339af0",
      "#228be6",
      "#15aabf",
      "#1098ad",
      "#0ca678",
      "#12b886",
      "#20c997",
      "#5c7cfa",
      "#748ffc",
      "#7950f2",
      "#9775fa",
      "#66d9e8",
      "#3bc9db",
      "#74c0fc",
      "#91a7ff",
      "#a5d8ff",
      "#99e9f2",
      "#96f2d7",
      "#b2f2bb",
    ];

    // =====================================================
    // GET FEATURE NAME
    // =====================================================

    function getFeatureName(feature) {
      const properties =
        feature?.properties || {};

      // عدّل ترتيب الأولوية حسب بياناتك
      const possibleNames = [
        "name",
        "Name",
        "NAME",
        "name_ar",
        "Name_Ar",
        "NAME_AR",
        "اسم",
        "اسم الحي",
        "الحي",
        "neighborhood",
        "Neighborhood",
        "district",
        "District",
      ];

      for (const key of possibleNames) {
        const value = properties[key];

        if (
          value !== null &&
          value !== undefined &&
          String(value).trim() !== ""
        ) {
          return String(value).trim();
        }
      }

      return "غير محدد";
    }

    // =====================================================
    // LOAD LAYERS
    // =====================================================

    async function loadLayers() {
      const activeConfigs =
        layers.filter(
          (layer) =>
            activeLayers[layer.id],
        );

      for (const layerConfig of activeConfigs) {
        if (cancelled) {
          return;
        }

        try {
          // =================================================
          // CACHE
          // =================================================

          let data = geoJsonCache.get(
            layerConfig.file,
          );

          // =================================================
          // FETCH
          // =================================================

          if (!data) {
            const response =
              await fetch(
                layerConfig.file,
              );

            if (!response.ok) {
  setFailedLayers((prev) => ({
    ...prev,
    [layerConfig.id]: true,
  }));

  continue;
}

            data =
              await response.json();

            geoJsonCache.set(
              layerConfig.file,
              data,
            );
          }

          if (cancelled) {
            return;
          }

          // =================================================
          // CANVAS
          // =================================================

          const renderer = L.canvas({
            padding: 0.5,
          });

          // =================================================
          // GEOJSON
          // =================================================

          const geoJsonLayer =
            L.geoJSON(data, {
              // =============================================
              // POINT
              // =============================================

              pointToLayer: (
                feature,
                latlng,
              ) => {
                return L.circleMarker(
                  latlng,
                  {
                    renderer,

                    radius: 4,

                    color:
                      layerConfig.color,

                    weight: 1,

                    opacity: 0.9,

                    fillColor:
                      layerConfig.color,

                    fillOpacity: 0.85,

                    interactive: false,
                  },
                );
              },

              // =============================================
              // POLYGON
              // =============================================

             style: () => {
  const color = layerConfig.color;

  return {
    renderer,

    color,

    weight: 2,

    opacity: 0.9,

    fillColor: color,

    fillOpacity: 0.14,

    smoothFactor: 1.5,

    interactive: true,
  };
},

              // =============================================
              // FEATURE EVENTS
              // =============================================

              onEachFeature: (
                feature,
                layer,
              ) => {
                layer.options.renderer =
                  renderer;

                const name =
                  getFeatureName(
                    feature,
                  );

                // ===========================================
                // PER FEATURE COLOR
                // ===========================================

              // ===========================================
// LAYER COLOR
// ===========================================
//
// الحاويات:
// كل Features داخل المنطقة نفس اللون.
//
// التقسيمات الجغرافية:
// كل Feature يمكن أن يكون له لون مختلف.
//

const isContainerLayer =
  layerConfig.id.startsWith(
    "container-",
  );

const color = isContainerLayer
  ? layerConfig.color
  : COOL_COLORS[
      Math.abs(
        JSON.stringify(
          feature?.properties || {},
        ).length,
      ) % COOL_COLORS.length
    ];

const baseStyle = {
  color,
  fillColor: color,
  fillOpacity: 0.14,
  weight: 2,
  opacity: 0.9,
};

layer.setStyle(baseStyle);

                // ===========================================
                // PERMANENT LABEL
                // ===========================================
// ===========================================
// PERMANENT LABEL
// تظهر فقط للتقسيمات الجغرافية
// ===========================================

if (
  layerConfig.id.startsWith("geo-")
) {
  layer.bindTooltip(
    `
      <div
        dir="rtl"
        style="
          font-family:
            Arial,
            Tahoma,
            sans-serif;

          font-size: 10px;

          font-weight: 700;

          color: #343a40;

          background: rgba(
            255,
            255,
            255,
            0.72
          );

          white-space: nowrap;

          backdrop-filter: blur(3px);

          -webkit-backdrop-filter: blur(3px);
        "
      >
        ${escapeHtml(name)}
      </div>
    `,
    {
      permanent: true,
      direction: "center",
      sticky: false,
      opacity: 1,
      className:
        "geo-feature-label",
      offset: [0, 0],
    },
  );
}

                // ===========================================
                // HOVER
                // ===========================================
layer.on({
  mouseover: () => {
    layer.bringToFront();

    layer.setStyle({
      ...baseStyle,
      weight: 4,
      color: "#212529",
      fillOpacity: 0.30,
    });
  },

  mouseout: () => {
    layer.setStyle(baseStyle);
  },

  click: () => {
    console.log(
      "GeoJSON Feature:",
      feature,
    );

    console.log(
      "Feature Name:",
      name,
    );
  },
});
              },
            });

          // =================================================
          // ADD
          // =================================================

        geoJsonLayer.addTo(map);

leafletLayers.push(geoJsonLayer);
// نخلي الـ GeoJSON layers قابلة للترتيب
geoJsonLayer.eachLayer((featureLayer) => {
  if (featureLayer.setStyle) {
    featureLayer.setStyle({
      ...featureLayer.options,
      pane: "overlayPane",
    });
  }
});
          // =================================================
          // LOADED
          // =================================================

          setLoadedLayers(
            (prev) => ({
              ...prev,

              [layerConfig.id]: true,
            }),
          );
        } catch {
  setFailedLayers((prev) => ({
    ...prev,
    [layerConfig.id]: true,
  }));
}
      }
    }

    loadLayers();

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      cancelled = true;

      for (const layer of leafletLayers) {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      }
    };
  }, [
    map,
    layers,
    activeKey,
    activeLayers,
    setLoadedLayers,
  ]);

  return null;
}

// =====================================================
// LAYER CONTROLS
// =====================================================

function LayerControls({
  activeLayers,
  setActiveLayers,
  loadedLayers,
  failedLayers,
}) {
  const [opened, setOpened] =
    useState(false);

  const [view, setView] =
    useState("main");

  // ===================================================
  // ACTIVE COUNT
  // ===================================================

  const activeCount = Object.values(
    activeLayers,
  ).filter(Boolean).length;

  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const closeModal = () => {
    setOpened(false);

    setTimeout(() => {
      setView("main");
    }, 200);
  };

  // ===================================================
  // LAYER LIST
  // ===================================================

  const renderLayerList = (
    layers,
  ) => {
    return (
      <Stack gap={6} mt={5}>
        {layers.map((layer) => {
          const active =
            !!activeLayers[layer.id];

          const loaded =
            !!loadedLayers[layer.id];

          return (
            <div
              key={layer.id}
              style={{
                border: `1px solid ${
                  active
                    ? layer.color
                    : "#e9ecef"
                }`,

                background: active
                  ? `${layer.color}0d`
                  : "#ffffff",

                borderRadius: 10,

                padding:
                  "9px 10px",

                transition:
                  "all 0.15s ease",
              }}
            >
              <Checkbox
                checked={active}
                onChange={() => {
                  setActiveLayers(
                    (prev) => ({
                      ...prev,

                      [layer.id]:
                        !prev[
                          layer.id
                        ],
                    }),
                  );
                }}
                label={
                  <Group
                    gap={7}
                    wrap="nowrap"
                  >
                    {layers === GEOGRAPHICAL_LAYERS ? (
  <IconMap2
    size={16}
    stroke={2}
    color={layer.color}
  />
) : (
  <IconTrash
    size={16}
    stroke={2}
    color={layer.color}
  />
)}

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {layer.name}
                    </span>

                    {active && failedLayers[layer.id] ? (
  <span
    style={{
      color: "#f08c00",
      fontSize: 10,
      fontWeight: 800,
      whiteSpace: "nowrap",
    }}
  >
    ⚠ غير متوفر
  </span>
) : (
  active &&
  loaded && (
    <span
      style={{
        color: layer.color,
        fontSize: 13,
        fontWeight: 900,
      }}
    >
      ✓
    </span>
  )
)}
                  </Group>
                }
                styles={{
                  body: {
                    alignItems:
                      "center",
                  },

                  label: {
                    width: "100%",
                    cursor:
                      "pointer",
                  },

                  input: {
                    cursor:
                      "pointer",
                  },
                }}
              />
            </div>
          );
        })}
      </Stack>
    );
  };

  // ===================================================
  // MAIN VIEW
  // ===================================================

  const renderMainView = () => {
    return (
      <Stack gap="sm">
        <Text
          size="xs"
          c="dimmed"
          fw={600}
        >
          اختر نوع الطبقات التي تريد
          التحكم بها
        </Text>

        {/* =================================================
            CONTAINERS
        ================================================= */}

        <button
          type="button"
          onClick={() =>
            setView("containers")
          }
          style={{
            width: "100%",
            border:
              "1px solid #e9ecef",
            borderRadius: 14,
            background: "#ffffff",
            padding: "16px",
            cursor: "pointer",
            textAlign: "right",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            dir="rtl"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background:
                  "#e7f5ff",
                color: "#228be6",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontSize: 21,
                flexShrink: 0,
              }}
            >
              <IconTrash size={21} stroke={2} />
            </div>

            <div
              style={{
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#212529",
                }}
              >
                مواقع الحاويات
              </div>

              <div
                style={{
                  marginTop: 3,
                  fontSize: 10,
                  color: "#868e96",
                }}
              >استعراض مواقع الحاويات على الخريطة
              </div>
            </div>

            <span
              style={{
                fontSize: 20,
                color: "#adb5bd",
              }}
            >
              ‹
            </span>
          </div>
        </button>

        {/* =================================================
            GEOGRAPHY
        ================================================= */}

        <button
          type="button"
          onClick={() =>
            setView("geography")
          }
          style={{
            width: "100%",
            border:
              "1px solid #e9ecef",
            borderRadius: 14,
            background: "#ffffff",
            padding: "16px",
            cursor: "pointer",
            textAlign: "right",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            dir="rtl"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background:
                  "#f3f0ff",
                color: "#7048e8",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontSize: 21,
                flexShrink: 0,
              }}
            >
              <IconMap2 size={21} stroke={2} />
            </div>

            <div
              style={{
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#212529",
                }}
              >
                التقسيمات الجغرافية
              </div>

              <div
                style={{
                  marginTop: 3,
                  fontSize: 10,
                  color: "#868e96",
                }}
              >
استعراض الحدود الجغرافية لأحياء المناطق              </div>
            </div>

            <span
              style={{
                fontSize: 20,
                color: "#adb5bd",
              }}
            >
              ‹
            </span>
          </div>
        </button>
      </Stack>
    );
  };

  // ===================================================
  // CONTAINER VIEW
  // ===================================================

  const renderContainersView =
    () => {
      return (
        <Stack gap="xs">
          

         

          <Text
            size="xs"
            c="dimmed"
          >
            اختر المناطق التي تريد
            إظهار مواقع الحاويات
            فيها
          </Text>

          {renderLayerList(
            CONTAINER_LAYERS,
          )}
        </Stack>
      );
    };

  // ===================================================
  // GEOGRAPHY VIEW
  // ===================================================

  const renderGeographyView =
    () => {
      return (
        <Stack gap="xs">
          

          

          <Text
            size="xs"
            c="dimmed"
          >
            اختر التقسيمات الجغرافية
            التي تريد إظهارها على
            الخريطة
          </Text>

          {renderLayerList(
            GEOGRAPHICAL_LAYERS,
          )}
        </Stack>
      );
    };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      {/* =================================================
          BURGER BUTTON
      ================================================= */}

      <button
        type="button"
        onClick={() => {
          setOpened(true);
          setView("main");
        }}
        title={
          view === "main"
            ? "خيارات الخريطة"
            : view === "containers"
              ? "مواقع الحاويات"
              : "التقسيمات الجغرافية"
        }
        aria-label="خيارات الخريطة"
        style={{
          position: "absolute",

          top: 15,
          right: 20,

          zIndex: 99999,

          width: 42,
          height: 42,

          border:
            "1px solid rgba(0,0,0,0.12)",

          borderRadius: 10,

          background:
            "rgba(255,255,255,0.96)",

          color: "#343a40",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          cursor: "pointer",

          boxShadow:
            "0 3px 12px rgba(0,0,0,0.20)",

          transition:
            "all 0.15s ease",

          padding: 0,
        }}
      >
        <IconMicrofrontends
          size={22}
          stroke={2}
        />

        {activeCount > 0 && (
          <span
            style={{
              position: "absolute",

              top: -5,
              right: -5,

              minWidth: 18,
              height: 18,

              padding: "0 4px",

              borderRadius: 20,

              background: "#228be6",

              color: "#ffffff",

              fontSize: 10,
              fontWeight: 800,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              border:
                "2px solid #ffffff",
            }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* =================================================
          MODAL
      ================================================= */}

      <Modal
        opened={opened}
        onClose={closeModal}
        title={
          view === "main"
            ? "خيارات الخريطة"
            : view === "containers"
              ? "مواقع الحاويات"
              : "التقسيمات الجغرافية"
        }
        centered
        dir="rtl"
        size="sm"
        overlayProps={{
          backgroundOpacity: 0.45,
          blur: 2,
        }}
      >
        {view === "main" &&
          renderMainView()}

        {view === "containers" &&
          renderContainersView()}

        {view === "geography" &&
          renderGeographyView()}

       {view !== "main" && (
 <Group
  justify="space-between"
  mt="md"
  dir="rtl"
>
  {/* إلغاء الكل + رجوع */}
  <Group gap="xs">
    <Button
      variant="light"
      color="red"
      size="xs"
      onClick={() => {
        setActiveLayers((prev) => {
          const next = {
            ...prev,
          };

          const currentLayers =
            view === "containers"
              ? CONTAINER_LAYERS
              : GEOGRAPHICAL_LAYERS;

          for (const layer of currentLayers) {
            delete next[layer.id];
          }

          return next;
        });
      }}
    >
      إلغاء الكل
    </Button>

    <Button
      variant="light"
      size="xs"
      onClick={() => setView("main")}
    >
      ← رجوع
    </Button>
  </Group>

  {/* تم لحاله */}
  <Button
    size="xs"
    onClick={closeModal}
  >
    تم
  </Button>
</Group>
        )}
      </Modal>
    </>
  );
}

// =====================================================
// MAIN MAP
// =====================================================

export default function OsmMap({
  locations = [],
  heatmap = false,
}) {
  const [activeLayers, setActiveLayers] =
    useState({});

const [loadedLayers, setLoadedLayers] =
  useState({});

const [failedLayers, setFailedLayers] =
  useState({});

  // ===================================================
  // VALID LOCATIONS
  // ===================================================

  const validLocations = useMemo(() => {
    if (!Array.isArray(locations)) {
      return [];
    }

    return locations.filter(
      (item) => {
        const lat = Number(
          item?.latitude,
        );

        const lng = Number(
          item?.longitude,
        );

        return (
          Number.isFinite(lat) &&
          Number.isFinite(lng)
        );
      },
    );
  }, [locations]);

  // ===================================================
  // ACTIVE CONTAINER LAYERS
  // ===================================================

  const activeContainerLayers =
    useMemo(
      () =>
        CONTAINER_LAYERS.filter(
          (layer) =>
            activeLayers[layer.id],
        ),
      [activeLayers],
    );

  // ===================================================
  // ACTIVE GEOGRAPHICAL LAYERS
  // ===================================================

  const activeGeographicalLayers =
    useMemo(
      () =>
        GEOGRAPHICAL_LAYERS.filter(
          (layer) =>
            activeLayers[layer.id],
        ),
      [activeLayers],
    );

  // ===================================================
  // ALL ACTIVE GEOJSON LAYERS
  // ===================================================

 const activeGeoJsonLayers =
  useMemo(
    () => [
      ...activeGeographicalLayers,
      ...activeContainerLayers,
    ],
    [
      activeContainerLayers,
      activeGeographicalLayers,
    ],
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      {/* =================================================
          MAP
      ================================================= */}

      <MapContainer
        center={[
          31.9539,
          35.9106,
        ]}
        zoom={12}
        zoomControl={false}
        preferCanvas={true}
        zoomAnimation={true}
        fadeAnimation={true}
        markerZoomAnimation={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      >
        {/* =================================================
            OPEN STREET MAP
        ================================================= */}

        <TileLayer
          attribution="
            &copy; OpenStreetMap contributors
          "
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          updateWhenZooming={false}
          updateWhenIdle={true}
          keepBuffer={2}
        />

        {/* =================================================
            GEOJSON
        ================================================= */}

       <GeoJsonLayers
  layers={activeGeoJsonLayers}
  activeLayers={activeLayers}
  setLoadedLayers={
    setLoadedLayers
  }
  setFailedLayers={
    setFailedLayers
  }
/>

        {/* =================================================
            HEATMAP
        ================================================= */}

        {heatmap && (
          <HeatmapLayer
            locations={
              validLocations
            }
          />
        )}

        {/* =================================================
            FAILURES
        ================================================= */}

        {!heatmap && (
          <FailureLayers
            locations={
              validLocations
            }
          />
        )}
      </MapContainer>

      {/* =================================================
          LAYER CONTROLS
      ================================================= */}

      <LayerControls
  activeLayers={activeLayers}
  setActiveLayers={
    setActiveLayers
  }
  loadedLayers={loadedLayers}
  failedLayers={failedLayers}
/>
    </div>
  );
}