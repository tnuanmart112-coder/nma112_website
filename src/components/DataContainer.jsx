import { ExhibitionCard } from "./ExhibitionCard.jsx";
import { StatusMessage } from "./StatusMessage.jsx";
import { useExhibitionData } from "../hooks/useExhibitionData.js";

export function DataContainer() {
  const { data, error, loading, lastUpdated } = useExhibitionData();

  return (
    <section className="works-section" aria-labelledby="works-title">
      <div className="content-container">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Works</p>
            <h2 id="works-title">作品資料</h2>
          </div>
        </div>

        {lastUpdated ? (
          <p className="sync-time">最後載入：{lastUpdated.toLocaleString("zh-TW")}</p>
        ) : null}

        {loading ? <StatusMessage type="loading" message="作品資料載入中" /> : null}
        {error ? <StatusMessage type="error" message={error} /> : null}
        {!loading && !error && data.length === 0 ? (
          <StatusMessage type="empty" message="目前沒有可顯示的作品資料" />
        ) : null}

        {data.length > 0 ? (
          <div className="works-grid">
            {data.map((work) => (
              <ExhibitionCard key={work.id} work={work} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
