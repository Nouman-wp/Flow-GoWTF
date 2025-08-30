const mongoose = require('mongoose');

// MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true,
  w: 'majority'
};

// MongoDB connection string
const getConnectionString = () => {
  const {
    MONGODB_URI,
    MONGODB_HOST,
    MONGODB_PORT,
    MONGODB_DATABASE,
    MONGODB_USERNAME,
    MONGODB_PASSWORD
  } = process.env;

  // If full URI is provided, use it
  if (MONGODB_URI) {
    return MONGODB_URI;
  }

  // Build connection string from individual components
  let connectionString = 'mongodb://';
  
  if (MONGODB_USERNAME && MONGODB_PASSWORD) {
    connectionString += `${MONGODB_USERNAME}:${MONGODB_PASSWORD}@`;
  }
  
  connectionString += `${MONGODB_HOST || 'localhost'}:${MONGODB_PORT || 27017}/${MONGODB_DATABASE || 'aniverse'}`;
  
  // Add query parameters for MongoDB Atlas
  if (MONGODB_HOST && MONGODB_HOST.includes('mongodb.net')) {
    connectionString += '?retryWrites=true&w=majority';
  }
  
  return connectionString;
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const connectionString = getConnectionString();
    
    console.log('🔌 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(connectionString, options);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('🎯 Mongoose connected to MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose disconnected from MongoDB');
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔄 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Disconnect from MongoDB
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
};

// Get connection status
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    state: states[mongoose.connection.readyState],
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
};

// Health check
const healthCheck = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Test the connection with a simple operation
      await mongoose.connection.db.admin().ping();
      return { status: 'healthy', message: 'Database connection is working' };
    } else {
      return { status: 'unhealthy', message: 'Database connection is not ready' };
    }
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
};

// Create indexes for all models
const createIndexes = async () => {
  try {
    console.log('📊 Creating database indexes...');
    
    // Import all models to ensure they're registered
    require('../models/User');
    require('../models/NFT');
    require('../models/Collection');
    require('../models/Game');
    require('../models/Betting');
    require('../models/UserBet');
    require('../models/RedemptionCode');
    require('../models/UserRedemption');
    
    // Create indexes for all models
    await Promise.all([
      mongoose.model('User').createIndexes(),
      mongoose.model('NFT').createIndexes(),
      mongoose.model('Collection').createIndexes(),
      mongoose.model('Game').createIndexes(),
      mongoose.model('Betting').createIndexes(),
      mongoose.model('UserBet').createIndexes(),
      mongoose.model('RedemptionCode').createIndexes(),
      mongoose.model('UserRedemption').createIndexes()
    ]);
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
  }
};

// Initialize database with sample data (for development)
const initializeSampleData = async () => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🚀 Initializing sample data...');
      
      // Check if sample data already exists
      const User = mongoose.model('User');
      const existingUsers = await User.countDocuments();
      
      if (existingUsers === 0) {
        console.log('📝 Creating sample users...');
        
        // Create sample admin user
        const adminUser = new User({
          username: 'admin',
          email: 'admin@aniverse.com',
          flowWalletAddress: '0x1234567890abcdef',
          isAdmin: true,
          isWhitelisted: true,
          preferences: {
            theme: 'dark',
            notifications: true,
            language: 'en'
          }
        });
        
        await adminUser.save();
        console.log('✅ Sample admin user created');
      }
      
      console.log('✅ Sample data initialization completed');
    }
  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  healthCheck,
  createIndexes,
  initializeSampleData
};
