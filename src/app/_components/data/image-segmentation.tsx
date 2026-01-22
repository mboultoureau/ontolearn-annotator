'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/app/_components/ui/button';
import { v4 as uuid } from 'uuid';
// @ts-ignore
import BetterPolygon from '@recogito/annotorious-better-polygon';
// @ts-ignore
import * as Annotorious from '@recogito/annotorious-openseadragon';
import '@recogito/annotorious-openseadragon/dist/annotorious.min.css';
import OpenSeadragon from 'openseadragon';

interface ImageSegmentationProps {
  imageUrl: string;
  toolType?: 'rectangle' | 'polygon' | 'both';
  allowMultiple?: boolean;
  onAreaSelected: (coordinates: any) => void;
}

function isDzi(url: string): boolean {
  return /\.dzi(\?|$)/.test(url);
}

function parseAnnotationGeometry(annotation: any) {
  const selector = annotation?.target?.selector;
  if (!selector) return { type: 'unknown', raw: annotation };

  // Rectangle via Media Fragment: xywh=pixel:x,y,w,h (allow floats)
  if (selector.type === 'FragmentSelector' && typeof selector.value === 'string') {
    const m = selector.value.match(/xywh=pixel:([0-9.]+),([0-9.]+),([0-9.]+),([0-9.]+)/);
    if (m) {
      return {
        type: 'rectangle',
        coordinates: { x: Number(m[1]), y: Number(m[2]), width: Number(m[3]), height: Number(m[4]) },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Polygon via SVG selector with <polygon points="x,y ...">
  if (selector.type === 'SvgSelector' && typeof selector.value === 'string') {
    const pointsMatch = selector.value.match(/points=\"([^\"]+)\"/);
    if (pointsMatch) {
      const pointsStr = pointsMatch[1];
      const points = pointsStr
        .trim()
        .split(/\s+/)
        .map((p: string) => p.split(',').map((n: string) => Number(n)))
        .filter((arr: number[]) => arr.length === 2);
      if (points.length > 2) {
        return {
          type: 'polygon',
          coordinates: points,
          timestamp: new Date().toISOString(),
        };
      }
    }
  }

  return { type: 'unknown', raw: annotation };
}

export function ImageSegmentation({
  imageUrl,
  toolType = 'polygon',
  allowMultiple = false,
  onAreaSelected,
}: ImageSegmentationProps) {
  const t = useTranslations("Workflow.areaSelect");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewer, setViewer] = useState<OpenSeadragon.Viewer | null>(null);
  const [annotate, setAnnotate] = useState<any>(null);
  const [selectedTool, setSelectedTool] = useState<'mouse' | 'rectangle' | 'polygon'>(
    toolType === 'rectangle' ? 'rectangle' : 'polygon'
  );
  // Store only raw coordinates (rectangle object or polygon points array)
  const [areas, setAreas] = useState<any[]>([]);
  const lastAnnotationRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !imageUrl) return;

    const viewerInstance = OpenSeadragon({
      element: containerRef.current,
      tileSources: isDzi(imageUrl) ? imageUrl : { type: 'image', url: imageUrl },
      showNavigationControl: false,
    } as any);

    setViewer(viewerInstance);

    const annotorious = Annotorious(viewerInstance, { disableEditor: true });
    setAnnotate(annotorious);
    BetterPolygon(annotorious);

    // initialize tool
    annotorious.setDrawingEnabled(true);
    annotorious.setDrawingTool(selectedTool === 'rectangle' ? 'rect' : 'polygon');

    // events
    annotorious.on('createSelection', (selection: any) => {
      // Build a persistent WebAnnotation with an explicit id
      const annotation = {
        ...selection,
        type: 'Annotation',
        id: `#${uuid()}`,
      };

      // Enforce single selection if required: remove all existing first
      if (!allowMultiple && typeof annotorious.getAnnotations === 'function') {
        const existing = annotorious.getAnnotations();
        existing.forEach((a: any) => annotorious.removeAnnotation(a));
      }

      // Add to Annotorious so it stays visible
      annotorious.addAnnotation(annotation, true);

      // Parse and store only raw coordinates for upstream consumer
      const parsed = parseAnnotationGeometry(annotation);
      const coords = parsed.coordinates ?? parsed; // fallback just in case
      if (allowMultiple) {
        setAreas(prev => [...prev, coords]);
      } else {
        setAreas([coords]);
        lastAnnotationRef.current = annotation;
      }

      // Reset selection and keep drawing enabled
      annotorious.cancelSelected();
      annotorious.setDrawingEnabled(true);
    });

    // Listen for annotation updates (when user edits existing annotation)
    annotorious.on('updateAnnotation', (annotation: any, previous: any) => {      
      // Parse the updated coordinates
      const parsed = parseAnnotationGeometry(annotation);
      const coords = parsed.coordinates ?? parsed;

      if (allowMultiple) {
        // Find and update the specific annotation
        setAreas(prev => {
          const idx = prev.findIndex((a: any) => {
            // Try to match by comparing coordinates (rough match)
            return JSON.stringify(a) === JSON.stringify(parseAnnotationGeometry(previous).coordinates ?? parseAnnotationGeometry(previous));
          });
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = coords;
            return updated;
          }
          return prev;
        });
      } else {
        // Single selection: just replace
        setAreas([coords]);
        lastAnnotationRef.current = annotation;
      }
    });

    annotorious.on('cancelSelected', () => {
      // Keep drawing enabled
      annotorious.setDrawingEnabled(true);
    });

    return () => {
      viewerInstance?.destroy();
      setViewer(null);
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!annotate) return;
    if (selectedTool === 'mouse') {
      annotate.setDrawingEnabled(false);
    } else {
      annotate.setDrawingEnabled(true);
      annotate.setDrawingTool(selectedTool === 'rectangle' ? 'rect' : 'polygon');
      annotate.cancelSelected();
    }
  }, [selectedTool, annotate]);

  const handleConfirm = () => {
    // Get fresh annotations from Annotorious in case they were edited
    if (annotate && typeof annotate.getAnnotations === 'function') {
      const currentAnnotations = annotate.getAnnotations();
      
      if (currentAnnotations && currentAnnotations.length > 0) {
        // Parse all current annotations fresh
        const freshAreas = currentAnnotations.map((ann: any) => {
          const parsed = parseAnnotationGeometry(ann);
          return parsed.coordinates ?? parsed;
        });
        
        if (allowMultiple) {
          onAreaSelected(freshAreas);
        } else if (freshAreas[0]) {
          onAreaSelected(freshAreas[0]);
        }
        return;
      }
    }
    
    // Fallback to cached state if Annotorious doesn't have getAnnotations
    if (allowMultiple) {
      onAreaSelected(areas);
    } else if (areas[0]) {
      onAreaSelected(areas[0]);
    }
  };

  const handleClear = () => {
    setAreas([]);
    lastAnnotationRef.current = null;
    if (annotate && typeof annotate.getAnnotations === 'function') {
      const anns = annotate.getAnnotations();
      anns.forEach((a: any) => annotate.removeAnnotation(a));
    }
    annotate?.cancelSelected();
  };

  return (
    <div className="space-y-4">
      <div className="p-2 flex items-center gap-2 text-sm">
        <span className="font-medium">{t("toolLabel")}</span>
        {(toolType === 'polygon' || toolType === 'both') && (
          <Button
            variant={selectedTool === 'polygon' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTool('polygon')}
          >
            {t("tools.polygon")}
          </Button>
        )}
        {(toolType === 'rectangle' || toolType === 'both') && (
          <Button
            variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTool('rectangle')}
          >
            {t("tools.rectangle")}
          </Button>
        )}
        <Button
          variant={selectedTool === 'mouse' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTool('mouse')}
        >
          {t("tools.mouse")}
        </Button>
        {selectedTool === 'mouse' && (
          <span className="ml-2 text-gray-600 italic">{t("mouseHint")}</span>
        )}
        {allowMultiple && (
          <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded">
            {t("multipleAllowed")}
          </span>
        )}
      </div>

      <div className="relative border rounded bg-gray-50" style={{ height: '60vh' }}>
        <div ref={containerRef} className="seadragon-viewer" style={{ position: 'relative', height: '100%' }} />

        {areas.length > 0 && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs">
            ✓ {t("selected", { count: areas.length })}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleConfirm}
          disabled={areas.length === 0}
          className="flex-1"
        >
          {allowMultiple 
            ? t("confirmMultiple", { count: areas.length })
            : t("confirmSingle")}
        </Button>
        {areas.length > 0 && (
          <Button onClick={handleClear} variant="outline">{t("clear")}</Button>
        )}
      </div>
    </div>
  );
}
