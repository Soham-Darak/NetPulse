import React from 'react';
import { Download, History, Activity, Network, Zap } from 'lucide-react';
import { fmt, qualityLabel } from '../utils/format';
import { getQuality as gq } from '../hooks/useNetworkMonitor';
import { useAllTabsMetrics } from '../hooks/useAllTabsMetrics';
import styles from './HistoryTable.module.css';

function exportCSV(history) {
  const header = 'Timestamp,Download Speed (Mbps),Upload Speed (Mbps),Quality\n';
  const rows = history.map(r => {
    const time = new Date(r.ts).toLocaleString();
    const q = gq(r.dl, r.ul);
    return `"${time}",${r.dl ?? ''},${r.ul ?? ''},${q}`;
  }).join('\n');

  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `netpulse_history_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatSpeed(speed) {
  if (speed === null || speed === undefined) return '—';
  if (speed < 1) return speed.toFixed(2) + ' Mbps';
  return speed.toFixed(1) + ' Mbps';
}

export default function HistoryTable({ history }) {
  const { allTabs, aggregateMetrics } = useAllTabsMetrics();
  const reversed = [...history].reverse();
  
  const tabList = Object.entries(allTabs).map(([tabId, data]) => ({
    tabId,
    ...data,
  }));

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
                const q = gq(r.dl, r.ul);
                return (
                  <tr key={r.ts ?? i}>
                    <td className={styles.timeVal}>{new Date(r.ts).toLocaleTimeString()}</td>
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

      {/* ── Active Connections from All Tabs ── */}
      <div className={styles.allTabsSection}>
        <div className={styles.subHeader}>
          <div className={styles.subTitleWrap}>
            <Network className={styles.subTitleIcon} size={20} />
            <h3 className={styles.subTitle}>Active Connections ({aggregateMetrics.tabCount})</h3>
          </div>
        </div>
        <div className={styles.description}>
          Real-time speeds from all open tabs on your device.
        </div>

        {aggregateMetrics.tabCount === 0 ? (
          <div className={styles.noConnections}>
            <Zap size={20} className={styles.emptyIcon} />
            <span>No other connections detected</span>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>AVG DOWNLOAD</span>
                <span className={styles.statValue}>
                  <Download size={14} />
                  {formatSpeed(aggregateMetrics.avgDownload)}
                </span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>AVG UPLOAD</span>
                <span className={styles.statValue}>
                  <Activity size={14} />
                  {formatSpeed(aggregateMetrics.avgUpload)}
                </span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>MAX DOWNLOAD</span>
                <span className={styles.statValue}>
                  <Zap size={14} />
                  {formatSpeed(aggregateMetrics.maxDownload)}
                </span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>MAX UPLOAD</span>
                <span className={styles.statValue}>
                  <Zap size={14} />
                  {formatSpeed(aggregateMetrics.maxUpload)}
                </span>
              </div>
            </div>

            {/* Tabs Table */}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>TAB ID</th>
                    <th>DOWNLOAD SPEED <span className={styles.unit}>(Mbps)</span></th>
                    <th>UPLOAD SPEED <span className={styles.unit}>(Mbps)</span></th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {tabList.map((tab) => {
                    const quality = gq(tab.downloadSpeed, tab.uploadSpeed);
                    return (
                      <tr key={tab.tabId} className={styles.tabRow}>
                        <td className={styles.tabIdVal}>{tab.tabId}</td>
                        <td className={styles.val}>{formatSpeed(tab.downloadSpeed)}</td>
                        <td className={styles.val}>{formatSpeed(tab.uploadSpeed)}</td>
                        <td>
                          <div className={styles.statusWrap}>
                            <span className={`${styles.phaseBadge} ${styles[tab.currentPhase]}`}>
                              {tab.currentPhase || 'idle'}
                            </span>
                            <span className={`${styles.pill} ${styles[quality]}`}>
                              {qualityLabel(quality)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
