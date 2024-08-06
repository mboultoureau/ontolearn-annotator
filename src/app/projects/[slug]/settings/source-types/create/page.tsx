import DataTypeForm from "@/app/_components/data-type/form"
import { Button } from "@/app/_components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/app/_components/ui/card"
import { fetchProject } from "@/services/projects"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"

type Props = {
    params: {
        slug: string
    }
}

export default async function CreateDataTypePage({ params }: Props) {
    const t = await getTranslations("SourceType.Create")
    const project = await fetchProject({ slug: params.slug });
    if (!project) {
        notFound();
    }

    const formId = "create-data-type"

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTypeForm formId={formId} displaySubmit={false} projectId={project.id} />
            </CardContent>
            <CardFooter className="border-t px-6 py-4 flex justify-end">
                <Button form={formId} type="submit">{t('submit')}</Button>
            </CardFooter>
        </Card>
    )
}
