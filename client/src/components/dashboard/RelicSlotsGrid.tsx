import React from 'react';
import { RelicSlot } from '@/types';
import { Lock, Sparkles, Layers } from 'lucide-react';

interface RelicSlotsGridProps {
  slots: RelicSlot[];
  userLevel: number;
}

export const RelicSlotsGrid: React.FC<RelicSlotsGridProps> = ({ slots, userLevel }) => {
  const unlockedCount = slots.filter((s) => s.is_unlocked).length;

  return (
    <section className="bg-carnival-card/80 border border-carnival-border rounded-2xl p-4 shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 font-mono text-xs">
          <Layers className="w-4 h-4 text-rose-400" />
          <h3 className="font-bold text-white uppercase tracking-wider">
            Слоты Реликвий (Risk of Rain 2)
          </h3>
        </div>
        <span className="text-[10px] font-mono bg-carnival-darkest px-2 py-0.5 rounded-full border border-carnival-border text-gray-400">
          {unlockedCount} из 6 открыто
        </span>
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed">
        Каждый уровень открывает дополнительный слот под экипировку стакающихся артефактов.
      </p>

      {/* 6 Grid Slots */}
      <div className="grid grid-cols-6 gap-2 pt-1">
        {slots.map((slot) => {
          const isUnlocked = slot.is_unlocked;
          return (
            <div
              key={slot.slot_index}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 border transition relative ${
                isUnlocked
                  ? 'bg-gradient-to-b from-carnival-card to-carnival-darkest border-rose-500/60 shadow-sm hover:border-rose-400'
                  : 'bg-carnival-darkest/90 border-carnival-border/60 opacity-50'
              }`}
            >
              <span className="text-[9px] font-mono absolute top-1 left-1.5 text-gray-500">
                #{slot.slot_index}
              </span>

              {isUnlocked ? (
                <div className="flex flex-col items-center justify-center space-y-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-[8px] font-mono text-gray-400">Свободен</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-0.5 text-gray-600">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-[8px] font-mono text-gray-500">Ур.{slot.required_level}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {unlockedCount < 6 && (
        <div className="text-[10px] font-mono text-gray-500 text-center pt-1">
          Следующий слот откроется на <strong className="text-rose-400">Уровне {userLevel + 1}</strong>
        </div>
      )}
    </section>
  );
};
