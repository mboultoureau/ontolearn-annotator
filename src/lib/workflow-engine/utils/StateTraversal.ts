import type { WorkflowDefinition, WorkflowState } from '../types';

/**
 * Walks every state of a workflow, loop steps included.
 *
 * A `loop` keeps its children in `state.steps`, not in `workflow.workflow.states`.
 * ActionCompiler and GuardCompiler used to iterate the top-level array alone, so a loop
 * step's `storeAs` never produced a `store_<stepId>` action and a `when:` on one
 * referenced a `guard_<stepId>_<i>` that was never registered — which killed the actor
 * on the first guarded event.
 */
export class StateTraversal {
  /** Every state: top-level first, each loop's steps depth-first right after it. */
  static allStates(workflow: WorkflowDefinition): WorkflowState[] {
    return StateTraversal.flatten(workflow.workflow?.states ?? []);
  }

  static flatten(states: WorkflowState[]): WorkflowState[] {
    const result: WorkflowState[] = [];

    // `steps` is `z.array(z.any())` in the schema and YAML anchors can make two entries
    // the same object, so skip non-objects and never visit one twice.
    const seen = new WeakSet<object>();

    const walk = (list: unknown): void => {
      if (!Array.isArray(list)) {
        return;
      }

      for (const state of list) {
        if (!state || typeof state !== 'object' || seen.has(state)) {
          continue;
        }

        seen.add(state);
        result.push(state as WorkflowState);

        // A loop may itself hold a loop: `LoopState.steps` is `WorkflowState[]`.
        if ((state as { type?: string }).type === 'loop') {
          walk((state as { steps?: unknown }).steps);
        }
      }
    };

    walk(states);

    return result;
  }
}
