import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();

  try {
    const { id } = await params;
    const roleId = Number(id);

    if (!Number.isInteger(roleId)) {
      return NextResponse.json(
        { error: "Invalid role ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const permissions = body.permissions;

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "permissions must be an array" },
        { status: 400 }
      );
    }

    const permissionIds = permissions
      .map(Number)
      .filter((id) => Number.isInteger(id));

    await client.query("BEGIN");

    // التأكد أن الـ Role موجود
    const roleResult = await client.query(
      `SELECT id FROM roles WHERE id = $1`,
      [roleId]
    );

    if (roleResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // حذف الصلاحيات الحالية
    await client.query(
      `DELETE FROM role_permissions WHERE role_id = $1`,
      [roleId]
    );

    // إضافة الصلاحيات الجديدة
    for (const permissionId of permissionIds) {
      await client.query(
        `
          INSERT INTO role_permissions (
            role_id,
            permission_id
          )
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id)
          DO NOTHING
        `,
        [roleId, permissionId]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      roleId,
      permissions: permissionIds,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("PUT /api/roles/[id]/permissions error:", error);

    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}