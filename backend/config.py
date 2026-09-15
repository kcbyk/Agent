import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
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

    workspace_dir: Path = WORKSPACE_DIR
    max_tool_iterations: int = 25
    bash_timeout_default: int = 60

settings = Settings()
