"use client";

import React, { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  AppWindow,
  Music,
  Image as ImageIcon,
  FileText,
  Copy,
  Download,
  Terminal,
} from "lucide-react";

// 1. Sleek Terminal Step Accordion (Matching Arena.ai Agent Mode)
export function TerminalCard({
  command,
  output,
  exitCode,
  isLive,
  durationMs,
}: {
  command: string;
  output: string;
  exitCode?: number;
  isLive?: boolean;
  durationMs?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const durationStr = durationMs
    ? durationMs >= 1000
      ? `${(durationMs / 1000).toFixed(1)}s`
      : `${durationMs}ms`
    : "68ms";

  return (
    <div className="my-1.5 select-none">
      {/* Step line: >_ used Bash ✓ 68ms ⌄ */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer py-1 px-1 rounded-md transition-colors group"
      >
        <span className="text-zinc-500 group-hover:text-zinc-300 font-mono font-bold text-xs">
          {isOpen ? "⌄" : ">"}
        </span>

        {/* Terminal icon block >_ */}
        <div className="flex items-center gap-1 font-mono text-[11px] bg-zinc-800/80 group-hover:bg-zinc-700/80 px-1.5 py-0.5 rounded text-zinc-300">
          <span className="text-[10px]">&gt;_</span>
        </div>

        <span className="text-zinc-300 font-medium">used Bash</span>

        {/* Checkmark & execution time */}
        <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
          {isLive ? (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          ) : (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{isLive ? "çalışıyor..." : durationStr}</span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ml-0.5 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Expanded Terminal Console with macOS styling */}
      {isOpen && (
        <div className="mt-1.5 bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#202024] border-b border-[#27272a]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              <span className="text-[11px] text-zinc-400 font-mono ml-1">$ bash</span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Kopyalandı" : "Kopyala"}</span>
            </button>
          </div>

          <div className="p-3 bg-[#09090b] font-mono text-xs text-zinc-300 space-y-2">
            <div className="flex items-start gap-2 text-zinc-100">
              <span className="text-emerald-400 font-bold">$</span>
              <span className="break-all">{command}</span>
            </div>
            <pre className="max-h-56 overflow-auto text-zinc-400 whitespace-pre-wrap text-[11px] leading-relaxed pt-1 border-t border-zinc-900">
              {output || (isLive ? "(komut yürütülüyor...)" : "(çıktı yok)")}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: Get Badge & Icon for File Artifacts
function getArtifactMeta(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "txt";
  switch (ext) {
    case "html":
    case "htm":
      return {
        badge: "HTML",
        icon: <AppWindow className="w-4 h-4 text-zinc-300" />,
        mode: "preview" as const,
      };
    case "tsx":
      return {
        badge: "TSX",
        icon: <Code2 className="w-4 h-4 text-zinc-300" />,
        mode: "code" as const,
      };
    case "jsx":
      return {
        badge: "JSX",
        icon: <Code2 className="w-4 h-4 text-zinc-300" />,
        mode: "code" as const,
      };
    case "js":
      return {
        badge: "JS",
        icon: <Code2 className="w-4 h-4 text-zinc-300" />,
        mode: "code" as const,
      };
    case "ts":
      return {
        badge: "TS",
        icon: <Code2 className="w-4 h-4 text-zinc-300" />,
        mode: "code" as const,
      };
    case "py":
      return {
        badge: "PY",
        icon: <Code2 className="w-4 h-4 text-blue-400" />,
        mode: "code" as const,
      };
    case "css":
      return {
        badge: "CSS",
        icon: <Code2 className="w-4 h-4 text-sky-400" />,
        mode: "code" as const,
      };
    case "mp3":
    case "wav":
    case "ogg":
    case "m4a":
      return {
        badge: "MP3",
        icon: <Music className="w-4 h-4 text-pink-400" />,
        mode: "audio" as const,
      };
    case "png":
    case "jpg":
    case "jpeg":
    case "svg":
    case "webp":
      return {
        badge: "IMG",
        icon: <ImageIcon className="w-4 h-4 text-emerald-400" />,
        mode: "image" as const,
      };
    default:
      return {
        badge: ext.toUpperCase().slice(0, 4),
        icon: <FileText className="w-4 h-4 text-zinc-400" />,
        mode: "code" as const,
      };
  }
}

// 2. Exact Arena.ai Artifact Card: [ </> ] page.tsx  [ JS ]
export function FileWriteCard({
  path,
  content,
  onOpenStudio,
}: {
  path: string;
  content: string;
  onOpenStudio: (path: string, mode?: "preview" | "code" | "image" | "audio") => void;
}) {
  const shortName = path.split("/").pop() || path;
  const meta = getArtifactMeta(shortName);

  return (
    <div className="my-2 space-y-1">
      {/* Single Step item: > Edit openarena/frontend-next/app/page.tsx */}
      <div className="flex items-center gap-2 text-xs text-zinc-400 py-0.5 px-1 font-mono">
        <span className="text-zinc-500 font-bold">&gt;</span>
        <span className="text-zinc-300 font-medium">Edit</span>
        <span className="text-zinc-500 truncate max-w-xs">{path}</span>
      </div>

      {/* Artifact Card Box: [ </> ] page.tsx      [ JS ] */}
      <div
        onClick={() => onOpenStudio(path, meta.mode)}
        className="flex items-center justify-between px-4 py-3 bg-[#1e1e22] hover:bg-[#25252a] border border-[#2d2d33] hover:border-zinc-600 rounded-xl cursor-pointer transition-all shadow-md group"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-white transition-colors">
            {meta.icon}
          </div>
          <span className="text-sm font-medium text-zinc-200 group-hover:text-white font-mono truncate">
            {shortName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`/api/workspace/download?path=${encodeURIComponent(path)}`}
            download={shortName}
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-zinc-500 hover:text-sky-400 transition-colors"
            title="Cihaza İndir"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
          <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#29292e] text-zinc-300 border border-[#3c3c43] rounded-md tracking-wider">
            {meta.badge}
          </span>
        </div>
      </div>
    </div>
  );
}

// 3. Music / MP3 Artifact Card
export function MusicCard({
  title,
  filename,
  channel,
  duration,
  sizeHuman,
  coverUrl,
  previewUrl,
  downloadUrl,
  onOpenStudio,
}: {
  title: string;
  filename: string;
  channel?: string;
  duration?: any;
  sizeHuman?: string;
  coverUrl?: string;
  previewUrl: string;
  downloadUrl: string;
  onOpenStudio: (path: string, mode?: "audio") => void;
}) {
  const shortName = filename.split("/").pop() || filename;
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="my-2 space-y-1.5">
      {/* Step label */}
      <div className="flex items-center gap-2 text-xs text-zinc-400 py-0.5 px-1 font-mono">
        <span className="text-zinc-500 font-bold">&gt;</span>
        <span className="text-pink-400 font-medium">Download Music</span>
        <span className="text-zinc-500 truncate max-w-xs">{title}</span>
        <span className="text-[11px] text-emerald-400 ml-auto">✓ 320kbps</span>
      </div>

      {/* Artifact Pill */}
      <div
        onClick={() => onOpenStudio(filename, "audio")}
        className="flex items-center justify-between px-4 py-3 bg-[#1e1e22] hover:bg-[#25252a] border border-pink-500/30 hover:border-pink-500/60 rounded-xl cursor-pointer transition-all shadow-md group"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 text-pink-400 group-hover:scale-110 transition-transform">
            <Music className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-medium text-zinc-100 group-hover:text-white font-mono truncate">
              {shortName}
            </div>
            {channel && <div className="text-[11px] text-zinc-400 truncate">{channel}</div>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={downloadUrl}
            download={shortName}
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-zinc-400 hover:text-pink-400 transition-colors"
            title="Cihaza İndir (MP3)"
          >
            <Download className="w-4 h-4" />
          </a>
          <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#29292e] text-pink-300 border border-pink-500/40 rounded-md tracking-wider">
            MP3
          </span>
        </div>
      </div>

      {/* Compact Audio Player Bar */}
      <div className="px-2">
        <audio controls src={previewUrl} className="w-full h-9 rounded-lg outline-none" />
      </div>
    </div>
  );
}

// 4. Download / Image Artifact Card
export function MediaDownloadCard({
  filename,
  sizeHuman,
  isImage,
  previewUrl,
  downloadUrl,
  onOpenStudio,
}: {
  filename: string;
  sizeHuman?: string;
  isImage?: boolean;
  previewUrl: string;
  downloadUrl: string;
  onOpenStudio: (path: string, mode?: "image" | "code") => void;
}) {
  const shortName = filename.split("/").pop() || filename;
  const meta = getArtifactMeta(shortName);

  return (
    <div className="my-2 space-y-1.5">
      {/* Step line */}
      <div className="flex items-center gap-2 text-xs text-zinc-400 py-0.5 px-1 font-mono">
        <span className="text-zinc-500 font-bold">&gt;</span>
        <span className="text-sky-400 font-medium">Download</span>
        <span className="text-zinc-500 truncate max-w-xs">{shortName}</span>
        {sizeHuman && <span className="text-zinc-500 text-[11px] ml-auto">{sizeHuman}</span>}
      </div>

      {/* Artifact Pill */}
      <div
        onClick={() => onOpenStudio(filename, isImage ? "image" : "code")}
        className="flex items-center justify-between px-4 py-3 bg-[#1e1e22] hover:bg-[#25252a] border border-[#2d2d33] hover:border-zinc-600 rounded-xl cursor-pointer transition-all shadow-md group"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-white transition-colors">
            {meta.icon}
          </div>
          <span className="text-sm font-medium text-zinc-200 group-hover:text-white font-mono truncate">
            {shortName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={downloadUrl}
            download={shortName}
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-zinc-400 hover:text-sky-400 transition-colors"
            title="Cihaza İndir"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
          <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#29292e] text-zinc-300 border border-[#3c3c43] rounded-md tracking-wider">
            {meta.badge}
          </span>
        </div>
      </div>
    </div>
  );
}
