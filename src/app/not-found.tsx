import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <p className="text-base font-medium">这个页面不在工作台里</p>
      <Link href="/inspiration" className="text-sm text-brand">
        返回灵感视频
      </Link>
    </div>
  );
}
