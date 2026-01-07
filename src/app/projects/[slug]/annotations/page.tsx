import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

async function fetchDataFiles(projectId: string) {
  return prisma.dataFile.findMany({
    where: {
      source: {
        projectId,
      },
      destination: "MANUAL",
      type: { in: ["IMAGE", "DEEP_ZOOM_IMAGE"] },
    },
    include: {
      annotations: {
        include: {
          annotationTypes: {
            include: { classType: true },
          },
          areaOfInterest: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function fetchProject(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
  });
}

function DataFilesTable({ slug, dataFiles }: { slug: string; dataFiles: Awaited<ReturnType<typeof fetchDataFiles>> }) {
  return (
    <table className="min-w-full text-sm border">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-3 py-2 text-left text-gray-700">Name</th>
          <th className="px-3 py-2 text-left text-gray-700">Type</th>
          <th className="px-3 py-2 text-left text-gray-700">Annotations</th>
          <th className="px-3 py-2 text-left text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {dataFiles.map((df) => {
          const annotated = df.annotations.length > 0;
          return (
            <tr key={df.id} className="border-t">
              <td className="px-3 py-2">{df.name}</td>
              <td className="px-3 py-2">{df.type}</td>
              <td className="px-3 py-2">{df.annotations.length}</td>
              <td className="px-3 py-2 space-x-2">
                {!annotated && (
                  <Link
                    className="text-blue-600 hover:underline"
                    href={`/projects/${slug}/annotations/${df.id}`}
                  >
                    Annotate
                  </Link>
                )}
                {annotated && (
                  <details className="inline-block">
                    <summary className="cursor-pointer text-gray-700 underline">View</summary>
                    <pre className="mt-2 max-h-48 overflow-auto bg-gray-50 p-2 border text-xs text-gray-800">
                      {JSON.stringify(df.annotations, null, 2)}
                    </pre>
                  </details>
                )}
              </td>
            </tr>
          );
        })}
        {dataFiles.length === 0 && (
          <tr>
            <td colSpan={4} className="px-3 py-2 text-center text-gray-500">
              No data files found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default async function AnnotationsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const project = await fetchProject(slug);
  if (!project) {
    return notFound();
  }
  const projectId = project.id;
  const dataFiles = await fetchDataFiles(projectId);

  if (!dataFiles) return notFound();

  const unannotated = dataFiles.filter((d) => d.annotations.length === 0);
  const annotated = dataFiles.filter((d) => d.annotations.length > 0);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Project Annotations</h1>
        <p className="text-gray-600">Images pending manual review and existing annotations.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Pending annotation ({unannotated.length})</h2>
        <Suspense fallback={<div>Loading...</div>}>
          <DataFilesTable slug={slug} dataFiles={unannotated} />
        </Suspense>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Annotated ({annotated.length})</h2>
        <Suspense fallback={<div>Loading...</div>}>
          <DataFilesTable slug={slug} dataFiles={annotated} />
        </Suspense>
      </div>
    </div>
  );
}
