
import SettingsMenu from "@/app/_components/account/settings-menu";
import HeaderMenu from "@/app/_components/header/header-menu";
import { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('Account.Settings');
  
    return {
      title: t('title'),
    }
  }

export default function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    const t = useTranslations('Account.Settings');

    return (
        <div className="flex min-h-screen w-full flex-col">
            <HeaderMenu />
            <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
                <div className="mx-auto grid w-full max-w-6xl gap-2">
                    <h1 className="text-3xl font-semibold">{t('title')}</h1>
                </div>
                <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
                    <nav
                        className="grid gap-4 text-sm text-muted-foreground"
                    >
                        <SettingsMenu />
                    </nav>
                    <div className="grid gap-6">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}