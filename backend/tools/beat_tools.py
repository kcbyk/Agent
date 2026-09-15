import os
import math
import struct
import wave
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional, List

SAMPLE_RATE = 44100

def _synthesize_kick(sr: int = SAMPLE_RATE, duration: float = 0.45) -> np.ndarray:
    t = np.linspace(0, duration, int(sr * duration), False)
    # 808 style pitch drop from 160Hz to 42Hz
    freq = 42.0 + (160.0 - 42.0) * np.exp(-t * 26.0)
    phase = 2.0 * np.pi * np.cumsum(freq) / sr
    amp = np.exp(-t * 9.5)
    sig = np.sin(phase) * amp
    # Soft saturation for 808 warmth
    return np.tanh(sig * 1.8) * 0.95

def _synthesize_snare(sr: int = SAMPLE_RATE, duration: float = 0.32) -> np.ndarray:
    t = np.linspace(0, duration, int(sr * duration), False)
    # Tonal body
    tone = np.sin(2.0 * np.pi * 190.0 * t) * np.exp(-t * 24.0)
    # Filtered high noise snap
    noise = (np.random.rand(len(t)) * 2.0 - 1.0) * np.exp(-t * 15.0)
    sig = tone * 0.35 + noise * 0.65
    return sig * 0.85

def _synthesize_clap(sr: int = SAMPLE_RATE, duration: float = 0.28) -> np.ndarray:
    t = np.linspace(0, duration, int(sr * duration), False)
    noise = np.random.rand(len(t)) * 2.0 - 1.0
    # 3 quick micro pre-claps then main tail
    env = np.exp(-t * 18.0)
    for offset_ms in [0.011, 0.022]:
        idx = int(offset_ms * sr)
        if idx < len(t):
            env[idx:] += np.exp(-(t[idx:] - offset_ms) * 35.0) * 0.7
    env = np.clip(env, 0, 1.0)
    return (noise * env) * 0.75

def _synthesize_hihat(sr: int = SAMPLE_RATE, open_hat: bool = False) -> np.ndarray:
    dur = 0.35 if open_hat else 0.075
    decay = 12.0 if open_hat else 75.0
    t = np.linspace(0, dur, int(sr * dur), False)
    # Metallic noise mix
    noise = np.random.rand(len(t)) * 2.0 - 1.0
    # Add high frequency metallic harmonics
    metallic = (
        np.sin(2.0 * np.pi * 7800.0 * t) * 0.2 +
        np.sin(2.0 * np.pi * 9200.0 * t) * 0.2 +
        np.sin(2.0 * np.pi * 11500.0 * t) * 0.2
    )
    sig = (noise * 0.7 + metallic * 0.3) * np.exp(-t * decay)
    return sig * 0.6

def _synthesize_808_bass(sr: int = SAMPLE_RATE, duration: float = 0.55, freq_note: float = 46.25) -> np.ndarray:
    # 46.25 Hz is F#1 - classic drill/trap sub note
    t = np.linspace(0, duration, int(sr * duration), False)
    phase = 2.0 * np.pi * freq_note * t
    sub = np.sin(phase)
    # Second harmonic for phone speaker audible punch
    harmonic = np.sin(phase * 2.0) * 0.25
    amp = np.exp(-t * 3.5)
    sig = (sub + harmonic) * amp
    return np.tanh(sig * 1.5) * 0.85

def _synthesize_perc(sr: int = SAMPLE_RATE, duration: float = 0.15) -> np.ndarray:
    t = np.linspace(0, duration, int(sr * duration), False)
    freq = 600.0 * np.exp(-t * 25.0) + 120.0
    sig = np.sin(2.0 * np.pi * np.cumsum(freq) / sr) * np.exp(-t * 30.0)
    return sig * 0.5

PRESETS: Dict[str, Dict[str, Any]] = {
    "drill": {
        "bpm": 140,
        "kick":      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        "snare":     [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
        "hihat":     [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
        "openhat":   [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        "clap":      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        "bass808":   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        "perc":      [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0],
    },
    "trap": {
        "bpm": 135,
        "kick":      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        "snare":     [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        "hihat":     [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        "openhat":   [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        "clap":      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        "bass808":   [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        "perc":      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    },
    "boombap": {
        "bpm": 92,
        "kick":      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        "snare":     [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "hihat":     [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        "openhat":   [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        "clap":      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "bass808":   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        "perc":      [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
    },
    "lofi": {
        "bpm": 80,
        "kick":      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0],
        "snare":     [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "hihat":     [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        "openhat":   [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        "clap":      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "bass808":   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        "perc":      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    },
    "synthwave": {
        "bpm": 115,
        "kick":      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        "snare":     [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "hihat":     [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        "openhat":   [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        "clap":      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "bass808":   [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        "perc":      [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    },
    "afrobeat": {
        "bpm": 105,
        "kick":      [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        "snare":     [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "hihat":     [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0],
        "openhat":   [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        "clap":      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        "bass808":   [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "perc":      [0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
    }
}

def generate_beat(
    genre: str = "drill",
    bpm: Optional[int] = None,
    bars: int = 2,
    custom_pattern: Optional[Dict[str, List[int]]] = None,
    filename: Optional[str] = None,
    workspace_dir: Optional[Path] = None
) -> Dict[str, Any]:
    """
    Synthesizes an 808/Drum Beat into a high quality WAV file in workspace.
    """
    genre_key = genre.lower().replace(" ", "").replace("-", "")
    preset = PRESETS.get(genre_key, PRESETS["trap"])

    active_bpm = bpm or preset.get("bpm", 130)
    if active_bpm < 50: active_bpm = 50
    if active_bpm > 220: active_bpm = 220

    if not filename:
        filename = f"beat_{genre_key}_{active_bpm}bpm.wav"
    if not filename.endswith(".wav"):
        filename += ".wav"

    # Pattern setup (16 steps per bar)
    pattern = custom_pattern or {
        "kick": preset["kick"],
        "snare": preset["snare"],
        "hihat": preset["hihat"],
        "openhat": preset["openhat"],
        "clap": preset["clap"],
        "bass808": preset["bass808"],
        "perc": preset["perc"],
    }

    # Step duration in seconds (16th notes: 1 beat = 4 steps, 60 / bpm / 4)
    step_duration = (60.0 / active_bpm) / 4.0
    bar_duration = step_duration * 16.0
    total_duration = bar_duration * bars
    total_samples = int(SAMPLE_RATE * (total_duration + 0.5)) # extra tail for reverb

    # Audio buffer
    master_audio = np.zeros(total_samples, dtype=np.float32)

    # Pre-render sample sounds
    sound_kick = _synthesize_kick(SAMPLE_RATE)
    sound_snare = _synthesize_snare(SAMPLE_RATE)
    sound_clap = _synthesize_clap(SAMPLE_RATE)
    sound_hihat = _synthesize_hihat(SAMPLE_RATE, open_hat=False)
    sound_openhat = _synthesize_hihat(SAMPLE_RATE, open_hat=True)
    sound_bass = _synthesize_808_bass(SAMPLE_RATE)
    sound_perc = _synthesize_perc(SAMPLE_RATE)

    sounds_map = {
        "kick": sound_kick,
        "snare": sound_snare,
        "clap": sound_clap,
        "hihat": sound_hihat,
        "openhat": sound_openhat,
        "bass808": sound_bass,
        "perc": sound_perc,
    }

    # Mix patterns across bars
    for bar in range(bars):
        bar_offset = int(bar * bar_duration * SAMPLE_RATE)
        for inst_name, steps in pattern.items():
            sample = sounds_map.get(inst_name)
            if sample is None:
                continue
            for step_idx in range(min(16, len(steps))):
                if steps[step_idx]:
                    start_pos = bar_offset + int(step_idx * step_duration * SAMPLE_RATE)
                    end_pos = min(start_pos + len(sample), total_samples)
                    sample_len = end_pos - start_pos
                    if sample_len > 0:
                        master_audio[start_pos:end_pos] += sample[:sample_len]

    # Normalize and soft limit
    max_val = np.max(np.abs(master_audio))
    if max_val > 0.01:
        master_audio = master_audio / max_val * 0.95

    # Soft tanh master limiter
    master_audio = np.tanh(master_audio * 1.05)

    # Convert to 16-bit integer PCM
    audio_int16 = (master_audio * 32767).astype(np.int16)

    # Save to workspace
    target_dir = workspace_dir or Path("/home/user/openarena/backend/workspace")
    target_dir.mkdir(parents=True, exist_ok=True)
    out_file = target_dir / filename

    with wave.open(str(out_file), "w") as wav_file:
        wav_file.setnchannels(1) # Mono for punchy drum transients
        wav_file.setsampwidth(2) # 16 bit
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(audio_int16.tobytes())

    file_size = out_file.stat().st_size
    size_human = f"{file_size / 1024:.1f} KB" if file_size < 1024*1024 else f"{file_size / (1024*1024):.2f} MB"

    return {
        "status": "success",
        "genre": genre_key,
        "bpm": active_bpm,
        "bars": bars,
        "filename": filename,
        "size_human": size_human,
        "duration_sec": round(total_duration, 2),
        "pattern": pattern,
        "preview_url": f"/workspace-preview/{filename}",
        "download_url": f"/api/workspace/download?path={filename}",
        "message": f"{genre_key.upper()} ritmi ({active_bpm} BPM, {bars} bar) başarıyla sentezlendi ve {filename} olarak kaydedildi."
    }
