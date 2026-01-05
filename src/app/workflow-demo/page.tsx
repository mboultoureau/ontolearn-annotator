'use client';

import { parseWorkflowDefinitionSafe } from '@/lib/workflow-engine/parser';
import { compileWorkflowToMachine } from '@/lib/workflow-engine/compiler';
import { useState } from 'react';

export default function WorkflowDemo() {
  const [error, setError] = useState<string | null>(null);
  const [parsedOutput, setParsedOutput] = useState<string | null>(null);
  const [compiledMachine, setCompiledMachine] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleParse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const definition = formData.get('workflowDefinition') as string;
    
    if (!definition || definition.trim() === '') {
      setError('Please provide a workflow definition');
      setParsedOutput(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setParsedOutput(null);
    
    try {
      const result = parseWorkflowDefinitionSafe(definition);
      
      if (result.success) {
        const output = JSON.stringify(result.data, null, 2);
        setParsedOutput(output);

        // Compile to XState machine
        const compiled = compileWorkflowToMachine(result.data);
        setCompiledMachine(compiled.machine);
      } else {
        const errorMessage = result.errors
          .map(err => `  - ${err.path}: ${err.message}`)
          .join('\n');
        setError(errorMessage);
      }
    } catch (e) {
      setError('Unexpected error: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Workflow Engine Demo</h1>
        
        <form onSubmit={handleParse} className="mb-8">
          <label htmlFor="workflowDefinition" className="block text-lg font-medium mb-2">
            Workflow Definition (YAML):
          </label>
          <textarea 
            name="workflowDefinition" 
            id="workflowDefinition" 
            className="w-full h-96 border border-gray-300 rounded p-4 font-mono text-sm"
            placeholder="Paste your YAML workflow definition here..."
            defaultValue={`# Example: Loop Types Demonstration
# Shows both iteration (over) and conditional (repeatWhile) loops

metadata:
  id: loop-types-demo-v1
  version: 1.0.0
  name: Loop Types Demo
  description: Demonstrates both iteration and conditional loops
  author: NII Research Team

dataSources:
  image_batch:
    type: static
    data:
      - id: img1
        url: /uploads/sample-001.jpg
      - id: img2
        url: /uploads/sample-002.jpg
      - id: img3
        url: /uploads/sample-003.jpg

workflow:
  entry: batch_processing

  states:
    # Example 1: Iteration loop (for-each over array)
    - id: batch_processing
      type: loop
      name: Process Image Batch
      
      # Iterate over array from dataSource
      over: dataSources.image_batch
      as: image
      
      steps:
        - id: quick_classify
          type: choice
          name: Quick Classification
          prompt: Classify this image
          options:
            values:
              - value: good
                label: Good Quality
              - value: bad
                label: Poor Quality
          storeAs: image.quality
          transitions:
            - target: iteration_done
        
        - id: iteration_done
          type: final
          message: Image processed
      
      storeAs: batch_results
      transitions:
        - target: ask_additional

    # Ask if user wants to process additional images
    - id: ask_additional
      type: yes_no
      name: Additional Processing
      question: Do you want to process additional images?
      storeAs: workflow.hasAdditional
      yesTarget: manual_processing
      noTarget: final

    # Example 2: Manual processing (single image)
    - id: manual_processing
      type: choice
      name: Manual Classification
      prompt: Classify this additional image
      options:
        values:
          - value: crystal
            label: Crystal
          - value: other
            label: Other
      storeAs: manual_image.type
      transitions:
        - target: ask_additional

    # End
    - id: final
      type: final
      message: All processing complete!
      summary:
        - batch_results
        - manual_results
`}
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded shadow"
          >
            {isLoading ? 'Parsing...' : 'Parse & Validate Workflow'}
          </button>
        </form>

        {error && (
          <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded shadow">
            <h2 className="text-xl font-bold text-red-800 mb-3">❌ Validation Errors:</h2>
            <pre className="text-red-700 whitespace-pre-wrap font-mono text-sm">{error}</pre>
          </div>
        )}

        {parsedOutput && (
          <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded shadow">
            <h2 className="text-xl font-bold text-green-800 mb-3">✅ Workflow Valid!</h2>
            <details open>
              <summary className="cursor-pointer text-green-700 font-medium mb-2">
                Parsed JSON Output
              </summary>
              <textarea className="mt-2 bg-white p-4 rounded border border-green-200 overflow-x-auto font-mono text-sm text-gray-900 w-full h-96">
{parsedOutput}
              </textarea>
            </details>
            
            {compiledMachine && (
              <div className="mt-4">
                <a 
                  href="/workflow-test"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow"
                >
                  🧪 Test Machine Interactively →
                </a>
              </div>
            )}
          </div>
        )}
          {compiledMachine && (
            <div className="p-6 bg-blue-50 border-l-4 border-blue-500 rounded shadow mt-6">
              <h2 className="text-xl font-bold text-blue-800 mb-3">🛠 Compiled XState Machine</h2>
              <details>
                <summary className="cursor-pointer text-blue-700 font-medium mb-2">
                  View Compiled Machine Structure
                </summary>
                <textarea className="mt-2 bg-white p-4 rounded border border-blue-200 overflow-x-auto font-mono text-sm text-gray-900 w-full h-96">
{JSON.stringify(compiledMachine, null, 2)}
                </textarea>
              </details>
            </div>
          )}
    </div>
  );
}
