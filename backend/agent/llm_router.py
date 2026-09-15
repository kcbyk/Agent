import json
import httpx
from typing import Dict, Any, List, AsyncGenerator, Optional
from ..config import settings

GEMINI_MODEL_FALLBACKS = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-2.5-flash"
]

PROVIDER_CONFIGS = {
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
        "default_model": "gemini-3.5-flash-lite",
        "env_key": "gemini_api_key",
        "free_info": "Google AI Studio Gemini Key"
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "default_model": "llama-3.3-70b-versatile",
        "env_key": "groq_api_key",
        "free_info": "Free API Key from https://console.groq.com/keys"
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "default_model": "deepseek/deepseek-r1:free",
        "env_key": "openrouter_api_key",
        "free_info": "Free models available at https://openrouter.ai/keys"
    },
    "ollama": {
        "base_url": "http://localhost:11434/v1",
        "default_model": "llama3.2",
        "env_key": None,
        "free_info": "100% Free local models running via Ollama"
    },
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "default_model": "gpt-4o-mini",
        "env_key": "openai_api_key",
        "free_info": "Paid API from platform.openai.com"
    }
}

def detect_provider_from_key(key: str, default_provider: str = "gemini") -> str:
    k = key.strip()
    if k.startswith("AQ.") or k.startswith("AIza"):
        return "gemini"
    elif k.startswith("gsk_"):
        return "groq"
    elif k.startswith("sk-or-"):
        return "openrouter"
    elif k.startswith("sk-"):
        return "openai"
    return default_provider

class LLMRouter:
    @staticmethod
    async def stream_chat(
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        provider: str = "gemini",
        model: Optional[str] = None,
        api_keys: Optional[List[str]] = None,
        api_key: Optional[str] = None,
        temperature: float = 0.2
    ) -> AsyncGenerator[Dict[str, Any], None]:
        pool: List[str] = []
        if api_keys:
            pool.extend([k.strip() for k in api_keys if k and k.strip()])
        if api_key and api_key.strip() and api_key.strip() not in pool:
            pool.insert(0, api_key.strip())

        if not pool and settings.gemini_api_key:
            pool.append(settings.gemini_api_key)

        if not pool and provider.lower() == "ollama":
            pool = ["ollama"]

        if not pool:
            yield {
                "type": "error",
                "error": "API Anahtarı bulunamadı. Lütfen geçerli bir Gemini anahtarı girin."
            }
            return

        first_key = pool[0]
        active_provider = detect_provider_from_key(first_key, provider.lower() if provider else "gemini")
        cfg = PROVIDER_CONFIGS.get(active_provider, PROVIDER_CONFIGS["gemini"])

        models_to_try = [model] if model else []
        if active_provider == "gemini":
            models_to_try.extend(GEMINI_MODEL_FALLBACKS)
        else:
            models_to_try.append(cfg["default_model"])
        # deduplicate while keeping order
        models_to_try = list(dict.fromkeys([m for m in models_to_try if m]))

        base_url = cfg["base_url"]
        if active_provider == "ollama" and settings.ollama_base_url:
            base_url = settings.ollama_base_url

        success = False
        last_error = ""

        for current_key in pool:
            for chosen_model in models_to_try:
                headers = {
                    "Authorization": f"Bearer {current_key}",
                    "Content-Type": "application/json"
                }
                if active_provider == "openrouter":
                    headers["HTTP-Referer"] = "https://openarena.ai"
                    headers["X-Title"] = "OpenArena Agent"

                payload = {
                    "model": chosen_model,
                    "messages": messages,
                    "temperature": temperature,
                    "stream": True
                }
                if tools:
                    payload["tools"] = tools
                    payload["tool_choice"] = "auto"

                tool_calls_acc: Dict[int, Dict[str, Any]] = {}
                content_acc = ""
                need_model_fallback = False

                try:
                    async with httpx.AsyncClient(timeout=20.0) as client:
                        async with client.stream("POST", f"{base_url}/chat/completions", headers=headers, json=payload) as response:
                            if response.status_code != 200:
                                err_body = await response.aread()
                                last_error = f"Model {chosen_model} ({response.status_code}): {err_body.decode('utf-8', errors='replace')[:120]}"
                                need_model_fallback = True
                            else:
                                async for line in response.aiter_lines():
                                    line = line.strip()
                                    if not line or not line.startswith("data: "):
                                        continue
                                    data_str = line[6:]
                                    if data_str == "[DONE]":
                                        break

                                    try:
                                        chunk = json.loads(data_str)
                                    except Exception:
                                        continue

                                    choices = chunk.get("choices", [])
                                    if not choices:
                                        continue

                                    delta = choices[0].get("delta", {})
                                    delta_content = delta.get("content")
                                    if delta_content:
                                        content_acc += delta_content
                                        yield {"type": "token", "content": delta_content}

                                    reasoning = delta.get("reasoning_content") or delta.get("thought")
                                    if reasoning:
                                        yield {"type": "thought", "content": reasoning}

                                    delta_tool_calls = delta.get("tool_calls", [])
                                    for tc in delta_tool_calls:
                                        idx = tc.get("index", 0)
                                        if idx not in tool_calls_acc:
                                            tool_calls_acc[idx] = {
                                                "id": tc.get("id", f"call_{idx}"),
                                                "type": "function",
                                                "function": {
                                                    "name": tc.get("function", {}).get("name", ""),
                                                    "arguments": tc.get("function", {}).get("arguments", "")
                                                }
                                            }
                                            if "extra_content" in tc:
                                                tool_calls_acc[idx]["extra_content"] = tc["extra_content"]
                                        else:
                                            if "id" in tc and tc["id"]:
                                                tool_calls_acc[idx]["id"] = tc["id"]
                                            if "extra_content" in tc:
                                                tool_calls_acc[idx]["extra_content"] = tc["extra_content"]
                                            if "function" in tc:
                                                fn = tc["function"]
                                                if "name" in fn and fn["name"]:
                                                    tool_calls_acc[idx]["function"]["name"] += fn["name"]
                                                if "arguments" in fn and fn["arguments"]:
                                                    tool_calls_acc[idx]["function"]["arguments"] += fn["arguments"]

                    if need_model_fallback:
                        continue

                    success = True
                    if tool_calls_acc:
                        final_tool_calls = []
                        for _, call in sorted(tool_calls_acc.items(), key=lambda x: x[0]):
                            try:
                                args = json.loads(call["function"]["arguments"])
                            except Exception:
                                args = {"raw": call["function"]["arguments"]}
                            item = {
                                "id": call["id"],
                                "name": call["function"]["name"],
                                "arguments": args
                            }
                            if "extra_content" in call:
                                item["extra_content"] = call["extra_content"]
                            final_tool_calls.append(item)
                        yield {
                            "type": "tool_calls",
                            "content": content_acc,
                            "calls": final_tool_calls
                        }
                    else:
                        yield {
                            "type": "finish",
                            "content": content_acc
                        }
                    return

                except Exception as e:
                    last_error = str(e)
                    continue

        if not success:
            yield {"type": "error", "error": f"İstek tamamlanamadı: {last_error}"}
