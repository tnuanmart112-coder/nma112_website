const zhCopy = [
  "本屆新媒體藝術學系畢業展，在 1.1.2（保留 1.1.2）版本中，「新▢▢版本發行」遵循著更新的邏輯。學生於各自的實驗場中建立獨立世界觀，在不受限的環境中建構獨特的敘事。以影像、裝置、互動與空間，對隱藏在技術與日常背後的社會現況、意識形態與生活經驗，進行測試、拆解與重寫。",
  "展覽名稱中，「新▢▢版本（NEW ▢▢）」強調作品、作者、觀眾之間留有的想像空間，同時也表示對於未知體驗的填空，更對「新媒體藝術系」有更多元的解釋；「發行（RELEASE）」思考從過去至現在不斷地實驗以及推陳出新，將技術與藝術推向最完美的狀態，也代表有更多的可能性能與觀眾發覺。",
  "在高自由度的場域中，我們被允許嘗試與錯誤，也允許被徹底推翻。每一次的改動都留下迭代版本的足跡，而歷經百般修正後這些各自運算的實驗場，於同一個場域中被集體部署，所有累積的修正一併收束，便集體宣告一份最佳化的「新▢▢版本」。",
];

const enCopy = [
  "In this year's Graduation Exhibition of the Department of New Media Arts, NEW ▢▢ RELEASE, under version 1.1.2, follows the logic of continuous updates and iteration. Within their individual experimental fields, each student constructs an independent worldview, developing distinctive narratives in an unrestricted environment. Through moving images, installations, interactive media, and spatial practices, the works test, deconstruct, and rewrite the social realities, ideologies, and lived experiences concealed beneath technology and everyday life.",
  'The exhibition title, NEW ▢▢, intentionally leaves room for interpretation between the artwork, the artist, and the audience. The blank space invites unknown possibilities and experiences while opening up broader interpretations of what "New Media Arts" can signify. RELEASE reflects an ongoing process of experimentation, refinement, and innovation from past explorations to present developments. It represents the continuous pursuit of bringing technology and art toward their most refined state, while revealing new possibilities waiting to be discovered by its audience.',
  "Within a highly open environment, we are free to experiment, to fail, and even to be completely overturned. Every modification leaves behind traces of another iteration. After countless revisions, these independently evolving experimental worlds are deployed together within a shared space. As every accumulated update converges, they collectively announce an optimized NEW ▢▢ RELEASE.",
];

export function IntroSection() {
  return (
    <section className="intro-section" aria-labelledby="site-title">
      <div className="content-container intro-copy">
        <p className="version-label">NMA 112 Graduation Exhibition</p>
        <h1 id="site-title">新▢▢版本發行／NEW ▢▢ RELEASE</h1>
        <div className="copy-grid">
          <div>
            {zhCopy.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div lang="en">
            {enCopy.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
