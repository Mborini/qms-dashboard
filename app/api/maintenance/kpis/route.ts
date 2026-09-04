import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

/* =========================================================
   GET
   جلب جميع KPIs مع Sub KPIs التابعة لها
   ========================================================= */
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        k.id AS kpi_id,
        k.name AS kpi_name,
        sk.id AS sub_kpi_id,
        sk.name AS sub_kpi_name,
        sk.kpi_id AS sub_kpi_parent_id
      FROM maintenance_kpis k
      LEFT JOIN maintenance_sub_kpis sk
        ON sk.kpi_id = k.id
      ORDER BY
        k.id ASC,
        sk.id ASC
    `);

    console.log("MAINTENANCE KPIS:", result.rows);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("GET /api/maintenance/kpis ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load KPIs",
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
   إضافة KPI جديد

   Body:
   {
     name: string,
     description?: string
   }
   ========================================================= */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    /* -----------------------------------------------------
       التحقق من الاسم
       ----------------------------------------------------- */
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "اسم KPI مطلوب",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       منع تكرار اسم KPI
       ----------------------------------------------------- */
    const duplicate = await pool.query(
      `
      SELECT id
      FROM maintenance_kpis
      WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
      LIMIT 1
      `,
      [name]
    );

    if (duplicate.rowCount && duplicate.rowCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "يوجد KPI بنفس الاسم مسبقًا",
        },
        {
          status: 409,
        }
      );
    }

    /* -----------------------------------------------------
       إضافة KPI
       بدون is_active
       ----------------------------------------------------- */
    const result = await pool.query(
      `
      INSERT INTO maintenance_kpis (
        name,
        description,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        NOW(),
        NOW()
      )
      RETURNING
        id,
        name,
        description,
        created_at,
        updated_at
      `,
      [
        name,
        description || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "تمت إضافة KPI بنجاح",
        data: result.rows[0],
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST /api/maintenance/kpis ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create KPI",
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
   تعديل KPI

   Body:
   {
     id: number,
     name?: string,
     description?: string | null
   }
   ========================================================= */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const id = Number(body.id);

    /* -----------------------------------------------------
       التحقق من ID
       ----------------------------------------------------- */
    if (!Number.isInteger(id) || id <= 0) {
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

    /* -----------------------------------------------------
       التأكد أن KPI موجود
       ----------------------------------------------------- */
    const existing = await pool.query(
      `
      SELECT
        id,
        name,
        description
      FROM maintenance_kpis
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (existing.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "KPI غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    const current = existing.rows[0];

    let name = current.name;
    let description = current.description;

    /* -----------------------------------------------------
       الاسم
       ----------------------------------------------------- */
    if (body.name !== undefined) {
      if (typeof body.name !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "اسم KPI غير صالح",
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
            error: "اسم KPI مطلوب",
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------------------------------------------
         منع تكرار الاسم
         --------------------------------------------------- */
      const duplicate = await pool.query(
        `
        SELECT id
        FROM maintenance_kpis
        WHERE
          LOWER(TRIM(name)) = LOWER(TRIM($1))
          AND id <> $2
        LIMIT 1
        `,
        [
          name,
          id,
        ]
      );

      if (duplicate.rowCount && duplicate.rowCount > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "يوجد KPI آخر بنفس الاسم",
          },
          {
            status: 409,
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
       تحديث KPI
       بدون is_active
       ----------------------------------------------------- */
    const result = await pool.query(
      `
      UPDATE maintenance_kpis
      SET
        name = $1,
        description = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING
        id,
        name,
        description,
        created_at,
        updated_at
      `,
      [
        name,
        description,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "تم تحديث KPI بنجاح",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("PATCH /api/maintenance/kpis ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update KPI",
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
   حذف KPI نهائياً من قاعدة البيانات

   DELETE /api/maintenance/kpis?id=1

   قبل الحذف:
   1. نتأكد أن KPI موجود.
   2. نتأكد أنه غير مستخدم في maintenance_records.
   3. نحذف جميع Sub KPIs التابعة له.
   4. نحذف KPI نفسه.
   
   العملية كلها Transaction.
   ========================================================= */
export async function DELETE(request: NextRequest) {
  const client = await pool.connect();

  try {
    const { searchParams } = new URL(request.url);

    const id = Number(searchParams.get("id"));

    /* -----------------------------------------------------
       التحقق من ID
       ----------------------------------------------------- */
    if (!Number.isInteger(id) || id <= 0) {
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

    /* -----------------------------------------------------
       بداية Transaction
       ----------------------------------------------------- */
    await client.query("BEGIN");

    /* -----------------------------------------------------
       التأكد أن KPI موجود
       ----------------------------------------------------- */
    const kpiResult = await client.query(
      `
      SELECT
        id,
        name
      FROM maintenance_kpis
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (kpiResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          error: "KPI غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    const kpi = kpiResult.rows[0];

    /* -----------------------------------------------------
       فحص استخدام KPI في سجلات الصيانة
       ----------------------------------------------------- */
    const usageResult = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM maintenance_records
      WHERE kpi_id = $1
      `,
      [id]
    );

    const usageCount = Number(
      usageResult.rows[0]?.count ?? 0
    );

    /* -----------------------------------------------------
       إذا كان KPI مستخدم لا نحذفه
       ----------------------------------------------------- */
    if (usageCount > 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          error:
            "لا يمكن حذف KPI لأنه مستخدم في سجلات الصيانة",
          usage_count: usageCount,
        },
        {
          status: 409,
        }
      );
    }

    /* -----------------------------------------------------
       حذف جميع Sub KPIs التابعة
       ----------------------------------------------------- */
    const subKpiDeleteResult = await client.query(
      `
      DELETE FROM maintenance_sub_kpis
      WHERE kpi_id = $1
      RETURNING id, name
      `,
      [id]
    );

    /* -----------------------------------------------------
       حذف KPI الرئيسي
       ----------------------------------------------------- */
    const deleteResult = await client.query(
      `
      DELETE FROM maintenance_kpis
      WHERE id = $1
      RETURNING
        id,
        name
      `,
      [id]
    );

    /* -----------------------------------------------------
       تأكيد Transaction
       ----------------------------------------------------- */
    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "تم حذف KPI وجميع Sub KPIs التابعة له بنجاح",
      data: deleteResult.rows[0],
      deleted_sub_kpis: subKpiDeleteResult.rows.length,
    });
  } catch (error) {
    /* -----------------------------------------------------
       Rollback عند حدوث خطأ
       ----------------------------------------------------- */
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback error
    }

    console.error(
      "DELETE /api/maintenance/kpis ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete KPI",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  } finally {
    client.release();
  }
}