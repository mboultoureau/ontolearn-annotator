import { env } from "@/env";
import { LOCALE_COOKIE_NAME } from "@/i18n";
import prisma from "@/lib/prisma";
import type { AbacPermissions } from "@/lib/abac-types";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { DefaultSession, default as NextAuth, NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import { cookies } from "next/headers";
import EmailProvider from "next-auth/providers/nodemailer";

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
    permissions?: AbacPermissions;
  }

  interface User {
    // ...other properties
    // role: UserRole;
    locale: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    locale?: string;
    permissions?: AbacPermissions;
  }
}

const providers: Provider[] = [
  GitHub({
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  }),
  EmailProvider({
    server: process.env.EMAIL_SERVER,
    from: process.env.EMAIL_FROM
  })
];

export const providerMap = providers.map((provider) => {
  if (typeof provider === "function") {
    const providerData = provider();
    return { id: providerData.id, name: providerData.name, type: providerData.type };
  } else {
    return { id: provider.id, name: provider.name, type: provider.type };
  }
});

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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedPage =
        nextUrl.pathname.startsWith("/projects") ||
        nextUrl.pathname.startsWith("/account");
      if (isOnProtectedPage) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/projects", nextUrl));
      }
      return true;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
      permissions: token.permissions, // Add permissions to session
    }),
    signIn: async ({ user }) => {
      if (user.locale) {
        let locale = "";
        switch (user.locale) {
          case "ENGLISH":
            locale = "en";
            break;
          case "FRENCH":
            locale = "fr";
            break;
          case "JAPANESE":
            locale = "ja";
            break;
          default:
            locale = "en";
            break;
        }

        cookies().set(LOCALE_COOKIE_NAME, locale);
      }

      return true;
    },
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.locale = user.locale;
      }
        
      const userId = user?.id || token.sub;
      
      // Fetch permissions from ABAC server on sign-in, update trigger, or if permissions are expired
      // Also check if permissions are close to expiring (within 30 seconds) to proactively refresh
      const now = new Date();
      const permissionsExpired = token.permissions?.validUntil 
        ? new Date(token.permissions.validUntil) <= now
        : false;
      const permissionsExpiringSoon = token.permissions?.validUntil
        ? (new Date(token.permissions.validUntil).getTime() - now.getTime()) < 30000 // Less than 30 seconds
        : false;
      
      // Check if the session data includes a flag to refresh permissions
      const sessionRequestsRefresh = session && typeof session === 'object' && 'refreshPermissions' in session;
      
      const shouldFetchPermissions = 
        !!user || // First time signing in
        !token.permissions || // No permissions yet
        trigger === "update" || // Manual session update (e.g., after project creation)
        sessionRequestsRefresh || // Explicit refresh request
        permissionsExpired || // Permissions expired
        permissionsExpiringSoon; // Permissions expiring soon
      
      if (shouldFetchPermissions && userId) {
        try {
          const response = await fetch(env.ABAC_SERVER_URL + "/ontolearn/permissions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subjectId: userId,
              environment: {
                ip: "255.255.255.254",
                locale: "en-US"
              }
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            token.permissions = data || {};
          } else {
            console.error("Failed to fetch permissions from ABAC server:", response.status);
          }
        } catch (error) {
          console.error("Error fetching permissions from ABAC server:", error);
        }
      }
      return token;
    }
  },
  pages: {
    signIn: "/login",
    signOut: "/"
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
