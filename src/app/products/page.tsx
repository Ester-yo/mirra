"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Clapperboard, ImagePlus, LayoutGrid, List, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LibraryProduct } from "@/lib/types";
import { useCreationStore } from "@/store/useCreationStore";
import { cn, readImageFiles } from "@/lib/utils";

const CATEGORY_OPTIONS = ["美妆", "3C数码", "服饰", "家居", "户外"];
const MAX_IMAGES = 8;

const SCRAPE_IMAGES = [
  "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80",
];

const emptyForm = {
  title: "",
  category: CATEGORY_OPTIONS[0],
  audience: "",
  points: "",
  images: [] as string[],
};

export default function ProductsPage() {
  const router = useRouter();
  const products = useCreationStore((state) => state.products);
  const addLibraryProduct = useCreationStore((state) => state.addLibraryProduct);
  const updateLibraryProduct = useCreationStore((state) => state.updateLibraryProduct);
  const loadProductIntoRemix = useCreationStore((state) => state.loadProductIntoRemix);
  const removeLibraryProduct = useCreationStore((state) => state.removeLibraryProduct);
  const pushToast = useCreationStore((state) => state.pushToast);

  const [query, setQuery] = useState("");
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LibraryProduct | null>(null);
  const [tab, setTab] = useState<"manual" | "scrape">("manual");
  const [form, setForm] = useState(emptyForm);
  const [sourceUrl, setSourceUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((item) => `${item.title} ${item.category} ${item.audience ?? ""}`.toLowerCase().includes(q));
  }, [products, query]);

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setSourceUrl("");
    setTab("manual");
    setCreateModalOpen(true);
  };

  const openEdit = (product: LibraryProduct) => {
    setEditingProduct(product);
    setForm({
      title: product.title,
      category: CATEGORY_OPTIONS.includes(product.category) ? product.category : CATEGORY_OPTIONS[0],
      audience: product.audience ?? "",
      points: product.sellingPoints,
      images: product.images.slice(0, MAX_IMAGES),
    });
    setSourceUrl("");
    setTab("manual");
    setCreateModalOpen(true);
  };

  const scrape = () => {
    if (!sourceUrl.trim()) {
      pushToast("请先粘贴 Amazon 或 TikTok Shop 链接", "warning");
      return;
    }
    setScraping(true);
    window.setTimeout(() => {
      const lower = sourceUrl.toLowerCase();
      const beauty = lower.includes("beauty") || lower.includes("serum");
      setForm({
        title: beauty ? "玻璃肌精华液 30ml" : "磁吸无线充电宝 10000mAh",
        category: beauty ? "美妆" : "3C数码",
        audience: beauty ? "18-35岁 欧美白领" : "18-30岁 通勤数码党",
        points: beauty
          ? "• 一滴铺开，无白膜\n• 上脸前后毛孔对比\n• 适合 9:16 美妆口播"
          : "• 磁吸一贴即充\n• 20W 双向快充\n• 10000mAh，登机友好\n• 适合通勤桌面和包内场景",
        images: SCRAPE_IMAGES,
      });
      setScraping(false);
      setTab("manual");
      pushToast("已抓取商品信息，请核对后保存", "success");
    }, 1000);
  };

  const addImages = async (files: File[]) => {
    const room = MAX_IMAGES - form.images.length;
    if (room <= 0) {
      pushToast("最多上传 8 张商品图", "warning");
      return;
    }
    const urls = await readImageFiles(files.slice(0, room));
    setForm((current) => ({ ...current, images: [...current.images, ...urls].slice(0, MAX_IMAGES) }));
  };

  const moveImage = (from: number, to: number) => {
    if (from === to) return;
    setForm((current) => {
      const next = [...current.images];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...current, images: next };
    });
  };

  const save = () => {
    if (!form.title.trim()) {
      pushToast("请填写商品名称", "warning");
      return;
    }
    if (!form.images.length) {
      pushToast("请至少添加 1 张商品图", "warning");
      return;
    }
    const next: LibraryProduct = {
      id: editingProduct?.id ?? `p-${Date.now()}`,
      title: form.title.trim(),
      category: form.category,
      categoryTag: form.category,
      audience: form.audience.trim(),
      sellingPoints: form.points.trim() || "待补充核心卖点",
      images: form.images,
      videoCount: editingProduct?.videoCount ?? 0,
      testingHooks: editingProduct?.testingHooks ?? 0,
    };
    if (editingProduct) updateLibraryProduct(next);
    else addLibraryProduct(next);
    pushToast(editingProduct ? "商品资料已更新" : "商品已加入商品库", "success");
    setCreateModalOpen(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">我的商品库</h1>
            <p className="mt-1 text-sm text-slate-500">管理主图、受众和卖点，直接拿去复刻或开一轮 A/B 测。</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-white shadow-glow"
          >
            <Plus className="h-4 w-4" />
            新建商品
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 shadow-card">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索商品名称、类目或受众"
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex h-10 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn("inline-flex items-center gap-1 rounded-lg px-2.5 text-xs", view === "grid" ? "bg-white font-medium shadow-card" : "text-slate-500")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              网格视图
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn("inline-flex items-center gap-1 rounded-lg px-2.5 text-xs", view === "list" ? "bg-white font-medium shadow-card" : "text-slate-500")}
            >
              <List className="h-3.5 w-3.5" />
              列表明细
            </button>
          </div>
        </div>

        {view === "grid" ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
                <div className="relative aspect-square max-h-[180px] w-full overflow-hidden bg-slate-100">
                  <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">🖼️ {product.images.length} 张图</span>
                </div>
                <div className="space-y-1.5 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <h2 className="min-w-0 flex-1 truncate text-sm font-medium" title={product.sellingPoints}>
                      {product.title}
                    </h2>
                    <span className="shrink-0 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] text-brand-ink">{product.categoryTag ?? product.category}</span>
                  </div>
                  {product.audience ? <p className="truncate text-xs text-slate-500">{product.audience}</p> : null}
                  <ProductActions
                    onRemix={() => {
                      loadProductIntoRemix(product);
                      router.push("/studio/remix");
                    }}
                    onEdit={() => openEdit(product)}
                    onDelete={() => {
                      removeLibraryProduct(product.id);
                      pushToast(`已移除 ${product.title}`, "success");
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">商品</th>
                  <th className="px-3 py-2 font-medium">类目</th>
                  <th className="px-3 py-2 font-medium">受众</th>
                  <th className="px-3 py-2 font-medium">图片</th>
                  <th className="px-3 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <tr key={product.id} className="border-t border-slate-50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <img src={product.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <span className="max-w-[220px] truncate font-medium" title={product.sellingPoints}>
                          {product.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{product.categoryTag ?? product.category}</td>
                    <td className="max-w-[160px] truncate px-3 py-2 text-xs text-slate-500">{product.audience || "—"}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">{product.images.length} 张</td>
                    <td className="px-3 py-2">
                      <ProductActions
                        compact
                        onRemix={() => {
                          loadProductIntoRemix(product);
                          router.push("/studio/remix");
                        }}
                        onEdit={() => openEdit(product)}
                        onDelete={() => {
                          removeLibraryProduct(product.id);
                          pushToast(`已移除 ${product.title}`, "success");
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog.Root open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 transition-opacity" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(720px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 shadow-pop focus:outline-none">
            <div className="mb-4 flex items-start justify-between">
              <Dialog.Title className="text-base font-semibold">{editingProduct ? "编辑商品" : "新建商品"}</Dialog.Title>
              <Dialog.Close className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">填写商品资料或从跨境链接抓取</Dialog.Description>

            <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm">
              {(
                [
                  ["manual", "手动输入信息"],
                  ["scrape", "跨境链接一键抓取"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn("h-9 rounded-lg transition", tab === id ? "bg-white font-medium shadow-card" : "text-slate-500")}
                >
                  {id === "scrape" ? "⚡️ " : ""}
                  {label}
                </button>
              ))}
            </div>

            {tab === "scrape" ? (
              <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p className="mb-2 text-xs text-slate-400">Amazon / TikTok Shop</p>
                <div className="flex gap-2">
                  <input
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    placeholder="粘贴商品链接"
                    className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={scrape}
                    disabled={scraping}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-ink px-3 text-sm text-white disabled:opacity-60"
                  >
                    {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {scraping ? "抓取中" : "抓取解析"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-slate-400">商品名称</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="例如 智能温显保温杯"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-slate-400">类目</span>
                  <select
                    value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                  >
                    {CATEGORY_OPTIONS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-slate-400">目标受众</span>
                  <input
                    value={form.audience}
                    onChange={(event) => setForm({ ...form, audience: event.target.value })}
                    placeholder="18-35岁 欧美白领"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-slate-400">核心卖点</span>
                <textarea
                  value={form.points}
                  onChange={(event) => setForm({ ...form, points: event.target.value })}
                  rows={4}
                  placeholder="真空双层，沸水直浇不冒汗"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                />
              </label>

              <div>
                <p className="mb-2 text-xs text-slate-400">商品图 {form.images.length}/{MAX_IMAGES}，拖动可调整顺序</p>
                <div className="flex flex-wrap gap-2">
                  {form.images.map((src, index) => (
                    <div
                      key={`${src.slice(0, 24)}-${index}`}
                      draggable
                      onDragStart={() => setDragFrom(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (dragFrom === null) return;
                        moveImage(dragFrom, index);
                        setDragFrom(null);
                      }}
                      className="group relative h-20 w-20 cursor-grab overflow-hidden rounded-xl border border-slate-100"
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, images: current.images.filter((_, item) => item !== index) }))}
                        className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-md bg-black/70 text-white group-hover:flex"
                        aria-label="删除图片"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {form.images.length < MAX_IMAGES ? (
                    <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-400 transition hover:border-brand hover:text-brand">
                      <ImagePlus className="h-4 w-4" />
                      添加图片
                      <input
                        hidden
                        multiple
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          void addImages(Array.from(event.target.files ?? []));
                          event.target.value = "";
                        }}
                      />
                    </label>
                  ) : null}
                </div>
              </div>

              <button type="button" onClick={save} className="h-10 w-full rounded-xl bg-brand text-sm font-medium text-white">
                保存到商品库
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function ProductActions({
  compact,
  onRemix,
  onEdit,
  onDelete,
}: {
  compact?: boolean;
  onRemix: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn("flex items-center gap-1", compact ? "" : "pt-0.5")}>
      <button
        type="button"
        onClick={onRemix}
        className={cn(
          "inline-flex items-center justify-center gap-1 rounded-lg bg-brand py-1.5 text-xs font-medium text-white",
          compact ? "px-2.5" : "flex-1",
        )}
      >
        <Clapperboard className="h-3.5 w-3.5" />
        一键复刻
      </button>
      <button type="button" aria-label="编辑" onClick={onEdit} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-brand">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button type="button" aria-label="删除" onClick={onDelete} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-rose-500">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
