import { describe, it, expect } from 'vitest';
import { parseWorkflowDefinition } from '@/lib/workflow-engine/parser';
import { compileWorkflowToMachine } from '@/lib/workflow-engine/compiler';
import {
  simpleChoiceWorkflow,
  conditionalTransitionWorkflow,
} from '../fixtures/workflows';

describe('Compiler - XState v5 Fixed Tests', () => {
  
  describe('Structure Verification', () => {
    it('should compile simple choice workflow with correct config', () => {
      const parsed = parseWorkflowDefinition(simpleChoiceWorkflow);
      const { machine } = compileWorkflowToMachine(parsed);
      
      // In XState v5, the raw config is stored in .config
      expect(machine.config.initial).toBe('select_option');
      expect(machine.config.states?.select_option).toBeDefined();
    });

    it('should include data sources and metadata in initial context', () => {
      const parsed = parseWorkflowDefinition(conditionalTransitionWorkflow);
      const { machine } = compileWorkflowToMachine(parsed);
      
      // Initial context is located in .config.context in v5
      const context = machine.config.context;
      
      expect(context).toBeDefined();
      expect(context.dataSources).toBeDefined();
      expect(context.metadata.id).toBe('conditional_test');
    });
  });

  describe('Implementation Registration', () => {
    it('should register guard functions', () => {
      const parsed = parseWorkflowDefinition(conditionalTransitionWorkflow);
      const { machine } = compileWorkflowToMachine(parsed);
      
      // Guards and Actions are in .implementations in v5
      const guards = machine.implementations.guards;
      expect(Object.keys(guards).length).toBeGreaterThan(0);
      
      // Verify they are functions
      const firstGuardKey = Object.keys(guards)[0];
      expect(typeof guards[firstGuardKey]).toBe('function');
    });

    it('should register store actions', () => {
      const parsed = parseWorkflowDefinition(simpleChoiceWorkflow);
      const { machine } = compileWorkflowToMachine(parsed);
      
      const actions = machine.implementations.actions;
      const storeActionKey = Object.keys(actions).find(k => k.startsWith('store_'));
      
      expect(storeActionKey).toBeDefined();
      // XState v5 actions are typically objects/functions depending on how setup() is used
      expect(actions[storeActionKey!]).toBeDefined();
    });
  });

  describe('State Metadata', () => {
    it('should preserve workflow metadata in state nodes', () => {
      const parsed = parseWorkflowDefinition(simpleChoiceWorkflow);
      const { machine } = compileWorkflowToMachine(parsed);
      
      const selectOptionState = machine.config.states.select_option;
      expect(selectOptionState.meta.type).toBe('choice');
      expect(selectOptionState.meta.prompt).toBe('Choose an option');
    });
  });
});