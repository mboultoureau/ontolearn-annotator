/**
 * ImageWithAreaOverlay Component
 * 
 * Displays an image with polygon/rectangle area overlays using Annotorious (read-only)
 * Used in:
 * - Read-only step renderer (workflow history)
 * - Annotation preview modal
 */

"use client";

import { useEffect, useRef, useState } from "react";

interface Coordinate {
  x: number;
  y: number;
}

interface ImageWithAreaOverlayProps {
  imageUrl: string;
  coordinates?: Coordinate[];
  alt?: string;
  className?: string;
  strokeColor?: string;
  fillColor?: string;
  showPoints?: boolean;
  coordinateSystem?: "normalized" | "pixel";
}

function isDzi(url: string): boolean {
  return /\.dzi(\?|$)/.test(url);
}

// Convert our coordinate format to Annotorious WebAnnotation format
function coordinatesToAnnotation(coordinates: Coordinate[], imageUrl: string, coordinateSystem: "normalized" | "pixel") {
  // For pixel coordinates, create SVG polygon selector
  if (coordinateSystem === "pixel") {
    const points = coordinates.map(c => `${c.x},${c.y}`).join(' ');
    return {
      "@context": "http://www.w3.org/ns/anno.jsonld",
      "id": "#area-overlay",
      "type": "Annotation",
      "body": [],
      "target": {
        "source": imageUrl,
        "selector": {
          "type": "SvgSelector",
          "value": `<svg><polygon points="${points}"></polygon></svg>`
        }
      }
    };
  }
  
  // For normalized coordinates, we'd need the natural image size to convert
  // For now, treat as pixel (this should work if your workflow uses pixel coords)
  const points = coordinates.map(c => `${c.x},${c.y}`).join(' ');
  return {
    "@context": "http://www.w3.org/ns/anno.jsonld",
    "id": "#area-overlay",
    "type": "Annotation",
    "body": [],
    "target": {
      "source": imageUrl,
      "selector": {
        "type": "SvgSelector",
        "value": `<svg><polygon points="${points}"></polygon></svg>`
      }
    }
  };
}

export function ImageWithAreaOverlay({
  imageUrl,
  coordinates,
  alt = "Image with area overlay",
  className = "",
  strokeColor = "#3b82f6",
  fillColor = "rgba(59, 130, 246, 0.15)",
  showPoints = true,
  coordinateSystem = "normalized",
}: ImageWithAreaOverlayProps) {
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (!isMounted) return;
    if (!containerRef.current || !imageUrl) return;
    if (!coordinates || coordinates.length < 3) return;

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

      // Initialize Annotorious in read-only mode
      annotorious = Annotorious.default(viewerInstance, { 
        readOnly: true,
        disableEditor: true,
      });

      // Add the annotation
      const annotation = coordinatesToAnnotation(coordinates, imageUrl, coordinateSystem);
      annotorious.addAnnotation(annotation);
    }).catch(err => {
      console.error('[ImageWithAreaOverlay] Failed to load viewer:', err);
    });

    return () => {
      viewerInstance?.destroy();
    };
  }, [imageUrl, coordinates, coordinateSystem, isMounted]);

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
          style={{ width: '100%', height: '400px' }}
        />
      )}
    </div>
  );
}
