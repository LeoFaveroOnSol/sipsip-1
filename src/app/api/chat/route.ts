import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tribe = searchParams.get('tribe');
    const limit = parseInt(searchParams.get('limit') || '50');

    const messages = await prisma.chatMessage.findMany({
      where: tribe ? { tribe } : {},
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        pet: {
          select: {
            name: true,
            tribe: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.map(m => ({
          id: m.id,
          wallet: m.wallet,
          petName: m.pet?.name || 'Anonymous',
          tribe: m.pet?.tribe || 'UNKNOWN',
          message: m.message,
          createdAt: m.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Chat fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { message, tribe } = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (message.length > 280) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 280 characters)' },
        { status: 400 }
      );
    }

    // Get user's pet
    const pet = await prisma.pet.findFirst({
      where: { userId: user.id },
    });

    if (!pet) {
      return NextResponse.json(
        { success: false, error: 'You need a pet to chat' },
        { status: 400 }
      );
    }

    // Rate limit: max 10 messages per minute
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentMessages = await prisma.chatMessage.count({
      where: {
        wallet: user.walletPubkey,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentMessages >= 10) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Wait a moment.' },
        { status: 429 }
      );
    }

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        wallet: user.walletPubkey,
        petId: pet.id,
        message: message.trim(),
        tribe: tribe || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: chatMessage.id,
        message: chatMessage.message,
        createdAt: chatMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Chat send error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
