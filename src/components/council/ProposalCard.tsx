'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface ProposalCardProps {
  proposal: {
    id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    options: string[];
    startAt: string;
    endAt: string;
    result: Record<number, number> | null;
    votes: number;
    userVote?: number | null;
  };
  onVote: (proposalId: string, choice: number) => void;
  isVoting: boolean;
}

export function ProposalCard({ proposal, onVote, isVoting }: ProposalCardProps) {
  const isActive = proposal.status === 'ACTIVE';
  const hasVoted = proposal.userVote !== null && proposal.userVote !== undefined;
  const isClosed = proposal.status === 'CLOSED' || proposal.status === 'EXECUTED';

  const typeEmojis: Record<string, string> = {
    SEASON_THEME: '🎨',
    NEW_FORM: '🎭',
    LORE: '📜',
    EVENT: '🎉',
  };

  const statusColors: Record<string, string> = {
    PENDING: 'text-gray-400 bg-gray-500/20',
    ACTIVE: 'text-green-400 bg-green-500/20',
    CLOSED: 'text-red-400 bg-red-500/20',
    EXECUTED: 'text-blue-400 bg-blue-500/20',
  };

  // Calcular porcentagens de votos
  const totalVotes = proposal.result
    ? Object.values(proposal.result).reduce((a, b) => a + b, 0)
    : proposal.votes;

  const getVotePercentage = (choice: number) => {
    if (!proposal.result || totalVotes === 0) return 0;
    return ((proposal.result[choice] || 0) / totalVotes) * 100;
  };

  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{typeEmojis[proposal.type] || '📋'}</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[proposal.status]}`}
            >
              {proposal.status}
            </span>
          </div>
          <h3 className="text-lg font-bold">{proposal.title}</h3>
          <p className="text-gray-500 text-sm mt-1">{proposal.description}</p>
        </div>

        <div className="text-right text-sm text-gray-500">
          <div>{proposal.votes} votos</div>
          <div className="text-xs">
            Até {new Date(proposal.endAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {proposal.options.map((option, index) => {
          const percentage = getVotePercentage(index);
          const isSelected = proposal.userVote === index;

          return (
            <div key={index} className="space-y-1">
              {(isClosed || hasVoted) ? (
                // Mostrar resultados
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={isSelected ? 'text-pink-400 font-medium' : ''}>
                      {option}
                      {isSelected && ' ✓'}
                    </span>
                    <span className="text-gray-500">{percentage.toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={percentage} size="sm" />
                </div>
              ) : (
                // Botões de voto
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onVote(proposal.id, index)}
                  disabled={isVoting || !isActive}
                >
                  {option}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {hasVoted && (
        <div className="text-center text-sm text-green-400">
          ✓ Você votou nesta proposta
        </div>
      )}
    </Card>
  );
}

