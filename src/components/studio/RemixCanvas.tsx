"use client";

import * as Tabs from "@radix-ui/react-tabs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, History, Sparkles } from "lucide-react";
import { INSPIRATION } from "@/lib/mock-data";
import { useCreationStore } from "@/store/useCreationStore";
import { cn, downloadMp4 } from "@/lib/utils";

export function RemixCanvas() {
  const router = useRouter();
  const template = useCreationStore((state) => state.currentTemplate);
  const aspectRatio = useCreationStore((state) => state.aspectRatio);
  const tab = useCreationStore((state) => state.studioTab);
  const setTab = useCreationStore((state) => state.setStudioTab);
  const genStatus = useCreationStore((state) => state.genStatus);
  const genProgress = useCreationStore((state) => state.genProgress);
  const genStage = useCreationStore((state) => state.genStage);
  const genResultUrl = useCreationStore((state) => state.genResultUrl);
  const selectTemplateForRemix = useCreationStore((state) => state.selectTemplateForRemix);
  const seedProductFromTemplate = useCreationStore((state) => state.seedProductFromTemplate);
  const pushToast = useCreationStore((state) => state.pushToast);

  const cases = INSPIRATION.filter((item) => item.isOfficial).slice(0, 3);

  const focusScript = () => {
    setTab("results");
    document.getElementById("script-hook")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => document.getElementById("script-hook")?.focus(), 250);
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-canvas">
      <div className="flex items-center gap-6 border-b border-transparent px-6 pt-4">
        <Tabs.Root value={tab} onValueChange={(value) => setTab(value as "results" | "cases")}>
          <Tabs.List className="flex gap-5">
            <Tabs.Trigger
              value="results"
              className="border-b-2 border-transparent pb-3 text-sm text-slate-500 data-[state=active]:border-brand data-[state=active]:font-medium data-[state=active]:text-slate-900"
            >
              生成结果
            </Tabs.Trigger>
            <Tabs.Trigger
              value="cases"
              className="border-b-2 border-transparent pb-3 text-sm text-slate-500 data-[state=active]:border-brand data-[state=active]:font-medium data-[state=active]:text-slate-900"
            >
              优秀案例对比
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
        <Link href="/history" className="mb-3 ml-auto inline-flex items-center gap-1 text-xs text-slate-400 hover:text-brand">
          <History className="h-3.5 w-3.5" />
          历史记录
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {tab === "cases" ? (
          <div className="mx-auto grid max-w-5xl gap-4">
            {cases.map((item) => (
              <article key={item.id} className="grid grid-cols-[180px_1fr_auto] items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
                <img src={item.posterUrl} alt="" className="aspect-[9/16] w-full rounded-xl object-cover" />
                <div>
                  <p className="text-xs text-brand">{item.preset}</p>
                  <h3 className="mt-1 text-sm font-medium">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{item.scriptAnalysis.hook}</p>
                  <p className="text-xs text-slate-400">
                    GMV {item.gmv} · {item.plays} 播放
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    selectTemplateForRemix(item);
                    setTab("results");
                    pushToast("已载入这条案例，可以直接改脚本", "success");
                  }}
                  className="h-9 rounded-xl bg-brand px-3 text-xs font-medium text-white"
                >
                  一键做同款
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col items-center">
            {!template && genStatus === "idle" ? (
              <p className="mb-4 text-center text-sm text-slate-500">
                上传商品图，自动分析商品信息并输出提示词，一键生成带货视频
              </p>
            ) : null}
            <div className="grid w-full grid-cols-2 gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
              <PreviewSlot label="参考视频" ratio={aspectRatio}>
                {template?.videoUrl ? (
                  <video
                    key={template.videoUrl}
                    src={template.videoUrl}
                    poster={template.posterUrl || undefined}
                    controls
                    playsInline
                    className="h-full w-full bg-black object-cover"
                  />
                ) : (
                  <EmptyHint text="解析或上传后在这里预览" />
                )}
              </PreviewSlot>
              <PreviewSlot label="生成结果" ratio={aspectRatio}>
                {genStatus === "running" ? (
                  <div className="relative h-full w-full">
                    <div className="shimmer absolute inset-0" />
                    <div className="absolute inset-0 flex flex-col justify-end bg-slate-950/45 p-4 text-white">
                      <div className="mb-3 space-y-2">
                        <div className="h-3 w-2/3 rounded bg-white/30" />
                        <div className="h-3 w-1/2 rounded bg-white/20" />
                      </div>
                      <p className="text-xs leading-5">{genStage}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
                        <div className="h-full rounded-full bg-white transition-all" style={{ width: `${genProgress}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-white/80">{genProgress}%</p>
                    </div>
                  </div>
                ) : genStatus === "done" && genResultUrl ? (
                  <video
                    key={genResultUrl}
                    src={genResultUrl}
                    controls
                    playsInline
                    preload="auto"
                    className="h-full w-full bg-black object-cover"
                  />
                ) : (
                  <EmptyHint text="生成后将在这里播放成片" />
                )}
              </PreviewSlot>
            </div>

            {genStatus === "done" && genResultUrl ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void downloadMp4(genResultUrl, `mirra-${template?.id ?? "render"}.mp4`).then((mode) => {
                      pushToast(mode === "saved" ? "已开始下载无水印 MP4" : "已在新标签打开成片", "success");
                    })
                  }
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-sm text-white"
                >
                  <Download className="h-4 w-4" />
                  下载无水印 MP4
                </button>
                <button
                  type="button"
                  onClick={() => {
                    seedProductFromTemplate();
                    router.push("/studio/batch");
                  }}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm"
                >
                  <Sparkles className="h-4 w-4 text-brand" />
                  放入批量裂变
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={focusScript}
              className="mt-4 h-10 rounded-xl bg-brand px-5 text-sm font-medium text-white shadow-glow"
            >
              一键做同款 / 再次微调
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

const RATIO_CLASS = {
  "9:16": "aspect-[9/16]",
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "3:4": "aspect-[3/4]",
  "4:3": "aspect-[4/3]",
} as const;

function PreviewSlot({
  label,
  ratio,
  children,
}: {
  label: string;
  ratio: keyof typeof RATIO_CLASS;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-slate-100", RATIO_CLASS[ratio])}>
      {children}
      <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[11px] text-white backdrop-blur">
        {label}
      </span>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center text-xs leading-5 text-slate-400">
      {text}
    </div>
  );
}
