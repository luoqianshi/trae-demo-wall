// ===== 主入口模块 =====

document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    console.log('🎯 决策体检应用初始化');
    
    Pages.init('page-container');
    
    setupEventListeners();
    setupErrorHandling();
    setupBeforeUnload();
    
    console.log('✅ 决策体检应用初始化完成');
}

function setupEventListeners() {
    window.addEventListener('popstate', function(event) {
        const state = event.state;
        if (state && state.page) {
            handleRouteChange(state.page, state);
        }
    });
    
    window.addEventListener('resize', Utils.debounce(function() {
        handleResize();
    }, 300));
    
    document.addEventListener('keydown', function(event) {
        if (Pages.getState().isDemoMode) {
            handleDemoKeydown(event);
        }
    });
}

function setupErrorHandling() {
    window.addEventListener('error', function(event) {
        console.error('❌ 应用错误:', event.error);
        showErrorNotification('应用发生错误，请刷新页面重试');
    });
    
    window.addEventListener('unhandledrejection', function(event) {
        console.error('❌ Promise错误:', event.reason);
        showErrorNotification('应用发生错误，请刷新页面重试');
    });
}

function handleRouteChange(page, state) {
    switch (page) {
        case 'home':
            Pages.renderHome();
            break;
        case 'case-list':
            Pages.renderCaseList();
            break;
        case 'external':
            if (state.caseId) {
                Pages.state.caseId = state.caseId;
                Pages.renderExternalCalibration();
            } else {
                Pages.renderCaseList();
            }
            break;
        case 'internal':
            if (state.caseId) {
                Pages.state.caseId = state.caseId;
                Pages.renderInternalAssessment();
            } else {
                Pages.renderCaseList();
            }
            break;
        case 'report':
            if (state.caseId && state.internalScores) {
                Pages.state.caseId = state.caseId;
                Pages.state.internalScores = state.internalScores;
                Pages.renderReport();
            } else {
                Pages.renderCaseList();
            }
            break;
        case 'demo-intro':
            Pages.renderDemoIntro();
            break;
        default:
            Pages.renderHome();
            break;
    }
}

function handleResize() {
    Charts.radarCharts = {};
    Charts.barCharts = {};
}

function handleDemoKeydown(event) {
    switch (event.key) {
        case ' ':
            event.preventDefault();
            if (Demo.state.isPlaying) {
                Demo.pause();
            } else {
                Demo.play();
            }
            break;
        case 'ArrowLeft':
            event.preventDefault();
            Demo.stepBackward();
            break;
        case 'ArrowRight':
            event.preventDefault();
            Demo.stepForward();
            break;
        case 'Escape':
            event.preventDefault();
            Pages.stopDemo();
            break;
    }
}

function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--accent-red);
        color: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--success);
        color: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function setupBeforeUnload() {
    window.addEventListener('beforeunload', function(event) {
        const state = Pages.getState();
        const hasUnsavedData = Object.keys(state.internalScores || {}).length > 0 ||
                             Object.keys(state.bodySignals || {}).length > 0;
        
        if (hasUnsavedData) {
            Pages.saveAssessmentData();
            
            event.preventDefault();
            event.returnValue = '您有未保存的评估数据，确定要离开吗？';
            return event.returnValue;
        }
    });
}

function navigateTo(page, state = {}) {
    const newState = { ...state, page };
    window.history.pushState(newState, '', `#${page}`);
    handleRouteChange(page, newState);
}

function validateEmail(email) {
    return Utils.isValidEmail(email);
}

function validatePhone(phone) {
    return Utils.isValidPhone(phone);
}

function validateForm(formData, rules) {
    const errors = [];
    
    Object.keys(rules).forEach(key => {
        const value = formData[key];
        const rule = rules[key];
        
        if (rule.required && Utils.isEmpty(value)) {
            errors.push(`${rule.label || key}是必填项`);
            return;
        }
        
        if (rule.email && value && !validateEmail(value)) {
            errors.push(`${rule.label || key}格式不正确`);
        }
        
        if (rule.phone && value && !validatePhone(value)) {
            errors.push(`${rule.label || key}格式不正确`);
        }
        
        if (rule.minLength && value && value.length < rule.minLength) {
            errors.push(`${rule.label || key}至少需要${rule.minLength}个字符`);
        }
        
        if (rule.maxLength && value && value.length > rule.maxLength) {
            errors.push(`${rule.label || key}最多允许${rule.maxLength}个字符`);
        }
        
        if (rule.min && value && Number(value) < rule.min) {
            errors.push(`${rule.label || key}不能小于${rule.min}`);
        }
        
        if (rule.max && value && Number(value) > rule.max) {
            errors.push(`${rule.label || key}不能大于${rule.max}`);
        }
        
        if (rule.pattern && value && !rule.pattern.test(value)) {
            errors.push(`${rule.label || key}格式不正确`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
    }
    return phone;
}

function formatDate(date) {
    return Utils.formatDate(date);
}

function getCurrentYear() {
    return new Date().getFullYear();
}

function generateRandomId(prefix = 'id') {
    return Utils.generateId(prefix);
}

function debounce(func, wait = 300) {
    return Utils.debounce(func, wait);
}

function throttle(func, limit = 1000) {
    return Utils.throttle(func, limit);
}

function deepClone(obj) {
    return Utils.deepClone(obj);
}

function sleep(ms) {
    return Utils.delay(ms);
}

function log(message, data = null) {
    if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production') {
        if (data) {
            console.log(message, data);
        } else {
            console.log(message);
        }
    }
}

function warn(message, data = null) {
    if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production') {
        if (data) {
            console.warn(message, data);
        } else {
            console.warn(message);
        }
    }
}

function error(message, data = null) {
    if (data) {
        console.error(message, data);
    } else {
        console.error(message);
    }
}

window.navigateTo = navigateTo;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.validateForm = validateForm;
window.formatPhone = formatPhone;
window.formatDate = formatDate;
window.getCurrentYear = getCurrentYear;
window.generateRandomId = generateRandomId;
window.debounce = debounce;
window.throttle = throttle;
window.deepClone = deepClone;
window.sleep = sleep;
window.log = log;
window.warn = warn;
window.error = error;