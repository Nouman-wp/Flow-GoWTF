const express = require('express');
// express-validator already imported above
const NFT = require('../models/NFT');
const Collection = require('../models/Collection');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { fcl } = require('../utils/flow');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all NFT collections (from Collection model)
router.get('/collections', async (req, res) => {
  try {
    const collections = await Collection.find()
      .select('name description image banner creator category tags attributes supply pricing status visibility metadata statistics')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ collections });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ 
      error: 'Failed to get collections',
      message: error.message 
    });
  }
});

// Get collection by ID (details)
router.get('/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findById(id)
      .select('-__v')
      .lean();
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    res.json({ collection });
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({ 
      error: 'Failed to get collection',
      message: error.message 
    });
  }
});

// Get NFTs by collection ID (paginated)
router.get('/collections/:id/nfts', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, sortBy = 'mintDate', sortOrder = 'desc' } = req.query;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const nfts = await NFT.find({ collection: id })
      .populate('owner', 'username profileImage')
      .populate('creator', 'username profileImage')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await NFT.countDocuments({ collection: id });

    res.json({
      nfts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get collection NFTs error:', error);
    res.status(500).json({ 
      error: 'Failed to get collection NFTs',
      message: error.message 
    });
  }
});

// Featured NFTs (simple: top for-sale by price)
router.get('/featured', async (req, res) => {
  try {
    const n = parseInt(req.query.limit || '12');
    const nfts = await NFT.find({ isForSale: true })
      .sort({ salePrice: -1 })
      .limit(n)
      .lean();
    res.json({ nfts });
  } catch (error) {
    console.error('Get featured NFTs error:', error);
    res.status(500).json({ 
      error: 'Failed to get featured NFTs',
      message: error.message 
    });
  }
});

// Get NFT by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const nft = await NFT.findById(id)
      .populate('owner', 'username profileImage')
      .populate('creator', 'username profileImage')
      .populate('collection', 'name description');

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Increment views
    await nft.incrementViews();

    res.json({ nft });
  } catch (error) {
    console.error('Get NFT error:', error);
    res.status(500).json({ 
      error: 'Failed to get NFT',
      message: error.message 
    });
  }
});

// Search NFTs
router.get('/search', async (req, res) => {
  try {
    const { q, collection, rarity, isForSale, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const skip = (page - 1) * limit;
    const searchQuery = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };

    if (collection) searchQuery.collection = collection;
    if (rarity) searchQuery.rarity = rarity;
    if (isForSale !== undefined) searchQuery.isForSale = isForSale === 'true';

    const nfts = await NFT.find(searchQuery)
      .populate('owner', 'username profileImage')
      .populate('collection', 'name')
      .sort({ mintDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await NFT.countDocuments(searchQuery);

    res.json({
      nfts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search NFTs error:', error);
    res.status(500).json({ 
      error: 'Failed to search NFTs',
      message: error.message 
    });
  }
});

// Get NFTs for sale
router.get('/for-sale', async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'salePrice', sortOrder = 'asc' } = req.query;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const nfts = await NFT.find({ isForSale: true })
      .populate('owner', 'username profileImage')
      .populate('collection', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await NFT.countDocuments({ isForSale: true });

    res.json({
      nfts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get NFTs for sale error:', error);
    res.status(500).json({ 
      error: 'Failed to get NFTs for sale',
      message: error.message 
    });
  }
});

// Get NFTs by owner
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (page - 1) * limit;

    // If ownerId looks like a Mongo ObjectId, query by user ObjectId; otherwise, lookup by wallet address
    let ownerQuery;
    if (/^[a-fA-F0-9]{24}$/.test(ownerId)) {
      ownerQuery = { owner: ownerId };
    } else {
      // Find user by wallet address, then query by their _id
      const User = require('../models/User');
      const user = await User.findOne({ flowWalletAddress: ownerId });
      ownerQuery = user ? { owner: user._id } : { owner: null };
    }

    const nfts = await NFT.find(ownerQuery)
      .populate('collection', 'name')
      .sort({ mintDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await NFT.countDocuments({ owner: ownerId });

    res.json({
      nfts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get NFTs by owner error:', error);
    res.status(500).json({ 
      error: 'Failed to get NFTs by owner',
      message: error.message 
    });
  }
});

// Verify payment and mint to buyer (server mints)
router.post('/purchase', [
  authenticateToken,
  body('nftId').isMongoId(),
  body('flowTxId').isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { nftId, flowTxId } = req.body;
    const NFTModel = require('../models/NFT');
    const nft = await NFTModel.findById(nftId);
    if (!nft) return res.status(404).json({ error: 'NFT not found' });
    if (!nft.isForSale) return res.status(400).json({ error: 'NFT is not for sale' });

    // Verify tx paid treasury at least price
    const treasury = process.env.TREASURY_ADDRESS;
    const tx = await fcl.tx(flowTxId).onceSealed();
    const deposits = tx.events.filter(e => e.type.includes('A.7e60df042a9c0868.FlowToken.TokensDeposited'));
    const paidToTreasury = deposits.some(e => e.data.to === treasury && parseFloat(e.data.amount) >= nft.salePrice);
    if (!paidToTreasury) return res.status(400).json({ error: 'Payment not verified' });

    // Mark sold to user
    nft.owner = req.user.userId;
    nft.isForSale = false;
    await nft.save();

    res.json({ message: 'Purchase verified and recorded', nft });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Failed to complete purchase', message: error.message });
  }
});

// Mint new NFT (admin only)
router.post('/mint', [
  authenticateToken,
  requireAdmin,
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('description').isString().trim().isLength({ min: 1, max: 1000 }),
  body('image').isString(),
  body('externalURL').optional().isURL(),
  body('attributes').isArray(),
  body('collection').isMongoId(),
  body('rarity').isIn(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']),
  body('recipientAddress').isString().matches(/^0x[a-fA-F0-9]{16}$/),
  body('metadata.ipfsHash').isString(),
  body('metadata.metadataURL').isString()
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

    const {
      name,
      description,
      image,
      externalURL,
      attributes,
      collection,
      rarity,
      recipientAddress,
      metadata
    } = req.body;

    // Mint NFT on Flow blockchain
    const flowTransaction = await flowUtils.mintNFT(
      name,
      description,
      image,
      externalURL,
      attributes,
      collection,
      rarity,
      recipientAddress,
      req.user.flowWalletAddress
    );

    // Create NFT in database
    const nft = new NFT({
      name,
      description,
      image,
      externalURL,
      attributes,
      collection,
      rarity,
      creator: req.user.userId,
      owner: recipientAddress,
      flowContractAddress: process.env.FLOW_CONTRACT_ADDRESS,
      flowTokenId: flowTransaction.id,
      metadata,
      tokenId: `ANV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    await nft.save();

    // Add blockchain event
    await nft.addBlockchainEvent('mint', {
      transactionHash: flowTransaction.transactionId,
      blockNumber: flowTransaction.blockHeight,
      gasUsed: flowTransaction.gasUsed
    });

    res.status(201).json({
      message: 'NFT minted successfully',
      nft
    });

  } catch (error) {
    console.error('Mint NFT error:', error);
    res.status(500).json({ 
      error: 'Failed to mint NFT',
      message: error.message 
    });
  }
});

// Toggle NFT like
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const nft = await NFT.findById(id);
    
    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    await nft.toggleLike(req.user.userId);

    res.json({
      message: 'Like toggled successfully',
      likeCount: nft.likeCount
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ 
      error: 'Failed to toggle like',
      message: error.message 
    });
  }
});

// Update NFT sale status
router.put('/:id/sale', [
  authenticateToken,
  body('isForSale').isBoolean(),
  body('salePrice').optional().isNumeric(),
  body('saleCurrency').optional().isIn(['FLOW', 'USD', 'USDC'])
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

    const { id } = req.params;
    const { isForSale, salePrice, saleCurrency } = req.body;

    const nft = await NFT.findById(id);
    
    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Check ownership
    if (nft.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this NFT' });
    }

    await nft.updateSaleStatus(isForSale, salePrice, saleCurrency);

    res.json({
      message: 'Sale status updated successfully',
      nft
    });

  } catch (error) {
    console.error('Update sale status error:', error);
    res.status(500).json({ 
      error: 'Failed to update sale status',
      message: error.message 
    });
  }
});

// Transfer NFT
router.post('/transfer', [
  authenticateToken,
  body('nftId').isMongoId(),
  body('recipientAddress').isString().matches(/^0x[a-fA-F0-9]{16}$/)
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

    const { nftId, recipientAddress } = req.body;

    const nft = await NFT.findById(nftId);
    
    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Check ownership
    if (nft.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to transfer this NFT' });
    }

    // Transfer on Flow blockchain
    const flowTransaction = await flowUtils.transferNFT(
      nft.flowTokenId,
      req.user.flowWalletAddress,
      recipientAddress
    );

    // Update ownership in database
    await nft.transfer(recipientAddress);

    // Add blockchain event
    await nft.addBlockchainEvent('transfer', {
      transactionHash: flowTransaction.transactionId,
      blockNumber: flowTransaction.blockHeight,
      gasUsed: flowTransaction.gasUsed,
      from: req.user.flowWalletAddress,
      to: recipientAddress
    });

    res.json({
      message: 'NFT transferred successfully',
      nft
    });

  } catch (error) {
    console.error('Transfer NFT error:', error);
    res.status(500).json({ 
      error: 'Failed to transfer NFT',
      message: error.message 
    });
  }
});

module.exports = router;

