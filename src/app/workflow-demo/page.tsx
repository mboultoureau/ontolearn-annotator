import { parseWorkflowDefinition } from '@/lib/workflow-engine/parser';

// This is a Server Action
async function handleParse(formData: FormData) {
  'use server';     
  const definition = formData.get('workflowDefinition') as string;
  
  try {
    const parsed = parseWorkflowDefinition(definition);
    const result = JSON.stringify(parsed, null, 2);
    // In a real app, you might redirect to a URL with a query param 
    // or use useActionState to return this data to the UI
    console.log(result); 
  } catch (e) {
    console.error(e);
  }
}

export default function WorkflowDemo({ searchParams }: { searchParams: { error?: string, output?: string } }) {
  // We use URL searchParams to display the result without local React state
  const error = searchParams?.error;
  const parsedOutput = searchParams?.output;

  return (
    <div>
        <h1 className="text-3xl font-bold underline">Workflow Demo Page</h1>
        
        <form action={handleParse}>
          <label htmlFor="workflowDefinition">Workflow Definition (YAML):</label>
          <textarea 
            name="workflowDefinition" 
            id="workflowDefinition" 
            className="w-full h-64 border rounded p-2"
          />
          <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Parse Workflow
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
            <h2 className="font-bold">Errors:</h2>
            <pre>{error}</pre>
          </div>
        )}

        {parsedOutput && (
          <details className="mt-4" open>
            <summary className="cursor-pointer text-blue-500">Parsed Output</summary>
            <pre className="mt-2 bg-gray-100 p-4 rounded overflow-x-auto">
              {parsedOutput}
            </pre>
          </details>
        )}
    </div>
  );
}
