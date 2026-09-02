# Workflow Engine

Generic workflow engine for building multi-step annotation workflows. Built on XState v5.

## 🎯 Overview

The Workflow Engine compiles YAML workflow definitions into executable XState state machines. It's fully generic - all behavior is derived from the workflow definition, not hardcoded.

**Key Features:**
- 📝 Declarative YAML workflow definitions
- 🔄 7+ state types (task, choice, yes/no, loops, etc.)
- 🛡️ Type-safe with Zod validation
- 🧪 Tests
- 🔌 Extensible via Strategy pattern
- 📊 Built-in history management
- 🌐 Dynamic data source loading

## 📁 Architecture

```
workflow-engine/
├── compiler.ts              # Main orchestrator
├── parser.ts                # YAML parsing & validation
├── schema.ts                # Zod schemas for validation
├── types.ts                 # TypeScript type definitions
├── history-manager.ts       # Step history & undo
├── data-source-loader.ts    # Dynamic data loading
├── compilers/               # Strategy pattern compilers
│   ├── StateCompiler.ts            # Base class for state compilation
│   ├── GuardCompiler.ts            # Compiles 'when' conditions
│   ├── ActionCompiler.ts           # Compiles 'storeAs' actions
│   ├── FinalStateCompiler.ts       # Final states
│   ├── TaskStateCompiler.ts        # Form/input states
│   ├── ChoiceStateCompiler.ts      # Multiple choice states
│   ├── YesNoStateCompiler.ts       # Binary choice states
│   ├── AreaSelectStateCompiler.ts  # Image region selection
│   ├── BranchStateCompiler.ts      # Conditional branching
│   └── LoopStateCompiler.ts        # Repeating sequences
├── utils/
│   └── DataPathNavigator.ts # Safe nested path operations
└── __tests__/               # Tests
```

## 🚀 Quick Start

### 1. Define a Workflow (YAML)

```yaml
metadata:
  id: water_crystal_annotation_v1
  version: 1.0.1
  name: Water Crystal Annotation
  description: Scientific workflow for annotating water crystals
  author: NII Research Team

dataSources:
  images:
    type: static
    data:
      - id: img1
        url: ${imageUrl}
        name: Water Crystal Sample

  crystal_classes:
    type: fetch
    endpoint: /api/projects/{slug}/classes?exclude=No crystal

  quality_levels:
    type: static
    data:
      - low
      - medium
      - high

workflow:
  entry: select_crystal_area

  states:
    # 1. Select area of interest on image
    - id: select_crystal_area
      type: area_select
      name: Select crystal area
      imageSource: ${dataSources.images.data[0].url}
      toolType: rectangle
      allowMultiple: false
      storeAs: crystal.area
      transitions:
        - target: select_crystal_class

    # 2. Choose crystal classification
    - id: select_crystal_class
      type: choice
      name: Crystal class
      prompt: Select crystal class
      options:
        source: crystal_classes
      storeAs: crystal.class
      transitions:
        - target: quality_assessment
          when: data.crystal.class != "Irregular"
        - target: ask_subsections

    # 3. Assess quality for regular crystals
    - id: quality_assessment
      type: choice
      name: Crystal quality
      prompt: Rate crystal quality
      options:
        source: quality_levels
      storeAs: crystal.quality
      transitions:
        - target: ask_more_crystals

    # 4. Handle irregular crystals with subsections
    - id: ask_subsections
      type: yes_no
      name: Sub-sections
      question: Do you want to annotate sub-sections?
      storeAs: crystal.hasSubsections
      yesTarget: subsection_loop
      noTarget: ask_more_crystals

    # 5. Loop through subsections
    - id: subsection_loop
      type: loop
      name: Sub-section annotation
      repeatWhile:
        question: Add another sub-section?
      steps:
        - id: select_area
          type: area_select
          name: Select sub-section
          toolType: rectangle
          imageSource: ${dataSources.images.data[0].url}
          storeAs: subsection.area
        - id: classify
          type: choice
          name: Classify sub-section
          options:
            source: crystal_classes
          storeAs: subsection.class
      storeAs: crystal.subsections
      transitions:
        - target: ask_more_crystals

    # 6. Continue or finish
    - id: ask_more_crystals
      type: yes_no
      name: More crystals
      question: Are there other crystals to annotate?
      yesTarget: select_crystal_area
      noTarget: final

    # 7. Complete
    - id: final
      type: final
      message: Annotation session completed
```

### 2. Use the Engine

```typescript
import { parseWorkflowDefinition, compileWorkflowToMachine } from '@/lib/workflow-engine';
import { createActor } from 'xstate';

// Parse YAML
const workflow = parseWorkflowDefinition(yamlContent);

// Compile to state machine
const { machine } = compileWorkflowToMachine(workflow);

// Create and start actor
const actor = createActor(machine);
actor.start();

// Send events to progress through workflow
actor.send({ 
  type: 'AREA_SELECTED', 
  data: { x: 100, y: 150, width: 200, height: 180 } 
});

actor.send({ 
  type: 'NEXT', 
  data: 'Hexagonal' 
});

actor.send({ 
  type: 'NEXT', 
  data: 'high' 
});

actor.send({ type: 'NO' }); // No more crystals

// Access collected data
console.log(actor.getSnapshot().context.data);
// → {
//   crystal: {
//     area: { x: 100, y: 150, width: 200, height: 180 },
//     class: 'Hexagonal',
//     quality: 'high'
//   },
//   workflow: { hasMoreCrystals: false }
// }
```

## 📦 State Types

### `task` - Form Input State

Collect multiple fields of data through a form.

**Supported field types:**
- `text` - Single-line text input
- `email` - Email address input
- `number` - Numeric input
- `textarea` - Multi-line text input

```yaml
- id: collect_info
  type: task
  name: Enter Information
  description: Please provide your details
  instructions: All fields marked with * are required
  fields:
    - id: name
      type: text
      label: Your Name
      placeholder: Enter your full name
      required: true
      storeAs: user.name
    
    - id: age
      type: number
      label: Your Age
      placeholder: Enter your age
      required: true
      storeAs: user.age
    
    - id: bio
      type: textarea
      label: Biography
      placeholder: Tell us about yourself
      required: false
      storeAs: user.bio
  
  transitions:
    - target: next_state
```

**Note:** Each field's value is stored individually using its `storeAs` path. The TaskStateCompiler automatically handles the data collection and nesting.

### `choice` - Multiple Choice

Present options from data sources or inline.

```yaml
- id: select_crystal_class
  type: choice
  name: Crystal class
  prompt: Select crystal class
  options:
    source: crystal_classes  # References dataSources
  storeAs: crystal.class
  transitions:
    - target: quality_check
      when: data.crystal.class != "Irregular"
    - target: subsection_flow
```

### `yes_no` - Binary Decision

Simple yes/no questions with optional storage.

```yaml
- id: ask_more_crystals
  type: yes_no
  name: More crystals
  question: Are there other crystals to annotate?
  storeAs: workflow.hasMoreCrystals
  yesTarget: select_crystal_area  # Loop back
  noTarget: final                 # Finish
```

### `area_select` - Image Region Selection

Select regions of interest on images.

```yaml
- id: select_crystal_area
  type: area_select
  name: Select crystal area
  imageSource: ${dataSources.images.data[0].url}
  toolType: rectangle
  allowMultiple: false
  storeAs: crystal.area
  transitions:
    - target: next_state
```

### `branch` - Conditional Routing

Route to different states based on context data. Branch states automatically evaluate guards and transition immediately without user interaction.

**Behavior:**
- Evaluates `when` conditions in order (top to bottom)
- Takes the first transition where the guard evaluates to `true`
- Falls through to the last transition if no guards match (default path)
- No UI interaction required - transitions automatically

```yaml
- id: route_by_class
  type: branch
  name: Route based on crystal type
  description: Determining next step based on crystal classification
  transitions:
    - target: quality_assessment
      when: data.crystal.class != "Singular Irregular" && data.crystal.class != "Multiple Irregulars"
    
    - target: subsection_flow
      when: data.crystal.class == "Singular Irregular" || data.crystal.class == "Multiple Irregulars"
    
    - target: default_path  # Fallback if no guards match
```

**UI Display:** Shows a brief routing message (🔀) for 500ms before auto-transitioning.

### `loop` - Repeating Sequences

Iterate over data or repeat until condition.

```yaml
- id: subsection_loop
  type: loop
  name: Sub-section annotation
  repeatWhile:
    type: yes_no
    question: Add another sub-section?
  steps:
    - id: select_subsection_area
      type: area_select
      name: Select sub-section area
      toolType: rectangle
      imageSource: ${dataSources.images.data[0].url}
      storeAs: subsection.area
    - id: select_subsection_classes
      type: multi_choice
      name: Sub-section classes
      options:
        source: sub_crystal_classes
      storeAs: subsection.classes
  storeAs: crystal.subsections
  transitions:
    - target: ask_more_crystals
```

### `final` - End State

Terminal state marking completion.

```yaml
- id: complete
  type: final
  name: Workflow Complete
```

## 🎨 Key Concepts

### Data Paths (`storeAs`)

Store state results at nested paths using dot notation:

```yaml
storeAs: crystal.subsections
```

Internally uses `DataPathNavigator` for safe, immutable operations.

**Example from water crystal workflow:**
```yaml
- storeAs: crystal.area        # Stores region coordinates
- storeAs: crystal.class       # Stores classification
- storeAs: crystal.quality     # Stores quality rating
- storeAs: subsection.classes  # Stores array of subsection types
```

### Guards (`when`)

Conditional transitions using context expressions:

```yaml
transitions:
  - target: quality_assessment
    when: data.crystal.class != "Singular Irregular" && data.crystal.class != "Multiple Irregulars"
  - target: subsection_flow
    when: data.crystal.class == "Singular Irregular" || data.crystal.class == "Multiple Irregulars"
```

Compiled by `GuardCompiler` into XState guard functions.

**Supported operators:**
- Comparisons: `==`, `!=`, `>`, `<`, `>=`, `<=`
- Logical: `&&`, `||`, `!`
- Property access: `data.crystal.class`, `context.data.score`

### Actions (`storeAs` + events)

Data storage triggered automatically on transitions:

```yaml
storeAs: user.response
```

Compiled by `ActionCompiler` into XState `assign()` actions.

### Data Sources

Load external data dynamically:

```yaml
dataSources:
  crystal_classes:
    type: fetch
    endpoint: /api/projects/{slug}/classes?exclude=No crystal
  
  quality_levels:
    type: static
    data:
      - low
      - medium
      - high
  
  categories:
    type: static
    data:
      - id: cat1        # Can use 'id' or 'value'
        label: Category A
      - id: cat2
        label: Category B
  
  images:
    type: static
    data:
      - id: img1
        url: ${imageUrl}
        name: Water Crystal Sample
```

Reference in states:
```yaml
options:
  source: crystal_classes  # Fetches from API

imageSource: ${dataSources.images.data[0].url}  # Static reference
```

**Data format options:**
- String array: `['option1', 'option2']`
- Object with `value`: `[{value: 'opt1', label: 'Option 1'}]`
- Object with `id`: `[{id: 'opt1', label: 'Option 1'}]` (auto-converted)

## 🏗️ Compiler Architecture

### Strategy Pattern

Each state type has a dedicated compiler:

```typescript
abstract class StateCompiler {
  abstract canHandle(state: WorkflowState): boolean;
  abstract compile(state: WorkflowState, context: CompilerContext): any;
}

class TaskStateCompiler extends StateCompiler {
  canHandle(state: WorkflowState) {
    return state.type === 'task';
  }
  
  compile(state, context) {
    // Task-specific compilation logic
  }
}
```

### Compilation Pipeline

```
YAML Definition
      ↓
  Parser (Zod validation)
      ↓
  Compiler
      ├── GuardCompiler → XState guards
      ├── ActionCompiler → XState actions
      └── StateCompilers → XState states
      ↓
  XState Machine
      ↓
  Actor (runtime)
```

### Adding New State Types

1. Create a new compiler in `compilers/`:

```typescript
export class CustomStateCompiler extends StateCompiler {
  canHandle(state: WorkflowState): boolean {
    return state.type === 'custom';
  }

  compile(state: WorkflowState, context: CompilerContext): any {
    return {
      meta: { ...state },
      on: {
        NEXT: { target: state.transitions?.[0]?.target }
      }
    };
  }
}
```

2. Register in `compiler.ts`:

```typescript
registry.register(new CustomStateCompiler());
```

3. Add type definition in `types.ts`:

```typescript
export interface CustomState extends BaseWorkflowState {
  type: 'custom';
  customField: string;
}

export type WorkflowState = 
  | TaskState 
  | ChoiceState 
  | CustomState // Add here
  | ...;
```

4. Update schema in `schema.ts`:

```typescript
const customStateSchema = baseStateSchema.extend({
  type: z.literal('custom'),
  customField: z.string(),
});
```

## 🧪 Testing

Run all tests:
```bash
npm test workflow-engine
```

Test coverage:
- ✅ 25 DataPathNavigator tests
- ✅ 18 error recovery tests
- ✅ 10 guard edge cases
- ✅ 10 loop edge cases
- ✅ 5 parser tests
- ✅ 5 compiler tests
- ✅ 9 history manager tests
- ✅ 5 data source loader tests

**Total: 87 tests passing**

## 📚 API Reference

### Parser

```typescript
// Parse with error throwing
const workflow = parseWorkflowDefinition(yamlString);

// Parse with error handling
const result = parseWorkflowDefinitionSafe(yamlString);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.errors);
}
```

### Compiler

```typescript
const { machine, metadata } = compileWorkflowToMachine(workflow, {
  strict: true,
  customGuards: {
    myGuard: (context, event) => context.data.value > 10
  }
});

console.log(metadata);
// {
//   workflowId: 'my-workflow',
//   version: '1.0.0',
//   stateCount: 5,
//   transitionCount: 8
// }
```

### History Manager

```typescript
import { 
  initializeHistory, 
  addHistoryStep, 
  goBackInHistory,
  getCurrentStep 
} from '@/lib/workflow-engine/history-manager';

let history = initializeHistory();

// Add steps
history = addHistoryStep(history, step);

// Navigate
history = goBackInHistory(history);
const currentStep = getCurrentStep(history);

// Check navigation state
console.log(history.canGoBack, history.canGoForward);
```

### Data Path Navigator

```typescript
import { DataPathNavigator } from '@/lib/workflow-engine/utils/DataPathNavigator';

const data = {};

// Set nested values
const updated = DataPathNavigator.setValue(data, 'user.profile.name', 'Alice');

// Get nested values
const name = DataPathNavigator.getValue(updated, 'user.profile.name');

// Ensure path exists
const prepared = DataPathNavigator.ensurePath({}, 'a.b.c.d');
// → { a: { b: { c: { d: null } } } }

// Set multiple values
const batch = DataPathNavigator.setValues(data, {
  'user.name': 'Bob',
  'user.age': 30
});
```

## 🔄 Refactoring History

The workflow engine underwent a major refactoring in January 2026:

**Before:**
- ❌ 893 lines of spaghetti code
- ❌ Path manipulation duplicated ~10 times
- ❌ Long if/else chains for state types
- ❌ Guard/action logic scattered

**After:**
- ✅ 233 lines in main compiler (-74%)
- ✅ Strategy pattern for extensibility
- ✅ Single source of truth (DataPathNavigator)
- ✅ Dedicated compilers (Guard, Action, 7 State types)
- ✅ All 87 tests still passing

See `REFACTORING.md` for detailed migration notes.

## 🤝 Contributing

When adding features:

1. **Add tests first** - We maintain 100% coverage on core logic
2. **Use DataPathNavigator** - Never manipulate paths manually
3. **Follow Strategy pattern** - Create new compilers for new state types
4. **Update schemas** - Keep Zod schemas in sync with types
5. **Document in YAML** - Add examples to workflow files

## 📄 License

Part of the Ontolearn Annotator project.
