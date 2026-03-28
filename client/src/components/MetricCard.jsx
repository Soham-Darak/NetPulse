import React from 'react';
import AnimatedNumber from './AnimatedNumber';
import { barPct } from '../utils/format';
import styles from './MetricCard.module.css';

export default function MetricCard({ label, value, unit, stats, barMax, featured, children }) {
  const pct = barPct(value, barMax);

  return (
    <div className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <div className={styles.label}>{label}</div>

      <div className={styles.value}>
        <span className={styles.number}>
          <AnimatedNumber value={value} decimals={unit === 'ms' ? 0 : 1} />
        </span>
        <span className={styles.unit}>{unit}</span>
      </div>

      {children && <div className={styles.extra}>{children}</div>}

      <div className={styles.sub}>
        {stats.map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && <span className={styles.sep}>·</span>}
            <span className={styles.subItem}>
              <span className={styles.subLabel}>{s.label}</span>
              <span className={styles.subVal}>{s.value ?? '—'}</span>
            </span>
          </React.Fragment>
        ))}
      </div>

      <div className={styles.bar}>
        <div className={styles.barFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
