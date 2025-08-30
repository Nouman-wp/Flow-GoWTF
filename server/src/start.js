const app = require('./index');
const { connectDB, createIndexes, initializeSampleData } = require('./config/database');
const flowConfig = require('./config/flow');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('🚀 Starting Aniverse Server...');
    
    // Connect to MongoDB
    console.log('📊 Connecting to database...');
    await connectDB();
    
    // Create database indexes
    console.log('🔍 Creating database indexes...');
    await createIndexes();
    
    // Initialize sample data (development only)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🎨 Initializing sample data...');
      await initializeSampleData();
    }
    
    // Validate Flow configuration
    console.log('🔗 Validating Flow configuration...');
    const flowValidation = flowConfig.validateConfiguration();
    if (!flowValidation.isValid) {
      console.warn('⚠️ Flow configuration validation failed:');
      flowValidation.errors.forEach(error => console.warn(`  - ${error}`));
    } else {
      console.log('✅ Flow configuration validated');
    }
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🎉 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Local: http://localhost:${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/api/health`);
      console.log(`🔍 API Docs: http://localhost:${PORT}/api/docs`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🔄 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🔄 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
