import React from 'react';
import Background from './components/Background';
import Header from './components/Header';
import MetricCard from './components/MetricCard';
import SpeedGauge from './components/SpeedGauge';
import ActionBar from './components/ActionBar';
import Charts from './components/Charts';
import ConnectionInfo from './components/ConnectionInfo';
import HistoryTable from './components/HistoryTable';
import { useNetworkMonitor } from './hooks/useNetworkMonitor';
import { fmt } from './utils/format';
import styles from './App.module.css';

export default function App() {
  const {
    ping, pingStats, jitter, packetLoss,
    downloadSpeed, dlStats,
    uploadSpeed, ulStats,
    quality,
    connectionInfo,
    isRunning, statusText, statusType, progress,
    pingChartData, speedChartData,
    history,
    runTest, clearHistory,
  } = useNetworkMonitor();

  const handleClear = () => {
    if (window.confirm('Clear all test history?')) clearHistory();
  };

  return (
    <>
      <Background />

      <div className={styles.wrapper}>
        <Header quality={quality} />

        {/* ── Metric Cards ── */}
        <section className={styles.metrics}>
          <MetricCard
            label="LATENCY"
            value={ping}
            unit="ms"
            barMax={150}
            stats={[
              { label: 'MIN', value: pingStats.min !== null ? pingStats.min + 'ms' : null },
              { label: 'AVG', value: pingStats.avg !== null ? pingStats.avg + 'ms' : null },
              { label: 'MAX', value: pingStats.max !== null ? pingStats.max + 'ms' : null },
              { label: 'JITTER', value: jitter !== null ? jitter + 'ms' : null },
              { label: 'LOSS', value: packetLoss + '%' },
            ]}
          />
          <MetricCard
            label="DOWNLOAD"
            value={downloadSpeed}
            unit="Mbps"
            barMax={100}
            featured
            stats={[
              { label: 'PEAK', value: dlStats.peak !== null ? fmt(dlStats.peak) + ' Mbps' : null },
              { label: 'AVG',  value: dlStats.avg  !== null ? fmt(dlStats.avg)  + ' Mbps' : null },
            ]}
          >
            <SpeedGauge value={downloadSpeed} max={100} label="SPEED GAUGE" />
          </MetricCard>
          <MetricCard
            label="UPLOAD"
            value={uploadSpeed}
            unit="Mbps"
            barMax={50}
            stats={[
              { label: 'PEAK', value: ulStats.peak !== null ? fmt(ulStats.peak) + ' Mbps' : null },
              { label: 'AVG',  value: ulStats.avg  !== null ? fmt(ulStats.avg)  + ' Mbps' : null },
            ]}
          />
        </section>

        {/* ── Action Bar ── */}
        <ActionBar
          isRunning={isRunning}
          statusText={statusText}
          statusType={statusType}
          progress={progress}
          onStart={runTest}
          onClear={handleClear}
        />

        {/* ── Charts ── */}
        <Charts pingChartData={pingChartData} speedChartData={speedChartData} />

        {/* ── Connection Info ── */}
        <ConnectionInfo info={connectionInfo} />

        {/* ── History ── */}
        <HistoryTable history={history} />
      </div>
    </>
  );
}
