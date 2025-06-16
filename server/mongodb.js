import mongoose from 'mongoose';

let MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;

// Fix and validate MongoDB Atlas URLs
if (MONGODB_URI) {
  // Clean up the database name part - remove any existing database and add kiranacart
  if (MONGODB_URI.includes('/') && MONGODB_URI.split('/').length > 3) {
    const parts = MONGODB_URI.split('/');
    MONGODB_URI = parts.slice(0, 3).join('/') + '/kiranacart';
  } else if (!MONGODB_URI.endsWith('/kiranacart')) {
    if (!MONGODB_URI.endsWith('/')) {
      MONGODB_URI += '/kiranacart';
    } else {
      MONGODB_URI += 'kiranacart';
    }
  }
  
  console.log('Attempting MongoDB connection to:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
}

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
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    
    isConnected = true;
    console.log('Successfully connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('DNS resolution failed. Checking alternative cluster formats...');
      
      // Try alternative cluster formats for your specific connection string
      const baseUri = process.env.MONGODB_URI || process.env.MONGO_URL;
      const alternatives = [
        baseUri.replace('cluster.mongodb.net', 'cluster0.mongodb.net') + '/kiranacart',
        baseUri.replace('cluster.mongodb.net', 'cluster1.mongodb.net') + '/kiranacart',
        baseUri.replace('cluster.mongodb.net', 'cluster0.cluster.mongodb.net') + '/kiranacart',
        // Direct format with your provided URL
        'mongodb+srv://srirajmohan1:Y9iLhheSsniY1YL4@cluster0.mongodb.net/kiranacart'
      ];
      
      for (const altUri of alternatives) {
        try {
          console.log('Trying alternative format...');
          await mongoose.connect(altUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000
          });
          isConnected = true;
          console.log('Successfully connected to MongoDB with alternative format');
          return;
        } catch (altError) {
          console.log('Alternative format failed:', altError.message);
        }
      }
    }
    
    console.log('All MongoDB connection attempts failed');
    console.log('Please verify your cluster hostname in MongoDB Atlas dashboard');
    throw error;
  }
}

export { mongoose };