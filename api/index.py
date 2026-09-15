import sys
from pathlib import Path

# Add root folder to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.main import app

# Top-level ASGI entry points for Vercel Python runtime
handler = app
application = app
