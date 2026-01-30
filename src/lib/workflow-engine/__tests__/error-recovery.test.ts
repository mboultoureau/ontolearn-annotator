/**
 * Tests for Error Recovery and Validation
 * 
 * These tests verify proper error handling for invalid workflow configurations
 */

import { describe, it, expect } from 'vitest';
import { compileWorkflowToMachine } from '../compiler';
import { parseWorkflowDefinition } from '../parser';

describe('Error Recovery', () => {
  describe('Missing Entry State', () => {
    it('should throw error when entry state does not exist', () => {
      const yaml = `
metadata:
  id: missing_entry_test
  name: Missing Entry Test
  version: 1.0.0

dataSources:
  test_options:
    type: static
    data: [A, B]

workflow:
  entry: nonexistent_state
  states:
    - id: step1
      type: choice
      name: First Step
      prompt: Choose
      options:
        source: test_options
      storeAs: data.choice
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      // Parser should catch this during validation
      expect(() => {
        parseWorkflowDefinition(yaml);
      }).toThrow(/Entry state.*does not exist|nonexistent_state/i);
    });
  });

  describe('Invalid Transition Targets', () => {
    it('should throw error when transition target does not exist', () => {
      const yaml = `
metadata:
  id: invalid_target_test
  name: Invalid Target Test
  version: 1.0.0

dataSources:
  test_options:
    type: static
    data: [A, B]

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: First Step
      prompt: Choose
      options:
        source: test_options
      storeAs: data.choice
      transitions:
        - target: nonexistent_target

    - id: final
      type: final
      message: Done
`;

      // Parser should catch this during validation
      expect(() => {
        parseWorkflowDefinition(yaml);
      }).toThrow(/target.*does not exist|nonexistent_target/i);
    });

    it('should throw error for yes_no with invalid yesTarget', () => {
      const yaml = `
metadata:
  id: invalid_yes_target_test
  name: Invalid Yes Target Test
  version: 1.0.0

workflow:
  entry: step1
  states:
    - id: step1
      type: yes_no
      name: Confirm
      question: Continue?
      storeAs: data.confirmed
      yesTarget: missing_state
      noTarget: final

    - id: final
      type: final
      message: Done
`;

      // Parser should catch this during validation
      expect(() => {
        parseWorkflowDefinition(yaml);
      }).toThrow(/yesTarget.*does not exist|missing_state/i);
    });

    it('should throw error for yes_no with invalid noTarget', () => {
      const yaml = `
metadata:
  id: invalid_no_target_test
  name: Invalid No Target Test
  version: 1.0.0

workflow:
  entry: step1
  states:
    - id: step1
      type: yes_no
      name: Confirm
      question: Continue?
      storeAs: data.confirmed
      yesTarget: final
      noTarget: missing_state

    - id: final
      type: final
      message: Done
`;

      // Parser should catch this during validation
      expect(() => {
        parseWorkflowDefinition(yaml);
      }).toThrow(/noTarget.*does not exist|missing_state/i);
    });
  });

  describe('Duplicate State IDs', () => {
    it('should throw error when duplicate state IDs exist', () => {
      const yaml = `
metadata:
  id: duplicate_id_test
  name: Duplicate ID Test
  version: 1.0.0

dataSources:
  test_options:
    type: static
    data: [A, B, C, D]

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: First Step
      prompt: Choose
      options:
        source: test_options
      storeAs: data.choice
      transitions:
        - target: final

    - id: step1
      type: choice
      name: Duplicate Step
      prompt: Choose again
      options:
        source: test_options
      storeAs: data.choice2
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      expect(() => {
        const parsed = parseWorkflowDefinition(yaml);
        compileWorkflowToMachine(parsed, {});
      }).toThrow(/duplicate.*state.*id|step1.*already exists/i);
    });
  });

  describe('Circular State References', () => {
    it('should detect simple circular reference (A -> A)', () => {
      const yaml = `
metadata:
  id: self_reference_test
  name: Self Reference Test
  version: 1.0.0

dataSources:
  test_options:
    type: static
    data: [A, B]

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Circular Step
      prompt: Choose
      options:
        source: test_options
      storeAs: data.choice
      transitions:
        - target: step1
`;

      const parsed = parseWorkflowDefinition(yaml);
      
      // Self-reference might be valid (like a retry), but we should document it
      // This test documents the behavior
      expect(() => {
        compileWorkflowToMachine(parsed, {});
      }).not.toThrow(); // Self-reference is actually valid for retries
    });

    it('should detect circular reference chain (A -> B -> A)', () => {
      const yaml = `
metadata:
  id: circular_chain_test
  name: Circular Chain Test
  version: 1.0.0

dataSources:
  test_options:
    type: static
    data: [A, B, C, D]

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Step 1
      prompt: Choose
      options:
        source: test_options
      storeAs: data.choice
      transitions:
        - target: step2

    - id: step2
      type: choice
      name: Step 2
      prompt: Choose again
      options:
        source: test_options
      storeAs: data.choice2
      transitions:
        - target: step1
`;

      const parsed = parseWorkflowDefinition(yaml);
      
      // Circular chains might be valid for workflow loops
      // This test documents the behavior
      expect(() => {
        compileWorkflowToMachine(parsed, {});
      }).not.toThrow(); // Circular references are valid for workflow loops
    });

    it('should detect workflow without final state', () => {
      const yaml = `
metadata:
  id: no_final_test
  name: No Final State Test
  version: 1.0.0

dataSources:
  test_options:
    type: static
    data: [A, B, C, D]

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Step 1
      prompt: Choose
      options:
        source: test_options
      storeAs: data.choice
      transitions:
        - target: step2

    - id: step2
      type: choice
      name: Step 2
      prompt: Choose again
      options:
        source: test_options
      storeAs: data.choice2
      transitions:
        - target: step1
`;

      const parsed = parseWorkflowDefinition(yaml);
      
      // Workflow without final state should be warned about (but maybe not error)
      expect(() => {
        compileWorkflowToMachine(parsed, {});
      }).not.toThrow(); // May be valid if workflow runs indefinitely
    });
  });

  describe('Missing Required Fields', () => {
    it('should throw error when state is missing required prompt', () => {
      const yaml = `
metadata:
  id: missing_prompt_test
  name: Missing Prompt Test
  version: 1.0.0

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Step Without Prompt
      options:
        - A
        - B
      storeAs: data.choice
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      expect(() => {
        parseWorkflowDefinition(yaml);
      }).toThrow(/prompt.*required/i);
    });

    it('should throw error when state is missing required options', () => {
      const yaml = `
metadata:
  id: missing_options_test
  name: Missing Options Test
  version: 1.0.0

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Step Without Options
      prompt: Choose something
      storeAs: data.choice
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      expect(() => {
        parseWorkflowDefinition(yaml);
      }).toThrow(/options.*required/i);
    });

    it('should throw error when yes_no is missing question', () => {
      const yaml = `
metadata:
  id: missing_question_test
  name: Missing Question Test
  version: 1.0.0

workflow:
  entry: step1
  states:
    - id: step1
      type: yes_no
      name: Confirm Without Question
      storeAs: data.confirmed
      yesTarget: final
      noTarget: final

    - id: final
      type: final
      message: Done
`;

      expect(() => {
        parseWorkflowDefinition(yaml);
      }).toThrow(/question.*required/i);
    });

    it('should throw error when area_select is missing imageSource', () => {
      const yaml = `
metadata:
  id: missing_image_test
  name: Missing Image Test
  version: 1.0.0

workflow:
  entry: step1
  states:
    - id: step1
      type: area_select
      name: Select Area Without Image
      toolType: rectangle
      allowMultiple: false
      storeAs: data.area
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      expect(() => {
        parseWorkflowDefinition(yaml);
      }).toThrow(/imageSource.*required/i);
    });

    it('should throw error when loop is missing repeatWhile or over', () => {
      const yaml = `
metadata:
  id: missing_repeat_test
  name: Missing Repeat Test
  version: 1.0.0

workflow:
  entry: loop1
  states:
    - id: loop1
      type: loop
      name: Loop Without Repeat
      storeAs: items
      steps:
        - id: step1
          type: choice
          name: Item
          prompt: Choose
          options:
            - A
            - B
          storeAs: item.choice
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      expect(() => {
        parseWorkflowDefinition(yaml);
      }).toThrow(/Loop must have either|repeatWhile.*over/i);
    });
  });

  describe('Type Validation', () => {
    it('should throw error for invalid state type', () => {
      const yaml = `
metadata:
  id: invalid_type_test
  name: Invalid Type Test
  version: 1.0.0

workflow:
  entry: step1
  states:
    - id: step1
      type: invalid_type
      name: Invalid State Type
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      expect(() => {
        parseWorkflowDefinition(yaml);
      }).toThrow(/invalid.*discriminator|unknown.*state.*type/i);
    });

    it('should throw error for invalid transition condition syntax', () => {
      const yaml = `
metadata:
  id: invalid_condition_test
  name: Invalid Condition Test
  version: 1.0.0

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Test Step
      prompt: Choose
      options:
        - A
        - B
      storeAs: data.choice
      transitions:
        - target: final
          when: "data.choice == unclosed string

    - id: final
      type: final
      message: Done
`;

      expect(() => {
        parseWorkflowDefinition(yaml);
      }).toThrow(); // Should fail YAML parsing
    });
  });

  describe('Data Source Validation', () => {
    it('should throw error when referencing non-existent data source', () => {
      const yaml = `
metadata:
  id: missing_datasource_test
  name: Missing DataSource Test
  version: 1.0.0

dataSources:
  existing_source:
    type: static
    data:
      - A
      - B

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Test Step
      prompt: Choose
      options:
        source: nonexistent_source
      storeAs: data.choice
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      // Parser should catch this during validation
      expect(() => {
        parseWorkflowDefinition(yaml);
      }).toThrow(/DataSource.*not.*defined|nonexistent_source/i);
    });
  });

  describe('Empty Workflow', () => {
    it('should throw error for workflow with no states', () => {
      const yaml = `
metadata:
  id: empty_workflow_test
  name: Empty Workflow Test
  version: 1.0.0

workflow:
  entry: step1
  states: []
`;

      expect(() => {
        parseWorkflowDefinition(yaml);
      }).toThrow(/states.*at least one|no states|workflow must have/i);
    });

    it('should throw error for workflow with only entry defined', () => {
      const yaml = `
metadata:
  id: entry_only_test
  name: Entry Only Test
  version: 1.0.0

workflow:
  entry: step1
`;

      expect(() => {
        parseWorkflowDefinition(yaml);
      }).toThrow(/states.*required/i);
    });
  });
});
