/**
 * Workflow Engine Parser
 * 
 * This file handles parsing and validation of YAML workflow definitions.
 * YAML files are loaded, parsed, and validated against the Zod schemas.
 * 
 * Note: Full implementation will be done in Step 2.
 * This is a placeholder with the expected interface.
 */

import yaml from 'js-yaml';
import { validateWorkflow } from './schema';
import type { WorkflowDefinition } from './types';

/**
 * Parse a YAML workflow definition string
 * 
 * @param yamlString - YAML workflow definition
 * @returns Parsed and validated workflow definition
 * @throws Error if parsing or validation fails
 * 
 * @example
 * ```typescript
 * const yamlContent = await fs.readFile('workflow.yaml', 'utf-8');
 * const workflow = parseWorkflowDefinition(yamlContent);
 * ```
 */
export function parseWorkflowDefinition(yamlString: string): WorkflowDefinition {
  try {
    // Parse YAML to JavaScript object
    const parsed = yaml.load(yamlString) as unknown;
    
    // Validate against schema
    const validation = validateWorkflow(parsed);
    
    if (!validation.valid) {
      const errorMessages = validation.errors
        .map(err => `  - ${err.path}: ${err.message}`)
        .join('\n');
      
      throw new Error(`Workflow validation failed:\n${errorMessages}`);
    }
    
    return validation.data as WorkflowDefinition;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse workflow: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Parse a YAML workflow definition with detailed error information
 * 
 * @param yamlString - YAML workflow definition
 * @returns Result object with parsed data or errors
 * 
 * @example
 * ```typescript
 * const result = parseWorkflowDefinitionSafe(yamlContent);
 * if (result.success) {
 *   console.log('Workflow:', result.data);
 * } else {
 *   console.error('Errors:', result.errors);
 * }
 * ```
 */
export function parseWorkflowDefinitionSafe(yamlString: string): 
  | { success: true; data: WorkflowDefinition }
  | { success: false; errors: Array<{ path: string; message: string; code: string }> } {
  try {
    const parsed = yaml.load(yamlString) as unknown;
    const validation = validateWorkflow(parsed);
    
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }
    
    return {
      success: true,
      data: validation.data as WorkflowDefinition,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          path: 'root',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'parse_error',
        },
      ],
    };
  }
}
