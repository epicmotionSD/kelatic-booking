'use client';

import { useEffect, useState } from 'react';

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
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  async function fetchSchedule() {
    setLoading(true);
    try {
      const response = await fetch('/api/stylist/schedule');
      if (response.ok) {
        const data = await response.json();
        if (data.weeklySchedule) {
          setSchedule(data.weeklySchedule);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stylist schedule:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch('/api/stylist/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklySchedule: schedule }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save stylist schedule:', error);
    } finally {
      setSaving(false);
    }
  }

  function toggleDay(day: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        blocks: !prev[day].enabled
          ? [{ id: Date.now().toString(), start: '09:00', end: '17:00' }]
          : prev[day].blocks,
      },
    }));
  }

  function updateTimeBlock(day: string, blockId: string, field: 'start' | 'end', value: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        blocks: prev[day].blocks.map((block) =>
          block.id === blockId ? { ...block, [field]: value } : block
        ),
      },
    }));
  }

  function addTimeBlock(day: string) {
    const lastBlock = schedule[day].blocks[schedule[day].blocks.length - 1];
    const newStart = lastBlock ? lastBlock.end : '09:00';
    const newEnd = incrementTime(newStart, 2);

    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        blocks: [...prev[day].blocks, { id: Date.now().toString(), start: newStart, end: newEnd }],
      },
    }));
  }

  function removeTimeBlock(day: string, blockId: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        blocks: prev[day].blocks.filter((block) => block.id !== blockId),
      },
    }));
  }

  function copyToAllDays(sourceDay: string) {
    const sourceSchedule = schedule[sourceDay];
    setSchedule((prev) => {
      const updated = { ...prev };
      DAYS.forEach((day) => {
        if (day !== sourceDay) {
          updated[day] = {
            enabled: sourceSchedule.enabled,
            blocks: sourceSchedule.blocks.map((block) => ({
              ...block,
              id: `${day}-${Date.now()}-${Math.random()}`,
            })),
          };
        }
      });
      return updated;
    });
  }

  function resetToDefaultHours() {
    setSchedule(DEFAULT_SCHEDULE);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-amber-900">Availability</h2>
          <p className="text-amber-700/70">Set your weekly working hours</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetToDefaultHours}
            className="px-4 py-2 bg-white border border-amber-200 text-amber-800 rounded-xl font-medium hover:bg-amber-50 transition-colors"
          >
            Reset to Shop Hours
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : saved ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3" />
              </svg>
            )}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur border border-amber-200 rounded-xl divide-y divide-amber-100">
        {DAYS.map((day) => (
          <div key={day} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleDay(day)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    schedule[day].enabled ? 'bg-amber-500' : 'bg-amber-200'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      schedule[day].enabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
                <span className={`font-medium ${schedule[day].enabled ? 'text-amber-900' : 'text-amber-700/50'}`}>
                  {DAY_LABELS[day]}
                </span>
              </div>

              {schedule[day].enabled && (
                <button
                  onClick={() => copyToAllDays(day)}
                  className="text-sm text-orange-700 hover:text-orange-800"
                >
                  Copy to all
                </button>
              )}
            </div>

            {schedule[day].enabled ? (
              <div className="space-y-2 ml-15">
                {schedule[day].blocks.map((block, index) => (
                  <div key={block.id} className="flex items-center gap-2">
                    <select
                      value={block.start}
                      onChange={(e) => updateTimeBlock(day, block.id, 'start', e.target.value)}
                      className="px-3 py-2 bg-white border border-amber-200 rounded-xl text-amber-900 text-sm focus:outline-none focus:border-amber-500"
                    >
                      {generateTimeOptions().map((time) => (
                        <option key={time} value={time}>{formatTime(time)}</option>
                      ))}
                    </select>
                    <span className="text-amber-600">to</span>
                    <select
                      value={block.end}
                      onChange={(e) => updateTimeBlock(day, block.id, 'end', e.target.value)}
                      className="px-3 py-2 bg-white border border-amber-200 rounded-xl text-amber-900 text-sm focus:outline-none focus:border-amber-500"
                    >
                      {generateTimeOptions().map((time) => (
                        <option key={time} value={time}>{formatTime(time)}</option>
                      ))}
                    </select>

                    {schedule[day].blocks.length > 1 && (
                      <button
                        onClick={() => removeTimeBlock(day, block.id)}
                        className="p-2 text-amber-500 hover:text-red-500 transition-colors"
                        title="Remove block"
                      >
                        ✕
                      </button>
                    )}

                    {index === schedule[day].blocks.length - 1 && (
                      <button
                        onClick={() => addTimeBlock(day)}
                        className="p-2 text-amber-700 hover:bg-amber-100 rounded-xl transition-colors"
                        title="Add block"
                      >
                        +
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-amber-700/60 ml-15">Not available</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      options.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return options;
}

function formatTime(time: string): string {
  const [hourString, minuteString] = time.split(':');
  const hour = Number(hourString);
  const minute = Number(minuteString);
  const amPm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${amPm}`;
}

function incrementTime(time: string, hours: number): string {
  const [hourString, minuteString] = time.split(':');
  const hour = Number(hourString);
  const minute = Number(minuteString);
  const newHour = Math.min(23, hour + hours);
  return `${newHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}
