/**
 * Storage utilities for Sogni Makeover
 *
 * Provides localStorage-based persistence for settings,
 * demo generation tracking, and transformation history.
 */

const STORAGE_PREFIX = 'sogni-makeover-';

// --- Generic storage helpers ---

/**
 * Get a setting from localStorage
 */
export function getSettingFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(`${STORAGE_PREFIX}${key}`);

    if (!value || value === 'undefined' || value === 'null') {
      return defaultValue;
    }

    return JSON.parse(value) as T;
  } catch (e) {
    console.warn(`Error reading setting ${key}:`, e);
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (clearError) {
      console.warn(`Could not clear corrupted setting ${key}:`, clearError);
    }
    return defaultValue;
  }
}

/**
 * Save a setting to localStorage
 */
export function saveSettingToStorage<T>(key: string, value: T): void {
  try {
    if (value === undefined) {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } else {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    }
  } catch (e) {
    console.warn(`Error saving setting ${key}:`, e);
  }
}

/**
 * Remove a setting from localStorage
 */
export function removeSettingFromStorage(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (e) {
    console.warn(`Error removing setting ${key}:`, e);
  }
}

// --- Demo generation tracking ---

const DEMO_COUNT_KEY = 'demo-generation-count';
const MAX_DEMO_GENERATIONS = 3;

/**
 * Get the number of demo generations the user has performed
 */
export function getDemoGenerationCount(): number {
  return getSettingFromStorage<number>(DEMO_COUNT_KEY, 0);
}

/**
 * Increment the demo generation count and return the new value
 */
export function incrementDemoGenerationCount(): number {
  const current = getDemoGenerationCount();
  const next = current + 1;
  saveSettingToStorage(DEMO_COUNT_KEY, next);
  return next;
}

/**
 * Check whether the user has remaining free demo generations
 */
export function hasDemoGenerationsRemaining(): boolean {
  return getDemoGenerationCount() < MAX_DEMO_GENERATIONS;
}

/**
 * Get the maximum number of free demo generations allowed
 */
export function getMaxDemoGenerations(): number {
  return MAX_DEMO_GENERATIONS;
}

// --- Transformation history ---

export interface TransformationHistoryEntry {
  id: string;
  timestamp: number;
  prompt: string;
  sourceImageUrl: string;
  resultImageUrl: string;
  modelId: string;
  width: number;
  height: number;
  category?: string;
}

const HISTORY_KEY = 'transformation-history';
const MAX_HISTORY_ENTRIES = 50;

/**
 * Get the transformation history for the current session
 */
export function getTransformationHistory(): TransformationHistoryEntry[] {
  return getSettingFromStorage<TransformationHistoryEntry[]>(HISTORY_KEY, []);
}

/**
 * Save a new entry to the transformation history
 * Keeps the most recent MAX_HISTORY_ENTRIES entries
 */
export function saveTransformationHistory(entry: TransformationHistoryEntry): void {
  const history = getTransformationHistory();
  // Prepend the new entry and cap the length
  const updated = [entry, ...history].slice(0, MAX_HISTORY_ENTRIES);
  saveSettingToStorage(HISTORY_KEY, updated);
}

/**
 * Clear the entire transformation history
 */
export function clearTransformationHistory(): void {
  removeSettingFromStorage(HISTORY_KEY);
}

/**
 * Remove a single entry from the transformation history by ID
 */
export function removeTransformationHistoryEntry(id: string): void {
  const history = getTransformationHistory();
  const filtered = history.filter(entry => entry.id !== id);
  saveSettingToStorage(HISTORY_KEY, filtered);
}

// --- Session cleanup ---

/**
 * Clear all sogni-makeover- prefixed items from localStorage
 */
export function clearAllMakeoverStorage(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.warn('Error clearing makeover storage:', e);
  }
}
