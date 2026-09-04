import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    const body = await request.json();

    const { exit_at, notes } = body;

    // =========================
    // Validation
    // =========================

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Maintenance ID is required",
        },
        { status: 400 }
      );
    }

    if (!exit_at) {
      return NextResponse.json(
        {
          success: false,
          error: "exit_at is required",
        },
        { status: 400 }
      );
    }

    // =========================
    // Parse exit date
    // =========================

    const exitDate = new Date(exit_at);

    if (Number.isNaN(exitDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid exit_at",
        },
        { status: 400 }
      );
    }

    // =========================
    // Future check
    // =========================

    if (exitDate.getTime() > Date.now()) {
      return NextResponse.json(
        {
          success: false,
          error: "Exit date/time cannot be in the future",
        },
        { status: 400 }
      );
    }

    // =========================
    // Get maintenance record
    // =========================

    const maintenanceResult = await pool.query(
      `
      SELECT
        id,
        vehicle_id,
        entry_at,
        exit_at
      FROM maintenance_records
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (maintenanceResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Maintenance record not found",
        },
        { status: 404 }
      );
    }

    const maintenance = maintenanceResult.rows[0];

    // =========================
    // Already closed
    // =========================

    if (maintenance.exit_at) {
      return NextResponse.json(
        {
          success: false,
          error: "Maintenance record is already closed",
        },
        { status: 409 }
      );
    }

    // =========================
    // Check exit >= entry
    // =========================

    const entryDate = new Date(maintenance.entry_at);

    if (Number.isNaN(entryDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid maintenance entry date",
        },
        { status: 500 }
      );
    }

    if (exitDate.getTime() < entryDate.getTime()) {
      return NextResponse.json(
        {
          success: false,
          error: "Exit date/time cannot be before entry date/time",
        },
        { status: 400 }
      );
    }

    // =========================
    // Update
    // =========================

    const result = await pool.query(
      `
      UPDATE maintenance_records

      SET
        exit_at = $1,
        notes =
          CASE
            WHEN $2::text IS NULL
              OR $2::text = ''
            THEN notes
            ELSE $2
          END,
        updated_at = NOW()

      WHERE id = $3

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
        updated_by,
        created_at,
        updated_at
      `,
      [
        exitDate.toISOString(),
        notes?.trim() || null,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Maintenance record closed successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error(
      "PATCH /api/maintenance/[id]/exit error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to close maintenance record",
      },
      { status: 500 }
    );
  }
}