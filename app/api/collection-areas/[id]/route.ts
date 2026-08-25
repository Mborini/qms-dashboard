import { pool } from "@/app/src/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { name } = await req.json();

  const { rows } = await pool.query(
    `
    UPDATE collection_areas
    SET name = $1
    WHERE id = $2
    RETURNING id, name, created_at
    `,
    [name, id]
  );

  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await pool.query(
    `
    UPDATE collection_areas
    SET is_deleted = true
    WHERE id = $1
    `,
    [id]
  );

  return NextResponse.json({ success: true });
}