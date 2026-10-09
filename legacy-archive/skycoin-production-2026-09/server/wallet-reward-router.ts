import crypto from 'crypto';
import { notifyOwner } from './_core/notification';

interface WalletConfig {
  userId: string;
  primaryWallet: string; // Ethereum address
  secondaryWallet?: string;
  autoConvertToETH: boolean;
  autoWithdraw: boolean;
  withdrawalThreshold: number; // USD amount
  withdrawalFrequency: 'daily' | 'weekly' | 'monthly';
}

interface RewardTransaction {
  id: string;
  userId: string;
  coin: string;
  amount: number;
  usdValue: number;
  sourcePool: string;
  destinationWallet: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  timestamp: number;
  convertedToETH?: boolean;
}

/**
 * Wallet Reward Router
 * Automatically routes mining rewards to user's wallet
 * Handles conversion and withdrawal logic
 */
export class WalletRewardRouter {
  private walletConfigs: Map<string, WalletConfig> = new Map();
  private rewardHistory: Map<string, RewardTransaction[]> = new Map();

  constructor() {
  }

  /**
   * Configure wallet for a user
   */
  async configureWallet(config: WalletConfig): Promise<void> {
    if (config.autoConvertToETH || config.autoWithdraw) {
      throw new Error('Automatic conversions and withdrawals require a configured blockchain provider.');
    }
    // Validate Ethereum address
    if (!this.isValidEthereumAddress(config.primaryWallet)) {
      throw new Error('Invalid Ethereum address');
    }

    this.walletConfigs.set(config.userId, config);
    this.rewardHistory.set(config.userId, []);

    
    // Notify owner
    await notifyOwner({
      title: 'Wallet Configuration Updated',
      content: `User ${config.userId} configured wallet: ${config.primaryWallet}. Auto-convert: ${config.autoConvertToETH}, Auto-withdraw: ${config.autoWithdraw}`,
    });
  }

  /**
   * Get wallet configuration
   */
  getWalletConfig(userId: string): WalletConfig | null {
    return this.walletConfigs.get(userId) || null;
  }

  /**
   * Record mining reward
   */
  async recordReward(
    userId: string,
    coin: string,
    amount: number,
    usdValue: number,
    sourcePool: string
  ): Promise<RewardTransaction> {
    const config = this.walletConfigs.get(userId);
    if (!config) {
      throw new Error(`No wallet configured for user ${userId}`);
    }

    const transaction: RewardTransaction = {
      id: `reward-${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substr(2, 9)}`,
      userId,
      coin,
      amount,
      usdValue,
      sourcePool,
      destinationWallet: config.primaryWallet,
      status: 'pending',
      timestamp: Date.now(),
    };

    // Store transaction
    const history = this.rewardHistory.get(userId) || [];
    history.push(transaction);
    this.rewardHistory.set(userId, history);


    return transaction;
  }

  /**
   * Validate Ethereum address
   */
  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get reward history for user
   */
  getRewardHistory(userId: string, limit: number = 50): RewardTransaction[] {
    const history = this.rewardHistory.get(userId) || [];
    return history.slice(-limit);
  }

  /**
   * Get total earnings for user
   */
  getTotalEarnings(userId: string): { coins: Record<string, number>; usd: number } {
    const history = this.rewardHistory.get(userId) || [];
    const coins: Record<string, number> = {};
    let totalUSD = 0;

    for (const reward of history) {
      if (reward.status === 'completed') {
        coins[reward.coin] = (coins[reward.coin] || 0) + reward.amount;
        totalUSD += reward.usdValue;
      }
    }

    return { coins, usd: totalUSD };
  }


}

// Export singleton
export const walletRewardRouter = new WalletRewardRouter();
