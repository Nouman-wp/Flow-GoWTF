const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  flowWalletAddress: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^0x[a-fA-F0-9]{16}$/, 'Please enter a valid Flow wallet address']
  },
  profileImage: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isWhitelisted: {
    type: Boolean,
    default: false
  },
  nftCollections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  }],
  ownedNFTs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NFT'
  }],
  bettingHistory: [{
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BettingMatch'
    },
    amount: Number,
    prediction: String,
    outcome: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  gameStats: {
    totalGames: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ isWhitelisted: 1 });

// Virtual for win rate
userSchema.virtual('winRate').get(function() {
  if (this.gameStats.totalGames === 0) return 0;
  return (this.gameStats.wins / this.gameStats.totalGames * 100).toFixed(1);
});

// Virtual for average score
userSchema.virtual('averageScore').get(function() {
  if (this.gameStats.totalGames === 0) return 0;
  return (this.gameStats.totalScore / this.gameStats.totalGames).toFixed(1);
});

// Pre-save middleware to hash password if provided
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Method to add NFT to collection
userSchema.methods.addNFT = function(nftId) {
  if (!this.ownedNFTs.includes(nftId)) {
    this.ownedNFTs.push(nftId);
  }
  return this.save();
};

// Method to remove NFT from collection
userSchema.methods.removeNFT = function(nftId) {
  this.ownedNFTs = this.ownedNFTs.filter(id => !id.equals(nftId));
  return this.save();
};

// Method to add betting record
userSchema.methods.addBettingRecord = function(matchId, amount, prediction, outcome) {
  this.bettingHistory.push({
    matchId,
    amount,
    prediction,
    outcome
  });
  return this.save();
};

// Method to update game stats
userSchema.methods.updateGameStats = function(isWin, score) {
  this.gameStats.totalGames += 1;
  if (isWin) {
    this.gameStats.wins += 1;
  } else {
    this.gameStats.losses += 1;
  }
  this.gameStats.totalScore += score;
  return this.save();
};

// Static method to find users by wallet address
userSchema.statics.findByWalletAddress = function(address) {
  return this.findOne({ flowWalletAddress: address });
};

// Static method to find whitelisted users
userSchema.statics.findWhitelisted = function() {
  return this.find({ isWhitelisted: true });
};

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
