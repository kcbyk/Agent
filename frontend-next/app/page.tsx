"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Square, Sparkles, ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import WorkspaceSheet, { WorkspaceItem, ProcessItem } from "@/components/WorkspaceSheet";
import StudioModal from "@/components/StudioModal";
import {
  TerminalCard,
  FileWriteCard,
  MusicCard,
  MediaDownloadCard,
  BeatMakerCard,
} from "@/components/ChatCards";

interface ToolEvent {
  callId: string;
  tool: string;
  args: any;
  result?: any;
  isDone?: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  tools?: ToolEvent[];
}

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals / Drawers
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [studioPath, setStudioPath] = useState<string | null>(null);
  const [studioTab, setStudioTab] = useState<"preview" | "code" | "image" | "audio">("preview");

  // Data
  const [workspaceItems, setWorkspaceItems] = useState<WorkspaceItem[]>([]);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [selfHealingNotice, setSelfHealingNotice] = useState<string | null>(null);

  const activeEventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    setSessionId("arena_" + Math.random().toString(36).substring(2, 9));
    loadWorkspace();

    // Handle ESC and browser back button
    const handlePopState = () => {
      setStudioPath(null);
      setIsWorkspaceOpen(false);
      setIsSidebarOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 120);
  };

  const scrollToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  };

  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom(true);
    }
  }, [messages, isGenerating]);

  const loadWorkspace = async () => {
    try {
      const [filesRes, procRes] = await Promise.all([
        fetch("/api/workspace/files?recursive=true").then((r) => r.json()),
        fetch("/api/processes").then((r) => r.json()).catch(() => []),
      ]);
      setWorkspaceItems(filesRes.items || []);
      setProcesses(procRes || []);
    } catch (err) {}
  };

  const handleStop = async () => {
    if (activeEventSourceRef.current) {
      activeEventSourceRef.current.close();
      activeEventSourceRef.current = null;
    }
    try {
      await fetch(`/api/chat/stop?session_id=${encodeURIComponent(sessionId)}`);
    } catch (e) {}
    setIsGenerating(false);
    loadWorkspace();
  };

  const handleSend = () => {
    executeSend(input);
  };

  const executeSend = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isGenerating) return;

    setInput("");
    const userMsgId = "user_" + Date.now();
    const assistantMsgId = "asst_" + Date.now();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text: trimmed },
      { id: assistantMsgId, role: "assistant", text: "", tools: [] },
    ]);

    // Immediately scroll down smoothly so previous conversation scrolls up
    setTimeout(() => {
      scrollToBottom(true);
    }, 50);

    setIsGenerating(true);

    const streamUrl = `/api/chat?message=${encodeURIComponent(
      trimmed
    )}&session_id=${encodeURIComponent(sessionId)}`;

    const es = new EventSource(streamUrl);
    activeEventSourceRef.current = es;

    es.addEventListener("tool_start", (e: any) => {
      try {
        const d = JSON.parse(e.data);
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantMsgId) return m;
            const existing = m.tools || [];
            return {
              ...m,
              tools: [
                ...existing,
                { callId: d.call_id, tool: d.tool, args: d.arguments, isDone: false },
              ],
            };
          })
        );
      } catch (err) {}
    });

    es.addEventListener("tool_end", (e: any) => {
      try {
        const d = JSON.parse(e.data);
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantMsgId) return m;
            const updatedTools = (m.tools || []).map((t) =>
              t.callId === d.call_id ? { ...t, result: d.result, isDone: true } : t
            );
            return { ...m, tools: updatedTools };
          })
        );
        loadWorkspace();
      } catch (err) {}
    });

    es.addEventListener("token", (e: any) => {
      try {
        const d = JSON.parse(e.data);
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantMsgId) return m;
            return { ...m, text: m.text + (d.content || "") };
          })
        );
      } catch (err) {}
    });

    es.addEventListener("self_healing", (e: any) => {
      try {
        const d = JSON.parse(e.data);
        setSelfHealingNotice(d.message || "Hata tespit edildi, otomatik düzeltiliyor...");
        setTimeout(() => setSelfHealingNotice(null), 5000);
      } catch (err) {}
    });

    es.addEventListener("done", () => {
      es.close();
      activeEventSourceRef.current = null;
      setIsGenerating(false);
      loadWorkspace();
    });

    es.addEventListener("cancelled", () => {
      es.close();
      activeEventSourceRef.current = null;
      setIsGenerating(false);
      loadWorkspace();
    });

    es.addEventListener("error", (e: any) => {
      try {
        if (e.data) {
          const d = JSON.parse(e.data);
          if (d.error) {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantMsgId) return m;
                return { ...m, text: m.text ? m.text + `\n\n⚠️ ${d.error}` : `⚠️ ${d.error}` };
              })
            );
          }
        }
      } catch (_) {}
      es.close();
      activeEventSourceRef.current = null;
      setIsGenerating(false);
      loadWorkspace();
    });
  };

  const openStudio = (path: string, mode: "preview" | "code" | "image" | "audio" = "preview") => {
    if (!history.state || !history.state.studioOpen) {
      history.pushState({ studioOpen: true }, "");
    }
    setStudioPath(path);
    setStudioTab(mode);
    setIsWorkspaceOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#121214] overflow-hidden relative">
      {/* Header */}
      <Header
        onOpenSidebar={() => {
          if (!history.state || !history.state.sidebarOpen) {
            history.pushState({ sidebarOpen: true }, "");
          }
          setIsSidebarOpen(true);
        }}
        onOpenWorkspace={() => {
          if (!history.state || !history.state.workspaceOpen) {
            history.pushState({ workspaceOpen: true }, "");
          }
          loadWorkspace();
          setIsWorkspaceOpen(true);
        }}
        fileCount={workspaceItems.filter((i) => i.type === "file").length}
      />

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        onScroll={handleChatScroll}
        className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto space-y-6 pb-36 flex flex-col justify-start"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 my-auto select-none animate-in fade-in duration-300 py-10">
            {/* Sparkle Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/10">
              <span className="text-3xl">✨</span>
            </div>

            {/* Big Welcome Title */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent mb-3">
              Hoş Geldiniz
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed mb-8">
              OpenArena Agent OS ile otonom kod yazabilir, web siteleri üretebilir, terminali yönetebilir ve 320kbps MP3 veya dosya indirebilirsiniz.
            </p>

            {/* Quick Suggestion Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
              <button
                onClick={() => executeSend("Bana 140 BPM karanlık bir Drill beat yap")}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#18181b] hover:bg-[#202024] border border-[#27272a] hover:border-zinc-600 text-left transition-all text-xs text-zinc-300 hover:text-white group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">🎛️</span>
                <span className="truncate">140 BPM karanlık Drill beat yap</span>
              </button>

              <button
                onClick={() => executeSend("Bana modern ve canlı bir portfolyo web sitesi oluştur")}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#18181b] hover:bg-[#202024] border border-[#27272a] hover:border-zinc-600 text-left transition-all text-xs text-zinc-300 hover:text-white group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">🌐</span>
                <span className="truncate">Modern portfolyo web sitesi oluştur</span>
              </button>

              <button
                onClick={() => executeSend("Bana Tarkan Kuzu Kuzu MP3 indir")}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#18181b] hover:bg-[#202024] border border-[#27272a] hover:border-zinc-600 text-left transition-all text-xs text-zinc-300 hover:text-white group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">🎵</span>
                <span className="truncate">Tarkan Kuzu Kuzu MP3 indir</span>
              </button>

              <button
                onClick={() => executeSend("Bana rahatlatıcı 80 BPM bir Lo-Fi hip hop ritmi üret")}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#18181b] hover:bg-[#202024] border border-[#27272a] hover:border-zinc-600 text-left transition-all text-xs text-zinc-300 hover:text-white group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">🎧</span>
                <span className="truncate">80 BPM Lo-Fi Hip Hop ritmi üret</span>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-[#27272a] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] text-sm leading-relaxed shadow">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-200">OpenArena Agent</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-mono text-[11px]">Gemini 3.5</span>
                  </div>

                  {/* Tool Cards */}
                  {msg.tools && msg.tools.length > 0 && (
                    <div className="space-y-2">
                      {msg.tools.map((t) => {
                        if (t.tool === "bash") {
                          return (
                            <TerminalCard
                              key={t.callId}
                              command={t.args?.command || ""}
                              output={t.result?.stdout || t.result?.stderr || ""}
                              exitCode={t.result?.exit_code}
                              isLive={!t.isDone}
                              durationMs={t.result?.duration_ms}
                            />
                          );
                        } else if (t.tool === "write_file" || t.tool === "edit_file") {
                          return (
                            <FileWriteCard
                              key={t.callId}
                              path={t.args?.path || ""}
                              content={t.args?.content || t.args?.new_text || ""}
                              onOpenStudio={openStudio}
                            />
                          );
                        } else if (t.tool === "read_file") {
                          return (
                            <div key={t.callId} className="flex items-center gap-2 text-xs text-zinc-400 py-0.5 px-1 font-mono">
                              <span className="text-zinc-500 font-bold">&gt;</span>
                              <span className="text-zinc-300 font-medium">Read</span>
                              <span className="text-zinc-500 truncate max-w-xs">{t.args?.path}</span>
                              {t.isDone && <span className="text-emerald-400 text-[11px] ml-auto">✓</span>}
                            </div>
                          );
                        } else if (t.tool === "web_search") {
                          return (
                            <div key={t.callId} className="flex items-center gap-2 text-xs text-zinc-400 py-0.5 px-1 font-mono">
                              <span className="text-zinc-500 font-bold">&gt;</span>
                              <span className="text-sky-400 font-medium">Search</span>
                              <span className="text-zinc-400 truncate max-w-xs">"{t.args?.query}"</span>
                              {t.isDone && <span className="text-emerald-400 text-[11px] ml-auto">✓</span>}
                            </div>
                          );
                        } else if (t.tool === "generate_beat" && t.result?.status === "success") {
                          return (
                            <BeatMakerCard
                              key={t.callId}
                              genre={t.result.genre}
                              bpm={t.result.bpm}
                              bars={t.result.bars}
                              pattern={t.result.pattern}
                              filename={t.result.filename}
                              previewUrl={t.result.preview_url}
                              downloadUrl={t.result.download_url}
                              onOpenStudio={openStudio}
                            />
                          );
                        } else if (t.tool === "download_music" && t.result?.status === "success") {
                          return (
                            <MusicCard
                              key={t.callId}
                              title={t.result.title}
                              filename={t.result.filename}
                              channel={t.result.channel}
                              duration={t.result.duration}
                              sizeHuman={t.result.size_human}
                              coverUrl={t.result.cover_url}
                              previewUrl={t.result.preview_url}
                              downloadUrl={t.result.download_url}
                              onOpenStudio={openStudio}
                            />
                          );
                        } else if (t.tool === "download_file" && t.result?.status === "success") {
                          return (
                            <MediaDownloadCard
                              key={t.callId}
                              filename={t.result.filename}
                              sizeHuman={t.result.size_human}
                              isImage={t.result.is_image}
                              previewUrl={t.result.preview_url}
                              downloadUrl={t.result.download_url}
                              onOpenStudio={openStudio}
                            />
                          );
                        } else {
                          return (
                            <div
                              key={t.callId}
                              className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-xs font-mono text-zinc-400"
                            >
                              <div className="flex items-center gap-2 font-semibold text-purple-400 mb-1">
                                <span>⚙️</span>
                                <span>{t.tool}</span>
                                {!t.isDone && <span className="text-amber-400">⏳</span>}
                              </div>
                              <pre className="text-[11px] overflow-auto max-h-40">
                                {JSON.stringify(t.result || t.args, null, 2)}
                              </pre>
                            </div>
                          );
                        }
                      })}
                    </div>
                  )}

                  {/* Assistant Text */}
                  {msg.text && (
                    <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap shadow-sm">
                      {msg.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Center Scroll to Bottom Arrow Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1c1c20]/95 hover:bg-[#25252a] border border-[#3c3c43] text-white shadow-2xl backdrop-blur-md text-xs font-semibold transition-all animate-in fade-in slide-in-from-bottom-2 duration-150 hover:scale-105 select-none cursor-pointer group"
          title="Alta Kaydır"
        >
          <ChevronDown className="w-4 h-4 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
          <span className="text-zinc-200">Aşağı Kaydır</span>
        </button>
      )}

      {/* Floating Self-Healing Alert Banner */}
      {selfHealingNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <span className="animate-spin text-sm">🔄</span>
          <span>{selfHealingNotice}</span>
        </div>
      )}

      {/* Input Box Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-[#121214] via-[#121214]/90 to-transparent z-20 flex justify-center">
        <div className="w-full max-w-3xl bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden focus-within:border-zinc-500 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Yapay zekaya ne yaptırmak istiyorsunuz? (Enter ile gönder)"
            rows={2}
            className="w-full bg-transparent p-3 sm:p-4 text-sm text-white placeholder-zinc-500 outline-none resize-none leading-relaxed"
          />

          <div className="px-3 pb-2.5 flex items-center justify-between">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>ReAct Autonomous Agent</span>
            </div>

            <div className="flex items-center gap-2">
              {isGenerating ? (
                <button
                  onClick={handleStop}
                  className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 pulsing-stop"
                  title="Durdur (⏹️)"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    input.trim()
                      ? "bg-white text-black hover:scale-105 active:scale-95"
                      : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  }`}
                  title="Gönder"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={() => {
          setSessionId("arena_" + Math.random().toString(36).substring(2, 9));
          setMessages([]);
        }}
      />

      {/* Workspace Sheet */}
      <WorkspaceSheet
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        items={workspaceItems}
        processes={processes}
        onRefresh={loadWorkspace}
        onOpenFile={openStudio}
        onStopProcess={async (pid) => {
          await fetch("/api/processes/stop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ process_id: pid }),
          });
          loadWorkspace();
        }}
      />

      {/* Studio / Preview Modal */}
      <StudioModal
        path={studioPath}
        targetTab={studioTab}
        onClose={() => setStudioPath(null)}
        onRefreshWorkspace={loadWorkspace}
      />
    </div>
  );
}
