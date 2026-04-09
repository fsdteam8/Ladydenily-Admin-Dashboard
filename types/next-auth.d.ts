import { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string
      role?: string
    }
    accessToken?: string
    refreshToken?: string
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
    accessToken?: string
    refreshToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    accessToken?: string
    refreshToken?: string
  }
}
