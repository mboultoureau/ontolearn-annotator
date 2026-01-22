/**
 * Tests for Loop Replay Edge Cases
 * 
 * These tests verify complex loop scenarios and error handling during replay
 */

import { describe, it, expect } from 'vitest';
import {
  initializeHistory,
  createHistoryStep,
  addHistoryStep,
  goBackInHistory,
} from '../history-manager';
import type { WorkflowContext, WorkflowState } from '../types';

describe('Loop Replay - Edge Cases', () => {
  const createMockContext = (state: string, data: any = {}): WorkflowContext => ({
    metadata: { sessionId: 'test-session' },
    currentState: state,
    dataSources: {},
    data,
  });

  const createMockState = (id: string, type: string, parentLoop?: string): WorkflowState => ({
    id,
    type: type as any,
    name: `Step ${id}`,
    storeAs: `data.${id}`,
    transitions: [],
    ...(parentLoop && { parentState: parentLoop }),
  });

  describe('Triple-Nested Loops', () => {
    it('should handle three levels of nested loops', () => {
      let history = initializeHistory();

      // Level 1: Main loop
      const loop1State = createMockState('main_loop', 'loop');
      const loop1Context = createMockContext('main_loop', { mainItems: [] });
      const loop1Annotation = { id: 'ann-loop1', payload: {} };
      const loop1Step = createHistoryStep('main_loop', loop1State, loop1Annotation, loop1Context);
      loop1Step.loopContext = { parentLoopId: null, iteration: 0, totalIterations: 2 };
      history = addHistoryStep(history, loop1Step);

      // Level 2: Sub loop (nested in main loop)
      const loop2State = createMockState('sub_loop', 'loop', 'main_loop');
      const loop2Context = createMockContext('sub_loop', { mainItems: [{ subItems: [] }] });
      const loop2Annotation = { id: 'ann-loop2', payload: {} };
      const loop2Step = createHistoryStep('sub_loop', loop2State, loop2Annotation, loop2Context);
      loop2Step.loopContext = { parentLoopId: 'main_loop', iteration: 0, totalIterations: 2 };
      history = addHistoryStep(history, loop2Step);

      // Level 3: Inner loop (nested in sub loop)
      const loop3State = createMockState('inner_loop', 'loop', 'sub_loop');
      const loop3Context = createMockContext('inner_loop', {
        mainItems: [{ subItems: [{ innerItems: [] }] }]
      });
      const loop3Annotation = { id: 'ann-loop3', payload: {} };
      const loop3Step = createHistoryStep('inner_loop', loop3State, loop3Annotation, loop3Context);
      loop3Step.loopContext = { parentLoopId: 'sub_loop', iteration: 0, totalIterations: 2 };
      history = addHistoryStep(history, loop3Step);

      // Add a step inside innermost loop
      const innerStepState = createMockState('inner_step', 'choice', 'inner_loop');
      const innerStepContext = createMockContext('inner_step', {
        mainItems: [{ subItems: [{ innerItems: [{ value: 'test' }] }] }]
      });
      const innerStepAnnotation = { id: 'ann-inner', payload: { value: 'test' } };
      const innerStep = createHistoryStep('inner_step', innerStepState, innerStepAnnotation, innerStepContext);
      innerStep.loopContext = { parentLoopId: 'inner_loop', iteration: 0, totalIterations: 2 };
      innerStep.parentState = 'inner_loop';
      history = addHistoryStep(history, innerStep);

      // Verify all levels are tracked
      expect(history.steps).toHaveLength(4);
      expect(history.steps[0].loopContext?.parentLoopId).toBeNull();
      expect(history.steps[1].loopContext?.parentLoopId).toBe('main_loop');
      expect(history.steps[2].loopContext?.parentLoopId).toBe('sub_loop');
      expect(history.steps[3].parentState).toBe('inner_loop');

      // Verify we can go back through nested loops
      const backResult = goBackInHistory(history);
      expect(backResult).not.toBeNull();
      expect(backResult!.currentIndex).toBe(2);
    });

    it('should track iteration numbers across nested loops', () => {
      let history = initializeHistory();

      // Outer loop - iteration 0
      const outer0 = createHistoryStep(
        'outer_loop',
        createMockState('outer_loop', 'loop'),
        { id: 'ann-outer0', payload: {} },
        createMockContext('outer_loop', { outerItems: [{}] })
      );
      outer0.loopContext = { parentLoopId: null, iteration: 0, totalIterations: 2 };
      history = addHistoryStep(history, outer0);

      // Inner loop - iteration 0 (inside outer iteration 0)
      const inner0_0 = createHistoryStep(
        'inner_loop',
        createMockState('inner_loop', 'loop', 'outer_loop'),
        { id: 'ann-inner0-0', payload: {} },
        createMockContext('inner_loop', { outerItems: [{ innerItems: [{}] }] })
      );
      inner0_0.loopContext = { parentLoopId: 'outer_loop', iteration: 0, totalIterations: 2 };
      history = addHistoryStep(history, inner0_0);

      // Inner loop - iteration 1 (inside outer iteration 0)
      const inner0_1 = createHistoryStep(
        'inner_loop',
        createMockState('inner_loop', 'loop', 'outer_loop'),
        { id: 'ann-inner0-1', payload: {} },
        createMockContext('inner_loop', { outerItems: [{ innerItems: [{}, {}] }] })
      );
      inner0_1.loopContext = { parentLoopId: 'outer_loop', iteration: 1, totalIterations: 2 };
      history = addHistoryStep(history, inner0_1);

      // Outer loop - iteration 1
      const outer1 = createHistoryStep(
        'outer_loop',
        createMockState('outer_loop', 'loop'),
        { id: 'ann-outer1', payload: {} },
        createMockContext('outer_loop', { outerItems: [{}, {}] })
      );
      outer1.loopContext = { parentLoopId: null, iteration: 1, totalIterations: 2 };
      history = addHistoryStep(history, outer1);

      // Inner loop - iteration 0 (inside outer iteration 1)
      const inner1_0 = createHistoryStep(
        'inner_loop',
        createMockState('inner_loop', 'loop', 'outer_loop'),
        { id: 'ann-inner1-0', payload: {} },
        createMockContext('inner_loop', { outerItems: [{}, { innerItems: [{}] }] })
      );
      inner1_0.loopContext = { parentLoopId: 'outer_loop', iteration: 0, totalIterations: 2 };
      history = addHistoryStep(history, inner1_0);

      // Verify iteration tracking
      expect(history.steps).toHaveLength(5);
      expect(history.steps[0].loopContext?.iteration).toBe(0); // outer iter 0
      expect(history.steps[1].loopContext?.iteration).toBe(0); // inner iter 0 in outer 0
      expect(history.steps[2].loopContext?.iteration).toBe(1); // inner iter 1 in outer 0
      expect(history.steps[3].loopContext?.iteration).toBe(1); // outer iter 1
      expect(history.steps[4].loopContext?.iteration).toBe(0); // inner iter 0 in outer 1
    });
  });

  describe('Loop with Validation Errors', () => {
    it('should track error state in loop iteration', () => {
      let history = initializeHistory();

      // Loop iteration with valid data
      const validStep = createHistoryStep(
        'loop_step',
        createMockState('loop_step', 'choice', 'main_loop'),
        { id: 'ann-valid', payload: { value: 'valid' } },
        createMockContext('loop_step', { items: [{ value: 'valid' }] })
      );
      validStep.loopContext = { parentLoopId: 'main_loop', iteration: 0, totalIterations: 2 };
      validStep.validation = { isValid: true, errors: [] };
      history = addHistoryStep(history, validStep);

      // Loop iteration with error
      const errorStep = createHistoryStep(
        'loop_step',
        createMockState('loop_step', 'choice', 'main_loop'),
        { id: 'ann-error', payload: { value: '' } },
        createMockContext('loop_step', { items: [{ value: 'valid' }, { value: '' }] })
      );
      errorStep.loopContext = { parentLoopId: 'main_loop', iteration: 1, totalIterations: 2 };
      errorStep.validation = { isValid: false, errors: ['Value is required'] };
      history = addHistoryStep(history, errorStep);

      // Verify error is tracked
      expect(history.steps).toHaveLength(2);
      expect(history.steps[0].validation?.isValid).toBe(true);
      expect(history.steps[1].validation?.isValid).toBe(false);
      expect(history.steps[1].validation?.errors).toContain('Value is required');
    });

    it('should allow going back to fix validation error in loop', () => {
      let history = initializeHistory();

      // Add step with error
      const errorStep = createHistoryStep(
        'loop_step',
        createMockState('loop_step', 'choice', 'main_loop'),
        { id: 'ann-error', payload: { value: '' } },
        createMockContext('loop_step', { items: [{ value: '' }] })
      );
      errorStep.loopContext = { parentLoopId: 'main_loop', iteration: 0, totalIterations: 1 };
      errorStep.validation = { isValid: false, errors: ['Value is required'] };
      history = addHistoryStep(history, errorStep);

      // Add continuation step (user tries to continue despite error)
      const nextStep = createHistoryStep(
        'next_step',
        createMockState('next_step', 'choice'),
        { id: 'ann-next', payload: {} },
        createMockContext('next_step', {})
      );
      history = addHistoryStep(history, nextStep);

      // Go back to fix error
      const backResult = goBackInHistory(history);
      expect(backResult).not.toBeNull();
      expect(backResult!.currentIndex).toBe(0);
      expect(backResult!.steps[0].validation?.isValid).toBe(false);

      // Add corrected step
      const fixedStep = createHistoryStep(
        'loop_step',
        createMockState('loop_step', 'choice', 'main_loop'),
        { id: 'ann-fixed', payload: { value: 'corrected' } },
        createMockContext('loop_step', { items: [{ value: 'corrected' }] })
      );
      fixedStep.loopContext = { parentLoopId: 'main_loop', iteration: 0, totalIterations: 1 };
      fixedStep.validation = { isValid: true, errors: [] };
      
      const correctedHistory = addHistoryStep(backResult!, fixedStep);

      // Verify correction
      expect(correctedHistory.steps).toHaveLength(2); // Error step + fixed step
      expect(correctedHistory.steps[1].validation?.isValid).toBe(true);
    });
  });

  describe('Loop Interruption and Resumption', () => {
    it('should handle interrupted loop (user navigates away)', () => {
      let history = initializeHistory();

      // Start loop
      const loop1 = createHistoryStep(
        'main_loop',
        createMockState('main_loop', 'loop'),
        { id: 'ann-loop', payload: {} },
        createMockContext('main_loop', { items: [] })
      );
      loop1.loopContext = { parentLoopId: null, iteration: 0, totalIterations: 3 };
      history = addHistoryStep(history, loop1);

      // First iteration
      const iter1 = createHistoryStep(
        'loop_step',
        createMockState('loop_step', 'choice', 'main_loop'),
        { id: 'ann-iter1', payload: { value: 'first' } },
        createMockContext('loop_step', { items: [{ value: 'first' }] })
      );
      iter1.loopContext = { parentLoopId: 'main_loop', iteration: 0, totalIterations: 3 };
      history = addHistoryStep(history, iter1);

      // User navigates away (interruption)
      const interrupted = createHistoryStep(
        'other_step',
        createMockState('other_step', 'choice'),
        { id: 'ann-other', payload: {} },
        createMockContext('other_step', {})
      );
      interrupted.metadata = { interrupted: true, interruptedLoop: 'main_loop' };
      history = addHistoryStep(history, interrupted);

      // Verify interruption is tracked
      expect(history.steps).toHaveLength(3);
      expect(history.steps[2].metadata?.interrupted).toBe(true);
      expect(history.steps[2].metadata?.interruptedLoop).toBe('main_loop');
    });

    it('should allow resuming interrupted loop', () => {
      let history = initializeHistory();

      // Loop with first iteration
      const loop1 = createHistoryStep(
        'main_loop',
        createMockState('main_loop', 'loop'),
        { id: 'ann-loop', payload: {} },
        createMockContext('main_loop', { items: [{ value: 'first' }] })
      );
      loop1.loopContext = { parentLoopId: null, iteration: 0, totalIterations: 3 };
      history = addHistoryStep(history, loop1);

      // Interruption
      const interrupted = createHistoryStep(
        'other_step',
        createMockState('other_step', 'choice'),
        { id: 'ann-other', payload: {} },
        createMockContext('other_step', {})
      );
      interrupted.metadata = { interrupted: true, interruptedLoop: 'main_loop', interruptedAtIteration: 0 };
      history = addHistoryStep(history, interrupted);

      // Go back to loop
      const backResult = goBackInHistory(history);
      expect(backResult).not.toBeNull();

      // Resume loop at iteration 1
      const resumed = createHistoryStep(
        'main_loop',
        createMockState('main_loop', 'loop'),
        { id: 'ann-resumed', payload: {} },
        createMockContext('main_loop', { items: [{ value: 'first' }, { value: 'second' }] })
      );
      resumed.loopContext = { parentLoopId: null, iteration: 1, totalIterations: 3 };
      resumed.metadata = { resumed: true, resumedFromIteration: 0 };
      
      const resumedHistory = addHistoryStep(backResult!, resumed);

      // Verify resumption
      expect(resumedHistory.steps).toHaveLength(2);
      expect(resumedHistory.steps[1].metadata?.resumed).toBe(true);
      expect(resumedHistory.steps[1].loopContext?.iteration).toBe(1);
    });
  });

  describe('Loop Iteration Limits', () => {
    it('should handle loop with many iterations', () => {
      let history = initializeHistory();

      const maxIterations = 10;
      
      // Add loop entry
      const loopEntry = createHistoryStep(
        'main_loop',
        createMockState('main_loop', 'loop'),
        { id: 'ann-loop', payload: {} },
        createMockContext('main_loop', { items: [] })
      );
      loopEntry.loopContext = { parentLoopId: null, iteration: 0, totalIterations: maxIterations };
      history = addHistoryStep(history, loopEntry);

      // Add all iterations
      for (let i = 0; i < maxIterations; i++) {
        const iterStep = createHistoryStep(
          'loop_step',
          createMockState('loop_step', 'choice', 'main_loop'),
          { id: `ann-iter${i}`, payload: { value: `item${i}` } },
          createMockContext('loop_step', { items: Array(i + 1).fill({}) })
        );
        iterStep.loopContext = { parentLoopId: 'main_loop', iteration: i, totalIterations: maxIterations };
        history = addHistoryStep(history, iterStep);
      }

      // Verify all iterations are tracked
      expect(history.steps).toHaveLength(maxIterations + 1); // +1 for loop entry
      expect(history.steps[maxIterations].loopContext?.iteration).toBe(maxIterations - 1);
    });

    it('should handle loop with zero iterations (immediate exit)', () => {
      let history = initializeHistory();

      // Loop entry
      const loopEntry = createHistoryStep(
        'main_loop',
        createMockState('main_loop', 'loop'),
        { id: 'ann-loop', payload: {} },
        createMockContext('main_loop', { items: [] })
      );
      loopEntry.loopContext = { parentLoopId: null, iteration: 0, totalIterations: 0 };
      history = addHistoryStep(history, loopEntry);

      // Exit immediately
      const exitStep = createHistoryStep(
        'after_loop',
        createMockState('after_loop', 'choice'),
        { id: 'ann-exit', payload: {} },
        createMockContext('after_loop', { items: [] })
      );
      history = addHistoryStep(history, exitStep);

      // Verify loop was entered and exited without iterations
      expect(history.steps).toHaveLength(2);
      expect(history.steps[0].loopContext?.totalIterations).toBe(0);
    });
  });

  describe('Loop State Restoration', () => {
    it('should restore loop state correctly after going back', () => {
      let history = initializeHistory();

      // Initial data state
      const initialData = { items: [] };

      // First iteration
      const iter1Context = { items: [{ id: 1, value: 'first' }] };
      const iter1 = createHistoryStep(
        'loop_step',
        createMockState('loop_step', 'choice', 'main_loop'),
        { id: 'ann-iter1', payload: { id: 1, value: 'first' } },
        createMockContext('loop_step', iter1Context)
      );
      iter1.loopContext = { parentLoopId: 'main_loop', iteration: 0, totalIterations: 2 };
      history = addHistoryStep(history, iter1);

      // Second iteration
      const iter2Context = { items: [{ id: 1, value: 'first' }, { id: 2, value: 'second' }] };
      const iter2 = createHistoryStep(
        'loop_step',
        createMockState('loop_step', 'choice', 'main_loop'),
        { id: 'ann-iter2', payload: { id: 2, value: 'second' } },
        createMockContext('loop_step', iter2Context)
      );
      iter2.loopContext = { parentLoopId: 'main_loop', iteration: 1, totalIterations: 2 };
      history = addHistoryStep(history, iter2);

      // Go back to first iteration
      const backResult = goBackInHistory(history);
      expect(backResult).not.toBeNull();

      // Verify state is restored to first iteration
      const restoredStep = backResult!.steps[backResult!.currentIndex];
      expect(restoredStep.contextSnapshot.data.items).toHaveLength(1);
      expect(restoredStep.contextSnapshot.data.items[0].id).toBe(1);
    });

    it('should maintain loop metadata after restoration', () => {
      let history = initializeHistory();

      const loopStep = createHistoryStep(
        'loop_step',
        createMockState('loop_step', 'choice', 'main_loop'),
        { id: 'ann-loop', payload: { value: 'test' } },
        createMockContext('loop_step', { items: [{ value: 'test' }] })
      );
      loopStep.loopContext = { 
        parentLoopId: 'main_loop', 
        iteration: 2, 
        totalIterations: 5,
        metadata: { loopName: 'Main Loop', startTime: Date.now() }
      };
      history = addHistoryStep(history, loopStep);

      const nextStep = createHistoryStep(
        'next_step',
        createMockState('next_step', 'choice'),
        { id: 'ann-next', payload: {} },
        createMockContext('next_step', {})
      );
      history = addHistoryStep(history, nextStep);

      // Go back
      const backResult = goBackInHistory(history);
      expect(backResult).not.toBeNull();

      // Verify loop metadata is preserved
      const restoredStep = backResult!.steps[backResult!.currentIndex];
      expect(restoredStep.loopContext?.parentLoopId).toBe('main_loop');
      expect(restoredStep.loopContext?.iteration).toBe(2);
      expect(restoredStep.loopContext?.totalIterations).toBe(5);
      expect(restoredStep.loopContext?.metadata?.loopName).toBe('Main Loop');
    });
  });
});
