const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

export interface ClinicClock {
  nowMs: number;
  nowIso: string;
  todayDate: string;
  tomorrowDate: string;
  currentTimeHm: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function getClinicClock(referenceMs: number = Date.now()): ClinicClock {
  const shifted = new Date(referenceMs + PKT_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = pad2(shifted.getUTCMonth() + 1);
  const day = pad2(shifted.getUTCDate());
  const hours = pad2(shifted.getUTCHours());
  const minutes = pad2(shifted.getUTCMinutes());

  const tomorrowShifted = new Date(referenceMs + PKT_OFFSET_MS + 24 * 60 * 60 * 1000);
  const tYear = tomorrowShifted.getUTCFullYear();
  const tMonth = pad2(tomorrowShifted.getUTCMonth() + 1);
  const tDay = pad2(tomorrowShifted.getUTCDate());

  return {
    nowMs: referenceMs,
    nowIso: new Date(referenceMs).toISOString(),
    todayDate: `${year}-${month}-${day}`,
    tomorrowDate: `${tYear}-${tMonth}-${tDay}`,
    currentTimeHm: `${hours}:${minutes}`,
  };
}

export function isValidDateStr(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function isValidTimeHm(timeHm: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(timeHm)) return false;
  const [hh, mm] = timeHm.split(':').map(Number);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

export function timeHmToMinutes(timeHm: string): number {
  const [hh, mm] = timeHm.split(':').map(Number);
  return hh * 60 + mm;
}

export function minutesToTimeHm(totalMinutes: number): string {
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

export function parseClinicDateTimeMs(dateStr: string, timeHm: string): number | null {
  if (!isValidDateStr(dateStr) || !isValidTimeHm(timeHm)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeHm.split(':').map(Number);
  return Date.UTC(y, m - 1, d, hh, mm, 0, 0) - PKT_OFFSET_MS;
}

export function getDayOfWeekFromDateStr(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export interface TimeSlotInterval {
  startTime: string;
  endTime: string;
}

export function generateThirtyMinSlots(
  startHm: string,
  endHm: string
): TimeSlotInterval[] {
  const startMin = timeHmToMinutes(startHm);
  const endMin = timeHmToMinutes(endHm);
  const slots: TimeSlotInterval[] = [];
  for (let cur = startMin; cur + 30 <= endMin; cur += 30) {
    slots.push({
      startTime: minutesToTimeHm(cur),
      endTime: minutesToTimeHm(cur + 30),
    });
  }
  return slots;
}

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
