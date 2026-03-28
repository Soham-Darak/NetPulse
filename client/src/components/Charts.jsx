import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement,
  Filler, Tooltip, Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import styles from './Charts.module.css';

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement,
  Filler, Tooltip, Legend,
);

ChartJS.defaults.font.family = "'JetBrains Mono', monospace";
ChartJS.defaults.color = '#475569';

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 250, easing: 'easeOutCubic' },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0d1117',
      borderColor: 'rgba(56,189,248,0.2)',
      borderWidth: 1,
      titleColor: '#64748b',
      bodyColor: '#e2e8f0',
      padding: 10,
    },
  },
  scales: {
    x: { display: false },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
      ticks: { font: { size: 10 }, color: '#334155', maxTicksLimit: 5 },
      border: { display: false },
      min: 0,
    },
  },
};

export default function Charts({ pingChartData, speedChartData }) {
  const pingData = useMemo(() => ({
    labels: pingChartData.labels,
    datasets: [{
      data: pingChartData.values,
      borderColor: '#38bdf8',
      borderWidth: 2,
      backgroundColor: (ctx) => {
        if (!ctx.chart.chartArea) return 'transparent';
        const g = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom);
        g.addColorStop(0, 'rgba(56,189,248,0.25)');
        g.addColorStop(1, 'rgba(56,189,248,0)');
        return g;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: '#38bdf8',
    }],
  }), [pingChartData]);

  const speedData = useMemo(() => ({
    labels: speedChartData.labels,
    datasets: [
      {
        label: 'Download',
        data: speedChartData.dl,
        backgroundColor: 'rgba(56,189,248,0.6)',
        borderColor: '#38bdf8',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Upload',
        data: speedChartData.ul,
        backgroundColor: 'rgba(74,222,128,0.5)',
        borderColor: '#4ade80',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }), [speedChartData]);

  const speedOptions = useMemo(() => ({
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: { color: '#475569', font: { size: 10 }, boxWidth: 10, padding: 12 },
      },
    },
  }), []);

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.title}>Ping Timeline</span>
          <span className={styles.badge}>LIVE</span>
        </div>
        <div className={styles.chartWrap}>
          <Line data={pingData} options={baseOptions} />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.title}>Throughput</span>
          <span className={styles.badge}>Mbps</span>
        </div>
        <div className={styles.chartWrap}>
          <Bar data={speedData} options={speedOptions} />
        </div>
      </div>
    </div>
  );
}
