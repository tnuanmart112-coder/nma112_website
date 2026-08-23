import { useCallback, useEffect, useState } from "react";
import { fetchExhibitionData } from "../services/googleSheetsService.js";

const POLL_INTERVAL_MS = 300000;

export function useExhibitionData() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const works = await fetchExhibitionData();
      setData(works);
      setLastUpdated(new Date());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "作品資料載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const timerId = window.setInterval(loadData, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timerId);
    };
  }, [loadData]);

  return {
    data,
    error,
    loading,
    lastUpdated,
    refresh: loadData,
  };
}
