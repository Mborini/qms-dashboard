// app/lib/avtr.ts
import type { Pool } from "pg";

export type AvtrTokenInfo = {
  token: string;
  expiresAt: string | null;
};

const LOGIN_URL = "https://api.avtr.jo/api/service-provider/auth/login";

// لوجن عادي على AVTR وإرجاع التوكن (بدون أي كتابة بالداتا بيز)
async function loginAvtr(
  email: string,
  password: string
): Promise<AvtrTokenInfo | null> {
  try {
    const res = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error("AVTR login failed:", res.status);
      return null;
    }

    const data: { token?: string; expiresAt?: string } = await res.json();
    if (!data.token) return null;

    return { token: data.token, expiresAt: data.expiresAt ?? null };
  } catch (error) {
    console.error("AVTR login error:", error);
    return null;
  }
}

async function saveMainToken(pool: Pool, info: AvtrTokenInfo) {
  await pool.query(
    `INSERT INTO avtr_main_token (id, token, expires_at)
     VALUES (1, $1, $2)
     ON CONFLICT (id) DO UPDATE
     SET token      = EXCLUDED.token,
         expires_at = EXCLUDED.expires_at`,
    [info.token, info.expiresAt]
  );
}

// كل لوجن: يجيب توكن جديد ويحدّث
//  1) جدول users (صف اليوزر)
//  2) جدول avtr_main_token (الصف الرئيسي)
export async function refreshAvtrToken(
  pool: Pool,
  userId: string | number,
  avtrEmail: string | null,
  avtrPass: string | null
): Promise<AvtrTokenInfo | null> {
  if (!avtrEmail || !avtrPass) {
    console.warn("AVTR: user", userId, "has no avtr_email/avtr_pass");
    return null;
  }

  const info = await loginAvtr(avtrEmail, avtrPass);
  if (!info) return null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) توكن اليوزر
    const upd = await client.query(
      `UPDATE users
       SET avtr_token = $1, avtr_token_expires_at = $2
       WHERE id = $3`,
      [info.token, info.expiresAt, userId]
    );

    // 2) التوكن الرئيسي
    await client.query(
      `INSERT INTO avtr_main_token (id, token, expires_at)
       VALUES (1, $1, $2)
       ON CONFLICT (id) DO UPDATE
       SET token      = EXCLUDED.token,
           expires_at = EXCLUDED.expires_at`,
      [info.token, info.expiresAt]
    );

    await client.query("COMMIT");
    console.log("AVTR: saved. users rows =", upd.rowCount, "+ main token");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("AVTR token error:", e);
    return null;
  } finally {
    client.release();
  }

  return info;
}

export async function getMainAvtrToken(
  pool: Pool
): Promise<AvtrTokenInfo | null> {
  try {
    const { rows } = await pool.query(
      `SELECT token, expires_at FROM avtr_main_token WHERE id = 1`
    );
    const row = rows[0];
    if (!row?.token) return null;

    return {
      token: row.token,
      expiresAt: row.expires_at
        ? new Date(row.expires_at).toISOString()
        : null,
    };
  } catch (error) {
    console.error("AVTR main token read error:", error);
    return null;
  }
}

function isStillValid(info: AvtrTokenInfo | null): info is AvtrTokenInfo {
  if (!info?.token) return false;
  if (!info.expiresAt) return true; // ما في تاريخ انتهاء: نعتبرها صالحة
  // نعتبرها منتهية قبل دقيقة من الانتهاء الفعلي
  return new Date(info.expiresAt).getTime() - Date.now() > 60_000;
}

// يرجّع التوكن الرئيسي من الداتا بيز، وإذا فاضي أو منتهي
// يعمل لوجن بحساب AVTR الرئيسي (من .env) ويحدّث الجدول.
//
// لازم تضيف بالـ .env:
//   AVTR_MAIN_EMAIL=...
//   AVTR_MAIN_PASS=...
export async function ensureMainAvtrToken(
  pool: Pool
): Promise<AvtrTokenInfo | null> {
  const current = await getMainAvtrToken(pool);
  if (isStillValid(current)) return current;

  const email = process.env.AVTR_MAIN_EMAIL;
  const pass = process.env.AVTR_MAIN_PASS;

  if (!email || !pass) {
    console.warn(
      "AVTR: main token missing/expired and AVTR_MAIN_EMAIL/AVTR_MAIN_PASS are not set"
    );
    return current;
  }

  const fresh = await loginAvtr(email, pass);
  if (!fresh) return current;

  try {
    await saveMainToken(pool, fresh);
  } catch (error) {
    console.error("AVTR main token save error:", error);
  }

  return fresh;
}