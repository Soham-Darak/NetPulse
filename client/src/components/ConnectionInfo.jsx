import React from 'react';
import { Globe, Building2, MapPin, Radio, Wifi } from 'lucide-react';
import styles from './ConnectionInfo.module.css';

export default function ConnectionInfo({ info }) {
  const items = [
    { icon: <Globe size={18} />, label: 'IP Address', value: info.ip },
    { icon: <Building2 size={18} />, label: 'Internet Provider', value: info.isp },
    { icon: <MapPin size={18} />, label: 'Location', value: info.city && info.country ? `${info.city}, ${info.country}` : null },
    { icon: <Radio size={18} />, label: 'Connection Type', value: info.effectiveType?.toUpperCase() || info.type },
    { icon: <Wifi size={18} />, label: 'Estimated Max Speed', value: info.downlink ? `${info.downlink} Mbps` : null },
  ].filter(item => item.value);

  if (items.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.title}>Network Information</span>
        <span className={styles.badge}>Connected</span>
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
