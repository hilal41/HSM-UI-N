const DEFAULT_BRANCH_TIME_ZONE = 'Asia/Karachi';

/** Calendar YYYY-MM-DD in the given IANA time zone (en-CA locale). */
export function toBranchYmd(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || DEFAULT_BRANCH_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Date at local noon for the branch's calendar today (stable for datepickers). */
export function branchCalendarToday(timeZone: string): Date {
  const ymd = toBranchYmd(new Date(), timeZone || DEFAULT_BRANCH_TIME_ZONE);
  return ymdToLocalDate(ymd);
}

/** Parse YYYY-MM-DD as a local Date at noon (avoids DST edge cases in pickers). */
export function ymdToLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function resolveBranchTimeZone(timeZoneId: string | null | undefined): string {
  return timeZoneId?.trim() || DEFAULT_BRANCH_TIME_ZONE;
}
