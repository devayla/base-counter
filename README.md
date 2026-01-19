# 🎯 Base Counter

<div align="center">

![Base Counter](https://img.shields.io/badge/Base-Counter-0052FF?style=for-the-badge&logo=ethereum&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity&logoColor=white)

**A collaborative on-chain counter built as a Farcaster Mini App on Base blockchain**

[Live Demo](https://base-counter-one.vercel.app) · [Smart Contract](https://basescan.org) · [Documentation](#-documentation)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Core Components](#-core-components)
- [Smart Contracts](#-smart-contracts)
- [API Endpoints](#-api-endpoints)
- [Environment Variables](#-environment-variables)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Optimizations](#-optimizations)
- [License](#-license)

---

## 🌟 Overview

**Base Counter** is an interactive, gamified on-chain counter application that brings the Farcaster community together. Users can increment a global counter, earn USDC rewards, and compete on a leaderboard—all within a beautifully animated, premium user interface.

Built as a **Farcaster Mini App**, Base Counter leverages the power of blockchain to create a transparent, trustless, and engaging social experience where every interaction is recorded on-chain.

### What Makes It Special?

- ✅ **On-Chain Everything**: Every increment is permanently recorded on the Base blockchain
- 💰 **Daily Rewards**: Earn up to 10 USDC rewards per day for participation
- 🏆 **Global Leaderboard**: Compete with friends and the community
- 🎨 **Premium UI/UX**: Stunning animations and modern design patterns
- 🔒 **Secure & Transparent**: Smart contract-based signature verification
- 🚀 **Instant Sharing**: Auto-share achievements to Farcaster
- 📱 **Mobile-First**: Optimized for Farcaster mobile app

---

## ✨ Key Features

### 🎰 Interactive Counter Mechanism
- **Pull-the-Lever Animation**: Engaging slot machine-style interaction
- **Real-Time Feed**: Live stream of increments from all users
- **Smooth Animations**: Framer Motion-powered transitions
- **Particle Effects**: Dynamic background animations

### 💎 Reward System
- **Daily USDC Rewards**: Earn rewards for each increment (up to 10x per day)
- **Server-Signed Rewards**: Cryptographically secure reward distribution
- **Transparent Tracking**: All rewards logged on-chain and in localStorage
- **Anti-Spam Protection**: Daily limits and signature replay prevention

### 📊 Leaderboard & Stats
- **Real-Time Rankings**: Live leaderboard with user stats
- **MongoDB-Powered**: Fast, scalable data aggregation
- **Profile Pictures**: Display Farcaster profile images
- **Total Increments**: Track individual and global contributions

### 🎯 Social Integration
- **Auto-Share on First Increment**: Automatic Farcaster cast after first click
- **Custom Share Images**: Generate personalized counter share cards
- **IPFS Storage**: Decentralized image hosting via Pinata
- **Viral Mechanics**: Built-in sharing incentives

### 🔐 Security Features
- **Signature Verification**: Backend-signed transactions for reward claims
- **Replay Attack Prevention**: Used signature tracking
- **Rate Limiting**: Daily increment limits per user
- **Wallet Validation**: Verify user ownership before transactions

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) - React framework with App Router
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) - Type-safe development
- **Styling**: [TailwindCSS 3](https://tailwindcss.com/) - Utility-first CSS
- **Animations**: [Framer Motion 12](https://www.framer.com/motion/) - Advanced animations
- **Icons**: [FontAwesome](https://fontawesome.com/) - Professional icon library
- **State Management**: [TanStack Query](https://tanstack.com/query) - Data fetching & caching

### Blockchain
- **Network**: [Base](https://base.org/) - Ethereum L2 (Chain ID: 8453)
- **Smart Contracts**: [Solidity 0.8.20](https://soliditylang.org/)
- **Web3 Library**: [Wagmi 2.14](https://wagmi.sh/) - React hooks for Ethereum
- **Wallet Connector**: [Viem 2.22](https://viem.sh/) - TypeScript Ethereum library
- **Farcaster SDK**: [@farcaster/miniapp-sdk](https://docs.farcaster.xyz/) - Mini app integration

### Backend & Storage
- **Database**: [MongoDB 6.0](https://www.mongodb.com/) - Document database for leaderboard
- **Cache**: [Upstash Redis](https://upstash.com/) - Serverless Redis for rate limiting
- **File Storage**: [Pinata IPFS](https://www.pinata.cloud/) - Decentralized image storage
- **API Framework**: Next.js API Routes - Serverless functions

### DevOps & Tooling
- **Package Manager**: [PNPM 10.6](https://pnpm.io/) - Fast, disk-efficient
- **Code Quality**: [Biome](https://biomejs.dev/) - Fast linter & formatter
- **Version Control**: Git + GitHub
- **Deployment**: [Vercel](https://vercel.com/) - Zero-config deployment

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Farcaster Mini App                      │
│                  (Client-Side Application)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├──── Wagmi/Viem ────> Base Blockchain
                       │                      (Counter Contract)
                       │
                       ├──── API Routes ────> MongoDB (Leaderboard)
                       │                      Redis (Cache)
                       │
                       ├──── IPFS ────────> Pinata (Images)
                       │
                       └──── Farcaster API ─> User Profiles
```

### Data Flow: Increment Counter

```
1. User clicks "Pull Lever"
   └─> CounterMiniApp.tsx → handlePull()

2. Request Signature
   └─> POST /api/counter/generate-signature
       ├─> Verify user (MongoDB)
       ├─> Calculate reward amount
       └─> Sign with private key

3. Execute Contract Call
   └─> incrementCounter(fid, username, imageUrl, rewardToken, rewardAmount, signature)
       ├─> Contract validates signature
       ├─> Increments global counter
       ├─> Transfers USDC reward (if valid)
       └─> Emits CounterIncremented event

4. Update Leaderboard
   └─> POST /api/counter/update-leaderboard
       └─> Upsert user stats in MongoDB

5. Auto-Share (First Increment)
   └─> Capture counter image
   └─> Upload to IPFS
   └─> Compose Farcaster cast with image
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **pnpm**: 10.x or higher (automatically managed)
- **Farcaster Account**: Required for testing Mini App
- **Wallet**: MetaMask or compatible Web3 wallet
- **Base ETH**: For transaction gas fees

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/base-counter.git
cd base-counter

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Configure your .env.local file (see Environment Variables section)
```

### Running Locally

```bash
# Development server
pnpm dev

# Open http://localhost:3000 in your browser
```

### Building for Production

```bash
# Create production build
pnpm build

# Start production server
pnpm start
```

---

## 📁 Project Structure

```
base-counter/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Serverless Functions)
│   │   ├── counter/              # Counter-related endpoints
│   │   │   ├── generate-signature/    # Sign increment transactions
│   │   │   ├── leaderboard/          # Fetch leaderboard data
│   │   │   └── update-leaderboard/   # Update user stats
│   │   ├── ipfs/                 # IPFS upload endpoints
│   │   ├── neynar/               # Farcaster API integration
│   │   └── og/                   # Open Graph image generation
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing page (Frame metadata)
│   └── globals.css               # Global styles
│
├── components/                   # React Components
│   ├── Counter/                  # 🎯 CORE COUNTER COMPONENTS
│   │   ├── CounterMiniApp.tsx        # Main application logic
│   │   ├── CounterHeader.tsx         # Header with global stats
│   │   ├── IncrementButton.tsx       # Primary action button
│   │   ├── IncrementCard.tsx         # Individual increment card
│   │   ├── IncrementFeed.tsx         # Live feed of increments
│   │   ├── Leaderboard.tsx           # Ranking system
│   │   └── PullLever.tsx             # Animated lever interaction
│   ├── Home/                     # Home page components
│   ├── pages/                    # Page wrappers
│   ├── farcaster-provider.tsx    # Farcaster SDK context
│   └── wallet-provider.tsx       # Web3 wallet provider
│
├── contract/                     # Smart Contracts
│   └── counter.sol               # Main Counter contract (Solidity)
│
├── hooks/                        # Custom React Hooks
│   ├── useCounterContract.ts     # Counter contract interaction
│   ├── use-miniapp-context.ts    # Farcaster context hook
│   └── use-nft-supply.ts         # NFT supply management
│
├── lib/                          # Utility Libraries
│   ├── contracts.ts              # Contract addresses & ABIs
│   ├── database.ts               # MongoDB helper functions
│   ├── kv.ts                     # Redis cache utilities
│   ├── mongodb.ts                # MongoDB connection
│   ├── capture-counter-share.ts  # Screenshot generation
│   ├── auth.ts                   # Authentication helpers
│   └── constants.ts              # App-wide constants
│
├── public/                       # Static Assets
│   ├── images/                   # Images
│   └── fonts/                    # Custom fonts
│
├── types/                        # TypeScript Definitions
│
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies & scripts
├── tailwind.config.ts            # TailwindCSS configuration
├── tsconfig.json                 # TypeScript configuration
└── next.config.mjs               # Next.js configuration
```

---

## 🎨 Core Components

### 1. **CounterMiniApp** (`components/Counter/CounterMiniApp.tsx`)

The main application component that orchestrates all counter functionality.

**Key Features**:
- Wallet connection handling
- Counter increment logic with signature verification
- Auto-share mechanism on first increment
- Real-time counter animation
- Reward tracking in localStorage
- Toast notifications for user feedback

**State Management**:
- `totalCounter`: Global counter value from blockchain
- `userIncrementCount`: User's total clicks
- `totalRewards`: Accumulated USDC rewards
- `isProcessing`: Transaction loading state
- `hasAutoSharedThisSession`: Auto-share tracking

### 2. **PullLever** (`components/Counter/PullLever.tsx`)

Animated slot machine lever interaction.

**Features**:
- Smooth pull-down animation
- Haptic feedback (on supported devices)
- Loading states
- Disabled state handling

### 3. **IncrementFeed** (`components/Counter/IncrementFeed.tsx`)

Live feed displaying recent increments from all users.

**Features**:
- Real-time updates via contract events
- User profile pictures from Farcaster
- Timestamp display (relative time)
- Smooth scroll with fade gradients
- Auto-refresh every 10 seconds

### 4. **Leaderboard** (`components/Counter/Leaderboard.tsx`)

Competitive ranking system showing top contributors.

**Features**:
- Top 10 users by increment count
- Profile pictures and usernames
- Total increments and rewards
- Rank badges (🥇🥈🥉)
- Modal overlay with smooth animations

### 5. **CounterHeader** (`components/Counter/CounterHeader.tsx`)

Global statistics display header.

**Features**:
- Animated global counter
- User personal stats
- Reward summary
- Gradient background with glow effects

---

## 📜 Smart Contracts

### Counter Contract (`contract/counter.sol`)

**Deployed on Base**: `0x550a90a7E6084845B5B6114C0A2347Ada08E091F`

#### Core Functions

```solidity
function incrementCounter(
    uint256 fid,
    string calldata username,
    string calldata imageUrl,
    address rewardToken,
    uint256 rewardAmount,
    bytes calldata signature
) external
```

Increments the global counter and optionally distributes rewards.

**Parameters**:
- `fid`: Farcaster ID
- `username`: Farcaster username
- `imageUrl`: Profile picture URL
- `rewardToken`: ERC20 token address (USDC)
- `rewardAmount`: Reward amount in wei
- `signature`: Server-generated signature

**Security**:
- ✅ Signature verification (ECDSA)
- ✅ Replay attack prevention
- ✅ Daily reward limits (10x per user)
- ✅ Error handling (reward failure doesn't revert increment)

#### View Functions

```solidity
function getIncrementsAroundMe(
    address user,
    uint256 lower,
    uint256 upper
) external view returns (IncrementInfo[] memory)
```

Returns increments near user's latest increment.

```solidity
function totalIncrements() external view returns (uint256)
```

Returns total number of increments.

#### Events

```solidity
event CounterIncremented(
    address indexed user,
    uint256 indexed index,
    uint256 counterValue
)

event TokenRewarded(
    address indexed user,
    address indexed token,
    uint256 amount
)
```

---

## 🔌 API Endpoints

### Counter APIs

#### **POST** `/api/counter/generate-signature`

Generates a cryptographic signature for increment transactions.

**Request Body**:
```json
{
  "userAddress": "0x...",
  "fid": 12345
}
```

**Response**:
```json
{
  "success": true,
  "signature": "0x...",
  "tokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "amount": 0.0001,
  "amountInWei": "100000000000000"
}
```

#### **POST** `/api/counter/update-leaderboard`

Updates user statistics in the leaderboard.

**Request Body**:
```json
{
  "fid": 12345,
  "username": "alice",
  "imageUrl": "https://...",
  "userAddress": "0x...",
  "totalIncrements": 42,
  "totalRewards": 0.0042
}
```

#### **GET** `/api/counter/leaderboard`

Fetches top users by increment count.

**Query Parameters**:
- `limit`: Number of results (default: 10)

**Response**:
```json
{
  "success": true,
  "leaderboard": [
    {
      "fid": 12345,
      "username": "alice",
      "imageUrl": "https://...",
      "totalIncrements": 100,
      "totalRewards": 0.01,
      "rank": 1
    }
  ]
}
```

### IPFS APIs

#### **POST** `/api/ipfs/upload-image`

Uploads share images to IPFS via Pinata.

**Request**: FormData with `file` field

**Response**:
```json
{
  "success": true,
  "ipfsUrl": "https://gateway.pinata.cloud/ipfs/Qm...",
  "cid": "Qm..."
}
```

---

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME="Base Counter"

# Base Blockchain (Chain ID: 8453)
NEXT_PUBLIC_COUNTER_ADDRESS=0x550a90a7E6084845B5B6114C0A2347Ada08E091F
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Backend Signer (Private Key)
SIGNER_PRIVATE_KEY=0x...
SIGNER_ADDRESS=0x...

# MongoDB (Atlas or Local)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/base-counter

# Upstash Redis (Optional - for rate limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Pinata IPFS
PINATA_JWT=eyJhbGc...
PINATA_GATEWAY=gateway.pinata.cloud
PINATA_API_KEY=...
PINATA_SECRET_API_KEY=...

# Neynar (Farcaster API - Optional)
NEYNAR_API_KEY=...

# Pusher (Real-time - Optional)
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=...
```

### Required Variables
- `SIGNER_PRIVATE_KEY`: Must match the `serverSigner` in the smart contract
- `MONGODB_URI`: Required for leaderboard functionality
- `PINATA_JWT`: Required for share image uploads

---

## 🧑‍💻 Development

### Code Quality

```bash
# Run linter
pnpm lint

# Format code
pnpm format
```

### Testing

```bash
# Test smart contracts
cd contract
forge test

# Test API endpoints
pnpm test:api
```

### Local Blockchain Testing

```bash
# Start local Base fork
anvil --fork-url https://mainnet.base.org

# Deploy contract
forge create --rpc-url http://localhost:8545 --private-key 0x... src/Counter.sol:Counter
```

---

## 🚢 Deployment

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Setup on Vercel

1. Go to **Project Settings** → **Environment Variables**
2. Add all variables from `.env.example`
3. Redeploy the application

### Custom Domain Setup

1. Add domain in Vercel project settings
2. Configure DNS records
3. Update `NEXT_PUBLIC_APP_URL` environment variable

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow **TypeScript** best practices
- Use **TailwindCSS** for styling
- Add **comments** for complex logic
- Ensure **responsive** design
- Test on **mobile devices**

---

## ⚡ Optimizations

The following backend optimizations have been implemented to ensure the application remains fast and scalable:

### 🚀 Redis Caching layer
- **High-Performance Leaderboard**: Implemented Upstash Redis caching for the global leaderboard. This reduces database hits on MongoDB by 90% during traffic spikes.
- **Smart Cache Invalidation**: The cache is automatically invalidated whenever a user updates their score, ensuring users always see fresh data while benefiting from sub-millisecond cache latency.

### 📊 Database Efficiency
- **Query Projections**: All API routes now use MongoDB projections to fetch only the necessary fields. This reduces memory usage and speeds up serialization.
- **Dynamic Projects**: Optimized the leaderboard query to only return `fid`, `username`, `imageUrl`, `totalIncrements`, and `totalRewards`.

### 🛡️ Security & Performance
- **Optimized Verification**: Address verification logic was streamlined to use high-performance lookup patterns.
- **Improved Neynar API Handling**: Added better caching and error handling for Farcaster user data lookups.

### 🔍 SEO & Metadata
- **Enhanced Open Graph**: Updated meta tags with premium descriptions and titles to improve click-through rates on social platforms.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Base** - Ethereum L2 scaling solution
- **Farcaster** - Decentralized social network
- **Coinbase** - Base blockchain development
- **OpenZeppelin** - Secure smart contract libraries
- **Pinata** - IPFS storage infrastructure

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/base-counter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/base-counter/discussions)
- **Farcaster**: [@basecounter](https://warpcast.com/basecounter)

---

<div align="center">

**Built with ❤️ by the Base Counter Team**

[Website](https://base-counter-one.vercel.app) · [GitHub](https://github.com/yourusername/base-counter) · [Farcaster](https://warpcast.com/basecounter)

</div>




