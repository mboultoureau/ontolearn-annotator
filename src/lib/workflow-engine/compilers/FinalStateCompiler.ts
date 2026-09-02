/**
 * FinalStateCompiler - Compiles final states
 * 
 * Final states are the simplest: they just mark the end of the workflow.
 */

import { StateCompiler, type XStateNode, type CompilerContext } from './StateCompiler';
import type { WorkflowState } from '../types';

export class FinalStateCompiler extends StateCompiler {
  canHandle(state: WorkflowState): boolean {
    return state.type === 'final';
  }

  compile(state: WorkflowState, context: CompilerContext): XStateNode {
    const node = this.compileCommonProperties(state);
    
    // Mark as final state in XState
    node.type = 'final';
    
    return node;
  }
}
