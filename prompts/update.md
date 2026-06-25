# TRAE Demo Wall 数据更新操作指南

> 本提示词用于指导 TRAE Work 自动执行 TRAE Demo Wall 项目的数据增量更新、构建、提交和部署全流程。请严格按照以下步骤执行，不要跳过任何步骤，不要自行添加额外操作。

---

## 项目信息

- **项目路径**: `/workspace/trae-demo-wall`（如路径不同，请先确认项目根目录位置）
- **项目类型**: Vue 3 + Vite + TailwindCSS 静态网站
- **部署方式**: 推送到 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages
- **在线地址**: https://luoqianshi.github.io/trae-demo-wall/
- **GitHub 仓库**: https://github.com/luoqianshi/trae-demo-wall

---

## 执行步骤

请**严格按照顺序**执行以下所有步骤。每完成一个步骤后，再进入下一个步骤。

### Step 1: 确认项目环境

```bash
cd /workspace/trae-demo-wall
```

1. 确认 `crawler/incremental_scraper.py` 文件存在
2. 确认 `package.json` 中的 build 脚本为：`rm -rf public/data && cp -r src/data public/data && cp -r demos public/demos-showcase 2>/dev/null || true; vite build`
3. 确认 Node.js 和 Python 3 可用：
   ```bash
   node --version
   python3 --version
   ```
4. 安装 Python 爬虫依赖（如果尚未安装）：
   ```bash
   pip install requests beautifulsoup4 lxml --break-system-packages -q
   ```
5. 安装前端依赖（如果 `node_modules` 不存在）：
   ```bash
   npm install
   ```

### Step 2: 运行增量爬虫

**重要：必须使用增量爬虫 `incremental_scraper.py`，不要使用全量爬虫 `scraper.py`。**

```bash
cd /workspace/trae-demo-wall/crawler && python3 incremental_scraper.py
```

等待爬虫完成。爬虫输出会显示：
- 已有项目数量
- 遍历的帖子数量
- 新发现的候选帖子数量
- 新收录的作品数量
- 最终总作品数

**注意事项：**
- 增量爬虫会自动跳过已存在的项目（通过 `src/data/index.json` 中的 ID 比对）
- 爬虫会自动更新已有项目的浏览量和点赞数
- 爬虫会下载 ZIP/HTML 附件到 `public/demos/` 目录
- 如果某个附件下载失败（超时、CRC 错误、非 ZIP 文件等），爬虫会打印 WARN 并跳过，**这是正常行为，不要中断**
- 爬虫运行时间约 5-15 分钟（取决于新帖数量），请耐心等待完成
- 不要使用 `Ctrl+C` 中断爬虫

爬虫完成后，记录以下数据（用于 Step 5 更新 README）：
- 新增作品数（输出中 "新收录 X 个作品"）
- 总作品数（输出中 "总作品数: X 个"）

### Step 3: 构建前端

回到项目根目录，执行构建：

```bash
cd /workspace/trae-demo-wall && npm run build
```

构建成功的标志是输出 `✓ built in Xs`，且没有 Error。

**验证构建产物**（必须执行）：
```bash
cat /workspace/trae-demo-wall/dist/data/index.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'构建验证: totalProjects={d[\"totalProjects\"]}')"
```

输出的 `totalProjects` 必须与 Step 2 中爬虫报告的总作品数一致。如果不一致，说明 `public/data` 没有被正确覆盖，执行以下修复：
```bash
cd /workspace/trae-demo-wall && rm -rf public/data && cp -r src/data public/data && rm -rf dist && npm run build
```

### Step 4: 检查 Git 状态

```bash
cd /workspace/trae-demo-wall && git status
```

确认有以下类型的文件变更：
- `src/data/index.json`（索引数据）
- `src/data/pages/page-*.json`（分页数据，可能有新增或更新）
- `public/demos/topic_*/`（新下载的 Demo 文件）
- `public/data/`（复制后的数据，不应提交到 git——检查 `.gitignore` 是否忽略了 `public/data`）

**重要：不要提交 `dist/` 目录**，GitHub Actions 会自动构建。确认 `.gitignore` 包含 `dist`。

### Step 5: 更新 README.md（仅在数据有显著变化时）

如果本次更新新增了 **10 个以上** 新作品，检查 `README.md` 中是否需要更新统计数字。当前 README 中不包含硬编码的作品数量，一般情况下**不需要修改 README.md**。

但如果项目发生了以下变化，则需要更新 README：
- 新增了重要功能特性
- 技术栈变更
- Demo Gallery 中新增了演示文件
- 部署地址变更

如果无需更新，跳过此步骤。

### Step 6: 提交并推送到 main 分支

```bash
cd /workspace/trae-demo-wall
git add -A
git commit -m "data: incremental crawl update (+N new projects, total M)"
```

**将 `N` 替换为 Step 2 中新增作品数，`M` 替换为总作品数。** 例如：
```
data: incremental crawl update (+170 new projects, total 1034)
```

然后推送：
```bash
git push origin main
```

### Step 7: 验证部署

推送后，GitHub Actions 会自动触发构建部署（通常 2-5 分钟完成）。可以通过以下命令检查状态：

```bash
curl -s "https://api.github.com/repos/luoqianshi/trae-demo-wall/actions/runs?per_page=1" | python3 -c "
import json,sys
data=json.load(sys.stdin)
run=data['workflow_runs'][0]
print(f'Action: {run[\"name\"]}')
print(f'Status: {run[\"status\"]}')
print(f'Conclusion: {run[\"conclusion\"] or \"running\"}')
"
```

等待状态变为 `completed` + `success` 后，验证线上数据：

```bash
sleep 30
curl -s "https://luoqianshi.github.io/trae-demo-wall/data/index.json?v=$(date +%s)" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'线上验证: totalProjects={d[\"totalProjects\"]}, updatedAt={d[\"updatedAt\"]}')"
```

如果线上数据总数与 Step 3 构建验证的数字一致，说明部署成功。

---

## 常见问题处理

### Q1: 爬虫运行中出现 `[WARN] 下载/解压失败`
**处理**: 正常现象，部分作品的附件损坏或非标准格式，直接跳过即可，不要中断爬虫。

### Q2: 爬虫运行中出现 `[SKIP]` 错误
**处理**: 正常现象，帖子详情 API 请求失败（可能被限流），跳过该帖继续。

### Q3: npm install 或 npm run build 失败
**处理**: 先删除 `node_modules` 和 `package-lock.json`，重新安装：
```bash
cd /workspace/trae-demo-wall && rm -rf node_modules package-lock.json && npm install
```

### Q4: git push 被拒绝（rejected）
**处理**: 先 pull 再 push：
```bash
cd /workspace/trae-demo-wall && git pull --rebase origin main && git push origin main
```

### Q5: GitHub Pages 显示旧数据
**处理**: 前端已添加 `?v=${Date.now()}` 缓存破坏参数，正常情况下 5 分钟内会自动更新。如果超过 10 分钟仍未更新，检查 GitHub Actions 是否成功完成。

### Q6: 爬虫发现 0 个新作品
**处理**: 说明没有新作品发布，这是正常情况。此时仍然正常执行 Step 3-6（构建和推送），因为浏览量和点赞数可能已更新。提交信息改为：
```
data: sync views/likes, no new projects
```

### Q7: `public/data` 中存在 `data/data/` 嵌套目录
**处理**: 这是历史遗留问题，构建前执行 `rm -rf public/data && cp -r src/data public/data` 即可修复，build 脚本中已包含此操作。

---

## 禁止事项

1. **不要**使用全量爬虫 `scraper.py`，它会重新下载所有数据，非常耗时
2. **不要**手动修改 `src/data/` 下的 JSON 文件
3. **不要**提交 `dist/` 目录到 git
4. **不要**提交 `node_modules/` 到 git
5. **不要**修改前端代码或配置文件（除非用户明确要求）
6. **不要**中断正在运行的爬虫（除非出现致命错误导致程序崩溃）
7. **不要**使用 `git push --force`，正常推送即可

---

## 完成标准

全部步骤完成后，向用户报告：
1. 本次新增作品数量
2. 当前总作品数量
3. GitHub Actions 部署状态
4. 线上数据验证结果
