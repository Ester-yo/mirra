import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mirra — 电商投流视频复刻",
  description: "把 TikTok / 抖音爆款带货视频拆成可投放的复刻素材，支持单条微调与企业批量裂变。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
