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
        url: /uploads/playground/3548bd71-45b1-48f1-9803-9e6706cb104e.jpg
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
      imageSource: `+"${dataSources.images[0].url}"+`
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

export default function WorkflowPOCPage() {
  const [actor, setActor] = useState<any>(null);
  const [currentState, setCurrentState] = useState<any>(null);
  const [context, setContext] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [machine, setMachine] = useState<any>(null);

  const startWorkflow = () => {
    try {
      setError(null);
      
      // Parse YAML
      const workflow = parseWorkflowDefinition(SAMPLE_WORKFLOW);
      console.log('📄 Parsed workflow:', workflow);
      
      // Compile to machine
      const { machine } = compileWorkflowToMachine(workflow);
      console.log('⚙️ Compiled machine:', machine);
      
      // Store machine for later use
      setMachine(machine);
      
      // Create actor
      const newActor = createActor(machine);
      
      // Subscribe to state changes
      newActor.subscribe((state) => {
        console.log('🔄 State changed:', state.value);
        console.log('💾 Context:', state.context);
        setCurrentState(state);
        setContext(state.context);
      });
      
      newActor.start();
      setActor(newActor);
      
    } catch (err) {
      console.error('❌ Error:', err);
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
    if (actor) {
      console.log(`📤 Sending event: ${eventType}`, data);
      actor.send({ type: eventType, data });
    }
  };

  const handleSave = () => {
    console.log('💾 Saving workflow data:', context?.data);
    alert('Workflow data saved!\n\n' + JSON.stringify(context?.data, null, 2));
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🎨 Workflow POC</h1>
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
          {/* Main Workflow UI */}
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
            />
          </div>

          {/* Debug Panel */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current State */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-bold text-blue-800 mb-2">Current State</h4>
                <p className="font-mono text-sm text-gray-800">
                  {typeof currentState?.value === 'string' 
                    ? currentState.value 
                    : JSON.stringify(currentState?.value)
                  }
                </p>
              </div>

              {/* State Type */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                <h4 className="font-bold text-purple-800 mb-2">State Type</h4>
                <p className="font-mono text-sm text-gray-800">
                  {currentState?.meta?.[Object.keys(currentState.meta)[0]]?.type || 'unknown'}
                </p>
              </div>
            </div>

            {/* Context Data */}
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
