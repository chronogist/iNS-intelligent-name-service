/**
 * Simple Learning Service
 * Tracks transactions and calculates intelligence score
 */

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gas: string;
  timestamp: number;
  success: boolean;
}

export interface LearningData {
  domain: string;
  agentType: string;
  intelligenceScore: number;
  totalActions: number;
  successfulActions: number;
  transactions: Transaction[];
  lastUpdated: number;
}

const STORAGE_KEY = 'ins_learning_data';

/**
 * Get learning data for a domain from localStorage
 */
export function getLearningData(domain: string): LearningData | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${domain}`);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error: any) {
    console.error('Error loading learning data:', error);
    return null;
  }
}

/**
 * Initialize learning data for a new domain
 */
export function initLearningData(domain: string, agentType: string): LearningData {
  const data: LearningData = {
    domain,
    agentType,
    intelligenceScore: 0,
    totalActions: 0,
    successfulActions: 0,
    transactions: [],
    lastUpdated: Date.now(),
  };
  saveLearningData(data);
  return data;
}

/**
 * Save learning data to localStorage
 */
export function saveLearningData(data: LearningData) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${data.domain}`, JSON.stringify(data));
  } catch (error: any) {
    console.error('Error saving learning data:', error);
  }
}

/**
 * Record a new transaction
 */
export function recordTransaction(
  domain: string,
  tx: Omit<Transaction, 'success'>,
  success: boolean
): LearningData {
  let data = getLearningData(domain);
  if (!data) {
    console.warn('No learning data found, initializing...');
    data = initLearningData(domain, 'custom');
  }

  // Add transaction
  data.transactions.push({ ...tx, success });
  data.totalActions++;
  if (success) {
    data.successfulActions++;
  }

  // Recalculate intelligence score
  data.intelligenceScore = calculateIntelligence(data);
  data.lastUpdated = Date.now();

  saveLearningData(data);
  return data;
}

/**
 * Simple intelligence calculation
 */
function calculateIntelligence(data: LearningData): number {
  if (data.totalActions === 0) return 0;

  // Success rate component (0-400 points)
  const successRate = data.successfulActions / data.totalActions;
  const successScore = Math.min(400, successRate * 400);

  // Experience component (0-300 points)
  const experienceScore = Math.min(300, Math.log10(data.totalActions + 1) * 100);

  // Total value component (0-200 points)
  const totalValue = data.transactions.reduce((sum, tx) => sum + BigInt(tx.value || '0'), BigInt(0));
  const valueScore = Math.min(200, Math.log10(Number(totalValue) / 1e18 + 1) * 40);

  // Gas efficiency component (0-100 points)
  const avgGas = data.transactions.reduce((sum, tx) => sum + Number(tx.gas || '0'), 0) / data.transactions.length;
  const gasScore = Math.max(0, 100 - (avgGas / 1000000) * 10); // Lower gas = higher score

  return Math.floor(successScore + experienceScore + valueScore + gasScore);
}

/**
 * Get pending transaction count (not synced to blockchain)
 */
export function getPendingCount(domain: string): number {
  const data = getLearningData(domain);
  return data?.transactions.length || 0;
}

/**
 * Clear all transactions after sync
 */
export function clearAfterSync(domain: string) {
  const data = getLearningData(domain);
  if (data) {
    data.transactions = [];
    saveLearningData(data);
  }
}
