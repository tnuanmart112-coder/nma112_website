const defaultWorkerApiUrl = "https://nma112-exhibition-sync.tnuanmart112.workers.dev/api/exhibitions";

function getSyncApiUrl() {
  const exhibitionsApiUrl = import.meta.env.VITE_EXHIBITION_API_URL || defaultWorkerApiUrl;
  const cleanUrl = exhibitionsApiUrl.replace(/\/$/, "");

  if (cleanUrl.endsWith("/api/exhibitions")) {
    return cleanUrl.replace(/\/api\/exhibitions$/, "/api/sync");
  }

  if (cleanUrl.endsWith("/api")) {
    return `${cleanUrl}/sync`;
  }

  return `${cleanUrl}/api/sync`;
}

export async function triggerManualSync(token) {
  const response = await fetch(getSyncApiUrl(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `同步失敗：${response.status}`);
  }

  return response.json();
}
