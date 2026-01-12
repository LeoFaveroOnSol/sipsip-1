import { Connection, PublicKey } from '@solana/web3.js';

// Configuração do RPC
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const HOLDER_TOKEN_MINT = process.env.HOLDER_TOKEN_MINT || '';

let connection: Connection | null = null;

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(RPC_URL, 'confirmed');
  }
  return connection;
}

// Verificar se é um endereço Solana válido
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// Verificar balance de SOL
export async function getSolBalance(walletAddress: string): Promise<number> {
  try {
    const conn = getConnection();
    const pubkey = new PublicKey(walletAddress);
    const balance = await conn.getBalance(pubkey);
    return balance / 1e9; // Converter de lamports para SOL
  } catch (error) {
    console.error('Error getting SOL balance:', error);
    return 0;
  }
}

// Verificar se usuário possui um token específico (opcional)
export async function checkTokenHolding(walletAddress: string): Promise<{
  isHolder: boolean;
  balance: number;
}> {
  if (!HOLDER_TOKEN_MINT) {
    return { isHolder: false, balance: 0 };
  }

  try {
    const conn = getConnection();
    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(HOLDER_TOKEN_MINT);

    // Buscar token accounts
    const tokenAccounts = await conn.getParsedTokenAccountsByOwner(walletPubkey, {
      mint: mintPubkey,
    });

    if (tokenAccounts.value.length === 0) {
      return { isHolder: false, balance: 0 };
    }

    // Somar balances de todas as accounts
    let totalBalance = 0;
    for (const account of tokenAccounts.value) {
      const amount = account.account.data.parsed?.info?.tokenAmount?.uiAmount || 0;
      totalBalance += amount;
    }

    return {
      isHolder: totalBalance > 0,
      balance: totalBalance,
    };
  } catch (error) {
    console.error('Error checking token holding:', error);
    return { isHolder: false, balance: 0 };
  }
}

// Gerar mensagem de assinatura para login
export function generateLoginMessage(nonce: string, wallet: string): string {
  return `SipSip - Tamagotchi de Tribos

Conectar carteira: ${wallet}

Nonce: ${nonce}

Ao assinar esta mensagem, você confirma que é o proprietário desta carteira e concorda com os termos de uso do SipSip.`;
}

// Gerar mensagem de assinatura para votação
export function generateVoteMessage(
  proposalId: string,
  choice: number,
  wallet: string,
  timestamp: number
): string {
  return `SipSip Council Vote

Proposal: ${proposalId}
Choice: ${choice}
Wallet: ${wallet}
Timestamp: ${timestamp}

Esta assinatura registra seu voto no Council do SipSip.`;
}

// Verificar se a rede está disponível
export async function checkNetworkHealth(): Promise<boolean> {
  try {
    const conn = getConnection();
    const version = await conn.getVersion();
    return !!version;
  } catch {
    return false;
  }
}

