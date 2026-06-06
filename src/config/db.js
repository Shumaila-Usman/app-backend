const mongoose = require('mongoose');

mongoose.set('bufferTimeoutMS', 30000);

let cached = global.mongooseConnection;

if (!cached) {
  cached = global.mongooseConnection = {
    conn: null,
    promise: null,
  };
}

const getMongoUri = () => process.env.MONGO_URI || process.env.MONGODB_URI;

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = getMongoUri();
  if (!uri) {
    console.error('MONGO_URI is missing');
    throw new Error('MONGO_URI is not defined');
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('MongoDB connected');
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

module.exports = connectDB;
