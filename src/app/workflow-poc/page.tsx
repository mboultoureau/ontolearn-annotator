'use client';

import { createActor } from 'xstate';
import { parseWorkflowDefinition } from '@/lib/workflow-engine/parser';
import { compileWorkflowToMachine } from '@/lib/workflow-engine/compiler';
import { WorkflowStateRenderer } from '@/app/_components/workflow/workflow-state-renderer';
import { Button } from '@/app/_components/ui/button';
import { useState } from 'react';

const SAMPLE_WORKFLOW = `metadata:
  id: water-crystal-annotation-v1
  version: 1.0.0
  name: Water Crystal Annotation
  description: Scientific workflow for annotating water crystals
  author: NII Research Team

dataSources:
  images:
    type: static
    data:
      - id: img1
        url: /uploads/playground/30c5dbe9-1fc4-4676-832e-5c5839ea64ed.jpg
        name: Water Crystal Sample

  crystal_classes:
    type: static
    data:
      - regular
      - irregular
      - dendritic
      - columnar
      - plate-like

  quality_levels:
    type: static
    data:
      - low
      - medium
      - high

workflow:
  entry: select_crystal_area

  states:

    # 1. Crystal area selection
    - id: select_crystal_area
      type: area_select
      name: Select crystal area
      imageSource: `+"${dataSources.images.data[0].url}"+`
      toolType: polygon
      allowMultiple: false
      storeAs: crystal.area

      transitions:
        - target: select_crystal_class

    # 2. Crystal class selection
    - id: select_crystal_class
      type: choice
      name: Crystal class
      prompt: Select crystal class
      options:
        source: crystal_classes
      storeAs: crystal.class

      transitions:
        - target: ask_subsections
          when: context.data.crystal.class == "irregular"

        - target: quality_assessment
          when: context.data.crystal.class != "irregular"

    # 3. Ask for sub-sections (irregular only)
    - id: ask_subsections
      type: yes_no
      name: Sub-sections
      question: Do you want to annotate sub-sections?
      storeAs: crystal.hasSubsections
      yesTarget: subsection_loop
      noTarget: ask_more_crystals

    # 4. Sub-section loop
    - id: subsection_loop
      type: loop
      name: Sub-section annotation
      as: subsection

      repeatWhile:
        type: yes_no
        question: Add another sub-section?

      steps:
        - id: select_subsection_area
          type: area_select
          name: Select sub-section area
          toolType: polygon
          allowMultiple: false
          imageSource: `+"${dataSources.images.data[0].url}"+`
          storeAs: subsection.area

        - id: select_subsection_classes
          type: multi_choice
          name: Sub-section classes
          options:
            source: crystal_classes
          storeAs: subsection.classes

      storeAs: crystal.subsections

      transitions:
        - target: ask_more_crystals

    # 5. Quality assessment (non-irregular)
    - id: quality_assessment
      type: choice
      name: Crystal quality
      prompt: Rate crystal quality
      options:
        source: quality_levels
      storeAs: crystal.quality

      transitions:
        - target: ask_more_crystals

    # 6. More crystals loop
    - id: ask_more_crystals
      type: yes_no
      name: More crystals
      question: Are there other crystals to annotate?
      storeAs: workflow.hasMoreCrystals
      yesTarget: select_crystal_area
      noTarget: final

    # 7. End
    - id: final
      type: final
      message: Annotation session completed
`;

interface Annotation {
  id: string;
  stateId: string;
  type: 'area' | 'choice' | 'multi_choice' | 'yes_no';
  timestamp: string;
  payload: any;
  parentState?: string;
  iteration?: number;
}

export default function WorkflowPOCPage() {
  const [actor, setActor] = useState<any>(null);
  const [currentState, setCurrentState] = useState<any>(null);
  const [context, setContext] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [machine, setMachine] = useState<any>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loopIterations, setLoopIterations] = useState<Record<string, number>>({});

  const startWorkflow = () => {
    try {
      setError(null);
      setAnnotations([]);
      setLoopIterations({});
      
      const workflow = parseWorkflowDefinition(SAMPLE_WORKFLOW);
      const { machine } = compileWorkflowToMachine(workflow);
      
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

  const handleEvent = (eventType: string, data?: any, meta?: any) => {
    if (!currentState) return;

    console.log('[handleEvent]', { eventType, data, currentStateValue: currentState.value });

    // Get current state info
    const stateValue = currentState.value;
    let stateId: string;
    let parentState: string | undefined;
    
    // Helper function to find metadata (same as in renderer)
    const findMeta = (value: any, config: any): any => {
      if (typeof value === 'string') {
        return config.states?.[value]?.meta;
      }
      if (typeof value === 'object' && value !== null) {
        const parentKey = Object.keys(value)[0];
        const childValue = value[parentKey];
        const parentStateConfig = config.states?.[parentKey];
        
        if (parentStateConfig) {
          if (typeof childValue === 'string') {
            return parentStateConfig.states?.[childValue]?.meta;
          } else if (typeof childValue === 'object') {
            return findMeta(childValue, parentStateConfig);
          }
        }
      }
      return null;
    };
    
    // Handle nested states (loops)
    if (typeof stateValue === 'object' && stateValue !== null) {
      const keys = Object.keys(stateValue);
      parentState = keys[0];
      stateId = stateValue[parentState];
      
      // Track loop iterations
      if (eventType === 'YES' && stateId === '__loop_check' && parentState) {
        setLoopIterations(prev => ({
          ...prev,
          [parentState as string]: (prev[parentState as string] || 0) + 1
        }));
      }
    } else {
      stateId = stateValue as string;
    }

    // Capture annotation based on event type
    let annotation: Annotation | null = null;
    
    switch (eventType) {
      case 'AREA_SELECTED':
        // Extract coordinates from nested payload or direct
        const coordinates = data?.crystal?.area || 
                          data?.subsection?.area || 
                          data?.area ||
                          data;
        
        annotation = {
          id: `${stateId}-${Date.now()}`,
          stateId,
          type: 'area',
          timestamp: new Date().toISOString(),
          payload: { coordinates },
          parentState,
          iteration: parentState ? loopIterations[parentState] : undefined
        };
        break;
        
      case 'NEXT':
        // Find metadata using the same logic as in renderer
        const stateMeta = findMeta(stateValue, machine.config);
        
        console.log('[handleEvent NEXT]', {
          stateId,
          stateValue,
          stateType: stateMeta?.type,
          data,
          meta: stateMeta
        });
        
        if (stateMeta?.type === 'choice' || stateMeta?.type === 'multi_choice') {
          // Store the entire data object to preserve nested structure
          annotation = {
            id: `${stateId}-${Date.now()}`,
            stateId,
            type: stateMeta.type,
            timestamp: new Date().toISOString(),
            payload: { data }, // Store full data object
            parentState,
            iteration: parentState ? loopIterations[parentState] : undefined
          };
        }
        break;
        
      case 'YES':
      case 'NO':
        annotation = {
          id: `${stateId}-${Date.now()}`,
          stateId,
          type: 'yes_no',
          timestamp: new Date().toISOString(),
          payload: { answer: eventType === 'YES' },
          parentState,
          iteration: parentState ? loopIterations[parentState] : undefined
        };
        break;
    }

    // Store annotation if created
    if (annotation) {
      setAnnotations(prev => [...prev, annotation!]);
    }

    // Forward event to actor
    if (actor) {
      actor.send({ type: eventType, data });
    }
  };

  const handleSave = async () => {
    // Prepare data for database save
    const saveData = {
      projectId: 'cmk29xxlo0000flyovqqznqgx',
      dataFileId: 'datafile-12345',
      userId: 'user-67890',
      workflowContext: context?.data,
      annotations: annotations,
      completedAt: new Date().toISOString()
    };

    console.log('Workflow completed - Saving annotations...', saveData);
    
    try {
      const response = await fetch('/api/workflow/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error saving annotations:', result);
        alert(`Erreur lors de la sauvegarde: ${result.error}\n\n${result.details || ''}`);
        return;
      }

      console.log('Annotations saved successfully:', result);
      alert(`✅ Annotations sauvegardées avec succès!\n\n${result.annotationsCreated} enregistrements créés`);
      
      // Optionally reset the workflow
      setTimeout(() => {
        stopWorkflow();
      }, 1000);
    } catch (error) {
      console.error('Failed to save annotations:', error);
      alert(`Erreur réseau: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Workflow POC</h1>
        <p className="text-gray-600">
          Interactive workflow with conditional rendering
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <h3 className="font-bold text-red-800 mb-1">Error</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {!actor ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold mb-2">Ready to start?</h2>
            <p className="text-gray-600">
              Click the button below to launch the workflow
            </p>
          </div>
          <Button onClick={startWorkflow} size="lg" className="px-8">
            Start Workflow
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <WorkflowStateRenderer 
              state={currentState}
              machine={machine}
              onEvent={(eventType, data) => {
                if (eventType === 'SAVE') {
                  handleSave();
                } else {
                  handleEvent(eventType, data);
                }
              }}
              projectId='gjidrgdrgd87rgdr84g'
              dataFileId='datafile-12345'
              userId='user-67890'
            />
          </div>

          <div className="border-t-2 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Debug Information</h3>
              <Button 
                onClick={stopWorkflow} 
                variant="destructive"
                size="sm"
              >
                Stop Workflow
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-bold text-blue-800 mb-2">Current State</h4>
                <p className="font-mono text-sm text-gray-800">
                  {typeof currentState?.value === 'string' 
                    ? currentState.value 
                    : JSON.stringify(currentState?.value)
                  }
                </p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                <h4 className="font-bold text-purple-800 mb-2">State Type</h4>
                <p className="font-mono text-sm text-gray-800">
                  {currentState?.meta?.[Object.keys(currentState.meta)[0]]?.type || 'unknown'}
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <h4 className="font-bold text-green-800 mb-2">Annotations Captured</h4>
                <p className="font-mono text-sm text-gray-800">
                  {annotations.length} entries
                </p>
              </div>
            </div>

            <details className="p-4 bg-orange-50 border border-orange-200 rounded">
              <summary className="cursor-pointer font-bold text-orange-800">
                View Captured Annotations
              </summary>
              <textarea className="mt-2 p-2 bg-white rounded border overflow-x-auto text-xs w-full h-64 font-mono text-gray-800" readOnly>
                {JSON.stringify(annotations, null, 2)}
              </textarea>
            </details>

            <details className="p-4 bg-gray-50 border border-gray-200 rounded">
              <summary className="cursor-pointer font-bold text-gray-800">
                View Context Data
              </summary>
              <textarea className="mt-2 p-2 bg-white rounded border overflow-x-auto text-xs w-full h-64 font-mono text-gray-800" readOnly>
                {JSON.stringify(currentState, null, 2)}
              </textarea>
              <textarea className="mt-2 p-2 bg-white rounded border overflow-x-auto text-xs w-full h-64 font-mono text-gray-800" readOnly>
                {JSON.stringify(context, null, 2)}
              </textarea>
            </details>
          </div>
        </>
      )}
    </div>
  );
}
