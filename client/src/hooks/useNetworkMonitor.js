import { useState, useRef, useCallback, useEffect } from 'react';

const HISTORY_KEY = 'netpulse_history';
const MAX_PING_SAMPLES = 60;
const MAX_CHART_POINTS = 40;
const MAX_SPEED_BARS = 12;

// ── Server endpoints ──────────────────────────────────────────────────────────
// All tests route through the local Express server (proxied by Vite in dev).
const WS_URL = `ws://${window.location.host}/ws`;

function loadStoredHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function saveStoredHistory(arr) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(-50)));
}

export function getQuality(ping, dl, ul) {
  if (ping === null || dl === null) return 'idle';
  if (ping < 50  && dl > 20 && (ul ?? 999) > 5)  return 'good';
  if (ping < 150 && dl > 5  && (ul ?? 999) > 1)  return 'moderate';
  return 'poor';
}

export function useNetworkMonitor() {
  // ── Live metrics ──────────────────────────────────────────────────────────
  const [ping, setPing] = useState(null);
  const [pingStats, setPingStats] = useState({ min: null, avg: null, max: null });
  const [jitter, setJitter] = useState(null);
  const [packetLoss, setPacketLoss] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(null);
  const [dlStats, setDlStats] = useState({ peak: null, avg: null });
  const [uploadSpeed, setUploadSpeed] = useState(null);
  const [ulStats, setUlStats] = useState({ peak: null, avg: null });

  // ── Connection info ───────────────────────────────────────────────────────
  const [connectionInfo, setConnectionInfo] = useState({
    ip: null, isp: null, city: null, country: null,
    type: null, effectiveType: null, downlink: null,
  });

  // ── Test state ────────────────────────────────────────────────────────────
  const [isRunning, setIsRunning] = useState(false);
  const [statusText, setStatusText] = useState('Ready to test');
  const [statusType, setStatusType] = useState('idle'); // idle | active | done | error
  const [progress, setProgress] = useState(0);

  // ── Chart data ────────────────────────────────────────────────────────────
  const [pingChartData, setPingChartData] = useState({ labels: [], values: [] });
  const [speedChartData, setSpeedChartData] = useState({ labels: [], dl: [], ul: [] });

  // ── History ───────────────────────────────────────────────────────────────
  const [history, setHistory] = useState(loadStoredHistory);

  // ── Internal accumulation refs ────────────────────────────────────────────
  const pingHistoryRef = useRef([]);
  const dlHistoryRef   = useRef([]);
  const ulHistoryRef   = useRef([]);
  const intervalRef    = useRef(null);
  const wsRef          = useRef(null);
  const pingTotalRef   = useRef(0);
  const pingFailRef    = useRef(0);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  const stdDev = (arr) => {
    if (arr.length < 2) return 0;
    const mean = avg(arr);
    const sqDiffs = arr.map(v => (v - mean) ** 2);
    return Math.round(Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
  };

  const setStatus = useCallback((text, type = 'active', prog = null) => {
    setStatusText(text);
    setStatusType(type);
    if (prog !== null) setProgress(prog);
  }, []);

  const pushPingPoint = useCallback((latency) => {
    const now = new Date().toLocaleTimeString('en', { hour12: false });
    setPingChartData(prev => {
      const labels = [...prev.labels, now].slice(-MAX_CHART_POINTS);
      const values = [...prev.values, latency].slice(-MAX_CHART_POINTS);
      return { labels, values };
    });
  }, []);

  // ── Single ping (against local Express server) ─────────────────────────────
  const singlePing = useCallback(async () => {
    try {
      const start = performance.now();
      await fetch('/ping?t=' + Date.now(), { cache: 'no-store' });
      return Math.round(performance.now() - start);
    } catch {
      return null;
    }
  }, []);

  // ── Background ping (updates UI) ──────────────────────────────────────────
  const measurePing = useCallback(async () => {
    pingTotalRef.current++;
    const latency = await singlePing();
    if (latency === null) {
      pingFailRef.current++;
      setPacketLoss(pingTotalRef.current > 0
        ? parseFloat(((pingFailRef.current / pingTotalRef.current) * 100).toFixed(1))
        : 0);
      return null;
    }

    pingHistoryRef.current.push(latency);
    if (pingHistoryRef.current.length > MAX_PING_SAMPLES)
      pingHistoryRef.current.shift();

    const hist = pingHistoryRef.current;
    setPing(latency);
    setPingStats({
      min: Math.min(...hist),
      avg: Math.round(avg(hist)),
      max: Math.max(...hist),
    });
    setJitter(stdDev(hist));
    setPacketLoss(pingTotalRef.current > 0
      ? parseFloat(((pingFailRef.current / pingTotalRef.current) * 100).toFixed(1))
      : 0);
    pushPingPoint(latency);
    return latency;
  }, [pushPingPoint, singlePing]);

  // ── Accurate ping measurement (warm-up + trimmed mean) ────────────────────
  const measureAccuratePing = useCallback(async () => {
    // 2 warm-up pings (discard — avoids TCP cold-start / DNS overhead)
    for (let i = 0; i < 2; i++) {
      await singlePing();
      await sleep(50);
    }

    // 10 measured pings
    const samples = [];
    for (let i = 0; i < 10; i++) {
      const lat = await singlePing();
      if (lat !== null) samples.push(lat);
      await sleep(100);
    }

    if (samples.length < 3) return null;

    // Trimmed mean: remove highest and lowest, then average
    samples.sort((a, b) => a - b);
    const trimmed = samples.slice(1, -1);
    const latency = Math.round(avg(trimmed));

    // Update all ping state
    pingHistoryRef.current.push(latency);
    if (pingHistoryRef.current.length > MAX_PING_SAMPLES)
      pingHistoryRef.current.shift();

    const hist = pingHistoryRef.current;
    setPing(latency);
    setPingStats({
      min: Math.min(...hist),
      avg: Math.round(avg(hist)),
      max: Math.max(...hist),
    });
    pushPingPoint(latency);
    return latency;
  }, [pushPingPoint, singlePing]);

  // ── Download test (streaming from local server) ────────────────────────────
  const measureDownload = useCallback(async () => {
    setStatus('Downloading test file…', 'active', 25);
    try {
      const DL_SIZE = 25 * 1024 * 1024; // 25 MB
      const MAX_DURATION = 15;           // seconds — cap test duration

      const res = await fetch('/test-file?t=' + Date.now(), {
        cache: 'no-store',
      });

      const contentLength = parseInt(res.headers.get('Content-Length'), 10) || DL_SIZE;
      const reader = res.body.getReader();
      const start = performance.now();
      let totalBytes = 0;

      // Stream-read: accumulate bytes and measure time
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;

        const elapsed = (performance.now() - start) / 1000;

        // Update progress
        const pct = Math.min(95, 25 + Math.round((totalBytes / contentLength) * 25));
        setProgress(pct);

        // Time cap: stop after MAX_DURATION seconds
        if (elapsed >= MAX_DURATION) {
          reader.cancel();
          break;
        }
      }

      const duration = (performance.now() - start) / 1000;
      if (duration < 0.05) return null; // too fast to measure accurately

      // bits / seconds / 1_000_000 = Mbps (decimal, matches ISP convention)
      const speedMbps = parseFloat(((totalBytes * 8) / duration / 1_000_000).toFixed(2));

      dlHistoryRef.current.push(speedMbps);
      setDownloadSpeed(speedMbps);
      setDlStats({
        peak: Math.max(...dlHistoryRef.current),
        avg: parseFloat(avg(dlHistoryRef.current).toFixed(2)),
      });
      return speedMbps;
    } catch {
      return null;
    }
  }, [setStatus]);

  // ── Upload test (via local server proxy) ───────────────────────────────────
  const measureUpload = useCallback(async () => {
    setStatus('Uploading test data…', 'active', 65);
    try {
      const SIZE = 5 * 1024 * 1024; // 5 MB
      const data = new Uint8Array(SIZE);
      // Fill with random data to prevent any compression along the path
      for (let off = 0; off < SIZE; off += 65536) {
        crypto.getRandomValues(data.subarray(off, Math.min(off + 65536, SIZE)));
      }
      const blob = new Blob([data], { type: 'application/octet-stream' });

      const start = performance.now();
      await fetch('/upload-test', {
        method: 'POST',
        body: blob,
      });
      const duration = (performance.now() - start) / 1000;
      if (duration < 0.05) return null;

      // bits / seconds / 1_000_000 = Mbps (decimal)
      const speedMbps = parseFloat(((SIZE * 8) / duration / 1_000_000).toFixed(2));

      ulHistoryRef.current.push(speedMbps);
      setUploadSpeed(speedMbps);
      setUlStats({
        peak: Math.max(...ulHistoryRef.current),
        avg: parseFloat(avg(ulHistoryRef.current).toFixed(2)),
      });
      return speedMbps;
    } catch {
      return null;
    }
  }, [setStatus]);

  // ── Full test run ─────────────────────────────────────────────────────────
  const runTest = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setStatus('Measuring latency…', 'active', 5);
    setProgress(0);

    try {
      // Accurate ping with warm-up + trimmed mean
      const latency = await measureAccuratePing();
      setStatus('Latency measured ✓', 'active', 20);

      // Download (streaming)
      const dl = await measureDownload();
      setStatus('Download measured ✓', 'active', 50);
      await sleep(300);

      // Upload
      const ul = await measureUpload();
      setStatus('Upload measured ✓', 'active', 90);
      await sleep(200);

      // Update speed chart
      const label = new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit' });
      setSpeedChartData(prev => {
        const labels = [...prev.labels, label].slice(-MAX_SPEED_BARS);
        const dlArr  = [...prev.dl, dl ?? 0].slice(-MAX_SPEED_BARS);
        const ulArr  = [...prev.ul, ul ?? 0].slice(-MAX_SPEED_BARS);
        return { labels, dl: dlArr, ul: ulArr };
      });

      // Save history
      const finalPing = latency ?? (pingHistoryRef.current.at(-1) ?? null);
      const record = { ts: Date.now(), ping: finalPing, dl, ul };
      setHistory(prev => {
        const next = [...prev, record];
        saveStoredHistory(next);
        return next;
      });

      // Broadcast via WebSocket to other connected clients
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'result', ...record }));
      }

      setStatus('Test complete — ' + new Date().toLocaleTimeString(), 'done', 100);
    } catch (err) {
      setStatus('Test failed: ' + err.message, 'error', 0);
    } finally {
      setIsRunning(false);
      startContinuousPing();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, measureAccuratePing, measureDownload, measureUpload, setStatus]);

  // ── Continuous background ping ─────────────────────────────────────────────
  const startContinuousPing = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      measurePing();
    }, 2000);
  }, [measurePing]);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    pingHistoryRef.current = [];
    dlHistoryRef.current   = [];
    ulHistoryRef.current   = [];
    pingTotalRef.current   = 0;
    pingFailRef.current    = 0;
    setDownloadSpeed(null);
    setUploadSpeed(null);
    setJitter(null);
    setPacketLoss(0);
    setDlStats({ peak: null, avg: null });
    setUlStats({ peak: null, avg: null });
    setPingChartData({ labels: [], values: [] });
    setSpeedChartData({ labels: [], dl: [], ul: [] });
    setStatus('History cleared', 'idle', 0);
  }, [setStatus]);

  // ── On mount: start background ping + WebSocket + fetch connection info ───
  useEffect(() => {
    measurePing();
    startContinuousPing();

    // Fetch connection info from Navigator API
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      setConnectionInfo(prev => ({
        ...prev,
        type: conn.type || null,
        effectiveType: conn.effectiveType || null,
        downlink: conn.downlink || null,
      }));
    }

    // Fetch public IP + ISP info
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        setConnectionInfo(prev => ({
          ...prev,
          ip: data.ip || null,
          isp: data.org || null,
          city: data.city || null,
          country: data.country_name || null,
        }));
      })
      .catch(() => {});

    // WebSocket: receive broadcasts from other tabs/clients
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'result' && msg.ts) {
            setHistory(prev => {
              const next = [...prev, { ts: msg.ts, ping: msg.ping, dl: msg.dl, ul: msg.ul }];
              saveStoredHistory(next);
              return next;
            });
          }
        } catch {}
      };

      ws.onerror = () => {};  // silent — WS is optional
    } catch {}

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (wsRef.current) { try { wsRef.current.close(); } catch {} }
    };
  }, []);  // intentionally run once

  const quality = getQuality(ping, downloadSpeed, uploadSpeed);

  return {
    // Metrics
    ping, pingStats, jitter, packetLoss,
    downloadSpeed, dlStats,
    uploadSpeed, ulStats,
    quality,
    // Connection
    connectionInfo,
    // Test state
    isRunning, statusText, statusType, progress,
    // Chart data
    pingChartData, speedChartData,
    // History
    history,
    // Actions
    runTest, clearHistory,
  };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

