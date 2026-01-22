/**
 * History Step Renderer
 * 
 * Renders a workflow step - either as interactive (active) or read-only (completed)
 */

"use client";

import { useTranslations } from "next-intl";
import type { HistoryStep } from "@/lib/workflow-engine/types";
import { WorkflowStateRenderer } from "./workflow-state-renderer";
import { ReadOnlyStepRenderer } from "./read-only-step-renderer";

interface HistoryStepRendererProps {
  step: HistoryStep;
  stepNumber: number;
  isActive: boolean;
  isReadOnly: boolean;
  currentState?: any;
  context?: any;
  onEvent?: (eventType: string, data?: any) => void;
  imageUrl?: string;
}

/**
 * Renders a single step in the workflow history
 * Shows read-only view for completed steps, interactive for active step
 */
export function HistoryStepRenderer({
  step,
  stepNumber,
  isActive,
  isReadOnly,
  currentState,
  context,
  onEvent,
  machine,
  projectId,
  dataFileId,
  userId,
  imageUrl,
}: HistoryStepRendererProps & {
  machine?: any;
  projectId?: string;
  dataFileId?: string;
  userId?: string;
}) {
  const t = useTranslations("Workflow.history");
  
  // Read-only mode for completed steps
  if (isReadOnly) {
    return <ReadOnlyStepRenderer step={step} stepNumber={stepNumber} imageUrl={imageUrl} />;
  }

  // Active mode - show interactive form
  if (isActive && currentState && machine && onEvent) {
    return (
      <div className="mb-4 p-4 border-2 border-blue-500 rounded-lg bg-white shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
            {t("stepLabel", { number: stepNumber })}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {step.stateName}
          </span>
        </div>
        <WorkflowStateRenderer
          state={currentState}
          machine={machine}
          onEvent={onEvent}
          projectId={projectId || ''}
          dataFileId={dataFileId || ''}
          userId={userId || ''}
        />
      </div>
    );
  }

  // Fallback
  return null;
}
