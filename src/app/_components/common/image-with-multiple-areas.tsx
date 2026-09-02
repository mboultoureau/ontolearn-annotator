/**
 * ImageWithMultipleAreas Component
 * 
 * Displays a single image with multiple area overlays using Annotorious (read-only)
 * Shows tooltip with area info on hover
 */

"use client";

import { useEffect, useRef, useState } from "react";

interface Coordinate {
  x: number;
  y: number;
}

export interface AreaOverlay {
  id: string;
  coordinates: Coordinate[];
  label?: string;
  classes?: string[];
  strokeColor?: string;
  fillColor?: string;
}

interface ImageWithMultipleAreasProps {
  imageUrl: string;
  areas: AreaOverlay[];
  alt?: string;
  className?: string;
  coordinateSystem?: "normalized" | "pixel";
}

function isDzi(url: string): boolean {
  return /\.dzi(\?|$)/.test(url);
}

// Convert area to Annotorious WebAnnotation format
function areaToAnnotation(area: AreaOverlay, imageUrl: string) {
  const points = area.coordinates.map(c => `${c.x},${c.y}`).join(' ');
  
  // Include classes in the body for tooltip display
  const body = area.classes && area.classes.length > 0 
    ? area.classes.map(cls => ({
        type: "TextualBody",
        value: cls,
        purpose: "tagging"
      }))
    : [];

  return {
    "@context": "http://www.w3.org/ns/anno.jsonld",
    "id": `#${area.id}`,
    "type": "Annotation",
    "body": body,
    "target": {
      "source": imageUrl,
      "selector": {
        "type": "SvgSelector",
        "value": `<svg><polygon points="${points}"></polygon></svg>`
      }
    }
  };
}

export function ImageWithMultipleAreas({
  imageUrl,
  areas,
  alt = "Image with annotations",
  className = "",
  coordinateSystem = "pixel",
}: ImageWithMultipleAreasProps) {
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!containerRef.current || !imageUrl) return;
    if (!areas || areas.length === 0) return;

    let viewerInstance: any = null;
    let annotorious: any = null;

    // Dynamic import on client-side only
    Promise.all([
      import('openseadragon'),
      // @ts-ignore - no types available
      import('@recogito/annotorious-openseadragon'),
      // @ts-ignore - CSS import
      import('@recogito/annotorious-openseadragon/dist/annotorious.min.css')
    ]).then(([OpenSeadragon, Annotorious]) => {
      if (!containerRef.current) return;

      viewerInstance = OpenSeadragon.default({
        element: containerRef.current,
        tileSources: isDzi(imageUrl) ? imageUrl : { type: 'image', url: imageUrl },
        showNavigationControl: false,
        gestureSettingsTouch: {
          pinchRotate: false
        },
      } as any);

      // Initialize Annotorious in read-only mode but allow tooltips
      annotorious = Annotorious.default(viewerInstance, { 
        readOnly: true,
        disableEditor: false, // Allow hover tooltips
      });

      // Add all annotations
      areas.forEach(area => {
        const annotation = areaToAnnotation(area, imageUrl);
        annotorious.addAnnotation(annotation);
      });
    }).catch(err => {
      console.error('[ImageWithMultipleAreas] Failed to load viewer:', err);
    });

    return () => {
      viewerInstance?.destroy();
    };
  }, [imageUrl, areas, coordinateSystem, isMounted]);

  return (
    <div className={`relative w-full bg-gray-100 rounded border overflow-hidden ${className}`}>
      {!isMounted ? (
        <div className="w-full h-96 flex items-center justify-center text-gray-500">
          Loading viewer...
        </div>
      ) : (
        <div 
          ref={containerRef} 
          className="seadragon-viewer" 
          style={{ width: '100%', height: '500px' }}
        />
      )}
    </div>
  );
}
