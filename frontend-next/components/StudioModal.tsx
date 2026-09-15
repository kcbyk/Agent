"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Download,
  ExternalLink,
  X,
  Smartphone,
  Monitor,
  Music,
} from "lucide-react";

interface StudioModalProps {
  path: string | null;
  targetTab?: "preview" | "code" | "image" | "audio";
  onClose: () => void;
  onRefreshWorkspace: () => void;
}

export default function StudioModal({
  path,
  targetTab = "preview",
  onClose,
  onRefreshWorkspace,
}: StudioModalProps) {
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "image" | "audio">(targetTab);
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!path) return;
    const ext = path.split(".").pop()?.toLowerCase();
    const isHtml = ext === "html" || ext === "htm";
    const isAudio = ["mp3", "wav", "ogg", "m4a"].includes(ext || "");
    const isImg = ["png", "jpg", "jpeg", "svg", "webp"].includes(ext || "");

    if (targetTab) {
      setActiveTab(targetTab);
    } else if (isHtml) {
      setActiveTab("preview");
    } else if (isAudio) {
      setActiveTab("audio");
    } else if (isImg) {
      setActiveTab("image");
    } else {
      setActiveTab("code");
    }

    // Fetch file content
    fetch(`/api/workspace/file?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((data) => {
        setContent(data.content || "");
      })
      .catch(() => {});
  }, [path, targetTab]);

  if (!path) return null;

  const ext = path.split(".").pop()?.toLowerCase();
  const isHtml = ext === "html" || ext === "htm";
  const isAudio = ["mp3", "wav", "ogg", "m4a"].includes(ext || "");
  const isImg = ["png", "jpg", "jpeg", "svg", "webp"].includes(ext || "");
  const previewUrl = `/workspace-preview/${encodeURIComponent(path)}`;
  const downloadUrl = `/api/workspace/download?path=${encodeURIComponent(path)}`;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/workspace/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      onRefreshWorkspace();
    } catch (err) {
      alert("Kaydetme hatası!");
    } finally {
      setIsSaving(false);
    }
  };

  const lineCount = content ? content.split("\n").length : 1;

  return (
    <div className="fixed inset-0 bg-[#121214] z-[60] flex flex-col select-none animate-in fade-in duration-150">
      {/* Top Toolbar */}
      <div className="h-[52px] bg-[#18181b] border-b border-[#27272a] flex items-center justify-between px-3 sm:px-4 shrink-0 gap-2">
        {/* Left: Back button & file name */}
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 px-2.5 py-1.5 rounded-lg shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Geri</span>
          </button>
          <span className="text-xs sm:text-sm font-semibold text-white truncate font-mono">
            {path}
          </span>
        </div>

        {/* Center: Tabs if applicable */}
        {(isHtml || isImg || isAudio) && (
          <div className="flex items-center bg-[#202024] p-1 rounded-xl border border-[#27272a] shrink-0 text-xs">
            {isHtml && (
              <>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeTab === "preview"
                      ? "bg-zinc-700 text-white shadow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  🌐 Canlı
                </button>
                <button
                  onClick={() => setActiveTab("code")}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeTab === "code"
                      ? "bg-zinc-700 text-white shadow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  💻 Kod
                </button>
              </>
            )}
            {isAudio && (
              <span className="px-2.5 py-1 text-pink-400 font-medium flex items-center gap-1">
                <Music className="w-3.5 h-3.5" /> MP3 Çalar
              </span>
            )}
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Viewport switch for HTML */}
          {isHtml && activeTab === "preview" && (
            <div className="hidden sm:flex items-center bg-[#202024] p-1 rounded-lg border border-[#27272a]">
              <button
                onClick={() => setViewportMode("desktop")}
                className={`p-1 rounded ${
                  viewportMode === "desktop" ? "bg-zinc-700 text-white" : "text-zinc-400"
                }`}
                title="Masaüstü Görünüm"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewportMode("mobile")}
                className={`p-1 rounded ${
                  viewportMode === "mobile" ? "bg-zinc-700 text-white" : "text-zinc-400"
                }`}
                title="Mobil Telefon Görünümü"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === "code" && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-colors ${
                saveSuccess
                  ? "bg-emerald-600"
                  : "bg-indigo-600 hover:bg-indigo-500"
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveSuccess ? "Kaydedildi!" : "Kaydet"}</span>
            </button>
          )}

          <a
            href={downloadUrl}
            download={path.split("/").pop()}
            className="inline-flex items-center gap-1 text-xs text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1.5 rounded-lg hover:bg-sky-500/20 font-medium transition-colors"
            title="Cihaza İndir"
          >
            <Download className="w-3.5 h-3.5" />
            <span>İndir</span>
          </a>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Pane Content */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {/* Preview Pane (HTML) */}
        {activeTab === "preview" && (
          <div
            className={`flex-1 w-full h-full flex justify-center items-center ${
              viewportMode === "mobile" ? "bg-[#09090b] p-4 sm:p-6" : "bg-white"
            }`}
          >
            {viewportMode === "mobile" ? (
              <div className="w-[390px] h-full max-h-[820px] rounded-[36px] border-[10px] border-[#27272a] shadow-2xl overflow-hidden bg-white">
                <iframe src={previewUrl} className="w-full h-full border-none" />
              </div>
            ) : (
              <iframe src={previewUrl} className="w-full h-full border-none bg-white" />
            )}
          </div>
        )}

        {/* Code Editor Pane */}
        {activeTab === "code" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0c0e]">
            <div className="flex-1 flex overflow-hidden">
              {/* Gutter */}
              <div className="w-12 bg-[#121214] border-r border-[#27272a] py-3 text-right pr-3 font-mono text-xs text-zinc-600 select-none overflow-hidden">
                {Array.from({ length: Math.min(lineCount, 1000) }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              {/* Textarea */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
                className="flex-1 p-3 bg-transparent text-zinc-100 font-mono text-xs leading-relaxed outline-none resize-none overflow-auto whitespace-pre"
              />
            </div>
            {/* Status bar */}
            <div className="h-7 bg-[#141416] border-t border-[#27272a] px-4 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>{lineCount} Satır</span>
              <span>{content.length} karakter</span>
            </div>
          </div>
        )}

        {/* Image Pane */}
        {activeTab === "image" && (
          <div className="flex-1 flex items-center justify-center p-6 bg-[#09090b]">
            <img
              src={previewUrl}
              alt={path}
              className="max-w-[90%] max-h-[90%] object-contain rounded-xl shadow-2xl border border-[#27272a]"
            />
          </div>
        )}

        {/* Audio Pane */}
        {activeTab === "audio" && (
          <div className="flex-1 flex items-center justify-center p-6 bg-[#09090b]">
            <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl p-8 text-center shadow-2xl space-y-4">
              <div className="text-5xl">🎵</div>
              <div className="text-base font-semibold text-white truncate font-mono">
                {path.split("/").pop()}
              </div>
              <div className="text-xs text-zinc-400">320 kbps MP3 Ses Dosyası</div>
              <audio controls src={previewUrl} className="w-full outline-none" />
              <div className="pt-2">
                <a
                  href={downloadUrl}
                  download={path.split("/").pop()}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-pink-600/30 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Cihazına İndir (MP3)</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
