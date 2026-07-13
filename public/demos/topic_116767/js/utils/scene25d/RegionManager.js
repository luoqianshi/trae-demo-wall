var RegionManager = (function() {
    'use strict';

    var DEFAULT_REGIONS = [
        {
            id: 'balcony',
            name: '阳台',
            description: '上方长条区域，采光充足的休闲空间',
            x: 50,
            y: 0,
            width: 700,
            height: 100,
            stage: 5,
            primaryColor: '#87CEEB',
            floorColor: 'linear-gradient(180deg, #B8D4E8 0%, #A0C4D8 100%)',
            wallColor: 'linear-gradient(180deg, #E8F0F8 0%, #D8E8F0 100%)'
        },
        {
            id: 'entryway',
            name: '玄关',
            description: '左侧入口区域，回家的第一印象',
            x: 0,
            y: 100,
            width: 150,
            height: 250,
            stage: 1,
            primaryColor: '#D4A574',
            floorColor: 'linear-gradient(180deg, #D4B898 0%, #C4A888 100%)',
            wallColor: 'linear-gradient(180deg, #F0E6D8 0%, #E8DCC8 100%)'
        },
        {
            id: 'livingroom',
            name: '客厅',
            description: '中间大区域，家庭活动的核心空间',
            x: 150,
            y: 100,
            width: 400,
            height: 250,
            stage: 4,
            primaryColor: '#C84A3E',
            floorColor: 'linear-gradient(180deg, #D4B498 0%, #C4A488 100%)',
            wallColor: 'linear-gradient(180deg, #F5EEE8 0%, #E8DED0 100%)'
        },
        {
            id: 'kitchen',
            name: '厨房',
            description: '右上区域，美食诞生的地方',
            x: 550,
            y: 100,
            width: 250,
            height: 180,
            stage: 3,
            primaryColor: '#5B8C5A',
            floorColor: 'linear-gradient(180deg, #C8C8B8 0%, #B8B8A8 100%)',
            wallColor: 'linear-gradient(180deg, #F0F0E8 0%, #E8E8DC 100%)'
        },
        {
            id: 'study',
            name: '书房',
            description: '左下区域，安静的工作学习空间',
            x: 0,
            y: 350,
            width: 250,
            height: 150,
            stage: 4,
            primaryColor: '#4A6FA5',
            floorColor: 'linear-gradient(180deg, #B8A898 0%, #A89888 100%)',
            wallColor: 'linear-gradient(180deg, #E8E8F0 0%, #D8D8E8 100%)'
        },
        {
            id: 'bedroom',
            name: '卧室',
            description: '右下区域，舒适的休息空间',
            x: 550,
            y: 280,
            width: 250,
            height: 220,
            stage: 5,
            primaryColor: '#9B7BAA',
            floorColor: 'linear-gradient(180deg, #D4B8A8 0%, #C4A898 100%)',
            wallColor: 'linear-gradient(180deg, #F0E8F0 0%, #E0D8E8 100%)'
        }
    ];

    function RegionManager(options) {
        options = options || {};
        this._regions = [];
        this._regionElements = {};
        this._baseWidth = options.baseWidth || 800;
        this._baseHeight = options.baseHeight || 500;
        this._initRegions();
    }

    RegionManager.prototype._initRegions = function() {
        for (var i = 0; i < DEFAULT_REGIONS.length; i++) {
            var region = {};
            for (var key in DEFAULT_REGIONS[i]) {
                if (DEFAULT_REGIONS[i].hasOwnProperty(key)) {
                    region[key] = DEFAULT_REGIONS[i][key];
                }
            }
            this._regions.push(region);
            this._regionElements[region.id] = [];
        }
    };

    RegionManager.prototype.getRegions = function() {
        return this._regions.slice();
    };

    RegionManager.prototype.getRegion = function(regionId) {
        if (!regionId) return null;
        for (var i = 0; i < this._regions.length; i++) {
            if (this._regions[i].id === regionId) {
                return this._regions[i];
            }
        }
        return null;
    };

    RegionManager.prototype.getRegionAtPoint = function(x, y) {
        if (typeof x !== 'number' || typeof y !== 'number') return null;
        for (var i = this._regions.length - 1; i >= 0; i--) {
            var region = this._regions[i];
            if (x >= region.x && x <= region.x + region.width &&
                y >= region.y && y <= region.y + region.height) {
                return region;
            }
        }
        return null;
    };

    RegionManager.prototype.getRegionsByStage = function(stageId) {
        var result = [];
        for (var i = 0; i < this._regions.length; i++) {
            if (this._regions[i].stage === stageId) {
                result.push(this._regions[i]);
            }
        }
        return result;
    };

    RegionManager.prototype.addRegionElement = function(regionId, element) {
        if (!this._regionElements[regionId]) {
            this._regionElements[regionId] = [];
        }
        this._regionElements[regionId].push(element);
    };

    RegionManager.prototype.getRegionElements = function(regionId) {
        return this._regionElements[regionId] || [];
    };

    RegionManager.prototype.createRegionVisuals = function() {
        var container = document.createElement('div');
        container.className = 'scene25d-regions';
        container.style.position = 'absolute';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.top = '0';
        container.style.left = '0';
        container.style.pointerEvents = 'none';

        for (var i = 0; i < this._regions.length; i++) {
            var region = this._regions[i];
            var regionEl = document.createElement('div');
            regionEl.className = 'scene25d-region scene25d-region-' + region.id;
            regionEl.setAttribute('data-region-id', region.id);
            regionEl.setAttribute('data-region-name', region.name);

            regionEl.style.position = 'absolute';
            regionEl.style.left = region.x + 'px';
            regionEl.style.top = region.y + 'px';
            regionEl.style.width = region.width + 'px';
            regionEl.style.height = region.height + 'px';
            regionEl.style.boxSizing = 'border-box';

            var floorEl = document.createElement('div');
            floorEl.className = 'scene25d-region-floor';
            floorEl.style.position = 'absolute';
            floorEl.style.width = '100%';
            floorEl.style.height = '100%';
            floorEl.style.background = region.floorColor;
            floorEl.style.opacity = '0.6';
            floorEl.style.borderRadius = '2px';
            regionEl.appendChild(floorEl);

            var borderEl = document.createElement('div');
            borderEl.className = 'scene25d-region-border';
            borderEl.style.position = 'absolute';
            borderEl.style.width = '100%';
            borderEl.style.height = '100%';
            borderEl.style.border = '1px dashed rgba(139, 111, 71, 0.3)';
            borderEl.style.boxSizing = 'border-box';
            borderEl.style.borderRadius = '2px';
            regionEl.appendChild(borderEl);

            var labelEl = document.createElement('div');
            labelEl.className = 'scene25d-region-label';
            labelEl.textContent = region.name;
            labelEl.style.position = 'absolute';
            labelEl.style.top = '8px';
            labelEl.style.left = '10px';
            labelEl.style.fontSize = '11px';
            labelEl.style.color = 'rgba(139, 111, 71, 0.6)';
            labelEl.style.fontWeight = '500';
            labelEl.style.letterSpacing = '1px';
            regionEl.appendChild(labelEl);

            container.appendChild(regionEl);
            this.addRegionElement(region.id, regionEl);
        }

        return container;
    };

    RegionManager.prototype.setBaseSize = function(width, height) {
        this._baseWidth = width;
        this._baseHeight = height;
    };

    RegionManager.prototype.getBaseSize = function() {
        return {
            width: this._baseWidth,
            height: this._baseHeight
        };
    };

    return {
        RegionManager: RegionManager,
        create: function(options) {
            return new RegionManager(options);
        }
    };
})();
