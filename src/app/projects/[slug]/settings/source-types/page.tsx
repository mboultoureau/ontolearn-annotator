
import { DataTable } from "@/app/_components/data-type/data-table"
import { Button } from "@/app/_components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/app/_components/ui/card"
import { fetchProject } from "@/services/projects"
import { fetchSourceTypes } from "@/services/source-types"
import { Plus } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { checkPermission } from "@/lib/abac-client"

type Props = {
    params: {
        slug: string
    }
}

export default async function DataTypesPage({ params }: Props) {
    const t = await getTranslations("SourceType.List")
    const project = await fetchProject({ slug: params.slug });
    if (!project) {
        notFound();
    }

    const canRead = await checkPermission(project.id, "settings:read");
    const readOnly = !(await checkPermission(project.id, "settings:write"));

    if (!canRead) {
        const tSettings = await getTranslations("Project.Settings");
        return <div>{tSettings('noAccess', { settings: tSettings('sourceTypes') })}</div>;
    }

    const sourceTypes = await fetchSourceTypes(project.id);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-row justify-between items-center">
                        <CardTitle>
                            {t('title')}
                        </CardTitle>
                        {!readOnly && (
                            <Button asChild>
                                <Link href={`/projects/${params.slug}/settings/source-types/create`}>
                                    <Plus className="mr-2" />
                                    {t('create')}
                                </Link>
                            </Button>
                        )}
                    </div>
                    <CardDescription>
                        {t('description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable data={sourceTypes} />
                </CardContent>
            </Card>
        </>
    )
}
