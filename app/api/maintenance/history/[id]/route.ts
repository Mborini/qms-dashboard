import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const maintenanceId = Number(id);

    if (!Number.isInteger(maintenanceId) || maintenanceId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid maintenance record ID",
        },
        {
          status: 400,
        }
      );
    }

    // التأكد أن السجل موجود
    const existingRecord = await pool.query(
      `
      SELECT
        id,
        vehicle_id,
        entry_at,
        exit_at
      FROM maintenance_records
      WHERE id = $1
      `,
      [maintenanceId]
    );

    if (existingRecord.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Maintenance record not found",
        },
        {
          status: 404,
        }
      );
    }

    // حذف السجل
    const result = await pool.query(
      `
      DELETE FROM maintenance_records
      WHERE id = $1
      RETURNING id
      `,
      [maintenanceId]
    );

    return NextResponse.json({
      success: true,
      message: "Maintenance record deleted successfully",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error(
      "DELETE /api/maintenance/history/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete maintenance record",
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