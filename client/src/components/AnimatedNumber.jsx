import { useState, useEffect, useRef } from 'react';

export default function AnimatedNumber({ value, decimals = 0, duration = 600 }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(value ?? 0);

  useEffect(() => {
    if (value === null || value === undefined) {
      setDisplay(null);
      return;
    }

    const from = fromRef.current ?? 0;
    const to = value;
    if (from === to) return;

    startRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  if (display === null || display === undefined) return '—';

  return Number(display).toFixed(decimals);
}
