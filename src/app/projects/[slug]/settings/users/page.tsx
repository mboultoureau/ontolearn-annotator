
import { fetchProject } from "@/services/projects"
import { getTranslations } from "next-intl/server"
import { CanRead } from "@/lib/components/permission-gates"
import { getAbacPermissions, getProjectPermissions, canWrite } from "@/lib/abac"
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

    const permissions = await getAbacPermissions();
    const projectPermissions = getProjectPermissions(permissions, project.id);
    const readOnly = !canWrite(projectPermissions, "settings.user");

    return (
        <>
            <CanRead projectId={project.id} resource="settings.user" fallback={t('noAccess', { settings: t('users') })}>
                <UserTableWrapper members={project.members} readOnly={readOnly} />
            </CanRead>
        </>
    )
}
