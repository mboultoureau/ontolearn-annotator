
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/app/_components/ui/card"
import { fetchProject } from "@/services/projects"
import { getTranslations } from "next-intl/server"
import { columns } from "./columns"
import { DataTable } from "./data-table"

type Props = {
    params: {
        slug: string
    }
}

export default async function UserSettingPage({ params }: Props) {
    const t = await getTranslations("Project.Settings")

    const project = await fetchProject({
        slug: params.slug,
        args: {
            include: {
                members: {
                    include: {
                        user: true
                    }
                }
            }
        }
    });

    return (
        <>
            <Card x-chunk="dashboard-04-chunk-1">
                <CardHeader>
                    <CardTitle>{t('users')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={project.members} />
                </CardContent>
            </Card>
        </>
    )
}
