import HeaderCard from "@/app/_components/projects/header-card";
import { fetchHeaderStatistics } from "@/services/statistics";
import { Database, Tags, Target, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

export type Props = {
    projectId: string;
}

export default async function StatisticsHeader({ projectId }: Props) {
    const t = await getTranslations("Project.Statistics")
    const statistics = await fetchHeaderStatistics(projectId);

    return (
        <>
            <HeaderCard
                title={t('accuracy')}
                value={t('accuracyValue', { value: (statistics.accuracy.value  * 100).toFixed(2) })}
                icon={<Target className="h-4 w-4 text-muted-foreground" />}
            />
            <HeaderCard
                title={t('data')}
                value={t('dataValue', { value: statistics.data.value })}
                icon={<Database className="h-4 w-4 text-muted-foreground" />}
            />
            <HeaderCard
                title={t('annotatedData')}
                value={t('annotatedDataValue', {value: statistics.annotatedData.value})}
                icon={<Tags className="h-4 w-4 text-muted-foreground" />}
            />
            <HeaderCard
                title={t('users')}
                value={t('usersValue', { value: statistics.users.value })}
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
        </>
    )
}