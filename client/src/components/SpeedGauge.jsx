import React from 'react';
import styles from './SpeedGauge.module.css';

export default function SpeedGauge({ value, max = 100, label }) {
  const clampedValue = Math.min(value ?? 0, max);
  const pct = clampedValue / max;

  // SVG arc parameters
  const radius = 70;
  const stroke = 8;
  const cx = 80;
  const cy = 80;
  const startAngle = 135;
  const endAngle = 405;
  const totalArc = endAngle - startAngle; // 270 degrees

  const polarToCartesian = (angle) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (start, end) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const bgArc = describeArc(startAngle, endAngle);
  const fillEnd = startAngle + totalArc * pct;
  const fillArc = pct > 0.01 ? describeArc(startAngle, fillEnd) : '';

  // Color based on speed
  const getColor = () => {
    if (pct > 0.6) return '#4ade80';  // green
    if (pct > 0.3) return '#38bdf8';  // cyan
    if (pct > 0.15) return '#fbbf24'; // amber
    return '#f87171'; // red
  };

  return (
    <div className={styles.gauge}>
      <svg viewBox="0 0 160 120" className={styles.svg}>
        <path d={bgArc} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} strokeLinecap="round" />
        {fillArc && (
          <path
            d={fillArc}
            fill="none"
            stroke={getColor()}
            strokeWidth={stroke}
            strokeLinecap="round"
            className={styles.arcFill}
            style={{ filter: `drop-shadow(0 0 6px ${getColor()})` }}
          />
        )}
        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const angle = startAngle + totalArc * t;
          const inner = polarToCartesian(angle);
          const outerR = radius + 10;
          const rad = (angle * Math.PI) / 180;
          const outer = { x: cx + outerR * Math.cos(rad), y: cy + outerR * Math.sin(rad) };
          return (
            <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          );
        })}
        {/* Tick labels */}
        {[0, 0.5, 1].map((t, i) => {
          const angle = startAngle + totalArc * t;
          const labelR = radius + 18;
          const rad = (angle * Math.PI) / 180;
          const pos = { x: cx + labelR * Math.cos(rad), y: cy + labelR * Math.sin(rad) };
          return (
            <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
              className={styles.tickLabel}>
              {Math.round(max * t)}
            </text>
          );
        })}
      </svg>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
