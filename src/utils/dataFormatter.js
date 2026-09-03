const fieldMap = {
  id: ["id", "作品編號"],
  title: ["title", "作品名", "作品名稱", "name"],
  author: ["author", "作者"],
  statement: ["statement", "作品理念", "description", "說明"],
  category: ["category", "創作類型", "type"],
  media: ["media", "媒材"],
  dimensions: ["dimensions", "作品尺寸(cm)", "尺寸"],
  installation: ["installation", "安裝方式"],
  imageUrl: ["imageUrl", "image_url", "r2ImageUrl"],
  imageKey: ["imageKey", "r2ImageKey"],
  driveImageUrl: ["driveImageUrl", "coverImageUrl", "主圖連結", "Google Drive 圖片連結"],
};

export function normalizeWorks(rows = []) {
  return rows
    .map((row, index) => normalizeWork(row, index))
    .filter((work) => work.title || work.author);
}

function normalizeWork(row, index) {
  const title = readField(row, fieldMap.title);
  const author = readField(row, fieldMap.author);
  const galleryImages = Array.isArray(row.galleryImages) ? row.galleryImages : [];
  const galleryImageUrls = readGalleryImageUrls(row);
  const fallbackImageUrl = row.coverImage?.url || galleryImages[0]?.url || "";

  return {
    id: readField(row, fieldMap.id) || createWorkId(title, author, index),
    title,
    author,
    statement: readField(row, fieldMap.statement),
    category: readField(row, fieldMap.category),
    media: readField(row, fieldMap.media),
    dimensions: readField(row, fieldMap.dimensions),
    installation: readField(row, fieldMap.installation),
    imageUrl: readField(row, fieldMap.imageUrl) || fallbackImageUrl,
    imageKey: readField(row, fieldMap.imageKey),
    driveImageUrl: readField(row, fieldMap.driveImageUrl),
    coverImage: row.coverImage || null,
    galleryImages,
    galleryImageUrls,
    source: row,
  };
}

function readField(row, candidates) {
  const matchedKey = candidates.find((key) => row?.[key] !== undefined && row[key] !== null);
  return matchedKey ? String(row[matchedKey]).trim() : "";
}

function createWorkId(title, author, index) {
  const raw = `${title}-${author}-${index}`;
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    || `work-${index + 1}`;
}

function readGalleryImageUrls(row) {
  if (Array.isArray(row.galleryImageUrls)) {
    return row.galleryImageUrls;
  }

  return [
    "附圖1連結",
    "附圖2連結",
    "附圖3連結",
    "附圖4連結",
    "附圖5連結",
  ]
    .map((fieldName) => row?.[fieldName])
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean);
}
