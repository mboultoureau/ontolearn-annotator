


import { columns } from "@/app/_components/data/columns";
import { DataTable } from "@/app/_components/data/data-table";
import { sourceColumns } from "@/app/_components/source/columns";
import SourceDataTable from "@/app/_components/source/data-table";
import { Button } from "@/app/_components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { fetchProject } from "@/services/projects";
import { Upload } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function DataPage({ params }: { params: { slug: string } }) {
    const t = await getTranslations("Data.List")

    const project = await fetchProject({
        slug: params.slug,
        args: {
            include: {
                data: true,
                sourceTypes: true,
                sources: true
            }
        }
    });

    if (!project) {
        notFound();
    }

    return (
        <>
            <div className="mx-auto flex justify-between w-full max-w-6xl gap-2">
                <h1 className="text-3xl font-semibold">{t('title')}</h1>
                {project.sourceTypes.length > 0 ? (
                    <Button asChild>
                        <Link href={`/projects/${params.slug}/data/upload`}>
                            <Upload className="mr-2" />
                            {t('upload')}
                        </Link>
                    </Button>
                ) : (
                    <Button disabled>
                        <Upload className="mr-2" />
                        {t('upload')}
                    </Button>
                )}
            </div>
            <div className="mx-auto grid w-full max-w-6xl gap-2">

                <Tabs defaultValue="data">
                    <TabsList>
                        <TabsTrigger value="data">{t('data')}</TabsTrigger>
                        <TabsTrigger value="sources">{t('sources')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="data">
                        <DataTable columns={columns} data={project.data} />
                    </TabsContent>
                    <TabsContent value="sources">
                        <SourceDataTable columns={sourceColumns} data={project.sources} />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
}
