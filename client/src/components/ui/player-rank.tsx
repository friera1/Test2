import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type Rank } from '@/types/player';

interface PlayerRankBadgeProps {
  rank: Rank;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function getRankLabel(rank: Rank): string {
  const labels = {
    warrior: 'Воин',
    knight: 'Рыцарь',
    goddess: 'Богиня',
    warGod: 'Бог войны',
    emperor: 'Император'
  };
  return labels[rank] || 'Неизвестный ранг';
}

export function getRankIcon(rank: Rank): string {
  const icons = {
    warrior: '⚔️',
    knight: '🛡️',
    goddess: '👑',
    warGod: '🔥',
    emperor: '⚜️'
  };
  return icons[rank] || '⚔️';
}

export function getRankColor(rank: Rank): string {
  const colors = {
    warrior: 'text-gray-500',
    knight: 'text-blue-500',
    goddess: 'text-purple-500',
    warGod: 'text-red-500',
    emperor: 'text-yellow-500'
  };
  return colors[rank] || 'text-gray-500';
}

export function PlayerRankBadge({ rank, showLabel = false, size = 'md' }: PlayerRankBadgeProps) {
  const rankLabel = getRankLabel(rank);

  // Размеры иконок
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center ${getRankColor(rank)}`}>
            <span className={`inline-block ${sizeClasses[size]} mr-1 text-center`}>
              {getRankIcon(rank)}
            </span>
            {showLabel && <span className="text-sm font-medium">{rankLabel}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{rankLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default PlayerRankBadge;
