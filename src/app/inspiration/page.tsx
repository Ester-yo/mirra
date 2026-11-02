"use client";

import * as Tabs from "@radix-ui/react-tabs";
import * as Switch from "@radix-ui/react-switch";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Columns2, Link2, Loader2, Sparkles } from "lucide-react";
import { VideoCard } from "@/components/inspiration/VideoCard";
import { CATEGORIES, CHANNEL_BY_ID, CHANNELS, INSPIRATION, PRESETS } from "@/lib/mock-data";
import { parseReferenceInput } from "@/lib/parse";
import type { InspirationVideo } from "@/lib/types";
import { useCreationStore } from "@/store/useCreationStore";
import { cn } from "@/lib/utils";

const TIMES = [
  { id: 7, label: "近7天" },
  { id: 14, label: "近14天" },
  { id: 30, label: "近30天" },
];

export default function InspirationPage() {
  const router = useRouter();
  const bookmarkedIds = useCreationStore((state) => state.bookmarkedIds);
  const toggleBookmark = useCreationStore((state) => state.toggleBookmark);
  const selectTemplateForRemix = useCreationStore((state) => state.selectTemplateForRemix);
  const pushToast = useCreationStore((state) => state.pushToast);

  const [tab, setTab] = useState("trending");
  const [link, setLink] = useState("");
  const [parsing, setParsing] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [region, setRegion] = useState<"US" | "UK" | "ALL">("US");
  const [days, setDays] = useState(7);
  const [sort, setSort] = useState<"gmv" | "plays">("gmv");
  const [preset, setPreset] = useState<(typeof PRESETS)[number]>("全部模板");
  const [compare, setCompare] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("全部渠道");
  const [bookmarkChip, setBookmarkChip] = useState("全部收藏");

  const remix = (video: InspirationVideo) => {
    selectTemplateForRemix(video);
    router.push("/studio/remix");
  };

  const onParse = async () => {
    setParsing(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    const video = parseReferenceInput(link);
    setParsing(false);
    if (!video) {
      pushToast("请粘贴有效的 TikTok / 抖音链接", "warning");
      return;
    }
    selectTemplateForRemix(video);
    pushToast("已解构分镜与口播骨架", "success");
    router.push("/studio/remix");
  };

  const feed = useMemo(() => {
    let list = INSPIRATION.filter((item) => item.daysAgo <= days);
    if (region !== "ALL") list = list.filter((item) => item.region === region);
    if (category !== "全部产品分类") list = list.filter((item) => item.category === category);
    if (channel !== "全部渠道") list = list.filter((item) => CHANNEL_BY_ID[item.id] === channel);
    return [...list].sort((a, b) => (sort === "gmv" ? b.gmvValue - a.gmvValue : b.playsValue - a.playsValue));
  }, [days, region, category, sort, channel]);

  const official = useMemo(() => {
    return INSPIRATION.filter((item) => item.isOfficial && (preset === "全部模板" || item.preset === preset));
  }, [preset]);

  const saved = useMemo(() => {
    return INSPIRATION.filter((item) => bookmarkedIds.includes(item.id)).filter((item) => {
      if (bookmarkChip === "全部收藏") return true;
      if (bookmarkChip === "服饰") return item.category === "服饰鞋包";
      if (bookmarkChip === "美妆") return item.category === "个护美妆";
      if (bookmarkChip === "日用家居") return item.category === "家居日用";
      return item.playsValue >= 3000000 || /暴力|痛点|拉伸|跌落/.test(item.hookType);
    });
  }, [bookmarkedIds, bookmarkChip]);

  const cards = tab === "trending" ? feed : tab === "official" ? official : saved;
  const selectedVideos = picked
    .map((id) => INSPIRATION.find((item) => item.id === id))
    .filter((item): item is InspirationVideo => Boolean(item));

  const togglePick = (id: string) => {
    setPicked((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) {
        pushToast("最多对比 2 条视频", "warning");
        return current;
      }
      return [...current, id];
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-6 py-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">灵感视频</h1>
          <p className="mt-1 text-sm text-slate-500">拆开大盘爆款的前 3 秒、演示和逼单，直接做成你的投放素材。</p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-2 pl-4 shadow-card">
          <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={link}
            onChange={(event) => setLink(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void onParse();
            }}
            placeholder="粘贴 TikTok / 抖音带货视频链接，一键解构复刻..."
            className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setLink("https://www.tiktok.com/@shop/video/v-002")}
            className="hidden text-xs text-slate-400 hover:text-brand sm:inline"
          >
            填入示例
          </button>
          <button
            type="button"
            onClick={() => void onParse()}
            disabled={parsing}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-white shadow-glow transition hover:bg-brand-hover disabled:opacity-60"
          >
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            解析复刻
          </button>
        </div>

        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List className="inline-flex rounded-full border border-slate-100 bg-white p-1 shadow-card">
            {[
              ["trending", "大盘爆款"],
              ["official", "官方模板"],
              ["saved", "我的收藏"],
            ].map(([value, label]) => (
              <Tabs.Trigger
                key={value}
                value={value}
                className="rounded-full px-4 py-1.5 text-sm text-slate-500 transition data-[state=active]:bg-brand data-[state=active]:text-white"
              >
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="trending" className="mt-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <Field label="产品分类">
                <select value={category} onChange={(event) => setCategory(event.target.value)} className={selectClass}>
                  {CATEGORIES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="地区">
                <select
                  value={region}
                  onChange={(event) => setRegion(event.target.value as "US" | "UK" | "ALL")}
                  className={selectClass}
                >
                  <option value="US">美国 US</option>
                  <option value="UK">英国 UK</option>
                  <option value="ALL">全部地区</option>
                </select>
              </Field>
              <div className="flex items-center gap-1 rounded-xl bg-slate-50 p-1">
                {TIMES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDays(item.id)}
                    className={cn(
                      "h-8 rounded-lg px-3 text-xs text-slate-500",
                      days === item.id && "bg-brand font-medium text-white",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <Field label="排序">
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as "gmv" | "plays")}
                  className={selectClass}
                >
                  <option value="gmv">按GMV</option>
                  <option value="plays">按播放量</option>
                </select>
              </Field>
              <div className="ml-auto flex flex-wrap items-center gap-1">
                {CHANNELS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setChannel(item)}
                    className={cn(
                      "h-8 rounded-full px-3 text-xs text-slate-500",
                      channel === item ? "bg-brand font-medium text-white" : "bg-slate-50",
                    )}
                  >
                    {item}
                  </button>
                ))}
                <span className="pl-2 text-xs text-slate-400">{feed.length} 条</span>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="official" className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPreset(item)}
                className={cn(
                  "h-8 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-600",
                  preset === item && "border-brand bg-brand-soft text-brand",
                )}
              >
                {item}
              </button>
            ))}
          </Tabs.Content>

          <Tabs.Content value="saved" className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {[
                ["全部收藏", "全部收藏"],
                ["服饰", "👗 服饰"],
                ["美妆", "💄 美妆"],
                ["日用家居", "🏠 日用家居"],
                ["高爆前3秒", "⚡️ 高爆前3秒"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBookmarkChip(id)}
                  className={cn(
                    "h-8 rounded-full border px-3 text-xs",
                    bookmarkChip === id ? "border-brand bg-brand-soft text-brand" : "border-slate-200 bg-white text-slate-600",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">已收藏 {saved.length} 条</p>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <Columns2 className="h-4 w-4 text-slate-400" />
              对比模式
              <Switch.Root
                checked={compare}
                onCheckedChange={(value) => {
                  setCompare(value);
                  if (!value) setPicked([]);
                }}
                className="relative h-5 w-9 rounded-full bg-slate-200 outline-none transition data-[state=checked]:bg-brand"
              >
                <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition data-[state=checked]:translate-x-[18px]" />
              </Switch.Root>
            </label>
            </div>
          </Tabs.Content>
        </Tabs.Root>

        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <p className="text-sm font-medium">这里还是空的</p>
            <p className="mt-1 text-sm text-slate-500">
              {tab === "saved" ? "去大盘爆款点亮星标，收藏会留在这里。" : "换一个时间范围或地区再看看。"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {cards.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                bookmarked={bookmarkedIds.includes(video.id)}
                compareMode={tab === "saved" && compare}
                selected={picked.includes(video.id)}
                onToggleBookmark={() => toggleBookmark(video.id)}
                onRemix={() => remix(video)}
                onToggleSelect={() => togglePick(video.id)}
              />
            ))}
          </div>
        )}
      </div>

      {tab === "saved" && compare && picked.length > 0 ? (
        <div className="sticky bottom-4 mx-auto flex w-[min(560px,calc(100%-32px))] items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-pop">
          <span className="text-sm">已选 {picked.length}/2</span>
          <button
            type="button"
            disabled={picked.length !== 2}
            onClick={() => setCompareOpen(true)}
            className="h-9 rounded-xl bg-brand px-4 text-sm font-medium text-white disabled:opacity-40"
          >
            并排对比
          </button>
        </div>
      ) : null}

      {compareOpen && selectedVideos.length === 2 ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-6" onClick={() => setCompareOpen(false)}>
          <div
            className="relative grid max-h-[90vh] w-[min(880px,100%)] grid-cols-2 gap-4 overflow-y-auto rounded-3xl bg-white p-5 shadow-pop"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCompareOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-lg bg-white/90 px-2 py-1 text-xs text-slate-500"
            >
              关闭
            </button>
            {selectedVideos.map((video) => (
              <div key={video.id} className="min-w-0">
                <video
                  src={video.videoUrl}
                  poster={video.posterUrl}
                  controls
                  muted
                  playsInline
                  className="mx-auto aspect-[9/16] max-h-[420px] rounded-2xl bg-black object-cover"
                />
                <h3 className="mt-3 text-sm font-medium">{video.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  GMV {video.gmv} · {video.plays} 播放
                </p>
                <div className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
                  <p>{video.scriptAnalysis.hook}</p>
                  <p>{video.scriptAnalysis.demo}</p>
                  <p>{video.scriptAnalysis.cta}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remix(video)}
                  className="mt-3 h-9 w-full rounded-xl bg-brand text-sm font-medium text-white"
                >
                  一键做同款
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const selectClass =
  "h-8 rounded-lg border border-transparent bg-transparent pr-6 text-xs text-slate-700 outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-xl bg-slate-50 px-3">
      <span className="text-xs text-slate-400">{label}</span>
      {children}
    </label>
  );
}
