import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import {
  ArbitrageSessionResponse,
  StudentListItem,
  StudentSessionRecord,
} from '@/types';
import { useTelegram } from '@/context/TelegramContext';
import {
  Check,
  X,
  Sparkles,
  BookOpen,
  FlaskConical,
  Award,
  Zap,
  ShieldCheck,
  Copy,
  Users,
  CheckCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const SUBJECTS = [
  'Криптографические методы защиты',
  'Безопасность операционных систем',
  'Сетевая безопасность',
  'Специальные технологии баз данных',
  'Организационное обеспечение ИБ',
];

export const ArbitrageJournal: React.FC = () => {
  const { user, refreshUser } = useTelegram();
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [records, setRecords] = useState<Record<number, StudentSessionRecord>>({});
  const [selectedSubject, setSelectedSubject] = useState<string>(SUBJECTS[0]);
  const [sessionType, setSessionType] = useState<'lecture' | 'practice' | 'lab'>('lecture');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionResult, setSessionResult] = useState<ArbitrageSessionResponse | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const isArbitr = user?.role === 'admin' || user?.role === 'moderator';

  // Load roster
  const loadRoster = async () => {
    if (!isArbitr) return;
    setLoading(true);
    setError(null);
    try {
      const roster = await api.getStudentsRoster();
      setStudents(roster);

      // Initialize default attendance (all present by default)
      const initialRecords: Record<number, StudentSessionRecord> = {};
      roster.forEach((s) => {
        initialRecords[s.telegram_id] = {
          student_id: s.telegram_id,
          present: true,
          recitation: false,
          lab_submitted: false,
          lab_first_three: false,
        };
      });
      setRecords(initialRecords);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки списка группы';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [user?.role]);

  // Toggle presence
  const togglePresence = (studentId: number) => {
    setRecords((prev) => {
      const current = prev[studentId] || {
        student_id: studentId,
        present: true,
        recitation: false,
        lab_submitted: false,
        lab_first_three: false,
      };
      const nextPresent = !current.present;
      return {
        ...prev,
        [studentId]: {
          ...current,
          present: nextPresent,
          // Reset bonuses if absent
          recitation: nextPresent ? current.recitation : false,
          lab_submitted: nextPresent ? current.lab_submitted : false,
          lab_first_three: nextPresent ? current.lab_first_three : false,
        },
      };
    });
  };

  // Toggle recitation (+30 chips)
  const toggleRecitation = (studentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecords((prev) => {
      const current = prev[studentId];
      if (!current || !current.present) return prev;
      return {
        ...prev,
        [studentId]: {
          ...current,
          recitation: !current.recitation,
        },
      };
    });
  };

  // Toggle lab submission (+50 chips)
  const toggleLab = (studentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecords((prev) => {
      const current = prev[studentId];
      if (!current || !current.present) return prev;
      return {
        ...prev,
        [studentId]: {
          ...current,
          lab_submitted: !current.lab_submitted,
          // if disabled lab, first_three must be disabled
          lab_first_three: !current.lab_submitted ? current.lab_first_three : false,
        },
      };
    });
  };

  // Toggle first three / sprint (+75 chips, +1 key)
  const toggleFirstThree = (studentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecords((prev) => {
      const current = prev[studentId];
      if (!current || !current.present) return prev;
      const nextFirst = !current.lab_first_three;
      return {
        ...prev,
        [studentId]: {
          ...current,
          lab_first_three: nextFirst,
          lab_submitted: nextFirst ? true : current.lab_submitted,
        },
      };
    });
  };

  // Mark all present / toggle
  const markAllPresent = () => {
    setRecords((prev) => {
      const next: Record<number, StudentSessionRecord> = {};
      Object.keys(prev).forEach((k) => {
        const id = Number(k);
        next[id] = { ...prev[id], present: true };
      });
      return next;
    });
  };

  // Submit session
  const handleSubmitSession = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payloadRecords = Object.values(records);
      const res = await api.recordArbitrageSession({
        subject_name: selectedSubject,
        session_type: sessionType,
        records: payloadRecords,
      });
      setSessionResult(res);
      await refreshUser();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка фиксации пары';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyAuditHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // If user is not an arbitr
  if (!isArbitr) {
    return (
      <div className="bg-carnival-card border border-carnival-border rounded-xl p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto text-xl">
          🔒
        </div>
        <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
          Доступ Ограничен: Требуется роль Арбитра
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Журнал «Учет в 2 клика» предназначен исключительно для Старосты группы ДИБББ-11.
          В режиме разработки вы можете переключить роль на «Староста» в верхней плашке.
        </p>
      </div>
    );
  }

  // Calculate live stats
  const presentCount = Object.values(records).filter((r) => r.present).length;
  const absentCount = students.length - presentCount;
  const baseXP = sessionType === 'lecture' ? 25 : 35;
  const totalExpProjected = presentCount * baseXP;

  return (
    <div className="space-y-4">
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-carnival-card to-carnival-dark border border-carnival-border rounded-xl p-4 space-y-3 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">⚖️</span>
            <div>
              <h2 className="text-sm font-bold text-white font-mono tracking-wide">
                ЖУРНАЛ СТАРОСТЫ-АРБИТРА
              </h2>
              <p className="text-[10px] text-gray-400">«Учет пары в 2 клика» • ДИБББ-11</p>
            </div>
          </div>
          <button
            onClick={loadRoster}
            disabled={loading}
            className="p-1.5 rounded-lg bg-carnival-darkest border border-carnival-border text-gray-400 hover:text-white transition"
            title="Обновить список"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Subject & Session Type Pickers */}
        <div className="space-y-2 pt-1 text-xs">
          <div>
            <label className="text-[10px] uppercase text-gray-400 block mb-1 font-mono">
              Дисциплина
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-carnival-darkest border border-carnival-border rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-rose-500 font-sans"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              onClick={() => setSessionType('lecture')}
              className={`p-2 rounded-lg border text-center transition flex flex-col items-center space-y-0.5 ${
                sessionType === 'lecture'
                  ? 'bg-rose-950/60 border-rose-600 text-rose-300 font-semibold'
                  : 'bg-carnival-darkest/60 border-carnival-border text-gray-400'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-[11px]">Лекция</span>
              <span className="text-[9px] text-gray-500 font-mono">+25 XP</span>
            </button>
            <button
              onClick={() => setSessionType('practice')}
              className={`p-2 rounded-lg border text-center transition flex flex-col items-center space-y-0.5 ${
                sessionType === 'practice'
                  ? 'bg-amber-950/60 border-amber-600 text-amber-300 font-semibold'
                  : 'bg-carnival-darkest/60 border-carnival-border text-gray-400'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span className="text-[11px]">Практика</span>
              <span className="text-[9px] text-gray-500 font-mono">+35 XP</span>
            </button>
            <button
              onClick={() => setSessionType('lab')}
              className={`p-2 rounded-lg border text-center transition flex flex-col items-center space-y-0.5 ${
                sessionType === 'lab'
                  ? 'bg-cyan-950/60 border-cyan-600 text-cyan-300 font-semibold'
                  : 'bg-carnival-darkest/60 border-carnival-border text-gray-400'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span className="text-[11px]">Лаба</span>
              <span className="text-[9px] text-gray-500 font-mono">+35 XP</span>
            </button>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-carnival-border/60">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-emerald-400">
              Был: <strong>{presentCount}</strong>
            </span>
            <span className="text-[11px] font-mono text-rose-400">
              Не был: <strong>{absentCount}</strong>
            </span>
          </div>
          <button
            onClick={markAllPresent}
            className="flex items-center space-x-1 text-[11px] text-gray-400 hover:text-white px-2 py-0.5 rounded bg-carnival-darkest border border-carnival-border"
          >
            <CheckCheck className="w-3 h-3 text-emerald-400" />
            <span>Все на месте</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-rose-950/50 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Students List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-mono flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-gray-400" /> Студенты ({students.length})
          </span>
          <span className="text-[10px] text-gray-500">
            Клик по студенту меняет присутствие
          </span>
        </div>

        {loading ? (
          <div className="bg-carnival-card border border-carnival-border rounded-xl p-8 text-center text-gray-500 text-xs animate-pulse">
            Загрузка списка группы...
          </div>
        ) : (
          <div className="space-y-1.5">
            {students.map((student) => {
              const rec = records[student.telegram_id] || {
                student_id: student.telegram_id,
                present: true,
                recitation: false,
                lab_submitted: false,
                lab_first_three: false,
              };

              return (
                <div
                  key={student.telegram_id}
                  onClick={() => togglePresence(student.telegram_id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    rec.present
                      ? 'bg-carnival-card/90 border-carnival-border hover:border-carnival-border/90'
                      : 'bg-carnival-darkest/70 border-rose-950/80 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Student Info */}
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition ${
                          rec.present
                            ? 'bg-emerald-950 border border-emerald-700 text-emerald-400'
                            : 'bg-rose-950 border border-rose-800 text-rose-500'
                        }`}
                      >
                        {rec.present ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-xs font-semibold ${rec.present ? 'text-white' : 'text-gray-400 line-through'}`}>
                            {student.full_name}
                          </span>
                          <span className="text-[9px] bg-carnival-darkest px-1.5 py-0.2 rounded border border-carnival-border text-gray-400 font-mono">
                            УР.{student.level}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono">
                          @{student.username || 'n/a'} • {student.character_class}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          rec.present
                            ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                            : 'bg-rose-950/50 border-rose-900 text-rose-400'
                        }`}
                      >
                        {rec.present ? 'БЫЛ (+XP)' : 'ПРОПУСК'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Badges (only when present) */}
                  {rec.present && (
                    <div className="flex items-center space-x-1.5 mt-2.5 pt-2 border-t border-carnival-border/40">
                      {/* Recitation */}
                      <button
                        type="button"
                        onClick={(e) => toggleRecitation(student.telegram_id, e)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-medium flex items-center space-x-1 transition border ${
                          rec.recitation
                            ? 'bg-amber-600 border-amber-500 text-white shadow-sm'
                            : 'bg-carnival-darkest border-carnival-border text-gray-400 hover:text-white'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Ответ (+30)</span>
                      </button>

                      {/* Lab Submitted */}
                      <button
                        type="button"
                        onClick={(e) => toggleLab(student.telegram_id, e)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-medium flex items-center space-x-1 transition border ${
                          rec.lab_submitted
                            ? 'bg-cyan-600 border-cyan-500 text-white shadow-sm'
                            : 'bg-carnival-darkest border-carnival-border text-gray-400 hover:text-white'
                        }`}
                      >
                        <FlaskConical className="w-3 h-3" />
                        <span>Лаба (+50)</span>
                      </button>

                      {/* Lab First Three */}
                      <button
                        type="button"
                        onClick={(e) => toggleFirstThree(student.telegram_id, e)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-medium flex items-center space-x-1 transition border ${
                          rec.lab_first_three
                            ? 'bg-rose-600 border-rose-500 text-white shadow-sm'
                            : 'bg-carnival-darkest border-carnival-border text-gray-400 hover:text-white'
                        }`}
                      >
                        <Zap className="w-3 h-3 text-amber-300" />
                        <span>1-я тройка (+75, 🔑)</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Commitment Bar */}
      <div className="sticky bottom-16 pt-2 pb-1">
        <button
          onClick={handleSubmitSession}
          disabled={submitting || loading || students.length === 0}
          className="w-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg glow-crimson flex items-center justify-between transition disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 fill-white" />
            <span className="text-xs uppercase tracking-wider font-mono">
              {submitting ? 'Транзакция в блокчейн...' : 'Зафиксировать пару'}
            </span>
          </div>

          <div className="text-[11px] font-mono bg-black/30 px-2 py-0.5 rounded border border-white/20">
            {presentCount} студентов • +{totalExpProjected} XP
          </div>
        </button>
      </div>

      {/* Success Modal / Card with Tamper-Proof Audit Log */}
      {sessionResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-carnival-card border border-rose-500/80 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center space-x-2.5 text-emerald-400">
              <ShieldCheck className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono">
                  Пара успешно зафиксирована!
                </h3>
                <p className="text-[10px] text-gray-400">
                  Транзакция внесена в публичный аудит-лог «Глаз Фемиды»
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-carnival-darkest p-2.5 rounded-lg border border-carnival-border">
                <span className="text-[10px] text-gray-500 block uppercase">Присутствовало</span>
                <span className="text-emerald-400 font-bold">{sessionResult.total_present} чел.</span>
              </div>
              <div className="bg-carnival-darkest p-2.5 rounded-lg border border-carnival-border">
                <span className="text-[10px] text-gray-500 block uppercase">Начислено валюты</span>
                <span className="text-amber-400 font-bold">+{sessionResult.total_chips_awarded} жетонов</span>
              </div>
            </div>

            {/* SHA-256 Hash Box */}
            <div className="bg-carnival-darkest p-3 rounded-lg border border-carnival-border space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span>SHA-256 HASH ТРАНЗАКЦИИ:</span>
                <button
                  onClick={() => copyAuditHash(sessionResult.audit_hash)}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedHash ? 'Скопировано!' : 'Копировать'}</span>
                </button>
              </div>
              <div className="font-mono text-[10px] text-gray-300 break-all select-all bg-black/40 p-1.5 rounded">
                {sessionResult.audit_hash}
              </div>
            </div>

            <button
              onClick={() => {
                setSessionResult(null);
                loadRoster();
              }}
              className="w-full bg-carnival-darkest hover:bg-carnival-border/60 border border-carnival-border text-white text-xs py-2.5 rounded-xl font-mono uppercase font-bold transition"
            >
              Закрыть протокол
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
