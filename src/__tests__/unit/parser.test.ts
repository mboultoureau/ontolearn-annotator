/**
 * Parser Tests
 * 
 * Tests for YAML parsing and schema validation.
 * Ensures the parser correctly converts YAML to TypeScript objects.
 */

import { describe, it, expect } from 'vitest';
import { parseWorkflowDefinition } from '@/lib/workflow-engine/parser';
import { validateWorkflow } from '@/lib/workflow-engine/schema';
import {
  simpleChoiceWorkflow,
  conditionalTransitionWorkflow,
  yesNoWorkflow,
  loopWorkflow,
  crystalAnnotationWorkflow,
} from '../fixtures/workflows';

describe('Parser', () => {
  describe('parseWorkflowDefinition', () => {
    it('should parse valid simple workflow YAML', () => {
      const result = parseWorkflowDefinition(simpleChoiceWorkflow);
      
      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.id).toBe('simple_choice_test');
      expect(result.workflow).toBeDefined();
      expect(result.workflow.entry).toBe('select_option');
      expect(result.workflow.states).toHaveLength(2);
    });

    it('should parse workflow with conditional transitions', () => {
      const result = parseWorkflowDefinition(conditionalTransitionWorkflow);
      
      expect(result.workflow.states).toHaveLength(3);
      const selectTypeState = result.workflow.states.find(s => s.id === 'select_type');
      expect(selectTypeState).toBeDefined();
      expect(selectTypeState?.transitions).toHaveLength(2);
      expect(selectTypeState?.transitions?.[0].when).toContain('Irregular');
    });

    it('should parse yes/no workflow', () => {
      const result = parseWorkflowDefinition(yesNoWorkflow);
      
      const yesNoState = result.workflow.states.find(s => s.id === 'ask_question');
      expect(yesNoState).toBeDefined();
      expect(yesNoState?.type).toBe('yes_no');
      expect((yesNoState as any).yesTarget).toBe('step_yes');
      expect((yesNoState as any).noTarget).toBe('step_no');
    });

    it('should parse loop workflow', () => {
      const result = parseWorkflowDefinition(loopWorkflow);
      
      const loopState = result.workflow.states.find(s => s.id === 'item_loop');
      expect(loopState).toBeDefined();
      expect(loopState?.type).toBe('loop');
      expect((loopState as any).steps).toBeDefined();
      expect((loopState as any).steps).toHaveLength(1);
      expect((loopState as any).repeatWhile).toBeDefined();
    });

    it('should parse complex crystal annotation workflow', () => {
      const result = parseWorkflowDefinition(crystalAnnotationWorkflow);
      
      expect(result.metadata.id).toBe('water_crystal_annotation_v1');
      expect(result.dataSources).toBeDefined();
      expect(result.dataSources?.crystal_classes).toBeDefined();
      expect(result.workflow.states).toHaveLength(4);
    });

    it('should handle invalid YAML gracefully', () => {
      const invalidYaml = `
        metadata:
          id: test
          [invalid syntax
      `;
      
      expect(() => parseWorkflowDefinition(invalidYaml)).toThrow();
    });

    it('should preserve data sources', () => {
      const result = parseWorkflowDefinition(conditionalTransitionWorkflow);
      
      expect(result.dataSources).toBeDefined();
      expect(result.dataSources?.types).toBeDefined();
      expect((result.dataSources?.types as any).type).toBe('static');
      expect((result.dataSources?.types as any).data).toContain('Irregular');
    });
  });
});

describe('Schema Validation', () => {
  describe('validateWorkflow', () => {
    it('should validate simple workflow', () => {
      const parsed = parseWorkflowDefinition(simpleChoiceWorkflow);
      const validation = validateWorkflow(parsed);
      
      expect(validation.valid).toBe(true);
      if (validation.valid && validation.data) {
        expect(validation.data.metadata.id).toBe('simple_choice_test');
      }
    });

    it('should validate conditional workflow', () => {
      const parsed = parseWorkflowDefinition(conditionalTransitionWorkflow);
      const validation = validateWorkflow(parsed);
      
      expect(validation.valid).toBe(true);
    });

    it('should validate yes/no workflow', () => {
      const parsed = parseWorkflowDefinition(yesNoWorkflow);
      const validation = validateWorkflow(parsed);
      
      expect(validation.valid).toBe(true);
    });

    it('should validate loop workflow', () => {
      const parsed = parseWorkflowDefinition(loopWorkflow);
      const validation = validateWorkflow(parsed);
      
      expect(validation.valid).toBe(true);
    });

    it('should validate crystal annotation workflow', () => {
      const parsed = parseWorkflowDefinition(crystalAnnotationWorkflow);
      const validation = validateWorkflow(parsed);
      
      expect(validation.valid).toBe(true);
    });

    it('should reject workflow without metadata', () => {
      const invalidWorkflow = {
        workflow: {
          entry: 'test',
          states: []
        }
      };
      
      const validation = validateWorkflow(invalidWorkflow);
      expect(validation.valid).toBe(false);
    });

    it('should reject workflow without entry state', () => {
      const invalidWorkflow = {
        metadata: {
          id: 'test',
          version: '1.0.0',
          name: 'Test'
        },
        workflow: {
          states: []
        }
      };
      
      const validation = validateWorkflow(invalidWorkflow);
      expect(validation.valid).toBe(false);
    });

    it('should reject workflow with invalid state type', () => {
      const invalidWorkflow = {
        metadata: {
          id: 'test',
          version: '1.0.0',
          name: 'Test'
        },
        workflow: {
          entry: 'test',
          states: [
            {
              id: 'test',
              type: 'invalid_type',
              name: 'Test'
            }
          ]
        }
      };
      
      const validation = validateWorkflow(invalidWorkflow);
      expect(validation.valid).toBe(false);
    });
  });
});
