// Environment configuration
export const config = {
  // MongoDB Atlas connection string
  MONGODB_URI: import.meta.env.VITE_MONGODB_URI || 
                import.meta.env.MONGODB_URI || 
                'mongodb+srv://sunflowerpgs77:sunflower@pg.wctacc3.mongodb.net/sunflower_pg?retryWrites=true&w=majority',
  
  // Environment
  NODE_ENV: import.meta.env.MODE || 'development',
  
  // App settings
  APP_NAME: 'Sunflower PG Management',
  APP_VERSION: '1.0.0',
};

// Validate required environment variables
export const validateEnvironment = () => {
  if (!config.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }
  
  console.log('✅ Environment validation passed');
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 MongoDB URI: ${config.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
}; 