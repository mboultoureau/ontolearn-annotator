import { columns } from "@/app/_components/task/columns";
import { DataTable } from "@/app/_components/task/data-table";
import { Button } from "@/app/_components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import { fetchProject } from "@/services/projects";
import { api, HydrateClient } from "@/trpc/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function DataPage({
  params,
}: {
  params: { slug: string };
}) {
  const t = await getTranslations("Task.List");

  const project = await fetchProject({
    slug: params.slug,
  });

  if (!project) {
    notFound();
  }

  const tasks = await api.task.get({
    projectId: project.id,
  });
  void api.task.get.prefetch({
    projectId: project.id,
  });

  return (
    <HydrateClient>
      <div className="mx-auto flex justify-between w-full max-w-6xl gap-2">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <Button asChild>
          <Link href={`/projects/${params.slug}/viewer`}>{t("start")}</Link>
        </Button>
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <Tabs defaultValue="assigned-to-me">
          <TabsList>
            <TabsTrigger value="assigned-to-me">
              {t("assignedToMe")}
            </TabsTrigger>
            <TabsTrigger value="all">{t("all")}</TabsTrigger>
          </TabsList>
          <TabsContent value="assigned-to-me">
            <DataTable columns={columns} data={tasks} />
          </TabsContent>
          <TabsContent value="all">
            <DataTable columns={columns} data={tasks} />
          </TabsContent>
        </Tabs>
      </div>
    </HydrateClient>
  );
}
