/**
 * YesNoStateCompiler - Compiles yes_no states
 * 
 * Yes/No states support two transition modes:
 * 1. Direct targets: yesTarget/noTarget properties
 * 2. Conditional: standard transitions array with guards
 */

import { StateCompiler, type XStateNode, type CompilerContext } from './StateCompiler';
import type { WorkflowState } from '../types';

type YesNoState = Extract<WorkflowState, { type: 'yes_no' }>;

export class YesNoStateCompiler extends StateCompiler {
  canHandle(state: WorkflowState): boolean {
    return state.type === 'yes_no';
  }

  compile(state: WorkflowState, context: CompilerContext): XStateNode {
    const yesNoState = state as YesNoState;
    const node = this.compileCommonProperties(state);
    
    node.on = {};
    
    // Priority 1: Use yesTarget/noTarget if specified
    if (yesNoState.yesTarget || yesNoState.noTarget) {
      this.compileDirectTargets(node, yesNoState, context);
    }
    // Priority 2: Use transitions if no direct targets
    else if (state.transitions && state.transitions.length > 0) {
      this.compileConditionalTransitions(node, yesNoState, context);
    }
    
    return node;
  }

  /**
   * Compiles yes/no state with direct yesTarget/noTarget properties
   */
  private compileDirectTargets(
    node: XStateNode,
    state: YesNoState,
    context: CompilerContext
  ): void {
    if (state.yesTarget) {
      node.on!.YES = {
        target: state.yesTarget,
        actions: state.storeAs ? [`${context.actionPrefix}_${state.id}_yes`] : undefined,
      };
    }

    if (state.noTarget) {
      node.on!.NO = {
        target: state.noTarget,
        actions: state.storeAs ? [`${context.actionPrefix}_${state.id}_no`] : undefined,
      };
    }
  }

  /**
   * Compiles yes/no state with conditional transitions
   */
  private compileConditionalTransitions(
    node: XStateNode,
    state: YesNoState,
    context: CompilerContext
  ): void {
    const yesTransition = state.transitions![0];
    const noTransition = state.transitions!.length > 1 ? state.transitions![1] : undefined;

    node.on!.YES = {
      target: yesTransition.target,
      guard: yesTransition.when ? `${context.guardPrefix}_${state.id}_0` : undefined,
      actions: state.storeAs ? [`${context.actionPrefix}_${state.id}_yes`] : undefined,
    };

    if (noTransition) {
      node.on!.NO = {
        target: noTransition.target,
        guard: noTransition.when ? `${context.guardPrefix}_${state.id}_1` : undefined,
        actions: state.storeAs ? [`${context.actionPrefix}_${state.id}_no`] : undefined,
      };
    }
  }
}
