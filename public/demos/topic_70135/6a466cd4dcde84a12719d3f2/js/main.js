let currentFaqCategory = '全部';
let currentSoftwareCategory = '全部';

const videoPlaylist = [
    'videos/hero-bg-2.mp4',
    'videos/hero-bg-4.mp4',
    'videos/hero-bg-7.mp4'
];
let currentVideoIndex = 0;
let videoPlayer1 = null;
let videoPlayer2 = null;
let isVideoPlaying = false;
let isTransitioning = false;
const TRANSITION_DURATION = 1500;
let nextVideoReady = false;
let nextVideoSrc = '';
let lastTimeUpdate = 0;
let videoFailedCount = 0;
const MAX_VIDEO_FAILURES = 10;

document.addEventListener('DOMContentLoaded', function() {
    initHeroTextAnimation();
    initHomeSlides();
    loadData();
    initFeedbackForm();
    initCard3DEffect();
    initFeatureCards();
    initParallaxEffect();
    initVideoCarousel();
    initHighlightCarousel();
    initMouseInteraction();
});

function initVideoCarousel() {
    videoPlayer1 = document.querySelector('.hero-video-1');
    videoPlayer2 = document.querySelector('.hero-video-2');

    if (!videoPlayer1 || !videoPlayer2 || videoPlaylist.length === 0) return;

    function onVideoError(e) {
        videoFailedCount++;
        console.warn('Video load error:', e.target.currentSrc || e.target.src);
        if (videoFailedCount >= MAX_VIDEO_FAILURES) {
            handleVideoError();
        }
    }

    videoPlayer1.addEventListener('error', onVideoError);
    videoPlayer2.addEventListener('error', onVideoError);

    function checkVideoReady(player) {
        var playerSrc = player.getAttribute('src');
        if (playerSrc && nextVideoSrc && playerSrc === nextVideoSrc) {
            if (player.readyState >= 3) {
                nextVideoReady = true;
            }
        }
    }

    videoPlayer1.addEventListener('canplaythrough', function() {
        checkVideoReady(this);
    });
    videoPlayer2.addEventListener('canplaythrough', function() {
        checkVideoReady(this);
    });

    videoPlayer1.addEventListener('canplay', function() {
        checkVideoReady(this);
    });
    videoPlayer2.addEventListener('canplay', function() {
        checkVideoReady(this);
    });

    function onVideoEnded(e) {
        if (isTransitioning) return;
        var currentPlayer = e.target;
        var nextPlayer = currentPlayer === videoPlayer1 ? videoPlayer2 : videoPlayer1;
        startTransition(currentPlayer, nextPlayer);
    }

    videoPlayer1.addEventListener('ended', onVideoEnded);
    videoPlayer2.addEventListener('ended', onVideoEnded);

    if (videoPlaylist.length === 1) {
        videoPlayer1.src = videoPlaylist[0];
        videoPlayer1.loop = true;
        videoPlayer1.classList.add('active');
        videoPlayer1.addEventListener('canplay', function() {
            tryAutoPlay(videoPlayer1);
        }, { once: true });
        return;
    }

    videoPlayer1.classList.add('active');
    videoPlayer1.addEventListener('timeupdate', onVideoTimeUpdate);
    videoPlayer2.addEventListener('timeupdate', onVideoTimeUpdate);

    videoPlayer1.addEventListener('loadeddata', function() {
        if (!isVideoPlaying) {
            tryAutoPlay(videoPlayer1);
        }
    });

    videoPlayer1.src = videoPlaylist[0];

    document.addEventListener('click', function onClickFirst() {
        if (!isVideoPlaying) {
            const activePlayer = videoPlayer1.classList.contains('active') ? videoPlayer1 : videoPlayer2;
            activePlayer.play().then(() => {
                isVideoPlaying = true;
                scheduleNextVideo();
            }).catch(() => {});
        }
        document.removeEventListener('click', onClickFirst);
    });
}

function tryAutoPlay(player) {
    const playPromise = player.play();
    if (playPromise) {
        playPromise.then(() => {
            isVideoPlaying = true;
            scheduleNextVideo();
        }).catch(() => {
            isVideoPlaying = false;
            console.log('Autoplay blocked. Click anywhere to start video.');
        });
    }
}

function handleVideoError() {
    console.log('Video failed to load, falling back to static background.');
    if (videoPlayer1) videoPlayer1.style.display = 'none';
    if (videoPlayer2) videoPlayer2.style.display = 'none';
    const heroBg = document.querySelector('.hero-bg');
    if (heroBg) {
        heroBg.style.background = `
            radial-gradient(ellipse at 20% 30%, rgba(102, 126, 234, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(0, 212, 255, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(118, 75, 162, 0.2) 0%, transparent 60%),
            linear-gradient(135deg, #0a0e27 0%, #1a1f4a 50%, #0d1235 100%)
        `;
        heroBg.style.zIndex = '0';
    }
}

function scheduleNextVideo() {
    if (videoPlaylist.length <= 1) return;
    const nextIndex = (currentVideoIndex + 1) % videoPlaylist.length;
    const inactivePlayer = videoPlayer1.classList.contains('active') ? videoPlayer2 : videoPlayer1;
    const targetSrc = videoPlaylist[nextIndex];

    const currentInactiveSrc = inactivePlayer.getAttribute('src');
    if (currentInactiveSrc === targetSrc) {
        nextVideoReady = true;
        nextVideoSrc = targetSrc;
        if (inactivePlayer.readyState >= 3) {
            nextVideoReady = true;
        }
        return;
    }

    nextVideoReady = false;
    nextVideoSrc = targetSrc;
    inactivePlayer.src = targetSrc;
    inactivePlayer.load();
}

function onVideoTimeUpdate(e) {
    const now = Date.now();
    if (now - lastTimeUpdate < 500) return;
    lastTimeUpdate = now;

    if (!isVideoPlaying || isTransitioning) return;

    const currentPlayer = e.target;
    const nextPlayer = currentPlayer === videoPlayer1 ? videoPlayer2 : videoPlayer1;

    if (!currentPlayer.duration || isNaN(currentPlayer.duration)) return;

    const remaining = currentPlayer.duration - currentPlayer.currentTime;
    const progress = currentPlayer.currentTime / currentPlayer.duration;

    if (progress > 0.5 && !nextVideoSrc) {
        scheduleNextVideo();
    }

    if (remaining <= 1.5 && nextVideoReady) {
        startTransition(currentPlayer, nextPlayer);
    }
}

function startTransition(currentPlayer, nextPlayer) {
    if (isTransitioning) return;
    isTransitioning = true;

    currentVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length;

    nextPlayer.classList.add('active');

    var playNext = function() {
        setTimeout(function() {
            currentPlayer.classList.remove('active');
            currentPlayer.pause();
            currentPlayer.currentTime = 0;
            nextVideoReady = false;
            nextVideoSrc = '';
            isTransitioning = false;
            scheduleNextVideo();
        }, TRANSITION_DURATION);
    };

    var playPromise = nextPlayer.play();
    if (playPromise) {
        playPromise.then(playNext).catch(function() {
            playNext();
        });
    } else {
        playNext();
    }
}

function pauseVideoCarousel() {
    if (!videoPlayer1 || !videoPlayer2) return;
    videoPlayer1.pause();
    videoPlayer2.pause();
}

function resumeVideoCarousel() {
    if (!videoPlayer1 || !videoPlayer2 || videoPlaylist.length === 0) return;
    const activePlayer = videoPlayer1.classList.contains('active') ? videoPlayer1 : videoPlayer2;
    activePlayer.play().catch(() => {});
}

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        pauseVideoCarousel();
    } else {
        resumeVideoCarousel();
    }
});

function loadData() {
    try {
        renderFaqCategories();
        renderFaqs(faqs);
        renderSoftwareCategories();
        renderSoftware(softwareList);
    } catch (e) {
        console.warn('数据加载出错:', e);
    }
}

function navigateTo(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });

    const targetPage = document.querySelector(`#page-${pageId}`);
    targetPage.classList.add('active');

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`.nav-links a[onclick="navigateTo('${pageId}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // 切换到首页时重置到第一屏
    if (pageId === 'home') {
        currentSlide = 0;
        document.querySelectorAll('.home-slide').forEach(function(s, i) {
            s.classList.remove('active', 'prev');
            if (i === 0) s.classList.add('active');
        });
        document.querySelectorAll('.slide-dot').forEach(function(d, i) {
            d.classList.toggle('active', i === 0);
        });
        // 重置时导航点不显示（只在最后一屏显示）
        const navDots = document.getElementById('slideNavDots');
        if (navDots) navDots.classList.remove('show');
        
        // 首页第一屏淡入动画
        setTimeout(function() {
            var firstSlide = document.querySelector('.home-slide.active');
            if (firstSlide) {
                var items = firstSlide.querySelectorAll('.fade-in-item');
                items.forEach(function(item) {
                    item.classList.remove('visible');
                });
                items.forEach(function(item, idx) {
                    setTimeout(function() {
                        item.classList.add('visible');
                    }, idx * 80);
                });
            }
        }, 100);
    } else {
        // 非首页页面：重置并重新触发淡入动画
        const fadeItems = targetPage.querySelectorAll('.fade-in-item');
        fadeItems.forEach(function(item) {
            item.classList.remove('visible');
        });
        setTimeout(function() {
            fadeItems.forEach(function(item, idx) {
                setTimeout(function() {
                    item.classList.add('visible');
                }, idx * 80);
            });
        }, 200);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pageId === 'faq') {
        renderFaqs(faqs);
    } else if (pageId === 'software') {
        renderSoftware(softwareList);
    }

    refreshCard3DEffect();
}

function initFeatureCards() {
    document.querySelectorAll('.feature-card[data-page]').forEach(card => {
        card.addEventListener('click', function() {
            navigateTo(this.dataset.page);
        });
    });
}

function renderFaqCategories() {
    const categories = ['全部', ...new Set(faqs.map(faq => faq.category))];
    const container = document.querySelector('.faq-categories');

    if (!container) return;

    container.innerHTML = categories.map(category => `
        <div class="category-tag ${category === currentFaqCategory ? 'active' : ''}"
             onclick="filterFaqs('${category}')">
            <span>${category}</span>
        </div>
    `).join('');
}

function filterFaqs(category) {
    currentFaqCategory = category;
    faqDisplayCount = 20;
    renderFaqCategories();

    const searchQuery = document.getElementById('faq-search-input').value.toLowerCase();
    let filtered = faqs;

    if (currentFaqCategory !== '全部') {
        filtered = filtered.filter(faq => faq.category === currentFaqCategory);
    }

    if (searchQuery) {
        filtered = filtered.filter(faq =>
            faq.title.toLowerCase().includes(searchQuery) ||
            faq.description.toLowerCase().includes(searchQuery) ||
            faq.tags.some(tag => tag.toLowerCase().includes(searchQuery))
        );
    }

    renderFaqs(filtered);
}

let faqDisplayCount = 20;
const FAQ_LOAD_STEP = 20;

function renderFaqs(data) {
    const container = document.querySelector('.faq-items-grid');
    const countEl = document.getElementById('faq-count');

    if (!container) return;

    if (countEl) {
        countEl.textContent = `共 ${data.length} 个问题`;
    }

    if (data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="empty-icon fas fa-search"></i>
                <div class="empty-title">未找到相关问题</div>
                <div class="empty-desc">请尝试其他关键词或分类</div>
            </div>
        `;
        return;
    }

    const displayData = data.slice(0, faqDisplayCount);
    const hasMore = faqDisplayCount < data.length;

    const faqHtml = displayData.map(faq => `
        <div class="faq-card glass-card" onclick="toggleFaqAnswer(this)">
            <div class="faq-card-top">
                <h3 class="faq-card-title">${faq.title}</h3>
                <div class="faq-card-icon">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
            <p class="faq-card-desc">${faq.description}</p>
            <div class="faq-card-tags">
                ${faq.tags.map(tag => `<span class="faq-card-tag">${tag}</span>`).join('')}
            </div>
            <div class="faq-card-answer">
                <div class="faq-card-answer-inner">${formatAnswer(faq.answer)}</div>
            </div>
        </div>
    `).join('');

    const loadMoreHtml = hasMore ? `
        <div class="load-more-wrapper">
            <button class="load-more-btn" onclick="loadMoreFaqs(event)">
                <span>展开更多 (${data.length - faqDisplayCount} 个)</span>
                <i class="fas fa-chevron-down"></i>
            </button>
        </div>
    ` : (faqDisplayCount >= data.length && data.length > FAQ_LOAD_STEP ? `
        <div class="load-more-wrapper">
            <button class="load-more-btn collapsed" onclick="collapseFaqs(event)">
                <span>收起</span>
                <i class="fas fa-chevron-down"></i>
            </button>
        </div>
    ` : '');

    container.innerHTML = faqHtml + loadMoreHtml;
}

function loadMoreFaqs(e) {
    e.stopPropagation();
    faqDisplayCount += FAQ_LOAD_STEP;
    const searchQuery = document.getElementById('faq-search-input').value.toLowerCase();
    let filtered = faqs;

    if (currentFaqCategory !== '全部') {
        filtered = filtered.filter(f => f.category === currentFaqCategory);
    }

    if (searchQuery) {
        filtered = filtered.filter(f =>
            f.title.toLowerCase().includes(searchQuery) ||
            f.description.toLowerCase().includes(searchQuery) ||
            f.category.toLowerCase().includes(searchQuery)
        );
    }

    renderFaqs(filtered);
}

function collapseFaqs(e) {
    e.stopPropagation();
    faqDisplayCount = 20;
    const searchQuery = document.getElementById('faq-search-input').value.toLowerCase();
    let filtered = faqs;

    if (currentFaqCategory !== '全部') {
        filtered = filtered.filter(f => f.category === currentFaqCategory);
    }

    if (searchQuery) {
        filtered = filtered.filter(f =>
            f.title.toLowerCase().includes(searchQuery) ||
            f.description.toLowerCase().includes(searchQuery) ||
            f.category.toLowerCase().includes(searchQuery)
        );
    }

    renderFaqs(filtered);
    document.querySelector('#page-faq .content-section').scrollIntoView({ behavior: 'smooth' });
}

function toggleFaqAnswer(card) {
    const isExpanded = card.classList.contains('expanded');

    document.querySelectorAll('.faq-items-grid .faq-card').forEach(c => {
        c.classList.remove('expanded');
        const icon = c.querySelector('.faq-card-icon i');
        if (icon) icon.className = 'fas fa-chevron-down';
    });

    if (!isExpanded) {
        card.classList.add('expanded');
        const icon = card.querySelector('.faq-card-icon i');
        if (icon) icon.className = 'fas fa-chevron-up';
    }
}

function formatAnswer(answer) {
    return answer.split('\n').map(line => {
        if (line.trim().startsWith('**')) {
            return `<strong>${line.replace(/\*\*/g, '')}</strong>`;
        }
        if (line.trim()) {
            return `<p>${line}</p>`;
        }
        return '';
    }).join('');
}

function renderSoftwareCategories() {
    const categories = ['全部', ...new Set(softwareList.map(s => s.category))];
    const container = document.querySelector('.software-categories');

    if (!container) return;

    container.innerHTML = categories.map(category => `
        <div class="category-tag ${category === currentSoftwareCategory ? 'active' : ''}"
             onclick="filterSoftware('${category}')">
            <span>${category}</span>
        </div>
    `).join('');
}

function filterSoftware(category) {
    currentSoftwareCategory = category;
    softwareDisplayCount = 10;
    renderSoftwareCategories();

    const searchQuery = document.getElementById('software-search-input').value.toLowerCase();
    let filtered = softwareList;

    if (currentSoftwareCategory !== '全部') {
        filtered = filtered.filter(s => s.category === currentSoftwareCategory);
    }

    if (searchQuery) {
        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(searchQuery) ||
            s.description.toLowerCase().includes(searchQuery) ||
            s.category.toLowerCase().includes(searchQuery)
        );
    }

    renderSoftware(filtered);
}

let softwareDisplayCount = 10;
const SOFTWARE_LOAD_STEP = 12;

function renderSoftware(data) {
    const container = document.querySelector('.software-items-grid');
    const countEl = document.getElementById('software-count');

    if (!container) return;

    if (countEl) {
        countEl.textContent = `共 ${data.length} 款软件`;
    }

    if (data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="empty-icon fas fa-search"></i>
                <div class="empty-title">未找到相关软件</div>
                <div class="empty-desc">请尝试其他关键词或分类</div>
            </div>
        `;
        return;
    }

    const displayData = data.slice(0, softwareDisplayCount);
    const hasMore = softwareDisplayCount < data.length;

    const softwareHtml = displayData.map(software => `
        <div class="software-card glass-card">
            <div class="software-card-top">
                <div class="software-card-icon">
                    <i class="fas ${software.icon}"></i>
                </div>
                <div class="software-card-head">
                    <h3 class="software-card-name">${software.name}</h3>
                    <div class="software-card-cat">${software.category}</div>
                </div>
            </div>
            <p class="software-card-desc">${software.description}</p>
            <div class="software-card-meta">
                <span><i class="fas fa-hdd"></i> ${software.size}</span>
                <span><i class="fas fa-tag"></i> v${software.version}</span>
            </div>
            <div class="software-card-footer">
                <div class="software-card-safe">
                    <i class="fas fa-shield-alt"></i> 官方安全
                </div>
                <a href="${software.download_url}" target="_blank" class="btn-download">
                    <span><i class="fas fa-download"></i> 下载</span>
                </a>
            </div>
        </div>
    `).join('');

    const loadMoreHtml = hasMore ? `
        <div class="load-more-wrapper">
            <button class="load-more-btn" onclick="loadMoreSoftware(event)">
                <span>展开更多 (${data.length - softwareDisplayCount} 款)</span>
                <i class="fas fa-chevron-down"></i>
            </button>
        </div>
    ` : (softwareDisplayCount >= data.length && data.length > SOFTWARE_LOAD_STEP ? `
        <div class="load-more-wrapper">
            <button class="load-more-btn collapsed" onclick="collapseSoftware(event)">
                <span>收起</span>
                <i class="fas fa-chevron-down"></i>
            </button>
        </div>
    ` : '');

    container.innerHTML = softwareHtml + loadMoreHtml;
}

function loadMoreSoftware(e) {
    e.stopPropagation();
    softwareDisplayCount += SOFTWARE_LOAD_STEP;
    const searchQuery = document.getElementById('software-search-input').value.toLowerCase();
    let filtered = softwareList;

    if (currentSoftwareCategory !== '全部') {
        filtered = filtered.filter(s => s.category === currentSoftwareCategory);
    }

    if (searchQuery) {
        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(searchQuery) ||
            s.description.toLowerCase().includes(searchQuery) ||
            s.category.toLowerCase().includes(searchQuery)
        );
    }

    renderSoftware(filtered);
}

function collapseSoftware(e) {
    e.stopPropagation();
    softwareDisplayCount = 10;
    const searchQuery = document.getElementById('software-search-input').value.toLowerCase();
    let filtered = softwareList;

    if (currentSoftwareCategory !== '全部') {
        filtered = filtered.filter(s => s.category === currentSoftwareCategory);
    }

    if (searchQuery) {
        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(searchQuery) ||
            s.description.toLowerCase().includes(searchQuery) ||
            s.category.toLowerCase().includes(searchQuery)
        );
    }

    renderSoftware(filtered);
    document.querySelector('#page-software .content-section').scrollIntoView({ behavior: 'smooth' });
}

function initFeedbackForm() {
    const form = document.getElementById('feedback-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('feedback-name').value.trim();
        const phone = document.getElementById('feedback-phone').value.trim();
        const message = document.getElementById('feedback-message').value.trim();

        let isValid = true;

        if (!name) {
            showFeedbackError('feedback-name', '请输入您的姓名');
            isValid = false;
        } else {
            hideFeedbackError('feedback-name');
        }

        if (!phone) {
            showFeedbackError('feedback-phone', '请输入联系电话');
            isValid = false;
        } else if (!/^1[3-9]\d{9}$/.test(phone)) {
            showFeedbackError('feedback-phone', '请输入有效的手机号码');
            isValid = false;
        } else {
            hideFeedbackError('feedback-phone');
        }

        if (!message) {
            showFeedbackError('feedback-message', '请输入反馈内容');
            isValid = false;
        } else {
            hideFeedbackError('feedback-message');
        }

        if (isValid) {
            const btn = form.querySelector('.btn-submit');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
            btn.disabled = true;

            setTimeout(function() {
                btn.innerHTML = originalText;
                btn.disabled = false;
                form.reset();

                const successMessage = document.querySelector('.success-message');
                successMessage.classList.add('show');

                setTimeout(function() {
                    successMessage.classList.remove('show');
                }, 3000);
            }, 1500);
        }
    });

    document.querySelectorAll('#feedback-form .form-group input, #feedback-form .form-group textarea').forEach(input => {
        input.addEventListener('focus', function() {
            hideFeedbackError(this.id);
        });

        input.addEventListener('input', function() {
            if (this.parentElement.classList.contains('has-error')) {
                hideFeedbackError(this.id);
            }
        });
    });
}

function showFeedbackError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.parentElement;
    formGroup.classList.add('has-error');
    formGroup.querySelector('.error').textContent = message;
}

function hideFeedbackError(fieldId) {
    const field = document.getElementById(fieldId);
    const formGroup = field.parentElement;
    formGroup.classList.remove('has-error');
}

document.getElementById('faq-search-input')?.addEventListener('input', function() {
    filterFaqs(currentFaqCategory);
});

document.getElementById('software-search-input')?.addEventListener('input', function() {
    filterSoftware(currentSoftwareCategory);
});

function initCard3DEffect() {
    const cards = document.querySelectorAll('.glass-card');

    cards.forEach(card => {
        if (card.dataset.tiltBound) return;
        card.dataset.tiltBound = '1';

        card.addEventListener('mousemove', function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            card.style.transition = 'transform 0.1s ease-out';
        });

        card.addEventListener('mouseleave', function() {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });
}

function initParallaxEffect() {
    const heroFullscreen = document.querySelector('.hero-fullscreen');
    const heroFullTitle = document.querySelector('.hero-full-title');
    const heroFullSubtitle = document.querySelector('.hero-full-subtitle');

    document.addEventListener('mousemove', function(e) {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        if (heroFullTitle) {
            heroFullTitle.style.transform = `translate(${x * 8}px, ${y * 8}px)`;
        }
        if (heroFullSubtitle) {
            heroFullSubtitle.style.transform = `translate(${x * 5}px, ${y * 5}px)`;
        }
    });

    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        if (heroFullscreen && scrolled < window.innerHeight) {
            const rate = scrolled * 0.4;
            heroFullscreen.style.transform = `translateY(${rate}px)`;
        }
    });

    // 滚动淡入动画
    function initScrollFadeIn() {
        const fadeItems = document.querySelectorAll('.page-section:not(#page-home) .fade-in-item');
        if (fadeItems.length === 0) return;

        function checkFadeIn() {
            const windowHeight = window.innerHeight;
            const triggerPoint = windowHeight * 0.85;

            fadeItems.forEach(function(item) {
                if (item.classList.contains('visible')) return;
                const rect = item.getBoundingClientRect();
                if (rect.top < triggerPoint && rect.bottom > 0) {
                    item.classList.add('visible');
                }
            });
        }

        window.addEventListener('scroll', checkFadeIn);
        checkFadeIn();
    }
    initScrollFadeIn();
}

function refreshCard3DEffect() {
    setTimeout(function() {
        const cards = document.querySelectorAll('.glass-card');
        cards.forEach(card => {
            if (card.dataset.tiltBound) return;
            card.dataset.tiltBound = '1';

            card.addEventListener('mousemove', function(e) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
                card.style.transition = 'transform 0.1s ease-out';
            });

            card.addEventListener('mouseleave', function() {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
                card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            });
        });
    }, 500);
}

/* ===== 热门内容轮播 ===== */
let highlightCurrentIndex = 0;
const highlightItemsPerView = 3;
let highlightAutoPlayTimer = null;

function initHighlightCarousel() {
    const carousel = document.getElementById('highlightCarousel');
    if (!carousel) return;

    const indicators = document.querySelectorAll('#highlightIndicators .carousel-dot');
    indicators.forEach(function(dot, index) {
        dot.addEventListener('click', function() {
            goToHighlightSlide(index);
        });
    });

    startHighlightAutoPlay();

    carousel.addEventListener('mouseenter', function() {
        stopHighlightAutoPlay();
    });
    carousel.addEventListener('mouseleave', function() {
        startHighlightAutoPlay();
    });
}

function scrollHighlight(direction) {
    const carousel = document.getElementById('highlightCarousel');
    if (!carousel) return;

    const totalItems = carousel.children.length;
    const totalPages = Math.ceil(totalItems / highlightItemsPerView);

    highlightCurrentIndex += direction;
    if (highlightCurrentIndex < 0) highlightCurrentIndex = totalPages - 1;
    if (highlightCurrentIndex >= totalPages) highlightCurrentIndex = 0;

    goToHighlightSlide(highlightCurrentIndex);
}

function goToHighlightSlide(index) {
    const carousel = document.getElementById('highlightCarousel');
    if (!carousel) return;

    const totalItems = carousel.children.length;
    const totalPages = Math.ceil(totalItems / highlightItemsPerView);

    if (index < 0) index = totalPages - 1;
    if (index >= totalPages) index = 0;

    highlightCurrentIndex = index;

    const cardWidth = carousel.children[0].offsetWidth;
    const gap = 28;
    const scrollAmount = index * (cardWidth + gap) * highlightItemsPerView;

    carousel.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
    });

    const indicators = document.querySelectorAll('#highlightIndicators .carousel-dot');
    indicators.forEach(function(dot, i) {
        dot.classList.toggle('active', i === index);
    });
}

function startHighlightAutoPlay() {
    stopHighlightAutoPlay();
    highlightAutoPlayTimer = setInterval(function() {
        scrollHighlight(1);
    }, 4000);
}

function stopHighlightAutoPlay() {
    if (highlightAutoPlayTimer) {
        clearInterval(highlightAutoPlayTimer);
        highlightAutoPlayTimer = null;
    }
}

/* ===== 鼠标交互效果 ===== */
function initMouseInteraction() {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;

    // 触摸设备不启用
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    // 小圆点紧跟鼠标
    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';
    });

    // 大圆环平滑跟随（lerp 插值）
    function animateRing() {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';
        requestAnimationFrame(animateRing);
    }
    animateRing();

    // 悬停可交互元素时光环放大
    const hoverSelector = 'a, button, input, textarea, select, .glass-card, .faq-item, .software-card, .feature-card, .faq-quick-link, .btn-submit, .floating-help-btn, .nav-links a, .filter-btn, .expand-btn';

    document.addEventListener('mouseover', function(e) {
        if (e.target.closest(hoverSelector)) {
            dot.classList.add('hovering');
            ring.classList.add('hovering');
        }
    });

    document.addEventListener('mouseout', function(e) {
        if (e.target.closest(hoverSelector)) {
            dot.classList.remove('hovering');
            ring.classList.remove('hovering');
        }
    });

    // 点击涟漪效果
    document.addEventListener('click', function(e) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = e.clientX + 'px';
        ripple.style.top = e.clientY + 'px';
        document.body.appendChild(ripple);
        setTimeout(function() { ripple.remove(); }, 600);
    });

    // 磁吸效果：按钮靠近时微微吸附
    const magneticSelector = '.btn-submit, .floating-help-btn, .faq-quick-link, .filter-btn, .expand-btn';
    document.querySelectorAll(magneticSelector).forEach(function(el) {
        if (el.dataset.magneticBound) return;
        el.dataset.magneticBound = '1';

        el.addEventListener('mousemove', function(e) {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // 距离越近，偏移越大（最大15px）
            const power = Math.min(15, 40 / Math.max(dist, 1) * 15);
            el.style.transform = 'translate(' + (dx / rect.width * power) + 'px, ' + (dy / rect.height * power) + 'px)';
        });

        el.addEventListener('mouseleave', function() {
            el.style.transform = 'translate(0, 0)';
        });
    });
}

/* ===== 首页标题逐字入场动画 ===== */
function initHeroTextAnimation() {
    const lines = document.querySelectorAll('.hero-title-line[data-text]');
    let totalDelay = 0;

    lines.forEach(function(line) {
        const text = line.dataset.text || '';
        const chars = text.split('');
        chars.forEach(function(ch) {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = ch;
            span.style.animationDelay = totalDelay + 's';
            line.appendChild(span);
            totalDelay += 0.08;
        });
        totalDelay += 0.15;
    });
}

/* ===== 首页全屏翻页系统 ===== */
let currentSlide = 0;
const totalSlides = 4;
let isSlideAnimating = false;
let slideWheelLock = false;

function initHomeSlides() {
    const container = document.querySelector('.home-slides-container');
    if (!container) return;

    const dots = document.querySelectorAll('.slide-dot');

    function goToSlide(index) {
        if (isSlideAnimating || index < 0 || index >= totalSlides || index === currentSlide) return;
        isSlideAnimating = true;

        const slides = document.querySelectorAll('.home-slide');
        const prevIndex = currentSlide;
        currentSlide = index;

        slides.forEach(function(s, i) {
            s.classList.remove('active', 'prev');
            var fadeItems = s.querySelectorAll('.fade-in-item');
            fadeItems.forEach(function(item) {
                item.classList.remove('visible');
            });
            if (i === index) {
                s.classList.add('active');
                setTimeout(function() {
                    var items = s.querySelectorAll('.fade-in-item');
                    items.forEach(function(item, idx) {
                        setTimeout(function() {
                            item.classList.add('visible');
                        }, idx * 50);
                    });
                }, 200);
            } else if (i === prevIndex) {
                s.classList.add('prev');
            }
        });

        dots.forEach(function(d, i) {
            d.classList.toggle('active', i === index);
        });

        // 导航点只在最后一屏（为什么选择易芯）显示
        const navDots = document.getElementById('slideNavDots');
        if (navDots) {
            navDots.classList.toggle('show', index === totalSlides - 1);
        }

        setTimeout(function() {
            isSlideAnimating = false;
            refreshCard3DEffect();
        }, 900);
    }

    // 滚轮翻页
    const homePage = document.getElementById('page-home');
    homePage.addEventListener('wheel', function(e) {
        if (!homePage.classList.contains('active')) return;

        e.preventDefault();
        if (slideWheelLock) return;
        slideWheelLock = true;

        if (e.deltaY > 0) {
            goToSlide(currentSlide + 1);
        } else {
            goToSlide(currentSlide - 1);
        }

        setTimeout(function() { slideWheelLock = false; }, 1000);
    }, { passive: false });

    // 触摸滑动
    let touchStartY = 0;
    homePage.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    homePage.addEventListener('touchend', function(e) {
        if (!homePage.classList.contains('active')) return;
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                goToSlide(currentSlide + 1);
            } else {
                goToSlide(currentSlide - 1);
            }
        }
    }, { passive: true });

    // 点击导航点
    dots.forEach(function(dot) {
        dot.addEventListener('click', function() {
            goToSlide(parseInt(this.dataset.slide));
        });
    });

    // 键盘上下键
    document.addEventListener('keydown', function(e) {
        if (!homePage.classList.contains('active')) return;
        if (e.key === 'ArrowDown' || e.key === 'PageDown') {
            e.preventDefault();
            goToSlide(currentSlide + 1);
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            goToSlide(currentSlide - 1);
        }
    });

    // 初始化第一屏淡入动画
    setTimeout(function() {
        var firstSlide = document.querySelector('.home-slide.active');
        if (firstSlide) {
            var items = firstSlide.querySelectorAll('.fade-in-item');
            items.forEach(function(item, idx) {
                setTimeout(function() {
                    item.classList.add('visible');
                }, idx * 80);
            });
        }
    }, 300);
}