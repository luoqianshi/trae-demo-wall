document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    initNavigation();
    initScenarioToggle();
});

function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop - 100 && window.scrollY < sectionTop + sectionHeight - 100) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(currentSection)) {
                link.classList.add('active');
            }
        });
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

function toggleNav() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

function toggleScenario(scenarioId) {
    const content = document.getElementById(`scenario-${scenarioId}`);
    const header = content.parentElement.querySelector('.scenario-header');

    content.classList.toggle('active');
    header.classList.toggle('active');

    const sections = document.querySelectorAll('.scenario-content');
    const headers = document.querySelectorAll('.scenario-header');

    sections.forEach((sec, index) => {
        const currentId = parseInt(sec.id.split('-')[1]);
        if (currentId !== scenarioId && sec.classList.contains('active')) {
            sec.classList.remove('active');
            headers[index].classList.remove('active');
        }
    });
}

function initScenarioToggle() {
    const scenarioHeaders = document.querySelectorAll('.scenario-header');
    scenarioHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const scenarioId = content.id.split('-')[1];
            toggleScenario(scenarioId);
        });
    });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            const offset = 60;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});