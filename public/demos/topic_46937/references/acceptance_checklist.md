# 真实商品手册验收标准 (Acceptance Checklist)

本核对清单旨在为生产手册提供客观、严密的真实验收物理依据。任何交付给客户的商品手册物理文件，必须通过以下全部验收红线。

---

## 🛡️ 一、系统与编译性验收红线

- [ ] **1. 全链路无阻断生成**：系统必须能完全执行 `assemble` 成功，物理输出目标 `.md` 文件，全动作无未捕获崩溃或严重异常中断。
- [ ] **2. 多阶段校验 100% 绿灯**：
  - [ ] `validate-plan` 诊断无 P0/P1 级报错。
  - [ ] `validate-parts` 诊断无 P0/P1 级报错。
  - [ ] `validate` 最终校验无 P0/P1 级报错，`latest_validation_report.json` 的 `conclusion` 必须为 `"pass"`。
- [ ] **3. 图像片段引用源合规**：手册中第五章（颜色、棚拍、外景、搭配）的全部图片引用路径，必须真实来源于 `image-snippet` 动作处理并保存在 `自动生成素材/` 目录下的缩略图（`.snippet.jpg` / `.snippet.png`），禁止直接引入原始庞大物料。
- [ ] **4. 敏感与受保护路径“零污染”**：最终交付的 Markdown 手册文件中，绝不允许包含任何指向 `.scratch/`、`temp/`、`.uploads/`、`.trae/` 以及其他非公开临时物理路径的文本。

---

## 🔒 二、增量、热更新与安全防线验收

- [ ] **5. 六维 Delta 识别率 100%**：运行 `diff-assets` 时，新增的文件必须准确归入 `added`，删除归入 `removed`，修改归入 `modified`，唯一的物理移动/重命名归入 `renamed_or_moved` 且成功继承分析属性，重复文件归入 `duplicates`。
- [ ] **6. 人工锁章节“绝不污染”**：对于在 `manual_locks.json` 中锁定的章节，运行增量更新、`patch-gallery` 或全量更新时，其内容绝对不能被系统静默篡改或回滚到自动骨架。
- [ ] **7. 自动生成决策精确性**：`smart-generate` 探测到的决策必须与真实的物理变动状态 100% 一致。如果目录无变化必须判定为 `no_change`；在有安全增量时必须判定为 `incremental_update`；存在物理删除、锁定冲突时必须强行升轨为 `needs_review` 阻断。
- [ ] **8. 完备的审计链**：所有涉及 `lock`、`unlock`、`patch-gallery` 等手动修改和重大生成决策，必须准确写入 `manual_edits_log.jsonl` 中，日志无漏记、错记。
