import type { UserSummary } from '../../core/models/api-contracts';

export function userDisplayName(user: UserSummary | null | undefined): string {
  if (!user) return '—';
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return full || user.userName || user.email || '—';
}

export function userInitials(user: UserSummary | null | undefined): string {
  if (!user) return '';
  const first = user.firstName?.trim()?.[0] ?? '';
  const last = user.lastName?.trim()?.[0] ?? '';
  const fromName = `${first}${last}`.toUpperCase();
  if (fromName) return fromName;
  return (user.userName?.[0] ?? user.email?.[0] ?? '?').toUpperCase();
}
