import { useState, useEffect, useRef, useCallback } from 'react';

// Generate a unique tab ID so we can distinguish data from different tabs
const TAB_ID = `tab-${Math.random().toString(36).slice(2, 8)}`;
const WS_URL = `ws://${window.location.host}/ws`;
const MAX_REQUESTS = 1000;
const UPDATE_INTERVAL = 10_000; // ms (10s)
const MAX_DATA_WINDOW = 10 * 60 * 1000; // 10 minutes

// ── Category classifier ──────────────────────────────────────────────────────
function classifyRequest(entry) {
  const url = entry.name.toLowerCase();
  const type = entry.initiatorType || '';
  if (/\/test-file/.test(url))                                                  return 'Download Tests';
  if (/\/upload-test/.test(url))                                                return 'Upload Tests';
  if (/\/ping/.test(url))                                                       return 'Response Time Tests';
  if (/\.(js|mjs|jsx|ts|tsx)(\?|$)/.test(url) || type === 'script')            return 'Scripts';
  if (/\.(css)(\?|$)/.test(url) || type === 'css')                             return 'Styles';
  if (/\.(png|jpg|jpeg|gif|svg|webp|ico|avif)(\?|$)/.test(url) || type === 'img') return 'Images';
  if (/\.(woff2?|ttf|otf|eot)(\?|$)/.test(url) || type === 'font' || url.includes('fonts.')) return 'Fonts';
  if (/\/api|\/ws/.test(url) || type === 'fetch' || type === 'xmlhttprequest')  return 'API/Fetch';
  if (/\.(mp4|webm|ogg|mp3|wav)(\?|$)/.test(url) || type === 'video' || type === 'audio') return 'Media';
  return 'Other';
}

// ── Extract domain from URL ──────────────────────────────────────────────────
function getDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return 'unknown';
  }
}

// ── Format bytes for display ─────────────────────────────────────────────────
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ── Category colors ──────────────────────────────────────────────────────────
export const CATEGORY_COLORS = {
  'Download Tests':      { bg: 'rgba(56, 189, 248, 0.7)',   border: '#38bdf8' },
  'Upload Tests':        { bg: 'rgba(74, 222, 128, 0.7)',    border: '#4ade80' },
  'Response Time Tests': { bg: 'rgba(168, 85, 247, 0.7)',     border: '#a855f7' },
  'Scripts':             { bg: 'rgba(251, 191, 36, 0.7)',     border: '#fbbf24' },
  'Styles':              { bg: 'rgba(244, 114, 182, 0.7)',    border: '#f472b6' },
  'Images':              { bg: 'rgba(74, 222, 128, 0.5)',     border: '#4ade80' },
  'Fonts':               { bg: 'rgba(251, 113, 133, 0.7)',    border: '#fb7185' },
  'API/Fetch':           { bg: 'rgba(96, 165, 250, 0.7)',     border: '#60a5fa' },
  'Media':               { bg: 'rgba(244, 114, 182, 0.7)',    border: '#f472b6' },
  'Other':               { bg: 'rgba(148, 163, 184, 0.5)',    border: '#94a3b8' },
};

export function useDataTracker(isPaused = false) {
  const isPausedRef = useRef(isPaused);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // ── Request log & UI timeline state ────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [byTab, setByTab] = useState({});
  const [dataTimeline, setDataTimeline] = useState({ labels: [], incoming: [], outgoing: [] });
  const [dataRate, setDataRate] = useState({ inRate: 0, outRate: 0 });

  // ── Permanent Accumulator State ────────────────────────────────────────────
  const [totalIncoming, setTotalIncoming] = useState(0);
  const [totalOutgoing, setTotalOutgoing] = useState(0);
  const [speedTestData, setSpeedTestData] = useState({ download: 0, upload: 0, ping: 0, total: 0 });
  const [byCategory, setByCategory] = useState({});
  const [byDomain, setByDomain] = useState({});

  const requestsRef = useRef([]);
  const outgoingRef = useRef(0);
  const wsRef = useRef(null);
  const chunkAccumulatorRef = useRef({ incoming: 0, outgoing: 0 });

  // Permanent Refs
  const permTotals = useRef({ incoming: 0, outgoing: 0 });
  const permSpeedTest = useRef({ download: 0, upload: 0, ping: 0, total: 0 });
  const permCategory = useRef({});
  const permDomain = useRef({});

  // ── Apply metrics permanently ────────────────────────────────────────
  const applyMetrics = useCallback((newReqs) => {
    let dIn = 0, dOut = 0;
    const catMap = permCategory.current;
    const domMap = permDomain.current;
    const st = permSpeedTest.current;

    newReqs.forEach(r => {
      dIn += r.incoming;
      dOut += r.outgoing;

      if (!catMap[r.category]) catMap[r.category] = { bytes: 0, count: 0, outgoing: 0 };
      catMap[r.category].bytes += r.incoming;
      catMap[r.category].outgoing += r.outgoing;
      catMap[r.category].count++;

      if (!domMap[r.domain]) domMap[r.domain] = { incoming: 0, outgoing: 0, count: 0 };
      domMap[r.domain].incoming += r.incoming;
      domMap[r.domain].outgoing += r.outgoing;
      domMap[r.domain].count++;

      if (r.category === 'Download Tests') st.download += r.incoming;
      if (r.category === 'Upload Tests') st.upload += r.outgoing;
      if (r.category === 'Response Time Tests') st.ping += (r.incoming + r.outgoing);
    });

    permTotals.current.incoming += dIn;
    permTotals.current.outgoing += dOut;
    st.total = st.download + st.upload + st.ping;

    setTotalIncoming(permTotals.current.incoming);
    setTotalOutgoing(permTotals.current.outgoing);
    setByCategory({ ...catMap });
    setByDomain({ ...domMap });
    setSpeedTestData({ ...st });
  }, []);

  // ── Rebuild windowing state from timeline history ─────────────────────────────
  const rebuildState = useCallback(() => {
    const cutoff = Date.now() - MAX_DATA_WINDOW;
    const all = requestsRef.current.filter(r => r.time >= cutoff);

    setRequests([...all]);

    const tabMap = {};
    all.forEach(r => {
      if (!tabMap[r.tabId]) tabMap[r.tabId] = { incoming: 0, outgoing: 0, count: 0 };
      tabMap[r.tabId].incoming += r.incoming;
      tabMap[r.tabId].outgoing += r.outgoing;
      tabMap[r.tabId].count++;
    });
    setByTab(tabMap);
  }, []);

  // ── Clear metrics fully ────────────────────────────────────────
  const clearTracker = useCallback(() => {
    requestsRef.current = [];
    outgoingRef.current = 0;
    chunkAccumulatorRef.current = { incoming: 0, outgoing: 0 };

    permTotals.current = { incoming: 0, outgoing: 0 };
    permSpeedTest.current = { download: 0, upload: 0, ping: 0, total: 0 };
    permCategory.current = {};
    permDomain.current = {};

    setTotalIncoming(0);
    setTotalOutgoing(0);
    setSpeedTestData({ download: 0, upload: 0, ping: 0, total: 0 });
    setByCategory({});
    setByDomain({});

    setDataTimeline({ labels: [], incoming: [], outgoing: [] });
    setDataRate({ inRate: 0, outRate: 0 });

    rebuildState();
  }, [rebuildState]);

  // ── Process a batch of performance entries ─────────────────────────────────
  const processEntries = useCallback((entries) => {
    if (isPausedRef.current) return;

    const now = Date.now();
    const cutoff = now - MAX_DATA_WINDOW;

    const newRequests = entries.map(entry => {
      const url = entry.name.toLowerCase();
      if (/\/upload-test/.test(url) || /\/test-file/.test(url)) return null;

      const incoming = entry.transferSize || entry.encodedBodySize || 0;

      // Better outgoing estimation based on request type
      let outgoing = 200; // base headers estimate
      if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
        outgoing = Math.max(entry.encodedBodySize * 0.1, 300);
      }

      return {
        id: `${TAB_ID}-${now}-${Math.random().toString(36).slice(2, 6)}`,
        tabId: TAB_ID,
        url: entry.name,
        domain: getDomain(entry.name),
        category: classifyRequest(entry),
        incoming,
        outgoing,
        duration: Math.round(entry.duration),
        time: now,
        type: entry.initiatorType || 'other',
      };
    }).filter(r => r && (r.incoming > 0 || r.category === 'API/Fetch' || r.category === 'Ping' || r.category.startsWith('Speed Test')));

    if (newRequests.length === 0) return;

    applyMetrics(newRequests);

    // Add new requests and trim to 10-minute window
    requestsRef.current = [...requestsRef.current, ...newRequests]
      .filter(r => r.time >= cutoff)
      .slice(-MAX_REQUESTS);
    outgoingRef.current += newRequests.reduce((sum, r) => sum + r.outgoing, 0);

    rebuildState();

    // Broadcast to other tabs
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'data_usage',
        tabId: TAB_ID,
        requests: newRequests,
      }));
    }
  }, [applyMetrics, rebuildState]);

  // ── Timeline updater ───────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      const now = new Date().toLocaleTimeString('en', { hour12: false });
      const all = requestsRef.current;
      const cutoff = Date.now() - UPDATE_INTERVAL;
      const recent = all.filter(r => r.time > cutoff);
      const inBytes = recent.reduce((s, r) => s + r.incoming, 0);
      const outBytes = recent.reduce((s, r) => s + r.outgoing, 0);

      // Calculate data rate (bytes/sec)
      const inRate = Math.round(inBytes / (UPDATE_INTERVAL / 1000));
      const outRate = Math.round(outBytes / (UPDATE_INTERVAL / 1000));

      setDataRate({ inRate, outRate });

      setDataTimeline(prev => ({
        labels: [...prev.labels, now].slice(-60),   // 10 min at 10s intervals
        incoming: [...prev.incoming, inRate].slice(-60),
        outgoing: [...prev.outgoing, outRate].slice(-60),
      }));
    }, UPDATE_INTERVAL);

    return () => clearInterval(iv);
  }, []);

  // ── Intercept custom real-time chunks ──────────────────────────────────────
  useEffect(() => {
    const handleChunk = (e) => {
      // Buffer the chunks regardless, but we discard them if paused down below during processing interval
      if (e.detail.type === 'download') chunkAccumulatorRef.current.incoming += e.detail.bytes;
      if (e.detail.type === 'upload') chunkAccumulatorRef.current.outgoing += e.detail.bytes;
    };
    window.addEventListener('netpulse_live_chunk', handleChunk);
    return () => window.removeEventListener('netpulse_live_chunk', handleChunk);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      if (isPausedRef.current) {
        chunkAccumulatorRef.current = { incoming: 0, outgoing: 0 };
        return;
      }

      const { incoming, outgoing } = chunkAccumulatorRef.current;
      if (incoming > 0 || outgoing > 0) {
        chunkAccumulatorRef.current = { incoming: 0, outgoing: 0 };
        const now = Date.now();
        const cutoff = now - MAX_DATA_WINDOW;
        
        const newReqs = [];
        if (incoming > 0) {
          newReqs.push({
            id: `dl-chunk-${now}-${Math.random().toString(36).slice(2,6)}`, tabId: TAB_ID, url: '/test-file (Stream)', domain: window.location.hostname,
            category: 'Download Tests', incoming, outgoing: 0, duration: 1000, time: now, type: 'fetch'
          });
        }
        if (outgoing > 0) {
          newReqs.push({
            id: `ul-chunk-${now}-${Math.random().toString(36).slice(2,6)}`, tabId: TAB_ID, url: '/upload-test (Stream)', domain: window.location.hostname,
            category: 'Upload Tests', incoming: 0, outgoing, duration: 1000, time: now, type: 'fetch'
          });
        }
        
        applyMetrics(newReqs);

        requestsRef.current = [...requestsRef.current, ...newReqs]
          .filter(r => r.time >= cutoff)
          .slice(-MAX_REQUESTS);
          
        outgoingRef.current += outgoing;
        rebuildState();
      }
    }, 1000); // Process accumulator buffer once every second
    return () => clearInterval(iv);
  }, [applyMetrics, rebuildState]);

  // ── Set up PerformanceObserver + WebSocket ─────────────────────────────────
  useEffect(() => {
    // Process existing entries
    const existing = performance.getEntriesByType('resource');
    if (existing.length > 0) processEntries(existing);

    // Observe new entries
    let observer;
    try {
      observer = new PerformanceObserver((list) => {
        processEntries(list.getEntries());
      });
      observer.observe({ type: 'resource', buffered: false });
    } catch (e) {
      console.warn('[DataTracker] PerformanceObserver not supported');
    }

    // WebSocket for cross-tab data sharing
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        if (isPausedRef.current) return;
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'data_usage' && msg.tabId !== TAB_ID) {
            const otherRequests = msg.requests || [];
            if (otherRequests.length > 0) {
              applyMetrics(otherRequests);
              const cutoff = Date.now() - MAX_DATA_WINDOW;
              requestsRef.current = [...requestsRef.current, ...otherRequests]
                .filter(r => r.time >= cutoff)
                .slice(-MAX_REQUESTS);
              outgoingRef.current += otherRequests.reduce((s, r) => s + r.outgoing, 0);
              rebuildState();
            }
          }
        } catch {}
      };

      ws.onerror = () => {};
    } catch {}

    return () => {
      if (observer) observer.disconnect();
      if (wsRef.current) try { wsRef.current.close(); } catch {}
    };
  }, [processEntries, applyMetrics, rebuildState]);

  return {
    tabId: TAB_ID,
    requests,
    totalIncoming,
    totalOutgoing,
    speedTestData,
    byCategory,
    byDomain,
    byTab,
    dataTimeline,
    dataRate,
    clearTracker,
  };
}
