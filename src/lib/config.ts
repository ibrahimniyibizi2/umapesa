// Environment configuration
export const config = {
  // Nhonga API Configuration
  nhonga: {
    apiKey: import.meta.env.VITE_API_KEY || import.meta.env.VITE_NHONGA_API_KEY || '',
    secretKey: import.meta.env.VITE_WEBHOOK_SECRET || import.meta.env.VITE_NHONGA_SECRET_KEY || '',
    baseUrl: 'https://nhonga.net/api/',
    environment: import.meta.env.VITE_ENVIRONMENT || 'prod',
    // Add debugging flag
    debug: import.meta.env.VITE_DEBUG === 'true' || import.meta.env.MODE === 'development'
  },
  
  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
  },
  
  // Application Configuration
  app: {
    name: 'UmaPesa',
    version: '1.0.0',
    environment: import.meta.env.MODE || 'production'
  }
};

// Validation function to ensure required environment variables are present
export const validateConfig = () => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const optionalVars = [
    'VITE_API_KEY',
    'VITE_WEBHOOK_SECRET'
  ];
  
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  const missingOptional = optionalVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    console.error('Please check your .env file and ensure all required variables are set.');
  }
  
  if (missingOptional.length > 0) {
    console.warn('Missing optional environment variables (payment features may not work):', missingOptional);
    console.warn('To enable payment functionality, please set these variables in your .env file.');
  }
  
  return missing.length === 0;
};

// Check if payment features are available
export const isPaymentEnabled = () => {
  return !!(config.nhonga.apiKey && config.nhonga.secretKey);
};

// Initialize configuration validation
if (import.meta.env.MODE !== 'test') {
  validateConfig();
}