import React from 'react';
import { Download, History, Activity } from 'lucide-react';
import { fmt, qualityLabel } from '../utils/format';
import { getQuality as gq } from '../hooks/useNetworkMonitor';
import styles from './HistoryTable.module.css';

function exportCSV(history) {
  const header = 'Timestamp,Response Time (ms),Download Speed (Mbps),Upload Speed (Mbps),Quality\n';
  const rows = history.map(r => {
    const time = new Date(r.ts).toLocaleString();
    const q = gq(r.ping, r.dl, r.ul);
    return `"${time}",${r.ping ?? ''},${r.dl ?? ''},${r.ul ?? ''},${q}`;
  }).join('\n');

  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `netpulse_history_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryTable({ history }) {
  const reversed = [...history].reverse();

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <History className={styles.titleIcon} size={24} />
          <h2 className={styles.title}>Recent Test History</h2>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.count}>{history.length} record{history.length !== 1 ? 's' : ''}</span>
          {history.length > 0 && (
            <button className={styles.exportBtn} onClick={() => exportCSV(history)} title="Export as CSV">
              <Download size={16} />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>
      <div className={styles.description}>
        A log of all recent automated tests. Data is discarded after 10 minutes to save memory.
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>TIME</th>
              <th>RESPONSE TIME <span className={styles.unit}>(ms)</span></th>
              <th>DOWNLOAD SPEED <span className={styles.unit}>(Mbps)</span></th>
              <th>UPLOAD SPEED <span className={styles.unit}>(Mbps)</span></th>
              <th>CONNECTION QUALITY</th>
            </tr>
          </thead>
          <tbody>
            {reversed.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  <Activity size={24} className={styles.emptyIcon} />
                  <span>Waiting for automated tests to run...</span>
                </td>
              </tr>
            ) : (
              reversed.map((r, i) => {
                const q = gq(r.ping, r.dl, r.ul);
                return (
                  <tr key={r.ts ?? i}>
                    <td className={styles.timeVal}>{new Date(r.ts).toLocaleTimeString()}</td>
                    <td className={styles.val}>{fmt(r.ping, 0)}</td>
                    <td className={styles.val}>{fmt(r.dl)}</td>
                    <td className={styles.val}>{fmt(r.ul)}</td>
                    <td>
                      <span className={`${styles.pill} ${styles[q]}`}>
                        {qualityLabel(q)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
