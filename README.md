# Stacks DeFi Activity Tracker 📊  
### Real-Time On-Chain Analytics Built on Stacks

![Built on Stacks](https://img.shields.io/badge/Built%20on-Stacks-orange)
![Chainhooks](https://img.shields.io/badge/Data-Hiro%20Chainhooks-blue)
![Status](https://img.shields.io/badge/Status-Live-brightgreen)
![Backend](https://img.shields.io/badge/Backend-Node.js-informational)
![Frontend](https://img.shields.io/badge/Frontend-Next.js-black)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## 🚀 Overview

Stacks DeFi Activity Tracker is a **Stacks-native analytics platform** that indexes and analyzes on-chain activity directly from the **Stacks blockchain**, secured by Bitcoin.

The system uses Hiro Chainhooks to stream blockchain events in real time, enabling a fully transparent, API-free data pipeline for DeFi analytics.

---

## 🔗 Built on Stacks

- Native to the **Stacks blockchain**
- Data sourced directly from **on-chain Clarity smart contract events**
- Powered by **Hiro Chainhooks**
- Supports **Stacks Mainnet**
- No reliance on third-party APIs

---

## 👤 Attribution

- Built and maintained by: SPXXXXX  
- All indexed data originates from the Stacks blockchain  

---

## 🧱 Architecture

Stacks Blockchain  
↓  
Hiro Chainhooks (FT Events)  
↓  
Webhook → Backend (Node.js + Express)  
↓  
PostgreSQL Database  
↓  
Next.js Frontend Dashboard  

---

## 🔍 Chainhooks Integration

This project uses Hiro Chainhooks to subscribe directly to Stacks blockchain events.

### Tracked Data
- Fungible Token (FT) transfer events  
- Transaction IDs  
- Sender and recipient addresses  
- Block height  
- Decoded Clarity values  

### Example Configuration

```json
{
  "chain": "stacks",
  "if_this": {
    "scope": "ft_event",
    "actions": ["transfer"],
    "asset_identifier": "SP000000000000000000002Q6VF78.bns::names"
  },
  "then_that": {
    "http_post": {
      "url": "https://your-backend/webhook/token_transfer",
      "authorization_header": "x-api-key: your_api_key"
    }
  }
}
```

---

## 📊 Features

### Dashboard
- Total Value Locked (TVL)  
- Active user count  
- Real-time transaction feed  
- Historical analytics  

### Wallet View
- Per-wallet activity tracking  
- Token transfer history  

### Backend
- Chainhooks webhook ingestion  
- PostgreSQL storage  
- WebSocket real-time updates  
- Scalable API layer  

---

## 🌐 Live Links

- Live App: https://your-vercel-url.vercel.app  
- API: https://your-backend/api/stats  
- Explorer: https://explorer.hiro.so  

---

## 🛠 Tech Stack

### Frontend
- Next.js  
- React 18  
- Recharts  

### Backend
- Node.js  
- Express  
- PostgreSQL  
- WebSockets  

---

## ⚙️ Environment Variables

### Backend

DATABASE_URL=postgresql://user:password@host:5432/db  
API_KEY=your_api_key  
NETWORK=mainnet  

### Frontend

NEXT_PUBLIC_API_BASE_URL=https://your-backend  
NEXT_PUBLIC_WS_URL=wss://your-backend  

---

## 📡 API Endpoints

GET /api/stats  
GET /api/tvl-history  
GET /api/wallet/:address  

POST /webhook/:type  

---

## 🧪 Local Development

### Backend

```bash
npm install
npm start
```

### Frontend

```bash
npm install
npm run dev
```

---

## 🌱 Extending This Project

- Multi-token tracking  
- NFT event indexing  
- Protocol-level analytics  
- Alerting system  
- Testnet support  

---

## 🧠 Why This Matters

This project demonstrates:

- Direct consumption of **Stacks blockchain data**
- Real-world use of **Hiro Chainhooks**
- Deep understanding of **Clarity event structures**
- Scalable **DeFi analytics infrastructure**

---

## 📌 Status

- Chainhooks: Active  
- Backend: Running  
- Frontend: Live  
- Multi-asset support: In progress  

---

## 📅 Last Updated
2026-03-25
