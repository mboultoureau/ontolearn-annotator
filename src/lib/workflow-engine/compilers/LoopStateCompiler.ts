/**
 * LoopStateCompiler - Compiles loop states
 * 
 * Loop states create compound states with nested steps and loop control logic.
 * This is the most complex state type as it manages:
 * - Nested step states
 * - Auto-chaining between steps
 * - Loop check state for repeat/exit decision
 * - Exit transition handling
 */

import { StateCompiler, type XStateNode, type CompilerContext } from './StateCompiler';
import type { WorkflowState } from '../types';

type LoopState = Extract<WorkflowState, { type: 'loop' }>;

export class LoopStateCompiler extends StateCompiler {
  canHandle(state: WorkflowState): boolean {
    return state.type === 'loop';
  }

  compile(state: WorkflowState, context: CompilerContext): XStateNode {
    const loopState = state as LoopState;
    const node = this.compileCommonProperties(state);

    // Handle empty loops
    if (!loopState.steps || loopState.steps.length === 0) {
      node.type = 'atomic';
      return node;
    }

    // Mark as compound state
    node.type = 'compound';
    
    // Compile nested steps
    const nestedStates = this.compileLoopSteps(loopState, context);
    
    // Add loop check and exit states
    this.addLoopControlStates(nestedStates, loopState, context);
    
    // Configure compound state
    node.states = nestedStates;
    node.initial = loopState.steps[0].id;
    
    // Configure exit transition
    if (state.transitions && state.transitions.length > 0) {
      node.onDone = {
        target: state.transitions[0].target,
      };
    }

    return node;
  }

  /**
   * Compiles all steps within the loop
   */
  private compileLoopSteps(
    loopState: LoopState,
    context: CompilerContext
  ): Record<string, XStateNode> {
    const nestedStates: Record<string, XStateNode> = {};
    const stepIds = loopState.steps.map(s => s.id);

    for (let i = 0; i < loopState.steps.length; i++) {
      const step = loopState.steps[i];
      const nestedNode = this.compileLoopStep(step, i, stepIds, context);
      nestedStates[step.id] = nestedNode;
    }

    return nestedStates;
  }

  /**
   * Compiles a single step within the loop
   */
  private compileLoopStep(
    step: WorkflowState,
    index: number,
    allStepIds: string[],
    context: CompilerContext
  ): XStateNode {
    const node: XStateNode = {
      meta: {
        ...step,
        transitions: undefined,
      },
    };

    // Determine next target
    const isLastStep = index === allStepIds.length - 1;
    const nextTarget = isLastStep ? '__loop_check' : allStepIds[index + 1];

    // Handle step transitions
    if (!step.transitions || step.transitions.length === 0) {
      // Auto-chain to next step or loop check
      node.on = {
        NEXT: { target: nextTarget },
      };
    } else {
      // Use explicit transitions (but compile them using base class)
      node.on = this.compileTransitions(step, context);
    }

    // Special handling for area_select steps
    if (step.type === 'area_select') {
      node.on = node.on || {};
      if (!node.on.AREA_SELECTED) {
        node.on.AREA_SELECTED = { target: nextTarget };
      }
    }

    // Mark final steps
    if (step.type === 'final') {
      node.type = 'final';
    }

    return node;
  }

  /**
   * Adds loop control states: __loop_check and __loop_exit
   */
  private addLoopControlStates(
    nestedStates: Record<string, XStateNode>,
    loopState: LoopState,
    context: CompilerContext
  ): void {
    const stepIds = loopState.steps.map(s => s.id);

    // Loop check state: YES repeats, NO exits
    nestedStates['__loop_check'] = {
      meta: {
        type: 'loop_check',
        name: loopState.repeatWhile?.question || 'Repeat loop?',
        question: loopState.repeatWhile?.question || 'Repeat loop?',
        description: 'Loop continuation check',
      },
      on: {
        YES: {
          target: stepIds[0], // Restart from first step
        },
        NO: {
          target: '__loop_exit',
        },
      },
    };

    // Exit pseudo-state
    nestedStates['__loop_exit'] = {
      type: 'final',
    };
  }
}
