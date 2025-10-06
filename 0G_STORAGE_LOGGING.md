# 📝 0G Storage Upload Logging Guide

## Console Logs You'll See

### **When Uploading to 0G Storage:**

```
🔄 Preparing to upload learning data to 0G Storage...
📊 Current metrics: {
  intelligenceScore: 342,
  totalActions: 10,
  successRate: 80,
  version: 5
}

⏳ Uploading to 0G Storage...

📤 Starting 0G Storage upload...
📊 Metadata: {
  domain: "gathin",
  agentType: "defi_trader",
  intelligenceScore: 342,
  totalActions: 10
}

🔐 Metadata hash calculated: 0xabc123...

✍️  Signing metadata...
✅ Metadata signed: 0x1234567890abcdef...

📦 Metadata buffer created: 4582 bytes
📄 ZG File object created

🌳 Generating merkle tree...
✅ Merkle tree generated successfully

☁️  Uploading to 0G Storage network...
🔗 RPC URL: https://indexer-storage-testnet-turbo.0g.ai
👤 Signer address: 0x1234...5678

✅ Upload completed in 2345 ms
📝 Transaction: { ... }

🎉 Upload successful!
📍 Root Hash: 0xdef456...
🔗 Metadata Hash: 0xabc123...
⏱️  Total upload time: 2345 ms

✅ Successfully uploaded to 0G Storage!
📍 Root Hash: 0xdef456...
🔗 Metadata Hash: 0xabc123...
⏱️  Upload took: 2345 ms
🎯 You can retrieve this data using the root hash
```

---

## Log Stages Explained

### **Stage 1: Preparation** 🔄
```
🔄 Preparing to upload learning data to 0G Storage...
📊 Current metrics: { ... }
```
- Shows what data is about to be uploaded
- Current intelligence score and stats

### **Stage 2: Hash Calculation** 🔐
```
🔐 Metadata hash calculated: 0xabc123...
```
- Creates unique hash of your metadata
- Used for verification

### **Stage 3: Signing** ✍️
```
✍️  Signing metadata...
✅ Metadata signed: 0x1234...
```
- Wallet signs the metadata
- Proves ownership

### **Stage 4: File Creation** 📦
```
📦 Metadata buffer created: 4582 bytes
📄 ZG File object created
```
- Converts metadata to uploadable format
- Shows file size

### **Stage 5: Merkle Tree** 🌳
```
🌳 Generating merkle tree...
✅ Merkle tree generated successfully
```
- Creates cryptographic proof structure
- Enables efficient verification

### **Stage 6: Upload** ☁️
```
☁️  Uploading to 0G Storage network...
🔗 RPC URL: https://...
👤 Signer address: 0x1234...5678
```
- Actual upload to 0G network
- Shows connection details

### **Stage 7: Success** 🎉
```
🎉 Upload successful!
📍 Root Hash: 0xdef456...
🔗 Metadata Hash: 0xabc123...
⏱️  Total upload time: 2345 ms
```
- Upload completed
- Root hash = your data's address on 0G Storage
- Save this to retrieve data later!

---

## Error Logs

### **If Upload Fails:**

```
❌ Error uploading to 0G Storage: Error message here
📋 Error details: {
  message: "...",
  stack: "..."
}
⚠️  Learning data saved locally but not backed up to 0G Storage
```

**What this means:**
- Upload to 0G Storage failed
- Your data is **still safe in localStorage**
- You can try syncing again later

### **Common Errors:**

**1. Network Timeout**
```
❌ Upload failed: Request timeout
```
**Solution:** Try again, network might be slow

**2. Insufficient Balance**
```
❌ Upload failed: Insufficient funds
```
**Solution:** Need more 0G tokens for gas

**3. Invalid Signer**
```
❌ Upload failed: Signer address mismatch
```
**Solution:** Wallet connection issue, reconnect

---

## How to Monitor Upload

### **Open Browser Console:**
1. **Chrome/Brave:** Press `F12` or `Cmd+Option+J` (Mac)
2. **Firefox:** Press `F12` or `Cmd+Option+K` (Mac)
3. Click **Console** tab

### **Filter Logs:**
- Type `0G` in filter to see only 0G Storage logs
- Type `📤` to see upload start
- Type `✅` to see successes
- Type `❌` to see errors

---

## Log Timeline Example

```
[00:00.000] 🔄 Preparing to upload...
[00:00.050] 📤 Starting 0G Storage upload...
[00:00.100] 🔐 Metadata hash calculated
[00:00.150] ✍️  Signing metadata...
[00:00.500] ✅ Metadata signed
[00:00.550] 📦 Metadata buffer created: 4582 bytes
[00:00.600] 🌳 Generating merkle tree...
[00:00.800] ✅ Merkle tree generated
[00:00.850] ☁️  Uploading to 0G Storage network...
[00:03.195] ✅ Upload completed in 2345 ms
[00:03.200] 🎉 Upload successful!
[00:03.205] 📍 Root Hash: 0xdef456...
```

**Total Time: ~3.2 seconds**

---

## Important Root Hash

### **Save Your Root Hash!**

The root hash is returned at the end:
```
📍 Root Hash: 0xdef4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**What you can do with it:**
1. Retrieve your data from 0G Storage
2. Verify data integrity
3. Share with others (if public)
4. Store on-chain in INFT contract

### **To Retrieve Data:**
```typescript
const metadata = await storageService.downloadAgentMetadata(rootHash);
```

---

## Performance Metrics

**Typical Upload Times:**

| Data Size | Upload Time |
|-----------|-------------|
| < 5 KB | 1-2 seconds |
| 5-10 KB | 2-3 seconds |
| 10-50 KB | 3-5 seconds |
| 50-100 KB | 5-10 seconds |

**Factors affecting speed:**
- Network latency
- Data size
- 0G network load
- Your internet speed

---

## Testing

### **To test logging:**
1. Open browser console (F12)
2. Go to learning dashboard
3. Click test buttons
4. If using advanced learning tracker, watch logs appear
5. Each action shows full upload process

### **Expected Output:**
- Clear step-by-step progress
- Timing information
- Success/failure indicators
- Root hash at the end

---

## Summary

**You now have:**
- ✅ Detailed console logging
- ✅ Step-by-step progress tracking
- ✅ Error details
- ✅ Performance metrics
- ✅ Root hash for data retrieval

**Every upload is fully logged!** 📝
