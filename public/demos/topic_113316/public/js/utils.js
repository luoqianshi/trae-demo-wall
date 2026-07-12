const Utils = {
    calculateStats(data) {
        if (data.length === 0) return { current: 0, avg: 0, max: 0 };
        
        const current = data[data.length - 1];
        const sum = data.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / data.length);
        const max = Math.max(...data);
        
        return { current, avg, max };
    },

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    calculatePercentage(value, total) {
        if (total === 0) return 0;
        return Math.min((value / total) * 100, 100);
    },

    determineStatus(temperature, utilization) {
        const { HIGH_LOAD_TEMP, HIGH_LOAD_UTIL, MEDIUM_LOAD_TEMP, MEDIUM_LOAD_UTIL } = Config.STATUS;
        
        if (temperature > HIGH_LOAD_TEMP || utilization > HIGH_LOAD_UTIL) {
            return 'HIGH_LOAD';
        } else if (temperature > MEDIUM_LOAD_TEMP || utilization > MEDIUM_LOAD_UTIL) {
            return 'MEDIUM_LOAD';
        }
        return 'NORMAL';
    },

    getStatusInfo(status) {
        const { STATUS_COLORS, STATUS_TEXT } = Config.UI;
        return {
            color: STATUS_COLORS[status],
            text: STATUS_TEXT[status]
        };
    },

    formatNumber(value, decimals = 1) {
        return Number(value).toFixed(decimals);
    },

    formatTime(date = new Date()) {
        return date.toLocaleTimeString();
    },

    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with id "${id}" not found`);
        }
        return element;
    },

    updateElementText(id, text) {
        const element = this.getElement(id);
        if (element) {
            element.textContent = text;
        }
    },

    updateElementStyle(id, property, value) {
        const element = this.getElement(id);
        if (element) {
            element.style[property] = value;
        }
    },

    addElementClass(id, className) {
        const element = this.getElement(id);
        if (element) {
            element.classList.add(className);
        }
    },

    removeElementClass(id, className) {
        const element = this.getElement(id);
        if (element) {
            element.classList.remove(className);
        }
    }
};
