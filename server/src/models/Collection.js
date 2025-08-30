const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  image: {
    type: String,
    required: true
  },
  banner: {
    type: String
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['anime', 'gaming', 'art', 'collectibles', 'limited', 'promotional']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  attributes: {
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
      default: 'common'
    },
    series: String,
    season: String,
    year: Number,
    edition: String
  },
  supply: {
    total: {
      type: Number,
      required: true,
      min: 1
    },
    minted: {
      type: Number,
      default: 0,
      min: 0
    },
    available: {
      type: Number,
      default: 0,
      min: 0
    },
    isLimited: {
      type: Boolean,
      default: false
    }
  },
  pricing: {
    mintPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      enum: ['FLOW', 'USD'],
      default: 'FLOW'
    },
    royaltyPercentage: {
      type: Number,
      default: 2.5,
      min: 0,
      max: 10
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'whitelist'],
    default: 'public'
  },
  whitelist: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    ipfsHash: String,
    externalUrl: String,
    socialLinks: {
      website: String,
      twitter: String,
      discord: String,
      telegram: String
    }
  },
  statistics: {
    totalVolume: {
      type: Number,
      default: 0
    },
    floorPrice: {
      type: Number,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    },
    uniqueOwners: {
      type: Number,
      default: 0
    },
    averagePrice: {
      type: Number,
      default: 0
    }
  },
  blockchain: {
    flowContractAddress: String,
    flowContractName: String,
    deployedAt: Date,
    network: {
      type: String,
      enum: ['testnet', 'mainnet'],
      default: 'testnet'
    }
  },
  schedule: {
    mintStart: Date,
    mintEnd: Date,
    revealDate: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for calculating remaining supply
collectionSchema.virtual('remainingSupply').get(function() {
  return Math.max(0, this.supply.total - this.supply.minted);
});

// Virtual for calculating mint progress percentage
collectionSchema.virtual('mintProgress').get(function() {
  if (this.supply.total === 0) return 0;
  return Math.round((this.supply.minted / this.supply.total) * 100);
});

// Virtual for NFTs in this collection
collectionSchema.virtual('nfts', {
  ref: 'NFT',
  localField: '_id',
  foreignField: 'collection'
});

// Indexes for better query performance
collectionSchema.index({ name: 'text', description: 'text', tags: 'text' });
collectionSchema.index({ category: 1, status: 1 });
collectionSchema.index({ creator: 1 });
collectionSchema.index({ 'attributes.rarity': 1 });
collectionSchema.index({ isFeatured: 1, featuredOrder: 1 });
collectionSchema.index({ 'schedule.mintStart': 1 });
collectionSchema.index({ 'statistics.totalVolume': -1 });
collectionSchema.index({ 'statistics.floorPrice': -1 });

// Pre-save middleware to update available supply
collectionSchema.pre('save', function(next) {
  if (this.supply.total > 0) {
    this.supply.available = Math.max(0, this.supply.total - this.supply.minted);
  }
  next();
});

// Static method to find active collections
collectionSchema.statics.findActive = function() {
  return this.find({ 
    status: 'active',
    'schedule.mintStart': { $lte: new Date() },
    $or: [
      { 'schedule.mintEnd': { $gte: new Date() } },
      { 'schedule.mintEnd': { $exists: false } }
    ]
  });
};

// Static method to find featured collections
collectionSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ 
    isFeatured: true,
    status: 'active'
  })
  .sort({ featuredOrder: 1, 'statistics.totalVolume': -1 })
  .limit(limit);
};

// Static method to find collections by category
collectionSchema.statics.findByCategory = function(category, options = {}) {
  const query = { category, status: 'active' };
  
  if (options.rarity) {
    query['attributes.rarity'] = options.rarity;
  }
  
  if (options.creator) {
    query.creator = options.creator;
  }
  
  return this.find(query)
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Instance method to check if collection is mintable
collectionSchema.methods.isMintable = function() {
  const now = new Date();
  return (
    this.status === 'active' &&
    this.supply.available > 0 &&
    (!this.schedule.mintStart || this.schedule.mintStart <= now) &&
    (!this.schedule.mintEnd || this.schedule.mintEnd >= now)
  );
};

// Instance method to check if user can mint
collectionSchema.methods.canUserMint = function(userId, userWhitelisted = false) {
  if (!this.isMintable()) return false;
  
  if (this.visibility === 'whitelist') {
    return this.whitelist.some(wl => wl.user.toString() === userId.toString());
  }
  
  if (this.visibility === 'private') {
    return this.creator.toString() === userId.toString();
  }
  
  return true;
};

// Instance method to update statistics
collectionSchema.methods.updateStatistics = function() {
  return this.model('NFT').aggregate([
    { $match: { collection: this._id } },
    {
      $group: {
        _id: null,
        totalVolume: { $sum: '$lastSalePrice' },
        totalSales: { $sum: { $cond: [{ $gt: ['$lastSalePrice', 0] }, 1, 0] } },
        uniqueOwners: { $addToSet: '$owner' },
        floorPrice: { $min: '$lastSalePrice' },
        averagePrice: { $avg: '$lastSalePrice' }
      }
    }
  ]).then(results => {
    if (results.length > 0) {
      const stats = results[0];
      this.statistics = {
        totalVolume: stats.totalVolume || 0,
        totalSales: stats.totalSales || 0,
        uniqueOwners: stats.uniqueOwners.length || 0,
        floorPrice: stats.floorPrice || 0,
        averagePrice: stats.averagePrice || 0
      };
      return this.save();
    }
  });
};

// Instance method to add to whitelist
collectionSchema.methods.addToWhitelist = function(userId) {
  if (!this.whitelist.some(wl => wl.user.toString() === userId.toString())) {
    this.whitelist.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove from whitelist
collectionSchema.methods.removeFromWhitelist = function(userId) {
  this.whitelist = this.whitelist.filter(wl => wl.user.toString() !== userId.toString());
  return this.save();
};

module.exports = mongoose.model('Collection', collectionSchema);
