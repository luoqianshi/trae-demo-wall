# product-digital-handbook Skill

## 商品数字身份手册生成技能

### 功能说明
本 Skill 用于自动生成服装/配饰商品的数字身份手册，输出标准双端文件：
- {SKU}.md：纯净 Markdown 内容源
- {SKU}.html：精美 HTML 视觉成品

### 安装方式
1. 下载 product-digital-handbook-skill.zip 并解压
2. 将解压后的 product-digital-handbook 文件夹放入 TRAE 的 Skill 目录
3. 重启 TRAE，即可在 Skill 列表中找到本技能

### 使用方法
1. 准备好商品素材目录（含图片、描述文档等）
2. 在 TRAE 中调用本 Skill
3. 输入商品目录路径
4. Skill 自动完成：素材扫描 → 内容生成 → 双端输出

### 目录结构
`
product-digital-handbook/
├── SKILL.md           # Skill 核心定义文件
├── README.md          # 说明文档
├── AGENTS.md         # Agent 使用指南
├── MEMORY.md         # 记忆配置
├── VERSION           # 版本号
├── requirements.txt  # Python 依赖
├── scripts/          # 核心脚本
│   ├── pipeline_engine.py    # 主管道引擎
│   └── ...
└── references/       # 模板和规范
    ├── clean_md_template.md  # 内容骨架模板
    └── ...
`

### 版本信息
当前版本：v2.4+
