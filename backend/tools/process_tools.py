import subprocess
import os
import signal
import time
import threading
import socket
from pathlib import Path
from typing import Dict, Any, List, Optional

class ProcessManager:
    def __init__(self):
        self._processes: Dict[str, Dict[str, Any]] = {}
        self._counter = 1
        self._lock = threading.Lock()

    def _get_listening_ports(self) -> List[int]:
        """Detect listening TCP ports."""
        ports = []
        try:
            res = subprocess.run(["ss", "-tlnp"], capture_output=True, text=True, timeout=2)
            for line in res.stdout.splitlines():
                parts = line.split()
                if len(parts) >= 4 and parts[0] == "LISTEN":
                    local_addr = parts[3]
                    port_str = local_addr.rsplit(":", 1)[-1]
                    if port_str.isdigit():
                        p = int(port_str)
                        if p not in ports:
                            ports.append(p)
        except Exception:
            pass
        return ports

    def start_process(self, command: str, name: str = None, cwd: str = None, startup_wait: int = 5, base_dir: Path = None) -> Dict[str, Any]:
        with self._lock:
            pid_key = f"proc_{self._counter}"
            self._counter += 1

        work_dir = base_dir
        if cwd:
            custom_path = (base_dir / cwd).resolve()
            if custom_path.exists() and custom_path.is_dir():
                work_dir = custom_path

        env = os.environ.copy()
        env["PYTHONUNBUFFERED"] = "1"
        env["PORT"] = "3000"

        ports_before = set(self._get_listening_ports())

        # Start process with piped output in new process group
        proc = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, # merge into single stream for server logs
            cwd=str(work_dir),
            env=env,
            text=True,
            bufsize=1,
            preexec_fn=os.setsid,
            executable="/bin/bash"
        )

        log_lines: List[str] = []

        def reader():
            try:
                for line in iter(proc.stdout.readline, ''):
                    if not line:
                        break
                    with self._lock:
                        log_lines.append(line)
                        if len(log_lines) > 2000:
                            log_lines.pop(0)
            except Exception:
                pass

        thread = threading.Thread(target=reader, daemon=True)
        thread.start()

        # Wait initial startup time
        time.sleep(min(max(startup_wait, 1), 10))

        # Check if process died immediately
        poll_res = proc.poll()
        is_alive = poll_res is None

        ports_after = set(self._get_listening_ports())
        new_ports = list(ports_after - ports_before)

        record = {
            "id": pid_key,
            "name": name or command[:30],
            "command": command,
            "cwd": str(work_dir),
            "pid": proc.pid,
            "popen": proc,
            "logs": log_lines,
            "started_at": time.time(),
            "ports": new_ports
        }

        with self._lock:
            self._processes[pid_key] = record

        with self._lock:
            initial_logs = "".join(log_lines[-50:])

        return {
            "process_id": pid_key,
            "name": name or pid_key,
            "is_alive": is_alive,
            "exit_code": poll_res,
            "listening_ports": new_ports,
            "initial_output": initial_logs
        }

    def get_output(self, process_id: str, tail_lines: int = 100) -> Dict[str, Any]:
        with self._lock:
            record = self._processes.get(process_id)
        if not record:
            return {"error": f"Process '{process_id}' not found"}

        proc: subprocess.Popen = record["popen"]
        poll_res = proc.poll()
        is_alive = poll_res is None

        with self._lock:
            lines = record["logs"][-tail_lines:]
            output = "".join(lines)

        return {
            "process_id": process_id,
            "name": record["name"],
            "is_alive": is_alive,
            "exit_code": poll_res,
            "ports": record.get("ports", []),
            "output": output
        }

    def stop_process(self, process_id: str) -> Dict[str, Any]:
        with self._lock:
            record = self._processes.get(process_id)
        if not record:
            return {"error": f"Process '{process_id}' not found"}

        proc: subprocess.Popen = record["popen"]
        if proc.poll() is None:
            try:
                # Terminate entire process group
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
                time.sleep(1)
                if proc.poll() is None:
                    os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
            except Exception as e:
                try:
                    proc.kill()
                except Exception:
                    pass

        return {
            "status": "stopped",
            "process_id": process_id,
            "exit_code": proc.poll()
        }

    def list_all(self) -> List[Dict[str, Any]]:
        with self._lock:
            res = []
            for pid_key, rec in self._processes.items():
                proc: subprocess.Popen = rec["popen"]
                res.append({
                    "id": pid_key,
                    "name": rec["name"],
                    "command": rec["command"],
                    "is_alive": proc.poll() is None,
                    "exit_code": proc.poll(),
                    "ports": rec.get("ports", []),
                    "started_at": rec["started_at"]
                })
            return res

process_manager = ProcessManager()
