const mongoose = require('mongoose');

const userRedemptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  redemptionCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RedemptionCode',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  redeemedAt: {
    type: Date,
    default: Date.now
  },
  nftMinted: {
    tokenId: {
      type: String,
      required: true
    },
    flowTokenId: String,
    name: {
      type: String,
      required: true
    },
    description: String,
    image: String,
    attributes: {
      rarity: String,
      series: String,
      season: String,
      year: Number,
      edition: String,
      power: Number,
      level: Number
    },
    collection: String,
    metadata: {
      ipfsHash: String,
      externalUrl: String,
      traits: [{
        trait_type: String,
        value: String
      }]
    }
  },
  rewards: {
    nft: {
      type: Boolean,
      default: true
    },
    tokens: {
      type: Number,
      default: 0
    },
    bonus: {
      type: String,
      enum: ['early_access', 'beta_tester_role', 'vip_status', 'special_badge', null],
      default: null
    },
    experience: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['pending', 'minted', 'failed', 'cancelled'],
    default: 'pending'
  },
  blockchain: {
    transactionHash: String,
    blockNumber: Number,
    gasUsed: Number,
    error: String
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceInfo: String,
    location: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for redemption age
userRedemptionSchema.virtual('redemptionAge').get(function() {
  const now = new Date();
  return Math.floor((now - this.redeemedAt) / (1000 * 60 * 60 * 24));
});

// Virtual for is recent
userRedemptionSchema.virtual('isRecent').get(function() {
  return this.redemptionAge <= 7; // Within 7 days
});

// Indexes for better query performance
userRedemptionSchema.index({ user: 1 });
userRedemptionSchema.index({ redemptionCode: 1 });
userRedemptionSchema.index({ code: 1 });
userRedemptionSchema.index({ status: 1 });
userRedemptionSchema.index({ redeemedAt: -1 });
userRedemptionSchema.index({ user: 1, status: 1 });
userRedemptionSchema.index({ 'nftMinted.collection': 1 });
userRedemptionSchema.index({ 'nftMinted.attributes.rarity': 1 });

// Compound index for user redemptions on specific codes
userRedemptionSchema.index({ user: 1, redemptionCode: 1 });

// Static method to find user's redemptions
userRedemptionSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.collection) {
    query['nftMinted.collection'] = options.collection;
  }
  
  return this.find(query)
    .populate('redemptionCode')
    .sort(options.sort || { redeemedAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to find redemptions by code
userRedemptionSchema.statics.findByCode = function(codeId, options = {}) {
  const query = { redemptionCode: codeId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('user', 'username flowWalletAddress')
    .sort(options.sort || { redeemedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to find successful redemptions
userRedemptionSchema.statics.findSuccessful = function(options = {}) {
  const query = { status: 'minted' };
  
  if (options.collection) {
    query['nftMinted.collection'] = options.collection;
  }
  
  if (options.rarity) {
    query['nftMinted.attributes.rarity'] = options.rarity;
  }
  
  return this.find(query)
    .populate('user', 'username flowWalletAddress')
    .populate('redemptionCode')
    .sort(options.sort || { redeemedAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to find pending redemptions
userRedemptionSchema.statics.findPending = function() {
  return this.find({ status: 'pending' })
    .populate('user', 'username flowWalletAddress')
    .populate('redemptionCode')
    .sort({ redeemedAt: 1 });
};

// Static method to calculate user redemption statistics
userRedemptionSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalRedemptions: { $sum: 1 },
        successfulRedemptions: {
          $sum: { $cond: [{ $eq: ['$status', 'minted'] }, 1, 0] }
        },
        failedRedemptions: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        pendingRedemptions: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        totalTokensEarned: { $sum: '$rewards.tokens' },
        totalExperienceEarned: { $sum: '$rewards.experience' },
        uniqueCollections: { $addToSet: '$nftMinted.collection' }
      }
    }
  ]);
};

// Static method to calculate collection statistics
userRedemptionSchema.statics.getCollectionStats = function(collection) {
  return this.aggregate([
    { $match: { 'nftMinted.collection': collection, status: 'minted' } },
    {
      $group: {
        _id: null,
        totalMinted: { $sum: 1 },
        rarityDistribution: {
          $push: '$nftMinted.attributes.rarity'
        },
        totalTokensEarned: { $sum: '$rewards.tokens' },
        totalExperienceEarned: { $sum: '$rewards.experience' }
      }
    }
  ]);
}

// Static method to find recent redemptions
userRedemptionSchema.statics.findRecent = function(days = 7, limit = 20) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.find({
    redeemedAt: { $gte: cutoffDate }
  })
  .populate('user', 'username flowWalletAddress')
  .populate('redemptionCode')
  .sort({ redeemedAt: -1 })
  .limit(limit);
};

// Instance method to mark as minted
userRedemptionSchema.methods.markAsMinted = function(blockchainData) {
  this.status = 'minted';
  this.blockchain = {
    ...this.blockchain,
    ...blockchainData
  };
  
  return this.save();
};

// Instance method to mark as failed
userRedemptionSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.blockchain.error = error;
  
  return this.save();
};

// Instance method to cancel redemption
userRedemptionSchema.methods.cancel = function(reason = 'User cancelled') {
  this.status = 'cancelled';
  
  return this.save();
};

// Instance method to retry minting
userRedemptionSchema.methods.retryMinting = function() {
  if (this.status !== 'failed') {
    throw new Error('Only failed redemptions can be retried');
  }
  
  this.status = 'pending';
  this.blockchain.error = undefined;
  
  return this.save();
};

// Instance method to get NFT metadata
userRedemptionSchema.methods.getNFTMetadata = function() {
  return {
    name: this.nftMinted.name,
    description: this.nftMinted.description,
    image: this.nftMinted.image,
    attributes: this.nftMinted.attributes,
    collection: this.nftMinted.collection,
    metadata: this.nftMinted.metadata
  };
};

// Instance method to check if NFT was successfully minted
userRedemptionSchema.methods.isSuccessfullyMinted = function() {
  return this.status === 'minted' && this.blockchain.transactionHash;
};

// Instance method to get blockchain transaction info
userRedemptionSchema.methods.getTransactionInfo = function() {
  if (!this.blockchain.transactionHash) {
    return null;
  }
  
  return {
    transactionHash: this.blockchain.transactionHash,
    blockNumber: this.blockchain.blockNumber,
    gasUsed: this.blockchain.gasUsed,
    error: this.blockchain.error
  };
};

module.exports = mongoose.model('UserRedemption', userRedemptionSchema);
