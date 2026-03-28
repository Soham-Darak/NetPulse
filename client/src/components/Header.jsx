import React from 'react';
import { qualityLabel } from '../utils/format';
import styles from './Header.module.css';

export default function Header({ quality }) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>◈</span>
        <span className={styles.logoText}>NetPulse</span>
      </div>
      <div className={styles.right}>
        <div className={`${styles.qualityBadge} ${styles[quality]}`}>
          <span className={styles.qualityDot} />
          <span className={styles.qualityLabel}>{qualityLabel(quality)}</span>
        </div>
        <div className={styles.serverInfo}>localhost:3001</div>
      </div>
    </header>
  );
}
