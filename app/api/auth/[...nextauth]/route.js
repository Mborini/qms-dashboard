import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const handler = NextAuth({
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
                r.name AS role_name
              FROM users u
              INNER JOIN roles r
                ON u.role_id = r.id
              WHERE u.username = $1
              LIMIT 1
            `,
            [credentials.username]
          );

          if (result.rows.length === 0) {
            return null;
          }

          const user = result.rows[0];

          // مقارنة الباسورد مباشرة
          if (credentials.password !== user.password) {
            return null;
          }

          return {
            id: String(user.id),
            name: user.name,
            username: user.username,
            role: user.role_name,
            roleId: user.role_id,
          };
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
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.username = user.username;
      token.role = user.role;
      token.roleId = user.roleId;
    }

    return token;
  },

  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      session.user.roleId = token.roleId;
    }

    return session;
  },
},

  pages: {
    signIn: "/",
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };