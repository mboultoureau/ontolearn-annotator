/**
 * Workflow Engine Type Definitions
 * 
 * This file defines the complete TypeScript type system for the Workflow DSL.
 * The workflow DSL allows declarative definition of annotation workflows with:
 * - Conditional branching
 * - Loops and repetition
 * - Nested sub-workflows
 * - Dynamic data sources
 * - State persistence
 * 
 * Architecture:
 * 1. YAML → WorkflowDefinition (parsed and validated)
 * 2. WorkflowDefinition → XState Machine (compiled)
 * 3. XState Machine → React UI (rendered)
 */

// =============================================================================
// METADATA
// =============================================================================

export interface WorkflowMetadata {
  /** Unique identifier for the workflow */
  id: string;
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  /** Human-readable workflow name */
  name: string;
  /** Optional description for documentation */
  description?: string;
  /** Workflow author(s) */
  author?: string;
  /** Creation date */
  createdAt?: string;
  /** Last modified date */
  updatedAt?: string;
}

// =============================================================================
// DATA SOURCES
// =============================================================================

/**
 * Static data source - embedded data in the workflow definition
 */
export interface StaticDataSource {
  type: 'static';
  /** Static data values (any JSON-serializable data) */
  data: unknown;
}

/**
 * Fetch-based data source - dynamically loaded from an API endpoint
 */
export interface FetchDataSource {
  type: 'fetch';
  /** API endpoint URL */
  endpoint: string;
  /** HTTP method (default: GET) */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body (for POST/PUT) */
  body?: unknown;
  /** Query parameters (can reference context using ${context.path}) */
  params?: Record<string, string>;
  /** JSONPath or dot-notation path to extract data from response */
  responsePath?: string;
}

export type DataSource = StaticDataSource | FetchDataSource;

// =============================================================================
// FIELD DEFINITIONS (for annotation forms)
// =============================================================================

/**
 * Base field properties shared by all field types
 */
export interface BaseFieldDefinition {
  /** Unique field identifier */
  id: string;
  /** Display label (can be translation key) */
  label: string;
  /** Whether label is a translation key */
  isTranslatable?: boolean;
  /** Whether field is required */
  required?: boolean;
  /** Default value */
  defaultValue?: unknown;
  /** Path in context where value should be stored (e.g., "crystal.area") */
  storeAs?: string;
}

/**
 * Text input field
 */
export interface TextFieldDefinition extends BaseFieldDefinition {
  type: 'text' | 'textarea' | 'email' | 'number';
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

/**
 * Select/dropdown field
 */
export interface SelectFieldOption {
  value: string;
  label: string;
  /** Nested options for hierarchical selects */
  children?: SelectFieldOption[];
}

export interface SelectFieldDefinition extends BaseFieldDefinition {
  type: 'select';
  /** Available options */
  options: SelectFieldOption[];
  /** Data source reference (alternative to static options) */
  dataSource?: string;
  /** Allow multiple selections */
  multiple?: boolean;
  /** Use parent as optgroup (children cannot be selected) */
  useParentAsGroup?: boolean;
  placeholder?: string;
}

/**
 * Slider field (for numeric ranges)
 */
export interface SliderFieldDefinition extends BaseFieldDefinition {
  type: 'slider';
  min: number;
  max: number;
  step?: number;
  /** Optional labels for discrete steps */
  stepLabels?: string[];
}

/**
 * Yes/No boolean field
 */
export interface YesNoFieldDefinition extends BaseFieldDefinition {
  type: 'yes_no';
  yesLabel?: string;
  noLabel?: string;
}

/**
 * Area selection field (polygon/rectangle drawing on image)
 */
export interface AreaSelectFieldDefinition extends BaseFieldDefinition {
  type: 'area_select';
  /** Image source (URL or context reference) */
  imageSource: string;
  /** Drawing tool type */
  toolType?: 'rectangle' | 'polygon' | 'both';
  /** Enable multiple area selection */
  allowMultiple?: boolean;
}

/**
 * Union type for all field definitions
 */
export type FieldDefinition =
  | TextFieldDefinition
  | SelectFieldDefinition
  | SliderFieldDefinition
  | YesNoFieldDefinition
  | AreaSelectFieldDefinition;

// =============================================================================
// TRANSITIONS & CONDITIONS
// =============================================================================

/**
 * Condition expression for conditional transitions
 * Supports:
 * - Equality: context.value == "expected"
 * - Comparison: context.number > 5
 * - Logical: context.a == 1 && context.b == 2
 */
export interface TransitionCondition {
  /** JavaScript-like expression evaluated against context */
  when?: string;
  /** Human-readable description of the condition */
  description?: string;
}

/**
 * Transition to next state
 */
export interface Transition extends TransitionCondition {
  /** Target state ID */
  target: string;
  /** Optional transition label */
  label?: string;
}

// =============================================================================
// STATE DEFINITIONS
// =============================================================================

/**
 * Base properties for all state types
 */
export interface BaseState {
  /** Unique state identifier */
  id: string;
  /** Human-readable state name */
  name?: string;
  /** Optional description */
  description?: string;
  /** Transitions to other states */
  transitions?: Transition[];
}

/**
 * Task state - displays fields for user input
 */
export interface TaskState extends BaseState {
  type: 'task';
  /** Fields to display in this task */
  fields: FieldDefinition[];
  /** Instructions or help text */
  instructions?: string;
}

/**
 * Choice state - branching based on conditions
 * No user input, automatically evaluates conditions and transitions
 */
export interface ChoiceState extends BaseState {
  type: 'choice';
  /** List of conditional transitions (first matching wins) */
  transitions: Transition[];
  /** Optional default transition if no condition matches */
  default?: string;
}

/**
 * Multi-choice state - user selects one option from multiple choices
 */
export interface MultiChoiceState extends BaseState {
  type: 'multi_choice';
  /** Question or prompt to display */
  question: string;
  /** Available choices */
  choices: Array<{
    value: string;
    label: string;
    target: string;
  }>;
  /** Path to store selected value */
  storeAs?: string;
}

/**
 * Yes/No state - binary choice
 */
export interface YesNoState extends BaseState {
  type: 'yes_no';
  /** Question to ask */
  question: string;
  /** Label for "yes" option */
  yesLabel?: string;
  /** Label for "no" option */
  noLabel?: string;
  /** Target state for "yes" */
  yesTarget: string;
  /** Target state for "no" */
  noTarget: string;
  /** Path to store boolean result */
  storeAs?: string;
}

/**
 * Area selection state - image annotation step
 */
export interface AreaSelectState extends BaseState {
  type: 'area_select';
  /** Image source (URL or data source reference) */
  imageSource: string;
  /** Drawing tool configuration */
  toolType?: 'rectangle' | 'polygon' | 'both';
  /** Allow multiple areas */
  allowMultiple?: boolean;
  /** Fields to display after area selection */
  fields?: FieldDefinition[];
  /** Instructions */
  instructions?: string;
  /** Path to store area coordinates */
  storeAs?: string;
}

/**
 * Loop state - repeats a sub-workflow multiple times
 * Implemented using XState actors
 */
export interface LoopState extends BaseState {
  type: 'loop';
  /** Data source for iteration (array) */
  over: string;
  /** Variable name for current item */
  itemName?: string;
  /** Variable name for index */
  indexName?: string;
  /** Sub-workflow to execute for each item */
  workflow: WorkflowState[];
  /** Entry state of sub-workflow */
  entry: string;
  /** Path to store loop results (array) */
  storeAs?: string;
}

/**
 * Final state - workflow completion
 */
export interface FinalState extends BaseState {
  type: 'final';
  /** Completion message */
  message?: string;
  /** Summary data to display */
  summary?: string[];
}

/**
 * Union type for all state definitions
 */
export type WorkflowState =
  | TaskState
  | ChoiceState
  | MultiChoiceState
  | YesNoState
  | AreaSelectState
  | LoopState
  | FinalState;

// =============================================================================
// WORKFLOW DEFINITION
// =============================================================================

/**
 * Complete workflow definition (YAML DSL parsed to this structure)
 */
export interface WorkflowDefinition {
  /** Workflow metadata */
  metadata: WorkflowMetadata;
  
  /** Named data sources available to the workflow */
  dataSources?: Record<string, DataSource>;
  
  /** Workflow states */
  workflow: {
    /** Entry state ID (where workflow starts) */
    entry: string;
    /** All workflow states */
    states: WorkflowState[];
  };
}

// =============================================================================
// WORKFLOW CONTEXT (Runtime State)
// =============================================================================

/**
 * Workflow execution context - stores all runtime data
 * This is the XState machine context
 */
export interface WorkflowContext {
  /** Workflow metadata */
  metadata: WorkflowMetadata;
  
  /** Current state ID */
  currentState: string;
  
  /** User-provided data collected during workflow execution */
  data: Record<string, unknown>;
  
  /** Loaded data sources */
  dataSources?: Record<string, unknown>;
  
  /** Loop iteration context (for nested workflows) */
  loopContext?: {
    item: unknown;
    index: number;
    total: number;
  };
  
  /** Error information */
  error?: {
    message: string;
    state: string;
    timestamp: string;
  };
  
  /** Execution history for debugging */
  history?: Array<{
    state: string;
    timestamp: string;
    data?: unknown;
  }>;
}

// =============================================================================
// WORKFLOW EVENTS (XState Events)
// =============================================================================

/**
 * Event: User completed a task state
 */
export interface TaskCompleteEvent {
  type: 'TASK_COMPLETE';
  /** Field values from completed task */
  data: Record<string, unknown>;
}

/**
 * Event: User selected a choice
 */
export interface ChoiceSelectedEvent {
  type: 'CHOICE_SELECTED';
  /** Selected choice value */
  choice: string;
}

/**
 * Event: User answered yes/no
 */
export interface YesNoAnsweredEvent {
  type: 'YES_NO_ANSWERED';
  /** Boolean answer */
  answer: boolean;
}

/**
 * Event: User completed area selection
 */
export interface AreaSelectCompleteEvent {
  type: 'AREA_SELECT_COMPLETE';
  /** Selected area coordinates */
  areas: Array<{
    type: 'rectangle' | 'polygon';
    coordinates: number[][];
  }>;
  /** Additional field data */
  data?: Record<string, unknown>;
}

/**
 * Event: Loop iteration completed
 */
export interface LoopIterationCompleteEvent {
  type: 'LOOP_ITERATION_COMPLETE';
  /** Result data from iteration */
  data: unknown;
}

/**
 * Event: All loop iterations completed
 */
export interface LoopCompleteEvent {
  type: 'LOOP_COMPLETE';
  /** Array of results from all iterations */
  results: unknown[];
}

/**
 * Event: Navigation (back button)
 */
export interface NavigateBackEvent {
  type: 'NAVIGATE_BACK';
}

/**
 * Event: Error occurred
 */
export interface ErrorEvent {
  type: 'ERROR';
  message: string;
}

/**
 * Union type for all workflow events
 */
export type WorkflowEvent =
  | TaskCompleteEvent
  | ChoiceSelectedEvent
  | YesNoAnsweredEvent
  | AreaSelectCompleteEvent
  | LoopIterationCompleteEvent
  | LoopCompleteEvent
  | NavigateBackEvent
  | ErrorEvent;

// =============================================================================
// COMPILER OUTPUT
// =============================================================================

/**
 * Compiled workflow - ready for XState execution
 */
export interface CompiledWorkflow {
  /** Original workflow definition */
  definition: WorkflowDefinition;
  /** XState machine configuration (will be typed properly in compiler) */
  machineConfig: unknown;
  /** Validation errors/warnings */
  validationResults?: {
    errors: string[];
    warnings: string[];
  };
}

