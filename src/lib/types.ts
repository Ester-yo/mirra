export type ScriptBreakdown = {
  hook: string;
  demo: string;
  cta: string;
};

export type AspectRatio = "9:16" | "16:9" | "1:1" | "3:4" | "4:3";

export type Channel = "TikTok" | "Amazon" | "独立站";

export type InspirationVideo = {
  id: string;
  title: string;
  category: string;
  preset?: "服装街拍换装" | "美妆微距质感" | "日化暴力测试";
  region: "US" | "UK";
  gmv: string;
  gmvValue: number;
  plays: string;
  playsValue: number;
  duration: string;
  durationSec: number;
  daysAgo: number;
  hookType: string;
  videoUrl: string;
  posterUrl: string;
  isOfficial: boolean;
  isBookmarked: boolean;
  sourceUrl: string;
  scriptAnalysis: ScriptBreakdown;
};

export type RemixTemplate = {
  id: string;
  title: string;
  sourceUrl: string;
  videoUrl: string;
  posterUrl: string;
  script: ScriptBreakdown;
  category?: string;
  gmv?: string;
  plays?: string;
};

export type HistoryItem = {
  id: string;
  title: string;
  type: "remix" | "batch";
  status: "completed" | "failed";
  createdAt: string;
  videoUrl: string;
  posterUrl: string;
  prompt: string;
  resolution: string;
  duration: number;
};

export type BatchJob = {
  id: string;
  hookName: string;
  status: "queued" | "rendering" | "completed";
  progress: number;
  videoUrl?: string;
  posterUrl?: string;
};

export type ProductMeta = {
  title: string;
  description: string;
};

export type ToastTone = "success" | "warning" | "info";

export type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

export type CatalogProduct = {
  keywords: string[];
  title: string;
  description: string;
  images: string[];
};

export type LibraryProduct = {
  id: string;
  title: string;
  category: string;
  categoryTag?: string;
  audience?: string;
  sellingPoints: string;
  images: string[];
  videoCount: number;
  testingHooks: number;
};

export type HookOption = {
  id: string;
  name: string;
  detail: string;
  line: string;
};

export type AdStatus = "winner" | "testing" | "stopped";

export type AdRecord = {
  id: string;
  title: string;
  posterUrl: string;
  videoUrl: string;
  productId: string;
  productTitle: string;
  hookId: string;
  hookLabel: string;
  templateId: string;
  templateLabel: string;
  channel: "TikTok Ads" | "千川";
  spend: number;
  ctr: number;
  roas: number;
  status: AdStatus;
  script: ScriptBreakdown;
  experimentId: string;
  experimentName: string;
  variant: "A" | "B" | "C";
};
