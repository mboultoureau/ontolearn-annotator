"use client";

import { useState } from "react";
import { createActor } from "xstate";
import { parseWorkflowDefinition } from "@/lib/workflow-engine/parser";
import { compileWorkflowToMachine } from "@/lib/workflow-engine/compiler";
import { loadDataSources } from "@/lib/workflow-engine/data-source-loader";
import { WorkflowStateRenderer } from "@/app/_components/workflow/workflow-state-renderer";
import { Button } from "@/app/_components/ui/button";

interface Annotation {
  id: string;
  stateId: string;
  type: "area" | "choice" | "multi_choice" | "yes_no";
  timestamp: string;
  payload: any;
  parentState?: string;
  iteration?: number;
}

interface WorkflowAnnotatorProps {
  projectId: string;
  projectSlug: string;
  dataFileId: string;
  userId: string;
  imageUrl: string;
  workflowYaml?: string;
}

export function WorkflowAnnotator({ projectId, projectSlug, dataFileId, userId, imageUrl, workflowYaml }: WorkflowAnnotatorProps) {
  const [actor, setActor] = useState<any>(null);
  const [currentState, setCurrentState] = useState<any>(null);
  const [context, setContext] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [machine, setMachine] = useState<any>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loopIterations, setLoopIterations] = useState<Record<string, number>>({});

  const startWorkflow = async () => {
    try {
      setError(null);
      setAnnotations([]);
      setLoopIterations({});

      const yaml = workflowYaml;
      if (!yaml) {
        throw new Error("No workflow definition provided.");
      }
      const finalYaml = yaml.replace(/\$\{imageUrl\}/g, imageUrl);
      
      const workflow = parseWorkflowDefinition(finalYaml);
      
      // Load fetch-type data sources
      const workflowWithData = await loadDataSources(workflow, { 
        projectId,
        slug: projectSlug
      });
      
      const { machine } = compileWorkflowToMachine(workflowWithData);

      setMachine(machine);

      const newActor = createActor(machine);

      newActor.subscribe((state) => {
        setCurrentState(state);
        setContext(state.context);
      });

      newActor.start();
      setActor(newActor);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setCurrentState(null);
      setContext(null);
    }
  };

  const stopWorkflow = () => {
    if (actor) {
      actor.stop();
      setActor(null);
      setCurrentState(null);
      setContext(null);
      setMachine(null);
    }
  };

  const handleEvent = (eventType: string, data?: any) => {
    if (!currentState) return;

    const stateValue = currentState.value;
    let stateId: string;
    let parentState: string | undefined;

    const findMeta = (value: any, config: any): any => {
      if (typeof value === "string") {
        return config.states?.[value]?.meta;
      }
      if (typeof value === "object" && value !== null) {
        const parentKey = Object.keys(value)[0];
        const childValue = value[parentKey];
        const parentStateConfig = config.states?.[parentKey];

        if (parentStateConfig) {
          if (typeof childValue === "string") {
            return parentStateConfig.states?.[childValue]?.meta;
          } else if (typeof childValue === "object") {
            return findMeta(childValue, parentStateConfig);
          }
        }
      }
      return null;
    };

    if (typeof stateValue === "object" && stateValue !== null) {
      const keys = Object.keys(stateValue);
      parentState = keys[0];
      stateId = stateValue[parentState];

      if (eventType === "YES" && stateId === "__loop_check" && parentState) {
        setLoopIterations((prev) => ({
          ...prev,
          [parentState as string]: (prev[parentState as string] || 0) + 1,
        }));
      }
    } else {
      stateId = stateValue as string;
    }

    let annotation: Annotation | null = null;

    switch (eventType) {
      case "AREA_SELECTED": {
        const coordinates = data?.crystal?.area || data?.subsection?.area || data?.area || data;

        annotation = {
          id: `${stateId}-${Date.now()}`,
          stateId,
          type: "area",
          timestamp: new Date().toISOString(),
          payload: { coordinates },
          parentState,
          iteration: parentState ? loopIterations[parentState] : undefined,
        };
        break;
      }
      case "NEXT": {
        const stateMeta = findMeta(stateValue, machine.config);

        if (stateMeta?.type === "choice" || stateMeta?.type === "multi_choice") {
          annotation = {
            id: `${stateId}-${Date.now()}`,
            stateId,
            type: stateMeta.type,
            timestamp: new Date().toISOString(),
            payload: { data },
            parentState,
            iteration: parentState ? loopIterations[parentState] : undefined,
          };
        }
        break;
      }
      case "YES":
      case "NO": {
        annotation = {
          id: `${stateId}-${Date.now()}`,
          stateId,
          type: "yes_no",
          timestamp: new Date().toISOString(),
          payload: { answer: eventType === "YES" },
          parentState,
          iteration: parentState ? loopIterations[parentState] : undefined,
        };
        break;
      }
    }

    if (annotation) {
      setAnnotations((prev) => [...prev, annotation]);
    }

    if (actor) {
      actor.send({ type: eventType, data });
    }
  };

  const handleSave = async () => {
    const saveData = {
      projectId,
      dataFileId,
      userId,
      workflowContext: context?.data,
      annotations: annotations,
      completedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/workflow/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saveData),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Save failed: ${result.error}`);
        return;
      }

      alert(`Annotations saved: ${result.annotationsCreated}`);
      setTimeout(() => stopWorkflow(), 500);
    } catch (error) {
      alert(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="space-y-6">
      {!actor ? (
        <div className="text-center py-6">
          <div className="text-5xl mb-4">🧊</div>
          <p className="text-gray-700 mb-4">Start the annotation workflow for this image.</p>
          <Button onClick={startWorkflow}>Start</Button>
        </div>
      ) : (
        <div className="space-y-6">
          <WorkflowStateRenderer
            state={currentState}
            machine={machine}
            onEvent={(eventType, data) => {
              if (eventType === "SAVE") {
                handleSave();
              } else {
                handleEvent(eventType, data);
              }
            }}
            projectId={projectId}
            dataFileId={dataFileId}
            userId={userId}
          />

          <div className="rounded border p-4 bg-gray-50 space-y-2">
            <div className="text-sm font-semibold">Debug</div>
            <div className="text-xs text-gray-700">State: {JSON.stringify(currentState?.value)}</div>
            <div className="text-xs text-gray-700">Annotations: {annotations.length}</div>
            <Button variant="ghost" size="sm" onClick={stopWorkflow}>
              Stop workflow
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-800 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
