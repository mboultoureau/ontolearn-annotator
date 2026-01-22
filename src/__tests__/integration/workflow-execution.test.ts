/**
 * Integration Tests - Workflow Execution
 * 
 * End-to-end tests that execute complete workflows using XState.
 * These tests validate that the entire system works together correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createActor } from 'xstate';
import { parseWorkflowDefinition } from '@/lib/workflow-engine/parser';
import { compileWorkflowToMachine } from '@/lib/workflow-engine/compiler';
import {
  simpleChoiceWorkflow,
  conditionalTransitionWorkflow,
  yesNoWorkflow,
  crystalAnnotationWorkflow,
} from '../fixtures/workflows';

describe('Workflow Execution Integration', () => {
  describe('Simple Choice Workflow', () => {
    it('should execute complete simple workflow', () => {
      const parsed = parseWorkflowDefinition(simpleChoiceWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      // Initial state
      expect(actor.getSnapshot().value).toBe('select_option');
      
      // Send choice selection
      actor.send({ type: 'NEXT', data: 'option_a' });
      
      // Should transition to final
      expect(actor.getSnapshot().value).toBe('final');
      
      // Data should be stored
      expect(actor.getSnapshot().context.data.selection).toBe('option_a');
    });

    it('should store selected value in context', () => {
      const parsed = parseWorkflowDefinition(simpleChoiceWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      actor.send({ type: 'NEXT', data: 'option_b' });
      
      const context = actor.getSnapshot().context;
      expect(context.data.selection).toBe('option_b');
    });
  });

  describe('Conditional Transitions', () => {
    it('should follow irregular path when condition matches', () => {
      const parsed = parseWorkflowDefinition(conditionalTransitionWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      expect(actor.getSnapshot().value).toBe('select_type');
      
      // Select "Irregular" - should go to extra_step
      actor.send({ type: 'NEXT', data: 'Irregular' });
      
      expect(actor.getSnapshot().value).toBe('extra_step');
      expect(actor.getSnapshot().context.data.crystal.type).toBe('Irregular');
    });

    it('should follow regular path when condition matches', () => {
      const parsed = parseWorkflowDefinition(conditionalTransitionWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      // Select "Regular" - should go directly to final
      actor.send({ type: 'NEXT', data: 'Regular' });
      
      expect(actor.getSnapshot().value).toBe('final');
      expect(actor.getSnapshot().context.data.crystal.type).toBe('Regular');
    });

    it('should handle yes in extra step', () => {
      const parsed = parseWorkflowDefinition(conditionalTransitionWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      // Select Irregular
      actor.send({ type: 'NEXT', data: 'Irregular' });
      expect(actor.getSnapshot().value).toBe('extra_step');
      
      // Answer yes
      actor.send({ type: 'YES', data: true });
      expect(actor.getSnapshot().value).toBe('final');
      expect(actor.getSnapshot().context.data.confirmed).toBe(true);
    });

    it('should handle no in extra step and loop back', () => {
      const parsed = parseWorkflowDefinition(conditionalTransitionWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      // Select Irregular
      actor.send({ type: 'NEXT', data: 'Irregular' });
      expect(actor.getSnapshot().value).toBe('extra_step');
      
      // Answer no - should loop back to select_type
      actor.send({ type: 'NO', data: false });
      expect(actor.getSnapshot().value).toBe('select_type');
    });
  });

  describe('Yes/No Workflow', () => {
    it('should follow yes path', () => {
      const parsed = parseWorkflowDefinition(yesNoWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      expect(actor.getSnapshot().value).toBe('ask_question');
      
      actor.send({ type: 'YES', data: true });
      
      expect(actor.getSnapshot().value).toBe('step_yes');
      expect(actor.getSnapshot().context.data.answer).toBe(true);
    });

    it('should follow no path', () => {
      const parsed = parseWorkflowDefinition(yesNoWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      actor.send({ type: 'NO', data: false });
      
      expect(actor.getSnapshot().value).toBe('step_no');
      expect(actor.getSnapshot().context.data.answer).toBe(false);
    });
  });

  describe('Crystal Annotation Workflow', () => {
    it('should complete irregular crystal path', () => {
      const parsed = parseWorkflowDefinition(crystalAnnotationWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      // Start at crystal class selection
      expect(actor.getSnapshot().value).toBe('select_crystal_class');
      
      // Select Singular Irregular
      actor.send({ type: 'NEXT', data: 'Singular Irregular' });
      
      // Should route to ask_subsections
      expect(actor.getSnapshot().value).toBe('ask_subsections');
      expect(actor.getSnapshot().context.data.crystal.class).toBe('Singular Irregular');
      
      // Answer yes
      actor.send({ type: 'YES', data: true });
      
      // Should complete
      expect(actor.getSnapshot().value).toBe('final');
    });

    it('should complete regular crystal path', () => {
      const parsed = parseWorkflowDefinition(crystalAnnotationWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      // Select Regular
      actor.send({ type: 'NEXT', data: 'Regular' });
      
      // Should route to quality_assessment
      expect(actor.getSnapshot().value).toBe('quality_assessment');
      expect(actor.getSnapshot().context.data.crystal.class).toBe('Regular');
      
      // Select quality
      actor.send({ type: 'NEXT', data: 'high' });
      
      // Should complete
      expect(actor.getSnapshot().value).toBe('final');
      expect(actor.getSnapshot().context.data.crystal.quality).toBe('high');
    });

    it('should handle Multiple Irregulars path', () => {
      const parsed = parseWorkflowDefinition(crystalAnnotationWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      // Select Multiple Irregulars
      actor.send({ type: 'NEXT', data: 'Multiple Irregulars' });
      
      // Should route to ask_subsections (same as Singular Irregular)
      expect(actor.getSnapshot().value).toBe('ask_subsections');
      expect(actor.getSnapshot().context.data.crystal.class).toBe('Multiple Irregulars');
    });

    it('should preserve all collected data', () => {
      const parsed = parseWorkflowDefinition(crystalAnnotationWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      // Complete workflow
      actor.send({ type: 'NEXT', data: 'Regular' });
      actor.send({ type: 'NEXT', data: 'medium' });
      
      const finalContext = actor.getSnapshot().context;
      expect(finalContext.data.crystal.class).toBe('Regular');
      expect(finalContext.data.crystal.quality).toBe('medium');
    });
  });

  describe('Data Persistence', () => {
    it('should store data at correct nested path', () => {
      const parsed = parseWorkflowDefinition(crystalAnnotationWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      actor.send({ type: 'NEXT', data: 'Hexagon' });
      
      const context = actor.getSnapshot().context;
      expect(context.data.crystal).toBeDefined();
      expect(context.data.crystal.class).toBe('Hexagon');
    });

    it('should preserve data from previous steps', () => {
      const parsed = parseWorkflowDefinition(conditionalTransitionWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      actor.send({ type: 'NEXT', data: 'Irregular' });
      const afterFirst = actor.getSnapshot().context.data;
      
      actor.send({ type: 'YES', data: true });
      const afterSecond = actor.getSnapshot().context.data;
      
      // Previous data should still be there
      expect(afterSecond.crystal.type).toBe('Irregular');
      expect(afterSecond.confirmed).toBe(true);
    });

    it('should not lose data on state transitions', () => {
      const parsed = parseWorkflowDefinition(crystalAnnotationWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      // Step 1
      actor.send({ type: 'NEXT', data: 'Regular' });
      expect(actor.getSnapshot().context.data.crystal.class).toBe('Regular');
      
      // Step 2
      actor.send({ type: 'NEXT', data: 'high' });
      
      // Both values should be present
      const finalData = actor.getSnapshot().context.data;
      expect(finalData.crystal.class).toBe('Regular');
      expect(finalData.crystal.quality).toBe('high');
    });
  });

  describe('DataSource Integration', () => {
    it('should make data sources available in context', () => {
      const parsed = parseWorkflowDefinition(crystalAnnotationWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      const context = actor.getSnapshot().context;
      expect(context.dataSources).toBeDefined();
      expect(context.dataSources.crystal_classes).toBeDefined();
    });

    it('should allow states to reference data sources', () => {
      const parsed = parseWorkflowDefinition(crystalAnnotationWorkflow);
      const compiled = compileWorkflowToMachine(parsed);
      const machine = compiled.machine;
      
      const actor = createActor(machine);
      actor.start();
      
      // The choice state should reference crystal_classes data source
      const currentState = actor.getSnapshot().getMeta();
      const stateConfig = Object.values(currentState)[0] as any;
      
      expect(stateConfig.options?.source).toBe('crystal_classes');
    });
  });
});
