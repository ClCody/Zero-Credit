import React, { useState } from 'react';
import { ClassInfo, UserProfile } from '@/types';
import { Sparkles, Shield, ChevronDown } from 'lucide-react';

interface PlayerHeaderProps {
  user: UserProfile;
  classInfo: ClassInfo;
  availableClasses: ClassInfo[];
  onSelectClass: (classCode: string) => void;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  user,
  classInfo,
  availableClasses,
  onSelectClass,
}) => {
  const [showClassModal, setShowClassModal] = useState<boolean>(false);

  return (
    <>
      <section className="bg-gradient-to-b from-carnival-card to-carnival-dark border border-carnival-border rounded-2xl p-4 shadow-xl relative overflow-hidden">
        {/* Ambient neon backdrop */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            {/* Avatar / Class Emblem */}
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-950 via-carnival-darkest to-black border-2 border-rose-500/80 flex items-center justify-center text-rose-400 font-display text-2xl shadow-lg glow-crimson">
                {classInfo.emblem}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black font-mono font-black text-[10px] px-1.5 py-0.2 rounded-md shadow">
                УР.{user.level}
              </span>
            </div>

            {/* Student Info */}
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  {user.full_name}
                </h2>
              </div>
              <p className="text-[11px] text-gray-400 font-mono">
                @{user.username || 'unknown'} • <span className="text-gray-300">ДИБББ-11</span>
              </p>

              {/* Class badge with picker trigger */}
              <button
                onClick={() => setShowClassModal(true)}
                className="mt-1 flex items-center space-x-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 px-2.5 py-1 rounded-lg text-[11px] font-mono transition"
              >
                <span>{classInfo.name_ru}</span>
                <ChevronDown className="w-3 h-3 text-rose-400" />
              </button>
            </div>
          </div>

          {/* Academic Run Status Badge */}
          <div className="text-right">
            <span className="inline-flex items-center space-x-1 text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>RUN: ACTIVE</span>
            </span>
            <div className="text-[9px] text-gray-500 font-mono mt-1">Семестр 1</div>
          </div>
        </div>

        {/* Active Class Perk Description */}
        <div className="mt-3.5 pt-3 border-t border-carnival-border/60 bg-carnival-darkest/40 -mx-4 -mb-4 p-3 rounded-b-2xl">
          <div className="flex items-start space-x-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-mono font-bold text-amber-300">
                Пассивка: {classInfo.perk_title}
              </span>
              <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5">
                {classInfo.perk_description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Class Selector Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-carnival-card border border-rose-500/80 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono">
                  Выберите Специализацию ИБ
                </h3>
              </div>
              <button
                onClick={() => setShowClassModal(false)}
                className="text-gray-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Специализация определяет ваш стиль игры, командные баффы в синдикате и эффект ультимейта.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {availableClasses.map((cls) => {
                const isSelected = cls.code === classInfo.code;
                return (
                  <div
                    key={cls.code}
                    onClick={() => {
                      onSelectClass(cls.code);
                      setShowClassModal(false);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-rose-950/60 border-rose-500 shadow-md'
                        : 'bg-carnival-darkest/80 border-carnival-border hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{cls.emblem}</span>
                        <span className="text-xs font-bold text-white font-mono">
                          {cls.name_ru}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] bg-rose-600 text-white font-mono px-2 py-0.5 rounded-full">
                          АКТИВЕН
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-amber-300 font-mono">
                      {cls.perk_title}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                      {cls.perk_description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
