/**
 * Tests for Workflow Compiler
 * These tests verify that the compiler can parse and compile valid workflow definitions
 */

import { describe, it, expect } from 'vitest';
import { compileWorkflowToMachine } from '../compiler';
import { parseWorkflowDefinition } from '../parser';

describe('Workflow Compiler', () => {
  describe('Basic Compilation', () => {
    it('should compile a simple workflow with choice state', () => {
      const yaml = `
metadata:
  id: simple_workflow
  name: Simple Test
  version: 1.0.0

dataSources:
  testOptions:
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
        source: testOptions
      storeAs: data.choice
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      const parsed = parseWorkflowDefinition(yaml);
      const machine = compileWorkflowToMachine(parsed, {
        testOptions: ['Option A', 'Option B']
      });

      expect(machine).toBeDefined();
    });

    it('should compile workflow with conditional transitions', () => {
      const yaml = `
metadata:
  id: conditional_workflow
  name: Conditional Test
  version: 1.0.0

dataSources:
  paths:
    type: static
    data:
      - A
      - B

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Choose Path
      prompt: Select path
      options:
        source: paths
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

      const parsed = parseWorkflowDefinition(yaml);
      const machine = compileWorkflowToMachine(parsed, {
        paths: ['A', 'B']
      });

      expect(machine).toBeDefined();
    });

    it('should compile yes/no states', () => {
      const yaml = `
metadata:
  id: yesno_workflow
  name: YesNo Test
  version: 1.0.0

workflow:
  entry: step1
  states:
    - id: step1
      type: yes_no
      name: Continue?
      question: Do you want to continue?
      storeAs: data.continue
      yesTarget: step2
      noTarget: final

    - id: step2
      type: final
      message: Continuing

    - id: final
      type: final
      message: Done
`;

      const parsed = parseWorkflowDefinition(yaml);
      const machine = compileWorkflowToMachine(parsed, {});

      expect(machine).toBeDefined();
    });
  });

  describe('Loop Compilation', () => {
    it('should compile loop states', () => {
      const yaml = `
metadata:
  id: loop_workflow
  name: Loop Test
  version: 1.0.0

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
        question: Add another item?
      steps:
        - id: step1
          type: choice
          name: Item Choice
          prompt: Choose item
          options:
            source: items
          storeAs: item.choice
      transitions:
        - target: final

    - id: final
      type: final
      message: Done
`;

      const parsed = parseWorkflowDefinition(yaml);
      const machine = compileWorkflowToMachine(parsed, {
        items: ['Item 1', 'Item 2']
      });

      expect(machine).toBeDefined();
    });
  });

  describe('Guard Evaluation', () => {
    it('should compile guards with future state simulation', () => {
      const yaml = `
metadata:
  id: guard_test
  name: Guard Test
  version: 1.0.0

dataSources:
  classes:
    type: static
    data:
      - Singular Irregular
      - Regular

workflow:
  entry: step1
  states:
    - id: step1
      type: choice
      name: Select Class
      prompt: Choose class
      options:
        source: classes
      storeAs: crystal.class
      transitions:
        - target: step2
          when: data.crystal.class == "Singular Irregular"
        - target: step3
          when: data.crystal.class != "Singular Irregular"

    - id: step2
      type: final
      message: Irregular path

    - id: step3
      type: final
      message: Regular path
`;

      const parsed = parseWorkflowDefinition(yaml);
      const machine = compileWorkflowToMachine(parsed, {
        classes: ['Singular Irregular', 'Regular']
      });

      expect(machine).toBeDefined();
    });
  });
});
