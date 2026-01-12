'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ThumbsUp, ThumbsDown, Clock } from 'lucide-react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  options: string[];
  startAt: string;
  endAt: string;
  result: Record<string, number> | null;
  votes: number;
  userVote: number | null;
}

const TYPE_ICONS: Record<string, string> = {
  SEASON_THEME: '🎨',
  NEW_FORM: '🐣',
  LORE: '📜',
  EVENT: '🎉',
};

export default function CouncilPage() {
  const { isAuthenticated } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('active');

  const fetchProposals = () => {
    setIsLoading(true);
    fetch(`/api/council/proposals?status=${filter === 'all' ? '' : filter.toUpperCase()}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setProposals(result.data.proposals);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProposals();
  }, [filter]);

  const handleVote = async (proposalId: string, support: boolean) => {
    if (!isAuthenticated) {
      alert('You need to be authenticated to vote');
      return;
    }

    setVoting(proposalId);
    try {
      const res = await fetch('/api/council/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, support }),
      });

      const data = await res.json();
      if (data.success) {
        fetchProposals();
      } else {
        alert(data.error || 'Error voting');
      }
    } catch {
      alert('Connection error');
    } finally {
      setVoting(null);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏛️</div>
          <h1 className="text-4xl font-black uppercase italic underline decoration-4 mb-2">
            Governance Council
          </h1>
          <p className="font-mono text-sm opacity-60 max-w-xl mx-auto">
            Vote on proposals and help shape the game's future. Your wallet, your vote.
          </p>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { key: 'active', label: 'ACTIVE', icon: '🟢' },
            { key: 'closed', label: 'CLOSED', icon: '🔴' },
            { key: 'all', label: 'ALL', icon: '📋' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`
                px-4 py-2 border-2 border-black font-black text-xs uppercase
                transition-all duration-100
                ${filter === f.key
                  ? 'bg-black text-white'
                  : 'bg-white hover:bg-zinc-100 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
                }
              `}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {/* Proposals */}
        {isLoading ? (
          <Card padding="lg" className="text-center">
            <div className="text-6xl mb-4 animate-pulse">🗳️</div>
            <p className="font-mono text-sm">Loading proposals...</p>
          </Card>
        ) : proposals.length === 0 ? (
          <Card padding="lg" className="text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="font-mono text-sm opacity-50">No proposals found</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {proposals.map((proposal) => {
              const isActive = proposal.status === 'ACTIVE';
              const hasVoted = proposal.userVote !== null;
              // Use result to show count (if available)
              const votesFor = proposal.result?.['0'] || 0;
              const votesAgainst = proposal.result?.['1'] || 0;
              const totalVotes = proposal.votes || 0;
              const forPercent = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 50;

              return (
                <Card key={proposal.id} size="lg" padding="md">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{TYPE_ICONS[proposal.type] || '📋'}</span>
                      <div>
                        <h3 className="font-black text-xl uppercase">{proposal.title}</h3>
                        <Badge
                          variant={isActive ? 'success' : 'default'}
                          size="sm"
                        >
                          {proposal.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right font-mono text-[10px] opacity-50">
                      <div>{totalVotes} votes</div>
                      {isActive && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Clock size={10} />
                          {new Date(proposal.endAt).toLocaleDateString('en-US')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="font-mono text-sm mb-6 opacity-70 border-l-4 border-black pl-4 py-2 bg-zinc-50">
                    {proposal.description}
                  </p>

                  {/* Options / Vote Display */}
                  {proposal.options && proposal.options.length > 0 && (
                    <div className="mb-6 space-y-2">
                      {proposal.options.map((option, idx) => {
                        const optionVotes = proposal.result?.[String(idx)] || 0;
                        const percent = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                        const isSelected = proposal.userVote === idx;

                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between font-black text-xs">
                              <span className={isSelected ? 'text-green-600' : ''}>
                                {isSelected && '✓ '}{option}
                              </span>
                              <span className="font-mono">{optionVotes} ({percent.toFixed(0)}%)</span>
                            </div>
                            <div className="h-3 border-2 border-black overflow-hidden bg-zinc-200">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  isSelected ? 'bg-green-500' : 'bg-black'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Vote Buttons */}
                  {isActive && isAuthenticated && !hasVoted && proposal.options && (
                    <div className="flex flex-wrap gap-2">
                      {proposal.options.map((option, idx) => (
                        <Button
                          key={idx}
                          variant="default"
                          onClick={() => handleVote(proposal.id, idx === 0)}
                          disabled={voting === proposal.id}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}

                  {isActive && !isAuthenticated && (
                    <div className="text-center py-3 font-mono text-[10px] opacity-50">
                      🔒 Connect your wallet to vote
                    </div>
                  )}

                  {hasVoted && (
                    <div className="text-center py-2 font-mono text-[10px] text-green-600">
                      ✅ You already voted on this proposal
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Info */}
        <Card padding="md" className="mt-8">
          <h3 className="font-black uppercase text-sm mb-4 border-b-2 border-black pb-2">
            How it works
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🗳️', title: '1 Wallet = 1 Vote', desc: 'Each wallet can vote once' },
              { icon: '✍️', title: 'Crypto Signature', desc: 'Vote verified on-chain' },
              { icon: '⏰', title: 'Limited Time', desc: 'Proposals have time to vote' },
              { icon: '🎯', title: 'Collective Decision', desc: 'Approved ones are implemented' },
            ].map((item) => (
              <Card key={item.title} size="sm" padding="sm" className="text-center">
                <span className="text-2xl block mb-2">{item.icon}</span>
                <h4 className="font-black text-[10px] uppercase">{item.title}</h4>
                <p className="font-mono text-[8px] opacity-60">{item.desc}</p>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
