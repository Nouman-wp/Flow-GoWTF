const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
  tokenId: {
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
    required: true,
    validate: {
      validator: function(v) {
        return /^ipfs:\/\/[a-zA-Z0-9]{46}$/.test(v) || /^https?:\/\/.+/.test(v);
      },
      message: 'Image must be a valid IPFS hash or URL'
    }
  },
  externalURL: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'External URL must be a valid HTTP/HTTPS URL'
    }
  },
  attributes: [{
    trait_type: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    },
    display_type: {
      type: String,
      enum: ['string', 'number', 'boost_percentage', 'boost_number', 'date'],
      default: 'string'
    }
  }],
  collection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: true
  },
  collectionName: {
    type: String,
    required: true,
    trim: true
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
    default: 'common'
  },
  rarityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flowContractAddress: {
    type: String,
    required: false,
    match: [/^0x[a-fA-F0-9]{16}$/, 'Invalid Flow contract address']
  },
  flowTokenId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  mintDate: {
    type: Date,
    default: Date.now
  },
  lastTransferDate: {
    type: Date,
    default: Date.now
  },
  transferCount: {
    type: Number,
    default: 0
  },
  isForSale: {
    type: Boolean,
    default: false
  },
  salePrice: {
    type: Number,
    min: 0,
    default: 0
  },
  saleCurrency: {
    type: String,
    enum: ['FLOW', 'USD', 'USDC'],
    default: 'FLOW'
  },
  metadata: {
    ipfsHash: {
      type: String,
      required: true,
      match: [/^[a-zA-Z0-9]{46}$/, 'Invalid IPFS hash']
    },
    metadataURL: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^ipfs:\/\/[a-zA-Z0-9]{46}$/.test(v);
        },
        message: 'Metadata URL must be a valid IPFS hash'
      }
    },
    fileSize: Number,
    mimeType: String
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['listed', 'minted', 'transferring', 'burned', 'error'],
    default: 'listed'
  },
  blockchainData: {
    transactionHash: String,
    blockNumber: Number,
    gasUsed: Number,
    flowEvents: [{
      eventType: String,
      eventData: mongoose.Schema.Types.Mixed,
      timestamp: Date
    }]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
nftSchema.index({ tokenId: 1 });
nftSchema.index({ flowTokenId: 1 }, { unique: true, sparse: true });
nftSchema.index({ collection: 1 });
nftSchema.index({ owner: 1 });
nftSchema.index({ creator: 1 });
nftSchema.index({ rarity: 1 });
nftSchema.index({ isForSale: 1 });
nftSchema.index({ tags: 1 });
nftSchema.index({ 'metadata.ipfsHash': 1 });

// Virtual for like count
nftSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for age in days
nftSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.mintDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for rarity color
nftSchema.virtual('rarityColor').get(function() {
  const colors = {
    common: '#6B7280',
    uncommon: '#10B981',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
    mythic: '#EF4444'
  };
  return colors[this.rarity] || colors.common;
});

// Pre-save middleware to update collection name if not set
nftSchema.pre('save', async function(next) {
  if (this.isModified('collection') && !this.collectionName) {
    const collection = await mongoose.model('Collection').findById(this.collection);
    if (collection) {
      this.collectionName = collection.name;
    }
  }
  next();
});

// Method to increment views
nftSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to toggle like
nftSchema.methods.toggleLike = function(userId) {
  const index = this.likes.indexOf(userId);
  if (index > -1) {
    this.likes.splice(index, 1);
  } else {
    this.likes.push(userId);
  }
  return this.save();
};

// Method to transfer ownership
nftSchema.methods.transfer = function(newOwnerId) {
  this.owner = newOwnerId;
  this.lastTransferDate = new Date();
  this.transferCount += 1;
  return this.save();
};

// Method to update sale status
nftSchema.methods.updateSaleStatus = function(isForSale, price = 0, currency = 'FLOW') {
  this.isForSale = isForSale;
  this.salePrice = price;
  this.saleCurrency = currency;
  return this.save();
};

// Method to add blockchain event
nftSchema.methods.addBlockchainEvent = function(eventType, eventData) {
  this.blockchainData.flowEvents.push({
    eventType,
    eventData,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to find NFTs by collection
nftSchema.statics.findByCollection = function(collectionId) {
  return this.find({ collection: collectionId }).populate('owner', 'username profileImage');
};

// Static method to find NFTs by owner
nftSchema.statics.findByOwner = function(ownerId) {
  return this.find({ owner: ownerId }).populate('collection', 'name description');
};

// Static method to find NFTs for sale
nftSchema.statics.findForSale = function() {
  return this.find({ isForSale: true }).populate('owner', 'username profileImage');
};

// Static method to search NFTs
nftSchema.statics.search = function(query, filters = {}) {
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };
  
  // Apply additional filters
  if (filters.collection) searchQuery.collection = filters.collection;
  if (filters.rarity) searchQuery.rarity = filters.rarity;
  if (filters.isForSale !== undefined) searchQuery.isForSale = filters.isForSale;
  
  return this.find(searchQuery).populate('owner', 'username profileImage');
};

// Ensure virtual fields are serialized
nftSchema.set('toJSON', { virtuals: true });
nftSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('NFT', nftSchema);
