"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const router = useRouter();
  const t = useTranslations("Workflow");
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

  // Auto-start workflow on mount
  useEffect(() => {
    startWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array = run once on mount

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
    if (!history.canGoBack || history.currentIndex < 0) {
      return;
    }

    const confirmed = window.confirm(
      'Going back will discard all progress after this step. Continue?'
    );
    
    if (!confirmed) {
      return;
    }

    try {      
      // ====================================================================
      // STEP 1: PREPARE FOR GOING BACK
      // ====================================================================
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
        canGoBack: newSteps.length > 0, // Fixed: can go back if any steps remain
        canGoForward: false,
      };
      
      // Remove annotations after this point
      setAnnotations(prev => 
        prev.filter((_, index) => index < history.currentIndex)
      );

      // ====================================================================
      // STEP 2: CREATE FRESH STATE MACHINE
      // ====================================================================
      if (!workflowDef) {
        throw new Error('No workflow definition available');
      }
      
      // Load data sources again (needed for dynamic data)
      const workflowWithData = await loadDataSources(workflowDef, { 
        projectId,
        slug: projectSlug
      });

      const { machine } = compileWorkflowToMachine(workflowWithData);
      
      // Create a new actor starting fresh
      const newActor = createActor(machine);

      newActor.subscribe(snapshot => {
        setCurrentState(snapshot);
        setContext(snapshot.context as WorkflowContext);
      });

      newActor.start();
      
      // ====================================================================
      // STEP 3: REPLAY EVENTS WITH LOOP AWARENESS
      // ====================================================================
      /*
        LOOP REPLAY STRATEGY:
        
        The challenge: Loop steps are nested, and loop continuation is implicit.
        
        Example history:
        0. select_crystal_area (regular)
        1. select_crystal_class (regular) 
        2. ask_subsections (regular, answer: YES) → enters subsection_loop
        3. select_subsection_area (loop: subsection_loop, iteration: 0)
        4. select_subsection_classes (loop: subsection_loop, iteration: 0)
        5. select_subsection_area (loop: subsection_loop, iteration: 1)
        6. select_subsection_classes (loop: subsection_loop, iteration: 1)
        7. ask_more_crystals (regular) → exited loop by answering NO
        
        Key insight: Between step 4 and 5, user answered YES to "Add another subsection?"
        This YES event is NOT stored in history! We must infer it.
        
        Detection rule:
        - If step N has loopContext (parentStateId: X, iteration: I)
        - And step N+1 has loopContext (parentStateId: X, iteration: I+1)
        - Then after step N, we must send YES to loop continuation
        
        Implementation:
        1. Iterate through steps sequentially
        2. Send the stored event for each step
        3. After each step, check if next step is in a new iteration of same loop
        4. If yes, send YES to loop continuation prompt
      */
      
      for (let i = 0; i < newSteps.length; i++) {
        const step = newSteps[i];
        const nextStep = i < newSteps.length - 1 ? newSteps[i + 1] : null;
        
        // ------------------------------------------------------------------
        // 3A. EXTRACT EVENT DATA FROM STEP PAYLOAD
        // ------------------------------------------------------------------
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
          
          eventData = extractDeepValue(eventData);
        } else if (step.stateType === 'area_select') {
          // For area select, keep the full coordinates structure
          eventData = step.annotation.payload;
        } else if (step.stateType === 'yes_no') {
          // Yes/No events don't need data
          eventData = undefined;
        }
        
        // ------------------------------------------------------------------
        // 3B. DETERMINE EVENT TYPE
        // ------------------------------------------------------------------
        let eventType = 'NEXT'; // Default for most states
        if (step.stateType === 'area_select') {
          eventType = 'AREA_SELECTED';
        } else if (step.stateType === 'yes_no') {
          // Extract the answer from payload (could be { answer: true } or just true)
          const answer = step.annotation.payload?.answer ?? step.annotation.payload;
          eventType = answer === true ? 'YES' : 'NO';
        }
        // choice and multi_choice use NEXT with data
        
        // ------------------------------------------------------------------
        // 3C. SEND THE EVENT AND WAIT FOR STABILIZATION
        // ------------------------------------------------------------------
        const stateBefore = newActor.getSnapshot().value;
        
        newActor.send({ 
          type: eventType, 
          ...(eventData !== undefined && { data: eventData })
        } as any);
        
        // Wait for state to stabilize (transition to complete)
        // The compound state pattern needs time to go: __processing -> __route -> next state
        await new Promise(resolve => setTimeout(resolve, 50));
        
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
          if (beforeTop !== currentTop) {
            break;
          }
          
          attempts++;
        }
        
        // ------------------------------------------------------------------
        // 3D. CHECK FOR LOOP CONTINUATION (THE CRITICAL PART)
        // ------------------------------------------------------------------
        /*
          After sending the event for step i, check if we need to send a
          loop continuation event before proceeding to step i+1.
          
          Rule: If current step is in a loop iteration I, and next step is
          in the same loop but iteration I+1, then we must send YES to the
          loop's repeatWhile prompt.
        */
        
        if (nextStep) {
          const currentLoop = step.loopContext?.parentStateId;
          const currentIteration = step.loopContext?.iteration;
          const nextLoop = nextStep.loopContext?.parentStateId;
          const nextIteration = nextStep.loopContext?.iteration;
          
          // Check if next step is a new iteration of the same loop
          const isNewIteration = (
            currentLoop !== undefined &&
            nextLoop !== undefined &&
            currentLoop === nextLoop &&
            nextIteration !== undefined &&
            currentIteration !== undefined &&
            nextIteration === currentIteration + 1
          );
          
          if (isNewIteration) {
            // We've completed an iteration and need to continue the loop
            // The loop's repeatWhile will ask "Add another?" and we answer YES
            
            // Important: The loop state machine expects a YES/NO event
            // Wait a bit for the repeatWhile prompt to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            newActor.send({ type: 'YES' });
            
            // Wait for loop to re-enter first step of next iteration
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
      
      // ====================================================================
      // STEP 4: UPDATE APPLICATION STATE
      // ====================================================================
      setActor(newActor);
      setMachine(machine);
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
        // Data is now the raw coordinates object
        const coordinates = data;

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
          // Data is now the raw value (e.g., "Singular Irregular" or ["value1", "value2"])
          // We need to get the storeAs path from the state meta to save it properly
          const storeAs = stateMeta?.storeAs;
          
          let payload;
          if (storeAs) {
            // Create nested structure for storage based on storeAs
            // E.g., storeAs="crystal.class" and data="Singular Irregular"
            // Creates: { crystal: { class: "Singular Irregular" } }
            const path = storeAs.split('.');
            payload = {};
            let current: any = payload;
            
            for (let i = 0; i < path.length - 1; i++) {
              current[path[i]] = {};
              current = current[path[i]];
            }
            current[path[path.length - 1]] = data;
          } else {
            // No storeAs, just save the raw data
            payload = { data };
          }
          
          annotation = {
            id: `${stateId}-${Date.now()}`,
            stateId,
            type: stateMeta.type,
            timestamp: new Date().toISOString(),
            payload,
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
          // Find state meta - check both top-level states and nested loop steps
          let stateMeta = workflowDef.workflow.states.find(
            (s: WorkflowState) => s.id === stateId
          );
          
          // If not found in top-level, search inside loop steps
          if (!stateMeta && parentState) {
            console.log('[History] Looking for nested step:', stateId, 'in parent:', parentState);
            const parentMeta = workflowDef.workflow.states.find(
              (s: WorkflowState) => s.id === parentState
            );
            console.log('[History] Parent meta found:', !!parentMeta, 'type:', parentMeta?.type);
            
            if (parentMeta && parentMeta.type === 'loop' && Array.isArray(parentMeta.steps)) {
              console.log('[History] Searching in', parentMeta.steps.length, 'loop steps');
              stateMeta = parentMeta.steps.find(
                (s: WorkflowState) => s.id === stateId
              );
              console.log('[History] Nested step found:', !!stateMeta);
            }
          }
          
          if (stateMeta) {
            console.log('[History] Creating history step for:', stateId, 'type:', stateMeta.type);
            console.log('[History] Annotation payload:', annotation.payload);
            
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
            
            console.log('[History] History step created successfully');
            setHistory((prev) => addHistoryStep(prev, historyStep));
          } else {
            console.warn('[History] Could not find state meta for:', stateId, 'parent:', parentState);
          }
        } catch (err) {
          console.error('[History] Failed to capture step:', err);
          console.error('[History] Error details:', {
            stateId,
            parentState,
            hasContext: !!context,
            hasWorkflowDef: !!workflowDef,
            annotationId: annotation.id
          });
        }
      } else {
        console.warn('[History] Missing context or workflowDef:', {
          hasContext: !!context,
          hasWorkflowDef: !!workflowDef
        });
      }
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
      
      // Redirect to project annotations page
      setTimeout(() => {
        stopWorkflow();
        router.push(`/projects/${projectSlug}/annotations`);
      }, 500);
    } catch (error) {
      alert(t("errors.networkError", { message: error instanceof Error ? error.message : String(error) }));
    }
  };

  return (
    <div className="space-y-4">
      {!actor && !error && (
        <div className="text-center py-6">
          <p className="text-gray-700">{t("loading")}</p>
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
              ← {t("navigation.previousStep")}
            </Button>
            <span className="text-sm text-gray-600">
              {history.steps.length > 0 
                ? t("navigation.stepsCompleted", { count: history.steps.length })
                : t("navigation.noStepsYet")}
            </span>
          </div>

          {/* Workflow History Container */}
          <div className="space-y-4">
            {/* 
              LOOP HISTORY DISPLAY STRATEGY:
              
              We need to group steps by loop context to show a clear hierarchy:
              
              Example structure:
              - Step 1: Regular step
              - Step 2: Regular step  
              - Step 3: Loop entry (ask_subsections: YES)
                - Iteration 1:
                  - Step 4: select_subsection_area
                  - Step 5: select_subsection_classes
                - Iteration 2:
                  - Step 6: select_subsection_area
                  - Step 7: select_subsection_classes
              - Step 8: quality_assessment
              
              Implementation:
              1. Track current loop context and iteration
              2. When loop context changes, show loop header
              3. When iteration changes within same loop, show iteration divider
              4. Indent loop steps visually
            */}
            
            {(() => {
              const completedSteps = getCompletedSteps(history);
              const elements: JSX.Element[] = [];
              let currentLoop: string | null = null;
              let currentIteration = -1;
              let stepCounter = 0; // Global step counter across all contexts
              
              completedSteps.forEach((step, index) => {
                stepCounter++;
                
                // Check if this step is inside a loop
                const isInLoop = !!step.loopContext;
                const loopParent = step.loopContext?.parentStateId ?? null;
                const iteration = step.loopContext?.iteration ?? -1;
                
                // ============================================================
                // LOOP CONTEXT CHANGE DETECTION
                // ============================================================
                
                // Case 1: Entering a loop (was not in loop, now in loop)
                if (isInLoop && currentLoop !== loopParent) {
                  // Show loop entry header
                  elements.push(
                    <div key={`loop-header-${loopParent}-${index}`} className="ml-4 mt-2 text-sm font-semibold text-gray-700">
                      📁 {t("loops.loop")}: {loopParent}
                    </div>
                  );
                  currentLoop = loopParent;
                  currentIteration = -1; // Reset iteration counter
                }
                
                // Case 2: Exiting a loop (was in loop, now not in loop)
                if (!isInLoop && currentLoop !== null) {
                  currentLoop = null;
                  currentIteration = -1;
                }
                
                // ============================================================
                // ITERATION CHANGE DETECTION (within same loop)
                // ============================================================
                
                if (isInLoop && iteration !== currentIteration) {
                  // Show iteration divider
                  elements.push(
                    <div key={`iteration-${loopParent}-${iteration}`} className="ml-8 mt-1 text-xs text-gray-600 border-l-2 border-blue-300 pl-2">
                      🔄 {t("loops.iteration", { number: iteration + 1 })}
                    </div>
                  );
                  currentIteration = iteration;
                }
                
                // ============================================================
                // RENDER THE STEP (with appropriate indentation)
                // ============================================================
                
                const marginClass = isInLoop ? 'ml-12' : 'ml-0';
                
                elements.push(
                  <div key={step.id} className={marginClass}>
                    <HistoryStepRenderer
                      step={step}
                      stepNumber={stepCounter}
                      isActive={false}
                      isReadOnly={true}
                      imageUrl={imageUrl}
                    />
                  </div>
                );
              });
              
              return <>{elements}</>;
            })()}

            {/* Render active step (interactive) */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                  {t("navigation.currentStep")}
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
                {t("navigation.stopWorkflow")}
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
