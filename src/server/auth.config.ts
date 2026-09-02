import type { NextAuthConfig } from "next-auth";

/**
 * The slice of the Auth.js configuration that also has to run in the Edge runtime,
 * i.e. from middleware.ts.
 *
 * It must stay free of Node-only dependencies: the Prisma adapter, nodemailer and
 * anything reaching for the database cannot run on the Edge. The full configuration,
 * which the route handler and server-side `auth()` use, spreads this one in auth.ts.
 */
export const authEdgeConfig: NextAuthConfig = {
  // Providers are only needed where sign-in actually happens (auth.ts). The
  // middleware just reads the JWT session cookie.
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    signOut: "/",
    // Declared for correctness, but @auth/core currently ignores it for the email
    // flow: send-token.js hardcodes a redirect to /api/auth/verify-request. The
    // sign-in action in src/app/login/page.tsx redirects to this page itself.
    verifyRequest: "/login/verify-request",
  },
  callbacks: {
    /**
     * Runs on every matched request from middleware.ts. Without a middleware this
     * callback is dead code, and a signed-out visitor reaches the page itself — where
     * a protectedProcedure throws UNAUTHORIZED as an unhandled runtime error.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedPage =
        nextUrl.pathname.startsWith("/projects") ||
        nextUrl.pathname.startsWith("/account");

      if (isOnProtectedPage && !isLoggedIn) {
        // The landing page carries a Login button, so it is a friendlier place to
        // land than a bare form. Return `false` instead to send them to `pages.signIn`.
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
};
