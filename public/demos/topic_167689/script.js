// ===== Navbar Scroll Effect =====
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== Mobile Menu Toggle =====
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
});

// Close mobile menu when clicking a link
document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });
});

// ===== Code Tab Switching =====
const codeTabs = document.querySelectorAll('.code-tab');
const codeBodies = document.querySelectorAll('.code-body');

codeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        
        // Remove active from all tabs
        codeTabs.forEach(t => t.classList.remove('active'));
        // Add active to clicked tab
        tab.classList.add('active');
        
        // Hide all code bodies
        codeBodies.forEach(body => {
            body.classList.add('hidden');
            body.style.animation = 'none';
        });
        
        // Show the target code body
        const targetBody = document.querySelector(`[data-content="${target}"]`);
        if (targetBody) {
            targetBody.classList.remove('hidden');
            // Trigger reflow to restart animation
            void targetBody.offsetWidth;
            targetBody.style.animation = 'fadeInCode 0.4s ease';
        }
    });
});

// ===== Typing Animation =====
const typingText = document.getElementById('typingText');
const phrases = ['无限世界', '未来之路', '代码艺术', '创造之旅'];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingSpeed = 100;

function typeEffect() {
    const currentPhrase = phrases[phraseIndex];
    
    if (isDeleting) {
        typingText.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 50;
    } else {
        typingText.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 100;
    }
    
    if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true;
        typingSpeed = 2000;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typingSpeed = 500;
    }
    
    setTimeout(typeEffect, typingSpeed);
}

// Start typing animation after page load
setTimeout(typeEffect, 1000);

// ===== Animated Counter =====
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 60;
    const duration = 2000;
    const stepTime = duration / 60;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, stepTime);
}

// ===== Scroll Reveal Animation =====
const revealItems = document.querySelectorAll('.reveal-item');

function checkReveal() {
    const triggerBottom = window.innerHeight * 0.85;
    
    revealItems.forEach((item, index) => {
        const itemTop = item.getBoundingClientRect().top;
        
        if (itemTop < triggerBottom) {
            setTimeout(() => {
                item.classList.add('visible');
            }, index * 100);
        }
    });
}

// Initial check
window.addEventListener('load', () => {
    checkReveal();
    
    // Trigger counter animation when stats come into view
    const stats = document.querySelectorAll('.stat-number');
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, target);
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    stats.forEach(stat => statsObserver.observe(stat));
});

// Scroll event listener with throttle
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            checkReveal();
            ticking = false;
        });
        ticking = true;
    }
});

// ===== Card Click Interaction =====
const cards = document.querySelectorAll('.language-card');

cards.forEach(card => {
    card.addEventListener('click', () => {
        const language = card.getAttribute('data-language');
        
        // Add a brief scale animation
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);
        
        // Web 课程跳转
        if (language === 'web') {
            gotoWebCourse();
        }
    });
});

// ===== Web 课程智能跳转 =====
async function gotoWebCourse() {
    const result = await CL_Common.getNextLesson('web_lesson', 'lesson/web/lessons.js');
    if (result.completed.length > 0 && result.next <= result.total) {
        window.location.href = `lesson/web/lesson-${result.next}.html`;
    } else {
        window.location.href = 'lesson/web/lesson-1.html';
    }
}

// ===== Smooth Scroll for Nav Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== "开始学习" 按钮跳转到课程区域 =====
function scrollToLanguages() {
    const target = document.getElementById('languages');
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

const navCta = document.querySelector('.nav-cta');
if (navCta) {
    navCta.addEventListener('click', scrollToLanguages);
}

const mobileCta = document.querySelector('.mobile-cta');
if (mobileCta) {
    mobileCta.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        scrollToLanguages();
    });
}

// ===== Active Nav Link on Scroll =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ===== Button Ripple Effect =====
const buttons = document.querySelectorAll('.btn, .card-btn, .nav-cta');

buttons.forEach(button => {
    button.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            pointer-events: none;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            left: ${x}px;
            top: ${y}px;
            width: 100px;
            height: 100px;
            margin-left: -50px;
            margin-top: -50px;
        `;
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== Parallax Effect for Orbs =====
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const orbs = document.querySelectorAll('.floating-orb');
    
    orbs.forEach((orb, index) => {
        const speed = 0.1 + (index * 0.05);
        orb.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// ===== Card Tilt Effect (subtle 3D on mouse move) =====
cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

// ===== 清除学习进度 =====
const clearProgressBtn = document.getElementById('clearProgressBtn');
if (clearProgressBtn) {
    clearProgressBtn.addEventListener('click', () => {
        if (confirm('确定要清除所有学习进度吗？此操作不可撤销。')) {
            CL_Common.clearAllProgress();
            alert('学习进度已清除！');
        }
    });
}

// ===== 重置游戏数据 =====
document.addEventListener('DOMContentLoaded', function() {
    const clearGameBtn = document.getElementById('clearGameBtn');
    if (clearGameBtn) {
        clearGameBtn.addEventListener('click', function() {
            if (typeof CL_Game === 'undefined') {
                alert('游戏数据模块未加载，请刷新页面重试。');
                return;
            }
            if (confirm('确定要重置游戏数据吗？\n\n这将清除：生命值、金币、装备等级、药水状态等所有游戏数据。\n\n此操作不可撤销！')) {
                CL_Game.resetData();
                document.cookie = 'cl_story_watched=; max-age=0; path=/';
                alert('✅ 游戏数据已重置！\n\n生命值：10/10\n金币：0\n剑等级：1\n盾等级：1');
            }
        });
    }
});
