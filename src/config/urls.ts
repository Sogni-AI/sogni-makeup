/**
 * URL configurations for different environments
 */

interface EnvironmentURLs {
  publicUrl: string;
  apiUrl: string;
  assetUrl: string;
}

// Production URLs
const productionUrls: EnvironmentURLs = {
  publicUrl: 'https://makeover.sogni.ai',
  apiUrl: 'https://makeover-api.sogni.ai',
  assetUrl: 'https://cdn.sogni.ai',
};

// Staging URLs
const stagingUrls: EnvironmentURLs = {
  publicUrl: 'https://makeover-staging.sogni.ai',
  apiUrl: 'https://makeover-api-staging.sogni.ai',
  assetUrl: 'https://cdn.sogni.ai',
};

// Local development URLs (when accessed via localhost:5176 directly)
const developmentUrls: EnvironmentURLs = {
  publicUrl: 'http://localhost:5176',
  apiUrl: 'https://makeover-api-local.sogni.ai',
  assetUrl: 'https://cdn.sogni.ai',
};

// Local secure development URLs (for https://makeover-local.sogni.ai)
const localSecureUrls: EnvironmentURLs = {
  publicUrl: 'https://makeover-local.sogni.ai',
  apiUrl: 'https://makeover-api-local.sogni.ai',
  assetUrl: 'https://cdn.sogni.ai',
};

// Get URLs based on environment
export const getURLs = (): EnvironmentURLs => {
  const environment = import.meta.env.MODE || 'development';

  console.log(`Loading URLs for environment: ${environment}`);

  // Special handling for secure local development
  if (typeof window !== 'undefined' &&
      window.location.hostname === 'makeover-local.sogni.ai') {
    console.log('Using secure local development URLs');
    return localSecureUrls;
  }

  switch (environment) {
    case 'production':
      return productionUrls;
    case 'staging':
      return stagingUrls;
    case 'development':
    default:
      return developmentUrls;
  }
};

// Export default URLs
export default getURLs();
