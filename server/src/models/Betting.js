const mongoose = require('mongoose');

const bettingSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['anime', 'gaming', 'sports', 'esports', 'prediction', 'tournament']
  },
  type: {
    type: String,
    required: true,
    enum: ['single', 'multiple', 'tournament', 'challenge']
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'locked', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  lockTime: {
    type: Date,
    required: true
  },
  participants: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    image: String,
    description: String,
    odds: {
      type: Number,
      required: true,
      min: 1.01
    },
    isWinner: {
      type: Boolean,
      default: false
    }
  }],
  totalPool: {
    type: Number,
    default: 0
  },
  totalBets: {
    type: Number,
    default: 0
  },
  minBet: {
    type: Number,
    default: 1,
    min: 0.1
  },
  maxBet: {
    type: Number,
    default: 1000,
    min: 1
  },
  houseFee: {
    type: Number,
    default: 2.5,
    min: 0,
    max: 10
  },
  result: {
    winner: {
      type: String,
      ref: 'participants.id'
    },
    announcedAt: Date,
    announcedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  metadata: {
    image: String,
    externalUrl: String,
    tags: [String],
    requirements: {
      minBalance: {
        type: Number,
        default: 0
      },
      minNFTs: {
        type: Number,
        default: 0
      },
      whitelistOnly: {
        type: Boolean,
        default: false
      }
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

// Virtual for remaining time until lock
bettingSchema.virtual('timeUntilLock').get(function() {
  const now = new Date();
  if (this.lockTime <= now) return 0;
  return Math.max(0, this.lockTime - now);
});

// Virtual for remaining time until start
bettingSchema.virtual('timeUntilStart').get(function() {
  const now = new Date();
  if (this.startTime <= now) return 0;
  return Math.max(0, this.startTime - now);
});

// Virtual for match progress
bettingSchema.virtual('progress').get(function() {
  const now = new Date();
  if (this.startTime >= now) return 0;
  if (this.endTime <= now) return 100;
  
  const totalDuration = this.endTime - this.startTime;
  const elapsed = now - this.startTime;
  return Math.round((elapsed / totalDuration) * 100);
});

// Virtual for total potential payout
bettingSchema.virtual('totalPotentialPayout').get(function() {
  return this.totalPool * (1 - this.houseFee / 100);
});

// Indexes for better query performance
bettingSchema.index({ matchId: 1 });
bettingSchema.index({ category: 1, type: 1 });
bettingSchema.index({ status: 1 });
bettingSchema.index({ startTime: 1, endTime: 1, lockTime: 1 });
bettingSchema.index({ createdBy: 1 });
bettingSchema.index({ isVerified: 1, isFeatured: 1 });
bettingSchema.index({ 'metadata.tags': 1 });

// Pre-save middleware to update status
bettingSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.lockTime <= now) {
    this.status = 'locked';
  } else if (this.startTime <= now && this.endTime > now) {
    this.status = 'active';
  } else if (this.endTime <= now) {
    this.status = 'completed';
  }
  
  next();
});

// Static method to find active matches
bettingSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    status: { $in: ['upcoming', 'active'] },
    lockTime: { $gt: now }
  });
};

// Static method to find upcoming matches
bettingSchema.statics.findUpcoming = function(limit = 10) {
  const now = new Date();
  return this.find({
    status: 'upcoming',
    startTime: { $gt: now }
  })
  .sort({ startTime: 1 })
  .limit(limit);
};

// Static method to find matches by category
bettingSchema.statics.findByCategory = function(category, options = {}) {
  const query = { category };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .sort(options.sort || { startTime: 1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to find featured matches
bettingSchema.statics.findFeatured = function(limit = 10) {
  return this.find({
    isFeatured: true,
    status: { $in: ['upcoming', 'active'] }
  })
  .sort({ startTime: 1 })
  .limit(limit);
};

// Instance method to check if match is bettable
bettingSchema.methods.isBettable = function() {
  const now = new Date();
  return (
    this.status === 'upcoming' &&
    this.lockTime > now &&
    this.totalBets < this.maxBet
  );
};

// Instance method to calculate potential winnings
bettingSchema.methods.calculatePotentialWinnings = function(participantId, betAmount) {
  const participant = this.participants.find(p => p.id === participantId);
  if (!participant) return 0;
  
  return betAmount * participant.odds;
};

// Instance method to update total pool
bettingSchema.methods.updateTotalPool = function() {
  // This would typically be calculated from actual bets in the database
  // For now, we'll use a placeholder
  return this.save();
};

// Instance method to announce result
bettingSchema.methods.announceResult = function(winnerId, announcedBy) {
  if (this.status !== 'active' && this.status !== 'locked') {
    throw new Error('Match is not in a state where results can be announced');
  }
  
  const winner = this.participants.find(p => p.id === winnerId);
  if (!winner) {
    throw new Error('Invalid winner ID');
  }
  
  this.result = {
    winner: winnerId,
    announcedAt: new Date(),
    announcedBy: announcedBy
  };
  
  this.status = 'completed';
  
  // Mark winner
  this.participants.forEach(p => {
    p.isWinner = p.id === winnerId;
  });
  
  return this.save();
};

// Instance method to check if user can bet
bettingSchema.methods.canUserBet = function(userId, userBalance = 0, userNFTs = 0, userWhitelisted = false) {
  if (!this.isBettable()) {
    return { canBet: false, reason: 'Match is not available for betting' };
  }
  
  if (this.metadata.requirements.minBalance > 0 && userBalance < this.metadata.requirements.minBalance) {
    return { canBet: false, reason: 'Minimum balance requirement not met' };
  }
  
  if (this.metadata.requirements.minNFTs > 0 && userNFTs < this.metadata.requirements.minNFTs) {
    return { canBet: false, reason: 'Minimum NFT requirement not met' };
  }
  
  if (this.metadata.requirements.whitelistOnly && !userWhitelisted) {
    return { canBet: false, reason: 'Whitelist access required' };
  }
  
  return { canBet: true };
};

module.exports = mongoose.model('Betting', bettingSchema);
