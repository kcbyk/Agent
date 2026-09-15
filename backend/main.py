import os
import json
import traceback
from pathlib import Path
from fastapi import FastAPI, Request, Response, HTTPException, Query
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any
import httpx

from .config import settings, WORKSPACE_DIR
from .agent.react_engine import ReActAgentEngine
from .agent.llm_router import PROVIDER_CONFIGS
from .tools.file_tools import read_file, write_file, edit_file, list_directory
from .tools.bash_tools import run_bash
from .tools.process_tools import process_manager

app = FastAPI(title="OpenArena Agent OS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent_engine = ReActAgentEngine(workspace_dir=WORKSPACE_DIR)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

if WORKSPACE_DIR.exists():
    app.mount("/workspace-preview", StaticFiles(directory=str(WORKSPACE_DIR), html=True), name="workspace-preview")

@app.get("/")
async def root():
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        response = FileResponse(str(index_file))
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
    return HTMLResponse("<h1>OpenArena Agent OS Running</h1>")

@app.get("/api/config")
async def get_config():
    return {
        "providers": PROVIDER_CONFIGS,
        "default_provider": "gemini",
        "default_model": "gemini-3.5-flash-lite",
        "has_gemini_key": bool(settings.gemini_api_key),
        "workspace_dir": str(WORKSPACE_DIR)
    }

@app.get("/api/workspace/files")
async def get_workspace_files(recursive: bool = True):
    return list_directory(path=".", recursive=recursive, max_depth=4, base_dir=WORKSPACE_DIR)

@app.get("/api/workspace/file")
async def get_workspace_file(path: str = Query(...)):
    return read_file(path=path, base_dir=WORKSPACE_DIR)

@app.post("/api/workspace/file")
async def save_workspace_file(request: Request):
    data = await request.json()
    return write_file(path=data.get("path", ""), content=data.get("content", ""), base_dir=WORKSPACE_DIR)

@app.post("/api/terminal/exec")
async def terminal_exec(request: Request):
    data = await request.json()
    return run_bash(command=data.get("command", ""), cwd=data.get("cwd"), timeout=data.get("timeout", 30), base_dir=WORKSPACE_DIR)

@app.get("/api/processes")
async def get_processes():
    return process_manager.list_all()

@app.post("/api/processes/stop")
async def stop_process_api(request: Request):
    data = await request.json()
    pid = data.get("process_id", "")
    return process_manager.stop_process(pid)

@app.get("/api/processes/output")
async def get_process_output_api(process_id: str = Query(...), tail_lines: int = 100):
    return process_manager.get_output(process_id=process_id, tail_lines=tail_lines)

# Robust Sync Endpoint with Transparent Error Reporting
@app.api_route("/api/chat/sync", methods=["GET", "POST", "OPTIONS", "HEAD"])
@app.api_route("/api/chat/sync/", methods=["GET", "POST", "OPTIONS", "HEAD"])
@app.api_route("/api/chat", methods=["GET", "POST", "OPTIONS", "HEAD"])
@app.api_route("/api/chat/", methods=["GET", "POST", "OPTIONS", "HEAD"])
async def chat_sync_endpoint(request: Request):
    if request.method in ["OPTIONS", "HEAD"]:
        return Response(status_code=200, headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
            "Access-Control-Allow-Headers": "*"
        })

    try:
        message = ""
        session_id = "default"
        api_keys = []

        if request.method == "POST":
            try:
                body = await request.body()
                if body:
                    data = json.loads(body.decode("utf-8"))
                    message = data.get("message", "")
                    session_id = data.get("session_id", "default")
                    if data.get("api_keys"):
                        api_keys = data["api_keys"]
            except Exception:
                pass

        if not message:
            message = request.query_params.get("message", "")
            if request.query_params.get("session_id"):
                session_id = request.query_params.get("session_id")

        if not api_keys and request.query_params.get("api_keys"):
            raw_k = request.query_params.get("api_keys")
            try:
                parsed = json.loads(raw_k)
                if isinstance(parsed, list):
                    api_keys = parsed
            except Exception:
                api_keys = [k.strip() for k in raw_k.split(",") if k.strip()]

        if not message:
            return JSONResponse({
                "status": "ok",
                "reply": "Merhaba, göreve hazırım. Lütfen yapmak istediğiniz işlemi belirtin.",
                "tools": []
            })

        if not api_keys:
            api_keys = [settings.gemini_api_key]

        # If streaming is requested (standard on /api/chat or when stream=true)
        if "sync" not in request.url.path or request.query_params.get("stream", "").lower() == "true":
            return StreamingResponse(
                agent_engine.run_loop(
                    session_id=session_id,
                    user_message=message,
                    provider="gemini",
                    model="gemini-3.5-flash-lite",
                    api_keys=api_keys,
                    api_key=api_keys[0] if api_keys else settings.gemini_api_key
                ),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache, no-transform",
                    "Content-Type": "text/event-stream",
                    "X-Accel-Buffering": "no",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*"
                }
            )

        reply_acc = ""
        tools_acc = []
        error_msg = ""

        async for raw in agent_engine.run_loop(
            session_id=session_id,
            user_message=message,
            provider="gemini",
            model="gemini-3.5-flash-lite",
            api_keys=api_keys,
            api_key=api_keys[0] if api_keys else settings.gemini_api_key
        ):
            if "event: token" in raw:
                for line in raw.split("\n"):
                    if line.startswith("data: "):
                        try:
                            d = json.loads(line[6:])
                            reply_acc += d.get("content", "")
                        except Exception:
                            pass
            elif "event: tool_end" in raw:
                for line in raw.split("\n"):
                    if line.startswith("data: "):
                        try:
                            d = json.loads(line[6:])
                            tools_acc.append(d)
                        except Exception:
                            pass
            elif "event: error" in raw:
                for line in raw.split("\n"):
                    if line.startswith("data: "):
                        try:
                            d = json.loads(line[6:])
                            error_msg = d.get("error", "Bilinmeyen API hatası")
                        except Exception:
                            pass

        if error_msg and not reply_acc:
            return JSONResponse({
                "status": "error",
                "error": error_msg,
                "reply": f"⚠️ API Hatası: {error_msg}"
            })

        return JSONResponse({
            "status": "ok",
            "reply": reply_acc or "Görev tamamlandı.",
            "tools": tools_acc
        })
    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"status": "error", "error": str(e)}, status_code=500)

@app.api_route("/proxy/{port}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
async def preview_proxy(port: int, path: str, request: Request):
    target_url = f"http://127.0.0.1:{port}/{path}"
    if request.query_params:
        target_url += f"?{request.query_params}"

    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body
            )
            resp_headers = {k: v for k, v in resp.headers.items() if k.lower() not in ["content-encoding", "content-length", "transfer-encoding"]}
            return Response(content=resp.content, status_code=resp.status_code, headers=resp_headers)
    except Exception as e:
        return HTMLResponse(
            f"""
            <div style="font-family:sans-serif; padding:40px; text-align:center; color:#94a3b8; background:#181818; height:100vh;">
                <h2 style="color:#f87171;">Port {port} üzerinde sunucuya ulaşılamadı</h2>
                <p>Sunucu henüz başlatılmamış olabilir.</p>
                <code style="background:#262626; padding:4px 8px; border-radius:4px; color:#38bdf8;">Hedef: {target_url}</code>
            </div>
            """,
            status_code=502
        )
