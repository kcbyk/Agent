import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent

# Auto-load .env if present
env_paths = [BASE_DIR.parent / ".env", BASE_DIR / ".env", Path.cwd() / ".env"]
for ep in env_paths:
    if ep.exists():
        with open(ep, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip("'").strip('"')
                    if k and k not in os.environ:
                        os.environ[k] = v
        break

if os.getenv("VERCEL"):
    WORKSPACE_DIR = Path("/tmp/workspace")
else:
    WORKSPACE_DIR = BASE_DIR / "workspace"

WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseModel):
    provider: str = os.getenv("DEFAULT_PROVIDER", "gemini")
    model: str = os.getenv("DEFAULT_MODEL", "gemini-3.5-flash-lite")
    
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")

    mp3_api_key: str = os.getenv("MP3_API_KEY", "sk-71c69f4de1f4b912957fed45")
    mp3_api_base_url: str = os.getenv("MP3_API_BASE_URL", "https://mp3-apisi.onrender.com")

    workspace_dir: Path = WORKSPACE_DIR
    max_tool_iterations: int = 25
    bash_timeout_default: int = 60

settings = Settings()
