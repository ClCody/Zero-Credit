import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/api/client';
import { UserProfile } from '@/types';

interface TelegramContextValue {
  isTWA: boolean;
  initData: string;
  mockMode: boolean;
  setMockRole: (role: 'player' | 'admin') => void;
  mockRole: 'player' | 'admin';
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const TelegramContext = createContext<TelegramContextValue | undefined>(undefined);

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTWA, setIsTWA] = useState<boolean>(false);
  const [initData, setInitData] = useState<string>('');
  const [mockMode, setMockMode] = useState<boolean>(true);
  const [mockRole, setMockRole] = useState<'player' | 'admin'>('player');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if running inside Telegram WebApp
    const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string; ready?: () => void; expand?: () => void } } })?.Telegram?.WebApp;
    if (tg && tg.initData && tg.initData.length > 0) {
      setIsTWA(true);
      setMockMode(false);
      setInitData(tg.initData);
      api.setInitData(tg.initData);
      tg.ready?.();
      tg.expand?.();
    } else {
      // Browser development mode
      setIsTWA(false);
      setMockMode(true);
      api.setInitData(`mock_${mockRole}`);
    }
  }, [mockRole]);

  const refreshUser = async () => {
    setLoading(true);
    try {
      const profile = await api.getMe(mockRole);
      setUser(profile);
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [mockRole, isTWA]);

  return (
    <TelegramContext.Provider
      value={{
        isTWA,
        initData,
        mockMode,
        setMockRole,
        mockRole,
        user,
        loading,
        refreshUser,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};
