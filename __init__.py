"""
ComfyUI_DIY — 节点注册入口
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 确保本包路径在 sys.path 中（兼容 ComfyUI 的 import 机制）
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# 导入节点类
from .nodes.prompt_stitcher import PromptStitcher

NODE_CLASS_MAPPINGS = {
    "PromptStitcher": PromptStitcher,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "PromptStitcher": "Prompt Stitcher (提示词拼接器)",
}

# Web 扩展目录
WEB_DIRECTORY = "web"

# ---- API 路由注册 ----
# ComfyUI 在加载 custom_nodes 时 server 已启动，直接注册即可
try:
    import server
    from .api.prompt_library_routes import register_routes

    prompt_library = os.path.join(BASE_DIR, "prompt_library")
    os.makedirs(prompt_library, exist_ok=True)

    register_routes(server.PromptServer.instance, prompt_library)
    print("[ComfyUI_DIY] ✅ API routes registered successfully.")
except Exception as e:
    print(f"[ComfyUI_DIY] ⚠ Failed to register API routes: {e}")
    import traceback
    traceback.print_exc()
