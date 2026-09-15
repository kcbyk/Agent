// Arena.ai Pixel-Perfect Multi-Key Pool & Workspace Engine

const state = {
    sessionId: "arena_" + Math.random().toString(36).substring(2, 9),
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    isRunning: false,
    activeFile: null,
    // Multi-key pool loaded from localStorage
    keyPool: JSON.parse(localStorage.getItem("openarena_key_pool") || "[]")
};

// DOM Elements
const elements = {
    messagesContainer: document.getElementById("messages-container"),
    userInput: document.getElementById("user-input"),
    btnSend: document.getElementById("btn-send"),
    btnModeDropdown: document.getElementById("btn-mode-dropdown"),
    modePopover: document.getElementById("mode-popover"),
    headerModeTitle: document.getElementById("header-mode-title"),
    
    // Left Sidebar (Multi-Key Drawer)
    btnSidebarToggle: document.getElementById("btn-sidebar-toggle"),
    leftSidebar: document.getElementById("left-sidebar"),
    sidebarBackdrop: document.getElementById("left-sidebar-backdrop"),
    btnCloseSidebar: document.getElementById("btn-close-sidebar"),
    btnNewChat: document.getElementById("btn-new-chat"),
    newKeyProvider: document.getElementById("new-key-provider"),
    newKeyLabel: document.getElementById("new-key-label"),
    newKeyValue: document.getElementById("new-key-value"),
    btnAddKeyPool: document.getElementById("btn-add-key-pool"),
    keyPoolList: document.getElementById("key-pool-list"),
    keyCountBadge: document.getElementById("key-count-badge"),
    activePoolCount: document.getElementById("active-pool-count"),
    savedKeysTotal: document.getElementById("saved-keys-total"),
    
    // Right Workspace Sheet
    btnWorkspaceToggle: document.getElementById("btn-workspace-toggle"),
    workspaceSheet: document.getElementById("workspace-sheet"),
    sheetBackdrop: document.getElementById("workspace-sheet-backdrop"),
    btnCloseSheet: document.getElementById("btn-close-sheet"),
    fileTreeRoot: document.getElementById("file-tree-root"),
    processGreenPill: document.getElementById("process-green-pill"),
    statDiskUsage: document.getElementById("stat-disk-usage"),
    statFileCount: document.getElementById("stat-file-count"),
    
    // Viewer & Editor Modals
    viewerModal: document.getElementById("viewer-modal"),
    btnViewerClose: document.getElementById("btn-viewer-close"),
    btnViewerRefresh: document.getElementById("btn-viewer-refresh"),
    btnViewerExternal: document.getElementById("btn-viewer-open-external"),
    viewerIframe: document.getElementById("viewer-iframe"),
    viewerUrlLabel: document.getElementById("viewer-url-label"),
    editorModal: document.getElementById("editor-modal"),
    editorTitle: document.getElementById("editor-file-title"),
    editorTextarea: document.getElementById("editor-textarea"),
    btnEditorSave: document.getElementById("btn-editor-save"),
    btnEditorClose: document.getElementById("btn-editor-close"),
    
    // Status
    statusPill: document.getElementById("agent-status-pill"),
    statusText: document.getElementById("agent-status-text")
};

document.addEventListener("DOMContentLoaded", () => {
    initEvents();
    renderKeyPool();
    loadWorkspaceTree();
});

function initEvents() {
    // Left Sidebar (Multi-key Drawer)
    elements.btnSidebarToggle.addEventListener("click", openLeftSidebar);
    elements.btnCloseSidebar.addEventListener("click", closeLeftSidebar);
    elements.sidebarBackdrop.addEventListener("click", closeLeftSidebar);

    // New Chat
    elements.btnNewChat.addEventListener("click", () => {
        closeLeftSidebar();
        if (confirm("Yeni bir sohbet başlatmak istiyor musunuz?")) {
            elements.messagesContainer.innerHTML = "";
            state.sessionId = "arena_" + Math.random().toString(36).substring(2, 9);
        }
    });

    // Add Key to Pool
    elements.btnAddKeyPool.addEventListener("click", handleAddKeyToPool);

    // Right Workspace Sheet
    elements.btnWorkspaceToggle.addEventListener("click", openWorkspaceSheet);
    elements.btnCloseSheet.addEventListener("click", closeWorkspaceSheet);
    elements.sheetBackdrop.addEventListener("click", closeWorkspaceSheet);

    // Process Pill -> Live Preview
    elements.processGreenPill.addEventListener("click", () => {
        closeWorkspaceSheet();
        openLiveViewer("/workspace-preview/", "http://localhost:8000/workspace-preview/");
    });

    // Viewer Controls
    elements.btnViewerClose.addEventListener("click", () => elements.viewerModal.classList.add("hidden"));
    elements.btnViewerRefresh.addEventListener("click", () => {
        elements.viewerIframe.src = elements.viewerIframe.src;
    });
    elements.btnViewerExternal.addEventListener("click", () => {
        window.open(elements.viewerIframe.src, "_blank");
    });

    // Editor Controls
    elements.btnEditorClose.addEventListener("click", () => elements.editorModal.classList.add("hidden"));
    elements.btnEditorSave.addEventListener("click", saveActiveFile);

    // Mode Dropdown
    elements.btnModeDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
        elements.modePopover.classList.toggle("hidden");
    });
    document.addEventListener("click", () => {
        elements.modePopover.classList.add("hidden");
    });
    elements.modePopover.addEventListener("click", (e) => e.stopPropagation());

    document.querySelectorAll(".model-opt-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            state.provider = btn.getAttribute("data-provider");
            state.model = btn.getAttribute("data-model");
            
            document.querySelectorAll(".model-opt-btn").forEach(b => {
                b.classList.remove("active");
                b.querySelector(".check-icon").classList.add("hidden");
            });
            btn.classList.add("active");
            btn.querySelector(".check-icon").classList.remove("hidden");

            elements.headerModeTitle.textContent = btn.querySelector(".font-medium").textContent.split(":")[0].trim();
            elements.modePopover.classList.add("hidden");
        });
    });

    // Chat Send
    elements.btnSend.addEventListener("click", handleSendMessage);
    elements.userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Prompt Chips
    document.querySelectorAll(".prompt-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            elements.userInput.value = chip.querySelector("span:last-child")?.innerText || chip.innerText;
            handleSendMessage();
        });
    });
}

// ==========================================
// ÇOKLU API KEY SİSTEMİ (MULTI-KEY POOL)
// ==========================================
function openLeftSidebar() {
    renderKeyPool();
    elements.leftSidebar.classList.remove("-translate-x-full");
    elements.sidebarBackdrop.classList.remove("hidden");
}

function closeLeftSidebar() {
    elements.leftSidebar.classList.add("-translate-x-full");
    elements.sidebarBackdrop.classList.add("hidden");
}

function handleAddKeyToPool() {
    const provider = elements.newKeyProvider.value;
    const label = elements.newKeyLabel.value.trim() || `${provider.toUpperCase()} Key #${state.keyPool.length + 1}`;
    const key = elements.newKeyValue.value.trim();

    if (!key) {
        alert("Lütfen geçerli bir API anahtarı girin.");
        return;
    }

    const item = {
        id: "key_" + Math.random().toString(36).substring(2, 9),
        provider: provider,
        label: label,
        key: key,
        active: true,
        createdAt: new Date().toLocaleDateString("tr-TR")
    };

    state.keyPool.push(item);
    saveKeyPool();

    elements.newKeyLabel.value = "";
    elements.newKeyValue.value = "";
    renderKeyPool();
    alert(`"${label}" başarıyla havuza eklendi!`);
}

function saveKeyPool() {
    localStorage.setItem("openarena_key_pool", JSON.stringify(state.keyPool));
    updateKeyPoolCounters();
}

function updateKeyPoolCounters() {
    const activeCount = state.keyPool.filter(k => k.active).length;
    elements.keyCountBadge.textContent = `${activeCount} Key`;
    elements.activePoolCount.textContent = `${activeCount} Aktif`;
    elements.savedKeysTotal.textContent = `${state.keyPool.length} Anahtar`;
}

function renderKeyPool() {
    updateKeyPoolCounters();
    const container = elements.keyPoolList;
    container.innerHTML = "";

    if (state.keyPool.length === 0) {
        container.innerHTML = `
            <div class="p-3 text-center text-arena-textSubtle text-xs border border-dashed border-arena-border rounded-xl">
                Henüz anahtar eklenmedi. Yukarıdaki formdan dilediğiniz kadar anahtar ekleyebilirsiniz.
            </div>
        `;
        return;
    }

    state.keyPool.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "p-2.5 rounded-xl bg-arena-card border border-arena-border flex items-center justify-between";
        
        const maskedKey = item.key.length > 10 
            ? item.key.substring(0, 6) + "..." + item.key.substring(item.key.length - 4)
            : "••••••••";

        let provColor = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
        if (item.provider === "gemini") provColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
        else if (item.provider === "openrouter") provColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";

        card.innerHTML = `
            <div class="flex items-center gap-2.5 truncate">
                <input type="checkbox" ${item.active ? 'checked' : ''} class="key-active-checkbox w-3.5 h-3.5 rounded text-indigo-600 focus:ring-0 cursor-pointer">
                <div class="truncate">
                    <div class="flex items-center gap-1.5 truncate">
                        <span class="font-medium text-slate-200 text-xs truncate">${escapeHtml(item.label)}</span>
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-mono border ${provColor}">${item.provider.toUpperCase()}</span>
                    </div>
                    <div class="text-[10px] text-arena-textSubtle font-mono">${maskedKey}</div>
                </div>
            </div>
            <div class="flex items-center gap-1">
                <button class="btn-delete-key p-1 text-arena-textSubtle hover:text-rose-400 rounded transition-colors" title="Sil">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `;

        card.querySelector(".key-active-checkbox").onchange = (e) => {
            item.active = e.target.checked;
            saveKeyPool();
        };

        card.querySelector(".btn-delete-key").onclick = () => {
            if (confirm(`"${item.label}" anahtarını silmek istiyor musunuz?`)) {
                state.keyPool.splice(index, 1);
                saveKeyPool();
                renderKeyPool();
            }
        };

        container.appendChild(card);
    });
}

function getActiveKeysForProvider(provider) {
    return state.keyPool
        .filter(k => k.active && k.provider === provider)
        .map(k => k.key);
}

// ==========================================
// WORKSPACE DRAWER (SAĞ BUTON)
// ==========================================
function openWorkspaceSheet() {
    loadWorkspaceTree();
    elements.workspaceSheet.classList.add("open");
    elements.sheetBackdrop.classList.add("open");
}

function closeWorkspaceSheet() {
    elements.workspaceSheet.classList.remove("open");
    elements.sheetBackdrop.classList.remove("open");
}

function openLiveViewer(iframeUrl, label) {
    elements.viewerIframe.src = iframeUrl;
    elements.viewerUrlLabel.textContent = label;
    elements.viewerModal.classList.remove("hidden");
}

async function loadWorkspaceTree() {
    try {
        const res = await fetch("/api/workspace/files?recursive=true");
        const data = await res.json();
        const root = elements.fileTreeRoot;
        root.innerHTML = "";

        // Calculate dynamic file count and size
        let totalSize = 132000;
        let fileCount = (data.items || []).filter(i => i.type === "file").length || 3;
        (data.items || []).forEach(i => { if (i.size) totalSize += i.size; });
        const sizeKb = (totalSize / 1024).toFixed(1);
        elements.statDiskUsage.textContent = `${sizeKb}KB/128.0MB`;
        elements.statFileCount.textContent = `${fileCount + 16}/10K files`;

        // Root Folder: ⌄ 📁 openarena
        const openarenaFolder = document.createElement("div");
        openarenaFolder.className = "space-y-0.5";
        openarenaFolder.innerHTML = `
            <div class="tree-item font-semibold text-white">
                <span class="text-neutral-500 text-[10px]">⌄</span>
                <span class="text-amber-400">📁</span>
                <span>openarena</span>
            </div>
            <div id="tree-sub-items" class="pl-4 space-y-0.5 border-l border-neutral-700/60 ml-2"></div>
        `;
        root.appendChild(openarenaFolder);

        const subContainer = openarenaFolder.querySelector("#tree-sub-items");

        // Subfolders
        ["backend", "frontend", "tests"].forEach(df => {
            const fEl = document.createElement("div");
            fEl.className = "tree-item text-neutral-300";
            fEl.innerHTML = `
                <span class="text-neutral-500 text-[10px]">›</span>
                <span class="text-amber-400/90">📁</span>
                <span>${df}</span>
            `;
            subContainer.appendChild(fEl);
        });

        // Add real files generated by AI
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                if (item.type === "file") {
                    const isSh = item.name.endsWith(".sh");
                    const icon = isSh 
                        ? `<span class="text-amber-400 font-mono font-bold text-[10px] bg-amber-400/10 px-0.5 rounded border border-amber-400/30">>_</span>`
                        : `<span class="text-neutral-400 text-xs">📄</span>`;

                    const row = document.createElement("div");
                    row.className = `tree-item ${isSh ? 'script-sh' : ''}`;
                    row.innerHTML = `${icon} <span>${escapeHtml(item.name)}</span>`;
                    row.onclick = () => openFileInEditor(item.path);
                    subContainer.appendChild(row);
                }
            });
        }

        // Standard root files
        const staticRootFiles = [
            { name: "README.md", icon: "📄" },
            { name: "requirements.txt", icon: "📄" },
            { name: "run.sh", icon: `<span class="text-amber-400 font-mono font-bold text-[10px] bg-amber-400/10 px-0.5 rounded border border-amber-400/30">>_</span>`, isSh: true }
        ];

        staticRootFiles.forEach(srf => {
            const alreadyExists = Array.from(subContainer.querySelectorAll(".tree-item span:last-child")).some(el => el.textContent === srf.name);
            if (!alreadyExists) {
                const r = document.createElement("div");
                r.className = `tree-item ${srf.isSh ? 'script-sh' : ''}`;
                r.innerHTML = `${srf.icon} <span>${srf.name}</span>`;
                r.onclick = () => openFileInEditor(srf.name);
                subContainer.appendChild(r);
            }
        });

    } catch (e) {
        console.error(e);
    }
}

async function openFileInEditor(path) {
    closeWorkspaceSheet();
    try {
        const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(path)}`);
        const data = await res.json();
        state.activeFile = path;
        elements.editorTitle.textContent = path;
        elements.editorTextarea.value = data.content || `# ${path}\n(Dosya hazır)`;
        elements.editorModal.classList.remove("hidden");
    } catch (e) {
        alert("Dosya açılamadı: " + e.message);
    }
}

async function saveActiveFile() {
    if (!state.activeFile) return;
    try {
        await fetch("/api/workspace/file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: state.activeFile,
                content: elements.editorTextarea.value
            })
        });
        alert("Dosya başarıyla kaydedildi!");
    } catch (e) {
        alert("Kayıt hatası: " + e.message);
    }
}

// ==========================================
// CHAT & RE-ACT LOOP WITH MULTI-KEY POOL
// ==========================================
async function handleSendMessage() {
    const text = elements.userInput.value.trim();
    if (!text || state.isRunning) return;

    elements.userInput.value = "";
    appendUserMessage(text);

    // Get all active keys in the pool for this provider
    const keysForProvider = getActiveKeysForProvider(state.provider);

    if (keysForProvider.length === 0 && state.provider !== "ollama") {
        appendNoKeyGuidance();
        return;
    }

    state.isRunning = true;
    updateStatus(`Ajan çalışıyor (${keysForProvider.length} anahtarlık havuz aktif)...`, true);

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: state.sessionId,
                message: text,
                provider: state.provider,
                model: state.model,
                api_keys: keysForProvider,
                api_key: keysForProvider[0] || ""
            })
        });

        if (!response.ok) {
            appendErrorMessage("Sunucu hatası: " + response.statusText);
            return;
        }

        await processSSE(response);

    } catch (err) {
        appendErrorMessage("Bağlantı hatası: " + err.message);
    } finally {
        state.isRunning = false;
        updateStatus("", false);
        loadWorkspaceTree();
    }
}

async function processSSE(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    let assistantEl = createAssistantBubble();
    let textAccumulator = "";
    let thoughtAccumulator = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop();

        for (const block of lines) {
            if (!block.trim()) continue;
            const eventMatch = block.match(/^event: (.*)$/m);
            const dataMatch = block.match(/^data: (.*)$/m);
            if (!eventMatch || !dataMatch) continue;

            const eventName = eventMatch[1].trim();
            let data = {};
            try { data = JSON.parse(dataMatch[1].trim()); } catch (e) { data = { raw: dataMatch[1] }; }

            if (eventName === "token") {
                textAccumulator += data.content;
                assistantEl.textEl.innerHTML = marked.parse(textAccumulator);
                Prism.highlightAllUnder(assistantEl.textEl);
                scrollToBottom();
            } else if (eventName === "thought") {
                thoughtAccumulator += data.content;
                renderThought(assistantEl.thoughtEl, thoughtAccumulator);
                scrollToBottom();
            } else if (eventName === "tool_start") {
                renderToolBadge(assistantEl.toolsEl, data, "running");
                scrollToBottom();
            } else if (eventName === "tool_end") {
                renderToolBadge(assistantEl.toolsEl, data, "done");
                if (data.tool === "start_process" && data.result.listening_ports && data.result.listening_ports.length > 0) {
                    const port = data.result.listening_ports[0];
                    openLiveViewer(`/proxy/${port}/`, `http://localhost:${port}/`);
                }
                loadWorkspaceTree();
            } else if (eventName === "error") {
                appendErrorMessage(data.error);
                if (data.error.includes("API Key")) {
                    openLeftSidebar();
                }
            }
        }
    }
}

function appendUserMessage(text) {
    const el = document.createElement("div");
    el.className = "flex justify-end pt-2";
    el.innerHTML = `
        <div class="max-w-[85%] bg-arena-card border border-arena-border text-slate-100 rounded-2xl px-4 py-2.5 text-sm shadow-md leading-relaxed select-text">
            ${escapeHtml(text)}
        </div>
    `;
    elements.messagesContainer.appendChild(el);
    scrollToBottom();
}

function createAssistantBubble() {
    const el = document.createElement("div");
    el.className = "message-row flex flex-col space-y-2 pt-2";
    el.innerHTML = `
        <div class="flex items-center gap-2 text-xs text-arena-textSubtle">
            <span class="font-semibold text-slate-300">OpenArena Agent</span>
            <span>•</span>
            <span class="text-emerald-400 font-mono text-[11px]">:8000</span>
        </div>
        <div class="thought-wrapper hidden"></div>
        <div class="tools-wrapper space-y-1.5"></div>
        <div class="markdown-body text-slate-200 text-sm leading-relaxed"></div>
        <div class="flex items-center gap-2 pt-1 text-arena-textSubtle text-xs">
            <button class="copy-btn hover:text-white transition-colors" title="Kopyala">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
            </button>
        </div>
    `;
    elements.messagesContainer.appendChild(el);

    el.querySelector(".copy-btn").onclick = () => {
        const text = el.querySelector(".markdown-body").innerText;
        navigator.clipboard.writeText(text);
        alert("Metin kopyalandı!");
    };

    return {
        thoughtEl: el.querySelector(".thought-wrapper"),
        toolsEl: el.querySelector(".tools-wrapper"),
        textEl: el.querySelector(".markdown-body")
    };
}

function renderThought(container, text) {
    container.classList.remove("hidden");
    container.innerHTML = `
        <details class="thought-box p-2 text-arena-textMuted text-xs" open>
            <summary class="font-medium text-slate-400 select-none cursor-pointer flex items-center gap-1">
                <span>💭</span>
                <span>Thinking Process</span>
            </summary>
            <div class="mt-1 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">${escapeHtml(text)}</div>
        </details>
    `;
}

function renderToolBadge(container, data, status) {
    let el = document.getElementById("tool-card-" + data.call_id);
    if (!el) {
        el = document.createElement("div");
        el.id = "tool-card-" + data.call_id;
        el.className = "tool-pill flex items-center justify-between text-xs";
        container.appendChild(el);
    }

    if (status === "running") {
        el.innerHTML = `
            <div class="flex items-center gap-2 truncate">
                <span class="text-amber-400">⚡</span>
                <span class="text-slate-200 font-semibold">${data.tool}</span>
                <span class="text-neutral-500 font-mono text-[11px] truncate max-w-xs">${escapeHtml(JSON.stringify(data.arguments))}</span>
            </div>
            <span class="text-[10px] text-amber-400 animate-pulse">çalışıyor...</span>
        `;
    } else {
        const isOk = !data.result.error && data.result.exit_code !== 1;
        el.innerHTML = `
            <div class="flex items-center gap-2 truncate">
                <span class="${isOk ? 'text-emerald-400' : 'text-rose-400'} font-bold">${isOk ? '✓' : '✗'}</span>
                <span class="text-slate-200 font-semibold">${data.tool}</span>
                <span class="text-neutral-500 font-mono text-[11px] truncate max-w-xs">${isOk ? 'tamamlandı' : 'hata'}</span>
            </div>
            <span class="text-[10px] ${isOk ? 'text-emerald-400' : 'text-rose-400'} font-mono">${isOk ? 'tamam' : 'hata'}</span>
        `;
    }
}

function appendNoKeyGuidance() {
    const el = document.createElement("div");
    el.className = "p-3.5 rounded-xl bg-arena-card border border-arena-border text-xs text-slate-300 space-y-2 mt-2";
    el.innerHTML = `
        <div class="font-semibold text-amber-400 flex items-center gap-1.5">
            <span>🔑</span>
            <span>API Anahtar Havuzu Boş</span>
        </div>
        <p class="text-arena-textMuted leading-relaxed">
            Seçtiğiniz <b>${state.provider.toUpperCase()}</b> sağlayıcısı için henüz havuza anahtar eklenmemiş. 
            Sol üstteki butona basarak dilediğiniz kadar ücretsiz anahtar ekleyebilirsiniz.
        </p>
        <button onclick="openLeftSidebar()" class="px-3 py-1.5 bg-white text-black font-semibold rounded-lg hover:bg-slate-200 transition-colors">
            🔑 Sol Menüyü Aç & Anahtar Ekle
        </button>
    `;
    elements.messagesContainer.appendChild(el);
    scrollToBottom();
}

function appendErrorMessage(msg) {
    const el = document.createElement("div");
    el.className = "p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mt-2";
    el.textContent = "Hata: " + msg;
    elements.messagesContainer.appendChild(el);
    scrollToBottom();
}

function updateStatus(text, show) {
    if (show) {
        elements.statusPill.classList.remove("hidden");
        elements.statusText.textContent = text;
    } else {
        elements.statusPill.classList.add("hidden");
    }
}

function scrollToBottom() {
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
