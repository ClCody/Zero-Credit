import React, { useEffect, useState } from 'react';
import { useTelegram } from '@/context/TelegramContext';
import { api } from '@/api/client';
import { HealthStatus } from '@/types';
import { ArbitrageJournal } from '@/components/ArbitrageJournal';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import {
  Shield,
  Sparkles,
  User,
  FileSpreadsheet,
} from 'lucide-react';

export const App: React.FC = () => {
  const { user, isTWA, mockMode, mockRole, setMockRole } = useTelegram();
  const [, setHealth] = useState<HealthStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'arbitrage'>('profile');

  useEffect(() => {
    api.checkHealth()
      .then(setHealth)
      .catch((err) => console.warn('Health check:', err));
  }, []);

  return (
    <div className="min-h-screen bg-carnival-darkest text-gray-200 flex flex-col font-sans selection:bg-rose-600">
      {/* Top Banner: Cyber-Carnival Header */}
      <header className="border-b border-carnival-border/60 bg-carnival-dark/80 backdrop-blur sticky top-0 z-50 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🎴</span>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-rose-500 uppercase font-mono">
                ZERO CREDIT
              </h1>
              <p className="text-[10px] text-gray-400">ДИБББ-11 • ИБ АГТУ</p>
            </div>
          </div>

          {/* Dev Mock Selector */}
          {mockMode && (
            <div className="flex items-center bg-carnival-card px-2 py-1 rounded-full border border-carnival-border text-xs">
              <span className="text-[10px] text-gray-400 mr-2">РЕЖИМ:</span>
              <button
                onClick={() => {
                  setMockRole('player');
                  setActiveTab('profile');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  mockRole === 'player'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Студент
              </button>
              <button
                onClick={() => {
                  setMockRole('admin');
                  setActiveTab('arbitrage');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ml-1 ${
                  mockRole === 'admin'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Староста
              </button>
            </div>
          )}

          {isTWA && (
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
              TWA Active
            </span>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-carnival-card/60 p-1 rounded-xl border border-carnival-border/60">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 rounded-lg text-xs font-mono font-medium transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'profile'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Профиль Игрока</span>
          </button>
          <button
            onClick={() => setActiveTab('arbitrage')}
            className={`py-2 rounded-lg text-xs font-mono font-medium transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'arbitrage'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Журнал Старосты</span>
            {user?.role === 'admin' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'arbitrage' ? (
          <ArbitrageJournal />
        ) : (
          <StudentDashboard />
        )}
      </main>

      {/* Footer Navigation Bar */}
      <footer className="border-t border-carnival-border/60 bg-carnival-dark/95 backdrop-blur px-4 py-2.5">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1 text-center">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition ${
              activeTab === 'profile' ? 'text-rose-500' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 font-medium">Профиль</span>
          </button>
          <button
            onClick={() => setActiveTab('arbitrage')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition ${
              activeTab === 'arbitrage' ? 'text-amber-500' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 font-medium">Журнал</span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded-lg text-gray-600 cursor-not-allowed">
            <Shield className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 font-medium">Боссы</span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded-lg text-gray-600 cursor-not-allowed">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 font-medium">Шатер</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
