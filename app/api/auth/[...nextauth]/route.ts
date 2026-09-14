import NextAuth, {
  type NextAuthOptions,
  type User,
} from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { Pool } from "pg";

/* =========================================================
   DATABASE
   ========================================================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/* =========================================================
   TYPES
   ========================================================= */

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

/* =========================================================
   NEXTAUTH OPTIONS
   ========================================================= */

export const authOptions: NextAuthOptions = {
  /* -------------------------------------------------------
     PROVIDERS
     ------------------------------------------------------- */

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

          /* -------------------------------------------------
             USER NOT FOUND
             ------------------------------------------------- */

          if (result.rows.length === 0) {
            return null;
          }

          const user = result.rows[0];

          /* -------------------------------------------------
             PASSWORD
             ------------------------------------------------- */

          if (
            credentials.password !==
            user.password
          ) {
            return null;
          }

          /* -------------------------------------------------
             RETURN USER
             ------------------------------------------------- */

          return {
            id: String(user.id),

            name: user.name,

            username: user.username,

            role: user.role_name,

            roleId: Number(user.role_id),

            permissions:
              user.permissions || [],
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

  /* =========================================================
     SESSION
     ========================================================= */

  session: {
    strategy: "jwt",
  },

  /* =========================================================
     CALLBACKS
     ========================================================= */

  callbacks: {
    /* -------------------------------------------------------
       JWT
       ------------------------------------------------------- */

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

        token.username =
          authUser.username;

        token.role =
          authUser.role;

        token.roleId =
          authUser.roleId;

        token.permissions =
          authUser.permissions || [];
      }

      return token;
    },

    /* -------------------------------------------------------
       SESSION
       ------------------------------------------------------- */

    async session({
      session,
      token,
    }: {
      session: any;
      token: AuthToken;
    }) {
      if (session.user) {
        session.user.id =
          token.id;

        session.user.username =
          token.username;

        session.user.role =
          token.role;

        session.user.roleId =
          token.roleId;

        session.user.permissions =
          token.permissions || [];
      }

      return session;
    },
  },

  /* =========================================================
     PAGES
     ========================================================= */

  pages: {
    signIn: "/",
  },

  /* =========================================================
     SECRET
     ========================================================= */

  secret:
    process.env.NEXTAUTH_SECRET,
};

/* =========================================================
   HANDLER
   ========================================================= */

const handler =
  NextAuth(authOptions);

export {
  handler as GET,
  handler as POST,
};