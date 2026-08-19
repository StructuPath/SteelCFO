import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
      organizationId: string
    }
  }

  interface User {
    role?: string
    organizationId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    organizationId?: string
  }
}
