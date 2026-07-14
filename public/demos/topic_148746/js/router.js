const Router = {
    currentPage: 'home',
    pages: {},

    register(pageName, renderFunction) {
        this.pages[pageName] = renderFunction;
    },

    navigate(pageName) {
        this.currentPage = pageName;
        if (GamesModule && GamesModule.stopTimer) {
            GamesModule.stopTimer();
        }
        if (VocabularyModule && VocabularyModule.stopTimer) {
            VocabularyModule.stopTimer();
        }
        if (GrammarModule && GrammarModule.stopTimer) {
            GrammarModule.stopTimer();
        }
        if (MathModule && MathModule.stopTimer) {
            MathModule.stopTimer();
        }
        if (ChineseModule && ChineseModule.stopTimer) {
            ChineseModule.stopTimer();
        }
        this.render();
        this.updateNav();
    },

    render() {
        const content = document.getElementById('page-content');
        const renderFunction = this.pages[this.currentPage];
        if (renderFunction) {
            content.innerHTML = renderFunction();
        }
    },

    updateNav() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === this.currentPage) {
                btn.classList.add('active');
            }
        });
    },

    init() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigate(btn.dataset.page);
            });
        });

        this.render();
        this.updateNav();
    }
};
