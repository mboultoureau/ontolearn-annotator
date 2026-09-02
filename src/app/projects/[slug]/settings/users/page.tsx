
import { fetchProject } from "@/services/projects"
import { getTranslations } from "next-intl/server"
import { checkPermission } from "@/lib/abac-client"
import { notFound } from "next/navigation"
import { UserTableWrapper } from "./user-table-wrapper"

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

    if (!project) {
        notFound();
    }

    const canRead = await checkPermission(project.id, "settings:read");
    const readOnly = !(await checkPermission(project.id, "settings:write"));

    if (!canRead) {
        return <div>{t('noAccess', { settings: t('users') })}</div>;
    }

    return (
        <>
            <UserTableWrapper members={project.members} readOnly={readOnly} />
        </>
    )
}
