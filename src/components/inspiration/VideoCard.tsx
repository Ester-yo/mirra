"use client";

import { Play, Star } from "lucide-react";
import { useState } from "react";
import { CHANNEL_BY_ID } from "@/lib/mock-data";
import type { InspirationVideo } from "@/lib/types";
import { cn } from "@/lib/utils";

export function VideoCard({
  video,
  bookmarked,
  compareMode,
  selected,
  onToggleBookmark,
  onRemix,
  onToggleSelect,
}: {
  video: InspirationVideo;
  bookmarked: boolean;
  compareMode?: boolean;
  selected?: boolean;
  onToggleBookmark: () => void;
  onRemix: () => void;
  onToggleSelect?: () => void;
}) {
  const [hot, setHot] = useState(false);
  const [broken, setBroken] = useState(false);

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]",
        selected && "ring-2 ring-brand",
      )}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onClick={() => compareMode && onToggleSelect?.()}
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-slate-100">
        <img src={video.posterUrl} alt="" className="h-full w-full object-cover" />
        {hot && !broken ? (
          <video
            src={video.videoUrl}
            poster={video.posterUrl}
            muted
            loop
            playsInline
            autoPlay
            onError={() => setBroken(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent" />
        <div className="absolute left-2 right-2 top-2 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col items-start gap-1">
            <span className="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">
              GMV {video.gmv}
            </span>
            {video.isOfficial ? (
              <span
                title="【官方稳出片·成功率99%】"
                className="max-w-[148px] rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-violet-700 shadow-sm"
              >
                【官方稳出片·成功率99%】
              </span>
            ) : null}
          </div>
          {compareMode ? (
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                selected ? "border-brand bg-brand text-white" : "border-white/80 bg-black/35 text-white",
              )}
            >
              {selected ? "✓" : ""}
            </span>
          ) : (
            <button
              type="button"
              aria-label={bookmarked ? "取消收藏" : "收藏"}
              onClick={(event) => {
                event.stopPropagation();
                onToggleBookmark();
              }}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition",
                bookmarked ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <Star className={cn("h-3.5 w-3.5", bookmarked && "fill-amber-300 text-amber-300")} />
            </button>
          )}
        </div>
        {!hot ? (
          <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
            <Play className="ml-0.5 h-5 w-5 fill-white" />
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          {hot ? (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemix();
                }}
                className="h-8 flex-1 rounded-lg bg-brand text-xs font-medium text-white shadow-glow"
              >
                一键做同款
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleBookmark();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-slate-700"
                aria-label="收藏"
              >
                <Star className={cn("h-3.5 w-3.5", bookmarked && "fill-amber-400 text-amber-500")} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-white">
              <span>{video.plays} 播放</span>
              <span>{video.duration}</span>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1 px-3 py-2.5">
        <h3 className="line-clamp-2 text-[13px] font-medium leading-5">{video.title}</h3>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>
            {video.category}
            {CHANNEL_BY_ID[video.id] ? ` · ${CHANNEL_BY_ID[video.id]}` : ""}
          </span>
          <span>{video.hookType}</span>
        </div>
      </div>
    </article>
  );
}
