import React from 'react';
import { fmt, qualityLabel } from '../utils/format';
import { getQuality as gq } from '../hooks/useNetworkMonitor';
import styles from './HistoryTable.module.css';

function exportCSV(history) {
  const header = 'Timestamp,Ping (ms),Download (Mbps),Upload (Mbps),Quality\n';
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
        <h2 className={styles.title}>Test History</h2>
        <div className={styles.headerRight}>
          <span className={styles.count}>{history.length} record{history.length !== 1 ? 's' : ''}</span>
          {history.length > 0 && (
            <button className={styles.exportBtn} onClick={() => exportCSV(history)} title="Export as CSV">
              ⬇ Export CSV
            </button>
          )}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>TIME</th>
              <th>PING <span className={styles.unit}>ms</span></th>
              <th>DOWNLOAD <span className={styles.unit}>Mbps</span></th>
              <th>UPLOAD <span className={styles.unit}>Mbps</span></th>
              <th>QUALITY</th>
            </tr>
          </thead>
          <tbody>
            {reversed.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>No tests run yet</td>
              </tr>
            ) : (
              reversed.map((r, i) => {
                const q = gq(r.ping, r.dl, r.ul);
                return (
                  <tr key={r.ts ?? i}>
                    <td>{new Date(r.ts).toLocaleTimeString()}</td>
                    <td>{fmt(r.ping, 0)}</td>
                    <td>{fmt(r.dl)}</td>
                    <td>{fmt(r.ul)}</td>
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
