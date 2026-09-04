import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

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
        area
      FROM maintenance_vehicles
      ORDER BY
        plate_number NULLS LAST,
        id ASC
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
    const body = await request.json();

    const {
      plate_number,
      weight,
      capacity,
      manufacture_year,
      model,
      area,
    } = body;

    /* -------------------------------------------------------
       VALIDATION
       ------------------------------------------------------- */

    if (
      !plate_number ||
      String(plate_number).trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Plate number is required",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       NORMALIZE
       ------------------------------------------------------- */

    const normalizedPlate =
      String(plate_number).trim();

    const normalizedModel =
      model !== undefined &&
      model !== null &&
      String(model).trim() !== ""
        ? String(model).trim()
        : null;

    const normalizedArea =
      area !== undefined &&
      area !== null &&
      String(area).trim() !== ""
        ? String(area).trim()
        : null;

    const normalizedWeight =
      weight !== undefined &&
      weight !== null &&
      weight !== ""
        ? Number(weight)
        : null;

    const normalizedCapacity =
      capacity !== undefined &&
      capacity !== null &&
      capacity !== ""
        ? Number(capacity)
        : null;

    const normalizedYear =
      manufacture_year !== undefined &&
      manufacture_year !== null &&
      manufacture_year !== ""
        ? Number(manufacture_year)
        : null;

    /* -------------------------------------------------------
       NUMBER VALIDATION
       ------------------------------------------------------- */

    if (
      normalizedWeight !== null &&
      !Number.isFinite(normalizedWeight)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid weight",
        },
        {
          status: 400,
        }
      );
    }

    if (
      normalizedCapacity !== null &&
      !Number.isFinite(normalizedCapacity)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid capacity",
        },
        {
          status: 400,
        }
      );
    }

    if (
      normalizedYear !== null &&
      !Number.isInteger(normalizedYear)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid manufacture year",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       DUPLICATE PLATE CHECK
       ------------------------------------------------------- */

    const duplicate = await pool.query(
      `
        SELECT id
        FROM maintenance_vehicles
        WHERE plate_number = $1
        LIMIT 1
      `,
      [normalizedPlate]
    );

    if (duplicate.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Vehicle with this plate number already exists",
        },
        {
          status: 409,
        }
      );
    }

    /* -------------------------------------------------------
       INSERT
       ------------------------------------------------------- */

    const result = await pool.query(
      `
        INSERT INTO maintenance_vehicles (
          plate_number,
          weight,
          capacity,
          manufacture_year,
          model,
          area
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )
        RETURNING
          id,
          plate_number,
          weight,
          capacity,
          manufacture_year,
          model,
          area
      `,
      [
        normalizedPlate,
        normalizedWeight,
        normalizedCapacity,
        normalizedYear,
        normalizedModel,
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
    const body = await request.json();

    const {
      id,
      plate_number,
      weight,
      capacity,
      manufacture_year,
      model,
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
      return NextResponse.json(
        {
          success: false,
          error: "Vehicle ID is required",
        },
        {
          status: 400,
        }
      );
    }

    const vehicleId = Number(id);

    if (!Number.isInteger(vehicleId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid vehicle ID",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       CHECK VEHICLE
       ------------------------------------------------------- */

    const existing =
      await pool.query(
        `
          SELECT id
          FROM maintenance_vehicles
          WHERE id = $1
          LIMIT 1
        `,
        [vehicleId]
      );

    if (existing.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Vehicle not found",
        },
        {
          status: 404,
        }
      );
    }

    /* -------------------------------------------------------
       VALIDATION
       ------------------------------------------------------- */

    if (
      plate_number === undefined ||
      plate_number === null ||
      String(plate_number).trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Plate number is required",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedPlate =
      String(plate_number).trim();

    const normalizedModel =
      model !== undefined &&
      model !== null &&
      String(model).trim() !== ""
        ? String(model).trim()
        : null;

    const normalizedArea =
      area !== undefined &&
      area !== null &&
      String(area).trim() !== ""
        ? String(area).trim()
        : null;

    const normalizedWeight =
      weight !== undefined &&
      weight !== null &&
      weight !== ""
        ? Number(weight)
        : null;

    const normalizedCapacity =
      capacity !== undefined &&
      capacity !== null &&
      capacity !== ""
        ? Number(capacity)
        : null;

    const normalizedYear =
      manufacture_year !== undefined &&
      manufacture_year !== null &&
      manufacture_year !== ""
        ? Number(manufacture_year)
        : null;

    /* -------------------------------------------------------
       NUMBER VALIDATION
       ------------------------------------------------------- */

    if (
      normalizedWeight !== null &&
      !Number.isFinite(normalizedWeight)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid weight",
        },
        {
          status: 400,
        }
      );
    }

    if (
      normalizedCapacity !== null &&
      !Number.isFinite(normalizedCapacity)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid capacity",
        },
        {
          status: 400,
        }
      );
    }

    if (
      normalizedYear !== null &&
      !Number.isInteger(normalizedYear)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid manufacture year",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       DUPLICATE PLATE CHECK
       ------------------------------------------------------- */

    const duplicate =
      await pool.query(
        `
          SELECT id
          FROM maintenance_vehicles
          WHERE plate_number = $1
            AND id <> $2
          LIMIT 1
        `,
        [
          normalizedPlate,
          vehicleId,
        ]
      );

    if (duplicate.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Another vehicle with this plate number already exists",
        },
        {
          status: 409,
        }
      );
    }

    /* -------------------------------------------------------
       UPDATE
       ------------------------------------------------------- */

    const result = await pool.query(
      `
        UPDATE maintenance_vehicles
        SET
          plate_number = $1,
          weight = $2,
          capacity = $3,
          manufacture_year = $4,
          model = $5,
          area = $6
        WHERE id = $7
        RETURNING
          id,
          plate_number,
          weight,
          capacity,
          manufacture_year,
          model,
          area
      `,
      [
        normalizedPlate,
        normalizedWeight,
        normalizedCapacity,
        normalizedYear,
        normalizedModel,
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

    const id = searchParams.get("id");

    /* -------------------------------------------------------
       VALIDATION
       ------------------------------------------------------- */

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Vehicle ID is required",
        },
        {
          status: 400,
        }
      );
    }

    const vehicleId = Number(id);

    if (!Number.isInteger(vehicleId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid vehicle ID",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       CHECK VEHICLE
       ------------------------------------------------------- */

    const existing =
      await pool.query(
        `
          SELECT id
          FROM maintenance_vehicles
          WHERE id = $1
          LIMIT 1
        `,
        [vehicleId]
      );

    if (existing.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Vehicle not found",
        },
        {
          status: 404,
        }
      );
    }

    /* -------------------------------------------------------
       DELETE
       ------------------------------------------------------- */

    const result = await pool.query(
      `
        DELETE FROM maintenance_vehicles
        WHERE id = $1
        RETURNING
          id,
          plate_number,
          weight,
          capacity,
          manufacture_year,
          model,
          area
      `,
      [vehicleId]
    );

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