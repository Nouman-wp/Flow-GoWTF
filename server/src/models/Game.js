const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
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
  category: {
    type: String,
    required: true,
    enum: ['trivia', 'combat', 'collection', 'puzzle', 'racing', 'battle']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard', 'expert']
  },
  maxPlayers: {
    type: Number,
    required: true,
    min: 1
  },
  entryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  prizePool: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  rules: {
    maxNFTs: Number,
    battleType: String,
    rounds: Number,
    timeLimit: Number,
    minScore: Number
  },
  questions: [{
    id: {
      type: Number,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    options: [String],
    correctAnswer: {
      type: Number,
      required: true
    },
    points: {
      type: Number,
      default: 10
    },
    timeLimit: {
      type: Number,
      default: 30
    }
  }],
  targetSets: [String],
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    score: {
      type: Number,
      default: 0
    },
    rank: Number,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    timeSpent: Number,
    answers: [{
      questionId: Number,
      selectedAnswer: Number,
      isCorrect: Boolean,
      timeSpent: Number,
      points: Number
    }],
    winnings: {
      tokens: {
        type: Number,
        default: 0
      },
      nfts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NFT'
      }]
    }
  }],
  leaderboard: [{
    rank: {
      type: Number,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    score: Number,
    time: String,
    date: {
      type: Date,
      default: Date.now
    },
    wins: Number,
    losses: Number,
    winRate: String
  }],
  statistics: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    totalCompletions: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    highestScore: {
      type: Number,
      default: 0
    },
    totalPrizePool: {
      type: Number,
      default: 0
    },
    totalWinnings: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  metadata: {
    ipfsHash: String,
    externalUrl: String,
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for current participants count
gameSchema.virtual('currentParticipants').get(function() {
  return this.participants.length;
});

// Virtual for remaining time
gameSchema.virtual('remainingTime').get(function() {
  const now = new Date();
  if (this.endTime <= now) return 0;
  return Math.max(0, this.endTime - now);
});

// Virtual for game progress
gameSchema.virtual('progress').get(function() {
  const now = new Date();
  if (this.startTime >= now) return 0;
  if (this.endTime <= now) return 100;
  
  const totalDuration = this.endTime - this.startTime;
  const elapsed = now - this.startTime;
  return Math.round((elapsed / totalDuration) * 100);
});

// Virtual for available spots
gameSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.maxPlayers - this.participants.length);
});

// Indexes for better query performance
gameSchema.index({ gameId: 1 });
gameSchema.index({ category: 1, difficulty: 1 });
gameSchema.index({ isActive: 1, status: 1 });
gameSchema.index({ startTime: 1, endTime: 1 });
gameSchema.index({ 'participants.user': 1 });
gameSchema.index({ createdBy: 1 });
gameSchema.index({ 'statistics.totalParticipants': -1 });
gameSchema.index({ 'statistics.averageScore': -1 });

// Pre-save middleware to update status
gameSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.startTime > now) {
    this.status = 'upcoming';
  } else if (this.endTime <= now) {
    this.status = 'completed';
  } else if (this.startTime <= now && this.endTime > now) {
    this.status = 'active';
  }
  
  // Update total participants count
  this.statistics.totalParticipants = this.participants.length;
  
  // Update total completions count
  this.statistics.totalCompletions = this.participants.filter(p => p.completed).length;
  
  next();
});

// Static method to find active games
gameSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gt: now }
  });
};

// Static method to find upcoming games
gameSchema.statics.findUpcoming = function(limit = 10) {
  const now = new Date();
  return this.find({
    isActive: true,
    startTime: { $gt: now }
  })
  .sort({ startTime: 1 })
  .limit(limit);
};

// Static method to find games by category
gameSchema.statics.findByCategory = function(category, options = {}) {
  const query = { category, isActive: true };
  
  if (options.difficulty) {
    query.difficulty = options.difficulty;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort(options.sort || { startTime: 1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to find user's games
gameSchema.statics.findByUser = function(userId, options = {}) {
  return this.find({
    'participants.user': userId
  })
  .sort(options.sort || { createdAt: -1 })
  .limit(options.limit || 20)
  .skip(options.skip || 0);
};

// Instance method to add participant
gameSchema.methods.addParticipant = function(userId) {
  if (this.participants.length >= this.maxPlayers) {
    throw new Error('Game is full');
  }
  
  if (this.participants.some(p => p.user.toString() === userId.toString())) {
    throw new Error('User already participating');
  }
  
  this.participants.push({
    user: userId,
    joinedAt: new Date()
  });
  
  return this.save();
};

// Instance method to remove participant
gameSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString());
  return this.save();
};

// Instance method to submit game results
gameSchema.methods.submitResults = function(userId, results) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (!participant) {
    throw new Error('User not participating in this game');
  }
  
  if (participant.completed) {
    throw new Error('User has already completed this game');
  }
  
  // Update participant with results
  participant.score = results.score || 0;
  participant.completed = true;
  participant.completedAt = new Date();
  participant.timeSpent = results.timeSpent || 0;
  participant.answers = results.answers || [];
  
  // Calculate winnings based on rank
  const completedParticipants = this.participants.filter(p => p.completed);
  const rank = completedParticipants.length;
  
  if (rank <= 3) {
    const winnings = [this.prizePool * 0.5, this.prizePool * 0.3, this.prizePool * 0.2];
    participant.winnings.tokens = winnings[rank - 1];
  }
  
  participant.rank = rank;
  
  // Update game statistics
  this.statistics.totalCompletions = this.participants.filter(p => p.completed).length;
  this.statistics.totalWinnings += participant.winnings.tokens;
  
  // Update leaderboard
  this.updateLeaderboard();
  
  return this.save();
};

// Instance method to update leaderboard
gameSchema.methods.updateLeaderboard = function() {
  const completedParticipants = this.participants
    .filter(p => p.completed)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.timeSpent - b.timeSpent;
    });
  
  this.leaderboard = completedParticipants.map((p, index) => ({
    rank: index + 1,
    user: p.user,
    username: p.user.username || 'Anonymous',
    score: p.score,
    time: p.timeSpent ? `${Math.floor(p.timeSpent / 60)}:${(p.timeSpent % 60).toString().padStart(2, '0')}` : 'N/A',
    date: p.completedAt,
    wins: p.wins || 0,
    losses: p.losses || 0,
    winRate: p.wins && p.losses ? `${Math.round((p.wins / (p.wins + p.losses)) * 100)}%` : 'N/A'
  }));
  
  // Update statistics
  if (completedParticipants.length > 0) {
    this.statistics.averageScore = completedParticipants.reduce((sum, p) => sum + p.score, 0) / completedParticipants.length;
    this.statistics.highestScore = Math.max(...completedParticipants.map(p => p.score));
  }
};

// Instance method to check if user can join
gameSchema.methods.canUserJoin = function(userId, userBalance = 0, userNFTs = 0, userWhitelisted = false) {
  if (!this.isActive || this.status !== 'upcoming') {
    return { canJoin: false, reason: 'Game is not available for joining' };
  }
  
  if (this.participants.length >= this.maxPlayers) {
    return { canJoin: false, reason: 'Game is full' };
  }
  
  if (this.participants.some(p => p.user.toString() === userId.toString())) {
    return { canJoin: false, reason: 'Already participating' };
  }
  
  if (this.entryFee > 0 && userBalance < this.entryFee) {
    return { canJoin: false, reason: 'Insufficient balance for entry fee' };
  }
  
  if (this.metadata.requirements.minNFTs > 0 && userNFTs < this.metadata.requirements.minNFTs) {
    return { canJoin: false, reason: 'Minimum NFT requirement not met' };
  }
  
  if (this.metadata.requirements.whitelistOnly && !userWhitelisted) {
    return { canJoin: false, reason: 'Whitelist access required' };
  }
  
  return { canJoin: true };
};

module.exports = mongoose.model('Game', gameSchema);
