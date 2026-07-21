import dotenv from 'dotenv';

// Load environment variables from backend/.env
dotenv.config();

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('====================================================');
  console.error('FATAL CONFIGURATION ERROR: Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(` - ${envVar}`);
  });
  console.error('Please configure these in your backend/.env file.');
  console.error('====================================================');
  process.exit(1);
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  pythonAiServiceUrl: process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8001'
};

export default env;
