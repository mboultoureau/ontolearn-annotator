/**
 * Data Source Loader
 * 
 * Handles loading data from fetch-type data sources before workflow execution
 */

import type { WorkflowDefinition } from './types';

interface FetchOptions {
  projectId?: string;
  taskId?: string;
  slug?: string;
  [key: string]: any;
}

/**
 * Load all fetch-type data sources and replace them with static data
 * 
 * @param workflow - The workflow definition
 * @param options - Options containing projectId, taskId, etc. for URL interpolation
 * @returns Modified workflow with fetch sources replaced by static sources
 */
export async function loadDataSources(
  workflow: WorkflowDefinition,
  options: FetchOptions = {}
): Promise<WorkflowDefinition> {
  if (!workflow.dataSources) {
    return workflow;
  }

  const loadedDataSources = { ...workflow.dataSources };

  for (const [key, source] of Object.entries(workflow.dataSources)) {
    if (source.type === 'fetch') {
      try {
        // Interpolate variables in endpoint URL
        let endpoint = source.endpoint;
        for (const [varKey, varValue] of Object.entries(options)) {
          endpoint = endpoint.replace(`{${varKey}}`, String(varValue));
        }

        // Fetch the data
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${key}: ${response.statusText}`);
        }

        const data = await response.json();

        // Replace with static data source
        loadedDataSources[key] = {
          type: 'static',
          data: Array.isArray(data) ? data : [data],
        };
      } catch (error) {
        console.error(`[DataSourceLoader] Error loading ${key}:`, error);
        // Fallback to empty array
        loadedDataSources[key] = {
          type: 'static',
          data: [],
        };
      }
    }
  }

  return {
    ...workflow,
    dataSources: loadedDataSources,
  };
}
