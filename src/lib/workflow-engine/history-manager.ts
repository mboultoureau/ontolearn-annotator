/**
 * History Manager
 * 
 * Utilities for managing workflow step history
 */

import type { HistoryStep, WorkflowContext, WorkflowState, WorkflowHistory } from './types';

/**
 * Deep clone an object to prevent mutations
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Create a new history step from current state
 */
export function createHistoryStep(
  stateId: string,
  stateMeta: WorkflowState,
  annotation: { id: string; payload: any },
  context: WorkflowContext,
  previousStateId?: string
): HistoryStep {
  return {
    id: `history-${stateId}-${Date.now()}`,
    stateId,
    stateName: stateMeta.name || stateId,
    stateType: stateMeta.type,
    timestamp: new Date().toISOString(),
    contextSnapshot: {
      data: deepClone(context.data),
      dataSources: context.dataSources,
      currentState: stateId,
    },
    annotation,
    stateMeta: deepClone(stateMeta),
    previousStateId,
  };
}

/**
 * Initialize empty history
 */
export function initializeHistory(): WorkflowHistory {
  return {
    steps: [],
    currentIndex: -1, // -1 means no steps yet
    canGoBack: false,
    canGoForward: false,
  };
}

/**
 * Add a step to history
 */
export function addHistoryStep(
  history: WorkflowHistory,
  step: HistoryStep
): WorkflowHistory {
  // If we're not at the end, remove all forward steps
  const steps = history.currentIndex < history.steps.length - 1
    ? history.steps.slice(0, history.currentIndex + 1)
    : [...history.steps];

  // Add new step
  steps.push(step);

  const newIndex = steps.length - 1;
  
  const newHistory = {
    steps,
    currentIndex: newIndex,
    canGoBack: steps.length > 0, // Can go back if there's any completed step
    canGoForward: false, // Can't go forward after adding new step
  };
  
  console.log('[History] Added step, new state:', {
    stepsCount: steps.length,
    currentIndex: newIndex,
    canGoBack: newHistory.canGoBack,
    stepId: step.stateId
  });

  return newHistory;
}

/**
 * Go back one step
 */
export function goBackInHistory(
  history: WorkflowHistory
): WorkflowHistory | null {
  if (!history.canGoBack) {
    return null;
  }

  // Going back means loading the step at currentIndex
  // (the most recently completed step)
  // So we don't decrement currentIndex, we just return the history as-is
  // The consumer will use steps[currentIndex] to restore
  
  return {
    ...history,
    canGoBack: history.currentIndex > 0, // Can go back further if not at step 0
    canGoForward: false, // No forward after going back
  };
}

/**
 * Go forward one step (if user went back before)
 */
export function goForwardInHistory(
  history: WorkflowHistory
): WorkflowHistory | null {
  if (!history.canGoForward || history.currentIndex >= history.steps.length - 1) {
    return null;
  }

  const newIndex = history.currentIndex + 1;

  return {
    ...history,
    currentIndex: newIndex,
    canGoBack: true,
    canGoForward: newIndex < history.steps.length - 1,
  };
}

/**
 * Get the current (active) step
 */
export function getCurrentStep(history: WorkflowHistory): HistoryStep | null {
  if (history.currentIndex < 0 || history.currentIndex >= history.steps.length) {
    return null;
  }
  return history.steps[history.currentIndex];
}

/**
 * Get all completed (read-only) steps
 * Returns ALL steps in the history - they are all completed
 */
export function getCompletedSteps(history: WorkflowHistory): HistoryStep[] {
  return history.steps;
}

/**
 * Check if a specific step is the active one
 */
export function isActiveStep(history: WorkflowHistory, stepIndex: number): boolean {
  return stepIndex === history.currentIndex;
}

/**
 * Check if a specific step is completed (in the past)
 */
export function isCompletedStep(history: WorkflowHistory, stepIndex: number): boolean {
  return stepIndex < history.currentIndex;
}
