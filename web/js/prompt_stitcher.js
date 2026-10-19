/**
 * ComfyUI-PromptStitcher — Prompt Stitcher（单文件完整版）
 *
 * 包含：CSS 注入 + API 封装 + 主 Widget + 设置弹窗
 */

import { app } from "../../../scripts/app.js";


// ============================================================
//  CSS 注入（ComfyUI 不会自动加载自定义节点 CSS）
// ============================================================
(function injectCSS() {
    const style = document.createElement("style");
    style.textContent = `
.prompt-stitcher-container{width:100%;height:100%;min-height:0;display:flex;flex-direction:column;background:#1a1a1a;border-radius:4px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:var(--ps-font-size,14px);color:#ccc;user-select:none;--comfy-widget-min-height:320px}
.prompt-stitcher-container *{box-sizing:border-box}
.ps-topbar{display:flex;align-items:center;justify-content:space-between;padding:4px 8px;background:#222;border-bottom:1px solid #333;min-height:28px;flex-shrink:0}
.ps-breadcrumb{display:flex;align-items:center;gap:2px;font-size:0.85em;flex:1;overflow:hidden}
.ps-breadcrumb span{color:#888;cursor:pointer;padding:1px 3px;border-radius:2px;white-space:nowrap}
.ps-breadcrumb span:hover{color:#fff;background:#333}
.ps-breadcrumb span.active{color:#ccc;font-weight:bold}
.ps-breadcrumb .sep{color:#555;cursor:default}
.ps-breadcrumb .sep:hover{background:transparent}
.ps-btn-settings{background:none;border:none;color:#888;cursor:pointer;font-size:1.1em;padding:2px 6px;border-radius:3px;flex-shrink:0}
.ps-btn-settings:hover{color:#fff;background:#333}
.ps-selection-area{overflow-y:auto;min-height:40px;padding:2px 0}
.ps-selection-area::-webkit-scrollbar{width:5px}
.ps-selection-area::-webkit-scrollbar-thumb{background:#444;border-radius:3px}
.ps-item{display:flex;align-items:center;padding:3px 8px;cursor:pointer;transition:background 0.1s;font-size:0.9em}
.ps-item:hover{background:#2a2a2a}
.ps-item.selected{background:#2d5a8e}
.ps-item-icon{margin-right:6px;font-size:0.9em;flex-shrink:0}
.ps-item.folder{color:#d4a017}
.ps-item.file{color:#ccc}
.ps-item-name{flex-shrink:0;margin-right:8px;white-space:nowrap}
.ps-item-preview{flex:1;font-size:0.75em;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.ps-empty{padding:16px;text-align:center;color:#555;font-size:0.85em}
.ps-loading{padding:16px;text-align:center;color:#555;font-size:0.85em}
.ps-divider{height:4px;background:#333;cursor:ns-resize;flex-shrink:0;position:relative;transition:background 0.15s}
.ps-divider:hover{background:#555}
.ps-divider.dragging{background:#2d5a8e}
.ps-divider::after{content:"";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:24px;height:2px;background:#666;border-radius:1px}
.ps-sorting-area{overflow-y:auto;min-height:40px;padding:2px 0}
.ps-sorting-area::-webkit-scrollbar{width:5px}
.ps-sorting-area::-webkit-scrollbar-thumb{background:#444;border-radius:3px}
.ps-sort-item{display:flex;align-items:center;padding:3px 6px;font-size:0.85em;border-left:3px solid transparent;transition:background 0.1s,border-color 0.15s}
.ps-sort-item:hover{background:#2a2a2a}
.ps-sort-item.drag-over{border-top:2px solid #4a90d9}
.ps-sort-item.dragging{opacity:0.4}
.ps-sort-item.is-input{color:#888;font-style:italic}
.ps-sort-item.is-input.drag-active{border-left-color:#4a90d9}
.ps-sort-handle{cursor:grab;color:#555;margin-right:6px;font-size:1em;visibility:hidden;flex-shrink:0}
.ps-sort-item:hover .ps-sort-handle{visibility:visible}
.ps-sort-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ps-sort-remove{cursor:pointer;color:#555;margin-left:6px;font-size:0.9em;flex-shrink:0;padding:0 2px}
.ps-sort-remove:hover{color:#e55}
.ps-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:15vh 15vw;box-sizing:border-box}
.ps-modal{background:#1e1e1e;border:1px solid #444;border-radius:8px;width:100%;height:100%;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.5);font-size:var(--ps-font-size,14px);box-sizing:border-box}
.ps-modal-header{display:flex;align-items:center;justify-content:space-between;gap:0.5em;padding:0.7em 1em;border-bottom:1px solid #333;flex-shrink:0}
.ps-modal-header h3{margin:0;color:#ccc;font-size:1.05em;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ps-modal-close{background:none;border:none;color:#888;font-size:1.6em;line-height:1;cursor:pointer;padding:0 0.2em;flex-shrink:0}
.ps-modal-close:hover{color:#fff}
.ps-modal-body{display:flex;flex:1;min-width:0;min-height:0;overflow:hidden}
.ps-modal-left{flex:0 0 auto;width:min(clamp(15em,30%,34em),55%);border-right:1px solid #333;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;min-height:0}
.ps-modal-section{padding:0.5em 0.7em;border-bottom:1px solid #2a2a2a;flex-shrink:0}
.ps-modal-section label{display:block;font-size:0.8em;color:#888;margin-bottom:0.35em}
.ps-font-size-row{display:flex;align-items:center;gap:0.4em;flex-wrap:wrap}
.ps-font-size-row input{width:5em;min-width:0}
.ps-new-folder-row{display:flex;gap:0.35em}
.ps-new-folder-row input{flex:1;min-width:0}
.ps-modal input,.ps-modal textarea{background:#2a2a2a;border:1px solid #444;color:#ccc;padding:0.35em 0.6em;border-radius:3px;font-size:0.9em;outline:none;font-family:inherit;min-width:0}
.ps-modal input:focus,.ps-modal textarea:focus{border-color:#4a90d9}
.ps-modal textarea{resize:vertical;min-height:6em;line-height:1.45}
.ps-modal button{background:#333;border:1px solid #555;color:#ccc;padding:0.35em 0.8em;border-radius:3px;cursor:pointer;font-size:0.85em;white-space:nowrap;flex-shrink:0}
.ps-modal button:hover{background:#444}
.ps-modal button.danger{background:#6b2020;border-color:#a33}
.ps-modal button.danger:hover{background:#8b2828}
.ps-folder-tree{flex:1 0 auto;min-height:3em;padding:0.35em 0.5em}
.ps-modal-left::-webkit-scrollbar,.ps-modal-right::-webkit-scrollbar{width:6px}
.ps-modal-left::-webkit-scrollbar-thumb,.ps-modal-right::-webkit-scrollbar-thumb{background:#444;border-radius:3px}
.ps-tree-node{user-select:none}
.ps-tree-row{display:flex;align-items:center;gap:0.15em;padding:0.15em 0.3em;cursor:pointer;border-radius:3px;font-size:0.9em;min-width:0}
.ps-tree-row:hover{background:#2a2a2a}
.ps-tree-row.selected{background:#2d5a8e}
.ps-tree-arrow{width:1em;font-size:0.7em;color:#666;flex-shrink:0;text-align:center}
.ps-tree-icon{margin-right:0.25em;color:#d4a017;flex-shrink:0}
.ps-tree-name{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ps-tree-row.lv0{padding-left:0.3em}
.ps-tree-row.lv1{padding-left:1.6em}
.ps-tree-row.lv2{padding-left:3em}
.ps-tree-row.lv3{padding-left:4.4em}
.ps-modal-right{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;padding:0.7em 1em;overflow-y:auto}
.ps-modal-right .ps-item-name{flex-shrink:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.ps-editor-empty{color:#555;text-align:center;padding-top:2.5em;font-size:0.9em}
.ps-editor-folder-actions{display:flex;gap:0.4em;margin-bottom:0.6em;flex-wrap:wrap}
.ps-editor-topbar{display:flex;align-items:center;gap:0.5em;margin-bottom:0.6em;flex-wrap:wrap}
.ps-editor-topbar #ps-btn-delete-file{margin-left:auto}
.ps-editor-file-form{display:flex;flex-direction:column;gap:0.5em;flex:1;min-height:0}
.ps-editor-file-form label{font-size:0.8em;color:#888}
.ps-editor-file-form textarea{flex:1;min-height:6em;resize:vertical}
.ps-modal-footer{padding:0.55em 1em;border-top:1px solid #333;flex-shrink:0}
.ps-btn-open-folder{background:none;border:1px solid #555;color:#aaa;cursor:pointer;padding:0.4em 0.9em;border-radius:3px;font-size:0.9em;width:100%;white-space:nowrap}
.ps-btn-open-folder:hover{background:#2a2a2a;color:#fff}
.ps-toast{position:fixed;top:20px;right:20px;background:#333;color:#eee;padding:10px 18px;border-radius:6px;font-size:0.9em;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.4);animation:ps-toast-in 0.25s ease;max-width:400px}
.ps-toast.error{background:#5c2020;border:1px solid #a33}
@keyframes ps-toast-in{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
`;
    document.head.appendChild(style);
})();

// ============================================================
//  API 封装（内联）
// ============================================================
const DIY_API = {
    BASE: "/diy",

    async _get(url) {
        const r = await fetch(url);
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
        return data;
    },

    async _post(url, body) {
        const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
        return data;
    },

    async _delete(url) {
        const r = await fetch(url, { method: "DELETE" });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
        return data;
    },

    scan(path = "") {
        return this._get(`${this.BASE}/library/scan?path=${encodeURIComponent(path)}`);
    },
    readFile(path) {
        return this._get(`${this.BASE}/library/file?path=${encodeURIComponent(path)}`);
    },
    saveFile(path, name, content, newName = "") {
        return this._post(`${this.BASE}/library/file/save`, { path, name, content, newName });
    },
    deleteFile(path) {
        return this._delete(`${this.BASE}/library/file?path=${encodeURIComponent(path)}`);
    },
    createFolder(path) {
        return this._post(`${this.BASE}/library/folder`, { path });
    },
    deleteFolder(path) {
        return this._delete(`${this.BASE}/library/folder?path=${encodeURIComponent(path)}`);
    },
    renameFolder(oldPath, newPath) {
        return this._post(`${this.BASE}/library/folder/rename`, { oldPath, newPath });
    },
    folderTree() {
        return this._get(`${this.BASE}/library/tree`);
    },
    getSettings() {
        return this._get(`${this.BASE}/settings`);
    },
    saveSettings(data) {
        return this._post(`${this.BASE}/settings`, data);
    },
    openFolder() {
        return this._get(`${this.BASE}/open-folder`);
    },
};

// ============================================================
//  工具函数
// ============================================================
function showToast(msg, isError = false) {
    const el = document.createElement("div");
    el.className = "ps-toast" + (isError ? " error" : "");
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function folderOf(p) {
    const i = p.lastIndexOf("/");
    return i >= 0 ? p.substring(0, i) : "";
}

function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ============================================================
//  状态管理
// ============================================================
class StitcherState {
    constructor(node) {
        this.node = node;
        this.selectedItems = [{ type: "input", path: "", name: "输入提示词" }];
        this.currentPath = "";
        this.splitRatio = 0.5;
    }

    loadFromWidget() {
        const w = this.node.widgets.find(w => w.name === "state_json");
        if (!w) return;
        try {
            const raw = JSON.parse(w.value || "{}");
            if (!raw.v && !raw.selectedItems) return;

            let items = raw.selectedItems || [];

            // v1 → v2 迁移
            if (raw.v === 1 || (!raw.v && items.length > 0 && !items[0].hasOwnProperty("type"))) {
                const inputPos = raw.inputPosition ?? 0;
                const newItems = [];
                for (let i = 0; i < items.length; i++) {
                    if (i === inputPos) {
                        newItems.push({ type: "input", path: "", name: "输入提示词" });
                    }
                    newItems.push({ type: "file", path: items[i].path, name: items[i].name });
                }
                if (inputPos >= items.length) {
                    newItems.push({ type: "input", path: "", name: "输入提示词" });
                }
                items = newItems;
            }

            if (!items.some(it => it.type === "input")) {
                items.unshift({ type: "input", path: "", name: "输入提示词" });
            }

            this.selectedItems = items;
            this.currentPath = raw.currentPath || "";
            this.splitRatio = Math.max(0.15, Math.min(0.85, raw.splitRatio ?? 0.5));
        } catch (e) {
            console.warn("[ComfyUI-PromptStitcher] Failed to parse state_json:", e);
        }
    }

    saveToWidget() {
        const w = this.node.widgets.find(w => w.name === "state_json");
        if (!w) return;
        w.value = JSON.stringify({
            v: 2,
            selectedItems: this.selectedItems,
            currentPath: this.currentPath,
            splitRatio: this.splitRatio,
        });
    }

    inputIndex() {
        return this.selectedItems.findIndex(it => it.type === "input");
    }

    smartInsert(fileItem) {
        const folder = folderOf(fileItem.path);
        const items = this.selectedItems;
        const inputIdx = this.inputIndex();
        let lastSameFolderIdx = -1;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type === "file" && folderOf(items[i].path) === folder) {
                lastSameFolderIdx = i;
            }
        }

        const insertIdx = lastSameFolderIdx >= 0
            ? lastSameFolderIdx + 1
            : (inputIdx >= 0 ? inputIdx : items.length);

        items.splice(insertIdx, 0, fileItem);
        this.saveToWidget();
    }

    removeFile(path) {
        const idx = this.selectedItems.findIndex(it => it.type === "file" && it.path === path);
        if (idx >= 0) {
            this.selectedItems.splice(idx, 1);
            this.saveToWidget();
        }
    }

    isSelected(path) {
        return this.selectedItems.some(it => it.type === "file" && it.path === path);
    }
}

// ============================================================
//  DOM 构建器
// ============================================================
class StitcherUI {
    constructor(node, state) {
        this.node = node;
        this.state = state;
        this.container = null;
        this.selectionEl = null;
        this.sortingEl = null;
        this.dividerEl = null;
        this.breadcrumbEl = null;
        this._dividerDragging = false;
        this._dragItem = null;
        this._fontSize = 14;

        this._build();
        this._loadFontSize();
    }

    async _loadFontSize() {
        try {
            const s = await DIY_API.getSettings();
            this._fontSize = s.font_size || 14;
        } catch (e) {
            this._fontSize = 14;
        }
        this._applyFontSize();
    }

    _applyFontSize() {
        if (this.container) {
            this.container.style.setProperty("--ps-font-size", this._fontSize + "px");
        }
    }

    setFontSize(size) {
        this._fontSize = size;
        this._applyFontSize();
    }

    _build() {

        // 隐藏 state_json 行（type="hidden" 在 canvas / Vue 两种节点下都不绘制，
        // 且 widget 仍参与序列化）
        const stateW = this.node.widgets.find(w => w.name === "state_json");
        if (stateW) {
            stateW.type = "hidden";
        }

        // 主容器
        this.container = document.createElement("div");
        this.container.className = "prompt-stitcher-container";

        this._buildTopbar();

        this.selectionEl = document.createElement("div");
        this.selectionEl.className = "ps-selection-area";
        this.selectionEl.style.flex = "1";
        this.selectionEl.style.overflowY = "auto";
        this.selectionEl.style.minHeight = "60px";
        this.container.appendChild(this.selectionEl);

        this.dividerEl = document.createElement("div");
        this.dividerEl.className = "ps-divider";
        this._setupDividerDrag();
        this.container.appendChild(this.dividerEl);

        this.sortingEl = document.createElement("div");
        this.sortingEl.className = "ps-sorting-area";
        this.sortingEl.style.flex = "1";
        this.sortingEl.style.overflowY = "auto";
        this.sortingEl.style.minHeight = "60px";
        this.container.appendChild(this.sortingEl);

        this._attachToNode();

        setTimeout(() => {
            this._refreshAll();
        }, 100);
    }

    _attachToNode() {
        const widget = this.node.addDOMWidget("stitcher_ui", "custom", this.container);
        // 不写入 widgets_values，避免多出一个空值打乱 state_json 的位置
        widget.serialize = false;
    }

    _buildTopbar() {
        const bar = document.createElement("div");
        bar.className = "ps-topbar";

        this.breadcrumbEl = document.createElement("div");
        this.breadcrumbEl.className = "ps-breadcrumb";
        bar.appendChild(this.breadcrumbEl);

        const btn = document.createElement("button");
        btn.className = "ps-btn-settings";
        btn.innerHTML = "&#9881;";
        btn.title = "设置";
        btn.addEventListener("click", () => this._openSettings());
        bar.appendChild(btn);

        this.container.appendChild(bar);
    }

    async _refreshAll() {
        this._renderBreadcrumb();
        await this._renderSelection();
        this._renderSorting();
    }

    _renderBreadcrumb() {
        if (!this.breadcrumbEl) return;
        this.breadcrumbEl.innerHTML = "";
        const parts = this.state.currentPath ? this.state.currentPath.replace(/\/$/, "").split("/") : [];

        const root = document.createElement("span");
        root.textContent = "📂 词库";
        root.className = parts.length === 0 ? "active" : "";
        root.addEventListener("click", () => this._navigateTo(""));
        this.breadcrumbEl.appendChild(root);

        for (let i = 0; i < parts.length; i++) {
            const sep = document.createElement("span");
            sep.className = "sep";
            sep.textContent = " › ";
            this.breadcrumbEl.appendChild(sep);

            const span = document.createElement("span");
            span.textContent = parts[i];
            span.className = i === parts.length - 1 ? "active" : "";
            const targetPath = parts.slice(0, i + 1).join("/") + "/";
            span.addEventListener("click", () => this._navigateTo(targetPath));
            this.breadcrumbEl.appendChild(span);
        }
    }

    async _navigateTo(path) {
        if (path) {
            try { await DIY_API.scan(path); } catch (e) {
                path = "";
                showToast("文件夹不存在，已回退到根目录", true);
            }
        }
        this.state.currentPath = path;
        this.state.saveToWidget();
        await this._refreshAll();
    }

    async _renderSelection() {
        if (!this.selectionEl) return;
        this.selectionEl.innerHTML = '<div class="ps-loading">加载中...</div>';

        try {
            const data = await DIY_API.scan(this.state.currentPath);
            this.selectionEl.innerHTML = "";

            if (data.folders.length === 0 && data.files.length === 0) {
                this.selectionEl.innerHTML = '<div class="ps-empty">此文件夹为空</div>';
                return;
            }

            for (const f of data.folders) {
                this.selectionEl.appendChild(this._makeSelectionRow("folder", f, null));
            }
            for (const f of data.files) {
                this.selectionEl.appendChild(this._makeSelectionRow("file", f.name, f, this.state.isSelected(f.path)));
            }
        } catch (e) {
            this.selectionEl.innerHTML = '<div class="ps-empty">⚠ 加载失败</div>';
            showToast("词库加载失败: " + e.message, true);
        }
    }

    _makeSelectionRow(kind, displayName, fileData, isSelected = false) {
        const row = document.createElement("div");
        row.className = "ps-item " + kind + (isSelected ? " selected" : "");

        const icon = document.createElement("span");
        icon.className = "ps-item-icon";
        icon.textContent = kind === "folder" ? "📁" : "📝";
        row.appendChild(icon);

        const nameEl = document.createElement("span");
        nameEl.className = "ps-item-name";
        nameEl.textContent = displayName;
        row.appendChild(nameEl);

        if (kind === "file" && fileData) {
            const preview = document.createElement("span");
            preview.className = "ps-item-preview";
            preview.textContent = fileData.preview || "";
            row.appendChild(preview);

            row.addEventListener("click", () => {
                if (this.state.isSelected(fileData.path)) {
                    this.state.removeFile(fileData.path);
                } else {
                    this.state.smartInsert({ type: "file", path: fileData.path, name: fileData.name });
                }
                this._renderSelection();
                this._renderSorting();
            });
        } else if (kind === "folder") {
            row.addEventListener("click", () => {
                const newPath = this.state.currentPath
                    ? this.state.currentPath.replace(/\/$/, "") + "/" + displayName + "/"
                    : displayName + "/";
                this._navigateTo(newPath);
            });
        }

        return row;
    }

    _renderSorting() {
        if (!this.sortingEl) return;
        this.sortingEl.innerHTML = "";
        const items = this.state.selectedItems;

        if (items.length === 0) {
            this.sortingEl.innerHTML = '<div class="ps-empty">请从上方选择提示词</div>';
            return;
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const row = document.createElement("div");
            row.className = "ps-sort-item" + (item.type === "input" ? " is-input" : "");
            row.draggable = true;
            row.dataset.index = i;

            const handle = document.createElement("span");
            handle.className = "ps-sort-handle";
            handle.textContent = "≡";
            row.appendChild(handle);

            const nameEl = document.createElement("span");
            nameEl.className = "ps-sort-name";
            nameEl.textContent = item.name;
            row.appendChild(nameEl);

            if (item.type === "file") {
                const removeBtn = document.createElement("span");
                removeBtn.className = "ps-sort-remove";
                removeBtn.textContent = "✕";
                removeBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.state.removeFile(item.path);
                    this._renderSelection();
                    this._renderSorting();
                });
                row.appendChild(removeBtn);
            }

            this._setupSortDrag(row, i, item);
            this.sortingEl.appendChild(row);
        }
    }

    _setupSortDrag(row, index, item) {
        row.addEventListener("dragstart", (e) => {
            this._dragItem = { index, item };
            row.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(index));
            if (item.type === "input") row.classList.add("drag-active");
        });

        row.addEventListener("dragend", () => {
            row.classList.remove("dragging", "drag-active");
            this._dragItem = null;
            this.sortingEl.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
        });

        row.addEventListener("dragover", (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; });
        row.addEventListener("dragenter", (e) => { e.preventDefault(); row.classList.add("drag-over"); });
        row.addEventListener("dragleave", () => { row.classList.remove("drag-over"); });

        row.addEventListener("drop", (e) => {
            e.preventDefault();
            row.classList.remove("drag-over");
            if (!this._dragItem) return;
            const fromIdx = this._dragItem.index;
            const toIdx = index;
            if (fromIdx === toIdx) return;
            const items = this.state.selectedItems;
            const [moved] = items.splice(fromIdx, 1);
            items.splice(toIdx, 0, moved);
            this.state.saveToWidget();
            this._renderSorting();
        });
    }

    _setupDividerDrag() {
        this.dividerEl.addEventListener("mousedown", (e) => {
            e.preventDefault();
            this._dividerDragging = true;
            this.dividerEl.classList.add("dragging");

            const onMove = (ev) => {
                if (!this._dividerDragging) return;
                const containerRect = this.container.getBoundingClientRect();
                const topbarH = this.container.querySelector(".ps-topbar")?.offsetHeight || 28;
                const dividerH = this.dividerEl.offsetHeight;
                const availableH = containerRect.height - topbarH - dividerH;
                if (availableH <= 0) return;

                let ratio = (ev.clientY - containerRect.top - topbarH) / availableH;
                ratio = Math.max(0.15, Math.min(0.85, ratio));
                this.state.splitRatio = ratio;

                const upperH = Math.round(availableH * ratio);
                const lowerH = availableH - upperH;
                this.selectionEl.style.height = upperH + "px";
                this.selectionEl.style.flex = "none";
                this.sortingEl.style.height = lowerH + "px";
                this.sortingEl.style.flex = "none";
            };

            const onUp = () => {
                this._dividerDragging = false;
                this.dividerEl.classList.remove("dragging");
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                this.state.saveToWidget();
            };

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        });
    }

    async _cleanInvalidItems() {
        const fileItems = this.state.selectedItems.filter(it => it.type === "file");
        for (const item of fileItems) {
            try { await DIY_API.readFile(item.path); } catch (e) { this.state.removeFile(item.path); }
        }
    }

    async _openSettings() {
        const result = await _openSettingsDialog(this._fontSize);
        if (result) {
            if (result.fontSize && result.fontSize !== this._fontSize) {
                this._fontSize = result.fontSize;
                this._applyFontSize();
            }
            if (result.libraryChanged) {
                await this._cleanInvalidItems();
                await this._refreshAll();
            }
        }
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// ============================================================
//  设置弹窗
// ============================================================
function _openSettingsDialog(currentFontSize) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "ps-modal-overlay";
        overlay.innerHTML = `
            <div class="ps-modal">
                <div class="ps-modal-header">
                    <h3>⚙ 提示词库设置</h3>
                    <button class="ps-modal-close">&times;</button>
                </div>
                <div class="ps-modal-body">
                    <div class="ps-modal-left">
                        <div class="ps-modal-section">
                            <label>界面字号</label>
                            <div class="ps-font-size-row">
                                <input type="number" id="ps-font-size" min="8" max="36" value="${currentFontSize}">
                                <span style="color:#888;font-size:0.8em;">px (8-36)</span>
                            </div>
                        </div>
                        <div class="ps-modal-section">
                            <label>新建文件夹</label>
                            <div class="ps-new-folder-row">
                                <input type="text" id="ps-new-folder" placeholder="多级路径" title="支持用 \\ 创建多级路径，例如 角色\\女性">
                                <button id="ps-btn-create-folder">创建</button>
                            </div>
                        </div>
                        <div class="ps-folder-tree" id="ps-folder-tree">
                            <div style="color:#555;text-align:center;padding:20px;">加载中...</div>
                        </div>
                    </div>
                    <div class="ps-modal-right" id="ps-editor-panel">
                        <div class="ps-editor-empty">← 选择左侧文件夹进行浏览</div>
                    </div>
                </div>
                <div class="ps-modal-footer">
                    <button class="ps-btn-open-folder" id="ps-btn-open-folder">📂 打开词库目录</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        let fontSize = currentFontSize;
        let libraryChanged = false;
        let selectedFolderPath = null;   // 当前在右侧浏览的文件夹路径
        let selectedFile = null;         // 当前在右侧编辑的文件 {path, name}
        let expandedFolders = new Set();
        let folderTreeNodes = [];
        const modal = overlay.querySelector(".ps-modal");
        const treeEl = overlay.querySelector("#ps-folder-tree");
        const editorPanel = overlay.querySelector("#ps-editor-panel");
        const fontSizeInput = overlay.querySelector("#ps-font-size");
        const newFolderInput = overlay.querySelector("#ps-new-folder");

        function close(result) { overlay.remove(); resolve(result); }
        overlay.addEventListener("click", (e) => { if (e.target === overlay) close({ fontSize, libraryChanged }); });
        overlay.querySelector(".ps-modal-close").addEventListener("click", () => close({ fontSize, libraryChanged }));
        modal.style.setProperty("--ps-font-size", fontSize + "px");

        const debouncedSaveSettings = debounce(async () => {
            try { await DIY_API.saveSettings({ font_size: fontSize }); } catch (e) { /* */ }
        }, 300);

        fontSizeInput.addEventListener("input", () => {
            let v = parseInt(fontSizeInput.value);
            if (isNaN(v) || v < 8) v = 8;
            if (v > 36) v = 36;
            fontSize = v;
            modal.style.setProperty("--ps-font-size", v + "px");
            debouncedSaveSettings();
        });

        overlay.querySelector("#ps-btn-create-folder").addEventListener("click", async () => {
            const val = newFolderInput.value.trim();
            if (!val) return;
            try {
                await DIY_API.createFolder(val);
                newFolderInput.value = "";
                libraryChanged = true;
                await loadFolderTree();
            } catch (e) { alert("创建失败: " + e.message); }
        });

        overlay.querySelector("#ps-btn-open-folder").addEventListener("click", async () => {
            try { await DIY_API.openFolder(); } catch (e) { alert("打开失败: " + e.message); }
        });

        // ============================================================
        //  左侧：仅文件夹树（无文件）
        // ============================================================
        async function loadFolderTree() {
            try {
                const data = await DIY_API.folderTree();
                folderTreeNodes = data.tree || [];
                renderFolderTree();
            } catch (e) {
                treeEl.innerHTML = '<div style="color:#a33;text-align:center;padding:20px;">加载失败</div>';
            }
        }

        function renderFolderTree() {
            treeEl.innerHTML = "";
            for (const node of folderTreeNodes) _renderFolderNode(treeEl, node, 0);
        }

        function _renderFolderNode(parent, node, level) {
            const lvClass = "lv" + Math.min(level, 3);
            const isExpanded = expandedFolders.has(node.path);
            const wrapper = document.createElement("div");
            wrapper.className = "ps-tree-node";

            const row = document.createElement("div");
            row.className = `ps-tree-row ${lvClass}`;
            if (selectedFolderPath === node.path) row.classList.add("selected");

            const arrow = document.createElement("span");
            arrow.className = "ps-tree-arrow";
            const hasChildren = node.children && node.children.length > 0;
            arrow.textContent = hasChildren ? (isExpanded ? "▼" : "▶") : "";
            row.appendChild(arrow);

            const icon = document.createElement("span");
            icon.className = "ps-tree-icon";
            icon.textContent = isExpanded ? "📂" : "📁";
            row.appendChild(icon);

            const nameEl = document.createElement("span");
            nameEl.className = "ps-tree-name";
            nameEl.textContent = node.name;
            row.appendChild(nameEl);

            row.addEventListener("click", async (e) => {
                e.stopPropagation();
                if (hasChildren) {
                    expandedFolders.has(node.path) ? expandedFolders.delete(node.path) : expandedFolders.add(node.path);
                }
                selectedFolderPath = node.path;
                selectedFile = null;
                renderFolderTree();
                await renderFolderContents(node.path);
            });
            wrapper.appendChild(row);

            // 展开子文件夹
            if (isExpanded && hasChildren) {
                for (const child of node.children) {
                    _renderFolderNode(wrapper, child, level + 1);
                }
            }
            parent.appendChild(wrapper);
        }

        // ============================================================
        //  右侧：选中文件夹的内容（子文件夹 + 文件）
        // ============================================================
        async function renderFolderContents(folderPath) {
            editorPanel.innerHTML = '<div style="color:#555;text-align:center;padding:20px;">加载中...</div>';

            try {
                const data = await DIY_API.scan(folderPath);
                let html = '';

                // 操作按钮
                html += `<div class="ps-editor-folder-actions" style="margin-bottom:10px;">
                    <button id="ps-btn-rename-folder">重命名文件夹</button>
                    <button id="ps-btn-new-file">新建文件</button>
                    <button id="ps-btn-delete-folder" class="danger">删除文件夹</button>
                </div>`;

                // 子文件夹
                if (data.folders.length > 0) {
                    html += '<div style="font-size:0.8em;color:#888;margin-bottom:4px;">📁 子文件夹</div>';
                    for (const f of data.folders) {
                        html += `<div class="ps-item folder" data-nav="${_escHtml(f)}" style="cursor:pointer;">
                            <span class="ps-item-icon">📁</span>
                            <span class="ps-item-name">${_escHtml(f)}</span>
                        </div>`;
                    }
                }

                // 提示词文件
                if (data.files.length > 0) {
                    html += '<div style="font-size:0.8em;color:#888;margin:8px 0 4px;">📝 提示词文件</div>';
                    for (const file of data.files) {
                        const isSel = selectedFile && selectedFile.path === file.path;
                        html += `<div class="ps-item file${isSel ? ' selected' : ''}" data-file-path="${_escHtml(file.path)}" data-file-name="${_escHtml(file.name)}" style="cursor:pointer;">
                            <span class="ps-item-icon">📝</span>
                            <span class="ps-item-name">${_escHtml(file.name)}</span>
                            <span class="ps-item-preview">${_escHtml(file.preview || '')}</span>
                        </div>`;
                    }
                }

                if (data.folders.length === 0 && data.files.length === 0) {
                    html += '<div class="ps-editor-empty">此文件夹为空</div>';
                }

                editorPanel.innerHTML = html;

                // 文件夹操作按钮
                const btnRename = editorPanel.querySelector("#ps-btn-rename-folder");
                const btnNewFile = editorPanel.querySelector("#ps-btn-new-file");
                const btnDelete = editorPanel.querySelector("#ps-btn-delete-folder");

                if (btnRename) btnRename.addEventListener("click", async () => {
                    const parts = folderPath.split("/").filter(Boolean);
                    const oldName = parts[parts.length - 1] || folderPath;
                    const newName = prompt("新文件夹名:", oldName);
                    if (!newName || newName === oldName) return;
                    parts[parts.length - 1] = newName;
                    const newPath = parts.join("/");
                    try {
                        await DIY_API.renameFolder(folderPath, newPath);
                        libraryChanged = true;
                        selectedFolderPath = newPath;
                        await loadFolderTree();
                        await renderFolderContents(newPath);
                    } catch (e) { alert("重命名失败: " + e.message); }
                });

                if (btnNewFile) btnNewFile.addEventListener("click", async () => {
                    const name = prompt("新文件名:");
                    if (!name) return;
                    try {
                        await DIY_API.saveFile(folderPath + "/", "", "", name);
                        libraryChanged = true;
                        await loadFolderTree();
                        await renderFolderContents(folderPath);
                    } catch (e) { alert("创建失败: " + e.message); }
                });

                if (btnDelete) btnDelete.addEventListener("click", async () => {
                    const parts = folderPath.split("/").filter(Boolean);
                    const displayName = parts[parts.length - 1] || folderPath;
                    if (!confirm(`确定删除文件夹 "${displayName}" 及其所有内容？`)) return;
                    try {
                        await DIY_API.deleteFolder(folderPath);
                        libraryChanged = true;
                        selectedFolderPath = "";
                        selectedFile = null;
                        await loadFolderTree();
                        editorPanel.innerHTML = '<div class="ps-editor-empty">← 选择左侧文件夹进行浏览</div>';
                    } catch (e) { alert("删除失败: " + e.message); }
                });

                // 子文件夹点击 → 导航进去
                editorPanel.querySelectorAll(".ps-item.folder[data-nav]").forEach(el => {
                    el.addEventListener("click", async () => {
                        const sub = el.dataset.nav;
                        const newPath = folderPath ? folderPath + "/" + sub : sub;
                        selectedFolderPath = newPath;
                        selectedFile = null;
                        renderFolderTree();
                        await renderFolderContents(newPath);
                    });
                });

                // 文件点击 → 进入编辑模式
                editorPanel.querySelectorAll(".ps-item.file[data-file-path]").forEach(el => {
                    el.addEventListener("click", async () => {
                        const fp = el.dataset.filePath;
                        const fn = el.dataset.fileName;
                        selectedFile = { path: fp, name: fn };
                        await renderFileEditor(fp, fn);
                        // 更新选中高亮
                        editorPanel.querySelectorAll(".ps-item.file").forEach(e => {
                            e.classList.toggle("selected", e.dataset.filePath === fp);
                        });
                    });
                });

            } catch (e) {
                editorPanel.innerHTML = '<div class="ps-editor-empty">⚠ 加载失败: ' + _escHtml(e.message) + '</div>';
            }
        }

        // ============================================================
        //  右侧：文件编辑模式
        // ============================================================
        async function renderFileEditor(filePath, fileName) {
            let content = "";
            try { const d = await DIY_API.readFile(filePath); content = d.content || ""; } catch (e) { /* */ }

            editorPanel.innerHTML = `
                <div class="ps-editor-topbar">
                    <button id="ps-btn-back-to-folder">← 返回文件夹</button>
                    <button id="ps-btn-delete-file" class="danger">删除文件</button>
                </div>
                <div class="ps-editor-file-form">
                    <label>文件名</label>
                    <input type="text" id="ps-edit-filename" value="${_escHtml(fileName)}">
                    <label>内容</label>
                    <textarea id="ps-edit-content">${_escHtml(content)}</textarea>
                </div>`;

            editorPanel.querySelector("#ps-btn-back-to-folder").addEventListener("click", async () => {
                selectedFile = null;
                await renderFolderContents(selectedFolderPath);
            });

            const nameInput = editorPanel.querySelector("#ps-edit-filename");
            const contentInput = editorPanel.querySelector("#ps-edit-content");
            const originalName = fileName;
            const originalPath = filePath;

            const doSave = debounce(async () => {
                const newName = nameInput.value.trim();
                const newContent = contentInput.value;
                if (!newName) return;
                try {
                    const folderPath = originalPath.substring(0, originalPath.lastIndexOf("/"));
                    await DIY_API.saveFile(folderPath || "", originalName, newContent, newName !== originalName ? newName : "");
                    libraryChanged = true;
                    if (newName !== originalName) {
                        const newPath = folderPath ? folderPath + "/" + newName + ".txt" : newName + ".txt";
                        selectedFile = { path: newPath, name: newName };
                    }
                } catch (e) { /* */ }
            }, 300);

            nameInput.addEventListener("input", doSave);
            contentInput.addEventListener("input", doSave);

            editorPanel.querySelector("#ps-btn-delete-file").addEventListener("click", async () => {
                if (!confirm(`确定删除 "${fileName}"？`)) return;
                try {
                    await DIY_API.deleteFile(originalPath);
                    libraryChanged = true;
                    selectedFile = null;
                    await loadFolderTree();
                    await renderFolderContents(selectedFolderPath);
                } catch (e) { alert("删除失败: " + e.message); }
            });
        }

        function _escHtml(str) {
            const div = document.createElement("div");
            div.textContent = str;
            return div.innerHTML;
        }

        loadFolderTree();
    });
}

// ============================================================
//  注册扩展
// ============================================================
app.registerExtension({
    name: "ComfyUI-PromptStitcher.PromptStitcher",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "PromptStitcher") return;


        // ---- onNodeCreated（新节点初次创建）----
        const origOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {

            if (origOnNodeCreated) origOnNodeCreated.apply(this, arguments);

            // addDOMWidget 的高度由节点尺寸决定，这里只负责新节点的默认尺寸
            this.size = [340, 500];

            const state = new StitcherState(this);
            this._stitcherState = state;
            this._uiBuilt = false;

            // 延迟构建 UI
            const buildUI = () => {
                if (this._uiBuilt) return;  // onConfigure 已经构建过了
                this._uiBuilt = true;
                try {
                    const ui = new StitcherUI(this, state);
                    this._stitcherUI = ui;
                    ui._cleanInvalidItems().then(() => ui._refreshAll());
                } catch (e) {
                    console.error("[ComfyUI-PromptStitcher] Error building UI:", e);
                }
            };
            setTimeout(buildUI, 80);

            // 清理
            const origOnRemoved = this.onRemoved;
            this.onRemoved = function () {
                if (this._stitcherUI) {
                    this._stitcherUI.destroy();
                    this._stitcherUI = null;
                }
                if (origOnRemoved) origOnRemoved.apply(this, arguments);
            };
        };

        // ---- onConfigure（工作流加载后恢复状态）----
        const origOnConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (widgets_values) {

            if (origOnConfigure) origOnConfigure.apply(this, arguments);

            // widget 值已恢复，现在可以读取 state_json
            if (this._stitcherState) {
                this._stitcherState.loadFromWidget();
            }

            // 重建 UI（销毁旧的，用恢复后的 state 重建）
            if (this._stitcherUI) {
                this._stitcherUI.destroy();
                this._stitcherUI = null;
            }
            if (this._stitcherState) {
                this._uiBuilt = true;  // 阻止 onNodeCreated 的延迟构建
                setTimeout(() => {
                    try {
                        const ui = new StitcherUI(this, this._stitcherState);
                        this._stitcherUI = ui;
                        ui._cleanInvalidItems().then(() => ui._refreshAll());
                    } catch (e) {
                        console.error("[ComfyUI-PromptStitcher] Error rebuilding UI:", e);
                    }
                }, 80);
            }

            if (!this.size) this.size = [340, 500];
        };
    },
});

