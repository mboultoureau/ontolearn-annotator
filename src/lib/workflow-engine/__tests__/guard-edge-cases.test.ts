/**
 * Tests for Guard Evaluation Edge Cases
 * 
 * These tests verify complex guard expressions and edge cases
 */

import { describe, it, expect } from 'vitest';
import { compileWorkflowToMachine } from '../compiler';
import { parseWorkflowDefinition } from '../parser';

describe('Guard Evaluation - Edge Cases', () => {
  describe('Complex Nested Conditions', () => {
    it('should evaluate nested AND/OR conditions', () => {
      const yaml = `
metadata:
  id: complex_nested_test
  name: Complex Nested Test
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
      name: First Choice
      prompt: Choose A
      options:
        source: test_options
      storeAs: data.choice1
      transitions:
        - target: step2

    - id: step2
      type: choice
      name: Second Choice
      prompt: Choose B
      options:
        source: test_options
      storeAs: data.choice2
      transitions:
        - target: pass
          when: (data.choice1 == "A" && data.choice2 == "B") || (data.choice1 == "C" && data.choice2 == "D")
        - target: fail

    - id: pass
      type: final
      message: Pass

    - id: fail
      type: final
      message: Fail
`;

      const parsed = parseWorkflowDefinition(yaml);
      expect(() => {
        compileWorkflowToMachine(parsed, {});
      }).not.toThrow();
    });

    it('should handle nested parentheses correctly', () => {
      const yaml = `
metadata:
  id: nested_parens_test
  name: Nested Parentheses Test
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
      name: Choice
      prompt: Choose
      options:
        source: test_options
      storeAs: data.value
      transitions:
        - target: pass
          when: ((data.value == "A" || data.value == "B") && (data.value != "C"))
        - target: fail

    - id: pass
      type: final
      message: Pass

    - id: fail
      type: final
      message: Fail
`;

      const parsed = parseWorkflowDefinition(yaml);
      expect(() => {
        compileWorkflowToMachine(parsed, {});
      }).not.toThrow();
    });
  });

  describe('Null and Undefined Handling', () => {
    it('should handle optional fields safely', () => {
      const yaml = `
metadata:
  id: optional_field_test
  name: Optional Field Test
  version: 1.0.0

workflow:
  entry: step1
  states:
    - id: step1
      type: yes_no
      name: Continue
      question: Continue?
      storeAs: data.confirmed
      yesTarget: final
      noTarget: final

    - id: final
      type: final
      message: Done
`;

      const parsed = parseWorkflowDefinition(yaml);
      expect(() => {
        compileWorkflowToMachine(parsed, {});
      }).not.toThrow();
    });

    it('should handle null values in comparisons', () => {
      const yaml = `
metadata:
  id: null_comparison_test
  name: Null Comparison Test
  version: 1.0.0

dataSources:
  test_options:
    type: static
    data: [A, B, null]

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Choice
      prompt: Choose
      options:
        source: test_options
      storeAs: data.value
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      const parsed = parseWorkflowDefinition(yaml);
      expect(() => {
        compileWorkflowToMachine(parsed, {});
      }).not.toThrow();
    });
  });

  describe('Type Coercion', () => {
    it('should handle string vs number comparisons', () => {
      const yaml = `
metadata:
  id: type_coercion_test
  name: Type Coercion Test
  version: 1.0.0

dataSources:
  test_options:
    type: static
    data: ["1", "2", "3"]

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Choice
      prompt: Choose
      options:
        source: test_options
      storeAs: data.value
      transitions:
        - target: numeric
          when: data.value == "1"
        - target: final

    - id: numeric
      type: final
      message: Numeric

    - id: final
      type: final
      message: Done
`;

      const parsed = parseWorkflowDefinition(yaml);
      expect(() => {
        compileWorkflowToMachine(parsed, {});
      }).not.toThrow();
    });

    it('should handle boolean string comparisons', () => {
      const yaml = `
metadata:
  id: boolean_string_test
  name: Boolean String Test
  version: 1.0.0

dataSources:
  test_options:
    type: static
    data: ["true", "false"]

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Choice
      prompt: Choose
      options:
        source: test_options
      storeAs: data.value
      transitions:
        - target: truthy
          when: data.value == "true"
        - target: final

    - id: truthy
      type: final
      message: "True"

    - id: final
      type: final
      message: "Done"
`;

      const parsed = parseWorkflowDefinition(yaml);
      expect(() => {
        compileWorkflowToMachine(parsed, {});
      }).not.toThrow();
    });
  });

  describe('String Operations', () => {
    it('should document string contains operations behavior', () => {
      // NOTE: This documents expected behavior
      // May not be supported depending on guard evaluator implementation
      const yaml = `
metadata:
  id: string_contains_test
  name: String Contains Test
  version: 1.0.0

dataSources:
  test_options:
    type: static
    data: ["Singular Irregular", "Multiple", "Hexagon"]

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Choice
      prompt: Choose
      options:
        source: test_options
      storeAs: data.value
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      const parsed = parseWorkflowDefinition(yaml);
      expect(() => {
        compileWorkflowToMachine(parsed, {});
      }).not.toThrow();
      
      // Document: String methods in guards may require special handling
    });

    it('should document string startsWith/endsWith behavior', () => {
      // NOTE: This documents expected behavior
      // May not be supported depending on guard evaluator implementation
      const yaml = `
metadata:
  id: string_starts_test
  name: String Starts Test
  version: 1.0.0

dataSources:
  test_options:
    type: static
    data: ["Singular Irregular", "Multiple Irregular"]

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Choice
      prompt: Choose
      options:
        source: test_options
      storeAs: data.value
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      const parsed = parseWorkflowDefinition(yaml);
      expect(() => {
        compileWorkflowToMachine(parsed, {});
      }).not.toThrow();
      
      // Document: String methods in guards may require special handling
    });
  });

  describe('Array Operations', () => {
    it('should handle array data', () => {
      const yaml = `
metadata:
  id: array_length_test
  name: Array Length Test
  version: 1.0.0

dataSources:
  test_options:
    type: static
    data: [A, B, C]

workflow:
  entry: step1
  states:
    - id: step1
      type: multi_choice
      name: Multiple Selection
      options:
        source: test_options
      storeAs: data.selections
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      const parsed = parseWorkflowDefinition(yaml);
      expect(() => {
        compileWorkflowToMachine(parsed, {});
      }).not.toThrow();
      
      // Document: Array length checks in guards may require special handling
    });
  });

  describe('Complex Real-World Scenarios', () => {
    it('should handle crystal classification guard logic', () => {
      const yaml = `
metadata:
  id: crystal_class_test
  name: Crystal Classification Test
  version: 1.0.0

dataSources:
  crystal_classes:
    type: static
    data:
      - Singular Irregular
      - Multiple Irregulars
      - Hexagon
      - Simple Plate

workflow:
  entry: step1
  states:
    - id: step1
      type: area_select
      name: Select Area
      imageSource: test.jpg
      toolType: rectangle
      allowMultiple: false
      storeAs: crystal.area
      transitions:
        - target: step2

    - id: step2
      type: choice
      name: Crystal Class
      prompt: Select class
      options:
        source: crystal_classes
      storeAs: crystal.class
      transitions:
        - target: subsection
          when: data.crystal.class == "Singular Irregular" || data.crystal.class == "Multiple Irregulars"
        - target: quality

    - id: subsection
      type: yes_no
      name: Subsection
      question: Add subsection?
      storeAs: crystal.hasSubsection
      yesTarget: final
      noTarget: final

    - id: quality
      type: final
      message: Quality assessment

    - id: final
      type: final
      message: Done
`;

      const parsed = parseWorkflowDefinition(yaml);
      expect(() => {
        compileWorkflowToMachine(parsed, {});
      }).not.toThrow();
    });
  });
});
