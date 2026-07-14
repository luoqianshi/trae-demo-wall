(function() {
    'use strict';

    var BASE_W = 650;
    var BASE_H = 450;

    var PINYIN_MAP = {
        huying: 'Hǔ Yíng · Xiào Shān',
        zilong: 'Zǐ Lóng · Qíng Tiān',
        zengbo: 'Zēng Bó · Míng Xīn',
        shuangyang: 'Shuāng Yáng · Dǐ Jiǎo'
    };

    var STAT_MAX = {
        attack: 12,
        defense: 12,
        hp: 25,
        speed: 60
    };

    var FONT_FAMILY = '"Microsoft YaHei", "PingFang SC", "SimHei", sans-serif';

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function wrapText(ctx, text, maxWidth) {
        var lines = [];
        var currentLine = '';
        for (var i = 0; i < text.length; i++) {
            var char = text.charAt(i);
            var testLine = currentLine + char;
            var metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }
        if (lines.length > 2) {
            lines = lines.slice(0, 2);
            lines[1] = lines[1].slice(0, -1) + '…';
        }
        return lines;
    }

    function drawCorner(ctx, x, y, dx, dy, color, size) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + dx * size, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + dy * size);
        ctx.stroke();
        ctx.restore();
    }

    function drawBackground(ctx, themeColor, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;

        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 18;
        ctx.fillStyle = 'rgba(15, 12, 8, 0.92)';
        ctx.fillRect(0, 0, BASE_W, BASE_H);

        ctx.shadowBlur = 0;
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(1.5, 1.5, BASE_W - 3, BASE_H - 3);

        var cornerSize = 22;
        var goldColor = '#d4af37';
        drawCorner(ctx, 10, 10, 1, 1, goldColor, cornerSize);
        drawCorner(ctx, BASE_W - 10, 10, -1, 1, goldColor, cornerSize);
        drawCorner(ctx, 10, BASE_H - 10, 1, -1, goldColor, cornerSize);
        drawCorner(ctx, BASE_W - 10, BASE_H - 10, -1, -1, goldColor, cornerSize);

        ctx.restore();
    }

    function drawImageSection(ctx, spiritKey, assets, slideOffset) {
        var padding = 28;
        var sectionX = padding;
        var sectionY = padding + slideOffset;
        var sectionW = BASE_W / 2 - padding * 1.5;
        var imgSize = 180;
        var labelH = 28;

        var relicCX = sectionX + sectionW / 2;
        var relicCY = sectionY + imgSize / 2;
        if (window.RelicArtifacts) {
            window.RelicArtifacts.draw(ctx, spiritKey, relicCX, relicCY, imgSize);
        }

        ctx.save();
        ctx.font = '16px ' + FONT_FAMILY;
        ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
        ctx.textAlign = 'center';
        var relicFullName = window.RelicArtifacts ? window.RelicArtifacts.getFullName(spiritKey) : '';
        ctx.fillText(relicFullName || '原始文物', relicCX, relicCY + imgSize / 2 + 22);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = 'rgba(100, 80, 50, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sectionX + 12, sectionY + imgSize + labelH + 12);
        ctx.lineTo(sectionX + sectionW - 12, sectionY + imgSize + labelH + 12);
        ctx.stroke();
        ctx.restore();

        var spiritImgY = sectionY + imgSize + labelH + 24;
        var spiritCX = sectionX + sectionW / 2;
        var spiritCY = spiritImgY + imgSize / 2;

        var spirit = assets.spirits[spiritKey];
        if (spirit && spirit.idle && spirit.idle.img) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            var img = spirit.idle.img;
            ctx.drawImage(img, 0, 0, 96, 96, spiritCX - imgSize / 2, spiritCY - imgSize / 2, imgSize, imgSize);
            ctx.restore();
        } else {
            ctx.save();
            ctx.fillStyle = 'rgba(40, 35, 30, 0.9)';
            ctx.fillRect(spiritCX - imgSize / 2, spiritCY - imgSize / 2, imgSize, imgSize);
            ctx.strokeStyle = 'rgba(100, 80, 50, 0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(spiritCX - imgSize / 2, spiritCY - imgSize / 2, imgSize, imgSize);
            ctx.font = 'bold 72px ' + FONT_FAMILY;
            ctx.fillStyle = 'rgba(150, 130, 80, 0.6)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('？', spiritCX, spiritCY);
            ctx.restore();
        }

        ctx.save();
        ctx.font = '16px ' + FONT_FAMILY;
        ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText('灵物战士', spiritCX, spiritCY + imgSize / 2 + 22);
        ctx.restore();
    }

    function drawTextSection(ctx, spiritKey, assets, themeColor, slideOffset) {
        var padding = 28;
        var textX = BASE_W / 2 + 8;
        var textW = BASE_W / 2 - padding * 2;
        var currentY = padding + 24 + slideOffset;

        var pinyin = PINYIN_MAP[spiritKey] || '';
        var stats = assets.spirits[spiritKey] ? assets.spirits[spiritKey].stats : null;
        var name = stats ? stats.name : (spiritKey === 'shuangyang' ? '双羊·抵角' : '未知');
        var typeName = window.RelicArtifacts ? window.RelicArtifacts.getTypeName(spiritKey) : '';
        var skillDesc = window.RelicArtifacts ? window.RelicArtifacts.getSkillDesc(spiritKey) : '';
        var cost = stats ? stats.cost : 2;
        var attack = stats ? stats.attack : 0;
        var defense = stats ? stats.defense : 0;
        var hp = stats ? stats.hp : 0;
        var speed = stats ? stats.speed : 0;

        ctx.save();
        ctx.font = '18px ' + FONT_FAMILY;
        ctx.fillStyle = 'rgba(255, 215, 120, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(pinyin, textX + textW / 2, currentY);
        currentY += 38;

        ctx.font = 'bold 36px ' + FONT_FAMILY;
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(name, textX + textW / 2, currentY);
        ctx.shadowBlur = 0;
        currentY += 30;

        if (typeName) {
            var tagText = typeName;
            ctx.font = '16px ' + FONT_FAMILY;
            var tagW = ctx.measureText(tagText).width + 24;
            var tagH = 28;
            var tagX = textX + textW / 2 - tagW / 2;
            ctx.fillStyle = 'rgba(20, 15, 10, 0.9)';
            ctx.strokeStyle = themeColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            var radius = 5;
            ctx.moveTo(tagX + radius, currentY);
            ctx.lineTo(tagX + tagW - radius, currentY);
            ctx.quadraticCurveTo(tagX + tagW, currentY, tagX + tagW, currentY + radius);
            ctx.lineTo(tagX + tagW, currentY + tagH - radius);
            ctx.quadraticCurveTo(tagX + tagW, currentY + tagH, tagX + tagW - radius, currentY + tagH);
            ctx.lineTo(tagX + radius, currentY + tagH);
            ctx.quadraticCurveTo(tagX, currentY + tagH, tagX, currentY + tagH - radius);
            ctx.lineTo(tagX, currentY + radius);
            ctx.quadraticCurveTo(tagX, currentY, tagX + radius, currentY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = 'rgba(220, 200, 160, 0.9)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tagText, tagX + tagW / 2, currentY + tagH / 2);
            ctx.textBaseline = 'alphabetic';
            currentY += tagH + 20;
        }

        var relicDesc = window.RelicArtifacts ? window.RelicArtifacts.getRelicDesc(spiritKey) : '';
        if (relicDesc) {
            ctx.font = '15px ' + FONT_FAMILY;
            ctx.fillStyle = 'rgba(255, 215, 120, 0.7)';
            ctx.textAlign = 'left';
            ctx.fillText('文物简介', textX, currentY);
            currentY += 20;
            ctx.fillStyle = 'rgba(180, 160, 120, 0.85)';
            var descLines = wrapText(ctx, relicDesc, textW);
            for (var d = 0; d < descLines.length; d++) {
                ctx.fillText(descLines[d], textX, currentY);
                currentY += 22;
            }
            currentY += 10;
        }

        ctx.font = '17px ' + FONT_FAMILY;
        ctx.fillStyle = 'rgba(200, 180, 140, 0.8)';
        ctx.textAlign = 'left';
        ctx.fillText('灵韵额度', textX, currentY);
        ctx.font = '22px ' + FONT_FAMILY;
        ctx.fillStyle = '#ffd700';
        var stars = '';
        for (var i = 0; i < cost; i++) stars += '★';
        for (var i = cost; i < 3; i++) stars += '☆';
        ctx.fillText(stars, textX + 90, currentY);
        currentY += 32;

        if (skillDesc) {
            ctx.font = '17px ' + FONT_FAMILY;
            ctx.fillStyle = 'rgba(255, 255, 240, 0.9)';
            var lines = wrapText(ctx, skillDesc, textW);
            for (var i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], textX, currentY);
                currentY += 26;
            }
            currentY += 12;
        }

        var statList = [
            { label: '攻击', value: attack, max: STAT_MAX.attack },
            { label: '防御', value: defense, max: STAT_MAX.defense },
            { label: '生命', value: hp, max: STAT_MAX.hp },
            { label: '速度', value: speed, max: STAT_MAX.speed }
        ];

        var barX = textX + 50;
        var barW = textW - 100;
        var barH = 12;

        for (var s = 0; s < statList.length; s++) {
            var stat = statList[s];
            ctx.font = '16px ' + FONT_FAMILY;
            ctx.fillStyle = 'rgba(180, 180, 180, 0.9)';
            ctx.textAlign = 'left';
            ctx.fillText(stat.label, textX, currentY);

            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(220, 220, 200, 0.9)';
            ctx.fillText(String(stat.value), textX + textW, currentY);

            var ratio = Math.min(1, Math.max(0, stat.value / stat.max));
            var barY = currentY - 10;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(barX, barY, barW, barH);

            ctx.fillStyle = themeColor;
            ctx.fillRect(barX, barY, barW * ratio, barH);

            currentY += 26;
        }

        ctx.restore();
    }

    function drawCard(ctx, spiritKey, x, y, width, height, assets, progress) {
        if (progress <= 0) return;
        progress = Math.min(1, Math.max(0, progress));

        var themeColor = window.RelicArtifacts ? window.RelicArtifacts.getThemeColor(spiritKey) : '#666666';

        var enterScale = 1;
        var alpha = 1;
        if (progress < 0.3) {
            var t1 = progress / 0.3;
            t1 = easeOutCubic(t1);
            enterScale = 0.8 + 0.2 * t1;
            alpha = t1;
        }

        var slideProgress = 0;
        if (progress >= 0.3) {
            slideProgress = (progress - 0.3) / 0.7;
            slideProgress = easeOutCubic(slideProgress);
        }
        var slideOffset = 24 * (1 - slideProgress);

        var baseScale = width / BASE_W;
        var totalScale = baseScale * enterScale;

        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.scale(totalScale, totalScale);
        ctx.translate(-BASE_W / 2, -BASE_H / 2);

        drawBackground(ctx, themeColor, alpha);

        if (progress > 0.3) {
            drawImageSection(ctx, spiritKey, assets, slideOffset);
            drawTextSection(ctx, spiritKey, assets, themeColor, slideOffset);
        }

        ctx.restore();
    }

    window.CharacterCard = {
        draw: drawCard,

        getPinyin: function(spiritKey) {
            return PINYIN_MAP[spiritKey] || '';
        }
    };
})();
