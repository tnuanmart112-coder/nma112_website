const SHEET_ID = "1MxKJMaBHAe4d2xEc_IcCQQGDNk8nhfRIyQXUV7zFqaw";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
const DATA_KEY = "data/exhibitions.json";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    if (url.pathname === "/api/exhibitions" && request.method === "GET") {
      return handleGetExhibitions(request, env, ctx);
    }

    if (url.pathname.startsWith("/api/images/") && ["GET", "HEAD"].includes(request.method)) {
      return handleGetImage(request, url, env);
    }

    if (url.pathname === "/api/sync" && request.method === "POST") {
      const authResponse = await authorizeManualSync(request, env);
      if (authResponse) {
        return withCors(authResponse);
      }

      const result = await syncExhibitionData(env);
      return jsonResponse(result);
    }

    return withCors(new Response("Not found", { status: 404 }));
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(syncExhibitionData(env));
  },
};

async function handleGetExhibitions(request, env, ctx) {
  const stored = await env.EXHIBITION_BUCKET.get(DATA_KEY);
  const origin = new URL(request.url).origin;

  if (stored) {
    const payload = JSON.parse(await stored.text());
    return jsonResponse(attachImageUrls(payload, origin), {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  const syncPromise = syncExhibitionData(env);
  ctx.waitUntil(syncPromise);
  const result = await syncPromise;
  return jsonResponse(attachImageUrls(result, origin));
}

async function handleGetImage(request, url, env) {
  const key = decodeURIComponent(url.pathname.replace("/api/images/", ""));
  const object = await env.EXHIBITION_BUCKET.get(key);

  if (!object) {
    return withCors(new Response("Image not found", { status: 404 }));
  }

  return withCors(
    new Response(request.method === "HEAD" ? null : object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
        "Cache-Control": object.httpMetadata?.cacheControl || "public, max-age=86400",
      },
    }),
  );
}

async function syncExhibitionData(env) {
  const csvResponse = await fetch(env.SHEET_CSV_URL || SHEET_CSV_URL);

  if (!csvResponse.ok) {
    throw new Error(`Google Sheet CSV fetch failed: ${csvResponse.status}`);
  }

  const csvText = await csvResponse.text();
  const rows = csvToObjects(csvText);
  const works = [];
  const imageErrors = [];

  for (const [index, row] of rows.entries()) {
    const work = normalizeSheetRow(row, index);

    if (!work.title && !work.author) {
      continue;
    }

    if (work.coverImageUrl) {
      try {
        work.imageKey = await syncDriveImage(env, work.coverImageUrl, `works/${work.id}/main`);
        work.imageUrl = imageApiPath(work.imageKey);
        work.coverImage = {
          key: work.imageKey,
          url: work.imageUrl,
        };
      } catch (error) {
        imageErrors.push({
          id: work.id,
          title: work.title,
          field: "主圖連結",
          message: error instanceof Error ? error.message : "Image sync failed",
        });
      }
    }

    work.galleryImages = [];

    for (const [galleryIndex, imageUrl] of work.galleryImageUrls.entries()) {
      try {
        const imageKey = await syncDriveImage(
          env,
          imageUrl,
          `works/${work.id}/gallery-${String(galleryIndex + 1).padStart(2, "0")}`,
        );

        work.galleryImages.push({
          key: imageKey,
          url: imageApiPath(imageKey),
        });
      } catch (error) {
        imageErrors.push({
          id: work.id,
          title: work.title,
          field: `附圖${galleryIndex + 1}連結`,
          message: error instanceof Error ? error.message : "Gallery image sync failed",
        });
      }
    }

    works.push(work);
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    count: works.length,
    imageErrors,
    works,
  };

  await env.EXHIBITION_BUCKET.put(DATA_KEY, JSON.stringify(payload, null, 2), {
    httpMetadata: {
      contentType: "application/json; charset=utf-8",
      cacheControl: "public, max-age=60",
    },
  });

  return payload;
}

function attachImageUrls(payload, origin) {
  return {
    ...payload,
    works: (payload.works || []).map((work) => ({
      ...work,
      imageUrl: work.imageKey ? `${origin}${imageApiPath(work.imageKey)}` : work.imageUrl,
      coverImage: work.coverImage
        ? {
            ...work.coverImage,
            url: work.coverImage.key ? `${origin}${imageApiPath(work.coverImage.key)}` : work.coverImage.url,
          }
        : null,
      galleryImages: (work.galleryImages || []).map((image) => ({
        ...image,
        url: image.key ? `${origin}${imageApiPath(image.key)}` : image.url,
      })),
    })),
  };
}

function imageApiPath(imageKey) {
  return `/api/images/${encodeURIComponent(imageKey)}`;
}

async function syncDriveImage(env, driveImageUrl, keyBase) {
  const fileId = extractDriveFileId(driveImageUrl);

  if (!fileId) {
    throw new Error("Google Drive file id not found");
  }

  const imageResponse = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`);

  if (!imageResponse.ok || !imageResponse.body) {
    throw new Error(`Google Drive image fetch failed: ${imageResponse.status}`);
  }

  const contentType = imageResponse.headers.get("Content-Type") || "application/octet-stream";

  if (contentType.includes("text/html")) {
    throw new Error("Google Drive returned HTML instead of an image; check sharing permission");
  }

  const extension = contentTypeToExtension(contentType);
  const imageKey = `${keyBase}${extension}`;

  await env.EXHIBITION_BUCKET.put(imageKey, imageResponse.body, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  return imageKey;
}

function normalizeSheetRow(row, index) {
  const title = clean(row["作品名"]);
  const author = clean(row["作者"]);
  const coverImageUrl = clean(row["主圖連結"]) || clean(row["Google Drive 圖片連結"]);

  return {
    id: slugify(`${title}-${author}-${index + 1}`),
    title,
    author,
    statement: clean(row["作品理念"]),
    category: clean(row["創作類型"]),
    media: clean(row["媒材"]),
    dimensions: clean(row["作品尺寸(cm)"]),
    installation: clean(row["安裝方式"]),
    driveImageUrl: coverImageUrl,
    coverImageUrl,
    galleryImageUrls: readGalleryImageUrls(row),
    raw: row,
  };
}

function readGalleryImageUrls(row) {
  return [
    "附圖1連結",
    "附圖2連結",
    "附圖3連結",
    "附圖4連結",
    "附圖5連結",
  ]
    .map((fieldName) => clean(row[fieldName]))
    .filter(Boolean);
}

function csvToObjects(csvText) {
  const rows = parseCsv(csvText);
  const headerIndex = findHeaderIndex(rows);
  const headers = rows[headerIndex] || [];

  return rows.slice(headerIndex + 1).map((row) => {
    const object = {};

    headers.forEach((header, index) => {
      object[header.trim()] = row[index] || "";
    });

    return object;
  });
}

function findHeaderIndex(rows) {
  const index = rows.findIndex((row) => row.includes("作品名") && row.includes("作者"));
  return index >= 0 ? index : 0;
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function extractDriveFileId(url) {
  const patterns = [
    /\/file\/d\/([^/]+)/,
    /[?&]id=([^&]+)/,
    /\/open\?id=([^&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function contentTypeToExtension(contentType) {
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return ".jpg";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("gif")) return ".gif";
  return "";
}

function clean(value) {
  return String(value || "").trim();
}

function slugify(value) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "");

  return slug || crypto.randomUUID();
}

async function authorizeManualSync(request, env) {
  if (!env.SYNC_TOKEN) {
    return new Response("Manual sync token is not configured", { status: 403 });
  }

  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token || !(await timingSafeEqual(token, env.SYNC_TOKEN))) {
    return new Response("Unauthorized", { status: 401 });
  }

  return null;
}

async function timingSafeEqual(actual, expected) {
  const encoder = new TextEncoder();
  const actualBytes = encoder.encode(actual);
  const expectedBytes = encoder.encode(expected);

  if (actualBytes.length !== expectedBytes.length) {
    return false;
  }

  const actualDigest = await crypto.subtle.digest("SHA-256", actualBytes);
  const expectedDigest = await crypto.subtle.digest("SHA-256", expectedBytes);
  const actualArray = new Uint8Array(actualDigest);
  const expectedArray = new Uint8Array(expectedDigest);

  let difference = 0;
  for (let index = 0; index < actualArray.length; index += 1) {
    difference |= actualArray[index] ^ expectedArray[index];
  }

  return difference === 0;
}

function jsonResponse(payload, init = {}) {
  return withCors(
    new Response(JSON.stringify(payload, null, 2), {
      ...init,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...(init.headers || {}),
      },
    }),
  );
}

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
