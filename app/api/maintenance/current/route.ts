import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const vehicleId = searchParams.get("vehicle_id");
    const date = searchParams.get("date");

    const values: string[] = [];
    const conditions: string[] = [];

    // Vehicle filter
    if (vehicleId) {
      values.push(vehicleId);

      conditions.push(`
        mr.vehicle_id = $${values.length}
      `);
    }

    // Only currently open maintenance
    conditions.push(`
      mr.exit_at IS NULL
    `);

    // Optional date filter
    if (date) {
      values.push(date);

      conditions.push(`
        mr.entry_at < ($${values.length}::date + INTERVAL '1 day')
        AND mr.entry_at >= $${values.length}::date
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
      "GET /api/maintenance/current error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load current maintenance",
      },
      {
        status: 500,
      }
    );
  }
}