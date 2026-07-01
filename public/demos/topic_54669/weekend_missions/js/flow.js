'use strict';

WM.flow = {
    enterIntro: function (stageConfig) {
        WM.state.phase = 'intro';
        WM.currentStage = stageConfig;
        WM.setStageInfo('STAGE ' + (stageConfig.index + 1) + '/' + WM.STAGES.length + ' · ' + stageConfig.name);
        WM.scenes.intro.init(stageConfig);
    },

    enterWalk: function (stageConfig) {
        WM.state.phase = 'walk';
        WM.scenes.walk.init(stageConfig);
    },

    arriveDestination: function () {
        WM.state.phase = 'arrived';
        setTimeout(function () {
            WM.flow.enterTransition();
        }, 600);
    },

    enterTransition: function () {
        WM.state.phase = 'transition';
        WM.scenes.transition.init(WM.currentStage);
    },

    enterEnding: function (stageConfig) {
        WM.state.phase = 'ending';
        var endingType = stageConfig.ending.type;
        WM.currentEnding = WM.endings[endingType];
        WM.currentEnding.init(stageConfig);
    },

    onEndingComplete: function () {
        WM.flow.enterClear();
    },

    enterClear: function () {
        WM.state.phase = 'clear';
        WM.scenes.clear.init(WM.currentStage);
    },

    onClearDone: function () {
        if (WM.state.stageIndex < WM.STAGES.length - 1) {
            WM.state.stageIndex++;
            WM.currentStage = WM.STAGES[WM.state.stageIndex];
            WM.flow.enterIntro(WM.currentStage);
        } else {
            WM.state.phase = 'finale';
            WM.scenes.finale.init();
        }
    }
};
