import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AoiPreviewModal from "@/app/_components/annotations/aoi-preview-modal";
import { Button } from "@/app/_components/ui/button";

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
                {annotated && (() => {
                  // Build AOIs from unique AreaOfInterest ids and attach annotation details
                  type NormalizedAoi = { type: 'polygon' | 'rectangle'; coordinates: any; meta?: { id?: string; annotations?: Array<{ author?: string; userId?: string | null; confidence?: number | null; quality?: string | null; createdAt?: string | Date; classes?: Array<{ value: string; label?: string; rank: number }> }> } };
                  const aoiMap = new Map<string, NormalizedAoi>();
                  // First pass: create AOI entries
                  for (const ann of df.annotations) {
                    const aoi = ann.areaOfInterest as any;
                    if (!aoi?.area || !aoi?.id) continue;
                    if (!aoiMap.has(aoi.id)) {
                      const area = aoi.area as any;
                      const normalized: NormalizedAoi = Array.isArray(area)
                        ? { type: "polygon", coordinates: area, meta: { id: aoi.id, annotations: [] } }
                        : { type: "rectangle", coordinates: area, meta: { id: aoi.id, annotations: [] } };
                      aoiMap.set(aoi.id, normalized);
                    }
                  }
                  // Second pass: attach annotation info
                  for (const ann of df.annotations) {
                    const aoi = ann.areaOfInterest as any;
                    if (!aoi?.id) continue;
                    const entry = aoiMap.get(aoi.id);
                    if (!entry) continue;
                    const classes = (ann.annotationTypes || [])
                      .map(at => {
                        const ct: any = at.classType;
                        const value = ct?.value ?? ct?.name ?? String(ct?.id ?? '');
                        return { value, label: ct?.name ?? ct?.label ?? undefined, rank: at.rank };
                      });
                    entry.meta!.annotations!.push({
                      author: ann.author,
                      userId: ann.userId,
                      confidence: ann.confidence,
                      quality: ann.quality,
                      createdAt: ann.createdAt as any,
                      classes,
                    });
                  }

                  const aois = Array.from(aoiMap.values());
                  return (
                    <AoiPreviewModal
                      trigger={<Button variant="outline" size="sm">View</Button>}
                      imageUrl={df.filePath || ""}
                      aois={aois as any}
                      title={df.name || "Annotation Preview"}
                      details={
                        <div className="text-xs text-gray-700 space-y-1">
                          <div>Annotations: {df.annotations.length}</div>
                          <div>AOIs: {aois.length}</div>
                        </div>
                      }
                    />
                  );
                })()}
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
