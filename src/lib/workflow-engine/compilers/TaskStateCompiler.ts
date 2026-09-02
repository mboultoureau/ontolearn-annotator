/**
 * TaskStateCompiler - Compiles task states
 * 
 * Task states collect user input through fields and store results.
 */

import { StateCompiler, type XStateNode, type CompilerContext } from './StateCompiler';
import type { WorkflowState } from '../types';

export class TaskStateCompiler extends StateCompiler {
  canHandle(state: WorkflowState): boolean {
    return state.type === 'task';
  }

  compile(state: WorkflowState, context: CompilerContext): XStateNode {
    const node = this.compileCommonProperties(state);
    
    // Compile transitions
    if (state.transitions && state.transitions.length > 0) {
      node.on = this.compileTransitions(state, context);
    }
    
    // Add store actions if state has storeAs
    return this.addStoreActionsToTransitions(node, state, context);
  }
}
