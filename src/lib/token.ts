/**
 * $SIP Token Utilities
 * Handles token balance, formatting, and transfer operations
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getConnection } from './solana';

// Token configuration - Using pump.fun token for testing
export const SIP_TOKEN_MINT = process.env.NEXT_PUBLIC_SIP_TOKEN_MINT || '4ng1bCFUvdh4ZYdiDsuYuqEZ3uaEDiPA17xWva1upump';
export const SIP_DECIMALS = 6; // pump.fun tokens typically use 6 decimals
export const SIP_SYMBOL = '$SIP';

// Treasury wallet to receive token feeds
export const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET || '';

// Token distribution (for reference)
export const TOKEN_DISTRIBUTION = {
  totalSupply: 1_000_000_000, // 1 billion
  communityRewards: 0.40,     // 40% - Staking and game rewards
  team: 0.25,                 // 25% - Team (vested 2 years)
  treasury: 0.20,             // 20% - Game operations
  liquidity: 0.10,            // 10% - DEX liquidity pools
  airdrops: 0.05,             // 5% - Marketing and airdrops
};

/**
 * Format $SIP amount from raw units (with decimals) to display string
 */
export function formatSipAmount(rawAmount: number, decimals: number = 2): string {
  const amount = rawAmount / Math.pow(10, SIP_DECIMALS);

  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(decimals)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(decimals)}K`;
  }
  return amount.toFixed(decimals);
}

/**
 * Format $SIP amount with full precision
 */
export function formatSipFull(rawAmount: number): string {
  const amount = rawAmount / Math.pow(10, SIP_DECIMALS);
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: SIP_DECIMALS,
  });
}

/**
 * Parse $SIP amount from user input to raw units
 */
export function parseSipAmount(displayAmount: string | number): number {
  const amount = typeof displayAmount === 'string' ? parseFloat(displayAmount) : displayAmount;
  if (isNaN(amount)) return 0;
  return Math.floor(amount * Math.pow(10, SIP_DECIMALS));
}

/**
 * Validate if an amount is valid for transactions
 */
export function isValidSipAmount(amount: number, minAmount: number = 0): boolean {
  return !isNaN(amount) && isFinite(amount) && amount >= minAmount;
}

// Token Program IDs
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

/**
 * Get Associated Token Address (ATA) for a wallet and mint
 */
export function getAssociatedTokenAddress(
  walletAddress: PublicKey,
  tokenMint: PublicKey,
  tokenProgramId: PublicKey = TOKEN_PROGRAM_ID
): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [
      walletAddress.toBuffer(),
      tokenProgramId.toBuffer(),
      tokenMint.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return address;
}

/**
 * Detect which token program a mint uses
 */
async function detectTokenProgram(connection: Connection, mint: PublicKey): Promise<PublicKey> {
  // Get mint account info
  const mintInfo = await connection.getAccountInfo(mint);
  if (!mintInfo) {
    return TOKEN_PROGRAM_ID; // Default
  }

  // Check which program owns the mint account
  if (mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    return TOKEN_2022_PROGRAM_ID;
  }
  return TOKEN_PROGRAM_ID;
}

/**
 * Get $SIP token balance for a wallet
 * Fetches real balance from Solana blockchain
 */
export async function getSipBalance(walletAddress: string): Promise<{
  balance: number;
  balanceUI: number;
  formatted: string;
}> {
  if (!SIP_TOKEN_MINT) {
    // Development mode: return simulated balance
    const simulatedBalance = 10000 * Math.pow(10, SIP_DECIMALS);
    return {
      balance: simulatedBalance,
      balanceUI: 10000,
      formatted: formatSipAmount(simulatedBalance),
    };
  }

  try {
    const connection = getConnection();
    const walletPubkey = new PublicKey(walletAddress);
    const tokenMint = new PublicKey(SIP_TOKEN_MINT);

    // Detect which token program this mint uses
    const tokenProgramId = await detectTokenProgram(connection, tokenMint);
    console.log('Token program detected:', tokenProgramId.toBase58());

    // Get associated token account address with correct program
    const ataAddress = getAssociatedTokenAddress(walletPubkey, tokenMint, tokenProgramId);
    console.log('ATA address:', ataAddress.toBase58());

    // Try to get account info
    const accountInfo = await connection.getAccountInfo(ataAddress);

    if (!accountInfo) {
      // Token account doesn't exist - user has no tokens
      console.log('Token account does not exist');
      return {
        balance: 0,
        balanceUI: 0,
        formatted: '0',
      };
    }

    // Parse token account data (SPL Token account layout)
    // Offset 64 = amount (u64, 8 bytes)
    const data = accountInfo.data;
    const amount = data.readBigUInt64LE(64);
    const balance = Number(amount);
    const balanceUI = balance / Math.pow(10, SIP_DECIMALS);

    console.log('Token balance:', balanceUI);

    return {
      balance,
      balanceUI,
      formatted: formatSipAmount(balance),
    };
  } catch (error) {
    console.error('Error getting SIP balance:', error);
    return {
      balance: 0,
      balanceUI: 0,
      formatted: '0',
    };
  }
}

/**
 * Check if user has sufficient $SIP balance
 */
export async function hasSufficientBalance(
  walletAddress: string,
  requiredAmount: number
): Promise<boolean> {
  const { balance } = await getSipBalance(walletAddress);
  return balance >= requiredAmount;
}

/**
 * Calculate transaction fee (placeholder)
 */
export function estimateTransactionFee(): number {
  // Solana transaction fees are typically ~0.000005 SOL
  return 5000; // lamports
}

/**
 * Build transfer instruction (placeholder for future implementation)
 * Real implementation would use @solana/spl-token
 */
export async function buildTransferInstruction(
  from: string,
  to: string,
  amount: number
): Promise<{
  success: boolean;
  instruction?: unknown;
  error?: string;
}> {
  if (!SIP_TOKEN_MINT) {
    return {
      success: false,
      error: 'Token mint not configured',
    };
  }

  // Placeholder - real implementation would build SPL transfer instruction
  return {
    success: false,
    error: 'Not implemented - requires SPL token integration',
  };
}

/**
 * Token economics calculations
 */
export const TokenEconomics = {
  /**
   * Calculate burn amount (10% of transaction)
   */
  calculateBurn(amount: number, burnRate: number = 0.10): number {
    return Math.floor(amount * burnRate);
  },

  /**
   * Calculate winner share (90% of pot)
   */
  calculateWinnerShare(pot: number, winnerRate: number = 0.90): number {
    return Math.floor(pot * winnerRate);
  },

  /**
   * Calculate treasury contribution (2% of wins)
   */
  calculateTreasuryContribution(amount: number, rate: number = 0.02): number {
    return Math.floor(amount * rate);
  },

  /**
   * Calculate APY rewards
   */
  calculateAPYRewards(
    stakedAmount: number,
    apy: number,
    daysStaked: number
  ): number {
    const dailyRate = apy / 365;
    return Math.floor(stakedAmount * dailyRate * daysStaked);
  },

  /**
   * Calculate neglect penalty (1% per day)
   */
  calculateNeglectPenalty(
    stakedAmount: number,
    daysNeglected: number,
    penaltyRate: number = 0.01
  ): number {
    // Compound penalty: amount * (1 - penaltyRate)^days
    const remaining = stakedAmount * Math.pow(1 - penaltyRate, daysNeglected);
    return Math.floor(stakedAmount - remaining);
  },
};

/**
 * Token simulation for development/testing
 * This allows the game to work without real blockchain integration
 */
export class TokenSimulator {
  private balances: Map<string, number> = new Map();
  private static instance: TokenSimulator;

  static getInstance(): TokenSimulator {
    if (!TokenSimulator.instance) {
      TokenSimulator.instance = new TokenSimulator();
    }
    return TokenSimulator.instance;
  }

  /**
   * Initialize a wallet with starting balance
   */
  initWallet(walletAddress: string, initialBalance: number = 10000): void {
    const rawBalance = initialBalance * Math.pow(10, SIP_DECIMALS);
    this.balances.set(walletAddress, rawBalance);
  }

  /**
   * Get simulated balance
   */
  getBalance(walletAddress: string): number {
    return this.balances.get(walletAddress) || 0;
  }

  /**
   * Add tokens (for rewards)
   */
  addTokens(walletAddress: string, amount: number): boolean {
    const current = this.getBalance(walletAddress);
    this.balances.set(walletAddress, current + amount);
    return true;
  }

  /**
   * Remove tokens (for bets/fees)
   */
  removeTokens(walletAddress: string, amount: number): boolean {
    const current = this.getBalance(walletAddress);
    if (current < amount) return false;
    this.balances.set(walletAddress, current - amount);
    return true;
  }

  /**
   * Transfer tokens between wallets
   */
  transfer(from: string, to: string, amount: number): boolean {
    if (!this.removeTokens(from, amount)) return false;
    this.addTokens(to, amount);
    return true;
  }

  /**
   * Burn tokens (remove from circulation)
   */
  burn(walletAddress: string, amount: number): boolean {
    return this.removeTokens(walletAddress, amount);
  }
}

// Export singleton for development
export const tokenSimulator = TokenSimulator.getInstance();

/**
 * Verify a token transfer transaction on-chain
 * Returns the amount transferred if valid, null if invalid
 */
export async function verifyTokenTransfer(
  txSignature: string,
  expectedSender: string,
  expectedReceiver: string = TREASURY_WALLET,
  expectedMint: string = SIP_TOKEN_MINT
): Promise<{
  valid: boolean;
  amount?: number;
  amountUI?: number;
  error?: string;
}> {
  if (!txSignature) {
    return { valid: false, error: 'No transaction signature provided' };
  }

  if (!expectedReceiver) {
    return { valid: false, error: 'Treasury wallet not configured' };
  }

  try {
    const connection = getConnection();

    // Get transaction details with maxSupportedTransactionVersion
    const tx = await connection.getParsedTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });

    if (!tx) {
      return { valid: false, error: 'Transaction not found or not confirmed yet' };
    }

    if (tx.meta?.err) {
      return { valid: false, error: 'Transaction failed on-chain' };
    }

    // Look for SPL token transfer in the transaction
    const instructions = tx.transaction.message.instructions;

    for (const ix of instructions) {
      // Check if it's a parsed instruction (SPL Token)
      if ('parsed' in ix && ix.program === 'spl-token') {
        const parsed = ix.parsed;

        // Check for transfer or transferChecked
        if (parsed.type === 'transfer' || parsed.type === 'transferChecked') {
          const info = parsed.info;

          // For transferChecked, verify the mint
          if (parsed.type === 'transferChecked' && info.mint !== expectedMint) {
            continue;
          }

          // Get source and destination token accounts
          const sourceATA = info.source;
          const destATA = info.destination;

          // Get the owners of these ATAs from the transaction accounts
          const preTokenBalances = tx.meta?.preTokenBalances || [];
          const postTokenBalances = tx.meta?.postTokenBalances || [];

          // Find the transfer to treasury
          for (const postBalance of postTokenBalances) {
            if (postBalance.mint === expectedMint &&
                postBalance.owner === expectedReceiver) {
              // Found transfer to treasury, calculate amount
              const preBalance = preTokenBalances.find(
                b => b.accountIndex === postBalance.accountIndex
              );

              const preAmount = preBalance?.uiTokenAmount?.uiAmount || 0;
              const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
              const transferredAmount = postAmount - preAmount;

              if (transferredAmount > 0) {
                // Verify sender
                const senderBalance = preTokenBalances.find(
                  b => b.mint === expectedMint && b.owner === expectedSender
                );

                if (senderBalance) {
                  const rawAmount = Math.floor(transferredAmount * Math.pow(10, SIP_DECIMALS));
                  return {
                    valid: true,
                    amount: rawAmount,
                    amountUI: transferredAmount,
                  };
                }
              }
            }
          }
        }
      }
    }

    // Alternative: Check token balance changes directly
    const preTokenBalances = tx.meta?.preTokenBalances || [];
    const postTokenBalances = tx.meta?.postTokenBalances || [];

    // Find treasury balance increase
    for (const postBalance of postTokenBalances) {
      if (postBalance.mint === expectedMint &&
          postBalance.owner === expectedReceiver) {
        const preBalance = preTokenBalances.find(
          b => b.accountIndex === postBalance.accountIndex && b.mint === expectedMint
        );

        const preAmount = preBalance?.uiTokenAmount?.uiAmount || 0;
        const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
        const transferredAmount = postAmount - preAmount;

        if (transferredAmount > 0) {
          const rawAmount = Math.floor(transferredAmount * Math.pow(10, SIP_DECIMALS));
          return {
            valid: true,
            amount: rawAmount,
            amountUI: transferredAmount,
          };
        }
      }
    }

    return { valid: false, error: 'No valid token transfer to treasury found in transaction' };
  } catch (error) {
    console.error('Error verifying token transfer:', error);
    return { valid: false, error: 'Failed to verify transaction' };
  }
}

/**
 * Get treasury wallet info
 */
export function getTreasuryInfo() {
  return {
    wallet: TREASURY_WALLET,
    tokenMint: SIP_TOKEN_MINT,
    configured: !!TREASURY_WALLET,
  };
}

// Burn configuration
export const BURN_PERCENTAGE = parseInt(process.env.BURN_PERCENTAGE || '10', 10);

/**
 * Calculate burn amount based on received tokens
 */
export function calculateBurnAmount(receivedAmount: number): number {
  return Math.floor(receivedAmount * (BURN_PERCENTAGE / 100));
}

/**
 * Burn tokens from treasury wallet (SERVER-SIDE ONLY)
 * This function requires TREASURY_PRIVATE_KEY in env
 */
export async function burnTokensFromTreasury(
  amountToBurn: number
): Promise<{
  success: boolean;
  signature?: string;
  burnedAmount?: number;
  error?: string;
}> {
  // Import server-side dependencies
  const { Keypair, Transaction, sendAndConfirmTransaction } = await import('@solana/web3.js');
  const {
    createBurnInstruction,
    getAssociatedTokenAddressSync,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    getMint,
  } = await import('@solana/spl-token');
  const bs58 = await import('bs58');

  const privateKey = process.env.TREASURY_PRIVATE_KEY;

  if (!privateKey) {
    console.error('TREASURY_PRIVATE_KEY not configured');
    return { success: false, error: 'Treasury private key not configured' };
  }

  if (!SIP_TOKEN_MINT) {
    return { success: false, error: 'Token mint not configured' };
  }

  if (amountToBurn <= 0) {
    return { success: false, error: 'Invalid burn amount' };
  }

  try {
    const connection = getConnection();

    // Decode treasury keypair from base58 private key
    const treasuryKeypair = Keypair.fromSecretKey(bs58.default.decode(privateKey));
    const tokenMint = new PublicKey(SIP_TOKEN_MINT);

    // Detect token program
    const mintInfo = await connection.getAccountInfo(tokenMint);
    const tokenProgramId = mintInfo?.owner.equals(TOKEN_2022_PROGRAM_ID)
      ? TOKEN_2022_PROGRAM_ID
      : TOKEN_PROGRAM_ID;

    // Get treasury's token account (ATA)
    const treasuryATA = getAssociatedTokenAddressSync(
      tokenMint,
      treasuryKeypair.publicKey,
      false,
      tokenProgramId
    );

    // Create burn instruction
    const burnIx = createBurnInstruction(
      treasuryATA,           // Token account to burn from
      tokenMint,             // Token mint
      treasuryKeypair.publicKey, // Owner of token account
      amountToBurn,          // Amount to burn (in raw units)
      [],                    // Multi-signers (none)
      tokenProgramId         // Token program
    );

    // Build and send transaction
    const transaction = new Transaction().add(burnIx);

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [treasuryKeypair],
      { commitment: 'confirmed' }
    );

    console.log(`🔥 Burned ${amountToBurn / Math.pow(10, SIP_DECIMALS)} $SIP tokens`);
    console.log(`   Signature: ${signature}`);

    return {
      success: true,
      signature,
      burnedAmount: amountToBurn,
    };
  } catch (error) {
    console.error('Error burning tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during burn',
    };
  }
}

/**
 * Process token feed with automatic burn
 * Call this after verifying a token transfer to treasury
 */
export async function processTokenFeedWithBurn(
  receivedAmount: number,
  enableBurn: boolean = true
): Promise<{
  receivedAmount: number;
  burnedAmount: number;
  netAmount: number;
  burnSignature?: string;
  burnError?: string;
}> {
  const burnAmount = enableBurn ? calculateBurnAmount(receivedAmount) : 0;
  const netAmount = receivedAmount - burnAmount;

  let burnSignature: string | undefined;
  let burnError: string | undefined;

  if (enableBurn && burnAmount > 0) {
    const burnResult = await burnTokensFromTreasury(burnAmount);

    if (burnResult.success) {
      burnSignature = burnResult.signature;
      console.log(`✅ Auto-burn successful: ${burnAmount / Math.pow(10, SIP_DECIMALS)} $SIP`);
    } else {
      burnError = burnResult.error;
      console.error(`❌ Auto-burn failed: ${burnResult.error}`);
    }
  }

  return {
    receivedAmount,
    burnedAmount: burnSignature ? burnAmount : 0, // Only count if successful
    netAmount: burnSignature ? netAmount : receivedAmount,
    burnSignature,
    burnError,
  };
}
