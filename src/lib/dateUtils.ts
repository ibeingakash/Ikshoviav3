/**
 * Date formatting and normalization utilities for Ikshovia.
 * Ensures consistent, elegant, human-readable date presentation across the application.
 * Never exposes raw ISO timestamps (e.g. 2026-08-13T00:00:00.000Z) to learners.
 */

export function formatDateHuman(dateStr?: string | Date | null, options?: { short?: boolean; includeWeekday?: boolean }): string {
  if (!dateStr) return 'Recent';

  try {
    let date: Date;
    if (typeof dateStr === 'string') {
      // If string is YYYY-MM-DD format
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        date = new Date(dateStr);
      }
    } else {
      date = dateStr;
    }

    if (isNaN(date.getTime())) return typeof dateStr === 'string' ? dateStr.split('T')[0] : 'Recent';

    if (options?.short) {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }); // e.g., "18 Aug 2026"
    }

    if (options?.includeWeekday) {
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }); // e.g., "Tue, 18 August 2026"
    }

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }); // e.g., "18 August 2026"
  } catch {
    return typeof dateStr === 'string' ? dateStr.split('T')[0] : 'Recent';
  }
}

export function formatTimeAgo(dateStr?: string | Date | null): string {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatDateHuman(date, { short: true });
  } catch {
    return '';
  }
}

export function isDateToday(dateStr?: string | Date | null): boolean {
  if (!dateStr) return false;
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const compareStr = typeof dateStr === 'string' ? dateStr.split('T')[0] : dateStr.toISOString().split('T')[0];
    return todayStr === compareStr;
  } catch {
    return false;
  }
}
