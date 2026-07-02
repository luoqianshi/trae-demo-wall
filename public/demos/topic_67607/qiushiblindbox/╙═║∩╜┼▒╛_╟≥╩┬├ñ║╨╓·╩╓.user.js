// ==UserScript==
// @name         球事盲盒助手 - 隐藏比分栏
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  自动隐藏咪咕视频页面的比分栏和比赛结果
// @match        https://www.miguvideo.com/p/live/*
// @match        https://www.miguvideo.com/p/detail/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 注入 CSS 隐藏比分相关元素
    const style = document.createElement('style');
    style.textContent = `
        .titleScores,
        .teamScore,
        .score-wrap,
        .match-status,
        .live-score,
        .score-board,
        .match-result,
        .game-result,
        .status-ended,
        .match-ended,
        .ended-tag,
        .finish-tag {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
        }
    `;
    document.head.appendChild(style);

    // 监控动态加载的比分元素
    new MutationObserver(function() {
        document.querySelectorAll(
            '.titleScores, .teamScore, .score-wrap, .match-status, ' +
            '.live-score, .score-board, .match-result, .game-result, ' +
            '.status-ended, .match-ended, .ended-tag, .finish-tag'
        ).forEach(function(el) {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
        });
    }).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
    });

})();
