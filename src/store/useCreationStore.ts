"use client";

import { create } from "zustand";
import { LIBRARY_PRODUCTS, SEED_ADS } from "@/lib/catalog";
import {
  BATCH_UNIT_COST,
  CLIPS,
  HOOKS,
  INSPIRATION,
  LOCALES,
  MODELS,
  REMIX_COST,
  SEED_HISTORY,
  matchProduct,
  pickResultClip,
} from "@/lib/mock-data";
import type {
  AdRecord,
  AspectRatio,
  BatchJob,
  HistoryItem,
  HookOption,
  LibraryProduct,
  ProductMeta,
  RemixTemplate,
  ScriptBreakdown,
  ToastItem,
  ToastTone,
} from "@/lib/types";
import { buildPrompt } from "@/lib/utils";

type TemplateInput = {
  id: string;
  title: string;
  sourceUrl?: string;
  videoUrl: string;
  posterUrl: string;
  script?: ScriptBreakdown;
  scriptAnalysis?: ScriptBreakdown;
  category?: string;
  gmv?: string;
  plays?: string;
};

type CreationState = {
  currentTemplate: RemixTemplate | null;
  uploadedProductImages: string[];
  productLink: string;
  productMeta: ProductMeta | null;
  model: string;
  resolution: "480P" | "720P";
  aspectRatio: AspectRatio;
  duration: number;
  durationAuto: boolean;
  keyframes: [string, string, string];
  products: LibraryProduct[];
  ads: AdRecord[];
  selectedTemplateIds: string[];
  selectedHookIds: string[];
  extraHooks: HookOption[];
  batchScript: ScriptBreakdown | null;
  activeProductId: string | null;
  currentProductForStudio: LibraryProduct | null;
  batchMode: "hooks" | "catalog";
  selectedBatchProductIds: string[];
  unifiedTemplateId: string;
  outputPlan: "3" | "5" | "10" | "custom";
  customOutputCount: number;
  region: "US" | "UK";
  language: "EN";
  credits: number;
  enterpriseCredits: number;
  isPro: boolean;
  bookmarkedIds: string[];
  history: HistoryItem[];
  genStatus: "idle" | "running" | "done";
  genProgress: number;
  genStage: string;
  genResultUrl: string | null;
  batchJobs: BatchJob[];
  studioTab: "results" | "cases";
  toasts: ToastItem[];
  selectTemplateForRemix: (template: TemplateInput) => void;
  updateScriptField: (field: keyof ScriptBreakdown, value: string) => void;
  addProductImages: (urls: string[]) => void;
  removeProductImage: (url: string) => void;
  setProductLink: (value: string) => void;
  parseProductLink: (url: string) => boolean;
  setModel: (value: string) => void;
  setResolution: (value: "480P" | "720P") => void;
  setDuration: (value: number) => void;
  setDurationAuto: (value: boolean) => void;
  setAspectRatio: (value: AspectRatio) => void;
  setKeyframe: (index: number, url: string) => void;
  setRegion: (value: "US" | "UK") => void;
  addLibraryProduct: (product: LibraryProduct) => void;
  updateLibraryProduct: (product: LibraryProduct) => void;
  removeLibraryProduct: (id: string) => void;
  updateAdMetrics: (id: string, patch: Partial<Pick<AdRecord, "spend" | "ctr" | "roas" | "status">>) => void;
  appendHooks: (hooks: HookOption[]) => void;
  loadProductIntoRemix: (product: LibraryProduct) => void;
  prepareBatchFromProduct: (product: LibraryProduct) => void;
  setBatchMode: (mode: "hooks" | "catalog") => void;
  toggleBatchProduct: (id: string) => void;
  setUnifiedTemplateId: (id: string) => void;
  setOutputPlan: (plan: "3" | "5" | "10" | "custom") => void;
  setCustomOutputCount: (count: number) => void;
  prepareBatchFromAd: (ad: AdRecord) => void;
  toggleTemplateId: (id: string) => void;
  focusBodyTemplate: (id: string) => void;
  toggleHookId: (id: string) => void;
  addAdRecord: (ad: AdRecord) => void;
  setStudioTab: (value: "results" | "cases") => void;
  resetStudio: () => void;
  toggleBookmark: (id: string) => void;
  pushToast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: string) => void;
  addCredits: (amount: number) => void;
  startGeneration: () => boolean;
  seedProductFromTemplate: () => void;
  startBatch: (hookIds: string[]) => "paywall" | "hooks" | "noproduct" | "credits" | "ok";
  unlockPro: (plan: string) => void;
};

let genToken = 0;
let timers: number[] = [];
let batchTimers: number[] = [];

function clearTimers() {
  timers.forEach((id) => window.clearTimeout(id));
  timers = [];
}

function clearBatchTimers() {
  batchTimers.forEach((id) => window.clearTimeout(id));
  batchTimers = [];
}

function toTemplate(input: TemplateInput): RemixTemplate {
  const script = input.script ?? input.scriptAnalysis ?? { hook: "", demo: "", cta: "" };
  return {
    id: input.id,
    title: input.title,
    sourceUrl: input.sourceUrl || `https://www.tiktok.com/@shop/video/${input.id}`,
    videoUrl: input.videoUrl,
    posterUrl: input.posterUrl,
    script: { hook: script.hook, demo: script.demo, cta: script.cta },
    category: input.category,
    gmv: input.gmv,
    plays: input.plays,
  };
}

function withProductScript(script: ScriptBreakdown, product: LibraryProduct): ScriptBreakdown {
  const tag = `商品: ${product.title}（${product.category}）。${product.sellingPoints}`;
  if (script.demo.includes(product.title)) return script;
  return { ...script, demo: script.demo ? `${script.demo}\n${tag}` : tag };
}

function localeLabel(region: "US" | "UK") {
  return LOCALES.find((item) => item.id === region)?.label ?? LOCALES[0].label;
}

export const useCreationStore = create<CreationState>((set, get) => ({
  currentTemplate: null,
  uploadedProductImages: [],
  productLink: "",
  productMeta: null,
  model: MODELS[0],
  resolution: "720P",
  aspectRatio: "9:16",
  duration: 15,
  durationAuto: false,
  keyframes: ["", "", ""],
  products: LIBRARY_PRODUCTS,
  ads: SEED_ADS,
  selectedTemplateIds: ["street"],
  selectedHookIds: ["a", "b", "c"],
  extraHooks: [],
  batchScript: null,
  activeProductId: null,
  currentProductForStudio: null,
  batchMode: "hooks",
  selectedBatchProductIds: [],
  unifiedTemplateId: "street",
  outputPlan: "3",
  customOutputCount: 3,
  region: "US",
  language: "EN",
  credits: 2000,
  enterpriseCredits: 0,
  isPro: false,
  bookmarkedIds: INSPIRATION.filter((item) => item.isBookmarked).map((item) => item.id),
  history: SEED_HISTORY,
  genStatus: "idle",
  genProgress: 0,
  genStage: "",
  genResultUrl: null,
  batchJobs: [],
  studioTab: "results",
  toasts: [],

  selectTemplateForRemix: (template) => {
    if (get().genStatus === "running") {
      get().pushToast("当前成片还在渲染，完成后再切换参考视频", "warning");
      return;
    }
    genToken += 1;
    clearTimers();
    const next = toTemplate(template);
    const product = get().currentProductForStudio;
    if (product) next.script = withProductScript(next.script, product);
    const frame = next.posterUrl || "";
    set({
      currentTemplate: next,
      keyframes: [frame, frame, frame],
      genStatus: "idle",
      genProgress: 0,
      genStage: "",
      genResultUrl: null,
      studioTab: "results",
    });
  },

  updateScriptField: (field, value) => {
    const current = get().currentTemplate;
    if (!current) return;
    set({ currentTemplate: { ...current, script: { ...current.script, [field]: value } } });
  },

  addProductImages: (urls) => {
    const next = [...get().uploadedProductImages];
    urls.forEach((url) => {
      if (next.length < 6 && !next.includes(url)) next.push(url);
    });
    set({ uploadedProductImages: next });
  },

  removeProductImage: (url) => {
    set({ uploadedProductImages: get().uploadedProductImages.filter((item) => item !== url) });
  },

  setProductLink: (value) => set({ productLink: value }),

  parseProductLink: (url) => {
    const product = matchProduct(url);
    if (!product) return false;
    set({
      productLink: url.trim(),
      productMeta: { title: product.title, description: product.description },
      uploadedProductImages: product.images.slice(0, 6),
    });
    return true;
  },

  setModel: (value) => set({ model: value }),
  setResolution: (value) => set({ resolution: value }),
  setDuration: (value) => set({ duration: value, durationAuto: false }),
  setDurationAuto: (value) => set({ durationAuto: value, duration: value ? 15 : get().duration }),
  setAspectRatio: (value) => set({ aspectRatio: value }),
  setKeyframe: (index, url) => {
    const next = [...get().keyframes] as [string, string, string];
    next[index] = url;
    set({ keyframes: next });
  },
  setRegion: (value) => set({ region: value }),
  addLibraryProduct: (product) => set({ products: [product, ...get().products] }),
  updateLibraryProduct: (product) =>
    set({
      products: get().products.map((item) => (item.id === product.id ? product : item)),
      currentProductForStudio: get().currentProductForStudio?.id === product.id ? product : get().currentProductForStudio,
    }),
  removeLibraryProduct: (id) =>
    set({
      products: get().products.filter((item) => item.id !== id),
      currentProductForStudio: get().currentProductForStudio?.id === id ? null : get().currentProductForStudio,
      selectedBatchProductIds: get().selectedBatchProductIds.filter((item) => item !== id),
    }),
  updateAdMetrics: (id, patch) =>
    set({
      ads: get().ads.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }),
  appendHooks: (hooks) => {
    const existing = new Set(get().extraHooks.map((item) => item.id));
    const fresh = hooks.filter((item) => !existing.has(item.id));
    if (!fresh.length) return;
    set({ extraHooks: [...get().extraHooks, ...fresh] });
  },
  loadProductIntoRemix: (product) => {
    const current = get().currentTemplate;
    set({
      currentProductForStudio: product,
      activeProductId: product.id,
      productLink: `library://${product.id}`,
      productMeta: { title: product.title, description: product.sellingPoints },
      uploadedProductImages: product.images.slice(0, 6),
      currentTemplate: current
        ? { ...current, category: product.category, script: withProductScript(current.script, product) }
        : current,
    });
    get().pushToast(`已成功载入商品: ${product.title}`, "success");
  },
  setBatchMode: (mode) => set({ batchMode: mode }),
  toggleBatchProduct: (id) => {
    const current = get().selectedBatchProductIds;
    set({
      selectedBatchProductIds: current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    });
  },
  setUnifiedTemplateId: (id) => set({ unifiedTemplateId: id }),
  setOutputPlan: (plan) => set({ outputPlan: plan }),
  setCustomOutputCount: (count) => set({ customOutputCount: Math.max(1, Math.min(30, count || 1)) }),
  prepareBatchFromProduct: (product) =>
    set({
      activeProductId: product.id,
      productLink: `library://${product.id}`,
      productMeta: { title: product.title, description: product.sellingPoints },
      uploadedProductImages: product.images.slice(0, 6),
      batchScript: null,
      selectedTemplateIds: ["street"],
      selectedHookIds: ["a", "b", "c"],
    }),
  prepareBatchFromAd: (ad) => {
    const product = get().products.find((item) => item.id === ad.productId);
    set({
      activeProductId: ad.productId,
      productLink: product ? `library://${product.id}` : "",
      productMeta: {
        title: ad.productTitle,
        description: product?.sellingPoints || ad.script.hook,
      },
      uploadedProductImages: product?.images.slice(0, 6) ?? (ad.posterUrl ? [ad.posterUrl] : []),
      batchScript: ad.script,
      selectedTemplateIds: [ad.templateId],
      selectedHookIds: [ad.hookId],
      currentTemplate: {
        id: ad.id,
        title: ad.title,
        sourceUrl: ad.videoUrl,
        videoUrl: ad.videoUrl,
        posterUrl: ad.posterUrl,
        script: ad.script,
        category: product?.category,
      },
    });
  },
  toggleTemplateId: (id) => {
    const current = get().selectedTemplateIds;
    set({
      selectedTemplateIds: current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    });
  },
  focusBodyTemplate: (id) => set({ selectedTemplateIds: [id] }),
  toggleHookId: (id) => {
    const current = get().selectedHookIds;
    set({
      selectedHookIds: current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    });
  },
  addAdRecord: (ad) => set({ ads: [ad, ...get().ads] }),
  setStudioTab: (value) => set({ studioTab: value }),

  resetStudio: () => {
    genToken += 1;
    clearTimers();
    set({
      currentTemplate: null,
      uploadedProductImages: [],
      productLink: "",
      productMeta: null,
      genStatus: "idle",
      genProgress: 0,
      genStage: "",
      genResultUrl: null,
      model: MODELS[0],
      resolution: "720P",
      duration: 15,
      durationAuto: false,
      aspectRatio: "9:16",
      keyframes: ["", "", ""],
      region: "US",
      batchScript: null,
      currentProductForStudio: null,
    });
  },

  toggleBookmark: (id) => {
    const ids = get().bookmarkedIds;
    set({
      bookmarkedIds: ids.includes(id) ? ids.filter((item) => item !== id) : [id, ...ids],
    });
  },

  pushToast: (message, tone = "info") => {
    const id = `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    set({ toasts: [...get().toasts, { id, message, tone }] });
    window.setTimeout(() => get().dismissToast(id), 3400);
  },

  dismissToast: (id) => set({ toasts: get().toasts.filter((item) => item.id !== id) }),

  addCredits: (amount) => set({ credits: get().credits + amount }),

  startGeneration: () => {
    const state = get();
    if (state.genStatus === "running") return false;
    if (!state.currentTemplate) {
      state.pushToast("请先解析链接或上传参考视频", "warning");
      return false;
    }
    if (state.credits < REMIX_COST) {
      state.pushToast(`算力不足，生成需要 ${REMIX_COST}，当前剩余 ${state.credits}`, "warning");
      return false;
    }

    const template = state.currentTemplate;
    const creditsAfter = state.credits - REMIX_COST;
    const duration = state.duration;
    const resultUrl = pickResultClip(template.videoUrl);
    const token = ++genToken;
    clearTimers();

    set({
      credits: creditsAfter,
      genStatus: "running",
      genProgress: 12,
      genStage: "阶段 1/3: 智能提取分镜与骨骼重绘",
      genResultUrl: null,
      studioTab: "results",
    });

    if (creditsAfter < REMIX_COST) {
      state.pushToast(
        creditsAfter === 0 ? "算力已用尽，这条成片完成后需要充值" : `算力偏低，剩余 ${creditsAfter}，不够下一条`,
        "warning",
      );
    }

    const schedule = (delay: number, progress: number, stage: string) => {
      timers.push(
        window.setTimeout(() => {
          if (token !== genToken) return;
          set({ genProgress: progress, genStage: stage });
        }, delay),
      );
    };

    schedule(700, 35, "阶段 1/3: 智能提取分镜与骨骼重绘");
    schedule(1600, 70, "阶段 2/3: 注入商品物理光影渲染");
    schedule(2800, 95, "阶段 3/3: 地道美式英语配音与字幕合成");

    timers.push(
      window.setTimeout(() => {
        if (token !== genToken) return;
        const latest = get();
        const current = latest.currentTemplate ?? template;
        const item: HistoryItem = {
          id: `h-${Date.now()}`,
          title: current.title,
          type: "remix",
          status: "completed",
          createdAt: new Date().toISOString(),
          videoUrl: resultUrl,
          posterUrl: current.posterUrl,
          prompt: buildPrompt({
            title: current.title,
            script: current.script,
            model: latest.model,
            resolution: latest.resolution,
            duration,
            locale: localeLabel(latest.region),
          }),
          resolution: latest.resolution,
          duration,
        };
        set({
          genStatus: "done",
          genProgress: 100,
          genStage: "成片已就绪",
          genResultUrl: resultUrl,
          history: [item, ...latest.history],
        });
        get().pushToast("成片已生成，并写入历史记录", "success");
      }, 4000),
    );

    return true;
  },

  seedProductFromTemplate: () => {
    const template = get().currentTemplate;
    if (!template || get().productMeta) return;
    set({
      productLink: template.sourceUrl,
      productMeta: {
        title: template.title,
        description: `${template.script.hook} / ${template.script.demo} / ${template.script.cta}`,
      },
      uploadedProductImages: template.posterUrl
        ? [template.posterUrl, ...get().uploadedProductImages].slice(0, 6)
        : get().uploadedProductImages,
    });
  },

  startBatch: (hookIds) => {
    const state = get();
    if (!state.isPro) return "paywall";
    if (hookIds.length < 3 || hookIds.length > 5) return "hooks";
    if (!state.productMeta) return "noproduct";
    const cost = hookIds.length * BATCH_UNIT_COST;
    if (state.enterpriseCredits < cost) return "credits";

    clearBatchTimers();
    const selected = HOOKS.filter((item) => hookIds.includes(item.id));
    const posterUrl = state.uploadedProductImages[0] || "";
    const meta = state.productMeta;
    const jobs: BatchJob[] = selected.map((hook) => ({
      id: `b-${hook.id}-${Date.now()}`,
      hookName: hook.name,
      status: "queued",
      progress: 0,
    }));

    set({ enterpriseCredits: state.enterpriseCredits - cost, batchJobs: jobs });

    jobs.forEach((job, index) => {
      const hook = selected[index];
      batchTimers.push(
        window.setTimeout(() => {
          set({
            batchJobs: get().batchJobs.map((item) =>
              item.id === job.id ? { ...item, status: "rendering", progress: 48 } : item,
            ),
          });
        }, 350 + index * 650),
      );
      batchTimers.push(
        window.setTimeout(() => {
          const videoUrl = CLIPS[index % CLIPS.length];
          const latest = get();
          const record: HistoryItem = {
            id: `h-${job.id}`,
            title: `${meta.title} · ${hook.name.split(":")[0]}`,
            type: "batch",
            status: "completed",
            createdAt: new Date().toISOString(),
            videoUrl,
            posterUrl,
            prompt: buildPrompt({
              title: meta.title,
              script: {
                hook: hook.line,
                demo: meta.description,
                cta: "Limited drop. Tap the product card.",
              },
              model: latest.model,
              resolution: "720P",
              duration: 15,
              locale: localeLabel(latest.region),
              hookName: hook.name,
            }),
            resolution: "720P",
            duration: 15,
          };
          set({
            batchJobs: get().batchJobs.map((item) =>
              item.id === job.id ? { ...item, status: "completed", progress: 100, videoUrl, posterUrl } : item,
            ),
            history: [record, ...get().history.filter((item) => item.id !== record.id)],
          });
          if (index === jobs.length - 1) {
            get().pushToast(`已完成 ${jobs.length} 条裂变，并写入历史记录`, "success");
          }
        }, 1700 + index * 650),
      );
    });

    return "ok";
  },

  unlockPro: (plan) => {
    set({ isPro: true, enterpriseCredits: get().enterpriseCredits + 5000 });
    get().pushToast(`已开通${plan}，企业点卡 +5,000`, "success");
  },
}));
