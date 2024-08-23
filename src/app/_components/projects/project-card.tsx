import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Prisma, Project } from "@prisma/client";
import { useTranslations } from "next-intl";
import ProjectForm from "./form";

type Props = {
  project: Prisma.ProjectGetPayload<{
    include: {
      categories: true
    }
  }>;
};

export default function ProjectCard({ project }: Props) {
  const t = useTranslations("Project.Form");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("edit")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ProjectForm
          formId="create-project"
          displaySubmit={false}
          data={project}
        />
      </CardContent>
      <CardFooter className="border-t px-6 py-4 flex justify-end">
        <Button form="create-project" type="submit">
          {t("submit")}
        </Button>
      </CardFooter>
    </Card>
  );
}
