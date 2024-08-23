import DataTypeForm from "@/app/_components/data-type/form"
import { Button } from "@/app/_components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/app/_components/ui/card"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { db } from "@/server/db"

type Props = {
    params: {
        slug: string;
        sourceType: string;
    }
}

export default async function EditDataTypePage({ params }: Props) {
    const t = await getTranslations("DataTypes.Form")
    const project = await db.project.findFirst({
        where: {
            slug: params.slug
        }
    })

    if (!project) {
        notFound();
    }

    const sourceType = await db.sourceType.findFirst({
        where: {
            name: params.sourceType,
            projectId: project.id
        },
        include: {
            fields: true
        }
    })

    if (!sourceType) {
        notFound();
    }

    const formId = "create-data-type"

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('edit')}</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTypeForm formId={formId} displaySubmit={false} projectId={sourceType.projectId} data={sourceType} />
            </CardContent>
            <CardFooter className="border-t px-6 py-4 flex justify-end">
                <Button form={formId} type="submit">{t('save')}</Button>
            </CardFooter>
        </Card>
    )
}
