# 🧠 Simple AI Learning System

## How It Works

1. **Register a domain** with an agent type (DeFi Trader, Gas Optimizer, etc.)
2. **Make transactions** - the system tracks them automatically (or test manually)
3. **Intelligence grows** in real-time based on your actions
4. **Sync to blockchain** when ready (batched updates to save gas)

## Quick Start

### 1. Test the Learning System

Add these components to your domain page to test:

```tsx
import LearningSync from '@/components/LearningSync';
import LearningTest from '@/components/LearningTest';

// In your domain page:
<LearningTest domain="yourname" agentType="custom" />
<LearningSync domain="yourname" inftAddress="0x..." />
```

### 2. Record Test Transactions

Click "Success" or "Failure" buttons to record test transactions. Watch the intelligence score grow!

### 3. Sync to Blockchain

When you have several actions recorded, click "Sync to Chain" to update the on-chain state.

## Components

### `simple-learning.ts`
- Lightweight learning tracker
- Stores data in localStorage
- Calculates intelligence score
- No backend required!

### `LearningSync.tsx`
- Shows pending learning updates
- Syncs to blockchain in one transaction
- Displays current intelligence stats

### `LearningTest.tsx`
- Test button for development
- Manually record success/failure
- See learning in action

## Intelligence Calculation

**Score Range: 0-1000**

- **Success Rate (0-400 pts)**: Higher success = higher score
- **Experience (0-300 pts)**: More actions = more experience
- **Value (0-200 pts)**: Higher transaction values = higher score
- **Gas Efficiency (0-100 pts)**: Lower gas usage = higher score

## Data Structure

```typescript
{
  domain: string;
  agentType: string;
  intelligenceScore: number;
  totalActions: number;
  successfulActions: number;
  transactions: Transaction[];
  lastUpdated: number;
}
```

## Next Steps (Optional Improvements)

- ✅ Basic learning works
- ⏳ Add automatic transaction detection (useTransactionMonitor hook exists)
- ⏳ Add more agent-specific learning logic
- ⏳ Store detailed metadata on 0G Storage
- ⏳ Add analytics and insights

## Files Created

```
frontend/
├── lib/simple-learning.ts          # Core learning logic
├── hooks/useTransactionMonitor.ts  # Auto transaction detection
├── components/
│   ├── LearningSync.tsx            # Sync button
│   └── LearningTest.tsx            # Test button
└── app/domains/[name]/learning/page.tsx # Updated dashboard
```

## Usage Example

```typescript
import { recordTransaction, getLearningData } from '@/lib/simple-learning';

// Record a transaction
const tx = {
  hash: '0x...',
  from: '0x...',
  to: '0x...',
  value: '1000000000000000000',
  gasPrice: '20000000000',
  gas: '21000',
  timestamp: Date.now()
};

recordTransaction('myname', tx, true); // success!

// Get current intelligence
const data = getLearningData('myname');
console.log(`Intelligence: ${data.intelligenceScore}/1000`);
```

That's it! Simple, clean, and it works! 🚀
