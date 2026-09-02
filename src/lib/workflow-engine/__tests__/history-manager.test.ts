/**
 * Tests for History Manager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeHistory,
  createHistoryStep,
  addHistoryStep,
  goBackInHistory,
} from '../history-manager';
import type { WorkflowHistory, WorkflowState, WorkflowContext } from '../types';

describe('History Manager', () => {
  let mockContext: WorkflowContext;
  let mockStateMeta: WorkflowState;

  beforeEach(() => {
    mockContext = {
      metadata: { sessionId: 'test-session' },
      currentState: 'step1',
      dataSources: {},
      data: { test: 'value' },
    };

    mockStateMeta = {
      id: 'step1',
      type: 'choice',
      name: 'Test Step',
      storeAs: 'data.choice',
      transitions: [],
    };
  });

  describe('initializeHistory', () => {
    it('should create empty history', () => {
      const history = initializeHistory();

      expect(history.steps).toEqual([]);
      expect(history.currentIndex).toBe(-1);
      expect(history.canGoBack).toBe(false);
      expect(history.canGoForward).toBe(false);
    });
  });

  describe('createHistoryStep', () => {
    it('should create a history step with all required fields', () => {
      const annotation = { id: 'ann-1', payload: { data: 'test' } };
      
      const step = createHistoryStep(
        'step1',
        mockStateMeta,
        annotation,
        mockContext
      );

      expect(step.id).toContain('history-step1-');
      expect(step.stateId).toBe('step1');
      expect(step.stateName).toBe('Test Step');
      expect(step.stateType).toBe('choice');
      expect(step.annotation).toEqual(annotation);
      expect(step.contextSnapshot.data).toEqual({ test: 'value' });
    });

    it('should deep clone context to prevent mutations', () => {
      const annotation = { id: 'ann-1', payload: {} };
      
      const step = createHistoryStep(
        'step1',
        mockStateMeta,
        annotation,
        mockContext
      );

      // Mutate original context
      mockContext.data.test = 'changed';

      // Snapshot should still have original value
      expect(step.contextSnapshot.data.test).toBe('value');
    });

    it('should include previousStateId if provided', () => {
      const annotation = { id: 'ann-1', payload: {} };
      
      const step = createHistoryStep(
        'step2',
        mockStateMeta,
        annotation,
        mockContext,
        'step1'
      );

      expect(step.previousStateId).toBe('step1');
    });
  });

  describe('addHistoryStep', () => {
    it('should add step to empty history', () => {
      const history = initializeHistory();
      const annotation = { id: 'ann-1', payload: {} };
      const step = createHistoryStep('step1', mockStateMeta, annotation, mockContext);

      const newHistory = addHistoryStep(history, step);

      expect(newHistory.steps).toHaveLength(1);
      expect(newHistory.currentIndex).toBe(0);
      expect(newHistory.canGoBack).toBe(false); // Can't go back from first step
      expect(newHistory.canGoForward).toBe(false);
    });

    it('should add multiple steps sequentially', () => {
      let history = initializeHistory();
      
      for (let i = 1; i <= 3; i++) {
        const annotation = { id: `ann-${i}`, payload: {} };
        const step = createHistoryStep(`step${i}`, mockStateMeta, annotation, mockContext);
        history = addHistoryStep(history, step);
      }

      expect(history.steps).toHaveLength(3);
      expect(history.currentIndex).toBe(2);
      expect(history.canGoBack).toBe(true);
    });

    it('should remove forward steps when adding after going back', () => {
      let history = initializeHistory();
      
      // Add 3 steps
      for (let i = 1; i <= 3; i++) {
        const annotation = { id: `ann-${i}`, payload: {} };
        const step = createHistoryStep(`step${i}`, mockStateMeta, annotation, mockContext);
        history = addHistoryStep(history, step);
      }

      // Go back (simulate by setting currentIndex)
      history = { ...history, currentIndex: 1, canGoBack: true, canGoForward: true };

      // Add new step
      const annotation = { id: 'ann-new', payload: {} };
      const step = createHistoryStep('step-new', mockStateMeta, annotation, mockContext);
      history = addHistoryStep(history, step);

      // Should have only 3 steps (first 2 + new)
      expect(history.steps).toHaveLength(3);
      expect(history.steps[2].stateId).toBe('step-new');
      expect(history.canGoForward).toBe(false);
    });
  });

  describe('goBackInHistory', () => {
    it('should return null if cannot go back', () => {
      const history = initializeHistory();

      const result = goBackInHistory(history);

      expect(result).toBeNull();
    });

    it('should allow going back when steps exist', () => {
      let history = initializeHistory();
      
      // Add steps
      for (let i = 1; i <= 3; i++) {
        const annotation = { id: `ann-${i}`, payload: {} };
        const step = createHistoryStep(`step${i}`, mockStateMeta, annotation, mockContext);
        history = addHistoryStep(history, step);
      }

      const result = goBackInHistory(history);

      expect(result).not.toBeNull();
      expect(result!.canGoBack).toBe(true);
    });
  });
});
