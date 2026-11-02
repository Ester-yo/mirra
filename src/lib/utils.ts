import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ScriptBreakdown } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatInt(value: number) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatStamp(iso: string) {
  const shifted = new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${p(shifted.getUTCMonth() + 1)}-${p(shifted.getUTCDate())} ${p(shifted.getUTCHours())}:${p(shifted.getUTCMinutes())}`;
}

export function buildPrompt(parts: {
  title: string;
  script: ScriptBreakdown;
  model: string;
  resolution: string;
  duration: number;
  locale: string;
  hookName?: string;
}) {
  return [
    `Product: ${parts.title}`,
    parts.hookName ? `Hook: ${parts.hookName}` : "",
    `HOOK: ${parts.script.hook}`,
    `DEMO: ${parts.script.demo}`,
    `CTA: ${parts.script.cta}`,
    `Model: ${parts.model}`,
    `Ratio: 9:16`,
    `Resolution: ${parts.resolution}`,
    `Duration: ${parts.duration}s`,
    `Voice: ${parts.locale}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function downloadMp4(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("download failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    return "saved" as const;
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
    return "opened" as const;
  }
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function readImageFiles(files: File[]) {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
    ),
  );
}
