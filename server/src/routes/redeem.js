const express = require('express');
const router = express.Router();
const { authenticateToken, requireWhitelist, requireAdmin } = require('../middleware/auth');

// Mock redemption codes data - replace with actual database queries
const mockRedemptionCodes = [
  {
    id: 'ANIME2024',
    code: 'ANIME2024',
    description: 'Limited edition anime character NFT collection',
    nftTemplate: {
      name: 'Anime Character 2024',
      description: 'Exclusive limited edition anime character NFT',
      image: 'https://via.placeholder.com/400x400/10b981/ffffff?text=Anime+2024',
      attributes: {
        rarity: 'legendary',
        series: 'Limited Collection 2024',
        edition: '1 of 1000'
      },
      collection: 'limited-anime-2024'
    },
    maxRedemptions: 1000,
    currentRedemptions: 156,
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    requirements: {
      minBalance: 0,
      minNFTs: 0,
      whitelistOnly: false
    },
    rewards: {
      nft: true,
      tokens: 50,
      bonus: 'early_access'
    }
  },
  {
    id: 'BETA_USER',
    code: 'BETA_USER',
    description: 'Beta tester reward - exclusive beta user NFT',
    nftTemplate: {
      name: 'Beta Tester Badge',
      description: 'Special NFT for early beta testers',
      image: 'https://via.placeholder.com/400x400/10b981/ffffff?text=Beta+Badge',
      attributes: {
        rarity: 'epic',
        series: 'Beta Tester Collection',
        edition: '1 of 500'
      },
      collection: 'beta-tester'
    },
    maxRedemptions: 500,
    currentRedemptions: 500,
    isActive: false,
    expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Expired 7 days ago
    requirements: {
      minBalance: 0,
      minNFTs: 0,
      whitelistOnly: true
    },
    rewards: {
      nft: true,
      tokens: 100,
      bonus: 'beta_tester_role'
    }
  },
  {
    id: 'FIRST_MINT',
    code: 'FIRST_MINT',
    description: 'First mint celebration - commemorative NFT',
    nftTemplate: {
      name: 'First Mint Celebration',
      description: 'Celebrate your first NFT mint on Aniverse',
      image: 'https://via.placeholder.com/400x400/10b981/ffffff?text=First+Mint',
      attributes: {
        rarity: 'rare',
        series: 'Celebration Collection',
        edition: '1 of 10000'
      },
      collection: 'celebration'
    },
    maxRedemptions: 10000,
    currentRedemptions: 2341,
    isActive: true,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    requirements: {
      minBalance: 0,
      minNFTs: 1,
      whitelistOnly: false
    },
    rewards: {
      nft: true,
      tokens: 25,
      bonus: null
    }
  }
];

// Mock user redemption history
const mockUserRedemptions = {
  'user1': [
    {
      id: 'redemption1',
      codeId: 'ANIME2024',
      code: 'ANIME2024',
      redeemedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      nftMinted: {
        tokenId: 'nft123',
        flowTokenId: 'flow123',
        name: 'Anime Character 2024'
      },
      rewards: {
        nft: true,
        tokens: 50,
        bonus: 'early_access'
      }
    }
  ]
};

// GET /api/redeem/codes - List available redemption codes
router.get('/codes', authenticateToken, (req, res) => {
  try {
    const { isActive, category } = req.query;
    
    let filteredCodes = mockRedemptionCodes;
    
    if (isActive !== undefined) {
      filteredCodes = filteredCodes.filter(code => code.isActive === (isActive === 'true'));
    }
    
    if (category) {
      filteredCodes = filteredCodes.filter(code => code.nftTemplate.collection === category);
    }
    
    // Filter out expired codes
    filteredCodes = filteredCodes.filter(code => code.expiresAt > new Date());
    
    res.json({
      success: true,
      data: {
        codes: filteredCodes.map(code => ({
          id: code.id,
          code: code.code,
          description: code.description,
          nftTemplate: {
            name: code.nftTemplate.name,
            description: code.nftTemplate.description,
            image: code.nftTemplate.image,
            attributes: code.nftTemplate.attributes,
            collection: code.nftTemplate.collection
          },
          maxRedemptions: code.maxRedemptions,
          currentRedemptions: code.currentRedemptions,
          isActive: code.isActive,
          expiresAt: code.expiresAt,
          requirements: code.requirements,
          rewards: code.rewards,
          remainingRedemptions: code.maxRedemptions - code.currentRedemptions
        })),
        total: filteredCodes.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch redemption codes',
      error: error.message
    });
  }
});

// GET /api/redeem/codes/:codeId - Get specific redemption code details
router.get('/codes/:codeId', authenticateToken, (req, res) => {
  try {
    const { codeId } = req.params;
    const code = mockRedemptionCodes.find(c => c.id === codeId);
    
    if (!code) {
      return res.status(404).json({
        success: false,
        message: 'Redemption code not found'
      });
    }
    
    // Check if user has already redeemed this code
    const { userId } = req.user;
    const userRedemption = mockUserRedemptions[userId]?.find(r => r.codeId === codeId);
    
    res.json({
      success: true,
      data: {
        code: {
          id: code.id,
          code: code.code,
          description: code.description,
          nftTemplate: code.nftTemplate,
          maxRedemptions: code.maxRedemptions,
          currentRedemptions: code.currentRedemptions,
          isActive: code.isActive,
          expiresAt: code.expiresAt,
          requirements: code.requirements,
          rewards: code.rewards,
          remainingRedemptions: code.maxRedemptions - code.currentRedemptions
        },
        userRedemption: userRedemption ? {
          redeemedAt: userRedemption.redeemedAt,
          nftMinted: userRedemption.nftMinted
        } : null,
        canRedeem: !userRedemption && code.isActive && code.expiresAt > new Date() && 
                   code.currentRedemptions < code.maxRedemptions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch redemption code details',
      error: error.message
    });
  }
});

// POST /api/redeem/codes/:codeId/redeem - Redeem a code
router.post('/codes/:codeId/redeem', authenticateToken, requireWhitelist, (req, res) => {
  try {
    const { codeId } = req.params;
    const { userId } = req.user;
    
    const code = mockRedemptionCodes.find(c => c.id === codeId);
    
    if (!code) {
      return res.status(404).json({
        success: false,
        message: 'Redemption code not found'
      });
    }
    
    // Check if code is active
    if (!code.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Redemption code is not active'
      });
    }
    
    // Check if code has expired
    if (code.expiresAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Redemption code has expired'
      });
    }
    
    // Check if code has reached max redemptions
    if (code.currentRedemptions >= code.maxRedemptions) {
      return res.status(400).json({
        success: false,
        message: 'Redemption code has reached maximum redemptions'
      });
    }
    
    // Check if user has already redeemed this code
    const existingRedemption = mockUserRedemptions[userId]?.find(r => r.codeId === codeId);
    if (existingRedemption) {
      return res.status(400).json({
        success: false,
        message: 'You have already redeemed this code'
      });
    }
    
    // Check requirements
    if (code.requirements.whitelistOnly && !req.user.isWhitelisted) {
      return res.status(403).json({
        success: false,
        message: 'This code requires whitelist access'
      });
    }
    
    // TODO: Implement actual NFT minting on Flow blockchain
    // This would use the Flow utilities to mint the NFT
    
    // Mock NFT minting response
    const mintedNFT = {
      tokenId: `nft_${Date.now()}`,
      flowTokenId: `flow_${Date.now()}`,
      name: code.nftTemplate.name,
      description: code.nftTemplate.description,
      image: code.nftTemplate.image,
      attributes: code.nftTemplate.attributes,
      collection: code.nftTemplate.collection
    };
    
    // Update redemption count
    code.currentRedemptions += 1;
    
    // Add to user redemption history
    if (!mockUserRedemptions[userId]) {
      mockUserRedemptions[userId] = [];
    }
    
    mockUserRedemptions[userId].push({
      id: `redemption_${Date.now()}`,
      codeId: code.id,
      code: code.code,
      redeemedAt: new Date(),
      nftMinted: mintedNFT,
      rewards: code.rewards
    });
    
    res.json({
      success: true,
      message: 'Code redeemed successfully',
      data: {
        codeId: code.id,
        redeemedAt: new Date(),
        nftMinted: mintedNFT,
        rewards: code.rewards,
        remainingRedemptions: code.maxRedemptions - code.currentRedemptions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to redeem code',
      error: error.message
    });
  }
});

// GET /api/redeem/history - Get user's redemption history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const userRedemptions = mockUserRedemptions[userId] || [];
    
    res.json({
      success: true,
      data: {
        redemptions: userRedemptions,
        total: userRedemptions.length,
        totalRewards: userRedemptions.reduce((sum, r) => sum + (r.rewards.tokens || 0), 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch redemption history',
      error: error.message
    });
  }
});

// POST /api/redeem/codes - Create new redemption code (admin only)
router.post('/codes', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      code,
      description,
      nftTemplate,
      maxRedemptions,
      expiresAt,
      requirements,
      rewards
    } = req.body;
    
    // Validate required fields
    if (!code || !description || !nftTemplate || !maxRedemptions) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if code already exists
    const existingCode = mockRedemptionCodes.find(c => c.code === code);
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Redemption code already exists'
      });
    }
    
    // Create new redemption code
    const newCode = {
      id: `code_${Date.now()}`,
      code,
      description,
      nftTemplate,
      maxRedemptions: parseInt(maxRedemptions),
      currentRedemptions: 0,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
      requirements: requirements || {
        minBalance: 0,
        minNFTs: 0,
        whitelistOnly: false
      },
      rewards: rewards || {
        nft: true,
        tokens: 0,
        bonus: null
      }
    };
    
    mockRedemptionCodes.push(newCode);
    
    res.status(201).json({
      success: true,
      message: 'Redemption code created successfully',
      data: newCode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create redemption code',
      error: error.message
    });
  }
});

// PUT /api/redeem/codes/:codeId - Update redemption code (admin only)
router.put('/codes/:codeId', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { codeId } = req.params;
    const updates = req.body;
    
    const code = mockRedemptionCodes.find(c => c.id === codeId);
    
    if (!code) {
      return res.status(404).json({
        success: false,
        message: 'Redemption code not found'
      });
    }
    
    // Update allowed fields
    if (updates.description !== undefined) code.description = updates.description;
    if (updates.isActive !== undefined) code.isActive = updates.isActive;
    if (updates.expiresAt !== undefined) code.expiresAt = new Date(updates.expiresAt);
    if (updates.maxRedemptions !== undefined) code.maxRedemptions = parseInt(updates.maxRedemptions);
    if (updates.requirements !== undefined) code.requirements = { ...code.requirements, ...updates.requirements };
    if (updates.rewards !== undefined) code.rewards = { ...code.rewards, ...updates.rewards };
    
    res.json({
      success: true,
      message: 'Redemption code updated successfully',
      data: code
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update redemption code',
      error: error.message
    });
  }
});

// DELETE /api/redeem/codes/:codeId - Delete redemption code (admin only)
router.delete('/codes/:codeId', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { codeId } = req.params;
    
    const codeIndex = mockRedemptionCodes.findIndex(c => c.id === codeId);
    
    if (codeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Redemption code not found'
      });
    }
    
    // Check if code has been used
    if (mockRedemptionCodes[codeIndex].currentRedemptions > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete code that has been used'
      });
    }
    
    mockRedemptionCodes.splice(codeIndex, 1);
    
    res.json({
      success: true,
      message: 'Redemption code deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete redemption code',
      error: error.message
    });
  }
});

module.exports = router;
