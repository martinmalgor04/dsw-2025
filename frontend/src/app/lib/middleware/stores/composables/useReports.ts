import { useEffect, useState } from 'react';
import { reportsStore, ReportsState } from '../reports.store';
import { DateRange } from '../../services/report.service';

export function useReports() {
  const [state, setState] = useState<ReportsState>({
    kpiData: null,
    isLoading: false,
    error: null,
    lastSync: null,
    currentPeriod: null,
    autoRefresh: false,
  });

  useEffect(() => {
    const unsubscribe = reportsStore.subscribe(setState);
    return () => unsubscribe();
  }, []);

  return {
    kpiData: state.kpiData,
    isLoading: state.isLoading,
    error: state.error,
    lastSync: state.lastSync,
    currentPeriod: state.currentPeriod,
    autoRefresh: state.autoRefresh,
    loadKPIs: (period?: DateRange, force?: boolean) => reportsStore.loadKPIs(period, force),
    setAutoRefresh: (enabled: boolean) => reportsStore.setAutoRefresh(enabled),
    exportToCSV: () => reportsStore.exportToCSV(),
  };
}
