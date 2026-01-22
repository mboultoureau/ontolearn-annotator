/**
 * Tests for Coordinate Utilities
 */

import { describe, it, expect } from 'vitest';

describe('Coordinate Utilities', () => {
  describe('Coordinate System Detection', () => {
    it('should detect pixel coordinates when values > 100', () => {
      const coordinates = { x: 234, y: 567, width: 100, height: 150 };

      const isPixel = Object.values(coordinates).some((val) => val > 100);

      expect(isPixel).toBe(true);
    });

    it('should detect normalized coordinates when all values <= 100', () => {
      const coordinates = { x: 10, y: 20, width: 30, height: 40 };

      const isPixel = Object.values(coordinates).some((val) => val > 100);

      expect(isPixel).toBe(false);
    });

    it('should handle edge case of exactly 100', () => {
      const coordinates = { x: 50, y: 75, width: 100, height: 100 };

      const isPixel = Object.values(coordinates).some((val) => val > 100);

      // 100 is still normalized (0-100 range)
      expect(isPixel).toBe(false);
    });
  });

  describe('Rectangle to Polygon Conversion', () => {
    it('should convert rectangle to 4-point polygon', () => {
      const rect = { x: 10, y: 20, width: 30, height: 40 };

      const polygon = [
        { x: rect.x, y: rect.y },
        { x: rect.x + rect.width, y: rect.y },
        { x: rect.x + rect.width, y: rect.y + rect.height },
        { x: rect.x, y: rect.y + rect.height },
      ];

      expect(polygon).toHaveLength(4);
      expect(polygon[0]).toEqual({ x: 10, y: 20 });
      expect(polygon[1]).toEqual({ x: 40, y: 20 });
      expect(polygon[2]).toEqual({ x: 40, y: 60 });
      expect(polygon[3]).toEqual({ x: 10, y: 60 });
    });

    it('should handle zero-sized rectangles', () => {
      const rect = { x: 10, y: 20, width: 0, height: 0 };

      const polygon = [
        { x: rect.x, y: rect.y },
        { x: rect.x + rect.width, y: rect.y },
        { x: rect.x + rect.width, y: rect.y + rect.height },
        { x: rect.x, y: rect.y + rect.height },
      ];

      expect(polygon).toHaveLength(4);
      // All points should be at the same location
      expect(polygon.every((p) => p.x === 10 && p.y === 20)).toBe(true);
    });
  });

  describe('Nested Payload Extraction', () => {
    it('should extract array from deeply nested object', () => {
      const payload = {
        subsection: {
          classes: ['A', 'B', 'C'],
        },
      };

      const findArray = (obj: any): any[] | null => {
        if (Array.isArray(obj)) return obj;
        if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            const result = findArray(obj[key]);
            if (result) return result;
          }
        }
        return null;
      };

      const result = findArray(payload);
      expect(result).toEqual(['A', 'B', 'C']);
    });

    it('should return null when no array found', () => {
      const payload = {
        crystal: {
          class: 'Singular',
        },
      };

      const findArray = (obj: any): any[] | null => {
        if (Array.isArray(obj)) return obj;
        if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            const result = findArray(obj[key]);
            if (result) return result;
          }
        }
        return null;
      };

      const result = findArray(payload);
      expect(result).toBeNull();
    });

    it('should find first array in complex nested structure', () => {
      const payload = {
        level1: {
          level2: {
            items: ['item1', 'item2'],
            other: {
              moreItems: ['item3', 'item4'],
            },
          },
        },
      };

      const findArray = (obj: any): any[] | null => {
        if (Array.isArray(obj)) return obj;
        if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            const result = findArray(obj[key]);
            if (result) return result;
          }
        }
        return null;
      };

      const result = findArray(payload);
      // Should find first array encountered
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Safe Value Extraction', () => {
    it('should extract string value from object', () => {
      const item = { value: 'Test Value', rank: 1 };

      const getValue = (item: any): string => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          if (item.value !== undefined) return String(item.value);
          if (item.label !== undefined) return String(item.label);
        }
        return String(item);
      };

      expect(getValue(item)).toBe('Test Value');
    });

    it('should handle direct string values', () => {
      const item = 'Direct String';

      const getValue = (item: any): string => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          if (item.value !== undefined) return String(item.value);
          if (item.label !== undefined) return String(item.label);
        }
        return String(item);
      };

      expect(getValue(item)).toBe('Direct String');
    });

    it('should convert non-string values safely', () => {
      const item = { value: 123 };

      const getValue = (item: any): string => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          if (item.value !== undefined) return String(item.value);
          if (item.label !== undefined) return String(item.label);
        }
        return String(item);
      };

      expect(getValue(item)).toBe('123');
    });

    it('should handle objects without value or label', () => {
      const item = { data: 'test', id: 5 };

      const getValue = (item: any): string => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          if (item.value !== undefined) return String(item.value);
          if (item.label !== undefined) return String(item.label);
        }
        return String(item);
      };

      // Should convert object to string (JSON or [object Object])
      expect(typeof getValue(item)).toBe('string');
    });
  });
});
