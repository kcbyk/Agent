import os
import re
from pathlib import Path
from typing import Dict, Any, Optional

def _resolve_safe_path(path_str: str, base_dir: Path) -> Path:
    """Ensures that the path is resolved within the sandbox workspace."""
    p = Path(path_str)
    if not p.is_absolute():
        p = base_dir / p
    else:
        # If absolute, normalize it
        p = p.resolve()
        
    resolved = p.resolve()
    # Check traversal
    try:
        resolved.relative_to(base_dir.resolve())
    except ValueError:
        # Allow paths within workspace or throw safe error
        raise PermissionError(f"Access denied: Path '{path_str}' is outside workspace directory '{base_dir}'")
    return resolved

def read_file(path: str, offset: int = 0, limit: Optional[int] = None, base_dir: Path = None) -> Dict[str, Any]:
    """Read contents of a file inside workspace."""
    try:
        resolved = _resolve_safe_path(path, base_dir)
        if not resolved.exists():
            return {"error": f"File not found: {path}"}
        if resolved.is_dir():
            return {"error": f"Path is a directory, not a file: {path}"}

        binary_exts = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".ico", ".svg", ".bmp", ".pdf", ".zip", ".tar", ".gz", ".mp3", ".mp4", ".wav", ".bin"}
        suffix = resolved.suffix.lower()
        if suffix in binary_exts and suffix != ".svg":
            file_size = resolved.stat().st_size
            return {
                "path": str(resolved.relative_to(base_dir)),
                "is_binary": True,
                "size": file_size,
                "total_lines": 1,
                "offset": 0,
                "lines_read": 1,
                "content": f"[İkili dosya: {resolved.name} - {file_size} bayt]"
            }
            
        with open(resolved, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
            
        total_lines = len(lines)
        if limit is not None:
            selected_lines = lines[offset : offset + limit]
        else:
            selected_lines = lines[offset:]
            
        content = "".join(selected_lines)
        return {
            "path": str(resolved.relative_to(base_dir)),
            "total_lines": total_lines,
            "offset": offset,
            "lines_read": len(selected_lines),
            "content": content
        }
    except Exception as e:
        return {"error": str(e)}

def write_file(path: str, content: str, base_dir: Path = None) -> Dict[str, Any]:
    """Create or overwrite a file inside workspace."""
    try:
        resolved = _resolve_safe_path(path, base_dir)
        resolved.parent.mkdir(parents=True, exist_ok=True)
        with open(resolved, "w", encoding="utf-8") as f:
            f.write(content)
        return {
            "status": "success",
            "path": str(resolved.relative_to(base_dir)),
            "bytes_written": len(content.encode("utf-8")),
            "message": f"Successfully wrote {len(content)} characters to {path}"
        }
    except Exception as e:
        return {"error": str(e)}

def _normalize_ws(s: str) -> str:
    """Normalize line endings and trailing whitespace per line."""
    return "\n".join([line.rstrip() for line in s.replace("\r\n", "\n").split("\n")])

def edit_file(path: str, old_text: str, new_text: str, base_dir: Path = None) -> Dict[str, Any]:
    """Fuzzy matching edit replacement."""
    try:
        resolved = _resolve_safe_path(path, base_dir)
        if not resolved.exists():
            return {"error": f"File not found: {path}"}
            
        with open(resolved, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        # 1. Exact match
        if old_text in content:
            updated = content.replace(old_text, new_text, 1)
            with open(resolved, "w", encoding="utf-8") as f:
                f.write(updated)
            return {"status": "success", "match_type": "exact", "path": str(resolved.relative_to(base_dir))}

        # 2. Match with normalized line endings and trailing whitespace
        norm_content = _normalize_ws(content)
        norm_old = _normalize_ws(old_text)
        if norm_old in norm_content:
            # Reconstruct with indentation preservation
            # Find the line indices
            content_lines = content.splitlines(keepends=True)
            old_lines = [l.strip() for l in old_text.strip().splitlines()]
            
            # Slide window to find match
            match_start = -1
            match_len = len(old_lines)
            for i in range(len(content_lines) - match_len + 1):
                window = [content_lines[i + j].strip() for j in range(match_len)]
                if window == old_lines:
                    match_start = i
                    break
                    
            if match_start != -1:
                # Replace lines
                new_replacement_lines = new_text.splitlines(keepends=True)
                # If new replacement doesn't have trailing newline, add it if old had it
                if new_replacement_lines and not new_replacement_lines[-1].endswith("\n"):
                    new_replacement_lines[-1] += "\n"
                final_lines = content_lines[:match_start] + new_replacement_lines + content_lines[match_start + match_len:]
                updated = "".join(final_lines)
                with open(resolved, "w", encoding="utf-8") as f:
                    f.write(updated)
                return {"status": "success", "match_type": "fuzzy_whitespace", "path": str(resolved.relative_to(base_dir))}

        return {
            "error": "Target old_text not found in file. Ensure exact matching or check surrounding context.",
            "path": path
        }
    except Exception as e:
        return {"error": str(e)}

def list_directory(path: str = ".", recursive: bool = False, max_depth: int = 3, base_dir: Path = None) -> Dict[str, Any]:
    """List files and folders in the workspace."""
    try:
        target = _resolve_safe_path(path, base_dir)
        if not target.exists():
            return {"error": f"Path not found: {path}"}
        if not target.is_dir():
            return {"error": f"Path is not a directory: {path}"}

        items = []
        base_depth = len(target.parts)

        def scan(dir_path: Path):
            try:
                for entry in sorted(dir_path.iterdir(), key=lambda p: (not p.is_dir(), p.name)):
                    rel = entry.relative_to(base_dir)
                    curr_depth = len(entry.parts) - base_depth
                    
                    # Ignore common cache folders to keep listing clean
                    if entry.name in {".git", "node_modules", "__pycache__", ".venv", ".cache", ".arena"}:
                        continue
                        
                    items.append({
                        "name": entry.name,
                        "path": str(rel),
                        "type": "directory" if entry.is_dir() else "file",
                        "size": entry.stat().st_size if entry.is_file() else None,
                        "depth": curr_depth
                    })
                    if recursive and entry.is_dir() and curr_depth < max_depth:
                        scan(entry)
            except PermissionError:
                pass

        scan(target)
        return {
            "base": str(target.relative_to(base_dir)) if target != base_dir else ".",
            "count": len(items),
            "items": items
        }
    except Exception as e:
        return {"error": str(e)}
