/**
 * Represents a session object for managing data in local storage.
 */
export default class Session {
  /**
   * Retrieves the value associated with the specified key from local storage.
   * @param {string} key - The key to retrieve the value for.
   * @returns {string|boolean|null} The value associated with the key, or null if the key does not exist.
   */
  static get(key: string): string | boolean | null {
    const value = localStorage.getItem(key);
    if (value === 'true' || value === 'false') {
      return JSON.parse(value);
    }
    return value;
  }

  /**
   * Retrieves the object associated with the specified key from local storage.
   * @param {string} key - The key to retrieve the object for.
   * @returns {any|null} The object associated with the key, or null if the key does not exist.
   */
  static getObject(key: string): any {
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing stored object:', error);
      return null;
    }
  }

  /**
   * Sets the value for the specified key in local storage.
   * @param {string} key - The key to set the value for.
   * @param {string|number|boolean} value - The value to set.
   */
  static set(key: string, value: string | number | boolean): void {
    if (typeof value === 'boolean') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, String(value));
    }
  }

  /**
   * Sets the object for the specified key in local storage.
   * @param {string} key - The key to set the object for.
   * @param {any} value - The object to set.
   */
  static setObject(key: string, value: any): void {
    try {
      const data = JSON.stringify(value);
      localStorage.setItem(key, data);
    } catch (error) {
      console.error('Error storing object:', error);
    }
  }

  /**
   * Removes the value associated with the specified key from local storage.
   * @param {string} key - The key to remove the value for.
   */
  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clears all items from local storage.
   */
  static clear(): void {
    localStorage.clear();
  }
}
