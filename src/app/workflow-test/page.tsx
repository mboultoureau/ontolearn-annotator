'use client';

import { createActor } from 'xstate';
import { compileWorkflowToMachine } from '@/lib/workflow-engine/compiler';
import { useState } from 'react';

export default function WorkflowTest() {
  const [workflowJson, setWorkflowJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actor, setActor] = useState<any>(null);
  const [currentState, setCurrentState] = useState<string>('');
  const [stateValue, setStateValue] = useState<any>(null);
  const [context, setContext] = useState<any>(null);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);

  function handleLoadMachine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!workflowJson.trim()) {
      setError('Please provide a workflow definition');
      return;
    }
    
    setError(null);
    
    try {
      // Parse the workflow JSON (not the machine config, but the parsed YAML)
      const workflowDef = JSON.parse(workflowJson);
      
      // Compile it to a machine
      const compiled = compileWorkflowToMachine(workflowDef);
      
      // Create and start actor
      const newActor = createActor(compiled.machine);      
      
      // Subscribe to state changes
      newActor.subscribe((state) => {
        setStateValue(state.value);
        setContext(state.context);
        setCurrentState(typeof state.value === 'string' ? state.value : JSON.stringify(state.value));
        
        // Get available events from state configuration
        const events: string[] = [];
        
        // Get the current state node from the machine
        const currentStateNode = state._nodes?.[0];
        
        
        if (currentStateNode?.config?.on) {
          // Direct access to configured transitions
          const transitions = currentStateNode.config.on;
          for (const eventType in transitions) {
            if (!events.includes(eventType)) {
              events.push(eventType);
            }
          }
        }
        
        // Fallback: try common events with can()
        if (events.length === 0 && state.can) {
          ['NEXT', 'YES', 'NO', 'AREA_SELECTED', 'CHOICE_SELECTED'].forEach(evt => {
            try {
              if (state.can({ type: evt })) {
                events.push(evt);
              }
            } catch (e) {
              // Ignore errors
            }
          });
        }
        
        setAvailableEvents(events);
      });
      
      newActor.start();
      setActor(newActor);
      
    } catch (e) {
      setError('Failed to load workflow: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  function sendEvent(eventType: string, data?: any) {
    if (actor) {
      const event: any = { type: eventType };
      if (data !== undefined) {
        event.data = data;
      }
      actor.send(event);
    }
  }

  function stopMachine() {
    if (actor) {
      actor.stop();
      setActor(null);
      setCurrentState('');
      setStateValue(null);
      setContext(null);
      setAvailableEvents([]);
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">XState Machine Tester</h1>
      
      <form onSubmit={handleLoadMachine} className="mb-8">
        <label htmlFor="workflowJson" className="block text-lg font-medium mb-2">
          Parsed Workflow JSON (from /workflow-demo):
        </label>
        <textarea 
          name="workflowJson"
          id="workflowJson"
          value={workflowJson}
          onChange={(e) => setWorkflowJson(e.target.value)}
          className="w-full h-64 border border-gray-300 rounded p-4 font-mono text-sm"
          placeholder="Paste the parsed workflow JSON here (not the compiled machine)..."
        />
        <div className="flex gap-4 mt-4">
          <button 
            type="submit"
            disabled={!!actor}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded shadow"
          >
            Load & Start Machine
          </button>
          
          {actor && (
            <button 
              type="button"
              onClick={stopMachine}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded shadow"
            >
              Stop Machine
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded shadow mb-6">
          <h2 className="text-xl font-bold text-red-800 mb-3">❌ Error:</h2>
          <pre className="text-red-700 whitespace-pre-wrap font-mono text-sm">{error}</pre>
        </div>
      )}

      {actor && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current State */}
          <div className="p-6 bg-blue-50 border-l-4 border-blue-500 rounded shadow">
            <h2 className="text-xl font-bold text-blue-800 mb-3">📍 Current State</h2>
            <div className="bg-white p-4 rounded border border-blue-200">
              <p className="text-2xl font-mono font-bold text-blue-900">{currentState}</p>
            </div>
          </div>

          {/* Available Events */}
          <div className="p-6 bg-purple-50 border-l-4 border-purple-500 rounded shadow">
            <h2 className="text-xl font-bold text-purple-800 mb-3">🎯 Available Events</h2>
            <div className="flex flex-wrap gap-2">
              {availableEvents.length > 0 ? (
                availableEvents.map(evt => (
                  <div key={evt} className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // Auto-send data for YES/NO events
                        if (evt === 'YES') {
                          sendEvent(evt, true);
                        } else if (evt === 'NO') {
                          sendEvent(evt, false);
                        } else {
                          sendEvent(evt);
                        }
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded shadow"
                    >
                      {evt}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No events available (might be in final state)</p>
              )}
            </div>
          </div>

          {/* Context */}
          <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded shadow">
            <h2 className="text-xl font-bold text-green-800 mb-3">💾 Context</h2>
            <details>
              <summary className="cursor-pointer text-green-700 font-medium mb-2">
                View Context
              </summary>
              <pre className="mt-2 bg-white p-4 rounded border border-green-200 overflow-x-auto font-mono text-sm text-gray-900">
{JSON.stringify(context, null, 2)}
              </pre>
            </details>
          </div>

          {/* State Value */}
          <div className="p-6 bg-yellow-50 border-l-4 border-yellow-500 rounded shadow">
            <h2 className="text-xl font-bold text-yellow-800 mb-3">🔍 State Value</h2>
            <details>
              <summary className="cursor-pointer text-yellow-700 font-medium mb-2">
                View State Value
              </summary>
              <pre className="mt-2 bg-white p-4 rounded border border-yellow-200 overflow-x-auto font-mono text-sm text-gray-900">
{JSON.stringify(stateValue, null, 2)}
              </pre>
            </details>
          </div>

          {/* Custom Event Sender */}
          <div className="p-6 bg-gray-50 border-l-4 border-gray-500 rounded shadow md:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-3">🚀 Send Custom Event with Data</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const eventType = formData.get('eventType') as string;
              const eventData = formData.get('eventData') as string;
              
              if (eventType) {
                let parsedData: any = undefined;
                if (eventData.trim()) {
                  try {
                    parsedData = JSON.parse(eventData);
                  } catch {
                    parsedData = eventData; // Use as string if not valid JSON
                  }
                }
                sendEvent(eventType, parsedData);
                (e.target as HTMLFormElement).reset();
              }
            }}>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="eventType"
                    placeholder="Event type (e.g., NEXT, YES, NO)"
                    className="flex-1 border border-gray-300 rounded px-4 py-2 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded shadow"
                  >
                    Send
                  </button>
                </div>
                <input
                  type="text"
                  name="eventData"
                  placeholder='Event data (JSON or string, e.g., true, "value", {"key": "value"})'
                  className="w-full border border-gray-300 rounded px-4 py-2 font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  💡 Tip: YES sends <code className="bg-gray-200 px-1 rounded">true</code>, NO sends <code className="bg-gray-200 px-1 rounded">false</code> automatically
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!actor && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded mt-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">📖 Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Go to <code className="bg-gray-200 px-2 py-1 rounded">/workflow-demo</code></li>
            <li>Paste your YAML workflow and click Parse & Validate Workflow</li>
            <li>Copy the <strong>Parsed JSON Output</strong> (not the compiled machine)</li>
            <li>Paste the JSON here and click Load & Start Machine</li>
            <li>Click on available events to transition through states</li>
            <li>Watch the context and state value update in real-time</li>
          </ol>
        </div>
      )}
    </div>
  );
}
