import mongoose from 'mongoose';
import { config, validateEnvironment } from './env';

export const connectDB = async () => {
  try {
    // Validate environment variables
    validateEnvironment();
    
    await mongoose.connect(config.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    console.log('✅ MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB Atlas disconnected successfully');
  } catch (error) {
    console.error('❌ MongoDB Atlas disconnection error:', error);
  }
}; 