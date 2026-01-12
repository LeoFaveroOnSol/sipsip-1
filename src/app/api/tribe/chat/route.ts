import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sendChatMessage, getChatMessages } from '@/lib/guild-logic';
import { prisma } from '@/lib/prisma';

// GET - Get chat messages for user's tribe
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const before = searchParams.get('before') || undefined;

    // Get user's pet to determine tribe
    const pet = await prisma.pet.findUnique({
      where: { userId: user.id },
    });

    if (!pet) {
      return NextResponse.json(
        { success: false, error: 'No pet found' },
        { status: 404 }
      );
    }

    const messages = await getChatMessages(pet.tribe, limit, before);

    // Format messages for client
    const formattedMessages = messages.map(m => ({
      id: m.id,
      wallet: m.wallet.slice(0, 4) + '...' + m.wallet.slice(-4),
      fullWallet: m.wallet,
      message: m.message,
      isOwn: m.userId === user.id,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        tribe: pet.tribe,
        messages: formattedMessages,
        hasMore: messages.length === limit,
      },
    });
  } catch (error) {
    console.error('Chat fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}

// POST - Send a chat message
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user's pet to determine tribe
    const pet = await prisma.pet.findUnique({
      where: { userId: user.id },
    });

    if (!pet) {
      return NextResponse.json(
        { success: false, error: 'No pet found' },
        { status: 404 }
      );
    }

    const result = await sendChatMessage(user.id, pet.tribe, message);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Format message for client
    const formattedMessage = {
      id: result.message!.id,
      wallet: result.message!.wallet.slice(0, 4) + '...' + result.message!.wallet.slice(-4),
      fullWallet: result.message!.wallet,
      message: result.message!.message,
      isOwn: true,
      createdAt: result.message!.createdAt,
    };

    return NextResponse.json({
      success: true,
      data: {
        message: formattedMessage,
      },
    });
  } catch (error) {
    console.error('Chat send error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
