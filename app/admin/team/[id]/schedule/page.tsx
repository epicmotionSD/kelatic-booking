'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface TimeBlock {
  id: string;
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  blocks: TimeBlock[];
}

interface WeekSchedule {
  [key: string]: DaySchedule;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
}

interface Stylist {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const DEFAULT_SCHEDULE: WeekSchedule = {
  monday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
  tuesday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
  wednesday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
  thursday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
  friday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
  saturday: { enabled: true, blocks: [{ id: '1', start: '10:00', end: '16:00' }] },
  sunday: { enabled: false, blocks: [] },
};

export default function StylistSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const stylistId = params.id as string;

  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'weekly' | 'blocked'>('weekly');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [newBlock, setNewBlock] = useState<Partial<BlockedDate>>({
    date: '',
    reason: '',
    allDay: true,
    startTime: '09:00',
    endTime: '17:00',
  });

  useEffect(() => {
    fetchStylistData();
  }, [stylistId]);

  const fetchStylistData = async () => {
    setLoading(true);
    try {
      const stylistRes = await fetch(`/api/admin/team/${stylistId}`);
      if (stylistRes.ok) {
        const stylistData = await stylistRes.json();
        setStylist(stylistData);
      }

      const scheduleRes = await fetch(`/api/admin/team/${stylistId}/schedule`);
      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json();
        if (scheduleData.weeklySchedule) {
          setSchedule(scheduleData.weeklySchedule);
        }
        if (scheduleData.blockedDates) {
          setBlockedDates(scheduleData.blockedDates);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stylist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/team/${stylistId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklySchedule: schedule,
          blockedDates,
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save schedule:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        blocks: !prev[day].enabled ? [{ id: Date.now().toString(), start: '09:00', end: '17:00' }] : prev[day].blocks,
      },
    }));
  };

  const updateTimeBlock = (day: string, blockId: string, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        blocks: prev[day].blocks.map(block =>
          block.id === blockId ? { ...block, [field]: value } : block
        ),
      },
    }));
  };

  const addTimeBlock = (day: string) => {
    const lastBlock = schedule[day].blocks[schedule[day].blocks.length - 1];
    const newStart = lastBlock ? lastBlock.end : '09:00';
    const newEnd = incrementTime(newStart, 4);

    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        blocks: [...prev[day].blocks, { id: Date.now().toString(), start: newStart, end: newEnd }],
      },
    }));
  };

  const removeTimeBlock = (day: string, blockId: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        blocks: prev[day].blocks.filter(block => block.id !== blockId),
      },
    }));
  };

  const copyToAllDays = (sourceDay: string) => {
    const sourceSchedule = schedule[sourceDay];
    setSchedule(prev => {
      const updated = { ...prev };
      DAYS.forEach(day => {
        if (day !== sourceDay) {
          updated[day] = {
            enabled: sourceSchedule.enabled,
            blocks: sourceSchedule.blocks.map(b => ({ ...b, id: `${day}-${Date.now()}-${Math.random()}` })),
          };
        }
      });
      return updated;
    });
  };

  const incrementTime = (time: string, hours: number): string => {
    const [h, m] = time.split(':').map(Number);
    const newHour = Math.min(23, h + hours);
    return `${newHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const addBlockedDate = () => {
    if (!newBlock.date) return;

    const blocked: BlockedDate = {
      id: Date.now().toString(),
      date: newBlock.date,
      reason: newBlock.reason || 'Time off',
      allDay: newBlock.allDay ?? true,
      startTime: newBlock.allDay ? undefined : newBlock.startTime,
      endTime: newBlock.allDay ? undefined : newBlock.endTime,
    };

    setBlockedDates(prev => [...prev, blocked]);
    setNewBlock({ date: '', reason: '', allDay: true, startTime: '09:00', endTime: '17:00' });
    setShowBlockModal(false);
  };

  const removeBlockedDate = (id: string) => {
    setBlockedDates(prev => prev.filter(b => b.id !== id));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  const isDateBlocked = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return blockedDates.some(b => b.date === dateStr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/stylists"
            className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {stylist ? `${stylist.first_name} ${stylist.last_name}` : 'Stylist'} Schedule
            </h1>
            <p className="text-white/50">Manage working hours and time off</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
          ) : saved ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
              activeTab === 'weekly'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-white/50 hover:text-white/70'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Weekly Hours
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
              activeTab === 'blocked'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-white/50 hover:text-white/70'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Time Off
            {blockedDates.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                {blockedDates.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Weekly Hours Tab */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-amber-200">
              <p className="font-medium">Set recurring weekly availability</p>
              <p className="mt-1 text-amber-200/70">These hours will repeat every week. Use "Time Off" tab for specific dates.</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 divide-y divide-white/10">
            {DAYS.map((day) => (
              <div key={day} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleDay(day)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        schedule[day].enabled ? 'bg-amber-400' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-transform ${
                          schedule[day].enabled ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                    <span className={`font-medium ${schedule[day].enabled ? 'text-white' : 'text-white/40'}`}>
                      {DAY_LABELS[day]}
                    </span>
                  </div>

                  {schedule[day].enabled && (
                    <button
                      onClick={() => copyToAllDays(day)}
                      className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy to all
                    </button>
                  )}
                </div>

                {schedule[day].enabled ? (
                  <div className="space-y-2 ml-15">
                    {schedule[day].blocks.map((block, idx) => (
                      <div key={block.id} className="flex items-center gap-2">
                        <select
                          value={block.start}
                          onChange={(e) => updateTimeBlock(day, block.id, 'start', e.target.value)}
                          className="px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50"
                        >
                          {generateTimeOptions().map(time => (
                            <option key={time} value={time}>{formatTime(time)}</option>
                          ))}
                        </select>
                        <span className="text-white/40">to</span>
                        <select
                          value={block.end}
                          onChange={(e) => updateTimeBlock(day, block.id, 'end', e.target.value)}
                          className="px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50"
                        >
                          {generateTimeOptions().map(time => (
                            <option key={time} value={time}>{formatTime(time)}</option>
                          ))}
                        </select>

                        {schedule[day].blocks.length > 1 && (
                          <button
                            onClick={() => removeTimeBlock(day, block.id)}
                            className="p-2 text-white/40 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}

                        {idx === schedule[day].blocks.length - 1 && (
                          <button
                            onClick={() => addTimeBlock(day)}
                            className="p-2 text-amber-400 hover:bg-amber-400/10 rounded-xl transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/40 ml-15">Not working</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocked Dates Tab */}
      {activeTab === 'blocked' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar View */}
            <div className="flex-1 bg-white/5 backdrop-blur rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="font-semibold text-white">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-white/50 py-2">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(calendarMonth).map((date, idx) => {
                  if (!date) {
                    return <div key={`empty-${idx}`} className="h-10" />;
                  }

                  const isToday = date.toDateString() === new Date().toDateString();
                  const isBlocked = isDateBlocked(date);
                  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => {
                        if (!isPast) {
                          setNewBlock(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
                          setShowBlockModal(true);
                        }
                      }}
                      disabled={isPast}
                      className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                        isBlocked
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : isToday
                          ? 'bg-amber-400/20 text-amber-400'
                          : isPast
                          ? 'text-white/20 cursor-not-allowed'
                          : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500/20 rounded" />
                  <span className="text-white/60">Time Off</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-400/20 rounded" />
                  <span className="text-white/60">Today</span>
                </div>
              </div>
            </div>

            {/* Blocked Dates List */}
            <div className="w-full lg:w-80">
              <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-semibold text-white">Upcoming Time Off</h3>
                  <button
                    onClick={() => setShowBlockModal(true)}
                    className="p-2 bg-amber-400/10 text-amber-400 rounded-xl hover:bg-amber-400/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {blockedDates.length === 0 ? (
                  <div className="p-6 text-center">
                    <svg className="w-10 h-10 text-white/20 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-white/50 text-sm">No time off scheduled</p>
                    <button
                      onClick={() => setShowBlockModal(true)}
                      className="mt-2 text-sm text-amber-400 hover:text-amber-300"
                    >
                      + Add time off
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10 max-h-80 overflow-y-auto">
                    {blockedDates
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map(blocked => (
                        <div key={blocked.id} className="p-3 flex items-start justify-between gap-2">
                          <div>
                            <div className="font-medium text-white">{formatDate(blocked.date)}</div>
                            <div className="text-sm text-white/50">
                              {blocked.allDay
                                ? 'All day'
                                : `${formatTime(blocked.startTime!)} - ${formatTime(blocked.endTime!)}`}
                            </div>
                            {blocked.reason && (
                              <div className="text-xs text-white/40 mt-1">{blocked.reason}</div>
                            )}
                          </div>
                          <button
                            onClick={() => removeBlockedDate(blocked.id)}
                            className="p-1 text-white/40 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Block Time Off</h3>
              <button
                onClick={() => setShowBlockModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Date</label>
                <input
                  type="date"
                  value={newBlock.date}
                  onChange={(e) => setNewBlock(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g., Vacation, Training, Personal"
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newBlock.allDay}
                    onChange={(e) => setNewBlock(prev => ({ ...prev, allDay: e.target.checked }))}
                    className="w-4 h-4 text-amber-400 rounded focus:ring-amber-400/50 bg-white/10 border-white/20"
                  />
                  <span className="text-sm text-white">All day</span>
                </label>
              </div>

              {!newBlock.allDay && (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white/70 mb-1">Start</label>
                    <select
                      value={newBlock.startTime}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50"
                    >
                      {generateTimeOptions().map(time => (
                        <option key={time} value={time}>{formatTime(time)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white/70 mb-1">End</label>
                    <select
                      value={newBlock.endTime}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50"
                    >
                      {generateTimeOptions().map(time => (
                        <option key={time} value={time}>{formatTime(time)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addBlockedDate}
                disabled={!newBlock.date}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
              >
                Block Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 6; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      options.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return options;
}
