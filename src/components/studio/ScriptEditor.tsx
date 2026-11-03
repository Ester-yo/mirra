"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  SCRIPT_TEMPLATES,
  countScript,
  fullToScenes,
  scenesToFull,
  type RemixScene,
  type ScriptLang,
} from "@/lib/remix-script";
import { cn } from "@/lib/utils";

export function ScriptEditor({
  scenes,
  lang,
  view,
  templateId,
  polishing,
  onScenes,
  onLang,
  onView,
  onTemplate,
  onPolish,
  onAdd,
  onDelete,
}: {
  scenes: RemixScene[];
  lang: ScriptLang;
  view: "scenes" | "full";
  templateId: string;
  polishing: boolean;
  onScenes: (next: RemixScene[]) => void;
  onLang: (lang: ScriptLang) => void;
  onView: (view: "scenes" | "full") => void;
  onTemplate: (id: string) => void;
  onPolish: () => void;
  onAdd: (index: number) => void;
  onDelete: (id: string) => void;
}) {
  const fullText = scenesToFull(scenes, lang);
  const counter = countScript(fullText, lang);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    if (!area || view !== "full") return;
    area.style.height = "auto";
    area.style.height = `${area.scrollHeight}px`;
  }, [fullText, view]);

  const patch = (id: string, partial: Partial<RemixScene>) => {
    onScenes(scenes.map((item) => (item.id === id ? { ...item, ...partial } : item)));
  };

  return (
    <div className="space-y-3 px-3 pb-3">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
        {(
          [
            ["zh", "🇨🇳 中文展示"],
            ["en", "🇺🇸 英文原版 (TikTok)"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onLang(id)}
            className={cn(
              "h-8 rounded-lg px-1 text-[11px] font-medium",
              lang === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="sr-only">选择官方推荐脚本模板</span>
        <select
          value={templateId}
          onChange={(event) => onTemplate(event.target.value)}
          className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs outline-none"
        >
          <option value="">选择官方推荐脚本模板</option>
          {SCRIPT_TEMPLATES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
        {(
          [
            ["scenes", "动态分镜卡片"],
            ["full", "统一全文编辑"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onView(id)}
            className={cn(
              "h-8 rounded-lg text-[11px] font-medium",
              view === id ? "bg-white text-brand shadow-sm" : "text-slate-500",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "scenes" ? (
        <div className="space-y-2">
          {scenes.map((item, index) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              <div className="mb-2 flex items-center gap-1">
                <span className="shrink-0 text-[10px] font-medium text-slate-400">分镜 {index + 1}</span>
                <input
                  aria-label="开始秒数"
                  type="number"
                  min={0}
                  value={item.start}
                  onChange={(event) => patch(item.id, { start: Number(event.target.value) || 0 })}
                  className="h-6 w-10 rounded-md border border-slate-200 bg-white text-center text-[11px] outline-none"
                />
                <span className="text-[10px] text-slate-400">-</span>
                <input
                  aria-label="结束秒数"
                  type="number"
                  min={0}
                  value={item.end}
                  onChange={(event) => patch(item.id, { end: Number(event.target.value) || 0 })}
                  className="h-6 w-10 rounded-md border border-slate-200 bg-white text-center text-[11px] outline-none"
                />
                <span className="text-[10px] text-slate-400">s</span>
                <input
                  aria-label="分镜标题"
                  value={item.title}
                  onChange={(event) => patch(item.id, { title: event.target.value })}
                  className="h-6 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-1.5 text-[11px] font-medium outline-none"
                />
              </div>
              <textarea
                id={index === 0 ? "script-hook" : undefined}
                value={item[lang]}
                onChange={(event) => patch(item.id, { [lang]: event.target.value })}
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs leading-5 outline-none focus:border-brand"
              />
              <div className="mt-2 flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onAdd(index)}
                  className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-600"
                >
                  <Plus className="h-3 w-3" />
                  添加分镜
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-500 hover:text-rose-500"
                >
                  <Trash2 className="h-3 w-3" />
                  删除分镜
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div>
          <textarea
            id="script-hook"
            ref={areaRef}
            value={fullText}
            onChange={(event) => onScenes(fullToScenes(event.target.value, scenes, lang))}
            className="min-h-[220px] w-full resize-none overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 outline-none focus:border-brand"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">
              {counter.count} {counter.unit}
            </span>
            <button
              type="button"
              onClick={onPolish}
              disabled={polishing}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-900 px-2.5 text-[11px] font-medium text-white disabled:opacity-60"
            >
              {polishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              🤖 AI 智能润色 / 扩写
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
