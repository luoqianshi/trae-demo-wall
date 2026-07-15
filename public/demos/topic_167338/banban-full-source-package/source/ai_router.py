"""
伴伴 - AI 路由层（四层模型架构）

所有文字层统一使用 DeepSeek API（https://api.deepseek.com/v1，模型 deepseek-chat），
通过不同的系统提示词和温度参数区分各层职责。

================================================================
  四层模型架构
================================================================

L1 人格模型（temperature=0.8）
  - 拥有完整 UserModel + CommunicationProfile，做个性化判断和主动响应
  - 是「伴伴」的人格核心，负责有温度的交互
  - 任务归属：
      5. update_user_model              -- 更新用户认知模型
      6. generate_plan (后半段)          -- L2-A 计算后，L1 按能量节奏安排
      7. generate_morning_brief         -- 早间启动语
      8. generate_evening_review (后半段) -- L2-A 总结后，L1 生成温柔复盘
      9. regulate_communication         -- 调节提醒强度和措辞

L2-A 分析模型（temperature=0.3）
  - 不认识用户，只看数据本身，总结行为模式
  - 客观、冷静、无人格色彩
  - 任务归属：
      3. define_event                   -- 判断是否生成事件节点
      4. link_to_event                  -- 把行为关联到已有事件
      6. generate_plan (前半段)          -- 计算可用时间和事件优先级
      8. generate_evening_review (前半段) -- 总结今日行为数据和完成度

L2-B 视觉模型
  - 已有实现（见 ai_client.py / screenshot_analyzer.py），不在本文件实现

L3 干累活模型（temperature=0.1）
  - 只做结构化操作：分类、拆解、格式化
  - 不推理、不建议、不判断
  - 任务归属：
      1. classify_input                 -- 判断输入类型
      2. parse_input                    -- 拆解输入，提取关键信息

================================================================
  API 配置
================================================================
从 companion_db.Database 的 app_config 表读取：
  - ai_base_url  （默认 https://api.deepseek.com/v1）
  - ai_api_key   （默认 sk-YOUR_API_KEY_HERE）
  - ai_model     （默认 deepseek-chat）
"""

import json
import httpx
from companion_db import Database
from cognition_store import COGNITION_DIMENSIONS


# ============================================================
# 默认配置
# ============================================================
DEFAULT_BASE_URL = "https://api.deepseek.com/v1"
DEFAULT_API_KEY = "sk-YOUR_API_KEY_HERE"
DEFAULT_MODEL = "deepseek-chat"

# 各层温度
TEMP_L1_PERSONALITY = 0.8   # L1 人格模型
TEMP_L2A_ANALYSIS = 0.3     # L2-A 分析模型
TEMP_L3_STRUCTURE = 0.1     # L3 干累活模型


class AIRouter:
    """伴伴 AI 路由层 -- 四层模型架构的核心调度"""

    def __init__(self, db: Database = None):
        self.db = db or Database()
        self._load_config()

    # ============================================================
    # 配置加载
    # ============================================================
    def _load_config(self):
        """从 companion_db 的 app_config 表读取 API 配置"""
        self.base_url = self.db.get_config("ai_base_url", DEFAULT_BASE_URL)
        self.api_key = self.db.get_config("ai_api_key", DEFAULT_API_KEY)
        self.model = self.db.get_config("ai_model", DEFAULT_MODEL)

    def reload(self):
        """重新加载配置（配置变更后调用）"""
        self._load_config()

    # ============================================================
    # 底层 API 调用
    # ============================================================
    def _call_api(self, system_prompt: str, user_content: str,
                  temperature: float, max_tokens: int = 2048,
                  timeout: int = 60) -> dict:
        """
        调用 DeepSeek API（OpenAI 兼容格式），返回解析后的 JSON dict。
        不使用 response_format（DeepSeek 对 prompt 中是否包含 'json' 有严格检查），
        而是在提示词中要求返回 JSON，然后自己解析。
        失败时返回 {"error": "...", "detail": "..."}。
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt + "\n\n请只返回合法的JSON对象，不要包含任何其他文字、不要用markdown代码块。"},
                {"role": "user", "content": user_content},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        content = None
        try:
            with httpx.Client(trust_env=False, timeout=timeout) as client:
                resp = client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=body,
                )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            # 清理可能的 markdown 代码块包裹
            content = content.strip()
            if content.startswith("```"):
                # 去掉 ```json 或 ``` 开头和结尾的 ```
                lines = content.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                content = "\n".join(lines)
            return json.loads(content)
        except httpx.HTTPStatusError as e:
            return {
                "error": "api_http_error",
                "detail": f"HTTP {e.response.status_code}: {e.response.text[:500]}",
            }
        except json.JSONDecodeError as e:
            return {
                "error": "json_parse_error",
                "detail": f"API 返回内容无法解析为 JSON: {e}",
                "raw_content": content[:500] if content else "",
            }
        except Exception as e:
            return {
                "error": "api_call_failed",
                "detail": str(e),
            }

    # ============================================================
    # 1. classify_input -- L3 干累活模型
    # ============================================================
    def classify_input(self, input_text: str) -> dict:
        """
        判断输入类型。

        归属：L3 干累活模型（temperature=0.1）
        职责：只做分类，不推理，不建议。

        输入类型枚举：
          - chat            闲聊
          - wish            表达愿望
          - goal            设定目标
          - plan            具体计划
          - feedback        反馈
          - behavior_report 行为报告
          - unknown         无法分类

        返回 JSON：
          {"type": "...", "keywords": [...], "confidence": 0.0-1.0}
        """
        system_prompt = (
            '你是一个分类器。你的唯一任务是把用户输入归类到以下类型之一：\n'
            '- chat：日常闲聊、打招呼、碎碎念，没有明确目的\n'
            '- wish：表达愿望或想法，但还不构成具体目标（例：「我想多运动」「我想早睡」）\n'
            '- goal：设定明确目标，有可衡量的结果（例：「这个月要看完3本书」「减肥到60kg」）\n'
            '- plan：具体计划或行动安排，有时间或步骤（例：「明天早上7点去跑步」「下午写报告」）\n'
            '- feedback：对某事的反馈、评价或感受（例：「今天效率不错」「那个提醒太烦了」）\n'
            '- behavior_report：汇报已发生的行为或状态（例：「我刚跑了5公里」「今天专注了2小时」）\n'
            '- unknown：无法归入以上任何类型\n\n'
            '## 规则\n'
            '1. 只做分类，不推理，不建议，不解释理由。\n'
            '2. 如果无法确定类型，输出 unknown，不要猜。\n'
            '3. keywords 是从输入中提取的关键词（2-5个），帮助后续处理。\n'
            '4. confidence 是你对分类结果的把握（0.0-1.0），不确定时给低分。\n'
            '5. 输出必须是合法 JSON，不要有其他文字。\n\n'
            '## 输出格式\n'
            '{"type": "chat|wish|goal|plan|feedback|behavior_report|unknown", '
            '"keywords": ["关键词1", "关键词2"], "confidence": 0.0-1.0}'
        )
        user_content = f"请对以下输入进行分类：\n\n输入：{input_text}"
        return self._call_api(system_prompt, user_content,
                              temperature=TEMP_L3_STRUCTURE, max_tokens=200)

    # ============================================================
    # 2. parse_input -- L3 干累活模型
    # ============================================================
    def parse_input(self, input_text: str, input_type: str) -> dict:
        """
        拆解输入，提取关键信息。

        归属：L3 干累活模型（temperature=0.1）
        职责：从文本中提取结构化字段，不做判断。

        返回 JSON：
          {"action": "...", "timing": "...", "object": "...", "status": "...", "emotion": "..."}
        """
        system_prompt = (
            '你是一个信息提取器。你的任务是从用户输入中提取以下5个字段：\n\n'
            '- action：用户要做什么/做了什么/想做什么（动词短语，如「跑步」「写报告」「休息」）\n'
            '- timing：时间信息（如「明天早上7点」「今天下午」「每周三次」「无」）\n'
            '- object：动作对象或内容（如「5公里」「季度报告」「一本书」「无」）\n'
            '- status：状态描述（如「已完成」「计划中」「想做但没做」「进行中」「无」）\n'
            '- emotion：用户表达的情绪（如「开心」「焦虑」「平静」「烦躁」「无」）\n\n'
            '## 规则\n'
            '1. 只做提取，不做判断，不推理，不建议。\n'
            '2. 如果某个字段在输入中不存在或无法提取，填「无」。\n'
            '3. 字段值要简洁，不超过15个字。\n'
            '4. 已知输入类型（input_type）可作为参考，但不要受其限制。\n'
            '5. 输出必须是合法 JSON，不要有其他文字。\n\n'
            '## 输出格式\n'
            '{"action": "...", "timing": "...", "object": "...", "status": "...", "emotion": "..."}'
        )
        user_content = (
            f"输入类型：{input_type}\n"
            f"输入文本：{input_text}\n\n"
            f"请提取结构化信息："
        )
        return self._call_api(system_prompt, user_content,
                              temperature=TEMP_L3_STRUCTURE, max_tokens=300)

    # ============================================================
    # 3. define_event -- L2-A 分析模型
    # ============================================================
    def define_event(self, parsed_input: dict, existing_goals: list,
                     existing_events: list) -> dict:
        """
        判断是否生成事件节点。

        归属：L2-A 分析模型（temperature=0.3）
        职责：不认识用户，根据输入数据和已有事件，判断事件创建策略。

        事件类型规则：
          - 临时闲聊 -> 不创建
          - 「我想做什么」但不清晰 -> floating/clarified
          - 有明确结果 -> goal
          - 具体动作 -> planned
          - 重复倾向 -> habit_candidate
          - 与已有事件高度相关 -> 不重复创建，关联
          - 不确定 -> needs_confirmation=true

        返回 JSON：
          {"should_create_event": bool,
           "action": "create_new|link_existing|skip",
           "event_node": {...},
           "reason": "...",
           "confidence": 0.0-1.0,
           "needs_user_confirmation": bool}
        """
        system_prompt = (
            '你是一个事件分析器。你不认识用户，只看数据本身。\n'
            '你的任务：根据解析后的输入、已有目标和已有事件，判断是否应该创建新的事件节点。\n\n'
            '## 事件类型说明\n'
            '- goal：有明确可衡量结果的目标（例：「这个月看完3本书」）\n'
            '- planned：具体动作或计划，有时间安排（例：「明天7点跑步」）\n'
            '- floating：表达愿望但不够清晰，需要进一步明确（例：「我想多运动」）\n'
            '- clarified：从 floating 进一步澄清后的事件\n'
            '- habit_candidate：出现重复倾向的行为，可能是习惯雏形（例：连续几天说想早睡）\n\n'
            '## 判断规则\n'
            '1. 临时闲聊（chat类型）-> 不创建事件（should_create_event=false, action=skip）\n'
            '2. 用户表达「我想做什么」但不清晰 -> 创建 floating 类型事件，needs_user_confirmation=true\n'
            '3. 有明确结果 -> 创建 goal 类型事件\n'
            '4. 具体动作/计划 -> 创建 planned 类型事件\n'
            '5. 发现重复倾向（与已有事件高度相似） -> 标记 habit_candidate，不重复创建\n'
            '6. 与已有事件高度相关 -> action=link_existing，不重复创建\n'
            '7. 信息不足、不确定 -> needs_user_confirmation=true，让用户确认\n'
            '8. 始终给出 reason 解释你的判断依据\n\n'
            '## event_node 结构（创建新事件时填写，否则留空对象）\n'
            '{"event_type": "goal|planned|floating|clarified|habit_candidate", '
            '"title": "事件标题", "description": "事件描述", '
            '"related_goal_ids": ["关联的目标ID"], '
            '"status": "active|pending|completed"}\n\n'
            '## 输出格式\n'
            '{"should_create_event": true/false, '
            '"action": "create_new|link_existing|skip", '
            '"event_node": {上述结构}, '
            '"reason": "判断依据", '
            '"confidence": 0.0-1.0, '
            '"needs_user_confirmation": true/false}'
        )
        user_content = (
            f"## 解析后的输入\n{json.dumps(parsed_input, ensure_ascii=False, indent=2)}\n\n"
            f"## 已有目标\n{json.dumps(existing_goals, ensure_ascii=False, indent=2)}\n\n"
            f"## 已有事件\n{json.dumps(existing_events, ensure_ascii=False, indent=2)}\n\n"
            f"请判断是否创建事件节点："
        )
        return self._call_api(system_prompt, user_content,
                              temperature=TEMP_L2A_ANALYSIS, max_tokens=800)

    # ============================================================
    # 4. link_to_event -- L2-A 分析模型
    # ============================================================
    def link_to_event(self, activity_log: dict, event_nodes: list) -> dict:
        """
        把行为关联到已有事件。

        归属：L2-A 分析模型（temperature=0.3）
        职责：不判断好坏，只匹配行为和事件的关联性。

        返回 JSON：
          {"related_event_id": "..." or null, "match_reason": "...", "confidence": 0.0-1.0}
        """
        system_prompt = (
            '你是一个行为关联器。你不认识用户，不判断行为好坏。\n'
            '你的任务：将一条行为日志与已有事件节点进行关联匹配。\n\n'
            '## 匹配原则\n'
            '1. 如果行为与某个事件在内容、时间、目标上高度吻合 -> 关联到该事件\n'
            '2. 如果行为与多个事件都有关 -> 选择关联度最高的那个\n'
            '3. 如果行为是纯休闲/娱乐/闲聊，与任何事件都无关 -> related_event_id 为 null\n'
            '4. 不要强行关联，宁可返回 null 也不要牵强匹配\n'
            '5. match_reason 要说明匹配的依据（如「行为中的跑步与事件『每周跑步3次』吻合」）\n'
            '6. confidence 反映匹配置信度，模糊匹配给低分\n\n'
            '## 输出格式\n'
            '{"related_event_id": "事件ID或null", '
            '"match_reason": "匹配依据", '
            '"confidence": 0.0-1.0}'
        )
        user_content = (
            f"## 行为日志\n{json.dumps(activity_log, ensure_ascii=False, indent=2)}\n\n"
            f"## 已有事件节点\n{json.dumps(event_nodes, ensure_ascii=False, indent=2)}\n\n"
            f"请判断这条行为日志关联到哪个事件（或无关联）："
        )
        return self._call_api(system_prompt, user_content,
                              temperature=TEMP_L2A_ANALYSIS, max_tokens=400)

    # ============================================================
    # 5. update_user_model -- L1 人格模型
    # ============================================================
    def update_user_model(self, behaviors: list, feedbacks: list,
                          review: dict, current_model: dict) -> dict:
        """
        更新用户认知模型。

        归属：L1 人格模型（temperature=0.8）
        职责：伴伴的人格核心，拥有对用户的长期理解。
        根据新行为和反馈，更新 UserModel，同时输出八维认知句。

        核心原则：
          - 一次行为 = 证据，不等于定义
          - 重复才形成模式
          - 用户反馈 > AI 推测
          - 不做绝对人格判断
          - 所有更新必须有 evidence 和 confidence

        返回 JSON：
          {"updates": {"field": "value"},
           "new_patterns": [...],
           "evidence": [...],
           "cognition_items": [{"dimension": "...", "sentence": "...", "confidence": 0.0}],
           "confidence": 0.0-1.0,
           "summary_update": "..."}
        """
        system_prompt = (
            '你是「伴伴」的人格核心。你拥有对用户的长期理解和记忆。\n'
            '你的任务：根据用户新的行为和反馈，更新你对用户的认知模型（UserModel），'
            '同时为八维认知图谱生成一句话认知。\n\n'
            '## 你的核心原则（必须严格遵守）\n'
            '1. 一次行为 = 证据，不等于定义。看到用户一次熬夜，不能说「用户是夜猫子」。'
            '只有重复出现的模式才能写入模型。\n'
            '2. 重复才形成模式。新出现的单次行为只能放入 evidence 等待验证，不能直接更新模型字段。\n'
            '3. 用户反馈 > AI 推测。如果用户主动说了自己的偏好/感受，权重高于你从行为推测的结论。\n'
            '4. 不做绝对人格判断。不用「内向/外向」「自律/散漫」等标签。'
            '用「倾向于」「在...情况下容易...」等描述。\n'
            '5. 所有更新必须附带 evidence（证据来源）和 confidence（置信度）。\n'
            '6. 不要过度解读。行为数据有限时，保持克制，少更新而非多更新。\n\n'
            '## UserModel 可更新字段参考\n'
            '- energy_pattern：能量节奏（如「上午高能量，下午低谷，晚上回升」）\n'
            '- work_style：工作风格（如「喜欢整块时间专注」「容易被打断」）\n'
            '- values：看重的价值观（如「健康」「效率」「自由」）\n'
            '- habits：已确认的习惯（需多次重复验证）\n'
            '- sensitivities：敏感点/触发点（如「被催促会反感」）\n'
            '- preferences：偏好（如「喜欢温柔提醒」「偏好文字而非语音」）\n'
            '- summary：整体认知总结\n\n'
            '## 八维认知维度（cognition_items）\n'
            '为以下8个维度各生成一句话认知（使用"你倾向于..."句式）：\n'
            '- personality_traits：人格特质（思维和反应模式）\n'
            '- action_patterns：行动模式（如何开始和完成任务）\n'
            '- work_style：工作方式（高效工作的条件偏好）\n'
            '- time_energy：时间能量（能量节奏和高效时段）\n'
            '- emotion_stress：情绪压力（情绪基线和压力反应）\n'
            '- goals_values：目标价值观（在意什么、追求什么）\n'
            '- constraints：约束条件（影响行动的现实限制）\n'
            '- communication_style：沟通风格（喜欢的被对待方式）\n'
            '证据不足的维度，confidence 给低分（0.1-0.3），sentence 写"我还在了解你"。\n\n'
            '## 输出格式\n'
            '{"updates": {"要更新的字段": "新值"}, '
            '"new_patterns": ["新发现的待验证模式"], '
            '"evidence": ["证据1", "证据2"], '
            '"cognition_items": [{"dimension": "personality_traits", '
            '"sentence": "你倾向于...", "confidence": 0.0}, ...8个维度], '
            '"confidence": 0.0-1.0, '
            '"summary_update": "对用户认知的更新总结"}\n\n'
            '注意：如果没有足够证据更新任何字段，updates 返回空对象 {}，confidence 给低分。'
            '但 cognition_items 必须返回8个维度的条目。'
        )
        user_content = (
            f"## 当前用户模型\n{json.dumps(current_model, ensure_ascii=False, indent=2)}\n\n"
            f"## 新行为记录\n{json.dumps(behaviors, ensure_ascii=False, indent=2)}\n\n"
            f"## 用户反馈\n{json.dumps(feedbacks, ensure_ascii=False, indent=2)}\n\n"
            f"## 近期复盘\n{json.dumps(review, ensure_ascii=False, indent=2)}\n\n"
            f"请更新用户认知模型并生成八维认知句："
        )
        return self._call_api(system_prompt, user_content,
                              temperature=TEMP_L1_PERSONALITY, max_tokens=1500)

    # ============================================================
    # 5b. generate_cognition_sentences -- L1 人格模型
    #     独立生成八维认知句（不更新 UserModel）
    # ============================================================
    def generate_cognition_sentences(self, behaviors: list,
                                     current_map: dict = None,
                                     user_model: dict = None) -> dict:
        """
        根据行为数据生成八维认知句。

        归属：L1 人格模型（temperature=0.8）
        职责：分析用户近期行为，为8个认知维度各生成一句话认知。

        Args:
            behaviors: 近期行为记录列表
            current_map: 当前认知图谱（含已有认知句，用于增量更新而非全量覆盖）
            user_model: 用户模型 V2（人格画像、能量模式等），让 AI 结合已知信息判断

        Returns:
            {"items": [{"dimension": "...", "sentence": "...", "confidence": 0.0,
                        "evidence": [{"source": "ai_inference", "content": "...", "weight": 0.8}]}]}
        """
        dim_desc = "\n".join([
            f"- {d['id']}（{d['label']}）：{d['description']}"
            for d in COGNITION_DIMENSIONS
        ])

        system_prompt = (
            '你是「伴伴」的认知分析引擎。你的任务是根据用户近期的行为数据，'
            '为以下8个认知维度各生成一句话认知。\n\n'
            f'## 八维认知维度\n{dim_desc}\n\n'
            '## 规则\n'
            '1. 每个维度生成一句话认知，使用"你倾向于..."句式\n'
            '2. 证据充分的维度给高置信度（0.7-0.9），有一定证据给中（0.4-0.6），'
            '证据不足给低（0.1-0.3）并写"我还在了解你"\n'
            '3. 不用绝对标签（内向/外向/自律/散漫），用"倾向于""在...情况下容易..."描述\n'
            '4. 一次行为只是证据，不是定义\n'
            '5. 如果已有认知句且与新分析一致，保持原句或微调；如果不一致，用新证据更新\n'
            '6. 每个维度附带 evidence 列表，说明依据\n\n'
            '## 输出格式\n'
            '{"items": [{"dimension": "personality_traits", '
            '"sentence": "你倾向于...", "confidence": 0.0, '
            '"evidence": [{"source": "ai_inference", "content": "依据描述", "weight": 0.8}]}, '
            '...8个维度]}\n\n'
            '注意：必须返回8个维度的条目，不要遗漏。请只返回合法的JSON对象。'
        )
        user_content = (
            f"## 用户近期行为数据\n"
            f"{json.dumps(behaviors, ensure_ascii=False, indent=2)}\n\n"
        )
        if user_model:
            # 提取关键人格信息
            model_brief = {
                "energy_pattern": user_model.get("energy_pattern", {}),
                "action_profile": user_model.get("action_profile", {}),
                "work_profile": user_model.get("work_profile", {}),
                "communication_profile": user_model.get("communication_profile", {}),
            }
            user_content += (
                f"## 已知用户画像\n"
                f"{json.dumps(model_brief, ensure_ascii=False, indent=2)}\n\n"
            )
        if current_map:
            user_content += (
                f"## 当前已有认知图谱\n"
                f"{json.dumps(current_map, ensure_ascii=False, indent=2)}\n\n"
            )
        user_content += f"请生成8个维度的认知句："

        result = self._call_api(system_prompt, user_content,
                                temperature=TEMP_L1_PERSONALITY, max_tokens=1200)

        # 验证并补全8个维度
        if "error" not in result:
            valid_dims = {d["id"] for d in COGNITION_DIMENSIONS}
            items = result.get("items", [])
            seen = set()
            clean_items = []
            for it in items:
                dim = it.get("dimension", "")
                if dim in valid_dims and dim not in seen:
                    seen.add(dim)
                    clean_items.append(it)
            # 补全缺失维度
            for d in COGNITION_DIMENSIONS:
                if d["id"] not in seen:
                    clean_items.append({
                        "dimension": d["id"],
                        "sentence": "我还在了解你",
                        "confidence": 0.1,
                        "evidence": [],
                    })
            result["items"] = clean_items

        return result

    # ============================================================
    # 5c. generate_followup_questions -- L1 人格模型
    #     根据用户已填的 Onboarding 答案，AI 主动生成追问问题
    # ============================================================
    def generate_followup_questions(self, draft: dict, count: int = 5, round_num: int = 1,
                                   prev_followup_answers: list = None) -> dict:
        """
        根据用户已填的问卷答案，生成 AI 追问问题。

        归属：L1 人格模型（temperature=0.9，鼓励创意）
        职责：分析用户已有的回答，发现认知盲区，生成个性化追问。

        支持多轮追问：
        - Round 1: 基于问卷答案，覆盖 5 个不同维度
        - Round 2: 基于问卷 + 第一轮追问答案，深入挖掘
        - Round 3 (可选): 更深层的人格洞察

        问题格式规范（AI 必须严格遵守）：
        - id: 问题唯一标识（q1, q2, ... q5）
        - dimension: 关联的认知维度（personality_traits/action_patterns/work_style/
                     time_energy/emotion_stress/goals_values/constraints/communication_style）
        - question: 问题文本（15-40字，口语化，温暖不评判）
        - options: 选项列表（3-6个，每个10-25字）
        - maxSelection: 最多选几个（1=单选，2-3=多选）
        - reason: AI 为什么想问这个（10-30字，让用户理解追问意图）

        Args:
            draft: 用户当前的 Onboarding 草稿
            count: 生成几个问题（默认5个）
            round_num: 当前追问轮次（1=第一轮，2=第二轮）
            prev_followup_answers: 前几轮追问的答案

        Returns:
            {"questions": [{id, dimension, question, options, maxSelection, reason}]}
        """
        # 构建用户已有答案的摘要
        answer_summary = self._summarize_draft(draft)

        # 构建前轮追问答案摘要
        prev_summary = ""
        if prev_followup_answers and len(prev_followup_answers) > 0:
            prev_lines = []
            for fa in prev_followup_answers:
                dim = fa.get("dimension", "")
                q = fa.get("question", "")
                selected = fa.get("selected", [])
                prev_lines.append(f"  - [{dim}] {q} → 用户选了: {', '.join(selected)}")
            prev_summary = "\n## 用户在前一轮追问中的回答\n" + "\n".join(prev_lines)

        # 根据轮次调整 prompt 深度
        if round_num == 1:
            round_instruction = (
                '这是第 1 轮追问。请覆盖 5 个不同的认知维度，每个维度一个问题。\n'
                '问题要口语化、温暖、不评判，像朋友第一次深入聊天。\n'
                '每个问题要有洞察力——不是表面问卷式的"你喜欢什么"，\n'
                '而是挖掘行为背后的动机、恐惧、能量来源和真实偏好。'
            )
        elif round_num == 2:
            round_instruction = (
                '这是第 2 轮追问。用户已经回答了第 1 轮的问题。\n'
                '请基于用户在第 1 轮的回答，问更深层的问题——\n'
                '挖掘矛盾点、盲区、隐藏假设和深层动机。\n'
                '例如：如果用户说"容易分心"，不要问"为什么分心"，\n'
                '而是问"分心的时候你在想什么？是在逃避什么还是在追逐什么？"\n'
                '问题要有挑战性但温暖，让用户感到被真正看见。\n'
                '覆盖 5 个维度（可与第 1 轮不同，或在同一维度上更深入）。'
            )
        else:
            round_instruction = (
                f'这是第 {round_num} 轮追问。用户已经回答了多轮问题。\n'
                '请综合所有已知信息，问最关键的洞察性问题——\n'
                '那些能揭示用户核心驱动力、恐惧和价值观的问题。\n'
                '问题要短、精准、有力，直指人心但充满善意。'
            )

        system_prompt = (
            '你是「伴伴」，一个温暖的陪伴助手。用户正在完成初始认知问卷。\n'
            '你的任务：根据用户已经填写的答案，发现你想进一步了解的方面，'
            f'生成 {count} 个追问问题。\n\n'
            '## 八维认知维度\n'
            '- personality_traits: 人格特质（思维和反应模式、内向/外向倾向）\n'
            '- action_patterns: 行动模式（如何开始和完成任务、面对困难的反应）\n'
            '- work_style: 工作方式（高效工作的条件偏好、协作 vs 独立）\n'
            '- time_energy: 时间能量（能量节奏和高效时段、恢复方式）\n'
            '- emotion_stress: 情绪压力（情绪基线、压力反应、自我调节策略）\n'
            '- goals_values: 目标价值观（在意什么、追求什么、什么让你感到意义）\n'
            '- constraints: 约束条件（影响行动的现实限制、资源瓶颈）\n'
            '- communication_style: 沟通风格（喜欢的被对待方式、反馈偏好）\n\n'
            f'{round_instruction}\n\n'
            '## 规则（必须严格遵守）\n'
            '1. 只问用户答案中尚未覆盖的维度，不要重复已有信息\n'
            '2. 问题要口语化、温暖、不评判，像朋友聊天\n'
            '3. 每个问题提供 3-6 个选项，选项要具体、有区分度\n'
            '4. maxSelection=1 是单选，2-3 是多选\n'
            '5. reason 字段让用户理解你为什么好奇这个\n'
            '6. 不要问敏感或隐私问题\n'
            '7. 问题要有随机性，每次生成的角度不同\n'
            '8. 5 个问题必须覆盖 5 个不同的维度\n'
            '9. 选项不要只列"好"的方面，也要包含"不太理想但真实"的选项\n\n'
            '## 输出格式（严格 JSON）\n'
            '{"questions": [{"id": "q1", "dimension": "time_energy", '
            '"question": "你一般在什么时段觉得精力最充沛？", '
            '"options": ["清晨刚起床时", "上午10点左右", "下午2-4点", "晚上夜深人静时"], '
            '"maxSelection": 1, "reason": "想了解你的能量节奏，帮你在合适的时间安排重要任务"}]}\n\n'
            '注意：请只返回合法的JSON对象，不要包含任何其他文字。'
        )
        user_content = (
            f"## 用户已填写的答案\n{answer_summary}\n"
            f"{prev_summary}\n\n"
            f"请生成 {count} 个你想追问的问题（第 {round_num} 轮）："
        )

        result = self._call_api(system_prompt, user_content,
                                temperature=0.9, max_tokens=2000)

        # 验证和清理问题格式
        if "error" not in result:
            questions = result.get("questions", [])
            valid_dims = {
                "personality_traits", "action_patterns", "work_style",
                "time_energy", "emotion_stress", "goals_values",
                "constraints", "communication_style",
            }
            clean_qs = []
            seen_dims = set()
            for i, q in enumerate(questions):
                dim = q.get("dimension", "")
                # 格式校验和修复
                clean_q = {
                    "id": q.get("id", f"q{i+1}"),
                    "dimension": dim if dim in valid_dims else "personality_traits",
                    "question": q.get("question", "")[:60],
                    "options": [str(o)[:30] for o in q.get("options", [])][:6],
                    "maxSelection": max(1, min(3, int(q.get("maxSelection", 1)))),
                    "reason": q.get("reason", "")[:50],
                }
                # 跳过无效问题（选项不足3个）
                if len(clean_q["options"]) < 3:
                    continue
                # 跳过重复维度（每个维度只问一次）
                if clean_q["dimension"] in seen_dims:
                    continue
                seen_dims.add(clean_q["dimension"])
                clean_qs.append(clean_q)
                if len(clean_qs) >= count:
                    break

            # 如果 AI 生成的问题不足，补充默认问题
            default_qs = self._get_default_followup_questions()
            for dq in default_qs:
                if len(clean_qs) >= count:
                    break
                if dq["dimension"] not in seen_dims:
                    clean_qs.append(dq)
                    seen_dims.add(dq["dimension"])

            result["questions"] = clean_qs[:count]

        return result

    def _summarize_draft(self, draft: dict) -> str:
        """将 Onboarding 草稿摘要为 AI 可读的文本"""
        lines = []
        if draft.get("ideaResponse"):
            lines.append(f"- 新想法反应: {', '.join(draft['ideaResponse'])}")
        if draft.get("blockers"):
            lines.append(f"- 容易卡在: {', '.join(draft['blockers'])}")
        if draft.get("execution"):
            exec_val = draft['execution']
            if isinstance(exec_val, list):
                exec_str = ', '.join(exec_val)
            else:
                exec_str = str(exec_val)
            lines.append(f"- 执行风格: {exec_str}")
        if draft.get("industry"):
            lines.append(f"- 行业: {draft['industry']}")
        if draft.get("directions"):
            lines.append(f"- 方向: {', '.join(draft['directions'])}")
        if draft.get("tasks"):
            lines.append(f"- 常见任务: {', '.join(draft['tasks'])}")
        if draft.get("tools"):
            lines.append(f"- 常用工具: {', '.join(draft['tools'])}")
        if draft.get("workBlocks"):
            wb = draft['workBlocks']
            if wb and isinstance(wb[0], dict):
                wb_str = ', '.join(f"{b.get('name','?')}({b.get('duration','?')}h)" for b in wb)
            else:
                wb_str = ', '.join(str(b) for b in wb)
            lines.append(f"- 工作卡点: {wb_str}")
        if draft.get("seeds"):
            lines.append(f"- 想法种子: {', '.join(draft['seeds'])}")
        if draft.get("focus"):
            lines.append(f"- 当前焦点: {draft['focus']}")
        if draft.get("role"):
            lines.append(f"- 期望角色: {draft['role']}")
        if draft.get("warmth") is not None:
            lines.append(f"- 温柔度: {draft.get('warmth', 0)}/100")
        if draft.get("directness") is not None:
            lines.append(f"- 直接度: {draft.get('directness', 0)}/100")
        if draft.get("interruption"):
            lines.append(f"- 打断容忍: {draft['interruption']}")
        if draft.get("planStyle"):
            lines.append(f"- 计划风格: {draft['planStyle']}")

        return "\n".join(lines) if lines else "（用户尚未填写任何答案）"

    def _get_default_followup_questions(self) -> list:
        """默认追问问题（AI 生成失败时的兜底）— 5 个覆盖 5 个维度"""
        return [
            {
                "id": "fallback_time",
                "dimension": "time_energy",
                "question": "你一般在什么时段觉得精力最充沛？",
                "options": ["清晨刚起床时", "上午10点左右", "下午2-4点", "晚上夜深人静时", "不太固定，看状态"],
                "maxSelection": 1,
                "reason": "想了解你的能量节奏，帮你在合适的时间安排重要任务",
            },
            {
                "id": "fallback_stress",
                "dimension": "emotion_stress",
                "question": "压力比较大的时候，你通常会怎么缓解？",
                "options": ["运动或散步", "听音乐或看视频", "找人倾诉", "独自安静一会", "继续忙就忘了", "吃点好的"],
                "maxSelection": 2,
                "reason": "想在合适的时候给你对味的支持方式",
            },
            {
                "id": "fallback_comm",
                "dimension": "communication_style",
                "question": "伴伴给你建议的时候，你更喜欢哪种方式？",
                "options": ["直接告诉我下一步做什么", "给我几个选项让我选", "先问我怎么想的", "用比喻或故事说明", "默默帮我做好就行"],
                "maxSelection": 1,
                "reason": "想用你觉得舒服的方式跟你交流",
            },
            {
                "id": "fallback_personality",
                "dimension": "personality_traits",
                "question": "做一个决定时，你更靠什么？",
                "options": ["直觉和感受", "逻辑分析", "别人怎么看", "过去的经验", "先试试再说"],
                "maxSelection": 1,
                "reason": "想理解你的决策风格，帮你做判断时更顺手",
            },
            {
                "id": "fallback_goals",
                "dimension": "goals_values",
                "question": "什么样的事情会让你觉得'今天没白过'？",
                "options": ["完成了一个重要任务", "学到了新东西", "和人有了好的连接", "有一段专注的心流时光", "身体感觉很好", "帮助了别人"],
                "maxSelection": 2,
                "reason": "想找到你真正的满足感来源",
            },
        ]

    # ============================================================
    # 5d. generate_personality_analysis -- L1 人格模型
    #     Onboarding 完成后，生成温暖的人格分析报告
    # ============================================================
    def generate_personality_analysis(self, draft: dict, user_model: dict) -> dict:
        """
        根据用户 Onboarding 答案 + 已构建的 UserModelV2，生成 AI 人格分析。

        归属：L1 人格模型（temperature=0.8，有温度的表达）
        职责：用温暖、不评判的语言，总结用户的认知特征，
              让用户感到被理解，并对即将开始的陪伴充满期待。

        Args:
            draft: 用户完成的 Onboarding 草稿
            user_model: build_user_model() 生成的 UserModelV2 dict

        Returns:
            {
                "greeting": "温暖开场（2-3句，像朋友见面）",
                "insights": [
                    {"title": "洞察标题", "content": "具体描述", "emoji": "emoji"}
                ],
                "communication": "沟通偏好总结（1-2句）",
                "energy": "能量节奏总结（1-2句）",
                "expectation": "伴伴期待和你一起...（1-2句）",
            }
        """
        answer_summary = self._summarize_draft(draft)

        # 补充 UserModelV2 结构化信息
        model_lines = []
        if user_model:
            ds = user_model.get("desiredSelf", {})
            if ds.get("focus"):
                model_lines.append(f"- 当前焦点: {ds['focus']}")
            if ds.get("keywords"):
                model_lines.append(f"- 理想自我关键词: {', '.join(ds['keywords'][:5])}")

            ap = user_model.get("actionProfile", {})
            for key, val in ap.items():
                if isinstance(val, dict) and val.get("cognition_sentence"):
                    model_lines.append(f"- {key}: {val['cognition_sentence']}")

            ep = user_model.get("energyPattern", {})
            if ep.get("peakHours"):
                model_lines.append(f"- 高能量时段: {', '.join(ep['peakHours'])}")

            cp = user_model.get("communicationProfile", {})
            if cp.get("role"):
                model_lines.append(f"- 期望角色: {cp['role']}")
            if cp.get("warmth") is not None:
                model_lines.append(f"- 温柔度: {cp['warmth']}/100, 直接度: {cp.get('directness', 50)}/100")

        model_summary = "\n".join(model_lines) if model_lines else "（模型构建中）"

        system_prompt = (
            '你是「伴伴」，一个温暖的陪伴助手。用户刚刚完成了初始认知问卷。\n'
            '你的任务：根据用户的全部回答，生成一份温暖、真诚、不评判的人格分析。\n\n'
            '## 核心原则\n'
            '1. 所有状态都是中性的，不做价值判断——没有"好"或"坏"，只有"你是这样的"\n'
            '2. 用朋友聊天的语气，像刚认识一个人后真诚地分享你的观察\n'
            '3. 具体而非空泛——引用用户的实际回答，而非套话\n'
            '4. 让用户感到被看见、被理解，而非被分类、被定义\n'
            '5. 语气温暖但不油腻，真诚但不生硬\n\n'
            '## 输出格式（严格 JSON）\n'
            '{\n'
            '  "greeting": "2-3句温暖开场，像朋友见面时说\'我注意到你...\'",\n'
            '  "insights": [\n'
            '    {"title": "6-10字洞察标题", "content": "1-2句具体描述", "emoji": "一个emoji"},\n'
            '    ...（3-5个洞察）\n'
            '  ],\n'
            '  "communication": "1-2句沟通偏好总结",\n'
            '  "energy": "1-2句能量节奏总结",\n'
            '  "expectation": "1-2句，伴伴期待和你一起做什么"\n'
            '}\n\n'
            '## 注意\n'
            '- insights 要覆盖不同维度（行动模式、工作方式、沟通风格等），不要集中在一点\n'
            '- 每个洞察的 content 要引用用户的具体回答，不要空泛\n'
            '- emoji 要和洞察内容匹配\n'
            '- 不要使用"你应该""你需要"等命令式语言\n'
        )

        user_content = (
            f"## 用户问卷答案\n{answer_summary}\n\n"
            f"## 系统构建的用户模型\n{model_summary}\n\n"
            "请根据以上信息，生成温暖的人格分析。"
        )

        result = self._call_api(system_prompt, user_content,
                                temperature=TEMP_L1_PERSONALITY, max_tokens=1200)

        if result.get("error"):
            # AI 不可用时，用 user_model 数据生成兜底分析
            return self._fallback_analysis(draft, user_model)

        # 验证和清理
        analysis = result.get("analysis", result)
        if isinstance(analysis, str):
            try:
                analysis = json.loads(analysis)
            except Exception:
                analysis = {}

        # 确保字段完整
        if not analysis.get("greeting"):
            return self._fallback_analysis(draft, user_model)

        if not isinstance(analysis.get("insights"), list):
            analysis["insights"] = []
        for ins in analysis["insights"]:
            if not isinstance(ins, dict):
                continue
            ins.setdefault("title", "")
            ins.setdefault("content", "")
            ins.setdefault("emoji", "\u2728")

        analysis.setdefault("communication", "")
        analysis.setdefault("energy", "")
        analysis.setdefault("expectation", "")

        return analysis

    def _fallback_analysis(self, draft: dict, user_model: dict) -> dict:
        """AI 不可用时的兜底人格分析（基于规则）"""
        insights = []

        # 行动模式洞察
        if draft.get("execution"):
            exec_val = draft["execution"]
            if isinstance(exec_val, list):
                exec_key = exec_val[0] if exec_val else ""
            else:
                exec_key = exec_val
            exec_map = {
                "quick_start": ("先动了再说", "想到就做，在行动中调整方向", "\u26A1"),
                "plan_first": ("先想清楚再动", "喜欢先有清晰的方向再开始执行", "\U0001F4A1"),
                "parallel": ("多线并进", "能同时推进几件事，在切换中保持节奏", "\U0001F504"),
                "iterative": ("小步快跑", "先做一版再迭代，在实践中完善", "\U0001F3C3"),
            }
            title, content, emoji = exec_map.get(exec_key, ("独特的节奏", "有自己的行动方式", "\u2728"))
            insights.append({"title": title, "content": content, "emoji": emoji})

        # 卡点洞察
        if draft.get("blockers"):
            blockers = "、".join(draft["blockers"][:2])
            insights.append({
                "title": "容易卡住的地方",
                "content": f"在{blockers}方面容易遇到阻力，这很正常",
                "emoji": "\U0001F6A7"
            })

        # 行业/方向洞察
        if draft.get("industry"):
            insights.append({
                "title": "你的领域",
                "content": f"在{draft.get('industry', '')}领域深耕，有自己的专业视角",
                "emoji": "\U0001F4BC"
            })

        # 想法种子洞察
        if draft.get("seeds"):
            insights.append({
                "title": "脑子里有不少想法",
                "content": f"已经有了{len(draft['seeds'])}个想做的事，都是值得认真对待的种子",
                "emoji": "\U0001F331"
            })

        # 沟通偏好
        role_map = {
            "quiet_observer": "安静记录者",
            "idea_organizer": "灵感整理师",
            "action_coach": "项目推进教练",
            "gentle_companion": "温和陪伴者",
            "analyst": "冷静分析师",
            "life_rhythm": "生活节奏管家",
        }
        role_label = role_map.get(draft.get("role", ""), "温和陪伴者")

        # 能量
        energy = "根据自己的节奏来，不勉强，不比较"

        return {
            "greeting": "很高兴认识你。我认真看了你的回答，有一些观察想和你分享。",
            "insights": insights[:5],
            "communication": f"你希望伴伴作为{role_label}，用你觉得舒服的方式陪伴你。",
            "energy": energy,
            "expectation": "期待和你一起，把那些想法变成真实的步伐。",
        }

    # ============================================================
    # UCM-8 认知画像分析
    # ============================================================

    def generate_ucm8_analysis(self, profile: dict) -> dict:
        """
        根据 UCM-8 八维认知画像，生成温暖的 AI 分析报告。

        Args:
            profile: UCM8Profile.to_dict() 的结果，包含 dimensions 和 interaction_strategy

        Returns:
            {
                "greeting": "温暖开场",
                "dimensions": [
                    {"id": "cognitive_mode", "name": "认知模式", "score": 75, "insight": "一句话洞察"}
                ],
                "core_traits": ["核心特质1", "核心特质2", "核心特质3"],
                "interaction_style": "交互风格总结（2-3句）",
                "growth_areas": ["成长方向1", "成长方向2"],
                "closing": "温暖结语"
            }
        """
        dimensions = profile.get("dimensions", {})

        # 第一步：尝试调用 AI 生成深度分析
        dim_summaries = []
        for dim_id, dim_data in dimensions.items():
            score = dim_data.get("overallScore", 50)
            name = dim_data.get("name", dim_id)
            dim_summaries.append(f"- {name}: {score:.0f}分")

        dim_summary_text = "\n".join(dim_summaries)

        system_prompt = (
            '你是「伴伴」，一个温暖的认知陪伴助手。用户刚刚完成了 UCM-8 八维认知问卷。\n'
            '你的任务：根据八维评分，生成一份温暖、真诚、不评判的认知画像分析。\n\n'
            '## 核心原则\n'
            '1. 所有状态都是中性的——没有"好"或"坏"，只有"你是这样的"\n'
            '2. 高分不是优点，低分不是缺点，它们只是不同的运作方式\n'
            '3. 用朋友聊天的语气，真诚地分享你的观察\n'
            '4. 让用户感到被看见、被理解，而非被分类、被定义\n'
            '5. 语气温暖但不油腻，真诚但不生硬\n\n'
            '## 八维说明\n'
            '- 认知模式：获取信息和做决策的方式\n'
            '- 动机系统：内在驱动力来源\n'
            '- 行动模式：执行任务的节奏和方式\n'
            '- 时间节律：作息规律和时间感知\n'
            '- 能量模型：精力来源和消耗模式\n'
            '- 情绪状态：情绪基调和调节方式\n'
            '- 环境社交：环境偏好和社交模式\n'
            '- AI交互偏好：与AI互动的偏好方式\n\n'
            '## 输出格式（严格 JSON）\n'
            '{\n'
            '  "greeting": "2-3句温暖开场，像朋友见面",\n'
            '  "dimensions": [\n'
            '    {"id": "维度id", "name": "维度名", "score": 分数, "insight": "1句话温暖洞察"}\n'
            '  ],\n'
            '  "core_traits": ["核心特质1", "核心特质2", "核心特质3"],\n'
            '  "interaction_style": "2-3句，描述与你互动时我会注意什么",\n'
            '  "growth_areas": ["可以探索的方向1", "可以探索的方向2"],\n'
            '  "closing": "1-2句温暖结语"\n'
            '}\n\n'
            '## 注意\n'
            '- 不要使用"你应该""你需要"等命令式语言\n'
            '- 每个维度的 insight 要温暖、有洞察力，不是简单描述分数\n'
            '- core_traits 要提炼出用户最独特的3个特质\n'
            '- growth_areas 是"可以探索的方向"，不是"需要改进的地方"\n'
        )

        user_content = (
            f"## 用户的八维评分\n{dim_summary_text}\n\n"
            "请根据以上八维评分，生成温暖的认知画像分析。"
        )

        try:
            result = self._call_api(system_prompt, user_content,
                                    temperature=TEMP_L1_PERSONALITY, max_tokens=1500)

            if not result.get("error"):
                analysis = result.get("analysis", result)
                if isinstance(analysis, str):
                    try:
                        analysis = json.loads(analysis)
                    except Exception:
                        analysis = {}

                if analysis.get("greeting") and analysis.get("core_traits"):
                    # 确保字段完整
                    analysis.setdefault("dimensions", [])
                    analysis.setdefault("interaction_style", "")
                    analysis.setdefault("growth_areas", [])
                    analysis.setdefault("closing", "")
                    return analysis
        except Exception:
            pass

        # AI 不可用时的兜底分析
        return self._fallback_ucm8_analysis(profile)

    def _fallback_ucm8_analysis(self, profile: dict) -> dict:
        """AI 不可用时的 UCM-8 兜底分析"""
        dimensions = profile.get("dimensions", {})
        dim_insights = []
        core_traits = []
        growth_areas = []

        # 每个模块的洞察模板
        insight_templates = {
            "work_cognition_action": [
                (80, "你在工作中有清晰的认知和行动模式，效率很高"),
                (50, "你在思考和行动之间有自己的平衡节奏"),
                (20, "你更倾向于深思熟虑，不急于做决定"),
            ],
            "energy_emotion_cognitive": [
                (80, "你的能量水平很高，能长时间保持专注和热情"),
                (50, "你了解自己的能量节奏，懂得张弛有度"),
                (20, "你对能量和情绪的变化很敏感，需要更多恢复时间"),
            ],
            "time_environment_preference": [
                (80, "你有稳定的作息和环境偏好，节奏很有规律"),
                (50, "你能适应不同的时间安排和工作环境"),
                (20, "你喜欢灵活自由的节奏，不喜欢被束缚"),
            ],
            "real_work_style": [
                (80, "你有非常鲜明的工作风格，在团队中角色很清晰"),
                (50, "你的工作方式比较均衡，能适应不同场景"),
                (20, "你还在探索最适合自己的工作方式"),
            ],
        }

        for dim_id, dim_data in dimensions.items():
            score = dim_data.get("overallScore", 50)
            name = dim_data.get("name", dim_id)
            templates = insight_templates.get(dim_id, [])
            insight = "这是你独特的一部分"
            for threshold, text in templates:
                if score >= threshold:
                    insight = text
                    break
            if not templates and score < 20:
                insight = templates[-1][1] if templates else insight
            dim_insights.append({
                "id": dim_id,
                "name": name,
                "score": round(score),
                "insight": insight,
            })

        # 找出最高分和最低分的维度作为核心特质
        sorted_dims = sorted(dimensions.items(),
                             key=lambda x: x[1].get("overallScore", 50),
                             reverse=True)
        if sorted_dims:
            top_dim = sorted_dims[0]
            core_traits.append(f"在{top_dim[1].get('name', '')}方面有鲜明的特点")
            if len(sorted_dims) > 1:
                second_dim = sorted_dims[1]
                core_traits.append(f"{second_dim[1].get('name', '')}是你的优势领域")
            core_traits.append("有自己独特的认知和行为模式")

        # 成长方向
        low_dims = sorted_dims[-2:] if len(sorted_dims) >= 2 else sorted_dims
        for dim_id, dim_data in low_dims:
            name = dim_data.get("name", dim_id)
            growth_areas.append(f"可以探索{name}方面更多的可能性")

        return {
            "greeting": "很高兴认识你。我认真看了你的回答，每一个维度都是你独特的一部分。",
            "dimensions": dim_insights,
            "core_traits": core_traits,
            "interaction_style": "我会用你觉得舒服的方式和你互动，慢慢了解你的节奏。",
            "growth_areas": growth_areas[:2],
            "closing": "期待和你一起，在这段旅程中慢慢探索更多可能。",
        }

    # ============================================================
    # UCM-8 AI 追问机制
    # ============================================================

    def generate_ucm8_followup(self, draft: dict, count: int = 5,
                                round_num: int = 1,
                                prev_followup_answers: list = None,
                                open_ended_answer: str = "") -> dict:
        """
        根据 UCM-8 问卷答案生成 AI 追问问题。

        基于用户已填写的40题基础问卷，AI 智能发现认知盲区，
        生成个性化的深度追问问题，进一步完善用户画像。

        Args:
            draft: UCM-8 草稿，包含 answers 字典
            count: 生成问题数量
            round_num: 追问轮次（1=第一轮，2=第二轮...）
            prev_followup_answers: 前几轮追问的答案
            open_ended_answer: 开放性问题的回答（用户对工作的描述）

        Returns:
            {"questions": [{id, dimension, question, options, maxSelection, reason}]}
        """
        # 构建 UCM-8 答案摘要
        answer_summary = self._summarize_ucm8_draft(draft)

        # 构建前轮追问答案摘要
        prev_summary = ""
        if prev_followup_answers and len(prev_followup_answers) > 0:
            prev_lines = []
            for fa in prev_followup_answers:
                dim = fa.get("dimension", "")
                q = fa.get("question", "")
                selected = fa.get("selected", [])
                if isinstance(selected, list):
                    sel_text = ", ".join(selected)
                else:
                    sel_text = str(selected)
                prev_lines.append(f"  - [{dim}] {q} -> 用户选了: {sel_text}")
            prev_summary = "\n## 用户在前一轮追问中的回答\n" + "\n".join(prev_lines)

        # 根据轮次调整 prompt 深度
        if round_num == 1:
            round_instruction = (
                '这是第 1 轮追问。用户刚完成30题基础问卷。\n'
                '请覆盖不同的认知模块，每个模块一个问题。\n'
                '问题要口语化、温暖、不评判，像朋友第一次深入聊天。\n'
                '每个问题要有洞察力——不是表面问卷式的"你喜欢什么"，\n'
                '而是挖掘行为背后的动机、恐惧、能量来源和真实偏好。'
            )
        elif round_num == 2:
            round_instruction = (
                '这是第 2 轮追问。用户已经回答了第 1 轮的问题。\n'
                '请基于用户在第 1 轮的回答，问更深层的问题——\n'
                '挖掘矛盾点、盲区、隐藏假设和深层动机。\n'
                '问题要有挑战性但温暖，让用户感到被真正看见。'
            )
        else:
            round_instruction = (
                f'这是第 {round_num} 轮追问。用户已经回答了多轮问题。\n'
                '请综合所有已知信息，问最关键的洞察性问题——\n'
                '那些能揭示用户核心驱动力、恐惧和价值观的问题。'
            )

        system_prompt = (
            '你是「伴伴」，一个温暖的认知陪伴助手。用户正在完成 UCM-8 工作画像问卷。\n'
            '你的任务：根据用户已经填写的30题基础问卷答案，发现你想进一步了解的方面，'
            f'生成 {count} 个追问问题。\n\n'
            '## UCM-8 四大工作画像模块\n'
            '- work_cognition_action: 工作认知与行动模式（怎么思考问题、怎么推动工作、什么驱动你持续投入）\n'
            '- energy_emotion_cognitive: 能量情绪与认知风格（能量从哪来、怎么消耗、如何应对压力和不确定性）\n'
            '- time_environment_preference: 时间节奏与环境偏好（作息节律、时间安排偏好、工作环境和协作方式）\n'
            '- real_work_style: 真实工作风格画像（产出风格、规划习惯、工作节奏、团队角色、核心价值观）\n\n'
            f'{round_instruction}\n\n'
            '## 规则（必须严格遵守）\n'
            '1. 只问用户基础问卷中尚未深入的模块或角度\n'
            '2. 问题要口语化、温暖、不评判，像朋友聊天\n'
            '3. 每个问题提供 3-6 个选项，选项要具体、有区分度\n'
            '4. maxSelection=1 是单选，2-3 是多选\n'
            '5. reason 字段让用户理解你为什么好奇这个（10-30字）\n'
            '6. 不要问敏感或隐私问题\n'
            '7. 问题要有随机性，每次生成的角度不同\n'
            '8. 5 个问题尽量覆盖不同的模块\n'
            '9. 选项不要只列"好"的方面，也要包含"不太理想但真实"的选项\n\n'
            '## 输出格式（严格 JSON）\n'
            '{"questions": [{"id": "f1", "dimension": "work_cognition_action", '
            '"question": "你一般在什么状态下工作效率最高？", '
            '"options": ["有明确的计划和目标时", "临近截止日压力大时", "做自己感兴趣的事时", "环境安静没人打扰时"], '
            '"maxSelection": 1, "reason": "了解你的高效状态，帮你安排重要任务"}]}\n\n'
            '注意：请只返回合法的JSON对象，不要包含任何其他文字。'
        )

        # 构建开放性问题答案摘要
        open_ended_summary = ""
        if open_ended_answer and open_ended_answer.strip():
            open_ended_summary = (
                "\n## 用户对开放性问题的回答\n"
                "问题：简单阐述一下你的工作和主要内容，按照你的理解。\n"
                f"用户回答：{open_ended_answer.strip()}\n"
            )

        user_content = (
            f"## 用户已填写的40题问卷摘要\n{answer_summary}\n"
            f"{prev_summary}\n"
            f"{open_ended_summary}\n"
            f"请生成 {count} 个你想追问的问题（第 {round_num} 轮）："
        )

        result = self._call_api(system_prompt, user_content,
                                temperature=0.9, max_tokens=2000)

        # 验证和清理问题格式
        if "error" not in result:
            questions = result.get("questions", [])
            valid_dims = {
                "work_cognition_action", "energy_emotion_cognitive",
                "time_environment_preference", "real_work_style",
            }
            clean_qs = []
            seen_dims = set()
            for i, q in enumerate(questions):
                dim = q.get("dimension", "")
                # 统一 options 格式为 [{value, label}]
                raw_options = q.get("options", [])
                clean_options = []
                for j, opt in enumerate(raw_options):
                    if isinstance(opt, dict):
                        clean_options.append({
                            "value": opt.get("value", opt.get("id", f"opt{j+1}")),
                            "label": opt.get("label", opt.get("text", str(opt)))[:50],
                        })
                    else:
                        clean_options.append({
                            "value": f"opt{j+1}",
                            "label": str(opt)[:50],
                        })
                max_sel = max(1, min(3, int(q.get("maxSelection", 1))))
                # 确定问题类型
                if q.get("scaleLabels") or (clean_options and clean_options[0].get("scale")):
                    q_type = "scale"
                elif max_sel > 1:
                    q_type = "multiple"
                else:
                    q_type = "single"
                clean_q = {
                    "id": q.get("id", f"f{i+1}"),
                    "dimension": dim if dim in valid_dims else "work_cognition_action",
                    "type": q.get("type", q_type),
                    "question": q.get("question", "")[:80],
                    "options": clean_options[:6],
                    "maxSelection": max_sel,
                    "maxSelections": max_sel,
                    "reason": q.get("reason", "")[:60],
                }
                if len(clean_q["options"]) < 3:
                    continue
                if clean_q["dimension"] in seen_dims:
                    continue
                seen_dims.add(clean_q["dimension"])
                clean_qs.append(clean_q)
                if len(clean_qs) >= count:
                    break

            # 如果 AI 生成的问题不足，补充默认问题
            default_qs = self._get_default_ucm8_followup()
            for dq in default_qs:
                if len(clean_qs) >= count:
                    break
                if dq["dimension"] not in seen_dims:
                    clean_qs.append(dq)
                    seen_dims.add(dq["dimension"])

            result["questions"] = clean_qs[:count]

        return result

    def _summarize_ucm8_draft(self, draft: dict) -> str:
        """将 UCM-8 草稿摘要为 AI 可读的文本"""
        lines = []
        answers = draft.get("answers", {})

        if not answers:
            return "（用户尚未填写任何问题）"

        # 按维度分组统计
        from onboarding_model import UCM8_DIMENSIONS, UCM8_QUESTIONS

        dim_questions = {}
        for q in UCM8_QUESTIONS:
            dim_id = q["dimension"]
            if dim_id not in dim_questions:
                dim_questions[dim_id] = []
            dim_questions[dim_id].append(q)

        for dim in UCM8_DIMENSIONS:
            dim_id = dim["id"]
            dim_label = dim.get("label", dim_id)
            qs = dim_questions.get(dim_id, [])
            answered = [q for q in qs if q["id"] in answers]
            if not answered:
                continue

            lines.append(f"\n### {dim_label}（{len(answered)}/{len(qs)}题已答）")
            for q in answered:
                answer = answers[q["id"]]
                # 找到选中的选项文本
                option_texts = []
                if isinstance(answer, list):
                    for opt_id in answer:
                        opt = next((o for o in q["options"] if o["id"] == opt_id), None)
                        if opt:
                            option_texts.append(opt.get("text", opt_id))
                else:
                    opt = next((o for o in q["options"] if o["id"] == answer), None)
                    if opt:
                        option_texts.append(opt.get("text", answer))

                answer_text = "、".join(option_texts) if option_texts else str(answer)
                lines.append(f"- {q['question']}: {answer_text}")

        return "\n".join(lines)

    def _get_default_ucm8_followup(self) -> list:
        """UCM-8 默认追问问题（AI不可用时的兜底）"""
        return [
            {
                "id": "f1",
                "dimension": "work_cognition_action",
                "question": "如果完全没有外部压力，你最想投入时间做什么？",
                "options": [
                    {"value": "a", "label": "学习新技能，提升自己"},
                    {"value": "b", "label": "创作点什么，比如写作/画画/编程"},
                    {"value": "c", "label": "和重要的人在一起"},
                    {"value": "d", "label": "躺着休息，什么都不做"},
                    {"value": "e", "label": "探索新地方，体验新事物"},
                ],
                "maxSelection": 1,
                "maxSelections": 1,
                "type": "single",
                "reason": "想了解你内心最深处的动力来源",
            },
            {
                "id": "f2",
                "dimension": "energy_emotion_cognitive",
                "question": "情绪低落时，什么最能让你好起来？",
                "options": [
                    {"value": "a", "label": "一个人安静待着"},
                    {"value": "b", "label": "和信任的人聊聊"},
                    {"value": "c", "label": "运动或出门走走"},
                    {"value": "d", "label": "看剧、玩游戏等娱乐"},
                    {"value": "e", "label": "专注做一件有成就感的事"},
                ],
                "maxSelection": 1,
                "maxSelections": 1,
                "type": "single",
                "reason": "了解你的情绪调节方式，更好地陪伴你",
            },
            {
                "id": "f3",
                "dimension": "real_work_style",
                "question": "你觉得自己最容易在什么环节卡住？",
                "options": [
                    {"value": "a", "label": "开始——不知道第一步怎么迈"},
                    {"value": "b", "label": "中途——做到一半就不想继续了"},
                    {"value": "c", "label": "收尾——差最后一点但总是拖着"},
                    {"value": "d", "label": "选择——太多选项反而不知道做什么"},
                    {"value": "e", "label": "坚持——做一段时间就没动力了"},
                ],
                "maxSelection": 1,
                "maxSelections": 1,
                "type": "single",
                "reason": "找到你的卡点，才能更好地帮你推进",
            },
            {
                "id": "f4",
                "dimension": "energy_emotion_cognitive",
                "question": "哪种情况会让你瞬间觉得精力耗尽？",
                "options": [
                    {"value": "a", "label": "长时间和人打交道"},
                    {"value": "b", "label": "做重复机械的工作"},
                    {"value": "c", "label": "目标不明确，不知道在忙什么"},
                    {"value": "d", "label": "被频繁打断，没法专注"},
                    {"value": "e", "label": "压力太大，deadline 太近"},
                ],
                "maxSelection": 1,
                "maxSelections": 1,
                "type": "single",
                "reason": "了解你的能量消耗点，帮你合理安排节奏",
            },
            {
                "id": "f5",
                "dimension": "work_cognition_action",
                "question": "想一个工作问题时，你脑子里通常是？",
                "options": [
                    {"value": "a", "label": "有条理的文字和逻辑"},
                    {"value": "b", "label": "画面、图像或空间感"},
                    {"value": "c", "label": "很多想法跳来跳去"},
                    {"value": "d", "label": "一种模糊的感觉或直觉"},
                    {"value": "e", "label": "直接在想怎么做，边做边想"},
                ],
                "maxSelection": 1,
                "maxSelections": 1,
                "type": "single",
                "reason": "了解你的思维方式，调整和你沟通的方式",
            },
        ]

    # ============================================================
    # 6. generate_plan -- L2-A 分析 -> L1 人格 流水线
    # ============================================================
    def generate_plan(self, event_nodes: list, time_blocks: list,
                      user_model: dict) -> dict:
        """
        生成今日执行路径。

        归属：L2-A 分析 -> L1 人格 流水线
        流程：先 L2-A 计算可用时间和事件优先级，再 L1 根据用户能量节奏安排。

        返回 JSON：
          {"plan_blocks": [{"event_id": "...", "start_time": "HH:MM",
            "end_time": "HH:MM", "title": "...", "reason": "...", "status": "planned"}],
           "notes": "..."}
        """
        # ---- 第一步：L2-A 分析模型 -- 计算可用时间和事件优先级 ----
        l2a_system_prompt = (
            '你是一个时间分析器。你不认识用户，只做客观数据分析。\n'
            '你的任务：根据可用时间块和事件列表，计算每个事件的优先级和预估时长，'
            '并输出排程建议（不含任何个性化考量）。\n\n'
            '## 优先级规则\n'
            '1. 有明确截止时间的事件 -> 最高优先级\n'
            '2. planned 类型事件 -> 高优先级\n'
            '3. goal 类型事件 -> 中优先级\n'
            '4. habit_candidate 类型事件 -> 中低优先级\n'
            '5. floating 类型事件 -> 低优先级（可能需要用户确认）\n\n'
            '## 输出格式\n'
            '{"ranked_events": [{"event_id": "...", "title": "...", '
            '"priority": "high|medium|low", "estimated_minutes": 数字, '
            '"reason": "优先级依据"}], '
            '"available_minutes": 总可用分钟数, '
            '"notes": "客观分析备注"}'
        )
        l2a_user_content = (
            f"## 可用时间块\n{json.dumps(time_blocks, ensure_ascii=False, indent=2)}\n\n"
            f"## 事件列表\n{json.dumps(event_nodes, ensure_ascii=False, indent=2)}\n\n"
            f"请分析优先级和排程建议："
        )
        l2a_result = self._call_api(l2a_system_prompt, l2a_user_content,
                                    temperature=TEMP_L2A_ANALYSIS, max_tokens=800)

        # 如果 L2-A 失败，直接返回错误
        if "error" in l2a_result:
            return {"error": "l2a_analysis_failed", "detail": l2a_result}

        # ---- 第二步：L1 人格模型 -- 根据用户能量节奏安排 ----
        l1_system_prompt = (
            '你是「伴伴」的人格核心。你拥有对用户的长期理解。\n'
            '你的任务：根据 L2-A 的排程建议和用户的能量节奏，生成今天的执行计划。\n\n'
            '## 安排原则\n'
            '1. 根据用户的能量节奏安排任务。高能量时段排高耗能任务（如深度工作），'
            '低能量时段排低耗能任务（如整理、阅读）。\n'
            '2. 夜间低能量时段不排高耗能任务。如果用户能量在晚上下降，'
            '晚上只安排轻松的事或不安排。\n'
            '3. 不排满，留白。每天至少留 1-2 个空档作为缓冲，不要把时间块填满。\n'
            '4. 每个安排必须有 reason，说明为什么放在这个时间。\n'
            '5. 如果事件总数超过可用时间，优先安排高优先级事件，低优先级的留到明天。\n'
            '6. 考虑用户的习惯和偏好（如用户喜欢上午运动，就把运动安排在上午）。\n'
            '7. 不要命令用户，这是建议而非强制。用「建议」「可以试试」等措辞。\n\n'
            '## 输出格式\n'
            '{"plan_blocks": [{"event_id": "事件ID（可为空）", '
            '"start_time": "HH:MM", "end_time": "HH:MM", '
            '"title": "任务标题", "reason": "安排在这个时间的原因", '
            '"status": "planned"}], '
            '"notes": "今日计划备注，可以包含对用户的温馨提示"}'
        )
        l1_user_content = (
            f"## 用户模型（能量节奏、偏好等）\n"
            f"{json.dumps(user_model, ensure_ascii=False, indent=2)}\n\n"
            f"## L2-A 排程建议\n"
            f"{json.dumps(l2a_result, ensure_ascii=False, indent=2)}\n\n"
            f"## 可用时间块\n"
            f"{json.dumps(time_blocks, ensure_ascii=False, indent=2)}\n\n"
            f"请根据用户能量节奏生成今日执行计划："
        )
        l1_result = self._call_api(l1_system_prompt, l1_user_content,
                                   temperature=TEMP_L1_PERSONALITY, max_tokens=1200)

        # 如果 L1 成功，附加 L2-A 分析结果供参考
        if "error" not in l1_result:
            l1_result["_l2a_analysis"] = l2a_result
        return l1_result

    # ============================================================
    # 7. generate_morning_brief -- L1 人格模型
    # ============================================================
    def generate_morning_brief(self, last_review: dict, today_plan: list,
                               user_model: dict, comm_profile: dict) -> dict:
        """
        早间启动。

        归属：L1 人格模型（temperature=0.8）
        职责：生成一句温暖的启动语，体现「我记得你昨天」。

        返回 JSON：
          {"message": "...", "tone": "...", "highlight": "今天最值得注意的一件事"}
        """
        system_prompt = (
            '你是「伴伴」。现在是早晨，用户刚醒来或刚开始新的一天。\n'
            '你的任务：生成一句温暖的启动语，开启今天的陪伴。\n\n'
            '## 原则\n'
            '1. 启动语不超过50字。简洁、温暖、有记忆感。\n'
            '2. 体现「我记得你昨天」。如果昨晚有复盘，自然地提一句昨天的内容，但不要像报告。\n'
            '3. 不命令。不说「你应该」「快起来」「赶紧开始」。用分享、关心的语气。\n'
            '4. 如果用户昨晚熬夜 -> 关心而非说教。'
            '（例：「昨晚睡得有点晚，今天慢慢来就好」）\n'
            '5. 使用用户的沟通偏好（comm_profile）调整语气。'
            '如果用户喜欢简洁，就少说；喜欢温暖，就多说一句。\n'
            '6. highlight 是今天最值得注意的一件事（来自 today_plan），一句话点出即可，不要展开。\n'
            '7. tone 描述你说话的语气基调（如「温柔」「轻松」「关切」）。\n\n'
            '## 输出格式\n'
            '{"message": "启动语（不超过50字）", '
            '"tone": "语气基调", '
            '"highlight": "今天最值得注意的一件事"}'
        )
        user_content = (
            f"## 昨晚复盘\n{json.dumps(last_review, ensure_ascii=False, indent=2)}\n\n"
            f"## 今日计划\n{json.dumps(today_plan, ensure_ascii=False, indent=2)}\n\n"
            f"## 用户模型\n{json.dumps(user_model, ensure_ascii=False, indent=2)}\n\n"
            f"## 沟通偏好\n{json.dumps(comm_profile, ensure_ascii=False, indent=2)}\n\n"
            f"请生成今日早间启动语："
        )
        return self._call_api(system_prompt, user_content,
                              temperature=TEMP_L1_PERSONALITY, max_tokens=400)

    # ============================================================
    # 8. generate_evening_review -- L2-A 分析 -> L1 人格 流水线
    # ============================================================
    def generate_evening_review(self, activity_logs: list, plan_blocks: list,
                                feedbacks: list, user_model: dict,
                                comm_profile: dict) -> dict:
        """
        晚间复盘。

        归属：L2-A 分析 -> L1 人格 流水线
        流程：L2-A 先总结今日行为数据和完成度，L1 再生成温柔复盘。

        返回 JSON：
          {"feeling": "...", "pattern": "...", "encouragement": "...",
           "completion_rate": 0.0, "data_summary": "..."}
        """
        # ---- 第一步：L2-A 分析模型 -- 总结今日行为数据和完成度 ----
        l2a_system_prompt = (
            '你是一个行为数据分析师。你不认识用户，只做客观数据总结。\n'
            '你的任务：根据今日活动日志和计划，计算完成度并总结行为数据。\n\n'
            '## 分析要求\n'
            '1. 计算计划完成率（completion_rate）：已完成计划数 / 总计划数，0.0-1.0。\n'
            '2. 统计各类型活动时长分布（工作、休闲、运动等）。\n'
            '3. 客观记录行为模式（如「上午主要在工作，下午切换到娱乐」），不做价值判断。\n'
            '4. data_summary 是纯数据总结，不包含任何情感色彩或评价。\n'
            '5. 如果有用户反馈，客观记录反馈内容。\n\n'
            '## 输出格式\n'
            '{"completion_rate": 0.0-1.0, '
            '"activity_distribution": {"工作": 分钟数, "休闲": 分钟数}, '
            '"behavior_observations": ["客观观察1", "客观观察2"], '
            '"data_summary": "纯数据总结"}'
        )
        l2a_user_content = (
            f"## 今日活动日志\n{json.dumps(activity_logs, ensure_ascii=False, indent=2)}\n\n"
            f"## 今日计划块\n{json.dumps(plan_blocks, ensure_ascii=False, indent=2)}\n\n"
            f"## 用户反馈\n{json.dumps(feedbacks, ensure_ascii=False, indent=2)}\n\n"
            f"请总结今日行为数据和完成度："
        )
        l2a_result = self._call_api(l2a_system_prompt, l2a_user_content,
                                    temperature=TEMP_L2A_ANALYSIS, max_tokens=800)

        # 如果 L2-A 失败，直接返回错误
        if "error" in l2a_result:
            return {"error": "l2a_analysis_failed", "detail": l2a_result}

        # ---- 第二步：L1 人格模型 -- 生成温柔复盘 ----
        l1_system_prompt = (
            '你是「伴伴」。现在是晚上，一天即将结束。\n'
            '你的任务：根据 L2-A 的行为数据总结，生成一段温柔的晚间复盘。\n\n'
            '## 原则\n'
            '1. 不评判「没做好」。用户没完成计划时，不说「你没完成」，'
            '而说「今天有些事还没来得及」。\n'
            '2. 发现模式而非批评。如果连续几天有相似模式（如下午容易分心），'
            '温和指出，像朋友发现规律一样。\n'
            '3. 复盘必须有数据支撑。引用 L2-A 的具体数据（如「今天专注了2小时」），不要空泛。\n'
            '4. 使用用户的沟通偏好（comm_profile）调整语气和篇幅。\n'
            '5. 包含三个部分：\n'
            '   - feeling：温暖的感受，你对用户今天的一天有什么感觉（不超过40字）\n'
            '   - pattern：值得注意的模式，基于数据发现的规律（不超过50字）\n'
            '   - encouragement：鼓励的话，不是鸡汤，是真诚的、基于今天表现的（不超过40字）\n'
            '6. completion_rate 直接使用 L2-A 计算的值。\n'
            '7. data_summary 直接使用 L2-A 的数据总结。\n\n'
            '## 输出格式\n'
            '{"feeling": "温暖感受", '
            '"pattern": "值得注意的模式", '
            '"encouragement": "鼓励的话", '
            '"completion_rate": 0.0-1.0, '
            '"data_summary": "L2-A的数据总结"}'
        )
        l1_user_content = (
            f"## L2-A 行为数据总结\n"
            f"{json.dumps(l2a_result, ensure_ascii=False, indent=2)}\n\n"
            f"## 用户模型\n{json.dumps(user_model, ensure_ascii=False, indent=2)}\n\n"
            f"## 沟通偏好\n{json.dumps(comm_profile, ensure_ascii=False, indent=2)}\n\n"
            f"请生成温柔的晚间复盘："
        )
        l1_result = self._call_api(l1_system_prompt, l1_user_content,
                                   temperature=TEMP_L1_PERSONALITY, max_tokens=800)

        # 如果 L1 成功，附加 L2-A 分析结果供参考
        if "error" not in l1_result:
            l1_result["_l2a_analysis"] = l2a_result
        return l1_result

    # ============================================================
    # 9. regulate_communication -- L1 人格模型
    # ============================================================
    def regulate_communication(self, user_state: dict, comm_profile: dict,
                               task_importance: float,
                               last_speak_minutes: float) -> dict:
        """
        调节提醒。

        归属：L1 人格模型（temperature=0.8）
        职责：判断现在该不该说话，怎么说。

        提醒强度 0-4 级：
          0 = 不说话
          1 = 极轻（静默陪伴，只在界面显示）
          2 = 轻提醒（一句话，不催促）
          3 = 正常提醒（明确提及任务）
          4 = 强提醒（重要且紧急）

        返回 JSON：
          {"should_intervene": bool, "reminder_level": 0-4,
           "channel": "...", "tone": "...", "message": "...",
           "requires_user_response": bool}
        """
        system_prompt = (
            '你是「伴伴」。你的任务：判断现在该不该跟用户说话，以及该怎么说。\n\n'
            '## 提醒强度等级（0-4）\n'
            '0 = 不说话。沉默也是陪伴。\n'
            '1 = 极轻。只在界面上静默显示，不弹窗、不发声。\n'
            '2 = 轻提醒。一句话，不催促，像朋友顺嘴提一句。\n'
            '3 = 正常提醒。明确提及要做的事，但不施压。\n'
            '4 = 强提醒。重要且紧急时使用，语气坚定但不命令。\n\n'
            '## 判断规则\n'
            '1. 距离上次说话不到15分钟（last_speak_minutes < 15）-> 不说话（reminder_level=0）。'
            '不要频繁打扰用户。\n'
            '2. 用户正在全屏（user_state.is_fullscreen=true）-> 不打断（reminder_level<=1）。\n'
            '3. 最近用户对提醒的接受率低（user_state.recent_accept_rate < 0.3）-> 降级提醒，'
            '不要连续打扰。宁可不说。\n'
            '4. 任务重要性高（task_importance > 0.7）且时间紧迫 -> 可以提升到3-4级。\n'
            '5. 任务重要性低（task_importance < 0.3）-> 最多2级。\n'
            '6. 用户当前状态不适合打扰（如正在专注工作、正在通话）-> 不说话或只1级。\n'
            '7. 永远不说「你应该」「你必须」「赶紧」「快」。'
            '用「要不要试试」「有个事想跟你说」「如果你方便的话」等措辞。\n'
            '8. channel 是提醒渠道建议（如「silent」静默、「toast」弹窗、「voice」语音、「banner」横幅）。\n'
            '9. tone 是语气描述（如「温柔」「轻松」「关切」「平静」）。\n'
            '10. requires_user_response 表示是否需要用户回应（true=需要确认/选择，false=仅告知）。\n'
            '11. 如果决定不说话（reminder_level=0），message 可以为空字符串。\n\n'
            '## 输出格式\n'
            '{"should_intervene": true/false, '
            '"reminder_level": 0-4, '
            '"channel": "silent|toast|voice|banner", '
            '"tone": "语气描述", '
            '"message": "要说的话（可为空）", '
            '"requires_user_response": true/false}'
        )
        user_content = (
            f"## 用户当前状态\n{json.dumps(user_state, ensure_ascii=False, indent=2)}\n\n"
            f"## 沟通偏好\n{json.dumps(comm_profile, ensure_ascii=False, indent=2)}\n\n"
            f"## 任务重要性（0.0-1.0）\n{task_importance}\n\n"
            f"## 距上次说话分钟数\n{last_speak_minutes}\n\n"
            f"请判断现在该不该说话，以及怎么说："
        )
        return self._call_api(system_prompt, user_content,
                              temperature=TEMP_L1_PERSONALITY, max_tokens=500)

    # ============================================================
    # 10. 画布节点分析器 classify_canvas（L3 分类 → L2-A 分析）
    #    严格按照设计文档第5章实现
    # ============================================================
    def classify_canvas(self, input_text: str, source: str = "chat",
                        existing_nodes: list = None,
                        surrounding_messages: list = None,
                        work_profile: dict = None,
                        current_plan_summary: str = None) -> dict:
        """
        画布节点分析器 — 完全匹配设计文档第5章

        归属：L3 干累活模型（分类） → L2-A 分析模型（关系判断+置信度）
        输出 Schema 严格遵循 5.3 NodeClassificationResult

        Args:
            input_text: 用户原始输入
            source: 来源 onboarding|night_review|chat|manual|ai_suggestion
            existing_nodes: 画布已有节点 [{id, title, kind, commitment}]
            surrounding_messages: 上下文消息 [{role, content}]
            work_profile: 工作画像 {industry, specializations, tools, commonTasks}

        Returns:
            NodeClassificationResult {
                shouldCreateNode: bool,
                candidates: [{tempId, title, summary, kind, commitment,
                              phase, evidence, originalText, confidence,
                              estimatedMinutes, frequency}],
                relations: [{sourceTempId, targetNodeId, relation,
                             confidence, reason}],
                clarification: {required, question, options}
            }
        """
        # 构建 Context Pack（5.2 CanvasClassificationContext）
        context_pack = {
            "source": source,
            "originalText": input_text,
            "selectedExistingNodes": existing_nodes[:15] if existing_nodes else [],
            "locale": "zh-CN",
        }
        if surrounding_messages:
            context_pack["surroundingMessages"] = surrounding_messages[-6:]
        if work_profile:
            context_pack["workProfile"] = work_profile
        if current_plan_summary:
            context_pack["currentPlanSummary"] = current_plan_summary

        # 系统提示词 — 完全使用设计文档第5章的内容
        system_prompt = (
            '你是"伴伴"系统的事件节点分析器。你的任务是从用户输入和上下文中判断：'
            '是否值得生成候选节点、节点属于什么类型、用户对此有多强的意愿、'
            '当前处于什么阶段、它与已有节点有什么关系。\n\n'
            '你不是关键词提取器，也不是替用户做决定的规划师。\n\n'
            '必须遵守：\n'
            '1. 用户提到一件事，不代表用户想做它。\n'
            '2. 用户表示感兴趣，不代表已经形成目标。\n'
            '3. "我想做"通常只能判断为 record，除非存在明确结果、完成标准或时间范围。\n'
            '4. 只有动作、对象和完成边界清楚时，才判断为 action。\n'
            '5. 有明确结束状态的多步骤工作才判断为 project。\n'
            '6. 不要替用户提高 commitment。\n'
            '7. AI 生成的所有候选默认 confirmation_status=pending，不允许自动确认。\n'
            '8. 类型置信度低于 0.75、承诺不明确或存在多个合理解释时，返回一个简短澄清问题。\n'
            '9. 默认最多提取 3 个核心候选节点，避免将一句话拆成大量碎片。\n'
            '10. 必须保留 originalText，并说明 evidence。\n'
            '11. 必须检查是否与已有节点重复；重复时优先建议 merge，而不是新建。\n'
            '12. AI 建议的关系必须包含 confidence，不能直接修改正式关系。\n'
            '13. 一次性事件（如"明早早起"）不是 habit，应判断为 action。\n'
            '14. 缺少截止时间、上级项目、完成条件等关键信息时，在 clarification 中标明缺失项。\n\n'
            '节点类型（6 类）：\n'
            '- domain：领域（工作/健康/学习/生活），容器型，无完成条件。\n'
            '- project：有明确结束状态的一组行动。\n'
            '- outcome：项目需要完成的结果或里程碑。\n'
            '- action：一次可执行、可估时、可判断完成的具体任务。\n'
            '- habit：按频率或触发条件重复发生的行为。\n'
            '- record：想法、观察、信息，暂时不能行动的内容。\n\n'
            '承诺程度：\n'
            '- observed：只被提到。\n'
            '- interested：用户表现出兴趣。\n'
            '- intended：用户明确说想做。\n'
            '- committed：用户确认要推进。\n'
            '- scheduled：已经安排。\n'
            '- active：正在实际执行。\n\n'
            '关系（6 种，有方向 source→target）：\n'
            '- belongs_to：A 属于 B（A 是 B 的子项）。\n'
            '- decomposes_to：A 拆解为 B（B 是 A 的子任务）。\n'
            '- depends_on：A 依赖 B（B 必须先完成）。\n'
            '- supports：A 支持 B（A 有助于 B）。\n'
            '- conflicts_with：A 冲突于 B（互斥）。\n'
            '- duplicates：A 重复为 B（同一件事）。\n\n'
            '## Few-shot 示例\n\n'
            '示例1输入："这个网站的滚动效果挺有意思。"\n'
            '策略：若只是评论且无保存价值，shouldCreateNode=false。'
            '若正在收集交互参考，可创建 record 候选。\n\n'
            '示例2输入："我也想做一个个人网站。"\n'
            '输出：{"shouldCreateNode":true,"candidates":[{"tempId":"c1","title":"做一个个人网站",'
            '"kind":"record","commitment":"intended","confirmationStatus":"pending","confidence":0.71,'
            '"originalText":"我也想做一个个人网站。","evidence":"用户表达想做，但没有完成标准、时间范围或下一步行动"}],'
            '"relations":[],"clarification":{"required":true,"question":"这件事你希望什么时候推进？",'
            '"options":["先记录就好","确定一个时间范围","拆成具体行动"]}}\n\n'
            '示例3输入："我打算在月底前做完个人网站首页。"\n'
            '输出：{"shouldCreateNode":true,"candidates":[{"tempId":"c1","title":"月底前完成个人网站首页",'
            '"kind":"project","commitment":"committed","confirmationStatus":"pending","confidence":0.84,'
            '"targetResult":"首页完整可访问","originalText":"我打算在月底前做完个人网站首页。",'
            '"evidence":"有明确结果和时间范围，属于多步骤项目"}],'
            '"relations":[],"clarification":{"required":false}}\n\n'
            '示例4输入："今晚先画首页的信息架构。"\n'
            '输出：{"shouldCreateNode":true,"candidates":[{"tempId":"c1","title":"画首页信息架构",'
            '"kind":"action","commitment":"scheduled","confirmationStatus":"pending","confidence":0.93,'
            '"estimatedMinutes":45,"originalText":"今晚先画首页的信息架构。","evidence":"有明确动作、对象和时间"}],'
            '"relations":[],"clarification":{"required":false}}\n\n'
            '只输出符合 JSON Schema 的结构化结果。\n'
            '输出格式：\n'
            '{"shouldCreateNode":bool,"candidates":[{"tempId":"c1","title":"","summary":"",'
            '"kind":"domain|project|outcome|action|habit|record",'
            '"commitment":"observed|interested|intended|committed|scheduled|active",'
            '"confirmationStatus":"pending","evidence":"","originalText":"","confidence":0.0,'
            '"estimatedMinutes":null,"frequency":null,"targetResult":null}],"relations":[{"sourceTempId":"c1",'
            '"targetNodeId":"","relation":"belongs_to|decomposes_to|depends_on|supports|'
            'conflicts_with|duplicates","confidence":0.0,"reason":""}],'
            '"clarification":{"required":bool,"question":"","options":[],"missingFields":[]}}'
        )

        user_content = (
            f"## Context Pack\n{json.dumps(context_pack, ensure_ascii=False, indent=2)}\n\n"
            f"请分析并返回JSON："
        )
        result = self._call_api(system_prompt, user_content,
                                temperature=TEMP_L3_STRUCTURE, max_tokens=1500)

        # Schema 验证 + 重试 + 降级（文档21.4）
        # P0 重构：使用 6 类新节点类型 + 旧类型迁移
        _legacy_kind_map = {
            'inspiration': 'record', 'desire': 'record', 'goal': 'project',
            'resource': 'record', 'constraint': 'record',
        }
        valid_kinds = {'domain', 'project', 'outcome', 'action', 'habit', 'record'}
        valid_commitments = {'observed', 'interested', 'intended', 'committed', 'scheduled', 'active'}
        _legacy_relation_map = {'inspired_by': 'supports', 'replaces': 'duplicates'}
        valid_relations = {'belongs_to', 'decomposes_to', 'depends_on', 'supports', 'conflicts_with', 'duplicates'}

        def _validate_and_clean(r):
            """验证并清理AI输出，迁移旧类型"""
            if not isinstance(r, dict) or "error" in r:
                return False
            if "shouldCreateNode" not in r:
                r["shouldCreateNode"] = True
            if "candidates" not in r:
                r["candidates"] = []
            if "relations" not in r:
                r["relations"] = []
            if "clarification" not in r:
                r["clarification"] = {"required": False}
            # 迁移旧节点类型 + 验证 candidates
            cleaned = []
            for c in r["candidates"]:
                if not isinstance(c, dict) or not c.get("title"):
                    continue
                kind = c.get("kind", "record")
                # 迁移旧类型
                if kind in _legacy_kind_map:
                    kind = _legacy_kind_map[kind]
                if kind not in valid_kinds:
                    kind = "record"  # 未知类型降级为 record
                c["kind"] = kind
                # 强制 confirmation_status=pending（AI 无权自动确认）
                c["confirmationStatus"] = "pending"
                if c.get("commitment", "observed") not in valid_commitments:
                    c["commitment"] = "observed"
                cleaned.append(c)
            r["candidates"] = cleaned[:3]  # 最多3个（文档规则9）
            # 迁移旧关系类型
            for rel in r["relations"]:
                rt = rel.get("relation", "supports")
                if rt in _legacy_relation_map:
                    rel["relation"] = _legacy_relation_map[rt]
                if rel.get("relation", "supports") not in valid_relations:
                    rel["relation"] = "supports"
            return True

        if not _validate_and_clean(result):
            # 重试一次
            result = self._call_api(system_prompt, user_content,
                                    temperature=TEMP_L3_STRUCTURE, max_tokens=1500)
            if not _validate_and_clean(result):
                # 降级：返回安全默认值
                return {
                    "shouldCreateNode": True,
                    "candidates": [{
                        "tempId": "fallback_01",
                        "title": input_text[:50],
                        "kind": "record",
                        "commitment": "observed",
                        "confirmationStatus": "pending",
                        "evidence": "AI返回格式异常，已降级为记录类型",
                        "originalText": input_text,
                        "confidence": 0.5,
                    }],
                    "relations": [],
                    "clarification": {"required": False},
                }

        return result

    # ============================================================
    # 11. 节点联想 expand_node（L2-A 分析模型）— 设计文档 13.5
    # ============================================================
    def expand_node(self, node: dict, max_suggestions: int = 5,
                    modes: list = None, existing_nodes: list = None,
                    include_work_profile: bool = False,
                    work_profile: dict = None) -> dict:
        """
        AI 联想：围绕选中节点生成 3-6 个候选泡泡

        归属：L2-A 分析模型（temperature=0.3）
        对应设计文档 13.5 泡泡联想

        Args:
            node: 当前选中节点 {id, title, kind, commitment, description}
            max_suggestions: 最多返回几个建议
            modes: 联想模式 ["related_ideas", "possible_actions", "resources"]
            existing_nodes: 画布已有节点（用于去重）

        Returns:
            {"suggestions": [{"tempId, title, kind, reason, confidence}]}
        """
        modes = modes or ["related_ideas", "possible_actions", "resources"]
        existing_titles = [n.get("title", "") for n in (existing_nodes or [])[:15]]

        system_prompt = (
            '你是伴伴的节点联想模块。用户选中了一个画布节点，你需要围绕它生成联想候选。\n\n'
            '## 规则\n'
            '1. 生成 3-6 个候选，每个都要有独立价值\n'
            '2. 候选类型限于：domain, project, outcome, action, habit, record\n'
            '3. 不要与已有节点重复\n'
            '4. 候选只是建议，不替用户做决定\n'
            '5. reason 要简短说明为什么这样联想\n'
            '6. confidence 反映联想的相关度和合理性\n'
            '7. 所有候选默认 confirmationStatus=pending\n\n'
            f'已有节点：{", ".join(existing_titles) if existing_titles else "无"}\n\n'
            '输出格式：\n'
            '{"suggestions":[{"tempId":"sg_01","title":"","kind":"action",'
            '"reason":"","confidence":0.0,"confirmationStatus":"pending"}]}'
        )
        user_content = (
            f"## 当前节点\n{json.dumps(node, ensure_ascii=False, indent=2)}\n"
            f"## 联想模式\n{json.dumps(modes, ensure_ascii=False)}\n"
            f"## 最多返回\n{max_suggestions}\n"
        )
        if include_work_profile and work_profile:
            user_content += f"## 用户工作画像\n{json.dumps(work_profile, ensure_ascii=False, indent=2)}\n"
        user_content += f"请生成联想候选："
        return self._call_api(system_prompt, user_content,
                              temperature=TEMP_L2A_ANALYSIS, max_tokens=800)

    # ============================================================
    # 12. 节点拆解 decompose_node（L2-A 分析模型）— 设计文档 13.7
    # ============================================================
    def decompose_node(self, node: dict, existing_children: list = None) -> dict:
        """
        AI 拆解：将目标/项目拆解为阶段或行动

        归属：L2-A 分析模型（temperature=0.3）
        对应设计文档 13.7 AI 拆解

        拆解规则：
        - 模糊 → 先澄清（返回 clarification）
        - 目标明确但过大 → 拆出阶段或项目
        - 项目明确 → 拆出 1-3 个下一步
        - 行为已足够具体 → 不继续拆

        Returns:
            {"parentNodeId":"...","proposals":[{"title","kind","relation",'
            '"estimatedMinutes","reason"}],"clarification":{"required":bool,"question":""}}
        """
        system_prompt = (
            '你是伴伴的节点拆解模块。你的任务是把一个目标或项目拆解为更小的可执行单元。\n\n'
            '## 拆解规则\n'
            '1. 模糊节点 → 不拆解，返回 clarification.required=true 和一个问题\n'
            '2. 目标明确但过大 → 拆出阶段或 project\n'
            '3. 项目明确 → 拆出 1-3 个下一步 action\n'
            '4. 行为已足够具体 → 不继续拆，返回空 proposals\n'
            '5. 禁止一次生成几十个动作，最多 5 个\n'
            '6. 每个拆解项都要有 reason\n'
            '7. 拆解项的 relation 固定为 decomposes_to\n\n'
            '输出格式：\n'
            '{"parentNodeId":"","proposals":[{"title":"","kind":"project|action",'
            '"relation":"decomposes_to","estimatedMinutes":null,"reason":""}],'
            '"clarification":{"required":false,"question":""}}'
        )
        user_content = (
            f"## 要拆解的节点\n{json.dumps(node, ensure_ascii=False, indent=2)}\n"
            f"## 已有子节点\n{json.dumps(existing_children or [], ensure_ascii=False)}\n"
            f"请拆解："
        )
        return self._call_api(system_prompt, user_content,
                              temperature=TEMP_L2A_ANALYSIS, max_tokens=800)

    # ============================================================
    # 13. AI 归类建议 suggest_clusters（L2-A 分析模型）— 设计文档 13.8
    # ============================================================
    def suggest_clusters(self, nodes: list) -> dict:
        """
        AI 归类建议：发现可归为一组的节点

        归属：L2-A 分析模型（temperature=0.3）
        对应设计文档 13.8 AI 归类

        只发送未归类节点或用户选中的节点，避免每次分析整个画板。

        Returns:
            {"clusters":[{"title","nodeIds","reason","confidence"}]}
        """
        system_prompt = (
            '你是伴伴的归类建议模块。你的任务是从一组节点中发现可以归为一组的节点集合。\n\n'
            '## 规则\n'
            '1. 只提供建议，不自动改变节点位置和 groupId\n'
            '2. 每个聚类要有合理的 title 和 reason\n'
            '3. confidence 反映聚类的合理性\n'
            '4. 一个节点可以出现在多个聚类中\n'
            '5. 如果没有合理的聚类，返回空数组\n\n'
            '输出格式：\n'
            '{"clusters":[{"title":"","nodeIds":[],"reason":"","confidence":0.0}]}'
        )
        # 只发送最小信息，用短ID节省token
        compact_nodes = [{"id": n.get("id", "")[:8], "title": n.get("title", ""),
                          "kind": n.get("kind", "")} for n in nodes]
        user_content = (
            f"## 未归类节点\n{json.dumps(compact_nodes, ensure_ascii=False, indent=2)}\n"
            f"请建议归类（nodeIds中用短ID即可）："
        )
        return self._call_api(system_prompt, user_content,
                              temperature=TEMP_L2A_ANALYSIS, max_tokens=1200)

    # ============================================================
    # 14. AI 澄清 clarify_node（L2-A 分析模型）— 设计文档 13.6
    # ============================================================
    def clarify_node(self, node: dict) -> dict:
        """
        AI 澄清：为信息不足的节点生成一个高信息量问题

        归属：L2-A 分析模型（temperature=0.3）
        对应设计文档 13.6 AI 澄清

        一次只问一个高信息量问题，回答后返回 patchProposal。

        Returns:
            {"question":"","options":[{"label","resultingKind","resultingCommitment"}],'
            '"patchProposal":{"title","kind","commitment","targetResult","reason"}}
        """
        system_prompt = (
            '你是伴伴的节点澄清模块。你的任务是为信息不足的节点生成一个高信息量问题。\n\n'
            '## 规则\n'
            '1. 一次只问一个问题\n'
            '2. 问题要针对节点最缺失的信息（结果？范围？时间？承诺？）\n'
            '3. 提供 2-4 个选项，每个选项标注可能导致的 kind 和 commitment 变化\n'
            '4. patchProposal 是如果用户回答后可能的节点更新建议\n'
            '5. 不要替用户做决定，只是提供选项\n\n'
            '输出格式：\n'
            '{"question":"","options":[{"label":"","resultingKind":"",'
            '"resultingCommitment":""}],"patchProposal":{"title":"","kind":"",'
            '"commitment":"","targetResult":"","reason":""}}'
        )
        user_content = (
            f"## 需要澄清的节点\n{json.dumps(node, ensure_ascii=False, indent=2)}\n"
            f"请生成一个澄清问题："
        )
        return self._call_api(system_prompt, user_content,
                              temperature=TEMP_L2A_ANALYSIS, max_tokens=600)

    # ============================================================
    # 兼容方法：ideate — 保留旧接口，内部调用 classify_canvas
    # ============================================================
    def ideate(self, input_text: str, selected_node: dict = None,
               existing_nodes: list = None) -> dict:
        """画布 AI 联想（兼容旧接口，内部调用 classify_canvas）

        保留语音识别 → 文字 → AI 的管道不变，
        但 AI 分析逻辑完全使用新的 classify_canvas 方法。
        """
        source = "chat"
        result = self.classify_canvas(
            input_text=input_text,
            source=source,
            existing_nodes=existing_nodes,
        )

        # 如果有选中节点，同时返回联想建议
        if selected_node and "error" not in result:
            expand_result = self.expand_node(selected_node, existing_nodes=existing_nodes)
            if "error" not in expand_result:
                result["_expandSuggestions"] = expand_result.get("suggestions", [])

        return result

    # ============================================================
    # 11. 行为认知 AI 复核 analyze_behavior（L2-A 分析 → L1 人格）
    #    规则引擎不确定时，AI 有最终判断权
    # ============================================================
    def analyze_behavior(self, features: dict, rule_result: dict,
                         time_context: dict, user_model: dict = None) -> dict:
        """
        行为认知 AI 复核 — 当规则引擎置信度低于阈值时调用。

        AI 看到的数据：
        1. 特征集（当前应用、切换频率、活动水平、关键词等）
        2. 规则引擎的初判结果（含证据）
        3. 时间上下文（时段、生理节律、社会节律）
        4. 用户模型（人格画像、能量模式、沟通偏好）— 让 AI 真正"懂这个人"

        AI 的任务：
        - 确认或推翻规则的判断
        - 补充规则看不到的上下文理解
        - 给出温暖的建议动作

        归属：L2-A 分析（客观判断）→ L1 人格（温暖建议）

        Returns:
            {
                "primary_state": str,
                "confidence": float,
                "reasoning": str,           # AI 推理过程
                "workContinuity": {...},
                "multiTaskLevel": int,
                "restType": str | None,
                "restDepth": str | None,
                "awayType": str | None,
                "suggestedAction": str,
                "suggestedActionReason": str,
                "timeContext": {...}
            }
        """
        system_prompt = (
            '你是「伴伴」，一个温暖的 AI 陪伴者。你的任务是理解用户此刻的状态。\n\n'
            '## 核心原则\n'
            '1. AI 高于规则 — 规则引擎给了初判，但你有最终判断权\n'
            '2. 不确定就说不确定 — 宁可不判断，也不要乱判断\n'
            '3. 时间是生活的骨架 — 不仅是几点几分，还有饭点、下班、睡前\n'
            '4. 不评判 — 任何状态都是中性的，没有好坏。刷视频不是"浪费时间"，'
            '发呆不是"偷懒"，离开不是"摸鱼"。你只是理解，不评价\n'
            '5. 温暖而非监控 — 你是陪伴者，不是监视器\n\n'
            '## 九种状态\n'
            'deep_work(深度工作) / light_work(轻度工作) / communication(沟通交流) / '
            'learning(学习研究) / entertainment_active(主动娱乐) / '
            'entertainment_passive(被动娱乐) / rest(休息) / away(离开) / unknown(未知)\n\n'
            '## 你的判断维度\n'
            '1. primary_state — 用户当前最可能在做什么\n'
            '2. confidence — 你的判断置信度 (0-1)\n'
            '3. reasoning — 你的推理过程（1-2句话，温暖地）\n'
            '4. workContinuity — 是否在做同一项工作\n'
            '5. multiTaskLevel — 多任务等级 1-4 (1=专注, 4=高度碎片化)\n'
            '6. restType / restDepth — 如果在休息，是什么类型和深度\n'
            '7. awayType — 如果离开了，是短/中/长\n'
            '8. suggestedAction — 温暖的建议（不说"你应该"）\n'
            '9. suggestedActionReason — 为什么这么建议\n\n'
            '## 输出格式\n'
            '{\n'
            '  "primary_state": "deep_work|light_work|communication|learning|'
            'entertainment_active|entertainment_passive|rest|away|unknown",\n'
            '  "confidence": 0.0-1.0,\n'
            '  "reasoning": "AI 推理过程",\n'
            '  "workContinuity": {\n'
            '    "isSameTask": true|false,\n'
            '    "confidence": 0.0-1.0,\n'
            '    "taskTheme": "当前工作主题",\n'
            '    "evidence": ["证据1", "证据2"]\n'
            '  },\n'
            '  "multiTaskLevel": 1-4,\n'
            '  "restType": "active|passive|micro|meal|null",\n'
            '  "restDepth": "light|medium|deep|null",\n'
            '  "awayType": "short|medium|long|null",\n'
            '  "suggestedAction": "温暖的建议",\n'
            '  "suggestedActionReason": "建议原因",\n'
            '  "timeContext": {\n'
            '    "biologicalState": "生理状态描述",\n'
            '    "socialRhythm": "社会节律描述",\n'
            '    "lifestyleNote": "生活感悟"\n'
            '  }\n'
            '}'
        )

        # 构造用户消息
        user_content = (
            f"## 当前特征\n{json.dumps(features, ensure_ascii=False, indent=2)}\n\n"
            f"## 规则引擎初判\n{json.dumps(rule_result, ensure_ascii=False, indent=2)}\n\n"
            f"## 时间上下文\n{json.dumps(time_context, ensure_ascii=False, indent=2)}\n\n"
        )
        if user_model:
            # 提取关键人格信息，避免过多数据干扰
            user_profile_brief = {
                "chronotype": user_model.get("energy_pattern", {}).get("chronotype", ""),
                "high_energy_periods": user_model.get("energy_pattern", {}).get("high_energy_periods", []),
                "communication_style": user_model.get("communication_profile", {}).get("directness", ""),
                "support_needs": user_model.get("action_profile", {}).get("support_needs", []),
                "work_style": user_model.get("work_profile", {}).get("execution_style", []),
                "ideal_self_keywords": user_model.get("desired_self", {}).get("keywords", []),
            }
            user_content += (
                f"## 你了解的这个人\n{json.dumps(user_profile_brief, ensure_ascii=False, indent=2)}\n\n"
            )
        user_content += (
            "请给出你的判断。记住：不评判、不确定就说不确定、AI 高于规则。"
        )

        result = self._call_api(system_prompt, user_content, temperature=0.3, max_tokens=800)
        if "error" in result:
            return result

        # 解析 AI 返回
        ai_text = result.get("response", result.get("result", ""))
        if isinstance(ai_text, dict):
            return ai_text

        try:
            parsed = json.loads(ai_text)
            return parsed
        except (json.JSONDecodeError, TypeError):
            # 尝试提取 JSON
            import re
            match = re.search(r'\{[\s\S]*\}', ai_text)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    pass
            return {"error": "AI 返回格式异常", "raw": ai_text}

    # ============================================================
    # 测试方法
    # ============================================================
    def test_all(self) -> dict:
        """
        快速测试所有 9 个 AI 任务。
        使用预设的测试数据，返回每个任务的测试结果。
        """
        print("=" * 60)
        print("伴伴 AI 路由层 -- 全量测试")
        print("=" * 60)

        results = {}

        # ---- 测试 1: classify_input ----
        print("\n[1/9] classify_input ...")
        results["classify_input"] = self.classify_input("我想从下周开始每天早上跑步")
        print(f"  -> {results['classify_input']}")

        # ---- 测试 2: parse_input ----
        print("\n[2/9] parse_input ...")
        results["parse_input"] = self.parse_input(
            "我想从下周开始每天早上跑步", "wish"
        )
        print(f"  -> {results['parse_input']}")

        # ---- 测试 3: define_event ----
        print("\n[3/9] define_event ...")
        results["define_event"] = self.define_event(
            parsed_input={
                "action": "跑步", "timing": "下周开始每天早上",
                "object": "无", "status": "想做但没做", "emotion": "积极"
            },
            existing_goals=[
                {"id": "g1", "title": "提升体能", "status": "active"}
            ],
            existing_events=[
                {"id": "e1", "event_type": "floating",
                 "title": "想多运动", "status": "active"}
            ],
        )
        print(f"  -> {results['define_event']}")

        # ---- 测试 4: link_to_event ----
        print("\n[4/9] link_to_event ...")
        results["link_to_event"] = self.link_to_event(
            activity_log={
                "app_name": "浏览器", "window_title": "跑步路线规划",
                "description": "查看跑步路线", "duration": 300
            },
            event_nodes=[
                {"id": "e1", "event_type": "planned",
                 "title": "每天早上跑步", "status": "active"},
                {"id": "e2", "event_type": "goal",
                 "title": "读完一本书", "status": "active"},
            ],
        )
        print(f"  -> {results['link_to_event']}")

        # ---- 测试 5: update_user_model ----
        print("\n[5/9] update_user_model ...")
        results["update_user_model"] = self.update_user_model(
            behaviors=[
                {"time": "09:00", "action": "深度工作", "duration": 120},
                {"time": "14:00", "action": "刷社交媒体", "duration": 45},
                {"time": "22:30", "action": "熬夜看视频", "duration": 90},
            ],
            feedbacks=[
                {"time": "15:00", "content": "下午有点提不起劲"},
            ],
            review={"feeling": "今天效率还行", "completion_rate": 0.6},
            current_model={
                "energy_pattern": "未知",
                "work_style": "未知",
                "values": [],
                "habits": [],
                "summary": "新用户，了解中",
            },
        )
        print(f"  -> {results['update_user_model']}")

        # ---- 测试 6: generate_plan ----
        print("\n[6/9] generate_plan ...")
        results["generate_plan"] = self.generate_plan(
            event_nodes=[
                {"id": "e1", "event_type": "planned", "title": "写季度报告",
                 "status": "active", "deadline": "今天"},
                {"id": "e2", "event_type": "goal", "title": "每天阅读30分钟",
                 "status": "active"},
                {"id": "e3", "event_type": "habit_candidate", "title": "跑步",
                 "status": "active"},
            ],
            time_blocks=[
                {"start": "09:00", "end": "12:00"},
                {"start": "14:00", "end": "18:00"},
                {"start": "20:00", "end": "22:00"},
            ],
            user_model={
                "energy_pattern": "上午高能量，下午低谷，晚上中等",
                "work_style": "喜欢整块时间专注",
                "preferences": ["上午适合深度工作", "晚上喜欢轻松阅读"],
            },
        )
        print(f"  -> {results['generate_plan']}")

        # ---- 测试 7: generate_morning_brief ----
        print("\n[7/9] generate_morning_brief ...")
        results["generate_morning_brief"] = self.generate_morning_brief(
            last_review={
                "feeling": "今天尝试了新的工作节奏",
                "pattern": "下午2-3点容易分心",
                "completion_rate": 0.7,
            },
            today_plan=[
                {"title": "写季度报告", "start_time": "09:00"},
                {"title": "阅读30分钟", "start_time": "20:00"},
            ],
            user_model={
                "energy_pattern": "上午高能量",
                "summary": "喜欢有节奏感的工作方式",
            },
            comm_profile={
                "tone": "温柔", "verbosity": "适中",
                "style": "像朋友聊天",
            },
        )
        print(f"  -> {results['generate_morning_brief']}")

        # ---- 测试 8: generate_evening_review ----
        print("\n[8/9] generate_evening_review ...")
        results["generate_evening_review"] = self.generate_evening_review(
            activity_logs=[
                {"time": "09:00", "action": "写报告", "duration": 150, "type": "工作"},
                {"time": "14:00", "action": "刷手机", "duration": 40, "type": "休闲"},
                {"time": "16:00", "action": "开会", "duration": 60, "type": "工作"},
                {"time": "20:00", "action": "阅读", "duration": 25, "type": "学习"},
            ],
            plan_blocks=[
                {"title": "写季度报告", "status": "planned"},
                {"title": "阅读30分钟", "status": "planned"},
                {"title": "跑步", "status": "planned"},
            ],
            feedbacks=[
                {"content": "报告写得比预期慢"},
            ],
            user_model={
                "energy_pattern": "上午高能量，下午低谷",
                "summary": "新用户，了解中",
            },
            comm_profile={
                "tone": "温柔", "verbosity": "适中",
            },
        )
        print(f"  -> {results['generate_evening_review']}")

        # ---- 测试 9: regulate_communication ----
        print("\n[9/9] regulate_communication ...")
        results["regulate_communication"] = self.regulate_communication(
            user_state={
                "is_fullscreen": False,
                "current_activity": "写报告",
                "recent_accept_rate": 0.6,
                "is_focusing": True,
            },
            comm_profile={
                "tone": "温柔", "style": "像朋友聊天",
            },
            task_importance=0.8,
            last_speak_minutes=30,
        )
        print(f"  -> {results['regulate_communication']}")

        # ---- 汇总 ----
        print("\n" + "=" * 60)
        passed = sum(1 for r in results.values() if "error" not in r)
        failed = len(results) - passed
        print(f"测试完成: {passed} 成功 / {failed} 失败 / 共 {len(results)} 项")
        print("=" * 60)

        return results


# ============================================================
# 直接运行入口
# ============================================================
if __name__ == "__main__":
    router = AIRouter()
    router.test_all()
