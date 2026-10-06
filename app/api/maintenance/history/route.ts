import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

/**
 * GET
 * Maintenance History
 *
 * Supports:
 * - vehicle_id
 * - kpi_id
 * - sub_kpi_id
 * - status
 * - date_from
 * - date_to
 *
 * Multiple maintenance records per vehicle are supported.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const vehicleId = searchParams.get("vehicle_id");
    const kpiId = searchParams.get("kpi_id");
    const subKpiId = searchParams.get("sub_kpi_id");
    const status = searchParams.get("status");

    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const conditions: string[] = [];
    const values: unknown[] = [];

    // =====================================================
    // Vehicle
    // =====================================================

    if (vehicleId) {
      const parsedVehicleId = Number(vehicleId);

      if (
        !Number.isInteger(parsedVehicleId) ||
        parsedVehicleId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid vehicle_id",
          },
          { status: 400 }
        );
      }

      values.push(parsedVehicleId);

      conditions.push(
        `mr.vehicle_id = $${values.length}`
      );
    }

    // =====================================================
    // KPI
    // =====================================================

    if (kpiId) {
      const parsedKpiId = Number(kpiId);

      if (
        !Number.isInteger(parsedKpiId) ||
        parsedKpiId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid kpi_id",
          },
          { status: 400 }
        );
      }

      values.push(parsedKpiId);

      conditions.push(
        `mr.kpi_id = $${values.length}`
      );
    }

    // =====================================================
    // Sub KPI
    // =====================================================

    if (subKpiId) {
      const parsedSubKpiId = Number(subKpiId);

      if (
        !Number.isInteger(parsedSubKpiId) ||
        parsedSubKpiId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid sub_kpi_id",
          },
          { status: 400 }
        );
      }

      values.push(parsedSubKpiId);

      conditions.push(
        `mr.sub_kpi_id = $${values.length}`
      );
    }

    // =====================================================
    // Status
    // =====================================================

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

   // =====================================================
// Date Range
// =====================================================

if (dateFrom) {
  values.push(dateFrom);

  conditions.push(`
    (
      mr.exit_at IS NULL
      OR
      mr.exit_at >= (
        $${values.length}::date
        AT TIME ZONE 'Asia/Amman'
      )
    )
  `);
}

if (dateTo) {
  values.push(dateTo);

  conditions.push(`
    mr.entry_at < (
      ($${values.length}::date + INTERVAL '1 day')
      AT TIME ZONE 'Asia/Amman'
    )
  `);
}

    // =====================================================
    // WHERE
    // =====================================================

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    // =====================================================
    // QUERY
    // =====================================================

    const result = await pool.query(
      `
      SELECT
        mr.id,

        -- =================================================
        -- VEHICLE
        -- =================================================

        v.id AS vehicle_id,
        v.plate_number,
        v.plate_number,
        v.type as vehicle_type,

        v.weight,
        v.capacity,
        v.manufacture_year,
        v.model,

        -- =================================================
        -- AREA
        -- =================================================

        ar.id AS area_id,
        ar.name AS area,

        -- =================================================
        -- MAINTENANCE TYPE
        -- =================================================

        k.id AS kpi_id,
        k.name AS kpi_name,

        -- =================================================
        -- SUB MAINTENANCE TYPE
        -- =================================================

        sk.id AS sub_kpi_id,
        sk.name AS sub_kpi_name,

        -- =================================================
        -- MAINTENANCE LOCATION
        -- =================================================

        mr.maintenance_location,

        -- =================================================
        -- MAINTENANCE DATES
        -- =================================================

        mr.entry_at,
        mr.exit_at,

        -- =================================================
        -- DURATION
        -- =================================================

        CASE
          WHEN mr.exit_at IS NULL
            THEN NOW() - mr.entry_at
          ELSE
            mr.exit_at - mr.entry_at
        END AS duration,

        -- =================================================
        -- STATUS
        -- =================================================

        CASE
          WHEN mr.exit_at IS NULL
            THEN 'open'
          ELSE
            'closed'
        END AS status,

        -- =================================================
        -- DETAILS
        -- =================================================

        mr.description,
        mr.notes,

        /*
         * Read cost safely.
         *
         * If the cost column exists, its value is returned.
         * If it does not exist, this expression returns NULL
         * instead of causing the entire query to fail.
         */
        to_jsonb(mr) -> 'cost' AS cost,

        -- =================================================
        -- AUDIT
        -- =================================================

        mr.created_by,
        mr.updated_by,

        mr.created_at,
        mr.updated_at

      FROM maintenance_records mr

      INNER JOIN vehicles v
        ON v.id = mr.vehicle_id

      LEFT JOIN areas ar
        ON ar.id = v.area_id

      INNER JOIN maintenance_kpis k
        ON k.id = mr.kpi_id

      LEFT JOIN maintenance_sub_kpis sk
        ON sk.id = mr.sub_kpi_id

      ${whereClause}

      ORDER BY
        mr.entry_at DESC,
        mr.id DESC
      `,
      values
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error(
      "GET /api/maintenance/history error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to load maintenance history",

        code: error?.code || null,

        detail: error?.detail || null,

        hint: error?.hint || null,

        table: error?.table || null,

        column: error?.column || null,

        constraint: error?.constraint || null,
      },
      {
        status: 500,
      }
    );
  }
}