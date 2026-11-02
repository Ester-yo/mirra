"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, X } from "lucide-react";
import { useCreationStore } from "@/store/useCreationStore";
import { cn } from "@/lib/utils";

const FREE = ["只能单条排队生成", "无消重算法保障", "标清 480P"];
const PRO = [
  "5 路并发裂变",
  "底层特征码重混过审消重（秒过原创）",
  "4K 超清微距物理仿真",
  "专属爆单钩子库每日推送",
];

const PLANS = [
  {
    name: "月度冲量版",
    price: "$49",
    unit: "/ 月",
    note: "含 5,000 算力",
    featured: false,
  },
  {
    name: "季度爆单版",
    price: "$119",
    unit: "/ 季",
    note: "送消重过审插件",
    featured: true,
  },
];

export function ProPaywallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const unlockPro = useCreationStore((state) => state.unlockPro);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(920px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white shadow-pop focus:outline-none">
          <div className="flex items-start justify-between gap-4 px-7 pt-6">
            <div>
              <Dialog.Title className="text-xl font-semibold tracking-tight">解锁投流操盘手企业版</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-500">
                TikTok Shop / 千川专属 · 多路并发渲染与消重过审
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="grid gap-3 px-7 pt-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">免费版</p>
              <ul className="mt-3 space-y-2">
                {FREE.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-brand-soft p-4">
              <p className="text-sm font-medium text-brand">企业 PRO 版</p>
              <ul className="mt-3 space-y-2">
                {PRO.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-3 px-7 py-5 md:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border p-4",
                  plan.featured ? "border-brand bg-white shadow-glow" : "border-slate-100 bg-white",
                )}
              >
                {plan.featured ? (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-amber-200 to-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-950">
                    热卖推荐
                  </span>
                ) : null}
                <p className="text-sm text-slate-500">{plan.name}</p>
                <p className="mt-2 flex items-end gap-1">
                  <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
                  <span className="pb-1 text-sm text-slate-400">{plan.unit}</span>
                </p>
                <p className="mt-1 text-sm text-slate-500">{plan.note}</p>
                <button
                  type="button"
                  onClick={() => {
                    unlockPro(plan.name);
                    onClose();
                  }}
                  className="mt-4 h-10 w-full rounded-xl bg-brand text-sm font-medium text-white shadow-glow transition hover:bg-brand-hover"
                >
                  立即升级开通
                </button>
              </div>
            ))}
          </div>
          <p className="px-7 pb-6 text-center text-xs text-slate-400">演示环境，点击开通不会产生真实扣款。</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
