import { env } from "@/env";
import { Locale } from "@/i18n";
import prisma from "@/lib/prisma";
import { setUserLocale } from "@/lib/locale";
import { authEdgeConfig } from "@/server/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { DefaultSession, default as NextAuth, NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
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
  }

  interface User {
    // ...other properties
    // role: UserRole;
    locale: string;
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
  // session, pages and the `authorized` callback are shared with middleware.ts.
  ...authEdgeConfig,
  adapter: PrismaAdapter(prisma),
  providers: providers,
  callbacks: {
    ...authEdgeConfig.callbacks,
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
    // Re-applies the language saved on the account, so signing in on a new device
    // restores the user's preference. Note this deliberately overwrites the locale
    // cookie: the database is the source of truth for a signed-in user, which is why
    // the settings form must not update the cookie unless its write succeeded.
    signIn: async ({ user }) => {
      if (user.locale) {
        let locale: Locale = "en";
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

        // Goes through setUserLocale so the cookie gets the same lifetime as an
        // explicit choice, instead of dying with the browser session.
        await setUserLocale(locale);
      }

      return true;
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
