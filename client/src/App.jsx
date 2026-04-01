import React, { useEffect } from 'react';
import Background from './components/Background';
import Header from './components/Header';
import MetricCard from './components/MetricCard';
import SpeedGauge from './components/SpeedGauge';
import ActionBar from './components/ActionBar';
import Charts from './components/Charts';
import DataUsage from './components/DataUsage';
import ConnectionInfo from './components/ConnectionInfo';
import HistoryTable from './components/HistoryTable';
import { useNetworkMonitor } from './hooks/useNetworkMonitor';
import { useDataTracker } from './hooks/useDataTracker';
import { fmt } from './utils/format';
import styles from './App.module.css';
import { broadcastMetrics } from './utils/crossTabComms';

import { Activity, DownloadCloud, UploadCloud } from 'lucide-react';

export default function App() {
  const {
    tabId,
    ping, pingStats, jitter, packetLoss,
    downloadSpeed, dlStats,
    uploadSpeed, ulStats,
    quality,
    connectionInfo,
    isPaused, isTesting, currentPhase,
    statusText, statusType, progress,
    testCount,
    elapsedSeconds, elapsedFormatted,
    pingChartData, speedChartData,
    history,
    togglePause, clearHistory,
  } = useNetworkMonitor();

  const tracker = useDataTracker(isPaused);

  const handleClear = () => {
    if (window.confirm('Clear all test history?')) {
      clearHistory();
      tracker.clearTracker();
    }
  };

  // ── Broadcast tracker data usage to other tabs ──
  useEffect(() => {
    const broadcastTimer = setInterval(() => {
      if (tracker?.byCategory && tabId) {
        broadcastMetrics(tabId, {
          downloadSpeed,
          uploadSpeed,
          ping,
          quality,
          connectionInfo,
          isTesting,
          currentPhase,
          dataUsage: {
            totalIncoming: tracker.totalIncoming || 0,
            totalOutgoing: tracker.totalOutgoing || 0,
            byCategory: tracker.byCategory || {},
            dataRate: tracker.dataRate || { inRate: 0, outRate: 0 },
          },
        });
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(broadcastTimer);
  }, [tabId, downloadSpeed, uploadSpeed, ping, quality, connectionInfo, isTesting, currentPhase, tracker]);

  return (
    <>
      <Background />

      <div className={styles.wrapper}>
        <Header quality={quality} />

        {/* ── Metric Cards ── */}
        <section className={styles.metrics}>
          <MetricCard
            title="Response Time"
            subtitle="How fast a signal travels to the server and back"
            icon={<Activity size={24} color="var(--cyan)" />}
            value={ping}
            unit="ms"
            barMax={150}
            active={currentPhase === 'ping'}
            stats={[
               { label: 'BEST', value: pingStats.min !== null ? pingStats.min + 'ms' : null },
               { label: 'AVG', value: pingStats.avg !== null ? pingStats.avg + 'ms' : null },
               { label: 'STABILITY', value: jitter !== null ? jitter + 'ms' : null },
               { label: 'LOSS', value: packetLoss + '%' },
            ]}
          />
          <MetricCard
            title="Download Speed"
            subtitle="How fast data comes to your device (streaming, browsing)"
            icon={<DownloadCloud size={32} color="var(--cyan)" />}
            value={downloadSpeed}
            unit="Mbps"
            barMax={100}
            featured
            active={currentPhase === 'download'}
            stats={[
              { label: 'PEAK', value: dlStats.peak !== null ? fmt(dlStats.peak) + ' Mbps' : null },
              { label: 'AVERAGE',  value: dlStats.avg  !== null ? fmt(dlStats.avg)  + ' Mbps' : null },
            ]}
          >
            <SpeedGauge value={downloadSpeed} max={100} label="LIVE SPEED" />
          </MetricCard>
          <MetricCard
            title="Upload Speed"
            subtitle="How fast you send data (video calls, attachments)"
            icon={<UploadCloud size={24} color="var(--cyan)" />}
            value={uploadSpeed}
            unit="Mbps"
            barMax={50}
            active={currentPhase === 'upload'}
            stats={[
              { label: 'PEAK', value: ulStats.peak !== null ? fmt(ulStats.peak) + ' Mbps' : null },
              { label: 'AVERAGE',  value: ulStats.avg  !== null ? fmt(ulStats.avg)  + ' Mbps' : null },
            ]}
          />
        </section>

        {/* ── Action Bar ── */}
        <ActionBar
          isPaused={isPaused}
          isTesting={isTesting}
          statusText={statusText}
          statusType={statusType}
          progress={progress}
          testCount={testCount}
          elapsedFormatted={elapsedFormatted}
          onTogglePause={togglePause}
          onClear={handleClear}
        />

        {/* ── Charts ── */}
        <Charts pingChartData={pingChartData} speedChartData={speedChartData} />

        {/* ── Data Consumption Monitor ── */}
        <DataUsage tracker={tracker} />

        {/* ── Connection Info ── */}
        <ConnectionInfo info={connectionInfo} />

        {/* ── History ── */}
        <HistoryTable history={history} />
      </div>
    </>
  );
}
