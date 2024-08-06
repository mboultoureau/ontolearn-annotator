import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import fetchLastData from "@/services/data";
import { fetchHeaderStatistics } from "@/services/statistics";
import { getTranslations } from "next-intl/server";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export type Props = {
    projectId: string;
}

export default async function RecentDataTable({ projectId }: Props) {
    const t = await getTranslations("Data.Table");
    const statistics = await fetchHeaderStatistics(projectId);
    const data = await fetchLastData(projectId);

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>{t('recentData')}</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={data} />
            </CardContent>
        </Card>
    )
}