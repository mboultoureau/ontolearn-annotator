import ProjectForm from "@/app/_components/projects/form";
import { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('Project.Create');

    return {
        title: t('title'),
    }
}

export default function CreateProjectPage() {
    const t = useTranslations('Project.Create');

    return (
        <>
            <div className="mx-auto grid w-full max-w-6xl gap-2">
                <h1 className="text-3xl font-semibold">{t('title')}</h1>
            </div>
            <div className="mx-auto grid w-full max-w-6xl gap-2">
                <ProjectForm />
            </div>
        </>
    )
}
