import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement,
  Filler, Tooltip, Legend,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import AnimatedNumber from './AnimatedNumber';
import { formatBytes, CATEGORY_COLORS } from '../hooks/useDataTracker';
import { useAllTabsDataUsage } from '../hooks/useAllTabsDataUsage';
import styles from './DataUsage.module.css';

import { ArrowDownCircle, ArrowUpCircle, Package, FlaskConical, Download, Upload, Activity, Network } from 'lucide-react';

ChartJS.register(
  ArcElement, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement,
  Filler, Tooltip, Legend,
);

// ── Summary Cards ────────────────────────────────────────────────────────────
function DataSummary({ totalIncoming, totalOutgoing, requestCount, dataRate, speedTestData }) {
  return (
    <div className={styles.summaryGrid}>
      <div className={styles.summaryCard}>
        <div className={styles.summaryIconWrap} style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.1)' }}>
          <ArrowDownCircle size={24} />
        </div>
        <div className={styles.summaryInfo}>
          <span className={styles.summaryLabel}>TOTAL DOWNLOADED</span>
          <span className={styles.summaryValue}>{formatBytes(totalIncoming)}</span>
          <span className={styles.summaryRate}>
            {formatBytes(dataRate.inRate)}/s
          </span>
        </div>
      </div>
      <div className={styles.summaryCard}>
        <div className={styles.summaryIconWrap} style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)' }}>
          <ArrowUpCircle size={24} />
        </div>
        <div className={styles.summaryInfo}>
          <span className={styles.summaryLabel}>TOTAL UPLOADED</span>
          <span className={styles.summaryValue}>{formatBytes(totalOutgoing)}</span>
          <span className={styles.summaryRate}>
            {formatBytes(dataRate.outRate)}/s
          </span>
        </div>
      </div>
      <div className={styles.summaryCard}>
        <div className={styles.summaryIconWrap} style={{ color: '#a855f7', background: 'rgba(168,85,247,0.1)' }}>
          <Package size={24} />
        </div>
        <div className={styles.summaryInfo}>
          <span className={styles.summaryLabel}>CONNECTIONS MADE</span>
          <span className={styles.summaryValue}><AnimatedNumber value={requestCount} /></span>
        </div>
      </div>
      <div className={styles.summaryCard}>
        <div className={styles.summaryIconWrap} style={{ color: '#4ade80', background: 'rgba(74,222,128,0.1)' }}>
          <FlaskConical size={24} />
        </div>
        <div className={styles.summaryInfo}>
          <span className={styles.summaryLabel}>DATA USED FOR TESTING</span>
          <span className={styles.summaryValue}>{formatBytes(speedTestData.total)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Speed Test Data Breakdown ────────────────────────────────────────────────
function SpeedTestBreakdown({ speedTestData }) {
  const items = [
    { label: 'Download Tests', bytes: speedTestData.download, icon: <Download size={16}/>, color: '#38bdf8' },
    { label: 'Upload Tests', bytes: speedTestData.upload, icon: <Upload size={16}/>, color: '#4ade80' },
    // { label: 'Response Time Tests', bytes: speedTestData.ping, icon: <Activity size={16}/>, color: '#a855f7' },
  ];

  const total = speedTestData.total || 1;

  return (
    <div className={styles.breakdownCard}>
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>Testing Data Breakdown</span>
        <span className={styles.chartBadge}>DETAILS</span>
      </div>
      <div className={styles.breakdownList}>
        {items.map(item => {
          const pct = total > 0 ? Math.round((item.bytes / total) * 100) : 0;
          return (
            <div key={item.label} className={styles.breakdownRow}>
              <span className={styles.breakdownIcon} style={{ color: item.color }}>{item.icon}</span>
              <span className={styles.breakdownLabel}>{item.label}</span>
              <div className={styles.breakdownBarWrap}>
                <div
                  className={styles.breakdownBar}
                  style={{ width: `${pct}%`, background: item.color, boxShadow: `0 0 8px ${item.color}80` }}
                />
              </div>
              <span className={styles.breakdownBytes}>{formatBytes(item.bytes)}</span>
              <span className={styles.breakdownPct} style={{ color: item.color }}>{pct}%</span>
            </div>
          );
        })}
      </div>
      <div className={styles.breakdownTotal}>
        <span>Total Data Used by Tests:</span>
        <span className={styles.breakdownTotalValue}>{formatBytes(speedTestData.total)}</span>
      </div>
    </div>
  );
}

// ── Doughnut Chart: Data by Category ─────────────────────────────────────────
function CategoryChart({ byCategory }) {
  const sortedCategories = useMemo(() => {
    return Object.keys(byCategory).sort((a, b) => {
      const valA = byCategory[a].bytes + (byCategory[a].outgoing || 0);
      const valB = byCategory[b].bytes + (byCategory[b].outgoing || 0);
      return valB - valA;
    });
  }, [byCategory]);

  const totalBytes = useMemo(() => {
    return sortedCategories.reduce((s, c) => s + byCategory[c].bytes + (byCategory[c].outgoing || 0), 0);
  }, [sortedCategories, byCategory]);

  // ── Canvas custom text plugin removed in favor of responsive DOM overlay ──

  const data = useMemo(() => ({
    labels: sortedCategories,
    datasets: [{
      data: sortedCategories.map(c => byCategory[c].bytes + (byCategory[c].outgoing || 0)),
      backgroundColor: sortedCategories.map(c => CATEGORY_COLORS[c]?.bg || 'rgba(148,163,184,0.5)'),
      borderColor: 'rgba(0,0,0,0)', // Transparent border for floating slice aesthetic
      borderWidth: 0,
      hoverOffset: 12,
      borderRadius: 4, // smooth edges on the doughnut segments
      spacing: 6,      // slightly larger gap between segments for clarity
    }],
  }), [sortedCategories, byCategory]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '80%', // Thinner ring for a highly modern and clean look
    layout: { padding: 12 },
    animation: { animateRotate: true, animateScale: true, duration: 800, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false }, // Hide default legend, we will use a custom HTML one!
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(56,189,248,0.4)',
        borderWidth: 1,
        titleColor: '#94a3b8',
        bodyColor: '#f8fafc',
        bodyFont: { size: 13, family: "'JetBrains Mono', monospace" },
        padding: 16,
        cornerRadius: 12,
        callbacks: {
          label: (ctx) => {
            const cat = ctx.label;
            const size = ctx.raw;
            const pct = totalBytes > 0 ? ((size / totalBytes) * 100).toFixed(1) : 0;
            return ` ${cat}: ${formatBytes(size)} (${pct}%)`;
          },
        },
      },
    },
  }), [totalBytes]);

  if (sortedCategories.length === 0) return <div className={styles.empty}>Processing data...</div>;

  return (
    <div className={styles.doughnutContainer}>
      <div className={styles.doughnutCanvasWrap}>
        <Doughnut data={data} options={options} />
        <div className={styles.doughnutCenterOverlay}>
          <span className={styles.doughnutCenterValue}>{formatBytes(totalBytes)}</span>
          <span className={styles.doughnutCenterLabel}>TOTAL DATA</span>
        </div>
      </div>
      <div className={styles.doughnutLegend}>
        {sortedCategories.map(cat => {
          const size = byCategory[cat].bytes + (byCategory[cat].outgoing || 0);
          const pct = totalBytes > 0 ? ((size / totalBytes) * 100).toFixed(1) : 0;
          const color = CATEGORY_COLORS[cat]?.border || '#94a3b8';
          
          return (
            <div key={cat} className={styles.legendItem}>
              <div className={styles.legendColor} style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              <div className={styles.legendInfo}>
                <span className={styles.legendName}>{cat}</span>
                <span className={styles.legendReqs}>{byCategory[cat]?.count} requests</span>
              </div>
              <div className={styles.legendStats}>
                <span className={styles.legendSize}>{formatBytes(size)}</span>
                <span className={styles.legendPct}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Bar Chart: Data by Domain ────────────────────────────────────────────────
function DomainChart({ byDomain }) {
  const domains = Object.entries(byDomain)
    .sort((a, b) => (b[1].incoming + b[1].outgoing) - (a[1].incoming + a[1].outgoing))
    .slice(0, 8);

  if (domains.length === 0) return <div className={styles.empty}>Processing data...</div>;

  const data = useMemo(() => ({
    labels: domains.map(([d]) => d.length > 20 ? d.slice(0, 18) + '…' : d),
    datasets: [
      {
        label: 'Downloaded',
        data: domains.map(([, v]) => v.incoming),
        backgroundColor: 'rgba(56, 189, 248, 0.8)',
        borderColor: '#38bdf8',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Uploaded',
        data: domains.map(([, v]) => v.outgoing),
        backgroundColor: 'rgba(251, 191, 36, 0.8)',
        borderColor: '#fbbf24',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }), [byDomain]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    animation: { duration: 600, easing: 'easeOutQuart' },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 12, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(56,189,248,0.3)',
        borderWidth: 1,
        bodyColor: '#f8fafc',
        padding: 12,
        cornerRadius: 8,
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatBytes(ctx.raw)}` },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (v) => formatBytes(v),
        },
        border: { display: false },
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#cbd5e1', font: { size: 10, family: "'JetBrains Mono', monospace" } },
        border: { display: false },
      },
    },
  }), []);

  return (
    <div className={styles.chartWrap} style={{ height: Math.max(200, domains.length * 40) }}>
      <Bar data={data} options={options} />
    </div>
  );
}

// ── Line Chart: Data Timeline ────────────────────────────────────────────────
function DataTimelineChart({ dataTimeline }) {
  const data = useMemo(() => ({
    labels: dataTimeline.labels,
    datasets: [
      {
        label: 'Downloaded',
        data: dataTimeline.incoming,
        borderColor: '#38bdf8',
        borderWidth: 2,
        backgroundColor: (ctx) => {
          if (!ctx.chart.chartArea) return 'transparent';
          const g = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom);
          g.addColorStop(0, 'rgba(56,189,248,0.4)');
          g.addColorStop(1, 'rgba(56,189,248,0)');
          return g;
        },
        fill: true,
        cubicInterpolationMode: 'monotone',
        pointRadius: 0,
      },
      {
        label: 'Uploaded',
        data: dataTimeline.outgoing,
        borderColor: '#fbbf24',
        borderWidth: 2,
        backgroundColor: 'transparent',
        fill: false,
        cubicInterpolationMode: 'monotone',
        pointRadius: 0,
        borderDash: [4, 4],
      },
    ],
  }), [dataTimeline]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300, easing: 'easeOutQuart' },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 12, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(56,189,248,0.3)',
        borderWidth: 1,
        bodyColor: '#f8fafc',
        padding: 12,
        cornerRadius: 8,
        mode: 'index',
        intersect: false,
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatBytes(ctx.raw)}/s` },
      },
    },
    scales: {
      x: { display: false },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          maxTicksLimit: 5,
          callback: (v) => formatBytes(v) + '/s',
        },
        border: { display: false },
        min: 0,
      },
    },
  }), []);

  return (
    <div className={styles.chartWrap} style={{ height: 180 }}>
      <Line data={data} options={options} />
    </div>
  );
}

// ── Per-Tab Table ─────────────────────────────────────────────────────────────
function TabTable({ byTab, currentTabId }) {
  const tabs = Object.entries(byTab).sort((a, b) => b[1].incoming - a[1].incoming);
  if (tabs.length === 0) return null;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>BROWSER TAB</th>
            <th>DOWNLOADED</th>
            <th>UPLOADED</th>
            <th>ITEMS TRACKED</th>
          </tr>
        </thead>
        <tbody>
          {tabs.map(([id, data]) => (
            <tr key={id} className={id === currentTabId ? styles.currentTab : ''}>
              <td>
                <span className={styles.tabId}>
                  {id === currentTabId ? '● This Page' : `Other Page (${id})`}
                </span>
              </td>
              <td className={styles.incoming}>{formatBytes(data.incoming)}</td>
              <td className={styles.outgoing}>{formatBytes(data.outgoing)}</td>
              <td>{data.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Request Log Table ────────────────────────────────────────────────────────
function RequestLog({ requests }) {
  const recent = useMemo(() => [...requests].reverse().slice(0, 60), [requests]);

  if (recent.length === 0) return <div className={styles.empty}>No network activity detected yet</div>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>TIME</th>
            <th>WEBSITE / SERVICE</th>
            <th>CATEGORY</th>
            <th>RECEIVED</th>
            <th>SENT</th>
            <th>SPEED</th>
          </tr>
        </thead>
        <tbody>
          {recent.map(r => (
            <tr key={r.id}>
              <td className={styles.timeCol}>{new Date(r.time).toLocaleTimeString()}</td>
              <td className={styles.domainCol} title={r.url}>
                {r.domain.length > 28 ? r.domain.slice(0, 26) + '…' : r.domain}
              </td>
              <td>
                <span className={styles.typePill} style={{
                  background: CATEGORY_COLORS[r.category]?.bg || 'rgba(148,163,184,0.3)',
                  color: CATEGORY_COLORS[r.category]?.border || '#94a3b8',
                }}>
                  {r.category}
                </span>
              </td>
              <td className={styles.sizeCol}>{formatBytes(r.incoming)}</td>
              <td className={styles.outCol}>{formatBytes(r.outgoing)}</td>
              <td className={styles.durCol}>{r.duration}ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main DataUsage Component ─────────────────────────────────────────────────
export default function DataUsage({ tracker }) {
  const {
    tabId, requests, totalIncoming, totalOutgoing,
    speedTestData, byCategory, byDomain, byTab, dataTimeline, dataRate,
  } = tracker;

  const tabCount = Object.keys(byTab).length;
  const allTabsDataUsage = useAllTabsDataUsage();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.titleWrap}>
          <Activity className={styles.titleIcon} size={28} />
          <h2 className={styles.sectionTitle}>Data Consumption Monitor</h2>
        </div>
        <div className={styles.headerBadges}>
          <span className={styles.windowBadge}>LAST 10 MINUTES</span>
          <span className={styles.liveBadge}>LIVE TRACKING •</span>
        </div>
      </div>

      <div className={styles.sectionDescription}>
        Provides a real-time overview of how much data is being transferred continuously for testing.
      </div>

      {/* Summary Cards */}
      <DataSummary
        totalIncoming={totalIncoming}
        totalOutgoing={totalOutgoing}
        requestCount={Object.values(byCategory).reduce((sum, cat) => sum + (cat.count || 0), 0)}
        dataRate={dataRate}
        speedTestData={speedTestData}
      />

      {/* Speed Test Data Breakdown */}
      <SpeedTestBreakdown speedTestData={speedTestData} />

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Doughnut: By Category */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Data by Source Category</span>
          </div>
          <CategoryChart byCategory={byCategory} />
        </div>
      </div>
      {/* Line: Data Timeline */}
        <div className={styles.chartCard} style={{ marginBottom: 24 }}>
           <div className={styles.chartHeader}>
             <div>
               <span className={styles.chartTitle}>Live Data Transfer Timeline</span>
               <div className={styles.chartSubtitle}>
                 <span style={{color: '#38bdf8'}}>● Solid Blue</span> tracks incoming downloads. <span style={{color: '#fbbf24', marginLeft: '6px'}}>○ Dotted Yellow</span> tracks outgoing uploads. Real-time rates.
               </div>
             </div>
          </div>
          <DataTimelineChart dataTimeline={dataTimeline} />
        </div>
      {/* Domain Chart */}
      <div className={styles.chartCard} style={{ marginBottom: 24 }}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>Where is data coming from / going to?</span>
        </div>
        <DomainChart byDomain={byDomain} />
      </div>

      {/* Tab Table + Request Log */}
      <div className={styles.tablesRow}>
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>Data Split Across Open Pages</span>
            <span className={styles.tableCount}>{tabCount} active page{tabCount !== 1 ? 's' : ''}</span>
          </div>
          <TabTable byTab={byTab} currentTabId={tabId} />
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>Recent Network Connections</span>
            <span className={styles.tableCount}>{requests.length} tracked</span>
          </div>
          <RequestLog requests={requests} />
        </div>
      </div>

      {/* Per-Tab Data Breakdown */}
      {Object.keys(allTabsDataUsage).length > 0 && (
        <div className={styles.perTabSection}>
          <div className={styles.sectionSubHeader}>
            <Network size={20} />
            <h3 className={styles.subTitle}>Data Usage by Tab</h3>
            <span className={styles.tabBadge}>{Object.keys(allTabsDataUsage).length} tabs</span>
          </div>
          <div className={styles.perTabGrid}>
            {Object.entries(allTabsDataUsage).map(([tabId, dataUsage]) => {
              if (!dataUsage || !dataUsage.byCategory) return null;
              
              const totalData = Object.values(dataUsage.byCategory || {})
                .reduce((sum, cat) => sum + (cat.bytes || 0), 0);
              
              return (
                <div key={tabId} className={styles.perTabCard}>
                  <div className={styles.perTabHeader}>
                    <span className={styles.perTabId}>{tabId}</span>
                    <span className={styles.perTabTotal}>{formatBytes(totalData)}</span>
                  </div>
                  <div className={styles.perTabCategories}>
                    {Object.entries(dataUsage.byCategory || {})
                      .sort((a, b) => (b[1].bytes || 0) - (a[1].bytes || 0))
                      .slice(0, 5)
                      .map(([category, catData]) => {
                        const bytes = catData.bytes || 0;
                        const pct = totalData > 0 ? ((bytes / totalData) * 100).toFixed(0) : 0;
                        const color = CATEGORY_COLORS[category]?.border || '#94a3b8';
                        
                        return (
                          <div key={category} className={styles.perTabCategoryRow}>
                            <span 
                              className={styles.perTabCategoryDot}
                              style={{ background: color }}
                            />
                            <span className={styles.perTabCategoryName}>{category}</span>
                            <span className={styles.perTabCategorySize}>{formatBytes(bytes)}</span>
                            <span className={styles.perTabCategoryPct}>{pct}%</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
