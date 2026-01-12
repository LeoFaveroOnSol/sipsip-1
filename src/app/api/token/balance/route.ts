import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSipBalance, SIP_TOKEN_MINT, SIP_DECIMALS, SIP_SYMBOL } from '@/lib/token';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { balance, balanceUI, formatted } = await getSipBalance(user.walletPubkey);

    return NextResponse.json({
      success: true,
      data: {
        wallet: user.walletPubkey,
        tokenMint: SIP_TOKEN_MINT,
        symbol: SIP_SYMBOL,
        decimals: SIP_DECIMALS,
        balance: balance,      // Raw balance (with decimals)
        balanceUI: balanceUI,  // Human-readable balance
        formatted: formatted,   // Formatted string (e.g., "10K")
      },
    });
  } catch (error) {
    console.error('Token balance error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch token balance' },
      { status: 500 }
    );
  }
}
