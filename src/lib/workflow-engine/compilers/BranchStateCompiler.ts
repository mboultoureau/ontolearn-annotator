/**
 * BranchStateCompiler - Compiles branch states
 * 
 * Branch states route the workflow based on conditions.
 */

import { StateCompiler, type XStateNode, type CompilerContext } from './StateCompiler';
import type { WorkflowState } from '../types';

export class BranchStateCompiler extends StateCompiler {
  canHandle(state: WorkflowState): boolean {
    return state.type === 'branch';
  }

  compile(state: WorkflowState, context: CompilerContext): XStateNode {
    const node = this.compileCommonProperties(state);
    
    // Compile transitions with conditions
    if (state.transitions && state.transitions.length > 0) {
      node.on = this.compileTransitions(state, context);
    }
    
    return node;
  }
}
