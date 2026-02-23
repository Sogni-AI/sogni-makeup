import { useState, useEffect, useRef, useCallback } from 'react';
import type { GenerationParams, CostEstimate } from '@/types';
import { getURLs } from '@/config/urls';

const DEBOUNCE_MS = 300;
const CACHE_MAX_SIZE = 20;

interface UseCostEstimationResult {
  estimate: CostEstimate | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Build a stable cache key from the params that affect cost.
 */
function buildCacheKey(params: GenerationParams): string {
  return [
    params.modelId,
    params.width,
    params.height,
    params.steps,
    params.numberOfMedia,
    params.denoisingStrength ?? 'default',
  ].join('|');
}

/**
 * Hook for real-time cost estimation.
 *
 * Calls /api/sogni/estimate-cost with debouncing (300ms) and caches recent
 * estimates to avoid redundant network requests.
 */
export function useCostEstimation(params: GenerationParams | null): UseCostEstimationResult {
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // LRU-ish cache: Map preserves insertion order, we evict the oldest
  const cacheRef = useRef<Map<string, CostEstimate>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchEstimate = useCallback(async (p: GenerationParams) => {
    const key = buildCacheKey(p);

    // Check cache first
    const cached = cacheRef.current.get(key);
    if (cached) {
      setEstimate(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const urls = getURLs();
      const response = await fetch(`${urls.apiUrl}/api/sogni/estimate-cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: p.modelId,
          width: p.width,
          height: p.height,
          steps: p.steps,
          numberOfMedia: p.numberOfMedia,
          denoisingStrength: p.denoisingStrength,
        }),
        signal: controller.signal,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Estimate request failed: ${response.status}`);
      }

      const data = (await response.json()) as CostEstimate;

      // Store in cache, evicting oldest if at capacity
      if (cacheRef.current.size >= CACHE_MAX_SIZE) {
        const oldestKey = cacheRef.current.keys().next().value;
        if (oldestKey !== undefined) {
          cacheRef.current.delete(oldestKey);
        }
      }
      cacheRef.current.set(key, data);

      setEstimate(data);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Request was superseded by a newer one -- do not update state
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to estimate cost';
      setError(message);
      setEstimate(null);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, []);

  // Debounced effect: trigger fetch whenever relevant params change
  useEffect(() => {
    if (!params) {
      setEstimate(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      fetchEstimate(params);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [
    params?.modelId,
    params?.width,
    params?.height,
    params?.steps,
    params?.numberOfMedia,
    params?.denoisingStrength,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { estimate, isLoading, error };
}
