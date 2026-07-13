var StepObjectMapping = (function() {
    'use strict';

    var STEP_TO_OBJECT_MAP = {
        '1-1': ['cement_wall'],
        '1-2': ['cement_floor'],
        '1-3': ['building_materials', 'toolbox'],
        '2-1': ['blueprint'],
        '2-2': ['tape_measure'],
        '2-3': ['design_tools'],
        '2-4': ['sample_board'],
        '3-1': ['wire_pipe'],
        '3-2': ['water_pipe'],
        '3-3': ['distribution_box'],
        '3-4': ['slotting_tool'],
        '4-1': ['tiles'],
        '4-2': ['paint_bucket'],
        '4-3': ['wood_board'],
        '4-4': ['cement_bag'],
        '5-1': ['window', 'floor_lamp'],
        '5-2': ['floor'],
        '5-3': ['door'],
        '5-4': ['lamp'],
        '5-5': ['cabinet', 'nordic_sofa', 'minimal_tv_stand'],
        '6-1': ['sofa', 'carpet', 'pillow'],
        '6-2': ['table', 'dining_set'],
        '6-3': ['chair', 'sideboard'],
        '6-4': ['curtain', 'painting', 'wall_clock', 'mirror'],
        '6-5': ['plant', 'vase', 'table_lamp']
    };

    var STAGE_NAMES = {
        0: '毛坯阶段',
        1: '准备阶段',
        2: '设计阶段',
        3: '水电阶段',
        4: '泥木阶段',
        5: '安装阶段',
        6: '软装阶段'
    };

    var STAGE_DESCRIPTIONS = {
        0: '空荡荡的毛坯房，一切从零开始',
        1: '建筑材料和工具就绪，装修即将开始',
        2: '精心设计规划，描绘家的蓝图',
        3: '水电改造，隐蔽工程打好基础',
        4: '泥木施工，家的轮廓逐渐清晰',
        5: '安装进场，功能空间逐步完善',
        6: '软装饰家，温馨氛围完美呈现'
    };

    var REGION_STEP_MAPPING = {
        livingroom: {
            name: '客厅',
            stages: [1, 2, 3, 4, 5, 6],
            keyObjects: ['sofa', 'nordic_sofa', 'minimal_tv_stand', 'floor_lamp', 'carpet', 'plant', 'painting', 'wall_clock'],
            description: '家庭活动的核心空间'
        },
        bedroom: {
            name: '卧室',
            stages: [3, 4, 5, 6],
            keyObjects: ['door', 'wood_bed', 'nightstand', 'wardrobe', 'dresser', 'curtain', 'table_lamp'],
            description: '舒适的休息空间'
        },
        kitchen: {
            name: '厨房',
            stages: [3, 4, 5, 6],
            keyObjects: ['cabinet', 'integrated_cabinet', 'built_in_fridge', 'range_hood', 'table', 'dining_set', 'sideboard'],
            description: '美食诞生的地方'
        },
        study: {
            name: '书房',
            stages: [2, 4, 5, 6],
            keyObjects: ['blueprint', 'design_tools', 'table_lamp', 'bookshelf'],
            description: '安静的工作学习空间'
        },
        entryway: {
            name: '玄关',
            stages: [1, 3, 5, 6],
            keyObjects: ['cement_wall', 'door', 'shoe_cabinet', 'mirror'],
            description: '回家的第一印象'
        },
        balcony: {
            name: '阳台',
            stages: [4, 5, 6],
            keyObjects: ['window', 'plant', 'vase'],
            description: '采光充足的休闲空间'
        }
    };

    var OBJECT_TO_STEP_MAP = {};

    (function initReverseMap() {
        for (var stepKey in STEP_TO_OBJECT_MAP) {
            if (STEP_TO_OBJECT_MAP.hasOwnProperty(stepKey)) {
                var objectIds = STEP_TO_OBJECT_MAP[stepKey];
                for (var i = 0; i < objectIds.length; i++) {
                    var objId = objectIds[i];
                    if (!OBJECT_TO_STEP_MAP[objId]) {
                        OBJECT_TO_STEP_MAP[objId] = [];
                    }
                    OBJECT_TO_STEP_MAP[objId].push(stepKey);
                }
            }
        }
    })();

    function normalizeStepId(stepId) {
        if (!stepId || typeof stepId !== 'string') {
            return null;
        }
        var match = stepId.match(/^[FSH](\d+-\d+)$/);
        if (match) {
            return match[1];
        }
        if (/^\d+-\d+$/.test(stepId)) {
            return stepId;
        }
        return null;
    }

    function getModePrefix(mode) {
        mode = mode || 'full';
        if (mode === 'full') return 'F';
        if (mode === 'simple') return 'S';
        if (mode === 'hard') return 'H';
        return 'F';
    }

    function getObjectIdsForStep(stepId) {
        var normalized = normalizeStepId(stepId);
        if (!normalized) {
            return [];
        }
        var result = STEP_TO_OBJECT_MAP[normalized];
        return result ? result.slice() : [];
    }

    function getStepIdsForObject(objectId) {
        if (!objectId) {
            return [];
        }
        var result = OBJECT_TO_STEP_MAP[objectId];
        return result ? result.slice() : [];
    }

    function getStepObjectMap(mode) {
        var prefix = getModePrefix(mode);
        var result = {};
        for (var key in STEP_TO_OBJECT_MAP) {
            if (STEP_TO_OBJECT_MAP.hasOwnProperty(key)) {
                result[prefix + key] = STEP_TO_OBJECT_MAP[key];
            }
        }
        return result;
    }

    function getStageSteps(stage) {
        var stageNum = parseInt(stage);
        if (isNaN(stageNum) || stageNum < 1 || stageNum > 6) {
            return [];
        }
        var result = [];
        for (var key in STEP_TO_OBJECT_MAP) {
            if (STEP_TO_OBJECT_MAP.hasOwnProperty(key)) {
                var parts = key.split('-');
                if (parseInt(parts[0]) === stageNum) {
                    result.push(key);
                }
            }
        }
        result.sort(function(a, b) {
            var aStep = parseInt(a.split('-')[1]);
            var bStep = parseInt(b.split('-')[1]);
            return aStep - bStep;
        });
        return result;
    }

    function getTotalStepCount() {
        var count = 0;
        for (var key in STEP_TO_OBJECT_MAP) {
            if (STEP_TO_OBJECT_MAP.hasOwnProperty(key)) {
                count++;
            }
        }
        return count;
    }

    function getStageStepCount(stage) {
        return getStageSteps(stage).length;
    }

    function getAllSteps() {
        var result = [];
        for (var key in STEP_TO_OBJECT_MAP) {
            if (STEP_TO_OBJECT_MAP.hasOwnProperty(key)) {
                result.push(key);
            }
        }
        result.sort(function(a, b) {
            var aParts = a.split('-');
            var bParts = b.split('-');
            var aStage = parseInt(aParts[0]);
            var bStage = parseInt(bParts[0]);
            if (aStage !== bStage) return aStage - bStage;
            return parseInt(aParts[1]) - parseInt(bParts[1]);
        });
        return result;
    }

    function getStageName(stage) {
        var stageNum = parseInt(stage);
        return STAGE_NAMES[stageNum] || '未知阶段';
    }

    function getStageDescription(stage) {
        var stageNum = parseInt(stage);
        return STAGE_DESCRIPTIONS[stageNum] || '';
    }

    function getAllStageNames() {
        var result = [];
        for (var i = 0; i <= 6; i++) {
            result.push({ stage: i, name: STAGE_NAMES[i], description: STAGE_DESCRIPTIONS[i] });
        }
        return result;
    }

    function getRegionMapping(regionId) {
        return REGION_STEP_MAPPING[regionId] || null;
    }

    function getAllRegionMappings() {
        var result = [];
        for (var key in REGION_STEP_MAPPING) {
            if (REGION_STEP_MAPPING.hasOwnProperty(key)) {
                result.push({
                    id: key,
                    name: REGION_STEP_MAPPING[key].name,
                    description: REGION_STEP_MAPPING[key].description,
                    stages: REGION_STEP_MAPPING[key].stages,
                    keyObjects: REGION_STEP_MAPPING[key].keyObjects
                });
            }
        }
        return result;
    }

    function getRegionProgress(regionId, completedSteps) {
        var region = REGION_STEP_MAPPING[regionId];
        if (!region || !region.stages) return 0;

        var completedStages = 0;
        var totalStages = region.stages.length;

        for (var i = 0; i < region.stages.length; i++) {
            var stageNum = region.stages[i];
            var stageSteps = getStageSteps(stageNum);
            var allCompleted = true;

            for (var j = 0; j < stageSteps.length; j++) {
                var stepNorm = normalizeStepId(stageSteps[j]);
                var found = false;
                for (var k = 0; k < completedSteps.length; k++) {
                    var completedNorm = normalizeStepId(completedSteps[k]);
                    if (completedNorm === stepNorm) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    allCompleted = false;
                    break;
                }
            }

            if (allCompleted) {
                completedStages++;
            }
        }

        return totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
    }

    function getObjectsForStage(stage) {
        var stageNum = parseInt(stage);
        var stageSteps = getStageSteps(stageNum);
        var allObjects = [];

        for (var i = 0; i < stageSteps.length; i++) {
            var objects = getObjectIdsForStep(stageSteps[i]);
            for (var j = 0; j < objects.length; j++) {
                if (allObjects.indexOf(objects[j]) === -1) {
                    allObjects.push(objects[j]);
                }
            }
        }

        return allObjects;
    }

    function getObjectsUpToStage(stage) {
        var stageNum = parseInt(stage);
        var allObjects = [];

        for (var s = 1; s <= stageNum; s++) {
            var stageObjects = getObjectsForStage(s);
            for (var i = 0; i < stageObjects.length; i++) {
                if (allObjects.indexOf(stageObjects[i]) === -1) {
                    allObjects.push(stageObjects[i]);
                }
            }
        }

        return allObjects;
    }

    return {
        normalizeStepId: normalizeStepId,
        getObjectIdsForStep: getObjectIdsForStep,
        getStepIdsForObject: getStepIdsForObject,
        getStepObjectMap: getStepObjectMap,
        getStageSteps: getStageSteps,
        getTotalStepCount: getTotalStepCount,
        getStageStepCount: getStageStepCount,
        getAllSteps: getAllSteps,
        getStageName: getStageName,
        getStageDescription: getStageDescription,
        getAllStageNames: getAllStageNames,
        getRegionMapping: getRegionMapping,
        getAllRegionMappings: getAllRegionMappings,
        getRegionProgress: getRegionProgress,
        getObjectsForStage: getObjectsForStage,
        getObjectsUpToStage: getObjectsUpToStage,
        STEP_MAP: STEP_TO_OBJECT_MAP,
        OBJECT_MAP: OBJECT_TO_STEP_MAP,
        STAGE_NAMES: STAGE_NAMES,
        STAGE_DESCRIPTIONS: STAGE_DESCRIPTIONS,
        REGION_MAP: REGION_STEP_MAPPING
    };
})();
