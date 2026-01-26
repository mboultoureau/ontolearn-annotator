/**
 * StateCompiler - Base class for compiling workflow states
 * 
 * Implements the Strategy pattern to handle different state types.
 * Each state type (task, yes_no, loop, etc.) will have its own compiler.
 * 
 * This eliminates the long if/else chains in the original implementation.
 */

import type { WorkflowState, WorkflowDefinition } from '../types';
import type { DataPathNavigator } from '../utils/DataPathNavigator';

/**
 * XState node representation (simplified)
 */
export interface XStateNode {
  meta?: any;
  type?: 'final' | 'atomic' | 'compound';
  initial?: string;
  states?: Record<string, XStateNode>;
  on?: Record<string, any>;
  onDone?: any;
}

/**
 * Context passed to state compilers containing shared resources
 */
export interface CompilerContext {
  workflow: WorkflowDefinition;
  dataPathNavigator: typeof DataPathNavigator;
  guardPrefix: string; // For generating guard names
  actionPrefix: string; // For generating action names
}

/**
 * Abstract base class for all state compilers
 * 
 * Subclasses must implement:
 * - canHandle(): determines if this compiler handles a given state type
 * - compile(): converts the state into an XState node
 */
export abstract class StateCompiler {
  /**
   * Determines if this compiler can handle the given state
   * 
   * @param state - Workflow state to check
   * @returns True if this compiler handles this state type
   */
  abstract canHandle(state: WorkflowState): boolean;

  /**
   * Compiles a workflow state into an XState node
   * 
   * @param state - Workflow state to compile
   * @param context - Compiler context with shared resources
   * @returns XState node definition
   */
  abstract compile(state: WorkflowState, context: CompilerContext): XStateNode;

  /**
   * Compiles common properties shared by all states
   * This includes meta data and basic structure
   * 
   * @param state - Workflow state
   * @returns Partial XState node with common properties
   */
  protected compileCommonProperties(state: WorkflowState): XStateNode {
    return {
      meta: {
        ...state,
        // Remove transitions from meta to avoid duplication
        transitions: undefined,
      },
    };
  }

  /**
   * Compiles transitions for a state into XState event handlers
   * 
   * @param state - State with transitions
   * @param context - Compiler context
   * @param eventType - Default event type (usually 'NEXT')
   * @returns Event handlers mapping
   */
  protected compileTransitions(
    state: WorkflowState,
    context: CompilerContext,
    eventType: string = 'NEXT'
  ): Record<string, any> {
    const transitions: Record<string, any> = {};

    if (!state.transitions || state.transitions.length === 0) {
      return transitions;
    }

    const eventTransitions: any[] = [];

    for (let i = 0; i < state.transitions.length; i++) {
      const transition = state.transitions[i];

      const xstateTransition: any = {
        target: transition.target,
      };

      // Add guard if 'when' condition exists
      if (transition.when) {
        xstateTransition.guard = `${context.guardPrefix}_${state.id}_${i}`;
      }

      eventTransitions.push(xstateTransition);
    }

    // Single or multiple transitions
    if (eventTransitions.length === 1) {
      transitions[eventType] = eventTransitions[0];
    } else {
      transitions[eventType] = eventTransitions;
    }

    return transitions;
  }

  /**
   * Adds store actions to transitions if state has storeAs
   * 
   * @param node - XState node to modify
   * @param state - State with storeAs
   * @param context - Compiler context
   * @returns Modified node with store actions
   */
  protected addStoreActionsToTransitions(
    node: XStateNode,
    state: WorkflowState & { storeAs?: string },
    context: CompilerContext
  ): XStateNode {
    if (!state.storeAs || !node.on) {
      return node;
    }

    const actionName = `${context.actionPrefix}_${state.id}`;

    // Add store action to all transitions
    for (const eventType in node.on) {
      const transitions = Array.isArray(node.on[eventType])
        ? node.on[eventType]
        : [node.on[eventType]];

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

    return node;
  }
}

/**
 * Registry for state compilers
 * Manages the collection of compilers and finds the right one for each state
 */
export class StateCompilerRegistry {
  private compilers: StateCompiler[] = [];

  /**
   * Registers a new state compiler
   * 
   * @param compiler - Compiler to register
   */
  register(compiler: StateCompiler): void {
    this.compilers.push(compiler);
  }

  /**
   * Finds a compiler that can handle the given state
   * 
   * @param state - State to compile
   * @returns Compiler that can handle the state
   * @throws Error if no compiler found
   */
  findCompiler(state: WorkflowState): StateCompiler {
    const compiler = this.compilers.find(c => c.canHandle(state));
    
    if (!compiler) {
      throw new Error(
        `No compiler registered for state type: ${state.type} (state id: ${state.id})`
      );
    }
    
    return compiler;
  }

  /**
   * Gets all registered compilers
   */
  getAll(): StateCompiler[] {
    return [...this.compilers];
  }
}
