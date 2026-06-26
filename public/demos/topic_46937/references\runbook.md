# 商品手册流水线操作指南 (Pipeline Operations Runbook)

本指南面向开发人员与运营操作人员，详细说明如何使用 v2.2 自动生成决策系统及 v2.1 局部微调通道对商品手册进行日常构建与运维。

---

## 🚀 一、日常构建标准流程

### 1. 通用“一键式”生成（推荐）
在不需要手动干预决策时，请使用 `smart-generate` 动作。系统会自动判断是否需要全量生成、增量更新还是由于高风险变更中断：
```bash
python scripts/pipeline_engine.py --action smart-generate --target_dir "{商品物理目录}"
```
* **自动决策逻辑**：
  * **无变化**：系统优雅提示无变化并直接退出。
  * **首次生成**：自动调度完整的 `extract -> contact-sheet -> image-candidates -> part-skeletons -> assemble -> validate` 流程。
  * **安全增量**：自动调度 `extract --incremental` 仅提取新增物料，计算受影响小节，定向重跑 `image-snippet --limit_section`。
  * **高风险**：检测到有文件删除、大面积重命名或触碰人工锁章节时，强制停止，输出 `.scratch/reports/generate_decision_report.md`，等待人工决策。

### 2. 强制全量重建
若发生规则模板大版本变更、全局样式调整等，需要强制重跑全流程时，请追加 `--force-full` 标志：
```bash
python scripts/pipeline_engine.py --action smart-generate --target_dir "{商品物理目录}" --force-full
```

---

## 🔒 二、人工锁定保护机制 (Locks)

当运营或开发人员手动对某个小节内容做过深度润色和精简，且不希望后续任何自动提取或渲染将其静默覆盖时，必须立即启用锁定。

### 1. 物理锁定某一小节
例如，锁定“6.2 抖音策略”小节：
```bash
python scripts/pipeline_engine.py --action lock-section --target_dir "{商品物理目录}" --section "6.2 抖音策略" --reason "人工优化过抖音直播话术"
```
锁定信息将物理写入到 `.scratch/manual_locks.json` 中。

### 2. 物理解除锁定
当后续需要接受系统自动更新时，再进行解锁：
```bash
python scripts/pipeline_engine.py --action unlock-section --target_dir "{商品物理目录}" --section "6.2 抖音策略"
```

---

## 🛠️ 三、人工局部精准微调通道 (Patch)

若仅需对第 5 章图片排版块做微调，强烈建议使用 **局部 Patch 动作**，其速度快且自带安全性自动回滚防线。

### 1. 执行精准 Patch
准备好仅包含该小节 HTML 片段的补丁文件（例如 `patch.html`），运行：
```bash
python scripts/pipeline_engine.py --action patch-gallery --target_dir "{商品物理目录}" --section "5.1 颜色展示" --patch_file "C:/path/to/patch.html"
```
* **系统安全防线**：
  * 系统在执行注入前，会自动在 `.scratch/backups/` 目录下对受影响的文件进行物理级物理备份。
  * 自动进行 **HTML 标签平衡度校验**，如果发现未闭合标签，强行终止注入。
  * 注入完成后自动拉起 `validate`。若最终校验失败（如拼图比例校验未过），**秒级自动触发三级回滚**，恢复备份文件，保证生产线永不瘫痪。
