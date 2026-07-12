const Config = {
    API: {
        BASE_URL: '',
        ENDPOINTS: {
            GPU_INFO: '/api/gpu-info',
            GPU_HISTORY: '/api/gpu-history'
        }
    },
    
    CHART: {
        MAX_DATA_POINTS: 60,
        UPDATE_MODE: 'normal',
        ANIMATION_DURATION: 800,
        ANIMATION_EASING: 'easeInOutQuart',
        LINE_TENSION: 0.6,
        BORDER_WIDTH: 2,
        POINT_RADIUS: 0,
        POINT_HOVER_RADIUS: 4,
        Y_AXIS_MAX: 100
    },
    
    COLORS: {
        UTILIZATION_LINE: '#808080',
        UTILIZATION_FILL: 'rgba(128, 128, 128, 0.1)',
        MEMORY_LINE: '#a0a0a0',
        MEMORY_FILL: 'rgba(160, 160, 160, 0.1)',
        GRID: 'rgba(37, 37, 37, 0.5)',
        AXIS: '#707070',
        TOOLTIP_BG: '#1a1a1a',
        TOOLTIP_TITLE: '#e0e0e0',
        TOOLTIP_BODY: '#a0a0a0',
        TOOLTIP_BORDER: '#404040'
    },
    
    UPDATE: {
        INTERVAL: 1000,
        RETRY_DELAY: 5000
    },
    
    STATUS: {
        HIGH_LOAD_TEMP: 85,
        HIGH_LOAD_UTIL: 95,
        MEDIUM_LOAD_TEMP: 70,
        MEDIUM_LOAD_UTIL: 80,
        HIGH_USAGE_THRESHOLD: 80
    },
    
    UI: {
        STATUS_COLORS: {
            HIGH_LOAD: '#b0b0b0',
            MEDIUM_LOAD: '#909090',
            NORMAL: '#707070'
        },
        STATUS_TEXT: {
            HIGH_LOAD: '高负载',
            MEDIUM_LOAD: '中负载',
            NORMAL: '正常'
        }
    }
};
