"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreationStore } from "@/store/useCreationStore";
import { readImageFiles } from "@/lib/utils";

const CATEGORY_OPTIONS = ["家居日用", "服饰鞋包", "个护美妆", "3C数码", "食品饮料"];

export default function ProductsPage() {
  const router = useRouter();
  const products = useCreationStore((state) => state.products);
  const addLibraryProduct = useCreationStore((state) => state.addLibraryProduct);
  const prepareBatchFromProduct = useCreationStore((state) => state.prepareBatchFromProduct);
  const loadProductIntoRemix = useCreationStore((state) => state.loadProductIntoRemix);
  const pushToast = useCreationStore((state) => state.pushToast);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [points, setPoints] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((item) => `${item.title} ${item.category}`.toLowerCase().includes(q));
  }, [products, query]);

  const resetForm = () => {
    setTitle("");
    setCategory(CATEGORY_OPTIONS[0]);
    setPoints("");
    setImages([]);
  };

  const save = () => {
    if (!title.trim() || images.length < 1) {
      pushToast("请填写标题并至少上传 1 张商品图", "warning");
      return;
    }
    addLibraryProduct({
      id: `p-${Date.now()}`,
      title: title.trim(),
      category,
      sellingPoints: points.trim() || "待补充核心卖点",
      images,
      videoCount: 0,
      testingHooks: 0,
    });
    pushToast("商品已加入商品库", "success");
    setOpen(false);
    resetForm();
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">我的商品库</h1>
            <p className="mt-1 text-sm text-slate-500">管理 SPU 主图和卖点，直接拿去开一轮 A/B 测。</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-white shadow-glow"
          >
            <Plus className="h-4 w-4" />
            添加新商品
          </button>
        </div>

        <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 shadow-card">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索商品名称或类目"
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
              <img src={product.images[0]} alt="" className="h-40 w-full object-cover" />
              <div className="space-y-3 p-4">
                <div>
                  <h2 className="text-sm font-medium">{product.title}</h2>
                  <p className="mt-1 text-xs text-slate-400">{product.category}</p>
                </div>
                <p className="text-xs text-slate-500">
                  关联生成视频: {product.videoCount}条 · 测试中钩子: {product.testingHooks}个
                </p>
                <button
                  type="button"
                  onClick={() => {
                    loadProductIntoRemix(product);
                    router.push("/studio/remix");
                  }}
                  className="h-9 w-full rounded-xl bg-brand text-xs font-medium text-white"
                >
                  一键带入复刻
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      prepareBatchFromProduct(product);
                      router.push("/studio/batch");
                    }}
                    className="h-9 flex-1 rounded-xl border border-slate-200 text-xs"
                  >
                    一键发起新 A/B 测
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/analytics?product=${product.id}`)}
                    className="h-9 flex-1 rounded-xl border border-slate-200 text-xs"
                  >
                    查看投放历史
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(520px,94vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 shadow-pop focus:outline-none">
            <div className="mb-4 flex items-start justify-between">
              <Dialog.Title className="text-base font-semibold">添加新商品</Dialog.Title>
              <Dialog.Close className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">上传 1 到 6 张商品图并填写卖点</Dialog.Description>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="商品标题"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              >
                {CATEGORY_OPTIONS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <textarea
                value={points}
                onChange={(event) => setPoints(event.target.value)}
                rows={3}
                placeholder="核心卖点"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
              />
              <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                {images.length ? `已选 ${images.length}/6 张` : "上传 1-6 张商品图"}
                <input
                  hidden
                  multiple
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []).slice(0, 6);
                    void readImageFiles(files).then(setImages);
                    event.target.value = "";
                  }}
                />
              </label>
              {images.length ? (
                <div className="flex gap-2">
                  {images.map((src) => (
                    <img key={src.slice(0, 48)} src={src} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  ))}
                </div>
              ) : null}
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
