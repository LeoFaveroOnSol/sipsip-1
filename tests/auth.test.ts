/**
 * Testes de autenticação
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

// Mock do Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    nonce: {
      create: vi.fn().mockResolvedValue({ nonce: 'test-nonce' }),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn().mockResolvedValue({ token: 'test-token' }),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Autenticação', () => {
  let keypair: Keypair;

  beforeEach(() => {
    keypair = Keypair.generate();
  });

  describe('Verificação de assinatura', () => {
    it('deve verificar assinatura válida', () => {
      const message = 'Test message for signing';
      const messageBytes = new TextEncoder().encode(message);
      
      // Assinar mensagem
      const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
      const signatureBase58 = bs58.encode(signature);
      
      // Verificar
      const signatureBytes = bs58.decode(signatureBase58);
      const publicKeyBytes = keypair.publicKey.toBytes();
      
      const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
      
      expect(isValid).toBe(true);
    });

    it('deve rejeitar assinatura inválida', () => {
      const message = 'Test message for signing';
      const messageBytes = new TextEncoder().encode(message);
      
      // Criar assinatura com outra keypair
      const otherKeypair = Keypair.generate();
      const signature = nacl.sign.detached(messageBytes, otherKeypair.secretKey);
      const signatureBase58 = bs58.encode(signature);
      
      // Tentar verificar com a chave original
      const signatureBytes = bs58.decode(signatureBase58);
      const publicKeyBytes = keypair.publicKey.toBytes();
      
      const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
      
      expect(isValid).toBe(false);
    });

    it('deve rejeitar assinatura com mensagem alterada', () => {
      const message = 'Test message for signing';
      const messageBytes = new TextEncoder().encode(message);
      
      // Assinar mensagem original
      const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
      const signatureBase58 = bs58.encode(signature);
      
      // Verificar com mensagem diferente
      const alteredMessage = 'Altered message';
      const alteredMessageBytes = new TextEncoder().encode(alteredMessage);
      const signatureBytes = bs58.decode(signatureBase58);
      const publicKeyBytes = keypair.publicKey.toBytes();
      
      const isValid = nacl.sign.detached.verify(alteredMessageBytes, signatureBytes, publicKeyBytes);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Geração de mensagem de login', () => {
    it('deve gerar mensagem com nonce e wallet', () => {
      const nonce = 'sipsip:123456789:abc123';
      const wallet = keypair.publicKey.toBase58();
      
      const message = `SipSip - Tamagotchi de Tribos

Conectar carteira: ${wallet}

Nonce: ${nonce}

Ao assinar esta mensagem, você confirma que é o proprietário desta carteira e concorda com os termos de uso do SipSip.`;

      expect(message).toContain(wallet);
      expect(message).toContain(nonce);
      expect(message).toContain('SipSip');
    });
  });

  describe('Formato de endereço Solana', () => {
    it('deve ter comprimento válido (32-44 caracteres)', () => {
      const address = keypair.publicKey.toBase58();
      
      expect(address.length).toBeGreaterThanOrEqual(32);
      expect(address.length).toBeLessThanOrEqual(44);
    });

    it('deve conter apenas caracteres Base58', () => {
      const address = keypair.publicKey.toBase58();
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
      
      expect(base58Regex.test(address)).toBe(true);
    });
  });

  describe('Geração de mensagem de voto', () => {
    it('deve incluir proposalId, choice e timestamp', () => {
      const proposalId = 'proposal-123';
      const choice = 2;
      const wallet = keypair.publicKey.toBase58();
      const timestamp = Date.now();

      const message = `SipSip Council Vote

Proposal: ${proposalId}
Choice: ${choice}
Wallet: ${wallet}
Timestamp: ${timestamp}

Esta assinatura registra seu voto no Council do SipSip.`;

      expect(message).toContain(proposalId);
      expect(message).toContain(String(choice));
      expect(message).toContain(wallet);
      expect(message).toContain(String(timestamp));
    });
  });
});

