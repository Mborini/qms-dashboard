import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

/* =========================================================
   TYPES
========================================================= */

type VehicleBody = {
  plate_number?: string | null;
  weight?: number | string | null;
  capacity?: number | string | null;
  manufacture_year?: number | string | null;
  model?: string | null;
  type?: string | null;
  area_id?: number | string | null;

  driver_1?: string | null;
  driver_2?: string | null;
  driver_3?: string | null;

  fuel_card_status?: string | null;
  tracking_device_status?: string | null;
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const result = String(value).trim();

  return result === "" ? null : result;
}

function normalizeNumber(value: unknown): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const result = Number(value);

  return Number.isFinite(result) ? result : null;
}

function normalizeInteger(value: unknown): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const result = Number(value);

  return Number.isInteger(result) ? result : null;
}

function errorResponse(
  message: string,
  status = 400
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
    }
  );
}

/* =========================================================
   GET ALL VEHICLES
========================================================= */

export async function GET() {
  try {
    const result = await pool.query(`
     SELECT
    v.id,
    v.plate_number,
    v.weight,
    v.capacity,
    v.manufacture_year,
    v.model,
    v.type,

    v.area_id,
    a.name AS area,

    v.driver_1,
    v.driver_2,
    v.driver_3,

    v.fuel_card_status,
    v.tracking_device_status,

    v.is_active,
    v.created_at,
    v.updated_at

FROM vehicles v

LEFT JOIN areas a
    ON a.id = v.area_id
   AND a.is_deleted = false

WHERE v.is_deleted = false

ORDER BY
    v.plate_number NULLS LAST,
    v.id DESC;
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(
      "GET /api/maintenance/vehicles error:",
      error
    );

    return errorResponse(
      "Failed to load vehicles",
      500
    );
  }
}

/* =========================================================
   POST - CREATE VEHICLE
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as VehicleBody;

    const {
      plate_number,
      weight,
      capacity,
      manufacture_year,
      model,
      type,
      area_id,

      driver_1,
      driver_2,
      driver_3,

      fuel_card_status,
      tracking_device_status,
    } = body;

    /* =====================================================
       PLATE
    ===================================================== */

    const normalizedPlate =
      normalizeString(plate_number);

    if (!normalizedPlate) {
      return errorResponse(
        "Plate number is required"
      );
    }

    /* =====================================================
       NORMALIZE BASIC DATA
    ===================================================== */

    const normalizedWeight =
      normalizeNumber(weight);

    const normalizedCapacity =
      normalizeNumber(capacity);

    const normalizedYear =
      normalizeInteger(manufacture_year);

    const normalizedModel =
      normalizeString(model);

    const normalizedType =
      normalizeString(type);

    const normalizedAreaId =
      normalizeInteger(area_id);

    /* =====================================================
       NORMALIZE DRIVERS
    ===================================================== */

    const normalizedDriver1 =
      normalizeString(driver_1);

    const normalizedDriver2 =
      normalizeString(driver_2);

    const normalizedDriver3 =
      normalizeString(driver_3);

    /* =====================================================
       NORMALIZE STATUS
    ===================================================== */

    const normalizedFuelCardStatus =
      normalizeString(fuel_card_status);

    const normalizedTrackingDeviceStatus =
      normalizeString(
        tracking_device_status
      );

    /* =====================================================
       VALIDATE AREA ID
    ===================================================== */

    if (
      area_id !== undefined &&
      area_id !== null &&
      area_id !== "" &&
      normalizedAreaId === null
    ) {
      return errorResponse(
        "Invalid area ID"
      );
    }

    /* =====================================================
       CHECK AREA
    ===================================================== */

    if (normalizedAreaId !== null) {
      const areaResult =
        await pool.query(
          `
            SELECT id
            FROM areas
            WHERE id = $1
              AND id > 0
              AND is_deleted = false
            LIMIT 1
          `,
          [normalizedAreaId]
        );

      if (areaResult.rows.length === 0) {
        return errorResponse(
          "Selected area was not found",
          404
        );
      }
    }

    /* =====================================================
       NUMBER VALIDATION
    ===================================================== */

    if (
      weight !== undefined &&
      weight !== null &&
      weight !== "" &&
      normalizedWeight === null
    ) {
      return errorResponse(
        "Invalid weight"
      );
    }

    if (
      capacity !== undefined &&
      capacity !== null &&
      capacity !== "" &&
      normalizedCapacity === null
    ) {
      return errorResponse(
        "Invalid capacity"
      );
    }

    if (
      manufacture_year !== undefined &&
      manufacture_year !== null &&
      manufacture_year !== "" &&
      normalizedYear === null
    ) {
      return errorResponse(
        "Invalid manufacture year"
      );
    }

    /* =====================================================
       YEAR RANGE
    ===================================================== */

    if (
      normalizedYear !== null &&
      (
        normalizedYear < 1900 ||
        normalizedYear >
          new Date().getFullYear() + 1
      )
    ) {
      return errorResponse(
        "Invalid manufacture year"
      );
    }

    /* =====================================================
       STATUS VALIDATION
    ===================================================== */

    const validFuelStatuses = [
      "active",
      "suspended",
      "missing",
      "expired",
    ];

    const validTrackingStatuses = [
      "active",
      "inactive",
      "missing",
      "maintenance",
    ];

    if (
      normalizedFuelCardStatus !== null &&
      !validFuelStatuses.includes(
        normalizedFuelCardStatus
      )
    ) {
      return errorResponse(
        "Invalid fuel card status"
      );
    }

    if (
      normalizedTrackingDeviceStatus !== null &&
      !validTrackingStatuses.includes(
        normalizedTrackingDeviceStatus
      )
    ) {
      return errorResponse(
        "Invalid tracking device status"
      );
    }

    /* =====================================================
       DUPLICATE PLATE
    ===================================================== */

    const duplicate =
      await pool.query(
        `
          SELECT id
          FROM vehicles
          WHERE LOWER(TRIM(plate_number)) =
                LOWER(TRIM($1))
          LIMIT 1
        `,
        [normalizedPlate]
      );

    if (duplicate.rows.length > 0) {
      return errorResponse(
        "Vehicle with this plate number already exists",
        409
      );
    }

    /* =====================================================
       INSERT
    ===================================================== */

    const result =
      await pool.query(
        `
          INSERT INTO vehicles (
            plate_number,
            weight,
            capacity,
            manufacture_year,
            model,
            type,
            area_id,

            driver_1,
            driver_2,
            driver_3,

            fuel_card_status,
            tracking_device_status
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,

            $8,
            $9,
            $10,

            $11,
            $12
          )
          RETURNING id
        `,
        [
          normalizedPlate,
          normalizedWeight,
          normalizedCapacity,
          normalizedYear,
          normalizedModel,
          normalizedType,
          normalizedAreaId,

          normalizedDriver1,
          normalizedDriver2,
          normalizedDriver3,

          normalizedFuelCardStatus,
          normalizedTrackingDeviceStatus,
        ]
      );

    const vehicleId =
      result.rows[0].id;

    /* =====================================================
       RETURN CREATED VEHICLE
    ===================================================== */

    const vehicle =
      await pool.query(
        `
          SELECT
            v.id,
            v.plate_number,
            v.weight,
            v.capacity,
            v.manufacture_year,
            v.model,
            v.type,

            v.area_id,
            a.name AS area,

            v.driver_1,
            v.driver_2,
            v.driver_3,

            v.fuel_card_status,
            v.tracking_device_status,

            v.is_active,
            v.created_at,
            v.updated_at

          FROM vehicles v

          LEFT JOIN areas a
            ON a.id = v.area_id
           AND a.is_deleted = false

          WHERE v.id = $1

          LIMIT 1
        `,
        [vehicleId]
      );

    return NextResponse.json(
      {
        success: true,
        message: "Vehicle created successfully",
        data: vehicle.rows[0],
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/maintenance/vehicles error:",
      error
    );

    return errorResponse(
      "Failed to create vehicle",
      500
    );
  }
}