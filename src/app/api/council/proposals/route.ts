import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Listar propostas
export async function GET() {
  try {
    const user = await getCurrentUser();

    const proposals = await prisma.proposal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { votes: true },
        },
      },
    });

    // Se usuário logado, buscar seus votos
    let userVotes: Record<string, number> = {};

    if (user) {
      const votes = await prisma.vote.findMany({
        where: { userId: user.id },
        select: { proposalId: true, choice: true },
      });

      userVotes = Object.fromEntries(votes.map((v) => [v.proposalId, v.choice]));
    }

    return NextResponse.json({
      success: true,
      data: {
        proposals: proposals.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          type: p.type,
          status: p.status,
          options: JSON.parse(p.options),
          startAt: p.startAt.toISOString(),
          endAt: p.endAt.toISOString(),
          result: p.result ? JSON.parse(p.result) : null,
          votes: p._count.votes,
          userVote: userVotes[p.id] ?? null,
        })),
      },
    });
  } catch (error) {
    console.error('Proposals error:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

