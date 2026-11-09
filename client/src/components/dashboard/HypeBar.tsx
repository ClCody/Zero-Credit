import React from 'react';
import { Zap } from 'lucide-react';

interface HypeBarProps {
  currentXP: number;
  level: number;
}

export const HypeBar: React.FC<HypeBarProps> = ({ currentXP, level }) => {
  // Scaling formula: 150 XP per level
  const xpRequiredForNext = level * 150;
  const currentLevelBaseXP = (level - 1) * 150;
  const xpInCurrentLevel = Math.max(0, currentXP - currentLevelBaseXP);
  const xpNeededThisLevel = 150;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededThisLevel) * 100));

  return (
    <section className="bg-carnival-card/90 border border-carnival-border rounded-2xl p-4 shadow-md space-y-2 relative overflow-hidden">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5 font-mono">
          <Zap className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
          <span className="text-gray-300 font-semibold tracking-wide">ФИШКИ АЗАРТА (HYPE XP)</span>
        </div>

        <div className="font-mono text-xs">
          <span className="text-rose-400 font-bold">{currentXP}</span>
          <span className="text-gray-500"> / {xpRequiredForNext} XP</span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-3.5 bg-carnival-darkest rounded-full border border-carnival-border/80 overflow-hidden p-0.5 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 shadow-sm transition-all duration-700 relative"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Subtle neon sheen overlay */}
          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse-slow" />
        </div>
      </div>

      {/* Level Milestone Indicator */}
      <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 pt-0.5">
        <span>Уровень {level}</span>
        <span className="text-amber-400 font-medium">
          До Уровня {level + 1}: {Math.max(0, xpRequiredForNext - currentXP)} XP (откроет +1 слот)
        </span>
        <span>Уровень {level + 1}</span>
      </div>
    </section>
  );
};
