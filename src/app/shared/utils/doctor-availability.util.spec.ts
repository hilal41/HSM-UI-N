import {
  doctorIsAvailableAt,
  zonedWeekdayAndMinutes,
} from './doctor-availability.util';

describe('doctorIsAvailableAt (branch timezone)', () => {
  /** Monday 09:00–17:00 only */
  const monNineToFive = JSON.stringify([{ day: 1, start: '09:00', end: '17:00' }]);

  /**
   * Instant that is Monday 10:00 in Asia/Karachi (PKT = UTC+5),
   * which is Monday 05:00 UTC — outside 09–17 if evaluated in UTC.
   */
  const mondayMorningInKarachi = new Date('2026-08-24T05:00:00.000Z');

  it('zonedWeekdayAndMinutes reports Monday ~10:00 in Asia/Karachi', () => {
    const z = zonedWeekdayAndMinutes(mondayMorningInKarachi, 'Asia/Karachi');
    expect(z.day).toBe(1);
    expect(z.minuteOfDay).toBe(10 * 60);
  });

  it('marks doctor available in Asia/Karachi when schedule covers PKT morning', () => {
    expect(doctorIsAvailableAt(monNineToFive, mondayMorningInKarachi, 'Asia/Karachi')).toBe(true);
  });

  it('marks doctor unavailable when the same instant is evaluated in UTC', () => {
    expect(doctorIsAvailableAt(monNineToFive, mondayMorningInKarachi, 'UTC')).toBe(false);
  });

  it('defaults empty timeZoneId to Asia/Karachi (clinic default)', () => {
    expect(doctorIsAvailableAt(monNineToFive, mondayMorningInKarachi, null)).toBe(true);
    expect(doctorIsAvailableAt(monNineToFive, mondayMorningInKarachi, undefined)).toBe(true);
  });

  it('treats empty availability as always available', () => {
    expect(doctorIsAvailableAt(null, mondayMorningInKarachi, 'UTC')).toBe(true);
    expect(doctorIsAvailableAt('', mondayMorningInKarachi, 'UTC')).toBe(true);
  });
});
