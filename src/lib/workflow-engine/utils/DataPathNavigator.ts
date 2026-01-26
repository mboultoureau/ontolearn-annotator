/**
 * DataPathNavigator - Utility for navigating and manipulating nested object paths
 * 
 * Eliminates code duplication across the workflow engine for path operations.
 * Replaces all manual path.split('.') logic with tested, reusable functions.
 * 
 * Examples:
 *   getValue({ a: { b: 'value' } }, 'a.b') // => 'value'
 *   setValue({}, 'a.b.c', 123) // => { a: { b: { c: 123 } } }
 *   ensurePath({}, 'a.b.c') // => { a: { b: { c: null } } }
 */

export class DataPathNavigator {
  /**
   * Gets a value from a nested object using a dot-notation path
   * 
   * @param obj - Object to navigate
   * @param path - Dot-notation path (e.g., 'data.user.name')
   * @returns Value at path, or undefined if not found
   */
  static getValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current == null) return undefined;
      current = current[key];
    }
    
    return current;
  }

  /**
   * Sets a value in a nested object using a dot-notation path
   * Creates intermediate objects as needed
   * Returns a new object (does not mutate)
   * 
   * @param obj - Object to update
   * @param path - Dot-notation path (e.g., 'data.user.name')
   * @param value - Value to set
   * @returns New object with value set
   */
  static setValue(obj: any, path: string, value: any): any {
    if (!path) return obj;
    
    // Deep clone to avoid mutation
    const result = JSON.parse(JSON.stringify(obj || {}));
    
    const keys = path.split('.');
    let current = result;
    
    // Navigate to parent, creating objects as needed
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    // Set the final value
    const finalKey = keys[keys.length - 1];
    current[finalKey] = value;
    
    return result;
  }

  /**
   * Ensures a path exists in an object by initializing it to null
   * Useful for preventing "undefined" errors in guards
   * 
   * @param obj - Object to update
   * @param path - Dot-notation path to ensure
   * @returns New object with path initialized
   */
  static ensurePath(obj: any, path: string): any {
    return this.setValue(obj, path, null);
  }

  /**
   * Sets multiple values at once
   * 
   * @param obj - Object to update
   * @param pathValuePairs - Array of [path, value] tuples
   * @returns New object with all values set
   */
  static setValues(obj: any, pathValuePairs: Array<[string, any]>): any {
    let result = obj;
    
    for (const [path, value] of pathValuePairs) {
      result = this.setValue(result, path, value);
    }
    
    return result;
  }

  /**
   * Checks if a path exists in an object
   * 
   * @param obj - Object to check
   * @param path - Dot-notation path
   * @returns True if path exists (even if value is null/undefined)
   */
  static hasPath(obj: any, path: string): boolean {
    if (!obj || !path) return false;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (typeof current !== 'object' || current === null) return false;
      if (!(key in current)) return false;
      current = current[key];
    }
    
    return true;
  }

  /**
   * Extracts all paths with their values from an object
   * Useful for debugging and testing
   * 
   * @param obj - Object to extract paths from
   * @param prefix - Internal: current path prefix
   * @returns Array of [path, value] tuples
   */
  static extractPaths(obj: any, prefix = ''): Array<[string, any]> {
    const paths: Array<[string, any]> = [];
    
    if (obj === null || typeof obj !== 'object') {
      return prefix ? [[prefix, obj]] : [];
    }
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const path = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          paths.push(...this.extractPaths(value, path));
        } else {
          paths.push([path, value]);
        }
      }
    }
    
    return paths;
  }
}
