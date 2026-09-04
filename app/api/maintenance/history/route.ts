import { NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        mr.id,

        -- VEHICLE
        v.id AS vehicle_id,
        v.plate_number,
        v.weight,
        v.capacity,
        v.manufacture_year,
        v.model,
        v.area,

        -- KPI
        k.id AS kpi_id,
        k.name AS kpi_name,

        -- SUB KPI
        sk.id AS sub_kpi_id,
        sk.name AS sub_kpi_name,

        -- MAINTENANCE
        mr.entry_at,
        mr.exit_at,

        CASE
          WHEN mr.exit_at IS NULL
          THEN NOW() - mr.entry_at
          ELSE mr.exit_at - mr.entry_at
        END AS duration,

        CASE
          WHEN mr.exit_at IS NULL
          THEN 'open'
          ELSE 'closed'
        END AS status,

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

      INNER JOIN maintenance_sub_kpis sk
        ON sk.id = mr.sub_kpi_id

      ORDER BY
        mr.created_at DESC,
        mr.id DESC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(
      "GET /api/maintenance/history error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load maintenance history",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}