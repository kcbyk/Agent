import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List, AsyncGenerator, Optional
from .prompt_templates import SYSTEM_PROMPT
from .llm_router import LLMRouter
from ..tools.registry import TOOL_DEFINITIONS, execute_tool

class ConversationSession:
    def __init__(self, session_id: str, workspace_dir: Path):
        self.session_id = session_id
        self.workspace_dir = workspace_dir
        self.messages: List[Dict[str, Any]] = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]
        self.pending_question: Optional[Dict[str, Any]] = None

    def add_user_message(self, text: str):
        self.messages.append({"role": "user", "content": text})

    def add_assistant_message(self, content: Optional[str] = None, tool_calls: Optional[List[Dict[str, Any]]] = None):
        msg: Dict[str, Any] = {"role": "assistant"}
        if content:
            msg["content"] = content
        if tool_calls:
            formatted_calls = []
            for tc in tool_calls:
                call_dict = {
                    "id": tc["id"],
                    "type": "function",
                    "function": {
                        "name": tc["name"],
                        "arguments": json.dumps(tc["arguments"]) if not isinstance(tc["arguments"], str) else tc["arguments"]
                    }
                }
                if "extra_content" in tc:
                    call_dict["extra_content"] = tc["extra_content"]
                formatted_calls.append(call_dict)
            msg["tool_calls"] = formatted_calls
        self.messages.append(msg)

    def add_tool_response(self, tool_call_id: str, name: str, result: Any):
        self.messages.append({
            "role": "tool",
            "tool_call_id": tool_call_id,
            "name": name,
            "content": json.dumps(result, ensure_ascii=False) if not isinstance(result, str) else result
        })

class ReActAgentEngine:
    def __init__(self, workspace_dir: Path):
        self.workspace_dir = workspace_dir
        self.sessions: Dict[str, ConversationSession] = {}

    def get_or_create_session(self, session_id: str) -> ConversationSession:
        if session_id not in self.sessions:
            self.sessions[session_id] = ConversationSession(session_id, self.workspace_dir)
        return self.sessions[session_id]

    async def run_loop(
        self,
        session_id: str,
        user_message: str,
        provider: str = "groq",
        model: Optional[str] = None,
        api_keys: Optional[List[str]] = None,
        api_key: Optional[str] = None,
        max_turns: int = 15
    ) -> AsyncGenerator[str, None]:
        """
        Runs the ReAct loop and streams SSE data packets to frontend.
        """
        session = self.get_or_create_session(session_id)
        session.add_user_message(user_message)

        yield self._sse("session_status", {"status": "started", "session_id": session_id})

        turn = 0
        while turn < max_turns:
            turn += 1
            has_tool_calls = False
            accumulated_content = ""
            current_tool_calls = []

            yield self._sse("turn_start", {"turn": turn})

            stream_gen = LLMRouter.stream_chat(
                messages=session.messages,
                tools=TOOL_DEFINITIONS,
                provider=provider,
                model=model,
                api_keys=api_keys,
                api_key=api_key
            )

            async for event in stream_gen:
                etype = event.get("type")
                if etype == "token":
                    accumulated_content += event["content"]
                    yield self._sse("token", {"content": event["content"]})
                elif etype == "thought":
                    yield self._sse("thought", {"content": event["content"]})
                elif etype == "tool_calls":
                    has_tool_calls = True
                    current_tool_calls = event["calls"]
                elif etype == "error":
                    yield self._sse("error", {"error": event["error"]})
                    return

            if has_tool_calls:
                session.add_assistant_message(
                    content=accumulated_content if accumulated_content else None,
                    tool_calls=current_tool_calls
                )

                for tc in current_tool_calls:
                    call_id = tc["id"]
                    tool_name = tc["name"]
                    arguments = tc["arguments"]

                    yield self._sse("tool_start", {
                        "call_id": call_id,
                        "tool": tool_name,
                        "arguments": arguments
                    })

                    if tool_name == "ask_user":
                        question_payload = {
                            "call_id": call_id,
                            "question": arguments.get("question", ""),
                            "options": arguments.get("options", [])
                        }
                        session.pending_question = question_payload
                        yield self._sse("ask_user", question_payload)
                        return

                    loop = asyncio.get_event_loop()
                    try:
                        result = await loop.run_in_executor(
                            None,
                            execute_tool,
                            tool_name,
                            arguments,
                            self.workspace_dir
                        )
                    except Exception as e:
                        result = {"error": f"Tool execution failed: {str(e)}"}

                    session.add_tool_response(call_id, tool_name, result)

                    yield self._sse("tool_end", {
                        "call_id": call_id,
                        "tool": tool_name,
                        "result": result
                    })

                await asyncio.sleep(0.05)
            else:
                if accumulated_content:
                    session.add_assistant_message(content=accumulated_content)
                yield self._sse("turn_end", {"turn": turn})
                break

        yield self._sse("done", {"session_id": session_id, "total_turns": turn})

    def _sse(self, event_name: str, data: Dict[str, Any]) -> str:
        return f"event: {event_name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
