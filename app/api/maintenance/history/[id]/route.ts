import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getMaintenanceId(value: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

/**
 * DELETE
 * حذف سجل الصيانة بالكامل
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const maintenanceId = getMaintenanceId(id);

    if (!maintenanceId) {
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
        exit_at,
        cost
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

    // حذف سجل الصيانة
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

/**
 * PATCH
 * إضافة / تعديل تكلفة الصيانة
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const maintenanceId = getMaintenanceId(id);

    if (!maintenanceId) {
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

    const body = await request.json();

    const rawCost = body?.cost;

    /*
     * السماح بـ:
     * null       -> إزالة التكلفة
     * ""         -> إزالة التكلفة
     * رقم        -> حفظ التكلفة
     */

    let cost: number | null;

    if (
      rawCost === null ||
      rawCost === undefined ||
      rawCost === ""
    ) {
      cost = null;
    } else {
      cost = Number(rawCost);

      if (
        !Number.isFinite(cost) ||
        cost < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "قيمة التكلفة غير صحيحة",
          },
          {
            status: 400,
          }
        );
      }
    }

    // التأكد أن سجل الصيانة موجود
    const existingRecord = await pool.query(
      `
      SELECT
        id,
        vehicle_id,
        cost
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

    // تحديث التكلفة
    const result = await pool.query(
      `
      UPDATE maintenance_records
      SET
        cost = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING
        id,
        cost,
        updated_at
      `,
      [
        cost,
        maintenanceId,
      ]
    );

    return NextResponse.json({
      success: true,
      message:
        cost === null
          ? "تم إزالة تكلفة الصيانة بنجاح"
          : "تم حفظ تكلفة الصيانة بنجاح",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(
      "PATCH /api/maintenance/history/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update maintenance cost",
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