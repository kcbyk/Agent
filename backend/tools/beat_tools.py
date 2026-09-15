import os
import math
import random
import struct
import wave
from pathlib import Path
from typing import Dict, Any, Optional, List

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    np = None
    HAS_NUMPY = False

SAMPLE_RATE = 44100

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

# --- Pure Python DSP Synthesis (Zero external dependencies) ---

def _render_kick_pure(sr: int = SAMPLE_RATE, dur: float = 0.45) -> List[float]:
    n = int(sr * dur)
    samples = []
    phase = 0.0
    for i in range(n):
        t = i / sr
        freq = 42.0 + (160.0 - 42.0) * math.exp(-t * 26.0)
        phase += 2.0 * math.pi * freq / sr
        amp = math.exp(-t * 9.5)
        sig = math.sin(phase) * amp
        samples.append(math.tanh(sig * 1.8) * 0.95)
    return samples

def _render_snare_pure(sr: int = SAMPLE_RATE, dur: float = 0.32) -> List[float]:
    n = int(sr * dur)
    samples = []
    for i in range(n):
        t = i / sr
        tone = math.sin(2.0 * math.pi * 190.0 * t) * math.exp(-t * 24.0)
        noise = (random.random() * 2.0 - 1.0) * math.exp(-t * 15.0)
        samples.append((tone * 0.35 + noise * 0.65) * 0.85)
    return samples

def _render_clap_pure(sr: int = SAMPLE_RATE, dur: float = 0.28) -> List[float]:
    n = int(sr * dur)
    samples = []
    for i in range(n):
        t = i / sr
        noise = random.random() * 2.0 - 1.0
        env = math.exp(-t * 18.0)
        if t > 0.011:
            env += math.exp(-(t - 0.011) * 35.0) * 0.7
        if t > 0.022:
            env += math.exp(-(t - 0.022) * 35.0) * 0.7
        env = min(1.0, max(0.0, env))
        samples.append((noise * env) * 0.75)
    return samples

def _render_hihat_pure(sr: int = SAMPLE_RATE, open_hat: bool = False) -> List[float]:
    dur = 0.35 if open_hat else 0.075
    decay = 12.0 if open_hat else 75.0
    n = int(sr * dur)
    samples = []
    for i in range(n):
        t = i / sr
        noise = random.random() * 2.0 - 1.0
        metallic = (
            math.sin(2.0 * math.pi * 7800.0 * t) * 0.2 +
            math.sin(2.0 * math.pi * 9200.0 * t) * 0.2 +
            math.sin(2.0 * math.pi * 11500.0 * t) * 0.2
        )
        sig = (noise * 0.7 + metallic * 0.3) * math.exp(-t * decay)
        samples.append(sig * 0.6)
    return samples

def _render_bass_pure(sr: int = SAMPLE_RATE, dur: float = 0.55, freq_note: float = 46.25) -> List[float]:
    n = int(sr * dur)
    samples = []
    for i in range(n):
        t = i / sr
        phase = 2.0 * math.pi * freq_note * t
        sub = math.sin(phase)
        harmonic = math.sin(phase * 2.0) * 0.25
        amp = math.exp(-t * 3.5)
        sig = (sub + harmonic) * amp
        samples.append(math.tanh(sig * 1.5) * 0.85)
    return samples

def _render_perc_pure(sr: int = SAMPLE_RATE, dur: float = 0.15) -> List[float]:
    n = int(sr * dur)
    samples = []
    phase = 0.0
    for i in range(n):
        t = i / sr
        freq = 600.0 * math.exp(-t * 25.0) + 120.0
        phase += 2.0 * math.pi * freq / sr
        sig = math.sin(phase) * math.exp(-t * 30.0)
        samples.append(sig * 0.5)
    return samples

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
    Zero-dependency pure Python engine with optional numpy optimization.
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

    pattern = custom_pattern or {
        "kick": preset["kick"],
        "snare": preset["snare"],
        "hihat": preset["hihat"],
        "openhat": preset["openhat"],
        "clap": preset["clap"],
        "bass808": preset["bass808"],
        "perc": preset["perc"],
    }

    step_duration = (60.0 / active_bpm) / 4.0
    bar_duration = step_duration * 16.0
    total_duration = bar_duration * bars
    total_samples = int(SAMPLE_RATE * (total_duration + 0.5))

    # Pre-render instruments using pure Python (failsafe anywhere)
    sound_kick = _render_kick_pure(SAMPLE_RATE)
    sound_snare = _render_snare_pure(SAMPLE_RATE)
    sound_clap = _render_clap_pure(SAMPLE_RATE)
    sound_hihat = _render_hihat_pure(SAMPLE_RATE, open_hat=False)
    sound_openhat = _render_hihat_pure(SAMPLE_RATE, open_hat=True)
    sound_bass = _render_bass_pure(SAMPLE_RATE)
    sound_perc = _render_perc_pure(SAMPLE_RATE)

    sounds_map = {
        "kick": sound_kick,
        "snare": sound_snare,
        "clap": sound_clap,
        "hihat": sound_hihat,
        "openhat": sound_openhat,
        "bass808": sound_bass,
        "perc": sound_perc,
    }

    # Mix tracks into float buffer
    master_audio = [0.0] * total_samples

    for bar in range(bars):
        bar_offset = int(bar * bar_duration * SAMPLE_RATE)
        for inst_name, steps in pattern.items():
            sample = sounds_map.get(inst_name)
            if not sample:
                continue
            sample_len = len(sample)
            for step_idx in range(min(16, len(steps))):
                if steps[step_idx]:
                    start_pos = bar_offset + int(step_idx * step_duration * SAMPLE_RATE)
                    end_pos = min(start_pos + sample_len, total_samples)
                    for k in range(start_pos, end_pos):
                        master_audio[k] += sample[k - start_pos]

    # Normalize audio
    max_val = max(abs(x) for x in master_audio) or 1.0
    scale = 0.95 / max_val if max_val > 0.01 else 1.0

    # Convert to 16-bit PCM bytes
    audio_bytes = bytearray()
    for s in master_audio:
        norm = s * scale
        clamped = max(-1.0, min(1.0, norm))
        # Soft saturation
        sat = math.tanh(clamped * 1.05)
        val = int(sat * 32767)
        audio_bytes.extend(struct.pack('<h', val))

    # Save to workspace
    target_dir = workspace_dir or Path("/home/user/openarena/backend/workspace")
    target_dir.mkdir(parents=True, exist_ok=True)
    out_file = target_dir / filename

    with wave.open(str(out_file), "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(audio_bytes)

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
