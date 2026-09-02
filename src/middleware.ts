import { authEdgeConfig } from "@/server/auth.config";
import NextAuth from "next-auth";

/**
 * Runs the `authorized` callback from auth.config.ts on every page request, which is
 * what turns it from dead code into an actual redirect. Uses the Edge-safe config:
 * importing the full one from auth.ts would pull Prisma and nodemailer into the Edge
 * runtime, where they cannot run.
 */
export const { auth: middleware } = NextAuth(authEdgeConfig);

export const config = {
  // Skip API routes (they answer with their own status codes, and /api/auth/* must
  // stay reachable) plus everything served straight off disk.
  matcher: ["/((?!api|_next/static|_next/image|img|uploads|favicon.ico).*)"],
};
