# Fiidbak Web App

Fiidbak is a decentralized platform for sharing, discovering, and reviewing web3 products. Built with Next.js, TypeScript, and wagmi, Fiidbak leverages smart contracts to enable transparent, on-chain feedback and rewards for product creators and reviewers.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Smart Contract Integration](#smart-contract-integration)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Product Listing:** Browse and search web3 products with rich metadata.
- **On-chain Feedback:** Submit and view feedback for products, stored on-chain.
- **Wallet Authentication:** Connect with MetaMask, RainbowKit, or other EVM wallets.
- **Rewards System:** Earn rewards for verified feedback and product contributions.
- **User Profiles:** View your products, feedback, and rewards.
- **File Uploads:** Upload product images via Pinata (IPFS).
- **Category & Tag Filtering:** Discover products by category and tags.
- **Responsive UI:** Modern, mobile-friendly interface.

---

## Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Web3:** [wagmi](https://wagmi.sh/), [RainbowKit](https://www.rainbowkit.com/)
- **Smart Contracts:** Solidity (see `/contracts` repo)
- **UI Icons:** [Lucide React](https://lucide.dev/)
- **Notifications:** [Sonner](https://sonner.emilkowal.ski/)
- **File Storage:** [Pinata](https://www.pinata.cloud/) (IPFS)
- **Authentication:** [@campnetwork/origin](https://github.com/campnetwork/origin)

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm, yarn, pnpm, or bun
- Access to an EVM-compatible wallet (MetaMask, etc.)
- Pinata API keys (for image uploads)
- Smart contract deployed (see [Smart Contract Integration](#smart-contract-integration))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/fiidbak-web.git
   cd fiidbak-web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   # or
   bun install
   ```

3. **Configure environment variables:**  
   See [Environment Variables](#environment-variables).

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open your browser:**  
   Visit [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Create a `.env.local` file in the root directory and add the following:
