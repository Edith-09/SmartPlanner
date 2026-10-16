export function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(0, Math.ceil(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${totalMinutes} min`;
  }
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

export function formatDistance(meters: number): string {
  const distance = Math.max(0, meters);
  if (distance < 1_000) {
    return `${Math.round(distance)} m`;
  }
  const kilometers = distance / 1_000;
  return `${kilometers < 10 ? kilometers.toFixed(1) : Math.round(kilometers)} km`;
}

export function formatRelativeTime(
  value: Date | number | string,
  now = Date.now(),
): string {
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return '';
  }

  const differenceMinutes = Math.round((timestamp - now) / 60_000);
  const absoluteMinutes = Math.abs(differenceMinutes);
  if (absoluteMinutes < 1) {
    return 'just now';
  }

  const units =
    absoluteMinutes < 60
      ? { amount: absoluteMinutes, label: 'min' }
      : absoluteMinutes < 1_440
        ? { amount: Math.round(absoluteMinutes / 60), label: 'hr' }
        : { amount: Math.round(absoluteMinutes / 1_440), label: 'day' };
  const quantity = `${units.amount} ${units.label}${units.amount === 1 ? '' : 's'}`;

  return differenceMinutes < 0 ? `${quantity} ago` : `in ${quantity}`;
}