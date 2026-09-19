import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

/* =========================================================
   TYPES
========================================================= */

type VehicleBody = {
  plate_number?: string | number | null;

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

  is_active?: boolean | string | number | null;
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeString(
  value: unknown
): string | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const result = String(value).trim();

  return result === ""
    ? null
    : result;
}

function normalizeNumber(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const result = Number(value);

  return Number.isFinite(result)
    ? result
    : null;
}

function normalizeInteger(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const result = Number(value);

  return Number.isInteger(result)
    ? result
    : null;
}

function normalizeBoolean(
  value: unknown,
  defaultValue = true
): boolean {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (
    value === true ||
    value === 1 ||
    String(value).toLowerCase() === "true" ||
    String(value) === "1"
  ) {
    return true;
  }

  if (
    value === false ||
    value === 0 ||
    String(value).toLowerCase() === "false" ||
    String(value) === "0"
  ) {
    return false;
  }

  return defaultValue;
}

function errorResponse(
  message: string,
  status = 400,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      message,
      ...(details !== undefined
        ? { details }
        : {}),
    },
    {
      status,
    }
  );
}

/* =========================================================
   STATUS VALUES
========================================================= */

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

/* =========================================================
   VEHICLE SELECT
========================================================= */

const vehicleSelect = `
  SELECT
    v.id,
    v.plate_number,
    v.weight,
    v.capacity,
    v.manufacture_year,
    v.model,
    v.type,

    v.area_id,
    a.name AS area_name,

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
`;

/* =========================================================
   GET VEHICLE
========================================================= */

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await context.params;

    const vehicleId =
      normalizeInteger(id);

    if (
      vehicleId === null ||
      vehicleId <= 0
    ) {
      return errorResponse(
        "Invalid vehicle ID",
        400
      );
    }

    const result =
      await pool.query(
        `
          ${vehicleSelect}

          WHERE v.id = $1

          LIMIT 1
        `,
        [vehicleId]
      );

    if (
      result.rows.length === 0
    ) {
      return errorResponse(
        "Vehicle not found",
        404
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(
      "GET /api/maintenance/vehicles/[id] error:",
      error
    );

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Failed to load vehicle",
      500
    );
  }
}

/* =========================================================
   PATCH - UPDATE VEHICLE
========================================================= */

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /* =====================================================
       VEHICLE ID
    ===================================================== */

    const { id } =
      await context.params;

    const vehicleId =
      normalizeInteger(id);

    if (
      vehicleId === null ||
      vehicleId <= 0
    ) {
      return errorResponse(
        "Invalid vehicle ID",
        400
      );
    }

    /* =====================================================
       CHECK EXISTING VEHICLE
    ===================================================== */

    const existingResult =
      await pool.query(
        `
          SELECT
            id,
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

            is_active

          FROM vehicles

          WHERE id = $1

          LIMIT 1
        `,
        [vehicleId]
      );

    if (
      existingResult.rows.length === 0
    ) {
      return errorResponse(
        "Vehicle not found",
        404
      );
    }

    const existing =
      existingResult.rows[0];

    /* =====================================================
       REQUEST BODY
    ===================================================== */

    let body: VehicleBody;

    try {
      body =
        (await request.json()) as VehicleBody;
    } catch {
      return errorResponse(
        "Invalid JSON request body",
        400
      );
    }

    /* =====================================================
       BASIC DATA
    ===================================================== */

    const normalizedPlate =
      body.plate_number !== undefined
        ? normalizeString(
            body.plate_number
          )
        : normalizeString(
            existing.plate_number
          );

    if (!normalizedPlate) {
      return errorResponse(
        "Plate number is required",
        400
      );
    }

    const normalizedWeight =
      body.weight !== undefined
        ? normalizeNumber(
            body.weight
          )
        : existing.weight;

    const normalizedCapacity =
      body.capacity !== undefined
        ? normalizeNumber(
            body.capacity
          )
        : existing.capacity;

    const normalizedYear =
      body.manufacture_year !==
      undefined
        ? normalizeInteger(
            body.manufacture_year
          )
        : existing.manufacture_year;

    const normalizedModel =
      body.model !== undefined
        ? normalizeString(
            body.model
          )
        : existing.model;

    const normalizedType =
      body.type !== undefined
        ? normalizeString(
            body.type
          )
        : existing.type;

    const normalizedAreaId =
      body.area_id !== undefined
        ? normalizeInteger(
            body.area_id
          )
        : existing.area_id;

    /* =====================================================
       DRIVERS
    ===================================================== */

    const normalizedDriver1 =
      body.driver_1 !== undefined
        ? normalizeString(
            body.driver_1
          )
        : existing.driver_1;

    const normalizedDriver2 =
      body.driver_2 !== undefined
        ? normalizeString(
            body.driver_2
          )
        : existing.driver_2;

    const normalizedDriver3 =
      body.driver_3 !== undefined
        ? normalizeString(
            body.driver_3
          )
        : existing.driver_3;

    /* =====================================================
       FUEL CARD
    ===================================================== */

    const normalizedFuelCardStatus =
      body.fuel_card_status !==
      undefined
        ? normalizeString(
            body.fuel_card_status
          )
        : existing.fuel_card_status;

    /* =====================================================
       TRACKING DEVICE
    ===================================================== */

    const normalizedTrackingDeviceStatus =
      body.tracking_device_status !==
      undefined
        ? normalizeString(
            body.tracking_device_status
          )
        : existing.tracking_device_status;

    /* =====================================================
       ACTIVE
    ===================================================== */

    const normalizedIsActive =
      body.is_active !== undefined
        ? normalizeBoolean(
            body.is_active,
            Boolean(
              existing.is_active
            )
          )
        : Boolean(
            existing.is_active
          );

    /* =====================================================
       VALIDATE WEIGHT
    ===================================================== */

    if (
      body.weight !== undefined &&
      body.weight !== null &&
      body.weight !== "" &&
      normalizedWeight === null
    ) {
      return errorResponse(
        "Invalid weight",
        400
      );
    }

    /* =====================================================
       VALIDATE CAPACITY
    ===================================================== */

    if (
      body.capacity !== undefined &&
      body.capacity !== null &&
      body.capacity !== "" &&
      normalizedCapacity === null
    ) {
      return errorResponse(
        "Invalid capacity",
        400
      );
    }

    /* =====================================================
       VALIDATE YEAR
    ===================================================== */

    if (
      body.manufacture_year !==
        undefined &&
      body.manufacture_year !==
        null &&
      body.manufacture_year !==
        "" &&
      normalizedYear === null
    ) {
      return errorResponse(
        "Invalid manufacture year",
        400
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
        "Invalid manufacture year",
        400
      );
    }

    /* =====================================================
       VALIDATE AREA ID
    ===================================================== */

    if (
      body.area_id !== undefined &&
      body.area_id !== null &&
      body.area_id !== "" &&
      normalizedAreaId === null
    ) {
      return errorResponse(
        "Invalid area ID",
        400
      );
    }

    /* =====================================================
       CHECK AREA
    ===================================================== */

    if (
      normalizedAreaId !== null
    ) {
      const areaResult =
        await pool.query(
          `
            SELECT
              id

            FROM areas

            WHERE id = $1
              AND id > 0
              AND is_deleted = false

            LIMIT 1
          `,
          [normalizedAreaId]
        );

      if (
        areaResult.rows.length === 0
      ) {
        return errorResponse(
          "Selected area was not found",
          404
        );
      }
    }

    /* =====================================================
       VALIDATE FUEL STATUS
    ===================================================== */

    if (
      normalizedFuelCardStatus !==
        null &&
      !validFuelStatuses.includes(
        normalizedFuelCardStatus
      )
    ) {
      return errorResponse(
        "Invalid fuel card status",
        400
      );
    }

    /* =====================================================
       VALIDATE TRACKING STATUS
    ===================================================== */

    if (
      normalizedTrackingDeviceStatus !==
        null &&
      !validTrackingStatuses.includes(
        normalizedTrackingDeviceStatus
      )
    ) {
      return errorResponse(
        "Invalid tracking device status",
        400
      );
    }

    /* =====================================================
       DUPLICATE PLATE
    ===================================================== */

    const duplicateResult =
      await pool.query(
        `
          SELECT
            id

          FROM vehicles

          WHERE LOWER(
                  TRIM(plate_number)
                ) =
                LOWER(
                  TRIM($1)
                )

            AND id <> $2

          LIMIT 1
        `,
        [
          normalizedPlate,
          vehicleId,
        ]
      );

    if (
      duplicateResult.rows.length >
      0
    ) {
      return errorResponse(
        "Vehicle with this plate number already exists",
        409
      );
    }

    /* =====================================================
       UPDATE VEHICLE
    ===================================================== */

    const updateResult =
      await pool.query(
        `
          UPDATE vehicles

          SET
            plate_number = $1,
            weight = $2,
            capacity = $3,
            manufacture_year = $4,
            model = $5,
            type = $6,
            area_id = $7,

            driver_1 = $8,
            driver_2 = $9,
            driver_3 = $10,

            fuel_card_status = $11,
            tracking_device_status = $12,

            is_active = $13,

            updated_at = NOW()

          WHERE id = $14

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

          normalizedIsActive,

          vehicleId,
        ]
      );

    if (
      updateResult.rows.length === 0
    ) {
      return errorResponse(
        "Vehicle could not be updated",
        500
      );
    }

    /* =====================================================
       GET UPDATED VEHICLE
    ===================================================== */

    const updatedResult =
      await pool.query(
        `
          ${vehicleSelect}

          WHERE v.id = $1

          LIMIT 1
        `,
        [vehicleId]
      );

    if (
      updatedResult.rows.length === 0
    ) {
      return errorResponse(
        "Vehicle was updated but could not be loaded",
        500
      );
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json({
      success: true,
      message:
        "Vehicle updated successfully",
      data: updatedResult.rows[0],
    });
  } catch (error) {
    /* =====================================================
       IMPORTANT DEBUG INFORMATION
    ===================================================== */

    console.error(
      "================================================="
    );

    console.error(
      "PATCH /api/maintenance/vehicles/[id] ERROR"
    );

    console.error(
      "================================================="
    );

    console.error(error);

    console.error(
      "================================================="
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error
        ? String(
            (
              error as {
                code?: unknown;
              }
            ).code
          )
        : undefined;

    const errorDetail =
      typeof error === "object" &&
      error !== null &&
      "detail" in error
        ? String(
            (
              error as {
                detail?: unknown;
              }
            ).detail
          )
        : undefined;

    return errorResponse(
      errorMessage ||
        "Failed to update vehicle",
      500,
      {
        code: errorCode,
        detail: errorDetail,
      }
    );
  }
}

/* =========================================================
   DELETE - DELETE VEHICLE
========================================================= */

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /* =====================================================
       VEHICLE ID
    ===================================================== */

    const { id } =
      await context.params;

    const vehicleId =
      normalizeInteger(id);

    if (
      vehicleId === null ||
      vehicleId <= 0
    ) {
      return errorResponse(
        "Invalid vehicle ID",
        400
      );
    }

    /* =====================================================
       CHECK VEHICLE
    ===================================================== */

    const existing =
      await pool.query(
        `
          SELECT
            id

          FROM vehicles

          WHERE id = $1

          LIMIT 1
        `,
        [vehicleId]
      );

    if (
      existing.rows.length === 0
    ) {
      return errorResponse(
        "Vehicle not found",
        404
      );
    }

    /* =====================================================
       DELETE
    ===================================================== */

    await pool.query(
      `
        update vehicles set is_deleted = true, updated_at = NOW()

        WHERE id = $1
      `,
      [vehicleId]
    );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json({
      success: true,
      message:
        "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE /api/maintenance/vehicles/[id] error:",
      error
    );

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Failed to delete vehicle",
      500
    );
  }
}