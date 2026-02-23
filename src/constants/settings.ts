import type { AppSettings } from '@/types';

export const DEFAULT_MODEL = 'qwen_image_edit_2511_fp8_lightning';

export const DEFAULT_SETTINGS: AppSettings = {
  defaultModel: DEFAULT_MODEL,
  defaultWidth: 1024,
  defaultHeight: 1280,
  defaultGuidance: 1,
  defaultSteps: 4,
  defaultSampler: 'euler',
  defaultScheduler: 'simple',
  outputFormat: 'jpg',
  autoEnhanceWebcam: true,
};

export const AUTO_ENHANCE_CONFIG = {
  prompt:
    'Professional headshot with soft studio lighting. Subtly smooth skin blemishes and even out skin tone while keeping natural skin texture. Sharpen facial details. Add subtle depth-of-field with softly blurred background. Preserve the exact same person: same ethnicity, same skin tone, same hair color, same hair style, same hair texture, same eye color, same facial structure, same bone structure, same nose shape, same lip shape, same face shape, same freckles, same moles, same birthmarks, same scars. Maintain exact same facial features, identity, expression, pose, and face proportions. Professional retouched portrait quality.',
  negativePrompt:
    'deformed, distorted, bad quality, blurry, ugly, disfigured, changed face, different person, altered features, different ethnicity, different skin color, lighter skin, darker skin, different hair color, different hair style, cartoon, painting, illustration, skin whitening, skin darkening, race change, stretched face, elongated face, warped proportions',
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
  outputWidth: 1024,
  outputHeight: 1280,
};

export const SSE_CONFIG = {
  retryDelay: 1000,
  maxRetries: 3,
  heartbeatInterval: 30000,
};
