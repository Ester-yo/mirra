"use client";

import { RemixCanvas } from "@/components/studio/RemixCanvas";
import { RemixForm } from "@/components/studio/RemixForm";

export default function RemixPage() {
  return (
    <div className="flex h-full min-h-0">
      <RemixForm />
      <RemixCanvas />
    </div>
  );
}
