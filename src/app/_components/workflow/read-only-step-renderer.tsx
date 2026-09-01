/**
 * Read-Only Step Renderers
 * 
 * Display completed workflow steps in non-editable format
 */

"use client";

import { useTranslations } from "next-intl";
import type { HistoryStep } from "@/lib/workflow-engine/types";
import { CheckCircle2 } from "lucide-react";
import { ImageWithAreaOverlay } from "@/app/_components/common/image-with-area-overlay";

interface ReadOnlyStepProps {
  step: HistoryStep;
  stepNumber: number;
  imageUrl?: string;
}

/**
 * Generic read-only step wrapper
 */
export function ReadOnlyStepWrapper({ 
  step, 
  stepNumber, 
  children 
}: ReadOnlyStepProps & { children: React.ReactNode }) {
  const t = useTranslations("Workflow.history");
  
  return (
    <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">
              {t("stepLabelWithName", { number: stepNumber, name: step.stateName })}
            </h3>
            <span className="text-xs text-gray-500">
              {new Date(step.timestamp).toLocaleTimeString()}
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Read-only area selection display
 */
/**
 * Normalises a list of polygon points.
 *
 * Rectangles arrive as `{x, y, width, height}`, but the polygon tool emits points as
 * `[x, y]` tuples — which is also what ends up in `AreaOfInterest.area`. Only accepting
 * `{x, y}` objects made every polygon render as "Invalid coordinates".
 */
function parsePoints(points: unknown): Array<{ x: number; y: number }> | undefined {
  if (!Array.isArray(points)) {
    return undefined;
  }

  const parsed = points
    .map((point: any) => {
      if (Array.isArray(point) && point.length >= 2) {
        const [x, y] = point;
        if (typeof x === "number" && typeof y === "number") {
          return { x, y };
        }
        return null;
      }

      if (point && typeof point === "object" && "x" in point && "y" in point) {
        return { x: Number(point.x), y: Number(point.y) };
      }

      return null;
    })
    .filter((point): point is { x: number; y: number } => point !== null);

  return parsed.length >= 3 ? parsed : undefined;
}

export function ReadOnlyAreaSelect({ step, stepNumber, imageUrl }: ReadOnlyStepProps) {
  const payload = step.annotation.payload;

  // Handle different payload formats
  let coordinates: Array<{x: number; y: number}> | undefined;

  if (payload && typeof payload === 'object') {
    // Case 1: payload.coordinates exists - could be rectangle or array of points
    if (payload.coordinates) {
      const coords = payload.coordinates;
      
      // Case 1a: coordinates is a rectangle {x, y, width, height}
      if (typeof coords === 'object' && 'x' in coords && 'y' in coords && 'width' in coords && 'height' in coords) {
        const { x, y, width, height } = coords as any;
        coordinates = [
          { x, y },
          { x: x + width, y },
          { x: x + width, y: y + height },
          { x, y: y + height }
        ];
      }
      // Case 1b: coordinates is an array of points ({x,y} objects or [x,y] tuples)
      else if (Array.isArray(coords)) {
        coordinates = parsePoints(coords);
      }
    }
    // Case 2: payload itself is a rectangle {x, y, width, height}
    else if ('x' in payload && 'y' in payload && 'width' in payload && 'height' in payload) {
      const { x, y, width, height } = payload as any;
      coordinates = [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height }
      ];
    }
    // Case 3: payload itself is the coordinates array
    else if (Array.isArray(payload)) {
      coordinates = parsePoints(payload);
    }
  }
  
  // Detect if coordinates are pixel (values > 100) or normalized (0-100)
  const isPixelCoordinates = coordinates && coordinates.some(c => c.x > 100 || c.y > 100);
  const coordinateSystem = isPixelCoordinates ? "pixel" : "normalized";
  
  return (
    <ReadOnlyStepWrapper step={step} stepNumber={stepNumber}>
      <div className="space-y-2">
        <div className="text-sm text-gray-700">
          <span className="font-medium">Area selected</span>
        </div>
        
        {imageUrl && coordinates && coordinates.length >= 3 ? (
          <>
            <ImageWithAreaOverlay
              imageUrl={imageUrl}
              coordinates={coordinates}
              coordinateSystem={coordinateSystem}
              alt="Selected area"
            />
          </>
        ) : (
          <div className="p-4 bg-gray-100 border rounded text-sm text-gray-600">
            {!imageUrl && "No image URL provided"}
            {imageUrl && (!coordinates || coordinates.length < 3) && "Invalid coordinates"}
          </div>
        )}
      </div>
    </ReadOnlyStepWrapper>
  );
}

/**
 * Read-only choice display
 */
export function ReadOnlyChoice({ step, stepNumber }: ReadOnlyStepProps) {
  const selectedValue = step.annotation.payload;

  const getNestedValue = (obj: any): any => {
    if (typeof obj === 'object' && obj !== null) {
      if ('value' in obj) return obj.value;
      if ('label' in obj) return obj.label;
      for (const key in obj) {
        const val = getNestedValue(obj[key]);
        if (val !== undefined) return val;
      }
    }
    return obj;
  };
  
  // Handle different payload formats
  let displayValue: string;
  if (typeof selectedValue === 'string') {
    displayValue = selectedValue;
  } else if (typeof selectedValue === 'object' && selectedValue !== null) {
    // Handle nested objects or complex payloads
    const nestedValue = getNestedValue(selectedValue);
    displayValue = typeof nestedValue === 'string' ? nestedValue : JSON.stringify(nestedValue);
  } else {
    displayValue = String(selectedValue);
  }
  
  return (
    <ReadOnlyStepWrapper step={step} stepNumber={stepNumber}>
      <div className="space-y-2">
        <div className="text-sm text-gray-700">
          <span className="font-medium">Selection:</span>{" "}
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full inline-block">
            {displayValue}
          </span>
        </div>
      </div>
    </ReadOnlyStepWrapper>
  );
}

/**
 * Read-only multi-choice display
 */
export function ReadOnlyMultiChoice({ step, stepNumber }: ReadOnlyStepProps) {
  let selections: any[] = [];
  
  // Extract the actual selections from the payload
  if (Array.isArray(step.annotation.payload)) {
    selections = step.annotation.payload;
  } else if (typeof step.annotation.payload === 'object' && step.annotation.payload !== null) {
    // Handle nested structure like { subsection: { classes: [...] } }
    const payload = step.annotation.payload;
    
    // Try to find the array in the nested structure
    const findArray = (obj: any): any[] => {
      if (Array.isArray(obj)) return obj;
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          const result = findArray(obj[key]);
          if (result.length > 0) return result;
        }
      }
      return [];
    };
    
    selections = findArray(payload);
  } else {
    selections = [step.annotation.payload];
  }
  
  return (
    <ReadOnlyStepWrapper step={step} stepNumber={stepNumber}>
      <div className="space-y-2">
        <div className="text-sm text-gray-700 font-medium">Selections:</div>
        {selections.length > 0 ? (
          <ul className="space-y-1">
            {selections.map((item: any, index: number) => {
              // Safe rendering: ensure we always get a string
              let displayValue: string;
              if (typeof item === 'string') {
                displayValue = item;
              } else if (typeof item === 'object' && item !== null) {
                displayValue = item.value || item.label || JSON.stringify(item);
              } else {
                displayValue = String(item);
              }
              
              return (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                    {(typeof item === 'object' && item?.rank) || index + 1}
                  </span>
                  <span className="text-gray-700">
                    {displayValue}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">No selections</div>
        )}
      </div>
    </ReadOnlyStepWrapper>
  );
}

/**
 * Read-only yes/no display
 */
export function ReadOnlyYesNo({ step, stepNumber }: ReadOnlyStepProps) {
  const payload = step.annotation.payload;
  
  // Handle different payload formats
  let answer: boolean | string;
  if (typeof payload === 'object' && payload !== null && 'answer' in payload) {
    answer = payload.answer;
  } else {
    answer = payload;
  }
  
  const answerText = typeof answer === 'boolean' 
    ? (answer ? 'Yes' : 'No')
    : String(answer);
  
  const isYes = answer === true || answer === 'yes' || answer === 'YES';
  
  return (
    <ReadOnlyStepWrapper step={step} stepNumber={stepNumber}>
      <div className="space-y-2">
        <div className="text-sm text-gray-700">
          <span className="font-medium">Answer:</span>{" "}
          <span className={`px-3 py-1 rounded-full inline-block ${
            isYes 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {answerText}
          </span>
        </div>
      </div>
    </ReadOnlyStepWrapper>
  );
}

/**
 * Main router for read-only step rendering
 */
export function ReadOnlyStepRenderer({ step, stepNumber, imageUrl }: ReadOnlyStepProps) {
  switch (step.stateType) {
    case 'area_select':
      return <ReadOnlyAreaSelect step={step} stepNumber={stepNumber} imageUrl={imageUrl} />;
    
    case 'choice':
      return <ReadOnlyChoice step={step} stepNumber={stepNumber} />;
    
    case 'multi_choice':
      return <ReadOnlyMultiChoice step={step} stepNumber={stepNumber} />;
    
    case 'yes_no':
      return <ReadOnlyYesNo step={step} stepNumber={stepNumber} />;
    
    default:
      return (
        <ReadOnlyStepWrapper step={step} stepNumber={stepNumber}>
          <div className="text-sm text-gray-600">
            State type: {step.stateType}
          </div>
        </ReadOnlyStepWrapper>
      );
  }
}
