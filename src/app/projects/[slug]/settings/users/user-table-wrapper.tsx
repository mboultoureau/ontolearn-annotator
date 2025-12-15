"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/app/_components/ui/card"
import { getColumns } from "./columns"
import { DataTable } from "./data-table"
import { ProjectMember } from "@/lib/definitions";
import { useTranslations } from "next-intl";

interface Props {
    members: ProjectMember[];
    readOnly: boolean;
}

export function UserTableWrapper({ members, readOnly }: Props) {
    const t = useTranslations("Project.Settings");
    const columns = getColumns(readOnly);

    return (
        <Card x-chunk="dashboard-04-chunk-1">
            <CardHeader>
                <CardTitle>{t('users')}</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={members} />
            </CardContent>
        </Card>
    );
}
