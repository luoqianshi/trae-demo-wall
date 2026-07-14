import streamlit as st
import sys
import os
import base64
from io import BytesIO

project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# 猴子补丁：修复 streamlit-drawable-canvas 与新版 Streamlit 的兼容性问题
# 新版 Streamlit 移除了 streamlit.elements.image.image_to_url
try:
    from streamlit.elements import image as st_image
    if not hasattr(st_image, 'image_to_url'):
        def _image_to_url(image, width, clamp, channels, output_format, image_id):
            try:
                from PIL import Image
                if isinstance(image, Image.Image):
                    img = image
                else:
                    img = Image.open(BytesIO(image))
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                buffered = BytesIO()
                img.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()
                return f"data:image/png;base64,{img_str}"
            except Exception:
                return ""
        st_image.image_to_url = _image_to_url
except Exception:
    pass

from streamlit_option_menu import option_menu

st.set_page_config(
    page_title="HomeWizard - 智能家居场景规划器",
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="expanded"
)


def inject_global_css():
    st.html("""
    <style>
    * {
        scrollbar-width: thin;
        scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
    }
    ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
    }
    ::-webkit-scrollbar-track {
        background: transparent;
    }
    ::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.15);
        border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
    }

    .stApp {
        background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #faf5ff 100%) !important;
    }
    .stMainBlockContainer {
        background: transparent !important;
    }
    .stMainBlockContainer .block-container {
        padding-top: 1.5rem !important;
    }

    section[data-testid="stMain"] {
        padding-top: 0 !important;
    }

    html, body, .stApp, .stMarkdown, p, span, label, div, input, textarea, button {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif !important;
    }
    body, .stMarkdown, p, span, label, div {
        color: #64748b;
    }
    h1 {
        font-size: 24px !important;
        font-weight: 700 !important;
        color: #1e293b !important;
        background: none !important;
        -webkit-text-fill-color: #1e293b !important;
    }
    h2 {
        font-size: 20px !important;
        font-weight: 600 !important;
        color: #1e293b !important;
    }
    h3 {
        font-size: 16px !important;
        font-weight: 600 !important;
        color: #1e293b !important;
    }
    h4 {
        color: #475569 !important;
    }

    .glass-card {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 16px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06) !important;
        transition: all 0.3s ease !important;
    }
    .glass-card:hover {
        transform: translateY(-4px) !important;
        border-color: rgba(102, 126, 234, 0.4) !important;
        box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15) !important;
    }

    .device-card {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 16px !important;
        padding: 20px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06) !important;
        transition: all 0.3s ease !important;
        margin-bottom: 16px !important;
    }
    .device-card:hover {
        transform: translateY(-4px) !important;
        border-color: rgba(102, 126, 234, 0.4) !important;
        box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15) !important;
    }

    .aggregate-card {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 16px !important;
        padding: 16px 20px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06) !important;
        transition: all 0.3s ease !important;
        margin-bottom: 12px !important;
        cursor: pointer;
    }
    .aggregate-card:hover {
        transform: translateY(-2px) !important;
        border-color: rgba(102, 126, 234, 0.5) !important;
        box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2) !important;
    }

    .dashboard-stat-card {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 16px !important;
        padding: 18px 16px !important;
        text-align: center !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06) !important;
        transition: all 0.3s ease !important;
    }
    .dashboard-stat-card:hover {
        transform: translateY(-2px) !important;
        border-color: rgba(102, 126, 234, 0.3) !important;
    }

    .dashboard-container {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 20px !important;
        padding: 24px !important;
        margin-bottom: 24px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06) !important;
    }

    .stButton > button {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        color: #1e293b !important;
        padding: 8px 20px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
        white-space: nowrap !important;
        min-height: 40px !important;
    }
    .stButton > button:hover {
        background: #f1f5f9 !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06) !important;
    }
    .stButton > button[kind="primary"] {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        border-color: rgba(102, 126, 234, 0.3) !important;
        color: white !important;
    }
    .stButton > button[kind="primary"]:hover {
        background: linear-gradient(135deg, #5a6fd8 0%, #6a4490 100%) !important;
    }
    [data-testid="stButton"] > div > button[kind="secondary"] {
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        color: #475569 !important;
    }
    [data-testid="stButton"] > div > button[kind="secondary"]:hover {
        background: #f1f5f9 !important;
        border-color: #cbd5e1 !important;
        color: #475569 !important;
    }

    .stTextInput > div > div > input,
    .stTextArea > div > div > textarea {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        color: #1e293b !important;
        padding: 12px 16px !important;
    }
    .stTextInput > div > div > input:focus,
    .stTextArea > div > div > textarea:focus {
        border-color: rgba(102, 126, 234, 0.5) !important;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12) !important;
    }
    .stTextArea > div > div > textarea {
        min-height: 150px !important;
    }

    .stNumberInput > div > div > input {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        color: #1e293b !important;
    }
    .stNumberInput > div > div > button {
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        color: #1e293b !important;
    }
    .stNumberInput > div > div > button:hover {
        background: #e2e8f0 !important;
    }

    .stProgress > div > div > div {
        background: linear-gradient(90deg, #667eea, #764ba2) !important;
        border-radius: 20px !important;
    }
    .stProgress > div > div {
        background: #ffffff !important;
        border-radius: 20px !important;
    }

    [data-testid="stSidebar"] {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border-right: 1px solid #e2e8f0 !important;
    }
    [data-testid="stSidebar"] hr {
        border: none;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
        margin: 12px 0;
    }
    [data-testid="stSidebar"] .stMarkdown {
        color: #475569 !important;
    }
    [data-testid="stSidebarNav"] {
        display: none !important;
    }

    .stTabs [data-baseweb="tab"] {
        border-radius: 12px !important;
        padding: 8px 16px !important;
        color: #64748b !important;
    }
    .stTabs [aria-selected="true"] {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
    }
    div[data-testid="stRadio"] label {
        color: #475569 !important;
    }

    [data-testid="stMetric"] {
        border-radius: 12px !important;
        background: #ffffff !important;
        padding: 16px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06) !important;
        border: 1px solid #e2e8f0 !important;
    }
    [data-testid="stMetric"] label {
        color: #64748b !important;
    }
    [data-testid="stMetric"] [data-testid="stMetricValue"] {
        color: #1e293b !important;
    }

    .stAlert {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        color: #1e293b !important;
    }
    .stAlert > div {
        background: transparent !important;
    }
    .stAlert[data-baseweb="notification"] {
        border-left: 4px solid rgba(102, 126, 234, 0.5) !important;
    }

    [data-testid="stExpander"] {
        background: #f8fafc !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        overflow: hidden !important;
    }
    [data-testid="stExpander"] > details > summary {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        border: none !important;
        border-radius: 12px !important;
        color: #1e293b !important;
        padding: 12px 16px !important;
        font-weight: 500 !important;
        align-items: center !important;
        gap: 10px !important;
        min-height: 44px !important;
        list-style: none !important;
    }
    [data-testid="stExpander"] > details > summary:hover {
        background: #e2e8f0 !important;
    }
    [data-testid="stExpander"] > details > summary > div > span:first-child,
    [data-testid="stExpander"] > details > summary > span:first-child {
        flex-shrink: 0 !important;
        margin-right: 4px !important;
        display: inline-flex !important;
        align-items: center !important;
    }
    [data-testid="stExpander"] > details > summary p {
        margin: 0 !important;
        line-height: 1.4 !important;
        color: #1e293b !important;
    }
    [data-testid="stExpander"] > details > div:last-child,
    [data-testid="stExpander"] [data-testid="stExpanderDetails"] {
        background: #f8fafc !important;
        backdrop-filter: blur(10px) !important;
        border-top: 1px solid #e2e8f0 !important;
        padding: 16px !important;
    }

    .mode-label-pro {
        background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
        color: white;
        padding: 4px 16px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        display: inline-block;
    }
    .mode-label-diy {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 4px 16px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        display: inline-block;
    }

    .mode-card {
        border-radius: 20px !important;
        border: 1px solid #e2e8f0 !important;
        padding: 32px 24px !important;
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06) !important;
        transition: all 0.3s ease !important;
        text-align: center;
        cursor: pointer;
    }
    .mode-card:hover {
        transform: translateY(-4px);
        border-color: rgba(102, 126, 234, 0.4) !important;
        box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15) !important;
    }
    .mode-card-selected {
        border-color: #667eea !important;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.25) !important;
        transform: translateY(-4px);
        background: rgba(102, 126, 234, 0.12) !important;
    }

    .wizard-card {
        border-radius: 16px !important;
        border: 1px solid #e2e8f0 !important;
        padding: 20px 16px !important;
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06) !important;
        transition: all 0.3s ease !important;
        text-align: center;
        cursor: pointer;
    }
    .wizard-card:hover {
        transform: translateY(-4px);
        border-color: rgba(102, 126, 234, 0.4) !important;
    }
    .wizard-card-selected {
        border-color: #667eea !important;
        background: rgba(102, 126, 234, 0.15) !important;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.25) !important;
    }

    .step-progress {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 24px;
    }
    .step-dot {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;
    }
    .step-dot.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    .step-dot.done {
        background: #22c55e;
        color: white;
    }
    .step-dot.pending {
        background: #ffffff;
        color: #6B7280;
    }
    .step-connector {
        width: 60px;
        height: 4px;
        background: #e2e8f0;
        border-radius: 2px;
        align-self: center;
    }
    .step-connector.done {
        background: #22c55e;
    }

    .total-price-card {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 16px !important;
        padding: 20px !important;
        text-align: center !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06) !important;
    }
    .total-price-card .price {
        font-size: 2rem !important;
        font-weight: 700 !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
    }
    .total-price-card div {
        color: #64748b !important;
    }

    hr {
        border-color: rgba(0, 0, 0, 0.06) !important;
    }

    a, .stMarkdown a {
        color: #2563eb !important;
        text-decoration: none !important;
        transition: color 0.2s ease !important;
    }
    a:hover, .stMarkdown a:hover {
        color: #1d4ed8 !important;
    }

    .stTable table {
        background: transparent !important;
        color: #64748b !important;
    }
    .stTable thead th {
        background: #ffffff !important;
        color: #1e293b !important;
        border-bottom: 1px solid #e2e8f0 !important;
    }
    .stTable tbody td {
        background: transparent !important;
        color: #64748b !important;
        border-bottom: 1px solid #f8fafc !important;
    }
    .stTable tbody tr:hover td {
        background: #ffffff !important;
    }

    .total-price-card-gold {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid rgba(255, 215, 0, 0.3) !important;
        border-radius: 16px !important;
        padding: 20px !important;
        text-align: center !important;
        box-shadow: 0 8px 32px rgba(255, 215, 0, 0.1) !important;
    }

    .demo-badge {
        display: inline-block;
        background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%) !important;
        color: white !important;
        padding: 3px 12px !important;
        border-radius: 12px !important;
        font-size: 0.72rem !important;
        font-weight: 600 !important;
        margin-left: 8px !important;
        vertical-align: middle !important;
    }

    .demo-scenario-card {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 16px !important;
        padding: 18px 16px !important;
        text-align: center !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06) !important;
        transition: all 0.3s ease !important;
        cursor: pointer;
        height: 100% !important;
    }
    .demo-scenario-card:hover {
        transform: translateY(-4px) !important;
        border-color: rgba(102, 126, 234, 0.4) !important;
        box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15) !important;
    }

    .stSelectbox > div[data-baseweb="select"] > div,
    .stMultiSelect > div[data-baseweb="select"] > div {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        color: #1e293b !important;
    }
    .stSelectbox > div[data-baseweb="select"] ul,
    .stMultiSelect > div[data-baseweb="select"] ul {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
    }
    .stSelectbox > div[data-baseweb="select"] li,
    .stMultiSelect > div[data-baseweb="select"] li {
        color: #1e293b !important;
    }
    .stSelectbox > div[data-baseweb="select"] li:hover,
    .stMultiSelect > div[data-baseweb="select"] li:hover {
        background: #e2e8f0 !important;
    }

    .stCheckbox > label, .stRadio > label {
        color: #1e293b !important;
    }
    .stCheckbox > label > div[data-baseweb="checkbox"] > div,
    .stRadio > label > div[data-baseweb="radio"] > div {
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
    }
    .stCheckbox > label > div[data-baseweb="checkbox"] > div[data-checked="true"] {
        background: rgba(102, 126, 234, 0.3) !important;
        border-color: rgba(102, 126, 234, 0.5) !important;
    }
    .stRadio > label > div[data-baseweb="radio"] > div[data-checked="true"] {
        border-color: rgba(102, 126, 234, 0.5) !important;
    }

    .stDataFrame > div[data-testid="stDataFrameResizable"] table {
        background: transparent !important;
    }
    .stDataFrame > div[data-testid="stDataFrameResizable"] thead th {
        background: #ffffff !important;
        color: #1e293b !important;
        border-bottom: 1px solid #e2e8f0 !important;
    }
    .stDataFrame > div[data-testid="stDataFrameResizable"] tbody td {
        background: transparent !important;
        color: #64748b !important;
        border-bottom: 1px solid #f1f5f9 !important;
    }
    .stDataFrame > div[data-testid="stDataFrameResizable"] tbody tr:hover td {
        background: #ffffff !important;
    }

    .stDateInput > div > div > input,
    .stTimeInput > div > div > input {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        color: #1e293b !important;
    }
    .stDateInput > div > div > div {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
        color: #1e293b !important;
    }

    .stCaption, .stInfo {
        color: #64748b !important;
    }

    .wizard-card h4, .mode-card h4 {
        color: #475569 !important;
    }
    .wizard-card p, .mode-card p {
        color: #64748b !important;
    }

    @keyframes fadeInUp {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
    }
    .page-content {
        animation: fadeInUp 0.4s ease-out;
    }

    .step-dot-current { color: #667eea; font-weight: 700; }
    .step-dot-done { color: #22c55e; }
    .step-dot-pending { color: #666; }

    div[role="listbox"] ul {
        background: #ffffff !important;
        backdrop-filter: blur(20px) !important;
        border: 1px solid #e2e8f0 !important;
    }
    div[role="listbox"] li {
        color: #1e293b !important;
    }
    div[role="listbox"] li:hover {
        background: #e2e8f0 !important;
    }

    .stForm {
        background: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 16px !important;
        padding: 20px !important;
    }

    .stSlider > div > div > div {
        background: #e2e8f0 !important;
    }
    .stSlider > div > div > div > div > div {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    }
    </style>
    """)


inject_global_css()


def init_session_state():
    defaults = {
        "first_visit": True,
        "wizard_step": 1,
        "selected_floorplan": None,
        "selected_scenes": [],
        "selected_budget_tier": None,
        "user_input": "",
        "plan_result": None,
        "multi_plans": None,
        "ai_provider": "deepseek",
        "ai_api_keys": {},
        "ai_custom_configs": {},
        "ai_config_valid": {},
        "use_ai": True,
        "ai_mode": "auto",
        "setup_devices": [],
        "setup_step": 1,
        "device_status": {},
        "device_positions": {},
        "dashboard_devices": [],
        "trigger_log": [],
        "demo_mode": False,
        "current_page": "home",
        "selected_bom_row": None,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value
        elif key == 'ai_config_valid' and not isinstance(st.session_state[key], dict):
            st.session_state[key] = value


init_session_state()


def on_demo_mode_change():
    st.session_state['demo_mode'] = st.session_state['_demo_toggle_key']


def navigate_to_page(key=None):
    selected = st.session_state['_nav_menu']
    page_map = {
        "首页": "home",
        "推荐方案": "recommend",
        "户型图": "floorplan",
        "设备配置": "setup",
        "智能联动": "dashboard",
        "AI 引擎": "ai_settings",
    }
    target = page_map.get(selected, "home")
    if target != st.session_state.get('current_page', 'home'):
        st.session_state['current_page'] = target
        st.switch_page(f"views/{target}.py")


with st.sidebar:
    st.markdown("""
    <div style="text-align: center; padding: 12px 0 20px 0;">
        <h2 style="margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 1.5rem;">
            🏠 HomeWizard
        </h2>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 0.8rem;">
            智能家居场景规划助手
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.divider()

    menu_icons = ["🏠", "📋", "📐", "⚙️", "⚡", "🧠"]
    menu_options = ["首页", "推荐方案", "户型图", "设备配置", "智能联动", "AI 引擎"]

    current_page = st.session_state.get('current_page', 'home')
    page_to_idx = {"home": 0, "recommend": 1, "floorplan": 2, "setup": 3, "dashboard": 4, "ai_settings": 5}
    default_idx = page_to_idx.get(current_page, 0)

    selected = option_menu(
        menu_title=None,
        options=menu_options,
        icons=menu_icons,
        default_index=default_idx,
        key="_nav_menu",
        on_change=navigate_to_page,
        styles={
            "container": {
                "background": "transparent",
                "backdrop-filter": "blur(20px)",
                "-webkit-backdrop-filter": "blur(20px)",
                "padding": "8px",
                "border-radius": "16px",
                "border": "1px solid #e2e8f0",
            },
            "icon": {
                "font-size": "1rem",
            },
            "nav-link": {
                "color": "#475569",
                "font-size": "0.9rem",
                "text-align": "left",
                "padding": "12px 16px",
                "margin": "2px 0",
                "border-radius": "12px",
                "transition": "all 0.2s ease",
            },
            "nav-link-hover": {
                "background": "#ffffff",
                "color": "#1e293b",
            },
            "nav-link-selected": {
                "background": "linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)",
                "color": "#1e293b",
                "border": "1px solid rgba(102, 126, 234, 0.4)",
                "box-shadow": "0 4px 16px rgba(102, 126, 234, 0.2)",
            },
        }
    )

    st.divider()

    st.toggle(
        "🎯 演示模式",
        value=st.session_state.get('demo_mode', False),
        key="_demo_toggle_key",
        on_change=on_demo_mode_change,
        help="开启后首页将显示快速演示入口，一键加载预置场景",
    )
    if st.session_state.get('demo_mode', False):
        st.caption("💡 演示模式已开启，前往首页一键加载场景")

    st.divider()


pages = [
    st.Page("views/home.py", title="首页", icon="🏠", url_path="home", default=True),
    st.Page("views/recommend.py", title="推荐方案", icon="📋", url_path="recommend"),
    st.Page("views/floorplan.py", title="户型图", icon="📐", url_path="floorplan"),
    st.Page("views/setup.py", title="设备配置", icon="⚙️", url_path="setup"),
    st.Page("views/dashboard.py", title="智能联动", icon="⚡", url_path="dashboard"),
    st.Page("views/ai_settings.py", title="AI 引擎", icon="🧠", url_path="ai_settings"),
]

pg = st.navigation(pages)
pg.run()
