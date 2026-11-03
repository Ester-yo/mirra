/** GitHub Pages serves the site under /mirra. Root-relative public files need that prefix. */
export function withBase(src: string) {
  if (!src || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src)) return src;
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (!base || src === base || src.startsWith(`${base}/`)) return src;
  return `${base}${src.startsWith("/") ? src : `/${src}`}`;
}

/** Commercial clips shipped in /video. preload=metadata, so size is not a reason to swap them out. */
export const SHOWCASE_CLIPS = [
  "/video/产品展示1.mp4",
  "/video/产品展示2.mp4",
  "/video/产品展示3.mp4",
  "/video/产品展示4.mp4",
  "/video/产品展示5.mp4",
  "/video/产品展示6.mp4",
  "/video/产品展示7.mp4",
  "/video/ugc种草1.mp4",
  "/video/ugc种草2.mp4",
  "/video/内置模板视频1.mp4",
  "/video/内置模板视频2.mp4",
  "/video/批量生成视频1.mp4",
  "/video/批量生成视频2.mp4",
  "/video/批量生成视频3.mp4",
].map(withBase);

/** Still frame pulled from the matching file in /video, so the card matches the clip. */
export function posterForClip(src: string) {
  if (!src || src.startsWith("blob:") || src.startsWith("data:")) return "";
  const file = src.split("?")[0].split("/").pop() ?? "";
  const base = file.replace(/\.(mp4|mov|webm)$/i, "");
  if (!base || base === file) return "";
  return withBase(`/posters/${base}.jpg`);
}

const shot = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=960&q=75`;

/** Clean local product photos. Watermarked ads and the 3MB illustration stay out of the grid. */
export const LOCAL_FASHION = [
  "/pic/灰色裙子与白色相隔离，俯视图。时尚的校服.jpg",
  "/pic/制服鞋 - 小红书搜索.webp",
].map(withBase);

export const CURATED = {
  fashion: [
    shot("photo-1515886657613-9f3515b0c78f"),
    shot("photo-1490481651871-ab68de25d43d"),
    shot("photo-1515886657613-9f3515b0c78f"),
    shot("photo-1490481651871-ab68de25d43d"),
  ],
  beauty: [
    shot("photo-1608571423902-eed4a5ad8108"),
    shot("photo-1556228578-0d85b1a4d571"),
    shot("photo-1596462502278-27bfdc403348"),
    shot("photo-1522335789203-aabd1fc54bc9"),
  ],
  tech: [
    shot("photo-1510557880182-3d4d3cba35a5"),
    shot("photo-1505740420928-5e560c06d30e"),
    shot("photo-1526170375885-4d8ecf77b99f"),
    shot("photo-1522335789203-aabd1fc54bc9"),
  ],
  home: [
    shot("photo-1517256064527-09c73fc73e38"),
    shot("photo-1556910103-1c02745aae4d"),
    shot("photo-1519710164239-da123dc03ef4"),
    shot("photo-1611930022073-b7a4ba5fcccd"),
  ],
};

export type AssetKind = keyof typeof CURATED;

export function photosFor(kind: AssetKind, count: number, offset = 0) {
  const pool = [...(kind === "fashion" ? LOCAL_FASHION : []), ...CURATED[kind]];
  return Array.from({ length: count }, (_, index) => pool[(offset + index) % pool.length]);
}

export function fallbackClip(current = "") {
  return SHOWCASE_CLIPS.find((item) => item !== current) ?? SHOWCASE_CLIPS[0];
}

export function playbackSrc(src: string) {
  if (!src) return "";
  if (src.startsWith("blob:") || src.startsWith("data:")) return src;
  if (/pexels\.com|mixkit\.co/i.test(src)) return fallbackClip(src);
  return withBase(src);
}

export const LOCAL_TEMPLATE_CLIP = withBase("/video/内置模板视频1.mp4");
export const LOCAL_PRODUCT_CLIP = withBase("/video/产品展示3.mp4");
