"use client";

import type { Source } from "@/types";

interface Props {
  sources: Source[];
}

export function SourcesPanel({ sources }: Props) {
  if (sources.length === 0) return null;

  return (
    <aside className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        Sources
      </h2>
      {sources.map((s, i) => (
        <div
          key={`${s.source}:${s.page}:${i}`}
          className="rounded-lg border border-border bg-panel p-3 text-sm"
        >
          <div className="mb-1.5 flex items-center gap-2">
            <span className="rounded bg-accent/20 px-1.5 py-0.5 text-xs font-mono text-accent">
              {s.source}
            </span>
            <span className="text-xs text-slate-400">p. {s.page}</span>
          </div>
          <p className="line-clamp-4 text-xs leading-relaxed text-slate-300">
            {s.text}
          </p>
        </div>
      ))}
    </aside>
  );
}
