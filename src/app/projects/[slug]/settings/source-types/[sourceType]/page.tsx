import DataTypeForm from "@/app/_components/data-type/form"
import { Button } from "@/app/_components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/app/_components/ui/card"
import { fetchDataType } from "@/services/source-types"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"

type Props = {
    params: {
        slug: string;
        sourceType: string;
    }
}

export default async function EditDataTypePage({ params }: Props) {
    const t = await getTranslations("DataTypes.Form")
    const dataType = await fetchDataType(params.slug, params.sourceType);
    if (!dataType) {
        notFound();
    }

    const formId = "create-data-type"

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('edit')}</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTypeForm formId={formId} displaySubmit={false} projectId={dataType.projectId} data={dataType} />
            </CardContent>
            <CardFooter className="border-t px-6 py-4 flex justify-end">
                <Button form={formId} type="submit">{t('save')}</Button>
            </CardFooter>
        </Card>
    )
}
