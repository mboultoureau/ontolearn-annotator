import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { WorkflowAnnotator } from "@/app/_components/workflow/workflow-annotator";

async function fetchDataFile(projectId: string, dataFileId: string) {
  return prisma.dataFile.findFirst({
    where: {
      id: dataFileId,
      source: { projectId },
      destination: "MANUAL",
    },
  });
}

async function fetchProject(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
  });
}

async function fetchWorkflowConfig(projectId: string): Promise<string | null> {
  const config = await prisma.configuration.findUnique({
    where: {
      projectId_type: {
        projectId,
        type: "annotation_workflow",
      },
    },
  });

  return (config?.settings as { workflow?: string })?.workflow || null;
}

export default async function AnnotateDataFilePage({ params }: { params: { slug: string; dataFileId: string } }) {
  const { slug, dataFileId } = params;
  const project = await fetchProject(slug);
  if (!project) {
    return notFound();
  }
  const dataFile = await fetchDataFile(project.id, dataFileId);

  if (!dataFile || !dataFile.filePath) {
    return notFound();
  }

  // Fetch workflow configuration from database
  const workflowYaml = await fetchWorkflowConfig(project.id);

  // For now we do not have user auth wired here; using placeholder user id
  const userId = "user-67890";

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Annotate image</h1>
        <p className="text-gray-600">{dataFile.name}</p>
      </div>

      <WorkflowAnnotator
        projectId={project.id}
        dataFileId={dataFileId}
        userId={userId}
        imageUrl={dataFile.filePath}
        workflowYaml={workflowYaml || undefined}
      />
    </div>
  );
}
