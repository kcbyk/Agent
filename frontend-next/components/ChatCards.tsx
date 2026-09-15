"use client";

import React, { useState } from "react";
import {
  Terminal,
  FileCode,
  Music,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Play,
} from "lucide-react";

// 1. Terminal Card
export function TerminalCard({
  command,
  output,
  exitCode,
  isLive,
}: {
  command: string;
  output: string;
  exitCode?: number;
  isLive?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden my-2 shadow-lg">
      {/* Header with macOS dots */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-[#202024] border-b border-[#27272a] cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {/* macOS window dots */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-xs font-semibold text-zinc-200">Terminal</span>
          <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
            bash
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Çalışıyor...
            </span>
          ) : exitCode !== undefined ? (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                exitCode === 0
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/10 text-red-400 border-red-500/30"
              }`}
            >
              {exitCode === 0 ? "✓ exit 0" : `✗ exit ${exitCode}`}
            </span>
          ) : null}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="p-1 text-zinc-400 hover:text-white"
            title="Komutu Kopyala"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-3 bg-[#09090b] font-mono text-xs text-zinc-300 space-y-2">
          <div className="flex items-center gap-2 text-zinc-100">
            <span className="text-emerald-400 font-bold">$</span>
            <span className="overflow-x-auto">{command}</span>
          </div>
          <pre className="max-h-56 overflow-auto text-zinc-400 whitespace-pre-wrap text-[11px] leading-relaxed pt-1 border-t border-zinc-900">
            {output || (isLive ? "(komut yürütülüyor...)" : "(çıktı yok)")}
          </pre>
        </div>
      )}
    </div>
  );
}

// 2. Code / File Write Card
export function FileWriteCard({
  path,
  content,
  onOpenStudio,
}: {
  path: string;
  content: string;
  onOpenStudio: (path: string, mode?: "preview" | "code") => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const ext = path.split(".").pop()?.toLowerCase() || "txt";
  const isHtml = ext === "html" || ext === "htm";
  const lineCount = content ? content.split("\n").length : 1;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden my-2 shadow-lg">
      <div
        className="flex items-center justify-between px-3 py-2 bg-[#202024] border-b border-[#27272a] cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <FileCode className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-xs font-semibold text-zinc-200 truncate font-mono">
            {path}
          </span>
          <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded uppercase">
            {ext}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            ✓ Yazıldı
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
        </div>
      </div>

      {isOpen && (
        <>
          <div className="bg-[#09090b] border-t border-[#27272a]">
            <div className="flex items-center justify-between px-3 py-1 bg-[#121214] border-b border-[#1f1f23] text-[10.5px] text-zinc-500 font-mono">
              <span>{lineCount} Satır</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-zinc-400 hover:text-white"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Kopyalandı" : "Kopyala"}</span>
              </button>
            </div>
            <pre className="p-3 max-h-56 overflow-auto font-mono text-xs text-zinc-200 whitespace-pre leading-relaxed">
              <code>{content}</code>
            </pre>
          </div>

          <div className="p-2.5 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs text-zinc-400">Dosya workspace'e kaydedildi.</span>
            <div className="flex items-center gap-2">
              <a
                href={`/api/workspace/download?path=${encodeURIComponent(path)}`}
                download={path.split("/").pop()}
                className="inline-flex items-center gap-1 text-xs text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-lg hover:bg-sky-500/20 font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>İndir</span>
              </a>
              <button
                onClick={() => onOpenStudio(path, "code")}
                className="inline-flex items-center gap-1 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg"
              >
                ✏️ Stüdyoda Aç
              </button>
              {isHtml && (
                <button
                  onClick={() => onOpenStudio(path, "preview")}
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg font-medium"
                >
                  🌐 Canlı Önizle
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 3. Music / MP3 Player Card
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
  return (
    <div className="bg-[#18181b] border border-pink-500/30 rounded-2xl p-4 my-2 shadow-xl space-y-3">
      <div className="flex items-center gap-3">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-14 h-14 rounded-xl object-cover border border-[#27272a] shadow"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-2xl">
            🎵
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <div className="font-semibold text-white text-sm truncate font-mono">
            {title}
          </div>
          <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
            {channel && <span>{channel}</span>}
            <span className="text-pink-400 font-medium">320 kbps MP3</span>
            {sizeHuman && <span className="text-sky-400">• {sizeHuman}</span>}
          </div>
        </div>
      </div>

      <audio controls src={previewUrl} className="w-full outline-none h-10 rounded-lg" />

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={() => onOpenStudio(filename, "audio")}
          className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 bg-zinc-800 rounded-lg"
        >
          🔍 Oynatıcıda Aç
        </button>
        <a
          href={downloadUrl}
          download={filename}
          className="inline-flex items-center gap-1.5 text-xs text-white bg-pink-600 hover:bg-pink-500 px-3.5 py-1.5 rounded-lg font-semibold shadow-md shadow-pink-600/30 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Cihazına İndir (MP3)</span>
        </a>
      </div>
    </div>
  );
}

// 4. Download / Image Card
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
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 my-2 shadow-lg space-y-3">
      {isImage && (
        <div className="bg-[#09090b] rounded-lg p-2 flex items-center justify-center max-h-56 overflow-hidden">
          <img
            src={previewUrl}
            alt={filename}
            className="max-h-52 object-contain rounded"
          />
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-lg">{isImage ? "🖼️" : "📁"}</span>
          <div>
            <div className="font-semibold text-white text-xs sm:text-sm truncate font-mono">
              {filename}
            </div>
            <div className="text-[11px] text-zinc-400">
              {sizeHuman} • Workspace'e kaydedildi ✓
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenStudio(filename, isImage ? "image" : "code")}
            className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 bg-zinc-800 rounded-lg"
          >
            🔍 Önizle
          </button>
          <a
            href={downloadUrl}
            download={filename}
            className="inline-flex items-center gap-1 text-xs text-white bg-sky-600 hover:bg-sky-500 px-3 py-1.5 rounded-lg font-semibold shadow transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cihazına İndir</span>
          </a>
        </div>
      </div>
    </div>
  );
}
