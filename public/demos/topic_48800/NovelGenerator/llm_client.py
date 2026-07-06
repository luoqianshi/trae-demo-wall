"""
llm_client.py - 大模型 API 客户端封装

本模块负责与大语言模型 API 进行交互。
支持 DeepSeek、智谱 AI（GLM）、Kimi（月之暗面）等多种模型。
如果没有填写 API Key，会自动使用模拟模式，用假数据演示效果。
"""

import time
import random


# 各模型提供商的配置信息
MODEL_PROVIDERS = {
    "deepseek": {
        "name": "DeepSeek",
        "base_url": "https://api.deepseek.com/v1",
        "models": {
            "deepseek-chat": "deepseek-chat（推荐）",
            "deepseek-reasoner": "deepseek-reasoner（推理模型）",
        }
    },
    "zhipu": {
        "name": "智谱 AI",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "models": {
            "glm-4-flash": "glm-4-flash（免费）",
            "glm-4": "glm-4",
            "glm-4-plus": "glm-4-plus",
        }
    },
    "kimi": {
        "name": "Kimi（月之暗面）",
        "base_url": "https://api.moonshot.cn/v1",
        "models": {
            "moonshot-v1-8k": "moonshot-v1-8k",
            "moonshot-v1-32k": "moonshot-v1-32k",
            "moonshot-v1-128k": "moonshot-v1-128k",
        }
    },
    "mock": {
        "name": "模拟模式",
        "base_url": "",
        "models": {
            "mock-model": "模拟模型（无需 API Key）",
        }
    }
}


class LLMClient:
    """
    大模型客户端类

    封装了与大模型交互的所有方法。
    支持多种模型提供商，没有 API Key 时自动使用模拟模式。
    """

    def __init__(self, api_key: str = "", model: str = "deepseek-chat", provider: str = "deepseek"):
        """
        初始化大模型客户端

        参数:
            api_key: 大模型 API 的密钥，如果为空则使用模拟模式
            model: 使用的模型名称
            provider: 模型提供商（deepseek / zhipu / kimi / mock）
        """
        self.api_key = api_key.strip()
        self.model = model
        self.provider = provider

        # 如果没有 API Key，强制使用模拟模式
        if not self.api_key:
            self.provider = "mock"
            self.model = "mock-model"

        # 延迟导入 openai 库，这样模拟模式下不需要安装也能用
        self._client = None
        if self.provider != "mock":
            self._init_real_client()

    def _init_real_client(self):
        """
        初始化真实的 API 客户端（使用 OpenAI SDK，兼容大多数国产大模型）

        大多数国产大模型都兼容 OpenAI 的 API 格式，
        所以我们可以直接用 openai 库，只需要改 base_url。
        """
        try:
            from openai import OpenAI
            provider_config = MODEL_PROVIDERS.get(self.provider, {})
            base_url = provider_config.get("base_url", "")

            if base_url:
                self._client = OpenAI(
                    api_key=self.api_key,
                    base_url=base_url
                )
        except ImportError:
            # 如果没装 openai 库，就回退到模拟模式
            self.provider = "mock"
            self.model = "mock-model"
            self._client = None

    def _build_prompt(self, theme: str, core_setting: str, outline: str) -> str:
        """
        构建发送给 AI 的提示词（Prompt）

        把小说主题、核心设定、大纲整合成一个清晰的提示词，
        让 AI 知道该生成什么样的内容。

        参数:
            theme: 小说主题
            core_setting: 核心设定
            outline: 大纲内容

        返回:
            构建好的提示词文本
        """
        prompt = f"""你是一位才华横溢的小说家，擅长创作引人入胜的故事。

请根据以下信息，创作一章精彩的小说内容：

【小说主题】
{theme}

【核心设定】
{core_setting}

【本章大纲】
{outline}

【写作要求】
1. 内容要生动有趣，情节紧凑，引人入胜
2. 人物描写要立体，对话要自然，符合角色性格
3. 环境描写要细腻，有画面感
4. 字数不少于 1500 字
5. 用 Markdown 格式输出，章节标题用一级标题（#），重要情节可以适当加粗
6. 直接输出小说正文，不要有多余的解释或说明

请开始创作："""

        return prompt

    def generate_chapter(self, theme: str, core_setting: str, outline: str) -> str:
        """
        生成小说章节内容

        这是核心方法，接收小说主题、核心设定和大纲，
        返回生成的章节内容。

        如果有 API Key，就调用真实的大模型 API；
        如果没有，就使用模拟数据。

        参数:
            theme: 小说主题
            core_setting: 核心设定
            outline: 大纲内容

        返回:
            生成的小说章节文本
        """
        # 模拟模式：用假数据
        if self.provider == "mock" or self._client is None:
            # 模拟生成延迟（2-4秒随机延迟，模拟真实 API 调用耗时）
            time.sleep(random.uniform(2, 4))
            return self._generate_mock_content(theme, core_setting, outline)

        # 真实模式：调用大模型 API
        try:
            prompt = self._build_prompt(theme, core_setting, outline)

            response = self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一位专业的小说家，擅长创作各种类型的小说。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                stream=False
            )

            # 提取 AI 返回的内容
            content = response.choices[0].message.content
            return content.strip()

        except Exception as e:
            # 调用失败，抛出异常让上层处理
            raise RuntimeError(f"调用 {MODEL_PROVIDERS.get(self.provider, {}).get('name', '未知')} API 失败：{str(e)}")

    def _generate_mock_content(self, theme: str, core_setting: str, outline: str) -> str:
        """
        生成模拟的小说章节内容（内部方法，外部请勿直接调用）

        根据输入的主题、核心设定和大纲，生成一段模拟的小说内容。
        这只是为了演示界面效果，内容是固定模板 + 输入信息的组合。

        参数:
            theme: 小说主题
            core_setting: 核心设定
            outline: 大纲内容

        返回:
            模拟的小说章节文本
        """
        # 模拟章节标题
        chapter_title = "第一章 命运的起点"

        # 模拟的章节内容，包含多个段落
        paragraphs = [
            f"# {chapter_title}",
            "",
            f"故事的主题是：**{theme}**。",
            "",
            f"在这个世界中，{core_setting}。一切都围绕着这个核心设定展开，主角的命运也因此而改变。",
            "",
            "清晨的阳光透过薄薄的窗帘洒进房间，在地板上投下斑驳的光影。主角缓缓睁开眼睛，新的一天就这样开始了。他/她并不知道，今天将会是人生中最重要的一天——一切的一切，都将从今天起发生翻天覆地的变化。",
            "",
            "起床、洗漱、吃早餐，一切都和往常一样。然而，当主角推开房门的那一刻，一种奇异的感觉涌上心头。仿佛有什么东西在冥冥之中牵引着他/她，朝着未知的方向前进。",
            "",
            f"根据大纲的指引——{outline}——故事将在这里正式拉开帷幕。主角的冒险才刚刚开始，更多的挑战与机遇正在前方等待着。",
            "",
            "街道上人来人往，车水马龙。主角站在十字路口，望着眼前熟悉又陌生的城市，心中涌起一股难以言喻的激动。他/她深吸一口气，迈开步伐，向着命运的方向走去。",
            "",
            "---",
            "",
            "> （本章完）",
            "",
            "---",
            "",
            "**💡 温馨提示：** 当前为**模拟模式**，显示的是示例文本。",
            "",
            "想要生成真实的 AI 小说，请在左侧侧边栏填入你的 API Key，然后重新生成。",
            "",
            "支持的模型平台：DeepSeek、智谱 AI（GLM）、Kimi（月之暗面）"
        ]

        # 将段落拼接成完整的章节内容
        return "\n".join(paragraphs)


def get_available_providers() -> dict:
    """
    获取所有可用的模型提供商列表

    返回:
        模型提供商配置字典
    """
    return MODEL_PROVIDERS


def create_llm_client(api_key: str = "", model: str = "deepseek-chat", provider: str = "deepseek") -> LLMClient:
    """
    创建并返回一个大模型客户端实例

    这是一个工厂函数，方便外部创建 LLMClient 实例。

    参数:
        api_key: API 密钥
        model: 模型名称
        provider: 模型提供商

    返回:
        LLMClient 实例
    """
    return LLMClient(api_key=api_key, model=model, provider=provider)
