"use client";

import { useState } from "react";
import { createActor } from "xstate";
import { parseWorkflowDefinition } from "@/lib/workflow-engine/parser";
import { compileWorkflowToMachine } from "@/lib/workflow-engine/compiler";
import { loadDataSources } from "@/lib/workflow-engine/data-source-loader";
import { 
  initializeHistory, 
  addHistoryStep, 
  createHistoryStep,
  goBackInHistory,
  getCompletedSteps
} from "@/lib/workflow-engine/history-manager";
import type { WorkflowHistory, WorkflowState, WorkflowDefinition, WorkflowContext } from "@/lib/workflow-engine/types";
import { WorkflowStateRenderer } from "@/app/_components/workflow/workflow-state-renderer";
import { HistoryStepRenderer } from "@/app/_components/workflow/history-step-renderer";
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
  const [workflowDef, setWorkflowDef] = useState<WorkflowDefinition | null>(null);
  
  // History management
  const [history, setHistory] = useState<WorkflowHistory>(initializeHistory());

  const startWorkflow = async () => {
    try {
      setError(null);
      setAnnotations([]);
      setLoopIterations({});
      setHistory(initializeHistory()); // Reset history

      const yaml = workflowYaml;
      if (!yaml) {
        throw new Error("No workflow definition provided.");
      }
      const finalYaml = yaml.replace(/\$\{imageUrl\}/g, imageUrl);
      
      const workflow = parseWorkflowDefinition(finalYaml);
      
      setWorkflowDef(workflow); // ← FIX: Store workflow definition
      
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
      console.error('[Workflow] Error:', err);
      setError(err instanceof Error ? err.message : String(err));
      setCurrentState(null);
      setContext(null);
    }
  };

  const handleGoBack = async () => {
    if (!history.canGoBack) {
      return;
    }

    const confirmed = window.confirm(
      'Going back will discard all progress after this step. Continue?'
    );
    
    if (!confirmed) return;

    try {      
      // We want to go back to REDO the last completed step
      // So we remove it from history and replay everything BEFORE it
      const targetIndex = history.currentIndex - 1; // Index of the last step to keep
      const targetStepToEdit = history.steps[history.currentIndex]; // The step we want to edit
      // Stop current actor
      if (actor) {
        actor.stop();
        setActor(null);
      }

      // Keep only the steps BEFORE the one we want to edit
      const newSteps = history.steps.slice(0, history.currentIndex); // Remove last step
      const newHistory: WorkflowHistory = {
        steps: newSteps,
        currentIndex: Math.max(0, targetIndex),
        canGoBack: targetIndex > 0,
        canGoForward: false,
      };
      // Remove annotations after this point
      setAnnotations(prev => 
        prev.filter((_, index) => index < history.currentIndex)
      );

      // Compile new machine with restored state
      if (!workflowDef) {
        throw new Error('No workflow definition available');
      }      
      // Load data sources again
      const workflowWithData = await loadDataSources(workflowDef, { 
        projectId,
        slug: projectSlug
      });

      const { machine } = compileWorkflowToMachine(workflowWithData);
      
      // Create a new actor starting fresh
      const newActor = createActor(machine);

      newActor.subscribe(snapshot => {        setCurrentState(snapshot);
        setContext(snapshot.context as WorkflowContext);
      });

      newActor.start();
      
      // Replay all events up to (but not including) the step we want to edit      
      // Replay events with small delays to allow state machine to process
      for (let i = 0; i < newSteps.length; i++) {
        const step = newSteps[i];        
        // Extract the actual data from the payload
        let eventData = step.annotation.payload;
        
        // For choice/multi_choice states, extract the raw selection value
        if (step.stateType === 'choice' || step.stateType === 'multi_choice') {
          // Payload structure: { data: { crystal: { class: "Hexagon" } } }
          // We need to extract "Hexagon"
          if (eventData?.data) {
            eventData = eventData.data;
          }
          
          // Now eventData is { crystal: { class: "Hexagon" } }
          // Find the deepest value
          const extractDeepValue = (obj: any): any => {
            if (typeof obj !== 'object' || obj === null) return obj;
            const keys = Object.keys(obj);
            if (keys.length === 1) {
              return extractDeepValue(obj[keys[0]]);
            }
            return obj;
          };
          
          eventData = extractDeepValue(eventData);        } else if (step.stateType === 'area_select') {
          // For area select, keep the full coordinates structure
          // Don't unwrap
          eventData = step.annotation.payload;
        } else if (step.stateType === 'yes_no') {
          // Yes/No events don't need data
          eventData = undefined;
        }
        
        // Send the event that was used to complete this step
        let eventType = 'NEXT'; // Default for most states
        if (step.stateType === 'area_select') {
          eventType = 'AREA_SELECTED';
        } else if (step.stateType === 'yes_no') {
          // Extract the answer from payload (could be { answer: true } or just true)
          const answer = step.annotation.payload?.answer ?? step.annotation.payload;
          eventType = answer === true ? 'YES' : 'NO';
        }
        // choice and multi_choice use NEXT with data        
        // Get current state before sending
        const stateBefore = newActor.getSnapshot().value;
        console.log('[History] State before event:', JSON.stringify(stateBefore));
        
        newActor.send({ 
          type: eventType, 
          ...(eventData !== undefined && { data: eventData })
        } as any);
        
        // Immediately check state after send
        await new Promise(resolve => setTimeout(resolve, 50));
        const stateAfterSend = newActor.getSnapshot().value;
        console.log('[History] State after send:', JSON.stringify(stateAfterSend));
        
        // Wait for state to stabilize (transition to complete)
        // The compound state pattern needs time to go: __processing -> __route -> next state
        let attempts = 0;
        const maxAttempts = 50; // 500ms max wait
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10));
          const currentState = newActor.getSnapshot().value;
          
          // Check if we've moved to a different top-level state
          const getTopLevelState = (state: any): string => {
            if (typeof state === 'string') return state;
            if (typeof state === 'object' && state !== null) {
              return Object.keys(state)[0] || '';
            }
            return '';
          };
          
          const beforeTop = getTopLevelState(stateBefore);
          const currentTop = getTopLevelState(currentState);
          
          // If we've moved to a different state, we're done
          if (beforeTop !== currentTop) {            break;
          }
          
          attempts++;
        }
        
        if (attempts >= maxAttempts) {
          const finalState = newActor.getSnapshot();          console.warn('[History] Final state:', JSON.stringify(finalState.value));        }
      }      
      setActor(newActor);
      setMachine(machine);
      
      // Update history
      setHistory(newHistory);      
    } catch (err) {
      console.error('[History] Error going back:', err);
      setError(`Failed to go back: ${err instanceof Error ? err.message : String(err)}`);
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
      // Capture this step in history
      if (context && workflowDef) {
        try {
          const stateMeta = workflowDef.workflow.states.find(
            (s: WorkflowState) => s.id === stateId
          );          
          if (stateMeta) {
            const historyStep = createHistoryStep(
              stateId,
              stateMeta,
              {
                id: annotation.id,
                payload: annotation.payload
              },
              context,
              history.steps[history.currentIndex]?.stateId
            );
            
            setHistory((prev) => addHistoryStep(prev, historyStep));          } else {          }
        } catch (err) {
          console.error('[History] Failed to capture step:', err);
        }
      } else {      }
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
    <div className="space-y-4">
      {!actor && (
        <div className="text-center py-6">
          <div className="text-5xl mb-4">🧊</div>
          <p className="text-gray-700 mb-4">Start the annotation workflow for this image.</p>
          <Button onClick={startWorkflow}>Start Workflow</Button>
        </div>
      )}

      {currentState && context && (
        <div className="space-y-4">
          {/* History Navigation Bar */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg">
            <Button
              onClick={handleGoBack}
              disabled={!history.canGoBack}
              variant="outline"
              size="sm"
            >
              ← Previous Step
            </Button>
            <span className="text-sm text-gray-600">
              {history.steps.length > 0 
                ? `${history.steps.length} step${history.steps.length > 1 ? 's' : ''} completed`
                : 'No steps completed yet'}
            </span>
          </div>

          {/* Workflow History Container */}
          <div className="space-y-4">
            {/* Render completed steps (read-only) */}
            {getCompletedSteps(history).map((step, index) => (
              <HistoryStepRenderer
                key={step.id}
                step={step}
                stepNumber={index + 1}
                isActive={false}
                isReadOnly={true}
              />
            ))}

            {/* Render active step (interactive) */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                  Current Step
                </span>
              </div>
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
            </div>

            {/* Control buttons */}
            <div className="flex gap-2">
              <Button className="bg-red-500 text-white hover:bg-red-600" size="sm" onClick={stopWorkflow}>
                Stop Workflow
              </Button>
            </div>
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
