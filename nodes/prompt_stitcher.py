"""
ComfyUI_DIY — Prompt Stitcher 节点
用于拼接多个提示词文件 + 外部输入，输出清洗后的合成提示词
"""

import json
import os
import re


class PromptStitcher:
    """
    提示词拼接器：读取词库文件 + 外部输入 STRING → 拼接输出
    """

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "state_json": ("STRING", {"default": "{}"}),
            },
            "optional": {
                "text": ("STRING", {"forceInput": True, "multiline": True, "default": ""}),
            },
        }

    RETURN_TYPES = ("STRING",)
    FUNCTION = "stitch"
    CATEGORY = "DIY"

    # ---- 拼接核心逻辑 ------------------------------------------------
    @staticmethod
    def stitch(text: str, state_json: str) -> tuple:
        """
        1. 解析 state_json → selectedItems + 定位 type="input"
        2. 切分为前缀 / 后缀
        3. 读取每个 type="file" 的 .txt 内容
        4. 前缀 + input_text + 后缀，用 ", " 拼接
        5. 清洗逗号
        """
        base_dir = os.path.join(os.path.dirname(__file__), "..", "prompt_library")
        base_dir = os.path.normpath(base_dir)

        # ----- 解析状态 -----
        try:
            state = json.loads(state_json) if state_json else {}
        except json.JSONDecodeError:
            state = {}

        selected = state.get("selectedItems", [])
        if not selected:
            # 无任何选择，直接返回 input_text（或空串）
            return (text.strip(),)

        # ----- v1 兼容：旧格式 {selectedItems, inputPosition} -----
        if selected and "type" not in selected[0]:
            # v1 格式：selectedItems 不含 type，另有 inputPosition
            input_pos = state.get("inputPosition", 0)
            new_selected = []
            for i, item in enumerate(selected):
                new_selected.append({"type": "file", "path": item["path"], "name": item["name"]})
                if i == input_pos - 1:
                    new_selected.append({"type": "input", "path": "", "name": "输入提示词"})
            if input_pos == 0:
                new_selected.insert(0, {"type": "input", "path": "", "name": "输入提示词"})
            elif input_pos >= len(selected):
                new_selected.append({"type": "input", "path": "", "name": "输入提示词"})
            selected = new_selected

        # ----- 找到分割点 -----
        split_idx = None
        for i, item in enumerate(selected):
            if item.get("type") == "input":
                split_idx = i
                break

        if split_idx is None:
            # 没有 input 占位符，全部当后缀处理
            prefix_items = []
            suffix_items = [it for it in selected if it.get("type") == "file"]
        else:
            prefix_items = [it for it in selected[:split_idx] if it.get("type") == "file"]
            suffix_items = [it for it in selected[split_idx + 1:] if it.get("type") == "file"]

        # ----- 读取文件内容 -----
        def read_prompt(rel_path: str) -> str | None:
            """读取单个提示词文件，UTF-8；失败返回 None"""
            if not rel_path:
                return None
            full = os.path.normpath(os.path.join(base_dir, rel_path))
            # 安全检查：确保在 prompt_library 内
            if not full.startswith(base_dir):
                return None
            if not os.path.isfile(full):
                return None
            try:
                with open(full, "r", encoding="utf-8") as f:
                    return f.read().strip()
            except UnicodeDecodeError:
                # 非 UTF-8 文件，跳过
                return None
            except OSError:
                return None

        prefix_texts = []
        for item in prefix_items:
            content = read_prompt(item.get("path", ""))
            if content:
                prefix_texts.append(content)

        suffix_texts = []
        for item in suffix_items:
            content = read_prompt(item.get("path", ""))
            if content:
                suffix_texts.append(content)

        # ----- 拼接 -----
        parts = []
        if prefix_texts:
            parts.append(", ".join(prefix_texts))
        if text and text.strip():
            parts.append(text.strip())
        if suffix_texts:
            parts.append(", ".join(suffix_texts))

        result = ", ".join(parts)

        # ----- 清洗逗号 -----
        result = re.sub(r",\s*,+", ",", result)  # 连续逗号 → 单个
        result = result.strip().strip(",").strip()

        return (result,)
