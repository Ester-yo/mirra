"use client";

import { Copy, Download, LayoutGrid, List, Package } from "lucide-react";
import { useMemo, useState } from "react";
import { PreviewModal } from "@/components/modals/PreviewModal";
import type { HistoryItem } from "@/lib/types";
import { useCreationStore } from "@/store/useCreationStore";
import { buildZip } from "@/lib/zip";
import { cn, copyText, downloadBlob, downloadMp4, formatStamp } from "@/lib/utils";

type DateFilter = "all" | "today" | "7d";
type StatusFilter = "all" | "completed" | "failed";
type TypeFilter = "all" | "remix" | "batch";

export default function HistoryPage() {
  const history = useCreationStore((state) => state.history);
  const pushToast = useCreationStore((state) => state.pushToast);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [view, setView] = useState<"table" | "grid">("table");
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<HistoryItem | null>(null);

  const rows = useMemo(() => {
    const now = Date.now();
    return history.filter((item) => {
      const age = now - new Date(item.createdAt).getTime();
      if (dateFilter === "today" && age > 24 * 3600 * 1000) return false;
      if (dateFilter === "7d" && age > 7 * 24 * 3600 * 1000) return false;
      if (status !== "all" && item.status !== status) return false;
      if (type !== "all" && item.type !== type) return false;
      return true;
    });
  }, [history, dateFilter, status, type]);

  const toggle = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const copyPrompt = async (item: HistoryItem) => {
    const ok = await copyText(item.prompt);
    pushToast(ok ? "已复制 Prompt 骨架" : "复制失败，请重试", ok ? "success" : "warning");
  };

  const downloadOne = async (item: HistoryItem) => {
    if (!item.videoUrl || item.status !== "completed") return;
    const mode = await downloadMp4(item.videoUrl, `mirra-${item.id}.mp4`);
    pushToast(mode === "saved" ? "已开始下载无水印 MP4" : "已在新标签打开成片", "success");
  };

  const exportZip = () => {
    const picked = rows.filter((item) => selected.includes(item.id));
    if (!picked.length) return;
    const files = [
      {
        name: "manifest.txt",
        content: picked.map((item) => `${item.id}\t${item.title}\t${item.videoUrl || "FAILED"}`).join("\n"),
      },
      ...picked.map((item) => ({
        name: `${item.id}-prompt.txt`,
        content: item.prompt,
      })),
    ];
    downloadBlob(buildZip(files), `mirra-export.zip`);
    pushToast(`已打包 ${picked.length} 条素材`, "success");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">历史记录</h1>
            <p className="mt-1 text-sm text-slate-500">单条复刻和批量裂变的成片都在这里，可预览、下载或打包。</p>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setView("table")}
              className={cn("rounded-lg p-1.5", view === "table" && "bg-brand-soft text-brand")}
              aria-label="表格"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn("rounded-lg p-1.5", view === "grid" && "bg-brand-soft text-brand")}
              aria-label="卡片"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Filter
            value={dateFilter}
            onChange={setDateFilter}
            options={[
              ["all", "全部日期"],
              ["today", "今天"],
              ["7d", "近7天"],
            ]}
          />
          <Filter
            value={status}
            onChange={setStatus}
            options={[
              ["all", "全部状态"],
              ["completed", "Completed"],
              ["failed", "Failed"],
            ]}
          />
          <Filter
            value={type}
            onChange={setType}
            options={[
              ["all", "全部类型"],
              ["remix", "单条复刻"],
              ["batch", "批量裂变"],
            ]}
          />
          <span className="ml-auto self-center text-xs text-slate-400">{rows.length} 个项目</span>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
            这个筛选条件下没有成片
          </div>
        ) : view === "table" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-400">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.length > 0 && rows.every((item) => selected.includes(item.id))}
                      onChange={(event) => setSelected(event.target.checked ? rows.map((item) => item.id) : [])}
                      aria-label="全选"
                    />
                  </th>
                  <th className="px-3 py-3 font-medium">项目</th>
                  <th className="px-3 py-3 font-medium">类型</th>
                  <th className="px-3 py-3 font-medium">状态</th>
                  <th className="px-3 py-3 font-medium">规格</th>
                  <th className="px-3 py-3 font-medium">时间</th>
                  <th className="px-3 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="border-t border-slate-50">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggle(item.id)}
                        aria-label={`选择 ${item.title}`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => setPreview(item)} className="flex items-center gap-3 text-left">
                        <img src={item.posterUrl} alt="" className="h-14 w-10 rounded-lg object-cover" />
                        <span className="line-clamp-2 max-w-[240px] font-medium">{item.title}</span>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{item.type === "remix" ? "单条复刻" : "批量裂变"}</td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs",
                          item.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500",
                        )}
                      >
                        {item.status === "completed" ? "Completed" : "Failed"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {item.resolution} · {item.duration}s · 9:16
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400">{formatStamp(item.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <IconButton label="下载 MP4 无水印" disabled={item.status !== "completed"} onClick={() => void downloadOne(item)}>
                          <Download className="h-3.5 w-3.5" />
                          下载
                        </IconButton>
                        <IconButton label="复制 Prompt 骨架" onClick={() => void copyPrompt(item)}>
                          <Copy className="h-3.5 w-3.5" />
                          复制
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {rows.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
                <button type="button" onClick={() => setPreview(item)} className="block w-full">
                  <img src={item.posterUrl} alt="" className="aspect-[9/16] w-full object-cover" />
                </button>
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-medium">{item.title}</h3>
                    <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} aria-label="选择" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {item.type === "remix" ? "单条复刻" : "批量裂变"} · {formatStamp(item.createdAt)}
                  </p>
                  <div className="flex gap-1">
                    <IconButton label="下载 MP4 无水印" disabled={item.status !== "completed"} onClick={() => void downloadOne(item)}>
                      <Download className="h-3.5 w-3.5" />
                      下载
                    </IconButton>
                    <IconButton label="复制 Prompt 骨架" onClick={() => void copyPrompt(item)}>
                      <Copy className="h-3.5 w-3.5" />
                      复制
                    </IconButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selected.length > 0 ? (
        <div className="sticky bottom-4 mx-auto flex w-[min(640px,calc(100%-32px))] items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-pop">
          <span className="text-sm">已选 {selected.length} 条</span>
          <button
            type="button"
            onClick={exportZip}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-white"
          >
            <Package className="h-4 w-4" />
            批量打包导出 .ZIP
          </button>
        </div>
      ) : null}

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

function Filter<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: [T, string][];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none"
    >
      {options.map(([id, label]) => (
        <option key={id} value={id}>
          {label}
        </option>
      ))}
    </select>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs text-slate-600 hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
