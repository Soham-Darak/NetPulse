import React from 'react';
import styles from './ActionBar.module.css';

export default function ActionBar({ isRunning, statusText, statusType, progress, onStart, onClear }) {
  return (
    <div className={styles.bar}>
      <button
        className={`${styles.btnStart} ${isRunning ? styles.running : ''}`}
        onClick={onStart}
        disabled={isRunning}
      >
        <span className={styles.btnIcon}>{isRunning ? '⟳' : '▶'}</span>
        <span>{isRunning ? 'Testing…' : 'Start Test'}</span>
      </button>

      <div className={styles.statusStrip}>
        <span className={`${styles.statusDot} ${statusType === 'active' ? styles.active : ''} ${statusType === 'done' ? styles.done : ''}`} />
        <span className={styles.statusText}>{statusText}</span>
        <div className={styles.progressWrap}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <button className={styles.btnClear} onClick={onClear}>⌫ Clear</button>
    </div>
  );
}
