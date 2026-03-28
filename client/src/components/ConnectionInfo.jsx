import React from 'react';
import styles from './ConnectionInfo.module.css';

export default function ConnectionInfo({ info }) {
  const items = [
    { icon: '🌐', label: 'IP Address', value: info.ip },
    { icon: '🏢', label: 'ISP', value: info.isp },
    { icon: '📍', label: 'Location', value: info.city && info.country ? `${info.city}, ${info.country}` : null },
    { icon: '📡', label: 'Type', value: info.effectiveType?.toUpperCase() || info.type },
    { icon: '📶', label: 'Est. Downlink', value: info.downlink ? `${info.downlink} Mbps` : null },
  ].filter(item => item.value);

  if (items.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.title}>Connection Details</span>
        <span className={styles.badge}>LIVE</span>
      </div>
      <div className={styles.grid}>
        {items.map((item, i) => (
          <div key={i} className={styles.item}>
            <span className={styles.icon}>{item.icon}</span>
            <div className={styles.info}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.value}>{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
