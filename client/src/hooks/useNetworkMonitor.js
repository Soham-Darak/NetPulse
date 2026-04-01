import { useState, useRef, useCallback, useEffect } from 'react';
import { initCrossTabComms, broadcastMetrics, closeCrossTabComms } from '../utils/crossTabComms';

const HISTORY_KEY = 'netpulse_history';
const TAB_ID = `tab-${Math.random().toString(36).slice(2, 8)}`;
const MAX_PING_SAMPLES = 60;
const MAX_CHART_POINTS = 60;
const MAX_SPEED_BARS = 60;
const TEST_INTERVAL = 10_000;
const MAX_DURATION_MS = 10 * 60 * 1000;

// Get API URL from environment, default to current host for local development
const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.host}`;
const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws';

function loadStoredHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function saveStoredHistory(arr) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(-100)));
}

export function getQuality(ping, dl, ul) {
  if (ping === null || dl === null) return 'idle';
  if (ping < 50  && dl > 20 && (ul ?? 999) > 5)  return 'good';
  if (ping < 150 && dl > 5  && (ul ?? 999) > 1)  return 'moderate';
  return 'poor';
}

export function useNetworkMonitor() {
  // ── Live metrics ────────────────────────────────────────────────────────
  const [ping, setPing] = useState(null);
  const [pingStats, setPingStats] = useState({ min: null, avg: null, max: null });
  const [jitter, setJitter] = useState(null);
  const [packetLoss, setPacketLoss] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(null);
  const [dlStats, setDlStats] = useState({ peak: null, avg: null });
  const [uploadSpeed, setUploadSpeed] = useState(null);
  const [ulStats, setUlStats] = useState({ peak: null, avg: null });

  // ── Connection info ─────────────────────────────────────────────────────
  const [connectionInfo, setConnectionInfo] = useState({
    ip: null, isp: null, city: null, country: null,
    type: null, effectiveType: null, downlink: null,
  });

  // ── Test state ──────────────────────────────────────────────────────────
  const [isPaused, setIsPaused] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('idle'); // idle | ping | download | upload | done
  const [statusText, setStatusText] = useState('Starting continuous monitoring…');
  const [statusType, setStatusType] = useState('active');
  const [progress, setProgress] = useState(0);
  const [testCount, setTestCount] = useState(0);

  // ── Timer – uses rAF for rock-solid ticking ─────────────────────────────
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerStartRef = useRef(null);         // wall-clock when current run started
  const timerAccumulatedRef = useRef(0);       // seconds accumulated before pauses
  const timerRafRef = useRef(null);

  // ── Chart data ──────────────────────────────────────────────────────────
  const [pingChartData, setPingChartData] = useState({ labels: [], values: [] });
  const [speedChartData, setSpeedChartData] = useState({ labels: [], dl: [], ul: [] });

  // ── History ─────────────────────────────────────────────────────────────
  const [history, setHistory] = useState(loadStoredHistory);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const pingHistoryRef = useRef([]);
  const dlHistoryRef   = useRef([]);
  const ulHistoryRef   = useRef([]);
  const testIntervalRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const wsRef          = useRef(null);
  const pingTotalRef   = useRef(0);
  const pingFailRef    = useRef(0);
  const isPausedRef    = useRef(false);
  const isTestingRef   = useRef(false);

  // ── Helpers ─────────────────────────────────────────────────────────────
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
    setPingChartData(prev => ({
      labels: [...prev.labels, now].slice(-MAX_CHART_POINTS),
      values: [...prev.values, latency].slice(-MAX_CHART_POINTS),
    }));
  }, []);

  const formatElapsed = useCallback((totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  //  TIMER — requestAnimationFrame loop (never blocked by async work)
  // ═══════════════════════════════════════════════════════════════════════
  const tickTimer = useCallback(() => {
    if (timerStartRef.current !== null) {
      const now = performance.now();
      const sessionSec = (now - timerStartRef.current) / 1000;
      const total = Math.floor(timerAccumulatedRef.current + sessionSec);
      setElapsedSeconds(total);
    }
    timerRafRef.current = requestAnimationFrame(tickTimer);
  }, []);

  const startTimer = useCallback(() => {
    timerStartRef.current = performance.now();
    if (!timerRafRef.current) {
      timerRafRef.current = requestAnimationFrame(tickTimer);
    }
  }, [tickTimer]);

  const pauseTimer = useCallback(() => {
    if (timerStartRef.current !== null) {
      timerAccumulatedRef.current += (performance.now() - timerStartRef.current) / 1000;
      timerStartRef.current = null;
    }
    if (timerRafRef.current) {
      cancelAnimationFrame(timerRafRef.current);
      timerRafRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    pauseTimer();
    timerAccumulatedRef.current = 0;
    setElapsedSeconds(0);
  }, [pauseTimer]);

  // ── Single ping ─────────────────────────────────────────────────────────
  const singlePing = useCallback(async () => {
    try {
      const start = performance.now();
      await fetch(`${API_URL}/ping?t=` + Date.now(), { cache: 'no-store' });
      return Math.round(performance.now() - start);
    } catch {
      return null;
    }
  }, []);

  // ── Background ping ─────────────────────────────────────────────────────
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

  // ── Download test ───────────────────────────────────────────────────────
  const measureDownload = useCallback(async () => {
    setCurrentPhase('download');
    setStatus('Measuring download speed…', 'active', 25);
    try {
      const DL_SIZE = 5 * 1024 * 1024;
      const MAX_DUR = 8;

      const res = await fetch(`${API_URL}/test-file?size=` + DL_SIZE + '&t=' + Date.now(), {
        cache: 'no-store',
      });

      const contentLength = parseInt(res.headers.get('Content-Length'), 10) || DL_SIZE;
      const reader = res.body.getReader();
      const start = performance.now();
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        
        window.dispatchEvent(new CustomEvent('netpulse_live_chunk', { 
          detail: { type: 'download', bytes: value.byteLength } 
        }));

        const elapsed = (performance.now() - start) / 1000;
        const pct = Math.min(45, 25 + Math.round((totalBytes / contentLength) * 20));
        setProgress(pct);

        if (elapsed > 0.1) {
          const liveSpeed = parseFloat(((totalBytes * 8) / elapsed / 1_000_000).toFixed(2));
          setDownloadSpeed(liveSpeed);
        }

        if (elapsed >= MAX_DUR) {
          reader.cancel();
          break;
        }
      }

      const duration = (performance.now() - start) / 1000;
      if (duration < 0.05) return null;

      const speedMbps = parseFloat(((totalBytes * 8) / duration / 1_000_000).toFixed(2));

      dlHistoryRef.current.push(speedMbps);
      if (dlHistoryRef.current.length > MAX_SPEED_BARS) dlHistoryRef.current.shift();

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

  // ── Upload test ─────────────────────────────────────────────────────────
  const measureUpload = useCallback(async () => {
    setCurrentPhase('upload');
    setStatus('Measuring upload speed…', 'active', 65);
    try {
      const SIZE = 2 * 1024 * 1024;
      const data = new Uint8Array(SIZE);
      for (let off = 0; off < SIZE; off += 65536) {
        crypto.getRandomValues(data.subarray(off, Math.min(off + 65536, SIZE)));
      }
      const blob = new Blob([data], { type: 'application/octet-stream' });

      const start = performance.now();
      
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/upload-test`, true);
        
        let lastLoaded = 0;
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const chunk = event.loaded - lastLoaded;
            if (chunk > 0) {
              window.dispatchEvent(new CustomEvent('netpulse_live_chunk', { 
                detail: { type: 'upload', bytes: chunk } 
              }));
              lastLoaded = event.loaded;
            }
            
            const elapsed = (performance.now() - start) / 1000;
            if (elapsed > 0.1) {
              const liveSpeed = parseFloat(((event.loaded * 8) / elapsed / 1_000_000).toFixed(2));
              setUploadSpeed(liveSpeed);
            }
            const pct = Math.min(90, 65 + Math.round((event.loaded / event.total) * 25));
            setProgress(pct);
          }
        };

        xhr.onload = () => {
          const duration = (performance.now() - start) / 1000;
          if (duration < 0.05) return resolve(null);

          const speedMbps = parseFloat(((SIZE * 8) / duration / 1_000_000).toFixed(2));

          ulHistoryRef.current.push(speedMbps);
          if (ulHistoryRef.current.length > MAX_SPEED_BARS) ulHistoryRef.current.shift();

          setUploadSpeed(speedMbps);
          setUlStats({
            peak: Math.max(...ulHistoryRef.current),
            avg: parseFloat(avg(ulHistoryRef.current).toFixed(2)),
          });
          resolve(speedMbps);
        };

        xhr.onerror = () => {
          resolve(null);
        };

        xhr.send(blob);
      });
    } catch {
      return null;
    }
  }, [setStatus]);

  // ── Single test cycle ───────────────────────────────────────────────────
  const runSingleTest = useCallback(async () => {
    if (isTestingRef.current || isPausedRef.current) return;
    isTestingRef.current = true;
    setIsTesting(true);

    try {
      // Ping
      setCurrentPhase('ping');
      setStatus('Checking response time…', 'active', 5);
      const latency = await measurePing();
      setProgress(15);

      // Download
      const dl = await measureDownload();
      setProgress(50);

      // Upload
      const ul = await measureUpload();
      setProgress(90);

      setCurrentPhase('done');

      // Update speed chart
      const label = new Date().toLocaleTimeString('en', {
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
      setSpeedChartData(prev => ({
        labels: [...prev.labels, label].slice(-MAX_SPEED_BARS),
        dl:     [...prev.dl, dl ?? 0].slice(-MAX_SPEED_BARS),
        ul:     [...prev.ul, ul ?? 0].slice(-MAX_SPEED_BARS),
      }));

      setTestCount(prev => prev + 1);

      // Save history
      const finalPing = latency ?? (pingHistoryRef.current.at(-1) ?? null);
      const record = { ts: Date.now(), ping: finalPing, dl, ul };
      setHistory(prev => {
        const cutoff = Date.now() - MAX_DURATION_MS;
        const trimmed = prev.filter(r => r.ts >= cutoff);
        const next = [...trimmed, record];
        saveStoredHistory(next);
        return next;
      });

      // Broadcast via WS
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'result', ...record }));
      }

      const dlStr = dl !== null ? `↓ ${dl} Mbps` : '↓ —';
      const ulStr = ul !== null ? `↑ ${ul} Mbps` : '↑ —';
      const pingStr = finalPing !== null ? `${finalPing} ms` : '—';
      setStatus(`${pingStr}  ·  ${dlStr}  ·  ${ulStr}`, 'done', 100);

    } catch (err) {
      setCurrentPhase('idle');
      setStatus('Test failed: ' + err.message, 'error', 0);
    } finally {
      isTestingRef.current = false;
      setIsTesting(false);
    }
  }, [measurePing, measureDownload, measureUpload, setStatus]);

  // ── Start continuous testing ───────────────────────────────────────────
  const startContinuousTesting = useCallback(() => {
    // Background ping every 2s
    if (!pingIntervalRef.current) {
      pingIntervalRef.current = setInterval(() => {
        if (!isPausedRef.current && !isTestingRef.current) measurePing();
      }, 2000);
    }

    // Full test every 10s
    if (!testIntervalRef.current) {
      runSingleTest();
      testIntervalRef.current = setInterval(() => {
        if (!isPausedRef.current) runSingleTest();
      }, TEST_INTERVAL);
    }

    startTimer();
  }, [measurePing, runSingleTest, startTimer]);

  // ── Pause / Resume ────────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      const newPaused = !prev;
      isPausedRef.current = newPaused;

      if (newPaused) {
        // Pause everything
        pauseTimer();
        if (testIntervalRef.current) { clearInterval(testIntervalRef.current); testIntervalRef.current = null; }
        if (pingIntervalRef.current) { clearInterval(pingIntervalRef.current); pingIntervalRef.current = null; }
        setCurrentPhase('idle');
        setStatusText('Paused — monitoring stopped');
        setStatusType('idle');
      } else {
        // Resume
        startContinuousTesting();
        setStatusText('Resumed — next test starting…');
        setStatusType('active');
      }

      return newPaused;
    });
  }, [pauseTimer, startContinuousTesting]);

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
    setPing(null);
    setJitter(null);
    setPacketLoss(0);
    setDlStats({ peak: null, avg: null });
    setUlStats({ peak: null, avg: null });
    setPingStats({ min: null, avg: null, max: null });
    setPingChartData({ labels: [], values: [] });
    setSpeedChartData({ labels: [], dl: [], ul: [] });
    setTestCount(0);
    resetTimer();
    startTimer();
    setStatus('History cleared', 'idle', 0);
  }, [setStatus, resetTimer, startTimer]);

  // ── On mount ────────────────────────────────────────────────────────────
  useEffect(() => {
    // Initialize cross-tab communication
    initCrossTabComms();

    // Connection info
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      setConnectionInfo(prev => ({
        ...prev,
        type: conn.type || null,
        effectiveType: conn.effectiveType || null,
        downlink: conn.downlink || null,
      }));
    }

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

    // WebSocket
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'result' && msg.ts) {
            setHistory(prev => {
              const cutoff = Date.now() - MAX_DURATION_MS;
              const trimmed = prev.filter(r => r.ts >= cutoff);
              const next = [...trimmed, { ts: msg.ts, ping: msg.ping, dl: msg.dl, ul: msg.ul }];
              saveStoredHistory(next);
              return next;
            });
          }
        } catch {}
      };
      ws.onerror = () => {};
    } catch {}

    // Auto-start
    startContinuousTesting();

    return () => {
      if (testIntervalRef.current) clearInterval(testIntervalRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pauseTimer();
      if (wsRef.current) { try { wsRef.current.close(); } catch {} }
      closeCrossTabComms();
    };
  }, []); // run once

  const quality = getQuality(ping, downloadSpeed, uploadSpeed);
  const elapsedFormatted = formatElapsed(elapsedSeconds);

  // ── Broadcast metrics to other tabs ─────────────────────────────────────
  useEffect(() => {
    const tabQuality = getQuality(ping, downloadSpeed, uploadSpeed);
    const broadcastTimer = setInterval(() => {
      broadcastMetrics(TAB_ID, {
        downloadSpeed,
        uploadSpeed,
        ping,
        quality: tabQuality,
        connectionInfo,
        isTesting,
        currentPhase,
      });
    }, 1000); // Broadcast every second

    return () => clearInterval(broadcastTimer);
  }, [downloadSpeed, uploadSpeed, ping, connectionInfo, isTesting, currentPhase]);

  return {
    tabId: TAB_ID,
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
  };
}
