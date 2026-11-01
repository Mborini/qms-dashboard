import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth"; // عدّل المسار إذا كان مختلفاً عندك

// Pool واحد فقط حتى مع الـ hot reload
const globalForPg = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

// =========================
// Helpers
// =========================

/** تنظيف مصفوفة المناطق: نص، بدون فراغات، بدون تكرار */
const parseDistricts = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(
        new Set(value.map((d) => String(d).trim()).filter(Boolean))
      )
    : [];

/** فقط الأدمن (roleId === 1). يرجع Response عند الرفض أو null عند السماح */
async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  if ((session.user as any).roleId !== 1) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  return null;
}

// =========================
// GET - Get all users
// =========================
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT
        id,
        name,
        username,
        password,
        role_id,
        COALESCE(district_names, '{}') AS district_names
      FROM users
      ORDER BY id ASC
    `);

    return NextResponse.json({
      success: true,
      users: result.rows,
    });
  } catch (error) {
    console.error("GET /api/users error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load users",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// =========================
// POST - Create user
// =========================
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const client = await pool.connect();

  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const roleId = Number(body.role_id);
    const districtNames = parseDistricts(body.district_names);

    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username is required" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(roleId) || roleId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid role_id" },
        { status: 400 }
      );
    }

    // Check duplicate username
    const existingUser = await client.query(
      `
      SELECT id
      FROM users
      WHERE username = $1
      LIMIT 1
      `,
      [username]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: "Username already exists" },
        { status: 409 }
      );
    }

    // Password intentionally stored as plain text
    const result = await client.query(
      `
      INSERT INTO users (
        name,
        username,
        password,
        role_id,
        district_names
      )
      VALUES ($1, $2, $3, $4, $5::text[])
      RETURNING
        id,
        name,
        username,
        password,
        role_id,
        district_names
      `,
      [name, username, password, roleId, districtNames]
    );

    return NextResponse.json(
      {
        success: true,
        user: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/users error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create user",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// =========================
// PUT - Update user
// =========================
export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const client = await pool.connect();

  try {
    const body = await request.json();

    const id = Number(body.id);
    const name = String(body.name ?? "").trim();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const roleId = Number(body.role_id);
    const districtNames = parseDistricts(body.district_names);

    // Validation
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid user id" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username is required" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(roleId) || roleId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid role_id" },
        { status: 400 }
      );
    }

    // Check user exists
    const userExists = await client.query(
      `
      SELECT id
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (userExists.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check username belongs to another user
    const duplicateUsername = await client.query(
      `
      SELECT id
      FROM users
      WHERE username = $1
        AND id <> $2
      LIMIT 1
      `,
      [username, id]
    );

    if (duplicateUsername.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: "Username already exists" },
        { status: 409 }
      );
    }

    // Password intentionally stored as plain text
    const result = await client.query(
      `
      UPDATE users
      SET
        name = $1,
        username = $2,
        password = $3,
        role_id = $4,
        district_names = $5::text[]
      WHERE id = $6
      RETURNING
        id,
        name,
        username,
        password,
        role_id,
        district_names
      `,
      [name, username, password, roleId, districtNames, id]
    );

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("PUT /api/users error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// =========================
// DELETE - Delete user
// =========================
export async function DELETE(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const client = await pool.connect();

  try {
    const { searchParams } = new URL(request.url);

    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid user id" },
        { status: 400 }
      );
    }

    const result = await client.query(
      `
      DELETE FROM users
      WHERE id = $1
      RETURNING
        id,
        name,
        username,
        role_id,
        district_names
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("DELETE /api/users error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete user",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}