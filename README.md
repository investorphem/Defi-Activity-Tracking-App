# Stacks DeFi Activity Tracker

A Stacks-native DeFi analytics and activity tracking platform that indexes on-chain events directly from the Stacks blockchain using Hiro Chainhooks. The app provides real-time insights into token transfers, user activity, and TVL trends without relying on third-party APIs.

---

## 🚀 Overview

Stacks DeFi Activity Tracker monitors fungible token (FT) activity on the Stacks blockchain and presents meaningful metrics through a clean frontend dashboard.

Key focus areas:
- On-chain event indexing
- Real-time DeFi activity tracking
- Transparent, API-free data sourcing
- Scalable backend architecture

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

## 🔗 Chainhooks Integration (Core Feature)

This project uses Hiro Chainhooks to subscribe directly to Stacks blockchain events.

### What is tracked
- Fungible Token (FT) events
- Token transfers
- Decoded Clarity values
- Block height, transaction ID, sender

### Example Chainhook Configuration

{
  "chain": "stacks",
  "if_this": {
    "scope": "ft_event",
    "actions": ["transfer"],
    "asset_identifier": "SP000000000000000000002Q6VF78.bns::names"
  },
  "then_that": {
    "http_post": {
      "url": "https://<BACKEND-URL>/webhook/token_transfer",
      "authorization_header": "x-api-key: <API_KEY>"
    }
  }
}

This enables trustless, real-time blockchain indexing without polling or external APIs.

---

## 📊 Features

### Dashboard
- Total Value Locked (TVL)
- Active user count
- Recent on-chain events
- Historical TVL chart

### Wallet View
- Per-wallet activity history
- Token transfers linked to addresses

### Backend
- Webhook ingestion from Chainhooks
- Rate-limited API endpoints
- WebSocket support for live updates
- PostgreSQL event storage

---

## 🛠 Tech Stack

### Frontend
- Next.js (App Router)
- React 18
- Recharts
- Deployed on Vercel

### Backend
- Node.js
- Express
- PostgreSQL
- WebSockets
- Chainhooks Webhooks

---

## 🔐 Environment Variables

### Backend (.env)

DATABASE_URL=postgresql://user:password@host:5432/db  
API_KEY=supersecretkey  
NETWORK=mainnet  

### Frontend (Vercel)

NEXT_PUBLIC_API_BASE_URL=https://<BACKEND-URL>  
NEXT_PUBLIC_WS_URL=wss://<BACKEND-URL>  

---

## 📡 API Endpoints

GET /api/stats  
GET /api/tvl-history  
GET /api/wallet/:address  

POST /webhook/:type  

---

## 🧪 Local Development

### Backend

npm install  
npm start  

### Frontend

npm install  
npm run dev  

---

## 🌱 Extending This Project

- Monitor multiple FT contracts
- Track NFT mint and transfer events
- Add protocol-level analytics
- Introduce alerts and notifications
- Support testnet and mainnet switching

---

## 🧠 Why This Matters

This project demonstrates:
- Direct blockchain data consumption
- Real-world use of Chainhooks
- Scalable DeFi analytics architecture
- Deep understanding of the Stacks ecosystem

---

## 📌 Status

Chainhooks: Active  
Backend ingestion: Ready  
Frontend dashboard: Live  
Multi-asset support: Expandable