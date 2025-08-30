const mongoose = require('mongoose');

const userBetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Betting',
    required: true
  },
  participantId: {
    type: String,
    required: true
  },
  betAmount: {
    type: Number,
    required: true,
    min: 0.1
  },
  potentialWinnings: {
    type: Number,
    required: true,
    min: 0
  },
  odds: {
    type: Number,
    required: true,
    min: 1.01
  },
  status: {
    type: String,
    enum: ['active', 'won', 'lost', 'cancelled', 'refunded'],
    default: 'active'
  },
  result: {
    isWinner: {
      type: Boolean,
      default: false
    },
    winnings: {
      type: Number,
      default: 0
    },
    processedAt: Date
  },
  metadata: {
    placedAt: {
      type: Date,
      default: Date.now
    },
    lockedAt: Date,
    cancelledAt: Date,
    reason: String
  },
  blockchain: {
    transactionHash: String,
    blockNumber: Number,
    gasUsed: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for bet duration
userBetSchema.virtual('duration').get(function() {
  if (!this.metadata.placedAt) return 0;
  const endTime = this.metadata.lockedAt || new Date();
  return Math.max(0, endTime - this.metadata.placedAt);
});

// Virtual for profit/loss
userBetSchema.virtual('profitLoss').get(function() {
  if (this.status === 'won') {
    return this.result.winnings - this.betAmount;
  } else if (this.status === 'lost') {
    return -this.betAmount;
  }
  return 0;
});

// Virtual for ROI
userBetSchema.virtual('roi').get(function() {
  if (this.betAmount === 0) return 0;
  return (this.profitLoss / this.betAmount) * 100;
});

// Indexes for better query performance
userBetSchema.index({ user: 1 });
userBetSchema.index({ match: 1 });
userBetSchema.index({ status: 1 });
userBetSchema.index({ 'metadata.placedAt': -1 });
userBetSchema.index({ user: 1, status: 1 });
userBetSchema.index({ match: 1, status: 1 });
userBetSchema.index({ 'metadata.lockedAt': 1 });

// Compound index for user bets on specific matches
userBetSchema.index({ user: 1, match: 1 });

// Pre-save middleware to calculate potential winnings
userBetSchema.pre('save', function(next) {
  if (this.isModified('betAmount') || this.isModified('odds')) {
    this.potentialWinnings = this.betAmount * this.odds;
  }
  next();
});

// Static method to find user's active bets
userBetSchema.statics.findUserActiveBets = function(userId) {
  return this.find({
    user: userId,
    status: 'active'
  }).populate('match');
};

// Static method to find user's completed bets
userBetSchema.statics.findUserCompletedBets = function(userId, options = {}) {
  const query = {
    user: userId,
    status: { $in: ['won', 'lost'] }
  };
  
  return this.find(query)
    .populate('match')
    .sort(options.sort || { 'metadata.placedAt': -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to find bets by match
userBetSchema.statics.findByMatch = function(matchId, options = {}) {
  const query = { match: matchId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('user', 'username flowWalletAddress')
    .sort(options.sort || { 'metadata.placedAt': -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to find winning bets
userBetSchema.statics.findWinningBets = function(matchId) {
  return this.find({
    match: matchId,
    status: 'won'
  }).populate('user', 'username flowWalletAddress');
};

// Static method to calculate match statistics
userBetSchema.statics.calculateMatchStats = function(matchId) {
  return this.aggregate([
    { $match: { match: mongoose.Types.ObjectId(matchId) } },
    {
      $group: {
        _id: null,
        totalBets: { $sum: 1 },
        totalAmount: { $sum: '$betAmount' },
        totalWinnings: { $sum: '$result.winnings' },
        activeBets: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        wonBets: {
          $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] }
        },
        lostBets: {
          $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Static method to find user betting statistics
userBetSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalBets: { $sum: 1 },
        totalAmount: { $sum: '$betAmount' },
        totalWinnings: { $sum: '$result.winnings' },
        activeBets: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        wonBets: {
          $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] }
        },
        lostBets: {
          $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] }
        },
        totalProfit: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'won'] },
              { $subtract: ['$result.winnings', '$betAmount'] },
              { $cond: [{ $eq: ['$status', 'lost'] }, { $multiply: ['$betAmount', -1] }, 0] }
            ]
          }
        }
      }
    }
  ]);
};

// Instance method to process bet result
userBetSchema.methods.processResult = function(isWinner, winnings = 0) {
  if (this.status !== 'active') {
    throw new Error('Bet is not in active status');
  }
  
  this.status = isWinner ? 'won' : 'lost';
  this.result = {
    isWinner,
    winnings: isWinner ? winnings : 0,
    processedAt: new Date()
  };
  
  return this.save();
};

// Instance method to cancel bet
userBetSchema.methods.cancelBet = function(reason = 'User cancelled') {
  if (this.status !== 'active') {
    throw new Error('Bet cannot be cancelled');
  }
  
  this.status = 'cancelled';
  this.metadata.cancelledAt = new Date();
  this.metadata.reason = reason;
  
  return this.save();
};

// Instance method to refund bet
userBetSchema.methods.refundBet = function(reason = 'Match cancelled') {
  if (this.status !== 'active' && this.status !== 'cancelled') {
    throw new Error('Bet cannot be refunded');
  }
  
  this.status = 'refunded';
  this.metadata.reason = reason;
  
  return this.save();
};

// Instance method to lock bet
userBetSchema.methods.lockBet = function() {
  if (this.status !== 'active') {
    throw new Error('Bet cannot be locked');
  }
  
  this.metadata.lockedAt = new Date();
  
  return this.save();
};

// Instance method to check if bet can be modified
userBetSchema.methods.canBeModified = function() {
  return this.status === 'active' && !this.metadata.lockedAt;
};

// Instance method to calculate current potential winnings
userBetSchema.methods.getCurrentPotentialWinnings = function() {
  if (this.status !== 'active') return 0;
  return this.potentialWinnings;
};

module.exports = mongoose.model('UserBet', userBetSchema);
