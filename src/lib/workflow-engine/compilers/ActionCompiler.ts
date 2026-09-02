/**
 * ActionCompiler - Compiles workflow actions for context updates
 * 
 * Actions are XState assign() operations that update the workflow context
 * based on storeAs fields and event data.
 */

import { assign } from 'xstate';
import type { WorkflowDefinition, WorkflowState, WorkflowContext } from '../types';
import { DataPathNavigator } from '../utils/DataPathNavigator';
import { StateTraversal } from '../utils/StateTraversal';

/**
 * ActionCompiler - Compiles storeAs fields into XState actions
 */
export class ActionCompiler {
  /**
   * Compiles all actions from workflow states
   * 
   * @param workflow - Workflow definition
   * @returns Record of action functions keyed by name
   */
  compile(workflow: WorkflowDefinition): Record<string, any> {
    const actions: Record<string, any> = {};

    // Loop steps live in `state.steps`, not in `workflow.workflow.states`. Iterating the
    // top-level array alone is why `storeAs` on a loop step stored nothing: no
    // `store_<stepId>` action was ever built for it.
    for (const state of StateTraversal.allStates(workflow)) {
      this.compileStateActions(state, actions);
    }

    return actions;
  }

  /**
   * Compiles actions for a specific state based on its type
   * 
   * @param state - Workflow state
   * @param actions - Actions accumulator
   */
  private compileStateActions(state: WorkflowState, actions: Record<string, any>): void {
    // Handle yes_no states with storeAs
    if (state.type === 'yes_no') {
      this.compileYesNoActions(state as Extract<WorkflowState, { type: 'yes_no' }>, actions);
      return;
    }

    // Handle task states with fields
    if (state.type === 'task') {
      this.compileTaskActions(state as Extract<WorkflowState, { type: 'task' }>, actions);
      return;
    }

    // Handle generic storeAs states (choice, multi_choice, area_select, etc.)
    if ('storeAs' in state && state.storeAs) {
      this.compileGenericStoreAction(state, actions);
    }
  }

  /**
   * Compiles actions for yes_no states
   * Creates separate actions for YES and NO responses
   */
  private compileYesNoActions(
    state: Extract<WorkflowState, { type: 'yes_no' }>,
    actions: Record<string, any>
  ): void {
    if (!state.storeAs) return;

    // Action for YES response (stores true)
    actions[`store_${state.id}_yes`] = assign({
      data: ({ context }: { context: WorkflowContext }) => {
        return DataPathNavigator.setValue(context.data || {}, state.storeAs!, true);
      },
    });

    // Action for NO response (stores false)
    actions[`store_${state.id}_no`] = assign({
      data: ({ context }: { context: WorkflowContext }) => {
        return DataPathNavigator.setValue(context.data || {}, state.storeAs!, false);
      },
    });
  }

  /**
   * Compiles actions for task states with multiple fields
   * Stores each field's value based on its storeAs property
   */
  private compileTaskActions(
    state: Extract<WorkflowState, { type: 'task' }>,
    actions: Record<string, any>
  ): void {
    if (!state.fields || state.fields.length === 0) return;

    const actionName = `store_${state.id}`;

    actions[actionName] = assign({
      data: ({ context, event }: { context: WorkflowContext; event: any }) => {
        let newData = context.data || {};

        // Store each field's value from event.data
        for (const field of state.fields) {
          if (field.storeAs && event.data && field.id in event.data) {
            newData = DataPathNavigator.setValue(
              newData,
              field.storeAs,
              event.data[field.id]
            );
          }
        }

        return newData;
      },
    });
  }

  /**
   * Compiles generic store action for states with simple storeAs
   * Used by choice, multi_choice, area_select, etc.
   */
  private compileGenericStoreAction(
    state: WorkflowState & { storeAs?: string },
    actions: Record<string, any>
  ): void {
    if (!state.storeAs) return;

    const actionName = `store_${state.id}`;
    const storeAs = state.storeAs;

    actions[actionName] = assign({
      data: ({ context, event }: { context: WorkflowContext; event: any }) => {
        return DataPathNavigator.setValue(context.data || {}, storeAs, event.data);
      },
    });
  }
}

/**
 * Benefits of ActionCompiler class:
 * 
 * 1. **Single Responsibility**: Only handles action compilation
 * 2. **Type Safety**: Proper handling of different state types
 * 3. **DRY**: Uses DataPathNavigator for all path operations
 * 4. **Testable**: Can be tested in isolation
 * 5. **Maintainable**: Easy to add new action types
 * 
 * Example usage:
 * ```typescript
 * const compiler = new ActionCompiler();
 * const actions = compiler.compile(workflow);
 * ```
 */
