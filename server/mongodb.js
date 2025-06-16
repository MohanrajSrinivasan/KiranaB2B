import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;

let isConnected = false;

export async function connectToMongoDB() {
  if (isConnected) {
    return;
  }

  if (!MONGODB_URI) {
    console.log('MongoDB URI not provided, skipping MongoDB connection');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Please check your MONGODB_URI connection string format');
    console.log('Expected format: mongodb+srv://username:password@cluster.mongodb.net/database');
    throw error;
  }
}

export { mongoose };