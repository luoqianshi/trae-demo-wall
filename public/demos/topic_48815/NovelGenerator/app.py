"""
app.py - 本地小说生成系统主程序

基于 Streamlit 的小说生成网页应用。
用户可以输入小说主题、核心设定和大纲内容，
点击按钮后调用大模型 API 生成小说章节。

支持 DeepSeek、智谱 AI、Kimi 等多种大模型。

运行方式：
    streamlit run app.py
"""

import streamlit as st
from llm_client import create_llm_client, get_available_providers


def init_session_state():
    """
    初始化 Streamlit 会话状态

    Streamlit 每次交互都会重新运行整个脚本，
    因此需要使用 session_state 来保存跨交互的状态数据。

    这里初始化所有需要用到的状态变量。
    """
    # 生成的小说内容
    if "generated_content" not in st.session_state:
        st.session_state.generated_content = ""

    # 是否正在生成中
    if "is_generating" not in st.session_state:
        st.session_state.is_generating = False


def render_sidebar():
    """
    渲染侧边栏

    侧边栏用于放置模型选择和 API Key 等配置项。
    用户可以在这里选择不同的大模型平台并填入 API Key。

    返回:
        tuple: (provider, model, api_key) 模型配置信息
    """
    with st.sidebar:
        st.title("⚙️ 设置")
        st.markdown("---")

        # 获取所有可用的模型提供商
        providers = get_available_providers()

        # 模型平台选择
        provider_labels = {
            "deepseek": "🔵 DeepSeek",
            "zhipu": "🟢 智谱 AI（GLM）",
            "kimi": "🔴 Kimi（月之暗面）",
        }
        provider_display = st.selectbox(
            "**选择模型平台**",
            list(provider_labels.keys()),
            format_func=lambda x: provider_labels.get(x, x),
            help="选择你想使用的大模型平台",
            index=0
        )

        # 具体模型选择（根据选择的平台动态变化）
        provider_config = providers.get(provider_display, {})
        model_options = provider_config.get("models", {})

        model_display = st.selectbox(
            "**选择模型**",
            list(model_options.keys()),
            format_func=lambda x: model_options.get(x, x),
            help="选择具体的模型版本",
            index=0
        )

        st.markdown("---")

        # API Key 输入框
        api_key = st.text_input(
            "**API Key**",
            type="password",
            placeholder="请输入您的 API Key",
            help="填入对应平台的 API Key 后即可使用真实 AI 生成\n不填则使用模拟模式（示例文本）"
        )

        st.markdown("---")

        # 显示当前状态提示
        if api_key.strip():
            st.success(f"✅ 已配置 {provider_config.get('name', '')} API")
        else:
            st.info("💡 未填写 API Key，当前为**模拟模式**\n（显示示例文本，不消耗 token）")

        # 获取 API Key 的链接
        with st.expander("📌 如何获取 API Key？"):
            st.markdown("""
- **DeepSeek**：去 https://platform.deepseek.com/ 注册，在「API Key」页面创建
- **智谱 AI**：去 https://open.bigmodel.cn/ 注册，在「API Key」页面创建
- **Kimi**：去 https://platform.moonshot.cn/ 注册，在「API Key」页面创建
            """)

    return provider_display, model_display, api_key


def render_input_area():
    """
    渲染输入区域

    包含三个输入框：
    1. 小说主题
    2. 核心设定
    3. 大纲内容

    返回:
        tuple: (theme, core_setting, outline) 用户输入的三个参数
    """
    st.subheader("📝 输入信息")

    # 小说主题输入框（单行文本输入）
    theme = st.text_input(
        "**小说主题**",
        placeholder="例如：修仙、都市异能、穿越、科幻、悬疑...",
        help="用一句话概括你的小说主题"
    )

    # 核心设定输入框（多行文本输入，高度较小）
    core_setting = st.text_area(
        "**核心设定**",
        placeholder="例如：主角是一个普通的大学生，意外获得了穿越时空的能力...",
        height=100,
        help="描述小说的核心世界观、主角设定等关键信息"
    )

    # 大纲内容输入框（多行文本输入，高度较大）
    outline = st.text_area(
        "**大纲内容**",
        placeholder="请输入本章的大纲内容，例如：\n1. 主角早晨起床，发现异常\n2. 出门遇到神秘人\n3. 获得第一件宝物...",
        height=150,
        help="详细描述你想要生成的章节目录和情节走向"
    )

    return theme, core_setting, outline


def render_generate_button(theme: str, core_setting: str, outline: str,
                           provider: str, model: str, api_key: str):
    """
    渲染生成按钮并处理生成逻辑

    参数:
        theme: 小说主题
        core_setting: 核心设定
        outline: 大纲内容
        provider: 模型提供商
        model: 模型名称
        api_key: API 密钥
    """
    # 开始生成按钮
    button_clicked = st.button(
        "🚀 开始生成",
        type="primary",
        use_container_width=True
    )

    # 当按钮被点击时
    if button_clicked:
        # 先验证输入是否完整
        if not theme.strip():
            st.error("⚠️ 请输入小说主题！")
            return

        if not core_setting.strip():
            st.error("⚠️ 请输入核心设定！")
            return

        if not outline.strip():
            st.error("⚠️ 请输入大纲内容！")
            return

        # 设置生成状态为 True
        st.session_state.is_generating = True

        # 显示加载动画
        with st.spinner("🤖 AI 正在创作中，请稍候..."):
            try:
                # 创建大模型客户端（传入配置）
                llm_client = create_llm_client(
                    api_key=api_key,
                    model=model,
                    provider=provider
                )

                # 调用大模型生成章节内容
                content = llm_client.generate_chapter(theme, core_setting, outline)

                # 将生成的内容保存到会话状态中
                st.session_state.generated_content = content

                # 生成成功，状态重置
                st.session_state.is_generating = False

            except Exception as e:
                # 生成失败，显示错误信息
                st.error(f"❌ 生成失败：{str(e)}")
                st.session_state.is_generating = False


def render_output_area():
    """
    渲染输出区域

    显示生成的小说章节内容。
    如果还没有生成内容，显示提示信息。
    """
    st.subheader("📖 生成结果")

    # 检查是否有生成的内容
    if st.session_state.generated_content:
        # 使用 markdown 格式展示内容，支持标题、加粗等格式
        st.markdown(st.session_state.generated_content)

        # 添加一个复制按钮（Streamlit 原生支持）
        st.success("✅ 生成完成！你可以选中上面的文本进行复制。")

    else:
        # 还没有生成内容时显示的提示
        st.info("👆 在左侧输入小说信息，然后点击「开始生成」按钮，AI 将为你创作小说内容。")


def main():
    """
    主函数 - 应用入口

    Streamlit 应用的主入口，负责整体页面布局和组件渲染。
    """
    # 配置页面基本信息（必须在最前面调用）
    st.set_page_config(
        page_title="本地小说生成系统",
        page_icon="📚",
        layout="wide",
        initial_sidebar_state="expanded"
    )

    # 初始化会话状态
    init_session_state()

    # 页面标题
    st.title("📚 本地小说生成系统")
    st.markdown("基于大模型的智能小说创作助手，输入主题和大纲，一键生成小说章节。")
    st.markdown("---")

    # 渲染侧边栏，获取模型配置
    provider, model, api_key = render_sidebar()

    # 创建两列布局：左侧输入，右侧输出
    col1, col2 = st.columns([1, 1.2], gap="large")

    # 左列：输入区域
    with col1:
        theme, core_setting, outline = render_input_area()
        st.markdown("")  # 添加一点间距
        render_generate_button(theme, core_setting, outline, provider, model, api_key)

    # 右列：输出区域
    with col2:
        render_output_area()

    # 页脚信息
    st.markdown("---")
    st.caption("💻 本地小说生成系统 | Powered by Streamlit + LLM")


# 程序入口
if __name__ == "__main__":
    main()
