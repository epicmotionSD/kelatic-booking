'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Save,
  Trash2,
  Instagram,
  Facebook,
  Youtube,
  Mail,
  Clock,
  CheckCircle,
  Edit3,
  Sparkles,
  List,
  CalendarDays,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Platform = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'email' | 'all';
type ContentType = 'reel' | 'post' | 'story' | 'carousel' | 'email' | 'blog' | 'video';
type Status = 'idea' | 'draft' | 'scheduled' | 'published' | 'approved' | 'needs_revision';

interface CalendarPost {
  id: string;
  scheduled_date: string;
  platform: Platform;
  content_type: ContentType;
  title: string | null;
  caption: string | null;
  hashtags: string | null;
  asset_url: string | null;
  status: Status;
  assigned_to: string | null;
  manager_notes: string | null;
  ai_generated: boolean;
  created_at: string;
}

type NewPost = Omit<CalendarPost, 'id' | 'created_at'>;

const MANAGERS = ['Manager 1', 'Manager 2'];

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  instagram: <Instagram className="w-3.5 h-3.5" />,
  facebook: <Facebook className="w-3.5 h-3.5" />,
  tiktok: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.14 8.14 0 004.77 1.52V6.75a4.85 4.85 0 01-1-.06z" />
    </svg>
  ),
  youtube: <Youtube className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  all: <CalendarDays className="w-3.5 h-3.5" />,
};

const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  facebook: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  tiktok: 'bg-white/10 text-white/70 border-white/20',
  youtube: 'bg-red-500/20 text-red-400 border-red-500/30',
  email: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  all: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: React.ReactNode }> = {
  idea: { label: 'Idea', color: 'text-white/40 bg-white/5 border-white/10', icon: <Sparkles className="w-3 h-3" /> },
  draft: { label: 'Draft', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <Edit3 className="w-3 h-3" /> },
  scheduled: { label: 'Scheduled', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: <Clock className="w-3 h-3" /> },
  approved: { label: 'Approved', color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: <CheckCircle className="w-3 h-3" /> },
  published: { label: 'Published', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: <CheckCircle className="w-3 h-3" /> },
  needs_revision: { label: 'Needs Revision', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: <Edit3 className="w-3 h-3" /> },
};

const EMPTY_POST: NewPost = {
  scheduled_date: '',
  platform: 'instagram',
  content_type: 'post',
  title: '',
  caption: '',
  hashtags: '',
  asset_url: '',
  status: 'idea',
  assigned_to: MANAGERS[0],
  manager_notes: '',
  ai_generated: false,
};

function getDaysInRange(start: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDateDisplay(d: Date): { day: string; weekday: string; month: string } {
  return {
    day: d.getDate().toString(),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
  };
}

export default function ContentCalendar() {
  const supabase = createClient();
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1); // start of current month
    return d;
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterManager, setFilterManager] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CalendarPost | null>(null);
  const [form, setForm] = useState<NewPost>({ ...EMPTY_POST });
  const [saving, setSaving] = useState(false);

  const days = getDaysInRange(startDate, 30);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const from = toDateStr(days[0]);
      const to = toDateStr(days[days.length - 1]);
      const { data, error } = await supabase
        .from('trinity_calendar_posts')
        .select('*')
        .gte('scheduled_date', from)
        .lte('scheduled_date', to)
        .order('scheduled_date', { ascending: true });
      if (!error && data) setPosts(data as CalendarPost[]);
    } catch (e) {
      console.error('Failed to load posts', e);
    } finally {
      setLoading(false);
    }
  }, [supabase, startDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const openNewPost = (date: Date) => {
    setEditingPost(null);
    setForm({ ...EMPTY_POST, scheduled_date: toDateStr(date) });
    setModalOpen(true);
  };

  const openEditPost = (post: CalendarPost) => {
    setEditingPost(post);
    setForm({
      scheduled_date: post.scheduled_date,
      platform: post.platform,
      content_type: post.content_type,
      title: post.title ?? '',
      caption: post.caption ?? '',
      hashtags: post.hashtags ?? '',
      asset_url: post.asset_url ?? '',
      status: post.status,
      assigned_to: post.assigned_to ?? MANAGERS[0],
      manager_notes: post.manager_notes ?? '',
      ai_generated: post.ai_generated,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.scheduled_date || !form.platform) return;
    setSaving(true);
    try {
      if (editingPost) {
        const { error } = await supabase
          .from('trinity_calendar_posts')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', editingPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trinity_calendar_posts')
          .insert(form);
        if (error) throw error;
      }
      setModalOpen(false);
      await loadPosts();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await supabase.from('trinity_calendar_posts').delete().eq('id', id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setModalOpen(false);
  };

  const handleStatusCycle = async (post: CalendarPost, e: React.MouseEvent) => {
    e.stopPropagation();
    const cycle: Status[] = ['idea', 'draft', 'scheduled', 'approved', 'published'];
    const nextIndex = (cycle.indexOf(post.status) + 1) % cycle.length;
    const nextStatus = cycle[nextIndex];
    await supabase
      .from('trinity_calendar_posts')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', post.id);
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: nextStatus } : p));
  };

  const postsForDay = (dateStr: string) =>
    posts.filter((p) => {
      const matchDate = p.scheduled_date === dateStr;
      const matchManager = filterManager === 'all' || p.assigned_to === filterManager;
      const matchPlatform = filterPlatform === 'all' || p.platform === filterPlatform;
      return matchDate && matchManager && matchPlatform;
    });

  const goBack30 = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - 30);
    setStartDate(d);
  };

  const goForward30 = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 30);
    setStartDate(d);
  };

  const goToday = () => {
    const d = new Date();
    d.setDate(1);
    setStartDate(d);
  };

  const todayStr = toDateStr(new Date());

  const filteredListPosts = posts.filter((p) => {
    const matchManager = filterManager === 'all' || p.assigned_to === filterManager;
    const matchPlatform = filterPlatform === 'all' || p.platform === filterPlatform;
    return matchManager && matchPlatform;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Content Calendar</h2>
          <p className="text-white/50 text-sm mt-0.5">
            30-day editable schedule — {days[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Manager Filter */}
          <select
            value={filterManager}
            onChange={(e) => setFilterManager(e.target.value)}
            className="bg-white/5 border border-white/10 text-white/80 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
            title="Filter by manager"
          >
            <option value="all">All Managers</option>
            {MANAGERS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Platform Filter */}
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value as Platform | 'all')}
            className="bg-white/5 border border-white/10 text-white/80 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
            title="Filter by platform"
          >
            <option value="all">All Platforms</option>
            {(['instagram', 'facebook', 'tiktok', 'youtube', 'email'] as Platform[]).map((p) => (
              <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 transition-colors ${viewMode === 'calendar' ? 'bg-amber-400 text-black' : 'text-white/50 hover:text-white'}`}
              title="Calendar view"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-amber-400 text-black' : 'text-white/50 hover:text-white'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={goBack30}
          className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-colors"
          title="Previous 30 days"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={goToday}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white text-sm transition-colors"
        >
          Today
        </button>
        <button
          onClick={goForward30}
          className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-colors"
          title="Next 30 days"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex gap-3 ml-auto flex-wrap">
          {MANAGERS.map((m, i) => (
            <div key={m} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-purple-400' : 'bg-amber-400'}`} />
              <span className="text-xs text-white/50">{m}</span>
            </div>
          ))}
          <div className="text-xs text-white/30 ml-2">
            {posts.length} posts scheduled
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {(['idea', 'draft', 'scheduled', 'approved', 'published', 'needs_revision'] as Status[]).map((s) => {
          const count = posts.filter((p) => p.status === s).length;
          const cfg = STATUS_CONFIG[s];
          return (
            <div key={s} className={`rounded-xl border px-3 py-2 text-center ${cfg.color}`}>
              <div className="text-lg font-bold">{count}</div>
              <div className="text-xs opacity-70">{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {/* Calendar Grid View */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-5 sm:grid-cols-7 xl:grid-cols-10 gap-2">
          {days.map((day) => {
            const dateStr = toDateStr(day);
            const dayPosts = postsForDay(dateStr);
            const isToday = dateStr === todayStr;
            const isPast = dateStr < todayStr;

            const { day: dayNum, weekday, month } = formatDateDisplay(day);

            return (
              <div
                key={dateStr}
                className={`min-h-[120px] rounded-xl border flex flex-col transition-all ${
                  isToday
                    ? 'border-amber-400/50 bg-amber-400/5'
                    : isPast
                    ? 'border-white/5 bg-black/20 opacity-60'
                    : 'border-white/10 bg-white/3 hover:border-white/20'
                }`}
              >
                {/* Day Header */}
                <div className={`px-2 pt-2 pb-1 flex items-start justify-between ${isToday ? 'text-amber-400' : 'text-white/50'}`}>
                  <div>
                    <div className="text-xs">{weekday}</div>
                    <div className={`text-sm font-bold ${isToday ? 'text-amber-400' : 'text-white/70'}`}>
                      {dayNum}
                    </div>
                    {day.getDate() === 1 && (
                      <div className="text-xs text-white/30">{month}</div>
                    )}
                  </div>
                  <button
                    onClick={() => openNewPost(day)}
                    className="p-0.5 text-white/20 hover:text-amber-400 transition-colors"
                    title="Add post"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Posts */}
                <div className="flex-1 px-1.5 pb-1.5 space-y-1 overflow-y-auto max-h-28">
                  {loading && dayPosts.length === 0 ? null : dayPosts.map((post) => {
                    const mgIdx = MANAGERS.indexOf(post.assigned_to ?? '');
                    const dotColor = mgIdx === 0 ? 'bg-purple-400' : mgIdx === 1 ? 'bg-amber-400' : 'bg-white/20';
                    return (
                      <div
                        key={post.id}
                        onClick={() => openEditPost(post)}
                        className="w-full text-left group cursor-pointer"
                      >
                        <div className={`rounded-lg px-1.5 py-1 border ${PLATFORM_COLORS[post.platform]} text-xs flex items-start gap-1`}>
                          <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 truncate">
                              {PLATFORM_ICONS[post.platform]}
                              <span className="truncate">{post.title || post.content_type}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleStatusCycle(post, e)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            title={`Status: ${post.status} (click to advance)`}
                          >
                            {STATUS_CONFIG[post.status].icon}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-white/30">Loading...</div>
          ) : filteredListPosts.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No posts scheduled in this period</p>
            </div>
          ) : (
            filteredListPosts.map((post) => {
              const dateObj = new Date(post.scheduled_date + 'T00:00:00');
              const isPast = post.scheduled_date < todayStr;
              return (
                <div
                  key={post.id}
                  onClick={() => openEditPost(post)}
                  className={`flex items-center gap-4 bg-white/3 border border-white/8 rounded-xl px-4 py-3 cursor-pointer hover:border-white/15 hover:bg-white/5 transition-all ${isPast ? 'opacity-60' : ''}`}
                >
                  {/* Date */}
                  <div className="text-center w-12 shrink-0">
                    <div className="text-xs text-white/40">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className="text-lg font-bold text-white/80 leading-none">{dateObj.getDate()}</div>
                    <div className="text-xs text-white/30">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</div>
                  </div>

                  {/* Platform Badge */}
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs shrink-0 ${PLATFORM_COLORS[post.platform]}`}>
                    {PLATFORM_ICONS[post.platform]}
                    <span className="capitalize">{post.platform}</span>
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm font-medium truncate">
                      {post.title || `${post.content_type} — ${post.platform}`}
                    </p>
                    {post.caption && (
                      <p className="text-white/40 text-xs truncate mt-0.5">{post.caption}</p>
                    )}
                  </div>

                  {/* Assigned */}
                  {post.assigned_to && (
                    <span className="text-xs text-white/40 hidden sm:block shrink-0">{post.assigned_to}</span>
                  )}

                  {/* Status */}
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs shrink-0 ${STATUS_CONFIG[post.status].color}`}>
                    {STATUS_CONFIG[post.status].icon}
                    {STATUS_CONFIG[post.status].label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <h3 className="font-bold text-white">
                {editingPost ? 'Edit Post' : `New Post — ${form.scheduled_date}`}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Date */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Date</label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Platform + Content Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Platform</label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value as Platform }))}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                    title="Platform"
                  >
                    {(['instagram', 'facebook', 'tiktok', 'youtube', 'email', 'all'] as Platform[]).map((p) => (
                      <option key={p} value={p} className="capitalize bg-zinc-800">
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Content Type</label>
                  <select
                    value={form.content_type}
                    onChange={(e) => setForm((f) => ({ ...f, content_type: e.target.value as ContentType }))}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                    title="Content type"
                  >
                    {(['reel', 'post', 'story', 'carousel', 'email', 'blog', 'video'] as ContentType[]).map((c) => (
                      <option key={c} value={c} className="capitalize bg-zinc-800">
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Title / Topic</label>
                <input
                  type="text"
                  value={form.title ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Loc retwist tips for summer"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Caption / Copy</label>
                <textarea
                  value={form.caption ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                  placeholder="Write your caption here..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Hashtags */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Hashtags</label>
                <input
                  type="text"
                  value={form.hashtags ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, hashtags: e.target.value }))}
                  placeholder="#locsofhouston #kelatic #loclife"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Asset URL */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Asset URL (from library)</label>
                <input
                  type="text"
                  value={form.asset_url ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, asset_url: e.target.value }))}
                  placeholder="Paste asset URL from library"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Assign + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Assigned To</label>
                  <select
                    value={form.assigned_to ?? MANAGERS[0]}
                    onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                    title="Assign to manager"
                  >
                    {MANAGERS.map((m) => <option key={m} value={m} className="bg-zinc-800">{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                    title="Status"
                  >
                    {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => (
                      <option key={s} value={s} className="bg-zinc-800">{STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Manager Notes */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Manager Notes</label>
                <textarea
                  value={form.manager_notes ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, manager_notes: e.target.value }))}
                  placeholder="Internal notes, feedback, revisions needed..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-5 border-t border-white/10 shrink-0">
              {editingPost && (
                <button
                  onClick={() => handleDelete(editingPost.id)}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.scheduled_date}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold rounded-xl text-sm hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : editingPost ? 'Update Post' : 'Add to Calendar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
