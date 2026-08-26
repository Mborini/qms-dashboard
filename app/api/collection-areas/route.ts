import { pool } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `
      SELECT id, name, created_at
      FROM collection_areas
      WHERE is_deleted = false
      ORDER BY created_at DESC
      `
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET collection-areas error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    const { rows } = await pool.query(
      `
      INSERT INTO collection_areas (name)
      VALUES ($1)
      RETURNING id, name, created_at
      `,
      [name]
    );

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("POST collection-areas error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}