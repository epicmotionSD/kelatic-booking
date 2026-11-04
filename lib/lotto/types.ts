export type LottoGame = 'powerball' | 'megamillions';
export type PoolStatus = 'open' | 'live' | 'won';
export type Tier = 'free' | 'pro';

export interface LottoPool {
  id: string;
  commissioner_id: string;
  name: string;
  game: LottoGame;
  win_condition: number;
  join_code: string;
  status: PoolStatus;
  player_limit: number;
  draws_counted: number;
  won_at: string | null;
  created_at: string;
}

export interface RosterRow {
  entry_id: string;
  pool_id: string;
  user_id: string;
  display_name: string;
  assigned_numbers: number[];
  matched_numbers: number[];
  won_at: string | null;
  created_at: string;
}

export interface LottoPlayer {
  id: string;
  display_name: string;
  phone_e164: string | null;
  sms_opt_in_at: string | null;
  sms_opted_out_at: string | null;
  tier: Tier;
}

export interface LottoDraw {
  id: string;
  game: LottoGame;
  draw_date: string;
  white_balls: number[];
  special_ball: number | null;
}

export type JoinResult =
  | { status: 'joined' | 'existing'; pool_name: string; entry: { id: string; pool_id: string; assigned_numbers: number[] } }
  | { status: 'full'; pool_name: string; limit: number }
  | { status: 'closed'; pool_name: string }
  | { status: 'not_found' };

export const GAMES: Record<LottoGame, { label: string; maxWhite: number; pro: boolean; drawDays: string }> = {
  powerball: { label: 'Powerball', maxWhite: 69, pro: false, drawDays: 'Mon · Wed · Sat' },
  megamillions: { label: 'Mega Millions', maxWhite: 70, pro: true, drawDays: 'Tue · Fri' },
};

export const FREE_PLAYER_LIMIT = 10;
export const PRO_PLAYER_LIMIT = 100;

// "(713) 555-0100" → "+17135550100"; returns null if it can't be a valid number
export function toE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('+')) {
    const d = '+' + trimmed.slice(1).replace(/\D/g, '');
    return /^\+[1-9]\d{7,14}$/.test(d) ? d : null;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export function friendlyError(message: string | undefined): string {
  if (!message) return 'Something went wrong. Try again.';
  if (message.includes('pro_required')) return 'Mega Millions leagues are a Pro feature.';
  if (message.includes('not_authenticated')) return 'Please sign in again.';
  if (message.includes('pool_full')) return 'This league is full.';
  return 'Something went wrong. Try again.';
}
