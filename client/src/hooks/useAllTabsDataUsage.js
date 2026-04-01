import { useState, useEffect } from 'react';
import { getAllTabsMetrics, subscribeToMetrics } from '../utils/crossTabComms';

/**
 * Hook to aggregate data usage from all tabs
 */
export function useAllTabsDataUsage() {
  const [allTabsData, setAllTabsData] = useState({});

  useEffect(() => {
    // Get initial data
    const metrics = getAllTabsMetrics();
    const dataMap = {};
    
    Object.entries(metrics).forEach(([tabId, data]) => {
      if (data.dataUsage) {
        dataMap[tabId] = data.dataUsage;
      }
    });
    
    setAllTabsData(dataMap);

    // Subscribe to updates
    const unsubscribe = subscribeToMetrics((tabs) => {
      const updated = {};
      Object.entries(tabs).forEach(([tabId, data]) => {
        if (data.dataUsage) {
          updated[tabId] = data.dataUsage;
        }
      });
      setAllTabsData(updated);
    });

    return unsubscribe;
  }, []);

  return allTabsData;
}
