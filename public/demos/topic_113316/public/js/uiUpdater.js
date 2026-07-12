const UIUpdater = {
    updateGPUInfo(gpu) {
        Utils.updateElementText('gpuModel', gpu.name || '未知GPU');
        Utils.updateElementText('gpuId', gpu.id || '--');
        Utils.updateElementText('pciBusId', gpu.pciBusId || '--');
        Utils.updateElementText('gpuUuid', gpu.gpuUuid || '--');
        Utils.updateElementText('driverVersion', gpu.driverVersion || '--');
        Utils.updateElementText('cudaVersion', gpu.cudaVersion || '--');
        Utils.updateElementText('perfState', gpu.performanceState || '--');
        Utils.updateElementText('persistenceMode', gpu.persistenceMode || '--');
        Utils.updateElementText('computeMode', gpu.computeMode || '--');
    },

    updateTemperature(temperature) {
        const tempText = `${temperature}°C`;
        const tempPercent = Utils.calculatePercentage(temperature, 100);
        
        Utils.updateElementText('temperature', tempText);
        Utils.updateElementText('tempCurrent', tempText);
        Utils.updateElementStyle('tempBar', 'width', `${tempPercent}%`);
        Utils.updateElementText('tempPercent', `${tempPercent.toFixed(1)}%`);
        Utils.updateElementText('tempText', `${temperature} / 100°C`);
        
        if (tempPercent > 80) {
            Utils.addElementClass('tempBar', 'high');
        } else {
            Utils.removeElementClass('tempBar', 'high');
        }
    },

    updatePower(powerUsage, powerLimit) {
        const powerPercent = Utils.calculatePercentage(powerUsage, powerLimit);
        
        Utils.updateElementText('powerUsage', `${Utils.formatNumber(powerUsage)}W`);
        Utils.updateElementText('powerLimit', `${Utils.formatNumber(powerLimit)}W`);
        Utils.updateElementText('powerCurrent', `${Utils.formatNumber(powerUsage)}W`);
        Utils.updateElementStyle('powerBar', 'width', `${powerPercent}%`);
        Utils.updateElementText('powerPercent', `${powerPercent.toFixed(1)}%`);
        Utils.updateElementText('powerText', `${Utils.formatNumber(powerUsage)} / ${Utils.formatNumber(powerLimit)}W`);
    },

    updateClocks(clockSm, clockMemory, clockGraphics, clockVideo) {
        Utils.updateElementText('clockSm', `${clockSm} MHz`);
        Utils.updateElementText('clockMemory', `${clockMemory} MHz`);
        Utils.updateElementText('clockGraphics', `${clockGraphics || 0} MHz`);
        Utils.updateElementText('clockVideo', `${clockVideo || 0} MHz`);
    },

    updateMemory(memoryUsed, memoryTotal, memoryUtilization, memReserved = 0) {
        const memPercent = Math.round(Utils.calculatePercentage(memoryUsed, memoryTotal));
        
        Utils.updateElementText('currentMem', `${memoryUsed} MB`);
        Utils.updateElementText('totalMem', `${memoryTotal} MB`);
        Utils.updateElementText('memUtil', `${memPercent}%`);
        Utils.updateElementText('memUsed', `${memoryUsed} MB`);
        Utils.updateElementStyle('memUsedBar', 'width', `${memPercent}%`);
        Utils.updateElementText('memUsedPercent', `${memPercent}%`);
        Utils.updateElementText('memUsedText', `${memoryUsed} / ${memoryTotal} MB`);
        
        // 显存预留
        Utils.updateElementText('memReserved', `${memReserved} MB`);
        const reservedPercent = Math.round(Utils.calculatePercentage(memReserved, memoryTotal));
        Utils.updateElementStyle('memReservedBar', 'width', `${reservedPercent}%`);
        Utils.updateElementText('memReservedPercent', `${reservedPercent}%`);
        Utils.updateElementText('memReservedText', `${memReserved} / ${memoryTotal} MB`);
        
        if (memPercent > Config.STATUS.HIGH_USAGE_THRESHOLD) {
            Utils.addElementClass('memUsedBar', 'high');
        } else {
            Utils.removeElementClass('memUsedBar', 'high');
        }
    },

    updateFanSpeed(fanSpeed) {
        Utils.updateElementText('fanSpeed', `${fanSpeed.toFixed(1)}%`);
    },

    updateProcessCount() {
        // 这里可以添加获取进程数的逻辑
        Utils.updateElementText('processCount', '--');
    },

    updateUtilizationStats(utilStats) {
        Utils.updateElementText('currentUtil', `${utilStats.current}%`);
        Utils.updateElementText('avgUtil', `${utilStats.avg}%`);
        Utils.updateElementText('maxUtil', `${utilStats.max}%`);
    },

    updateStatus(temperature, utilization) {
        const status = Utils.determineStatus(temperature, utilization);
        const statusInfo = Utils.getStatusInfo(status);
        
        Utils.updateElementStyle('statusDot', 'background', statusInfo.color);
        Utils.updateElementText('statusText', statusInfo.text);
        Utils.updateElementText('dataStatus', `数据状态: ${statusInfo.text}`);
    },

    updateTimeInfo(startTime, updateCount) {
        const now = new Date();
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        
        Utils.updateElementText('systemTime', Utils.formatTime(now));
        Utils.updateElementText('lastUpdate', `最后更新: ${Utils.formatTime(now)}`);
        Utils.updateElementText('uptime', `运行时间: ${Utils.formatUptime(uptime)}`);
        Utils.updateElementText('totalUpdates', `总更新次数: ${updateCount}`);
    },

    updateAll(gpu, utilStats, startTime, updateCount) {
        this.updateGPUInfo(gpu);
        this.updateTemperature(gpu.temperature);
        this.updatePower(gpu.powerUsage, gpu.powerLimit);
        this.updateClocks(gpu.clockSm, gpu.clockMemory, gpu.clockGraphics, gpu.clockVideo);
        this.updateMemory(gpu.memoryUsed, gpu.memoryTotal, gpu.memoryUtilization, gpu.memReserved);
        this.updateFanSpeed(gpu.fanSpeed || 0);
        this.updateProcessCount();
        this.updateUtilizationStats(utilStats);
        this.updateStatus(gpu.temperature, gpu.utilization);
        this.updateTimeInfo(startTime, updateCount);
    }
};
