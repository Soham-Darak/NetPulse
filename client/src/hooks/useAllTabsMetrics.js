import { useState, useEffect } from 'react';
import { getAllTabsMetrics, getAggregateMetrics, subscribeToMetrics } from '../utils/crossTabComms';

/**
 * Hook to read metrics from all tabs
 */
export function useAllTabsMetrics() {
  const [allTabs, setAllTabs] = useState({});
  const [aggregateMetrics, setAggregateMetrics] = useState({
    downloadSpeed: null,
    uploadSpeed: null,
    avgDownload: null,
    avgUpload: null,
    maxDownload: null,
    maxUpload: null,
    tabCount: 0,
  });

  useEffect(() => {
    // Get initial data
    setAllTabs(getAllTabsMetrics());
    setAggregateMetrics(getAggregateMetrics());

    // Subscribe to updates
    const unsubscribe = subscribeToMetrics((tabs) => {
      setAllTabs(tabs);
      setAggregateMetrics(getAggregateMetrics());
    });

    return unsubscribe;
  }, []);

  return {
    allTabs,
    aggregateMetrics,
  };
}
