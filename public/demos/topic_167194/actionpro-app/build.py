#!/usr/bin/env python3
"""Build script to generate a single-file HTML version of the ActionPro app."""

import json
import base64
import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def main():
    # =========================================================================
    # 1. Read CSS
    # =========================================================================
    with open(os.path.join(BASE_DIR, 'assets', 'style.css'), 'r', encoding='utf-8') as f:
        css_content = f.read()

    # =========================================================================
    # 2. Read exercises.json and Base64-encode image files
    # =========================================================================
    with open(os.path.join(BASE_DIR, 'data', 'exercises.json'), 'r', encoding='utf-8') as f:
        exercises_data = json.load(f)

    for exercise in exercises_data['exercises']:
        if exercise['images'] is not None:
            for key in ['start', 'end']:
                img_rel_path = exercise['images'][key]
                img_abs_path = os.path.join(BASE_DIR, img_rel_path)
                if os.path.exists(img_abs_path):
                    with open(img_abs_path, 'rb') as f:
                        encoded = base64.b64encode(f.read()).decode('utf-8')
                        exercise['images'][key] = f'data:image/jpeg;base64,{encoded}'
                else:
                    print(f"Warning: Image not found: {img_abs_path}")

    exercises_json_str = json.dumps(exercises_data, ensure_ascii=False, indent=2)

    # =========================================================================
    # 3. Read JS files
    # =========================================================================
    with open(os.path.join(BASE_DIR, 'assets', 'storage.js'), 'r', encoding='utf-8') as f:
        storage_js = f.read()

    with open(os.path.join(BASE_DIR, 'assets', 'router.js'), 'r', encoding='utf-8') as f:
        router_js = f.read()

    with open(os.path.join(BASE_DIR, 'assets', 'app.js'), 'r', encoding='utf-8') as f:
        app_js = f.read()

    # =========================================================================
    # 4. Replace router.js with hash-based routing version
    # =========================================================================
    router_js = """const Router = {
  getParam(key) {
    const hash = window.location.hash.slice(1);
    const qIndex = hash.indexOf('?');
    if (qIndex < 0) return null;
    const params = new URLSearchParams(hash.slice(qIndex + 1));
    return params.get(key);
  },
  navigate(page, params) {
    let hash = '#' + page;
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      hash += '?' + queryString;
    }
    window.location.hash = hash;
  },
  getCurrentPage() {
    const hash = window.location.hash.slice(1) || 'index';
    const qIndex = hash.indexOf('?');
    return qIndex >= 0 ? hash.slice(0, qIndex) : hash;
  }
};"""

    # =========================================================================
    # 5. Modify app.js
    # =========================================================================

    # 5a. Replace loadData() — remove fetch, use inline EXERCISES_DATA variable
    app_js = app_js.replace(
        """  async loadData() {
    try {
      const response = await fetch('data/exercises.json');
      if (!response.ok) throw new Error('Failed to load');
      this.data = await response.json();
    } catch (e) {
      const main = document.querySelector('.main-content');
      if (main) {
        main.innerHTML = '<div class="empty-state"><h3>数据加载失败</h3><p>请刷新页面重试</p></div>';
      }
    }
  },""",
        """  loadData() {
    this.data = EXERCISES_DATA;
  },"""
    )

    # 5b. Replace init() — make synchronous, add hashchange listener, set _mainEl
    app_js = app_js.replace(
        """  async init() {
    await this.loadData();
    this.renderNavbar();
    this.initPage();
  },""",
        """  init() {
    this.loadData();
    this.renderNavbar();
    this._mainEl = document.getElementsByClassName('main-content')[0];
    this.initPage();
    window.addEventListener('hashchange', () => {
      this.renderNavbar();
      this.initPage();
    });
  },"""
    )

    # 5d. Replace all document.querySelector('.main-content') with this._mainEl
    app_js = app_js.replace(
        "document.querySelector('.main-content')",
        "this._mainEl"
    )

    # 5e. Update navbar nav items to use hash-based hrefs
    app_js = app_js.replace(
        """      { id: 'index', label: '首页', href: 'index.html' },
      { id: 'library', label: '动作库', href: 'library.html' },
      { id: 'combos', label: '组合', href: 'combos.html' },
      { id: 'upload', label: '上传动作', href: 'upload.html' }""",
        """      { id: 'index', label: '首页', href: '#index' },
      { id: 'library', label: '动作库', href: '#library' },
      { id: 'combos', label: '组合', href: '#combos' },
      { id: 'upload', label: '上传动作', href: '#upload' }"""
    )

    # 5f. Update navbar brand link
    app_js = app_js.replace(
        '<a href="index.html">ActionPro</a>',
        '<a href="#index">ActionPro</a>'
    )

    # 5g. Replace all href="xxx.html" patterns in template strings with hash-based links
    app_js = re.sub(r'href="index\.html"', 'href="#index"', app_js)
    app_js = re.sub(r'href="library\.html"', 'href="#library"', app_js)
    app_js = re.sub(r'href="combos\.html"', 'href="#combos"', app_js)
    app_js = re.sub(r'href="combo-detail\.html\?id=', 'href="#combo-detail?id=', app_js)
    app_js = re.sub(r'href="detail\.html\?id=', 'href="#detail?id=', app_js)

    # 5h. Replace DOMContentLoaded with a more reliable init call
    app_js = app_js.replace(
        """document.addEventListener('DOMContentLoaded', () => {
  App.init();
});""",
        """if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}"""
    )

    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ActionPro - AI 智能健身动作库</title>
  <style>
{css_content}
  </style>
</head>
<body>
  <nav class="navbar"></nav>
  <main class="main-content"></main>
  <script>
const EXERCISES_DATA = {exercises_json_str};
  </script>
  <script>
{router_js}
  </script>
  <script>
{storage_js}
  </script>
  <script>
{app_js}
  </script>
</body>
</html>"""

    # =========================================================================
    # 7. Write output file
    # =========================================================================
    output_path = os.path.join(BASE_DIR, 'actionpro.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

    file_size = os.path.getsize(output_path)
    print(f"Build complete! Output: {output_path}")
    print(f"File size: {file_size:,} bytes ({file_size / 1024 / 1024:.2f} MB)")


if __name__ == '__main__':
    main()
