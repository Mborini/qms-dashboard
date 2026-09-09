import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/* =====================================================
   GET ROLES
===================================================== */

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.name,
        r.description,

        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', p.id,
              'name', p.name,
              'description', p.description
            )
            ORDER BY p.id
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS permissions

      FROM roles r

      LEFT JOIN role_permissions rp
        ON r.id = rp.role_id

      LEFT JOIN permissions p
        ON rp.permission_id = p.id

      GROUP BY
        r.id,
        r.name,
        r.description

      ORDER BY r.id;
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET /api/roles error:", error);

    return NextResponse.json(
      {
        error: "Failed to load roles",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   POST ROLE
===================================================== */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const description =
      body.description?.trim() || null;

    if (!name) {
      return NextResponse.json(
        {
          error: "Role name is required",
        },
        {
          status: 400,
        }
      );
    }

    const existing = await pool.query(
      `
        SELECT id
        FROM roles
        WHERE LOWER(name) = LOWER($1)
        LIMIT 1
      `,
      [name]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          error: "Role already exists",
        },
        {
          status: 409,
        }
      );
    }

    const result = await pool.query(
      `
        INSERT INTO roles (
          name,
          description
        )
        VALUES ($1, $2)
        RETURNING
          id,
          name,
          description
      `,
      [name, description]
    );

    return NextResponse.json(
      {
        success: true,
        role: result.rows[0],
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST /api/roles error:", error);

    return NextResponse.json(
      {
        error: "Failed to create role",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   PUT ROLE
===================================================== */

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const id = Number(body.id);
    const name = body.name?.trim();
    const description =
      body.description?.trim() || null;

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        {
          error: "Invalid role ID",
        },
        {
          status: 400,
        }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          error: "Role name is required",
        },
        {
          status: 400,
        }
      );
    }

    const existing = await pool.query(
      `
        SELECT id
        FROM roles
        WHERE LOWER(name) = LOWER($1)
          AND id <> $2
        LIMIT 1
      `,
      [name, id]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          error: "Another role already has this name",
        },
        {
          status: 409,
        }
      );
    }

    const result = await pool.query(
      `
        UPDATE roles

        SET
          name = $1,
          description = $2

        WHERE id = $3

        RETURNING
          id,
          name,
          description
      `,
      [name, description, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: "Role not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      role: result.rows[0],
    });
  } catch (error) {
    console.error("PUT /api/roles error:", error);

    return NextResponse.json(
      {
        error: "Failed to update role",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   DELETE ROLE
===================================================== */

export async function DELETE(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const id = Number(
      searchParams.get("id")
    );

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        {
          error: "Invalid role ID",
        },
        {
          status: 400,
        }
      );
    }

    // نتأكد إذا في Users يستخدموا هذا الـ Role
    const usersResult = await pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM users
        WHERE role_id = $1
      `,
      [id]
    );

    const usersCount =
      usersResult.rows[0].count;

    if (usersCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete this role because users are assigned to it",
        },
        {
          status: 409,
        }
      );
    }

    const result = await pool.query(
      `
        DELETE FROM roles
        WHERE id = $1
        RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: "Role not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE /api/roles error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to delete role",
      },
      {
        status: 500,
      }
    );
  }
}