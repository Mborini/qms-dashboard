"use client";

import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Button,
  Tooltip,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconTrash,
  IconTrashOff,
} from "@tabler/icons-react";

import { BinFormDrawer } from "@/app/components/binCollection/map/LocationDrawer";

import type { Map, Marker } from "leaflet";

import "leaflet/dist/leaflet.css";

export default function MapPage() {
  // =========================================================
  // MAP REFS
  // =========================================================
const isMobile = useMediaQuery("(max-width: 768px)");
  const mapRef = useRef<Map | null>(null);

  const binsMarkersRef = useRef<Marker[]>([]);

  // =========================================================
  // BINS
  // =========================================================

  const [bins, setBins] = useState<any[]>([]);
  const [showingBins, setShowingBins] = useState(false);

  // =========================================================
  // SELECTED LOCATION
  // =========================================================

  const [lat, setLat] = useState(31.95);
  const [lng, setLng] = useState(35.91);

  // =========================================================
  // DRAWER
  // =========================================================

  const [opened, setOpened] = useState(false);

  const [manualPicking, setManualPicking] = useState(false);

  // =========================================================
  // GPS INFO
  // =========================================================

  const [accuracy, setAccuracy] = useState<number | "">("");
  const [altitude, setAltitude] = useState<number | "">("");

  // =========================================================
  // AREAS
  // =========================================================

  const [data, setData] = useState<any[]>([]);

  // =========================================================
  // LOAD COLLECTION AREAS
  // =========================================================

  useEffect(() => {
    const loadAreas = async () => {
      try {
        const res = await fetch("/api/collection-areas");

        if (!res.ok) {
          throw new Error("Failed to load collection areas");
        }

        const result = await res.json();

        setData(result);
      } catch (error) {
        console.error(
          "Failed to load collection areas:",
          error
        );
      }
    };

    loadAreas();
  }, []);

  const areas = data.map((item) => ({
    label: item.name,
    value: String(item.id),
  }));

  // =========================================================
  // MANUAL LOCATION MODE
  // =========================================================

  const handleManualSelect = () => {
    setOpened(false);

    setManualPicking(true);
  };

  // =========================================================
  // CREATE BIN ICON
  // =========================================================

const createBinIcon = (bin?: any, L?: any) => {
  if (!L) return null;

  const html = bin
    ? `
      <div
        style="
          display:flex;
          flex-direction:column;
          align-items:center;
          pointer-events:none;
        "
      >
        <div
          style="
            font-size:24px;
            line-height:28px;
          "
        >
          📍
        </div>

        <span
          style="
            font-size:11px;
            color:#000;
            white-space:nowrap;
            background:rgba(255,255,255,0.9);
            padding:1px 4px;
            border-radius:3px;
            line-height:14px;
          "
        >
          ${bin.bin_capacity ?? ""}
          <span style="color:red;">
            #${bin.id ?? ""}
          </span>
        </span>
      </div>
    `
    : `
      <div
        style="
          font-size:28px;
          line-height:28px;
        "
      >
        📍
      </div>
    `;

  return L.divIcon({
    html,
    className: "custom-bin-marker",
    iconSize: [60, 45],
    iconAnchor: [30, 28],
  });
};

  // =========================================================
  // SHOW BINS
  // =========================================================

  const showBins = async () => {
    if (!mapRef.current) return;

    // تحميل Leaflet فقط في browser
    const L = await import("leaflet");

    // حذف القديمة
    binsMarkersRef.current.forEach((marker) => {
      marker.remove();
    });

    binsMarkersRef.current = [];

    bins.forEach((bin: any) => {
      const binLat = parseFloat(bin.lat);
      const binLng = parseFloat(bin.lng);

      if (
        Number.isNaN(binLat) ||
        Number.isNaN(binLng)
      ) {
        return;
      }

      const icon = createBinIcon(bin, L);

      if (!icon) return;

      const marker = L.marker(
        [binLat, binLng],
        {
          icon,
        }
      ).addTo(mapRef.current!);

      binsMarkersRef.current.push(marker);
    });
  };

  // =========================================================
  // HIDE BINS
  // =========================================================

  const hideBins = () => {
    binsMarkersRef.current.forEach((marker) => {
      marker.remove();
    });

    binsMarkersRef.current = [];
  };

  // =========================================================
  // ADD SINGLE BIN MARKER
  // =========================================================

  const addSingleMarker = async (
    markerLat: number,
    markerLng: number
  ) => {
    if (!mapRef.current) return;

    const L = await import("leaflet");

    const icon = createBinIcon(undefined, L);

    if (!icon) return;

    const marker = L.marker(
      [markerLat, markerLng],
      {
        icon,
      }
    ).addTo(mapRef.current);

    binsMarkersRef.current.push(marker);

    // تحريك الخريطة للموقع
    mapRef.current.setView(
      [markerLat, markerLng],
      Math.max(
        mapRef.current.getZoom(),
        16
      )
    );
  };

  // =========================================================
  // CONFIRM LOCATION
  // =========================================================

  const handleConfirmLocation = (
    selectedLat: number,
    selectedLng: number
  ) => {
    setLat(selectedLat);
    setLng(selectedLng);

    setManualPicking(false);

    setTimeout(() => {
      setOpened(true);
    }, 150);
  };

  // =========================================================
  // LOAD BINS
  // =========================================================

  useEffect(() => {
    const loadBins = async () => {
      try {
        const res = await fetch("/api/bins");

        if (!res.ok) {
          throw new Error("Failed to load bins");
        }

        const result = await res.json();

        setBins(result);

        setShowingBins(true);
      } catch (error) {
        console.error(
          "Failed to load bins:",
          error
        );
      }
    };

    loadBins();
  }, []);

  // =========================================================
  // DRAW BINS AFTER MAP + DATA ARE READY
  // =========================================================

  useEffect(() => {
    if (
      bins.length > 0 &&
      showingBins &&
      mapRef.current
    ) {
      showBins();
    }
  }, [bins, showingBins]);

  // =========================================================
  // CLEANUP
  // =========================================================

  useEffect(() => {
    return () => {
      binsMarkersRef.current.forEach(
        (marker) => {
          marker.remove();
        }
      );

      binsMarkersRef.current = [];

      if (mapRef.current) {
        mapRef.current.remove();

        mapRef.current = null;
      }
    };
  }, []);

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh )",
        overflow: "hidden",
      }}
    >
      {/* =================================================
          LEAFLET MAP
      ================================================= */}

      <LeafletMapView
        mapRefExternal={mapRef}
        manualPicking={manualPicking}
        onConfirmLocation={handleConfirmLocation}
        setAccuracy={setAccuracy}
        setAltitude={setAltitude}
      />

      {/* =================================================
          SELECT LOCATION BUTTON
      ================================================= */}

    {!manualPicking && (
  <Button
    size="lg"
    radius="xl"
    color="blue"
    onClick={handleManualSelect}
    style={{
      position: "absolute",
      bottom: isMobile ? 75 : 40,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1000,
      boxShadow:
        "0 4px 15px rgba(0,0,0,0.25)",
    }}
  >
    📍 حدد موقع
  </Button>
)}

      {/* =================================================
          BIN FORM
      ================================================= */}

      <BinFormDrawer
        opened={opened}
        onClose={() => setOpened(false)}
        lat={lat}
        lng={lng}
        accuracy={accuracy}
        altitude={altitude}
        areas={areas}
        onCreated={addSingleMarker}
      />

      {/* =================================================
          TOGGLE BINS
      ================================================= */}

      <Tooltip
        label={
          showingBins
            ? "إخفاء الحاويات"
            : "عرض الحاويات"
        }
        position="left"
      >
        <ActionIcon
          size={40}
          variant="light"
          color={
            showingBins
              ? "red"
              : "blue"
          }
          onClick={async () => {
            if (showingBins) {
              hideBins();

              setShowingBins(false);
            } else {
              await showBins();

              setShowingBins(true);
            }
          }}
          style={{
            position: "absolute",
            top: 155,
            right: 10,
            zIndex: 1000,
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {showingBins ? (
            <IconTrashOff size={20} />
          ) : (
            <IconTrash size={20} />
          )}
        </ActionIcon>
      </Tooltip>
    </div>
  );
}

/* =========================================================
   LEAFLET MAP COMPONENT
========================================================= */

type LeafletMapViewProps = {
  mapRefExternal: React.MutableRefObject<Map | null>;

  manualPicking: boolean;

  onConfirmLocation: (
    lat: number,
    lng: number
  ) => void;

  setAccuracy: (
    value: number | ""
  ) => void;

  setAltitude: (
    value: number | ""
  ) => void;
};

function LeafletMapView({
  mapRefExternal,
  manualPicking,
  onConfirmLocation,
  setAccuracy,
  setAltitude,
}: LeafletMapViewProps) {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const selectedMarkerRef =
    useRef<Marker | null>(null);

  const manualPickingRef =
    useRef(manualPicking);

  const leafletRef =
    useRef<typeof import("leaflet") | null>(
      null
    );

  const [selected, setSelected] =
    useState<{
      lat: number;
      lng: number;
    } | null>(null);

  // =========================================================
  // KEEP MANUAL PICKING REF UPDATED
  // =========================================================

  useEffect(() => {
    manualPickingRef.current =
      manualPicking;
  }, [manualPicking]);

  // =========================================================
  // CREATE MAP
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const initializeMap = async () => {
      if (!mapContainerRef.current) {
        return;
      }

      if (mapRefExternal.current) {
        return;
      }

      // مهم:
      // Leaflet يتم تحميله فقط داخل browser
      const L = await import("leaflet");

      if (!mounted) return;

      leafletRef.current = L;

      // =====================================================
      // MAP
      // =====================================================

      const map = L.map(
        mapContainerRef.current,
        {
          center: [31.95, 35.91],
          zoom: 13,
          zoomControl: true,
        }
      );

      mapRefExternal.current = map;

      // =====================================================
      // OPEN STREET MAP
      // =====================================================

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,

          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }
      ).addTo(map);

      // =====================================================
      // GPS
      // =====================================================

      map.locate({
        setView: false,
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      });

      // =====================================================
      // LOCATION FOUND
      // =====================================================

      const handleLocationFound = (
        event: import("leaflet").LocationEvent
      ) => {
        const userLat =
          event.latlng.lat;

        const userLng =
          event.latlng.lng;

        // Accuracy
        if (
          typeof event.accuracy ===
          "number"
        ) {
          setAccuracy(
            Math.round(
              event.accuracy
            )
          );
        }

        // Altitude
        if (
          event.altitude !== null &&
          event.altitude !== undefined
        ) {
          setAltitude(
            Math.round(
              event.altitude
            )
          );
        }

        // أول GPS
        map.setView(
          [userLat, userLng],
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

      // =====================================================
      // LOCATION ERROR
      // =====================================================

      const handleLocationError = (
        event: import("leaflet").ErrorEvent
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

      // =====================================================
      // MAP CLICK
      // =====================================================

      const handleMapClick = (
        event: import("leaflet").LeafletMouseEvent
      ) => {
        if (
          !manualPickingRef.current
        ) {
          return;
        }

        const clickedLat =
          Number(
            event.latlng.lat.toFixed(6)
          );

        const clickedLng =
          Number(
            event.latlng.lng.toFixed(6)
          );

        // =================================================
        // UPDATE EXISTING MARKER
        // =================================================

        if (
          selectedMarkerRef.current
        ) {
          selectedMarkerRef.current.setLatLng(
            [
              clickedLat,
              clickedLng,
            ]
          );
        } else {
          // ===============================================
          // CREATE RED MARKER
          // ===============================================

          const marker =
            L.marker(
              [
                clickedLat,
                clickedLng,
              ],
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
                          box-shadow:
                            0 2px 6px
                            rgba(0,0,0,0.35);
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

                  iconSize: [
                    32,
                    42,
                  ],

                  iconAnchor: [
                    16,
                    42,
                  ],
                }),

                zIndexOffset: 1000,
              }
            ).addTo(map);

          selectedMarkerRef.current =
            marker;

          // =============================================
          // DRAG MARKER
          // =============================================

          marker.on(
            "dragend",
            () => {
              const position =
                marker.getLatLng();

              const newLat =
                Number(
                  position.lat.toFixed(
                    6
                  )
                );

              const newLng =
                Number(
                  position.lng.toFixed(
                    6
                  )
                );

              setSelected({
                lat: newLat,
                lng: newLng,
              });
            }
          );
        }

        // =================================================
        // SAVE SELECTED LOCATION
        // =================================================

        setSelected({
          lat: clickedLat,
          lng: clickedLng,
        });
      };

      map.on(
        "click",
        handleMapClick
      );

      // =====================================================
      // CLEANUP
      // =====================================================

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

        mapRefExternal.current =
          null;
      };
    };

    initializeMap();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // REMOVE SELECTED MARKER WHEN CANCELLED
  // =========================================================

  useEffect(() => {
    if (
      !manualPicking &&
      selectedMarkerRef.current
    ) {
      selectedMarkerRef.current.remove();

      selectedMarkerRef.current =
        null;

      setSelected(null);
    }
  }, [manualPicking]);

  // =========================================================
  // CURSOR
  // =========================================================

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    mapContainerRef.current.style.cursor =
      manualPicking
        ? "crosshair"
        : "grab";
  }, [manualPicking]);

  // =========================================================
  // CONFIRM
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

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      {/* ===================================================
          PICKING MESSAGE
      =================================================== */}

      {manualPicking && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform:
              "translateX(-50%)",

            padding:
              "12px 18px",

            background:
              "rgba(0,0,0,0.75)",

            color: "#fff",

            borderRadius: 14,

            zIndex: 1000,

            fontSize: 14,

            whiteSpace:
              "nowrap",

            pointerEvents:
              "none",

            boxShadow:
              "0 3px 10px rgba(0,0,0,0.2)",
          }}
        >
          👆 اضغط على الخريطة لتحديد الموقع
        </div>
      )}

      {/* ===================================================
          MAP
      =================================================== */}

      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          cursor: manualPicking
            ? "crosshair"
            : "grab",
        }}
      />

      {/* ===================================================
          CONFIRM BUTTON
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

            background:
              "#2f9e44",

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