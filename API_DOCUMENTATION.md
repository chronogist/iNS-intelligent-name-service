# iNS API Documentation

## Base URL
```
Production: https://your-api-domain.com/api
Development: http://localhost:3000/api
```

## Authentication
Currently, all endpoints are publicly accessible. For production deployments, we will add an `X-API-Key` header for authenticated requests.

```bash
curl -H "X-API-Key: your-api-key" https://api.ins.0g/api/endpoint
```

---

## Table of Contents
1. [Domain Endpoints](#domain-endpoints)
2. [Profile Endpoints](#profile-endpoints)
3. [Marketplace Endpoints](#marketplace-endpoints)
4. [Reverse Resolution Endpoints](#reverse-resolution-endpoints)
5. [System Endpoints](#system-endpoints)

---

## Domain Endpoints

### Check Domain Availability
Check if a domain name is available for registration.

**Endpoint:** `GET /api/domains/available/:name`

**Parameters:**
- `name` (path, required): Domain name without `.0g` suffix

**Example Request:**
```bash
curl https://api.ins.0g/api/domains/available/chris
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "name": "chris",
    "available": false
  }
}
```

---

### Get Domain Price
Calculate registration price for a domain.

**Endpoint:** `GET /api/domains/price/:name`

**Parameters:**
- `name` (path, required): Domain name without `.0g` suffix
- `duration` (query, optional): Registration duration in seconds (default: 31536000 = 1 year)

**Example Request:**
```bash
curl "https://api.ins.0g/api/domains/price/chris?duration=31536000"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "name": "chris",
    "duration": 31536000,
    "price": "0.05",
    "priceFormatted": "0.05 tokens"
  }
}
```

---

## Profile Endpoints

### Get Domain Profile
Retrieve comprehensive profile data for a registered domain.

**Endpoint:** `GET /api/profile/:domain`

**Parameters:**
- `domain` (path, required): Domain name with or without `.0g` suffix

**Example Request:**
```bash
curl https://api.ins.0g/api/profile/chris
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "domain": "chris.0g",
    "owner": "0xB3AD3a10d187cbc4ca3e8c3EDED62F8286F8e16E",
    "inftAddress": "0x0F759E1c4Cb5Ff752f6AbC0D1CB7d11958028790",
    "profile": {
      "displayName": "chris",
      "bio": "",
      "avatar": "",
      "social": {},
      "professional": {},
      "portfolio": [],
      "settings": {}
    },
    "metadataHash": "0x...",
    "registered": "2025-01-15T10:30:00.000Z",
    "expires": "2026-01-15T10:30:00.000Z"
  }
}
```

---

### Get Raw Domain Metadata
Get raw on-chain metadata for debugging purposes.

**Endpoint:** `GET /api/profile/:domain/raw`

**Parameters:**
- `domain` (path, required): Domain name with or without `.0g` suffix

**Example Request:**
```bash
curl https://api.ins.0g/api/profile/chris/raw
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "domain": "chris.0g",
    "inftAddress": "0x0F759E1c4Cb5Ff752f6AbC0D1CB7d11958028790",
    "metadataURI": "data:application/json;base64,eyJ0cmFpbmluZ0RhdGEiOnt9fQ==",
    "metadataHash": "0x1234...",
    "metadataLocked": false
  }
}
```

---

### Upload Data to 0G Storage
Upload training data or metadata to 0G Storage network.

**Endpoint:** `POST /api/profile/upload`

**Request Body:**
```json
{
  "data": {
    "agentType": "trading",
    "learningData": {
      "domain": "chris",
      "totalActions": 10,
      "successfulActions": 8,
      "transactions": [...]
    },
    "performanceMetrics": {
      "intelligenceScore": 85,
      "riskTolerance": 0.8,
      "adaptabilityScore": 75
    }
  }
}
```

**Example Request:**
```bash
curl -X POST https://api.ins.0g/api/profile/upload \
  -H "Content-Type: application/json" \
  -d '{"data": {"agentType": "trading", "intelligenceScore": 85}}'
```

**Example Response:**
```json
{
  "rootHash": "0xabcdef1234567890...",
  "txHash": "0x9876543210fedcba...",
  "timestamp": "2025-01-20T15:30:00.000Z"
}
```

---

### Download Data from 0G Storage
Retrieve uploaded data from 0G Storage by root hash.

**Endpoint:** `GET /api/profile/download/:rootHash`

**Parameters:**
- `rootHash` (path, required): Root hash returned from upload

**Example Request:**
```bash
curl https://api.ins.0g/api/profile/download/0xabcdef1234567890
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "agentType": "trading",
    "learningData": {...},
    "performanceMetrics": {...}
  },
  "rootHash": "0xabcdef1234567890"
}
```

---

## Marketplace Endpoints

### Get All Marketplace Listings
Retrieve all active domain listings (for sale and rent).

**Endpoint:** `GET /api/marketplace/listings`

**Example Request:**
```bash
curl https://api.ins.0g/api/marketplace/listings
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "domain": "chris.0g",
      "type": "sale",
      "seller": "0xB3AD...",
      "price": "5.0",
      "listedAt": "2025-01-20T10:00:00.000Z",
      "active": true,
      "profile": {
        "displayName": "chris",
        "intelligenceScore": 85
      }
    }
  ]
}
```

---

### Get Marketplace Statistics
Get aggregate marketplace statistics.

**Endpoint:** `GET /api/marketplace/stats`

**Example Request:**
```bash
curl https://api.ins.0g/api/marketplace/stats
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "totalSales": 42,
    "totalRentals": 18,
    "totalVolume": "250.5",
    "activeSaleListings": 15,
    "activeRentalListings": 8
  }
}
```

---

### Get Specific Domain Listing
Get detailed listing information for a specific domain.

**Endpoint:** `GET /api/marketplace/listing/:domain`

**Parameters:**
- `domain` (path, required): Domain name without `.0g` suffix

**Example Request:**
```bash
curl https://api.ins.0g/api/marketplace/listing/chris
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "domain": "chris.0g",
    "saleActive": true,
    "seller": "0xB3AD...",
    "price": "5.0",
    "listedAt": "2025-01-20T10:00:00.000Z",
    "rentalActive": false,
    "profile": {...}
  }
}
```

---

## Reverse Resolution Endpoints

### Resolve Address to Domain
Look up the primary domain name for an Ethereum address (reverse resolution).

**Endpoint:** `GET /api/resolve/address/:address`

**Parameters:**
- `address` (path, required): Ethereum address (0x...)

**Example Request:**
```bash
curl https://api.ins.0g/api/resolve/address/0xB3AD3a10d187cbc4ca3e8c3EDED62F8286F8e16E
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "address": "0xB3AD3a10d187cbc4ca3e8c3EDED62F8286F8e16E",
    "domain": "chris.0g",
    "domainName": "chris",
    "hasPrimaryName": true
  }
}
```

**Response (No Primary Name):**
```json
{
  "success": true,
  "data": {
    "address": "0x1234567890abcdef...",
    "domain": null,
    "hasPrimaryName": false
  }
}
```

---

### Batch Resolve Addresses
Resolve multiple addresses to domains in a single request.

**Endpoint:** `POST /api/resolve/addresses`

**Request Body:**
```json
{
  "addresses": [
    "0xB3AD3a10d187cbc4ca3e8c3EDED62F8286F8e16E",
    "0x1234567890abcdef1234567890abcdef12345678"
  ]
}
```

**Limits:**
- Maximum 50 addresses per request

**Example Request:**
```bash
curl -X POST https://api.ins.0g/api/resolve/addresses \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": [
      "0xB3AD3a10d187cbc4ca3e8c3EDED62F8286F8e16E",
      "0x1234567890abcdef1234567890abcdef12345678"
    ]
  }'
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "address": "0xB3AD3a10d187cbc4ca3e8c3EDED62F8286F8e16E",
      "domain": "chris.0g",
      "domainName": "chris",
      "hasPrimaryName": true
    },
    {
      "address": "0x1234567890abcdef1234567890abcdef12345678",
      "domain": null,
      "domainName": null,
      "hasPrimaryName": false
    }
  ]
}
```

---

## System Endpoints

### Health Check
Check if the API server is running.

**Endpoint:** `GET /health` or `GET /api/health`

**Example Request:**
```bash
curl https://api.ins.0g/health
```

**Example Response:**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2025-01-20T15:45:30.000Z"
}
```

---

### Registry Information
Get blockchain and registry contract information.

**Endpoint:** `GET /api/info`

**Example Request:**
```bash
curl https://api.ins.0g/api/info
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "registryAddress": "0x507d8324A029f87BdFFF2025215AABBA0326a7bd",
    "chainId": 16600,
    "network": "0g-testnet"
  }
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Default:** 100 requests per 15 minutes per IP
- **Headers:** Rate limit info is included in response headers:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets

**Rate Limit Exceeded Response:**
```json
{
  "error": "Too many requests, please try again later."
}
```

---

## Error Responses

All error responses follow a consistent format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "details": "Additional error details (optional)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (domain/resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `501` - Not Implemented (feature coming soon)

---

## CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS):
- **Allowed Origins:** Configurable via `ALLOWED_ORIGINS` env variable (default: `*`)
- **Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers:** Content-Type, Authorization, X-API-Key
- **Credentials:** Supported
- **Max Age:** 24 hours

---

## Examples

### JavaScript/TypeScript
```typescript
// Resolve address to domain
const response = await fetch('https://api.ins.0g/api/resolve/address/0xB3AD...');
const data = await response.json();
console.log(data.data.domain); // "chris.0g"

// Check domain availability
const checkAvailable = async (name: string) => {
  const res = await fetch(`https://api.ins.0g/api/domains/available/${name}`);
  const json = await res.json();
  return json.data.available;
};
```

### Python
```python
import requests

# Reverse resolution
address = "0xB3AD3a10d187cbc4ca3e8c3EDED62F8286F8e16E"
response = requests.get(f"https://api.ins.0g/api/resolve/address/{address}")
data = response.json()
print(data['data']['domain'])  # "chris.0g"

# Batch resolution
addresses = ["0xB3AD...", "0x1234..."]
response = requests.post(
    "https://api.ins.0g/api/resolve/addresses",
    json={"addresses": addresses}
)
results = response.json()['data']
```

### cURL
```bash
# Get marketplace listings
curl https://api.ins.0g/api/marketplace/listings

# Upload to 0G Storage
curl -X POST https://api.ins.0g/api/profile/upload \
  -H "Content-Type: application/json" \
  -d '{"data": {"agentType": "trading"}}'

# Batch resolve addresses
curl -X POST https://api.ins.0g/api/resolve/addresses \
  -H "Content-Type: application/json" \
  -d '{"addresses": ["0xB3AD...", "0x1234..."]}'
```

---

## Environment Variables

Configure the API server with these environment variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Blockchain Configuration
RPC_URL=https://evmrpc-testnet.0g.ai
REGISTRY_ADDRESS=0x507d8324A029f87BdFFF2025215AABBA0326a7bd
MARKETPLACE_ADDRESS=0xf20C0fB3D11BF0c9C8de177eC7886b868a248344

# 0G Storage Configuration
INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
ZEROG_PRIVATE_KEY=your_private_key_here

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Support

For API support, issues, or feature requests:
- GitHub: https://github.com/your-org/ins
- Discord: https://discord.gg/your-server
- Email: dev@ins.0g

---

## Changelog

### v1.0.0 (2025-01-20)
- Initial API release
- Domain availability and pricing
- Profile management with 0G Storage
- Marketplace listings and stats
- **NEW:** Reverse resolution (address → domain)
- **NEW:** Batch address resolution
- **NEW:** External API access with CORS
