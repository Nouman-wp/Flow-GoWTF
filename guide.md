# Aniverse NFT Platform - Complete Development Guide

## 🚀 Project Overview

Aniverse is a next-generation NFT marketplace for anime lovers, built on the Flow blockchain with IPFS storage. This guide will walk you through setting up the complete full-stack application from scratch.

## 🏗️ Architecture Overview

- **Frontend**: React + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express + MongoDB
- **Blockchain**: Flow Testnet + Cadence Smart Contracts
- **Storage**: IPFS via Pinata
- **Wallet**: Flow Wallet + FCL (Flow Client Library)

## 🎯 Why Flow Wallet & FCL?

- **Native Integration**: Flow Wallet is the official wallet for the Flow ecosystem
- **Testnet Support**: Easy testing with Flow Testnet faucet
- **FCL Standard**: Official Flow Client Library ensures compatibility
- **Developer Experience**: Excellent tooling and documentation
- **Performance**: Flow's unique architecture handles high throughput

## 📁 Project Structure

```
Flow-Aniverse/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── contracts/              # Cadence smart contracts
├── docs/                   # Documentation
├── .env.example           # Environment variables template
├── README.md              # Project overview
└── guide.md               # This file
```

## 🛠️ Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Pinata account (IPFS)
- Flow CLI
- Flow Wallet browser extension

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone and setup
git clone <your-repo>
cd Flow-Aniverse
npm install -g flow-cli

# Install dependencies
npm run install:all
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Start Development

```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev:client

# Terminal 3: Smart Contract (one-time setup)
npm run deploy:contracts
```

## 🔧 Detailed Setup

### Backend Setup

1. **MongoDB Atlas**
   - Create cluster
   - Get connection string
   - Add to `.env`

2. **Pinata Setup**
   - Create account
   - Generate API keys
   - Add to `.env`

3. **Flow Testnet**
   - Install Flow CLI
   - Create testnet account
   - Fund with testnet tokens

### Smart Contract Deployment

```bash
# Deploy to Flow Testnet
cd contracts
flow deploy --network=testnet

# Update contract address in .env
```

### Frontend Setup

1. **Flow Wallet Integration**
   - Install Flow Wallet extension
   - Configure FCL
   - Test connection

2. **Theme & Styling**
   - White + emerald color scheme
   - Dotted background animation
   - Dark mode toggle

## 📡 API Endpoints

### Authentication
- `POST /api/auth/flow-connect` - Connect Flow wallet
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### NFTs
- `GET /api/nfts/collections` - List collections
- `GET /api/nfts/collections/:id` - Get collection details
- `POST /api/nfts/mint` - Mint new NFT
- `GET /api/nfts/:id` - Get NFT details

### IPFS
- `POST /api/ipfs/upload` - Upload file to IPFS
- `GET /api/ipfs/:cid` - Get IPFS file info

### Betting
- `GET /api/betting/matches` - List betting matches
- `POST /api/betting/place-bet` - Place bet
- `GET /api/betting/user-bets` - Get user bets

## 🔐 Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aniverse

# Pinata (IPFS)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Flow Blockchain
FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
FLOW_CONTRACT_ADDRESS=0x1234567890abcdef
FLOW_PRIVATE_KEY=your_private_key

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Server
PORT=5000
NODE_ENV=development
```

## 🎮 Smart Contract Functions

### Core Functions
- `createCollection()` - Initialize NFT collection
- `mintNFT()` - Mint new NFT
- `transfer()` - Transfer NFT ownership
- `getNFT()` - Retrieve NFT metadata

### Admin Functions
- `mintLimitedNFT()` - Mint limited supply NFTs
- `setPromoCode()` - Set promotional codes
- `whitelistUser()` - Add user to whitelist

## 🎨 Frontend Components

### Core Components
- `Navbar` - Navigation with wallet connect
- `WalletConnect` - Flow wallet integration
- `ThemeToggle` - Dark/light mode switch
- `DottedBackground` - Animated homepage background

### Page Components
- `Home` - Landing page with hero section
- `Marketplace` - NFT collections listing
- `CollectionView` - Individual collection display
- `Betting` - Betting interface
- `GameZone` - Games listing
- `Redeem` - Promo code redemption

## 🧪 Testing

```bash
# Backend tests
npm run test:server

# Frontend tests
npm run test:client

# Smart contract tests
npm run test:contracts
```

## 🚀 Deployment

### Backend Deployment
```bash
# Build and deploy
npm run build:server
npm run deploy:server
```

### Frontend Deployment
```bash
# Build and deploy
npm run build:client
npm run deploy:client
```

### Smart Contract Deployment
```bash
# Deploy to mainnet
npm run deploy:mainnet
```


## 🗺️ Roadmap

### Phase 1 (MVP) - Week 1-2
- Basic NFT minting and transfer
- Wallet connection
- Simple marketplace

### Phase 2 - Week 3-4
- Betting system
- Game zone
- Admin panel

### Phase 3 - Week 5-6
- Advanced features
- Performance optimization
- Mainnet deployment

## 🐛 Troubleshooting

### Common Issues

1. **Flow Wallet Connection Failed**
   - Check FCL configuration
   - Ensure testnet network
   - Verify contract address

2. **IPFS Upload Issues**
   - Check Pinata API keys
   - Verify file size limits
   - Check network connectivity

3. **Smart Contract Errors**
   - Verify Cadence syntax
   - Check account funding
   - Review transaction logs

## 📚 Resources

- [Flow Documentation](https://docs.onflow.org/)
- [FCL Guide](https://docs.onflow.org/fcl/)
- [Cadence Language](https://docs.onflow.org/cadence/)
- [Pinata API Docs](https://docs.pinata.cloud/)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review Flow documentation
3. Check GitHub issues
4. Join Flow Discord community

---

**Happy Building! 🚀**

This guide provides everything you need to get started with Aniverse. Follow the steps sequentially and you'll have a fully functional NFT platform running on Flow testnet.
