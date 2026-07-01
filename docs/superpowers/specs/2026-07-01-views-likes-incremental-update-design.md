# 增量爬虫浏览量/点赞数全量更新优化

## 背景

`incremental_scraper.py` 每次运行时需要同步所有已有作品的最新浏览量（`views`）和点赞数（`likes`）。当前实现存在两个性能瓶颈：

1. **无新作品时直接退出**（第250行 `if not new_web_topics: return`），导致 views/likes 永不更新
2. **82 个 page-*.json 文件全量重写**（4.7 MB I/O），即使只有 1 个项目的 views/likes 发生变化

## 目标

- 每次运行爬虫都同步所有已有作品的 views/likes
- 仅重写内容实际发生变化的 page 文件，将 I/O 从 83 次文件写入降至个位数
- 无数据变化时不写任何文件

## 设计

### 变更追踪机制

引入 `changed_page_nums: set[int]` 集合，记录哪些页码的内容发生了变化。

**触发变更的三种场景：**

1. **已有项目 views/likes 变化**：Step 1 每获取一页列表后，立即更新内存中已有项目的 views/likes。对比旧值，若不同则标记该项目的 `page_num` 为变更。
2. **新作品收录**：Step 2 处理新作品后，新作品被分配到某个 page，该 page_num 标记为变更。
3. **404 修复导致 localPath 变化**：Step 3 修复 404 入口后，相关项目的 page_num 标记为变更。

### 核心修改点

**移除提前退出**（第250行）：
- 删除 `if not new_web_topics: return`
- 改为：即使没有新作品，也执行列表获取和 views/likes 同步
- 最终若 `changed_page_nums` 为空，跳过文件写入直接退出

**views/likes 即时更新**（Step 1 列表获取阶段）：
- 在 `fetch_topic_list(page)` 返回后（第222行之后），立即遍历该页的帖子列表，更新内存中已有项目的 views/likes
- 若值发生变化，计算该项目的 `page_num`，加入 `changed_page_nums`
- 计算 `page_num` 的方式：`page_num = project_index // ITEMS_PER_PAGE + 1`

**文件写入优化**（Step 4）：
- 只删除并重写 `changed_page_nums` 中的 page 文件
- `index.json` 始终重写（因为它包含所有项目的摘要，变更检测收益不大）
- 未变更的 page 文件保持原样不动

### 需要保留的已有项目索引

为了在 Step 1 快速查找已有项目及其当前 views/likes，需要构建：
```python
# id -> {project, page_num, old_views, old_likes}
existing_index = {}
for i, p in enumerate(all_projects):
    existing_index[p['id']] = {
        'project': p,
        'page_num': i // ITEMS_PER_PAGE + 1,
        'old_views': p.get('views', 0),
        'old_likes': p.get('likes', 0),
    }
```

### 不变更的情况

以下情况**不触发** page 文件重写：
- views 和 likes 值均未变化的项目
- 该 page 内没有任何项目发生变化
- 所有已有项目的 views/likes 都未变化且无新作品

## 不涉及的范围

- 论坛 API 请求策略不变（仍分页获取，30条/页）
- 新作品的详情获取、ZIP 下载、解压逻辑不变
- fix_data.py、404 修复脚本不变
- 前端展示逻辑不变

## 验证标准

1. 运行爬虫后，index.json 中所有项目的 views/likes 都是最新的
2. 仅内容变化的 page 文件被重写（通过 `git diff --stat` 验证）
3. 无任何项目数据变化时，不产生 page 文件变更
4. 新项目仍然被正确收录
