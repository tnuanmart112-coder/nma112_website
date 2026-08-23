import { useState } from "react";
import { triggerManualSync } from "../services/syncService.js";

function formatDateTime(value) {
  if (!value) return "尚未同步";

  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

export function AdminPage() {
  const [syncToken, setSyncToken] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSync(event) {
    event.preventDefault();

    if (!syncToken.trim()) {
      setError("請輸入後台同步密碼。");
      return;
    }

    setIsSyncing(true);
    setError("");

    try {
      const syncResult = await triggerManualSync(syncToken.trim());
      setResult(syncResult);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "同步失敗，請稍後再試。");
    } finally {
      setIsSyncing(false);
    }
  }

  const imageErrors = result?.imageErrors || [];

  return (
    <section className="page-section admin-page">
      <div className="content-container">
        <p className="section-kicker">Admin</p>
        <h1>後台同步</h1>

        <form className="admin-panel" onSubmit={handleSync}>
          <label className="field-group" htmlFor="sync-token">
            <span>同步密碼</span>
            <input
              id="sync-token"
              className="text-input"
              type="password"
              value={syncToken}
              autoComplete="off"
              onChange={(event) => setSyncToken(event.target.value)}
            />
          </label>

          <div className="admin-actions">
            <button className="primary-button" type="submit" disabled={isSyncing}>
              {isSyncing ? "同步中..." : "手動同步 Google Sheet"}
            </button>
          </div>

          {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}

          {result ? (
            <div className="sync-result">
              <dl className="result-grid">
                <div>
                  <dt>更新時間</dt>
                  <dd>{formatDateTime(result.updatedAt)}</dd>
                </div>
                <div>
                  <dt>作品數量</dt>
                  <dd>{result.count ?? 0}</dd>
                </div>
                <div>
                  <dt>圖片錯誤</dt>
                  <dd>{imageErrors.length}</dd>
                </div>
              </dl>

              {imageErrors.length ? (
                <div className="image-error-panel">
                  <h2>圖片錯誤清單</h2>
                  <ul>
                    {imageErrors.map((imageError) => (
                      <li key={`${imageError.id}-${imageError.field}`}>
                        <strong>{imageError.title || imageError.id}</strong>
                        <span>{imageError.field}</span>
                        <p>{imageError.message}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="admin-alert admin-alert--success">同步成功，沒有圖片錯誤。</p>
              )}
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
