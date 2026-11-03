"use client";

import { Bot, Check, Download, FolderOpen, Link2, Loader2, Lock, Package, Play, Plus, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PreviewModal } from "@/components/modals/PreviewModal";
import { ProPaywallModal } from "@/components/modals/ProPaywallModal";
import { MATRIX_HOOKS, WORKFLOW_TEMPLATES } from "@/lib/catalog";
import { CLIPS, REMIX_COST } from "@/lib/mock-data";
import { useCreationStore } from "@/store/useCreationStore";
import { buildZip } from "@/lib/zip";
import { cn, downloadBlob, downloadMp4, formatInt, readImageFiles } from "@/lib/utils";

type QueueItem = {
  id: string;
  title: string;
  status: "queued" | "rendering" | "completed";
  progress: number;
  videoUrl?: string;
  posterUrl?: string;
};

const SEED_QUEUE: QueueItem[] = [
  { id: "q-1", title: "Hook A + 街拍模板", status: "rendering", progress: 68, posterUrl: "" },
  { id: "q-2", title: "Hook B + 街拍模板", status: "queued", progress: 0 },
  {
    id: "q-3",
    title: "Hook C + 破坏流模板",
    status: "completed",
    progress: 100,
    videoUrl: CLIPS[1],
    posterUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
  },
];

export default function BatchPage() {
  const productLink = useCreationStore((state) => state.productLink);
  const productMeta = useCreationStore((state) => state.productMeta);
  const images = useCreationStore((state) => state.uploadedProductImages);
  const products = useCreationStore((state) => state.products);
  const isPro = useCreationStore((state) => state.isPro);
  const enterpriseCredits = useCreationStore((state) => state.enterpriseCredits);
  const templates = useCreationStore((state) => state.selectedTemplateIds);
  const hooks = useCreationStore((state) => state.selectedHookIds);
  const batchScript = useCreationStore((state) => state.batchScript);
  const batchMode = useCreationStore((state) => state.batchMode);
  const selectedBatchProductIds = useCreationStore((state) => state.selectedBatchProductIds);
  const unifiedTemplateId = useCreationStore((state) => state.unifiedTemplateId);
  const outputPlan = useCreationStore((state) => state.outputPlan);
  const customOutputCount = useCreationStore((state) => state.customOutputCount);
  const credits = useCreationStore((state) => state.credits);
  const setBatchMode = useCreationStore((state) => state.setBatchMode);
  const toggleBatchProduct = useCreationStore((state) => state.toggleBatchProduct);
  const setUnifiedTemplateId = useCreationStore((state) => state.setUnifiedTemplateId);
  const setOutputPlan = useCreationStore((state) => state.setOutputPlan);
  const setCustomOutputCount = useCreationStore((state) => state.setCustomOutputCount);
  const setProductLink = useCreationStore((state) => state.setProductLink);
  const parseProductLink = useCreationStore((state) => state.parseProductLink);
  const focusBodyTemplate = useCreationStore((state) => state.focusBodyTemplate);
  const toggleHookId = useCreationStore((state) => state.toggleHookId);
  const extraHooks = useCreationStore((state) => state.extraHooks);
  const appendHooks = useCreationStore((state) => state.appendHooks);
  const prepareBatchFromProduct = useCreationStore((state) => state.prepareBatchFromProduct);
  const pushToast = useCreationStore((state) => state.pushToast);

  const [mode, setMode] = useState<"link" | "pack" | "library">("link");
  const [link, setLink] = useState(productLink.startsWith("library://") ? "" : productLink);
  const [parsing, setParsing] = useState(false);
  const [pack, setPack] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [jobs, setJobs] = useState<QueueItem[]>(SEED_QUEUE);
  const [preview, setPreview] = useState<QueueItem | null>(null);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expanding, setExpanding] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");

  const allHooks = [...MATRIX_HOOKS, ...extraHooks];
  const templateFilters = ["all", "美妆个护", "服装穿搭", "3C 数码", "家居日用"] as const;
  const visibleTemplates = WORKFLOW_TEMPLATES.filter(
    (item) => selectedCategory === "all" || item.categories.includes(selectedCategory),
  );

  useEffect(() => {
    if (productLink && !productLink.startsWith("library://")) setLink(productLink);
  }, [productLink]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setJobs((current) =>
        current.map((job) =>
          job.status === "rendering" ? { ...job, progress: job.progress >= 96 ? 68 : job.progress + 2 } : job,
        ),
      );
    }, 700);
    return () => window.clearInterval(timer);
  }, []);

  const productCount = productMeta ? 1 : 0;
  const total = productCount * templates.length * hooks.length;
  const planned = outputPlan === "custom" ? customOutputCount : Number(outputPlan);
  const creditCost = planned * REMIX_COST;
  const catalogProducts = products.filter((item) => {
    const q = catalogQuery.trim().toLowerCase();
    return !q || `${item.title} ${item.category}`.toLowerCase().includes(q);
  });

  const onExtract = async () => {
    setParsing(true);
    setProductLink(link);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const ok = parseProductLink(link);
    setParsing(false);
    if (!ok) {
      pushToast("请粘贴 Amazon / TikTok Shop 商品链接", "warning");
      return;
    }
    pushToast("已提取商品标题、卖点与主图", "success");
  };

  const onPack = async (files: File[]) => {
    const imagesOnly = files.filter((file) => file.type.startsWith("image/")).slice(0, 10);
    if (!imagesOnly.length) {
      pushToast("请上传商品图片", "warning");
      return;
    }
    const urls = await readImageFiles(imagesOnly);
    setPack(urls);
    prepareBatchFromProduct({
      id: `pack-${Date.now()}`,
      title: "图片包商品",
      category: "未分类",
      sellingPoints: `已上传 ${urls.length} 张商品图，按所选模板和钩子裂变。`,
      images: urls.slice(0, 6),
      videoCount: 0,
      testingHooks: hooks.length,
    });
    pushToast(`已载入 ${urls.length} 张商品图`, "success");
  };

  const enqueue = (created: QueueItem[]) => {
    setJobs((current) => [...created, ...current]);
    created.forEach((job, index) => {
      window.setTimeout(() => {
        setJobs((current) => current.map((item) => (item.id === job.id ? { ...item, status: "rendering", progress: 12 } : item)));
      }, 400 + index * 500);
      window.setTimeout(() => {
        setJobs((current) =>
          current.map((item) =>
            item.id === job.id
              ? { ...item, status: "completed", progress: 100, videoUrl: CLIPS[index % CLIPS.length] }
              : item,
          ),
        );
      }, 2200 + index * 500);
    });
    pushToast(`已按计划排队 ${created.length} 条素材`, "success");
  };

  const onGenerate = () => {
    if (!isPro) {
      setPaywall(true);
      return;
    }
    if (batchMode === "catalog") {
      const chosen = products.filter((item) => selectedBatchProductIds.includes(item.id));
      const template = WORKFLOW_TEMPLATES.find((item) => item.id === unifiedTemplateId);
      if (!chosen.length || !template) {
        pushToast("请选择商品，并指定 1 个套版模板", "warning");
        return;
      }
      const slice = chosen.slice(0, planned);
      enqueue(
        slice.map((product) => ({
          id: `q-${product.id}-${template.id}-${Date.now()}`,
          title: `${product.title} · ${template.name}`,
          status: "queued" as const,
          progress: 0,
          posterUrl: product.images[0],
        })),
      );
      return;
    }
    if (!productMeta) {
      pushToast("请先选定一个商品", "warning");
      return;
    }
    if (!templates.length || !hooks.length) {
      pushToast("至少选择 1 个模板和 1 个钩子", "warning");
      return;
    }
    const combos = templates.flatMap((templateId) =>
      hooks.map((hookId) => {
        const template = WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        const hook = allHooks.find((item) => item.id === hookId);
        return {
          id: `q-${templateId}-${hookId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          title: `${hook?.name.split(":")[0] ?? hookId} + ${template?.name ?? templateId}`,
          status: "queued" as const,
          progress: 0,
          posterUrl: images[0],
        };
      }),
    );
    const created = Array.from({ length: planned }, (_, index) => {
      const combo = combos[index % combos.length];
      return { ...combo, id: `${combo.id}-${index}` };
    });
    enqueue(created);
  };

  const exportZip = () => {
    const done = jobs.filter((job) => job.status === "completed");
    if (!done.length) {
      pushToast("还没有已完成的素材", "warning");
      return;
    }
    downloadBlob(
      buildZip(
        done.map((job) => ({
          name: `${job.id}.txt`,
          content: `${job.title}\n${job.videoUrl || ""}`,
        })),
      ),
      "mirra-batch.zip",
    );
    pushToast(`已打包 ${done.length} 条已完成素材`, "success");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">批量生成</h1>
              <span className="rounded-full bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950 shadow-[0_0_12px_rgba(251,191,36,0.7)]">
                PRO
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">一个商品，多套模板和钩子同时赛马。</p>
          </div>
          <p className="text-sm text-slate-500">
            企业点卡 <span className="font-medium text-slate-800">{isPro ? enterpriseCredits.toLocaleString("en-US") : "未开通"}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
          {(
            [
              ["hooks", "单品多钩子 A/B 测赛马"],
              ["catalog", "多商品批量套版"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setBatchMode(id)}
              className={cn(
                "h-10 rounded-xl px-3 text-sm",
                batchMode === id ? "bg-white font-medium text-slate-900 shadow-card" : "text-slate-500",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="-mt-2 text-xs text-slate-500">
          {batchMode === "catalog"
            ? "多商品套用同一个模板，每个商品生成 1 条。"
            : "同一个商品、同一段中段演示，只赛马前 3 秒钩子。"}
        </p>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
          {batchMode === "catalog" ? (
            <div>
              <h2 className="text-sm font-medium">选择多个商品，套用同一个模板</h2>
              <p className="mt-1 text-xs text-slate-400">每个商品出 1 条，已选 {selectedBatchProductIds.length} 个。</p>
              <input
                value={catalogQuery}
                onChange={(event) => setCatalogQuery(event.target.value)}
                placeholder="搜索商品"
                className="mt-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {catalogProducts.map((product) => {
                  const on = selectedBatchProductIds.includes(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleBatchProduct(product.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border p-2 text-left",
                        on ? "border-brand bg-brand-soft" : "border-slate-100",
                      )}
                    >
                      <img src={product.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{product.title}</span>
                        <span className="text-xs text-slate-400">{product.category}</span>
                      </span>
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded-md border", on ? "border-brand bg-brand text-white" : "border-slate-200")}>
                        {on ? <Check className="h-3 w-3" /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
          <>
          <div className="mb-3 flex gap-2">
            {[
              ["link", "粘贴商品链接"],
              ["pack", "批量上传商品图包"],
              ["library", "从我的商品库选取"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id as "link" | "pack" | "library");
                  if (id === "library") setDrawer(true);
                }}
                className={cn(
                  "h-9 rounded-full px-3 text-xs",
                  mode === id ? "bg-brand text-white" : "bg-slate-50 text-slate-600",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "link" ? (
            <div className="flex gap-2">
              <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3">
                <Link2 className="h-4 w-4 text-slate-400" />
                <input
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  placeholder="粘贴 Amazon / TikTok Shop 商品链接"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={() => void onExtract()}
                disabled={parsing}
                className="h-11 rounded-xl bg-slate-900 px-4 text-sm text-white disabled:opacity-60"
              >
                {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : "提取商品"}
              </button>
            </div>
          ) : null}

          {mode === "pack" ? (
            <label
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void onPack(Array.from(event.dataTransfer.files));
              }}
              className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center"
            >
              <Upload className="h-5 w-5 text-slate-400" />
              <span className="mt-2 text-sm">拖入最多 10 张商品图</span>
              <span className="text-xs text-slate-400">或点击选择</span>
              <input
                hidden
                multiple
                type="file"
                accept="image/*"
                onChange={(event) => {
                  void onPack(Array.from(event.target.files ?? []));
                  event.target.value = "";
                }}
              />
            </label>
          ) : null}

          {mode === "library" ? (
            <button type="button" onClick={() => setDrawer(true)} className="text-sm text-brand">
              打开商品库抽屉
            </button>
          ) : null}

          {productMeta ? (
            <div className="mt-4 flex gap-3">
              <div className="flex gap-2">
                {(pack.length ? pack : images).slice(0, 6).map((src) => (
                  <img key={src} src={src} alt="" className="h-14 w-14 rounded-xl object-cover" />
                ))}
              </div>
              <div>
                <p className="text-sm font-medium">{productMeta.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{productMeta.description}</p>
              </div>
            </div>
          ) : null}
          {batchScript ? (
            <p className="mt-3 rounded-xl bg-brand-soft px-3 py-2 text-xs leading-5 text-brand-ink">
              已带入胜出脚本：{batchScript.hook}
            </p>
          ) : null}
          </>
          )}
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium">官方工作流模板</h2>
              <p className="mt-1 text-xs text-slate-400">
                {batchMode === "catalog" ? "套版模式只应用 1 个模板。" : "选定 1 个主体模板，悬停卡片可静音预览。"}
              </p>
            </div>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs"
            >
              {templateFilters.map((id) => {
                const count = id === "all" ? WORKFLOW_TEMPLATES.length : WORKFLOW_TEMPLATES.filter((item) => item.categories.includes(id)).length;
                const label = id === "all" ? "全部" : id;
                return (
                  <option key={id} value={id}>
                    {label} ({count})
                  </option>
                );
              })}
            </select>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3.5 lg:grid-cols-5">
            {visibleTemplates.map((item) => {
              const on = batchMode === "catalog" ? unifiedTemplateId === item.id : templates.includes(item.id);
              return (
                <WorkflowCard
                  key={item.id}
                  item={item}
                  checked={on}
                  onToggle={() => (batchMode === "catalog" ? setUnifiedTemplateId(item.id) : focusBodyTemplate(item.id))}
                />
              );
            })}
          </div>
          {visibleTemplates.length === 0 ? <p className="mt-3 text-sm text-slate-400">这个类目下还没有模板</p> : null}
          {batchMode === "hooks" ? (
          <>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium">前 3 秒黄金钩子裂变</h2>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={expanding}
                onClick={() => {
                  if (extraHooks.some((item) => item.id === "d")) {
                    pushToast("新钩子已经在列表里了", "warning");
                    return;
                  }
                  setExpanding(true);
                  window.setTimeout(() => {
                    appendHooks([
                      { id: "d", name: "Hook D: 价格锚点暴击流", detail: "Price Anchor", line: "Same product. Half the price of the one sitting in your cart." },
                      { id: "e", name: "Hook E: 街头路人盲测挑战", detail: "Street Blind Test", line: "We stopped 12 people. None of them guessed the price." },
                    ]);
                    setExpanding(false);
                    pushToast("已扩写 2 条新钩子", "success");
                  }, 700);
                }}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs disabled:opacity-60"
              >
                {expanding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
                {expanding ? "生成中..." : "AI 智能扩写钩子"}
              </button>
              <button
                type="button"
                onClick={() => setCustomOpen((value) => !value)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                自定义钩子
              </button>
            </div>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {allHooks.map((item) => {
              const on = hooks.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleHookId(item.id)}
                  className={cn(
                    "rounded-2xl border p-3 text-left",
                    on ? "border-brand bg-brand-soft" : "border-slate-100",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-[11px] text-slate-400">{item.detail}</p>
                    </div>
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-md border", on ? "border-brand bg-brand text-white" : "border-slate-200")}>
                      {on ? <Check className="h-3 w-3" /> : null}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{item.line}</p>
                </button>
              );
            })}
          </div>
          {customOpen ? (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const text = customText.trim();
                if (!text) {
                  pushToast("先写一句前 3 秒钩子", "warning");
                  return;
                }
                appendHooks([
                  {
                    id: `custom-${Date.now()}`,
                    name: `自定义: ${text.slice(0, 12)}`,
                    detail: "Custom Hook",
                    line: text,
                  },
                ]);
                setCustomText("");
                pushToast("自定义钩子已加入", "success");
              }}
            >
              <input
                value={customText}
                onChange={(event) => setCustomText(event.target.value)}
                placeholder="写下前 3 秒钩子脚本，回车添加"
                className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none"
              />
              <button type="submit" className="h-10 rounded-xl bg-ink px-4 text-sm text-white">
                添加
              </button>
            </form>
          ) : null}
          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            💡 当前矩阵配置：{productCount}个商品 × {templates.length}个模板 × {hooks.length}个钩子 = 将并发生成 {total} 条前 3 秒钩子赛马素材
          </p>
          </>
          ) : (
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              当前套版：{selectedBatchProductIds.length}个商品 × 1个模板 = 每个商品生成 1 条视频
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-slate-400">计划生成条数 (根据预算自选)</span>
              <select
                value={outputPlan}
                onChange={(event) => setOutputPlan(event.target.value as "3" | "5" | "10" | "custom")}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="3">3 条 (基础测款)</option>
                <option value="5">5 条 (推荐赛马组)</option>
                <option value="10">10 条 (深度起量组)</option>
                <option value="custom">自定义条数</option>
              </select>
            </label>
            {outputPlan === "custom" ? (
              <input
                type="number"
                min={1}
                max={30}
                value={customOutputCount}
                onChange={(event) => setCustomOutputCount(Number(event.target.value))}
                className="h-10 w-24 rounded-xl border border-slate-200 px-3 text-sm"
              />
            ) : null}
            <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand-ink">
              预计消耗: {formatInt(creditCost)} 算力 (当前剩余: {formatInt(credits)})
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-medium">渲染队列</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={exportZip} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm">
                <Package className="h-4 w-4" />
                批量打包下载全部 (.ZIP)
              </button>
              <button type="button" onClick={onGenerate} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-3 text-sm font-medium text-white shadow-glow">
                {isPro ? null : <Lock className="h-4 w-4" />}
                按矩阵并发生成
              </button>
            </div>
          </div>
          <ul className="divide-y divide-slate-50">
            {jobs.map((job) => (
              <li key={job.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{job.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {job.status === "rendering" ? `渲染中 ${job.progress}%` : job.status === "queued" ? "排队中" : "已完成"}
                  </p>
                  <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${job.progress}%` }} />
                  </div>
                </div>
                {job.status === "completed" ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPreview(job)} className="h-8 rounded-lg border border-slate-200 px-3 text-xs">
                      预览
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        job.videoUrl &&
                        void downloadMp4(job.videoUrl, `${job.id}.mp4`).then(() => pushToast("已开始下载 MP4", "success"))
                      }
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      下载 MP4
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {drawer ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={() => setDrawer(false)}>
          <aside className="h-full w-[min(420px,100%)] overflow-y-auto bg-white p-5 shadow-pop" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">我的商品库</h2>
              <button type="button" onClick={() => setDrawer(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    prepareBatchFromProduct(product);
                    setPack([]);
                    setDrawer(false);
                    setMode("library");
                    pushToast(`已选中 ${product.title}`, "success");
                  }}
                  className="flex w-full gap-3 rounded-2xl border border-slate-100 p-3 text-left hover:border-brand"
                >
                  <img src={product.images[0]} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <span>
                    <span className="block text-sm font-medium">{product.title}</span>
                    <span className="text-xs text-slate-400">{product.category}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1 text-xs text-slate-400">
              <FolderOpen className="h-3.5 w-3.5" />
              选中后会带入标题、卖点和主图
            </p>
          </aside>
        </div>
      ) : null}

      <ProPaywallModal open={paywall} onClose={() => setPaywall(false)} />
      <PreviewModal
        open={Boolean(preview)}
        title={preview?.title ?? ""}
        videoUrl={preview?.videoUrl ?? ""}
        posterUrl={preview?.posterUrl ?? ""}
        onClose={() => setPreview(null)}
      />
    </div>
  );
}

function WorkflowCard({
  item,
  checked,
  onToggle,
}: {
  item: (typeof WORKFLOW_TEMPLATES)[number];
  checked: boolean;
  onToggle: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-2xl border bg-white text-left",
        checked ? "border-brand ring-2 ring-brand/20" : "border-slate-100",
      )}
      onMouseEnter={() => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = true;
        void video.play().catch(() => undefined);
      }}
      onMouseLeave={() => {
        const video = videoRef.current;
        if (!video) return;
        video.pause();
        video.currentTime = 0;
      }}
    >
      <div className="relative aspect-[9/16] max-h-[168px] w-full overflow-hidden bg-slate-100">
        <img src={item.posterUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:opacity-0" />
        <video
          ref={videoRef}
          src={item.videoUrl}
          poster={item.posterUrl}
          muted
          playsInline
          loop
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition group-hover:opacity-100"
        />
        <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition group-hover:opacity-0">
          <Play className="ml-0.5 h-4 w-4 fill-white" />
        </span>
        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">{item.duration}</span>
        <button
          type="button"
          onClick={onToggle}
          aria-label={checked ? "取消选择模板" : "选择模板"}
          className={cn(
            "absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md border bg-white",
            checked ? "border-brand bg-brand text-white" : "border-slate-200 text-transparent",
          )}
        >
          <Check className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-0.5 px-2 py-1.5">
        <p className="line-clamp-1 text-xs font-semibold">
          {item.emoji} {item.name}
        </p>
        <p className="line-clamp-1 text-[11px] text-slate-400">
          {item.categories.join(" / ")} · {item.aspect}
          <span className="font-medium text-emerald-600"> 【{item.reliability}】</span>
        </p>
      </div>
    </div>
  );
}
