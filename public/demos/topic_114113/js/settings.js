/* ============================================
   设置管理模块
   ============================================ */

var Settings = {
    STORAGE_KEY: 'laohuangli-settings',

    defaults: {
        fontSize: 'normal',   // normal, large, xlarge
        themeColor: 'red'     // red, gold, green
    },

    current: null,

    init: function() {
        this.load();
        this.apply();
    },

    load: function() {
        try {
            var saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                this.current = JSON.parse(saved);
            } else {
                this.current = Object.assign({}, this.defaults);
            }
        } catch (e) {
            this.current = Object.assign({}, this.defaults);
        }
    },

    save: function() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.current));
        } catch (e) {
            // ignore
        }
    },

    apply: function() {
        var body = document.body;

        // 清除旧的字体类
        body.classList.remove('font-normal', 'font-large', 'font-xlarge');
        body.classList.add('font-' + (this.current.fontSize || 'normal'));

        // 清除旧的主题类
        body.classList.remove('theme-red', 'theme-gold', 'theme-green');
        body.classList.add('theme-' + (this.current.themeColor || 'red'));

        // 更新设置面板按钮状态
        this.updateButtons();
    },

    updateButtons: function() {
        // 字体按钮
        var fontBtns = document.querySelectorAll('.font-option');
        fontBtns.forEach(function(btn) {
            btn.classList.toggle('active', btn.getAttribute('data-size') === Settings.current.fontSize);
        });

        // 颜色按钮
        var colorBtns = document.querySelectorAll('.color-option');
        colorBtns.forEach(function(btn) {
            btn.classList.toggle('active', btn.getAttribute('data-color') === Settings.current.themeColor);
        });
    },

    setFontSize: function(size) {
        this.current.fontSize = size;
        this.save();
        this.apply();
    },

    setThemeColor: function(color) {
        this.current.themeColor = color;
        this.save();
        this.apply();
    }
};
