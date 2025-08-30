const mongoose = require('mongoose');

const redemptionCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  nftTemplate: {
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
    attributes: {
      rarity: {
        type: String,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
        default: 'common'
      },
      series: String,
      season: String,
      year: Number,
      edition: String,
      power: Number,
      level: Number
    },
    collection: {
      type: String,
      required: true
    },
    metadata: {
      ipfsHash: String,
      externalUrl: String,
      traits: [{
        trait_type: String,
        value: String
      }]
    }
  },
  maxRedemptions: {
    type: Number,
    required: true,
    min: 1
  },
  currentRedemptions: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  requirements: {
    minBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    minNFTs: {
      type: Number,
      default: 0,
      min: 0
    },
    whitelistOnly: {
      type: Boolean,
      default: false
    },
    userLevel: {
      type: Number,
      default: 0,
      min: 0
    },
    specialRole: String
  },
  rewards: {
    nft: {
      type: Boolean,
      default: true
    },
    tokens: {
      type: Number,
      default: 0,
      min: 0
    },
    bonus: {
      type: String,
      enum: ['early_access', 'beta_tester_role', 'vip_status', 'special_badge', null],
      default: null
    },
    experience: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  restrictions: {
    onePerUser: {
      type: Boolean,
      default: true
    },
    onePerWallet: {
      type: Boolean,
      default: true
    },
    maxPerUser: {
      type: Number,
      default: 1,
      min: 1
    },
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    excludedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  metadata: {
    category: {
      type: String,
      enum: ['promotional', 'reward', 'limited_edition', 'beta_access', 'vip'],
      default: 'promotional'
    },
    tags: [String],
    campaign: String,
    priority: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for remaining redemptions
redemptionCodeSchema.virtual('remainingRedemptions').get(function() {
  return Math.max(0, this.maxRedemptions - this.currentRedemptions);
});

// Virtual for redemption progress percentage
redemptionCodeSchema.virtual('redemptionProgress').get(function() {
  if (this.maxRedemptions === 0) return 0;
  return Math.round((this.currentRedemptions / this.maxRedemptions) * 100);
});

// Virtual for time until expiration
redemptionCodeSchema.virtual('timeUntilExpiration').get(function() {
  const now = new Date();
  if (this.expiresAt <= now) return 0;
  return Math.max(0, this.expiresAt - now);
});

// Virtual for days until expiration
redemptionCodeSchema.virtual('daysUntilExpiration').get(function() {
  const timeUntil = this.timeUntilExpiration;
  if (timeUntil === 0) return 0;
  return Math.ceil(timeUntil / (1000 * 60 * 60 * 24));
});

// Virtual for is expired
redemptionCodeSchema.virtual('isExpired').get(function() {
  return this.expiresAt <= new Date();
});

// Virtual for is available
redemptionCodeSchema.virtual('isAvailable').get(function() {
  return this.isActive && !this.isExpired && this.currentRedemptions < this.maxRedemptions;
});

// Indexes for better query performance
redemptionCodeSchema.index({ code: 1 });
redemptionCodeSchema.index({ isActive: 1, isExpired: 1 });
redemptionCodeSchema.index({ expiresAt: 1 });
redemptionCodeSchema.index({ 'metadata.category': 1 });
redemptionCodeSchema.index({ 'metadata.tags': 1 });
redemptionCodeSchema.index({ createdBy: 1 });
redemptionCodeSchema.index({ isVerified: 1, isFeatured: 1 });
redemptionCodeSchema.index({ 'nftTemplate.attributes.rarity': 1 });
redemptionCodeSchema.index({ 'nftTemplate.collection': 1 });

// Pre-save middleware to validate expiration
redemptionCodeSchema.pre('save', function(next) {
  if (this.expiresAt <= new Date()) {
    this.isActive = false;
  }
  next();
});

// Static method to find active codes
redemptionCodeSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    expiresAt: { $gt: now },
    currentRedemptions: { $lt: '$maxRedemptions' }
  });
};

// Static method to find codes by category
redemptionCodeSchema.statics.findByCategory = function(category, options = {}) {
  const query = { 'metadata.category': category };
  
  if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }
  
  if (options.rarity) {
    query['nftTemplate.attributes.rarity'] = options.rarity;
  }
  
  return this.find(query)
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to find featured codes
redemptionCodeSchema.statics.findFeatured = function(limit = 10) {
  return this.find({
    isFeatured: true,
    isActive: true
  })
  .sort({ 'metadata.priority': -1, createdAt: -1 })
  .limit(limit);
};

// Static method to find codes by collection
redemptionCodeSchema.statics.findByCollection = function(collection, options = {}) {
  const query = { 'nftTemplate.collection': collection };
  
  if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }
  
  return this.find(query)
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to find codes expiring soon
redemptionCodeSchema.statics.findExpiringSoon = function(days = 7, limit = 10) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return this.find({
    isActive: true,
    expiresAt: { $gte: now, $lte: futureDate }
  })
  .sort({ expiresAt: 1 })
  .limit(limit);
};

// Instance method to check if user can redeem
redemptionCodeSchema.methods.canUserRedeem = function(userId, userBalance = 0, userNFTs = 0, userWhitelisted = false, userLevel = 0) {
  if (!this.isAvailable) {
    return { canRedeem: false, reason: 'Code is not available' };
  }
  
  if (this.requirements.minBalance > 0 && userBalance < this.requirements.minBalance) {
    return { canRedeem: false, reason: 'Minimum balance requirement not met' };
  }
  
  if (this.requirements.minNFTs > 0 && userNFTs < this.requirements.minNFTs) {
    return { canRedeem: false, reason: 'Minimum NFT requirement not met' };
  }
  
  if (this.requirements.whitelistOnly && !userWhitelisted) {
    return { canRedeem: false, reason: 'Whitelist access required' };
  }
  
  if (this.requirements.userLevel > 0 && userLevel < this.requirements.userLevel) {
    return { canRedeem: false, reason: 'User level requirement not met' };
  }
  
  if (this.restrictions.allowedUsers.length > 0 && !this.restrictions.allowedUsers.includes(userId)) {
    return { canRedeem: false, reason: 'User not in allowed list' };
  }
  
  if (this.restrictions.excludedUsers.includes(userId)) {
    return { canRedeem: false, reason: 'User is excluded from this code' };
  }
  
  return { canRedeem: true };
};

// Instance method to increment redemption count
redemptionCodeSchema.methods.incrementRedemptions = function() {
  if (this.currentRedemptions >= this.maxRedemptions) {
    throw new Error('Maximum redemptions reached');
  }
  
  this.currentRedemptions += 1;
  
  // Deactivate if max redemptions reached
  if (this.currentRedemptions >= this.maxRedemptions) {
    this.isActive = false;
  }
  
  return this.save();
};

// Instance method to deactivate code
redemptionCodeSchema.methods.deactivate = function(reason = 'Admin deactivated') {
  this.isActive = false;
  return this.save();
};

// Instance method to extend expiration
redemptionCodeSchema.methods.extendExpiration = function(newExpirationDate) {
  if (newExpirationDate <= new Date()) {
    throw new Error('New expiration date must be in the future');
  }
  
  this.expiresAt = newExpirationDate;
  this.isActive = true;
  
  return this.save();
};

// Instance method to add allowed user
redemptionCodeSchema.methods.addAllowedUser = function(userId) {
  if (!this.restrictions.allowedUsers.includes(userId)) {
    this.restrictions.allowedUsers.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove allowed user
redemptionCodeSchema.methods.removeAllowedUser = function(userId) {
  this.restrictions.allowedUsers = this.restrictions.allowedUsers.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Instance method to add excluded user
redemptionCodeSchema.methods.addExcludedUser = function(userId) {
  if (!this.restrictions.excludedUsers.includes(userId)) {
    this.restrictions.excludedUsers.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove excluded user
redemptionCodeSchema.methods.removeExcludedUser = function(userId) {
  this.restrictions.excludedUsers = this.restrictions.excludedUsers.filter(id => id.toString() !== userId.toString());
  return this.save();
};

module.exports = mongoose.model('RedemptionCode', redemptionCodeSchema);
