/**
 * Tests for DataPathNavigator
 */

import { describe, it, expect } from 'vitest';
import { DataPathNavigator } from '../DataPathNavigator';

describe('DataPathNavigator', () => {
  describe('getValue', () => {
    it('should get simple property', () => {
      const obj = { name: 'John' };
      expect(DataPathNavigator.getValue(obj, 'name')).toBe('John');
    });

    it('should get nested property', () => {
      const obj = { user: { profile: { name: 'John' } } };
      expect(DataPathNavigator.getValue(obj, 'user.profile.name')).toBe('John');
    });

    it('should return undefined for non-existent path', () => {
      const obj = { user: { name: 'John' } };
      expect(DataPathNavigator.getValue(obj, 'user.age')).toBeUndefined();
    });

    it('should handle null/undefined objects', () => {
      expect(DataPathNavigator.getValue(null, 'path')).toBeUndefined();
      expect(DataPathNavigator.getValue(undefined, 'path')).toBeUndefined();
    });

    it('should handle empty path', () => {
      const obj = { name: 'John' };
      expect(DataPathNavigator.getValue(obj, '')).toBeUndefined();
    });
  });

  describe('setValue', () => {
    it('should set simple property', () => {
      const obj = { name: 'John' };
      const result = DataPathNavigator.setValue(obj, 'name', 'Jane');
      expect(result.name).toBe('Jane');
    });

    it('should set nested property', () => {
      const obj = {};
      const result = DataPathNavigator.setValue(obj, 'user.profile.name', 'John');
      expect(result.user.profile.name).toBe('John');
    });

    it('should create intermediate objects', () => {
      const obj = {};
      const result = DataPathNavigator.setValue(obj, 'a.b.c.d', 'value');
      expect(result.a.b.c.d).toBe('value');
    });

    it('should not mutate original object', () => {
      const obj = { name: 'John' };
      const result = DataPathNavigator.setValue(obj, 'name', 'Jane');
      expect(obj.name).toBe('John');
      expect(result.name).toBe('Jane');
    });

    it('should handle null initial object', () => {
      const result = DataPathNavigator.setValue(null, 'a.b', 'value');
      expect(result.a.b).toBe('value');
    });

    it('should overwrite non-object values in path', () => {
      const obj = { a: 'string' };
      const result = DataPathNavigator.setValue(obj, 'a.b.c', 'value');
      expect(result.a.b.c).toBe('value');
    });
  });

  describe('ensurePath', () => {
    it('should initialize path to null', () => {
      const obj = {};
      const result = DataPathNavigator.ensurePath(obj, 'user.profile.name');
      expect(result.user.profile.name).toBeNull();
    });

    it('should create full path structure', () => {
      const obj = {};
      const result = DataPathNavigator.ensurePath(obj, 'a.b.c.d');
      expect(result).toHaveProperty('a.b.c.d');
    });
  });

  describe('setValues', () => {
    it('should set multiple values', () => {
      const obj = {};
      const result = DataPathNavigator.setValues(obj, [
        ['user.name', 'John'],
        ['user.age', 30],
        ['settings.theme', 'dark'],
      ]);
      
      expect(result.user.name).toBe('John');
      expect(result.user.age).toBe(30);
      expect(result.settings.theme).toBe('dark');
    });

    it('should handle empty array', () => {
      const obj = { name: 'John' };
      const result = DataPathNavigator.setValues(obj, []);
      expect(result).toEqual(obj);
    });
  });

  describe('hasPath', () => {
    it('should return true for existing path', () => {
      const obj = { user: { profile: { name: 'John' } } };
      expect(DataPathNavigator.hasPath(obj, 'user.profile.name')).toBe(true);
    });

    it('should return false for non-existing path', () => {
      const obj = { user: { name: 'John' } };
      expect(DataPathNavigator.hasPath(obj, 'user.age')).toBe(false);
    });

    it('should return true even if value is null', () => {
      const obj = { user: { name: null } };
      expect(DataPathNavigator.hasPath(obj, 'user.name')).toBe(true);
    });

    it('should handle null/undefined objects', () => {
      expect(DataPathNavigator.hasPath(null, 'path')).toBe(false);
      expect(DataPathNavigator.hasPath(undefined, 'path')).toBe(false);
    });
  });

  describe('extractPaths', () => {
    it('should extract all paths from flat object', () => {
      const obj = { name: 'John', age: 30 };
      const paths = DataPathNavigator.extractPaths(obj);
      
      expect(paths).toContainEqual(['name', 'John']);
      expect(paths).toContainEqual(['age', 30]);
    });

    it('should extract nested paths', () => {
      const obj = { user: { profile: { name: 'John', age: 30 } } };
      const paths = DataPathNavigator.extractPaths(obj);
      
      expect(paths).toContainEqual(['user.profile.name', 'John']);
      expect(paths).toContainEqual(['user.profile.age', 30]);
    });

    it('should handle arrays as leaf values', () => {
      const obj = { tags: ['a', 'b', 'c'] };
      const paths = DataPathNavigator.extractPaths(obj);
      
      expect(paths).toContainEqual(['tags', ['a', 'b', 'c']]);
    });

    it('should handle empty object', () => {
      const paths = DataPathNavigator.extractPaths({});
      expect(paths).toEqual([]);
    });
  });

  describe('Integration - Match old implementation behavior', () => {
    it('should match old path splitting logic', () => {
      // Old way (from compiler.ts)
      const oldWay = (obj: any, path: string) => {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = 'value';
        return obj;
      };

      const obj1 = {};
      const obj2 = {};
      
      oldWay(obj1, 'a.b.c');
      const newWay = DataPathNavigator.setValue(obj2, 'a.b.c', 'value');
      
      expect(newWay).toEqual(obj1);
    });

    it('should handle crystal.category pattern from tests', () => {
      const obj = {};
      const result = DataPathNavigator.setValue(obj, 'crystal.category', 'hexagonal');
      expect(result.crystal.category).toBe('hexagonal');
    });
  });
});
