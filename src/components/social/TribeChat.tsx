'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Send, MessageSquare, Users } from 'lucide-react';
import { TRIBES } from '@/lib/constants';

interface ChatMessage {
  id: string;
  wallet: string;
  petName: string;
  tribe: string;
  message: string;
  createdAt: string;
}

interface TribeChatProps {
  tribe?: string;
  compact?: boolean;
}

export function TribeChat({ tribe, compact = false }: TribeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedTribe, setSelectedTribe] = useState(tribe || 'ALL');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [selectedTribe]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const url = selectedTribe === 'ALL'
        ? '/api/chat'
        : `/api/chat?tribe=${selectedTribe}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setMessages(data.data.messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage.trim(),
          tribe: selectedTribe === 'ALL' ? null : selectedTribe
        }),
      });
      const data = await res.json();

      if (data.success) {
        setNewMessage('');
        await fetchMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getTribeColor = (t: string) => {
    switch (t) {
      case 'FOFO': return 'text-pink-600';
      case 'CAOS': return 'text-red-600';
      case 'CHAD': return 'text-green-600';
      case 'DEGEN': return 'text-violet-600';
      default: return 'text-zinc-600';
    }
  };

  const getTribeBg = (t: string) => {
    switch (t) {
      case 'FOFO': return 'bg-pink-100';
      case 'CAOS': return 'bg-red-100';
      case 'CHAD': return 'bg-green-100';
      case 'DEGEN': return 'bg-violet-100';
      default: return 'bg-zinc-100';
    }
  };

  if (compact) {
    return (
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={16} />
          <span className="font-black text-xs uppercase">Tribe Chat</span>
          <span className="text-[10px] font-mono opacity-50 ml-auto">{messages.length} msgs</span>
        </div>

        <div className="h-32 overflow-y-auto space-y-2 mb-3 scrollbar-thin">
          {messages.slice(-5).map((msg) => (
            <div key={msg.id} className="text-xs">
              <span className={`font-black ${getTribeColor(msg.tribe)}`}>
                {msg.petName}:
              </span>{' '}
              <span className="opacity-70">{msg.message}</span>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-xs opacity-50 text-center py-4">No messages yet</p>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Say something..."
            maxLength={280}
            className="flex-1 text-xs p-2 border-2 border-black focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="p-2 bg-black text-white disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} />
          <h3 className="font-black text-lg uppercase">Tribe Chat</h3>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} className="opacity-50" />
          <span className="text-xs font-mono opacity-50">{messages.length} messages</span>
        </div>
      </div>

      {/* Tribe Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setSelectedTribe('ALL')}
          className={`px-3 py-1 text-xs font-black border-2 border-black transition-colors ${
            selectedTribe === 'ALL' ? 'bg-black text-white' : 'bg-white hover:bg-zinc-100'
          }`}
        >
          ALL
        </button>
        {Object.keys(TRIBES).map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTribe(t)}
            className={`px-3 py-1 text-xs font-black border-2 border-black transition-colors ${
              selectedTribe === t ? 'bg-black text-white' : `bg-white hover:${getTribeBg(t)}`
            }`}
          >
            {TRIBES[t as keyof typeof TRIBES].emoji} {t}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto border-2 border-black p-3 space-y-3 bg-zinc-50 mb-4">
        {loading && messages.length === 0 ? (
          <p className="text-xs font-mono opacity-50 text-center py-8 animate-pulse">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs font-mono opacity-50 text-center py-8">
            No messages yet. Be the first!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`p-2 border-2 border-black ${getTribeBg(msg.tribe)}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{TRIBES[msg.tribe as keyof typeof TRIBES]?.emoji}</span>
                <span className={`font-black text-sm ${getTribeColor(msg.tribe)}`}>
                  {msg.petName}
                </span>
                <span className="text-[10px] font-mono opacity-50 ml-auto">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm font-mono">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message... (280 chars max)"
          maxLength={280}
          className="flex-1 brutal-input"
        />
        <Button
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          variant="primary"
        >
          {sending ? '...' : <Send size={16} />}
        </Button>
      </div>
      <div className="text-right text-[10px] font-mono opacity-50 mt-1">
        {newMessage.length}/280
      </div>
    </Card>
  );
}
