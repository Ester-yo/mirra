"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function PreviewModal({
  open,
  title,
  videoUrl,
  posterUrl,
  onClose,
}: {
  open: boolean;
  title: string;
  videoUrl: string;
  posterUrl: string;
  onClose: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-4 shadow-pop focus:outline-none">
          <div className="mb-3 flex items-start justify-between gap-3">
            <Dialog.Title className="text-sm font-medium leading-5">{title}</Dialog.Title>
            <Dialog.Close className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">视频预览</Dialog.Description>
          <div className="overflow-hidden rounded-2xl bg-slate-950">
            {videoUrl ? (
              <video
                key={videoUrl}
                src={videoUrl}
                poster={posterUrl}
                controls
                autoPlay
                playsInline
                className="aspect-[9/16] w-full bg-black object-contain"
              />
            ) : (
              <div className="flex aspect-[9/16] items-center justify-center text-sm text-slate-400">暂无可播放成片</div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
