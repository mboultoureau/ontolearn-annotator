/**
 * XState v5 Compiler for Workflow Engine
 * 
 * This module converts validated workflow JSON definitions into XState v5 state machines.
 * The compiler is fully generic and derives all behavior from the workflow definition.
 */

import { createMachine, setup, assign } from 'xstate';
import type { WorkflowDefinition, WorkflowState, WorkflowContext } from './types';

/**
 * Deep merge two objects
 * Used to merge event.data with context.data for guard evaluation
 */
function mergeDeep(target: any, source: any): any {
  if (!source || typeof source !== 'object') return target;
  if (!target || typeof target !== 'object') return source;
  
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = mergeDeep(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * Options for the workflow compiler
 */
export interface CompilerOptions {
  /**
   * Enable strict mode for additional validation
   */
  strict?: boolean;
  
  /**
   * Custom guard implementations for 'when' conditions
   * If not provided, a default expression parser is used
   */
  customGuards?: Record<string, (context: WorkflowContext, event: any) => boolean>;
}

/**
 * Result of compilation
 */
export interface CompiledWorkflow {
  machine: any; // XState machine - using any to avoid complex type inference issues
  metadata: {
    workflowId: string;
    version: string;
    stateCount: number;
    transitionCount: number;
  };
}

/**
 * Compiles a validated workflow definition into an XState v5 state machine
 * 
 * @param workflow - Validated workflow definition from parser
 * @param options - Compilation options
 * @returns XState v5 state machine ready for interpretation
 */
export function compileWorkflowToMachine(
  workflow: WorkflowDefinition,
  options: CompilerOptions = {}
): CompiledWorkflow {
  const { strict = false, customGuards = {} } = options;

  // Step 1: Build initial context from workflow metadata and dataSources
  const initialContext: WorkflowContext = {
    metadata: workflow.metadata,
    currentState: workflow.workflow.entry,
    // Make dataSources available in context for reference expressions
    dataSources: workflow.dataSources || {},
    // User data accumulated during workflow execution
    // Pre-initialize nested objects to avoid undefined access in guards
    data: initializeDataStructure(workflow),
  };

  // Step 2: Compile guards from 'when' conditions
  const guards = compileGuards(workflow, customGuards);

  // Step 3: Compile actions for context updates
  const actions = compileActions(workflow);

  // Step 4: Compile states into XState state nodes
  const states = compileStates(workflow);

  // Step 4: Count transitions for metadata
  const transitionCount = workflow.workflow.states.reduce(
    (count, state) => count + (state.transitions?.length || 0),
    0
  );

  // Step 5: Create the XState v5 machine using setup()
  const machineConfig = setup({
    types: {
      context: {} as WorkflowContext,
      events: {} as { type: string; [key: string]: any },
    },
    guards,
    actions,
  }).createMachine({
    id: workflow.metadata.id,
    initial: workflow.workflow.entry,
    context: initialContext,
    states,
  });

  console.log("Compiled machine:", machineConfig);
  

  return {
    machine: machineConfig,
    metadata: {
      workflowId: workflow.metadata.id,
      version: workflow.metadata.version,
      stateCount: workflow.workflow.states.length,
      transitionCount,
    },
  };
}

/**
 * Initializes the data structure in context based on storeAs paths
 * This prevents "undefined" errors when guards evaluate before data is set
 */
function initializeDataStructure(workflow: WorkflowDefinition): Record<string, any> {
  const data: Record<string, any> = {};
  
  for (const state of workflow.workflow.states) {
    // Handle storeAs on state level
    if ('storeAs' in state && state.storeAs) {
      const path = (state.storeAs as string).split('.');
      let current = data;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      // Initialize with null instead of leaving undefined
      current[path[path.length - 1]] = null;
    }
    
    // Handle fields with storeAs (for task states)
    if (state.type === 'task') {
      const taskState = state as Extract<WorkflowState, { type: 'task' }>;
      if (taskState.fields) {
        for (const field of taskState.fields) {
          if (field.storeAs) {
            const path = field.storeAs.split('.');
            let current = data;
            
            for (let i = 0; i < path.length - 1; i++) {
              if (!current[path[i]]) {
                current[path[i]] = {};
              }
              current = current[path[i]];
            }
            
            current[path[path.length - 1]] = null;
          }
        }
      }
    }
  }
  
  return data;
}

/**
 * Compiles workflow states into XState state node definitions
 * 
 * Each workflow state becomes a flat XState state with:
 * - meta: stores all state fields for later use by UI/services
 * - on: event transitions compiled from workflow.transitions
 * - type: 'final' for final states
 */
function compileStates(workflow: WorkflowDefinition): Record<string, any> {
  const stateNodes: Record<string, any> = {};

  for (const state of workflow.workflow.states) {
    const stateNode: any = {
      // Store entire state definition in meta for access by interpreters/UI
      meta: {
        ...state,
        // Remove transitions from meta to avoid duplication
        transitions: undefined,
      },
    };

    // Handle final states
    if (state.type === 'final') {
      stateNode.type = 'final';
    }

    // Compile transitions
    if (state.transitions && state.transitions.length > 0) {
      stateNode.on = compileTransitions(state);
    }

    // Add context update actions for states that store data
    if ('storeAs' in state && state.storeAs) {
      // Add action to update context when leaving this state
      const actionName = `store_${state.id}`;
      stateNode.on = stateNode.on || {};
      
      // For each transition, add the store action
      for (const eventType in stateNode.on) {
        const transitions = Array.isArray(stateNode.on[eventType]) 
          ? stateNode.on[eventType] 
          : [stateNode.on[eventType]];
        
        transitions.forEach((transition: any) => {
          if (!transition.actions) {
            transition.actions = [];
          }
          if (Array.isArray(transition.actions)) {
            transition.actions.unshift(actionName);
          } else {
            transition.actions = [actionName, transition.actions];
          }
        });
      }
    }

    // ✅ Special handling for yes_no states
    if (state.type === 'yes_no') {
      const yesNoState = state as Extract<WorkflowState, { type: 'yes_no' }>;
      
      console.log(`🔧 [Compiler] Compiling yes_no state: ${state.id}`);
      console.log(`   yesTarget: ${yesNoState.yesTarget || 'none'}`);
      console.log(`   noTarget: ${yesNoState.noTarget || 'none'}`);
      console.log(`   storeAs: ${yesNoState.storeAs || 'none'}`);
      console.log(`   transitions: ${state.transitions?.length || 0}`);
      
      stateNode.on = {};
      
      // Priority 1: Use yesTarget/noTarget if specified
      if (yesNoState.yesTarget || yesNoState.noTarget) {
        console.log(`   Using yesTarget/noTarget mode`);
        if (yesNoState.yesTarget) {
          stateNode.on.YES = {
            target: yesNoState.yesTarget,
            actions: yesNoState.storeAs ? [`store_${state.id}_yes`] : undefined,
          };
          console.log(`   YES -> ${yesNoState.yesTarget} (actions: ${stateNode.on.YES.actions || 'none'})`);
        }
        
        if (yesNoState.noTarget) {
          stateNode.on.NO = {
            target: yesNoState.noTarget,
            actions: yesNoState.storeAs ? [`store_${state.id}_no`] : undefined,
          };
          console.log(`   NO -> ${yesNoState.noTarget} (actions: ${stateNode.on.NO.actions || 'none'})`);
        }
      }
      // Priority 2: Use transitions if no direct targets
      else if (state.transitions && state.transitions.length > 0) {
        console.log(`   Using transitions mode`);
        // Map first two transitions to YES and NO
        const yesTransition = state.transitions[0];
        const noTransition = state.transitions.length > 1 ? state.transitions[1] : undefined;
        
        stateNode.on.YES = {
          target: yesTransition.target,
          guard: yesTransition.when ? `guard_${state.id}_0` : undefined,
          actions: yesNoState.storeAs ? [`store_${state.id}_yes`] : undefined,
        };
        console.log(`   YES -> ${yesTransition.target} (guard: ${stateNode.on.YES.guard || 'none'}, when: "${yesTransition.when || 'none'}")`);
        
        if (noTransition) {
          stateNode.on.NO = {
            target: noTransition.target,
            guard: noTransition.when ? `guard_${state.id}_1` : undefined,
            actions: yesNoState.storeAs ? [`store_${state.id}_no`] : undefined,
          };
          console.log(`   NO -> ${noTransition.target} (guard: ${stateNode.on.NO.guard || 'none'}, when: "${noTransition.when || 'none'}")`);
        }
      }
      console.log('');
    }

    // Handle area_select auto-transition
    if (state.type === 'area_select') {
      // Area select states auto-transition on AREA_SELECTED event
      stateNode.on = stateNode.on || {};
      if (!stateNode.on.AREA_SELECTED && state.transitions?.[0]) {
        stateNode.on.AREA_SELECTED = {
          target: state.transitions[0].target,
        };
      }
    }

    // Handle loop states - FULL repeatWhile support (no actors)
    if (state.type === 'loop') {
    const loopState = state as Extract<WorkflowState, { type: 'loop' }>;

    stateNode.type = 'compound';

    if (!loopState.steps || loopState.steps.length === 0) {
        // Empty loop → immediate transition
        stateNode.type = 'atomic';
        stateNodes[state.id] = stateNode;
        continue;
    }

    const nestedStates: Record<string, any> = {};
    const stepIds = loopState.steps.map(s => s.id);

    // 1️⃣ Compile loop steps
    for (let i = 0; i < loopState.steps.length; i++) {
        const step = loopState.steps[i];

        const nestedNode: any = {
        meta: {
            ...step,
            transitions: undefined,
        },
        };

        // Auto-chain steps if no explicit transitions
        if (!step.transitions || step.transitions.length === 0) {
        if (i < loopState.steps.length - 1) {
            nestedNode.on = {
            NEXT: { target: stepIds[i + 1] },
            };
        } else {
            // Last step → go to loop check
            nestedNode.on = {
            NEXT: { target: '__loop_check' },
            };
        }
        } else {
        nestedNode.on = compileTransitions(step);
        }

        if (step.type === 'final') {
        nestedNode.type = 'final';
        }

        nestedStates[step.id] = nestedNode;
    }

    // 2️⃣ Add loop check state (YES / NO)
    nestedStates['__loop_check'] = {
        meta: {
        type: 'loop_check',
        description: 'Repeat loop?',
        },
        on: {
        YES: {
            target: stepIds[0], // restart loop
        },
        NO: {
            target: '__loop_exit',
        },
        },
    };

    // 3️⃣ Exit pseudo-state
    nestedStates['__loop_exit'] = {
        type: 'final',
    };

    stateNode.states = nestedStates;
    stateNode.initial = stepIds[0];

    // 4️⃣ Exit transition of the loop
    if (state.transitions && state.transitions.length > 0) {
        stateNode.onDone = {
        target: state.transitions[0].target,
        };
    }

    // Loop handled → no outer transitions
    delete stateNode.on;
    }


    stateNodes[state.id] = stateNode;
  }

  return stateNodes;
}

/**
 * Compiles transitions for a given state
 * 
 * Maps workflow transitions to XState event handlers:
 * - Uses NEXT event as default trigger
 * - Applies guard if 'when' condition is present
 */
function compileTransitions(state: WorkflowState): Record<string, any> {
  const transitions: Record<string, any> = {};

  if (!state.transitions) return transitions;

  // Group transitions by event type
  // Most states use NEXT event, but some may use custom events
  const transitionsByEvent: Record<string, any[]> = {};

  for (let i = 0; i < state.transitions.length; i++) {
    const transition = state.transitions[i];
    
    // Default event type is NEXT
    const eventType = 'NEXT';
    
    if (!transitionsByEvent[eventType]) {
      transitionsByEvent[eventType] = [];
    }

    const xstateTransition: any = {
      target: transition.target,
    };

    // Add guard if 'when' condition exists
    if (transition.when) {
      xstateTransition.guard = `guard_${state.id}_${i}`;
    }

    transitionsByEvent[eventType].push(xstateTransition);
  }

  // Convert grouped transitions to XState format
  for (const [eventType, eventTransitions] of Object.entries(transitionsByEvent)) {
    if (eventTransitions.length === 1) {
      // Single transition
      transitions[eventType] = eventTransitions[0];
    } else {
      // Multiple transitions - XState will evaluate guards in order
      transitions[eventType] = eventTransitions;
    }
  }

  return transitions;
}

/**
 * Compiles guards from workflow 'when' conditions
 * 
 * Guards are functions that evaluate whether a transition should be taken.
 * The 'when' string is a simple expression that can reference context.
 * 
 * Examples:
 *   "context.crystal.category != 'no_crystal'"
 *   "context.data.age > 18"
 */
function compileGuards(
  workflow: WorkflowDefinition,
  customGuards: Record<string, (context: WorkflowContext, event: any) => boolean>
): Record<string, any> {
  const guards: Record<string, any> = { ...customGuards };

  for (const state of workflow.workflow.states) {
    if (!state.transitions) continue;

    for (let i = 0; i < state.transitions.length; i++) {
      const transition = state.transitions[i];
      
      if (transition.when) {
        const guardName = `guard_${state.id}_${i}`;
        const whenExpression = transition.when;
        
        // Compile the 'when' expression into a guard function
        guards[guardName] = ({ context, event }: { context: WorkflowContext; event: any }) => {
          console.log(`🛡️ [Guard ${guardName}] Evaluating:`);
          console.log(`   Expression: "${whenExpression}"`);
          console.log(`   Context:`, JSON.stringify(context, null, 2));
          console.log(`   Event:`, JSON.stringify(event, null, 2));
          
          // Create a merged context that includes event.data
          // This allows guards to evaluate against data being submitted
          const mergedContext = {
            ...context,
            data: mergeDeep(context.data || {}, event.data || {}),
          };
          
          console.log(`   Merged Context:`, JSON.stringify(mergedContext, null, 2));
          
          const result = evaluateWhenExpression(whenExpression, mergedContext);
          
          console.log(`   Result: ${result}`);
          console.log('');
          
          return result;
        };
      }
    }
  }

  return guards;
}

/**
 * Compiles actions for updating context based on storeAs fields
 * 
 * Actions are triggered when transitioning from states that have storeAs defined.
 * They use assign() to update the context with data from the event.
 */
function compileActions(workflow: WorkflowDefinition): Record<string, any> {
  const actions: Record<string, any> = {};

  for (const state of workflow.workflow.states) {
    // Handle yes_no states with storeAs
    if (state.type === 'yes_no') {
      const yesNoState = state as Extract<WorkflowState, { type: 'yes_no' }>;
      
      if (yesNoState.storeAs) {
        // Action for YES response
        actions[`store_${state.id}_yes`] = assign({
          data: ({ context }: { context: WorkflowContext }) => {
            console.log(`🎬 [Action store_${state.id}_yes] Storing YES (true) in "${yesNoState.storeAs}"`);
            console.log(`   Before:`, JSON.stringify(context.data, null, 2));
            
            const newData = JSON.parse(JSON.stringify(context.data || {}));
            const path = yesNoState.storeAs!.split('.');
            let current: any = newData;
            
            for (let i = 0; i < path.length - 1; i++) {
              if (!current[path[i]]) {
                current[path[i]] = {};
              }
              current = current[path[i]];
            }
            
            current[path[path.length - 1]] = true;
            
            console.log(`   After:`, JSON.stringify(newData, null, 2));
            return newData;
          },
        });
        
        // Action for NO response
        actions[`store_${state.id}_no`] = assign({
          data: ({ context }: { context: WorkflowContext }) => {
            console.log(`🎬 [Action store_${state.id}_no] Storing NO (false) in "${yesNoState.storeAs}"`);
            console.log(`   Before:`, JSON.stringify(context.data, null, 2));
            
            const newData = JSON.parse(JSON.stringify(context.data || {}));
            const path = yesNoState.storeAs!.split('.');
            let current: any = newData;
            
            for (let i = 0; i < path.length - 1; i++) {
              if (!current[path[i]]) {
                current[path[i]] = {};
              }
              current = current[path[i]];
            }
            
            current[path[path.length - 1]] = false;
            
            console.log(`   After:`, JSON.stringify(newData, null, 2));
            return newData;
          },
        });
      }
    }
    
    // Check if state has storeAs (can be on state itself or in fields)
    if ('storeAs' in state && state.storeAs && state.type !== 'yes_no') {
      const storeAs = state.storeAs as string;
      const actionName = `store_${state.id}`;
      
      actions[actionName] = assign({
        data: ({ context, event }: { context: WorkflowContext; event: any }) => {
          // Deep clone to avoid mutation
          const newData = JSON.parse(JSON.stringify(context.data || {}));
          
          // Parse storeAs path (e.g., "crystal.category" -> ["crystal", "category"])
          const path = storeAs.split('.');
          
          // Navigate to parent object and create if needed
          let current: any = newData;
          for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) {
              current[path[i]] = {};
            }
            current = current[path[i]];
          }
          
          // Set the value from event.data
          const finalKey = path[path.length - 1];
          current[finalKey] = event.data;
          
          return newData;
        },
      });
    }

    // Handle task states with fields that have storeAs
    if (state.type === 'task') {
      const taskState = state as Extract<WorkflowState, { type: 'task' }>;
      if (taskState.fields) {
        const actionName = `store_${state.id}`;
        
        actions[actionName] = assign({
          data: ({ context, event }: { context: WorkflowContext; event: any }) => {
            const newData = JSON.parse(JSON.stringify(context.data || {}));
            
            // Store each field's value
            for (const field of taskState.fields) {
              if (field.storeAs && event.data && field.id in event.data) {
                const path = field.storeAs.split('.');
                let current: any = newData;
                
                for (let i = 0; i < path.length - 1; i++) {
                  if (!current[path[i]]) {
                    current[path[i]] = {};
                  }
                  current = current[path[i]];
                }
                
                const finalKey = path[path.length - 1];
                current[finalKey] = event.data[field.id];
              }
            }
            
            return newData;
          },
        });
      }
    }
  }

  return actions;
}

/**
 * Evaluates a 'when' expression against the current context
 * 
 * This is a simple expression evaluator that handles:
 * - Property access: context.data.field
 * - Comparisons: ==, !=, >, <, >=, <=
 * - Logical operators: &&, ||
 * 
 * For production use, consider a proper expression parser/evaluator.
 * This implementation uses Function constructor for simplicity but should be
 * replaced with a safe parser in production.
 * 
 * @param expression - The 'when' expression string
 * @param context - Current workflow context
 * @returns Boolean result of evaluation
 */
function evaluateWhenExpression(expression: string, context: WorkflowContext): boolean {
  console.log(`📊 [evaluateWhenExpression] Starting evaluation`);
  console.log(`   Original expression: "${expression}"`);
  
  try {
    // Create a safe evaluation context
    // Replace context.X with direct access to context object
    const safeExpression = expression.replace(/context\./g, 'ctx.');
    console.log(`   Safe expression: "${safeExpression}"`);
    
    // Create evaluation function with safe property access
    // Note: In production, use a proper expression parser like jsep or mathjs
    const evaluator = new Function('ctx', `
      'use strict';
      
      // Helper function for safe property access
      function get(obj, path) {
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
          if (result == null) return undefined;
          result = result[key];
        }
        return result;
      }
      
      try {
        console.log('   [Function] Evaluating with ctx:', JSON.stringify(ctx));
        const result = Boolean(${safeExpression});
        console.log('   [Function] Raw result:', ${safeExpression});
        console.log('   [Function] Boolean result:', result);
        return result;
      } catch (e) {
        console.error('   [Function] Expression evaluation error:', e);
        return false;
      }
    `);

    const result = evaluator(context);
    console.log(`   ✅ Final result: ${result}`);
    return result;
  } catch (error) {
    console.error(`   ❌ Failed to evaluate expression:`, error);
    return false;
  }
}

/**
 * Helper: Extracts all state IDs from workflow for validation
 */
export function extractStateIds(workflow: WorkflowDefinition): Set<string> {
  return new Set(workflow.workflow.states.map(s => s.id));
}

/**
 * Helper: Validates that all transition targets exist
 */
export function validateTransitionTargets(workflow: WorkflowDefinition): string[] {
  const stateIds = extractStateIds(workflow);
  const errors: string[] = [];

  for (const state of workflow.workflow.states) {
    if (state.transitions) {
      for (const transition of state.transitions) {
        if (!stateIds.has(transition.target)) {
          errors.push(
            `State "${state.id}" has transition to non-existent state "${transition.target}"`
          );
        }
      }
    }

    // Check yes_no direct targets
    if (state.type === 'yes_no') {
      const yesNoState = state as Extract<WorkflowState, { type: 'yes_no' }>;
      
      if (yesNoState.yesTarget && !stateIds.has(yesNoState.yesTarget)) {
        errors.push(
          `State "${state.id}" has yesTarget to non-existent state "${yesNoState.yesTarget}"`
        );
      }
      
      if (yesNoState.noTarget && !stateIds.has(yesNoState.noTarget)) {
        errors.push(
          `State "${state.id}" has noTarget to non-existent state "${yesNoState.noTarget}"`
        );
      }
    }
  }

  return errors;
}
