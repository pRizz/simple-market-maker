"use client";

import { useState } from "react";

import type { BuildInfo } from "@/modules/build-info/build-info";

type ProvenanceFooterProps = {
  buildInfo: BuildInfo;
};

export function ProvenanceFooter({
  buildInfo,
}: ProvenanceFooterProps): React.JSX.Element {
  const [copyLabel, setCopyLabel] = useState("Copy build info");

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(buildInfo.copyableSummary);
      setCopyLabel("Copied");

      window.setTimeout(() => {
        setCopyLabel("Copy build info");
      }, 2_000);
    } catch {
      setCopyLabel("Copy failed");

      window.setTimeout(() => {
        setCopyLabel("Copy build info");
      }, 2_000);
    }
  };

  return (
    <footer className="border-t border-white/10 bg-slate-950/95">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-4 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-slate-100">Build provenance</p>
          <p className="text-slate-400">
            Version {buildInfo.version} · Commit {buildInfo.shortCommit} · Build{" "}
            {buildInfo.buildTime}
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-full border border-cyan-400/40 px-4 py-2 font-medium text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/10"
          onClick={() => {
            void handleCopy();
          }}
          type="button"
        >
          {copyLabel}
        </button>
      </div>
    </footer>
  );
}
