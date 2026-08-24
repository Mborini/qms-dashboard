"use client";

import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";

import { IconTrash } from "@tabler/icons-react";

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

import { Text } from "@mantine/core";

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
// GEOJSON LAYERS
// =====================================================

const GEOJSON_LAYERS = [
  {
    id: "abu-nuseir",
    name: "أبو نصير",
    file: "/bins/aboNsair.geojson",
    color: "#e03131",
  },

  {
    id: "al-nasr",
    name: "النصر",
    file: "/bins/Al-Nasir.geojson",
    color: "#1971c2",
  },

  {
    id: "jubeiha",
    name: "الجبيهة",
    file: "/bins/Jubiha.geojson",
    color: "#2f9e44",
  },

  {
    id: "marka",
    name: "ماركا",
    file: "/bins/Marka.geojson",
    color: "#f08c00",
  },

  {
    id: "shafa-badran",
    name: "شفا بدران",
    file: "/bins/ShafaBadran.geojson",
    color: "#7048e8",
  },

  {
    id: "tareq",
    name: "طارق",
    file: "/bins/Tareq.geojson",
    color: "#d6336c",
  },

  {
    id: "tlaa-ali",
    name: "تلاع العلي وخلدا",
    file: "/bins/tlaaAli_Khalda.geojson",
    color: "#0ca678",
  },

  {
    id: "uhod",
    name: "أحد",
    file: "/bins/Uhod.geojson",
    color: "#495057",
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
  return encodeURIComponent(String(value ?? "")).replace(/'/g, "%27");
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
  if (text === null || text === undefined || text === "") {
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
  if (value === null || value === undefined || value === "") {
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
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const { valueStyle = "", border = true } = options;

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
  const config = STATUS_CONFIG[item?.status] || DEFAULT_STATUS;

  const latitude = Number(item?.latitude);

  const longitude = Number(item?.longitude);

  const hasCoordinates =
    Number.isFinite(latitude) && Number.isFinite(longitude);

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

  // ===================================================
  // ALL DETAILS
  // ===================================================

  const allDetails = [
    item?.id != null ? `رقم المخالفة: ${item.id}` : null,

    item?.kpiNameAr ? `KPI: ${item.kpiNameAr}` : null,

    item?.districtName ? `المنطقة: ${item.districtName}` : null,

    item?.blockName ? `الحي: ${item.blockName}` : null,

    `الحالة: ${config.label}`,

    item?.createdAt ? `التاريخ: ${formatDate(item.createdAt)}` : null,

    item?.username ? `المستخدم: ${item.username}` : null,

    hasCoordinates ? `الإحداثيات: ${coordinates}` : null,

    item?.description ? `الوصف: ${item.description}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const encodedAllDetails = encodePopupValue(allDetails);

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
Google Map            </a>

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
          item.id
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

  const config = STATUS_CONFIG[item?.status] || DEFAULT_STATUS;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
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
    const POPUP_OFFSET_Y = -250; // + يرفع | - ينزل

    const popup = L.popup({
      maxWidth: 430,
      minWidth: 330,
      closeButton: true,
      autoPan: false,
      className: "failure-details-popup",
    })
      .setLatLng([latitude, longitude])
      .setContent(createFailurePopup(item));

    popup.openOn(map);

    setTimeout(() => {
      map.panTo([latitude, longitude], {
        animate: true,
        duration: 1.2,
        easeLinearity: 0.08,
      });

      setTimeout(() => {
        map.panBy([0, POPUP_OFFSET_Y], {
          animate: true,
          duration: 1,
          easeLinearity: 0.08,
        });
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
            item?.id ?? `${item?.latitude}-${item?.longitude}-${index}`
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

    if (!Array.isArray(locations) || locations.length === 0) {
      return;
    }

    const points = [];

    for (const item of locations) {
      const latitude = Number(item.latitude);

      const longitude = Number(item.longitude);

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        points.push([latitude, longitude, 1]);
      }
    }

    if (points.length === 0) {
      return;
    }

    const heatLayer = L.heatLayer(points, {
      radius: 28,

      blur: 22,

      maxZoom: 17,

      minOpacity: 0.35,

      max: 1,
    });

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

function GeoJsonLayers({ activeLayers, setLoadedLayers }) {
  const map = useMap();

  const activeKey = useMemo(
    () =>
      GEOJSON_LAYERS.filter((layer) => activeLayers[layer.id])
        .map((layer) => layer.id)
        .join("|"),
    [activeLayers],
  );

  useEffect(() => {
    if (!map) {
      return;
    }

    let cancelled = false;

    const leafletLayers = [];

    async function loadLayers() {
      const activeConfigs = GEOJSON_LAYERS.filter(
        (layer) => activeLayers[layer.id],
      );

      for (const layerConfig of activeConfigs) {
        if (cancelled) {
          return;
        }

        try {
          // =====================================
          // CACHE
          // =====================================

          let data = geoJsonCache.get(layerConfig.file);

          // =====================================
          // FETCH
          // =====================================

          if (!data) {
            const response = await fetch(layerConfig.file);

            if (!response.ok) {
              throw new Error(`Failed to load ${layerConfig.file}`);
            }

            data = await response.json();

            geoJsonCache.set(layerConfig.file, data);
          }

          if (cancelled) {
            return;
          }

          // =====================================
          // CANVAS RENDERER
          // =====================================

          const renderer = L.canvas({
            padding: 0.5,
          });

          // =====================================
          // GEOJSON
          // =====================================

          const geoJsonLayer = L.geoJSON(data, {
            // =================================
            // POINT
            // =================================

            pointToLayer: (feature, latlng) => {
              return L.circleMarker(latlng, {
                renderer,

                radius: 4,

                color: layerConfig.color,

                weight: 1,

                opacity: 0.9,

                fillColor: layerConfig.color,

                fillOpacity: 0.85,

                interactive: false,
              });
            },

            // =================================
            // POLYGON
            // =================================

            style: () => ({
              renderer,

              color: layerConfig.color,

              weight: 2,

              opacity: 0.9,

              fillColor: layerConfig.color,

              fillOpacity: 0.04,

              smoothFactor: 1.5,
            }),

            // =================================
            // LINE
            // =================================

            onEachFeature: (feature, layer) => {
              layer.options.renderer = renderer;
            },
          });

          // =====================================
          // ADD
          // =====================================

          geoJsonLayer.addTo(map);

          leafletLayers.push(geoJsonLayer);

          // =====================================
          // LOADED
          // =====================================

          setLoadedLayers((prev) => ({
            ...prev,

            [layerConfig.id]: true,
          }));
        } catch (error) {
          console.error(`Error loading ${layerConfig.file}:`, error);
        }
      }
    }

    loadLayers();

    // ===========================================
    // CLEANUP
    // ===========================================

    return () => {
      cancelled = true;

      for (const layer of leafletLayers) {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      }
    };
  }, [map, activeKey]);

  return null;
}

// =====================================================
// LAYER CONTROLS
// =====================================================

function LayerControls({ activeLayers, setActiveLayers, loadedLayers }) {
  return (
    <div
      dir="rtl"
      style={{
        position: "absolute",

        top: 15,

        right: 20,

        zIndex: 99999,

        display: "flex",

        flexDirection: "column",

        gap: 5,

        width: 145,

        padding: 7,

        background: "rgba(255,255,255,0.97)",

        borderRadius: 10,

        boxShadow: "0 3px 12px rgba(0,0,0,0.20)",

        pointerEvents: "auto",

        maxHeight: "calc(100% - 40px)",

        overflowY: "auto",
      }}
    >
      <Text
        size="xs"
        fw={700}
        ta="right"
        c="dimmed"
        style={{
          padding: "2px 4px 4px",
        }}
      >
        مواقع الحاويات
      </Text>

      {GEOJSON_LAYERS.map((layer) => {
        const active = !!activeLayers[layer.id];

        const loaded = !!loadedLayers[layer.id];

        return (
          <button
            key={layer.id}
            type="button"
            onClick={() => {
              setActiveLayers((prev) => ({
                ...prev,

                [layer.id]: !prev[layer.id],
              }));
            }}
            style={{
              appearance: "none",

              border: `1.5px solid ${layer.color}`,

              background: active ? layer.color : "#ffffff",

              color: active ? "#ffffff" : layer.color,

              borderRadius: 7,

              padding: "6px 7px",

              width: "100%",

              minWidth: 0,

              cursor: "pointer",

              fontSize: 11,

              fontWeight: 700,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              gap: 5,

              boxShadow: active
                ? `0 2px 5px ${layer.color}45`
                : "0 1px 2px rgba(0,0,0,.10)",

              transition: "all 0.15s ease",

              whiteSpace: "nowrap",

              margin: 0,
            }}
          >
            <IconTrash
              size={14}
              stroke={2}
              color={active ? "#ffffff" : layer.color}
            />

            <span>{layer.name}</span>

            {active && loaded && (
              <span
                style={{
                  fontSize: 12,

                  fontWeight: 900,
                }}
              >
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// =====================================================
// MAIN MAP
// =====================================================

export default function OsmMap({ locations = [], heatmap = false }) {
  const [activeLayers, setActiveLayers] = useState({});

  const [loadedLayers, setLoadedLayers] = useState({});

  // ===================================================
  // VALID LOCATIONS
  // ===================================================

  const validLocations = useMemo(() => {
    if (!Array.isArray(locations)) {
      return [];
    }

    return locations.filter((item) => {
      const lat = Number(item?.latitude);

      const lng = Number(item?.longitude);

      return Number.isFinite(lat) && Number.isFinite(lng);
    });
  }, [locations]);

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
        center={[31.9539, 35.9106]}
        zoom={12}
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
          activeLayers={activeLayers}
          setLoadedLayers={setLoadedLayers}
        />

        {/* =================================================
            HEATMAP
        ================================================= */}

        {heatmap && <HeatmapLayer locations={validLocations} />}

        {/* =================================================
            FAILURES
        ================================================= */}

        {!heatmap && <FailureLayers locations={validLocations} />}
      </MapContainer>

      {/* =================================================
          LAYER BUTTONS
      ================================================= */}

      <LayerControls
        activeLayers={activeLayers}
        setActiveLayers={setActiveLayers}
        loadedLayers={loadedLayers}
      />
    </div>
  );
}
