import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const vehicleId = searchParams.get("vehicle_id");
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (vehicleId) {
      values.push(Number(vehicleId));

      conditions.push(
        `mr.vehicle_id = $${values.length}`
      );
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
        DATE(
          mr.entry_at AT TIME ZONE 'Asia/Amman'
        ) = $${values.length}::date
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

        mr.vehicle_id,
        mr.kpi_id,
        mr.sub_kpi_id,

        mr.entry_at,
        mr.exit_at,

        mr.description,
        mr.notes,

        mr.maintenance_location,

        mr.created_by,
        mr.created_at,

        mr.updated_by,
        mr.updated_at,

        v.plate_number,
        v.type as vehicle_type,
        v.plate_number,
        v.weight,
        v.capacity,
        v.manufacture_year,
        v.model,

        ar.name AS area,

        k.name AS kpi_name,

        sk.name AS sub_kpi_name,

        CASE
          WHEN mr.exit_at IS NULL
            THEN NOW() - mr.entry_at
          ELSE
            mr.exit_at - mr.entry_at
        END AS duration

      FROM maintenance_records mr

      LEFT JOIN vehicles v
        ON v.id = mr.vehicle_id

      LEFT JOIN areas ar
        ON ar.id = v.area_id

      LEFT JOIN maintenance_kpis k
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
    });
  } catch (error: any) {
    console.error(
      "GET /api/maintenance error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to load maintenance records",
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
      maintenance_types,
      entry_at,
      maintenance_location,
      description,
      notes,
      created_by,
    } = body;

    // =====================================================
    // Validation
    // =====================================================

    if (!vehicle_id) {
      return NextResponse.json(
        {
          success: false,
          error: "vehicle_id is required",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(maintenance_types) ||
      maintenance_types.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "maintenance_types must contain at least one maintenance type",
        },
        { status: 400 }
      );
    }

    if (!maintenance_location?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "maintenance_location is required",
        },
        { status: 400 }
      );
    }

    if (!entry_at) {
      return NextResponse.json(
        {
          success: false,
          error: "entry_at is required",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Parse entry date
    // =====================================================

    const entryDate = new Date(entry_at);

    if (Number.isNaN(entryDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid entry_at",
        },
        { status: 400 }
      );
    }

    if (entryDate.getTime() > Date.now()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Entry date/time cannot be in the future",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Validate maintenance types structure
    // =====================================================

    for (const type of maintenance_types) {
      if (!type?.kpi_id) {
        return NextResponse.json(
          {
            success: false,
            error:
              "kpi_id is required for every maintenance type",
          },
          { status: 400 }
        );
      }

      if (!type?.sub_kpi_id) {
        return NextResponse.json(
          {
            success: false,
            error:
              "sub_kpi_id is required for every maintenance type",
          },
          { status: 400 }
        );
      }
    }

    // =====================================================
    // Prevent duplicate types inside same request
    // =====================================================

    const combinations = maintenance_types.map(
      (type: any) =>
        `${Number(type.kpi_id)}-${Number(type.sub_kpi_id)}`
    );

    if (
      new Set(combinations).size !==
      combinations.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Duplicate maintenance types are not allowed",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // Start transaction
    // =====================================================

    await client.query("BEGIN");

    // =====================================================
    // Check vehicle
    // =====================================================

    const vehicleResult = await client.query(
      `
      SELECT
        id,
        plate_number
      FROM vehicles
      WHERE id = $1
      LIMIT 1
      `,
      [Number(vehicle_id)]
    );

    if (vehicleResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          error: "Vehicle not found",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // Validate every KPI + Sub KPI
    // =====================================================

    const validatedTypes: {
      kpi_id: number;
      sub_kpi_id: number;
      kpi_name: string | null;
      sub_kpi_name: string | null;
    }[] = [];

    for (const type of maintenance_types) {
      const kpiId = Number(type.kpi_id);
      const subKpiId = Number(type.sub_kpi_id);

      // -----------------------------------------------
      // Check KPI
      // -----------------------------------------------

      const kpiResult = await client.query(
        `
        SELECT
          id,
          name
        FROM maintenance_kpis
        WHERE id = $1
        LIMIT 1
        `,
        [kpiId]
      );

      if (kpiResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          {
            success: false,
            error: `KPI ${kpiId} not found`,
          },
          { status: 404 }
        );
      }

      // -----------------------------------------------
      // Check Sub KPI
      // -----------------------------------------------

      const subKpiResult =
        await client.query(
          `
          SELECT
            id,
            name,
            kpi_id
          FROM maintenance_sub_kpis
          WHERE id = $1
            AND kpi_id = $2
          LIMIT 1
          `,
          [
            subKpiId,
            kpiId,
          ]
        );

      if (subKpiResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          {
            success: false,
            error:
              `Sub KPI ${subKpiId} does not belong to KPI ${kpiId}`,
          },
          { status: 400 }
        );
      }

      validatedTypes.push({
        kpi_id: kpiId,
        sub_kpi_id: subKpiId,
        kpi_name:
          kpiResult.rows[0].name ?? null,
        sub_kpi_name:
          subKpiResult.rows[0].name ?? null,
      });
    }

    // =====================================================
    // Check existing exact open maintenance
    //
    // Same vehicle + same KPI + same Sub KPI +
    // same location cannot be opened twice.
    //
    // BUT:
    // Different maintenance types ARE allowed.
    // =====================================================

    for (const type of validatedTypes) {
      const duplicateResult =
        await client.query(
          `
          SELECT
            id
          FROM maintenance_records
          WHERE vehicle_id = $1
            AND kpi_id = $2
            AND sub_kpi_id = $3
            AND maintenance_location = $4
            AND exit_at IS NULL
          LIMIT 1
          `,
          [
            Number(vehicle_id),
            type.kpi_id,
            type.sub_kpi_id,
            maintenance_location.trim(),
          ]
        );

      if (duplicateResult.rows.length > 0) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          {
            success: false,
            error:
              "This maintenance type is already open for this vehicle at the same location",
            maintenance_id:
              duplicateResult.rows[0].id,
            kpi_id: type.kpi_id,
            sub_kpi_id: type.sub_kpi_id,
          },
          { status: 409 }
        );
      }
    }

    // =====================================================
    // Insert all maintenance types
    // =====================================================

    const createdRecords = [];

    for (const type of validatedTypes) {
      const insertResult =
        await client.query(
          `
          INSERT INTO maintenance_records (
            vehicle_id,
            kpi_id,
            sub_kpi_id,
            entry_at,
            maintenance_location,
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
            $7,
            $8
          )
          RETURNING
            id,
            vehicle_id,
            kpi_id,
            sub_kpi_id,
            entry_at,
            exit_at,
            maintenance_location,
            description,
            notes,
            created_by,
            created_at,
            updated_by,
            updated_at
          `,
          [
            Number(vehicle_id),

            type.kpi_id,

            type.sub_kpi_id,

            entryDate.toISOString(),

            maintenance_location.trim(),

            description?.trim() || null,

            notes?.trim() || null,

            created_by?.trim() || null,
          ]
        );

      createdRecords.push(
        insertResult.rows[0]
      );
    }

    // =====================================================
    // Commit
    // =====================================================

    await client.query("COMMIT");

    // =====================================================
    // Success
    // =====================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Maintenance records created successfully",

        count: createdRecords.length,

        data: createdRecords,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    try {
      await client.query("ROLLBACK");
    } catch {}

    console.error(
      "POST /api/maintenance error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Failed to create maintenance records",
      },
      {
        status: 500,
      }
    );
  } finally {
    client.release();
  }
}