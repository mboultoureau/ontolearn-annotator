/**
 * AreaSelectStateCompiler - Compiles area_select states
 * 
 * Area select states automatically respond to AREA_SELECTED events.
 */

import { StateCompiler, type XStateNode, type CompilerContext } from './StateCompiler';
import type { WorkflowState } from '../types';

export class AreaSelectStateCompiler extends StateCompiler {
  canHandle(state: WorkflowState): boolean {
    return state.type === 'area_select';
  }

  compile(state: WorkflowState, context: CompilerContext): XStateNode {
    const node = this.compileCommonProperties(state);
    
    // Compile transitions (if any)
    if (state.transitions && state.transitions.length > 0) {
      node.on = this.compileTransitions(state, context);
    } else {
      node.on = {};
    }
    
    // Auto-add AREA_SELECTED event if not already present
    if (!node.on.AREA_SELECTED && state.transitions?.[0]) {
      node.on.AREA_SELECTED = {
        target: state.transitions[0].target,
      };
    }

    // After AREA_SELECTED exists, so the store action lands on it too. This call was
    // missing altogether, which is why a selected area never reached context.data and
    // no guard could branch on one.
    return this.addStoreActionsToTransitions(node, state, context);
  }
}
