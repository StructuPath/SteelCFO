import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

// Edge-safe auth config (no Prisma imports — used by middleware)
export default {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // authorize is handled in the full auth.ts config
      authorize: () => null,
    }),
  ],
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig
