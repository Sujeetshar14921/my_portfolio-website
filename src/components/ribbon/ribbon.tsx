"use client";

import React from "react";

interface SignBadgeProps {
  text?: string;
}

export default function SignBadge({ text = "Available Now" }: SignBadgeProps) {
  return (
    <div className="flex justify-center px-4 py-12">
      <div className="flex items-center gap-5 sm:gap-8">
        {/* left line — fades in from nothing */}
        <span
          className="h-px w-12 sm:w-20"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(163,163,163,0.6))",
          }}
        />

        {/* dot + text */}
        <div className="flex items-center gap-3 whitespace-nowrap">
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="absolute h-5 w-5 rounded-full bg-emerald-400/20 blur-[6px]" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
          </span>
          <span className="text-[13px] sm:text-sm font-medium uppercase tracking-[0.22em] text-neutral-700 dark:text-neutral-200">
            {text}
          </span>
        </div>

        {/* right line — fades out to nothing */}
        <span
          className="h-px w-12 sm:w-20"
          style={{
            background:
              "linear-gradient(to left, transparent, rgba(163,163,163,0.6))",
          }}
        />
      </div>
    </div>
  );
}