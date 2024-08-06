import { env } from "@/env";
import prisma from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { DefaultSession, default as NextAuth, NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

const providers: Provider[] = [
  GitHub({
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  })
]
 
export const providerMap = providers.map((provider) => {
  if (typeof provider === "function") {
    const providerData = provider()
    return { id: providerData.id, name: providerData.name }
  } else {
    return { id: provider.id, name: provider.name }
  }
})

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: providers,
  callbacks: {
    // authorized({ auth, request: { nextUrl } }) {
    //     const isLoggedIn = !!auth?.user;
    //     const isOnProtectedPage = nextUrl.pathname.startsWith('/projects') || nextUrl.pathname.startsWith('/account');
    //     if (isOnProtectedPage) {
    //         if (isLoggedIn) return true;
    //         return false; // Redirect unauthenticated users to login page
    //     } else if (isLoggedIn) {
    //         return Response.redirect(new URL('/projects', nextUrl));
    //     }
    //     return true;
    // },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
    // signIn: async ({ user }) => {

    //     if ((user as User).locale) {
    //         cookies().set(LOCALE_COOKIE_NAME, (user as User).locale);
    //     } else {
    //         getUserLocale();
    //     }

    //     return true;
    // }
  },
  pages: {
    signIn: "/login",
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);