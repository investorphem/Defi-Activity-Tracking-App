# Stacks DeFi Activity Tracker – API Documentation

This document provides the **full API reference** for the Stacks DeFi Activity Tracker backend. It is intended for developers, third-party integrations, and dashboards.

---

## Base URL

https://YOUR_BACKEND_URL

> Replace `YOUR_BACKEND_URL` with the actual deployed backend endpoint.

---

## Authentication

All endpoints are protected using an **API key**.

### Header

x-api-key: YOUR_API_KEY

- Replace `YOUR_API_KEY` with the key set in your `.env` file.
- Requests without a valid key will return **401 Unauthorized**.

---

## Rate Limiting

- Maximum 60 requests per 60 seconds per IP/key.
- Exceeding the limit will return **429 Too Many Requests**.

---

## REST API Endpoints

### 1️⃣ Get General Stats

**Endpoint**: `GET /api/stats`

**Description**: Returns overall DeFi stats including TVL, active users, and recent events.

**Response Example**:

```json
{
  "tvl": 12000,
  "users": 42,
  "events": [
    {
      "tx_id": "0xabc123",
      "protocol": "STACKS-DEFI",
      "event_type": "deposit",
      "sender": "SP123...",
      "amount": 500,
      "asset": "STX",
      "block_height": 123456,
      "created_at": "2025-12-16T12:00:00Z"
    }
  ]
}


---

2️⃣ Get TVL History

Endpoint: GET /api/tvl-history

Description: Returns historical Total Value Locked (TVL) aggregated by day.

Response Example:

[
  { "day": "2025-12-14", "tvl": 10000 },
  { "day": "2025-12-15", "tvl": 11500 },
  { "day": "2025-12-16", "tvl": 12000 }
]


---

3️⃣ Get Wallet Activity

Endpoint: GET /api/wallet/{address}

Parameters:

Parameter	Type	Description

address	string	Wallet address to query


Response Example:

[
  {
    "tx_id": "0xabc123",
    "protocol": "STACKS-DEFI",
    "event_type": "deposit",
    "sender": "SP123...",
    "amount": 500,
    "asset": "STX",
    "block_height": 123456,
    "created_at": "2025-12-16T12:00:00Z"
  }
]


---

4️⃣ WebSocket Live Updates

Endpoint: wss://YOUR_BACKEND_URL:4000

Message Format:

{
  "tx_id": "0xabc123",
  "protocol": "STACKS-DEFI",
  "event_type": "deposit",
  "sender": "SP123...",
  "amount": 500,
  "asset": "STX",
  "block_height": 123456
}


---

Event Types

Event Type	Description

deposit	Funds deposited into a vault
withdraw	Funds withdrawn from a vault
transfer	Token transfer (SIP-010 FT)



---

Error Codes

Status	Meaning

200	Success
401	Unauthorized (invalid API key)
429	Too Many Requests
500	Internal Server Error



---

Contact

Author: @investorphem
GitHub: https://github.com/investorphem

