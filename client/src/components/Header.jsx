import React from 'react';
import { Activity } from 'lucide-react';
import { qualityLabel } from '../utils/format';
import styles from './Header.module.css';

export default function Header({ quality }) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Activity className={styles.logoIcon} size={28} />
        <span className={styles.logoText}>NetPulse</span>
      </div>
      <div className={styles.right}>
        <div className={`${styles.qualityBadge} ${styles[quality]}`}>
          <span className={styles.qualityDot} />
          <span className={styles.qualityLabel}>{qualityLabel(quality)} Connection</span>
        </div>
        <div className={styles.serverInfo}>Local Network</div>
      </div>
    </header>
  );
}
