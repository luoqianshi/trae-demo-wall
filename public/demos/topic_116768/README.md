# S3D建库数据自动生成软件 V3.0

## 交互演示
直接在浏览器中打开 `S3D建库数据自动生成软件_交互演示.html` 即可体验软件的完整交互流程。

## 完整运行
1. 安装Python 3.8+
2. 安装依赖: `pip install -r s3d_generator/requirements.txt`
3. 运行: `cd s3d_generator && python app.py`
4. 浏览器访问: http://127.0.0.1:5000

## 前置条件
- PostgreSQL数据库 s3d_codelists 已导入AllCodeLists数据
- 使用 allcodelists_to_postgres.py 导入数据

## 文件说明
- `S3D建库数据自动生成软件_交互演示.html` - 交互式HTML演示（无需安装，直接打开）
- `s3d_generator/` - 完整源代码
  - `app.py` - Flask Web后端
  - `material_spec_parser.py` - 材料等级表解析器
  - `s3d_data_generator.py` - S3D数据生成器
  - `code_lookup.py` - PostgreSQL代码查询引擎
  - `part_config_dialog.py` - 零件字段配置对话框
  - `config.py` - 全局配置
  - `templates/index.html` - Web前端页面
  - `static/css/style.css` - Web样式
  - `static/js/app.js` - Web前端逻辑
  - `CommodityType.json` - CommodityType映射
  - `SymbolDefinition.json` - SymbolDefinition映射
  - `EndStandard.json` - EndStandard映射
  - `user_part_config.json` - 用户保存的配置
