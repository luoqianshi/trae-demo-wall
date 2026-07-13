var GlobalSearch = (function() {
    var STORAGE_KEY_HISTORY = 'global_search_history';
    var HISTORY_MAX = 10;
    var DEBOUNCE_DELAY = 300;

    var state = {
        isOpen: false,
        keyword: '',
        results: [],
        selectedIndex: -1,
        debounceTimer: null
    };

    var elements = {
        overlay: null,
        modal: null,
        input: null,
        resultsContainer: null,
        historyContainer: null
    };

    var HOT_SEARCHES = [
        { keyword: '装修合同', category: 'knowledge' },
        { keyword: '面积计算', category: 'tools' },
        { keyword: '水电改造', category: 'sop' },
        { keyword: '预算规划', category: 'budget' },
        { keyword: '材料选购', category: 'knowledge' },
        { keyword: '工期估算', category: 'tools' }
    ];

    var QUICK_ACTIONS = [
        { id: 'sop', name: '装修流程', desc: '查看完整装修SOP步骤', icon: 'clipboard-list', action: 'view:sop' },
        { id: 'budget', name: '预算管理', desc: '管理你的装修预算', icon: 'wallet', action: 'view:budget' },
        { id: 'tools', name: '工具箱', desc: '实用装修计算工具', icon: 'wrench', action: 'view:tools' },
        { id: 'knowledge', name: '知识库', desc: '装修避坑指南', icon: 'book-open', action: 'view:knowledge' },
        { id: 'home', name: '我的家', desc: '查看装修进度总览', icon: 'home', action: 'view:home' },
        { id: 'settings', name: '设置', desc: '个性化设置', icon: 'settings', action: 'settings' }
    ];

    function getSopSteps() {
        try {
            if (window.SopView && typeof SopView.getStepsForSearch === 'function') {
                return SopView.getStepsForSearch();
            }
        } catch (e) {
            console.error('[GlobalSearch] 获取SOP步骤数据失败:', e);
        }
        return [
            { id: 'F-1', name: '开工准备', stage: '前期准备', desc: '装修前的准备工作和注意事项' },
            { id: 'F-2', name: '主体拆改', stage: '拆改阶段', desc: '墙体拆除、新建墙体等拆改工程' },
            { id: 'F-3', name: '水电改造', stage: '水电阶段', desc: '水路电路改造，隐蔽工程' },
            { id: 'F-4', name: '泥瓦工程', stage: '泥瓦阶段', desc: '贴砖、防水、墙地面找平' },
            { id: 'F-5', name: '木工工程', stage: '木工阶段', desc: '吊顶、柜子、造型等木作' },
            { id: 'F-6', name: '油漆工程', stage: '油工阶段', desc: '墙面刮腻子、刷漆、贴壁纸' },
            { id: 'F-7', name: '安装阶段', stage: '安装阶段', desc: '橱柜、地板、门、灯具等安装' },
            { id: 'F-8', name: '竣工验收', stage: '收尾阶段', desc: '整体验收、保洁、软装进场' }
        ];
    }

    function getKnowledgeArticles() {
        try {
            if (window.KnowledgeView && typeof KnowledgeView.getArticlesForSearch === 'function') {
                return KnowledgeView.getArticlesForSearch();
            }
        } catch (e) {
            console.error('[GlobalSearch] 获取知识库文章数据失败:', e);
        }
        return [
            { id: 'keng-001', title: '装修合同最容易踩的5个坑', category: '避坑指南', summary: '装修合同是保障业主权益的重要文件' },
            { id: 'keng-002', title: '报价单藏猫腻？教你一眼看穿增项陷阱', category: '避坑指南', summary: '装修报价单看似详细，实则暗藏玄机' },
            { id: 'keng-003', title: '装修工期延误？这6个原因最常见', category: '避坑指南', summary: '装修工期延误是很多业主都会遇到的问题' },
            { id: 'keng-004', title: '半包 vs 全包，选错了多花几万块', category: '避坑指南', summary: '两种模式各有利弊，选错了不仅多花钱' },
            { id: 'keng-005', title: '装修付款节点怎么定？别把钱全交了', category: '避坑指南', summary: '装修付款节点是保障业主权益的重要手段' },
            { id: 'keng-006', title: '装修公司跑路前的5个信号', category: '避坑指南', summary: '装修公司跑路前通常有一些预警信号' }
        ];
    }

    function getTools() {
        try {
            if (window.ToolsView && typeof ToolsView.getToolsForSearch === 'function') {
                return ToolsView.getToolsForSearch();
            }
        } catch (e) {
            console.error('[GlobalSearch] 获取工具箱数据失败:', e);
        }
        return [
            { id: 'talk-script', name: '沟通话术', desc: '装修各阶段与工长/设计师沟通技巧', icon: 'message-circle' },
            { id: 'photo-inspection', name: '拍照验工', desc: '各工序验收拍照要点和标准', icon: 'camera' },
            { id: 'addon-reference', name: '增项参考', desc: '常见增项价格参考和避坑指南', icon: 'plus-circle' },
            { id: 'payment-calc', name: '付款计算器', desc: '分期付款金额和节点计算器', icon: 'calculator' },
            { id: 'schedule-calc', name: '工期计算器', desc: '根据面积和模式估算装修工期', icon: 'clock' },
            { id: 'area-calc', name: '装修面积计算器', desc: '面积、材料用量快速估算', icon: 'ruler' }
        ];
    }

    function getBudgetItems() {
        try {
            if (window.BudgetView && typeof BudgetView.getCategoriesForSearch === 'function') {
                return BudgetView.getCategoriesForSearch();
            }
        } catch (e) {
            console.error('[GlobalSearch] 获取预算分类数据失败:', e);
        }
        return [
            { id: 'decoration', name: '装修施工', category: '硬装', desc: '人工费、辅材费等' },
            { id: 'main-material', name: '主材', category: '硬装', desc: '瓷砖、地板、门窗、橱柜等' },
            { id: 'appliance', name: '家电', category: '家电', desc: '冰箱、洗衣机、空调等' },
            { id: 'furniture', name: '家具', category: '软装', desc: '沙发、床、桌椅等' },
            { id: 'soft-decoration', name: '软装', category: '软装', desc: '窗帘、灯具、装饰画等' },
            { id: 'other', name: '其他费用', category: '其他', desc: '设计费、监理费、垃圾清运费等' }
        ];
    }

    function getPages() {
        return [
            { id: 'sop', name: '装修流程', desc: '完整装修SOP步骤指引', type: 'view' },
            { id: 'budget', name: '预算管理', desc: '装修预算规划和管理', type: 'view' },
            { id: 'tools', name: '工具箱', desc: '实用装修计算工具', type: 'view' },
            { id: 'knowledge', name: '知识库', desc: '装修知识和避坑指南', type: 'view' },
            { id: 'home', name: '我的家', desc: '装修进度总览', type: 'view' }
        ];
    }

    function highlightKeyword(text, keyword) {
        if (!keyword || !text) return text;
        var escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var regex = new RegExp('(' + escaped + ')', 'gi');
        return text.replace(regex, '<span class="gs-highlight">$1</span>');
    }

    function debounce(fn, delay) {
        return function() {
            var context = this;
            var args = arguments;
            if (state.debounceTimer) {
                clearTimeout(state.debounceTimer);
            }
            state.debounceTimer = setTimeout(function() {
                state.debounceTimer = null;
                fn.apply(context, args);
            }, delay);
        };
    }

    function searchItems(keyword, items, type, getTitle, getDesc) {
        if (!keyword) return [];
        var lowerKeyword = keyword.toLowerCase();
        return items.filter(function(item) {
            var title = getTitle(item).toLowerCase();
            var desc = getDesc ? getDesc(item).toLowerCase() : '';
            return title.indexOf(lowerKeyword) !== -1 || desc.indexOf(lowerKeyword) !== -1;
        }).map(function(item) {
            return {
                type: type,
                data: item
            };
        }).slice(0, 10);
    }

    function performSearch(keyword) {
        state.keyword = keyword;
        if (!keyword.trim()) {
            state.results = [];
            state.selectedIndex = -1;
            renderResults();
            return;
        }

        var results = [];

        var sopResults = searchItems(keyword, getSopSteps(), 'sop',
            function(item) { return item.name; },
            function(item) { return item.stage + ' ' + item.desc; }
        );
        results = results.concat(sopResults);

        var knowledgeResults = searchItems(keyword, getKnowledgeArticles(), 'knowledge',
            function(item) { return item.title; },
            function(item) { return item.category + ' ' + item.summary; }
        );
        results = results.concat(knowledgeResults);

        var toolResults = searchItems(keyword, getTools(), 'tools',
            function(item) { return item.name; },
            function(item) { return item.desc; }
        );
        results = results.concat(toolResults);

        var budgetResults = searchItems(keyword, getBudgetItems(), 'budget',
            function(item) { return item.name; },
            function(item) { return item.category + ' ' + item.desc; }
        );
        results = results.concat(budgetResults);

        var pageResults = searchItems(keyword, getPages(), 'pages',
            function(item) { return item.name; },
            function(item) { return item.desc; }
        );
        results = results.concat(pageResults);

        state.results = results;
        state.selectedIndex = results.length > 0 ? 0 : -1;
        renderResults();
    }

    var debouncedSearch = debounce(performSearch, DEBOUNCE_DELAY);

    function getCategoryLabel(type) {
        var labels = {
            'sop': '装修流程',
            'knowledge': '知识库',
            'tools': '工具',
            'budget': '预算',
            'pages': '页面'
        };
        return labels[type] || type;
    }

    function getCategoryIcon(type) {
        var icons = {
            'sop': '📋',
            'knowledge': '📚',
            'tools': '🔧',
            'budget': '💰',
            'pages': '📄'
        };
        return icons[type] || '📄';
    }

    function groupResultsByType(results) {
        var groups = {};
        var order = ['sop', 'knowledge', 'tools', 'budget', 'pages'];
        
        results.forEach(function(result) {
            if (!groups[result.type]) {
                groups[result.type] = [];
            }
            groups[result.type].push(result);
        });

        return order.filter(function(type) {
            return groups[type] && groups[type].length > 0;
        }).map(function(type) {
            return {
                type: type,
                label: getCategoryLabel(type),
                items: groups[type]
            };
        });
    }

    function getFlatResultsIndex(groups, globalIndex) {
        var count = 0;
        for (var g = 0; g < groups.length; g++) {
            for (var i = 0; i < groups[g].items.length; i++) {
                if (count === globalIndex) {
                    return { groupIndex: g, itemIndex: i };
                }
                count++;
            }
        }
        return null;
    }

    function renderResults() {
        if (!elements.resultsContainer) return;

        if (!state.keyword.trim()) {
            renderDefaultState();
            return;
        }

        var groups = groupResultsByType(state.results);

        if (groups.length === 0) {
            elements.resultsContainer.innerHTML =
                '<div class="gs-empty">' +
                    '<div class="gs-empty-icon">🔍</div>' +
                    '<div class="gs-empty-title">没有找到相关结果</div>' +
                    '<div class="gs-empty-desc">试试其他关键词吧</div>' +
                '</div>';
            return;
        }

        var html = '';
        var globalIndex = 0;

        groups.forEach(function(group) {
            html += '<div class="gs-section">';
            html += '<div class="gs-section-title">' + group.label + '</div>';
            
            group.items.forEach(function(result) {
                var isActive = globalIndex === state.selectedIndex;
                var title = '';
                var desc = '';

                switch (result.type) {
                    case 'sop':
                        title = highlightKeyword(result.data.name, state.keyword);
                        desc = highlightKeyword(result.data.stage + ' · ' + result.data.desc, state.keyword);
                        break;
                    case 'knowledge':
                        title = highlightKeyword(result.data.title, state.keyword);
                        desc = highlightKeyword(result.data.category + ' · ' + result.data.summary, state.keyword);
                        break;
                    case 'tools':
                        title = highlightKeyword(result.data.name, state.keyword);
                        desc = highlightKeyword(result.data.desc, state.keyword);
                        break;
                    case 'budget':
                        title = highlightKeyword(result.data.name, state.keyword);
                        desc = highlightKeyword(result.data.category + ' · ' + result.data.desc, state.keyword);
                        break;
                    case 'pages':
                        title = highlightKeyword(result.data.name, state.keyword);
                        desc = highlightKeyword(result.data.desc, state.keyword);
                        break;
                }

                html += 
                    '<div class="gs-item' + (isActive ? ' active' : '') + '" data-index="' + globalIndex + '">' +
                        '<div class="gs-item-icon">' + getCategoryIcon(result.type) + '</div>' +
                        '<div class="gs-item-content">' +
                            '<div class="gs-item-title">' + title + '</div>' +
                            '<div class="gs-item-desc">' + desc + '</div>' +
                        '</div>' +
                        '<div class="gs-item-category">' + getCategoryLabel(result.type) + '</div>' +
                    '</div>';
                globalIndex++;
            });
            
            html += '</div>';
        });

        elements.resultsContainer.innerHTML = html;
        bindResultItemEvents();
        scrollToActiveItem();
    }

    function renderDefaultState() {
        if (!elements.resultsContainer) return;

        var history = getHistory();
        var html = '';

        if (history.length > 0) {
            html += '<div class="gs-section">';
            html += '<div class="gs-section-title">';
            html += '<span>搜索历史</span>';
            html += '<span class="gs-clear-history" id="gs-clear-history">清空</span>';
            html += '</div>';
            html += '<div class="gs-history">';
            history.forEach(function(item, index) {
                html += 
                    '<div class="gs-history-item" data-keyword="' + escapeHtml(item.keyword) + '">' +
                        '<span class="gs-history-icon">🕐</span>' +
                        '<span class="gs-history-text">' + escapeHtml(item.keyword) + '</span>' +
                    '</div>';
            });
            html += '</div>';
            html += '</div>';
        }

        html += '<div class="gs-section">';
        html += '<div class="gs-section-title">热门搜索</div>';
        html += '<div class="gs-hot-tags">';
        HOT_SEARCHES.forEach(function(item) {
            html += 
                '<span class="gs-hot-tag" data-keyword="' + escapeHtml(item.keyword) + '">' +
                    '<span class="gs-hot-tag-icon">🔥</span>' +
                    escapeHtml(item.keyword) +
                '</span>';
        });
        html += '</div>';
        html += '</div>';

        html += '<div class="gs-section">';
        html += '<div class="gs-section-title">快捷入口</div>';
        html += '<div class="gs-quick-actions">';
        QUICK_ACTIONS.forEach(function(action) {
            html += 
                '<div class="gs-quick-action" data-action="' + action.action + '">' +
                    '<div class="gs-quick-action-icon">' + getQuickActionIcon(action.icon) + '</div>' +
                    '<div class="gs-quick-action-content">' +
                        '<div class="gs-quick-action-name">' + action.name + '</div>' +
                        '<div class="gs-quick-action-desc">' + action.desc + '</div>' +
                    '</div>' +
                '</div>';
        });
        html += '</div>';
        html += '</div>';

        elements.resultsContainer.innerHTML = html;
        bindDefaultStateEvents();
    }

    function getQuickActionIcon(icon) {
        var icons = {
            'clipboard-list': '📋',
            'wallet': '💰',
            'wrench': '🔧',
            'book-open': '📖',
            'home': '🏠',
            'settings': '⚙️'
        };
        return icons[icon] || '📄';
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function bindResultItemEvents() {
        var items = elements.resultsContainer.querySelectorAll('.gs-item');
        items.forEach(function(item) {
            item.addEventListener('click', function() {
                var index = parseInt(this.getAttribute('data-index'), 10);
                selectResult(index);
            });

            item.addEventListener('mouseenter', function() {
                var index = parseInt(this.getAttribute('data-index'), 10);
                state.selectedIndex = index;
                updateActiveItem();
            });
        });
    }

    function bindDefaultStateEvents() {
        var historyItems = elements.resultsContainer.querySelectorAll('.gs-history-item');
        historyItems.forEach(function(item) {
            item.addEventListener('click', function() {
                var keyword = this.getAttribute('data-keyword');
                if (elements.input) {
                    elements.input.value = keyword;
                    performSearch(keyword);
                }
            });
        });

        var clearBtn = elements.resultsContainer.querySelector('#gs-clear-history');
        if (clearBtn) {
            clearBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                clearHistory();
                renderDefaultState();
            });
        }

        var hotTags = elements.resultsContainer.querySelectorAll('.gs-hot-tag');
        hotTags.forEach(function(tag) {
            tag.addEventListener('click', function() {
                var keyword = this.getAttribute('data-keyword');
                if (elements.input) {
                    elements.input.value = keyword;
                    performSearch(keyword);
                }
            });
        });

        var quickActions = elements.resultsContainer.querySelectorAll('.gs-quick-action');
        quickActions.forEach(function(action) {
            action.addEventListener('click', function() {
                var actionType = this.getAttribute('data-action');
                handleQuickAction(actionType);
            });
        });
    }

    function handleQuickAction(action) {
        if (action.indexOf('view:') === 0) {
            var viewName = action.substring(5);
            close();
            if (window.App && typeof App.switchView === 'function') {
                App.switchView(viewName);
            }
        } else if (action === 'settings') {
            close();
            if (window.SettingsModal && typeof SettingsModal.open === 'function') {
                SettingsModal.open();
            }
        }
    }

    function updateActiveItem() {
        var items = elements.resultsContainer.querySelectorAll('.gs-item');
        items.forEach(function(item, index) {
            if (index === state.selectedIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function scrollToActiveItem() {
        var activeItem = elements.resultsContainer.querySelector('.gs-item.active');
        if (activeItem) {
            var containerRect = elements.resultsContainer.getBoundingClientRect();
            var itemRect = activeItem.getBoundingClientRect();
            if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
                activeItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }

    function selectResult(index) {
        if (index < 0 || index >= state.results.length) return;

        var result = state.results[index];
        addToHistory({
            keyword: state.keyword,
            type: result.type,
            timestamp: Date.now()
        });

        close();
        handleResultAction(result);
    }

    function handleResultAction(result) {
        switch (result.type) {
            case 'sop':
                navigateToSopStep(result.data);
                break;
            case 'knowledge':
                navigateToKnowledge(result.data);
                break;
            case 'tools':
                navigateToTool(result.data);
                break;
            case 'budget':
                navigateToBudget(result.data);
                break;
            case 'pages':
                navigateToPage(result.data);
                break;
        }
    }

    function navigateToSopStep(step) {
        if (window.App && typeof App.switchView === 'function') {
            App.switchView('sop');
            if (window.SopView && typeof SopView.goToStep === 'function') {
                setTimeout(function() {
                    try {
                        SopView.goToStep(step.id);
                    } catch (e) {
                        console.error('[GlobalSearch] 跳转到SOP步骤失败:', e);
                    }
                }, 300);
            }
        }
    }

    function navigateToKnowledge(article) {
        if (window.App && typeof App.switchView === 'function') {
            App.switchView('knowledge');
            if (window.KnowledgeView && typeof KnowledgeView.openArticle === 'function') {
                setTimeout(function() {
                    try {
                        KnowledgeView.openArticle(article.id);
                    } catch (e) {
                        console.error('[GlobalSearch] 打开知识库文章失败:', e);
                    }
                }, 300);
            }
        }
    }

    function navigateToTool(tool) {
        if (window.App && typeof App.switchView === 'function') {
            App.switchView('tools');
            if (window.ToolsView && typeof ToolsView.openTool === 'function') {
                setTimeout(function() {
                    try {
                        ToolsView.openTool(tool.id);
                    } catch (e) {
                        console.error('[GlobalSearch] 打开工具箱失败:', e);
                    }
                }, 300);
            }
        }
    }

    function navigateToBudget(item) {
        if (window.App && typeof App.switchView === 'function') {
            App.switchView('budget');
        }
    }

    function navigateToPage(page) {
        if (window.App && typeof App.switchView === 'function') {
            App.switchView(page.id);
        }
    }

    function getHistory() {
        var history = Storage.load(STORAGE_KEY_HISTORY);
        return history ? history : [];
    }

    function addToHistory(item) {
        var history = getHistory();
        history = history.filter(function(h) {
            return h.keyword !== item.keyword;
        });
        history.unshift(item);
        if (history.length > HISTORY_MAX) {
            history = history.slice(0, HISTORY_MAX);
        }
        Storage.save(STORAGE_KEY_HISTORY, history);
    }

    function clearHistory() {
        Storage.remove(STORAGE_KEY_HISTORY);
    }

    function buildModal() {
        var overlay = document.createElement('div');
        overlay.className = 'gs-overlay';
        overlay.id = 'gs-overlay';

        var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        var shortcut = isMac ? '⌘K' : 'Ctrl+K';

        overlay.innerHTML = 
            '<div class="gs-modal" role="dialog" aria-modal="true" aria-label="全局搜索">' +
                '<div class="gs-search-box">' +
                    '<span class="gs-search-icon">🔍</span>' +
                    '<input type="text" class="gs-input" id="gs-input" placeholder="搜索SOP、知识库、工具、页面..." autocomplete="off">' +
                    '<span class="gs-shortcut-hint" id="gs-shortcut">' + shortcut + '</span>' +
                '</div>' +
                '<div class="gs-results" id="gs-results"></div>' +
                '<div class="gs-footer">' +
                    '<span class="gs-footer-hint"><kbd>↑</kbd><kbd>↓</kbd> 选择</span>' +
                    '<span class="gs-footer-hint"><kbd>Enter</kbd> 确认</span>' +
                    '<span class="gs-footer-hint"><kbd>ESC</kbd> 关闭</span>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        elements.overlay = overlay;
        elements.modal = overlay.querySelector('.gs-modal');
        elements.input = overlay.querySelector('#gs-input');
        elements.resultsContainer = overlay.querySelector('#gs-results');

        bindModalEvents();
    }

    function bindModalEvents() {
        elements.overlay.addEventListener('click', function(e) {
            if (e.target === elements.overlay) {
                close();
            }
        });

        elements.input.addEventListener('input', function() {
            debouncedSearch(this.value);
        });

        elements.input.addEventListener('keydown', function(e) {
            handleKeydown(e);
        });
    }

    function initGlobalEvents() {
        document.addEventListener('keydown', function(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggle();
            }
        });

        var sidebarSearchBtn = document.getElementById('sidebar-search-btn');
        if (sidebarSearchBtn) {
            sidebarSearchBtn.addEventListener('click', function() {
                open();
            });
            sidebarSearchBtn.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                }
            });

            var shortcutEl = sidebarSearchBtn.querySelector('.gs-nav-search-btn-shortcut');
            if (shortcutEl) {
                var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                shortcutEl.textContent = isMac ? '⌘K' : 'Ctrl+K';
            }
        }
    }

    function handleKeydown(e) {
        if (!state.isOpen) return;

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                close();
                break;
            case 'ArrowDown':
                e.preventDefault();
                moveSelection(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                moveSelection(-1);
                break;
            case 'Enter':
                e.preventDefault();
                if (state.selectedIndex >= 0 && state.results.length > 0) {
                    selectResult(state.selectedIndex);
                } else if (state.keyword.trim()) {
                    addToHistory({
                        keyword: state.keyword,
                        type: 'search',
                        timestamp: Date.now()
                    });
                }
                break;
        }
    }

    function moveSelection(direction) {
        if (state.results.length === 0) return;

        state.selectedIndex += direction;
        if (state.selectedIndex < 0) {
            state.selectedIndex = state.results.length - 1;
        } else if (state.selectedIndex >= state.results.length) {
            state.selectedIndex = 0;
        }

        updateActiveItem();
        scrollToActiveItem();
    }

    function open() {
        if (state.isOpen) return;

        if (!elements.overlay) {
            buildModal();
        }

        state.isOpen = true;
        elements.overlay.classList.add('open');
        document.body.style.overflow = 'hidden';

        setTimeout(function() {
            if (elements.input) {
                elements.input.focus();
                elements.input.select();
            }
        }, 50);

        renderDefaultState();
    }

    function close() {
        if (!state.isOpen) return;

        state.isOpen = false;
        state.keyword = '';
        state.results = [];
        state.selectedIndex = -1;

        if (elements.overlay) {
            elements.overlay.classList.remove('open');
        }
        if (elements.input) {
            elements.input.value = '';
        }

        document.body.style.overflow = '';
    }

    function toggle() {
        if (state.isOpen) {
            close();
        } else {
            open();
        }
    }

    function search(keyword) {
        open();
        if (elements.input) {
            elements.input.value = keyword;
        }
        performSearch(keyword);
    }

    function init() {
        initGlobalEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        open: open,
        close: close,
        toggle: toggle,
        search: search,
        addToHistory: addToHistory,
        clearHistory: clearHistory
    };
})();

window.GlobalSearch = GlobalSearch;
