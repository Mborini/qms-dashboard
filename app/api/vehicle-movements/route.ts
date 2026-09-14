import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pool } from "@/app/lib/db";

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();

    const {
      movement_date,
      shift,
      vehicle_id,
      work_route,
      driver_name,
    } = body;

    const movementDate = String(
      movement_date ?? ""
    ).slice(0, 10);

    const shiftValue = String(
      shift ?? ""
    ).trim();

    const workRoute = String(
      work_route ?? ""
    ).trim();

    const driverName = String(
      driver_name ?? ""
    ).trim();

    const vehicleId = Number(vehicle_id);

    if (!movementDate) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى اختيار تاريخ الحركة.",
        },
        { status: 400 }
      );
    }

    if (!shiftValue) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى اختيار الشفت.",
        },
        { status: 400 }
      );
    }

    if (!["A", "B"].includes(shiftValue)) {
      return NextResponse.json(
        {
          success: false,
          error: "الشفت يجب أن يكون A أو B.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(vehicleId)) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى اختيار سيارة صحيحة.",
        },
        { status: 400 }
      );
    }

    if (!workRoute) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى إدخال مسار العمل.",
        },
        { status: 400 }
      );
    }

    if (!driverName) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى إدخال اسم السائق.",
        },
        { status: 400 }
      );
    }

    // Get user's area
    const userResult = await pool.query(
      `
        SELECT
          u.area_id
        FROM users u
        LEFT JOIN areas a
          ON a.id = u.area_id
        WHERE u.id = $1
          AND a.is_deleted = false
        LIMIT 1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "لم يتم العثور على منطقة المستخدم.",
        },
        { status: 404 }
      );
    }

    const userAreaId = userResult.rows[0].area_id;

    if (!userAreaId) {
      return NextResponse.json(
        {
          success: false,
          error: "لا توجد منطقة مرتبطة بالمستخدم.",
        },
        { status: 400 }
      );
    }

    // Check vehicle belongs to user's area
    const vehicleResult = await pool.query(
      `
        SELECT
          id,
          area_id,
          is_active
        FROM vehicles
        WHERE id = $1
        LIMIT 1
      `,
      [vehicleId]
    );

    if (vehicleResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "السيارة غير موجودة.",
        },
        { status: 404 }
      );
    }

    const vehicle =
      vehicleResult.rows[0];

    if (!vehicle.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: "السيارة غير مفعلة.",
        },
        { status: 400 }
      );
    }

    if (
      Number(vehicle.area_id) !==
      Number(userAreaId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "لا يمكنك تسجيل حركة لسيارة خارج منطقتك.",
        },
        { status: 403 }
      );
    }

    // Check duplicate
    const duplicateResult =
      await pool.query(
        `
          SELECT
            id
          FROM vehicle_movements
          WHERE created_by = $1
            AND movement_date = $2
            AND shift = $3
            AND vehicle_id = $4
          LIMIT 1
        `,
        [
          userId,
          movementDate,
          shiftValue,
          vehicleId,
        ]
      );

    if (
      duplicateResult.rows.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "يوجد تسجيل آخر لهذه السيارة في نفس التاريخ والشفت.",
        },
        { status: 409 }
      );
    }

    // Insert
    const result = await pool.query(
      `
        INSERT INTO vehicle_movements (
          movement_date,
          shift,
          vehicle_id,
          work_route,
          driver_name,
          created_by
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )
        RETURNING
          id,

          TO_CHAR(
            movement_date,
            'YYYY-MM-DD'
          ) AS movement_date,

          shift,
          vehicle_id,
          work_route,
          driver_name,
          created_by,
          created_at
      `,
      [
        movementDate,
        shiftValue,
        vehicleId,
        workRoute,
        driverName,
        userId,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "تم تسجيل حركة السيارة بنجاح.",
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    // PostgreSQL unique constraint
    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          error:
            "يوجد تسجيل آخر لهذه السيارة في نفس التاريخ والشفت.",
        },
        { status: 409 }
      );
    }

    console.error(
      "POST /api/vehicle-movements error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "حدث خطأ أثناء تسجيل حركة السيارة.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
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

    const body = await request.json();

    const {
      id,
      movement_date,
      shift,
      vehicle_id,
      work_route,
      driver_name,
    } = body;

    const movementId = Number(id);

    const requestedDate = String(
      movement_date ?? ""
    ).slice(0, 10);

    const shiftValue = String(
      shift ?? ""
    ).trim();

    const workRoute = String(
      work_route ?? ""
    ).trim();

    const driverName = String(
      driver_name ?? ""
    ).trim();

    const vehicleId = Number(vehicle_id);

    if (!Number.isInteger(movementId)) {
      return NextResponse.json(
        {
          success: false,
          error: "رقم الحركة غير صحيح.",
        },
        { status: 400 }
      );
    }

    if (!requestedDate) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى اختيار تاريخ الحركة.",
        },
        { status: 400 }
      );
    }

    if (!shiftValue) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى اختيار الشفت.",
        },
        { status: 400 }
      );
    }

    if (!["A", "B"].includes(shiftValue)) {
      return NextResponse.json(
        {
          success: false,
          error: "الشفت يجب أن يكون A أو B.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(vehicleId)) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى اختيار سيارة صحيحة.",
        },
        { status: 400 }
      );
    }

    if (!workRoute) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى إدخال مسار العمل.",
        },
        { status: 400 }
      );
    }

    if (!driverName) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى إدخال اسم السائق.",
        },
        { status: 400 }
      );
    }

    // Get user's area
    const userResult = await pool.query(
      `
        SELECT
          u.area_id
        FROM users u
        LEFT JOIN areas a
          ON a.id = u.area_id
        WHERE u.id = $1
          AND a.is_deleted = false
        LIMIT 1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "لم يتم العثور على منطقة المستخدم.",
        },
        { status: 404 }
      );
    }

    const userAreaId = userResult.rows[0].area_id;

    if (!userAreaId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "لا توجد منطقة مرتبطة بالمستخدم.",
        },
        { status: 400 }
      );
    }

    // Check original movement
    const movementCheck =
      await pool.query(
        `
          SELECT
            id,
            movement_date
          FROM vehicle_movements
          WHERE id = $1
            AND created_by = $2
          LIMIT 1
        `,
        [
          movementId,
          userId,
        ]
      );

    if (
      movementCheck.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "الحركة غير موجودة أو لا تملك صلاحية تعديلها.",
        },
        { status: 404 }
      );
    }

    // Get today's date according to Jordan
    const todayResult =
      await pool.query(`
        SELECT
          (
            NOW() AT TIME ZONE 'Asia/Amman'
          )::date::text AS today
      `);

    const today = String(
      todayResult.rows[0].today
    );

    // Only today's movement can be edited
    const todayMovementCheck =
      await pool.query(
        `
          SELECT
            id
          FROM vehicle_movements
          WHERE id = $1
            AND created_by = $2
            AND movement_date =
                (
                  NOW() AT TIME ZONE 'Asia/Amman'
                )::date
          LIMIT 1
        `,
        [
          movementId,
          userId,
        ]
      );

    if (
      todayMovementCheck.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "لا يمكن تعديل حركة إلا إذا كان تاريخها هو تاريخ اليوم.",
        },
        { status: 403 }
      );
    }

    if (requestedDate !== today) {
      return NextResponse.json(
        {
          success: false,
          error:
            "لا يمكن تغيير تاريخ الحركة. يسمح بتعديل حركة اليوم فقط.",
        },
        { status: 403 }
      );
    }

    // Check vehicle
    const vehicleResult = await pool.query(
      `
        SELECT
          id,
          area_id,
          is_active
        FROM vehicles
        WHERE id = $1
        LIMIT 1
      `,
      [vehicleId]
    );

    if (vehicleResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "السيارة غير موجودة.",
        },
        { status: 404 }
      );
    }

    const vehicle =
      vehicleResult.rows[0];

    if (!vehicle.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: "السيارة غير مفعلة.",
        },
        { status: 400 }
      );
    }

    if (
      Number(vehicle.area_id) !==
      Number(userAreaId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "لا يمكنك تعديل الحركة إلى سيارة خارج منطقتك.",
        },
        { status: 403 }
      );
    }

    // Check duplicate excluding current movement
    const duplicateResult =
      await pool.query(
        `
          SELECT
            id
          FROM vehicle_movements
          WHERE created_by = $1
            AND movement_date = $2
            AND shift = $3
            AND vehicle_id = $4
            AND id <> $5
          LIMIT 1
        `,
        [
          userId,
          requestedDate,
          shiftValue,
          vehicleId,
          movementId,
        ]
      );

    if (
      duplicateResult.rows.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "يوجد تسجيل آخر لهذه السيارة في نفس التاريخ والشفت.",
        },
        { status: 409 }
      );
    }

    // Update
    const result = await pool.query(
      `
        UPDATE vehicle_movements
        SET
          movement_date = $1,
          shift = $2,
          vehicle_id = $3,
          work_route = $4,
          driver_name = $5
        WHERE id = $6
          AND created_by = $7
          AND movement_date =
              (
                NOW() AT TIME ZONE 'Asia/Amman'
              )::date
        RETURNING
          id,

          TO_CHAR(
            movement_date,
            'YYYY-MM-DD'
          ) AS movement_date,

          shift,
          vehicle_id,
          work_route,
          driver_name,
          created_by,
          created_at
      `,
      [
        requestedDate,
        shiftValue,
        vehicleId,
        workRoute,
        driverName,
        movementId,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "لم يتم تعديل الحركة. يسمح بتعديل حركات اليوم فقط.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "تم تعديل حركة السيارة بنجاح.",
        data: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Expected duplicate error
    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          error:
            "يوجد تسجيل آخر لهذه السيارة في نفس التاريخ والشفت.",
        },
        { status: 409 }
      );
    }

    console.error(
      "PUT /api/vehicle-movements error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "حدث خطأ أثناء تعديل حركة السيارة.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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

    const { searchParams } =
      new URL(request.url);

    const id = Number(
      searchParams.get("id")
    );

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "رقم الحركة غير صحيح.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        DELETE FROM vehicle_movements
        WHERE id = $1
          AND created_by = $2
          AND movement_date =
              (
                NOW() AT TIME ZONE 'Asia/Amman'
              )::date
        RETURNING
          id
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "لا يمكن حذف الحركة إلا إذا كانت حركة اليوم أو أنها غير موجودة.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "تم حذف حركة السيارة بنجاح.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "DELETE /api/vehicle-movements error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "حدث خطأ أثناء حذف حركة السيارة.",
      },
      { status: 500 }
    );
  }
}