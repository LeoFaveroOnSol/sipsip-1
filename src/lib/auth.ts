import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');
const SESSION_DURATION_DAYS = parseInt(process.env.SESSION_DURATION_DAYS || '7');

// ============== NONCE ==============

export async function createNonce(wallet: string): Promise<string> {
  // Limpar nonces expirados
  await prisma.nonce.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  // Gerar novo nonce
  const nonce = `sipsip:${Date.now()}:${Math.random().toString(36).substring(2)}`;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

  await prisma.nonce.create({
    data: {
      nonce,
      wallet,
      expiresAt,
    },
  });

  return nonce;
}

export async function verifyNonce(nonce: string, wallet: string): Promise<boolean> {
  const record = await prisma.nonce.findUnique({
    where: { nonce },
  });

  if (!record) return false;
  if (record.wallet !== wallet) return false;
  if (record.expiresAt < new Date()) return false;

  // Deletar nonce usado (one-time use)
  await prisma.nonce.delete({ where: { nonce } });

  return true;
}

// ============== SIGNATURE VERIFICATION ==============

export function verifySignature(
  message: string,
  signature: string,
  publicKeyString: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = new PublicKey(publicKeyString).toBytes();

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// ============== JWT / SESSION ==============

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(JWT_SECRET);

  // Salvar sessão no banco
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function verifySession(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (!payload.userId || typeof payload.userId !== 'string') {
      return null;
    }

    // Verificar se sessão ainda existe no banco
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.delete({ where: { token } }).catch(() => {});
}

// ============== AUTH HELPERS ==============

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return null;

    const session = await verifySession(token);
    if (!session) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { pet: true },
    });

    return user;
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

// ============== LOGIN / REGISTER ==============

export async function loginOrRegister(walletPubkey: string): Promise<{
  user: { id: string; walletPubkey: string };
  isNew: boolean;
}> {
  let user = await prisma.user.findUnique({
    where: { walletPubkey },
  });

  const isNew = !user;

  if (!user) {
    user = await prisma.user.create({
      data: { walletPubkey },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  }

  return { user, isNew };
}

// ============== RATE LIMITING (in-memory para MVP) ==============

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

// Clean up old rate limits periodically
setInterval(
  () => {
    const now = Date.now();
    rateLimitStore.forEach((value, key) => {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    });
  },
  60 * 1000
); // Every minute
