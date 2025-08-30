const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User no longer exists' 
      });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      flowWalletAddress: decoded.flowWalletAddress
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please login again' 
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: 'An error occurred during authentication' 
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login to access this resource' 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'You do not have permission to access this resource' 
      });
    }

    next();

  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ 
      error: 'Authorization check failed',
      message: 'An error occurred during authorization check' 
    });
  }
};

// Middleware to check if user is whitelisted
const requireWhitelist = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login to access this resource' 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user || !user.isWhitelisted) {
      return res.status(403).json({ 
        error: 'Whitelist access required',
        message: 'This feature is only available to whitelisted users' 
      });
    }

    next();

  } catch (error) {
    console.error('Whitelist check error:', error);
    res.status(500).json({ 
      error: 'Authorization check failed',
      message: 'An error occurred during authorization check' 
    });
  }
};

// Middleware to check if user owns the resource
const requireOwnership = (resourceField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please login to access this resource' 
        });
      }

      const resourceId = req.params[resourceField] || req.body[resourceField];
      if (!resourceId) {
        return res.status(400).json({ 
          error: 'Resource ID required',
          message: 'Please provide a valid resource ID' 
        });
      }

      // Check if user owns the resource or is admin
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(401).json({ 
          error: 'User not found',
          message: 'User no longer exists' 
        });
      }

      if (user.isAdmin) {
        return next(); // Admin can access any resource
      }

      // Check ownership (this is a generic check - specific routes may need custom logic)
      if (req.user.userId !== resourceId.toString()) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only access your own resources' 
        });
      }

      next();

    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ 
        error: 'Authorization check failed',
        message: 'An error occurred during authorization check' 
      });
    }
  };
};

// Middleware to optionally authenticate (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (user) {
          req.user = {
            userId: decoded.userId,
            flowWalletAddress: decoded.flowWalletAddress
          };
        }
      } catch (error) {
        // Token is invalid, but we don't fail the request
        console.warn('Invalid token in optional auth:', error.message);
      }
    }

    next();

  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue without authentication
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireWhitelist,
  requireOwnership,
  optionalAuth
};
