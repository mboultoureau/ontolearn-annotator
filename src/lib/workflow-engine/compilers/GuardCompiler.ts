/**
 * GuardCompiler - Compiles workflow guards from 'when' conditions
 * 
 * Guards are functions that evaluate whether a transition should be taken.
 * This class handles the compilation of 'when' expressions into XState guard functions.
 */

import type { WorkflowDefinition, WorkflowState, WorkflowContext } from '../types';
import { DataPathNavigator } from '../utils/DataPathNavigator';
import { StateTraversal } from '../utils/StateTraversal';

/**
 * Deep merge helper for combining context data
 */
function mergeDeep(target: any, source: any): any {
  if (!source || typeof source !== 'object') return target;
  if (!target || typeof target !== 'object') return source;
  
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = mergeDeep(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * GuardCompiler - Compiles 'when' conditions into XState guards
 */
export class GuardCompiler {
  /**
   * Compiles all guards from workflow transitions
   * 
   * @param workflow - Workflow definition
   * @param customGuards - Optional custom guard implementations
   * @returns Record of guard functions keyed by name
   */
  compile(
    workflow: WorkflowDefinition,
    customGuards: Record<string, (context: WorkflowContext, event: any) => boolean> = {}
  ): Record<string, any> {
    const guards: Record<string, any> = { ...customGuards };

    // Loop steps are compiled with the same `compileTransitions`, so they emit
    // `guard_<stepId>_<i>` references. Unregistered, XState errors the actor out on the
    // first guarded event instead of taking the transition.
    for (const state of StateTraversal.allStates(workflow)) {
      if (!state.transitions) continue;

      for (let i = 0; i < state.transitions.length; i++) {
        const transition = state.transitions[i];
        
        if (transition.when) {
          const guardName = `guard_${state.id}_${i}`;
          guards[guardName] = this.compileGuard(state, transition.when);
        }
      }
    }

    return guards;
  }

  /**
   * Compiles a single guard from a 'when' expression
   * 
   * @param state - State containing the transition
   * @param whenExpression - The 'when' condition expression
   * @returns Guard function
   */
  private compileGuard(
    state: WorkflowState,
    whenExpression: string
  ): (params: { context: WorkflowContext; event: any }) => boolean {
    return ({ context, event }: { context: WorkflowContext; event: any }) => {
      // Simulate future context state for accurate guard evaluation
      const futureContext = this.simulateFutureContext(context, event, state);
      return this.evaluateExpression(whenExpression, futureContext);
    };
  }

  /**
   * Simulates what the context will look like after the store action runs
   * This is necessary because guards are evaluated before actions execute
   * 
   * @param context - Current context
   * @param event - Triggering event
   * @param state - Current state
   * @returns Simulated future context
   */
  private simulateFutureContext(
    context: WorkflowContext,
    event: any,
    state: WorkflowState
  ): WorkflowContext {
    const storeAs = (state as any).storeAs;
    let mergedData = { ...(context.data || {}) };
    
    if (storeAs && event.data !== undefined) {
      // Use DataPathNavigator for consistent path handling
      mergedData = DataPathNavigator.setValue(mergedData, storeAs, event.data);
    } else if (event.data && typeof event.data === 'object') {
      // Merge event data if no explicit storeAs
      mergedData = mergeDeep(mergedData, event.data);
    }
    
    return {
      ...context,
      data: mergedData,
    };
  }

  /**
   * Evaluates a 'when' expression against context
   * 
   * Supports basic expression syntax:
   * - Property access: context.data.field, data.field
   * - Comparisons: ==, !=, >, <, >=, <=
   * - Logical operators: &&, ||
   * 
   * @param expression - The 'when' expression string
   * @param context - Current workflow context
   * @returns Boolean result of evaluation
   */
  private evaluateExpression(expression: string, context: WorkflowContext): boolean {
    try {
      // Replace 'context.' with 'ctx.' for safe evaluation
      const safeExpression = expression.replace(/context\./g, 'ctx.');
      
      // Create evaluation function with context binding
      // Make 'data', 'dataSources', and other context properties available
      const evaluator = new Function('ctx', `
        'use strict';
        try {
          const data = ctx.data || {};
          const dataSources = ctx.dataSources || {};
          const loopContext = ctx.loopContext;
          return Boolean(${safeExpression});
        } catch (e) {
          console.error('[GuardCompiler.evaluateExpression] Error:', e);
          return false;
        }
      `);

      return evaluator(context);
    } catch (error) {
      console.error('[GuardCompiler.evaluateExpression] Failed to evaluate:', expression, error);
      return false;
    }
  }
}

/**
 * TODO: Future improvement - Replace Function() with safe expression parser
 * 
 * For better security and error handling, consider using a dedicated
 * expression parsing library like:
 * - jsep (JavaScript Expression Parser)
 * - mathjs (Math expression evaluator)
 * - expr-eval (Expression evaluator)
 * 
 * Example with jsep:
 * ```typescript
 * import { parse } from 'jsep';
 * 
 * class SafeExpressionEvaluator {
 *   evaluate(expression: string, context: any): boolean {
 *     const ast = parse(expression);
 *     return this.evaluateNode(ast, context);
 *   }
 *   
 *   private evaluateNode(node: any, context: any): any {
 *     switch (node.type) {
 *       case 'BinaryExpression':
 *         return this.evaluateBinary(node, context);
 *       case 'MemberExpression':
 *         return this.evaluateMember(node, context);
 *       // ... handle other node types safely
 *     }
 *   }
 * }
 * ```
 */
