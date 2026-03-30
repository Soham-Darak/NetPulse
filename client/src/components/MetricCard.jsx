import React from 'react';
import AnimatedNumber from './AnimatedNumber';
import { barPct } from '../utils/format';
import styles from './MetricCard.module.css';

export default function MetricCard({ title, subtitle, icon, value, unit, stats, barMax, featured, active, children }) {
  const pct = barPct(value, barMax);

  return (
    <div className={`${styles.card} ${featured ? styles.featured : ''} ${active ? styles.active : ''}`}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>{icon}</div>
        <div className={styles.titleWrap}>
          <div className={styles.title}>{title}</div>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
      </div>

      <div className={styles.valueWrap}>
        <div className={styles.value}>
          <span className={styles.number}>
            <AnimatedNumber value={value} decimals={unit === 'ms' ? 0 : 1} />
          </span>
          <span className={styles.unit}>{unit}</span>
        </div>
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
