
import { pool } from "@/app/src/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const { rows } = await pool.query(
    `SELECT id, name, created_at
     FROM collection_areas
     WHERE is_deleted = false
     ORDER BY created_at DESC`
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { name } = await req.json();

  const { rows } = await pool.query(
    `INSERT INTO collection_areas (name)
     VALUES ($1)
     RETURNING id, name, created_at`,
    [name]
  );

  return NextResponse.json(rows[0]);
}