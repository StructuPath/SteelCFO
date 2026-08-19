import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import { compareSync } from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// --- Failed-login throttle (per email, in-memory) ---
// Blocks credential brute-forcing on a single account. For multi-instance
// deployments move this to a shared store (e.g. Redis).
const FAILED_LOGIN_LIMIT = 10
const FAILED_LOGIN_WINDOW_MS = 15 * 60_000
const failedLogins = new Map<string, { count: number; resetAt: number }>()

function isLoginThrottled(email: string): boolean {
  const entry = failedLogins.get(email)
  if (!entry) return false
  if (Date.now() > entry.resetAt) {
    failedLogins.delete(email)
    return false
  }
  return entry.count >= FAILED_LOGIN_LIMIT
}

function recordFailedLogin(email: string) {
  if (failedLogins.size > 10_000) {
    const now = Date.now()
    for (const [key, value] of failedLogins) {
      if (now > value.resetAt) failedLogins.delete(key)
    }
  }
  const entry = failedLogins.get(email)
  if (!entry || Date.now() > entry.resetAt) {
    failedLogins.set(email, {
      count: 1,
      resetAt: Date.now() + FAILED_LOGIN_WINDOW_MS,
    })
  } else {
    entry.count++
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // Self-hosted deployments sit behind proxies/load balancers whose Host
  // header NextAuth would otherwise reject with UntrustedHost
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        if (isLoginThrottled(email)) return null

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organizationId: true,
            passwordHash: true,
          },
        })
        if (!user) {
          recordFailedLogin(email)
          return null
        }

        // Demo mode bypasses password verification (middleware skips auth
        // entirely in demo mode; this keeps the login form usable there)
        if (process.env.DEMO_MODE !== "true") {
          if (
            !user.passwordHash ||
            !compareSync(password, user.passwordHash)
          ) {
            recordFailedLogin(email)
            return null
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = (token.role as string | undefined) ?? "member"
        session.user.organizationId =
          (token.organizationId as string | undefined) ?? ""
      }
      return session
    },
  },
})
