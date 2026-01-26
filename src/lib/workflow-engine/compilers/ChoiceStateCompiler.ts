/**
 * ChoiceStateCompiler - Compiles choice, multi_choice states
 * 
 * These states present options to users for selection.
 */

import { StateCompiler, type XStateNode, type CompilerContext } from './StateCompiler';
import type { WorkflowState } from '../types';

export class ChoiceStateCompiler extends StateCompiler {
  canHandle(state: WorkflowState): boolean {
    return state.type === 'choice' || state.type === 'multi_choice';
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
