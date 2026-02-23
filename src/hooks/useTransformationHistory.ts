import { useState, useCallback, useEffect } from 'react';
import type { HistoryItem } from '@/types';

const STORAGE_KEY = 'sogni-makeover-history';
const MAX_ITEMS = 50;

/**
 * Read the history array from localStorage.
 * Returns an empty array if the stored value is invalid or missing.
 */
function readFromStorage(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryItem[];
  } catch {
    return [];
  }
}

/**
 * Persist the history array to localStorage.
 */
function writeToStorage(items: HistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to write transformation history to localStorage:', err);
  }
}

/**
 * Hook for managing transformation history.
 *
 * - Stores up to 50 items in localStorage (FIFO eviction when full).
 * - Syncs with localStorage on every mutation.
 * - Provides addItem, removeItem, clearAll, and getAll helpers.
 */
export function useTransformationHistory() {
  const [items, setItems] = useState<HistoryItem[]>(readFromStorage);

  // Sync state to localStorage whenever items change
  useEffect(() => {
    writeToStorage(items);
  }, [items]);

  /**
   * Add a new history item. If the list exceeds MAX_ITEMS the oldest item
   * (last in the array, since newest are prepended) is evicted.
   */
  const addItem = useCallback((item: HistoryItem) => {
    setItems((prev) => {
      const next = [item, ...prev];
      if (next.length > MAX_ITEMS) {
        return next.slice(0, MAX_ITEMS);
      }
      return next;
    });
  }, []);

  /**
   * Remove a single item by its id.
   */
  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  /**
   * Clear all history.
   */
  const clearAll = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore removal errors
    }
  }, []);

  /**
   * Return all history items (newest first).
   */
  const getAll = useCallback((): HistoryItem[] => {
    return items;
  }, [items]);

  return {
    items,
    addItem,
    removeItem,
    clearAll,
    getAll,
  } as const;
}
