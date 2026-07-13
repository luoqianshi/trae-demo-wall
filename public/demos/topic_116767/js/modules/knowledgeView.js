﻿﻿﻿﻿var KnowledgeView = (function() {
    var container = null;
    var el = {};
    var currentCategory = null;
    var currentArticle = null;
    var searchTimer = null;
    var searchResults = [];

    var CATEGORIES = KnowledgeArticles.getCategories();
    var ARTICLES = KnowledgeArticles.getArticles();

    var ICONS = {
        'clipboard-list':
            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="8" y1="19" x2="13" y2="19"/></svg>',
        'palette':
            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
        'lamp':
            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>',
        'home':
            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>',
        'star':
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        'shield-alert':
            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
        'box':
            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
        'clipboard-check':
            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><polyline points="9,14 11,16 15,12"/></svg>',
        'file-text':
            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
        'clock':
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        'arrow-left':
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
        'arrow-right':
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
        'search':
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
    };

    var COLOR_CLASSES = {
        orange: { bg: 'rgba(217, 119, 6, 0.1)', text: '#D97706', border: 'rgba(217, 119, 6, 0.2)', gradient: 'linear-gradient(135deg, rgba(217,119,6,0.15) 0%, rgba(217,119,6,0.05) 100%)' },
        pink: { bg: 'rgba(219, 39, 119, 0.1)', text: '#DB2777', border: 'rgba(219, 39, 119, 0.2)', gradient: 'linear-gradient(135deg, rgba(219,39,119,0.15) 0%, rgba(219,39,119,0.05) 100%)' },
        red: { bg: 'rgba(168, 62, 53, 0.1)', text: '#A83E35', border: 'rgba(168, 62, 53, 0.2)', gradient: 'linear-gradient(135deg, rgba(168,62,53,0.15) 0%, rgba(168,62,53,0.05) 100%)' },
        blue: { bg: 'rgba(74, 111, 149, 0.1)', text: '#4A6F95', border: 'rgba(74, 111, 149, 0.2)', gradient: 'linear-gradient(135deg, rgba(74,111,149,0.15) 0%, rgba(74,111,149,0.05) 100%)' },
        green: { bg: 'rgba(77, 125, 76, 0.1)', text: '#4D7D4C', border: 'rgba(77, 125, 76, 0.2)', gradient: 'linear-gradient(135deg, rgba(77,125,76,0.15) 0%, rgba(77,125,76,0.05) 100%)' },
        purple: { bg: 'rgba(107, 92, 224, 0.1)', text: '#6B5CE0', border: 'rgba(107, 92, 224, 0.2)', gradient: 'linear-gradient(135deg, rgba(107,92,224,0.15) 0%, rgba(107,92,224,0.05) 100%)' },
        teal: { bg: 'rgba(13, 148, 136, 0.1)', text: '#0D9488', border: 'rgba(13, 148, 136, 0.2)', gradient: 'linear-gradient(135deg, rgba(13,148,136,0.15) 0%, rgba(13,148,136,0.05) 100%)' },
        indigo: { bg: 'rgba(79, 70, 229, 0.1)', text: '#4F46E5', border: 'rgba(79, 70, 229, 0.2)', gradient: 'linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(79,70,229,0.05) 100%)' }
    };

    var HOT_ARTICLES = [];

    function initHotArticles() {
        HOT_ARTICLES = ARTICLES.filter(function(a) { return a.hot; }).slice(0, 5).map(function(a) {
            return {
                id: a.id,
                title: a.title,
                category: getCategoryName(a.category),
                categoryId: a.category,
                reads: (Math.floor(Math.random() * 30) + 10) / 10 + '万'
            };
        });
    }

    function getCategoryName(categoryId) {
        var cat = CATEGORIES.find(function(c) { return c.id === categoryId; });
        return cat ? cat.name : '未知分类';
    }

    function getCategoryColor(categoryId) {
        var cat = CATEGORIES.find(function(c) { return c.id === categoryId; });
        if (cat) {
            var colors = COLOR_CLASSES[cat.color];
            return colors ? colors.text : '#4A6F95';
        }
        return '#4A6F95';
    }

    function getCategoryById(categoryId) {
        return CATEGORIES.find(function(c) { return c.id === categoryId; });
    }

    function getArticlesByCategory(categoryId) {
        return ARTICLES.filter(function(a) { return a.category === categoryId; });
    }

    function getArticleById(articleId) {
        return ARTICLES.find(function(a) { return a.id === articleId; });
    }

    function getPrevArticle(articleId, categoryId) {
        var articles = getArticlesByCategory(categoryId);
        var index = articles.findIndex(function(a) { return a.id === articleId; });
        if (index > 0) {
            return articles[index - 1];
        }
        return null;
    }

    function getNextArticle(articleId, categoryId) {
        var articles = getArticlesByCategory(categoryId);
        var index = articles.findIndex(function(a) { return a.id === articleId; });
        if (index >= 0 && index < articles.length - 1) {
            return articles[index + 1];
        }
        return null;
    }

    function searchArticles(keyword) {
        if (!keyword || keyword.trim() === '') {
            return [];
        }
        keyword = keyword.trim().toLowerCase();
        var results = [];

        ARTICLES.forEach(function(article) {
            var score = 0;
            var titleLower = article.title.toLowerCase();
            var summaryLower = article.summary.toLowerCase();
            var contentLower = article.content.toLowerCase();

            if (titleLower.indexOf(keyword) !== -1) {
                score += 10;
            }
            if (summaryLower.indexOf(keyword) !== -1) {
                score += 5;
            }
            if (contentLower.indexOf(keyword) !== -1) {
                score += 2;
            }

            if (score > 0) {
                results.push({
                    article: article,
                    score: score
                });
            }
        });

        results.sort(function(a, b) {
            return b.score - a.score;
        });

        return results.map(function(r) { return r.article; });
    }

    function cacheElements() {
        el.knowledgeModal = document.getElementById('knowledge-modal');
        el.knowledgeModalClose = document.getElementById('knowledge-modal-close');
        el.knowledgeModalBackdrop = document.getElementById('knowledge-modal-backdrop');
        el.knowledgeModalContent = document.querySelector('.knowledge-modal-content');
        el.searchInput = document.getElementById('knowledge-search-input');
        el.searchResults = document.getElementById('knowledge-search-results');
    }

    function clearElementCache() {
        el = {};
    }

    function render(containerEl) {
        container = containerEl;
        initHotArticles();

        container.innerHTML = `
            <div class="knowledge-view ink-wash-bg">
                <header class="knowledge-header">
                    <div class="knowledge-header-inner">
                        <div class="knowledge-header-left">
                            <h1 class="knowledge-title">知识库</h1>
                            <p class="knowledge-subtitle">装修知识大全，让您成为装修行家</p>
                        </div>
                        <div class="knowledge-search-box" id="knowledge-search-box">
                            ${ICONS['search']}
                            <input type="text" placeholder="搜索装修知识..." class="knowledge-search-input" id="knowledge-search-input">
                        </div>
                        <div class="knowledge-search-results" id="knowledge-search-results"></div>
                    </div>
                </header>

                <main class="knowledge-main">
                    <section class="knowledge-categories-section">
                        <div class="section-header">
                            <h2 class="section-title section-decoration">知识分类</h2>
                            <span class="section-subtitle">共 ${ARTICLES.length}+ 篇干货</span>
                        </div>
                        <div class="knowledge-categories-grid">
                            ${CATEGORIES.map(function(cat, index) {
                                var colors = COLOR_CLASSES[cat.color] || COLOR_CLASSES.blue;
                                var catArticles = getArticlesByCategory(cat.id);
                                return `
                                    <div class="knowledge-category-card stagger-item" data-category-id="${cat.id}" tabindex="0" style="transition-delay: ${index * 0.08}s">
                                        <div class="knowledge-category-icon" style="background: ${colors.gradient}; color: ${colors.text};">
                                            ${ICONS[cat.icon] || ICONS['file-text']}
                                        </div>
                                        <div class="knowledge-category-content">
                                            <div class="knowledge-category-header">
                                                <h3 class="knowledge-category-title">${cat.name}</h3>
                                                <span class="knowledge-category-tag" style="background: ${colors.bg}; color: ${colors.text};">${cat.tag}</span>
                                            </div>
                                            <p class="knowledge-category-desc">${cat.desc}</p>
                                            <div class="knowledge-category-footer">
                                                <span class="knowledge-category-count">${catArticles.length} 篇文章</span>
                                                <span class="knowledge-category-arrow" style="color: ${colors.text};">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <polyline points="9 18 15 12 9 6"/>
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </section>

                    <section class="knowledge-recent-section" id="knowledge-recent-section" style="display: none;">
                        <div class="section-header">
                            <h2 class="section-title section-decoration">最近浏览</h2>
                            <button class="section-action-btn" id="knowledge-clear-history">清空历史</button>
                        </div>
                        <div class="knowledge-recent-list" id="knowledge-recent-list"></div>
                    </section>

                    <section class="knowledge-hot-section">
                        <div class="section-header">
                            <h2 class="section-title section-decoration">热门文章</h2>
                            <button class="section-more-btn">查看更多 →</button>
                        </div>
                        <div class="knowledge-hot-list">
                            ${HOT_ARTICLES.map(function(article, index) {
                                var catColor = getCategoryColor(article.categoryId);
                                return `
                                    <div class="knowledge-hot-item stagger-item" data-article-id="${article.id}" tabindex="0" style="transition-delay: ${0.3 + index * 0.05}s">
                                        <div class="knowledge-hot-rank" style="background: ${index < 3 ? 'linear-gradient(135deg, #C9A227 0%, #E0BE4D 100%)' : 'var(--gray-200)'}; color: ${index < 3 ? 'white' : 'var(--text-muted)'};">
                                            ${index + 1}
                                        </div>
                                        <div class="knowledge-hot-content">
                                            <h4 class="knowledge-hot-title">${article.title}</h4>
                                            <div class="knowledge-hot-meta">
                                                <span class="knowledge-hot-category" style="color: ${catColor};">${article.category}</span>
                                                <span class="knowledge-hot-reads">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                        <circle cx="12" cy="12" r="3"/>
                                                    </svg>
                                                    ${article.reads}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </section>

                    <div class="knowledge-tip-card card stagger-item" style="transition-delay: 0.55s">
                        <div class="knowledge-tip-icon">${Icons.render('nian-default')}</div>
                        <div class="knowledge-tip-content">
                            <h3 class="knowledge-tip-title">小管家学习建议</h3>
                            <p class="knowledge-tip-desc">建议先从「避坑指南」开始阅读，了解装修常见陷阱，然后根据您的装修进度学习对应阶段的知识。有任何问题随时问我哦~</p>
                        </div>
                    </div>
                </main>

                <div class="knowledge-modal" id="knowledge-modal">
                    <div class="knowledge-modal-backdrop" id="knowledge-modal-backdrop"></div>
                    <div class="knowledge-modal-content">
                        <button class="knowledge-modal-close" id="knowledge-modal-close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                        <div id="knowledge-modal-body"></div>
                    </div>
                </div>
            </div>
        `;

        initEvents();
        cacheElements();
    }

    function renderRecentArticles() {
        if (!window.FavoritesHistory) return;
        
        var recent = window.FavoritesHistory.getHistory('article', 5);
        var recentSection = document.getElementById('knowledge-recent-section');
        var recentList = document.getElementById('knowledge-recent-list');
        
        if (!recentSection || !recentList) return;
        
        if (!recent || recent.length === 0) {
            recentSection.style.display = 'none';
            return;
        }
        
        recentSection.style.display = 'block';
        recentList.innerHTML = recent.map(function(item) {
            var article = getArticleById(item.id);
            if (!article) return '';
            var category = getCategoryById(article.category);
            var colors = category ? (COLOR_CLASSES[category.color] || COLOR_CLASSES.blue) : COLOR_CLASSES.blue;
            
            return `
                <div class="knowledge-hot-item" data-article-id="${item.id}" tabindex="0" style="cursor: pointer;">
                    <div class="knowledge-hot-rank" style="background: ${colors.gradient}; color: ${colors.text};">
                        ${ICONS['clock']}
                    </div>
                    <div class="knowledge-hot-content">
                        <h4 class="knowledge-hot-title">${item.data ? item.data.title : article.title}</h4>
                        <div class="knowledge-hot-meta">
                            <span class="knowledge-hot-category" style="color: ${colors.text};">${item.data ? item.data.categoryName : (category ? category.name : '')}</span>
                            <span class="knowledge-hot-reads">${ICONS['clock']} ${item.data ? item.data.readTime : article.readTime}分钟</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        var recentItems = recentList.querySelectorAll('.knowledge-hot-item');
        recentItems.forEach(function(item) {
            item.addEventListener('click', function() {
                var articleId = this.getAttribute('data-article-id');
                openArticleModal(articleId);
            });
        });
        
        var clearBtn = document.getElementById('knowledge-clear-history');
        if (clearBtn) {
            clearBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (window.FavoritesHistory) {
                    window.FavoritesHistory.clearHistory('article');
                    renderRecentArticles();
                    if (window.Toast) {
                        window.Toast.info('历史记录已清空');
                    }
                }
            });
        }
    }

    function init(containerEl) {
        container = containerEl;
        initCategoryEvents();
        initModalEvents();
        initSearchEvents();
        renderRecentArticles();
    }

    function viewEnter(containerEl) {
        container = containerEl;
        setTimeout(function() {
            var staggerItems = container.querySelectorAll('.stagger-item');
            staggerItems.forEach(function(item) {
                item.classList.add('visible');
            });
        }, 50);
    }

    function initEvents() {
        initCategoryEvents();
        initModalEvents();
        initSearchEvents();
    }

    function initCategoryEvents() {
        var cards = container.querySelectorAll('.knowledge-category-card');
        cards.forEach(function(card) {
            card.addEventListener('click', function() {
                var categoryId = this.getAttribute('data-category-id');
                openCategoryModal(categoryId);
            });

            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    var categoryId = this.getAttribute('data-category-id');
                    openCategoryModal(categoryId);
                }
            });
        });

        var hotItems = container.querySelectorAll('.knowledge-hot-item');
        hotItems.forEach(function(item) {
            item.addEventListener('click', function() {
                var articleId = this.getAttribute('data-article-id');
                openArticleModal(articleId);
            });

            item.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    var articleId = this.getAttribute('data-article-id');
                    openArticleModal(articleId);
                }
            });
        });
    }

    function initModalEvents() {
        if (el.knowledgeModalClose) {
            el.knowledgeModalClose.addEventListener('click', closeKnowledgeModal);
        }
        if (el.knowledgeModalBackdrop) {
            el.knowledgeModalBackdrop.addEventListener('click', closeKnowledgeModal);
        }
    }

    function initSearchEvents() {
        var searchInput = document.getElementById('knowledge-search-input');
        var searchBox = document.getElementById('knowledge-search-box');
        var searchResults = document.getElementById('knowledge-search-results');

        if (searchInput) {
            searchInput.addEventListener('input', function() {
                var keyword = this.value;
                if (searchTimer) {
                    clearTimeout(searchTimer);
                }
                searchTimer = setTimeout(function() {
                    performSearch(keyword);
                }, 300);
            });

            searchInput.addEventListener('focus', function() {
                var keyword = this.value;
                if (keyword && keyword.trim() !== '') {
                    performSearch(keyword);
                }
            });
        }

        document.addEventListener('click', function(e) {
            var searchBoxEl = document.getElementById('knowledge-search-box');
            var searchResultsEl = document.getElementById('knowledge-search-results');
            if (searchBoxEl && searchResultsEl && 
                !searchBoxEl.contains(e.target) && 
                !searchResultsEl.contains(e.target)) {
                searchResultsEl.classList.remove('active');
            }
        });
    }

    function performSearch(keyword) {
        var searchResultsEl = document.getElementById('knowledge-search-results');
        if (!searchResultsEl) return;

        if (!keyword || keyword.trim() === '') {
            searchResultsEl.classList.remove('active');
            return;
        }

        searchResults = searchArticles(keyword);

        if (searchResults.length === 0) {
            searchResultsEl.innerHTML = `
                <div class="knowledge-search-empty">
                    <div class="knowledge-search-empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </div>
                    <p class="knowledge-search-empty-text">没有找到相关内容</p>
                    <p class="knowledge-search-empty-desc">换个关键词试试吧~</p>
                </div>
            `;
        } else {
            searchResultsEl.innerHTML = `
                <div class="knowledge-search-list">
                    ${searchResults.slice(0, 10).map(function(article) {
                        var catColor = getCategoryColor(article.category);
                        return `
                            <div class="knowledge-search-item" data-article-id="${article.id}">
                                <div class="knowledge-search-item-title">${article.title}</div>
                                <div class="knowledge-search-item-desc">${article.summary.substring(0, 60)}...</div>
                                <div class="knowledge-search-item-meta">
                                    <span class="knowledge-search-item-category" style="color: ${catColor};">${getCategoryName(article.category)}</span>
                                    <span class="knowledge-search-item-time">${ICONS['clock']} ${article.readTime}分钟阅读</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                    <div class="knowledge-search-count">共找到 ${searchResults.length} 篇相关文章</div>
                </div>
            `;

            var items = searchResultsEl.querySelectorAll('.knowledge-search-item');
            items.forEach(function(item) {
                item.addEventListener('click', function() {
                    var articleId = this.getAttribute('data-article-id');
                    openArticleModal(articleId);
                    var searchInput = document.getElementById('knowledge-search-input');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                    searchResultsEl.classList.remove('active');
                });
            });
        }

        searchResultsEl.classList.add('active');
    }

    function openCategoryModal(categoryId) {
        var category = getCategoryById(categoryId);
        if (!category) return;

        currentCategory = categoryId;
        var colors = COLOR_CLASSES[category.color] || COLOR_CLASSES.blue;
        var articles = getArticlesByCategory(categoryId);

        var modalBody = document.getElementById('knowledge-modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="knowledge-category-detail">
                    <div class="knowledge-modal-icon" style="background: ${colors.gradient}; color: ${colors.text};">
                        ${ICONS[category.icon] || ICONS['file-text']}
                    </div>
                    <h2 class="knowledge-modal-title">${category.name}</h2>
                    <p class="knowledge-modal-desc">${category.desc}</p>
                    <div class="knowledge-modal-stats">
                        <div class="knowledge-stat-item">
                            <div class="knowledge-stat-value" style="color: ${colors.text};">${articles.length}</div>
                            <div class="knowledge-stat-label">篇文章</div>
                        </div>
                        <div class="knowledge-stat-item">
                            <div class="knowledge-stat-value" style="color: ${colors.text};">${Math.floor(articles.length * 6)}</div>
                            <div class="knowledge-stat-label">总阅读(分钟)</div>
                        </div>
                    </div>
                    <div class="knowledge-article-list">
                        <h3 class="knowledge-article-list-title">文章列表</h3>
                        <div class="knowledge-article-list-items">
                            ${articles.map(function(article, index) {
                                return `
                                    <div class="knowledge-article-item" data-article-id="${article.id}" tabindex="0">
                                        <div class="knowledge-article-item-index" style="background: ${colors.bg}; color: ${colors.text};">${index + 1}</div>
                                        <div class="knowledge-article-item-content">
                                            <h4 class="knowledge-article-item-title">${article.title}</h4>
                                            <div class="knowledge-article-item-meta">
                                                <span>${ICONS['clock']} ${article.readTime}分钟</span>
                                                ${article.hot ? '<span class="knowledge-article-hot" style="color: ' + colors.text + ';">热门</span>' : ''}
                                            </div>
                                        </div>
                                        <div class="knowledge-article-item-arrow">
                                            ${ICONS['arrow-right']}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;

            var articleItems = modalBody.querySelectorAll('.knowledge-article-item');
            articleItems.forEach(function(item) {
                item.addEventListener('click', function() {
                    var articleId = this.getAttribute('data-article-id');
                    openArticleModal(articleId);
                });
                item.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        var articleId = this.getAttribute('data-article-id');
                        openArticleModal(articleId);
                    }
                });
            });
        }

        if (el.knowledgeModal) {
            el.knowledgeModal.classList.add('active');
        }
    }

    function openArticleModal(articleId) {
        var article = getArticleById(articleId);
        if (!article) return;

        currentArticle = articleId;
        var category = getCategoryById(article.category);
        var colors = category ? (COLOR_CLASSES[category.color] || COLOR_CLASSES.blue) : COLOR_CLASSES.blue;
        var prevArticle = getPrevArticle(articleId, article.category);
        var nextArticle = getNextArticle(articleId, article.category);
        var isFav = window.FavoritesHistory && window.FavoritesHistory.isFavorite('article', articleId);

        if (window.FavoritesHistory) {
            window.FavoritesHistory.addHistory('article', articleId, {
                title: article.title,
                category: article.category,
                categoryName: category ? category.name : '',
                readTime: article.readTime
            });
        }

        var modalBody = document.getElementById('knowledge-modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="knowledge-article-detail">
                    <div class="knowledge-article-back" data-category-id="${article.category}">
                        ${ICONS['arrow-left']}
                        <span>返回${category ? category.name : '列表'}</span>
                    </div>
                    <div class="knowledge-article-header-actions">
                        <button class="article-favorite-btn ${isFav ? 'active' : ''}" data-article-id="${articleId}">
                            ${ICONS['star']}
                            <span>${isFav ? '已收藏' : '收藏'}</span>
                        </button>
                    </div>
                    <h1 class="knowledge-article-title">${article.title}</h1>
                    <div class="knowledge-article-meta">
                        <span class="knowledge-article-category" style="background: ${colors.bg}; color: ${colors.text};">${category ? category.name : '未知'}</span>
                        <span class="knowledge-article-time">${ICONS['clock']} ${article.readTime}分钟阅读</span>
                    </div>
                    <div class="knowledge-article-tags">
                        ${article.tags.map(function(tag) {
                            return `<span class="knowledge-article-tag">${tag}</span>`;
                        }).join('')}
                    </div>
                    <div class="knowledge-article-content">
                        ${article.content.split('\n\n').map(function(p) {
                            return `<p>${p}</p>`;
                        }).join('')}
                    </div>
                    <div class="knowledge-article-tips">
                        <h3 class="knowledge-article-tips-title">要点总结</h3>
                        <ul class="knowledge-article-tips-list">
                            ${article.tips.map(function(tip) {
                                return `<li>${tip}</li>`;
                            }).join('')}
                        </ul>
                    </div>
                    <div class="knowledge-article-nav">
                        <div class="knowledge-article-nav-prev ${prevArticle ? '' : 'disabled'}">
                            ${prevArticle ? `
                                <div class="knowledge-article-nav-label">上一篇</div>
                                <div class="knowledge-article-nav-title" data-article-id="${prevArticle.id}">${ICONS['arrow-left']} ${prevArticle.title}</div>
                            ` : `
                                <div class="knowledge-article-nav-label">上一篇</div>
                                <div class="knowledge-article-nav-title">没有了</div>
                            `}
                        </div>
                        <div class="knowledge-article-nav-next ${nextArticle ? '' : 'disabled'}">
                            ${nextArticle ? `
                                <div class="knowledge-article-nav-label">下一篇</div>
                                <div class="knowledge-article-nav-title" data-article-id="${nextArticle.id}">${nextArticle.title} ${ICONS['arrow-right']}</div>
                            ` : `
                                <div class="knowledge-article-nav-label">下一篇</div>
                                <div class="knowledge-article-nav-title">没有了</div>
                            `}
                        </div>
                    </div>
                </div>
            `;

            var backBtn = modalBody.querySelector('.knowledge-article-back');
            if (backBtn) {
                backBtn.addEventListener('click', function() {
                    var catId = this.getAttribute('data-category-id');
                    openCategoryModal(catId);
                });
            }

            var favBtn = modalBody.querySelector('.article-favorite-btn');
            if (favBtn) {
                favBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var artId = this.getAttribute('data-article-id');
                    var article = getArticleById(artId);
                    var category = article ? getCategoryById(article.category) : null;
                    
                    if (window.FavoritesHistory && artId && article) {
                        var nowFav = window.FavoritesHistory.toggleFavorite('article', artId, {
                            title: article.title,
                            category: article.category,
                            categoryName: category ? category.name : '',
                            readTime: article.readTime
                        });
                        
                        if (nowFav) {
                            this.classList.add('active');
                            this.querySelector('span').textContent = '已收藏';
                            if (window.Toast) {
                                window.Toast.success('已加入收藏');
                            }
                        } else {
                            this.classList.remove('active');
                            this.querySelector('span').textContent = '收藏';
                            if (window.Toast) {
                                window.Toast.info('已取消收藏');
                            }
                        }
                    }
                });
            }

            var prevNav = modalBody.querySelector('.knowledge-article-nav-prev');
            if (prevNav && prevArticle) {
                prevNav.addEventListener('click', function() {
                    var titleEl = this.querySelector('.knowledge-article-nav-title');
                    if (titleEl) {
                        var prevId = titleEl.getAttribute('data-article-id');
                        if (prevId) {
                            openArticleModal(prevId);
                        }
                    }
                });
            }

            var nextNav = modalBody.querySelector('.knowledge-article-nav-next');
            if (nextNav && nextArticle) {
                nextNav.addEventListener('click', function() {
                    var titleEl = this.querySelector('.knowledge-article-nav-title');
                    if (titleEl) {
                        var nextId = titleEl.getAttribute('data-article-id');
                        if (nextId) {
                            openArticleModal(nextId);
                        }
                    }
                });
            }
        }

        if (el.knowledgeModal) {
            el.knowledgeModal.classList.add('active');
            var modalContent = el.knowledgeModal.querySelector('.knowledge-modal-content');
            if (modalContent) {
                modalContent.scrollTop = 0;
            }
        }
    }

    function closeKnowledgeModal() {
        if (el.knowledgeModal) {
            el.knowledgeModal.classList.remove('active');
        }
        currentCategory = null;
        currentArticle = null;
        renderRecentArticles();
    }

    function destroy() {
        clearElementCache();
        container = null;
        currentCategory = null;
        currentArticle = null;
        if (searchTimer) {
            clearTimeout(searchTimer);
            searchTimer = null;
        }
    }

    function safeRender(containerEl) {
        try {
            render(containerEl);
        } catch (e) {
            console.error('[KnowledgeView] render error:', e);
            if (window.App && App.showErrorState) {
                App.showErrorState(containerEl, {
                    title: '页面加载失败',
                    desc: '小管家在加载知识库时遇到了一点小问题~',
                    primaryAction: '重试',
                    secondaryAction: '返回首页',
                    onPrimaryAction: function() {
                        safeRender(containerEl);
                    },
                    onSecondaryAction: function() {
                        if (App.switchView) {
                            App.switchView('home');
                        }
                    }
                });
            }
            if (window.Toast && Toast.error) {
                Toast.error('页面加载出错了');
            }
        }
    }

    function safeInit(containerEl) {
        try {
            init(containerEl);
        } catch (e) {
            console.error('[KnowledgeView] init error:', e);
            if (window.Toast && Toast.error) {
                Toast.error('页面初始化出错了');
            }
        }
    }

    function safeViewEnter(containerEl) {
        try {
            viewEnter(containerEl);
        } catch (e) {
            console.error('[KnowledgeView] viewEnter error:', e);
        }
    }

    function safeOpenArticle(articleId) {
        try {
            openArticleModal(articleId);
        } catch (e) {
            console.error('[KnowledgeView] openArticle error:', e);
        }
    }

    return {
        render: safeRender,
        init: safeInit,
        viewEnter: safeViewEnter,
        openArticle: safeOpenArticle,
        destroy: destroy
    };
})();
