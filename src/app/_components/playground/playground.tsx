"use client";

import { useTranslations } from "next-intl";
import { Dropzone } from "./dropzone";
import Status from "./status";
import { useState } from "react";
import { PlaygroundTask } from "@prisma/client";
import { Statistics } from "./statistics";

export type Props = {
    projectId: string;
};


export default function Playground({ projectId }: Props) {
    const [playgroundTask, setPlaygroundTask] = useState<PlaygroundTask | null>(null);

    const t = useTranslations("Playground.Index");
    
    const onUploaded = (playgroundTask: PlaygroundTask) => {
        setPlaygroundTask(playgroundTask);

        const interval = setInterval(async () => {
            const response = await fetch(`/api/v1/projects/${projectId}/playground-tasks/${playgroundTask.id}`);
            const data = await response.json();
            setPlaygroundTask(data);

            if (data.status === "COMPLETED") {
                clearInterval(interval);
            }
        }, 1000);
    }

    return (
        <>
        <div className="mx-auto flex justify-between w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">{t('title')}</h1>
        </div>
        <div className="mx-auto grid w-full max-w-6xl gap-2">
            <Dropzone fileExtension="jpg" projectId={projectId} onUploaded={onUploaded} status={playgroundTask?.status} />
            {playgroundTask && <Status status={playgroundTask.status} />}
            {playgroundTask && playgroundTask.status === "COMPLETED" && (
                <Statistics data={playgroundTask.output?.prediction} />
            )}
        </div>
    </>
    );
}