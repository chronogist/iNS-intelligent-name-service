# 🚀 Quick Test Guide - AI Learning System

## Test in 3 Steps:

### 1. **Register a Domain**
- Go to homepage
- Search for a domain name
- Choose an agent type (e.g., "DeFi Trader")
- Complete registration
- ✅ Learning data is auto-initialized

### 2. **Record Test Transactions**
- Go to your domain page: `/domains/yourname`
- You'll see two new cards:
  - **🧪 Test Learning System** (yellow card)
  - **🧠 Intelligence Update Available** (purple card)
- Click **"Success"** or **"Failure"** buttons multiple times
- Watch the intelligence score increase!

### 3. **Sync to Blockchain**
- After recording several actions (e.g., 5-10)
- Click **"Sync to Chain"** button
- Confirm the transaction in your wallet
- ✅ On-chain state updated!

## View Learning Dashboard

- Click **"AI Learning Dashboard"** on your domain page
- See real-time intelligence stats
- View recent actions and learning progress

## What You'll See:

```
📊 Intelligence: 302/1000 (Learning Level)
✅ Success Rate: 83%
🔥 6 actions pending sync

[Sync to Chain] button
```

## Expected Behavior:

1. **Each test click** → Intelligence score increases
2. **More success** → Higher intelligence score
3. **More actions** → More experience points
4. **Sync to chain** → Updates INFT contract on-chain

## Intelligence Score Breakdown:

- **0-300**: Beginner
- **300-600**: Learning
- **600-700**: Intermediate
- **700-800**: Advanced
- **800-900**: Expert
- **900-1000**: Genius

## Files to Check:

```
frontend/
├── app/domains/[name]/page.tsx        # Test buttons visible here
├── app/domains/[name]/learning/page.tsx  # Dashboard shows real data
└── components/
    ├── LearningTest.tsx               # Yellow test card
    └── LearningSync.tsx               # Purple sync card
```

## Troubleshooting:

**Q: I don't see the test buttons**
- Make sure you're on a domain page you own
- Check browser console for errors

**Q: Sync button doesn't appear**
- Record at least one action first
- Check that INFT address is loaded

**Q: Intelligence score is 0**
- Click test buttons first
- Success actions give more points than failures

**Q: Where is the data stored?**
- Locally: Browser localStorage
- On-chain: After clicking "Sync to Chain"

## Next Steps:

- Test with multiple domains
- Try different agent types
- View the learning dashboard
- Check on-chain state after sync

That's it! Simple and it works! 🎉
