
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

/* =========================================================
   TYPES
   ========================================================= */

type VehicleBody = {
  id?: number | string;
  plate_number?: string | null;
  weight?: number | string | null;
  capacity?: number | string | null;
  manufacture_year?: number | string | null;
  model?: string | null;
  type?: string | null;
  area?: string | null;
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

  return result === "" ? null : result;
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
   GET
   ========================================================= */

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        plate_number,
        weight,
        capacity,
        manufacture_year,
        model,
        type,
        area,
        is_active,
        created_at,
        updated_at
      FROM vehicles
      ORDER BY
        plate_number NULLS LAST,
        id DESC
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

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load vehicles",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
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
      area,
    } = body;

    /* -------------------------------------------------------
       PLATE VALIDATION
       ------------------------------------------------------- */

    const normalizedPlate =
      normalizeString(plate_number);

    if (!normalizedPlate) {
      return errorResponse(
        "Plate number is required"
      );
    }

    /* -------------------------------------------------------
       NORMALIZE
       ------------------------------------------------------- */

    const normalizedModel =
      normalizeString(model);

    const normalizedType =
      normalizeString(type);

    const normalizedArea =
      normalizeString(area);

    const normalizedWeight =
      normalizeNumber(weight);

    const normalizedCapacity =
      normalizeNumber(capacity);

    const normalizedYear =
      normalizeInteger(manufacture_year);

    /* -------------------------------------------------------
       NUMBER VALIDATION
       ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       YEAR RANGE VALIDATION
       ------------------------------------------------------- */

    if (
      normalizedYear !== null &&
      (
        normalizedYear < 1900 ||
        normalizedYear > new Date().getFullYear() + 1
      )
    ) {
      return errorResponse(
        "Invalid manufacture year"
      );
    }

    /* -------------------------------------------------------
       DUPLICATE PLATE CHECK
       ------------------------------------------------------- */

    const duplicate = await pool.query(
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

    /* -------------------------------------------------------
       INSERT
       ------------------------------------------------------- */

    const result = await pool.query(
      `
        INSERT INTO vehicles (
          plate_number,
          weight,
          capacity,
          manufacture_year,
          model,
          type,
          area
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        RETURNING
          id,
          plate_number,
          weight,
          capacity,
          manufacture_year,
          model,
          type,
          area,
          is_active,
          created_at,
          updated_at
      `,
      [
        normalizedPlate,
        normalizedWeight,
        normalizedCapacity,
        normalizedYear,
        normalizedModel,
        normalizedType,
        normalizedArea,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Vehicle created successfully",
        data: result.rows[0],
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

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create vehicle",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH
   ========================================================= */

export async function PATCH(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as VehicleBody;

    const {
      id,
      plate_number,
      weight,
      capacity,
      manufacture_year,
      model,
      type,
      area,
    } = body;

    /* -------------------------------------------------------
       ID VALIDATION
       ------------------------------------------------------- */

    if (
      id === undefined ||
      id === null ||
      id === ""
    ) {
      return errorResponse(
        "Vehicle ID is required"
      );
    }

    const vehicleId = Number(id);

    if (!Number.isInteger(vehicleId)) {
      return errorResponse(
        "Invalid vehicle ID"
      );
    }

    /* -------------------------------------------------------
       CHECK VEHICLE
       ------------------------------------------------------- */

    const existing =
      await pool.query(
        `
          SELECT id
          FROM vehicles
          WHERE id = $1
          LIMIT 1
        `,
        [vehicleId]
      );

    if (existing.rows.length === 0) {
      return errorResponse(
        "Vehicle not found",
        404
      );
    }

    /* -------------------------------------------------------
       PLATE VALIDATION
       ------------------------------------------------------- */

    const normalizedPlate =
      normalizeString(plate_number);

    if (!normalizedPlate) {
      return errorResponse(
        "Plate number is required"
      );
    }

    /* -------------------------------------------------------
       NORMALIZE
       ------------------------------------------------------- */

    const normalizedModel =
      normalizeString(model);

    const normalizedType =
      normalizeString(type);

    const normalizedArea =
      normalizeString(area);

    const normalizedWeight =
      normalizeNumber(weight);

    const normalizedCapacity =
      normalizeNumber(capacity);

    const normalizedYear =
      normalizeInteger(manufacture_year);

    /* -------------------------------------------------------
       NUMBER VALIDATION
       ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       YEAR RANGE VALIDATION
       ------------------------------------------------------- */

    if (
      normalizedYear !== null &&
      (
        normalizedYear < 1900 ||
        normalizedYear > new Date().getFullYear() + 1
      )
    ) {
      return errorResponse(
        "Invalid manufacture year"
      );
    }

    /* -------------------------------------------------------
       DUPLICATE PLATE CHECK
       ------------------------------------------------------- */

    const duplicate =
      await pool.query(
        `
          SELECT id
          FROM vehicles
          WHERE LOWER(TRIM(plate_number)) =
                LOWER(TRIM($1))
            AND id <> $2
          LIMIT 1
        `,
        [
          normalizedPlate,
          vehicleId,
        ]
      );

    if (duplicate.rows.length > 0) {
      return errorResponse(
        "Another vehicle with this plate number already exists",
        409
      );
    }

    /* -------------------------------------------------------
       UPDATE
       ------------------------------------------------------- */

    const result = await pool.query(
      `
        UPDATE vehicles
        SET
          plate_number = $1,
          weight = $2,
          capacity = $3,
          manufacture_year = $4,
          model = $5,
          type = $6,
          area = $7,
          updated_at = NOW()
        WHERE id = $8
        RETURNING
          id,
          plate_number,
          weight,
          capacity,
          manufacture_year,
          model,
          type,
          area,
          is_active,
          created_at,
          updated_at
      `,
      [
        normalizedPlate,
        normalizedWeight,
        normalizedCapacity,
        normalizedYear,
        normalizedModel,
        normalizedType,
        normalizedArea,
        vehicleId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Vehicle updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(
      "PATCH /api/maintenance/vehicles error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update vehicle",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE
   ========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get("id");

    /* -------------------------------------------------------
       VALIDATION
       ------------------------------------------------------- */

    if (!id) {
      return errorResponse(
        "Vehicle ID is required"
      );
    }

    const vehicleId = Number(id);

    if (!Number.isInteger(vehicleId)) {
      return errorResponse(
        "Invalid vehicle ID"
      );
    }

    /* -------------------------------------------------------
       DELETE
       ------------------------------------------------------- */

    const result = await pool.query(
      `
        DELETE FROM vehicles
        WHERE id = $1
        RETURNING
          id,
          plate_number,
          weight,
          capacity,
          manufacture_year,
          model,
          type,
          area
      `,
      [vehicleId]
    );

    if (result.rows.length === 0) {
      return errorResponse(
        "Vehicle not found",
        404
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vehicle deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(
      "DELETE /api/maintenance/vehicles error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete vehicle",
      },
      {
        status: 500,
      }
    );
  }
}

