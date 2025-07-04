"use client";

import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#15803d]" />
        <p className="mt-2 text-[#166534]">Loading farm data...</p>
      </div>
    </div>
  );
}
