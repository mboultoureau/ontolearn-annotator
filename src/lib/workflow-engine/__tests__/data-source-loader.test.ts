/**
 * Tests for Data Source Loader
 */

import { describe, it, expect, vi } from 'vitest';
import { loadDataSources } from '../data-source-loader';

describe('Data Source Loader', () => {
  describe('loadDataSources', () => {
    it('should return workflow unchanged when no data sources defined', async () => {
      const workflowDef = {
        metadata: { id: 'test', name: 'Test', version: '1.0.0' },
        workflow: { entry: 'step1', states: [] },
      };

      const result = await loadDataSources(workflowDef, 'test-project');

      expect(result).toEqual(workflowDef);
      expect(result.dataSources).toBeUndefined();
    });

    it('should keep static data sources unchanged', async () => {
      const workflowDef = {
        metadata: { id: 'test', name: 'Test', version: '1.0.0' },
        dataSources: {
          options: {
            type: 'static',
            data: ['Option A', 'Option B', 'Option C'],
          },
        },
        workflow: { entry: 'step1', states: [] },
      };

      const result = await loadDataSources(workflowDef, 'test-project');

      expect(result.dataSources).toBeDefined();
      expect(result.dataSources!.options).toBeDefined();
      expect(result.dataSources!.options.type).toBe('static');
      expect(result.dataSources!.options.data).toEqual(['Option A', 'Option B', 'Option C']);
    });

    it('should keep multiple static data sources unchanged', async () => {
      const workflowDef = {
        metadata: { id: 'test', name: 'Test', version: '1.0.0' },
        dataSources: {
          options1: {
            type: 'static',
            data: ['A', 'B'],
          },
          options2: {
            type: 'static',
            data: ['C', 'D'],
          },
        },
        workflow: { entry: 'step1', states: [] },
      };

      const result = await loadDataSources(workflowDef, 'test-project');

      expect(result.dataSources!.options1.data).toEqual(['A', 'B']);
      expect(result.dataSources!.options2.data).toEqual(['C', 'D']);
    });

    it('should fetch and convert fetch-type data sources to static', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ['API Option 1', 'API Option 2'],
      });

      global.fetch = mockFetch;

      const workflowDef = {
        metadata: { id: 'test', name: 'Test', version: '1.0.0' },
        dataSources: {
          apiOptions: {
            type: 'fetch',
            endpoint: '/api/test',
          },
        },
        workflow: { entry: 'step1', states: [] },
      };

      const result = await loadDataSources(workflowDef, { slug: 'test-project' });

      expect(mockFetch).toHaveBeenCalledWith('/api/test');
      expect(result.dataSources!.apiOptions.type).toBe('static');
      expect(result.dataSources!.apiOptions.data).toEqual(['API Option 1', 'API Option 2']);
    });

    it('should handle failed API requests gracefully with empty array', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      global.fetch = mockFetch;

      const workflowDef = {
        metadata: { id: 'test', name: 'Test', version: '1.0.0' },
        dataSources: {
          apiOptions: {
            type: 'fetch',
            endpoint: '/api/missing',
          },
        },
        workflow: { entry: 'step1', states: [] },
      };

      const result = await loadDataSources(workflowDef, { slug: 'test-project' });

      expect(result.dataSources!.apiOptions).toBeDefined();
      expect(result.dataSources!.apiOptions.type).toBe('static');
      expect(result.dataSources!.apiOptions.data).toEqual([]);
    });
  });
});
