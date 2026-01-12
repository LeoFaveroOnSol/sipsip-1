import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, checkRateLimit } from '@/lib/auth';
import { verifySignature } from '@/lib/auth';
import { generateVoteMessage } from '@/lib/solana';
import { prisma } from '@/lib/prisma';
import { RATE_LIMITS } from '@/lib/constants';
import { z } from 'zod';

const voteSchema = z.object({
  proposalId: z.string().min(1),
  choice: z.number().int().min(0),
  signature: z.string().min(1),
  timestamp: z.number().int(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      `vote:${user.id}`,
      RATE_LIMITS.apiRequestsPerMinute,
      60 * 1000
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisições' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = voteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
    }

    const { proposalId, choice, signature, timestamp } = parsed.data;

    // Verificar se proposta existe e está ativa
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      return NextResponse.json({ success: false, error: 'Proposta não encontrada' }, { status: 404 });
    }

    if (proposal.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Proposta não está ativa' }, { status: 400 });
    }

    const now = new Date();
    if (now < proposal.startAt || now > proposal.endAt) {
      return NextResponse.json(
        { success: false, error: 'Fora do período de votação' },
        { status: 400 }
      );
    }

    // Verificar se opção é válida
    const options = JSON.parse(proposal.options);
    if (choice < 0 || choice >= options.length) {
      return NextResponse.json({ success: false, error: 'Opção inválida' }, { status: 400 });
    }

    // Verificar se já votou
    const existingVote = await prisma.vote.findUnique({
      where: {
        proposalId_userId: { proposalId, userId: user.id },
      },
    });

    if (existingVote) {
      return NextResponse.json({ success: false, error: 'Você já votou nesta proposta' }, { status: 400 });
    }

    // Verificar timestamp (não pode ser muito antigo)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (timestamp < fiveMinutesAgo) {
      return NextResponse.json({ success: false, error: 'Assinatura expirada' }, { status: 400 });
    }

    // Verificar assinatura
    const message = generateVoteMessage(proposalId, choice, user.walletPubkey, timestamp);
    const signatureValid = verifySignature(message, signature, user.walletPubkey);

    if (!signatureValid) {
      return NextResponse.json({ success: false, error: 'Assinatura inválida' }, { status: 401 });
    }

    // Registrar voto
    await prisma.vote.create({
      data: {
        proposalId,
        userId: user.id,
        choice,
        signature,
      },
    });

    return NextResponse.json({
      success: true,
      data: { voted: true, choice },
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

