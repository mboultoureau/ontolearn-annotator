import { Features } from "@/app/_components/home/features";
import Hero from "@/app/_components/home/hero";
import { getTranslations } from "next-intl/server";

import { auth } from "@/server/auth";

export default async function Home() {
  const session = await auth();
  const t = await getTranslations("Home");

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      <div className="flex w-full items-center justify-between px-4 py-6">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t("title")}
        </div>
      </div>
      <div className="flex-1">
        <Hero isLogged={session !== null} />
        <Features />
      </div>
      <div className="flex h-20 w-full items-center justify-center border-t text-gray-600 dark:border-gray-800 dark:text-gray-300 px-6">
        <p>{t("copyright")}</p>
      </div>
    </div>
  );
}
