"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
import { X, User, Calendar, Award, Target, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { ImageWithMultipleAreas, type AreaOverlay } from "@/app/_components/common/image-with-multiple-areas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";

type Rectangle = { x: number; y: number; width: number; height: number };

type AoiAnnotationMeta = {
  author?: string;
  userId?: string | null;
  confidence?: number | null;
  quality?: string | null;
  createdAt?: string | Date;
  classes?: Array<{ value: string; label?: string; rank: number }>;
};

type Aoi =
  | { type: "rectangle"; coordinates: Rectangle; meta?: { id?: string; annotations?: AoiAnnotationMeta[] } }
  | { type: "polygon"; coordinates: number[][]; meta?: { id?: string; annotations?: AoiAnnotationMeta[] } };

interface AoiPreviewModalProps {
  trigger: React.ReactNode;
  imageUrl: string;
  aois: Aoi[];
  title?: string;
  annotationCount?: number;
  aoiCount?: number;
  annotators?: string[];
  lastAnnotated?: Date | null;
}

export default function AoiPreviewModal({
  trigger,
  imageUrl,
  aois,
  title = "Annotation Preview",
  annotationCount = 0,
  aoiCount = 0,
  annotators = [],
  lastAnnotated,
}: AoiPreviewModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedAoi, setSelectedAoi] = useState<number | null>(null);

  // Convert AOIs to AreaOverlay format
  const areas: AreaOverlay[] = aois.map((aoi, idx) => {
    let coordinates;
    let strokeColor;
    let fillColor;

    if (aoi.type === "polygon") {
      coordinates = aoi.coordinates.map(([x, y]) => ({ x, y }));
      strokeColor = selectedAoi === idx ? "#8b5cf6" : "#10b981"; // purple when selected, green otherwise
      fillColor = selectedAoi === idx ? "rgba(139,92,246,0.25)" : "rgba(16,185,129,0.15)";
    } else if (aoi.type === "rectangle") {
      const { x, y, width, height } = aoi.coordinates;
      coordinates = [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
      ];
      strokeColor = selectedAoi === idx ? "#8b5cf6" : "#3b82f6"; // purple when selected, blue otherwise
      fillColor = selectedAoi === idx ? "rgba(139,92,246,0.25)" : "rgba(59,130,246,0.15)";
    } else {
      return null;
    }

    // Extract classes from annotations
    const classes: string[] = [];
    if (aoi.meta?.annotations) {
      aoi.meta.annotations.forEach((ann) => {
        if (ann.classes) {
          ann.classes.forEach((cls) => {
            if (!classes.includes(cls.value)) {
              classes.push(cls.value);
            }
          });
        }
      });
    }

    return {
      id: aoi.meta?.id || `aoi-${idx}`,
      coordinates,
      label: `AOI #${idx + 1}`,
      classes,
      strokeColor,
      fillColor,
    };
  }).filter(Boolean) as AreaOverlay[];

  // Get all unique classes across all AOIs
  const allClasses = Array.from(
    new Set(
      aois.flatMap((aoi) =>
        aoi.meta?.annotations?.flatMap((ann) => ann.classes?.map((c) => c.value) || []) || []
      )
    )
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>{annotationCount} annotations</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="w-4 h-4" />
                  <span>{aoiCount} AOIs</span>
                </div>
                {lastAnnotated && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{lastAnnotated.toLocaleDateString()}</span>
                  </div>
                )}
                {annotators.length > 0 && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{annotators.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
              <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                Overview
              </TabsTrigger>
              <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                Details
              </TabsTrigger>
              <TabsTrigger value="classes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                Classes ({allClasses.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 overflow-auto mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 h-full">
                {/* Image */}
                <div className="relative bg-gray-50 rounded-lg overflow-hidden border">
                  <ImageWithMultipleAreas imageUrl={imageUrl} areas={areas} coordinateSystem="pixel" />
                </div>

                {/* AOI List */}
                <div className="space-y-3 overflow-auto">
                  <h3 className="text-sm font-semibold text-gray-700 sticky top-0 bg-white py-2">
                    Areas of Interest ({aois.length})
                  </h3>
                  {aois.map((aoi, idx) => {
                    const isSelected = selectedAoi === idx;
                    const annCount = aoi.meta?.annotations?.length || 0;
                    const classCount =
                      new Set(
                        aoi.meta?.annotations?.flatMap((ann) => ann.classes?.map((c) => c.value) || []) || []
                      ).size;

                    return (
                      <div
                        key={`aoi-${idx}`}
                        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                          isSelected ? "border-purple-500 bg-purple-50 shadow-md" : "border-gray-200 bg-white"
                        }`}
                        onClick={() => setSelectedAoi(isSelected ? null : idx)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                aoi.type === "polygon" ? "bg-green-500" : "bg-blue-500"
                              }`}
                            />
                            <span className="font-medium text-sm">AOI #{idx + 1}</span>
                          </div>
                          <span className="text-xs text-gray-500">{aoi.type}</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>{annCount} annotation{annCount !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span>{classCount} class{classCount !== 1 ? "es" : ""}</span>
                          </div>
                        </div>
                        {aoi.meta?.annotations && aoi.meta.annotations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex flex-wrap gap-1">
                              {Array.from(
                                new Set(
                                  aoi.meta.annotations.flatMap((ann) => ann.classes?.map((c) => c.value) || [])
                                )
                              ).map((cls) => (
                                <span
                                  key={cls}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                                >
                                  {cls}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="flex-1 overflow-auto mt-4">
              <div className="space-y-4">
                {aois.map((aoi, idx) => (
                  <div key={`aoi-detail-${idx}`} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          aoi.type === "polygon" ? "bg-green-500" : "bg-blue-500"
                        }`}
                      />
                      <span className="font-semibold">AOI #{idx + 1}</span>
                      {aoi.meta?.id && <span className="text-xs text-gray-500">({aoi.meta.id})</span>}
                    </div>
                    {aoi.meta?.annotations && aoi.meta.annotations.length > 0 ? (
                      <div className="space-y-3">
                        {aoi.meta.annotations.map((ann, i) => (
                          <div key={`ann-${i}`} className="p-3 bg-gray-50 border rounded-lg">
                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-600">Author:</span>
                                <span className="font-medium">{ann.author || "—"}</span>
                              </div>
                              {ann.createdAt && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-600">Date:</span>
                                  <span className="font-medium">
                                    {new Date(ann.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {typeof ann.confidence === "number" && (
                                <div className="flex items-center gap-1">
                                  <Target className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-600">Confidence:</span>
                                  <span className="font-medium">{(ann.confidence * 100).toFixed(0)}%</span>
                                </div>
                              )}
                              {ann.quality && (
                                <div className="flex items-center gap-1">
                                  <Award className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-600">Quality:</span>
                                  <span className="font-medium">{ann.quality}</span>
                                </div>
                              )}
                            </div>
                            {ann.classes && ann.classes.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="text-xs text-gray-600 mb-1">Classifications:</div>
                                <div className="flex flex-wrap gap-1">
                                  {ann.classes
                                    .slice()
                                    .sort((a, b) => a.rank - b.rank)
                                    .map((cls) => (
                                      <span
                                        key={`${cls.value}-${cls.rank}`}
                                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                                        title={cls.label || cls.value}
                                      >
                                        {cls.value}
                                        {cls.rank > 0 && <span className="ml-1 text-blue-400">#{cls.rank}</span>}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No annotation details available.</p>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="classes" className="flex-1 overflow-auto mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allClasses.map((className) => {
                  const classAnnotations = aois.flatMap((aoi, aoiIdx) =>
                    (aoi.meta?.annotations || [])
                      .filter((ann) => ann.classes?.some((c) => c.value === className))
                      .map((ann) => ({ ann, aoiIdx }))
                  );

                  return (
                    <div key={className} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm">{className}</h4>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {classAnnotations.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {classAnnotations.map(({ ann, aoiIdx }, idx) => (
                          <div key={idx} className="text-xs text-gray-600 border-l-2 border-blue-300 pl-2">
                            <div className="font-medium">AOI #{aoiIdx + 1}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span>{ann.author}</span>
                              {ann.createdAt && (
                                <span className="text-gray-400">
                                  {new Date(ann.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {allClasses.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No classifications found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end pt-4 border-t mt-4">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
