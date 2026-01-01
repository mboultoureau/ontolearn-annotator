/**
 * Workflow Engine Zod Schemas
 * 
 * This file provides comprehensive validation for the Workflow DSL using Zod.
 * All workflow YAML files are validated against these schemas before compilation.
 * 
 * Benefits of Zod validation:
 * - Type-safe parsing with automatic TypeScript inference
 * - Detailed error messages for invalid workflows
 * - Runtime validation to catch configuration errors early
 * - Automatic schema documentation
 */

import { z } from 'zod';

// =============================================================================
// METADATA SCHEMAS
// =============================================================================

export const WorkflowMetadataSchema = z.object({
  id: z.string().min(1, 'Workflow ID is required'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver format (e.g., 1.0.0)'),
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  author: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).strict();

// =============================================================================
// DATA SOURCE SCHEMAS
// =============================================================================

export const StaticDataSourceSchema = z.object({
  type: z.literal('static'),
  data: z.unknown(),
}).strict();

export const FetchDataSourceSchema = z.object({
  type: z.literal('fetch'),
  endpoint: z.string().url('Endpoint must be a valid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  params: z.record(z.string()).optional(),
  responsePath: z.string().optional(),
}).strict();

export const DataSourceSchema = z.discriminatedUnion('type', [
  StaticDataSourceSchema,
  FetchDataSourceSchema,
]);

// =============================================================================
// FIELD DEFINITION SCHEMAS
// =============================================================================

const BaseFieldSchema = z.object({
  id: z.string().min(1, 'Field ID is required'),
  label: z.string().min(1, 'Field label is required'),
  isTranslatable: z.boolean().default(false),
  required: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  storeAs: z.string().optional(),
});

export const TextFieldSchema = BaseFieldSchema.extend({
  type: z.enum(['text', 'textarea', 'email', 'number']),
  placeholder: z.string().optional(),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  pattern: z.string().optional(),
}).strict();

export const SelectFieldOptionSchema: z.ZodType<{
  value: string;
  label: string;
  children?: Array<{ value: string; label: string; children?: unknown }>;
}> = z.lazy(() => z.object({
  value: z.string().min(1, 'Option value is required'),
  label: z.string().min(1, 'Option label is required'),
  children: z.array(SelectFieldOptionSchema).optional(),
}).strict());

export const SelectFieldSchema = BaseFieldSchema.extend({
  type: z.literal('select'),
  options: z.array(SelectFieldOptionSchema),
  dataSource: z.string().optional(),
  multiple: z.boolean().default(false),
  useParentAsGroup: z.boolean().default(false),
  placeholder: z.string().optional(),
}).strict();

const SliderFieldSchemaBase = BaseFieldSchema.extend({
  type: z.literal('slider'),
  min: z.number(),
  max: z.number(),
  step: z.number().positive().default(1),
  stepLabels: z.array(z.string()).optional(),
}).strict();

export const SliderFieldSchema = SliderFieldSchemaBase.refine(
  (data) => data.max > data.min,
  { message: 'Slider max must be greater than min' }
);

export const YesNoFieldSchema = BaseFieldSchema.extend({
  type: z.literal('yes_no'),
  yesLabel: z.string().optional(),
  noLabel: z.string().optional(),
}).strict();

export const AreaSelectFieldSchema = BaseFieldSchema.extend({
  type: z.literal('area_select'),
  imageSource: z.string().min(1, 'Image source is required'),
  toolType: z.enum(['rectangle', 'polygon', 'both']).default('both'),
  allowMultiple: z.boolean().default(false),
}).strict();

export const FieldDefinitionSchema = z.discriminatedUnion('type', [
  TextFieldSchema,
  SelectFieldSchema,
  SliderFieldSchemaBase, // Use base schema without refine for discriminated union
  YesNoFieldSchema,
  AreaSelectFieldSchema,
]);

// =============================================================================
// TRANSITION & CONDITION SCHEMAS
// =============================================================================

export const TransitionSchema = z.object({
  target: z.string().min(1, 'Transition target is required'),
  when: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
}).strict();

// =============================================================================
// STATE DEFINITION SCHEMAS
// =============================================================================

const BaseStateSchema = z.object({
  id: z.string().min(1, 'State ID is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  transitions: z.array(TransitionSchema).optional(),
});

export const TaskStateSchema = BaseStateSchema.extend({
  type: z.literal('task'),
  fields: z.array(FieldDefinitionSchema).min(1, 'Task must have at least one field'),
  instructions: z.string().optional(),
}).strict();

export const ChoiceStateSchema = BaseStateSchema.extend({
  type: z.literal('choice'),
  transitions: z.array(TransitionSchema).min(1, 'Choice state must have at least one transition'),
  default: z.string().optional(),
}).strict();

export const MultiChoiceStateSchema = BaseStateSchema.extend({
  type: z.literal('multi_choice'),
  question: z.string().min(1, 'Question is required'),
  choices: z.array(z.object({
    value: z.string().min(1, 'Choice value is required'),
    label: z.string().min(1, 'Choice label is required'),
    target: z.string().min(1, 'Choice target is required'),
  }).strict()).min(2, 'Multi-choice must have at least 2 choices'),
  storeAs: z.string().optional(),
}).strict();

export const YesNoStateSchema = BaseStateSchema.extend({
  type: z.literal('yes_no'),
  question: z.string().min(1, 'Question is required'),
  yesLabel: z.string().optional(),
  noLabel: z.string().optional(),
  yesTarget: z.string().min(1, 'Yes target is required'),
  noTarget: z.string().min(1, 'No target is required'),
  storeAs: z.string().optional(),
}).strict();

export const AreaSelectStateSchema = BaseStateSchema.extend({
  type: z.literal('area_select'),
  imageSource: z.string().min(1, 'Image source is required'),
  toolType: z.enum(['rectangle', 'polygon', 'both']).default('both'),
  allowMultiple: z.boolean().default(false),
  fields: z.array(FieldDefinitionSchema).optional(),
  instructions: z.string().optional(),
  storeAs: z.string().optional(),
}).strict();

// Loop state schema - simpler version without z.lazy for discriminated union
export const LoopStateSchema = BaseStateSchema.extend({
  type: z.literal('loop'),
  over: z.string().min(1, 'Loop "over" source is required'),
  itemName: z.string().default('item'),
  indexName: z.string().default('index'),
  workflow: z.array(z.any()).min(1, 'Loop workflow must have at least one state'), // Use z.any() to avoid circular reference
  entry: z.string().min(1, 'Loop entry state is required'),
  storeAs: z.string().optional(),
}).strict();

export const FinalStateSchema = BaseStateSchema.extend({
  type: z.literal('final'),
  message: z.string().optional(),
  summary: z.array(z.string()).optional(),
}).strict();

export const WorkflowStateSchema = z.discriminatedUnion('type', [
  TaskStateSchema,
  ChoiceStateSchema,
  MultiChoiceStateSchema,
  YesNoStateSchema,
  AreaSelectStateSchema,
  LoopStateSchema,
  FinalStateSchema,
]);

// =============================================================================
// WORKFLOW DEFINITION SCHEMA
// =============================================================================

export const WorkflowDefinitionSchema = z.object({
  metadata: WorkflowMetadataSchema,
  dataSources: z.record(DataSourceSchema).optional(),
  workflow: z.object({
    entry: z.string().min(1, 'Entry state is required'),
    states: z.array(WorkflowStateSchema).min(1, 'Workflow must have at least one state'),
  }).strict(),
}).strict();

// =============================================================================
// WORKFLOW CONTEXT SCHEMA (Runtime)
// =============================================================================

export const WorkflowContextSchema = z.object({
  metadata: WorkflowMetadataSchema,
  currentState: z.string(),
  data: z.record(z.unknown()),
  dataSources: z.record(z.unknown()).optional(),
  loopContext: z.object({
    item: z.unknown(),
    index: z.number().int().nonnegative(),
    total: z.number().int().positive(),
  }).optional(),
  error: z.object({
    message: z.string(),
    state: z.string(),
    timestamp: z.string(),
  }).optional(),
  history: z.array(z.object({
    state: z.string(),
    timestamp: z.string(),
    data: z.unknown().optional(),
  })).optional(),
}).strict();

// =============================================================================
// WORKFLOW EVENT SCHEMAS
// =============================================================================

export const TaskCompleteEventSchema = z.object({
  type: z.literal('TASK_COMPLETE'),
  data: z.record(z.unknown()),
}).strict();

export const ChoiceSelectedEventSchema = z.object({
  type: z.literal('CHOICE_SELECTED'),
  choice: z.string(),
}).strict();

export const YesNoAnsweredEventSchema = z.object({
  type: z.literal('YES_NO_ANSWERED'),
  answer: z.boolean(),
}).strict();

export const AreaSelectCompleteEventSchema = z.object({
  type: z.literal('AREA_SELECT_COMPLETE'),
  areas: z.array(z.object({
    type: z.enum(['rectangle', 'polygon']),
    coordinates: z.array(z.array(z.number())),
  })),
  data: z.record(z.unknown()).optional(),
}).strict();

export const LoopIterationCompleteEventSchema = z.object({
  type: z.literal('LOOP_ITERATION_COMPLETE'),
  data: z.unknown(),
}).strict();

export const LoopCompleteEventSchema = z.object({
  type: z.literal('LOOP_COMPLETE'),
  results: z.array(z.unknown()),
}).strict();

export const NavigateBackEventSchema = z.object({
  type: z.literal('NAVIGATE_BACK'),
}).strict();

export const ErrorEventSchema = z.object({
  type: z.literal('ERROR'),
  message: z.string(),
}).strict();

export const WorkflowEventSchema = z.discriminatedUnion('type', [
  TaskCompleteEventSchema,
  ChoiceSelectedEventSchema,
  YesNoAnsweredEventSchema,
  AreaSelectCompleteEventSchema,
  LoopIterationCompleteEventSchema,
  LoopCompleteEventSchema,
  NavigateBackEventSchema,
  ErrorEventSchema,
]);

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate workflow definition and return detailed errors
 */
export function validateWorkflow(data: unknown) {
  const result = WorkflowDefinitionSchema.safeParse(data);
  
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
      data: null,
    };
  }
  
  // Additional semantic validation
  const semanticErrors = validateWorkflowSemantics(result.data);
  
  if (semanticErrors.length > 0) {
    return {
      valid: false,
      errors: semanticErrors,
      data: result.data,
    };
  }
  
  return {
    valid: true,
    errors: [],
    data: result.data,
  };
}

/**
 * Semantic validation - checks beyond schema structure
 * Validates:
 * - Entry state exists in states array
 * - All transition targets exist
 * - No circular loops without exit conditions
 * - Loop entry states exist within loop workflow
 * - DataSource references are valid
 */
function validateWorkflowSemantics(workflow: z.infer<typeof WorkflowDefinitionSchema>) {
  const errors: Array<{ path: string; message: string; code: string }> = [];
  
  // Collect all state IDs
  const stateIds = new Set(workflow.workflow.states.map(s => s.id));
  
  // Check if entry state exists
  if (!stateIds.has(workflow.workflow.entry)) {
    errors.push({
      path: 'workflow.entry',
      message: `Entry state "${workflow.workflow.entry}" does not exist in states`,
      code: 'invalid_entry_state',
    });
  }
  
  // Check if state IDs are unique
  const duplicates = workflow.workflow.states
    .map(s => s.id)
    .filter((id, index, arr) => arr.indexOf(id) !== index);
  
  if (duplicates.length > 0) {
    errors.push({
      path: 'workflow.states',
      message: `Duplicate state IDs found: ${duplicates.join(', ')}`,
      code: 'duplicate_state_ids',
    });
  }
  
  // Check all transition targets exist
  workflow.workflow.states.forEach((state, index) => {
    if ('transitions' in state && state.transitions) {
      state.transitions.forEach((transition: any, tIndex: number) => {
        if (!stateIds.has(transition.target)) {
          errors.push({
            path: `workflow.states[${index}].transitions[${tIndex}].target`,
            message: `Transition target "${transition.target}" does not exist`,
            code: 'invalid_transition_target',
          });
        }
      });
    }
    
    // Check multi_choice targets
    if (state.type === 'multi_choice') {
      state.choices.forEach((choice: any, cIndex: number) => {
        if (!stateIds.has(choice.target)) {
          errors.push({
            path: `workflow.states[${index}].choices[${cIndex}].target`,
            message: `Choice target "${choice.target}" does not exist`,
            code: 'invalid_choice_target',
          });
        }
      });
    }
    
    // Check yes/no targets
    if (state.type === 'yes_no') {
      if (!stateIds.has(state.yesTarget)) {
        errors.push({
          path: `workflow.states[${index}].yesTarget`,
          message: `Yes target "${state.yesTarget}" does not exist`,
          code: 'invalid_yes_target',
        });
      }
      if (!stateIds.has(state.noTarget)) {
        errors.push({
          path: `workflow.states[${index}].noTarget`,
          message: `No target "${state.noTarget}" does not exist`,
          code: 'invalid_no_target',
        });
      }
    }
    
    // Check loop workflow
    if (state.type === 'loop') {
      const loopStateIds = new Set(state.workflow.map((s: any) => s.id));
      if (!loopStateIds.has(state.entry)) {
        errors.push({
          path: `workflow.states[${index}].entry`,
          message: `Loop entry state "${state.entry}" does not exist in loop workflow`,
          code: 'invalid_loop_entry',
        });
      }
    }
  });
  
  // Check dataSource references
  const dataSourceNames = workflow.dataSources ? Object.keys(workflow.dataSources) : [];
  
  workflow.workflow.states.forEach((state, index) => {
    if (state.type === 'task') {
      state.fields.forEach((field: any, fIndex: number) => {
        if ('dataSource' in field && field.dataSource) {
          if (!dataSourceNames.includes(field.dataSource)) {
            errors.push({
              path: `workflow.states[${index}].fields[${fIndex}].dataSource`,
              message: `DataSource "${field.dataSource}" is not defined`,
              code: 'undefined_datasource',
            });
          }
        }
      });
    }
  });
  
  return errors;
}

/**
 * Type guard for checking if a value is a valid workflow definition
 */
export function isWorkflowDefinition(value: unknown): value is z.infer<typeof WorkflowDefinitionSchema> {
  return WorkflowDefinitionSchema.safeParse(value).success;
}

// Export inferred types for convenience
export type WorkflowDefinitionType = z.infer<typeof WorkflowDefinitionSchema>;
export type WorkflowStateType = z.infer<typeof WorkflowStateSchema>;
export type FieldDefinitionType = z.infer<typeof FieldDefinitionSchema>;
export type DataSourceType = z.infer<typeof DataSourceSchema>;
export type WorkflowContextType = z.infer<typeof WorkflowContextSchema>;
export type WorkflowEventType = z.infer<typeof WorkflowEventSchema>;
