"use client";

import Link from "next/link";
import { Crown, Plus, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useCreationStore } from "@/store/useCreationStore";
import { cn, formatInt } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const credits = useCreationStore((state) => state.credits);
  const enterpriseCredits = useCreationStore((state) => state.enterpriseCredits);
  const isPro = useCreationStore((state) => state.isPro);
  const toasts = useCreationStore((state) => state.toasts);
  const addCredits = useCreationStore((state) => state.addCredits);
  const pushToast = useCreationStore((state) => state.pushToast);

  return (
    <div className="flex h-screen flex-col bg-canvas text-ink">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200/80 bg-white px-4">
        <Link href="/inspiration" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            Mirra
            <span className="ml-1.5 text-xs font-medium text-slate-400">投流复刻</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {isPro ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 px-2.5 py-1 text-xs font-semibold text-amber-950 shadow-[0_0_14px_rgba(251,191,36,0.55)]">
              <Crown className="h-3.5 w-3.5" />
              企业 PRO · 点卡 {formatInt(enterpriseCredits)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              addCredits(2000);
              pushToast("已充值 2,000 算力", "success");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 py-1 pl-3 pr-1 text-sm text-rose-500 transition hover:bg-rose-100"
          >
            <Sparkles className="h-3.5 w-3.5" />
            算力 {formatInt(credits)}
            <span className="inline-flex items-center gap-0.5 rounded-full bg-white px-2 py-0.5 text-xs text-rose-400">
              <Plus className="h-3 w-3" />
              充值
            </span>
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-white">
            M
          </span>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
      <div className="pointer-events-none fixed left-1/2 top-4 z-[80] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rise flex items-center gap-2 rounded-full border border-slate-100 bg-white px-4 py-2 text-sm shadow-pop"
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                toast.tone === "success" && "bg-emerald-500",
                toast.tone === "warning" && "bg-amber-500",
                toast.tone === "info" && "bg-brand",
              )}
            />
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
