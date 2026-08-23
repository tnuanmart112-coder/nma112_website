import { mockWorks } from "../data/mockWorks.js";
import { csvToObjects } from "../utils/csvParser.js";
import { normalizeWorks } from "../utils/dataFormatter.js";

const defaultWorkerApiUrl = "https://nma112-exhibition-sync.tnuanmart112.workers.dev/api/exhibitions";
const apiUrl = import.meta.env.VITE_EXHIBITION_API_URL || defaultWorkerApiUrl;
const sheetCsvUrl = import.meta.env.VITE_GOOGLE_SHEET_CSV_URL || "/sheet.csv";

export async function fetchExhibitionData() {
  try {
    return await fetchWorkerData(apiUrl);
  } catch (workerError) {
    console.warn("Worker API 載入失敗，改用 Google Sheet CSV 臨時模式。", workerError);

    try {
      return await fetchSheetCsvData(sheetCsvUrl);
    } catch (sheetError) {
      console.warn("Google Sheet CSV 也載入失敗，改用本地樣本資料。", sheetError);
      return normalizeWorks(mockWorks);
    }
  }
}

async function fetchWorkerData(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`作品資料 API 回應異常：${response.status}`);
  }

  const payload = await response.json();
  return normalizeWorks(Array.isArray(payload) ? payload : payload.works);
}

async function fetchSheetCsvData(url) {
  const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, {
    headers: {
      Accept: "text/csv",
    },
  });

  if (!response.ok) {
    throw new Error(`Google Sheet CSV 回應異常：${response.status}`);
  }

  const csvText = await response.text();
  return normalizeWorks(csvToObjects(csvText));
}
