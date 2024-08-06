import ProjectList from "@/app/_components/projects/project-list";
import { Button } from "@/app/_components/ui/button";
import { fetchProjectsAndCategoriesByUser } from "@/services/projects";
import { Brain, Plus } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('Project.List');

    return {
        title: t('title'),
    }
}

export default async function ProjectsPage() {
    const t = await getTranslations("Project.List")
    const categories = await fetchProjectsAndCategoriesByUser();

    // if (categories.length === 1 && categories[0].projects.length === 1) {
    //     redirect(`/projects/${categories[0].projects[0].slug}`);
    // }

    console.log(categories);

    return (
        <>
            <div className="mx-auto flex justify-between w-full max-w-6xl gap-2">
                <h1 className="text-3xl font-semibold">{t('title')}</h1>
                <Button asChild>
                    <Link href={`/projects/create`}>
                        <Plus className="mr-2" />
                        {t('create')}
                    </Link>
                </Button>
            </div>
            <div className="mx-auto grid w-full max-w-6xl gap-2">
                {categories.length === 0 ? (
                    <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
                        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                            <Brain />

                            <h3 className="mt-4 text-lg font-semibold">{t('empty')}</h3>
                            <p className="mb-4 mt-2 text-sm text-muted-foreground">
                                {t('emptyCallToAction')}
                            </p>
                            <Button size="sm" className="relative" asChild>
                                <Link href="/projects/create">
                                    <Plus className="mr-2" />
                                    {t('create')}
                                </Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <ProjectList categories={categories} />
                )}
            </div >
        </>
    )
}
