// 全局变量
let database = { entries: [] };
let currentEntry = null;
let settings = {
    repositoryFolder: ''
};
let repositoryHandle = null;
let currentDatabaseFile = null; // 当前加载的数据库文件句柄
let currentDatabaseFileName = null; // 当前加载的数据库文件名

// 文献类型常量
const ENTRY_TYPES = {
  journal: '期刊论文 [J]',
  book: '图书 [M]',
  conference: '会议论文 [C]',
  thesis: '学位论文 [D]',
  other: '其他'
};

// 默认条目模板
const DEFAULT_ENTRY_TEMPLATE = {
  id: '',
  type: 'journal',
  authors: '',
  title: '',
  journal: '',
  year: '',
  volume: '',
  issue: '',
  pages: '',
  publisher: '',
  location: '',
  doi: '',
  raw: '',
  tags: [],
  createdAt: null,
  updatedAt: null,
  migrated: false
};

// 将旧格式条目（含 original/correct）迁移为新格式结构化条目（幂等）
function normalizeEntry(rawEntry) {
    if (!rawEntry) return rawEntry;

    // 幂等：已是新格式（有 raw 字段且有 type 字段），直接返回
    if (rawEntry.raw !== undefined && rawEntry.type !== undefined) {
        return rawEntry;
    }

    // 旧格式 -> 新格式迁移
    const now = Date.now();
    const normalized = {
        id: rawEntry.id || generateId(),
        type: 'other',
        authors: '',
        title: '',
        journal: '',
        year: '',
        volume: '',
        issue: '',
        pages: '',
        publisher: '',
        location: '',
        doi: '',
        raw: rawEntry.original || '',
        tags: Array.isArray(rawEntry.tags) ? rawEntry.tags : [],
        createdAt: now,
        updatedAt: now,
        migrated: true
    };

    // 保留 original/correct 字段以向后兼容
    if (rawEntry.original !== undefined) {
        normalized.original = rawEntry.original;
    }
    if (rawEntry.correct !== undefined) {
        normalized.correct = rawEntry.correct;
    }

    return normalized;
}

// DOM 元素
const elements = {
    // 导航
    navImport: document.getElementById('nav-import'),
    navExport: document.getElementById('nav-export'),
    navDatabase: document.getElementById('nav-database'),
    
    // 面板
    panelImport: document.getElementById('panel-import'),
    panelExport: document.getElementById('panel-export'),
    panelDatabase: document.getElementById('panel-database'),
    
    // 导入功能
    importText: document.getElementById('import-text'),
    btnParseImport: document.getElementById('btn-parse-import'),
    importResult: document.getElementById('import-result'),
    importBibtexFile: document.getElementById('import-bibtex-file'),
    btnImportBibtex: document.getElementById('btn-import-bibtex'),
    
    // 导出功能
    exportText: document.getElementById('export-text'),
    exportFormat: document.getElementById('export-format'),
    btnProcessExport: document.getElementById('btn-process-export'),
    exportResult: document.getElementById('export-result'),
    exportAlert: document.getElementById('export-alert'),
    btnCopyResult: document.getElementById('btn-copy-result'),
    
    // 数据库管理
    databaseList: document.getElementById('database-list'),
    searchEntry: document.getElementById('search-entry'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    btnAddEntry: document.getElementById('btn-add-entry'),
    btnSaveDatabase: document.getElementById('btn-save-database'),
    btnLoadDatabase: document.getElementById('btn-load-database'),
    databaseDetails: document.getElementById('database-details'),
    
    // 模态框
    entryModal: document.getElementById('entry-modal'),
    modalTitle: document.getElementById('modal-title'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCancelModal: document.getElementById('btn-cancel-modal'),
    btnSaveModal: document.getElementById('btn-save-modal'),
    entryId: document.getElementById('entry-id'),
    entryType: document.getElementById('entry-type'),
    entryAuthors: document.getElementById('entry-authors'),
    entryTitle: document.getElementById('entry-title'),
    entryJournal: document.getElementById('entry-journal'),
    entryYear: document.getElementById('entry-year'),
    entryVolume: document.getElementById('entry-volume'),
    entryIssue: document.getElementById('entry-issue'),
    entryPages: document.getElementById('entry-pages'),
    entryPublisher: document.getElementById('entry-publisher'),
    entryLocation: document.getElementById('entry-location'),
    entryDoi: document.getElementById('entry-doi'),
    entryRaw: document.getElementById('entry-raw'),
    entryTags: document.getElementById('entry-tags'),
    btnFetchDoi: document.getElementById('btn-fetch-doi'),
    
    // 状态栏
    statusBar: document.getElementById('status-bar'),
    
    // 设置
    navSettings: document.getElementById('nav-settings'),
    panelSettings: document.getElementById('panel-settings'),
    repositoryFolder: document.getElementById('repository-folder'),
    btnSelectRepository: document.getElementById('btn-select-repository'),
    repositoryFiles: document.getElementById('repository-files'),
    btnSaveSettings: document.getElementById('btn-save-settings')
};

// 初始化
function init() {
    // 绑定事件监听器
    bindEventListeners();
    
    // 加载设置
    loadSettings();
    
    // 更新数据库列表
    updateDatabaseList();
}

// 绑定事件监听器
function bindEventListeners() {
    // 导航切换
    elements.navImport.addEventListener('click', () => switchPanel('import'));
    elements.navExport.addEventListener('click', () => switchPanel('export'));
    elements.navDatabase.addEventListener('click', () => switchPanel('database'));
    elements.navSettings.addEventListener('click', () => switchPanel('settings'));
    
    // 导入功能
    elements.btnParseImport.addEventListener('click', parseImport);
    if (elements.btnImportBibtex) {
        elements.btnImportBibtex.addEventListener('click', parseBibtexImport);
    }
    
    // 导出功能
    elements.btnProcessExport.addEventListener('click', processExport);
    elements.btnCopyResult.addEventListener('click', copyResult);
    
    // 数据库管理
    elements.searchEntry.addEventListener('input', filterDatabaseList);
    elements.btnClearSearch.addEventListener('click', () => {
        elements.searchEntry.value = '';
        filterDatabaseList();
    });
    elements.btnAddEntry.addEventListener('click', openAddEntryModal);
    elements.btnSaveDatabase.addEventListener('click', saveDatabase);
    elements.btnLoadDatabase.addEventListener('click', loadDatabase);
    
    // 模态框
    elements.btnCloseModal.addEventListener('click', closeModal);
    elements.btnCancelModal.addEventListener('click', closeModal);
    elements.btnSaveModal.addEventListener('click', saveEntry);
    
    // 点击模态框外部关闭
    elements.entryModal.addEventListener('click', (e) => {
        if (e.target === elements.entryModal) {
            closeModal();
        }
    });
    
    // DOI 自动获取
    elements.btnFetchDoi.addEventListener('click', fetchDoiMetadata);
    
    // 设置功能
    elements.btnSelectRepository.addEventListener('click', selectRepositoryFolder);
    elements.btnSaveSettings.addEventListener('click', saveUserSettings);
}

// 切换面板
function switchPanel(panelName) {
    // 隐藏所有面板
    elements.panelImport.classList.add('hidden');
    elements.panelExport.classList.add('hidden');
    elements.panelDatabase.classList.add('hidden');
    elements.panelSettings.classList.add('hidden');
    
    // 重置导航样式
    elements.navImport.classList.remove('text-primary', 'border-b-2', 'border-primary');
    elements.navImport.classList.add('text-secondary', 'hover:text-primary');
    elements.navExport.classList.remove('text-primary', 'border-b-2', 'border-primary');
    elements.navExport.classList.add('text-secondary', 'hover:text-primary');
    elements.navDatabase.classList.remove('text-primary', 'border-b-2', 'border-primary');
    elements.navDatabase.classList.add('text-secondary', 'hover:text-primary');
    elements.navSettings.classList.remove('text-primary', 'border-b-2', 'border-primary');
    elements.navSettings.classList.add('text-secondary', 'hover:text-primary');
    
    // 显示选中的面板
    switch (panelName) {
        case 'import':
            elements.panelImport.classList.remove('hidden');
            elements.navImport.classList.remove('text-secondary', 'hover:text-primary');
            elements.navImport.classList.add('text-primary', 'border-b-2', 'border-primary');
            break;
        case 'export':
            elements.panelExport.classList.remove('hidden');
            elements.navExport.classList.remove('text-secondary', 'hover:text-primary');
            elements.navExport.classList.add('text-primary', 'border-b-2', 'border-primary');
            break;
        case 'database':
            elements.panelDatabase.classList.remove('hidden');
            elements.navDatabase.classList.remove('text-secondary', 'hover:text-primary');
            elements.navDatabase.classList.add('text-primary', 'border-b-2', 'border-primary');
            break;
        case 'settings':
            elements.panelSettings.classList.remove('hidden');
            elements.navSettings.classList.remove('text-secondary', 'hover:text-primary');
            elements.navSettings.classList.add('text-primary', 'border-b-2', 'border-primary');
            // 更新设置面板
            updateSettingsPanel();
            break;
    }
}

// 解析导入文本
function parseImport() {
    const text = elements.importText.value.trim();
    if (!text) {
        showStatus('请输入bibliography文本', 'error');
        return;
    }
    if (text.length > 50000) {
        showStatus('文本过长（超过 5 万字符），请分批处理或减少条目数', 'error');
        return;
    }

    try {
        // 拆分条目
        const entries = text.split('\n').filter(line => line.trim());
        const parsedEntries = [];

        entries.forEach(line => {
            // 提取编号和内容
            const match = line.match(/^\[(\d+)\]\s*(.+)$/);
            if (match) {
                const original = match[2].trim();
                parsedEntries.push(original);
            }
        });

        if (parsedEntries.length === 0) {
            showStatus('未找到有效的参考文献条目', 'error');
            return;
        }

        // 添加到数据库（去重）
        let addedCount = 0;
        let existingCount = 0;

        parsedEntries.forEach(original => {
            // 检查是否已存在（基于 raw 或 title 字段去重）
            const exists = database.entries.some(entry => entry.raw === original || entry.title === original);
            if (!exists) {
                const now = Date.now();
                const newEntry = {
                    id: generateId(),
                    type: 'other',
                    authors: '',
                    title: '',
                    journal: '',
                    year: '',
                    volume: '',
                    issue: '',
                    pages: '',
                    publisher: '',
                    location: '',
                    doi: '',
                    raw: original,
                    tags: [],
                    createdAt: now,
                    updatedAt: now,
                    migrated: false
                };
                database.entries.push(newEntry);
                addedCount++;
            } else {
                existingCount++;
            }
        });

        // 保存到本地存储
        saveDatabaseToLocalStorage();

        // 更新数据库列表
        updateDatabaseList();

        // 显示结果
        elements.importResult.innerHTML = `
            <div class="bg-green-50 text-green-700 p-3 rounded-md">
                <p>成功解析 ${parsedEntries.length} 个条目</p>
                <p>添加了 ${addedCount} 个新条目</p>
                <p>跳过了 ${existingCount} 个已存在的条目</p>
            </div>
        `;
        elements.importResult.classList.remove('hidden');

        showStatus(`成功导入 ${addedCount} 个新条目`, 'success');
    } catch (error) {
        console.error('parseImport 失败:', error);
        showStatus('导入失败：' + (error.message || '未知错误'), 'error');
    }
}

// 处理导出（Task 3.4 重写：使用 findBestMatch 模糊匹配 + formatEntry 多格式输出）
function processExport() {
    if (!database.entries || database.entries.length === 0) {
        showStatus('数据库为空，请先导入或添加文献条目', 'error');
        return;
    }

    const text = elements.exportText.value.trim();
    if (!text) {
        showStatus('请输入bibliography文本', 'error');
        return;
    }
    if (text.length > 50000) {
        showStatus('文本过长（超过 5 万字符），请分批处理或减少条目数', 'error');
        return;
    }

    try {
        // 读取导出格式（防御性访问，Task 4 创建的元素可能不存在时回退默认值）
        const format = elements.exportFormat?.value || 'gb7714';

        // 拆分条目
        const lines = text.split('\n').filter(line => line.trim());
        const processedLines = [];
        const weakMatchIndices = [];
        const notFoundIndices = [];

        lines.forEach(line => {
            // 提取编号和内容
            const match = line.match(/^\[(\d+)\]\s*(.+)$/);
            if (match) {
                const indexNum = parseInt(match[1]);
                const content = match[2].trim();

                // 调用模糊匹配算法查找最佳匹配
                const matchResult = findBestMatch(content, database.entries);

                switch (matchResult.matchType) {
                    case 'exact':
                    case 'strong':
                        processedLines.push(`[${indexNum}] ${formatEntry(matchResult.entry, format)}`);
                        break;
                    case 'weak':
                        processedLines.push(`[${indexNum}] ${formatEntry(matchResult.entry, format)} ⚠ 待确认`);
                        weakMatchIndices.push(indexNum);
                        break;
                    case 'none':
                    default:
                        processedLines.push(`[${indexNum}] ${content}`);
                        notFoundIndices.push(indexNum);
                        break;
                }
            } else {
                processedLines.push(line);
            }
        });

        // 生成结果文本
        let result = processedLines.join('\n');

        // 在导出结果底部追加汇总
        const summary = [];
        if (weakMatchIndices.length > 0) {
            summary.push(`⚠ 以下条目为弱匹配，请人工核对：${weakMatchIndices.map(i => `[${i}]`).join(', ')}`);
        }
        if (notFoundIndices.length > 0) {
            summary.push(`❌ 以下条目数据库未匹配：${notFoundIndices.map(i => `[${i}]`).join(', ')}`);
        }
        if (summary.length > 0) {
            result += '\n\n' + summary.join('\n');
        }

        elements.exportResult.value = result;

        // 显示导出提示：弱匹配或未匹配时显示橙色提示，全部精确匹配则隐藏
        if (weakMatchIndices.length > 0 || notFoundIndices.length > 0) {
            const alerts = [];
            if (weakMatchIndices.length > 0) {
                alerts.push(`⚠ 弱匹配 ${weakMatchIndices.length} 条：${weakMatchIndices.map(i => `[${i}]`).join(', ')}`);
            }
            if (notFoundIndices.length > 0) {
                alerts.push(`❌ 未匹配 ${notFoundIndices.length} 条：${notFoundIndices.map(i => `[${i}]`).join(', ')}`);
            }
            elements.exportAlert.innerHTML = alerts.join('<br>');
            elements.exportAlert.classList.remove('hidden');
        } else {
            elements.exportAlert.classList.add('hidden');
        }

        showStatus('处理完成', 'success');
    } catch (error) {
        console.error('processExport 失败:', error);
        showStatus('处理失败：' + (error.message || '未知错误'), 'error');
    }
}

// 复制结果
function copyResult() {
    const result = elements.exportResult.value;
    if (!result) {
        showStatus('没有可复制的内容', 'error');
        return;
    }
    
    navigator.clipboard.writeText(result)
        .then(() => {
            // 改变按钮文本
            const originalText = elements.btnCopyResult.innerHTML;
            elements.btnCopyResult.innerHTML = '<i class="fa fa-check mr-1"></i> 复制成功';
            elements.btnCopyResult.classList.remove('bg-accent');
            elements.btnCopyResult.classList.add('bg-green-600');
            
            // 3秒后恢复原始文本
            setTimeout(() => {
                elements.btnCopyResult.innerHTML = originalText;
                elements.btnCopyResult.classList.remove('bg-green-600');
                elements.btnCopyResult.classList.add('bg-accent');
            }, 3000);
            
            showStatus('已成功复制到剪贴板', 'success');
        })
        .catch(err => {
            showStatus('复制失败，请手动复制', 'error');
            console.error('复制失败:', err);
        });
}

// 更新数据库列表
function updateDatabaseList() {
    if (!database.entries || !Array.isArray(database.entries)) {
        database.entries = [];
    }
    if (database.entries.length === 0) {
        elements.databaseList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                数据库为空，请先导入参考文献
            </div>
        `;
        return;
    }
    
    // 应用搜索过滤（同时匹配 raw、title、authors、journal、tags）
    const searchTerm = elements.searchEntry.value.toLowerCase().trim();
    const filteredEntries = database.entries.filter(entry => {
        const raw = (entry.raw || entry.original || '').toLowerCase();
        const title = (entry.title || '').toLowerCase();
        const authors = (entry.authors || '').toLowerCase();
        const journal = (entry.journal || entry.publisher || '').toLowerCase();
        const tags = Array.isArray(entry.tags) ? entry.tags : [];
        return raw.includes(searchTerm) ||
               title.includes(searchTerm) ||
               authors.includes(searchTerm) ||
               journal.includes(searchTerm) ||
               tags.some(tag => tag.toLowerCase().includes(searchTerm));
    });

    if (filteredEntries.length === 0) {
        elements.databaseList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                没有找到匹配的条目
            </div>
        `;
        return;
    }

    // 生成列表（优先显示 title，否则截取 raw 前 50 字符）
    elements.databaseList.innerHTML = filteredEntries.map(entry => {
        const rawText = entry.raw || entry.original || '';
        const displayText = entry.title || rawText.substring(0, 50);
        const showEllipsis = !entry.title && rawText.length > 50;
        const tagsArr = Array.isArray(entry.tags) ? entry.tags : [];
        return `
        <div class="border-b border-gray-200 py-2 hover:bg-gray-50 cursor-pointer entry-item" data-id="${entry.id}">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <p class="text-sm font-medium text-neutral-dark truncate">${displayText}${showEllipsis ? '...' : ''}</p>
                    <p class="text-xs text-gray-500 mt-1">${tagsArr.length > 0 ? `标签: ${tagsArr.join(', ')}` : '无标签'}</p>
                </div>
                <div class="flex space-x-2">
                    <button class="text-primary hover:text-blue-600 edit-entry" data-id="${entry.id}">
                        <i class="fa fa-pencil"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700 delete-entry" data-id="${entry.id}">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
    
    // 绑定列表项事件
    document.querySelectorAll('.entry-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                const id = item.dataset.id;
                selectEntry(id);
            }
        });
    });
    
    // 绑定编辑按钮事件
    document.querySelectorAll('.edit-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            openEditEntryModal(id);
        });
    });
    
    // 绑定删除按钮事件
    document.querySelectorAll('.delete-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            deleteEntry(id);
        });
    });
}

// 过滤数据库列表
function filterDatabaseList() {
    updateDatabaseList();
}

// 格式化引用细节：返回类似 "2025, 46(8): 183-200" 的字符串（缺失字段优雅降级）
function formatCitationDetail(entry) {
    const year = (entry.year || '').trim();
    const volume = (entry.volume || '').trim();
    const issue = (entry.issue || '').trim();
    const pages = (entry.pages || '').trim();

    let volIssueStr = '';
    if (volume && issue) {
        volIssueStr = `${volume}(${issue})`;
    } else if (volume) {
        volIssueStr = volume;
    } else if (issue) {
        volIssueStr = `(${issue})`;
    }

    const parts = [];
    if (year) parts.push(year);
    if (volIssueStr) parts.push(volIssueStr);

    let result = parts.join(', ');
    if (pages) {
        result = result ? `${result}: ${pages}` : pages;
    }

    return result || '未填写';
}

// ============ Task 3: 模糊匹配算法 ============

// SubTask 3.1: 字符串归一化
// 处理：全角转半角 -> 转小写 -> 去标点 -> 压缩空白
function normalizeString(str) {
    if (!str) return '';
    let result = String(str);
    // 全角字符转半角（数字、字母、标点等）
    result = result.replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
    // 全角空格转普通空格
    result = result.replace(/\u3000/g, ' ');
    // 转小写
    result = result.toLowerCase();
    // 去除所有标点符号（保留字母、数字、汉字、连字符、空格）
    result = result.replace(/[^\p{L}\p{N}\s\-]/gu, '');
    // 压缩多余空白为单个空格并去除首尾空白
    result = result.replace(/\s+/g, ' ').trim();
    return result;
}

// SubTask 3.2: Levenshtein 编辑距离（经典动态规划）
function levenshteinDistance(a, b) {
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;
    // 优化：长度差过大直接返回较大值，避免无意义计算
    if (Math.abs(a.length - b.length) > 10) {
        return Math.max(a.length, b.length);
    }
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }
    return dp[m][n];
}

// SubTask 3.3: 查找最佳匹配
// 优先级：DOI精确 -> 标题归一化强匹配 -> Levenshtein弱匹配 -> 无匹配
function findBestMatch(inputText, entries) {
    if (!inputText || !entries || !Array.isArray(entries) || entries.length === 0) {
        return { matchType: 'none', entry: null, distance: -1 };
    }

    // 1. DOI 精确匹配
    const doiMatch = inputText.match(/10\.\d{4,9}\/[-._;()\/:A-Z0-9]+/i);
    if (doiMatch) {
        const inputDoi = doiMatch[0].toLowerCase().replace(/^https?:\/\/doi\.org\//i, '');
        for (const entry of entries) {
            if (entry.doi) {
                const entryDoi = String(entry.doi).toLowerCase().replace(/^https?:\/\/doi\.org\//i, '');
                if (inputDoi === entryDoi) {
                    return { matchType: 'exact', entry, distance: 0 };
                }
            }
        }
    }

    // 2. 标题归一化强匹配（同时比较 title 和 raw）
    const normalizedInput = normalizeString(inputText);
    for (const entry of entries) {
        const normalizedTitle = normalizeString(entry.title || '');
        if (normalizedTitle && normalizedInput === normalizedTitle) {
            return { matchType: 'strong', entry, distance: 0 };
        }
        const normalizedRaw = normalizeString(entry.raw || '');
        if (normalizedRaw && normalizedInput === normalizedRaw) {
            return { matchType: 'strong', entry, distance: 0 };
        }
    }

    // 3. Levenshtein 弱匹配（取 title 和 raw 中的最小距离）
    let bestEntry = null;
    let bestDistance = Infinity;
    for (const entry of entries) {
        const normalizedTitle = normalizeString(entry.title || '');
        if (normalizedTitle) {
            const dist = levenshteinDistance(normalizedInput, normalizedTitle);
            if (dist < bestDistance) {
                bestDistance = dist;
                bestEntry = entry;
            }
        }
        const normalizedRaw = normalizeString(entry.raw || '');
        if (normalizedRaw) {
            const dist = levenshteinDistance(normalizedInput, normalizedRaw);
            if (dist < bestDistance) {
                bestDistance = dist;
                bestEntry = entry;
            }
        }
    }

    if (bestEntry && bestDistance <= 3) {
        return { matchType: 'weak', entry: bestEntry, distance: bestDistance };
    }

    // 4. 无匹配
    return { matchType: 'none', entry: null, distance: -1 };
}

// ============ Task 4: 多格式输出 ============

// SubTask 4.1: GB/T 7714-2015
function formatGB7714(entry) {
    const e = {
        authors: (entry.authors || '').trim(),
        title: (entry.title || '').trim(),
        journal: (entry.journal || '').trim(),
        year: (entry.year || '').trim(),
        volume: (entry.volume || '').trim(),
        issue: (entry.issue || '').trim(),
        pages: (entry.pages || '').trim(),
        publisher: (entry.publisher || '').trim(),
        location: (entry.location || '').trim(),
        type: entry.type || 'other'
    };

    switch (e.type) {
        case 'journal': {
            // {authors}. {title}[J]. {journal}, {year}, {volume}({issue}): {pages}.
            let parts = [];
            if (e.authors) parts.push(e.authors);
            if (e.title) parts.push(e.title + '[J]');

            let volIssue = '';
            if (e.volume && e.issue) volIssue = `${e.volume}(${e.issue})`;
            else if (e.volume) volIssue = e.volume;
            else if (e.issue) volIssue = `(${e.issue})`;

            let tail = '';
            if (volIssue) {
                const yearVol = [];
                if (e.year) yearVol.push(e.year);
                yearVol.push(volIssue);
                tail = yearVol.join(', ');
                if (e.pages) tail = tail ? `${tail}: ${e.pages}` : e.pages;
            } else {
                if (e.year && e.pages) {
                    tail = `${e.year}: ${e.pages}`;
                } else if (e.year) {
                    tail = e.year;
                } else if (e.pages) {
                    tail = e.pages;
                }
            }

            if (e.journal && tail) {
                parts.push(`${e.journal}, ${tail}`);
            } else if (e.journal) {
                parts.push(e.journal);
            } else if (tail) {
                parts.push(tail);
            }

            const result = parts.join('. ');
            return result ? result + '.' : '';
        }
        case 'book': {
            // {authors}. {title}[M]. {location}: {publisher}, {year}: {pages}.
            let parts = [];
            if (e.authors) parts.push(e.authors);
            if (e.title) parts.push(e.title + '[M]');

            let pubPart = '';
            if (e.location && e.publisher) {
                pubPart = `${e.location}: ${e.publisher}`;
            } else if (e.location) {
                pubPart = e.location;
            } else if (e.publisher) {
                pubPart = e.publisher;
            }

            let yearPages = '';
            if (e.year && e.pages) {
                yearPages = `${e.year}: ${e.pages}`;
            } else if (e.year) {
                yearPages = e.year;
            } else if (e.pages) {
                yearPages = e.pages;
            }

            if (pubPart && yearPages) {
                parts.push(`${pubPart}, ${yearPages}`);
            } else if (pubPart) {
                parts.push(pubPart);
            } else if (yearPages) {
                parts.push(yearPages);
            }

            const result = parts.join('. ');
            return result ? result + '.' : '';
        }
        case 'conference': {
            // {authors}. {title}[C]//{journal}. {location}: {publisher}, {year}: {pages}.
            let parts = [];
            if (e.authors) parts.push(e.authors);

            if (e.title || e.journal) {
                let titleConf = '';
                if (e.title) titleConf = e.title + '[C]';
                else titleConf = '[C]';
                if (e.journal) titleConf += '//' + e.journal;
                parts.push(titleConf);
            }

            let pubPart = '';
            if (e.location && e.publisher) {
                pubPart = `${e.location}: ${e.publisher}`;
            } else if (e.location) {
                pubPart = e.location;
            } else if (e.publisher) {
                pubPart = e.publisher;
            }

            let yearPages = '';
            if (e.year && e.pages) {
                yearPages = `${e.year}: ${e.pages}`;
            } else if (e.year) {
                yearPages = e.year;
            } else if (e.pages) {
                yearPages = e.pages;
            }

            if (pubPart && yearPages) {
                parts.push(`${pubPart}, ${yearPages}`);
            } else if (pubPart) {
                parts.push(pubPart);
            } else if (yearPages) {
                parts.push(yearPages);
            }

            const result = parts.join('. ');
            return result ? result + '.' : '';
        }
        case 'thesis': {
            // {authors}. {title}[D]. {location}: {journal}, {year}.
            let parts = [];
            if (e.authors) parts.push(e.authors);
            if (e.title) parts.push(e.title + '[D]');

            let locJournal = '';
            if (e.location && e.journal) {
                locJournal = `${e.location}: ${e.journal}`;
            } else if (e.location) {
                locJournal = e.location;
            } else if (e.journal) {
                locJournal = e.journal;
            }

            if (locJournal && e.year) {
                parts.push(`${locJournal}, ${e.year}`);
            } else if (locJournal) {
                parts.push(locJournal);
            } else if (e.year) {
                parts.push(e.year);
            }

            const result = parts.join('. ');
            return result ? result + '.' : '';
        }
        case 'other':
        default: {
            // {authors}. {title}. {journal}, {year}.
            let parts = [];
            if (e.authors) parts.push(e.authors);
            if (e.title) parts.push(e.title);

            const detail = [];
            if (e.journal) detail.push(e.journal);
            if (e.year) detail.push(e.year);
            if (detail.length > 0) parts.push(detail.join(', '));

            const result = parts.join('. ');
            return result ? result + '.' : '';
        }
    }
}

// SubTask 4.2: APA 第 7 版
function formatAPA(entry) {
    const e = {
        authors: (entry.authors || '').trim(),
        title: (entry.title || '').trim(),
        journal: (entry.journal || '').trim(),
        year: (entry.year || '').trim(),
        volume: (entry.volume || '').trim(),
        issue: (entry.issue || '').trim(),
        pages: (entry.pages || '').trim(),
        publisher: (entry.publisher || '').trim(),
        location: (entry.location || '').trim(),
        type: entry.type || 'other'
    };

    const yearStr = e.year ? `(${e.year})` : '';

    switch (e.type) {
        case 'journal': {
            // {authors} ({year}). {title}. {journal}, {volume}({issue}), {pages}.
            const parts = [];
            if (e.authors) parts.push(e.authors);
            if (yearStr) parts.push(yearStr);
            if (e.title) parts.push(e.title);

            const detail = [];
            if (e.journal) detail.push(e.journal);
            if (e.volume && e.issue) detail.push(`${e.volume}(${e.issue})`);
            else if (e.volume) detail.push(e.volume);
            else if (e.issue) detail.push(`(${e.issue})`);
            if (e.pages) detail.push(e.pages);
            if (detail.length > 0) parts.push(detail.join(', '));

            const result = parts.join('. ');
            return result ? result + '.' : '';
        }
        case 'book': {
            // {authors} ({year}). {title}. {publisher}.
            const parts = [];
            if (e.authors) parts.push(e.authors);
            if (yearStr) parts.push(yearStr);
            if (e.title) parts.push(e.title);
            if (e.publisher) parts.push(e.publisher);

            const result = parts.join('. ');
            return result ? result + '.' : '';
        }
        case 'conference': {
            // {authors} ({year}). {title}. In {conference} (pp. {pages}). {publisher}.
            const parts = [];
            if (e.authors) parts.push(e.authors);
            if (yearStr) parts.push(yearStr);
            if (e.title) parts.push(e.title);

            let inPart = '';
            if (e.journal) inPart = `In ${e.journal}`;
            if (e.pages) {
                inPart = inPart ? `${inPart} (pp. ${e.pages})` : `(pp. ${e.pages})`;
            }
            if (inPart) parts.push(inPart);
            if (e.publisher) parts.push(e.publisher);

            const result = parts.join('. ');
            return result ? result + '.' : '';
        }
        case 'thesis': {
            // {authors} ({year}). {title} [Doctoral dissertation, {journal}].
            const parts = [];
            if (e.authors) parts.push(e.authors);
            if (yearStr) parts.push(yearStr);

            if (e.title) {
                let titlePart = e.title;
                if (e.journal) titlePart += ` [Doctoral dissertation, ${e.journal}]`;
                parts.push(titlePart);
            } else if (e.journal) {
                parts.push(`[Doctoral dissertation, ${e.journal}]`);
            }

            const result = parts.join('. ');
            return result ? result + '.' : '';
        }
        case 'other':
        default: {
            const parts = [];
            if (e.authors) parts.push(e.authors);
            if (yearStr) parts.push(yearStr);
            if (e.title) parts.push(e.title);

            const detail = [];
            if (e.journal) detail.push(e.journal);
            if (e.pages) detail.push(e.pages);
            if (detail.length > 0) parts.push(detail.join(', '));

            const result = parts.join('. ');
            return result ? result + '.' : '';
        }
    }
}

// SubTask 4.3: MLA 第 9 版
function formatMLA(entry) {
    const e = {
        authors: (entry.authors || '').trim(),
        title: (entry.title || '').trim(),
        journal: (entry.journal || '').trim(),
        year: (entry.year || '').trim(),
        volume: (entry.volume || '').trim(),
        issue: (entry.issue || '').trim(),
        pages: (entry.pages || '').trim(),
        publisher: (entry.publisher || '').trim(),
        location: (entry.location || '').trim(),
        type: entry.type || 'other'
    };

    switch (e.type) {
        case 'journal': {
            // {authors}. "{title}." {journal}, vol. {volume}, no. {issue}, {year}, pp. {pages}.
            const segments = [];
            if (e.authors) segments.push(e.authors + '.');
            if (e.title) segments.push(`"${e.title}."`);

            const detail = [];
            if (e.journal) detail.push(e.journal);
            if (e.volume) detail.push(`vol. ${e.volume}`);
            if (e.issue) detail.push(`no. ${e.issue}`);
            if (e.year) detail.push(e.year);
            if (e.pages) detail.push(`pp. ${e.pages}`);
            if (detail.length > 0) segments.push(detail.join(', ') + '.');

            return segments.join(' ').trim();
        }
        case 'book': {
            // {authors}. {title}. {publisher}, {year}.
            const segments = [];
            if (e.authors) segments.push(e.authors + '.');
            if (e.title) segments.push(e.title + '.');

            const detail = [];
            if (e.publisher) detail.push(e.publisher);
            if (e.year) detail.push(e.year);
            if (detail.length > 0) segments.push(detail.join(', ') + '.');

            return segments.join(' ').trim();
        }
        case 'conference': {
            // {authors}. "{title}." {journal}, {year}, pp. {pages}.
            const segments = [];
            if (e.authors) segments.push(e.authors + '.');
            if (e.title) segments.push(`"${e.title}."`);

            const detail = [];
            if (e.journal) detail.push(e.journal);
            if (e.year) detail.push(e.year);
            if (e.pages) detail.push(`pp. ${e.pages}`);
            if (detail.length > 0) segments.push(detail.join(', ') + '.');

            return segments.join(' ').trim();
        }
        case 'thesis': {
            // {authors}. {title}. {year}. {journal}, Dissertation.
            const segments = [];
            if (e.authors) segments.push(e.authors + '.');
            if (e.title) segments.push(e.title + '.');
            if (e.year) segments.push(e.year + '.');

            const detail = [];
            if (e.journal) detail.push(e.journal);
            detail.push('Dissertation');
            segments.push(detail.join(', ') + '.');

            return segments.join(' ').trim();
        }
        case 'other':
        default: {
            const segments = [];
            if (e.authors) segments.push(e.authors + '.');
            if (e.title) segments.push(e.title + '.');

            const detail = [];
            if (e.journal) detail.push(e.journal);
            if (e.year) detail.push(e.year);
            if (detail.length > 0) segments.push(detail.join(', ') + '.');

            return segments.join(' ').trim();
        }
    }
}

// SubTask 4.4: IEEE
function formatIEEE(entry) {
    const e = {
        authors: (entry.authors || '').trim(),
        title: (entry.title || '').trim(),
        journal: (entry.journal || '').trim(),
        year: (entry.year || '').trim(),
        volume: (entry.volume || '').trim(),
        issue: (entry.issue || '').trim(),
        pages: (entry.pages || '').trim(),
        publisher: (entry.publisher || '').trim(),
        location: (entry.location || '').trim(),
        type: entry.type || 'other'
    };

    switch (e.type) {
        case 'journal': {
            // {authors}, "{title}," {journal}, vol. {volume}, no. {issue}, pp. {pages}, {year}.
            let result = '';
            if (e.authors) result += e.authors + ', ';
            if (e.title) result += `"${e.title}," `;

            const detail = [];
            if (e.journal) detail.push(e.journal);
            if (e.volume) detail.push(`vol. ${e.volume}`);
            if (e.issue) detail.push(`no. ${e.issue}`);
            if (e.pages) detail.push(`pp. ${e.pages}`);
            if (e.year) detail.push(e.year);

            result += detail.join(', ');
            result = result.trim();
            if (result && !result.endsWith('.')) result += '.';
            return result;
        }
        case 'book': {
            // {authors}, {title}. {location}: {publisher}, {year}.
            let result = '';
            if (e.authors) result += e.authors + ', ';
            if (e.title) result += e.title + '. ';

            let pubPart = '';
            if (e.location && e.publisher) {
                pubPart = `${e.location}: ${e.publisher}`;
            } else if (e.location) {
                pubPart = e.location;
            } else if (e.publisher) {
                pubPart = e.publisher;
            }

            if (pubPart && e.year) {
                result += `${pubPart}, ${e.year}`;
            } else if (pubPart) {
                result += pubPart;
            } else if (e.year) {
                result += e.year;
            }

            result = result.trim();
            if (result && !result.endsWith('.')) result += '.';
            return result;
        }
        case 'conference': {
            // {authors}, "{title}," in {journal}, {year}, pp. {pages}.
            let result = '';
            if (e.authors) result += e.authors + ', ';
            if (e.title) result += `"${e.title}," `;

            const detail = [];
            if (e.journal) detail.push(`in ${e.journal}`);
            if (e.year) detail.push(e.year);
            if (e.pages) detail.push(`pp. ${e.pages}`);

            result += detail.join(', ');
            result = result.trim();
            if (result && !result.endsWith('.')) result += '.';
            return result;
        }
        case 'thesis': {
            // {authors}, "{title}," {journal}, {year}.
            let result = '';
            if (e.authors) result += e.authors + ', ';
            if (e.title) result += `"${e.title}," `;

            const detail = [];
            if (e.journal) detail.push(e.journal);
            if (e.year) detail.push(e.year);

            result += detail.join(', ');
            result = result.trim();
            if (result && !result.endsWith('.')) result += '.';
            return result;
        }
        case 'other':
        default: {
            let result = '';
            if (e.authors) result += e.authors + ', ';
            if (e.title) result += `"${e.title}," `;

            const detail = [];
            if (e.journal) detail.push(e.journal);
            if (e.year) detail.push(e.year);

            result += detail.join(', ');
            result = result.trim();
            if (result && !result.endsWith('.')) result += '.';
            return result;
        }
    }
}

// SubTask 4.5: 格式调度函数
function formatEntry(entry, format) {
    if (!entry) return '';
    const fmt = format || 'gb7714';
    switch (fmt) {
        case 'gb7714':
            return formatGB7714(entry);
        case 'apa':
            return formatAPA(entry);
        case 'mla':
            return formatMLA(entry);
        case 'ieee':
            return formatIEEE(entry);
        default:
            return formatGB7714(entry);
    }
}

// ============ Task 6: BibTeX 批量导入 ============

// SubTask 6.1: 解析 BibTeX 文本
// 输出：[{type, citationKey, fields: {key: value}}]
function parseBibTeX(text) {
    if (!text || typeof text !== 'string') return [];

    try {
        const entries = [];
        // 正则提取条目：@type{key, fields}
        const entryRegex = /@(\w+)\s*\{\s*([^,]+),\s*([\s\S]*?)\n\}/g;
        let entryMatch;

        while ((entryMatch = entryRegex.exec(text)) !== null) {
            try {
                const type = entryMatch[1].toLowerCase();
                const citationKey = entryMatch[2].trim();
                const fieldsText = entryMatch[3];

                // 跳过非文献条目
                if (type === 'comment' || type === 'string' || type === 'preamble') {
                    continue;
                }

                // 解析字段：key = {value}
                const fields = {};
                const fieldRegex = /(\w+)\s*=\s*\{([^}]*)\}/g;
                let fieldMatch;
                while ((fieldMatch = fieldRegex.exec(fieldsText)) !== null) {
                    const key = fieldMatch[1].toLowerCase();
                    // 去除字段值中的多余空白和换行
                    const value = fieldMatch[2].replace(/\s+/g, ' ').trim();
                    fields[key] = value;
                }

                entries.push({ type, citationKey, fields });
            } catch (err) {
                // 单个条目解析失败跳过，不影响其他条目
                console.error('BibTeX 条目解析失败:', err);
                continue;
            }
        }

        return entries;
    } catch (error) {
        console.warn('BibTeX 解析异常:', error);
        return [];
    }
}

// SubTask 6.2: BibTeX 条目映射为结构化条目
// 输出不含 id/createdAt/updatedAt，由调用方补充
function mapBibTexToEntry(bibEntry) {
    const typeMap = {
        'article': 'journal',
        'book': 'book',
        'inbook': 'book',
        'inproceedings': 'conference',
        'conference': 'conference',
        'proceedings': 'conference',
        'phdthesis': 'thesis',
        'mastersthesis': 'thesis',
        'techreport': 'other',
        'misc': 'other',
        'unpublished': 'other',
        'manual': 'book'
    };

    const type = typeMap[bibEntry.type] || 'other';
    const fields = bibEntry.fields || {};

    // 作者：BibTeX 多作者用 ' and ' 分隔，转换为逗号分隔
    let authors = '';
    if (fields.author) {
        authors = fields.author.replace(/\s+and\s+/g, ', ').trim();
    }

    // 标题：去除两端 {}
    let title = (fields.title || '').trim();
    if (title.startsWith('{') && title.endsWith('}')) {
        title = title.slice(1, -1).trim();
    }

    // 期刊/会议名：journal 或 booktitle
    const journal = (fields.journal || fields.booktitle || '').trim();

    // 页码：BibTeX 用 -- 表示范围，转换为 -
    let pages = (fields.pages || '').trim();
    pages = pages.replace(/--/g, '-');

    return {
        type: type,
        authors: authors,
        title: title,
        journal: journal,
        year: (fields.year || '').trim(),
        volume: (fields.volume || '').trim(),
        issue: (fields.number || '').trim(),
        pages: pages,
        publisher: (fields.publisher || '').trim(),
        location: (fields.address || '').trim(),
        doi: (fields.doi || '').trim(),
        raw: '',
        tags: [],
        migrated: false
    };
}

// SubTask 6.4 + 6.5: BibTeX 文件导入（异步函数，由 btnImportBibtex 触发）
async function parseBibtexImport() {
    const file = elements.importBibtexFile?.files?.[0];
    if (!file) {
        showStatus('请选择 BibTeX 文件', 'error');
        return;
    }

    try {
        // 读取文件文本
        let text;
        try {
            text = await file.text();
        } catch (err) {
            console.error('文件读取失败:', err);
            showStatus('文件读取失败，请重试', 'error');
            return;
        }

        // 解析 BibTeX
        let bibEntries;
        try {
            bibEntries = parseBibTeX(text);
        } catch (err) {
            console.error('BibTeX 解析失败:', err);
            showStatus('BibTeX 解析失败', 'error');
            return;
        }

        // 容错：解析 0 条
        if (bibEntries.length === 0) {
            showStatus('未在文件中找到有效的 BibTeX 条目', 'error');
            return;
        }

        // 映射并去重后加入 database
        let addedCount = 0;
        let skippedCount = 0;

        bibEntries.forEach(bibEntry => {
            try {
                const newEntry = mapBibTexToEntry(bibEntry);
                // 去重：基于 DOI 或 title+year 组合去重
                const newTitleNorm = normalizeString(newEntry.title || '');
                const newDoi = (newEntry.doi || '').toLowerCase().trim();
                const newYear = (newEntry.year || '').trim();
                const exists = database.entries.some(existing => {
                    // DOI 去重
                    if (newDoi && existing.doi && existing.doi.toLowerCase().trim() === newDoi) {
                        return true;
                    }
                    // title+year 组合去重
                    if (newTitleNorm && newYear) {
                        return normalizeString(existing.title || '') === newTitleNorm &&
                               (existing.year || '').trim() === newYear;
                    }
                    // 仅 title 去重（year 缺失时回退）
                    if (newTitleNorm) {
                        return normalizeString(existing.title || '') === newTitleNorm;
                    }
                    return false;
                });
                if (!exists) {
                    newEntry.id = generateId();
                    newEntry.createdAt = Date.now();
                    newEntry.updatedAt = Date.now();
                    database.entries.push(newEntry);
                    addedCount++;
                } else {
                    skippedCount++;
                }
            } catch (err) {
                console.error('条目映射失败:', err);
                skippedCount++;
            }
        });

        // 保存到本地存储
        saveDatabaseToLocalStorage();

        // 更新数据库列表
        updateDatabaseList();

        // 显示结果（部分失败汇总）
        let resultHtml = '';
        if (addedCount > 0) {
            resultHtml += `<p class="text-green-700">成功导入 ${addedCount} 条</p>`;
        }
        if (skippedCount > 0) {
            resultHtml += `<p class="text-yellow-700">跳过 ${skippedCount} 条（已存在或格式错误）</p>`;
        }
        elements.importResult.innerHTML = `<div class="bg-green-50 p-3 rounded-md">${resultHtml}</div>`;
        elements.importResult.classList.remove('hidden');

        // 清空文件输入，允许重新选择同一文件
        elements.importBibtexFile.value = '';

        showStatus(`成功导入 ${addedCount} 条，跳过 ${skippedCount} 条`, addedCount > 0 ? 'success' : 'info');
    } catch (error) {
        console.error('parseBibtexImport 失败:', error);
        showStatus('BibTeX 导入失败：' + (error.message || '未知错误'), 'error');
    }
}

// ============ Task 5: DOI 自动校验（CrossRef API） ============

// SubTask 5.1: 通过 DOI 从 CrossRef API 获取元数据
// 输入：DOI 字符串（可能含 https://doi.org/ 前缀或 doi: 前缀）
// 输出：CrossRef API 返回的 message 字段内容
async function fetchByDOI(doi) {
    // 去除 DOI 前缀
    const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:/i, '').trim();
    const url = `https://api.crossref.org/works/${cleanDoi}?mailto=trae-competition@example.com`;

    // 使用 AbortController 实现 10 秒超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.message;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// SubTask 5.2: 将 CrossRef 返回的 message 对象映射为结构化条目
function mapCrossRefToEntry(crossrefData) {
    if (!crossrefData) return {};

    // 类型映射
    const typeMap = {
        'journal-article': 'journal',
        'book': 'book',
        'book-chapter': 'book',
        'monograph': 'book',
        'proceedings-article': 'conference',
        'conference-paper': 'conference',
        'dissertation': 'thesis'
    };
    const type = typeMap[crossrefData.type] || 'other';

    // 作者数组转换：[{family, given}] -> 'Smith J, Wang Ming'
    // 组织作者（含 name 字段）直接使用
    let authors = '';
    const authorArr = crossrefData.author;
    if (Array.isArray(authorArr) && authorArr.length > 0) {
        authors = authorArr.map(a => {
            if (a.name) return a.name;
            const family = a.family || '';
            const given = a.given || '';
            return `${family} ${given}`.trim();
        }).filter(s => s).join(', ');
    }

    // 标题
    const title = (crossrefData.title?.[0] ?? '').trim();

    // 期刊/容器名
    const journal = (crossrefData['container-title']?.[0] ?? '').trim();

    // 年份：优先 print，回退 online
    const printYear = crossrefData['published-print']?.['date-parts']?.[0]?.[0];
    const onlineYear = crossrefData['published-online']?.['date-parts']?.[0]?.[0];
    const yearRaw = printYear ?? onlineYear ?? '';
    const year = yearRaw ? String(yearRaw) : '';

    // 卷、期、页码、出版社、出版地、DOI
    const volume = crossrefData.volume ?? '';
    const issue = crossrefData['journal-issue']?.issue ?? '';
    const pages = crossrefData.page ?? '';
    const publisher = crossrefData.publisher ?? '';
    const location = crossrefData['publisher-location'] ?? '';
    const doi = crossrefData.DOI ?? '';

    return {
        type: type,
        authors: authors,
        title: title,
        journal: journal,
        year: year,
        volume: volume,
        issue: issue,
        pages: pages,
        publisher: publisher,
        location: location,
        doi: doi
    };
}

// SubTask 5.4 + 5.5: 点击按钮获取 DOI 元数据并填充模态框
async function fetchDoiMetadata() {
    const doi = elements.entryDoi.value.trim();
    if (!doi) {
        showStatus('请先输入 DOI', 'error');
        return;
    }

    // 改变按钮为加载状态
    const originalText = elements.btnFetchDoi.innerHTML;
    elements.btnFetchDoi.disabled = true;
    elements.btnFetchDoi.innerHTML = '<i class="fa fa-spinner fa-spin mr-1"></i> 获取中...';

    try {
        const data = await fetchByDOI(doi);
        const mapped = mapCrossRefToEntry(data);

        // 自动填充模态框字段（仅填充非空字段，不覆盖用户已填且 CrossRef 未返回的字段）
        elements.entryTitle.value = mapped.title || elements.entryTitle.value;
        elements.entryAuthors.value = mapped.authors || elements.entryAuthors.value;
        elements.entryJournal.value = mapped.journal || elements.entryJournal.value;
        elements.entryYear.value = mapped.year || elements.entryYear.value;
        elements.entryVolume.value = mapped.volume || elements.entryVolume.value;
        elements.entryIssue.value = mapped.issue || elements.entryIssue.value;
        elements.entryPages.value = mapped.pages || elements.entryPages.value;
        elements.entryPublisher.value = mapped.publisher || elements.entryPublisher.value;
        elements.entryLocation.value = mapped.location || elements.entryLocation.value;
        if (mapped.type) {
            elements.entryType.value = mapped.type;
        }

        showStatus('已从 CrossRef 获取元数据并填充字段', 'success');
    } catch (error) {
        // SubTask 5.5: 根据错误类型给出友好提示
        if (error.name === 'AbortError') {
            showStatus('请求超时（10 秒），请检查网络后重试', 'error');
        } else if (error.message && error.message.includes('HTTP 404')) {
            showStatus('DOI 未找到，请检查 DOI 是否正确', 'error');
        } else {
            showStatus('DOI 获取失败：' + (error.message || '网络异常'), 'error');
        }
    } finally {
        // 恢复按钮状态
        elements.btnFetchDoi.disabled = false;
        elements.btnFetchDoi.innerHTML = originalText;
    }
}

// 选择条目
function selectEntry(id) {
    if (!database.entries || !Array.isArray(database.entries)) {
        database.entries = [];
    }
    const entry = database.entries.find(e => e.id === id);
    if (!entry) return;

    currentEntry = entry;

    const typeLabel = ENTRY_TYPES[entry.type] || ENTRY_TYPES.other;
    const tagsArr = Array.isArray(entry.tags) ? entry.tags : [];
    const rawText = entry.raw || entry.original || '';

    // 更新详情面板（按字段分组展示）
    elements.databaseDetails.innerHTML = `
        <div class="space-y-3 text-sm">
            <div class="flex items-center gap-2 pb-2 border-b border-gray-200">
                <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${typeLabel}</span>
                ${entry.doi ? `<span class="text-xs text-gray-500">DOI: ${entry.doi}</span>` : ''}
                ${entry.migrated ? `<span class="text-xs text-yellow-600">⚠ 待补全结构化字段</span>` : ''}
            </div>
            <div>
                <h3 class="text-xs font-medium text-gray-500 mb-1">标题</h3>
                <p class="text-sm">${entry.title || '<span class="text-gray-400">未填写</span>'}</p>
            </div>
            <div>
                <h3 class="text-xs font-medium text-gray-500 mb-1">作者</h3>
                <p class="text-sm">${entry.authors || '<span class="text-gray-400">未填写</span>'}</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <h3 class="text-xs font-medium text-gray-500 mb-1">期刊/出版社</h3>
                    <p class="text-sm">${entry.journal || entry.publisher || '<span class="text-gray-400">未填写</span>'}</p>
                </div>
                <div>
                    <h3 class="text-xs font-medium text-gray-500 mb-1">年份·卷期·页码</h3>
                    <p class="text-sm">${formatCitationDetail(entry)}</p>
                </div>
            </div>
            ${rawText ? `<div><h3 class="text-xs font-medium text-gray-500 mb-1">原始文本</h3><p class="text-xs text-gray-600 bg-gray-50 p-2 rounded">${rawText}</p></div>` : ''}
            <div>
                <h3 class="text-xs font-medium text-gray-500 mb-1">标签</h3>
                <p>${tagsArr.length > 0 ? tagsArr.map(t => `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">${t}</span>`).join('') : '<span class="text-gray-400">无标签</span>'}</p>
            </div>
            <div class="flex justify-end space-x-2 pt-2 border-t border-gray-200">
                <button class="text-primary hover:text-blue-600 edit-entry" data-id="${entry.id}"><i class="fa fa-pencil mr-1"></i> 编辑</button>
                <button class="text-red-500 hover:text-red-700 delete-entry" data-id="${entry.id}"><i class="fa fa-trash mr-1"></i> 删除</button>
            </div>
        </div>
    `;

    // 绑定详情面板中的按钮事件
    elements.databaseDetails.querySelector('.edit-entry').addEventListener('click', () => {
        openEditEntryModal(entry.id);
    });

    elements.databaseDetails.querySelector('.delete-entry').addEventListener('click', () => {
        deleteEntry(entry.id);
    });
}

// 打开添加条目模态框
function openAddEntryModal() {
    elements.modalTitle.textContent = '添加条目';
    elements.entryId.value = '';
    elements.entryType.value = 'journal';
    elements.entryAuthors.value = '';
    elements.entryTitle.value = '';
    elements.entryJournal.value = '';
    elements.entryYear.value = '';
    elements.entryVolume.value = '';
    elements.entryIssue.value = '';
    elements.entryPages.value = '';
    elements.entryPublisher.value = '';
    elements.entryLocation.value = '';
    elements.entryDoi.value = '';
    elements.entryRaw.value = '';
    elements.entryTags.value = '';
    elements.entryModal.classList.remove('hidden');
}

// 打开编辑条目模态框
function openEditEntryModal(id) {
    const entry = database.entries.find(e => e.id === id);
    if (!entry) return;

    elements.modalTitle.textContent = '编辑条目';
    elements.entryId.value = entry.id;
    elements.entryType.value = entry.type || 'other';
    elements.entryAuthors.value = entry.authors || '';
    elements.entryTitle.value = entry.title || '';
    elements.entryJournal.value = entry.journal || '';
    elements.entryYear.value = entry.year || '';
    elements.entryVolume.value = entry.volume || '';
    elements.entryIssue.value = entry.issue || '';
    elements.entryPages.value = entry.pages || '';
    elements.entryPublisher.value = entry.publisher || '';
    elements.entryLocation.value = entry.location || '';
    elements.entryDoi.value = entry.doi || '';
    elements.entryRaw.value = entry.raw || entry.original || '';
    elements.entryTags.value = Array.isArray(entry.tags) ? entry.tags.join(', ') : '';
    elements.entryModal.classList.remove('hidden');
}

// 关闭模态框
function closeModal() {
    elements.entryModal.classList.add('hidden');
}

// 保存条目
function saveEntry() {
    const id = elements.entryId.value;
    const title = elements.entryTitle.value.trim();
    const raw = elements.entryRaw.value.trim();

    // 校验：标题或原始文本至少有一个非空
    if (!title && !raw) {
        showStatus('请至少填写标题或原始文本', 'error');
        return;
    }

    const tags = elements.entryTags.value.split(',').map(tag => tag.trim()).filter(tag => tag);

    if (id) {
        // 编辑现有条目
        const index = database.entries.findIndex(e => e.id === id);
        if (index !== -1) {
            const existing = database.entries[index];
            database.entries[index] = {
                ...existing,
                type: elements.entryType.value || 'other',
                authors: elements.entryAuthors.value.trim(),
                title: title,
                journal: elements.entryJournal.value.trim(),
                year: elements.entryYear.value.trim(),
                volume: elements.entryVolume.value.trim(),
                issue: elements.entryIssue.value.trim(),
                pages: elements.entryPages.value.trim(),
                publisher: elements.entryPublisher.value.trim(),
                location: elements.entryLocation.value.trim(),
                doi: elements.entryDoi.value.trim(),
                raw: raw,
                tags: tags,
                updatedAt: Date.now(),
                // 用户主动编辑后清除迁移标记（结构化字段已补全）
                migrated: false
            };
            showStatus('条目已更新', 'success');
        }
    } else {
        // 添加新条目
        const now = Date.now();
        const newEntry = {
            id: generateId(),
            type: elements.entryType.value || 'other',
            authors: elements.entryAuthors.value.trim(),
            title: title,
            journal: elements.entryJournal.value.trim(),
            year: elements.entryYear.value.trim(),
            volume: elements.entryVolume.value.trim(),
            issue: elements.entryIssue.value.trim(),
            pages: elements.entryPages.value.trim(),
            publisher: elements.entryPublisher.value.trim(),
            location: elements.entryLocation.value.trim(),
            doi: elements.entryDoi.value.trim(),
            raw: raw,
            tags: tags,
            createdAt: now,
            updatedAt: now,
            migrated: false
        };
        database.entries.push(newEntry);
        showStatus('条目已添加', 'success');
    }

    // 保存到本地存储
    saveDatabaseToLocalStorage();

    // 更新数据库列表
    updateDatabaseList();

    // 如果当前有选中的条目，更新详情
    if (currentEntry) {
        selectEntry(currentEntry.id);
    }

    // 关闭模态框
    closeModal();
}

// 删除条目
function deleteEntry(id) {
    const index = database.entries.findIndex(e => e.id === id);
    if (index !== -1) {
        database.entries.splice(index, 1);
        
        // 保存到本地存储
        saveDatabaseToLocalStorage();
        
        // 更新数据库列表
        updateDatabaseList();
        
        // 重置详情面板
        if (currentEntry && currentEntry.id === id) {
            currentEntry = null;
            elements.databaseDetails.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    请选择一个条目查看详情
                </div>
            `;
        }
        
        showStatus('条目已删除', 'success');
    }
}

// 保存数据库
async function saveDatabase() {
    const btnSaveDatabase = document.getElementById('btn-save-database');
    const originalText = btnSaveDatabase.innerHTML;

    try {
        if (currentDatabaseFile) {
            // 如果有当前加载的数据库文件，直接覆盖原文件
            try {
                const writable = await currentDatabaseFile.createWritable();

                // 写入数据
                const dataStr = JSON.stringify(database, null, 2);
                await writable.write(dataStr);
                await writable.close();

                // 改变按钮文本和样式
                btnSaveDatabase.innerHTML = '<i class="fa fa-check mr-1"></i> 保存成功';
                btnSaveDatabase.classList.remove('bg-accent');
                btnSaveDatabase.classList.add('bg-green-600');

                // 3秒后恢复原始文本
                setTimeout(() => {
                    btnSaveDatabase.innerHTML = originalText;
                    btnSaveDatabase.classList.remove('bg-green-600');
                    btnSaveDatabase.classList.add('bg-accent');
                }, 3000);

                showStatus(`数据库已保存到原文件: ${currentDatabaseFileName}`, 'success');
            } catch (error) {
                console.error('覆盖原文件失败:', error);
                // 失败时使用传统下载方式
                saveDatabaseAsDownload();
            }
        } else if (repositoryHandle) {
            // 如果有选择仓库文件夹但没有当前文件，创建新文件
            try {
                // 生成文件名
                const fileName = `references_database_${Date.now()}.json`;

                // 创建或覆盖文件
                const fileHandle = await repositoryHandle.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();

                // 写入数据
                const dataStr = JSON.stringify(database, null, 2);
                await writable.write(dataStr);
                await writable.close();

                // 更新当前文件信息
                currentDatabaseFile = fileHandle;
                currentDatabaseFileName = fileName;

                // 更新仓库文件列表
                await listRepositoryFiles();

                // 改变按钮文本和样式
                btnSaveDatabase.innerHTML = '<i class="fa fa-check mr-1"></i> 保存成功';
                btnSaveDatabase.classList.remove('bg-accent');
                btnSaveDatabase.classList.add('bg-green-600');

                // 3秒后恢复原始文本
                setTimeout(() => {
                    btnSaveDatabase.innerHTML = originalText;
                    btnSaveDatabase.classList.remove('bg-green-600');
                    btnSaveDatabase.classList.add('bg-accent');
                }, 3000);

                showStatus(`数据库已保存到仓库: ${fileName}`, 'success');
            } catch (error) {
                console.error('保存数据库到仓库失败:', error);
                // 失败时使用传统下载方式
                saveDatabaseAsDownload();
            }
        } else {
            // 否则使用传统下载方式
            saveDatabaseAsDownload();
        }
    } catch (error) {
        console.error('saveDatabase 失败:', error);
        showStatus('保存失败：' + (error.message || '未知错误'), 'error');
        // 恢复按钮状态
        btnSaveDatabase.innerHTML = originalText;
        btnSaveDatabase.classList.remove('bg-green-600');
        btnSaveDatabase.classList.add('bg-accent');
    }
}

// 传统下载方式保存数据库
function saveDatabaseAsDownload() {
    const btnSaveDatabase = document.getElementById('btn-save-database');
    const originalText = btnSaveDatabase.innerHTML;
    
    const dataStr = JSON.stringify(database, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'references_database.json';
    link.click();
    URL.revokeObjectURL(url);
    
    // 改变按钮文本和样式
    btnSaveDatabase.innerHTML = '<i class="fa fa-check mr-1"></i> 保存成功';
    btnSaveDatabase.classList.remove('bg-accent');
    btnSaveDatabase.classList.add('bg-green-600');
    
    // 3秒后恢复原始文本
    setTimeout(() => {
        btnSaveDatabase.innerHTML = originalText;
        btnSaveDatabase.classList.remove('bg-green-600');
        btnSaveDatabase.classList.add('bg-accent');
    }, 3000);
    
    showStatus('数据库已保存', 'success');
}

// 加载数据库
function loadDatabase() {
    // 创建文件输入
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const loadedDatabase = JSON.parse(event.target.result);
                    if (loadedDatabase.entries && Array.isArray(loadedDatabase.entries)) {
                        // 对每条调用 normalizeEntry，确保旧条目自动迁移（保留 original/correct 字段向后兼容）
                        loadedDatabase.entries = loadedDatabase.entries.map(normalizeEntry);
                        database = loadedDatabase;

                        // 保存到本地存储
                        saveDatabaseToLocalStorage();
                        
                        // 更新数据库列表
                        updateDatabaseList();
                        
                        // 重置详情面板
                        currentEntry = null;
                        elements.databaseDetails.innerHTML = `
                            <div class="text-center text-gray-500 py-8">
                                请选择一个条目查看详情
                            </div>
                        `;
                        
                        showStatus('数据库已加载', 'success');
                    } else {
                        showStatus('无效的数据库文件格式', 'error');
                    }
                } catch (error) {
                    console.error('加载数据库失败:', error);
                    showStatus('加载数据库失败：' + (error.message || '未知错误'), 'error');
                }
            };
            reader.readAsText(file);
        }
    });
    input.click();
}

// 保存数据库到本地存储
function saveDatabaseToLocalStorage() {
    try {
        localStorage.setItem('referencesDatabase', JSON.stringify(database));
    } catch (error) {
        console.error('保存到本地存储失败:', error);
    }
}

// 从本地存储加载数据库
function loadDatabaseFromLocalStorage() {
    try {
        const savedDatabase = localStorage.getItem('referencesDatabase');
        if (savedDatabase) {
            database = JSON.parse(savedDatabase);
        }
    } catch (error) {
        console.error('从本地存储加载失败:', error);
    }
}

// 保存设置
function saveSettings() {
    try {
        localStorage.setItem('referencesSettings', JSON.stringify(settings));
    } catch (error) {
        console.error('保存设置失败:', error);
    }
}

// 加载设置
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('referencesSettings');
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
        }
    } catch (error) {
        console.error('加载设置失败:', error);
    }
}

// 更新设置面板
function updateSettingsPanel() {
    elements.repositoryFolder.value = settings.repositoryFolder;
    if (repositoryHandle) {
        // 如果已有仓库句柄，显示仓库中的文件
        listRepositoryFiles();
    }
}

// 选择仓库文件夹
async function selectRepositoryFolder() {
    try {
        // 使用 File System Access API 选择文件夹
        repositoryHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'downloads'
        });
        
        // 显示文件夹名称
        elements.repositoryFolder.value = repositoryHandle.name;
        settings.repositoryFolder = repositoryHandle.name;
        
        // 保存设置
        saveSettings();
        
        // 列出仓库中的文件
        await listRepositoryFiles();
        
        showStatus('仓库文件夹已选择', 'success');
    } catch (error) {
        console.error('选择仓库文件夹失败:', error);
        showStatus('选择仓库文件夹失败', 'error');
    }
}

// 列出仓库中的文件
async function listRepositoryFiles() {
    if (!repositoryHandle) {
        elements.repositoryFiles.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                请先选择仓库文件夹
            </div>
        `;
        return;
    }
    
    try {
        const files = [];
        for await (const entry of repositoryHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                files.push(entry);
            }
        }
        
        if (files.length === 0) {
            elements.repositoryFiles.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    仓库文件夹中没有找到json文件
                </div>
            `;
        } else {
            elements.repositoryFiles.innerHTML = files.map(file => `
                <div class="border-b border-gray-200 py-2 hover:bg-gray-50 cursor-pointer repository-file-item" data-file-name="${file.name}">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-neutral-dark">${file.name}</span>
                        <button class="text-primary hover:text-blue-600 load-database-btn" data-file-name="${file.name}">
                            <i class="fa fa-database mr-1"></i> 加载
                        </button>
                    </div>
                </div>
            `).join('');
            
            // 绑定加载按钮事件
            document.querySelectorAll('.load-database-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const fileName = btn.dataset.fileName;
                    await loadDatabaseFromRepository(fileName);
                });
            });
        }
    } catch (error) {
        console.error('列出仓库文件失败:', error);
        showStatus('列出仓库文件失败', 'error');
    }
}

// 从仓库加载数据库文件
async function loadDatabaseFromRepository(fileName) {
    if (!repositoryHandle) {
        showStatus('请先选择仓库文件夹', 'error');
        return;
    }
    
    try {
        const fileHandle = await repositoryHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        const loadedDatabase = JSON.parse(content);
        if (loadedDatabase.entries && Array.isArray(loadedDatabase.entries)) {
            // 对每条调用 normalizeEntry，确保旧条目自动迁移（保留 original/correct 字段向后兼容）
            loadedDatabase.entries = loadedDatabase.entries.map(normalizeEntry);
            database = loadedDatabase;
            currentDatabaseFile = fileHandle; // 保存当前文件句柄
            currentDatabaseFileName = fileName; // 保存当前文件名
            
            // 更新数据库列表
            updateDatabaseList();
            
            // 重置详情面板
            currentEntry = null;
            elements.databaseDetails.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    请选择一个条目查看详情
                </div>
            `;
            
            showStatus(`数据库文件 ${fileName} 已加载`, 'success');
        } else {
            showStatus('无效的数据库文件格式', 'error');
        }
    } catch (error) {
        console.error('加载数据库文件失败:', error);
        showStatus('加载数据库文件失败', 'error');
    }
}

// 保存用户设置
function saveUserSettings() {
    saveSettings();
    showStatus('设置已保存', 'success');
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 显示状态栏消息
function showStatus(message, type = 'info') {
    elements.statusBar.textContent = message;
    
    // 重置样式
    elements.statusBar.className = 'text-sm';
    
    // 设置颜色
    switch (type) {
        case 'success':
            elements.statusBar.classList.add('text-green-600');
            break;
        case 'error':
            elements.statusBar.classList.add('text-red-600');
            break;
        case 'info':
        default:
            elements.statusBar.classList.add('text-gray-600');
            break;
    }
    
    // 3秒后恢复默认状态
    setTimeout(() => {
        elements.statusBar.textContent = '就绪';
        elements.statusBar.className = 'text-sm text-gray-600';
    }, 3000);
}

// 初始化应用
init();