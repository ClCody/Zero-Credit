export type CharacterClass = 'cardsharp' | 'crypto_illusionist' | 'red_teamer' | 'croupier';
export type UserRole = 'player' | 'moderator' | 'admin';

export interface UserProfile {
  telegram_id: number;
  username?: string;
  full_name: string;
  role: UserRole;
  character_class: CharacterClass;
  hype_xp: number;
  luck_chips: number;
  jester_keys: number;
  level: number;
  is_bankrupt: boolean;
  bankrupt_until?: string | null;
  created_at?: string;
}

export interface Boss {
  id: number;
  name: string;
  subject_name: string;
  exam_type: 'credit' | 'exam';
  total_hp: number;
  current_hp: number;
  insta_kill_threshold: number;
  is_defeated: boolean;
}

export interface InventoryItem {
  id: number;
  user_id: number;
  item_id: string;
  stack_count: number;
  is_locked: boolean;
  name?: string;
  tier?: 'white' | 'green' | 'red' | 'lunar';
  description?: string;
}

export interface Syndicate {
  id: number;
  name: string;
  motto?: string;
  leader_id: number;
  sync_rate: number;
  shared_chips: number;
}

export interface HealthStatus {
  status: string;
  app: string;
  version: string;
  environment: string;
  mock_auth: boolean;
}

export interface StudentListItem {
  telegram_id: number;
  full_name: string;
  username?: string;
  character_class: string;
  level: number;
  hype_xp: number;
  luck_chips: number;
  jester_keys: number;
}

export interface StudentSessionRecord {
  student_id: number;
  present: boolean;
  recitation: boolean;
  lab_submitted: boolean;
  lab_first_three: boolean;
  custom_note?: string;
}

export interface ArbitrageSessionRequest {
  subject_name: string;
  session_type: string;
  records: StudentSessionRecord[];
}

export interface StudentRewardSummary {
  student_id: number;
  full_name: string;
  xp_awarded: number;
  chips_awarded: number;
  keys_awarded: number;
  new_level: number;
  new_xp: number;
}

export interface ArbitrageSessionResponse {
  success: boolean;
  session_id: number;
  subject_name: string;
  session_type: string;
  timestamp: string;
  total_present: number;
  total_absent: number;
  total_xp_awarded: number;
  total_chips_awarded: number;
  audit_hash: string;
  student_summaries: StudentRewardSummary[];
}
export interface ClassInfo {
  code: CharacterClass;
  name_ru: string;
  emblem: string;
  perk_title: string;
  perk_description: string;
  ultimate_name: string;
}

export interface RelicSlot {
  slot_index: number;
  is_unlocked: boolean;
  required_level: number;
  equipped_item_id?: string | null;
  equipped_item_name?: string | null;
}

export interface AcademicStats {
  attendance_count: number;
  attendance_rate: number;
  recitations_count: number;
  labs_count: number;
  streak_days: number;
}

export interface DashboardData {
  user: UserProfile;
  class_info: ClassInfo;
  stats: AcademicStats;
  relic_slots: RelicSlot[];
  total_slots: number;
  unlocked_slots_count: number;
}
