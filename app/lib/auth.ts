// app/lib/auth.ts

import type { NextAuthOptions, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { Pool } from "pg";
import { refreshAvtrToken, ensureMainAvtrToken } from "./avtr";

// Pool واحد فقط حتى مع الـ hot reload في وضع التطوير
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

type AuthUser = User & {
  id: string;
  name?: string | null;
  username: string;
  role: string;
  roleId: number;
  permissions: string[];
  districtNames: string[];
  avtrToken?: string | null;
  avtrTokenExpiresAt?: string | null;
  avtrMainToken?: string | null;
  avtrMainTokenExpiresAt?: string | null;
};

type AuthToken = JWT & {
  id?: string;
  username?: string;
  role?: string;
  roleId?: number;
  permissions?: string[];
  districtNames?: string[];
  avtrToken?: string | null;
  avtrTokenExpiresAt?: string | null;
  avtrMainToken?: string | null;
  avtrMainTokenExpiresAt?: string | null;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const result = await pool.query(
            `
              SELECT
                u.id,
                u.name,
                u.username,
                u.password,
                u.avtr_email,
                u.avtr_pass,
                u.district_names,

                r.id AS role_id,
                r.name AS role_name,

                COALESCE(
                  ARRAY_AGG(p.name)
                  FILTER (WHERE p.name IS NOT NULL),
                  '{}'
                ) AS permissions

              FROM users u

              INNER JOIN roles r
                ON u.role_id = r.id

              LEFT JOIN role_permissions rp
                ON r.id = rp.role_id

              LEFT JOIN permissions p
                ON rp.permission_id = p.id

              WHERE u.username = $1

              GROUP BY
                u.id,
                u.name,
                u.username,
                u.password,
                u.avtr_email,
                u.avtr_pass,
                u.district_names,
                r.id,
                r.name

              LIMIT 1
            `,
            [credentials.username]
          );

          if (result.rows.length === 0) {
            return null;
          }

          const user = result.rows[0];

          // TODO: استبدلها بـ bcrypt.compare(credentials.password, user.password)
          if (credentials.password !== user.password) {
            return null;
          }

          // 1) توكن اليوزر: يجيبه ويسجله بالجدول الرئيسي
          const avtr = await refreshAvtrToken(
            pool,
            user.id,
            user.avtr_email,
            user.avtr_pass
          );

          // 2) التوكن الرئيسي: يقرأه من الجدول بعد التحديث
          const main = await ensureMainAvtrToken(pool);

          return {
            id: String(user.id),
            name: user.name,
            username: user.username,
            role: user.role_name,
            roleId: Number(user.role_id),
            permissions: user.permissions || [],
            districtNames: (user.district_names as string[]) || [],
            avtrToken: avtr?.token ?? null,
            avtrTokenExpiresAt: avtr?.expiresAt ?? null,
            avtrMainToken: main?.token ?? null,
            avtrMainTokenExpiresAt: main?.expiresAt ?? null,
          } as AuthUser;
        } catch (error) {
          console.error("NextAuth authorize error:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
        async jwt({ token, user }: { token: AuthToken; user?: User }) {
      // ===== أول تسجيل دخول =====
      if (user) {
        const authUser = user as AuthUser;

        token.id = authUser.id;
        token.username = authUser.username;
        token.role = authUser.role;
        token.roleId = authUser.roleId;
        token.permissions = authUser.permissions || [];
        token.districtNames = authUser.districtNames || [];
        token.avtrToken = authUser.avtrToken ?? null;
        token.avtrTokenExpiresAt = authUser.avtrTokenExpiresAt ?? null;
        token.avtrMainToken = authUser.avtrMainToken ?? null;
        token.avtrMainTokenExpiresAt =
          authUser.avtrMainTokenExpiresAt ?? null;

        // إذا التوكن فاضية: اعمل SELECT من الداتا بيز وجيب التوكن الرئيسي وحطه مكانها
        if (!token.avtrToken || !token.avtrMainToken) {
          const main = await ensureMainAvtrToken(pool);

          if (main?.token) {
            if (!token.avtrToken) {
              token.avtrToken = main.token;
              token.avtrTokenExpiresAt = main.expiresAt;
            }

            if (!token.avtrMainToken) {
              token.avtrMainToken = main.token;
              token.avtrMainTokenExpiresAt = main.expiresAt;
            }
          }
        }
      }

      // ===== كل قراءة للـ session: جيب آخر توكن رئيسي من الداتابيز =====
      try {
        const latest = await ensureMainAvtrToken(pool);

        if (latest?.token) {
          token.avtrMainToken = latest.token;
          token.avtrMainTokenExpiresAt = latest.expiresAt;
        }
      } catch (error) {
        console.error("JWT: failed to refresh main token:", error);
      }

      return token;
    },

    async session({
      session,
      token,
    }: {
      session: any;
      token: AuthToken;
    }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.roleId = token.roleId;
        session.user.permissions = token.permissions || [];
        session.user.districtNames = token.districtNames || [];

        // ملاحظة: هذه القيم تصل للمتصفح. إن لم تكن بحاجتها في الواجهة،
        // احذف الأسطر الأربعة التالية واقرأها من getToken() في الـ API routes.
        session.user.avtrToken = token.avtrToken ?? null;
        session.user.avtrTokenExpiresAt = token.avtrTokenExpiresAt ?? null;
        session.user.avtrMainToken = token.avtrMainToken ?? null;
        session.user.avtrMainTokenExpiresAt =
          token.avtrMainTokenExpiresAt ?? null;
      }

      return session;
    },
  },

  pages: {
    signIn: "/",
  },

  secret: process.env.NEXTAUTH_SECRET,
};