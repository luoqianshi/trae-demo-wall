document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.getElementById('navbar');
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    const backToTop = document.getElementById('backToTop');
    const scrollProgress = document.getElementById('scrollProgress');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const numCounts = document.querySelectorAll('.num-count');
    const statNumbers = document.querySelectorAll('.stat-number');
    const bgMusic = document.getElementById('bgMusic');
    const musicControl = document.getElementById('musicControl');

    window.addEventListener('scroll', function() {
        const scrollY = window.scrollY;
        
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        if (scrollY > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }

        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollY / docHeight) * 100;
        if (scrollProgress) {
            scrollProgress.style.width = scrollPercent + '%';
        }
    });

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    if (navLinks) {
        navLinks.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

    if (backToTop) {
        backToTop.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    function openModal(title, content) {
        if (!modalOverlay) return;
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = content;
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modalOverlay) return;
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    window.openModal = openModal;
    window.closeModal = closeModal;

    function animateNumbers(el, target, duration = 2000) {
        const start = 0;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (target - start) * easeOutQuart);
            
            el.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target;
            }
        }
        
        requestAnimationFrame(update);
    }

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const numEl = entry.target;
                const target = parseInt(numEl.getAttribute('data-num'));
                if (!numEl.classList.contains('animated') && !isNaN(target)) {
                    numEl.classList.add('animated');
                    animateNumbers(numEl, target);
                }
            }
        });
    }, {
        threshold: 0.5
    });

    numCounts.forEach(function(el) {
        observer.observe(el);
    });

    function animateStatNumbers(el) {
        const target = parseFloat(el.getAttribute('data-target'));
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 2500;
        const start = 0;
        const startTime = performance.now();
        const isDecimal = target % 1 !== 0;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = start + (target - start) * easeOutQuart;
            
            const displayValue = isDecimal ? current.toFixed(1) : Math.floor(current);
            el.textContent = displayValue + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target + suffix;
            }
        }

        requestAnimationFrame(update);
    }

    const statObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const statEl = entry.target;
                if (!statEl.classList.contains('animated')) {
                    statEl.classList.add('animated');
                    animateStatNumbers(statEl);
                }
            }
        });
    }, {
        threshold: 0.3
    });

    statNumbers.forEach(function(el) {
        statObserver.observe(el);
    });

    if (musicControl && bgMusic) {
        const savedPlayState = localStorage.getItem('gongyi_music_playing');
        const savedTime = parseFloat(localStorage.getItem('gongyi_music_time')) || 0;
        
        bgMusic.currentTime = savedTime;
        
        if (savedPlayState === 'true') {
            bgMusic.play().then(function() {
                musicControl.classList.remove('paused');
                musicControl.classList.add('playing');
                musicControl.innerHTML = '<i class="fas fa-pause"></i>';
            }).catch(function(e) {
                console.log('音乐自动播放失败:', e);
            });
        }

        musicControl.addEventListener('click', function() {
            if (bgMusic.paused) {
                bgMusic.play().then(function() {
                    musicControl.classList.remove('paused');
                    musicControl.classList.add('playing');
                    musicControl.innerHTML = '<i class="fas fa-pause"></i>';
                    localStorage.setItem('gongyi_music_playing', 'true');
                }).catch(function(e) {
                    console.log('音乐播放失败:', e);
                });
            } else {
                bgMusic.pause();
                musicControl.classList.remove('playing');
                musicControl.classList.add('paused');
                musicControl.innerHTML = '<i class="fas fa-music"></i>';
                localStorage.setItem('gongyi_music_playing', 'false');
            }
        });

        bgMusic.addEventListener('timeupdate', function() {
            localStorage.setItem('gongyi_music_time', bgMusic.currentTime.toString());
        });

        bgMusic.addEventListener('pause', function() {
            localStorage.setItem('gongyi_music_playing', 'false');
        });

        bgMusic.addEventListener('play', function() {
            localStorage.setItem('gongyi_music_playing', 'true');
        });
    }

    const scrollElements = document.querySelectorAll('.features, .quick-links');
    
    const scrollObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    scrollElements.forEach(function(el) {
        scrollObserver.observe(el);
    });

    const heartIcons = document.querySelectorAll('.heart-icon');
    const loveMessages = [
        '爱是这个世界最美的语言 ❤️',
        '每一颗爱心都值得被珍藏 💕',
        '你的善意正在温暖这个世界 💖',
        '微光汇聚，点亮希望 ✨',
        '传递温暖，收获幸福 🌞',
        '爱出者爱返，福往者福来 🌸',
        '小小的善举，大大的温暖 🌟',
        '心有暖阳，无惧风霜 ☀️'
    ];

    heartIcons.forEach(function(icon) {
        icon.style.cursor = 'pointer';
        icon.addEventListener('click', function(e) {
            const message = loveMessages[Math.floor(Math.random() * loveMessages.length)];
            const toast = document.createElement('div');
            toast.className = 'love-toast';
            toast.textContent = message;
            toast.style.left = (e.clientX - 100) + 'px';
            toast.style.top = (e.clientY - 50) + 'px';
            document.body.appendChild(toast);

            setTimeout(function() {
                toast.classList.add('fade-out');
                setTimeout(function() {
                    document.body.removeChild(toast);
                }, 500);
            }, 2000);
        });
    });
});