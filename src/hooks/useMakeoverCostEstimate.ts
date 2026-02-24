import { useState, useEffect, useRef } from 'react';
import { useSogniAuth } from '@/services/sogniAuth';
import { useWallet } from '@/hooks/useWallet';
import { useApp } from '@/context/AppContext';

interface MakeoverCostEstimate {
  tokenCost: number | null;
  usdCost: number | null;
  isLoading: boolean;
  error: string | null;
}

export function useMakeoverCostEstimate(): MakeoverCostEstimate {
  const { isAuthenticated, authMode, getSogniClient } = useSogniAuth();
  const { tokenType } = useWallet();
  const { settings } = useApp();
  const [tokenCost, setTokenCost] = useState<number | null>(null);
  const [usdCost, setUsdCost] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || authMode === 'demo') {
      setTokenCost(null);
      setUsdCost(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const sogniClient = getSogniClient();
    if (!sogniClient?.projects) {
      return;
    }

    abortRef.current = false;
    setIsLoading(true);
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sogniClient.projects as any)
      .estimateCost({
        network: 'fast',
        tokenType,
        model: settings.defaultModel,
        imageCount: 1,
        stepCount: settings.defaultSteps,
        previewCount: 0,
        cnEnabled: false,
        startingImageStrength: 0.5,
        width: settings.defaultWidth,
        height: settings.defaultHeight,
        guidance: settings.defaultGuidance,
        sampler: settings.defaultSampler,
        contextImages: 1,
      })
      .then((result: { token: string; usd: string }) => {
        if (abortRef.current) return;
        setTokenCost(parseFloat(result.token));
        setUsdCost(parseFloat(result.usd));
        setIsLoading(false);
      })
      .catch((err: Error) => {
        if (abortRef.current) return;
        console.warn('Cost estimation failed:', err.message);
        setError(err.message);
        setIsLoading(false);
      });

    return () => {
      abortRef.current = true;
    };
  }, [isAuthenticated, authMode, tokenType, settings.defaultModel, settings.defaultSteps, settings.defaultWidth, settings.defaultHeight, settings.defaultGuidance, settings.defaultSampler]);

  return { tokenCost, usdCost, isLoading, error };
}
