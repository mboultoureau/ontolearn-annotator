/**
 * A `when:` on a loop step's transition used to kill the actor.
 *
 * `StateCompiler.compileTransitions` emits `guard_<stepId>_<i>` for a loop step just as
 * it does for a top-level state, but `GuardCompiler.compile` only walked
 * `workflow.workflow.states`, so the guard was never registered. XState then raised
 * "Guard 'guard_s1_0' is not implemented", which surfaces as `status: 'error'` — the
 * state path merely *looks* frozen because the actor is dead.
 *
 * These tests route through data only: they assert on `context.data`, not on the state
 * path, and they listen for actor errors because a regression here is an asynchronous
 * throw rather than a failed assertion.
 */
import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';
import { compileWorkflowToMachine } from '../compiler';
import { parseWorkflowDefinition } from '../parser';

// Loop-step transition targets must be sibling step ids: a target outside the loop
// throws at compile time ("Child state 'done' does not exist on 'guarded_loop.lp'").
const yaml = `
metadata:
  id: loop_guard_probe
  version: 1.0.0
  name: Loop guard probe

workflow:
  entry: lp
  states:
    - id: lp
      type: loop
      repeatWhile:
        type: yes_no
        question: Another one?
      steps:
        - id: s1
          type: choice
          prompt: Pick a branch
          options:
            values:
              - value: a
                label: A
              - value: b
                label: B
          storeAs: sub.class
          transitions:
            - target: s2
              when: data.sub.class == "a"
            - target: s3

        - id: s2
          type: choice
          prompt: Came through the guard
          options:
            values:
              - value: x
                label: X
          storeAs: sub.viaA

        - id: s3
          type: choice
          prompt: Came through the fallback
          options:
            values:
              - value: y
                label: Y
          storeAs: sub.viaB

      storeAs: subs
      transitions:
        - target: done

    - id: done
      type: final
`;

function run(firstChoice: string, secondChoice: string) {
  const { machine } = compileWorkflowToMachine(parseWorkflowDefinition(yaml));
  const actor = createActor(machine);

  const errors: unknown[] = [];
  actor.subscribe({ error: (error) => errors.push(error) });
  actor.start();

  actor.send({ type: 'NEXT', data: firstChoice } as any);
  actor.send({ type: 'NEXT', data: secondChoice } as any);

  const snapshot = actor.getSnapshot();

  return { errors, snapshot, data: snapshot.context.data as any };
}

describe('a guard on a loop step', () => {
  it('is registered, so the actor survives the guarded event', () => {
    const { errors, snapshot } = run('a', 'x');

    expect(errors).toEqual([]);
    expect(snapshot.status).toBe('active');
  });

  it('takes the guarded branch when the condition holds', () => {
    const { data } = run('a', 'x');

    expect(data.sub.class).toBe('a'); // the step's own storeAs
    expect(data.sub.viaA).toBe('x');  // guarded branch ran
    expect(data.sub.viaB).toBeUndefined();
  });

  it('takes the fallback when it does not', () => {
    const { data } = run('b', 'y');

    expect(data.sub.class).toBe('b');
    expect(data.sub.viaB).toBe('y');  // fallback ran
    expect(data.sub.viaA).toBeUndefined();
  });

  it('registers the guard under the name compileTransitions emits', () => {
    const { machine } = compileWorkflowToMachine(parseWorkflowDefinition(yaml));

    expect(Object.keys(machine.implementations.guards ?? {})).toContain('guard_s1_0');
  });
});
