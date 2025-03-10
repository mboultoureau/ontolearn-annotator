import { Statistics } from "@/app/_components/playground/statistics";
import { JsonObject } from "@prisma/client/runtime/library";
import { ReloadIcon } from "@radix-ui/react-icons";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

export default async function Playground({
  params,
}: {
  params: { id: string };
}) {
  const t = await getTranslations("Playground.Index");

  const playgroundTask = await prisma.playgroundTask.findFirst({
    where: {
      id: params.id,
    },
  });

  if (!playgroundTask) {
    return <div>Task not found</div>;
  }

  if (playgroundTask.status !== "COMPLETED") {
    return (
      <div className="m-auto">
        <ReloadIcon className="mr-2 h-16 w-16 animate-spin" />
      </div>
    );
  }

  const prediction = (playgroundTask?.output as { prediction: any[] })?.prediction.map((item) => ({
    name: item["name"],
    value: (parseFloat(item["value"]) * 100).toFixed(3),
  })) || [];

  return (
    <>
      <div className="mx-auto flex justify-between w-full max-w-6xl gap-2">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <Image src={((playgroundTask.input as JsonObject)?.file ?? "").toString()} width={500} height={300} alt="Input" fill />
        <Statistics data={prediction} />
      </div>
    </>
  );
}
