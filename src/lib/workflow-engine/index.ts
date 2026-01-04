/**
 * Workflow Engine - Main Export
 * 
 * This module provides a complete workflow orchestration system for annotation tasks.
 * 
 * Key Features:
 * - Declarative YAML-based workflow definitions
 * - XState-powered state machines
 * - Conditional branching and loops
 * - Dynamic data sources
 * - State persistence and resumption
 * - Type-safe with TypeScript and Zod validation
 * 
 * Usage:
 * ```typescript
 * import { parseWorkflowDefinition, validateWorkflow } from '@/lib/workflow-engine';
 * 
 * const yamlContent = await fetch('/workflows/my-workflow.yaml').then(r => r.text());
 * const parsed = parseWorkflowDefinition(yamlContent);
 * const validation = validateWorkflow(parsed);
 * 
 * if (validation.valid) {
 *   const machine = compileWorkflow(validation.data);
 *   // Use machine with XState
 * }
 * ```
 */

// Export all types
export type {
  // Metadata
  WorkflowMetadata,
  
  // Data Sources
  DataSource,
  StaticDataSource,
  FetchDataSource,
  
  // Field Definitions
  FieldDefinition,
  BaseFieldDefinition,
  TextFieldDefinition,
  SelectFieldDefinition,
  SelectFieldOption,
  SliderFieldDefinition,
  YesNoFieldDefinition,
  AreaSelectFieldDefinition,
  
  // Transitions
  Transition,
  TransitionCondition,
  
  // States
  WorkflowState,
  BaseState,
  TaskState,
  BranchState,
  ChoiceState,
  MultiChoiceState,
  YesNoState,
  AreaSelectState,
  LoopState,
  FinalState,
  
  // Workflow Definition
  WorkflowDefinition,
  
  // Runtime Context
  WorkflowContext,
  
  // Events
  WorkflowEvent,
  TaskCompleteEvent,
  ChoiceSelectedEvent,
  YesNoAnsweredEvent,
  AreaSelectCompleteEvent,
  LoopIterationCompleteEvent,
  LoopCompleteEvent,
  NavigateBackEvent,
  ErrorEvent,
  
  // Compiler
  CompiledWorkflow,
} from './types';

// Export all schemas
export {
  // Metadata Schemas
  WorkflowMetadataSchema,
  
  // Data Source Schemas
  DataSourceSchema,
  StaticDataSourceSchema,
  FetchDataSourceSchema,
  
  // Field Schemas
  FieldDefinitionSchema,
  TextFieldSchema,
  SelectFieldSchema,
  SelectFieldOptionSchema,
  SliderFieldSchema,
  YesNoFieldSchema,
  AreaSelectFieldSchema,
  
  // Transition Schema
  TransitionSchema,
  
  // State Schemas
  WorkflowStateSchema,
  TaskStateSchema,
  BranchStateSchema,
  ChoiceStateSchema,
  MultiChoiceStateSchema,
  YesNoStateSchema,
  AreaSelectStateSchema,
  LoopStateSchema,
  FinalStateSchema,
  
  // Workflow Definition Schema
  WorkflowDefinitionSchema,
  
  // Context & Event Schemas
  WorkflowContextSchema,
  WorkflowEventSchema,
  TaskCompleteEventSchema,
  ChoiceSelectedEventSchema,
  YesNoAnsweredEventSchema,
  AreaSelectCompleteEventSchema,
  LoopIterationCompleteEventSchema,
  LoopCompleteEventSchema,
  NavigateBackEventSchema,
  ErrorEventSchema,
  
  // Validation Helpers
  validateWorkflow,
  isWorkflowDefinition,
  
  // Inferred Types
  type WorkflowDefinitionType,
  type WorkflowStateType,
  type FieldDefinitionType,
  type DataSourceType,
  type WorkflowContextType,
  type WorkflowEventType,
} from './schema';

// Re-export parser (will be implemented in step 2)
// export { parseWorkflowDefinition } from './parser';

// Re-export compiler (will be implemented in step 3)
// export { compileWorkflow } from './compiler';

// Re-export hooks (will be implemented in step 4)
// export { useWorkflow, useWorkflowContext } from './hooks';
