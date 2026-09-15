"use client";

import React from "react";
import { Sparkles, Folder, Menu, ChevronDown } from "lucide-react";

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenWorkspace: () => void;
  fileCount: number;
}

export default function Header({
  onOpenSidebar,
  onOpenWorkspace,
  fileCount,
}: HeaderProps) {
  return (
    <header className="h-[52px] bg-[#18181b] border-b border-[#27272a] flex items-center justify-between px-3 sm:px-4 z-30 shrink-0 select-none w-full">
      {/* Left Menu Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSidebar}
          className="flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60 p-2 rounded-lg transition-colors"
          title="Menü ve Ayarlar"
        >
          <Menu className="w-5 h-5" />
          <span className="hidden sm:inline-flex text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">
            Gemini Flash
          </span>
        </button>
      </div>

      {/* Center Title */}
      <div
        onClick={onOpenSidebar}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] cursor-pointer transition-colors max-w-[170px] sm:max-w-xs"
      >
        <span className="text-emerald-400 font-bold text-sm">※</span>
        <span className="text-xs sm:text-sm font-semibold text-zinc-100 truncate">
          OpenArena Agent
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
      </div>

      {/* Right Workspace Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenWorkspace}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 p-2 rounded-lg transition-colors relative"
          title="Workspace Dosyaları"
        >
          <Folder className="w-5 h-5 text-zinc-300" />
          {fileCount > 0 && (
            <span className="text-[10px] font-bold bg-emerald-500 text-black px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
              {fileCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
