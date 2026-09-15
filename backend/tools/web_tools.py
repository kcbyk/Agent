import os
import re
import mimetypes
import httpx
from pathlib import Path
from urllib.parse import urlparse, unquote
from typing import Dict, Any, List, Optional

def web_search(query: str, max_results: int = 5) -> Dict[str, Any]:
    """Search the web for free using DuckDuckGo."""
    try:
        from ddgs import DDGS
        results = []
        with DDGS() as ddgs:
            raw = list(ddgs.text(query, max_results=max_results))
            for item in raw:
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("href", ""),
                    "snippet": item.get("body", "")
                })
        return {
            "query": query,
            "total_results": len(results),
            "results": results
        }
    except Exception as e:
        return {
            "query": query,
            "total_results": 0,
            "error": f"Search failed: {str(e)}",
            "results": []
        }

def search_images(query: str, max_results: int = 5) -> Dict[str, Any]:
    """Search DuckDuckGo for images, returning URLs, thumbnails, titles, and dimensions."""
    try:
        from ddgs import DDGS
        results = []
        with DDGS() as ddgs:
            raw = list(ddgs.images(query, max_results=max_results))
            for item in raw:
                results.append({
                    "title": item.get("title", ""),
                    "image": item.get("image", ""),
                    "thumbnail": item.get("thumbnail", ""),
                    "url": item.get("url", ""),
                    "width": item.get("width"),
                    "height": item.get("height")
                })
        return {
            "query": query,
            "total_results": len(results),
            "results": results
        }
    except Exception as e:
        return {
            "query": query,
            "total_results": 0,
            "error": f"Image search failed: {str(e)}",
            "results": []
        }

def fetch_page(url: str, max_chars: int = 15000) -> Dict[str, Any]:
    """Fetch a web page and convert it into clean markdown via Jina AI reader (free)."""
    try:
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url

        jina_url = f"https://r.jina.ai/{url}"
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; OpenArenaBot/1.0)",
            "Accept": "text/markdown"
        }
        
        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            resp = client.get(jina_url, headers=headers)
            if resp.status_code == 200:
                text = resp.text
                truncated = len(text) > max_chars
                return {
                    "url": url,
                    "status_code": resp.status_code,
                    "truncated": truncated,
                    "markdown": text[:max_chars] if truncated else text
                }
            else:
                direct_resp = client.get(url, headers={"User-Agent": "Mozilla/5.0"})
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(direct_resp.text, "html.parser")
                text = soup.get_text(separator="\n", strip=True)
                return {
                    "url": url,
                    "status_code": direct_resp.status_code,
                    "truncated": len(text) > max_chars,
                    "markdown": text[:max_chars]
                }
    except Exception as e:
        return {
            "url": url,
            "error": f"Failed to fetch page: {str(e)}"
        }

def _format_size(size_bytes: int) -> str:
    """Format bytes to human readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}" if unit != 'B' else f"{size_bytes} B"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"

def download_file(url: str, filename: Optional[str] = None, base_dir: Optional[Path] = None) -> Dict[str, Any]:
    """Download any file or image from the web and save it directly into workspace."""
    try:
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url

        if base_dir is None:
            from ..config import settings
            base_dir = settings.workspace_dir

        base_dir = Path(base_dir).resolve()
        base_dir.mkdir(parents=True, exist_ok=True)

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        with httpx.Client(timeout=30.0, follow_redirects=True, headers=headers) as client:
            with client.stream("GET", url) as resp:
                if resp.status_code >= 400:
                    return {
                        "status": "error",
                        "url": url,
                        "status_code": resp.status_code,
                        "error": f"Download failed with HTTP status {resp.status_code}"
                    }

                content_type = resp.headers.get("content-type", "").split(";")[0].strip()

                # Determine filename
                target_name = None
                if filename and filename.strip():
                    target_name = Path(filename.strip()).name
                else:
                    # Check Content-Disposition header
                    cd = resp.headers.get("content-disposition", "")
                    if cd:
                        match = re.search(r'filename\*?=(?:UTF-8\'\')?["\']?([^"\';]+)["\']?', cd, re.IGNORECASE)
                        if match:
                            target_name = unquote(match.group(1).strip())
                    
                    if not target_name:
                        parsed = urlparse(url)
                        path_name = unquote(Path(parsed.path).name)
                        if path_name and "." in path_name:
                            target_name = path_name

                    if not target_name:
                        # Guess from mime type
                        ext = mimetypes.guess_extension(content_type) or ".bin"
                        if ext == ".jpe":
                            ext = ".jpg"
                        import time
                        target_name = f"download_{int(time.time())}{ext}"

                # Ensure valid extension if missing
                if "." not in target_name and content_type:
                    ext = mimetypes.guess_extension(content_type)
                    if ext:
                        if ext == ".jpe":
                            ext = ".jpg"
                        target_name += ext

                # Sanitize filename (remove path traversal)
                clean_name = re.sub(r'[\\/:"*?<>|]', '_', target_name)
                dest_path = (base_dir / clean_name).resolve()

                # Ensure file remains inside base_dir
                if not str(dest_path).startswith(str(base_dir)):
                    dest_path = base_dir / Path(clean_name).name

                # Stream to disk
                total_bytes = 0
                with open(dest_path, "wb") as f:
                    for chunk in resp.iter_bytes(chunk_size=16384):
                        if chunk:
                            f.write(chunk)
                            total_bytes += len(chunk)

                rel_path = dest_path.relative_to(base_dir).as_posix()
                is_image = any(rel_path.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp", ".ico"])

                return {
                    "status": "success",
                    "filename": clean_name,
                    "path": rel_path,
                    "size_bytes": total_bytes,
                    "size_human": _format_size(total_bytes),
                    "content_type": content_type or "application/octet-stream",
                    "is_image": is_image,
                    "url": url,
                    "download_url": f"/api/workspace/download?path={rel_path}",
                    "preview_url": f"/workspace-preview/{rel_path}",
                    "message": f"Successfully downloaded '{clean_name}' ({_format_size(total_bytes)}) into workspace."
                }

    except Exception as e:
        return {
            "status": "error",
            "url": url,
            "error": f"Download failed: {str(e)}"
        }
