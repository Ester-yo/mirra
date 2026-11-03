"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Clapperboard, FolderOpen, Lightbulb, Package, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  {
    label: "灵感",
    items: [{ href: "/inspiration", label: "灵感视频", icon: Lightbulb }],
  },
  {
    label: "创作",
    items: [
      { href: "/studio/remix", label: "🎬 智能成片", icon: Clapperboard },
      { href: "/studio/batch", label: "批量生成", icon: Zap, pro: true },
    ],
  },
  {
    label: "资产与数据",
    items: [
      { href: "/products", label: "我的商品库", icon: Package },
      { href: "/analytics", label: "投放看板 & A/B测", icon: BarChart3, pro: true },
      { href: "/history", label: "历史导出", icon: FolderOpen },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-slate-200/80 bg-white px-3 py-4">
      {NAV.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="px-2 pb-1.5 text-[11px] font-medium tracking-wide text-slate-400">{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-lg px-2.5 text-[13px] text-slate-600 transition hover:bg-slate-50",
                    active && "bg-brand-soft font-medium text-brand",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {"pro" in item && item.pro ? (
                    <span className="ml-auto shrink-0 rounded-full bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-950 shadow-[0_0_10px_rgba(251,191,36,0.75)]">
                      PRO
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
