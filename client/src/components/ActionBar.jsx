import React from 'react';
import { Play, Pause, RefreshCw, Trash2, Clock, Activity } from 'lucide-react';
import styles from './ActionBar.module.css';

export default function ActionBar({
  isPaused, isTesting,
  statusText, statusType, progress,
  testCount, elapsedFormatted,
  onTogglePause, onClear,
}) {
  return (
    <div className={styles.bar}>
      <button
        className={`${styles.btnToggle} ${isPaused ? styles.paused : styles.running}`}
        onClick={onTogglePause}
      >
        <div className={styles.btnIconWrap}>
          {isPaused ? <Play size={20} /> : isTesting ? <RefreshCw size={20} className={styles.spin} /> : <Pause size={20} />}
        </div>
        <div className={styles.btnContent}>
          <span className={styles.btnLabel}>{isPaused ? 'Resume Monitoring' : 'Pause Monitoring'}</span>
          <span className={styles.btnSub}>{isPaused ? 'System is idle' : 'Actively testing network'}</span>
        </div>
      </button>

      {/* Status Strip */}
      <div className={styles.statusPanel}>
        <div className={styles.statusHeader}>
          <div className={styles.statusIndicator}>
            <span className={`${styles.statusDot} ${styles[statusType]}`} />
            <span className={styles.statusText}>{statusText}</span>
          </div>
        </div>
        <div className={styles.progressWrap}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.statsPanel}>
        <div className={styles.statBox}>
          <Clock size={16} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>OBSERVING TIME</span>
            <span className={styles.statValue}>{elapsedFormatted}</span>
          </div>
        </div>
        <div className={styles.statBox}>
          <Activity size={16} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>COMPLETED TESTS</span>
            <span className={styles.statValue}>{testCount}</span>
          </div>
        </div>
      </div>

      <button className={styles.btnClear} onClick={onClear} title="Clear Data">
        <Trash2 size={18} />
        <span>Clear</span>
      </button>
    </div>
  );
}
