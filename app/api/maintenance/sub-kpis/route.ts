import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

/* =========================================================
   GET
   جلب جميع Sub KPIs
   أو جلب Sub KPIs الخاصة بـ KPI معين:

   GET /api/maintenance/sub-kpis
   GET /api/maintenance/sub-kpis?kpi_id=1
   ========================================================= */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const kpiIdParam = searchParams.get("kpi_id");

    const values: number[] = [];
    let whereClause = "";

    if (kpiIdParam !== null) {
      const kpiId = Number(kpiIdParam);

      if (!Number.isInteger(kpiId) || kpiId <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "معرف KPI غير صالح",
          },
          {
            status: 400,
          }
        );
      }

      values.push(kpiId);
      whereClause = `WHERE sk.kpi_id = $1`;
    }

    const result = await pool.query(
      `
      SELECT
        sk.id,
        sk.kpi_id,
        sk.name,
        sk.description,
        sk.created_at,
        sk.updated_at,
        k.name AS kpi_name
      FROM maintenance_sub_kpis sk
      INNER JOIN maintenance_kpis k
        ON k.id = sk.kpi_id
      ${whereClause}
      ORDER BY
        sk.kpi_id ASC,
        sk.id ASC
      `,
      values
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(
      "GET /api/maintenance/sub-kpis ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load Sub KPIs",
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

/* =========================================================
   POST
   إضافة Sub KPI

   Body:
   {
     kpi_id: number,
     name: string,
     description?: string
   }
   ========================================================= */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const kpiId = Number(body.kpi_id);

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    /* -----------------------------------------------------
       التحقق من KPI
       ----------------------------------------------------- */
    if (!Number.isInteger(kpiId) || kpiId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "يجب تحديد KPI صحيح",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       التحقق من الاسم
       ----------------------------------------------------- */
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "اسم Sub KPI مطلوب",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       التأكد أن KPI الأب موجود
       ----------------------------------------------------- */
    const kpiResult = await pool.query(
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

    if (kpiResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "KPI الأب غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    /* -----------------------------------------------------
       منع تكرار الاسم تحت نفس KPI
       ----------------------------------------------------- */
    const duplicate = await pool.query(
      `
      SELECT id
      FROM maintenance_sub_kpis
      WHERE
        kpi_id = $1
        AND LOWER(TRIM(name)) = LOWER(TRIM($2))
      LIMIT 1
      `,
      [kpiId, name]
    );

    if (duplicate.rowCount && duplicate.rowCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "يوجد Sub KPI بنفس الاسم تحت هذا KPI",
        },
        {
          status: 409,
        }
      );
    }

    /* -----------------------------------------------------
       إضافة Sub KPI
       ----------------------------------------------------- */
    const result = await pool.query(
      `
      INSERT INTO maintenance_sub_kpis (
        kpi_id,
        name,
        description,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        NOW(),
        NOW()
      )
      RETURNING
        id,
        kpi_id,
        name,
        description,
        created_at,
        updated_at
      `,
      [
        kpiId,
        name,
        description || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "تمت إضافة Sub KPI بنجاح",
        data: result.rows[0],
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/maintenance/sub-kpis ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create Sub KPI",
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

/* =========================================================
   PATCH
   تعديل Sub KPI

   Body:
   {
     id: number,
     kpi_id?: number,
     name?: string,
     description?: string | null
   }
   ========================================================= */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "معرف Sub KPI غير صالح",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       جلب البيانات الحالية
       ----------------------------------------------------- */
    const existing = await pool.query(
      `
      SELECT
        id,
        kpi_id,
        name,
        description
      FROM maintenance_sub_kpis
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (existing.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Sub KPI غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    const current = existing.rows[0];

    let kpiId = current.kpi_id;
    let name = current.name;
    let description = current.description;

    /* -----------------------------------------------------
       KPI الأب
       ----------------------------------------------------- */
    if (body.kpi_id !== undefined) {
      const newKpiId = Number(body.kpi_id);

      if (!Number.isInteger(newKpiId) || newKpiId <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "معرف KPI الأب غير صالح",
          },
          {
            status: 400,
          }
        );
      }

      const kpiResult = await pool.query(
        `
        SELECT
          id,
          name
        FROM maintenance_kpis
        WHERE id = $1
        LIMIT 1
        `,
        [newKpiId]
      );

      if (kpiResult.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "KPI الأب غير موجود",
          },
          {
            status: 404,
          }
        );
      }

      kpiId = newKpiId;
    }

    /* -----------------------------------------------------
       الاسم
       ----------------------------------------------------- */
    if (body.name !== undefined) {
      if (typeof body.name !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "اسم Sub KPI غير صالح",
          },
          {
            status: 400,
          }
        );
      }

      name = body.name.trim();

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            error: "اسم Sub KPI مطلوب",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* -----------------------------------------------------
       الوصف
       ----------------------------------------------------- */
    if (body.description !== undefined) {
      if (
        body.description !== null &&
        typeof body.description !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "الوصف غير صالح",
          },
          {
            status: 400,
          }
        );
      }

      description =
        typeof body.description === "string"
          ? body.description.trim() || null
          : null;
    }

    /* -----------------------------------------------------
       منع تكرار الاسم تحت نفس KPI
       ----------------------------------------------------- */
    const duplicate = await pool.query(
      `
      SELECT id
      FROM maintenance_sub_kpis
      WHERE
        kpi_id = $1
        AND LOWER(TRIM(name)) = LOWER(TRIM($2))
        AND id <> $3
      LIMIT 1
      `,
      [
        kpiId,
        name,
        id,
      ]
    );

    if (duplicate.rowCount && duplicate.rowCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "يوجد Sub KPI آخر بنفس الاسم تحت هذا KPI",
        },
        {
          status: 409,
        }
      );
    }

    /* -----------------------------------------------------
       تحديث Sub KPI
       ----------------------------------------------------- */
    const result = await pool.query(
      `
      UPDATE maintenance_sub_kpis
      SET
        kpi_id = $1,
        name = $2,
        description = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING
        id,
        kpi_id,
        name,
        description,
        created_at,
        updated_at
      `,
      [
        kpiId,
        name,
        description,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "تم تحديث Sub KPI بنجاح",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(
      "PATCH /api/maintenance/sub-kpis ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update Sub KPI",
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

/* =========================================================
   DELETE
   حذف Sub KPI نهائياً من قاعدة البيانات

   DELETE /api/maintenance/sub-kpis?id=1

   قبل الحذف:
   - نتأكد أنه موجود.
   - نتأكد أنه غير مستخدم في maintenance_records.
   ========================================================= */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "معرف Sub KPI غير صالح",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       التأكد أن Sub KPI موجود
       ----------------------------------------------------- */
    const existing = await pool.query(
      `
      SELECT
        id,
        kpi_id,
        name
      FROM maintenance_sub_kpis
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (existing.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Sub KPI غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    /* -----------------------------------------------------
       فحص استخدام Sub KPI في سجلات الصيانة
       ----------------------------------------------------- */
    const usageResult = await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM maintenance_records
      WHERE sub_kpi_id = $1
      `,
      [id]
    );

    const usageCount = Number(
      usageResult.rows[0]?.count ?? 0
    );

    /* -----------------------------------------------------
       إذا كان مستخدم في سجلات الصيانة لا نحذفه
       ----------------------------------------------------- */
    if (usageCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "لا يمكن حذف Sub KPI لأنه مستخدم في سجلات الصيانة",
          usage_count: usageCount,
        },
        {
          status: 409,
        }
      );
    }

    /* -----------------------------------------------------
       حذف فعلي من الداتابيز
       ----------------------------------------------------- */
    const result = await pool.query(
      `
      DELETE FROM maintenance_sub_kpis
      WHERE id = $1
      RETURNING
        id,
        kpi_id,
        name
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "فشل حذف Sub KPI",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف Sub KPI نهائياً من قاعدة البيانات",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(
      "DELETE /api/maintenance/sub-kpis ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete Sub KPI",
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