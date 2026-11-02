"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ANALYTICS_SUMMARY, MATRIX_HOOKS, WORKFLOW_TEMPLATES } from "@/lib/catalog";
import type { AdRecord, AdStatus } from "@/lib/types";
import { useCreationStore } from "@/store/useCreationStore";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<AdStatus, string> = {
  winner: "跑量爆单",
  testing: "保本测试中",
  stopped: "跑输停投",
};

export default function AnalyticsPage() {
  return (
    <Suspense fallback={null}>
      <AnalyticsBoard />
    </Suspense>
  );
}

function AnalyticsBoard() {
  const router = useRouter();
  const params = useSearchParams();
  const productFromUrl = params.get("product") ?? "all";
  const ads = useCreationStore((state) => state.ads);
  const products = useCreationStore((state) => state.products);
  const history = useCreationStore((state) => state.history);
  const addAdRecord = useCreationStore((state) => state.addAdRecord);
  const prepareBatchFromAd = useCreationStore((state) => state.prepareBatchFromAd);
  const pushToast = useCreationStore((state) => state.pushToast);

  const [productId, setProductId] = useState(productFromUrl);
  const [externalVideo, setExternalVideo] = useState("");
  const [status, setStatus] = useState<"all" | AdStatus>("all");
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [compare, setCompare] = useState<AdRecord | null>(null);
  const [draft, setDraft] = useState({
    source: "history",
    historyId: "",
    title: "",
    productId: products[0]?.id ?? "",
    hookId: "a",
    templateId: "street",
    channel: "TikTok Ads" as AdRecord["channel"],
    spend: "200",
    ctr: "2.5",
    status: "testing" as AdStatus,
  });

  useEffect(() => {
    setProductId(productFromUrl);
  }, [productFromUrl]);

  const rows = useMemo(() => {
    return ads.filter((item) => {
      if (productId !== "all" && item.productId !== productId) return false;
      if (status !== "all" && item.status !== status) return false;
      if (query && !`${item.title} ${item.productTitle} ${item.hookLabel} ${item.experimentName}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [ads, productId, status, query]);

  const groups = useMemo(() => {
    const order: { id: string; name: string; rows: AdRecord[] }[] = [];
    rows.forEach((item) => {
      const found = order.find((group) => group.id === item.experimentId);
      if (found) found.rows.push(item);
      else order.push({ id: item.experimentId, name: item.experimentName, rows: [item] });
    });
    return order;
  }, [rows]);

  const submit = () => {
    const product = products.find((item) => item.id === draft.productId);
    const historyItem = history.find((item) => item.id === draft.historyId);
    const hook = MATRIX_HOOKS.find((item) => item.id === draft.hookId);
    const template = WORKFLOW_TEMPLATES.find((item) => item.id === draft.templateId);
    if (!product || !hook || !template) return;
    if (!historyItem && !externalVideo) {
      pushToast("请选择已渲染视频，或上传一条外部 MP4", "warning");
      return;
    }
    const videoUrl = externalVideo || historyItem?.videoUrl || product.images[0];
    addAdRecord({
      id: `ad-${Date.now()}`,
      title: draft.title.trim() || historyItem?.title || `${product.title} 回传`,
      posterUrl: historyItem?.posterUrl || product.images[0],
      videoUrl,
      productId: product.id,
      productTitle: product.title,
      hookId: hook.id,
      hookLabel: hook.name,
      templateId: template.id,
      templateLabel: template.name,
      channel: draft.channel,
      spend: Number(draft.spend) || 0,
      ctr: Number(draft.ctr) || 0,
      roas: 1,
      status: draft.status,
      script: {
        hook: hook.line,
        demo: product.sellingPoints,
        cta: "沿用胜出版本的价格锚点",
      },
      experimentId: `exp-${product.id}`,
      experimentName: `${product.title} - 前 3 秒钩子对决赛马`,
      variant: draft.hookId === "b" ? "B" : draft.hookId === "c" ? "C" : "A",
    });
    pushToast("投放数据已回传", "success");
    setUploadOpen(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">投放看板 & A/B测</h1>
            <p className="mt-1 text-sm text-slate-500">看哪条钩子在花钱，胜出的结构可以直接再裂变。</p>
          </div>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="h-10 rounded-xl bg-brand px-4 text-sm font-medium text-white shadow-glow"
          >
            手动回传投放视频与数据
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["累计测试素材", `${ANALYTICS_SUMMARY.tested} 条`],
            ["平均 CTR", ANALYTICS_SUMMARY.ctr],
            ["跑量爆款素材数", `${ANALYTICS_SUMMARY.winners} 条`],
            ["A/B 测试胜出率", ANALYTICS_SUMMARY.winRate],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索素材或商品"
              className="h-full bg-transparent text-sm outline-none"
            />
          </div>
          <select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="all">全部商品</option>
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          {(
            [
              ["all", "全部状态"],
              ["winner", "🟢 跑量爆单"],
              ["testing", "🟡 保本测试中"],
              ["stopped", "🔴 跑输停投"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatus(id)}
              className={cn(
                "h-10 rounded-full px-3 text-xs",
                status === id ? "bg-brand text-white" : "bg-white text-slate-600 ring-1 ring-slate-200",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium">A/B 测赛马实验组</h2>
          {groups.map((group) => {
            const best = Math.max(...group.rows.map((item) => item.ctr));
            return (
              <section key={group.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-medium">{group.name}</p>
                  <p className="mt-1 text-xs text-slate-400">同一商品、同一段演示，只对比前 3 秒钩子。</p>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-400">
                    <tr>
                      <th className="px-3 py-3 font-medium">视频</th>
                      <th className="px-3 py-3 font-medium">关联商品</th>
                      <th className="px-3 py-3 font-medium">钩子变体</th>
                      <th className="px-3 py-3 font-medium">渠道</th>
                      <th className="px-3 py-3 font-medium">消耗</th>
                      <th className="px-3 py-3 font-medium">CTR</th>
                      <th className="px-3 py-3 font-medium">ROAS</th>
                      <th className="px-3 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((item) => {
                      const winner = item.ctr === best;
                      const ctrLabel = Number.isInteger(item.ctr * 10) ? item.ctr.toFixed(1) : item.ctr.toFixed(2);
                      return (
                        <tr key={item.id} className="border-t border-slate-50">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <img src={item.posterUrl} alt="" className="h-14 w-10 rounded-lg object-cover" />
                              <div>
                                <p className="max-w-[180px] font-medium">{item.title}</p>
                                <p className="text-[11px] text-slate-400">{STATUS_LABEL[item.status]}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-600">{item.productTitle}</td>
                          <td className="px-3 py-3 text-xs text-slate-600">
                            Variant {item.variant} ({item.hookLabel})
                            {winner ? <span className="mt-1 block font-medium text-amber-600">👑 胜出版本</span> : null}
                          </td>
                          <td className="px-3 py-3 text-xs">{item.channel}</td>
                          <td className="px-3 py-3">${item.spend.toLocaleString("en-US")}</td>
                          <td className="px-3 py-3">
                            <span className={cn("rounded-full px-2 py-0.5 text-xs", item.ctr > 3 ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500")}>
                              {ctrLabel}%{item.ctr > 3 ? " 🔥 高点击" : ""}
                            </span>
                          </td>
                          <td className="px-3 py-3">{item.roas.toFixed(1)}</td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col items-start gap-1">
                              <button type="button" onClick={() => setCompare(item)} className="text-xs text-slate-600 hover:text-brand">
                                查看对比
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  prepareBatchFromAd(item);
                                  router.push("/studio/batch");
                                }}
                                className="text-left text-xs text-brand"
                              >
                                ⚡️ 基于此胜出版本再裂变
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            );
          })}
          {groups.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-400">这个筛选下没有投放记录</p> : null}
        </div>
      </div>

      <Dialog.Root open={uploadOpen} onOpenChange={setUploadOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(520px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 shadow-pop focus:outline-none">
            <div className="mb-3 flex items-start justify-between">
              <Dialog.Title className="text-base font-semibold">回传投放视频与数据</Dialog.Title>
              <Dialog.Close className="rounded-lg p-1 text-slate-400">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mb-3 text-xs text-slate-400">上传外部 MP4，或选择一条已生成的成片，再补上消耗、点击率和状态。</Dialog.Description>
            <div className="space-y-3 text-sm">
              <label className="flex h-16 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                {externalVideo ? "已选择外部 MP4" : "上传外部 MP4"}
                <input
                  hidden
                  type="file"
                  accept="video/mp4,video/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setExternalVideo(URL.createObjectURL(file));
                    event.target.value = "";
                  }}
                />
              </label>
              <select
                value={draft.historyId}
                onChange={(event) => setDraft({ ...draft, historyId: event.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 px-3"
              >
                <option value="">选择已渲染视频</option>
                {history
                  .filter((item) => item.status === "completed")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
              </select>
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="对外标题，可留空"
                className="h-10 w-full rounded-xl border border-slate-200 px-3"
              />
              <select
                value={draft.productId}
                onChange={(event) => setDraft({ ...draft, productId: event.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 px-3"
              >
                {products.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <select
                value={draft.hookId}
                onChange={(event) => setDraft({ ...draft, hookId: event.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 px-3"
              >
                {MATRIX_HOOKS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                value={draft.templateId}
                onChange={(event) => setDraft({ ...draft, templateId: event.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 px-3"
              >
                {WORKFLOW_TEMPLATES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                value={draft.channel}
                onChange={(event) => setDraft({ ...draft, channel: event.target.value as AdRecord["channel"] })}
                className="h-10 w-full rounded-xl border border-slate-200 px-3"
              >
                <option>TikTok Ads</option>
                <option>千川</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={draft.spend}
                  onChange={(event) => setDraft({ ...draft, spend: event.target.value })}
                  placeholder="消耗 $"
                  className="h-10 rounded-xl border border-slate-200 px-3"
                />
                <input
                  value={draft.ctr}
                  onChange={(event) => setDraft({ ...draft, ctr: event.target.value })}
                  placeholder="CTR %"
                  className="h-10 rounded-xl border border-slate-200 px-3"
                />
              </div>
              <select
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as AdStatus })}
                className="h-10 w-full rounded-xl border border-slate-200 px-3"
              >
                <option value="testing">保本测试中</option>
                <option value="winner">跑量爆单</option>
                <option value="stopped">跑输停投</option>
              </select>
              <button type="button" onClick={submit} className="h-10 w-full rounded-xl bg-brand font-medium text-white">
                写入看板
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={Boolean(compare)} onOpenChange={(next) => !next && setCompare(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(640px,94vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 shadow-pop focus:outline-none">
            <div className="mb-3 flex items-start justify-between">
              <Dialog.Title className="text-base font-semibold">查看对比</Dialog.Title>
              <Dialog.Close className="rounded-lg p-1 text-slate-400">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            {compare ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <CompareCell title={compare.title} ctr={`${compare.ctr.toFixed(2)}%`} spend={`$${compare.spend}`} roas={compare.roas.toFixed(1)} />
                <CompareCell title="账户均值" ctr={ANALYTICS_SUMMARY.ctr} spend="—" roas="—" />
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function CompareCell({ title, ctr, spend, roas }: { title: string; ctr: string; spend: string; roas: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-3 text-xs text-slate-400">CTR</p>
      <p className="text-lg font-semibold">{ctr}</p>
      <p className="mt-2 text-xs text-slate-400">消耗 {spend}</p>
      <p className="text-xs text-slate-400">ROAS {roas}</p>
    </div>
  );
}
