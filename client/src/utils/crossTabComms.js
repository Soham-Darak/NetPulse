/**
 * Cross-Tab Communication Module
 * Uses BroadcastChannel to share network metrics across all tabs
 */

const CHANNEL_NAME = 'netpulse_metrics';
const STORAGE_KEY = 'netpulse_all_tabs_data';
const TAB_TIMEOUT = 15000; // Remove tab data if no update for 15s

let broadcastChannel = null;
let listeners = [];
let allTabsData = {};

/**
 * Initialize cross-tab communication
 */
export function initCrossTabComms() {
  if (!broadcastChannel && typeof BroadcastChannel !== 'undefined') {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannel.onmessage = (event) => {
        const { tabId, data, timestamp } = event.data || {};
        if (tabId && data) {
          allTabsData[tabId] = {
            ...data,
            lastUpdate: timestamp || Date.now(),
          };
          cleanupStaleTabData();
          notifyListeners();
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported, using localStorage fallback');
      initStorageComms();
    }
  } else if (typeof BroadcastChannel === 'undefined') {
    initStorageComms();
  }
}

/**
 * Fallback using localStorage events for browsers without BroadcastChannel
 */
function initStorageComms() {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        allTabsData = JSON.parse(e.newValue);
        cleanupStaleTabData();
        notifyListeners();
      } catch (err) {
        console.error('Error parsing stored tabs data:', err);
      }
    }
  });
}

/**
 * Broadcast metrics from current tab to all other tabs
 */
export function broadcastMetrics(tabId, metrics) {
  const timestamp = Date.now();
  const data = {
    tabId,
    data: {
      downloadSpeed: metrics.downloadSpeed,
      uploadSpeed: metrics.uploadSpeed,
      ping: metrics.ping,
      quality: metrics.quality,
      connectionInfo: metrics.connectionInfo,
      isTesting: metrics.isTesting,
      currentPhase: metrics.currentPhase,
      dataUsage: metrics.dataUsage,
    },
    timestamp,
  };

  // Update local data
  allTabsData[tabId] = { ...data.data, lastUpdate: timestamp };

  // Broadcast to other tabs
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(data);
    } catch (e) {
      console.warn('Error broadcasting metrics:', e);
      // Fallback to localStorage
      saveToLocalStorage();
    }
  } else {
    saveToLocalStorage();
  }

  notifyListeners();
}

/**
 * Save all tabs data to localStorage (for browsers without BroadcastChannel)
 */
function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allTabsData));
  } catch (e) {
    console.warn('Error saving to localStorage:', e);
  }
}

/**
 * Remove tab data that hasn't been updated recently
 */
function cleanupStaleTabData() {
  const now = Date.now();
  Object.keys(allTabsData).forEach((tabId) => {
    if (now - (allTabsData[tabId].lastUpdate || 0) > TAB_TIMEOUT) {
      delete allTabsData[tabId];
    }
  });
}

/**
 * Get all tabs' metrics
 */
export function getAllTabsMetrics() {
  cleanupStaleTabData();
  return allTabsData;
}

/**
 * Get aggregate metrics from all tabs
 */
export function getAggregateMetrics() {
  cleanupStaleTabData();
  
  const tabs = Object.values(allTabsData);
  if (tabs.length === 0) {
    return {
      downloadSpeed: null,
      uploadSpeed: null,
      avgDownload: null,
      avgUpload: null,
      maxDownload: null,
      maxUpload: null,
      tabCount: 0,
    };
  }

  const downloadSpeeds = tabs
    .map(t => t.downloadSpeed)
    .filter(s => s !== null && typeof s === 'number');
  const uploadSpeeds = tabs
    .map(t => t.uploadSpeed)
    .filter(s => s !== null && typeof s === 'number');

  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const max = (arr) => arr.length ? Math.max(...arr) : null;

  return {
    downloadSpeed: downloadSpeeds.length > 0 ? downloadSpeeds[downloadSpeeds.length - 1] : null,
    uploadSpeed: uploadSpeeds.length > 0 ? uploadSpeeds[uploadSpeeds.length - 1] : null,
    avgDownload: avg(downloadSpeeds),
    avgUpload: avg(uploadSpeeds),
    maxDownload: max(downloadSpeeds),
    maxUpload: max(uploadSpeeds),
    tabCount: tabs.length,
  };
}

/**
 * Subscribe to metrics changes
 */
export function subscribeToMetrics(callback) {
  listeners.push(callback);
  
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

/**
 * Notify all subscribers
 */
function notifyListeners() {
  listeners.forEach(listener => {
    try {
      listener(allTabsData);
    } catch (e) {
      console.error('Error in metrics listener:', e);
    }
  });
}

/**
 * Clear all tabs data
 */
export function clearAllTabsData() {
  allTabsData = {};
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Error clearing localStorage:', e);
  }
  notifyListeners();
}

/**
 * Clean up resources
 */
export function closeCrossTabComms() {
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
  listeners = [];
}
