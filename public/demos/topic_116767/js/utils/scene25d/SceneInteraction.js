var SceneInteraction = (function() {
    'use strict';

    var TOOLTIP_DELAY = 300;
    var REGION_HOVER_OPACITY = 0.8;
    var REGION_CLICK_HIGHLIGHT_DURATION = 200;

    var REGION_STEP_MAPPING = {
        livingroom: { step: 'S3-1', stage: 3, name: '客厅装修' },
        bedroom: { step: 'S3-2', stage: 3, name: '卧室装修' },
        study: { step: 'S3-3', stage: 3, name: '书房装修' },
        kitchen: { step: 'S3-4', stage: 3, name: '厨房装修' },
        entryway: { step: 'S2-1', stage: 2, name: '玄关改造' },
        balcony: { step: 'S5-1', stage: 5, name: '阳台布置' }
    };

    function SceneInteraction() {
        this.container = null;
        this.regionManager = null;
        this.objectManager = null;
        this.nianSprite = null;
        this._initialized = false;
        this._pixelStyleEnabled = false;

        this._tooltipEl = null;
        this._tooltipTimer = null;
        this._currentHoverRegion = null;
        this._objectDetailCard = null;
        this._regionDetailCard = null;

        this._events = {
            regionClick: [],
            objectClick: [],
            regionHover: [],
            regionGoToStep: []
        };

        this._onMouseMove = null;
        this._onMouseLeave = null;
        this._onClick = null;
        this._isTouchDevice = false;
    }

    SceneInteraction.prototype.init = function(sceneContainer, options) {
        if (this._initialized) return;
        options = options || {};

        if (typeof sceneContainer === 'string') {
            this.container = document.querySelector(sceneContainer);
        } else if (sceneContainer instanceof Element) {
            this.container = sceneContainer;
        }

        if (!this.container) {
            console.error('[SceneInteraction] Container not found');
            return false;
        }

        this._isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this._pixelStyleEnabled = options.pixelStyleEnabled || false;

        this._createTooltip();
        this._createObjectDetailCard();
        this._createRegionDetailCard();
        this._bindEvents();
        this._bindEventBusListeners();
        this._injectRegionAnimations();

        this._initialized = true;
        return true;
    };

    SceneInteraction.prototype.setRegionManager = function(regionManager) {
        this.regionManager = regionManager;
    };

    SceneInteraction.prototype.setObjectManager = function(objectManager) {
        this.objectManager = objectManager;
    };

    SceneInteraction.prototype.setNianSprite = function(nianSprite) {
        this.nianSprite = nianSprite;
    };

    SceneInteraction.prototype.on = function(event, callback) {
        if (this._events[event] && typeof callback === 'function') {
            this._events[event].push(callback);
        }
    };

    SceneInteraction.prototype._emit = function(event, data) {
        if (!this._events[event]) return;
        for (var i = 0; i < this._events[event].length; i++) {
            try {
                this._events[event][i](data);
            } catch (e) {
                console.error('[SceneInteraction] Event callback error:', e);
            }
        }
    };

    SceneInteraction.prototype._createTooltip = function() {
        this._tooltipEl = document.createElement('div');
        this._tooltipEl.className = 'scene-interaction-tooltip';
        this._tooltipEl.style.position = 'absolute';
        this._tooltipEl.style.pointerEvents = 'none';
        this._tooltipEl.style.opacity = '0';
        this._tooltipEl.style.transition = 'opacity 0.2s ease';
        this._tooltipEl.style.zIndex = '1000';
        this._tooltipEl.style.visibility = 'hidden';

        var titleEl = document.createElement('div');
        titleEl.className = 'scene-interaction-tooltip-title';
        titleEl.style.fontWeight = '600';
        titleEl.style.fontSize = '14px';
        titleEl.style.color = '#333';
        titleEl.style.marginBottom = '4px';

        var descEl = document.createElement('div');
        descEl.className = 'scene-interaction-tooltip-desc';
        descEl.style.fontSize = '12px';
        descEl.style.color = '#666';

        var arrowEl = document.createElement('div');
        arrowEl.className = 'scene-interaction-tooltip-arrow';
        arrowEl.style.position = 'absolute';
        arrowEl.style.bottom = '-6px';
        arrowEl.style.left = '50%';
        arrowEl.style.transform = 'translateX(-50%) rotate(45deg)';
        arrowEl.style.width = '12px';
        arrowEl.style.height = '12px';
        arrowEl.style.background = 'rgba(255, 255, 255, 0.95)';
        arrowEl.style.boxShadow = '2px 2px 4px rgba(0, 0, 0, 0.08)';

        this._tooltipEl.appendChild(titleEl);
        this._tooltipEl.appendChild(descEl);
        this._tooltipEl.appendChild(arrowEl);

        document.body.appendChild(this._tooltipEl);
    };

    SceneInteraction.prototype._showTooltip = function(x, y, title, desc) {
        if (!this._tooltipEl) return;

        var titleEl = this._tooltipEl.querySelector('.scene-interaction-tooltip-title');
        var descEl = this._tooltipEl.querySelector('.scene-interaction-tooltip-desc');

        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = desc;

        this._tooltipEl.style.visibility = 'visible';

        var tooltipWidth = this._tooltipEl.offsetWidth;
        var tooltipHeight = this._tooltipEl.offsetHeight;

        var left = x - tooltipWidth / 2;
        var top = y - tooltipHeight - 12;

        if (left < 10) left = 10;
        if (left + tooltipWidth > window.innerWidth - 10) {
            left = window.innerWidth - tooltipWidth - 10;
        }
        if (top < 10) {
            top = y + 20;
            var arrowEl = this._tooltipEl.querySelector('.scene-interaction-tooltip-arrow');
            if (arrowEl) {
                arrowEl.style.top = '-6px';
                arrowEl.style.bottom = 'auto';
                arrowEl.style.boxShadow = '-1px -1px 2px rgba(0, 0, 0, 0.06)';
            }
        }

        this._tooltipEl.style.left = left + 'px';
        this._tooltipEl.style.top = top + 'px';
        this._tooltipEl.style.opacity = '1';
    };

    SceneInteraction.prototype._hideTooltip = function() {
        if (!this._tooltipEl) return;
        this._tooltipEl.style.opacity = '0';
        var self = this;
        setTimeout(function() {
            if (self._tooltipEl) {
                self._tooltipEl.style.visibility = 'hidden';
            }
        }, 200);
    };

    SceneInteraction.prototype._createObjectDetailCard = function() {
        this._objectDetailCard = document.createElement('div');
        this._objectDetailCard.className = 'scene-object-detail-card';
        this._objectDetailCard.style.position = 'fixed';
        this._objectDetailCard.style.zIndex = '2000';
        this._objectDetailCard.style.display = 'none';
        this._objectDetailCard.style.opacity = '0';
        this._objectDetailCard.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        this._objectDetailCard.style.transform = 'scale(0.9) translateY(10px)';

        var cardContent = document.createElement('div');
        cardContent.className = 'scene-object-detail-content';
        cardContent.style.position = 'relative';
        cardContent.style.background = '#fff';
        cardContent.style.borderRadius = '12px';
        cardContent.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.15)';
        cardContent.style.padding = '20px';
        cardContent.style.minWidth = '240px';
        cardContent.style.maxWidth = '320px';

        var closeBtn = document.createElement('button');
        closeBtn.className = 'scene-object-detail-close';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '10px';
        closeBtn.style.right = '10px';
        closeBtn.style.width = '28px';
        closeBtn.style.height = '28px';
        closeBtn.style.border = 'none';
        closeBtn.style.background = '#f5f5f5';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.display = 'flex';
        closeBtn.style.alignItems = 'center';
        closeBtn.style.justifyContent = 'center';
        closeBtn.style.fontSize = '16px';
        closeBtn.style.color = '#666';
        closeBtn.innerHTML = '×';

        var iconEl = document.createElement('div');
        iconEl.className = 'scene-object-detail-icon';
        iconEl.style.fontSize = '48px';
        iconEl.style.textAlign = 'center';
        iconEl.style.marginBottom = '12px';

        var nameEl = document.createElement('div');
        nameEl.className = 'scene-object-detail-name';
        nameEl.style.fontSize = '18px';
        nameEl.style.fontWeight = '600';
        nameEl.style.color = '#333';
        nameEl.style.textAlign = 'center';
        nameEl.style.marginBottom = '8px';

        var stageEl = document.createElement('div');
        stageEl.className = 'scene-object-detail-stage';
        stageEl.style.fontSize = '12px';
        stageEl.style.color = '#8B6F47';
        stageEl.style.textAlign = 'center';
        stageEl.style.marginBottom = '12px';
        stageEl.style.padding = '4px 12px';
        stageEl.style.background = 'rgba(139, 111, 71, 0.1)';
        stageEl.style.borderRadius = '12px';
        stageEl.style.display = 'inline-block';
        stageEl.style.marginLeft = '50%';
        stageEl.style.transform = 'translateX(-50%)';

        var descEl = document.createElement('div');
        descEl.className = 'scene-object-detail-desc';
        descEl.style.fontSize = '14px';
        descEl.style.color = '#666';
        descEl.style.lineHeight = '1.6';
        descEl.style.textAlign = 'center';
        descEl.style.marginTop = '12px';

        cardContent.appendChild(closeBtn);
        cardContent.appendChild(iconEl);
        cardContent.appendChild(nameEl);
        cardContent.appendChild(stageEl);
        cardContent.appendChild(descEl);
        this._objectDetailCard.appendChild(cardContent);

        var self = this;
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            self._hideObjectDetailCard();
        });

        this._objectDetailCard.addEventListener('click', function(e) {
            if (e.target === self._objectDetailCard) {
                self._hideObjectDetailCard();
            }
        });

        document.body.appendChild(this._objectDetailCard);
    };

    SceneInteraction.prototype._createRegionDetailCard = function() {
        this._regionDetailCard = document.createElement('div');
        this._regionDetailCard.className = 'pixel-region-card';
        this._regionDetailCard.style.position = 'fixed';
        this._regionDetailCard.style.zIndex = '3000';
        this._regionDetailCard.style.display = 'none';
        this._regionDetailCard.style.opacity = '0';
        this._regionDetailCard.style.transform = 'scale(0.9) translateY(10px)';
        this._regionDetailCard.style.transition = 'opacity 0.25s ease, transform 0.25s ease';

        var cardContent = document.createElement('div');
        cardContent.className = 'pixel-region-card-content';
        cardContent.style.cssText = [
            'position: relative',
            'background: #FFF8F0',
            'min-width: 280px',
            'max-width: 360px',
            'max-height: 85vh',
            'overflow: hidden',
            'display: flex',
            'flex-direction: column',
            'box-shadow: inset -4px -4px 0 0 rgba(0,0,0,0.15), inset 4px 4px 0 0 rgba(255,255,255,0.6), 0 0 0 4px #8B6F47, 0 12px 32px rgba(0,0,0,0.25)',
            'image-rendering: pixelated',
            'border-radius: 2px'
        ].join(';');

        var closeBtn = document.createElement('button');
        closeBtn.className = 'pixel-region-card-close';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.style.cssText = [
            'position: absolute',
            'top: 10px',
            'right: 10px',
            'width: 24px',
            'height: 24px',
            'background: #C84A3E',
            'color: #fff',
            'border: none',
            'cursor: pointer',
            'font-size: 14px',
            'font-weight: bold',
            'line-height: 1',
            'z-index: 10',
            'box-shadow: inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.2)',
            'display: flex',
            'align-items: center',
            'justify-content: center'
        ].join(';');
        closeBtn.innerHTML = '×';

        var tabsBar = document.createElement('div');
        tabsBar.className = 'pixel-region-card-tabs';
        tabsBar.style.cssText = [
            'display: flex',
            'border-bottom: 2px solid #E8DCC8',
            'background: #F5EDE0',
            'padding: 0 12px',
            'flex-shrink: 0',
            'gap: 4px'
        ].join(';');

        var tabOverview = document.createElement('div');
        tabOverview.className = 'pixel-region-tab pixel-region-tab-active';
        tabOverview.setAttribute('data-tab', 'overview');
        tabOverview.textContent = '区域概览';
        tabOverview.style.cssText = [
            'padding: 12px 14px',
            "font-family: 'Courier New', Consolas, monospace",
            'font-size: 12px',
            'font-weight: 600',
            'color: #8B6F47',
            'cursor: pointer',
            'border-bottom: 2px solid transparent',
            'margin-bottom: -2px',
            'transition: all 0.15s',
            'letter-spacing: 0.5px',
            'white-space: nowrap'
        ].join(';');

        var tabSteps = document.createElement('div');
        tabSteps.className = 'pixel-region-tab';
        tabSteps.setAttribute('data-tab', 'steps');
        tabSteps.innerHTML = '装修步骤 <span class="steps-tab-badge" style="display:inline-block;min-width:18px;height:18px;padding:0 5px;background:#5B8C5A;color:#fff;border-radius:9px;font-size:10px;line-height:18px;text-align:center;margin-left:4px;font-weight:700;">0</span>';
        tabSteps.style.cssText = [
            'padding: 12px 14px',
            "font-family: 'Courier New', Consolas, monospace",
            'font-size: 12px',
            'font-weight: 600',
            'color: #9B8B7B',
            'cursor: pointer',
            'border-bottom: 2px solid transparent',
            'margin-bottom: -2px',
            'transition: all 0.15s',
            'letter-spacing: 0.5px',
            'white-space: nowrap'
        ].join(';');

        var tabPitfalls = document.createElement('div');
        tabPitfalls.className = 'pixel-region-tab';
        tabPitfalls.setAttribute('data-tab', 'pitfalls');
        tabPitfalls.innerHTML = '避坑指南 <span class="pitfall-tab-badge" style="display:inline-block;min-width:16px;height:16px;padding:0 4px;background:#C84A3E;color:#fff;border-radius:8px;font-size:10px;line-height:16px;text-align:center;margin-left:4px;">!</span>';
        tabPitfalls.style.cssText = [
            'padding: 12px 14px',
            "font-family: 'Courier New', Consolas, monospace",
            'font-size: 12px',
            'font-weight: 600',
            'color: #9B8B7B',
            'cursor: pointer',
            'border-bottom: 2px solid transparent',
            'margin-bottom: -2px',
            'transition: all 0.15s',
            'letter-spacing: 0.5px',
            'white-space: nowrap'
        ].join(';');

        tabsBar.appendChild(tabOverview);
        tabsBar.appendChild(tabSteps);
        tabsBar.appendChild(tabPitfalls);

        var tabContentContainer = document.createElement('div');
        tabContentContainer.className = 'pixel-region-tab-content-container';
        tabContentContainer.style.cssText = [
            'flex: 1',
            'overflow-y: auto',
            'overflow-x: hidden',
            'padding: 0'
        ].join(';');

        var overviewPanel = document.createElement('div');
        overviewPanel.className = 'pixel-region-tab-panel pixel-region-tab-panel-overview';
        overviewPanel.style.display = 'block';
        overviewPanel.style.padding = '18px 16px';

        var headerSection = document.createElement('div');
        headerSection.style.cssText = [
            'margin-bottom: 14px',
            'padding-bottom: 14px',
            'border-bottom: 1px dashed #E8DCC8'
        ].join(';');

        var titleEl = document.createElement('div');
        titleEl.className = 'pixel-region-card-title';
        titleEl.style.cssText = [
            "font-family: 'Courier New', Consolas, monospace",
            'font-size: 18px',
            'font-weight: 700',
            'color: #5A4A3A',
            'margin-bottom: 6px',
            'letter-spacing: 1px',
            'display: flex',
            'align-items: center',
            'gap: 8px'
        ].join(';');

        var descEl = document.createElement('div');
        descEl.className = 'pixel-region-card-desc';
        descEl.style.cssText = [
            "font-family: 'Courier New', Consolas, monospace",
            'font-size: 12px',
            'color: #7B6B5B',
            'line-height: 1.6'
        ].join(';');

        headerSection.appendChild(titleEl);
        headerSection.appendChild(descEl);

        var stageEl = document.createElement('div');
        stageEl.className = 'pixel-region-card-stage';
        stageEl.style.cssText = [
            'display: inline-flex',
            'align-items: center',
            'gap: 6px',
            'padding: 5px 12px',
            'background: #8B6F47',
            'color: #FFF8F0',
            "font-family: 'Courier New', Consolas, monospace",
            'font-size: 11px',
            'font-weight: 600',
            'margin-bottom: 14px',
            'box-shadow: inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.2)',
            'letter-spacing: 0.5px'
        ].join(';');

        var progressWrap = document.createElement('div');
        progressWrap.className = 'pixel-region-card-progress';
        progressWrap.style.marginBottom = '14px';

        var progressLabel = document.createElement('div');
        progressLabel.className = 'pixel-region-card-progress-label';
        progressLabel.style.cssText = [
            'display: flex',
            'justify-content: space-between',
            'align-items: center',
            "font-family: 'Courier New', Consolas, monospace",
            'font-size: 12px',
            'color: #6B5B4B',
            'margin-bottom: 8px',
            'font-weight: 600'
        ].join(';');
        progressLabel.innerHTML = '<span>📊 装修进度</span><span class="progress-percent" style="font-size:14px;font-weight:700;color:#B89040;">0%</span>';

        var progressBar = document.createElement('div');
        progressBar.className = 'pixel-region-card-progress-bar';
        progressBar.style.cssText = [
            'width: 100%',
            'height: 14px',
            'background: #E8DCC8',
            'position: relative',
            'box-shadow: inset 2px 2px 0 rgba(0,0,0,0.1), inset -2px -2px 0 rgba(255,255,255,0.3)',
            'border-radius: 2px',
            'overflow: hidden'
        ].join(';');

        var progressFill = document.createElement('div');
        progressFill.className = 'pixel-region-card-progress-fill';
        progressFill.style.cssText = [
            'height: 100%',
            'width: 0%',
            'background: linear-gradient(180deg, #E8C060 0%, #D4A853 50%, #B89040 100%)',
            'transition: width 0.4s ease-out',
            'box-shadow: inset 1px 1px 0 rgba(255,255,255,0.4), inset -1px -1px 0 rgba(0,0,0,0.15)',
            'position: relative'
        ].join(';');

        var progressShine = document.createElement('div');
        progressShine.style.cssText = [
            'position: absolute',
            'top: 0',
            'left: 0',
            'right: 0',
            'height: 50%',
            'background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
        ].join(';');
        progressFill.appendChild(progressShine);

        progressBar.appendChild(progressFill);
        progressWrap.appendChild(progressLabel);
        progressWrap.appendChild(progressBar);

        var currentStageInfo = document.createElement('div');
        currentStageInfo.className = 'pixel-region-current-stage';
        currentStageInfo.style.cssText = [
            'padding: 10px 12px',
            'background: rgba(91, 140, 90, 0.08)',
            'border-left: 3px solid #5B8C5A',
            'margin-bottom: 14px',
            "font-family: 'Courier New', Consolas, monospace"
        ].join(';');
        currentStageInfo.innerHTML = '<div style="font-size:11px;color:#5B8C5A;font-weight:600;margin-bottom:4px;">📍 当前阶段</div><div class="current-stage-name" style="font-size:13px;color:#4A6F4A;font-weight:700;">-</div>';

        var tipEl = document.createElement('div');
        tipEl.className = 'pixel-region-card-tip';
        tipEl.style.cssText = [
            "font-family: 'Courier New', Consolas, monospace",
            'font-size: 11px',
            'color: #6B5B4B',
            'line-height: 1.6',
            'margin-bottom: 16px',
            'padding: 10px 12px',
            'background: rgba(139,111,71,0.06)',
            'border-left: 3px solid #D4A853',
            'border-radius: 2px'
        ].join(';');

        var btnEl = document.createElement('button');
        btnEl.className = 'pixel-region-card-btn';
        btnEl.textContent = '🏗️ 前往装修 →';
        btnEl.style.cssText = [
            'width: 100%',
            'padding: 12px',
            'background: linear-gradient(180deg, #A07850 0%, #8B6F47 100%)',
            'color: #FFF8F0',
            'border: none',
            'cursor: pointer',
            "font-family: 'Courier New', Consolas, monospace",
            'font-size: 13px',
            'font-weight: 700',
            'letter-spacing: 1px',
            'box-shadow: inset -3px -3px 0 rgba(0,0,0,0.25), inset 3px 3px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(139,111,71,0.3)',
            'transition: all 0.15s',
            'border-radius: 2px'
        ].join(';');

        overviewPanel.appendChild(headerSection);
        overviewPanel.appendChild(stageEl);
        overviewPanel.appendChild(progressWrap);
        overviewPanel.appendChild(currentStageInfo);
        overviewPanel.appendChild(tipEl);
        overviewPanel.appendChild(btnEl);

        var stepsPanel = document.createElement('div');
        stepsPanel.className = 'pixel-region-tab-panel pixel-region-tab-panel-steps';
        stepsPanel.style.display = 'none';
        stepsPanel.style.padding = '16px';

        var stepsHeader = document.createElement('div');
        stepsHeader.style.cssText = [
            "font-family: 'Courier New', Consolas, monospace",
            'font-size: 13px',
            'font-weight: 700',
            'color: #5A4A3A',
            'margin-bottom: 12px',
            'padding-bottom: 10px',
            'border-bottom: 1px dashed #E8DCC8',
            'display: flex',
            'justify-content: space-between',
            'align-items: center'
        ].join(';');
        stepsHeader.innerHTML = '<span>📋 装修步骤清单</span><span class="steps-count-badge" style="font-size:11px;color:#7B6B5B;font-weight:600;">0/0 完成</span>';

        var stepsList = document.createElement('div');
        stepsList.className = 'pixel-region-steps-list';
        stepsList.style.cssText = [
            'display: flex',
            'flex-direction: column',
            'gap: 6px'
        ].join(';');

        stepsPanel.appendChild(stepsHeader);
        stepsPanel.appendChild(stepsList);

        var pitfallsPanel = document.createElement('div');
        pitfallsPanel.className = 'pixel-region-tab-panel pixel-region-tab-panel-pitfalls';
        pitfallsPanel.style.display = 'none';
        pitfallsPanel.style.padding = '16px';

        var pitfallProgressWrap = document.createElement('div');
        pitfallProgressWrap.className = 'pixel-pitfall-progress-wrap';
        pitfallProgressWrap.style.cssText = [
            'margin-bottom: 12px',
            'padding: 10px',
            'background: rgba(200, 74, 62, 0.06)',
            'border: 1px solid rgba(200, 74, 62, 0.15)',
            'border-radius: 4px'
        ].join(';');

        var pitfallProgressLabel = document.createElement('div');
        pitfallProgressLabel.className = 'pixel-pitfall-progress-label';
        pitfallProgressLabel.style.cssText = [
            'display: flex',
            'justify-content: space-between',
            'align-items: center',
            "font-family: 'Courier New', Consolas, monospace",
            'font-size: 12px',
            'color: #C84A3E',
            'font-weight: 600',
            'margin-bottom: 8px'
        ].join(';');
        pitfallProgressLabel.innerHTML = '<span>🚨 避坑进度</span><span class="pitfall-progress-text">0/0 已规避</span>';

        var pitfallProgressBar = document.createElement('div');
        pitfallProgressBar.className = 'pixel-pitfall-progress-bar';
        pitfallProgressBar.style.cssText = [
            'width: 100%',
            'height: 8px',
            'background: #E8DCC8',
            'border-radius: 2px',
            'overflow: hidden'
        ].join(';');

        var pitfallProgressFill = document.createElement('div');
        pitfallProgressFill.className = 'pixel-pitfall-progress-fill';
        pitfallProgressFill.style.cssText = [
            'height: 100%',
            'width: 0%',
            'background: linear-gradient(90deg, #E87461 0%, #C84A3E 100%)',
            'transition: width 0.3s ease'
        ].join(';');

        pitfallProgressBar.appendChild(pitfallProgressFill);
        pitfallProgressWrap.appendChild(pitfallProgressLabel);
        pitfallProgressWrap.appendChild(pitfallProgressBar);

        var pitfallList = document.createElement('div');
        pitfallList.className = 'pixel-pitfall-list';
        pitfallList.style.cssText = [
            'display: flex',
            'flex-direction: column',
            'gap: 8px'
        ].join(';');

        pitfallsPanel.appendChild(pitfallProgressWrap);
        pitfallsPanel.appendChild(pitfallList);

        tabContentContainer.appendChild(overviewPanel);
        tabContentContainer.appendChild(stepsPanel);
        tabContentContainer.appendChild(pitfallsPanel);

        cardContent.appendChild(closeBtn);
        cardContent.appendChild(tabsBar);
        cardContent.appendChild(tabContentContainer);
        this._regionDetailCard.appendChild(cardContent);

        var self = this;
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            self._hideRegionDetailCard();
        });

        btnEl.addEventListener('click', function(e) {
            e.stopPropagation();
            self._handleGoToStep();
        });

        tabOverview.addEventListener('click', function(e) {
            e.stopPropagation();
            self._switchTab('overview');
        });

        tabSteps.addEventListener('click', function(e) {
            e.stopPropagation();
            self._switchTab('steps');
        });

        tabPitfalls.addEventListener('click', function(e) {
            e.stopPropagation();
            self._switchTab('pitfalls');
        });

        this._regionDetailCard.addEventListener('click', function(e) {
            if (e.target === self._regionDetailCard) {
                self._hideRegionDetailCard();
            }
        });

        document.body.appendChild(this._regionDetailCard);
    };

    SceneInteraction.prototype._currentTab = 'overview';

    SceneInteraction.prototype._switchTab = function(tabName) {
        if (!this._regionDetailCard) return;
        this._currentTab = tabName;

        var tabs = this._regionDetailCard.querySelectorAll('.pixel-region-tab');
        for (var i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            var isActive = tab.getAttribute('data-tab') === tabName;
            tab.className = 'pixel-region-tab' + (isActive ? ' pixel-region-tab-active' : '');
            if (isActive) {
                tab.style.color = '#8B6F47';
                tab.style.borderBottomColor = '#8B6F47';
            } else {
                tab.style.color = '#9B8B7B';
                tab.style.borderBottomColor = 'transparent';
            }
        }

        var overviewPanel = this._regionDetailCard.querySelector('.pixel-region-tab-panel-overview');
        var stepsPanel = this._regionDetailCard.querySelector('.pixel-region-tab-panel-steps');
        var pitfallsPanel = this._regionDetailCard.querySelector('.pixel-region-tab-panel-pitfalls');
        if (overviewPanel) overviewPanel.style.display = tabName === 'overview' ? 'block' : 'none';
        if (stepsPanel) stepsPanel.style.display = tabName === 'steps' ? 'block' : 'none';
        if (pitfallsPanel) pitfallsPanel.style.display = tabName === 'pitfalls' ? 'block' : 'none';
    };

    SceneInteraction.prototype._renderPitfallList = function(regionId) {
        if (!this._regionDetailCard || !regionId) return;
        if (typeof PitfallsData === 'undefined' || typeof PitfallTracker === 'undefined') return;

        var pitfalls = PitfallsData.getPitfallsByRegion(regionId);
        var listEl = this._regionDetailCard.querySelector('.pixel-pitfall-list');
        var progressTextEl = this._regionDetailCard.querySelector('.pitfall-progress-text');
        var progressFillEl = this._regionDetailCard.querySelector('.pixel-pitfall-progress-fill');

        if (!listEl) return;

        var progress = PitfallTracker.getRegionProgress(regionId);

        if (progressTextEl) {
            progressTextEl.textContent = progress.completed + '/' + progress.total + ' 已规避';
        }
        if (progressFillEl) {
            progressFillEl.style.width = progress.percent + '%';
        }

        listEl.innerHTML = '';

        for (var i = 0; i < pitfalls.length; i++) {
            var pitfall = pitfalls[i];
            var isDone = PitfallTracker.isDone(pitfall.id);

            var pitfallItem = document.createElement('div');
            pitfallItem.className = 'pixel-pitfall-item' + (isDone ? ' pitfall-done' : '');
            pitfallItem.setAttribute('data-pitfall-id', pitfall.id);
            pitfallItem.style.cssText = [
                'background: #fff',
                'border: 1px solid #E8DCC8',
                'border-radius: 6px',
                'overflow: hidden',
                'transition: all 0.2s'
            ].join(';');

            var pitfallHeader = document.createElement('div');
            pitfallHeader.className = 'pixel-pitfall-header';
            pitfallHeader.style.cssText = [
                'display: flex',
                'align-items: flex-start',
                'gap: 10px',
                'padding: 10px 12px',
                'cursor: pointer'
            ].join(';');

            var checkbox = document.createElement('div');
            checkbox.className = 'pixel-pitfall-checkbox';
            checkbox.setAttribute('data-action', 'toggle');
            checkbox.style.cssText = [
                'flex-shrink: 0',
                'width: 18px',
                'height: 18px',
                'margin-top: 1px',
                'border: 2px solid ' + (isDone ? '#5B8C5A' : '#C8B8A8'),
                'border-radius: 3px',
                'background: ' + (isDone ? '#5B8C5A' : '#fff'),
                'position: relative',
                'cursor: pointer',
                'transition: all 0.15s'
            ].join(';');
            if (isDone) {
                checkbox.innerHTML = '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:12px;font-weight:bold;">✓</span>';
            }

            var pitfallInfo = document.createElement('div');
            pitfallInfo.className = 'pixel-pitfall-info';
            pitfallInfo.style.cssText = [
                'flex: 1',
                'min-width: 0'
            ].join(';');

            var pitfallTitleRow = document.createElement('div');
            pitfallTitleRow.style.cssText = [
                'display: flex',
                'align-items: center',
                'gap: 8px',
                'margin-bottom: 4px'
            ].join(';');

            var pitfallTitle = document.createElement('div');
            pitfallTitle.className = 'pixel-pitfall-title';
            pitfallTitle.style.cssText = [
                "font-family: 'Courier New', Consolas, monospace",
                'font-size: 13px',
                'font-weight: 600',
                'color: ' + (isDone ? '#9B9B9B' : '#5A4A3A'),
                'text-decoration: ' + (isDone ? 'line-through' : 'none'),
                'line-height: 1.4'
            ].join(';');
            pitfallTitle.textContent = pitfall.title;

            var severityLabel = document.createElement('span');
            severityLabel.className = 'pixel-pitfall-severity severity-' + pitfall.severity;
            var severityColors = {
                high: { bg: 'rgba(200, 74, 62, 0.12)', color: '#C84A3E' },
                medium: { bg: 'rgba(212, 168, 83, 0.2)', color: '#B89040' },
                low: { bg: 'rgba(90, 111, 165, 0.12)', color: '#4A6FA5' }
            };
            var severityLabels = { high: '高危', medium: '注意', low: '提醒' };
            var sevColor = severityColors[pitfall.severity] || severityColors.low;
            severityLabel.style.cssText = [
                'flex-shrink: 0',
                'padding: 2px 6px',
                'background: ' + sevColor.bg,
                'color: ' + sevColor.color,
                'font-size: 10px',
                'font-weight: 600',
                'border-radius: 2px',
                "font-family: 'Courier New', Consolas, monospace",
                'letter-spacing: 0.5px'
            ].join(';');
            severityLabel.textContent = severityLabels[pitfall.severity] || '提醒';

            pitfallTitleRow.appendChild(pitfallTitle);
            pitfallTitleRow.appendChild(severityLabel);

            var pitfallDesc = document.createElement('div');
            pitfallDesc.className = 'pixel-pitfall-desc';
            pitfallDesc.style.cssText = [
                "font-family: 'Courier New', Consolas, monospace",
                'font-size: 11px',
                'color: ' + (isDone ? '#BBB' : '#7B6B5B'),
                'line-height: 1.5',
                'margin-bottom: 6px',
                'display: -webkit-box',
                '-webkit-line-clamp: 2',
                '-webkit-box-orient: vertical',
                'overflow: hidden'
            ].join(';');
            pitfallDesc.textContent = pitfall.description;

            var expandHint = document.createElement('div');
            expandHint.style.cssText = [
                "font-family: 'Courier New', Consolas, monospace",
                'font-size: 10px',
                'color: #9B8B7B'
            ].join(';');
            expandHint.innerHTML = '点击展开详情 ▼';

            pitfallInfo.appendChild(pitfallTitleRow);
            pitfallInfo.appendChild(pitfallDesc);
            pitfallInfo.appendChild(expandHint);

            pitfallHeader.appendChild(checkbox);
            pitfallHeader.appendChild(pitfallInfo);

            var pitfallDetail = document.createElement('div');
            pitfallDetail.className = 'pixel-pitfall-detail';
            pitfallDetail.style.cssText = [
                'display: none',
                'padding: 0 12px 12px 40px',
                'border-top: 1px dashed #E8DCC8',
                'margin-top: 0',
                'padding-top: 10px'
            ].join(';');

            var fullDesc = document.createElement('div');
            fullDesc.style.cssText = [
                "font-family: 'Courier New', Consolas, monospace",
                'font-size: 12px',
                'color: #6B5B4B',
                'line-height: 1.6',
                'margin-bottom: 10px'
            ].join(';');
            fullDesc.textContent = pitfall.description;

            var tipBox = document.createElement('div');
            tipBox.style.cssText = [
                'background: rgba(139, 111, 71, 0.06)',
                'border-left: 3px solid #D4A853',
                'padding: 8px 10px',
                'margin-bottom: 12px'
            ].join(';');
            tipBox.innerHTML = '<div style="font-size:11px;font-weight:600;color:#B89040;margin-bottom:4px;">💡 实用贴士</div><div style="font-size:11px;color:#7B6B5B;line-height:1.5;">' + pitfall.tip + '</div>';

            var experiencesTitle = document.createElement('div');
            experiencesTitle.style.cssText = [
                "font-family: 'Courier New', Consolas, monospace",
                'font-size: 12px',
                'font-weight: 600',
                'color: #5A4A3A',
                'margin-bottom: 8px'
            ].join(';');
            experiencesTitle.innerHTML = '👤 过来人经验';

            var experiencesWrap = document.createElement('div');
            experiencesWrap.className = 'pixel-pitfall-experiences';
            experiencesWrap.style.cssText = [
                'display: flex',
                'flex-direction: column',
                'gap: 8px'
            ].join(';');

            if (pitfall.experiences && pitfall.experiences.length > 0) {
                for (var j = 0; j < pitfall.experiences.length; j++) {
                    var exp = pitfall.experiences[j];
                    var isLiked = PitfallTracker.isLiked(pitfall.id, j);
                    var likeCount = PitfallTracker.getLikeCount(pitfall, j);

                    var expCard = document.createElement('div');
                    expCard.className = 'pixel-experience-card';
                    expCard.style.cssText = [
                        'background: #FAF6F0',
                        'border: 1px solid #E8DCC8',
                        'border-radius: 4px',
                        'padding: 10px'
                    ].join(';');

                    var expHeader = document.createElement('div');
                    expHeader.style.cssText = [
                        'display: flex',
                        'align-items: center',
                        'gap: 8px',
                        'margin-bottom: 8px'
                    ].join(';');

                    var expAvatar = document.createElement('div');
                    expAvatar.style.cssText = [
                        'width: 28px',
                        'height: 28px',
                        'border-radius: 50%',
                        'background: #E8DCC8',
                        'display: flex',
                        'align-items: center',
                        'justify-content: center',
                        'font-size: 16px',
                        'flex-shrink: 0'
                    ].join(';');
                    expAvatar.textContent = exp.avatar || '👤';

                    var expAuthorWrap = document.createElement('div');
                    expAuthorWrap.style.flex = '1';

                    var expAuthor = document.createElement('div');
                    expAuthor.style.cssText = [
                        "font-family: 'Courier New', Consolas, monospace",
                        'font-size: 12px',
                        'font-weight: 600',
                        'color: #5A4A3A',
                        'display: flex',
                        'align-items: center',
                        'gap: 6px'
                    ].join(';');
                    expAuthor.textContent = exp.author || '装修过来人';

                    if (exp.verified) {
                        var verifiedBadge = document.createElement('span');
                        verifiedBadge.style.cssText = [
                            'font-size: 9px',
                            'padding: 1px 5px',
                            'background: rgba(91, 140, 90, 0.15)',
                            'color: #5B8C5A',
                            'border-radius: 2px',
                            'font-weight: 600'
                        ].join(';');
                        verifiedBadge.textContent = '✓ 认证';
                        expAuthor.appendChild(verifiedBadge);
                    }

                    expAuthorWrap.appendChild(expAuthor);

                    var likeBtn = document.createElement('div');
                    likeBtn.className = 'pixel-like-btn';
                    likeBtn.setAttribute('data-action', 'like');
                    likeBtn.setAttribute('data-pitfall-id', pitfall.id);
                    likeBtn.setAttribute('data-exp-index', j);
                    likeBtn.style.cssText = [
                        'display: flex',
                        'align-items: center',
                        'gap: 3px',
                        'cursor: pointer',
                        'padding: 4px 8px',
                        'border-radius: 4px',
                        'font-size: 11px',
                        'color: ' + (isLiked ? '#C84A3E' : '#9B8B7B'),
                        'background: ' + (isLiked ? 'rgba(200, 74, 62, 0.08)' : 'transparent'),
                        'transition: all 0.15s',
                        'user-select: none'
                    ].join(';');
                    likeBtn.innerHTML = (isLiked ? '❤️' : '🤍') + ' ' + likeCount;

                    expHeader.appendChild(expAvatar);
                    expHeader.appendChild(expAuthorWrap);
                    expHeader.appendChild(likeBtn);

                    var expContent = document.createElement('div');
                    expContent.style.cssText = [
                        "font-family: 'Courier New', Consolas, monospace",
                        'font-size: 11px',
                        'color: #6B5B4B',
                        'line-height: 1.6'
                    ].join(';');
                    expContent.textContent = exp.content;

                    expCard.appendChild(expHeader);
                    expCard.appendChild(expContent);
                    experiencesWrap.appendChild(expCard);
                }
            }

            if (pitfall.knowledgeRef) {
                var knowledgeLink = document.createElement('div');
                knowledgeLink.className = 'pixel-pitfall-knowledge-link';
                knowledgeLink.setAttribute('data-article-id', pitfall.knowledgeRef);
                knowledgeLink.style.cssText = [
                    'margin-top: 12px',
                    'padding: 8px 10px',
                    'background: rgba(74, 111, 165, 0.06)',
                    'border-radius: 4px',
                    'cursor: pointer',
                    'display: flex',
                    'align-items: center',
                    'gap: 6px',
                    "font-family: 'Courier New', Consolas, monospace",
                    'font-size: 11px',
                    'color: #4A6FA5'
                ].join(';');
                knowledgeLink.innerHTML = '📚 查看详细避坑文章 →';
                pitfallDetail.appendChild(knowledgeLink);
            }

            pitfallDetail.appendChild(fullDesc);
            pitfallDetail.appendChild(tipBox);
            pitfallDetail.appendChild(experiencesTitle);
            pitfallDetail.appendChild(experiencesWrap);

            pitfallItem.appendChild(pitfallHeader);
            pitfallItem.appendChild(pitfallDetail);
            listEl.appendChild(pitfallItem);
        }

        this._bindPitfallEvents(listEl);
    };

    SceneInteraction.prototype._bindPitfallEvents = function(container) {
        var self = this;

        var items = container.querySelectorAll('.pixel-pitfall-item');
        for (var i = 0; i < items.length; i++) {
            (function(item) {
                var header = item.querySelector('.pixel-pitfall-header');
                var detail = item.querySelector('.pixel-pitfall-detail');
                var checkbox = item.querySelector('.pixel-pitfall-checkbox');
                var pitfallId = item.getAttribute('data-pitfall-id');

                if (header && detail) {
                    header.addEventListener('click', function(e) {
                        if (e.target.closest('[data-action="toggle"]') || e.target.closest('[data-action="like"]') || e.target.closest('[data-article-id]')) {
                            return;
                        }
                        var isExpanded = detail.style.display === 'block';
                        detail.style.display = isExpanded ? 'none' : 'block';
                        var hint = header.querySelector('.pixel-pitfall-info > div:last-child');
                        if (hint) {
                            hint.innerHTML = isExpanded ? '点击展开详情 ▼' : '点击收起详情 ▲';
                        }
                    });
                }

                if (checkbox) {
                    checkbox.addEventListener('click', function(e) {
                        e.stopPropagation();
                        self._handlePitfallToggle(pitfallId, item);
                    });
                }

                var likeBtns = item.querySelectorAll('.pixel-like-btn');
                for (var j = 0; j < likeBtns.length; j++) {
                    (function(btn) {
                        btn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            var pid = btn.getAttribute('data-pitfall-id');
                            var expIdx = parseInt(btn.getAttribute('data-exp-index'), 10);
                            self._handleLike(pid, expIdx, btn);
                        });
                    })(likeBtns[j]);
                }

                var knowledgeLink = item.querySelector('.pixel-pitfall-knowledge-link');
                if (knowledgeLink) {
                    knowledgeLink.addEventListener('click', function(e) {
                        e.stopPropagation();
                        var articleId = knowledgeLink.getAttribute('data-article-id');
                        self._handleKnowledgeLink(articleId);
                    });
                }
            })(items[i]);
        }
    };

    SceneInteraction.prototype._handlePitfallToggle = function(pitfallId, itemEl) {
        if (!pitfallId || typeof PitfallTracker === 'undefined') return;

        var isDone = PitfallTracker.toggleDone(pitfallId);

        if (itemEl) {
            if (isDone) {
                itemEl.classList.add('pitfall-done');
            } else {
                itemEl.classList.remove('pitfall-done');
            }

            var checkbox = itemEl.querySelector('.pixel-pitfall-checkbox');
            if (checkbox) {
                if (isDone) {
                    checkbox.style.borderColor = '#5B8C5A';
                    checkbox.style.background = '#5B8C5A';
                    checkbox.innerHTML = '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:12px;font-weight:bold;">✓</span>';
                } else {
                    checkbox.style.borderColor = '#C8B8A8';
                    checkbox.style.background = '#fff';
                    checkbox.innerHTML = '';
                }
            }

            var title = itemEl.querySelector('.pixel-pitfall-title');
            var desc = itemEl.querySelector('.pixel-pitfall-desc');
            if (title) {
                title.style.color = isDone ? '#9B9B9B' : '#5A4A3A';
                title.style.textDecoration = isDone ? 'line-through' : 'none';
            }
            if (desc) {
                desc.style.color = isDone ? '#BBB' : '#7B6B5B';
            }
        }

        this._updatePitfallProgress();
    };

    SceneInteraction.prototype._handleLike = function(pitfallId, expIndex, btnEl) {
        if (!pitfallId || typeof expIndex !== 'number' || typeof PitfallTracker === 'undefined' || typeof PitfallsData === 'undefined') return;

        var isLiked = PitfallTracker.toggleLike(pitfallId, expIndex);
        var pitfall = PitfallsData.getPitfallById(pitfallId);
        var likeCount = PitfallTracker.getLikeCount(pitfall, expIndex);

        if (btnEl) {
            if (isLiked) {
                btnEl.style.color = '#C84A3E';
                btnEl.style.background = 'rgba(200, 74, 62, 0.08)';
                btnEl.innerHTML = '❤️ ' + likeCount;
            } else {
                btnEl.style.color = '#9B8B7B';
                btnEl.style.background = 'transparent';
                btnEl.innerHTML = '🤍 ' + likeCount;
            }
        }
    };

    SceneInteraction.prototype._handleKnowledgeLink = function(articleId) {
        if (!articleId) return;

        this._hideRegionDetailCard();
        this._emit('openKnowledgeArticle', { articleId: articleId });

        try {
            if (typeof App !== 'undefined' && typeof App.switchView === 'function') {
                App.switchView('knowledge');
                setTimeout(function() {
                    if (typeof KnowledgeView !== 'undefined' && typeof KnowledgeView.openArticle === 'function') {
                        KnowledgeView.openArticle(articleId);
                    }
                }, 300);
            }
        } catch (e) {
            console.warn('[SceneInteraction] Failed to open knowledge article:', e);
        }
    };

    SceneInteraction.prototype._updatePitfallProgress = function() {
        if (!this._regionDetailCard || !this._currentRegionData || !this._currentRegionData.region) return;
        if (typeof PitfallTracker === 'undefined') return;

        var regionId = this._currentRegionData.region.id;
        var progress = PitfallTracker.getRegionProgress(regionId);

        var progressTextEl = this._regionDetailCard.querySelector('.pitfall-progress-text');
        var progressFillEl = this._regionDetailCard.querySelector('.pixel-pitfall-progress-fill');

        if (progressTextEl) {
            progressTextEl.textContent = progress.completed + '/' + progress.total + ' 已规避';
        }
        if (progressFillEl) {
            progressFillEl.style.width = progress.percent + '%';
        }
    };

    SceneInteraction.prototype._currentRegionData = null;
    SceneInteraction.prototype._lastViewedRegionId = null;
    SceneInteraction.prototype._eventBusUnsubscribers = [];

    SceneInteraction.prototype._showRegionDetailCard = function(region, x, y) {
        if (!this._regionDetailCard || !region) return;

        var titleEl = this._regionDetailCard.querySelector('.pixel-region-card-title');
        var descEl = this._regionDetailCard.querySelector('.pixel-region-card-desc');
        var stageEl = this._regionDetailCard.querySelector('.pixel-region-card-stage');
        var progressPercentEl = this._regionDetailCard.querySelector('.progress-percent');
        var progressFillEl = this._regionDetailCard.querySelector('.pixel-region-card-progress-fill');
        var tipEl = this._regionDetailCard.querySelector('.pixel-region-card-tip');
        var currentStageNameEl = this._regionDetailCard.querySelector('.current-stage-name');
        var stepsTabBadge = this._regionDetailCard.querySelector('.steps-tab-badge');

        var mapping = REGION_STEP_MAPPING[region.id] || { stage: 1, name: region.name };
        var progress = this._getRegionProgress(region.id);
        var stageInfo = this._getRegionStageInfo(region.id);
        var regionMapping = null;
        if (typeof StepObjectMapping !== 'undefined' && StepObjectMapping.getRegionMapping) {
            regionMapping = StepObjectMapping.getRegionMapping(region.id);
        }

        this._currentRegionData = {
            region: region,
            mapping: mapping,
            progress: progress,
            stageInfo: stageInfo,
            regionMapping: regionMapping
        };

        this._lastViewedRegionId = region.id;

        var iconMap = {
            livingroom: '🛋️',
            bedroom: '🛏️',
            kitchen: '🍳',
            study: '📚',
            entryway: '🚪',
            balcony: '🌿'
        };
        var regionIcon = iconMap[region.id] || '🏠';

        if (titleEl) titleEl.innerHTML = '<span style="font-size:22px;">' + regionIcon + '</span>' + region.name;
        if (descEl) {
            var descText = region.description || (regionMapping && regionMapping.description) || '一个温馨的空间';
            descEl.textContent = descText;
        }
        if (stageEl) stageEl.textContent = '第' + mapping.stage + '阶段 · ' + mapping.name;
        if (progressPercentEl) progressPercentEl.textContent = progress + '%';
        if (progressFillEl) {
            progressFillEl.style.width = '0%';
            var self = this;
            setTimeout(function() {
                if (progressFillEl) {
                    progressFillEl.style.width = progress + '%';
                }
            }, 50);
        }

        var currentStageText = '尚未开始';
        var currentStageNum = 0;
        if (stageInfo && stageInfo.stages && stageInfo.stages.length > 0) {
            for (var i = stageInfo.stages.length - 1; i >= 0; i--) {
                if (stageInfo.stages[i].completedSteps > 0) {
                    currentStageNum = stageInfo.stages[i].stage;
                    currentStageText = stageInfo.stages[i].name;
                    if (!stageInfo.stages[i].isComplete) {
                        currentStageText = stageInfo.stages[i].name + ' (进行中)';
                    }
                    break;
                }
            }
            if (progress === 100) {
                currentStageText = '🎉 全部完成！';
            }
        }
        if (currentStageNameEl) currentStageNameEl.textContent = currentStageText;

        var totalSteps = 0;
        var completedSteps = 0;
        if (stageInfo && stageInfo.stages) {
            for (var j = 0; j < stageInfo.stages.length; j++) {
                totalSteps += stageInfo.stages[j].totalSteps;
                completedSteps += stageInfo.stages[j].completedSteps;
            }
        }
        if (stepsTabBadge) stepsTabBadge.textContent = completedSteps;

        this._renderStepsList(region.id);

        var tips = [
            '💡 点击"前往装修"查看详细步骤',
            '✨ 每完成一步，家就更漂亮一点~',
            '🐢 装修要一步一步来，别急~',
            '🤔 有问题随时找小管家帮忙！',
            '📝 记得多看避坑指南哦~',
            '🎯 加油，马上就要完成啦！'
        ];
        if (tipEl) tipEl.textContent = tips[Math.floor(Math.random() * tips.length)];

        this._switchTab('overview');
        this._renderPitfallList(region.id);

        this._regionDetailCard.style.display = 'block';

        var cardWidth = this._regionDetailCard.offsetWidth;
        var cardHeight = this._regionDetailCard.offsetHeight;

        var left = x - cardWidth / 2;
        var top = y - cardHeight - 20;

        if (left < 20) left = 20;
        if (left + cardWidth > window.innerWidth - 20) {
            left = window.innerWidth - cardWidth - 20;
        }
        if (top < 20) {
            top = y + 20;
        }

        this._regionDetailCard.style.left = left + 'px';
        this._regionDetailCard.style.top = top + 'px';

        requestAnimationFrame(function() {
            if (self._regionDetailCard) {
                self._regionDetailCard.style.opacity = '1';
                self._regionDetailCard.style.transform = 'scale(1) translateY(0)';
            }
        });
    };

    SceneInteraction.prototype._renderStepsList = function(regionId) {
        if (!this._regionDetailCard || !regionId) return;
        if (typeof StepObjectMapping === 'undefined') return;

        var listEl = this._regionDetailCard.querySelector('.pixel-region-steps-list');
        var countBadge = this._regionDetailCard.querySelector('.steps-count-badge');
        if (!listEl) return;

        var regionMapping = StepObjectMapping.getRegionMapping(regionId);
        if (!regionMapping || !regionMapping.stages) return;

        var completedSteps = this._getCompletedSteps();
        var totalCount = 0;
        var completedCount = 0;
        var allStepItems = [];

        for (var s = 0; s < regionMapping.stages.length; s++) {
            var stageNum = regionMapping.stages[s];
            var stageSteps = StepObjectMapping.getStageSteps(stageNum);
            var stageName = StepObjectMapping.getStageName(stageNum);

            var stageGroup = document.createElement('div');
            stageGroup.className = 'pixel-region-step-group';
            stageGroup.style.cssText = [
                'margin-bottom: 12px',
                "font-family: 'Courier New', Consolas, monospace"
            ].join(';');

            var stageHeader = document.createElement('div');
            stageHeader.style.cssText = [
                'font-size: 11px',
                'font-weight: 700',
                'color: #8B6F47',
                'margin-bottom: 6px',
                'padding: 4px 8px',
                'background: rgba(139,111,71,0.08)',
                'border-radius: 2px'
            ].join(';');
            stageHeader.textContent = '第' + stageNum + '阶段 · ' + stageName;
            stageGroup.appendChild(stageHeader);

            for (var i = 0; i < stageSteps.length; i++) {
                var stepId = stageSteps[i];
                var stepNorm = StepObjectMapping.normalizeStepId(stepId);
                var isDone = false;

                for (var k = 0; k < completedSteps.length; k++) {
                    var compNorm = StepObjectMapping.normalizeStepId(completedSteps[k]);
                    if (compNorm === stepNorm) {
                        isDone = true;
                        break;
                    }
                }

                totalCount++;
                if (isDone) completedCount++;

                var stepItem = document.createElement('div');
                stepItem.className = 'pixel-region-step-item' + (isDone ? ' step-done' : '');
                stepItem.setAttribute('data-step-id', stepId);
                stepItem.style.cssText = [
                    'display: flex',
                    'align-items: center',
                    'padding: 8px 10px',
                    'background: #fff',
                    'border: 1px solid #E8DCC8',
                    'border-radius: 4px',
                    'margin-bottom: 4px',
                    'cursor: pointer',
                    'transition: all 0.15s'
                ].join(';');

                var checkbox = document.createElement('div');
                checkbox.style.cssText = [
                    'flex-shrink: 0',
                    'width: 18px',
                    'height: 18px',
                    'margin-right: 10px',
                    'border: 2px solid ' + (isDone ? '#5B8C5A' : '#D4C4B0'),
                    'border-radius: 3px',
                    'background: ' + (isDone ? '#5B8C5A' : '#fff'),
                    'display: flex',
                    'align-items: center',
                    'justify-content: center',
                    'font-size: 11px',
                    'color: #fff',
                    'font-weight: bold'
                ].join(';');
                if (isDone) checkbox.textContent = '✓';

                var stepInfo = document.createElement('div');
                stepInfo.style.cssText = [
                    'flex: 1',
                    'min-width: 0'
                ].join(';');

                var stepName = document.createElement('div');
                stepName.style.cssText = [
                    'font-size: 12px',
                    'font-weight: 600',
                    'color: ' + (isDone ? '#9B9B9B' : '#5A4A3A'),
                    'text-decoration: ' + (isDone ? 'line-through' : 'none'),
                    'margin-bottom: 2px'
                ].join(';');
                stepName.textContent = '步骤 ' + stepId;

                var stepDesc = document.createElement('div');
                stepDesc.style.cssText = [
                    'font-size: 10px',
                    'color: ' + (isDone ? '#BBB' : '#8B7B6B')
                ].join(';');
                stepDesc.textContent = isDone ? '已完成 ✓' : '待完成';

                stepInfo.appendChild(stepName);
                stepInfo.appendChild(stepDesc);

                var gotoIcon = document.createElement('div');
                gotoIcon.style.cssText = [
                    'font-size: 12px',
                    'color: #8B6F47',
                    'opacity: ' + (isDone ? '0.5' : '1')
                ].join(';');
                gotoIcon.textContent = '→';

                stepItem.appendChild(checkbox);
                stepItem.appendChild(stepInfo);
                stepItem.appendChild(gotoIcon);

                stageGroup.appendChild(stepItem);
                allStepItems.push({ el: stepItem, stepId: stepId, isDone: isDone });
            }

            listEl.appendChild(stageGroup);
        }

        if (countBadge) {
            countBadge.textContent = completedCount + '/' + totalCount + ' 完成';
        }

        var self = this;
        for (var m = 0; m < allStepItems.length; m++) {
            (function(item) {
                item.el.addEventListener('click', function(e) {
                    e.stopPropagation();
                    self._gotoStepFromList(item.stepId);
                });
            })(allStepItems[m]);
        }
    };

    SceneInteraction.prototype._gotoStepFromList = function(stepId) {
        if (!stepId) return;
        this._hideRegionDetailCard();
        this._emit('regionGoToStep', {
            step: stepId,
            regionId: this._lastViewedRegionId
        });
    };

    SceneInteraction.prototype._hideRegionDetailCard = function() {
        if (!this._regionDetailCard) return;
        this._regionDetailCard.style.opacity = '0';
        this._regionDetailCard.style.transform = 'scale(0.9) translateY(10px)';
        var self = this;
        setTimeout(function() {
            if (self._regionDetailCard) {
                self._regionDetailCard.style.display = 'none';
            }
        }, 200);
        this._currentRegionData = null;
    };

    SceneInteraction.prototype._getRegionProgress = function(regionId) {
        try {
            if (typeof StepObjectMapping !== 'undefined' && StepObjectMapping.getRegionProgress) {
                var completedSteps = this._getCompletedSteps();
                return StepObjectMapping.getRegionProgress(regionId, completedSteps);
            }
        } catch (e) {
            console.warn('[SceneInteraction] 获取区域进度失败:', e);
        }

        var mapping = REGION_STEP_MAPPING[regionId];
        if (!mapping) return 0;

        try {
            if (typeof App !== 'undefined' && App.state && App.state.sopProgress) {
                var mode = App.getDecorationMode ? App.getDecorationMode() : 'quick';
                var sopProgress = App.state.sopProgress[mode];
                if (sopProgress && sopProgress.completedSteps) {
                    var completed = sopProgress.completedSteps.filter(function(s) {
                        return s.startsWith('S' + mapping.stage + '-');
                    }).length;
                    var total = 4;
                    return Math.min(100, Math.round((completed / total) * 100));
                }
            }
        } catch (e) {
            console.warn('[SceneInteraction] 计算区域进度失败:', e);
        }
        return 0;
    };

    SceneInteraction.prototype._getCompletedSteps = function() {
        try {
            if (typeof App !== 'undefined' && App.state && App.state.sopProgress) {
                var mode = App.getDecorationMode ? App.getDecorationMode() : 'full';
                var sopProgress = App.state.sopProgress[mode];
                if (sopProgress && sopProgress.completedSteps) {
                    return sopProgress.completedSteps.slice();
                }
            }
        } catch (e) {
            console.warn('[SceneInteraction] 获取完成步骤失败:', e);
        }
        return [];
    };

    SceneInteraction.prototype._getRegionStageInfo = function(regionId) {
        if (typeof StepObjectMapping === 'undefined') return null;

        var regionMapping = StepObjectMapping.getRegionMapping(regionId);
        if (!regionMapping) return null;

        var completedSteps = this._getCompletedSteps();
        var stages = regionMapping.stages || [];
        var stageInfo = [];

        for (var i = 0; i < stages.length; i++) {
            var stageNum = stages[i];
            var stageSteps = StepObjectMapping.getStageSteps(stageNum);
            var completedCount = 0;

            for (var j = 0; j < stageSteps.length; j++) {
                var stepNorm = StepObjectMapping.normalizeStepId(stageSteps[j]);
                for (var k = 0; k < completedSteps.length; k++) {
                    var completedNorm = StepObjectMapping.normalizeStepId(completedSteps[k]);
                    if (completedNorm === stepNorm) {
                        completedCount++;
                        break;
                    }
                }
            }

            stageInfo.push({
                stage: stageNum,
                name: StepObjectMapping.getStageName(stageNum),
                totalSteps: stageSteps.length,
                completedSteps: completedCount,
                isComplete: completedCount === stageSteps.length
            });
        }

        return {
            region: regionMapping,
            stages: stageInfo
        };
    };

    SceneInteraction.prototype._handleGoToStep = function() {
        if (!this._currentRegionData || !this._currentRegionData.region || !this._currentRegionData.mapping) return;

        var region = this._currentRegionData.region;
        var mapping = this._currentRegionData.mapping;
        this._hideRegionDetailCard();

        this._lastViewedRegionId = region.id;

        this._emit('regionGoToStep', {
            region: region,
            regionId: region.id,
            step: mapping.step,
            stage: mapping.stage
        });
    };

    SceneInteraction.prototype._showObjectDetailCard = function(objectConfig, x, y) {
        if (!this._objectDetailCard || !objectConfig) return;

        var iconEl = this._objectDetailCard.querySelector('.scene-object-detail-icon');
        var nameEl = this._objectDetailCard.querySelector('.scene-object-detail-name');
        var stageEl = this._objectDetailCard.querySelector('.scene-object-detail-stage');
        var descEl = this._objectDetailCard.querySelector('.scene-object-detail-desc');

        if (iconEl) iconEl.textContent = objectConfig.icon || '📦';
        if (nameEl) nameEl.textContent = objectConfig.name || '未知物件';

        var stageNum = 0;
        if (objectConfig.stage) {
            var match = objectConfig.stage.match(/stage(\d+)/);
            if (match) stageNum = parseInt(match[1]);
        }
        if (stageEl) {
            stageEl.textContent = '第' + (stageNum + 1) + '阶段解锁';
        }

        if (descEl) {
            descEl.textContent = objectConfig.description || '一件有趣的家具装饰~';
        }

        this._objectDetailCard.style.display = 'block';

        var cardWidth = this._objectDetailCard.offsetWidth;
        var cardHeight = this._objectDetailCard.offsetHeight;

        var left = x - cardWidth / 2;
        var top = y - cardHeight - 20;

        if (left < 20) left = 20;
        if (left + cardWidth > window.innerWidth - 20) {
            left = window.innerWidth - cardWidth - 20;
        }
        if (top < 20) {
            top = y + 20;
        }

        this._objectDetailCard.style.left = left + 'px';
        this._objectDetailCard.style.top = top + 'px';

        var self = this;
        requestAnimationFrame(function() {
            if (self._objectDetailCard) {
                self._objectDetailCard.style.opacity = '1';
                self._objectDetailCard.style.transform = 'scale(1) translateY(0)';
            }
        });
    };

    SceneInteraction.prototype._hideObjectDetailCard = function() {
        if (!this._objectDetailCard) return;
        this._objectDetailCard.style.opacity = '0';
        this._objectDetailCard.style.transform = 'scale(0.9) translateY(10px)';
        var self = this;
        setTimeout(function() {
            if (self._objectDetailCard) {
                self._objectDetailCard.style.display = 'none';
            }
        }, 250);
    };

    SceneInteraction.prototype._getScenePoint = function(clientX, clientY) {
        if (!this.container || !this.regionManager) return null;

        var rect = this.container.getBoundingClientRect();
        var baseSize = this.regionManager.getBaseSize();

        var layers = this.container.querySelectorAll('.scene25d-layer');
        var layerWidth = baseSize.width;
        var layerHeight = baseSize.height;

        if (layers.length > 0) {
            layerWidth = layers[0].offsetWidth;
            layerHeight = layers[0].offsetHeight;
        }

        var scaleX = layerWidth / baseSize.width;
        var scaleY = layerHeight / baseSize.height;
        var scale = Math.min(scaleX, scaleY);

        var offsetX = (rect.width - layerWidth) / 2;
        var offsetY = (rect.height - layerHeight) / 2;

        var x = (clientX - rect.left - offsetX) / scale;
        var y = (clientY - rect.top - offsetY) / scale;

        return { x: x, y: y, clientX: clientX, clientY: clientY };
    };

    SceneInteraction.prototype._getObjectAtPoint = function(scenePoint) {
        if (!this.objectManager || !scenePoint) return null;

        var objects = this.objectManager.objects || [];
        for (var i = objects.length - 1; i >= 0; i--) {
            var obj = objects[i];
            if (!obj.visible) continue;

            var objX = obj.x || 0;
            var objY = obj.y || 0;
            var objWidth = obj.width || 60;
            var objHeight = obj.height || 60;

            if (scenePoint.x >= objX && scenePoint.x <= objX + objWidth &&
                scenePoint.y >= objY && scenePoint.y <= objY + objHeight) {
                return obj;
            }
        }
        return null;
    };

    SceneInteraction.prototype._injectRegionAnimations = function() {
        if (document.getElementById('scene-interaction-animations')) return;

        var style = document.createElement('style');
        style.id = 'scene-interaction-animations';
        style.textContent = [
            '@keyframes regionPulse {',
            '  0%, 100% { opacity: 0.6; transform: scale(1); }',
            '  50% { opacity: 1; transform: scale(1.05); }',
            '}',
            '@keyframes regionPulseGlow {',
            '  0%, 100% { box-shadow: 0 0 8px rgba(212, 168, 83, 0.3); }',
            '  50% { box-shadow: 0 0 20px rgba(212, 168, 83, 0.6); }',
            '}',
            '.scene25d-region {',
            '  transition: transform 0.2s ease-out, filter 0.2s ease;',
            '}',
            '.scene25d-region-floor {',
            '  transition: filter 0.3s ease, opacity 0.3s ease;',
            '}',
            '.scene25d-region-border {',
            '  transition: border-color 0.2s ease, border-width 0.2s ease, box-shadow 0.2s ease;',
            '}',
            '.scene25d-region-label {',
            '  transition: all 0.2s ease;',
            '}'
        ].join('\n');

        document.head.appendChild(style);
    };

    SceneInteraction.prototype._bindEvents = function() {
        if (!this.container) return;

        var self = this;

        this._onMouseMove = function(e) {
            if (self._isTouchDevice) return;
            self._handleMouseMove(e);
        };

        this._onMouseLeave = function() {
            if (self._isTouchDevice) return;
            self._clearTooltipTimer();
            self._hideTooltip();
            self._clearRegionHover();
        };

        this._onClick = function(e) {
            self._handleClick(e);
        };

        this._onTouchStart = function(e) {
            if (!self._isTouchDevice) return;
            var touch = e.touches[0];
            if (!touch) return;
            self._touchStartX = touch.clientX;
            self._touchStartY = touch.clientY;
            self._touchStartTime = Date.now();
        };

        this._onTouchEnd = function(e) {
            if (!self._isTouchDevice) return;
            var touch = e.changedTouches[0];
            if (!touch) return;

            var deltaX = Math.abs(touch.clientX - self._touchStartX);
            var deltaY = Math.abs(touch.clientY - self._touchStartY);
            var deltaTime = Date.now() - self._touchStartTime;

            if (deltaX < 10 && deltaY < 10 && deltaTime < 300) {
                self._handleClick({
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    target: e.target
                });
            }

            self._clearTooltipTimer();
            self._hideTooltip();
        };

        this.container.addEventListener('mousemove', this._onMouseMove);
        this.container.addEventListener('mouseleave', this._onMouseLeave);
        this.container.addEventListener('click', this._onClick);
        this.container.addEventListener('touchstart', this._onTouchStart, { passive: true });
        this.container.addEventListener('touchend', this._onTouchEnd, { passive: true });
    };

    SceneInteraction.prototype._handleMouseMove = function(e) {
        var scenePoint = this._getScenePoint(e.clientX, e.clientY);
        if (!scenePoint || !this.regionManager) return;

        var region = this.regionManager.getRegionAtPoint(scenePoint.x, scenePoint.y);
        var hitObject = this._getObjectAtPoint(scenePoint);

        if (hitObject) {
            this.container.style.cursor = 'pointer';
        } else if (region) {
            this.container.style.cursor = 'pointer';
        } else {
            this.container.style.cursor = 'default';
        }

        if (region && region.id !== this._currentHoverRegion) {
            this._clearTooltipTimer();
            this._clearRegionHover();
            this._currentHoverRegion = region.id;
            this._setRegionHover(region, true);

            var self = this;
            this._tooltipTimer = setTimeout(function() {
                self._showTooltip(
                    e.clientX,
                    e.clientY,
                    region.name,
                    region.description
                );
            }, TOOLTIP_DELAY);

            this._emit('regionHover', { region: region, hovering: true });
        } else if (!region && this._currentHoverRegion) {
            this._clearTooltipTimer();
            this._hideTooltip();
            this._clearRegionHover();
        } else if (region && this._tooltipTimer) {
            this._updateTooltipPosition(e.clientX, e.clientY);
        }
    };

    SceneInteraction.prototype._updateTooltipPosition = function(x, y) {
        if (!this._tooltipEl || this._tooltipEl.style.visibility === 'hidden') return;

        var tooltipWidth = this._tooltipEl.offsetWidth;
        var tooltipHeight = this._tooltipEl.offsetHeight;

        var left = x - tooltipWidth / 2;
        var top = y - tooltipHeight - 12;

        if (left < 10) left = 10;
        if (left + tooltipWidth > window.innerWidth - 10) {
            left = window.innerWidth - tooltipWidth - 10;
        }
        if (top < 10) {
            top = y + 20;
        }

        this._tooltipEl.style.left = left + 'px';
        this._tooltipEl.style.top = top + 'px';
    };

    SceneInteraction.prototype._handleClick = function(e) {
        var scenePoint = this._getScenePoint(e.clientX, e.clientY);
        if (!scenePoint) return;

        var hitObject = this._getObjectAtPoint(scenePoint);
        if (hitObject) {
            var objConfig = null;
            if (ObjectConfig && typeof ObjectConfig.getConfig === 'function') {
                objConfig = ObjectConfig.getConfig(hitObject.id);
            }
            if (!objConfig) {
                objConfig = {
                    id: hitObject.id,
                    name: hitObject.name,
                    icon: hitObject.icon,
                    description: '一件有趣的家具装饰~'
                };
            }

            this._showObjectDetailCard(objConfig, e.clientX, e.clientY);
            this._emit('objectClick', { object: hitObject, config: objConfig });
            return;
        }

        if (this.regionManager) {
            var region = this.regionManager.getRegionAtPoint(scenePoint.x, scenePoint.y);
            if (region) {
                this._highlightRegion(region);
                this._moveNianToRegion(region);
                if (this._regionDetailCard) {
                    this._showRegionDetailCard(region, e.clientX, e.clientY);
                }
                this._emit('regionClick', { region: region });
            }
        }
    };

    SceneInteraction.prototype._setRegionHover = function(region, isHover) {
        if (!this.regionManager) return;

        var elements = this.regionManager.getRegionElements(region.id);
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            var floorEl = el.querySelector('.scene25d-region-floor');
            var borderEl = el.querySelector('.scene25d-region-border');
            var labelEl = el.querySelector('.scene25d-region-label');

            if (this._pixelStyleEnabled) {
                if (isHover) {
                    el.classList.add('pixel-region-hover');
                    el.style.transform = 'scale(1.02)';
                    el.style.transformOrigin = 'center center';
                    el.style.zIndex = '10';
                } else {
                    el.classList.remove('pixel-region-hover');
                    el.style.transform = 'scale(1)';
                    el.style.zIndex = '1';
                }
                el.style.transition = 'transform 0.15s ease-out, filter 0.15s steps(3)';

                if (floorEl) {
                    floorEl.style.filter = isHover ? 'brightness(1.2) saturate(1.1)' : 'none';
                    floorEl.style.transition = 'filter 0.15s steps(3)';
                    floorEl.style.boxShadow = isHover ? 'inset 0 0 20px rgba(212, 168, 83, 0.3)' : 'none';
                }
                if (borderEl) {
                    borderEl.style.borderColor = isHover ? '#D4A853' : 'rgba(139, 111, 71, 0.3)';
                    borderEl.style.borderStyle = isHover ? 'solid' : 'dashed';
                    borderEl.style.borderWidth = isHover ? '2px' : '1px';
                    borderEl.style.transition = 'border-color 0.15s steps(2), border-width 0.15s ease';
                    borderEl.style.boxShadow = isHover ? '0 0 12px rgba(212, 168, 83, 0.5), inset 0 0 8px rgba(212, 168, 83, 0.2)' : 'none';
                }
                if (labelEl) {
                    labelEl.style.color = isHover ? '#5A4A3A' : 'rgba(139, 111, 71, 0.6)';
                    labelEl.style.fontWeight = isHover ? '700' : '500';
                    labelEl.style.fontSize = isHover ? '12px' : '11px';
                    labelEl.style.background = isHover ? 'rgba(255, 248, 240, 0.9)' : 'transparent';
                    labelEl.style.padding = isHover ? '2px 8px' : '0';
                    labelEl.style.borderRadius = isHover ? '2px' : '0';
                    labelEl.style.transition = 'all 0.15s ease';
                    labelEl.style.textShadow = isHover ? '0 1px 0 rgba(255,255,255,0.8)' : 'none';
                }
            } else {
                if (floorEl) {
                    floorEl.style.opacity = isHover ? REGION_HOVER_OPACITY : '0.6';
                    floorEl.style.filter = isHover ? 'brightness(1.15) saturate(1.05)' : 'none';
                    floorEl.style.transition = 'opacity 0.2s ease, filter 0.2s ease';
                }
                if (borderEl) {
                    borderEl.style.borderColor = isHover ? 'rgba(139, 111, 71, 0.7)' : 'rgba(139, 111, 71, 0.3)';
                    borderEl.style.borderWidth = isHover ? '2px' : '1px';
                    borderEl.style.transition = 'all 0.2s ease';
                    borderEl.style.boxShadow = isHover ? '0 0 10px rgba(139, 111, 71, 0.3)' : 'none';
                }
                if (labelEl) {
                    labelEl.style.color = isHover ? '#5A4A3A' : 'rgba(139, 111, 71, 0.6)';
                    labelEl.style.fontWeight = isHover ? '600' : '500';
                    labelEl.style.transition = 'all 0.2s ease';
                }
            }
        }
    };

    SceneInteraction.prototype._bindEventBusListeners = function() {
        if (typeof EventBus === 'undefined') return;

        var self = this;

        var stepUnsub = EventBus.on(EventBus.EVENTS.STEP_COMPLETED, function(data) {
            self._onStepCompleted(data);
        });
        this._eventBusUnsubscribers.push(stepUnsub);

        var stageUnsub = EventBus.on(EventBus.EVENTS.SOP_STAGE_CHANGED, function(data) {
            self._onStageChanged(data);
        });
        this._eventBusUnsubscribers.push(stageUnsub);
    };

    SceneInteraction.prototype._onStepCompleted = function(data) {
        if (this._regionDetailCard && this._regionDetailCard.style.display === 'block' && this._currentRegionData) {
            var regionId = this._currentRegionData.region.id;
            var progress = this._getRegionProgress(regionId);
            var stageInfo = this._getRegionStageInfo(regionId);

            var progressPercentEl = this._regionDetailCard.querySelector('.progress-percent');
            var progressFillEl = this._regionDetailCard.querySelector('.pixel-region-card-progress-fill');
            var currentStageNameEl = this._regionDetailCard.querySelector('.current-stage-name');
            var stepsTabBadge = this._regionDetailCard.querySelector('.steps-tab-badge');
            var stepsCountBadge = this._regionDetailCard.querySelector('.steps-count-badge');

            if (progressPercentEl) progressPercentEl.textContent = progress + '%';
            if (progressFillEl) progressFillEl.style.width = progress + '%';

            if (stageInfo && stageInfo.stages && currentStageNameEl) {
                var currentText = '尚未开始';
                for (var i = stageInfo.stages.length - 1; i >= 0; i--) {
                    if (stageInfo.stages[i].completedSteps > 0) {
                        currentText = stageInfo.stages[i].name;
                        if (!stageInfo.stages[i].isComplete) {
                            currentText = stageInfo.stages[i].name + ' (进行中)';
                        }
                        break;
                    }
                }
                if (progress === 100) {
                    currentText = '🎉 全部完成！';
                }
                currentStageNameEl.textContent = currentText;
            }

            this._renderStepsList(regionId);
            this._renderPitfallList(regionId);
        }

        this._updateAllRegionVisuals();
    };

    SceneInteraction.prototype._onStageChanged = function(data) {
        this._updateAllRegionVisuals();
    };

    SceneInteraction.prototype._updateAllRegionVisuals = function() {
        if (!this.regionManager) return;
        var regions = this.regionManager.getRegions();
        for (var i = 0; i < regions.length; i++) {
            this._updateRegionVisualState(regions[i]);
        }
    };

    SceneInteraction.prototype._updateRegionVisualState = function(region) {
        if (!this.regionManager || !region) return;

        var progress = this._getRegionProgress(region.id);
        var elements = this.regionManager.getRegionElements(region.id);

        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            var floorEl = el.querySelector('.scene25d-region-floor');
            var glowEl = el.querySelector('.scene25d-region-progress-glow');

            if (!glowEl) {
                glowEl = document.createElement('div');
                glowEl.className = 'scene25d-region-progress-glow';
                glowEl.style.cssText = [
                    'position: absolute',
                    'width: 100%',
                    'height: 100%',
                    'top: 0',
                    'left: 0',
                    'pointer-events: none',
                    'opacity: 0',
                    'transition: opacity 0.3s ease'
                ].join(';');
                el.appendChild(glowEl);
            }

            if (floorEl) {
                var brightness = 0.6 + (progress / 100) * 0.3;
                var saturate = 0.8 + (progress / 100) * 0.4;
                floorEl.style.filter = 'brightness(' + brightness + ') saturate(' + saturate + ')';
            }

            if (progress > 0 && progress < 100) {
                glowEl.style.background = 'radial-gradient(ellipse at center, rgba(212, 168, 83, 0.25) 0%, transparent 70%)';
                glowEl.style.opacity = '1';
                glowEl.style.animation = 'regionPulse 2s ease-in-out infinite';
            } else if (progress === 100) {
                glowEl.style.background = 'radial-gradient(ellipse at center, rgba(91, 140, 90, 0.3) 0%, transparent 70%)';
                glowEl.style.opacity = '1';
                glowEl.style.animation = 'none';
            } else {
                glowEl.style.opacity = '0';
                glowEl.style.animation = 'none';
            }

            var completeBadge = el.querySelector('.scene25d-region-complete-badge');
            if (progress === 100 && !completeBadge) {
                completeBadge = document.createElement('div');
                completeBadge.className = 'scene25d-region-complete-badge';
                completeBadge.innerHTML = '✓ 完成';
                completeBadge.style.cssText = [
                    'position: absolute',
                    'top: 8px',
                    'right: 10px',
                    'padding: 2px 8px',
                    'background: #5B8C5A',
                    'color: #fff',
                    'font-size: 10px',
                    'font-weight: 700',
                    "font-family: 'Courier New', Consolas, monospace",
                    'border-radius: 2px',
                    'box-shadow: 0 2px 4px rgba(0,0,0,0.2)',
                    'pointer-events: none',
                    'z-index: 5'
                ].join(';');
                el.appendChild(completeBadge);
            } else if (progress < 100 && completeBadge) {
                completeBadge.parentNode.removeChild(completeBadge);
            }
        }
    };

    SceneInteraction.prototype.setProgressSync = function(progressSync) {
        this._progressSync = progressSync;
        if (progressSync && typeof progressSync.onRegionChange === 'function') {
            var self = this;
            progressSync.onRegionChange(function(regionStates) {
                self._onRegionStatesChange(regionStates);
            });
        }
    };

    SceneInteraction.prototype._onRegionStatesChange = function(regionStates) {
        if (this.regionManager) {
            var regions = this.regionManager.getRegions();
            for (var i = 0; i < regions.length; i++) {
                this._updateRegionVisualState(regions[i]);
            }
        }
    };

    SceneInteraction.prototype.getLastViewedRegionId = function() {
        return this._lastViewedRegionId;
    };

    SceneInteraction.prototype.focusRegion = function(regionId) {
        if (!this.regionManager || !regionId) return;
        var region = this.regionManager.getRegion(regionId);
        if (region) {
            this._highlightRegion(region);
            this._moveNianToRegion(region);
        }
    };

    SceneInteraction.prototype._clearRegionHover = function() {
        if (!this.regionManager || !this._currentHoverRegion) return;

        var region = this.regionManager.getRegion(this._currentHoverRegion);
        if (region) {
            this._setRegionHover(region, false);
        }
        this._currentHoverRegion = null;
        this._emit('regionHover', { region: region, hovering: false });
    };

    SceneInteraction.prototype._highlightRegion = function(region) {
        if (!this.regionManager) return;

        var elements = this.regionManager.getRegionElements(region.id);
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            var floorEl = el.querySelector('.scene25d-region-floor');
            if (floorEl) {
                var originalOpacity = floorEl.style.opacity;
                floorEl.style.opacity = '1';
                floorEl.style.transition = 'opacity 0.1s ease';

                var self = this;
                (function(floorEl2, originalOpacity2) {
                    setTimeout(function() {
                        floorEl2.style.opacity = originalOpacity2 || '0.6';
                        floorEl2.style.transition = 'opacity 0.3s ease';
                    }, REGION_CLICK_HIGHLIGHT_DURATION);
                })(floorEl, originalOpacity);
            }
        }
    };

    SceneInteraction.prototype._moveNianToRegion = function(region) {
        if (!this.nianSprite || !region) return;
        if (typeof this.nianSprite.moveTo !== 'function') return;

        var targetX = region.x + region.width / 2 - 50;
        var targetY = region.y + region.height / 2;

        targetX = Math.max(20, Math.min(targetX, 680));
        targetY = Math.max(100, Math.min(targetY, 380));

        var currentX = this.nianSprite.x || 350;
        var currentY = this.nianSprite.y || 280;
        var distance = Math.sqrt(
            Math.pow(targetX - currentX, 2) +
            Math.pow(targetY - currentY, 2)
        );
        var duration = Math.max(600, Math.min(distance * 2, 1500));

        if (targetX < currentX) {
            if (typeof this.nianSprite.setFacing === 'function') {
                this.nianSprite.setFacing('left');
            }
        } else if (targetX > currentX) {
            if (typeof this.nianSprite.setFacing === 'function') {
                this.nianSprite.setFacing('right');
            }
        }

        if (typeof this.nianSprite.setState === 'function') {
            this.nianSprite.setState('walk');
        }

        var self = this;
        this.nianSprite.moveTo(targetX, targetY, duration, function() {
            if (self.nianSprite && typeof self.nianSprite.setState === 'function') {
                self.nianSprite.setState('idle');
            }
            if (self.nianSprite && typeof self.nianSprite.setFacing === 'function') {
                self.nianSprite.setFacing('right');
            }
        });
    };

    SceneInteraction.prototype._clearTooltipTimer = function() {
        if (this._tooltipTimer) {
            clearTimeout(this._tooltipTimer);
            this._tooltipTimer = null;
        }
    };

    SceneInteraction.prototype.destroy = function() {
        this._clearTooltipTimer();

        if (this._tooltipEl && this._tooltipEl.parentNode) {
            this._tooltipEl.parentNode.removeChild(this._tooltipEl);
        }
        this._tooltipEl = null;

        if (this._objectDetailCard && this._objectDetailCard.parentNode) {
            this._objectDetailCard.parentNode.removeChild(this._objectDetailCard);
        }
        this._objectDetailCard = null;

        if (this._regionDetailCard && this._regionDetailCard.parentNode) {
            this._regionDetailCard.parentNode.removeChild(this._regionDetailCard);
        }
        this._regionDetailCard = null;
        this._currentRegionData = null;
        this._lastViewedRegionId = null;

        for (var i = 0; i < this._eventBusUnsubscribers.length; i++) {
            try {
                this._eventBusUnsubscribers[i]();
            } catch (e) {}
        }
        this._eventBusUnsubscribers = [];

        if (this.container) {
            if (this._onMouseMove) {
                this.container.removeEventListener('mousemove', this._onMouseMove);
            }
            if (this._onMouseLeave) {
                this.container.removeEventListener('mouseleave', this._onMouseLeave);
            }
            if (this._onClick) {
                this.container.removeEventListener('click', this._onClick);
            }
            if (this._onTouchStart) {
                this.container.removeEventListener('touchstart', this._onTouchStart);
            }
            if (this._onTouchEnd) {
                this.container.removeEventListener('touchend', this._onTouchEnd);
            }
        }

        var animStyle = document.getElementById('scene-interaction-animations');
        if (animStyle && animStyle.parentNode) {
            animStyle.parentNode.removeChild(animStyle);
        }

        this._events = {
            regionClick: [],
            objectClick: [],
            regionHover: [],
            regionGoToStep: []
        };

        this.regionManager = null;
        this.objectManager = null;
        this.nianSprite = null;
        this._progressSync = null;
        this.container = null;
        this._currentHoverRegion = null;
        this._initialized = false;
    };

    SceneInteraction.prototype.setPixelStyleEnabled = function(enabled) {
        this._pixelStyleEnabled = enabled;
        if (enabled && !this._regionDetailCard && this._initialized) {
            this._createRegionDetailCard();
        } else if (!enabled && this._regionDetailCard) {
            this._hideRegionDetailCard();
        }
    };

    SceneInteraction.prototype.refreshRegionVisuals = function() {
        this._updateAllRegionVisuals();
    };

    return {
        SceneInteraction: SceneInteraction,
        create: function(sceneContainer, options) {
            var interaction = new SceneInteraction();
            if (sceneContainer) {
                interaction.init(sceneContainer, options);
            }
            return interaction;
        }
    };
})();
