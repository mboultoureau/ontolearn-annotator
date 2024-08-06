


import RecentDataTable from "@/app/_components/data/recent-data-table";
import StatisticsCard from "@/app/_components/statistics/statistics-card";
import StatisticsHeader from "@/app/_components/statistics/statistics-header";
import prisma from "@/lib/prisma";
import { fetchProject } from "@/services/projects";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type Props = {
    params: {
        slug: string;
    };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const project = await fetchProject({ slug: params.slug });
    
    return {
      title: project.name,
      description: project.description
    }
  }

export default async function DashboardPage({ params }: Props) {
    const t = await getTranslations("Project.Dashboard");

    const project = await fetchProject({ slug: params.slug });
    if (!project) {
        notFound();
    }

    const statistics = await prisma.statistics.findMany({
        where: {
            projectId: project.id,
        },
        orderBy: {
            epoch: "asc",
        }
    });

    return (
        <>
            <div className="mx-auto grid w-full max-w-6xl gap-2">
                <h1 className="text-3xl font-semibold">{project.name}</h1>
            </div>

            <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatisticsHeader projectId={project.id} />
            </div>
            <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-7">
                <StatisticsCard statistics={statistics} />
                <RecentDataTable projectId={project.id} />
            </div>
        </>
    )
}
