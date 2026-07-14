(function() {
    'use strict';

    var RELICS = {
        huying: {
            name: '虎鎣',
            fullName: '西周青铜虎鎣',
            relicDesc: '西周晚期青铜盛水器，圆明园旧藏，因流管卧虎造型得名，流失海外百余年，2018年入藏中国国家博物馆。',
            typeName: '爆发型近战',
            skillDesc: '虎啸疾风：极速突进，高攻击撕开敌方阵线',
            themeColor: '#cc6600',
            img: null
        },

        zilong: {
            name: '子龙鼎',
            fullName: '商子龙鼎',
            relicDesc: '商代末期青铜圆鼎，存世最大商代圆鼎之一，因内壁"子龙"铭文得名，与后母戊鼎并称"方圆双璧"。',
            typeName: '肉盾型',
            skillDesc: '龙鳞固守：超高防御力，为队友承受伤害',
            themeColor: '#8b4513',
            img: null
        },

        zengbo: {
            name: '曾伯克父簋',
            fullName: '春秋曾伯克父簋',
            relicDesc: '春秋早期曾国贵族青铜礼器，属"曾伯克父青铜组器"，2019年从日本追索回归，国家一级文物。',
            typeName: '支援型',
            skillDesc: '铭心引韵：每波灵韵自动抢夺1个，最多抢夺3个后消失',
            themeColor: '#556b2f',
            img: null
        },

        shuangyang: {
            name: '双羊尊',
            fullName: '商青铜双羊尊',
            relicDesc: '商代晚期青铜酒器，双羊背立驮尊造型为世之孤品，圆明园旧藏，现藏英国大英博物馆。',
            typeName: '战士型',
            skillDesc: '抵角冲：双角冲撞，击退前方敌人并造成范围伤害',
            themeColor: '#b8860b',
            img: null
        }
    };

    function drawRelicImage(ctx, img, x, y, size) {
        if (!img) return false;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        var iw = img.width;
        var ih = img.height;
        var scale = size / Math.max(iw, ih);
        var dw = iw * scale;
        var dh = ih * scale;
        var dx = x - dw / 2;
        var dy = y - dh / 2;
        ctx.drawImage(img, 0, 0, iw, ih, Math.floor(dx), Math.floor(dy), Math.ceil(dw), Math.ceil(dh));
        ctx.restore();
        return true;
    }

    window.RelicArtifacts = {
        setImages: function(relicAssets) {
            for (var key in relicAssets) {
                if (RELICS[key]) {
                    RELICS[key].img = relicAssets[key];
                }
            }
        },

        draw: function(ctx, key, x, y, size) {
            var relic = RELICS[key];
            if (!relic) return;
            drawRelicImage(ctx, relic.img, x, y, size);
        },

        getThemeColor: function(key) {
            var relic = RELICS[key];
            return relic ? relic.themeColor : '#666666';
        },

        getSkillDesc: function(key) {
            var relic = RELICS[key];
            return relic ? relic.skillDesc : '';
        },

        getTypeName: function(key) {
            var relic = RELICS[key];
            return relic ? relic.typeName : '';
        },

        getFullName: function(key) {
            var relic = RELICS[key];
            return relic ? relic.fullName : '';
        },

        getRelicDesc: function(key) {
            var relic = RELICS[key];
            return relic ? relic.relicDesc : '';
        }
    };
})();
