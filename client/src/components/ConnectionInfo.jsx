import React, { useState, useEffect } from 'react';
import { Globe, Building2, MapPin, Radio, Wifi, AlertCircle, Loader } from 'lucide-react';
import styles from './ConnectionInfo.module.css';

export default function ConnectionInfo({ info }) {
  const [isLoading, setIsLoading] = useState(true);

  // Consider data loaded after a reasonable delay or when we have some data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const hasData = info.ip || info.isp || info.city || info.country || info.type || info.effectiveType;

  const items = [
    { icon: <Globe size={18} />, label: 'IP Address', value: info.ip },
    { icon: <Building2 size={18} />, label: 'Internet Provider', value: info.isp },
    { icon: <MapPin size={18} />, label: 'Location', value: info.city && info.country ? `${info.city}, ${info.country}` : null },
    { icon: <Radio size={18} />, label: 'Connection Type', value: info.effectiveType?.toUpperCase() || info.type },
   // { icon: <Wifi size={18} />, label: 'Estimated Max Speed', value: info.downlink ? `${info.downlink} Mbps` : null },
  ].filter(item => item.value);

  if (isLoading && !hasData) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <span className={styles.title}>Network Information</span>
          <span className={styles.badge} style={{ opacity: 0.6 }}>
            <Loader size={14} style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }} /> Loading
          </span>
        </div>
        <div className={styles.grid}>
          <div className={styles.loadingPlaceholder}>Fetching network information...</div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <span className={styles.title}>Network Information</span>
          <span className={styles.badge} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertCircle size={14} style={{ display: 'inline-block', marginRight: '4px' }} /> Unavailable
          </span>
        </div>
        <div className={styles.grid}>
          <div className={styles.loadingPlaceholder}>Unable to fetch network information. Check your connection.</div>
        </div>
      </section>
    );
  }

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
