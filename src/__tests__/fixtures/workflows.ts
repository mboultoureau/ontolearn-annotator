/**
 * Test Fixture Workflows
 * 
 * These YAML workflow definitions are used for testing.
 * They cover all critical functionality:
 * - Simple choices
 * - Conditional transitions
 * - Loops
 * - Data persistence (storeAs)
 * - Complex workflows
 */

export const simpleChoiceWorkflow = `
metadata:
  id: simple_choice_test
  version: 1.0.0
  name: Simple Choice Test

workflow:
  entry: select_option
  
  states:
    - id: select_option
      type: choice
      name: Select Option
      prompt: Choose an option
      options:
        values:
          - value: option_a
            label: Option A
          - value: option_b
            label: Option B
      storeAs: selection
      transitions:
        - target: final
    
    - id: final
      type: final
      message: Complete
`;

export const conditionalTransitionWorkflow = `
metadata:
  id: conditional_test
  version: 1.0.0
  name: Conditional Transition Test

dataSources:
  types:
    type: static
    data:
      - Irregular
      - Regular

workflow:
  entry: select_type
  
  states:
    - id: select_type
      type: choice
      name: Type Selection
      prompt: Select type
      options:
        source: types
      storeAs: crystal.type
      transitions:
        - target: extra_step
          when: data.crystal.type == "Irregular"
        - target: final
          when: data.crystal.type == "Regular"
    
    - id: extra_step
      type: yes_no
      question: Continue with subsections?
      storeAs: confirmed
      yesTarget: final
      noTarget: select_type
    
    - id: final
      type: final
      message: Complete
`;

export const yesNoWorkflow = `
metadata:
  id: yes_no_test
  version: 1.0.0
  name: Yes/No Test

workflow:
  entry: ask_question
  
  states:
    - id: ask_question
      type: yes_no
      question: Do you want to continue?
      storeAs: answer
      yesTarget: step_yes
      noTarget: step_no
    
    - id: step_yes
      type: final
      message: You said yes
    
    - id: step_no
      type: final
      message: You said no
`;

export const loopWorkflow = `
metadata:
  id: loop_test
  version: 1.0.0
  name: Loop Test

workflow:
  entry: item_loop
  
  states:
    - id: item_loop
      type: loop
      name: Add Items
      as: item
      repeatWhile:
        type: yes_no
        question: Add another item?
      steps:
        - id: enter_name
          type: choice
          name: Item Name
          prompt: Enter name
          options:
            values:
              - value: item1
                label: Item 1
              - value: item2
                label: Item 2
          storeAs: item.name
      storeAs: items
      transitions:
        - target: final
    
    - id: final
      type: final
      message: Complete
`;

export const crystalAnnotationWorkflow = `
metadata:
  id: water_crystal_annotation_v1
  version: 1.0.0
  name: Water Crystal Annotation
  description: Scientific workflow for annotating water crystals

dataSources:
  crystal_classes:
    type: static
    data:
      - Singular Irregular
      - Multiple Irregulars
      - Regular
      - Hexagon

workflow:
  entry: select_crystal_class
  
  states:
    - id: select_crystal_class
      type: choice
      name: Crystal class
      prompt: Select crystal class
      options:
        source: crystal_classes
      storeAs: crystal.class
      transitions:
        - target: ask_subsections
          when: data.crystal.class == "Singular Irregular" || data.crystal.class == "Multiple Irregulars"
        - target: quality_assessment
          when: data.crystal.class != "Singular Irregular" && data.crystal.class != "Multiple Irregulars"
    
    - id: ask_subsections
      type: yes_no
      question: Do you want to annotate sub-sections?
      storeAs: crystal.hasSubsections
      yesTarget: final
      noTarget: final
    
    - id: quality_assessment
      type: choice
      name: Quality Assessment
      prompt: Rate the quality
      options:
        values:
          - value: low
            label: Low
          - value: medium
            label: Medium
          - value: high
            label: High
      storeAs: crystal.quality
      transitions:
        - target: final
    
    - id: final
      type: final
      message: Annotation session completed
`;

export const multiChoiceWorkflow = `
metadata:
  id: multi_choice_test
  version: 1.0.0
  name: Multi Choice Test

workflow:
  entry: select_multiple
  
  states:
    - id: select_multiple
      type: multi_choice
      name: Select Multiple
      prompt: Choose multiple options
      options:
        values:
          - value: opt1
            label: Option 1
          - value: opt2
            label: Option 2
          - value: opt3
            label: Option 3
      storeAs: selections
      transitions:
        - target: final
    
    - id: final
      type: final
      message: Complete
`;

export const dataSourceWorkflow = `
metadata:
  id: datasource_test
  version: 1.0.0
  name: DataSource Test

dataSources:
  options:
    type: static
    data:
      - value: opt1
        label: Option 1
      - value: opt2
        label: Option 2

workflow:
  entry: use_datasource
  
  states:
    - id: use_datasource
      type: choice
      name: From DataSource
      prompt: Select from data source
      options:
        source: options
      storeAs: selected
      transitions:
        - target: final
    
    - id: final
      type: final
      message: Complete
`;

export const nestedStoreAsWorkflow = `
metadata:
  id: nested_storeas_test
  version: 1.0.0
  name: Nested StoreAs Test

workflow:
  entry: step1
  
  states:
    - id: step1
      type: choice
      name: Step 1
      prompt: Select value
      options:
        values:
          - value: a
            label: A
      storeAs: level1.level2.value
      transitions:
        - target: final
    
    - id: final
      type: final
      message: Complete
`;
