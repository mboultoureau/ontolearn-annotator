/**
 * Regression tests for the storeAs gaps: these assert on context.data, not on the
 * state path. Navigation was always fine — only the writes were missing.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createActor } from 'xstate';
import { compileWorkflowToMachine } from '../compiler';
import { parseWorkflowDefinition } from '../parser';

function runCoverageWorkflow() {
  const yaml = readFileSync(
    resolve(__dirname, '../../../../workflows/examples/node-coverage-test.yaml'),
    'utf8'
  ).replace(/\$\{imageUrl\}/g, '/uploads/x.jpg');

  const workflow = parseWorkflowDefinition(yaml);
  // fetch sources are resolved by DataSourceLoader before the machine starts
  (workflow.dataSources as any).class_types = { type: 'static', data: ['Dentrite', 'Unknown'] };

  const { machine } = compileWorkflowToMachine(workflow);
  const actor = createActor(machine);
  actor.start();

  // Event names exactly as workflow-state-renderer.tsx sends them. The branch state is
  // not auto-transitioning in the machine: the renderer sends NEXT after its message.
  const send = (type: string, data?: unknown) => actor.send({ type, data } as any);
  send('NEXT', { annotator_name: 'Jane', annotator_email: 'j@e.org', confidence: 80, context_note: 'a note' });
  send('NEXT', 'high');
  send('NEXT');                                              // branch
  send('AREA_SELECTED', { x: 1, y: 2, width: 3, height: 4 });
  send('NEXT', ['Dentrite']);
  send('YES', true);
  send('AREA_SELECTED', { x: 5, y: 6, width: 7, height: 8 }); // loop step
  send('NEXT', 'Dentrite');
  send('NEXT', { detail_comment: 'c' });
  send('NO', false);
  send('NEXT', 'accept');
  send('YES', true);
  send('NEXT', { session_summary: 'done' });

  return actor.getSnapshot();
}

describe('storeAs writes into context.data', () => {
  const snapshot = runCoverageWorkflow();
  const data = snapshot.context.data as any;

  it('reaches the final state', () => {
    expect(snapshot.status).toBe('done');
  });

  // Item 4: task fields used to land as null, because the store action was compiled
  // and never attached.
  it('stores every task field', () => {
    expect(data.qa.annotator.name).toBe('Jane');
    expect(data.qa.annotator.email).toBe('j@e.org');
    expect(data.qa.annotator.confidence).toBe(80);
    expect(data.qa.annotator.note).toBe('a note');
    expect(data.qa.summary).toBe('done');
  });

  // Item 5: area_select never attached its action at all.
  it('stores the selected area', () => {
    expect(data.qa.zone).toEqual({ x: 1, y: 2, width: 3, height: 4 });
  });

  it('still stores choice, multi_choice and yes_no', () => {
    expect(data.qa.severity).toBe('high');
    expect(data.qa.tags).toEqual(['Dentrite']);
    expect(data.qa.review).toBe('accept');
    expect(data.qa.wantsDetails).toBe(true);
    expect(data.qa.confirmed).toBe(true);
  });

  // Guards could not depend on a task field or an area before this; the branch here
  // reads a choice, so proving the area is present is what matters.
  it('makes the area available to guards', () => {
    expect(data.qa.zone).not.toBeNull();
  });
});
