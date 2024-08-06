import PlaygroundForm from "@/app/_components/playground/form";
import prisma from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function Playground({ params }: { params: { slug: string } }) {
    const t = await getTranslations("Playground.Index");

    const project = await prisma.project.findFirst({
        where: {
            slug: params.slug,
        },
    });

    if (!project) {
        notFound();
    }

    return (
        <>
        <div className="mx-auto flex justify-between w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">{t('title')}</h1>
        </div>
        <div className="mx-auto grid w-full max-w-6xl gap-2">
            <div className="col-span-2">
                <PlaygroundForm projectId={project.id} projectSlug={params.slug} />
            </div>
        </div>
    </>
    );
}