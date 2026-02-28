/**
 * Safe wrapper around browser localStorage.
 *
 * Why this exists:
 * - Keeps storage access in one place.
 * - Handles environments where `window` or `localStorage` is unavailable.
 * - Ensures stored values are JSON-serialized and parsed consistently.
 */
const hasStorage = () => {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};

/**
 * Save any serializable value under a key.
 *
 * @param {string} key - Storage key.
 * @param {unknown} data - Value to serialize and store.
 * @returns {void}
 */
export const saveData = (key, data) => {
  // Skip writes when storage is unavailable (SSR/private-mode restrictions).
  if (!hasStorage()) return;
  localStorage.setItem(key, JSON.stringify(data));
};

/**
 * Read and parse JSON data from storage.
 *
 * Fallback behavior:
 * - Returns `defaultValue` when storage is unavailable.
 * - Returns `defaultValue` when key does not exist.
 * - Returns `defaultValue` when stored JSON is invalid.
 *
 * @param {string} key - Storage key.
 * @param {unknown} [defaultValue=null] - Value returned when data cannot be read.
 * @returns {unknown}
 */
export const getData = (key, defaultValue = null) => {
  if (!hasStorage()) return defaultValue;
  // localStorage stores only strings, so parse from JSON text.
  const raw = localStorage.getItem(key);
  if (raw === null) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
};

/**
 * Remove an item from storage.
 *
 * @param {string} key - Storage key.
 * @returns {void}
 */
export const removeData = (key) => {
  if (!hasStorage()) return;
  localStorage.removeItem(key);
};
