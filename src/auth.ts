import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const credentialsSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const u = user as unknown as Record<string, unknown>;
        token.username = u.username as string;
        token.isEmailVerified = u.isEmailVerified as boolean;
        token.kycStatus = u.kycStatus as string;
        token.role = u.role as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        const su = session.user as unknown as Record<string, unknown>;
        su.username = token.username;
        su.isEmailVerified = token.isEmailVerified;
        su.kycStatus = token.kycStatus;
        su.role = token.role;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { identifier, password } = parsed.data;

        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { phone: identifier },
              { username: identifier },
            ],
          },
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            password: true,
            emailVerified: true,
            status: true,
            kyc: { select: { status: true } },
          },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        if (user.status !== "active") return null;

        // Fetch role via raw SQL — bypasses stale Prisma generated types
        const roleRow = await db.$queryRawUnsafe<Array<{ role: string }>>(
          `SELECT role FROM users WHERE id = ?`,
          user.id
        );
        const role = roleRow[0]?.role ?? "user";

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          username: user.username,
          isEmailVerified: user.emailVerified,
          kycStatus: (user as any).kyc?.status ?? "none",
          role,
        } as unknown as Parameters<typeof Credentials>[0] extends infer T ? T : never;
      },
    }),
  ],
});
