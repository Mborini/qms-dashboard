"use client";

import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  mapRefExternal: MutableRefObject<L.Map | null>;
  manualPicking: boolean;
  onConfirmLocation: (lat: number, lng: number) => void;
}

export function MapBoxView({
  mapRefExternal,
  manualPicking,
  onConfirmLocation,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedMarkerRef =
    useRef<L.Marker | null>(null);

  const manualPickingRef =
    useRef(manualPicking);

  const [selected, setSelected] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // =========================================================
  // متابعة manualPicking
  // =========================================================

  useEffect(() => {
    manualPickingRef.current = manualPicking;
  }, [manualPicking]);

  // =========================================================
  // إنشاء الخريطة
  // =========================================================

  useEffect(() => {
    if (
      !containerRef.current ||
      mapRefExternal.current
    ) {
      return;
    }

    // =======================================================
    // إنشاء Leaflet Map
    // =======================================================

    const map = L.map(
      containerRef.current,
      {
        center: [31.95, 35.91],
        zoom: 13,
        zoomControl: true,
      }
    );

    mapRefExternal.current = map;

    // =======================================================
    // OpenStreetMap
    // =======================================================

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,

        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }
    ).addTo(map);

    // =======================================================
    // تحديد الموقع الحالي
    // =======================================================

    map.locate({
      setView: false,
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    });

    // =======================================================
    // عند العثور على موقع المستخدم
    // =======================================================

    const handleLocationFound = (
      event: L.LocationEvent
    ) => {
      const lat = event.latlng.lat;
      const lng = event.latlng.lng;

      // أول تحديد فقط
      map.setView(
        [lat, lng],
        15,
        {
          animate: true,
        }
      );
    };

    map.on(
      "locationfound",
      handleLocationFound
    );

    // =======================================================
    // خطأ تحديد الموقع
    // =======================================================

    const handleLocationError = (
      event: L.ErrorEvent
    ) => {
      console.warn(
        "Location error:",
        event.message
      );
    };

    map.on(
      "locationerror",
      handleLocationError
    );

    // =======================================================
    // الضغط على الخريطة
    // =======================================================

    const handleMapClick = (
      event: L.LeafletMouseEvent
    ) => {
      if (!manualPickingRef.current) {
        return;
      }

      const lat = +event.latlng.lat.toFixed(6);
      const lng = +event.latlng.lng.toFixed(6);

      // =====================================================
      // إذا كان هناك marker سابق
      // نحركه فقط
      // =====================================================

      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setLatLng([
          lat,
          lng,
        ]);
      } else {
        // ===================================================
        // إنشاء marker أحمر
        // ===================================================

        const marker =
          L.marker(
            [lat, lng],
            {
              draggable: true,

              icon: L.divIcon({
                className:
                  "selected-location-marker",

                html: `
                  <div
                    style="
                      width:32px;
                      height:42px;
                      position:relative;
                    "
                  >
                    <div
                      style="
                        width:32px;
                        height:32px;
                        background:#e03131;
                        border:3px solid white;
                        border-radius:50% 50% 50% 0;
                        transform:rotate(-45deg);
                        box-shadow:0 2px 6px rgba(0,0,0,0.35);
                        position:absolute;
                        top:0;
                        left:0;
                      "
                    >
                      <div
                        style="
                          width:10px;
                          height:10px;
                          background:white;
                          border-radius:50%;
                          position:absolute;
                          top:8px;
                          left:8px;
                        "
                      ></div>
                    </div>
                  </div>
                `,

                iconSize: [32, 42],
                iconAnchor: [16, 42],
              }),

              zIndexOffset: 1000,
            }
          ).addTo(map);

        selectedMarkerRef.current =
          marker;

        // ===================================================
        // تحريك marker
        // ===================================================

        marker.on(
          "dragend",
          () => {
            const position =
              marker.getLatLng();

            const newLat =
              +position.lat.toFixed(6);

            const newLng =
              +position.lng.toFixed(6);

            setSelected({
              lat: newLat,
              lng: newLng,
            });
          }
        );
      }

      // =====================================================
      // حفظ الموقع
      // =====================================================

      setSelected({
        lat,
        lng,
      });
    };

    map.on(
      "click",
      handleMapClick
    );

    // =======================================================
    // Cleanup
    // =======================================================

    return () => {
      map.off(
        "locationfound",
        handleLocationFound
      );

      map.off(
        "locationerror",
        handleLocationError
      );

      map.off(
        "click",
        handleMapClick
      );

      if (
        selectedMarkerRef.current
      ) {
        selectedMarkerRef.current.remove();

        selectedMarkerRef.current =
          null;
      }

      map.remove();

      mapRefExternal.current = null;
    };
  }, []);

  // =========================================================
  // حذف Marker عند إلغاء الاختيار
  // =========================================================

  useEffect(() => {
    if (
      !manualPicking &&
      selectedMarkerRef.current
    ) {
      selectedMarkerRef.current.remove();

      selectedMarkerRef.current = null;

      setSelected(null);
    }
  }, [manualPicking]);

  // =========================================================
  // تغيير شكل مؤشر الماوس
  // =========================================================

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.style.cursor =
      manualPicking
        ? "crosshair"
        : "grab";
  }, [manualPicking]);

  // =========================================================
  // تأكيد الموقع
  // =========================================================

  const handleConfirm = () => {
    if (!selected) {
      return;
    }

    onConfirmLocation(
      selected.lat,
      selected.lng
    );
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
      }}
    >
      {/* ===================================================
          رسالة اختيار الموقع
      =================================================== */}

      {manualPicking && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform:
              "translateX(-50%)",

            padding: "12px 18px",

            background:
              "rgba(0,0,0,0.75)",

            color: "#fff",

            borderRadius: 14,

            zIndex: 1000,

            fontSize: 14,

            whiteSpace: "nowrap",

            pointerEvents: "none",
          }}
        >
          👆 اضغط على الخريطة لتحديد الموقع
        </div>
      )}

      {/* ===================================================
          الخريطة
      =================================================== */}

      <div
        ref={containerRef}
        style={{
          height: "100%",
          width: "100%",
          cursor: manualPicking
            ? "crosshair"
            : "grab",
        }}
      />

      {/* ===================================================
          زر تأكيد الموقع
      =================================================== */}

      {manualPicking && selected && (
        <button
          onClick={handleConfirm}
          style={{
            position: "absolute",

            bottom: 25,

            left: "50%",

            transform:
              "translateX(-50%)",

            padding:
              "14px 28px",

            background: "#2f9e44",

            color: "#fff",

            borderRadius: 30,

            border: "none",

            fontWeight: "bold",

            fontSize: 16,

            zIndex: 1000,

            cursor: "pointer",

            boxShadow:
              "0 3px 10px rgba(0,0,0,0.25)",
          }}
        >
          تأكيد الموقع
        </button>
      )}
    </div>
  );
}