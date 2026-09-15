import httpx
from typing import Dict, Any, List

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
        # Fallback to direct DuckDuckGo HTML or error
        return {
            "query": query,
            "total_results": 0,
            "error": f"Search failed: {str(e)}",
            "results": []
        }

def fetch_page(url: str, max_chars: int = 15000) -> Dict[str, Any]:
    """Fetch a web page and convert it into clean markdown via Jina AI reader (free)."""
    try:
        # Standardize URL
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
                # Direct fallback
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
