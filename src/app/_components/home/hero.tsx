"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";

type Props = {
  isLogged: boolean;
}

export default function Hero({ isLogged }: Props) {
    const t = useTranslations("Home");

    return (
        <section className="w-full py-12 md:py-24 lg:py-32 min-h-[calc(100vh_-_theme(spacing.16))]">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  {t("title")}
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  {t("subtitle")}
                </p>
              </div>
              <div className="space-x-4">
                <Link
                  // href={isLogged ? "/projects" : "/api/auth/signin"}
                  href="#"
                  onClick={(e) => signIn(undefined, { callbackUrl: "/projects" })}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                  prefetch={false}
                >
                  {t("getStarted")}
                </Link>
                <Link
                  href="https://github.com/mboultoureau/ontolearn-annotator"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
                  prefetch={false}
                >
                  {t("viewSource")}
                </Link>
              </div>
            </div>
          </div>
        </section>
    )
}