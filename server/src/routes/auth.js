const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { fcl } = require('../utils/flow');

const router = express.Router();

// Flow wallet connection and user creation
router.post('/flow-connect', [
  body('flowWalletAddress')
    .isString()
    .matches(/^0x[a-fA-F0-9]{16}$/, 'Invalid Flow wallet address')
    .withMessage('Please provide a valid Flow wallet address'),
  body('username')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { flowWalletAddress, username, email } = req.body;

    // Check if user already exists
    let user = await User.findByWalletAddress(flowWalletAddress);
    
    if (user) {
      // User exists, update last active and return token
      await user.updateLastActive();
      
      const token = jwt.sign(
        { userId: user._id, flowWalletAddress: user.flowWalletAddress },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Wallet connected successfully',
        user: {
          id: user._id,
          username: user.username,
          flowWalletAddress: user.flowWalletAddress,
          profileImage: user.profileImage,
          isAdmin: user.isAdmin,
          isWhitelisted: user.isWhitelisted
        },
        token
      });
    }

    // Create new user
    const userData = {
      flowWalletAddress,
      username: username || `User_${flowWalletAddress.slice(-6)}`,
      email: email || null
    };

    user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, flowWalletAddress: user.flowWalletAddress },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created and wallet connected successfully',
      user: {
        id: user._id,
        username: user.username,
        flowWalletAddress: user.flowWalletAddress,
        profileImage: user.profileImage,
        isAdmin: user.isAdmin,
        isWhitelisted: user.isWhitelisted
      },
      token
    });

  } catch (error) {
    console.error('Flow connect error:', error);
    res.status(500).json({ 
      error: 'Failed to connect wallet',
      message: error.message 
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-__v')
      .populate('nftCollections', 'name description image')
      .populate('ownedNFTs', 'name image rarity collectionName');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        flowWalletAddress: user.flowWalletAddress,
        profileImage: user.profileImage,
        bio: user.bio,
        isAdmin: user.isAdmin,
        isWhitelisted: user.isWhitelisted,
        nftCollections: user.nftCollections,
        ownedNFTs: user.ownedNFTs,
        bettingHistory: user.bettingHistory,
        gameStats: user.gameStats,
        preferences: user.preferences,
        lastActive: user.lastActive,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      error: 'Failed to get user profile',
      message: error.message 
    });
  }
});

// Update user profile
router.put('/profile', [
  authenticateToken,
  body('username')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('bio')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { username, email, bio, preferences } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        flowWalletAddress: user.flowWalletAddress,
        profileImage: user.profileImage,
        bio: user.bio,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      message: error.message 
    });
  }
});

// Update user preferences
router.put('/preferences', [
  authenticateToken,
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark'),
  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { theme, notifications } = req.body;
    const updateData = {};

    if (theme) updateData['preferences.theme'] = theme;
    if (notifications?.email !== undefined) updateData['preferences.notifications.email'] = notifications.email;
    if (notifications?.push !== undefined) updateData['preferences.notifications.push'] = notifications.push;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ 
      error: 'Failed to update preferences',
      message: error.message 
    });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Update last active timestamp
    await User.findByIdAndUpdate(req.user.userId, {
      lastActive: new Date()
    });

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Failed to logout',
      message: error.message 
    });
  }
});

// Get user by wallet address (public)
router.get('/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!/^0x[a-fA-F0-9]{16}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Flow wallet address' });
    }

    const user = await User.findByWalletAddress(address)
      .select('username profileImage bio nftCollections ownedNFTs gameStats createdAt')
      .populate('nftCollections', 'name description image')
      .populate('ownedNFTs', 'name image rarity collectionName');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user by wallet error:', error);
    res.status(500).json({ 
      error: 'Failed to get user',
      message: error.message 
    });
  }
});

// Admin: Get all users (admin only)
router.get('/admin/users', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await User.find()
      .select('username email flowWalletAddress isAdmin isWhitelisted createdAt lastActive')
      .sort({ createdAt: -1 });

    res.json({ users });

  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ 
      error: 'Failed to get users',
      message: error.message 
    });
  }
});

// Admin: Update user whitelist status
router.put('/admin/whitelist/:userId', [
  authenticateToken,
  body('isWhitelisted')
    .isBoolean()
    .withMessage('isWhitelisted must be a boolean')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const adminUser = await User.findById(req.user.userId);
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { isWhitelisted } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isWhitelisted },
      { new: true }
    ).select('username email isWhitelisted');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User whitelist status updated successfully',
      user
    });

  } catch (error) {
    console.error('Admin update whitelist error:', error);
    res.status(500).json({ 
      error: 'Failed to update whitelist status',
      message: error.message 
    });
  }
});

module.exports = router;
