import React from 'react';
import { Coins, Key, Flame } from 'lucide-react';

interface CurrencyCardsProps {
  luckChips: number;
  jesterKeys: number;
  syncPoints?: number;
}

export const CurrencyCards: React.FC<CurrencyCardsProps> = ({
  luckChips,
  jesterKeys,
  syncPoints = 0,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Luck Chips */}
      <div className="bg-gradient-to-b from-carnival-card to-carnival-darkest border border-amber-500/30 rounded-xl p-3 shadow-md relative overflow-hidden group hover:border-amber-500/60 transition">
        <div className="flex items-center space-x-1.5 text-amber-400 mb-1">
          <Coins className="w-4 h-4" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
            Жетоны
          </span>
        </div>
        <div className="text-lg font-black font-mono text-amber-400">
          {luckChips}
        </div>
        <div className="text-[9px] text-gray-500 font-mono mt-0.5">
          Сундуки Шатра
        </div>
      </div>

      {/* Jester Keys */}
      <div className="bg-gradient-to-b from-carnival-card to-carnival-darkest border border-rose-500/30 rounded-xl p-3 shadow-md relative overflow-hidden group hover:border-rose-500/60 transition">
        <div className="flex items-center space-x-1.5 text-rose-400 mb-1">
          <Key className="w-4 h-4" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
            Отмычки
          </span>
        </div>
        <div className="text-lg font-black font-mono text-rose-400">
          {jesterKeys}
        </div>
        <div className="text-[9px] text-gray-500 font-mono mt-0.5">
          Сейфы Джокера
        </div>
      </div>

      {/* Sync Points (Syndicate) */}
      <div className="bg-gradient-to-b from-carnival-card to-carnival-darkest border border-cyan-500/20 rounded-xl p-3 shadow-md relative overflow-hidden group hover:border-cyan-500/40 transition opacity-80">
        <div className="flex items-center space-x-1.5 text-cyan-400 mb-1">
          <Flame className="w-4 h-4" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
            Синхро
          </span>
        </div>
        <div className="text-lg font-black font-mono text-cyan-400">
          {syncPoints}
        </div>
        <div className="text-[9px] text-gray-500 font-mono mt-0.5">
          Синдикат (Фаза 5)
        </div>
      </div>
    </div>
  );
};
