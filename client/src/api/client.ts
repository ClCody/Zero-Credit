import {
  ArbitrageSessionRequest,
  ArbitrageSessionResponse,
  ClassInfo,
  DashboardData,
  HealthStatus,
  StudentListItem,
  UserProfile,
} from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface AuthValidationResult {
  valid: boolean;
  user?: UserProfile;
  detail?: string;
}

class ApiClient {
  private initData: string = '';

  setInitData(initData: string) {
    this.initData = initData;
  }

  getInitData(): string {
    return this.initData;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.initData) {
      headers['Authorization'] = `Bearer ${this.initData}`;
    }
    return headers;
  }

  async checkHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/api/health`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Health check failed: ${res.statusText}`);
    }
    return res.json();
  }

  async validateInitData(initData: string): Promise<AuthValidationResult> {
    const res = await fetch(`${API_BASE}/api/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ init_data: initData }),
    });
    if (!res.ok) {
      throw new Error(`Validation failed with status ${res.status}`);
    }
    return res.json();
  }

  async getMe(roleFallback: 'admin' | 'player' = 'player'): Promise<UserProfile> {
    try {
      const res = await fetch(`${API_BASE}/api/me`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API unreachable, using offline fallback', e);
    }

    // Offline fallback for preview without server running
    return roleFallback === 'admin'
      ? {
          telegram_id: 99990001,
          username: 'starosta_arbitr',
          full_name: 'Алексей Старостин (Арбитр)',
          role: 'admin',
          character_class: 'croupier',
          hype_xp: 350,
          luck_chips: 250,
          jester_keys: 3,
          level: 3,
          is_bankrupt: false,
        }
      : {
          telegram_id: 99990002,
          username: 'student_shuler',
          full_name: 'Даниил Шулеров (ДИБББ-11)',
          role: 'player',
          character_class: 'cardsharp',
          hype_xp: 180,
          luck_chips: 85,
          jester_keys: 1,
          level: 2,
          is_bankrupt: false,
        };
  }

  async getStudentsRoster(): Promise<StudentListItem[]> {
    const res = await fetch(`${API_BASE}/api/arbitrage/students`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch students roster: ${res.statusText}`);
    }
    return res.json();
  }

  async recordArbitrageSession(payload: ArbitrageSessionRequest): Promise<ArbitrageSessionResponse> {
    const res = await fetch(`${API_BASE}/api/arbitrage/session`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to record arbitrage session: ${res.statusText}`);
    }
    return res.json();
  }

  async getDashboard(): Promise<DashboardData> {
    const res = await fetch(`${API_BASE}/api/me/dashboard`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch dashboard: ${res.statusText}`);
    }
    return res.json();
  }

  async changeClass(characterClass: string): Promise<DashboardData> {
    const res = await fetch(`${API_BASE}/api/me/class`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ character_class: characterClass }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to change class: ${res.statusText}`);
    }
    return res.json();
  }

  async listClasses(): Promise<ClassInfo[]> {
    const res = await fetch(`${API_BASE}/api/me/classes`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to list classes: ${res.statusText}`);
    }
    return res.json();
  }
}

export const api = new ApiClient();
