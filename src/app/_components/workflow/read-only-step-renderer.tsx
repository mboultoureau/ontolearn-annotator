/**
 * Read-Only Step Renderers
 * 
 * Display completed workflow steps in non-editable format
 */

"use client";

import type { HistoryStep } from "@/lib/workflow-engine/types";
import { CheckCircle2 } from "lucide-react";

interface ReadOnlyStepProps {
  step: HistoryStep;
  stepNumber: number;
}

/**
 * Generic read-only step wrapper
 */
export function ReadOnlyStepWrapper({ 
  step, 
  stepNumber, 
  children 
}: ReadOnlyStepProps & { children: React.ReactNode }) {
  return (
    <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">
              Step {stepNumber}: {step.stateName}
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
export function ReadOnlyAreaSelect({ step, stepNumber }: ReadOnlyStepProps) {
  const payload = step.annotation.payload;
  
  // Handle different payload formats
  let coordinates;
  if (payload && typeof payload === 'object') {
    coordinates = payload.coordinates || payload;
  } else {
    coordinates = payload;
  }
  
  // Extract image URL from state meta (with type safety)
  const imageSource = (step.stateMeta as any)?.imageSource;
  
  return (
    <ReadOnlyStepWrapper step={step} stepNumber={stepNumber}>
      <div className="space-y-2">
        <div className="text-sm text-gray-700">
          <span className="font-medium">Area selected</span>
        </div>
        
        {imageSource && typeof imageSource === 'string' && !imageSource.includes('${') && (
          <div className="relative w-full h-48 bg-gray-100 rounded border">
            <img 
              src={imageSource} 
              alt="Selected area" 
              className="w-full h-full object-contain"
            />
            {/* TODO: Overlay the polygon/rectangle */}
          </div>
        )}
        
        <details className="text-xs text-gray-600">
          <summary className="cursor-pointer hover:text-gray-800">
            View coordinates
          </summary>
          <pre className="mt-2 p-2 bg-white rounded border overflow-auto max-h-32">
            {JSON.stringify(coordinates, null, 2)}
          </pre>
        </details>
      </div>
    </ReadOnlyStepWrapper>
  );
}

/**
 * Read-only choice display
 */
export function ReadOnlyChoice({ step, stepNumber }: ReadOnlyStepProps) {
  const selectedValue = step.annotation.payload;
  
  // Handle different payload formats
  let displayValue: string;
  if (typeof selectedValue === 'string') {
    displayValue = selectedValue;
  } else if (typeof selectedValue === 'object' && selectedValue !== null) {
    // Handle nested objects or complex payloads
    displayValue = JSON.stringify(selectedValue);
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
  const selections = Array.isArray(step.annotation.payload) 
    ? step.annotation.payload 
    : [step.annotation.payload];
  
  return (
    <ReadOnlyStepWrapper step={step} stepNumber={stepNumber}>
      <div className="space-y-2">
        <div className="text-sm text-gray-700 font-medium">Selections:</div>
        <ul className="space-y-1">
          {selections.map((item: any, index: number) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                {item.rank || index + 1}
              </span>
              <span className="text-gray-700">
                {item.value || item.label || item}
              </span>
            </li>
          ))}
        </ul>
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
export function ReadOnlyStepRenderer({ step, stepNumber }: ReadOnlyStepProps) {
  switch (step.stateType) {
    case 'area_select':
      return <ReadOnlyAreaSelect step={step} stepNumber={stepNumber} />;
    
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
