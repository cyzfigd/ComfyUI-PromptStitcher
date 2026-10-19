"""
ComfyUI-PromptStitcher — 后端 API 路由
提供词库 CRUD + 设置读写 + 打开目录
"""

import json
import os
import platform
import shutil
import subprocess

from aiohttp import web


# ============================================================
#  LibraryService — 文件系统操作
# ============================================================

class LibraryService:
    """提示词词库文件系统服务"""

    def __init__(self, base_dir: str):
        self._base = os.path.normpath(base_dir)

    # ---- 安全校验 -------------------------------------------------
    def _safe(self, rel: str) -> str:
        """将相对路径转为绝对路径，并校验在 base 范围内"""
        p = os.path.normpath(os.path.join(self._base, rel))
        if not p.startswith(self._base):
            raise ValueError("路径越界")
        return p

    @staticmethod
    def _json_error(msg: str, code: str = "INTERNAL", status: int = 400) -> web.Response:
        return web.json_response({"error": msg, "code": code}, status=status)

    @staticmethod
    def _json_ok(data=None) -> web.Response:
        return web.json_response(data if data is not None else {"ok": True})

    # ---- 扫描文件夹 ------------------------------------------------
    def scan(self, rel_path: str = "") -> dict:
        """返回 {folders: [...], files: [{name, path, preview}]}"""
        target = self._safe(rel_path) if rel_path else self._base
        if not os.path.isdir(target):
            return {"folders": [], "files": []}

        folders = []
        files = []
        try:
            for entry in sorted(os.listdir(target)):
                full = os.path.join(target, entry)
                if os.path.isdir(full):
                    folders.append(entry)
                elif entry.endswith(".txt") and os.path.isfile(full):
                    name = entry[:-4]  # 去 .txt
                    rp = os.path.join(rel_path, entry).replace("\\", "/") if rel_path else entry
                    rp = rp.replace("\\", "/")
                    preview = self._read_preview(full)
                    files.append({"name": name, "path": rp, "preview": preview})
        except OSError:
            pass

        return {"folders": folders, "files": files}

    def _read_preview(self, full_path: str, max_chars: int = 80) -> str:
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                text = f.read(max_chars + 10)
                if len(text) > max_chars:
                    text = text[:max_chars] + "..."
                return text.replace("\n", " ").replace("\r", " ")
        except (UnicodeDecodeError, OSError):
            return "[非 UTF-8 文件]"

    # ---- 读取文件 ------------------------------------------------
    def read_file(self, rel_path: str) -> str:
        full = self._safe(rel_path)
        if not os.path.isfile(full):
            raise FileNotFoundError(f"文件不存在: {rel_path}")
        try:
            with open(full, "r", encoding="utf-8") as f:
                return f.read()
        except UnicodeDecodeError:
            raise ValueError("文件不是 UTF-8 编码")

    # ---- 创建 / 更新 / 重命名（统一入口）----------------------------
    def save_file(self, folder: str, name: str, content: str, new_name: str = "") -> str:
        """
        统一保存：
        - name 为空 → 新建（new_name 作为文件名）
        - name 有值 + new_name 不同 → 重命名 + 更新内容
        - name 有值 + new_name 相同/为空 → 仅更新内容
        返回最终的相对路径
        """
        folder = folder.rstrip("/\\") if folder else ""

        if not name:
            # 新建
            if not new_name:
                raise ValueError("新建文件时必须提供名称")
            final_name = new_name
            final_path = os.path.join(folder, final_name + ".txt") if folder else final_name + ".txt"
            full = self._safe(final_path)
            if os.path.exists(full):
                raise FileExistsError(f"文件已存在: {final_name}")
        else:
            old_path = os.path.join(folder, name + ".txt") if folder else name + ".txt"
            old_full = self._safe(old_path)
            if not os.path.isfile(old_full):
                raise FileNotFoundError(f"文件不存在: {name}")

            if new_name and new_name != name:
                # 重命名 + 更新
                new_path = os.path.join(folder, new_name + ".txt") if folder else new_name + ".txt"
                new_full = self._safe(new_path)
                if os.path.exists(new_full) and new_full != old_full:
                    raise FileExistsError(f"目标文件已存在: {new_name}")
                os.rename(old_full, new_full)
                full = new_full
                final_path = new_path
            else:
                full = old_full
                final_path = old_path

        # 写入内容
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)

        return final_path.replace("\\", "/")

    # ---- 删除文件 ------------------------------------------------
    def delete_file(self, rel_path: str) -> None:
        full = self._safe(rel_path)
        if not os.path.isfile(full):
            raise FileNotFoundError(f"文件不存在: {rel_path}")
        os.remove(full)

    # ---- 创建文件夹（支持多级）--------------------------------------
    def create_folder(self, rel_path: str) -> None:
        full = self._safe(rel_path)
        os.makedirs(full, exist_ok=True)

    # ---- 删除文件夹（含内容）---------------------------------------
    def delete_folder(self, rel_path: str) -> None:
        full = self._safe(rel_path)
        if not os.path.isdir(full):
            raise FileNotFoundError(f"文件夹不存在: {rel_path}")
        shutil.rmtree(full)

    # ---- 重命名文件夹 ---------------------------------------------
    def rename_folder(self, old_path: str, new_path: str) -> None:
        old_full = self._safe(old_path)
        new_full = self._safe(new_path)
        if not os.path.isdir(old_full):
            raise FileNotFoundError(f"文件夹不存在: {old_path}")
        if os.path.exists(new_full):
            raise FileExistsError(f"目标已存在: {new_path}")
        os.rename(old_full, new_full)

    # ---- 递归扫描文件夹树 -----------------------------------------
    def folder_tree(self, rel_path: str = "") -> list:
        """返回嵌套结构 [{name, path, children: [...]}]"""
        target = self._safe(rel_path) if rel_path else self._base
        if not os.path.isdir(target):
            return []
        result = []
        try:
            for entry in sorted(os.listdir(target)):
                full = os.path.join(target, entry)
                if os.path.isdir(full):
                    rp = os.path.join(rel_path, entry).replace("\\", "/") if rel_path else entry
                    result.append({
                        "name": entry,
                        "path": rp.replace("\\", "/"),
                        "children": self.folder_tree(rp),
                    })
        except OSError:
            pass
        return result


# ============================================================
#  路由注册
# ============================================================

def register_routes(prompt_server, base_dir: str):
    svc = LibraryService(base_dir)

    # ---- 扫描 -------------------------------------------------
    @prompt_server.routes.get("/diy/library/scan")
    async def api_scan(request: web.Request):
        path = request.query.get("path", "")
        try:
            data = svc.scan(path)
            return svc._json_ok(data)
        except ValueError as e:
            return svc._json_error(str(e), "INVALID_PATH", 400)

    # ---- 读取文件内容 -------------------------------------------
    @prompt_server.routes.get("/diy/library/file")
    async def api_read_file(request: web.Request):
        path = request.query.get("path", "")
        if not path:
            return svc._json_error("缺少 path 参数", "INVALID_PATH", 400)
        try:
            content = svc.read_file(path)
            return svc._json_ok({"content": content})
        except FileNotFoundError as e:
            return svc._json_error(str(e), "NOT_FOUND", 404)
        except ValueError as e:
            return svc._json_error(str(e), "ENCODE_ERROR", 400)

    # ---- 保存文件（统一入口：新建 / 更新 / 重命名）-----------------
    @prompt_server.routes.post("/diy/library/file/save")
    async def api_save_file(request: web.Request):
        try:
            body = await request.json()
        except Exception:
            return svc._json_error("请求体不是有效 JSON", "INVALID_PATH", 400)

        folder = body.get("path", "")
        name = body.get("name", "")
        content = body.get("content", "")
        new_name = body.get("newName", "")

        try:
            final_path = svc.save_file(folder, name, content, new_name)
            return svc._json_ok({"path": final_path})
        except (FileNotFoundError, FileExistsError, ValueError) as e:
            return svc._json_error(str(e), "INVALID_PATH", 400)

    # ---- 删除文件 ----------------------------------------------
    @prompt_server.routes.delete("/diy/library/file")
    async def api_delete_file(request: web.Request):
        path = request.query.get("path", "")
        if not path:
            return svc._json_error("缺少 path 参数", "INVALID_PATH", 400)
        try:
            svc.delete_file(path)
            return svc._json_ok()
        except FileNotFoundError as e:
            return svc._json_error(str(e), "NOT_FOUND", 404)

    # ---- 创建文件夹 ---------------------------------------------
    @prompt_server.routes.post("/diy/library/folder")
    async def api_create_folder(request: web.Request):
        try:
            body = await request.json()
        except Exception:
            return svc._json_error("请求体不是有效 JSON", "INVALID_PATH", 400)
        path = body.get("path", "")
        if not path:
            return svc._json_error("缺少 path 参数", "INVALID_PATH", 400)
        try:
            svc.create_folder(path)
            return svc._json_ok()
        except ValueError as e:
            return svc._json_error(str(e), "INVALID_PATH", 400)

    # ---- 删除文件夹 ---------------------------------------------
    @prompt_server.routes.delete("/diy/library/folder")
    async def api_delete_folder(request: web.Request):
        path = request.query.get("path", "")
        if not path:
            return svc._json_error("缺少 path 参数", "INVALID_PATH", 400)
        try:
            svc.delete_folder(path)
            return svc._json_ok()
        except FileNotFoundError as e:
            return svc._json_error(str(e), "NOT_FOUND", 404)

    # ---- 重命名文件夹 -------------------------------------------
    @prompt_server.routes.post("/diy/library/folder/rename")
    async def api_rename_folder(request: web.Request):
        try:
            body = await request.json()
        except Exception:
            return svc._json_error("请求体不是有效 JSON", "INVALID_PATH", 400)
        old = body.get("oldPath", "")
        new = body.get("newPath", "")
        if not old or not new:
            return svc._json_error("缺少 oldPath 或 newPath", "INVALID_PATH", 400)
        try:
            svc.rename_folder(old, new)
            return svc._json_ok()
        except (FileNotFoundError, FileExistsError, ValueError) as e:
            return svc._json_error(str(e), "INVALID_PATH", 400)

    # ---- 文件夹树（设置弹窗用）------------------------------------
    @prompt_server.routes.get("/diy/library/tree")
    async def api_folder_tree(request: web.Request):
        try:
            tree = svc.folder_tree()
            return svc._json_ok({"tree": tree})
        except ValueError as e:
            return svc._json_error(str(e), "INVALID_PATH", 400)

    # ---- 获取设置 ----------------------------------------------
    @prompt_server.routes.get("/diy/settings")
    async def api_get_settings(request: web.Request):
        settings_path = os.path.join(base_dir, "settings.json")
        try:
            with open(settings_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return svc._json_ok(data)
        except (FileNotFoundError, json.JSONDecodeError):
            return svc._json_ok({"font_size": 14})

    # ---- 保存设置 ----------------------------------------------
    @prompt_server.routes.post("/diy/settings")
    async def api_save_settings(request: web.Request):
        try:
            body = await request.json()
        except Exception:
            return svc._json_error("请求体不是有效 JSON", "INVALID_PATH", 400)
        settings_path = os.path.join(base_dir, "settings.json")
        os.makedirs(os.path.dirname(settings_path), exist_ok=True)
        with open(settings_path, "w", encoding="utf-8") as f:
            json.dump(body, f, ensure_ascii=False, indent=2)
        return svc._json_ok()

    # ---- 打开词库目录 ------------------------------------------
    @prompt_server.routes.get("/diy/open-folder")
    async def api_open_folder(request: web.Request):
        try:
            if platform.system() == "Windows":
                os.startfile(base_dir)
            elif platform.system() == "Darwin":
                subprocess.Popen(["open", base_dir])
            else:
                subprocess.Popen(["xdg-open", base_dir])
            return svc._json_ok()
        except OSError as e:
            return svc._json_error(str(e), "INTERNAL", 500)
