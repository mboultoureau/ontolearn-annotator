"use client";

import { useTranslations } from "next-intl";
import { Dropzone } from "./dropzone";
import Status from "./status";
import { useState } from "react";
import { PlaygroundTask, Project } from "@prisma/client";
import { Statistics } from "./statistics";
import ProjectBreadcrumb from "../common/project-breadcrumb";

export type Props = {
  project: Project;
};

export default function Playground({ project }: Props) {
  const [playgroundTask, setPlaygroundTask] = useState<PlaygroundTask | null>(
    null
  );

  const t = useTranslations("Playground.Index");

  const onUploaded = (playgroundTask: PlaygroundTask) => {
    setPlaygroundTask(playgroundTask);

    const interval = setInterval(async () => {
      const response = await fetch(
        `/api/v1/projects/${project.id}/playground-tasks/${playgroundTask.id}`
      );
      const data = await response.json();

      if (data.status === "COMPLETED") {
        const prediction = data.output?.prediction.map((p) => {
          return {
            name: p.name,
            value: parseFloat(p.value),
          };
        });

        data.output.prediction = prediction;

        setPlaygroundTask(data);
        clearInterval(interval);
      }
    }, 1000);
  };

  return (
    <>
      <div className="mx-auto flex justify-between w-full max-w-6xl gap-2">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
      </div>
      <ProjectBreadcrumb project={project} page={t("title")} />
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <Dropzone
          fileExtension="jpg"
          projectId={project.id}
          onUploaded={onUploaded}
          status={playgroundTask?.status}
        />
        {playgroundTask && <Status status={playgroundTask.status} />}
        {playgroundTask && playgroundTask.status === "COMPLETED" && (
          <Statistics data={playgroundTask.output?.prediction} />
        )}
      </div>
    </>
  );
}
