export function ExhibitionCard({ work }) {
  return (
    <article className="work-card">
      <div className="work-image-frame">
        {work.imageUrl ? (
          <img src={work.imageUrl} alt={work.title} loading="lazy" />
        ) : (
          <span>IMAGE PENDING</span>
        )}
      </div>
      <div className="work-card-body">
        <p className="work-type">{work.category || "未分類"}</p>
        <h3>{work.title}</h3>
        <p className="work-author">{work.author}</p>
        {work.statement ? <p className="work-statement">{work.statement}</p> : null}
        <dl className="work-meta">
          {work.media ? (
            <>
              <dt>媒材</dt>
              <dd>{work.media}</dd>
            </>
          ) : null}
          {work.dimensions ? (
            <>
              <dt>尺寸</dt>
              <dd>{work.dimensions}</dd>
            </>
          ) : null}
        </dl>
      </div>
    </article>
  );
}
