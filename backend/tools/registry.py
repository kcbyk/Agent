import json
from pathlib import Path
from typing import Dict, Any, List
from .file_tools import read_file, write_file, edit_file, list_directory
from .bash_tools import run_bash
from .process_tools import process_manager
from .web_tools import web_search, fetch_page, search_images, download_file, search_music, download_music

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "bash",
            "description": "Run a bash shell command in the workspace. Returns exit code, stdout, and stderr.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The command line string to execute."
                    },
                    "cwd": {
                        "type": "string",
                        "description": "Optional directory relative to workspace root to run the command in."
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "Max seconds before timeout. Default 60."
                    }
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read the contents of a file in the workspace.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Relative file path inside workspace."
                    },
                    "offset": {
                        "type": "integer",
                        "description": "Line offset to start reading from (0-indexed)."
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of lines to read."
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Create or overwrite a file in the workspace with new content. Parent directories are automatically created.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Relative path where the file should be saved."
                    },
                    "content": {
                        "type": "string",
                        "description": "Complete text content of the file."
                    }
                },
                "required": ["path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "edit_file",
            "description": "Edit an existing file by searching for old_text and replacing it with new_text. Supports whitespace and line ending tolerance.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "File path to edit."
                    },
                    "old_text": {
                        "type": "string",
                        "description": "Exact or near-exact snippet to search for."
                    },
                    "new_text": {
                        "type": "string",
                        "description": "Replacement snippet."
                    }
                },
                "required": ["path", "old_text", "new_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_directory",
            "description": "List files and directories in workspace.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Directory path relative to workspace root (default '.')."
                    },
                    "recursive": {
                        "type": "boolean",
                        "description": "Whether to list subdirectories recursively."
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the live web for information, documentation, news, or code examples for free.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query."
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Number of results to return (default 5)."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "download_music",
            "description": "Search and download any song, track, or music as high-quality 320kbps MP3 audio directly into the workspace from YouTube, SoundCloud, or Archive.org. The user can play it directly in chat or download the MP3 file to their device.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Song name, artist, or music title to search and download (e.g. 'Tarkan Kuzu Kuzu', 'Barış Manço Dönence', 'Coldplay Yellow')."
                    },
                    "filename": {
                        "type": "string",
                        "description": "Optional custom filename to save inside workspace (e.g. 'song.mp3'). If omitted, will be generated from song title."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_music",
            "description": "Search across YouTube, SoundCloud, and Archive.org for songs and tracks, returning titles, artists, duration, and cover art.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Song title or artist query."
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results to return (default 5)."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "download_file",
            "description": "Download any file, photo, image, PDF, audio, zip archive, dataset, or document from a web URL and save it directly into the workspace so the user can inspect or download it to their device.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The full HTTP or HTTPS URL of the file or image to download."
                    },
                    "filename": {
                        "type": "string",
                        "description": "Optional custom filename to save inside workspace (e.g. 'picture.jpg', 'dataset.csv'). If omitted, will be inferred from the URL."
                    }
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_images",
            "description": "Search the web for photos, wallpapers, icons, and illustrations using DuckDuckGo. Returns direct image URLs, thumbnails, and dimensions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Image search query (e.g. 'cute cat', 'futuristic city skyline', 'python logo png')."
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of image results to return (default 5)."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_page",
            "description": "Fetch a web page by URL and extract its text content as clean Markdown.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "Full URL of the webpage to fetch."
                    }
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "start_process",
            "description": "Start a long-running background process (such as a local web dev server, Node, Vite, Python FastAPI).",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "Shell command to run in background."
                    },
                    "name": {
                        "type": "string",
                        "description": "Human friendly label for the process, e.g. 'Frontend Dev Server'."
                    },
                    "cwd": {
                        "type": "string",
                        "description": "Directory to run the command in."
                    },
                    "startup_wait": {
                        "type": "integer",
                        "description": "Seconds to wait to verify startup and detect listening ports (default 5)."
                    }
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_process_output",
            "description": "Get the latest logs and status of a running background process.",
            "parameters": {
                "type": "object",
                "properties": {
                    "process_id": {
                        "type": "string",
                        "description": "The process_id returned by start_process."
                    },
                    "tail_lines": {
                        "type": "integer",
                        "description": "Number of lines from end of log to return (default 100)."
                    }
                },
                "required": ["process_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "stop_process",
            "description": "Stop and terminate a running background process.",
            "parameters": {
                "type": "object",
                "properties": {
                    "process_id": {
                        "type": "string",
                        "description": "The process_id to terminate."
                    }
                },
                "required": ["process_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "ask_user",
            "description": "Ask the user a clarifying question with optional multiple-choice options when requirements are ambiguous.",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "The question to ask."
                    },
                    "options": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of choice suggestions for the user."
                    }
                },
                "required": ["question"]
            }
        }
    }
]

def execute_tool(name: str, arguments: Dict[str, Any], workspace_dir: Path) -> Dict[str, Any]:
    """Execute tool by name with arguments."""
    try:
        if name == "bash":
            return run_bash(
                command=arguments.get("command", ""),
                cwd=arguments.get("cwd"),
                timeout=int(arguments.get("timeout", 60)),
                base_dir=workspace_dir
            )
        elif name == "read_file":
            return read_file(
                path=arguments.get("path", ""),
                offset=int(arguments.get("offset", 0)),
                limit=arguments.get("limit"),
                base_dir=workspace_dir
            )
        elif name == "write_file":
            return write_file(
                path=arguments.get("path", ""),
                content=arguments.get("content", ""),
                base_dir=workspace_dir
            )
        elif name == "edit_file":
            return edit_file(
                path=arguments.get("path", ""),
                old_text=arguments.get("old_text", ""),
                new_text=arguments.get("new_text", ""),
                base_dir=workspace_dir
            )
        elif name == "list_directory":
            return list_directory(
                path=arguments.get("path", "."),
                recursive=bool(arguments.get("recursive", False)),
                base_dir=workspace_dir
            )
        elif name == "download_music":
            return download_music(
                query=arguments.get("query", ""),
                filename=arguments.get("filename"),
                base_dir=workspace_dir
            )
        elif name == "search_music":
            return search_music(
                query=arguments.get("query", ""),
                limit=int(arguments.get("limit", 5))
            )
        elif name == "download_file":
            return download_file(
                url=arguments.get("url", ""),
                filename=arguments.get("filename"),
                base_dir=workspace_dir
            )
        elif name == "search_images":
            return search_images(
                query=arguments.get("query", ""),
                max_results=int(arguments.get("max_results", 5))
            )
        elif name == "web_search":
            return web_search(
                query=arguments.get("query", ""),
                max_results=int(arguments.get("max_results", 5))
            )
        elif name == "fetch_page":
            return fetch_page(
                url=arguments.get("url", "")
            )
        elif name == "start_process":
            return process_manager.start_process(
                command=arguments.get("command", ""),
                name=arguments.get("name"),
                cwd=arguments.get("cwd"),
                startup_wait=int(arguments.get("startup_wait", 5)),
                base_dir=workspace_dir
            )
        elif name == "get_process_output":
            return process_manager.get_output(
                process_id=arguments.get("process_id", ""),
                tail_lines=int(arguments.get("tail_lines", 100))
            )
        elif name == "stop_process":
            return process_manager.stop_process(
                process_id=arguments.get("process_id", "")
            )
        elif name == "ask_user":
            return {
                "type": "ask_user_prompt",
                "question": arguments.get("question", ""),
                "options": arguments.get("options", [])
            }
        else:
            return {"error": f"Unknown tool: '{name}'"}
    except Exception as e:
        return {"error": f"Tool execution error in {name}: {str(e)}"}
