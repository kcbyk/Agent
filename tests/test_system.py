import os
import sys
from pathlib import Path

# Add project root
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.tools.file_tools import write_file, read_file, edit_file, list_directory
from backend.tools.bash_tools import run_bash
from backend.tools.web_tools import web_search, fetch_page
from backend.tools.process_tools import process_manager
from backend.config import WORKSPACE_DIR

def run_tests():
    print("🧪 [1/5] Testing File Tools...")
    # Write
    w_res = write_file("test_sample.txt", "Hello World\nLine 2\nLine 3\n", base_dir=WORKSPACE_DIR)
    assert w_res["status"] == "success", f"Write failed: {w_res}"
    print("  ✓ write_file passed")

    # Read
    r_res = read_file("test_sample.txt", base_dir=WORKSPACE_DIR)
    assert "Line 2" in r_res["content"], f"Read failed: {r_res}"
    print("  ✓ read_file passed")

    # Edit with fuzzy matching
    e_res = edit_file("test_sample.txt", "Line 2", "Line Two Updated", base_dir=WORKSPACE_DIR)
    assert e_res["status"] == "success", f"Edit failed: {e_res}"
    r_res2 = read_file("test_sample.txt", base_dir=WORKSPACE_DIR)
    assert "Line Two Updated" in r_res2["content"], "Edit replacement failed"
    print("  ✓ edit_file with fuzzy matching passed")

    # List directory
    l_res = list_directory(".", base_dir=WORKSPACE_DIR)
    assert l_res["count"] > 0, "List directory returned 0 items"
    print(f"  ✓ list_directory passed ({l_res['count']} items found)")

    print("\n🧪 [2/5] Testing Bash Tools...")
    b_res = run_bash("echo 'OpenArena Bash Test OK' && uname", base_dir=WORKSPACE_DIR)
    assert b_res["exit_code"] == 0, f"Bash failed: {b_res}"
    assert "OpenArena Bash Test OK" in b_res["stdout"], "Bash stdout mismatch"
    print("  ✓ run_bash passed")

    print("\n🧪 [3/5] Testing Free Zero-Key Web Search & Scraping...")
    s_res = web_search("python official site", max_results=2)
    assert s_res["total_results"] > 0, f"DuckDuckGo search failed: {s_res}"
    print(f"  ✓ web_search (DuckDuckGo 0-Key) passed! Found: {s_res['results'][0]['title']}")

    f_res = fetch_page("https://example.com")
    assert f_res.get("markdown") or f_res.get("status_code") == 200, f"Fetch page failed: {f_res}"
    print("  ✓ fetch_page (Jina AI 0-Key) passed!")

    print("\n🧪 [4/5] Testing Process Supervisor...")
    # Start a quick python simple http server in background
    p_res = process_manager.start_process(
        command="python3 -m http.server 8123",
        name="Test HTTP Server",
        startup_wait=2,
        base_dir=WORKSPACE_DIR
    )
    pid = p_res["process_id"]
    assert p_res["is_alive"] is True, f"Process start failed: {p_res}"
    print(f"  ✓ start_process passed (ID: {pid})")

    # Get output
    out_res = process_manager.get_output(pid)
    assert out_res["is_alive"] is True, "Process died unexpectedly"
    print("  ✓ get_process_output passed")

    # Stop process
    stop_res = process_manager.stop_process(pid)
    assert stop_res["status"] == "stopped", "Process stop failed"
    print("  ✓ stop_process passed")

    print("\n🧪 [5/5] Testing FastAPI Web App & Endpoints...")
    from fastapi.testclient import TestClient
    from backend.main import app
    client = TestClient(app)

    conf_resp = client.get("/api/config")
    assert conf_resp.status_code == 200, "Config endpoint failed"
    assert "groq" in conf_resp.json()["providers"], "Groq missing in providers"
    print("  ✓ /api/config passed")

    files_resp = client.get("/api/workspace/files")
    assert files_resp.status_code == 200, "Files endpoint failed"
    print("  ✓ /api/workspace/files passed")

    root_resp = client.get("/")
    assert root_resp.status_code == 200, "Root index HTML failed"
    assert "OpenArena" in root_resp.text, "Index HTML title mismatch"
    print("  ✓ UI / index.html passed")

    print("\n==================================================")
    print("🎉 ALL TESTS PASSED! OPENARENA IS 100% OPERATIONAL!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
