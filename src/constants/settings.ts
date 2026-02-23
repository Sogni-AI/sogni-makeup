import type { AppSettings } from '@/types';

export const DEFAULT_MODEL = 'qwen_image_edit_2511_fp8_lightning';

export const DEFAULT_SETTINGS: AppSettings = {
  defaultModel: DEFAULT_MODEL,
  defaultWidth: 1024,
  defaultHeight: 1024,
  defaultGuidance: 1,
  defaultSteps: 4,
  defaultSampler: 'euler',
  defaultScheduler: 'simple',
  outputFormat: 'jpg',
};

export const GENERATION_DEFAULTS = {
  numberOfMedia: 1,
  negativePrompt: 'deformed, distorted, bad quality, blurry, ugly, disfigured',
};

export const DEMO_MODE_LIMITS = {
  maxFreeGenerations: 3,
  softGateMessage: 'Sign in for unlimited makeovers!',
};

export const IMAGE_CONSTRAINTS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxDimension: 2048,
  minDimension: 256,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  outputSize: 1024,
};

export const SSE_CONFIG = {
  retryDelay: 1000,
  maxRetries: 3,
  heartbeatInterval: 30000,
};
