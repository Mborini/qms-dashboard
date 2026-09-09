import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        description
      FROM permissions
      ORDER BY id;
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET /api/permissions error:", error);

    return NextResponse.json(
      { error: "Failed to load permissions" },
      { status: 500 }
    );
  }
}

// POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Permission name is required" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      INSERT INTO permissions (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description;
      `,
      [
        name.trim(),
        description?.trim() || null,
      ]
    );

    return NextResponse.json(result.rows[0], {
      status: 201,
    });
  } catch (error) {
    console.error("POST /api/permissions error:", error);

    return NextResponse.json(
      { error: "Failed to create permission" },
      { status: 500 }
    );
  }
}