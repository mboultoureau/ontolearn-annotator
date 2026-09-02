import { describe, expect, it } from 'vitest';
import { StateTraversal } from '../StateTraversal';

const ids = (states: unknown[]) => states.map((s: any) => s.id);

describe('StateTraversal.flatten', () => {
  it('returns a flat workflow unchanged and in order', () => {
    const states = [{ id: 'a', type: 'choice' }, { id: 'b', type: 'final' }] as any;

    expect(ids(StateTraversal.flatten(states))).toEqual(['a', 'b']);
  });

  it('yields a loop then its steps', () => {
    const states = [
      { id: 'before', type: 'choice' },
      { id: 'lp', type: 'loop', steps: [{ id: 's1', type: 'choice' }, { id: 's2', type: 'task' }] },
      { id: 'after', type: 'final' },
    ] as any;

    expect(ids(StateTraversal.flatten(states))).toEqual(['before', 'lp', 's1', 's2', 'after']);
  });

  it('descends into a loop nested in a loop', () => {
    const states = [
      {
        id: 'outer',
        type: 'loop',
        steps: [{ id: 'inner', type: 'loop', steps: [{ id: 'deep', type: 'choice' }] }],
      },
    ] as any;

    expect(ids(StateTraversal.flatten(states))).toEqual(['outer', 'inner', 'deep']);
  });

  // `steps` is `z.array(z.any())` in the schema, so anything can land in there.
  it('skips entries that are not objects', () => {
    const states = [
      { id: 'lp', type: 'loop', steps: [null, 'nope', 42, { id: 's1', type: 'choice' }] },
    ] as any;

    expect(ids(StateTraversal.flatten(states))).toEqual(['lp', 's1']);
  });

  it('does not loop forever on a self-referencing steps array', () => {
    const loop: any = { id: 'lp', type: 'loop' };
    loop.steps = [loop];

    expect(ids(StateTraversal.flatten([loop]))).toEqual(['lp']);
  });

  it('tolerates a loop with empty or missing steps', () => {
    const states = [
      { id: 'empty', type: 'loop', steps: [] },
      { id: 'missing', type: 'loop' },
    ] as any;

    expect(ids(StateTraversal.flatten(states))).toEqual(['empty', 'missing']);
  });
});

describe('StateTraversal.allStates', () => {
  it('reads through the workflow wrapper', () => {
    const workflow = {
      workflow: { entry: 'lp', states: [{ id: 'lp', type: 'loop', steps: [{ id: 's1' }] }] },
    } as any;

    expect(ids(StateTraversal.allStates(workflow))).toEqual(['lp', 's1']);
  });

  it('returns nothing rather than throwing on a malformed workflow', () => {
    expect(StateTraversal.allStates({} as any)).toEqual([]);
  });
});
