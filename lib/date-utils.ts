// Standardized date and time formatting utilities

// Format time for display (e.g., "2:30 PM")
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Format date for display (e.g., "Monday, January 15, 2024")
export function formatDate(dateStr: string): string {
  // Handle both ISO strings and date-only strings
  const date = dateStr.includes('T') 
    ? new Date(dateStr) 
    : new Date(dateStr + 'T00:00:00');
  
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format short date for display (e.g., "Jan 15")
export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Format date and time together
export function formatDateTime(isoString: string): { date: string; time: string } {
  return {
    date: formatDate(isoString),
    time: formatTime(isoString),
  };
}

// Format duration in minutes to human readable format
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

// Check if date is within 24 hours
export function isWithin24Hours(isoString: string): boolean {
  const appointmentDate = new Date(isoString);
  const now = new Date();
  const diff = appointmentDate.getTime() - now.getTime();
  return diff > 0 && diff < 24 * 60 * 60 * 1000;
}

// Format date for calendar export (Google Calendar format)
export function formatDateForCal(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d{3}/g, '');
}

// Parse time string to minutes (e.g., "14:30" -> 870)
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Format minutes to time string (e.g., 870 -> "14:30")
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}