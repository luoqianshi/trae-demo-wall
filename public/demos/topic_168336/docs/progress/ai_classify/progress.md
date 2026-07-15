# AI 智能分类模块 - 进度跟踪

## 功能描述
- 基于 TF-IDF + DBSCAN 的文件自动分类
- 文件内容特征提取
- 分类结果自动生成虚拟目录

## 进度状态：✅ 后端完成，待前端完善

### 已完成功能
- [x] TF-IDF 特征提取（char_wb ngram 分析，500 特征）
- [x] DBSCAN 聚类算法（cosine 距离，可配置 eps/min_samples）
- [x] 分类结果 → 虚拟目录自动映射
- [x] 后端 Tauri 命令接口（classify_files, get_classification_results）
- [x] 降级方案：无 sklearn 时按扩展名分组
- [x] 50+ 扩展名映射到有意义的类别名称
- [x] 命令行 JSON 输入输出接口

### 待完成功能
- [ ] 前端分类按钮和结果展示
- [ ] 分类参数配置界面

### 技术方案
- Python 服务实现核心算法，通过 subprocess 调用
- 临时文件 JSON 传递输入输出
- 环境变量 `AI_FILEMANAGER_PYTHON` 可指定 Python 路径
- 分类结果自动创建 AI 虚拟目录并关联文件