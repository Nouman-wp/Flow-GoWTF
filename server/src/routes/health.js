const express = require('express');
const router = express.Router();
const { getConnectionStatus, healthCheck } = require('../config/database');
const flowConfig = require('../config/flow');
const pinataService = require('../config/pinata');

// GET /api/health - Basic health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Aniverse Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// GET /api/health/detailed - Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const healthStatus = {
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {}
    };

    // Database health check
    try {
      const dbHealth = await healthCheck();
      healthStatus.services.database = {
        status: dbHealth.status,
        message: dbHealth.message,
        connection: getConnectionStatus()
      };
    } catch (error) {
      healthStatus.services.database = {
        status: 'error',
        message: error.message,
        connection: getConnectionStatus()
      };
    }

    // Flow blockchain health check
    try {
      const flowHealth = await flowConfig.getNetworkStats();
      healthStatus.services.flow = {
        status: flowHealth.status,
        network: flowHealth.network,
        contracts: flowHealth.contracts,
        configuration: flowConfig.validateConfiguration()
      };
    } catch (error) {
      healthStatus.services.flow = {
        status: 'error',
        message: error.message,
        configuration: flowConfig.validateConfiguration()
      };
    }

    // Pinata IPFS health check
    try {
      const pinataHealth = await pinataService.testConnection();
      healthStatus.services.ipfs = {
        status: pinataHealth.success ? 'healthy' : 'unhealthy',
        message: pinataHealth.message,
        configured: pinataService.isConfigured
      };
    } catch (error) {
      healthStatus.services.ipfs = {
        status: 'error',
        message: error.message,
        configured: pinataService.isConfigured
      };
    }

    // System resources
    healthStatus.services.system = {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    };

    // Overall health status
    const allServices = Object.values(healthStatus.services);
    const healthyServices = allServices.filter(service => 
      service.status === 'healthy' || service.status === 'connected'
    );
    
    healthStatus.overall = {
      status: healthyServices.length === allServices.length ? 'healthy' : 'degraded',
      healthyServices: healthyServices.length,
      totalServices: allServices.length,
      healthPercentage: Math.round((healthyServices.length / allServices.length) * 100)
    };

    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/health/readiness - Readiness probe for Kubernetes
router.get('/readiness', async (req, res) => {
  try {
    // Check if database is connected
    const dbStatus = getConnectionStatus();
    if (dbStatus.state !== 'connected') {
      return res.status(503).json({
        success: false,
        status: 'not_ready',
        message: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }

    // Check if Flow configuration is valid
    const flowValidation = flowConfig.validateConfiguration();
    if (!flowValidation.isValid) {
      return res.status(503).json({
        success: false,
        status: 'not_ready',
        message: 'Flow configuration invalid',
        errors: flowValidation.errors,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      status: 'ready',
      message: 'Service is ready to accept traffic',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'not_ready',
      message: 'Readiness check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/health/liveness - Liveness probe for Kubernetes
router.get('/liveness', (req, res) => {
  res.json({
    success: true,
    status: 'alive',
    message: 'Service is alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /api/health/status - Service status overview
router.get('/status', async (req, res) => {
  try {
    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Database status
    const dbStatus = getConnectionStatus();
    status.services.database = {
      status: dbStatus.state === 'connected' ? 'online' : 'offline',
      host: dbStatus.host,
      database: dbStatus.name
    };

    // Flow status
    const flowInfo = flowConfig.getNetworkInfo();
    status.services.flow = {
      status: 'configured',
      network: flowInfo.name,
      accessNode: flowInfo.accessNode,
      contracts: Object.keys(flowInfo.contracts).length
    };

    // IPFS status
    status.services.ipfs = {
      status: pinataService.isConfigured ? 'configured' : 'not_configured',
      provider: 'Pinata'
    };

    // Overall status
    const onlineServices = Object.values(status.services).filter(
      service => service.status === 'online' || service.status === 'configured'
    ).length;
    
    status.overall = {
      status: onlineServices === Object.keys(status.services).length ? 'operational' : 'degraded',
      onlineServices,
      totalServices: Object.keys(status.services).length
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
