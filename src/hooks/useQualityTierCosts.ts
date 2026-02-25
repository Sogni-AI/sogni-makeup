import { useState, useEffect, useRef } from 'react';
import { useSogniAuth } from '@/services/sogniAuth';
import { useWallet } from '@/hooks/useWallet';
import { useApp } from '@/context/AppContext';
import { MODEL_OPTIONS } from '@/constants/settings';

/**
 * Estimates costs for all three quality-tier models simultaneously.
 * Returns a map of modelId → rounded token cost.
 * Only fetches for authenticated (non-demo) users; returns empty map otherwise.
 */
export function useQualityTierCosts(): Record<string, number | null> {
  const { isAuthenticated, authMode, getSogniClient } = useSogniAuth();
  const { tokenType } = useWallet();
  const { settings } = useApp();
  const [costs, setCosts] = useState<Record<string, number | null>>({});
  const abortRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || authMode === 'demo') {
      setCosts({});
      return;
    }

    const sogniClient = getSogniClient();
    if (!sogniClient?.projects) return;

    abortRef.current = false;

    const estimateAll = async () => {
      const results: Record<string, number | null> = {};

      await Promise.all(
        MODEL_OPTIONS.map(async (model) => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (sogniClient.projects as any).estimateCost({
              network: 'fast',
              tokenType,
              model: model.value,
              imageCount: 1,
              stepCount: model.defaults.steps,
              previewCount: 0,
              cnEnabled: false,
              startingImageStrength: 0.5,
              width: settings.defaultWidth,
              height: settings.defaultHeight,
              guidance: model.defaults.guidance,
              sampler: model.defaults.sampler,
              contextImages: 1,
            });
            const parsed = parseFloat(result.token);
            results[model.value] = isNaN(parsed) ? null : Math.round(parsed);
          } catch {
            results[model.value] = null;
          }
        }),
      );

      if (!abortRef.current) setCosts(results);
    };

    estimateAll();

    return () => {
      abortRef.current = true;
    };
  }, [isAuthenticated, authMode, tokenType, settings.defaultWidth, settings.defaultHeight]);

  return costs;
}
