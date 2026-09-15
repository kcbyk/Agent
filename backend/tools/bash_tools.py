import subprocess
import os
import sys
from pathlib import Path
from typing import Dict, Any

MAX_OUTPUT_CHARS = 30000

def run_bash(command: str, cwd: str = None, timeout: int = 60, base_dir: Path = None) -> Dict[str, Any]:
    """Execute a bash command in the workspace directory."""
    try:
        work_dir = base_dir
        if cwd:
            custom_path = (base_dir / cwd).resolve()
            if custom_path.exists() and custom_path.is_dir():
                work_dir = custom_path
                
        # Clean environment without breaking PATH
        env = os.environ.copy()
        env["TERM"] = "dumb"
        env["PYTHONUNBUFFERED"] = "1"
        
        proc = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(work_dir),
            env=env,
            text=True,
            executable="/bin/bash"
        )
        
        try:
            stdout, stderr = proc.communicate(timeout=timeout)
            exit_code = proc.returncode
            timed_out = False
        except subprocess.TimeoutExpired:
            proc.kill()
            stdout, stderr = proc.communicate()
            exit_code = -1
            timed_out = True
            
        stdout_truncated = len(stdout) > MAX_OUTPUT_CHARS
        stderr_truncated = len(stderr) > MAX_OUTPUT_CHARS
        
        return {
            "exit_code": exit_code,
            "timed_out": timed_out,
            "stdout": stdout[-MAX_OUTPUT_CHARS:] if stdout_truncated else stdout,
            "stderr": stderr[-MAX_OUTPUT_CHARS:] if stderr_truncated else stderr,
            "stdout_truncated": stdout_truncated,
            "stderr_truncated": stderr_truncated,
            "cwd": str(work_dir)
        }
    except Exception as e:
        return {
            "exit_code": 1,
            "timed_out": False,
            "error": str(e),
            "stdout": "",
            "stderr": str(e)
        }
