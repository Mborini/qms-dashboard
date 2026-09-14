// app/lib/auth.ts

import type { NextAuthOptions, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type AuthUser = User & {
  id: string;
  name?: string | null;
  username: string;
  role: string;
  roleId: number;
  permissions: string[];
};

type AuthToken = JWT & {
  id?: string;
  username?: string;
  role?: string;
  roleId?: number;
  permissions?: string[];
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        username: {
          label: "Username",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          !credentials?.username ||
          !credentials?.password
        ) {
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

          if (credentials.password !== user.password) {
            return null;
          }

          return {
            id: String(user.id),
            name: user.name,
            username: user.username,
            role: user.role_name,
            roleId: Number(user.role_id),
            permissions: user.permissions || [],
          } as AuthUser;
        } catch (error) {
          console.error(
            "NextAuth authorize error:",
            error
          );

          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: AuthToken;
      user?: User;
    }) {
      if (user) {
        const authUser = user as AuthUser;

        token.id = authUser.id;
        token.username = authUser.username;
        token.role = authUser.role;
        token.roleId = authUser.roleId;
        token.permissions = authUser.permissions || [];
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
        session.user.permissions =
          token.permissions || [];
      }

      return session;
    },
  },

  pages: {
    signIn: "/",
  },

  secret: process.env.NEXTAUTH_SECRET,
};