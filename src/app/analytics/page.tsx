"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Eye, Info, Search, X } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ANALYTICS_SUMMARY } from "@/lib/catalog";
import type { AdRecord, AdStatus } from "@/lib/types";
import { useCreationStore } from "@/store/useCreationStore";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<AdStatus, string> = {
  winner: "跑量爆单",
  testing: "保本测试中",
  stopped: "跑输停投",
};

const GROUP_DATE: Record<string, string> = {
  "exp-tumbler": "2026-10-28",
  "exp-legging": "2026-10-22",
  "exp-pore": "2026-10-19",
  "exp-serum": "2026-10-16",
  "exp-jacket": "2026-10-12",
  "exp-spray": "2026-10-08",
};

const HISTORICAL_GROUPS = 8;
const HISTORICAL_WINS = 2;

type EntryDraft = {
  spend: string;
  ctr: string;
  roas: string;
  status: AdStatus;
};

function isQualifiedWinner(item: AdRecord) {
  return item.ctr > 2.5 && item.roas > 2;
}

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
  const updateAdMetrics = useCreationStore((state) => state.updateAdMetrics);
  const prepareBatchFromAd = useCreationStore((state) => state.prepareBatchFromAd);
  const pushToast = useCreationStore((state) => state.pushToast);

  const [productId, setProductId] = useState(productFromUrl);
  const [status, setStatus] = useState<"all" | AdStatus>("all");
  const [query, setQuery] = useState("");
  const [dataOpen, setDataOpen] = useState(false);
  const [entryGroup, setEntryGroup] = useState("exp-tumbler");
  const [linkFilter, setLinkFilter] = useState("");
  const [drafts, setDrafts] = useState<Record<string, EntryDraft>>({});
  const [preview, setPreview] = useState<AdRecord | null>(null);
  const [compare, setCompare] = useState<[AdRecord, AdRecord] | null>(null);

  useEffect(() => {
    setProductId(productFromUrl);
  }, [productFromUrl]);

  const experiments = useMemo(() => {
    const list: { id: string; label: string; rows: AdRecord[] }[] = [];
    ads.forEach((item) => {
      const found = list.find((group) => group.id === item.experimentId);
      if (found) found.rows.push(item);
      else list.push({ id: item.experimentId, label: "", rows: [item] });
    });
    return list.map((group) => {
      const sorted = [...group.rows].sort((a, b) => a.variant.localeCompare(b.variant));
      const phase = sorted[0].experimentName.split(" - ").slice(1).join(" - ") || "前 3 秒钩子对决赛马";
      return {
        id: group.id,
        rows: sorted,
        label: `${sorted[0].productTitle} (${phase} · ${sorted.length}条变体)`,
      };
    });
  }, [ads]);

  const visibleExperiments = useMemo(() => {
    const q = linkFilter.trim().toLowerCase();
    if (!q) return experiments;
    return experiments.filter((item) => item.label.toLowerCase().includes(q) || item.rows.some((row) => `${row.productTitle} ${row.productId}`.toLowerCase().includes(q)));
  }, [experiments, linkFilter]);

  const activeExperiment = experiments.find((item) => item.id === entryGroup) ?? visibleExperiments[0];

  useEffect(() => {
    if (!dataOpen || !activeExperiment) return;
    const next: Record<string, EntryDraft> = {};
    activeExperiment.rows.forEach((row) => {
      next[row.id] = { spend: String(row.spend), ctr: String(row.ctr), roas: String(row.roas), status: row.status };
    });
    setDrafts(next);
  }, [dataOpen, activeExperiment]);

  const winRate = useMemo(() => {
    const groups = new Map<string, AdRecord[]>();
    ads.forEach((item) => {
      const current = groups.get(item.experimentId) ?? [];
      current.push(item);
      groups.set(item.experimentId, current);
    });
    const liveWins = [...groups.values()].filter((rows) => rows.some(isQualifiedWinner)).length;
    const total = groups.size + HISTORICAL_GROUPS;
    const wins = liveWins + HISTORICAL_WINS;
    const rate = total ? ((wins / total) * 100).toFixed(1) : "0.0";
    return { total, wins, rate };
  }, [ads]);

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

  const saveMetrics = (id: string, patch: Partial<Pick<AdRecord, "spend" | "ctr" | "roas">>) => {
    updateAdMetrics(id, patch);
    pushToast("投放数据已更新", "success");
  };

  const submitEntry = () => {
    if (!activeExperiment) {
      pushToast("请先选择一组赛马实验", "warning");
      return;
    }
    const parsed = activeExperiment.rows.map((row) => {
      const draft = drafts[row.id];
      return {
        row,
        spend: Number(draft?.spend),
        ctr: Number(draft?.ctr),
        roas: Number(draft?.roas),
        status: draft?.status ?? row.status,
      };
    });
    if (parsed.some((item) => ![item.spend, item.ctr, item.roas].every((value) => Number.isFinite(value)))) {
      pushToast("请把每条变体的消耗、CTR 和 ROAS 填完整", "warning");
      return;
    }
    const winner = [...parsed].sort((a, b) => b.ctr - a.ctr || b.roas - a.roas)[0];
    parsed.forEach((item) => {
      const status = item.row.id === winner.row.id ? "winner" : item.status === "winner" ? "testing" : item.status;
      updateAdMetrics(item.row.id, { spend: item.spend, ctr: item.ctr, roas: item.roas, status });
    });
    pushToast(`已保存，Hook ${winner.row.variant} 标为胜出版本`, "success");
    setDataOpen(false);
  };

  const openCompare = (item: AdRecord) => {
    const siblings = ads.filter((ad) => ad.experimentId === item.experimentId);
    const left = siblings.find((ad) => ad.variant === "A") ?? item;
    const right = siblings.find((ad) => ad.variant === "B" && ad.id !== left.id) ?? siblings.find((ad) => ad.id !== left.id) ?? item;
    setCompare([left, right]);
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
            onClick={() => {
              setEntryGroup(experiments[0]?.id ?? "exp-tumbler");
              setLinkFilter("");
              setDataOpen(true);
            }}
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
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>A/B 测试胜出率</span>
              <span className="group relative">
                <Info className="h-3.5 w-3.5" />
                <span className="pointer-events-none absolute left-0 top-5 z-10 hidden w-56 rounded-xl bg-ink px-3 py-2 text-[11px] leading-5 text-white shadow-pop group-hover:block">
                  当某个变体 CTR 超过行业基准 2.5% 且 ROAS &gt; 2.0 时被标记为胜出版本
                </span>
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{winRate.rate}%</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">
              总共 {winRate.total} 组赛马，{winRate.wins} 组成功跑出胜出版 (胜出率 {winRate.rate}%)
            </p>
          </div>
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
            const product = products.find((item) => item.id === group.rows[0]?.productId);
            const qualified = [...group.rows].filter(isQualifiedWinner).sort((a, b) => b.ctr - a.ctr)[0];
            return (
              <section key={group.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                  <img
                    src={product?.images[0] ?? group.rows[0]?.posterUrl}
                    alt=""
                    className="h-20 w-20 rounded-2xl object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium">{group.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{product?.categoryTag ?? product?.category ?? "未分类"}</span>
                      <span className="text-slate-400">{GROUP_DATE[group.id] ?? "2026-10-02"}</span>
                      <span className={cn("rounded-full px-2 py-0.5", qualified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                        {qualified ? `🟢 赛马已完成: Hook ${qualified.variant} 胜出` : "🟡 赛马进行中"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] text-left text-sm">
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
                              <EditableMetric
                                value={item.ctr}
                                format={(value) => `${Number.isInteger(value * 10) ? value.toFixed(1) : value.toFixed(2)}%`}
                                hot={item.ctr > 3}
                                onSave={(value) => saveMetrics(item.id, { ctr: value })}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <EditableMetric
                                value={item.roas}
                                format={(value) => value.toFixed(1)}
                                onSave={(value) => saveMetrics(item.id, { roas: value })}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex flex-col items-start gap-1">
                                <button type="button" onClick={() => setPreview(item)} className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-brand">
                                  <Eye className="h-3.5 w-3.5" />
                                  预览视频
                                </button>
                                <button type="button" onClick={() => openCompare(item)} className="text-xs text-slate-600 hover:text-brand">
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
                </div>
              </section>
            );
          })}
          {groups.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-400">这个筛选下没有投放记录</p> : null}
        </div>
      </div>

      <Dialog.Root open={dataOpen} onOpenChange={setDataOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(860px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 shadow-pop focus:outline-none">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <Dialog.Title className="text-base font-semibold">📊 回传赛马实验投放数据</Dialog.Title>
                <Dialog.Description className="mt-1 text-xs leading-5 text-slate-400">
                  选择对应商品，系统会自动调出该组生成的赛马视频，直接填入广告后台表现。
                </Dialog.Description>
              </div>
              <Dialog.Close className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-slate-400">选择赛马商品 / 实验批次</span>
                  <select
                    value={activeExperiment?.id ?? ""}
                    onChange={(event) => setEntryGroup(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  >
                    {(visibleExperiments.length ? visibleExperiments : experiments).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-slate-400">商品链接筛选</span>
                  <input
                    value={linkFilter}
                    onChange={(event) => setLinkFilter(event.target.value)}
                    placeholder="粘贴商品链接或名称"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                  />
                </label>
              </div>
              <div className="space-y-2">
                {activeExperiment?.rows.map((row) => {
                  const draft = drafts[row.id] ?? { spend: String(row.spend), ctr: String(row.ctr), roas: String(row.roas), status: row.status };
                  const hookName = row.hookLabel.replace(/^Hook\s*[A-C]\s*/, "");
                  const patch = (partial: Partial<EntryDraft>) => setDrafts((current) => ({ ...current, [row.id]: { ...draft, ...partial } }));
                  return (
                    <div key={row.id} className="grid grid-cols-[72px_1fr] gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="relative h-[96px] overflow-hidden rounded-xl bg-slate-200">
                        <img src={row.posterUrl} alt="" className="h-full w-full object-cover" />
                        <span className="absolute bottom-1 left-1 rounded-full bg-black/65 px-1.5 py-0.5 text-[10px] text-white">15s</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          Hook {row.variant} · {hookName}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
                          <Field label="消耗 ($)" value={draft.spend} onChange={(value) => patch({ spend: value })} />
                          <Field label="CTR (%)" value={draft.ctr} onChange={(value) => patch({ ctr: value })} />
                          <Field label="ROAS" value={draft.roas} onChange={(value) => patch({ roas: value })} />
                          <label className="block">
                            <span className="mb-1 block text-[11px] text-slate-400">状态</span>
                            <select
                              value={draft.status}
                              onChange={(event) => patch({ status: event.target.value as AdStatus })}
                              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs"
                            >
                              <option value="winner">跑量爆单</option>
                              <option value="testing">保本测试中</option>
                              <option value="stopped">跑输停投</option>
                            </select>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={submitEntry} className="h-10 w-full rounded-xl bg-brand text-sm font-medium text-white">
                ⚡️ 保存数据并决出胜出版
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={Boolean(preview)} onOpenChange={(next) => !next && setPreview(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(360px,94vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 shadow-pop focus:outline-none">
            <div className="mb-3 flex items-start justify-between">
              <Dialog.Title className="text-base font-semibold">{preview?.title}</Dialog.Title>
              <Dialog.Close className="rounded-lg p-1 text-slate-400">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            {preview ? <MockPlayer ad={preview} /> : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={Boolean(compare)} onOpenChange={(next) => !next && setCompare(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(760px,94vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 shadow-pop focus:outline-none">
            <div className="mb-3 flex items-start justify-between">
              <Dialog.Title className="text-base font-semibold">钩子对比</Dialog.Title>
              <Dialog.Close className="rounded-lg p-1 text-slate-400">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            {compare ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {compare.map((item) => (
                    <div key={item.id}>
                      <p className="mb-2 text-sm font-medium">
                        Variant {item.variant} · {item.hookLabel}
                      </p>
                      <MockPlayer ad={item} />
                      <p className="mt-2 text-xs text-slate-400">
                        CTR {item.ctr}% · ROAS {item.roas.toFixed(1)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand-ink">
                  前 3 秒钩子差异对完播率的影响 ({formatBoost(compare[0], compare[1])})
                </p>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function formatBoost(left: AdRecord, right: AdRecord) {
  const low = Math.min(left.ctr, right.ctr);
  const high = Math.max(left.ctr, right.ctr);
  const boost = low > 0 ? Math.round(((high - low) / low) * 100) : 170;
  return `+${boost}% CTR boost`;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none"
      />
    </label>
  );
}

function MockPlayer({ ad }: { ad: AdRecord }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-slate-950">
      <video src={ad.videoUrl} poster={ad.posterUrl} controls playsInline className="aspect-[9/16] w-full object-cover" />
    </div>
  );
}

function EditableMetric({
  value,
  format,
  hot,
  onSave,
}: {
  value: number;
  format: (value: number) => string;
  hot?: boolean;
  onSave: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const next = Number(raw);
    setEditing(false);
    if (!Number.isFinite(next)) {
      setDraft(String(value));
      return;
    }
    setDraft(String(next));
    if (next !== value) onSave(next);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => commit(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(event.currentTarget.value);
          }
          if (event.key === "Escape") {
            setDraft(String(value));
            setEditing(false);
          }
        }}
        className="h-8 w-20 rounded-lg border border-brand px-2 text-sm outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn("rounded-full px-2 py-0.5 text-xs transition hover:ring-2 hover:ring-brand/30", hot ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600")}
    >
      {format(value)}
      {hot ? " 🔥 高点击" : ""}
    </button>
  );
}
