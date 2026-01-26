/**
 * XState v5 Compiler for Workflow Engine
 * 
 * This module converts validated workflow JSON definitions into XState v5 state machines.
 * The compiler is fully generic and derives all behavior from the workflow definition.
 * 
 * ARCHITECTURE:
 * - Strategy pattern for state compilation
 * - DataPathNavigator for consistent path handling
 * - Dedicated compilers for Guards and Actions
 * - Fully refactored and type-safe
 */

import { setup } from 'xstate';
import type { WorkflowDefinition, WorkflowState, WorkflowContext } from './types';

import { DataPathNavigator } from './utils/DataPathNavigator';
import {
  StateCompilerRegistry,
  FinalStateCompiler,
  TaskStateCompiler,
  ChoiceStateCompiler,
  YesNoStateCompiler,
  AreaSelectStateCompiler,
  BranchStateCompiler,
  LoopStateCompiler,
  GuardCompiler,
  ActionCompiler,
} from './compilers';

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

  // Initialize compilers
  const guardCompiler = new GuardCompiler();
  const actionCompiler = new ActionCompiler();
  
  // Initialize state compiler registry
  const registry = new StateCompilerRegistry();
  registry.register(new FinalStateCompiler());
  registry.register(new TaskStateCompiler());
  registry.register(new ChoiceStateCompiler());
  registry.register(new YesNoStateCompiler());
  registry.register(new AreaSelectStateCompiler());
  registry.register(new BranchStateCompiler());
  registry.register(new LoopStateCompiler());

  // Step 1: Build initial context
  const initialContext: WorkflowContext = {
    metadata: workflow.metadata,
    currentState: workflow.workflow.entry,
    dataSources: workflow.dataSources || {},
    data: initializeDataStructure(workflow),
  };

  // Step 2: Compile guards using GuardCompiler
  const guards = guardCompiler.compile(workflow, customGuards);

  // Step 3: Compile actions using ActionCompiler
  const actions = actionCompiler.compile(workflow);

  // Step 4: Compile states using registry
  const states = compileStates(workflow, registry);

  // Step 5: Count transitions
  const transitionCount = workflow.workflow.states.reduce(
    (count, state) => count + (state.transitions?.length || 0),
    0
  );

  // Step 6: Create machine
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
 * Initialize data structure using DataPathNavigator
 */
function initializeDataStructure(workflow: WorkflowDefinition): Record<string, any> {
  let data: Record<string, any> = {};
  
  for (const state of workflow.workflow.states) {
    // Handle storeAs on state level
    if ('storeAs' in state && state.storeAs) {
      data = DataPathNavigator.ensurePath(data, state.storeAs as string);
    }
    
    // Handle fields with storeAs (for task states)
    if (state.type === 'task') {
      const taskState = state as Extract<WorkflowState, { type: 'task' }>;
      if (taskState.fields) {
        for (const field of taskState.fields) {
          if (field.storeAs) {
            data = DataPathNavigator.ensurePath(data, field.storeAs);
          }
        }
      }
    }
  }
  
  return data;
}

/**
 * Compile states using state compiler registry
 */
function compileStates(
  workflow: WorkflowDefinition,
  registry: StateCompilerRegistry
): Record<string, any> {
  const stateNodes: Record<string, any> = {};

  for (const state of workflow.workflow.states) {
    const compiler = registry.findCompiler(state);
    
    const node = compiler.compile(state, {
      workflow,
      dataPathNavigator: DataPathNavigator,
      guardPrefix: 'guard',
      actionPrefix: 'store',
    });

    stateNodes[state.id] = node;
  }

  return stateNodes;
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
