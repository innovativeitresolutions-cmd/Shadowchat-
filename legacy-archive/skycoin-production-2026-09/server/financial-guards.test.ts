import { describe, expect, it } from 'vitest';
import { walletManager } from './secure-wallet';
import { baseSwapEngine } from './base-swap-engine';
import { WalletRewardRouter } from './wallet-reward-router';

describe('financial operations without a live provider', () => {
  it('does not accept or expose private keys', async () => {
    await expect(walletManager.createWallet('0x1', 'secret', 'ethereum', 'user')).rejects.toThrow('unavailable');
    await expect(walletManager.getPrivateKey('0x1', 'user')).rejects.toThrow('unavailable');
  });

  it('does not claim transfers or swaps succeeded', async () => {
    await expect(walletManager.transferFunds('from', 'to', 1, 'ETH', 'user')).rejects.toThrow('unavailable');
    await expect(walletManager.routeMiningRewards('miner', 1, 'ETH')).rejects.toThrow('unavailable');
    await expect(baseSwapEngine.executeSwap('BTC', 'ETH', 1, 'from', 'to')).rejects.toThrow('not configured');
  });

  it('rejects automatic conversion and invalid swap amounts', async () => {
    const router = new WalletRewardRouter();
    await expect(router.configureWallet({
      userId: 'user', primaryWallet: `0x${'1'.repeat(40)}`,
      autoConvertToETH: true, autoWithdraw: false,
      withdrawalThreshold: 1, withdrawalFrequency: 'daily',
    })).rejects.toThrow('provider');
    await expect(baseSwapEngine.getSwapQuote('BTC', 'ETH', Number.NaN)).rejects.toThrow('positive finite');
    await expect(baseSwapEngine.getSwapQuote('BTC', 'ETH', -1)).rejects.toThrow('positive finite');
  });
});
