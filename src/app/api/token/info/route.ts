import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getConnection } from '@/lib/solana';
import { SIP_TOKEN_MINT, SIP_DECIMALS, SIP_SYMBOL } from '@/lib/token';

export async function GET(req: NextRequest) {
  try {
    if (!SIP_TOKEN_MINT) {
      return NextResponse.json({
        success: true,
        data: {
          configured: false,
          message: 'Token mint not configured - using simulation mode',
        },
      });
    }

    const connection = getConnection();
    const mintPubkey = new PublicKey(SIP_TOKEN_MINT);

    // Get mint account info
    const mintInfo = await connection.getAccountInfo(mintPubkey);

    if (!mintInfo) {
      return NextResponse.json({
        success: false,
        error: 'Token mint not found on chain',
      }, { status: 404 });
    }

    // Parse mint data (SPL Token Mint layout)
    // Offset 0: mintAuthority (optional, 36 bytes)
    // Offset 36: supply (u64, 8 bytes)
    // Offset 44: decimals (u8, 1 byte)
    const data = mintInfo.data;
    const supply = data.readBigUInt64LE(36);
    const decimals = data[44];

    const totalSupply = Number(supply);
    const totalSupplyUI = totalSupply / Math.pow(10, decimals);

    return NextResponse.json({
      success: true,
      data: {
        configured: true,
        mint: SIP_TOKEN_MINT,
        symbol: SIP_SYMBOL,
        decimals: decimals,
        configuredDecimals: SIP_DECIMALS,
        totalSupply: totalSupply,
        totalSupplyUI: totalSupplyUI,
        totalSupplyFormatted: totalSupplyUI.toLocaleString(),
        owner: mintInfo.owner.toBase58(),
      },
    });
  } catch (error) {
    console.error('Token info error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch token info' },
      { status: 500 }
    );
  }
}
