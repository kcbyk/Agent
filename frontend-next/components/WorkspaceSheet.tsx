"use client";

import React, { useRef } from "react";
import {
  X,
  RefreshCw,
  Archive,
  Upload,
  FileCode,
  FileText,
  FileSpreadsheet,
  Globe,
  Terminal,
  Download,
  ExternalLink,
  Square,
  Music,
  Image as ImageIcon,
} from "lucide-react";

export interface WorkspaceItem {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
}

export interface ProcessItem {
  process_id: string;
  name?: string;
  command: string;
  listening_ports?: number[];
}

interface WorkspaceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: WorkspaceItem[];
  processes: ProcessItem[];
  onRefresh: () => void;
  onOpenFile: (path: string, mode?: "preview" | "code" | "image" | "audio") => void;
  onStopProcess: (pid: string) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html":
    case "htm":
      return <Globe className="w-4 h-4 text-orange-400 shrink-0" />;
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
      return <FileCode className="w-4 h-4 text-yellow-400 shrink-0" />;
    case "py":
      return <FileCode className="w-4 h-4 text-blue-400 shrink-0" />;
    case "css":
    case "scss":
      return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
    case "mp3":
    case "wav":
    case "ogg":
    case "m4a":
      return <Music className="w-4 h-4 text-pink-400 shrink-0" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "svg":
    case "webp":
      return <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />;
    default:
      return <FileText className="w-4 h-4 text-zinc-400 shrink-0" />;
  }
}

export default function WorkspaceSheet({
  isOpen,
  onClose,
  items,
  processes,
  onRefresh,
  onOpenFile,
  onStopProcess,
}: WorkspaceSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("file", files[i]);
      try {
        await fetch("/api/workspace/upload", {
          method: "POST",
          body: formData,
        });
      } catch (err) {}
    }
    e.target.value = "";
    onRefresh();
  };

  const visibleFiles = items.filter(
    (i) => i.type === "file" && !i.name.startsWith(".git")
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 w-full max-w-2xl mx-auto max-h-[85vh] bg-[#18181b] border-t border-[#27272a] rounded-t-2xl z-50 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-hidden">
        {/* Grab bar */}
        <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mt-2 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#27272a] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">📁 Workspace</span>
            <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
              {visibleFiles.length} dosya
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <a
              href="/api/workspace/download-zip"
              download="workspace.zip"
              className="inline-flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-lg hover:bg-purple-500/20 transition-colors"
              title="Tümünü ZIP İndir"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>ZIP İndir</span>
            </a>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 text-xs text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-lg hover:bg-sky-500/20 transition-colors"
              title="Cihazından Dosya Yükle"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Yükle</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleUpload}
            />

            <button
              onClick={onRefresh}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              title="Yenile"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Active Processes */}
          {processes && processes.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Aktif Sunucu Süreçleri
              </div>
              <div className="space-y-2">
                {processes.map((proc) => {
                  const port = proc.listening_ports?.[0];
                  return (
                    <div
                      key={proc.process_id}
                      className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs"
                    >
                      <div
                        className="flex items-center gap-2 overflow-hidden cursor-pointer"
                        onClick={() => port && onOpenFile(`/proxy/${port}/`, "preview")}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-semibold text-white truncate">
                          {proc.name || proc.command}
                        </span>
                        {port && (
                          <span className="font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                            :{port}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {port && (
                          <button
                            onClick={() => onOpenFile(`/proxy/${port}/`, "preview")}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-medium"
                          >
                            Canlı Aç ↗
                          </button>
                        )}
                        <button
                          onClick={() => onStopProcess(proc.process_id)}
                          className="p-1 text-red-400 hover:bg-red-500/20 rounded-md"
                          title="Durdur"
                        >
                          <Square className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Files List */}
          <div>
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Workspace Dosyaları
            </div>

            {visibleFiles.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                Henüz dosya bulunmuyor. Yapay zekadan bir dosya, web sayfası veya mp3 indirmesini isteyin!
              </div>
            ) : (
              <div className="space-y-1.5">
                {visibleFiles.map((item) => {
                  const ext = item.name.split(".").pop()?.toLowerCase();
                  const isHtml = ext === "html" || ext === "htm";
                  const isAudio = ["mp3", "wav", "ogg", "m4a"].includes(ext || "");
                  const isImg = ["png", "jpg", "jpeg", "svg", "webp"].includes(ext || "");

                  return (
                    <div
                      key={item.path}
                      className="flex items-center justify-between p-2.5 bg-[#1f1f23] hover:bg-[#27272a]/70 border border-[#27272a] rounded-xl transition-colors text-xs"
                    >
                      {/* Name & Size */}
                      <div
                        className="flex items-center gap-2.5 overflow-hidden flex-1 cursor-pointer pr-2"
                        onClick={() =>
                          onOpenFile(
                            item.path,
                            isHtml ? "preview" : isAudio ? "audio" : isImg ? "image" : "code"
                          )
                        }
                      >
                        {getFileIcon(item.name)}
                        <span className="text-zinc-200 font-medium truncate">
                          {item.name}
                        </span>
                        <span className="text-zinc-500 font-mono text-[11px] shrink-0">
                          {formatBytes(item.size)}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isHtml && (
                          <button
                            onClick={() => onOpenFile(item.path, "preview")}
                            className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-[11px] font-medium"
                          >
                            🌐 Canlı Aç
                          </button>
                        )}

                        <button
                          onClick={() => onOpenFile(item.path, "code")}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px]"
                        >
                          ✏️ Düzenle
                        </button>

                        <a
                          href={`/api/workspace/download?path=${encodeURIComponent(item.path)}`}
                          download={item.name}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 rounded-lg text-[11px] font-medium transition-colors"
                          title="Cihazına İndir"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>İndir</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
