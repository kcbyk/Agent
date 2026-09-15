"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Play,
  Square,
  Sliders,
  Volume2,
  RotateCcw,
  Sparkles,
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
    case "wav":
      return {
        badge: "WAV",
        icon: <Music className="w-4 h-4 text-amber-400" />,
        mode: "audio" as const,
      };
    case "mp3":
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

// 5. Interactive Gemini-Style Beat Maker & Drum Sequencer Card
const INSTRUMENTS = [
  { key: "kick", label: "Kick 808", color: "bg-red-500 text-white border-red-400", activeLed: "bg-red-500 shadow-red-500/50" },
  { key: "snare", label: "Snare", color: "bg-amber-500 text-white border-amber-400", activeLed: "bg-amber-500 shadow-amber-500/50" },
  { key: "hihat", label: "Hi-Hat", color: "bg-sky-500 text-white border-sky-400", activeLed: "bg-sky-500 shadow-sky-500/50" },
  { key: "openhat", label: "Open Hat", color: "bg-blue-500 text-white border-blue-400", activeLed: "bg-blue-500 shadow-blue-500/50" },
  { key: "clap", label: "Clap", color: "bg-purple-500 text-white border-purple-400", activeLed: "bg-purple-500 shadow-purple-500/50" },
  { key: "bass808", label: "808 Bass", color: "bg-pink-500 text-white border-pink-400", activeLed: "bg-pink-500 shadow-pink-500/50" },
  { key: "perc", label: "Percussion", color: "bg-emerald-500 text-white border-emerald-400", activeLed: "bg-emerald-500 shadow-emerald-500/50" },
];

export function BeatMakerCard({
  genre = "drill",
  bpm = 140,
  bars = 2,
  pattern: initialPattern,
  filename,
  previewUrl,
  downloadUrl,
  onOpenStudio,
}: {
  genre?: string;
  bpm?: number;
  bars?: number;
  pattern?: Record<string, number[]>;
  filename: string;
  previewUrl: string;
  downloadUrl: string;
  onOpenStudio: (path: string, mode?: "audio") => void;
}) {
  const [activeBpm, setActiveBpm] = useState(bpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [pattern, setPattern] = useState<Record<string, number[]>>(() => {
    return (
      initialPattern || {
        kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
        hihat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
        openhat: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        clap: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        bass808: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        perc: [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0],
      }
    );
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<any>(null);
  const stepRef = useRef<number>(0);

  // Initialize or get Web Audio Context
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Web Audio Synth Triggers
  const playSound = (inst: string) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      if (inst === "kick") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.35);
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (inst === "snare") {
        // Tonal
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.frequency.setValueAtTime(190, now);
        oscGain.gain.setValueAtTime(0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);

        // Noise
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.7, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
      } else if (inst === "hihat" || inst === "openhat") {
        const dur = inst === "openhat" ? 0.3 : 0.06;
        const bufferSize = ctx.sampleRate * dur;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 7500;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (inst === "clap") {
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        noise.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (inst === "bass808") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(46.25, now);
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (inst === "perc") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (e) {
      // AudioCtx fallback
    }
  };

  // Step Sequencer Tick Loop
  const togglePlay = () => {
    if (isPlaying) {
      clearInterval(timerRef.current);
      setIsPlaying(false);
      setCurrentStep(-1);
    } else {
      getAudioContext();
      setIsPlaying(true);
      stepRef.current = 0;
      setCurrentStep(0);

      // 16th note interval = (60 / activeBpm / 4) * 1000 ms
      const intervalMs = (60 / activeBpm / 4) * 1000;
      timerRef.current = setInterval(() => {
        const step = stepRef.current;
        setCurrentStep(step);

        // Trigger instruments on this step
        Object.keys(pattern).forEach((inst) => {
          if (pattern[inst]?.[step]) {
            playSound(inst);
          }
        });

        stepRef.current = (stepRef.current + 1) % 16;
      }, intervalMs);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const toggleStep = (inst: string, stepIdx: number) => {
    const current = pattern[inst] || Array(16).fill(0);
    const updated = [...current];
    updated[stepIdx] = updated[stepIdx] ? 0 : 1;
    setPattern({ ...pattern, [inst]: updated });
    // Play preview of sound when user activates step
    if (updated[stepIdx]) {
      playSound(inst);
    }
  };

  const clearGrid = () => {
    const empty: Record<string, number[]> = {};
    INSTRUMENTS.forEach((inst) => {
      empty[inst.key] = Array(16).fill(0);
    });
    setPattern(empty);
  };

  return (
    <div className="my-3 bg-[#18181b] border border-[#27272a] hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl transition-all select-none">
      {/* Header bar */}
      <div className="px-3 sm:px-4 py-2.5 bg-[#202024] border-b border-[#27272a] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
              <span>Gemini Beat Maker</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 uppercase">
                {genre}
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              16-Step 808 Sequencer • {activeBpm} BPM
            </div>
          </div>
        </div>

        {/* Right Play & Download Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={togglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition-all ${
              isPlaying
                ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                : "bg-amber-500 hover:bg-amber-400 text-zinc-950"
            }`}
          >
            {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? "Durdur" : "Oynat"}</span>
          </button>

          <a
            href={downloadUrl}
            download={filename}
            className="p-1.5 text-zinc-400 hover:text-amber-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            title="WAV Olarak İndir"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 16-Step Interactive Grid */}
      <div className="p-3 bg-[#0f0f12] overflow-x-auto">
        {/* Step Numbers Top Indicator */}
        <div className="flex items-center gap-1 mb-2 pl-20 sm:pl-24 min-w-[420px]">
          {Array.from({ length: 16 }).map((_, stepIdx) => (
            <div
              key={stepIdx}
              className={`flex-1 text-center font-mono text-[9px] py-0.5 rounded transition-colors ${
                currentStep === stepIdx
                  ? "bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-400/30"
                  : stepIdx % 4 === 0
                  ? "text-zinc-300 font-semibold bg-zinc-800/40"
                  : "text-zinc-600"
              }`}
            >
              {stepIdx + 1}
            </div>
          ))}
        </div>

        {/* Instrument Rows */}
        <div className="space-y-1.5 min-w-[420px]">
          {INSTRUMENTS.map((inst) => {
            const rowSteps = pattern[inst.key] || Array(16).fill(0);
            return (
              <div key={inst.key} className="flex items-center gap-1">
                {/* Track label button */}
                <button
                  onClick={() => playSound(inst.key)}
                  className="w-20 sm:w-24 text-left px-2 py-1 rounded bg-zinc-800/60 hover:bg-zinc-700/80 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors truncate flex items-center justify-between group shrink-0"
                  title="Sesi Dinle"
                >
                  <span className="truncate">{inst.label}</span>
                  <Volume2 className="w-3 h-3 text-zinc-500 group-hover:text-amber-400 shrink-0" />
                </button>

                {/* 16 Step Buttons */}
                <div className="flex-1 flex items-center gap-1">
                  {rowSteps.map((val, stepIdx) => {
                    const isActive = val === 1;
                    const isScanning = currentStep === stepIdx;
                    return (
                      <button
                        key={stepIdx}
                        onClick={() => toggleStep(inst.key, stepIdx)}
                        className={`flex-1 h-7 sm:h-8 rounded-md border transition-all relative ${
                          isActive
                            ? `${inst.color} shadow-sm font-bold`
                            : isScanning
                            ? "bg-zinc-700/80 border-amber-400/80"
                            : stepIdx % 4 === 0
                            ? "bg-zinc-800/80 border-zinc-700/80 hover:bg-zinc-700"
                            : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
                        }`}
                        title={`${inst.label} - Adım ${stepIdx + 1}`}
                      >
                        {isScanning && (
                          <span
                            className={`absolute inset-0 rounded-md opacity-30 ${
                              isActive ? "bg-white" : "bg-amber-400"
                            } animate-ping`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Footer */}
      <div className="px-3 sm:px-4 py-2.5 bg-[#141417] border-t border-[#27272a] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Tempo BPM Adjuster */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-mono text-[11px]">BPM:</span>
          <div className="flex items-center bg-zinc-800 rounded-lg border border-zinc-700 p-0.5">
            <button
              onClick={() => setActiveBpm(Math.max(60, activeBpm - 5))}
              className="px-2 py-0.5 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded text-xs font-mono"
            >
              -
            </button>
            <span className="px-2 font-mono font-bold text-amber-400 text-xs">{activeBpm}</span>
            <button
              onClick={() => setActiveBpm(Math.min(200, activeBpm + 5))}
              className="px-2 py-0.5 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded text-xs font-mono"
            >
              +
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearGrid}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700 px-2 py-1 rounded-md transition-colors"
            title="Tüm adımları temizle"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Temizle</span>
          </button>

          <a
            href={downloadUrl}
            download={filename}
            className="flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-md font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>WAV İndir</span>
          </a>
        </div>
      </div>

      {/* Rendered WAV Audio Player */}
      <div className="px-3 sm:px-4 py-2 bg-[#101013] border-t border-zinc-900 flex items-center gap-2">
        <span className="text-[10px] font-mono text-zinc-500 shrink-0">WAV Çalar:</span>
        <audio controls src={previewUrl} className="w-full h-8 outline-none" />
      </div>
    </div>
  );
}
