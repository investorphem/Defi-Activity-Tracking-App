# Stacks DeFi Activity Tracker

A production-ready, real-time DeFi analytics platform built on the **Stacks blockchain** using **Hiro Chainhooks**.  
The system indexes onchain activity, exposes analytics APIs, and provides a live dashboard for DeFi protocols, developers, and researchers.

---

## Overview

Stacks DeFi Activity Tracker listens to onchain events in real time and transforms them into structured, queryable analytics.  
It is designed as an **event-driven indexer** that can be consumed by dashboards, third-party services, and protocol teams.

The platform supports live tracking of deposits, withdrawals, token transfers, and user activity across multiple DeFi protocols on Stacks.

---

## Key Features

- Real-time onchain indexing via Hiro Chainhooks  
- DeFi event tracking (deposits, withdrawals, SIP-010 transfers)  
- Total Value Locked (TVL) analytics and historical charts  
- Wallet profile pages with full activity history  
- WebSocket live updates for instant UI refresh  
- Secure API access with API keys and rate limiting  
- Multi-protocol tracking support  
- Testnet and Mainnet environment toggle  
- Vercel-ready frontend deployment  

---

## Architecture

Stacks Blockchain  
→ Hiro Chainhooks  
→ Backend Indexer (Node.js + PostgreSQL)  
→ Analytics API & WebSocket Server  
→ Next.js Dashboard (Vercel)

---

## Tech Stack

**Blockchain & Indexing**
- Stacks
- Hiro Chainhooks

**Backend**
- Node.js
- Express
- PostgreSQL
- WebSockets
- API Key & Rate Limiting Middleware

**Frontend**
- Next.js (App Router)
- Recharts
- Vercel Deployment

---

## Repository Structure

defi-activity-tracker/  
├── chainhooks/  
├── backend/  
├── frontend/  
└── README.md  

---

## Getting Started

### Backend Setup

1. Create a PostgreSQL database  
2. Run the database schema  
3. Configure environment variables  
4. Start the backend service  

---

## API Access

All analytics endpoints are protected using API keys.

Header:
x-api-key: YOUR_API_KEY

---

## Use Cases

- DeFi protocol analytics dashboards  
- Onchain activity monitoring  
- Wallet behavior analysis  
- DAO reporting tools  
- Research and ecosystem insights  
- Third-party DeFi integrations  

---

## License

MIT License

---

## Author

Built and maintained by **@investorphem**
