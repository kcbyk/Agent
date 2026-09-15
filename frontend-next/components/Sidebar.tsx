"use client";

import React from "react";
import { X, Plus, Sparkles, Key, CheckCircle, Shield, Music } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

export default function Sidebar({ isOpen, onClose, onNewChat }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 bottom-0 left-0 w-[85%] max-w-[340px] bg-[#18181b] border-r border-[#27272a] z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="h-[52px] border-b border-[#27272a] flex items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold text-sm text-white">
            <span className="text-emerald-400">🌿</span>
            <span>Model ve Ayarlar</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-2.5 px-3 bg-[#202024] hover:bg-[#27272a] border border-[#27272a] rounded-xl text-white flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Yeni Sohbet Başlat</span>
          </button>

          {/* Model Status Card */}
          <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-300 text-xs">Google Gemini Aktif</span>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                gemini-3.5-flash-lite
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Gemini API devrede. Otonom kod yazma, sandbox terminali (`bash`) ve süreç yönetimi aktif.
            </p>
          </div>

          {/* MP3 API Status Card */}
          <div className="bg-pink-500/[0.08] border border-pink-500/20 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-pink-300 text-xs flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-pink-400" /> Mp3 API Bağlı
              </span>
              <span className="text-[10px] font-mono bg-pink-500/20 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded">
                320 kbps
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              YouTube ve SoundCloud üzerinden anında yüksek kaliteli MP3 dönüştürme ve indirme hazır.
            </p>
          </div>

          {/* Info Card */}
          <div className="border border-zinc-800 rounded-xl p-3 text-zinc-400 text-xs space-y-1.5">
            <div className="text-zinc-200 font-medium">Yetenekler</div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Canlı Monospace Kod Kartları</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>macOS Terminali ($ bash)</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Görsel ve Dosya İndirme</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Cihaza Tek Tıkla Aktarım</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
