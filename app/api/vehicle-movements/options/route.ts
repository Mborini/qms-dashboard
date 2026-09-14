import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { pool } from "@/app/lib/db";
import { authOptions } from "@/app/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    // =========================
    // Authentication
    // =========================
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // =========================
    // User ID
    // =========================
    const userId = Number(session.user.id);

    if (!Number.isInteger(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user ID",
        },
        { status: 400 }
      );
    }

    // =========================
    // Get current user
    // =========================
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
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // =========================
    // User information
    // =========================
    const userAreaId =
      user.area_id !== null
        ? Number(user.area_id)
        : null;

    const areaName = user.area_name || null;

    const roleId = Number(user.role_id);

    // Admin = role_id 1
    const isAdmin = roleId === 1;

    // =========================
    // Normal user must have area
    // =========================
    if (!isAdmin && userAreaId === null) {
      return NextResponse.json(
        {
          success: false,
          error: "المستخدم غير مرتبط بمنطقة.",
        },
        { status: 403 }
      );
    }

    // =========================
    // Get vehicles
    //
    // Admin:
    //     All active vehicles
    //
    // Normal user:
    //     Only vehicles from his area
    // =========================
    const vehiclesResult = await pool.query(
      `
        SELECT
          v.id,
          v.plate_number,
          v.capacity,
          v.model,
          v.type,
          v.area_id,
          a.name AS area_name
        FROM vehicles v
        INNER JOIN areas a
          ON a.id = v.area_id
        WHERE
          v.is_active = true
          AND a.is_deleted = false
          AND (
            $1 = true
            OR v.area_id = $2
          )
        ORDER BY
          a.name ASC,
          v.plate_number ASC
      `,
      [
        isAdmin,
        userAreaId,
      ]
    );

    // =========================
    // Response
    // =========================
    return NextResponse.json(
      {
        success: true,

        isAdmin,

        area: isAdmin
          ? {
              id: null,
              name: "جميع المناطق",
            }
          : {
              id: userAreaId,
              name: areaName,
            },

        vehicles: vehiclesResult.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/vehicle-movements/options error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load vehicle movement options",
      },
      { status: 500 }
    );
  }
}