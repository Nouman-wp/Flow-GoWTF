# 🎌 Aniverse - Anime NFT Platform

> Next-generation NFT marketplace for anime lovers, built on the Flow blockchain with IPFS storage.

## ✨ Features

- 🎨 **Anime NFT Collections** - Mint, collect, and trade anime-themed NFTs
- 🔗 **Flow Blockchain** - Fast, secure, and scalable NFT transactions
- 🌐 **IPFS Storage** - Decentralized media storage via Pinata
- 💰 **Betting System** - Place bets on anime matches and events
- 🎮 **Game Zone** - Interactive gaming experiences
- 🎁 **Redeem System** - Limited-time NFTs and promotional codes
- 🌙 **Dark Mode** - Beautiful emerald-themed dark/light toggle
- 📱 **Responsive Design** - Works perfectly on all devices

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Flow-Aniverse
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your credentials
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

## 🏗️ Tech Stack

- **Frontend**: React + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express + MongoDB
- **Blockchain**: Flow Testnet + Cadence Smart Contracts
- **Storage**: IPFS via Pinata
- **Wallet**: Flow Wallet + FCL (Flow Client Library)
- **Real-time**: Socket.io for live interactions

## 📁 Project Structure

```
Flow-Aniverse/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── context/      # React context providers
│   │   └── utils/        # Utility functions
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Custom middleware
│   │   └── utils/        # Utility functions
├── contracts/             # Cadence smart contracts
├── docs/                  # Documentation
└── guide.md               # Complete development guide
```

## 🔧 Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Pinata account (IPFS)
- Flow CLI
- Flow Wallet browser extension

## 📚 Documentation

- **[Complete Guide](guide.md)** - Step-by-step development guide
- **[API Reference](docs/api.md)** - Backend API documentation
- **[Smart Contracts](docs/contracts.md)** - Cadence contract details
- **[Frontend Components](docs/components.md)** - React component library

## 🎯 Roadmap

- [x] Project scaffolding
- [ ] Smart contract deployment
- [ ] Basic NFT minting
- [ ] Wallet integration
- [ ] Marketplace UI
- [ ] Betting system
- [ ] Game zone
- [ ] Admin panel
- [ ] Mainnet deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 Check the [guide.md](guide.md) for detailed setup instructions
- 🐛 Report bugs via GitHub Issues
- 💬 Join our Discord community
- 📧 Email: support@aniverse.com

---

**Built with ❤️ for the anime community**
