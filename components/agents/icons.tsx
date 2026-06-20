'use client';

import {
  Megaphone,
  Repeat,
  HeartHandshake,
  Sparkles,
  Send,
  UserRoundCheck,
  CalendarClock,
  MessageCircle,
  Bell,
  Bot,
  type LucideIcon,
} from 'lucide-react';

// Maps the string icon names stored in the primary-agent registry to
// lucide components, so the registry stays serializable (plain strings).
const MAP: Record<string, LucideIcon> = {
  megaphone: Megaphone,
  repeat: Repeat,
  'heart-handshake': HeartHandshake,
  sparkles: Sparkles,
  send: Send,
  'user-round-check': UserRoundCheck,
  'calendar-clock': CalendarClock,
  'message-circle': MessageCircle,
  bell: Bell,
};

export function AgentIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] || Bot;
  return <Icon className={className} />;
}
