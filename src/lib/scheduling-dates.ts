export const MAX_BOOKING_DAYS_AHEAD = 30;

export const toIsoDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const startOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const isPastDay = (date: Date, reference = new Date()) =>
  startOfDay(date).getTime() < startOfDay(reference).getTime();

export const getMaxBookingDate = (reference = new Date()) => {
  const maxDate = startOfDay(reference);
  maxDate.setDate(maxDate.getDate() + MAX_BOOKING_DAYS_AHEAD);
  return maxDate;
};

export const isWithinBookingWindow = (date: Date, reference = new Date()) =>
  !isPastDay(date, reference) && startOfDay(date).getTime() <= getMaxBookingDate(reference).getTime();

export const getMinBookingDateIso = (reference = new Date()) => toIsoDate(reference);

export const getMaxBookingDateIso = (reference = new Date()) => toIsoDate(getMaxBookingDate(reference));

export const appointmentHasEnded = (scheduledAt: string, durationMinutes = 60) => {
  const endsAt = new Date(scheduledAt);
  endsAt.setMinutes(endsAt.getMinutes() + durationMinutes);
  return Date.now() >= endsAt.getTime();
};
