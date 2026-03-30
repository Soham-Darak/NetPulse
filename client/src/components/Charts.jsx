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
ChartJS.defaults.color = '#94a3b8';

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400, easing: 'easeOutQuart' },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'rgba(56,189,248,0.3)',
      borderWidth: 1,
      titleColor: '#94a3b8',
      bodyColor: '#f8fafc',
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: { display: false },
    y: {
      grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
      ticks: { font: { size: 10 }, color: '#64748b', maxTicksLimit: 5 },
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
        label: 'Download Speed',
        data: speedChartData.dl,
        backgroundColor: 'rgba(56,189,248,0.8)',
        borderColor: '#38bdf8',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Upload Speed',
        data: speedChartData.ul,
        backgroundColor: 'rgba(74,222,128,0.8)',
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
        labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 12, usePointStyle: true },
      },
    },
  }), []);

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleWrap}>
            <span className={styles.title}>Response Time History</span>
            <span className={styles.subtitle}>Delay fluctuations over time</span>
          </div>
          <span className={styles.badge}>ms</span>
        </div>
        <div className={styles.chartWrap}>
          <Line data={pingData} options={baseOptions} />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
           <div className={styles.titleWrap}>
            <span className={styles.title}>Network Speed Trends</span>
            <span className={styles.subtitle}>Recent download/upload tests</span>
          </div>
          <span className={styles.badge}>Mbps</span>
        </div>
        <div className={styles.chartWrap}>
          <Bar data={speedData} options={speedOptions} />
        </div>
      </div>
    </div>
  );
}
