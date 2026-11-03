"use client";

import * as Slider from "@radix-ui/react-slider";
import { Check, ChevronDown, ImagePlus, Loader2, Package, PenLine, Search, Sparkles, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { posterForClip } from "@/lib/media";
import { StreamVideo } from "@/components/media/StreamVideo";
import { ScriptEditor } from "@/components/studio/ScriptEditor";
import { LOCALES, MODELS, REMIX_COST } from "@/lib/mock-data";
import { parseReferenceInput } from "@/lib/parse";
import {
  SCRIPT_TEMPLATES,
  aiGeneratedScenes,
  blankScenes,
  nextScene,
  polishLine,
  scenesToBreakdown,
  type RemixScene,
  type ScriptLang,
} from "@/lib/remix-script";
import { useCreationStore } from "@/store/useCreationStore";
import { cn, readImageFiles } from "@/lib/utils";

const RATIOS = [
  { id: "9:16" as const, box: "h-4 w-2.5", hint: "竖屏信息流" },
  { id: "16:9" as const, box: "h-2.5 w-4", hint: "横屏独立站" },
  { id: "1:1" as const, box: "h-3.5 w-3.5", hint: "方屏卡片" },
  { id: "3:4" as const, box: "h-4 w-3", hint: "3:4" },
  { id: "4:3" as const, box: "h-3 w-4", hint: "4:3" },
];

const DURATIONS = [
  { sec: 5, label: "5s (极速钩子)" },
  { sec: 10, label: "10s" },
  { sec: 15, label: "15s (推荐)" },
  { sec: 30, label: "30s (深度解说)" },
];

export function RemixForm() {
  const template = useCreationStore((state) => state.currentTemplate);
  const images = useCreationStore((state) => state.uploadedProductImages);
  const model = useCreationStore((state) => state.model);
  const resolution = useCreationStore((state) => state.resolution);
  const duration = useCreationStore((state) => state.duration);
  const aspectRatio = useCreationStore((state) => state.aspectRatio);
  const setAspectRatio = useCreationStore((state) => state.setAspectRatio);
  const region = useCreationStore((state) => state.region);
  const genStatus = useCreationStore((state) => state.genStatus);
  const selectTemplateForRemix = useCreationStore((state) => state.selectTemplateForRemix);
  const syncRemixScript = useCreationStore((state) => state.syncRemixScript);
  const clearReferenceVideo = useCreationStore((state) => state.clearReferenceVideo);
  const addProductImages = useCreationStore((state) => state.addProductImages);
  const removeProductImage = useCreationStore((state) => state.removeProductImage);
  const setModel = useCreationStore((state) => state.setModel);
  const setResolution = useCreationStore((state) => state.setResolution);
  const setDuration = useCreationStore((state) => state.setDuration);
  const setRegion = useCreationStore((state) => state.setRegion);
  const resetStudio = useCreationStore((state) => state.resetStudio);
  const startGeneration = useCreationStore((state) => state.startGeneration);
  const pushToast = useCreationStore((state) => state.pushToast);

  const [url, setUrl] = useState(template?.sourceUrl ?? "");
  const [scenes, setScenes] = useState<RemixScene[]>([]);
  const [scriptBusy, setScriptBusy] = useState(false);
  const [scriptLang, setScriptLang] = useState<ScriptLang>("zh");
  const [scriptView, setScriptView] = useState<"scenes" | "full">("scenes");
  const [scriptTemplate, setScriptTemplate] = useState("");
  const [polishing, setPolishing] = useState(false);
  const [adopted, setAdopted] = useState<Record<string, boolean>>({});
  const [parsing, setParsing] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [dragImage, setDragImage] = useState(false);
  const [dragVideo, setDragVideo] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const products = useCreationStore((state) => state.products);
  const currentProduct = useCreationStore((state) => state.currentProductForStudio);
  const loadProductIntoRemix = useCreationStore((state) => state.loadProductIntoRemix);
  const videoInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const urlInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrl(template?.sourceUrl ?? "");
    if (template?.videoUrl) setScriptOpen(true);
  }, [template?.id, template?.sourceUrl, template?.videoUrl]);

  useEffect(() => {
    if (!scenes.length) return;
    syncRemixScript(scenesToBreakdown(scenes, scriptLang));
  }, [scenes, scriptLang, syncRemixScript]);

  const handleAIGenerateScript = () => {
    if (scriptBusy) return;
    setScriptBusy(true);
    setScriptOpen(true);
    window.setTimeout(() => {
      setScriptTemplate("");
      setScenes(aiGeneratedScenes());
      setScriptBusy(false);
      pushToast("已写好 4 段分镜，可以直接改", "success");
    }, 800);
  };

  const imageMode = readImageMode(currentProduct, images.length);
  const imageKey = images.join("|");
  useEffect(() => {
    setAdopted((prev) => {
      const next: Record<string, boolean> = {};
      images.forEach((src, index) => {
        next[src] = Object.prototype.hasOwnProperty.call(prev, src) ? prev[src] : imageMode === "multi" ? index === 0 : true;
      });
      return next;
    });
  }, [imageKey, imageMode, images]);

  const parseUrl = async () => {
    setParsing(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const video = parseReferenceInput(url);
    setParsing(false);
    if (!video) {
      pushToast("请粘贴有效的 TikTok / 抖音链接", "warning");
      return;
    }
    selectTemplateForRemix(video);
    pushToast("参考视频已解析，脚本可直接改", "success");
  };

  const takeVideo = (file?: File) => {
    if (!file) return;
    const okType = /video\/|mp4|quicktime/i.test(file.type) || /\.(mp4|mov)$/i.test(file.name);
    if (!okType) {
      pushToast("仅支持 MP4 / MOV", "warning");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      pushToast("参考视频需小于 100MB", "warning");
      return;
    }
    selectTemplateForRemix({
      id: `local-${file.name}-${file.size}`,
      title: file.name.replace(/\.[^.]+$/, ""),
      sourceUrl: `本地文件 · ${file.name}`,
      videoUrl: URL.createObjectURL(file),
      posterUrl: "",
      scriptAnalysis: {
        hook: "0-3s: 本地参考片已导入，补一句痛点钩子",
        demo: "3-8s: 把商品卖点写进演示段",
        cta: "8-15s: 限时折扣与下单指令",
      },
    });
    pushToast("本地参考视频已载入", "success");
  };

  const takeImages = async (list: File[]) => {
    const imagesOnly = list.filter((file) => file.type.startsWith("image/"));
    if (!imagesOnly.length) {
      pushToast("请上传图片", "warning");
      return;
    }
    const room = 6 - images.length;
    if (room <= 0) {
      pushToast("最多 6 张商品图", "warning");
      return;
    }
    const accepted = imagesOnly.slice(0, room).filter((file) => file.size <= 10 * 1024 * 1024);
    if (accepted.length < imagesOnly.length) pushToast("超出 6 张或 10MB 的图片已跳过", "warning");
    const urls = await readImageFiles(accepted);
    addProductImages(urls);
  };

  const pickerItems = products.filter((item) => {
    const q = pickerQuery.trim().toLowerCase();
    return !q || `${item.title} ${item.category}`.toLowerCase().includes(q);
  });

  return (
    <>
    <aside className="flex w-full shrink-0 flex-col border-r border-slate-200/80 bg-[#F7F8FB] lg:h-full lg:w-[400px]">
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <h1 className="text-sm font-semibold">智能成片</h1>
        <button
          type="button"
          onClick={() => {
            setScenes([]);
            setScriptBusy(false);
            setScriptTemplate("");
            setScriptLang("zh");
            setScriptView("scenes");
            setUrl("");
            resetStudio();
          }}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          重置
        </button>
      </div>
      <div className="space-y-5 px-4 py-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium">参考视频</h2>
            <span className="text-[11px] text-slate-400">MP4 / MOV · 100MB 内</span>
          </div>
          <div className="flex gap-2">
            <input
              ref={urlInput}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="粘贴 TikTok 视频链接"
              className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none ring-brand/30 placeholder:text-slate-400 focus:ring-2"
            />
            <button
              type="button"
              onClick={() => void parseUrl()}
              disabled={parsing}
              className="h-10 shrink-0 rounded-xl bg-slate-900 px-3 text-sm text-white disabled:opacity-60"
            >
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : "解析"}
            </button>
          </div>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragVideo(true);
            }}
            onDragLeave={() => setDragVideo(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragVideo(false);
              takeVideo(event.dataTransfer.files?.[0]);
            }}
            className={cn(
              "rounded-2xl border border-dashed bg-white px-3 py-4 text-center",
              dragVideo ? "border-brand bg-brand-soft" : "border-slate-200",
            )}
          >
            <Upload className="mx-auto h-5 w-5 text-slate-400" />
            <p className="mt-2 text-xs text-slate-500">拖入参考视频，或</p>
            <button type="button" onClick={() => videoInput.current?.click()} className="mt-1 text-xs font-medium text-brand">
              本地上传
            </button>
            <input
              ref={videoInput}
              type="file"
              accept="video/mp4,video/quicktime,.mp4,.mov"
              hidden
              onChange={(event) => {
                takeVideo(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>
          {template?.videoUrl ? (
            <div className="space-y-2">
              <div className="relative">
                <StreamVideo
                  src={template.videoUrl}
                  poster={posterForClip(template.videoUrl)}
                  controls
                  badge
                  className="aspect-[9/16] w-full rounded-2xl lg:aspect-video"
                />
                <button
                  type="button"
                  onClick={() => {
                    clearReferenceVideo();
                    setUrl("");
                    pushToast("已移除参考视频，进入自由成片", "success");
                  }}
                  className="absolute left-2 top-2 z-20 rounded-full bg-black/70 px-2 py-1 text-[11px] font-medium text-white"
                >
                  ✕ 移除参考
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-brand/30 bg-brand-soft px-4 py-4 text-center">
              <p className="text-sm font-medium text-slate-800">✨ 自由成片模式 (无参考视频)</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">系统将完全根据你上传的商品图和选中的脚本模板从 0 到 1 生成高清视频。</p>
              <button
                type="button"
                onClick={() => urlInput.current?.focus()}
                className="mt-3 inline-flex h-8 items-center rounded-lg bg-white px-3 text-xs font-medium text-brand ring-1 ring-brand/20"
              >
                + 添加参考视频或 TikTok 链接
              </button>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[13px] font-medium">上传商品与参考图</h2>
            <button type="button" onClick={() => setRulesOpen((value) => !value)} className="text-[11px] text-slate-400">
              图片规则
            </button>
          </div>
          {rulesOpen ? (
            <p className="rounded-xl bg-white px-3 py-2 text-[11px] leading-5 text-slate-500">
              最多 6 张，单张 10MB。建议白底多角度或场景参考，方便模型对齐商品轮廓。
            </p>
          ) : null}
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragImage(true);
            }}
            onDragLeave={() => setDragImage(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragImage(false);
              void takeImages(Array.from(event.dataTransfer.files));
            }}
            className={cn("rounded-2xl border border-dashed bg-white p-3", dragImage ? "border-brand" : "border-slate-200")}
          >
            <div className="grid grid-cols-3 gap-2">
              {images.map((src) => {
                const checked = adopted[src] !== false;
                return (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                    <img src={src} alt="" className={cn("h-full w-full object-cover", !checked && "opacity-40")} />
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={checked ? "采纳进提示词" : "跳过不生成"}
                      title={checked ? "采纳进提示词" : "跳过不生成"}
                      onClick={() => setAdopted((prev) => ({ ...prev, [src]: !checked }))}
                      className={cn(
                        "absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-md border",
                        checked ? "border-brand bg-brand text-white" : "border-white/80 bg-black/45 text-transparent",
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProductImage(src)}
                      className="absolute right-1 top-1 rounded-full bg-black/55 p-0.5 text-white"
                      aria-label="移除图片"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
              {images.length < 6 ? (
                <button
                  type="button"
                  onClick={() => imageInput.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-slate-400"
                >
                  <ImagePlus className="h-4 w-4" />
                  <span className="mt-1 text-[11px]">{images.length}/6</span>
                </button>
              ) : null}
            </div>
            <input
              ref={imageInput}
              hidden
              multiple
              type="file"
              accept="image/*"
              onChange={(event) => {
                void takeImages(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          </div>
          {images.length > 0 ? <ImageReadout mode={imageMode} total={images.length} adopted={images.filter((src) => adopted[src] !== false).length} /> : null}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 transition hover:border-brand hover:text-brand"
          >
            <Package className="h-3.5 w-3.5" />
            从商品库快速选取
          </button>
          {currentProduct ? (
            <p className="text-[11px] text-slate-500">
              当前商品：{currentProduct.title} · {currentProduct.category}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setScriptOpen((value) => !value)}
            className="flex w-full items-center justify-between px-3 py-3 text-left"
          >
            <span>
              <span className="block text-[13px] font-medium">AI 脚本解析与微调</span>
              <span className="text-[11px] text-slate-400">可自己写、选官方模板，或让 AI 生成</span>
            </span>
            <ChevronDown className={cn("h-4 w-4 text-slate-400 transition", scriptOpen && "rotate-180")} />
          </button>
          <div className={cn("grid transition-[grid-template-rows] duration-300", scriptOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="overflow-hidden">
              {scriptBusy ? (
                <p className="px-3 pb-4 text-center text-xs font-medium text-violet-600">✨ AI 正在拆解商品卖点与前3秒钩子...</p>
              ) : scenes.length === 0 ? (
                <div>
                  <label className="block px-3">
                    <span className="sr-only">选择官方推荐脚本模板</span>
                    <select
                      value={scriptTemplate}
                      onChange={(event) => {
                        const found = SCRIPT_TEMPLATES.find((item) => item.id === event.target.value);
                        if (!found) {
                          setScriptTemplate("");
                          return;
                        }
                        setScriptTemplate(found.id);
                        setScenes(found.scenes.map((item, index) => ({ ...item, id: `${found.id}-${index}-${item.start}` })));
                      }}
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
                  <div className="my-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800">暂无脚本，请选择生成方式</h4>
                    <p className="mb-4 mt-1 max-w-xs text-xs text-slate-500">
                      您可以自己从头写，让 AI 结合上传的商品图自动撰写，或从上方选择官方爆款模板。
                    </p>
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAIGenerateScript}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90"
                      >
                        <Sparkles className="h-4 w-4" /> 🤖 AI 智能解析商品并生成脚本
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScriptTemplate("");
                          setScenes(blankScenes());
                          setScriptOpen(true);
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:border-violet-300 hover:text-violet-700"
                      >
                        <PenLine className="h-4 w-4" /> 自己写脚本
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
              <ScriptEditor
                scenes={scenes}
                lang={scriptLang}
                view={scriptView}
                templateId={scriptTemplate}
                polishing={polishing}
                onScenes={(next) => {
                  setScriptTemplate("");
                  setScenes(next);
                }}
                onLang={setScriptLang}
                onView={setScriptView}
                onTemplate={(id) => {
                  const found = SCRIPT_TEMPLATES.find((item) => item.id === id);
                  if (!found) {
                    setScriptTemplate("");
                    return;
                  }
                  setScriptTemplate(id);
                  setScenes(found.scenes.map((item, index) => ({ ...item, id: `${id}-${index}-${item.start}` })));
                }}
                onPolish={() => {
                  setPolishing(true);
                  window.setTimeout(() => {
                    setScenes((prev) => prev.map((item) => ({ ...item, [scriptLang]: polishLine(item[scriptLang], scriptLang) })));
                    setScriptTemplate("");
                    setPolishing(false);
                    pushToast("脚本已润色扩写", "success");
                  }, 700);
                }}
                onAdd={(index) => {
                  setScriptTemplate("");
                  setScenes((prev) => {
                    const next = [...prev];
                    next.splice(index + 1, 0, nextScene(prev[index] ?? prev[prev.length - 1]));
                    return next;
                  });
                }}
                onDelete={(id) => {
                  if (scenes.length <= 1) {
                    pushToast("至少保留一个分镜", "warning");
                    return;
                  }
                  setScriptTemplate("");
                  setScenes((prev) => prev.filter((item) => item.id !== id));
                }}
              />
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-[13px] font-medium">视频模型与规格</h2>
          <label className="block space-y-1">
            <span className="text-[11px] text-slate-400">模型</span>
            <select
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
            >
              {MODELS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <div>
            <p className="mb-1 text-[11px] text-slate-400">分辨率</p>
            <div className="grid grid-cols-2 gap-2">
              {(["480P", "720P"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setResolution(item)}
                  className={cn(
                    "h-9 rounded-xl border text-sm",
                    resolution === item ? "border-brand bg-brand-soft font-medium text-brand" : "border-slate-200 bg-white text-slate-500",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>时长</span>
              <span className="text-slate-600">{duration}s</span>
            </div>
            <Slider.Root
              min={5}
              max={30}
              step={1}
              value={[duration]}
              onValueChange={([value]) => setDuration(value)}
              className="relative flex h-5 w-full touch-none items-center"
            >
              <Slider.Track className="relative h-1.5 grow rounded-full bg-slate-200">
                <Slider.Range className="absolute h-full rounded-full bg-brand" />
              </Slider.Track>
              <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-brand bg-white shadow focus:outline-none" />
            </Slider.Root>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {DURATIONS.map((item) => (
                <button
                  key={item.sec}
                  type="button"
                  onClick={() => setDuration(item.sec)}
                  className={cn(
                    "h-8 rounded-lg text-xs",
                    duration === item.sec ? "bg-brand text-white" : "bg-white text-slate-500 ring-1 ring-slate-200",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[11px] text-slate-400">画幅 · 默认 9:16 竖屏信息流</p>
            <div className="grid grid-cols-5 gap-1.5">
              {RATIOS.map((item) => {
                const active = aspectRatio === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAspectRatio(item.id)}
                    className={cn(
                      "flex h-14 flex-col items-center justify-center rounded-lg border px-0.5 text-[10px] leading-tight",
                      active ? "border-brand bg-brand-soft font-medium text-brand" : "border-slate-200 bg-white text-slate-500",
                    )}
                  >
                    <span className={cn("mb-1 rounded-[2px] border border-current", item.box)} />
                    {item.id}
                    <span className="mt-0.5 text-[9px] opacity-80">{item.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <label className="block space-y-1">
            <span className="text-[11px] text-slate-400">投放地区 / 语言</span>
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value as "US" | "UK")}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
            >
              {LOCALES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </section>
      </div>
      <div className="relative border-t border-slate-200/80 bg-white px-4 pb-4 pt-5">
        <span className="absolute right-7 top-2 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
          限时 5 折
        </span>
        <button
          type="button"
          disabled={genStatus === "running"}
          onClick={() => {
            if (images.length > 0 && images.every((src) => adopted[src] === false)) {
              pushToast("请至少勾选一张要采纳的商品图", "warning");
              return;
            }
            startGeneration();
          }}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-medium text-white shadow-glow transition hover:bg-brand-hover disabled:opacity-60"
        >
          {genStatus === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          立即生成（消耗 {REMIX_COST} 算力）
        </button>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          {aspectRatio} · {resolution} · {duration}s · {region === "US" ? "美音" : "英音"}
        </p>
      </div>
    </aside>
    {pickerOpen ? (
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={() => setPickerOpen(false)}>
        <aside className="flex h-full w-[min(440px,100%)] flex-col bg-white p-5 shadow-pop" onClick={(event) => event.stopPropagation()}>
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold">选择已有商品</h2>
              <p className="mt-1 text-xs text-slate-400">选中后会替换复刻台里的商品图，并写入脚本卖点。</p>
            </div>
            <button type="button" onClick={() => setPickerOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-3 flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={pickerQuery}
              onChange={(event) => setPickerQuery(event.target.value)}
              placeholder="按标题搜索商品"
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {pickerItems.map((product) => (
              <div key={product.id} className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3 hover:border-brand">
                <img src={product.images[0]} alt="" className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.title}</p>
                  <p className="text-xs text-slate-400">
                    {product.category} · {product.images.length} 张图
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    loadProductIntoRemix(product);
                    setPickerOpen(false);
                  }}
                  className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                >
                  选用此商品图
                </button>
              </div>
            ))}
            {pickerItems.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">没有匹配的商品</p> : null}
          </div>
        </aside>
      </div>
    ) : null}
    </>
  );
}

function readImageMode(
  product: { category?: string; categoryTag?: string; title?: string } | null,
  count: number,
) {
  if (count <= 0) return "empty" as const;
  const blob = `${product?.category ?? ""} ${product?.categoryTag ?? ""} ${product?.title ?? ""}`;
  if (/服饰|服装|穿搭|鞋包|裙|裤|鞋|上衣|外套|夹克/.test(blob) && count >= 2) return "outfit" as const;
  if (count >= 2) return "multi" as const;
  return "single" as const;
}

function ImageReadout({ mode, total, adopted }: { mode: "outfit" | "multi" | "single" | "empty"; total: number; adopted: number }) {
  const outfitAll = adopted === total;
  const onlyFirst = adopted === 1;
  const pill =
    mode === "outfit"
      ? `✨ AI 识别: 成套穿搭组合 (${adopted}/${total} 张${outfitAll ? "全部采纳" : "已采纳"})`
      : mode === "multi"
        ? onlyFirst
          ? "⚠️ AI 识别: 检测到多款不同商品 (仅采纳第 1 款)"
          : `⚠️ AI 识别: 检测到多款不同商品 (已采纳 ${adopted} 张)`
        : `✨ AI 识别: 单品主体 (${adopted}/${total} 张采纳)`;
  const note =
    mode === "outfit"
      ? "已识别为整套搭配，模型将把上衣、裙子、鞋子整合成完整模特出镜穿搭。"
      : mode === "multi"
        ? "推荐以图 1 为主体生成。您可点击图片上的勾选框手动切换采纳项。"
        : "将以这张商品图作为生成主体。";
  return (
    <div className={cn("rounded-xl px-3 py-2", mode === "multi" ? "bg-amber-50" : "bg-brand-soft")}>
      <span
        className={cn(
          "inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-medium ring-1",
          mode === "multi" ? "text-amber-700 ring-amber-200" : "text-brand ring-brand/20",
        )}
      >
        {pill}
      </span>
      <p className="mt-1.5 text-[11px] leading-5 text-slate-500">{note}</p>
    </div>
  );
}
