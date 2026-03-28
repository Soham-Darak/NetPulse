export const fmt = (val, digits = 1) =>
  val === null || val === undefined ? '—' : Number(val).toFixed(digits);

export const qualityLabel = (q) =>
  ({ good: '🟢 Good', moderate: '🟡 Moderate', poor: '🔴 Poor', idle: 'Idle' }[q] ?? 'Idle');

export const barPct = (val, max) =>
  val !== null && val !== undefined ? Math.min(100, (val / max) * 100) : 0;
