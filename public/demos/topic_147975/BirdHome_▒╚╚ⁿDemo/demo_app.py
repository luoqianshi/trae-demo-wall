#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
BirdHome 比赛演示应用 - 简化版Streamlit应用
展示核心功能：数据可视化、保护地统计、报告预览
"""
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import json
import os
from datetime import datetime, timedelta

st.set_page_config(
    page_title="BirdHome - 智能鸟类监测名录工具 | 比赛演示",
    page_icon="🐦",
    layout="wide",
    initial_sidebar_state="expanded"
)

DEMO_DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "demo_data.json")

def load_demo_data():
    if os.path.exists(DEMO_DATA_PATH):
        with open(DEMO_DATA_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return generate_mock_data()

def generate_mock_data():
    birds_data = [
        {"中文名": "丹顶鹤", "学名": "Grus japonensis", "保护等级": "国家一级", "IUCN": "EN", "发现次数": 156, "目": "鹤形目", "科": "鹤科"},
        {"中文名": "白鹤", "学名": "Grus leucogeranus", "保护等级": "国家一级", "IUCN": "CR", "发现次数": 89, "目": "鹤形目", "科": "鹤科"},
        {"中文名": "东方白鹳", "学名": "Ciconia boyciana", "保护等级": "国家一级", "IUCN": "EN", "发现次数": 234, "目": "鹳形目", "科": "鹳科"},
        {"中文名": "大天鹅", "学名": "Cygnus cygnus", "保护等级": "国家二级", "IUCN": "LC", "发现次数": 567, "目": "雁形目", "科": "鸭科"},
        {"中文名": "小天鹅", "学名": "Cygnus columbianus", "保护等级": "国家二级", "IUCN": "LC", "发现次数": 432, "目": "雁形目", "科": "鸭科"},
        {"中文名": "鸿雁", "学名": "Anser cygnoides", "保护等级": "国家二级", "IUCN": "VU", "发现次数": 321, "目": "雁形目", "科": "鸭科"},
        {"中文名": "灰雁", "学名": "Anser anser", "保护等级": "三有", "IUCN": "LC", "发现次数": 890, "目": "雁形目", "科": "鸭科"},
        {"中文名": "绿头鸭", "学名": "Anas platyrhynchos", "保护等级": "三有", "IUCN": "LC", "发现次数": 1200, "目": "雁形目", "科": "鸭科"},
        {"中文名": "鸳鸯", "学名": "Aix galericulata", "保护等级": "国家二级", "IUCN": "LC", "发现次数": 178, "目": "雁形目", "科": "鸭科"},
        {"中文名": "苍鹭", "学名": "Ardea cinerea", "保护等级": "三有", "IUCN": "LC", "发现次数": 654, "目": "鹳形目", "科": "鹭科"},
        {"中文名": "白鹭", "学名": "Egretta garzetta", "保护等级": "三有", "IUCN": "LC", "发现次数": 789, "目": "鹳形目", "科": "鹭科"},
        {"中文名": "黑嘴鸥", "学名": "Larus saundersi", "保护等级": "国家一级", "IUCN": "VU", "发现次数": 45, "目": "鸥形目", "科": "鸥科"},
        {"中文名": "普通翠鸟", "学名": "Alcedo atthis", "保护等级": "三有", "IUCN": "LC", "发现次数": 234, "目": "佛法僧目", "科": "翠鸟科"},
        {"中文名": "戴胜", "学名": "Upupa epops", "保护等级": "三有", "IUCN": "LC", "发现次数": 189, "目": "戴胜目", "科": "戴胜科"},
        {"中文名": "喜鹊", "学名": "Pica pica", "保护等级": "三有", "IUCN": "LC", "发现次数": 567, "目": "雀形目", "科": "鸦科"},
        {"中文名": "灰喜鹊", "学名": "Cyanopica cyanus", "保护等级": "三有", "IUCN": "LC", "发现次数": 445, "目": "雀形目", "科": "鸦科"},
        {"中文名": "麻雀", "学名": "Passer montanus", "保护等级": "三有", "IUCN": "LC", "发现次数": 2340, "目": "雀形目", "科": "雀科"},
        {"中文名": "家燕", "学名": "Hirundo rustica", "保护等级": "三有", "IUCN": "LC", "发现次数": 876, "目": "雀形目", "科": "燕科"},
        {"中文名": "金腰燕", "学名": "Cecropis daurica", "保护等级": "三有", "IUCN": "LC", "发现次数": 567, "目": "雀形目", "科": "燕科"},
        {"中文名": "大山雀", "学名": "Parus major", "保护等级": "三有", "IUCN": "LC", "发现次数": 432, "目": "雀形目", "科": "山雀科"},
    ]
    
    protection_areas = [
        {"名称": "果午湖", "公司": "大庆油田", "面积": 1.98, "生态类型": "湿地", "物种数": 89, "记录数": 12560},
        {"名称": "燕鸽湖", "公司": "长庆油田", "面积": 0.12, "生态类型": "湿地", "物种数": 56, "记录数": 8900},
        {"名称": "老虎山", "公司": "大庆油田", "面积": 2.17, "生态类型": "森林", "物种数": 78, "记录数": 9870},
        {"名称": "苏6区", "公司": "长庆油田", "面积": 1.575, "生态类型": "草原", "物种数": 45, "记录数": 6780},
        {"名称": "柯克亚", "公司": "塔里木油田", "面积": 0.5, "生态类型": "荒漠", "物种数": 32, "记录数": 4560},
        {"名称": "沙漠植物园", "公司": "塔里木油田", "面积": 0.2, "生态类型": "荒漠", "物种数": 28, "记录数": 3450},
        {"名称": "阿尔善", "公司": "华北油田", "面积": 0.015, "生态类型": "草原", "物种数": 35, "记录数": 2340},
        {"名称": "盐碱红滩", "公司": "大港油田", "面积": 1.2449, "生态类型": "滨海湿地", "物种数": 67, "记录数": 7890},
        {"名称": "宝鸡油库", "公司": "陕西销售", "面积": 0.258, "生态类型": "城市绿地", "物种数": 42, "记录数": 5670},
        {"名称": "文峰鹭缘", "公司": "昆仑燃气", "面积": 0.125, "生态类型": "湿地", "物种数": 54, "记录数": 6540},
        {"名称": "苏南C3", "公司": "长庆油田", "面积": 2.15, "生态类型": "草原", "物种数": 48, "记录数": 7890},
        {"名称": "沙漠公路", "公司": "塔里木油田", "面积": 32, "生态类型": "荒漠", "物种数": 25, "记录数": 3210},
    ]
    
    monthly_data = []
    months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
              "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12"]
    for month in months:
        monthly_data.append({
            "月份": month,
            "物种数": int(40 + 20 * (1 if "04" in month or "05" in month or "09" in month or "10" in month else 0.6)),
            "记录数": int(3000 + 2000 * (1 if "04" in month or "05" in month or "09" in month or "10" in month else 0.5)),
            "一级保护": int(5 + 3 * (1 if "04" in month or "09" in month else 0.3)),
            "二级保护": int(15 + 10 * (1 if "04" in month or "05" in month or "09" in month or "10" in month else 0.5)),
        })
    
    return {
        "birds": birds_data,
        "protection_areas": protection_areas,
        "monthly_data": monthly_data
    }

def save_demo_data(data):
    with open(DEMO_DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

demo_data = load_demo_data()
save_demo_data(demo_data)

birds_df = pd.DataFrame(demo_data['birds'])
areas_df = pd.DataFrame(demo_data['protection_areas'])
monthly_df = pd.DataFrame(demo_data['monthly_data'])

st.sidebar.title("🐦 BirdHome 演示")
st.sidebar.markdown("---")
st.sidebar.info("这是 BirdHome 智能鸟类监测名录工具的比赛演示版本")

page = st.sidebar.radio(
    "选择功能模块",
    ["🏠 首页", "📊 数据概览", "🏛️ 保护地统计", "🐦 鸟类查询", "📈 趋势分析", "📄 报告预览"],
    index=0
)

st.sidebar.markdown("---")
st.sidebar.markdown("**🌿 项目简介**")
st.sidebar.markdown("基于12个自主贡献型生物多样性保护地（OECMs）需求开发，用科技赋能生物多样性保护。")

def render_home():
    st.title("🐦 BirdHome - 智能鸟类监测名录工具")
    st.caption("比赛演示版本 | 用科技守护自然，让鸟类生息数据清晰可见")
    
    st.markdown("---")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("保护地数量", f"{len(areas_df)}", "个")
    with col2:
        st.metric("监测鸟类", f"{len(birds_df)}", "种")
    with col3:
        st.metric("总记录数", f"{birds_df['发现次数'].sum():,}", "条")
    with col4:
        st.metric("一级保护", f"{len(birds_df[birds_df['保护等级']=='国家一级'])}", "种")
    
    st.markdown("---")
    
    st.subheader("🌿 项目背景")
    st.markdown("""
    BirdHome 基于12个自主贡献型生物多样性保护地（OECMs）的实际需求而生，解决以下痛点：
    
    - **数据分散**：监测数据分散在野外设备、Excel表格、云端平台
    - **效率低下**：手动整理数据、撰写报告耗时费力
    - **创作门槛高**：科普视频脚本创作难度大
    
    通过统一的数据管理平台，实现数据整合、智能分析、报告自动生成，让每一只鸟儿都被记录，让每一份数据都有价值。
    """)
    
    st.markdown("---")
    
    st.subheader("✨ 核心功能")
    features = [
        {"icon": "📝", "title": "数据统一管理", "desc": "整合多站点、多设备的监测数据"},
        {"icon": "🔍", "title": "可视化分析", "desc": "日历视图、同比环比分析、图表展示"},
        {"icon": "📄", "title": "智能报告生成", "desc": "自动生成日/周/月/季度/年度报告"},
        {"icon": "🎬", "title": "视频脚本创作", "desc": "一键生成科普视频脚本"},
        {"icon": "✅", "title": "数据验证保障", "desc": "数据校验、备份恢复"},
        {"icon": "☁️", "title": "离线可用", "desc": "本地数据库完整存档"},
    ]
    
    cols = st.columns(3)
    for i, feature in enumerate(features):
        with cols[i % 3]:
            st.markdown(f"### {feature['icon']} {feature['title']}")
            st.markdown(feature['desc'])
    
    st.markdown("---")
    
    st.subheader("📈 实时数据预览")
    st.dataframe(birds_df[['中文名', '保护等级', '发现次数', 'IUCN']], use_container_width=True, hide_index=True)

def render_overview():
    st.title("📊 数据概览")
    st.caption("鸟类监测数据综合统计分析")
    
    st.markdown("---")
    
    st.subheader("🐦 鸟类保护等级分布")
    level_counts = birds_df['保护等级'].value_counts()
    
    fig = px.pie(
        level_counts,
        values=level_counts.values,
        names=level_counts.index,
        title='保护等级分布',
        color_discrete_map={
            '国家一级': '#E74C3C',
            '国家二级': '#F39C12',
            '三有': '#3498DB',
        }
    )
    st.plotly_chart(fig, use_container_width=True)
    
    st.markdown("---")
    
    st.subheader("📊 鸟类种类排行")
    top_birds = birds_df.sort_values('发现次数', ascending=False).head(15)
    
    fig = px.bar(
        top_birds,
        x='中文名',
        y='发现次数',
        color='保护等级',
        title='鸟类发现次数排行（Top 15）',
        color_discrete_map={
            '国家一级': '#E74C3C',
            '国家二级': '#F39C12',
            '三有': '#3498DB',
        }
    )
    fig.update_layout(xaxis_title='鸟类名称', yaxis_title='发现次数', xaxis_tickangle=-45)
    st.plotly_chart(fig, use_container_width=True)
    
    st.markdown("---")
    
    st.subheader("📋 详细数据")
    st.dataframe(birds_df, use_container_width=True, hide_index=True)

def render_protection_stats():
    st.title("🏛️ 保护地统计")
    st.caption("各保护地基本信息和物种分布")
    
    st.markdown("---")
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("保护地总数", len(areas_df), "个")
    with col2:
        st.metric("总面积", f"{areas_df['面积'].sum():.2f}", "km²")
    with col3:
        st.metric("总物种数", areas_df['物种数'].sum(), "种")
    
    st.markdown("---")
    
    st.subheader("📊 保护地识别数量分布")
    fig = px.bar(
        areas_df,
        x='名称',
        y='记录数',
        color='公司',
        title='各保护地识别记录数量对比',
        color_discrete_map={
            '大庆油田': '#9B59B6',
            '长庆油田': '#E74C3C',
            '塔里木油田': '#2ECC71',
            '华北油田': '#F39C12',
            '大港油田': '#1ABC9C',
            '陕西销售': '#E91E63',
            '昆仑燃气': '#3498DB',
        }
    )
    fig.update_layout(xaxis_title='保护地名称', yaxis_title='记录数', xaxis_tickangle=-45)
    st.plotly_chart(fig, use_container_width=True)
    
    st.markdown("---")
    
    st.subheader("🌍 生态类型分布")
    eco_counts = areas_df['生态类型'].value_counts()
    fig = px.pie(
        eco_counts,
        values=eco_counts.values,
        names=eco_counts.index,
        title='保护地生态类型分布',
        color_discrete_map={
            '湿地': '#3498DB',
            '森林': '#2ECC71',
            '草原': '#F39C12',
            '荒漠': '#95A5A6',
            '滨海湿地': '#1ABC9C',
            '城市绿地': '#E91E63',
        }
    )
    st.plotly_chart(fig, use_container_width=True)
    
    st.markdown("---")
    
    st.subheader("📋 保护地列表")
    st.dataframe(areas_df, use_container_width=True, hide_index=True)

def render_bird_query():
    st.title("🔍 鸟类查询")
    st.caption("搜索鸟类信息，支持中文名、保护等级筛选")
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    with col1:
        search_term = st.text_input("搜索鸟类（中文名或学名）")
    with col2:
        protection_filter = st.selectbox("按保护等级筛选", ["全部", "国家一级", "国家二级", "三有"])
    
    filtered_df = birds_df.copy()
    
    if search_term:
        filtered_df = filtered_df[
            filtered_df['中文名'].str.contains(search_term, case=False) |
            filtered_df['学名'].str.contains(search_term, case=False)
        ]
    
    if protection_filter != "全部":
        filtered_df = filtered_df[filtered_df['保护等级'] == protection_filter]
    
    st.markdown("---")
    st.subheader("📋 查询结果")
    
    if filtered_df.empty:
        st.info("没有找到匹配的鸟类")
    else:
        st.dataframe(filtered_df[['中文名', '学名', '保护等级', 'IUCN', '发现次数']], use_container_width=True, hide_index=True)
        
        st.markdown("---")
        selected_bird = st.selectbox("选择鸟类查看详细信息", filtered_df['中文名'].tolist())
        
        if selected_bird:
            bird = filtered_df[filtered_df['中文名'] == selected_bird].iloc[0]
            st.subheader(f"🐦 {bird['中文名']}")
            
            col_info1, col_info2 = st.columns(2)
            with col_info1:
                st.write(f"**学名**: {bird['学名']}")
                st.write(f"**目**: {bird['目']}")
                st.write(f"**科**: {bird['科']}")
            with col_info2:
                st.write(f"**保护等级**: {'🔴 ' + bird['保护等级'] if bird['保护等级'] == '国家一级' else ('🟠 ' + bird['保护等级'] if bird['保护等级'] == '国家二级' else ('🔵 ' + bird['保护等级']))}")
                st.write(f"**IUCN等级**: {bird['IUCN']}")
                st.write(f"**发现次数**: {bird['发现次数']}")

def render_trend():
    st.title("📈 趋势分析")
    st.caption("月度数据趋势分析")
    
    st.markdown("---")
    
    st.subheader("📊 月度物种数趋势")
    fig = px.line(
        monthly_df,
        x='月份',
        y='物种数',
        title='月度物种数变化趋势',
        markers=True,
        color_discrete_sequence=['#2ECC71']
    )
    fig.update_layout(xaxis_title='月份', yaxis_title='物种数')
    st.plotly_chart(fig, use_container_width=True)
    
    st.markdown("---")
    
    st.subheader("📊 月度记录数趋势")
    fig = px.line(
        monthly_df,
        x='月份',
        y='记录数',
        title='月度记录数变化趋势',
        markers=True,
        color_discrete_sequence=['#3498DB']
    )
    fig.update_layout(xaxis_title='月份', yaxis_title='记录数')
    st.plotly_chart(fig, use_container_width=True)
    
    st.markdown("---")
    
    st.subheader("🏅 保护等级月度趋势")
    fig = px.line(
        monthly_df,
        x='月份',
        y=['一级保护', '二级保护'],
        title='保护等级月度变化趋势',
        markers=True,
        color_discrete_map={
            '一级保护': '#E74C3C',
            '二级保护': '#F39C12',
        }
    )
    fig.update_layout(xaxis_title='月份', yaxis_title='物种数')
    st.plotly_chart(fig, use_container_width=True)
    
    st.markdown("---")
    
    st.subheader("📋 月度数据详情")
    st.dataframe(monthly_df, use_container_width=True, hide_index=True)

def render_report_preview():
    st.title("📄 报告预览")
    st.caption("生成专业的生物多样性监测报告")
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    with col1:
        period_type = st.selectbox("选择报告周期", ["日报", "周报", "月报", "季报", "年报"])
    with col2:
        report_date = st.date_input("选择日期", datetime.now())
    
    st.markdown("---")
    
    if st.button("生成报告", type="primary", use_container_width=True):
        with st.spinner("正在生成报告..."):
            st.markdown("---")
            st.markdown(f"# 生物多样性综合监测报告")
            st.markdown(f"## {period_type}")
            st.markdown(f"**报告日期**: {report_date.strftime('%Y年%m月%d日')}")
            st.markdown(f"**生成时间**: {datetime.now().strftime('%Y年%m月%d日 %H:%M')}")
            
            st.markdown("---")
            st.markdown("## 📊 监测概览")
            
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("物种总数", birds_df['发现次数'].sum(), "次")
            with col2:
                st.metric("鸟类种类", len(birds_df), "种")
            with col3:
                st.metric("一级保护", len(birds_df[birds_df['保护等级']=='国家一级']), "种")
            with col4:
                st.metric("二级保护", len(birds_df[birds_df['保护等级']=='国家二级']), "种")
            
            st.markdown("---")
            st.markdown("## 🐦 主要物种统计")
            
            top_species = birds_df.sort_values('发现次数', ascending=False).head(10)
            st.dataframe(top_species[['中文名', '保护等级', '发现次数']], use_container_width=True, hide_index=True)
            
            st.markdown("---")
            st.markdown("## 🏛️ 保护地分布")
            
            st.dataframe(areas_df[['名称', '生态类型', '物种数', '记录数']], use_container_width=True, hide_index=True)
            
            st.markdown("---")
            st.markdown("## 📈 保护建议")
            st.markdown("""
            1. 加强对国家一级保护物种（如丹顶鹤、白鹤）的监测力度
            2. 关注迁徙季节（4-5月、9-10月）的物种变化
            3. 优化湿地生态保护措施，改善鸟类栖息环境
            """)
            
            st.success("✅ 报告生成完成！")

if page == "🏠 首页":
    render_home()
elif page == "📊 数据概览":
    render_overview()
elif page == "🏛️ 保护地统计":
    render_protection_stats()
elif page == "🐦 鸟类查询":
    render_bird_query()
elif page == "📈 趋势分析":
    render_trend()
elif page == "📄 报告预览":
    render_report_preview()