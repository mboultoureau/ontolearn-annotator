"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { ImageWithMultipleAreas, type AreaOverlay } from "@/app/_components/common/image-with-multiple-areas";

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
  details?: React.ReactNode; // Additional info (JSON, metadata, etc.)
}

export default function AoiPreviewModal({ trigger, imageUrl, aois, title = "Annotation Preview", details }: AoiPreviewModalProps) {
  const [open, setOpen] = useState(false);

  // Convert AOIs to AreaOverlay format
  const areas: AreaOverlay[] = aois.map((aoi, idx) => {
    let coordinates;
    let strokeColor;
    let fillColor;
    
    if (aoi.type === "polygon") {
      coordinates = aoi.coordinates.map(([x, y]) => ({ x, y }));
      strokeColor = "#10b981"; // green
      fillColor = "rgba(16,185,129,0.15)";
    } else if (aoi.type === "rectangle") {
      const { x, y, width, height } = aoi.coordinates;
      coordinates = [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height }
      ];
      strokeColor = "#3b82f6"; // blue
      fillColor = "rgba(59,130,246,0.15)";
    } else {
      return null;
    }

    // Extract classes from annotations
    const classes: string[] = [];
    if (aoi.meta?.annotations) {
      aoi.meta.annotations.forEach(ann => {
        if (ann.classes) {
          ann.classes.forEach(cls => {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-5xl" aria-describedby="aoi-preview-modal-description">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          {/* Image + AOIs overlay */}
          <div className="relative w-full">
            <ImageWithMultipleAreas
              imageUrl={imageUrl}
              areas={areas}
              coordinateSystem="pixel"
            />
          </div>

          {/* Details */}
          <div className="space-y-4">
            {details}
            <div className="p-3 bg-gray-50 border rounded text-sm space-y-4">
              <div className="font-semibold text-gray-700">AOIs ({aois.length})</div>
              {aois.map((aoi, idx) => (
                <div key={`aoi-${idx}`} className="space-y-1">
                  <div className="text-xs text-gray-600">AOI #{idx + 1} {aoi.meta?.id ? `(${aoi.meta.id})` : ''}</div>
                  {aoi.meta?.annotations && aoi.meta.annotations.length > 0 ? (
                    <div className="space-y-2">
                      {aoi.meta.annotations.map((ann, i) => (
                        <div key={`ann-${i}`} className="p-2 bg-white border rounded">
                          <div className="text-xs text-gray-700">
                            <span className="font-medium">Author:</span> {ann.author || '—'}
                            {ann.userId ? ` · User: ${ann.userId}` : ''}
                            {typeof ann.confidence === 'number' ? ` · Conf: ${ann.confidence.toFixed(2)}` : ''}
                            {ann.quality ? ` · Quality: ${ann.quality}` : ''}
                            {ann.createdAt ? ` · At: ${new Date(ann.createdAt).toLocaleString()}` : ''}
                          </div>
                          {ann.classes && ann.classes.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {ann.classes
                                .slice()
                                .sort((a, b) => a.rank - b.rank)
                                .map(cls => (
                                  <span
                                    key={`${cls.value}-${cls.rank}`}
                                    className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                                    title={cls.label || cls.value}
                                  >
                                    {cls.value}{cls.rank ? ` (#${cls.rank})` : ''}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">No annotation details.</div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-3 bg-gray-50 border rounded text-xs">
              <div className="font-semibold mb-2 text-gray-700">Raw AOIs JSON</div>
              <pre className="overflow-auto max-h-72 text-gray-700">{JSON.stringify(aois, null, 2)}</pre>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
