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

    // =========================================
    // قراءة البيانات
    // =========================================
    const body = await request.json();

    const { exit_at, notes, updated_by } = body;

    // =========================================
    // Validation
    // =========================================
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Maintenance record ID is required",
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

    if (!updated_by) {
      return NextResponse.json(
        {
          success: false,
          error: "updated_by is required",
        },
        { status: 400 }
      );
    }

    // =========================================
    // التحقق من التاريخ
    // =========================================
    const exitDate = new Date(exit_at);

    if (Number.isNaN(exitDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid exit_at date",
        },
        { status: 400 }
      );
    }

    // =========================================
    // منع تاريخ الخروج بالمستقبل
    // =========================================
    if (exitDate.getTime() > Date.now()) {
      return NextResponse.json(
        {
          success: false,
          error: "Exit date cannot be in the future",
        },
        { status: 400 }
      );
    }

    // =========================================
    // جلب سجل الصيانة
    // =========================================
    const existingResult = await pool.query(
      `
      SELECT
        id,
        vehicle_id,
        entry_at,
        exit_at
      FROM maintenance_records
      WHERE id = $1
      `,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Maintenance record not found",
        },
        { status: 404 }
      );
    }

    const existingRecord = existingResult.rows[0];

    // =========================================
    // التأكد أن السجل غير مغلق
    // =========================================
    if (existingRecord.exit_at) {
      return NextResponse.json(
        {
          success: false,
          error: "Maintenance record is already closed",
        },
        { status: 400 }
      );
    }

    // =========================================
    // التحقق أن الخروج بعد الدخول
    // =========================================
    if (existingRecord.entry_at) {
      const entryDate = new Date(existingRecord.entry_at);

      if (
        !Number.isNaN(entryDate.getTime()) &&
        exitDate.getTime() < entryDate.getTime()
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Exit date cannot be before entry date",
          },
          { status: 400 }
        );
      }
    }

    // =========================================
    // تحديث سجل الصيانة
    // =========================================
    const result = await pool.query(
      `
      UPDATE maintenance_records

      SET
        exit_at = $1,

        notes =
          CASE
            WHEN $2::text IS NULL
              OR TRIM($2::text) = ''
            THEN notes
            ELSE $2
          END,

        updated_by = $3,
        updated_at = NOW()

      WHERE id = $4

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
        updated_by,
        id,
      ]
    );

    // =========================================
    // التأكد أن التحديث تم
    // =========================================
    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to close maintenance record",
        },
        { status: 500 }
      );
    }

    // =========================================
    // Response
    // =========================================
    return NextResponse.json({
      success: true,
      message: "Maintenance record closed successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("PATCH /api/maintenance/[id]/exit error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}