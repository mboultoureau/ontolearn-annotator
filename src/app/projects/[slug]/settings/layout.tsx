
import SettingLink from "@/app/_components/settings/setting-link";
import { fetchProject } from "@/services/projects";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function Layout({
    children,
    params
}: {
    children: React.ReactNode,
    params: {
        slug: string
    }
}) {
    const t = await getTranslations("Project.Settings")

    const project = await fetchProject({
        slug: params.slug,
    });

    if (!project) {
        notFound();
    }

    return (
        <>
            <div className="mx-auto grid w-full max-w-6xl gap-2">
                <h1 className="text-3xl font-semibold">{t('title')}</h1>
            </div>
            <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
                <nav
                    className="grid gap-4 text-sm text-muted-foreground" x-chunk="dashboard-04-chunk-0"
                >
                    <SettingLink href={`/projects/${project.slug}/settings`}>
                        {t('general')}
                    </SettingLink>
                    <SettingLink href={`/projects/${project.slug}/settings/source-types`}>
                        {t('sourceTypes')}
                    </SettingLink>
                    <SettingLink href={`/projects/${project.slug}/settings/tasks`}>
                        {t('tasks')}
                    </SettingLink>
                    <SettingLink href={`/projects/${project.slug}/settings/users`}>
                        {t('users')}
                    </SettingLink>
                </nav>
                <div className="grid gap-6">
                    {children}
                </div>
            </div>
        </>
    )
}
