import React from 'react';
import { AcademicStats } from '@/types';
import { CheckCircle, Award, FlaskConical, Flame, TrendingUp } from 'lucide-react';

interface AcademicStatsCardProps {
  stats: AcademicStats;
}

export const AcademicStatsCard: React.FC<AcademicStatsCardProps> = ({ stats }) => {
  return (
    <section className="bg-carnival-card/80 border border-carnival-border rounded-2xl p-4 shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 font-mono text-xs">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-white uppercase tracking-wider">
            Академическая Статистика
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
          БЕЗ ХВОСТОВ
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Attendance */}
        <div className="bg-carnival-darkest/70 border border-carnival-border/60 p-2.5 rounded-xl space-y-1">
          <div className="flex items-center space-x-1.5 text-gray-400 text-[10px]">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Посещаемость пар</span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-base font-bold font-mono text-white">{stats.attendance_count} пар</span>
            <span className="text-[10px] font-mono text-emerald-400">({stats.attendance_rate}%)</span>
          </div>
        </div>

        {/* Board Recitations */}
        <div className="bg-carnival-darkest/70 border border-carnival-border/60 p-2.5 rounded-xl space-y-1">
          <div className="flex items-center space-x-1.5 text-gray-400 text-[10px]">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Ответы у доски</span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-base font-bold font-mono text-white">{stats.recitations_count}</span>
            <span className="text-[10px] font-mono text-amber-400">активностей</span>
          </div>
        </div>

        {/* Labs completed */}
        <div className="bg-carnival-darkest/70 border border-carnival-border/60 p-2.5 rounded-xl space-y-1">
          <div className="flex items-center space-x-1.5 text-gray-400 text-[10px]">
            <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
            <span>Сданные лабы</span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-base font-bold font-mono text-white">{stats.labs_count}</span>
            <span className="text-[10px] font-mono text-cyan-400">практикумов</span>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-carnival-darkest/70 border border-carnival-border/60 p-2.5 rounded-xl space-y-1">
          <div className="flex items-center space-x-1.5 text-gray-400 text-[10px]">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Серия без пропусков</span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-base font-bold font-mono text-white">{stats.streak_days}</span>
            <span className="text-[10px] font-mono text-rose-400">дней подряд</span>
          </div>
        </div>
      </div>
    </section>
  );
};
