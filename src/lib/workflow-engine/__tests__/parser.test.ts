/**
 * Tests for Workflow Parser
 */

import { describe, it, expect } from 'vitest';
import { parseWorkflowDefinition } from '../parser';

describe('Workflow Parser', () => {
  describe('parseWorkflowDefinition', () => {
    it('should parse a valid YAML workflow definition', () => {
      const yaml = `
metadata:
  id: test_workflow
  version: 1.0.0
  name: Test Workflow

dataSources:
  options:
    type: static
    data:
      - Option A
      - Option B

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: First Step
      prompt: Choose an option
      options:
        source: options
      storeAs: data.choice
      transitions:
        - target: step2

    - id: step2
      type: final
      message: Done
`;

      const result = parseWorkflowDefinition(yaml);

      expect(result).toBeDefined();
      expect(result.metadata.id).toBe('test_workflow');
      expect(result.metadata.version).toBe('1.0.0');
      expect(result.workflow.entry).toBe('step1');
      expect(result.workflow.states).toHaveLength(2);
      expect(result.workflow.states[0].id).toBe('step1');
      expect(result.workflow.states[0].type).toBe('choice');
    });

    it('should throw error for invalid YAML', () => {
      const invalidYaml = 'this is not: valid: yaml:::::';

      expect(() => parseWorkflowDefinition(invalidYaml)).toThrow();
    });

    it('should parse workflow with data sources', () => {
      const yaml = `
metadata:
  id: test_workflow
  version: 1.0.0
  name: Test Workflow

dataSources:
  options:
    type: static
    data:
      - Option A
      - Option B

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Select Option
      prompt: Choose an option
      options:
        source: options
      storeAs: data.choice
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      const result = parseWorkflowDefinition(yaml);

      expect(result.dataSources).toBeDefined();
      expect(result.dataSources.options).toBeDefined();
      expect(result.dataSources.options.type).toBe('static');
      expect(result.dataSources.options.data).toHaveLength(2);
    });

    it('should parse workflow with loop state', () => {
      const yaml = `
metadata:
  id: test_workflow
  version: 1.0.0
  name: Test Workflow

dataSources:
  items:
    type: static
    data:
      - Item 1
      - Item 2

workflow:
  entry: loop1
  states:
    - id: loop1
      type: loop
      name: Loop State
      storeAs: items
      repeatWhile:
        type: yes_no
        question: Add another?
      steps:
        - id: step1
          type: choice
          name: Item Choice
          prompt: Choose item
          options:
            source: items
          storeAs: item.choice
        - id: step2
          type: area_select
          name: Select Area
          imageSource: /test.jpg
          toolType: rectangle
          allowMultiple: false
          storeAs: item.area
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      const result = parseWorkflowDefinition(yaml);

      expect(result.workflow.states[0].type).toBe('loop');
      expect(result.workflow.states[0].steps).toBeDefined();
      expect(result.workflow.states[0].steps).toHaveLength(2);
    });

    it('should parse conditional transitions', () => {
      const yaml = `
metadata:
  id: test_workflow
  version: 1.0.0
  name: Test Workflow

dataSources:
  options:
    type: static
    data:
      - A
      - B

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Choose
      prompt: Select option
      options:
        source: options
      storeAs: data.choice
      transitions:
        - target: step2
          when: data.choice == "A"
        - target: step3
          when: data.choice == "B"

    - id: step2
      type: final
      message: Path A

    - id: step3
      type: final
      message: Path B
`;

      const result = parseWorkflowDefinition(yaml);

      const state = result.workflow.states[0];
      expect(state.transitions).toHaveLength(2);
      expect(state.transitions[0].when).toBe('data.choice == "A"');
      expect(state.transitions[1].when).toBe('data.choice == "B"');
    });
  });
});
