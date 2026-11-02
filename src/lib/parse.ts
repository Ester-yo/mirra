import { CLIPS, EXTERNAL_SCRIPT, INSPIRATION } from "@/lib/mock-data";
import type { InspirationVideo } from "@/lib/types";

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

export function parseReferenceInput(raw: string): InspirationVideo | null {
  const url = raw.trim();
  if (!url) return null;
  const looksLikeLink = /tiktok|douyin|vm\.|vt\.|youtube|instagram|amazon|http/i.test(url);
  if (!looksLikeLink) return null;

  const known = INSPIRATION.find(
    (item) => url.includes(item.id) || url.toLowerCase().includes(item.title.toLowerCase().slice(0, 12)),
  );
  if (known) return { ...known, sourceUrl: url };

  const base = INSPIRATION[0];
  return {
    ...base,
    id: `parsed-${hash(url)}`,
    title: "外部链接 · 爆款结构已解构",
    sourceUrl: url,
    videoUrl: CLIPS[0],
    isOfficial: false,
    isBookmarked: false,
    scriptAnalysis: { ...EXTERNAL_SCRIPT },
  };
}
