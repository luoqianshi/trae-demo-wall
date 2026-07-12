const App = {
    updateCount: 0,
    startTime: Date.now(),
    updateInterval: null,

    async fetchGPUData() {
        try {
            const response = await fetch(Config.API.ENDPOINTS.GPU_INFO);
            const data = await response.json();
            
            if (data.error) {
                console.error('GPU数据错误:', data.error);
                Utils.updateElementText('dataStatus', '数据状态: 错误');
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('获取GPU数据失败:', error);
            Utils.updateElementText('dataStatus', '数据状态: 连接失败');
            return null;
        }
    },

    processGPUData(gpuData) {
        if (!gpuData || gpuData.length === 0) return;

        const gpu = gpuData[0];
        const memPercent = Math.round(Utils.calculatePercentage(gpu.memoryUsed, gpu.memoryTotal));
        
        ChartManager.updateCharts(gpu.utilization, memPercent);
        
        const utilStats = Utils.calculateStats(ChartManager.getUtilizationData());
        
        UIUpdater.updateAll(gpu, utilStats, this.startTime, this.updateCount);
        
        this.updateCount++;
    },

    async update() {
        const gpuData = await this.fetchGPUData();
        if (gpuData) {
            this.processGPUData(gpuData);
        }
    },

    start() {
        ChartManager.initCharts();
        this.update();
        this.updateInterval = setInterval(() => {
            this.update();
        }, Config.UPDATE.INTERVAL);
    },

    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    App.start();
});
