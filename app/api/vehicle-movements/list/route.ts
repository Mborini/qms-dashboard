import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { pool } from "@/app/lib/db";
import { authOptions } from "@/app/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    // =========================================
    // Authentication
    // =========================================

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "غير مصرح لك بالوصول.",
        },
        { status: 401 }
      );
    }

    const userId = Number(session.user.id);

    if (!Number.isInteger(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: "بيانات المستخدم غير صحيحة.",
        },
        { status: 401 }
      );
    }

    // =========================================
    // Get current user information
    // =========================================

    const userResult = await pool.query(
      `
      SELECT
        u.id,
        u.area_id,
        u.role_id,
        a.name AS area_name

      FROM users u

      LEFT JOIN areas a
        ON a.id = u.area_id
        AND a.is_deleted = false

      WHERE u.id = $1

      LIMIT 1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "المستخدم غير موجود.",
        },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    const userAreaId =
      user.area_id !== null
        ? Number(user.area_id)
        : null;

    const userAreaName =
      user.area_name || null;

    const roleId = Number(user.role_id);

    // =========================================
    // Admin
    // role_id = 1
    // =========================================

    const isAdmin = roleId === 1;

    // =========================================
    // Normal user must have an area
    // =========================================

    if (!isAdmin && userAreaId === null) {
      return NextResponse.json(
        {
          success: false,
          error: "المستخدم غير مرتبط بمنطقة.",
        },
        { status: 403 }
      );
    }

    // =========================================
    // Get vehicle movements
    // =========================================
    //
    // Admin:
    //   sees ALL areas
    //
    // Normal user:
    //   sees ONLY vehicles belonging
    //   to his/her area.
    //
    // IMPORTANT:
    // created_by is NOT used for filtering.
    // work_route is NOT used for area filtering.
    // =========================================

    const result = await pool.query(
      `
      SELECT
        vm.id,

        TO_CHAR(
          vm.movement_date,
          'YYYY-MM-DD'
        ) AS movement_date,

        vm.shift,
        vm.vehicle_id,
        vm.work_route,
        vm.driver_name,

        vm.created_by,
        vm.created_at,

        v.plate_number,
        v.capacity,
        v.model,
        v.type,

        a.id AS area_id,
        a.name AS area_name,

        creator.name AS created_by_name,
        creator.username AS created_by_username

      FROM vehicle_movements vm

      INNER JOIN vehicles v
        ON v.id = vm.vehicle_id

      INNER JOIN areas a
        ON a.id = v.area_id

      INNER JOIN users creator
        ON creator.id = vm.created_by

      WHERE
        a.is_deleted = false

        AND (
          $1 = true
          OR v.area_id = $2
        )

      ORDER BY
        vm.movement_date DESC,
        vm.created_at DESC
      `,
      [
        isAdmin,
        userAreaId,
      ]
    );

    // =========================================
    // Response
    // =========================================

    return NextResponse.json({
      success: true,

      area: isAdmin
        ? {
            id: null,
            name: "جميع المناطق",
          }
        : {
            id: userAreaId,
            name: userAreaName,
          },

      isAdmin,

      data: result.rows,
    });
  } catch (error) {
    console.error(
      "GET /api/vehicle-movements/list error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "حدث خطأ أثناء تحميل حركات السيارات.",
      },
      { status: 500 }
    );
  }
}