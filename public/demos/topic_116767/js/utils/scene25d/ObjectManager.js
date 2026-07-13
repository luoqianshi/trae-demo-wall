var ObjectManager = (function() {
    'use strict';

    function ObjectManager() {
        this.objects = [];
        this._layerElements = {};
        this._initialized = false;
    }

    ObjectManager.prototype.addObject = function(config) {
        if (!config) return null;

        var objConfig = config;
        if (typeof config === 'string') {
            objConfig = ObjectConfig ? ObjectConfig.getConfig(config) : null;
            if (!objConfig) return null;
        }

        var obj = SceneObject.create(objConfig);
        this.objects.push(obj);

        var layerId = obj.layer || 'mid';
        if (this._layerElements[layerId]) {
            obj.attachTo(this._layerElements[layerId]);
        }

        return obj;
    };

    ObjectManager.prototype.removeObject = function(id) {
        var index = -1;
        for (var i = 0; i < this.objects.length; i++) {
            if (this.objects[i].id === id) {
                index = i;
                break;
            }
        }

        if (index > -1) {
            this.objects[index].destroy();
            this.objects.splice(index, 1);
            return true;
        }
        return false;
    };

    ObjectManager.prototype.getObject = function(id) {
        for (var i = 0; i < this.objects.length; i++) {
            if (this.objects[i].id === id) {
                return this.objects[i];
            }
        }
        return null;
    };

    ObjectManager.prototype.getObjectsByType = function(type) {
        var result = [];
        for (var i = 0; i < this.objects.length; i++) {
            if (this.objects[i].type === type) {
                result.push(this.objects[i]);
            }
        }
        return result;
    };

    ObjectManager.prototype.getObjectsByLayer = function(layer) {
        var result = [];
        for (var i = 0; i < this.objects.length; i++) {
            if (this.objects[i].layer === layer) {
                result.push(this.objects[i]);
            }
        }
        return result;
    };

    ObjectManager.prototype.showObject = function(id, animate, animationConfig) {
        var obj = this.getObject(id);
        if (obj) {
            obj.show(animate, animationConfig);
            return true;
        }
        return false;
    };

    ObjectManager.prototype.hideObject = function(id, animate, animationConfig) {
        var obj = this.getObject(id);
        if (obj) {
            obj.hide(animate, animationConfig);
            return true;
        }
        return false;
    };

    ObjectManager.prototype.batchShow = function(ids, delay, animationConfig) {
        if (!ids || ids.length === 0) return;

        delay = delay !== undefined ? delay : 100;
        var self = this;

        for (var i = 0; i < ids.length; i++) {
            (function(index) {
                setTimeout(function() {
                    self.showObject(ids[index], true, animationConfig);
                }, index * delay);
            })(i);
        }
    };

    ObjectManager.prototype.batchHide = function(ids, delay, animationConfig) {
        if (!ids || ids.length === 0) return;

        delay = delay !== undefined ? delay : 100;
        var self = this;

        for (var i = 0; i < ids.length; i++) {
            (function(index) {
                setTimeout(function() {
                    self.hideObject(ids[index], true, animationConfig);
                }, index * delay);
            })(i);
        }
    };

    ObjectManager.prototype.showAll = function(animate, delay) {
        var ids = [];
        for (var i = 0; i < this.objects.length; i++) {
            ids.push(this.objects[i].id);
        }
        if (animate && delay) {
            this.batchShow(ids, delay);
        } else {
            for (var j = 0; j < this.objects.length; j++) {
                this.objects[j].show(animate);
            }
        }
    };

    ObjectManager.prototype.hideAll = function(animate, delay) {
        var ids = [];
        for (var i = 0; i < this.objects.length; i++) {
            ids.push(this.objects[i].id);
        }
        if (animate && delay) {
            this.batchHide(ids, delay);
        } else {
            for (var j = 0; j < this.objects.length; j++) {
                this.objects[j].hide(animate);
            }
        }
    };

    ObjectManager.prototype.showByType = function(type, animate, delay) {
        var objs = this.getObjectsByType(type);
        var ids = [];
        for (var i = 0; i < objs.length; i++) {
            ids.push(objs[i].id);
        }
        if (animate && delay) {
            this.batchShow(ids, delay);
        } else {
            for (var j = 0; j < objs.length; j++) {
                objs[j].show(animate);
            }
        }
    };

    ObjectManager.prototype.hideByType = function(type, animate, delay) {
        var objs = this.getObjectsByType(type);
        var ids = [];
        for (var i = 0; i < objs.length; i++) {
            ids.push(objs[i].id);
        }
        if (animate && delay) {
            this.batchHide(ids, delay);
        } else {
            for (var j = 0; j < objs.length; j++) {
                objs[j].hide(animate);
            }
        }
    };

    ObjectManager.prototype.renderToLayer = function(layerElement, layerId) {
        if (!layerElement) return;

        this._layerElements[layerId] = layerElement;

        for (var i = 0; i < this.objects.length; i++) {
            if (this.objects[i].layer === layerId) {
                this.objects[i].attachTo(layerElement);
            }
        }
    };

    ObjectManager.prototype.clear = function() {
        for (var i = this.objects.length - 1; i >= 0; i--) {
            this.objects[i].destroy();
        }
        this.objects = [];
    };

    ObjectManager.prototype.getCount = function() {
        return this.objects.length;
    };

    ObjectManager.prototype.addObjectsFromStage = function(stageId) {
        if (!ObjectConfig) return [];

        var stageObjects = ObjectConfig.getStageObjects(stageId);
        var added = [];

        for (var i = 0; i < stageObjects.length; i++) {
            var obj = this.addObject(stageObjects[i]);
            if (obj) {
                added.push(obj);
            }
        }

        return added;
    };

    ObjectManager.prototype.addAllObjects = function() {
        if (!ObjectConfig) return [];

        var allObjects = ObjectConfig.getAllObjects();
        var added = [];

        for (var i = 0; i < allObjects.length; i++) {
            var obj = this.addObject(allObjects[i]);
            if (obj) {
                added.push(obj);
            }
        }

        return added;
    };

    ObjectManager.prototype.attachToScene = function(scene, layerMapping) {
        if (!scene || !scene.getLayer) return false;

        layerMapping = layerMapping || {
            background: 'background',
            mid: 'mid',
            foreground: 'foreground'
        };

        for (var layerKey in layerMapping) {
            if (layerMapping.hasOwnProperty(layerKey)) {
                var layerId = layerMapping[layerKey];
                var layer = scene.getLayer(layerId);
                if (layer && layer._element) {
                    this.renderToLayer(layer._element, layerKey);
                }
            }
        }

        return true;
    };

    ObjectManager.prototype.playAnimation = function(id, animationName, options) {
        var obj = this.getObject(id);
        if (obj) {
            obj.playAnimation(animationName, options);
            return true;
        }
        return false;
    };

    ObjectManager.prototype.setObjectPosition = function(id, x, y) {
        var obj = this.getObject(id);
        if (obj) {
            obj.setPosition(x, y);
            return true;
        }
        return false;
    };

    ObjectManager.prototype.setObjectScale = function(id, scale) {
        var obj = this.getObject(id);
        if (obj) {
            obj.setScale(scale);
            return true;
        }
        return false;
    };

    ObjectManager.prototype.setObjectOpacity = function(id, opacity) {
        var obj = this.getObject(id);
        if (obj) {
            obj.setOpacity(opacity);
            return true;
        }
        return false;
    };

    return {
        ObjectManager: ObjectManager,
        create: function() {
            return new ObjectManager();
        },
        createManager: function() {
            return new ObjectManager();
        }
    };
})();
