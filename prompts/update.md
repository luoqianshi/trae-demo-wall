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
- 浏览量/点赞数变化的项目数量
- 新发现的候选帖子数量
- 新收录的作品数量
- 更新的分页文件数量
- 最终总作品数

**注意事项：**
- 增量爬虫会自动跳过已存在的新作品处理（通过 `src/data/index.json` 中的 ID 比对）
- **浏览量/点赞数全量同步**：爬虫在遍历论坛列表时，会即时更新所有已有项目的最新浏览量（`views`）和点赞数（`likes`）。即使没有新作品，只要浏览量/点赞数有变化，也会更新数据文件
- **仅写变更页优化**：爬虫采用"仅写变更页"策略，只重写内容实际发生变化的分页文件（如 views/likes 变化的项目所在页、新作品所在页），不会全量重写所有 page 文件。如果没有任何数据变化，不写任何文件直接退出
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

### Step 3.5: 数据质量检查与 404 修复（必须执行）

爬虫下载的 demo 文件可能存在 3 类 404 问题，必须在构建后、提交前执行检查和修复。

#### 3.5.1 检查 404 问题

运行以下 Python 脚本检查所有 `localPath` 指向的文件是否在磁盘上真实存在：

```python
#!/usr/bin/env python3
"""检查所有分页数据中 localPath 指向的文件是否存在"""
import json, os, glob

DEMO_DIR = "/workspace/trae-demo-wall/public/demos"
PAGES_DIR = "/workspace/trae-demo-wall/src/data/pages"

all_projects = []
for page_file in sorted(glob.glob(os.path.join(PAGES_DIR, "page-*.json"))):
    with open(page_file) as f:
        all_projects.extend(json.load(f)['projects'])

issues = []
for p in all_projects:
    pid, ptype, lp = p['id'], p.get('type', 'none'), p.get('localPath')
    if ptype != 'local' or not lp or not lp.startswith('./demos/'):
        continue
    disk_path = os.path.join(DEMO_DIR, lp[8:])
    is_bad = ('._' in lp or '__MACOSX' in lp or 'node_modules' in lp)
    has_backslash = '\\' in lp
    if is_bad or has_backslash or not os.path.exists(disk_path):
        issues.append((pid, lp, 'bad_entry' if is_bad else 'backslash' if has_backslash else 'missing'))

print(f"总项目: {len(all_projects)}, 404 问题: {len(issues)}")
for pid, lp, reason in issues:
    print(f"  [{reason}] {pid}: {lp}")
```

#### 3.5.2 修复 404 问题

如果检查发现问题，运行修复脚本（保存为 `/data/user/work/fix_404.py` 并执行）：

```python
#!/usr/bin/env python3
"""修复 404 问题：错误入口、反斜杠路径、无 HTML 项目"""
import json, os, glob, shutil

DEMO_DIR = "/workspace/trae-demo-wall/public/demos"
PAGES_DIR = "/workspace/trae-demo-wall/src/data/pages"

def find_best_html(topic_dir):
    """查找最佳 HTML 入口，跳过 __MACOSX, ._, node_modules"""
    candidates = []
    for root, dirs, files in os.walk(topic_dir):
        dirs[:] = [d for d in dirs if d not in ('__MACOSX', 'node_modules', '.git', 'dist')]
        for f in files:
            if f.endswith('.html') and not f.startswith('._'):
                rel = os.path.relpath(os.path.join(root, f), topic_dir)
                score = 100 if f == 'index.html' else 90 if f == 'demo.html' else 80 if 'index' in f.lower() else 70 if 'demo' in f.lower() else 50
                score -= rel.count(os.sep) * 5
                candidates.append((score, rel))
    if candidates:
        candidates.sort(key=lambda x: -x[0])
        return candidates[0][1]
    return None

def fix_backslash_files(topic_dir):
    """递归重命名反斜杠文件名为正斜杠目录结构"""
    fixed = 0
    for root, dirs, files in os.walk(topic_dir, topdown=False):
        for f in files:
            if '\\' in f:
                old_path = os.path.join(root, f)
                new_path = os.path.join(root, f.replace('\\', '/'))
                os.makedirs(os.path.dirname(new_path), exist_ok=True)
                shutil.move(old_path, new_path)
                fixed += 1
        for d in list(dirs):
            if '\\' in d:
                old_dir = os.path.join(root, d)
                new_dir = os.path.join(root, d.replace('\\', '/'))
                os.makedirs(os.path.dirname(new_dir), exist_ok=True)
                if os.path.exists(old_dir):
                    for item in os.listdir(old_dir):
                        shutil.move(os.path.join(old_dir, item), os.path.join(new_dir, item))
                    os.rmdir(old_dir)
                dirs.remove(d)
    return fixed

# 主流程
page_files = sorted(glob.glob(os.path.join(PAGES_DIR, "page-*.json")))
pages_data = {}
for pf in page_files:
    with open(pf) as f:
        pages_data[pf] = json.load(f)

all_projects = [p for page in pages_data.values() for p in page['projects']]
stats = {'bad_entry_fixed': 0, 'backslash_fixed': 0, 'none_marked': 0}

for p in all_projects:
    pid, ptype, lp = p['id'], p.get('type', 'none'), p.get('localPath')
    if ptype != 'local' or not lp or not lp.startswith('./demos/'):
        continue
    topic_name = lp[8:].split('/')[0]
    topic_dir = os.path.join(DEMO_DIR, topic_name)
    if not os.path.isdir(topic_dir):
        continue

    is_bad = ('._' in lp or '__MACOSX' in lp or 'node_modules' in lp)
    has_backslash = '\\' in lp
    disk_path = os.path.join(DEMO_DIR, lp[8:])

    if has_backslash:
        fixed = fix_backslash_files(topic_dir)
        if fixed: stats['backslash_fixed'] += 1

    if is_bad or not os.path.exists(disk_path):
        best = find_best_html(topic_dir)
        if best:
            p['localPath'] = f"./demos/{topic_name}/{best}"
            stats['bad_entry_fixed'] += 1
            print(f"  [FIXED] {pid}: {lp} -> {p['localPath']}")
        else:
            p['type'] = 'none'
            p['localPath'] = None
            stats['none_marked'] += 1
            print(f"  [NONE] {pid}: 无 HTML 文件")

for pf, page in pages_data.items():
    with open(pf, 'w', encoding='utf-8') as f:
        json.dump(page, f, ensure_ascii=False, indent=2)

# 同步到 public/data/pages
import shutil
public_pages = "/workspace/trae-demo-wall/public/data/pages"
if os.path.isdir(public_pages):
    for pf in page_files:
        shutil.copy2(pf, os.path.join(public_pages, os.path.basename(pf)))

print(f"\n修复统计: 入口修复={stats['bad_entry_fixed']}, 反斜杠={stats['backslash_fixed']}, 标记none={stats['none_marked']}")
```

#### 3.5.3 修复后重新构建

修复数据后需要重新执行构建：
```bash
cd /workspace/trae-demo-wall && npm run build
```

#### 3.5.4 三类 404 根因说明

| 问题类型 | 根因 | 影响 |
|---|---|---|
| macOS `.__MACOSX/._*.html` 被误选为入口 | 爬虫 `find_first_html_file()` 未排除 `._` 前缀文件和 `__MACOSX` 目录 | demo 打开后显示空白或乱码 |
| Windows ZIP 反斜杠路径 | `extractor.py` 的 `extractall()` 未规范化 `\` 分隔符，磁盘上文件名含 `\`，浏览器请求 `/` 版本时 404 | demo 打开后 404 |
| `node_modules` 深层 HTML 被选为入口 | `find_first_html_file()` 未排除 `node_modules` 目录 | demo 打开后显示框架内部页面而非实际 demo |
| 无有效 HTML 文件 | 项目只包含 `.bat`、`package.json` 等非 HTML 文件 | demo 打开后 404 |

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

### Step 5.5: 安全检查（必须执行，防止密钥泄露）

爬取的 demo 文件中可能包含作者硬编码的 API Key 等密钥。GitHub 的 Push Protection 会拦截包含密钥的推送。**必须在提交前执行以下清理操作**：

#### 5.5.1 检查 .env 文件

```bash
cd /workspace/trae-demo-wall
# 查找所有 .env 文件（排除 .env.example 模板文件）
find public/demos -name ".env" -not -name ".env.example" -type f
```

- 如果找到 `.env` 文件，检查内容是否包含真实密钥（如 `sk-xxx`、`api_key=xxx` 等）
- 包含真实密钥的 `.env` 文件必须删除：`rm <path>/.env`
- 包含占位符的 `.env` 文件（如 `YOUR_API_KEY`、`sk-your-api-key-here`）可以保留
- 删除所有遗留的 `.zip` 文件：`rm -f public/demos/*.zip`（这些文件在解压后不再需要）
- 确保 `.gitignore` 中包含 `.env` 规则

#### 5.5.2 扫描硬编码密钥（必须执行）

demo 的 HTML/JS 文件中可能直接硬编码了 API Key。使用以下命令扫描所有新增的 demo 文件：

```bash
cd /workspace/trae-demo-wall
# 扫描 DeepSeek API Key (sk- 开头的长字符串)
grep -rn 'sk-[a-zA-Z0-9]\{32,\}' public/demos/topic_*/ 2>/dev/null

# 扫描 OpenRouter API Key (sk-or-v1- 开头)
grep -rn 'sk-or-v1-[a-zA-Z0-9]\{20,\}' public/demos/topic_*/ 2>/dev/null

# 扫描 Google API Key (AIza 开头)
grep -rn 'AIza[a-zA-Z0-9_-]\{35\}' public/demos/topic_*/ 2>/dev/null

# 扫描通用 API Key 赋值
grep -rn 'api[_-]*key.*=.*["\x27][a-zA-Z0-9_-]\{20,\}' public/demos/topic_*/ 2>/dev/null
```

如果发现密钥，使用 `sed` 替换为占位符：
```bash
# 示例：替换 DeepSeek API Key
sed -i "s/sk-<实际密钥>/sk-YOUR_API_KEY_HERE/g" <文件路径>

# 示例：替换 OpenRouter API Key
sed -i "s/sk-or-v1-<实际密钥>/sk-or-v1-YOUR_API_KEY_HERE/g" <文件路径>
```

**常见密钥模式总结**：
| 密钥类型 | 特征前缀 | 替换占位符 |
|---|---|---|
| DeepSeek | `sk-` + 32位以上字符 | `sk-YOUR_API_KEY_HERE` |
| OpenRouter | `sk-or-v1-` + 20位以上字符 | `sk-or-v1-YOUR_API_KEY_HERE` |
| Google | `AIza` + 35位字符 | `AIzaYOUR_API_KEY_HERE` |
| 通用 | `api_key=...` | `api_key=YOUR_API_KEY_HERE` |

### Step 6: 提交并推送到 main 分支

#### 6.1 先提交数据文件（src/data 和 public/data）

```bash
cd /workspace/trae-demo-wall
git add src/data/ public/data/
git commit -m "data: incremental crawl update (+N new projects, total M)"
git push origin main
```

**将 `N` 替换为 Step 2 中新增作品数，`M` 替换为总作品数。** 例如：
```
data: incremental crawl update (+97 new projects, total 1290)
```

#### 6.2 再提交 demo 文件（分批推送）

demo 文件较多时，分批提交和推送可以避免 Push Protection 拦截时难以定位问题文件：

```bash
# 按 topic 编号范围分批添加
git add public/demos/topic_47[5-6]*/
git commit -m "feat: add new demo files batch 1"
git push origin main

git add public/demos/topic_47[7-8]*/
git commit -m "feat: add new demo files batch 2"
git push origin main

# 继续后续批次...
git add public/demos/topic_47[9]*/ public/demos/topic_48[0-3]*/
git commit -m "feat: add new demo files batch 3"
git push origin main
```

#### 6.3 如果 Push Protection 拦截推送

如果 `git push` 返回 `repository rule violations` 错误，说明某文件包含密钥。错误信息会指明具体文件路径和行号。处理方式：

1. 查看错误信息中的 `path` 和密钥类型
2. 使用 `sed` 替换密钥为占位符
3. `git add` 修改后的文件
4. `git commit --amend --no-edit` 更新提交
5. 重新 `git push origin main`

```bash
# 示例：清除 topic_XXXXX 中的密钥
sed -i "s/<实际密钥>/YOUR_API_KEY_HERE/g" public/demos/topic_XXXXX/*.html
git add public/demos/topic_XXXXX/
git commit --amend --no-edit
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

### Q8: git push 被拒绝，提示 `repository rule violations` / `Push Protection`
**处理**: demo 文件中包含硬编码的 API Key。错误信息会指明具体文件路径和密钥类型（如 OpenRouter API Key、DeepSeek API Key）。处理步骤：
1. 根据错误信息中的 `path` 定位文件
2. 使用 `sed -i "s/<密钥>/YOUR_API_KEY_HERE/g" <文件>` 替换密钥
3. `git add <文件>` && `git commit --amend --no-edit` && `git push origin main`
4. 如果一次推送的文件太多难以定位，改为分批推送（先推数据文件，再按 topic 编号范围分批推 demo 文件）

### Q9: git 中存在已跟踪的 `.pyc` 文件
**处理**: `.gitignore` 已包含 `*.pyc` 和 `__pycache__/`，但历史提交中可能仍有跟踪的 .pyc 文件。清理方法：
```bash
cd /workspace/trae-demo-wall
git rm -r --cached "**/*.pyc" "**/__pycache__/" 2>/dev/null
git commit -m "chore: remove tracked .pyc files"
git push origin main
```

### Q10: demo 打开后 404 — `localPath` 含反斜杠 `\`
**处理**: Windows 创建的 ZIP 使用 `\` 作为路径分隔符，Python 的 `extractall()` 在 Linux 上解压后文件名中保留 `\`，浏览器将 URL 中的 `\` 规范化为 `/` 后找不到文件。修复方法见 Step 3.5.2，核心逻辑是递归遍历 topic 目录，将所有含 `\` 的文件和目录重命名为 `/` 结构。

### Q11: demo 打开后显示空白或乱码 — `localPath` 指向 `__MACOSX/._*.html`
**处理**: macOS 打包 ZIP 时会生成 `__MACOSX/` 目录和 `._` 前缀的 AppleDouble 元数据文件，爬虫的 `find_first_html_file()` 误将这些文件选为 demo 入口。修复方法见 Step 3.5.2，重新查找正确 HTML 入口（跳过 `__MACOSX`、`._` 前缀、`node_modules`），优先选择 `index.html` / `demo.html`。

### Q12: demo 打开后显示框架内部页面 — `localPath` 深入 `node_modules/`
**处理**: 部分项目的 ZIP 包含 `node_modules` 目录，其中可能有框架自带的 HTML 文件（如 Playwright 的 `snapshot.html`），被误选为入口。修复方法同 Q11，`find_best_html()` 函数已排除 `node_modules` 目录。

### Q13: demo 打开后 404 — 项目无有效 HTML 文件
**处理**: 部分作品只包含 `.bat` 启动脚本、`package.json` 等非 HTML 文件，没有可在线预览的 demo。修复方法：将这类项目标记为 `type=none`，前端会自动隐藏"在线体验"按钮。Step 3.5.2 中的修复脚本会自动处理。

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
