import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const vehicleId = searchParams.get("vehicle_id");
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    const values: string[] = [];
    const conditions: string[] = [];

    if (vehicleId) {
      values.push(vehicleId);

      conditions.push(`
        mr.vehicle_id = $${values.length}
      `);
    }

    if (status === "open") {
      conditions.push(`
        mr.exit_at IS NULL
      `);
    }

    if (status === "closed") {
      conditions.push(`
        mr.exit_at IS NOT NULL
      `);
    }

    if (date) {
      values.push(date);

      conditions.push(`
        mr.entry_at < ($${values.length}::date + INTERVAL '1 day')
        AND (
          mr.exit_at IS NULL
          OR mr.exit_at >= $${values.length}::date
        )
      `);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await pool.query(
      `
      SELECT
        mr.id,

        v.id AS vehicle_id,
        v.plate_number,
        v.weight,
        v.capacity,
        v.manufacture_year,
        v.model,
        v.area,

        k.id AS kpi_id,
        k.name AS kpi_name,

        sk.id AS sub_kpi_id,
        sk.name AS sub_kpi_name,

        mr.entry_at,
        mr.exit_at,

        CASE
          WHEN mr.exit_at IS NULL
            THEN NOW() - mr.entry_at
          ELSE
            mr.exit_at - mr.entry_at
        END AS duration,

        mr.description,
        mr.notes,

        mr.created_by,
        mr.updated_by,

        mr.created_at,
        mr.updated_at

      FROM maintenance_records mr

      INNER JOIN maintenance_vehicles v
        ON v.id = mr.vehicle_id

      INNER JOIN maintenance_kpis k
        ON k.id = mr.kpi_id

      LEFT JOIN maintenance_sub_kpis sk
        ON sk.id = mr.sub_kpi_id

      ${whereClause}

      ORDER BY
        mr.entry_at DESC
      `,
      values
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(
      "GET /api/maintenance error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load maintenance records",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const body = await request.json();

    const {
      vehicle_id,
      kpi_id,
      sub_kpi_id,
      entry_at,
      description,
      notes,
      created_by,
    } = body;

    // =========================
    // Validation
    // =========================

    if (!vehicle_id) {
      return NextResponse.json(
        {
          success: false,
          error: "vehicle_id is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!kpi_id) {
      return NextResponse.json(
        {
          success: false,
          error: "kpi_id is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!entry_at) {
      return NextResponse.json(
        {
          success: false,
          error: "entry_at is required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // Future date protection
    // =========================

    const entryDate = new Date(entry_at);

    if (Number.isNaN(entryDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid entry_at",
        },
        {
          status: 400,
        }
      );
    }

    if (entryDate.getTime() > Date.now()) {
      return NextResponse.json(
        {
          success: false,
          error: "Entry date/time cannot be in the future",
        },
        {
          status: 400,
        }
      );
    }

    await client.query("BEGIN");

    // =========================
    // Check vehicle
    // =========================

    const vehicleResult = await client.query(
      `
      SELECT
        id,
        plate_number
        
      FROM maintenance_vehicles
      WHERE id = $1
      LIMIT 1
      `,
      [vehicle_id]
    );

    if (vehicleResult.rows.length === 0) {
      await client.query("ROLLBACK");

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

  

    // =========================
    // Check existing open maintenance
    // =========================

    const openMaintenanceResult = await client.query(
      `
      SELECT
        id,
        entry_at
      FROM maintenance_records
      WHERE vehicle_id = $1
        AND exit_at IS NULL
      LIMIT 1
      `,
      [vehicle_id]
    );

    if (openMaintenanceResult.rows.length > 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          error: "Vehicle is already in maintenance",
          maintenance_id:
            openMaintenanceResult.rows[0].id,
          entry_at:
            openMaintenanceResult.rows[0].entry_at,
        },
        {
          status: 409,
        }
      );
    }

    // =========================
    // Check KPI
    // =========================

    const kpiResult = await client.query(
      `
      SELECT
        id,
        name
       
      FROM maintenance_kpis
      WHERE id = $1
      LIMIT 1
      `,
      [kpi_id]
    );

    if (kpiResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          error: "KPI not found",
        },
        {
          status: 404,
        }
      );
    }

   

    // =========================
    // Check Sub KPI
    // =========================

    if (sub_kpi_id) {
      const subKpiResult = await client.query(
        `
        SELECT
          id,
          name,
          kpi_id
          
        FROM maintenance_sub_kpis
        WHERE id = $1
        LIMIT 1
        `,
        [sub_kpi_id]
      );

      if (subKpiResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          {
            success: false,
            error: "Sub KPI not found",
          },
          {
            status: 404,
          }
        );
      }

      const subKpi = subKpiResult.rows[0];

      

      if (String(subKpi.kpi_id) !== String(kpi_id)) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          {
            success: false,
            error: "Sub KPI does not belong to selected KPI",
          },
          {
            status: 400,
          }
        );
      }
    }

    // =========================
    // Insert
    // =========================

    const insertResult = await client.query(
      `
      INSERT INTO maintenance_records (
        vehicle_id,
        kpi_id,
        sub_kpi_id,
        entry_at,
        description,
        notes,
        created_by
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
        vehicle_id,
        kpi_id,
        sub_kpi_id,
        entry_at,
        exit_at,
        description,
        notes,
        created_by,
        created_at,
        updated_at
      `,
      [
        vehicle_id,
        kpi_id,
        sub_kpi_id || null,
        entry_at,
        description || null,
        notes || null,
        created_by || null,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        message: "Maintenance created successfully",
        data: insertResult.rows[0],
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "POST /api/maintenance error:",
      error
    );

    const pgError = error as {
      code?: string;
      detail?: string;
      message?: string;
    };

    if (pgError.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          error: "Vehicle is already in maintenance",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create maintenance record",
        detail: pgError.message,
      },
      {
        status: 500,
      }
    );
  } finally {
    client.release();
  }
}