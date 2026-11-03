"use client";

import { useState } from "react";
import { fallbackClip, playbackSrc } from "@/lib/media";
import { cn } from "@/lib/utils";

export function StreamVideo({
  src,
  poster,
  mode = "inline",
  active = false,
  controls = false,
  badge = false,
  className,
}: {
  src: string;
  poster?: string;
  mode?: "inline" | "hover";
  active?: boolean;
  controls?: boolean;
  badge?: boolean;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const resolved = broken ? fallbackClip(src) : playbackSrc(src);
  const showVideo = Boolean(resolved) && (mode === "inline" || active);

  return (
    <div className={cn("relative overflow-hidden bg-slate-950", className)}>
      {poster ? (
        <img
          src={poster}
          alt=""
          decoding="async"
          loading={mode === "hover" ? "lazy" : "eager"}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      {showVideo ? (
        <video
          key={resolved}
          src={resolved}
          poster={poster || undefined}
          preload="metadata"
          playsInline
          muted
          loop
          autoPlay={mode === "hover"}
          controls={controls}
          onError={() => {
            if (!broken) setBroken(true);
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      {badge ? (
        <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          ⚡️ 秒开流媒体 · 1080P
        </span>
      ) : null}
    </div>
  );
}
