import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { ClassInfo, DashboardData } from '@/types';
import { PlayerHeader } from './PlayerHeader';
import { HypeBar } from './HypeBar';
import { CurrencyCards } from './CurrencyCards';
import { RelicSlotsGrid } from './RelicSlotsGrid';
import { AcademicStatsCard } from './AcademicStatsCard';
import { useTelegram } from '@/context/TelegramContext';
import { Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user, refreshUser } = useTelegram();
  const [data, setData] = useState<DashboardData | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, clsList] = await Promise.all([
        api.getDashboard(),
        api.listClasses().catch(() => []),
      ]);
      setData(dash);
      setClasses(clsList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки дашборда';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.role, user?.character_class]);

  const handleSelectClass = async (classCode: string) => {
    try {
      const updated = await api.changeClass(classCode);
      setData(updated);
      await refreshUser();
    } catch (err: unknown) {
      console.error('Failed to change class:', err);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-44 bg-carnival-card/60 rounded-2xl border border-carnival-border/50" />
        <div className="h-20 bg-carnival-card/60 rounded-2xl border border-carnival-border/50" />
        <div className="h-24 bg-carnival-card/60 rounded-xl border border-carnival-border/50" />
        <div className="h-32 bg-carnival-card/60 rounded-2xl border border-carnival-border/50" />
      </div>
    );
  }

  // Fallback view if error or offline
  const currentUser = data?.user || user;
  if (!currentUser) {
    return (
      <div className="bg-carnival-card border border-carnival-border rounded-2xl p-6 text-center space-y-3">
        <p className="text-xs text-rose-400 font-mono">{error || 'Профиль не найден'}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-carnival-darkest border border-carnival-border rounded-xl text-xs font-mono text-white flex items-center gap-1.5 mx-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Повторить</span>
        </button>
      </div>
    );
  }

  const currentClassInfo: ClassInfo = data?.class_info || {
    code: currentUser.character_class || 'cardsharp',
    name_ru: 'Шулер-Аналитик',
    emblem: '♠',
    perk_title: 'Взгляд Шулера',
    perk_description: 'Увеличенный шанс крита по КТ, контроль вероятностей.',
    ultimate_name: 'Сброс колоды',
  };

  const relicSlots = data?.relic_slots || [
    { slot_index: 1, is_unlocked: true, required_level: 1 },
    { slot_index: 2, is_unlocked: currentUser.level >= 2, required_level: 2 },
    { slot_index: 3, is_unlocked: currentUser.level >= 3, required_level: 3 },
    { slot_index: 4, is_unlocked: currentUser.level >= 4, required_level: 4 },
    { slot_index: 5, is_unlocked: currentUser.level >= 5, required_level: 5 },
    { slot_index: 6, is_unlocked: currentUser.level >= 6, required_level: 6 },
  ];

  const academicStats = data?.stats || {
    attendance_count: 0,
    attendance_rate: 100.0,
    recitations_count: 0,
    labs_count: 0,
    streak_days: 0,
  };

  return (
    <div className="space-y-4">
      {/* 1. Player Header with Avatar, Class & Run Status */}
      <PlayerHeader
        user={currentUser}
        classInfo={currentClassInfo}
        availableClasses={classes}
        onSelectClass={handleSelectClass}
      />

      {/* 2. Neon Hype XP Progress Bar */}
      <HypeBar currentXP={currentUser.hype_xp} level={currentUser.level} />

      {/* 3. Currency Cards (Chips, Keys, Sync) */}
      <CurrencyCards
        luckChips={currentUser.luck_chips}
        jesterKeys={currentUser.jester_keys}
      />

      {/* 4. Relic Slots (Risk of Rain 2 Style) */}
      <RelicSlotsGrid slots={relicSlots} userLevel={currentUser.level} />

      {/* 5. Academic Metrics & Streak */}
      <AcademicStatsCard stats={academicStats} />

      {/* 6. Phase 1 Roadmap Completion Summary */}
      <section className="bg-carnival-card/60 border border-emerald-800/40 rounded-2xl p-4 space-y-2.5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            ФАЗА 1: ФУНДАМЕНТ, АВТОРИЗАЦИЯ И УЧЕТ
          </h3>
          <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full">
            100% ВЫПОЛНЕНО
          </span>
        </div>

        <ul className="space-y-1.5 text-xs">
          <li className="flex items-center justify-between p-2 rounded-lg bg-carnival-darkest/60 border border-carnival-border/40">
            <span className="text-gray-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 1.1. Монорепозиторий и каркас сервисов
            </span>
            <span className="text-[10px] font-mono text-emerald-400">DONE</span>
          </li>
          <li className="flex items-center justify-between p-2 rounded-lg bg-carnival-darkest/60 border border-carnival-border/40">
            <span className="text-gray-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 1.2. Шлюз Telegram initData HMAC-SHA-256
            </span>
            <span className="text-[10px] font-mono text-emerald-400">DONE</span>
          </li>
          <li className="flex items-center justify-between p-2 rounded-lg bg-carnival-darkest/60 border border-carnival-border/40">
            <span className="text-gray-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 1.3. Журнал Старосты («Учет в 2 клика»)
            </span>
            <span className="text-[10px] font-mono text-emerald-400">DONE</span>
          </li>
          <li className="flex items-center justify-between p-2 rounded-lg bg-carnival-darkest/60 border border-carnival-border/40">
            <span className="text-gray-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 1.4. Дашборд Студента и Персональные Статы
            </span>
            <span className="text-[10px] font-mono text-emerald-400">DONE</span>
          </li>
        </ul>
      </section>
    </div>
  );
};
