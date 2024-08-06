import UploadForm from "@/app/_components/data/upload-form";
import { fetchProject } from "@/services/projects";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

export default async function UploadData({ params }: { params: { slug: string } }) {

    const t = await getTranslations("Data.Form");

    const project = await fetchProject({
        slug: params.slug,
        args: {
            include: {
                sourceTypes: {
                    select: {
                        id: true,
                        name: true,
                        label: true,
                        fields: true,
                        icon: true
                    }
                }
            }
        }
    });

    if (!project) {
        notFound();
    }

    if (project.sourceTypes.length === 0) {
        redirect(`/projects/${params.slug}/data`);
    }

    return (
        <>
            <div className="mx-auto flex justify-between w-full max-w-6xl gap-2">
                <h1 className="text-3xl font-semibold">{t('title')}</h1>
            </div>
            <div className="mx-auto grid w-full max-w-6xl gap-2">
                <UploadForm project={project} sourceTypes={project.sourceTypes} />
            </div>
        </>
    )
}