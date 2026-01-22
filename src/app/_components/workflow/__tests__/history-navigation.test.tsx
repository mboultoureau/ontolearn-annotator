/**
 * Tests for History Navigation Features
 */

import { describe, it, expect } from 'vitest';
import {
  initializeHistory,
  createHistoryStep,
  addHistoryStep,
  goBackInHistory,
} from '@/lib/workflow-engine/history-manager';
import type { WorkflowContext, WorkflowState } from '@/lib/workflow-engine/types';

describe('History Navigation', () => {
  const createMockContext = (state: string, data: any = {}): WorkflowContext => ({
    metadata: { sessionId: 'test' },
    currentState: state,
    dataSources: {},
    data,
  });

  const createMockState = (id: string, type: string): WorkflowState => ({
    id,
    type: type as any,
    name: `Step ${id}`,
    storeAs: `data.${id}`,
    transitions: [],
  });

  describe('Linear Navigation', () => {
    it('should navigate back through linear workflow', () => {
      let history = initializeHistory();

      // Add 3 steps sequentially
      for (let i = 1; i <= 3; i++) {
        const state = createMockState(`step${i}`, 'choice');
        const context = createMockContext(`step${i}`, { [`step${i}`]: `value${i}` });
        const annotation = { id: `ann-${i}`, payload: { value: `value${i}` } };
        const step = createHistoryStep(`step${i}`, state, annotation, context);
        history = addHistoryStep(history, step);
      }

      // Should be at step 3 (index 2)
      expect(history.currentIndex).toBe(2);
      expect(history.canGoBack).toBe(true);
      expect(history.canGoForward).toBe(false);

      // Go back once
      const newHistory = goBackInHistory(history);
      expect(newHistory).not.toBeNull();
      if (newHistory) {
        expect(newHistory.currentIndex).toBe(1);
        expect(newHistory.canGoBack).toBe(true);
        expect(newHistory.canGoForward).toBe(true);
      }
    });

    it('should not allow going back from first step', () => {
      let history = initializeHistory();

      const state = createMockState('step1', 'choice');
      const context = createMockContext('step1');
      const annotation = { id: 'ann-1', payload: {} };
      const step = createHistoryStep('step1', state, annotation, context);
      history = addHistoryStep(history, step);

      // Try to go back
      const result = goBackInHistory(history);
      expect(result).toBeNull();
    });
  });

  describe('Conditional Navigation', () => {
    it('should preserve branching history', () => {
      let history = initializeHistory();

      // Step 1: Choice
      const step1State = createMockState('choose', 'choice');
      const step1Context = createMockContext('choose', { choice: 'A' });
      const step1Annotation = { id: 'ann-1', payload: { choice: 'A' } };
      const step1 = createHistoryStep('choose', step1State, step1Annotation, step1Context);
      history = addHistoryStep(history, step1);

      // Step 2: Branch A (based on choice)
      const step2State = createMockState('branch_a', 'area_select');
      const step2Context = createMockContext('branch_a', { area: 'selected' });
      const step2Annotation = { id: 'ann-2', payload: { area: 'selected' } };
      const step2 = createHistoryStep('branch_a', step2State, step2Annotation, step2Context, 'choose');
      history = addHistoryStep(history, step2);

      // Verify history tracks the branch
      expect(history.steps).toHaveLength(2);
      expect(history.steps[1].previousStateId).toBe('choose');
    });
  });

  describe('Loop Navigation', () => {
    it('should track loop iterations in history', () => {
      let history = initializeHistory();

      // Loop iteration 1
      const loopState1 = createMockState('loop_step', 'choice');
      const loopContext1 = createMockContext('loop_step', { items: [{ value: 'item1' }] });
      const loopAnnotation1 = { id: 'ann-1', payload: { value: 'item1' } };
      const loopStep1 = createHistoryStep('loop_step', loopState1, loopAnnotation1, loopContext1);
      loopStep1.loopContext = { parentLoopId: 'main_loop', iteration: 0, totalIterations: 2 };
      history = addHistoryStep(history, loopStep1);

      // Loop iteration 2
      const loopContext2 = createMockContext('loop_step', { items: [{ value: 'item1' }, { value: 'item2' }] });
      const loopAnnotation2 = { id: 'ann-2', payload: { value: 'item2' } };
      const loopStep2 = createHistoryStep('loop_step', loopState1, loopAnnotation2, loopContext2);
      loopStep2.loopContext = { parentLoopId: 'main_loop', iteration: 1, totalIterations: 2 };
      history = addHistoryStep(history, loopStep2);

      // Verify both iterations are in history
      expect(history.steps).toHaveLength(2);
      expect(history.steps[0].loopContext?.iteration).toBe(0);
      expect(history.steps[1].loopContext?.iteration).toBe(1);
    });

    it('should handle nested loop steps', () => {
      let history = initializeHistory();

      // Parent loop step
      const parentState = createMockState('subsection_loop', 'loop');
      const parentContext = createMockContext('subsection_loop');
      const parentAnnotation = { id: 'ann-parent', payload: {} };
      const parentStep = createHistoryStep('subsection_loop', parentState, parentAnnotation, parentContext);
      history = addHistoryStep(history, parentStep);

      // Nested loop step 1
      const nestedState1 = createMockState('select_subsection_area', 'area_select');
      const nestedContext1 = createMockContext('select_subsection_area', { subsection: { area: 'area1' } });
      const nestedAnnotation1 = { id: 'ann-nested-1', payload: { area: 'area1' } };
      const nestedStep1 = createHistoryStep('select_subsection_area', nestedState1, nestedAnnotation1, nestedContext1);
      nestedStep1.parentState = 'subsection_loop';
      history = addHistoryStep(history, nestedStep1);

      // Nested loop step 2
      const nestedState2 = createMockState('select_subsection_classes', 'multi_choice');
      const nestedContext2 = createMockContext('select_subsection_classes', { subsection: { classes: ['A', 'B'] } });
      const nestedAnnotation2 = { id: 'ann-nested-2', payload: { classes: ['A', 'B'] } };
      const nestedStep2 = createHistoryStep('select_subsection_classes', nestedState2, nestedAnnotation2, nestedContext2);
      nestedStep2.parentState = 'subsection_loop';
      history = addHistoryStep(history, nestedStep2);

      // Verify nested steps have parent reference
      expect(history.steps).toHaveLength(3);
      expect(history.steps[1].parentState).toBe('subsection_loop');
      expect(history.steps[2].parentState).toBe('subsection_loop');
    });
  });

  describe('History Branching', () => {
    it('should clear forward history when adding new step after going back', () => {
      let history = initializeHistory();

      // Add 3 steps
      for (let i = 1; i <= 3; i++) {
        const state = createMockState(`step${i}`, 'choice');
        const context = createMockContext(`step${i}`);
        const annotation = { id: `ann-${i}`, payload: {} };
        const step = createHistoryStep(`step${i}`, state, annotation, context);
        history = addHistoryStep(history, step);
      }

      // Go back to step 1 (index 1)
      history = { ...history, currentIndex: 1, canGoForward: true };

      // Add new step (branch)
      const newState = createMockState('new_step', 'choice');
      const newContext = createMockContext('new_step');
      const newAnnotation = { id: 'ann-new', payload: {} };
      const newStep = createHistoryStep('new_step', newState, newAnnotation, newContext);
      history = addHistoryStep(history, newStep);

      // Should have only 3 steps (first 2 + new)
      expect(history.steps).toHaveLength(3);
      expect(history.steps[2].stateId).toBe('new_step');
      expect(history.canGoForward).toBe(false);
    });
  });
});
