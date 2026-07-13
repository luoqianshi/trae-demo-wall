var LayerManager = (function() {
    'use strict';

    function Layer(config) {
        this.id = config.id || 'layer-' + Date.now() + Math.random().toString(36).substr(2, 9);
        this.name = config.name || 'Layer';
        this.zIndex = config.zIndex || 0;
        this.parallaxFactor = config.parallaxFactor !== undefined ? config.parallaxFactor : 0.5;
        this.elements = [];
        this.opacity = config.opacity !== undefined ? config.opacity : 1;
        this.visible = config.visible !== undefined ? config.visible : true;
        this._element = null;
        this._offsetX = 0;
        this._offsetY = 0;
    }

    Layer.prototype.addElement = function(el) {
        if (this._element && el instanceof Element) {
            this._element.appendChild(el);
        }
        this.elements.push(el);
    };

    Layer.prototype.removeElement = function(el) {
        var index = this.elements.indexOf(el);
        if (index > -1) {
            this.elements.splice(index, 1);
        }
        if (this._element && el instanceof Element && el.parentNode === this._element) {
            this._element.removeChild(el);
        }
    };

    Layer.prototype.setOffset = function(offsetX, offsetY) {
        this._offsetX = offsetX;
        this._offsetY = offsetY;
        if (this._element) {
            this._element.style.transform = 'translate3d(' + offsetX + 'px, ' + offsetY + 'px, 0)';
        }
    };

    Layer.prototype.render = function(container) {
        if (!this._element) {
            this._element = document.createElement('div');
            this._element.className = 'scene25d-layer';
            this._element.setAttribute('data-layer-id', this.id);
            this._element.setAttribute('data-layer-name', this.name);
        }

        this._element.style.zIndex = this.zIndex;
        this._element.style.opacity = this.opacity;
        this._element.style.display = this.visible ? 'block' : 'none';

        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i] instanceof Element && !this.elements[i].parentNode) {
                this._element.appendChild(this.elements[i]);
            }
        }

        if (this._element.parentNode !== container) {
            container.appendChild(this._element);
        }

        this.setOffset(this._offsetX, this._offsetY);
    };

    Layer.prototype.destroy = function() {
        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
        this._element = null;
        this.elements = [];
    };

    function LayerManager() {
        this.layers = [];
        this._container = null;
    }

    LayerManager.prototype.addLayer = function(layerConfig) {
        var layer = new Layer(layerConfig);
        this.layers.push(layer);
        this._sortLayers();
        if (this._container) {
            layer.render(this._container);
        }
        return layer;
    };

    LayerManager.prototype.removeLayer = function(id) {
        var index = -1;
        for (var i = 0; i < this.layers.length; i++) {
            if (this.layers[i].id === id) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            this.layers[index].destroy();
            this.layers.splice(index, 1);
        }
    };

    LayerManager.prototype.getLayer = function(id) {
        for (var i = 0; i < this.layers.length; i++) {
            if (this.layers[i].id === id) {
                return this.layers[i];
            }
        }
        return null;
    };

    LayerManager.prototype._sortLayers = function() {
        this.layers.sort(function(a, b) {
            return a.zIndex - b.zIndex;
        });
    };

    LayerManager.prototype.setParallaxOffset = function(offsetX, offsetY) {
        for (var i = 0; i < this.layers.length; i++) {
            var layer = this.layers[i];
            var layerOffsetX = offsetX * layer.parallaxFactor;
            var layerOffsetY = offsetY * layer.parallaxFactor;
            layer.setOffset(layerOffsetX, layerOffsetY);
        }
    };

    LayerManager.prototype.render = function(container) {
        this._container = container;
        this._sortLayers();
        for (var i = 0; i < this.layers.length; i++) {
            this.layers[i].render(container);
        }
    };

    LayerManager.prototype.destroy = function() {
        for (var i = this.layers.length - 1; i >= 0; i--) {
            this.layers[i].destroy();
        }
        this.layers = [];
        this._container = null;
    };

    return {
        Layer: Layer,
        LayerManager: LayerManager,
        create: function() {
            return new LayerManager();
        }
    };
})();
