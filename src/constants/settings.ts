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
  autoEnhanceWebcam: true,
};

export const AUTO_ENHANCE_CONFIG = {
  prompt:
    'Professional headshot photograph. Enhance lighting to soft studio lighting. Improve skin clarity and evenness. Sharpen facial details. Add subtle depth-of-field with softly blurred background. Maintain exact same facial features, identity, expression, and pose. Professional corporate portrait quality.',
  negativePrompt:
    'deformed, distorted, bad quality, blurry, ugly, disfigured, changed face, different person, altered features, cartoon, painting, illustration',
  denoisingStrength: 0.35,
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
