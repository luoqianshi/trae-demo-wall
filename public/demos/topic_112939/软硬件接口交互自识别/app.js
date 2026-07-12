/* ============================================================
 * 软硬件接口交互自识别系统 v2.0
 * ============================================================
 * 模块结构:
 * 1. ThemeManager     - 主题系统 (6套主题 + 紧凑模式 + 动画开关)
 * 2. DeviceDB         - 设备数据库 (IndexedDB + localStorage + 云端同步预留)
 * 3. DeviceManager    - 设备CRUD管理 (增删改查/导入导出/搜索过滤)
 * 4. VisionRecognition - 图像识别 (拖拽上传 + AI识别模拟 + API预留)
 * 5. SelfIdentification - 自识别协议 (6步识别流程)
 * 6. DataInteraction  - 数据交互 (实时数据/设备控制)
 * 7. UIController     - UI控制 (页面切换/弹窗/Toast/渲染)
 * ============================================================ */

'use strict';

// ============================================================
//  1. 主题管理器 ThemeManager
// ============================================================
const ThemeManager = {
    themes: [
        { id: 'cyber',      name: '赛博青',  desc: '经典科技蓝青配色' },
        { id: 'deepPurple', name: '深空紫',  desc: '神秘紫色调' },
        { id: 'forest',     name: '森林绿',  desc: '自然护眼绿色' },
        { id: 'sunset',     name: '晨曦橙',  desc: '温暖橙黄配色' },
        { id: 'light',      name: '极简白',  desc: '亮色清新主题' },
        { id: 'mono',       name: '石墨灰',  desc: '黑白极简风格' }
    ],

    currentTheme: 'cyber',
    compact: false,
    animations: true,

    init() {
        const saved = localStorage.getItem('hsiid-theme') || 'cyber';
        const savedCompact = localStorage.getItem('hsiid-compact') === 'true';
        const savedAnim = localStorage.getItem('hsiid-animations') !== 'false';
        this.applyTheme(saved);
        this.setCompact(savedCompact);
        this.setAnimations(savedAnim);
        this.renderThemeGrid();
        this.bindSettings();
    },

    applyTheme(themeId) {
        document.documentElement.setAttribute('data-theme', themeId);
        this.currentTheme = themeId;
        localStorage.setItem('hsiid-theme', themeId);
        this.updateThemeActive();
    },

    setCompact(on) {
        this.compact = on;
        document.documentElement.setAttribute('data-compact', on ? 'true' : 'false');
        localStorage.setItem('hsiid-compact', on);
        const el = document.getElementById('compactMode');
        if (el) el.checked = on;
    },

    setAnimations(on) {
        this.animations = on;
        document.documentElement.setAttribute('data-animations', on ? 'true' : 'false');
        localStorage.setItem('hsiid-animations', on);
        const el = document.getElementById('animationsToggle');
        if (el) el.checked = on;
    },

    renderThemeGrid() {
        const grid = document.getElementById('themeGrid');
        if (!grid) return;
        grid.innerHTML = this.themes.map(t => `
            <div class="theme-card theme-${t.id} ${t.id === this.currentTheme ? 'active' : ''}"
                 data-theme="${t.id}" title="${t.desc}">
                <div class="theme-preview"></div>
                <div class="theme-name">${t.name}</div>
            </div>
        `).join('');
        grid.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', () => {
                this.applyTheme(card.dataset.theme);
            });
        });
    },

    updateThemeActive() {
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.toggle('active', card.dataset.theme === this.currentTheme);
        });
    },

    bindSettings() {
        document.getElementById('compactMode')?.addEventListener('change', (e) => {
            this.setCompact(e.target.checked);
        });
        document.getElementById('animationsToggle')?.addEventListener('change', (e) => {
            this.setAnimations(e.target.checked);
        });
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            const idx = this.themes.findIndex(t => t.id === this.currentTheme);
            const next = this.themes[(idx + 1) % this.themes.length];
            this.applyTheme(next.id);
        });
    }
};

// ============================================================
//  2. 设备数据库 DeviceDB (IndexedDB + localStorage 双存储)
// ============================================================
const DeviceDB = {
    DB_NAME: 'hsiid_devices_v2',
    STORE_NAME: 'devices',
    dbVersion: 1,
    db: null,
    useIndexedDB: true,

    // 内置设备数据生成器映射（函数不存入DB，运行时挂载）
    dataGenerators: {
        dht22: () => ({
            temperature: (20 + Math.random() * 15).toFixed(1),
            humidity: (40 + Math.random() * 40).toFixed(1)
        }),
        gps_module: () => ({
            lat: (39.9 + Math.random() * 0.1).toFixed(6),
            lng: (116.3 + Math.random() * 0.1).toFixed(6),
            altitude: (40 + Math.random() * 20).toFixed(1),
            satellites: Math.floor(6 + Math.random() * 6)
        }),
        gas_sensor: () => {
            const co2 = Math.floor(400 + Math.random() * 600);
            return { co2, airQuality: co2 < 600 ? 'good' : co2 < 1000 ? 'moderate' : 'poor' };
        },
        light_sensor: () => ({ illuminance: Math.floor(10 + Math.random() * 990) }),
        usb_camera: () => ({ fps: (28 + Math.random() * 4).toFixed(1), resolution: '640x480', format: 'MJPEG' }),
        mpu6050: () => ({
            accelX: (Math.random() * 2 - 1).toFixed(3),
            accelY: (Math.random() * 2 - 1).toFixed(3),
            accelZ: (0.9 + Math.random() * 0.2).toFixed(3),
            gyroX: (Math.random() * 10 - 5).toFixed(2),
            gyroY: (Math.random() * 10 - 5).toFixed(2),
            gyroZ: (Math.random() * 10 - 5).toFixed(2),
            temp: (25 + Math.random() * 5).toFixed(1)
        }),
        hc_sr04: () => ({ distance: (5 + Math.random() * 200).toFixed(1) })
    },

    // 预置设备数据（不含函数，可安全存入IndexedDB）
    defaultDevices: [
        {
            id: 'dht22', name: '温湿度传感器 DHT22', icon: '🌡️', category: '传感器',
            descriptor: {
                deviceId: 'DHT22-0x48-A1B2', deviceType: 'sensor', subType: 'temperature_humidity',
                manufacturer: 'Aosong', model: 'DHT22', interface: 'I2C',
                interfaceConfig: { address: '0x48', clockSpeed: '100kHz' },
                dataFormat: { temperature: 'float °C', humidity: 'float %' },
                sampleRate: '2Hz', power: '3.3V', version: '1.2.0'
            },
            dataDisplay: 'value-cards',
            hasGenerator: true,
            builtIn: true
        },
        {
            id: 'led_matrix', name: 'LED阵列控制器 MAX7219', icon: '💡', category: '执行器',
            descriptor: {
                deviceId: 'LED-MAX7219-001', deviceType: 'actuator', subType: 'led_matrix',
                manufacturer: 'MaximIntegrated', model: 'MAX7219', interface: 'SPI',
                interfaceConfig: { csPin: 'PA4', clockSpeed: '5MHz', mode: 0 },
                dataFormat: { ledState: '8x8 bool matrix', brightness: '0-15' },
                sampleRate: 'N/A', power: '5V', version: '2.0.1'
            },
            dataDisplay: 'led-control', hasGenerator: false, builtIn: true
        },
        {
            id: 'motor_driver', name: '直流电机驱动器 L298N', icon: '⚙️', category: '执行器',
            descriptor: {
                deviceId: 'MOTOR-L298N-003', deviceType: 'actuator', subType: 'dc_motor',
                manufacturer: 'STMicroelectronics', model: 'L298N', interface: 'PWM',
                interfaceConfig: { pwmPin: 'PA8', dirPin: 'PA9', freq: '20kHz' },
                dataFormat: { speed: '-100~100 %', direction: 'forward/reverse' },
                sampleRate: 'N/A', power: '12V', version: '1.5.0'
            },
            dataDisplay: 'motor-control', hasGenerator: false, builtIn: true
        },
        {
            id: 'gps_module', name: 'GPS定位模块 NEO-6M', icon: '🛰️', category: '通信模块',
            descriptor: {
                deviceId: 'GPS-NEO6M-002', deviceType: 'communication', subType: 'gps',
                manufacturer: 'u-blox', model: 'NEO-6M', interface: 'UART',
                interfaceConfig: { baudRate: 9600, dataBits: 8, parity: 'none' },
                dataFormat: { lat: 'float', lng: 'float', altitude: 'm', satellites: 'int' },
                sampleRate: '1Hz', power: '3.3V', version: '3.1.0'
            },
            dataDisplay: 'value-cards', hasGenerator: true, builtIn: true
        },
        {
            id: 'gas_sensor', name: '气体浓度传感器 MQ-135', icon: '🌫️', category: '传感器',
            descriptor: {
                deviceId: 'MQ135-ADC-CH2-005', deviceType: 'sensor', subType: 'gas_concentration',
                manufacturer: 'Hanwei', model: 'MQ-135', interface: 'ADC',
                interfaceConfig: { channel: 'CH2', resolution: '12-bit', refVoltage: '3.3V' },
                dataFormat: { co2: 'ppm', airQuality: 'enum' },
                sampleRate: '1Hz', power: '5V', version: '1.0.3'
            },
            dataDisplay: 'value-cards', hasGenerator: true, builtIn: true
        },
        {
            id: 'relay_module', name: '四路继电器模块', icon: '🔌', category: '执行器',
            descriptor: {
                deviceId: 'RELAY-4CH-GPIO-006', deviceType: 'actuator', subType: 'relay',
                manufacturer: 'Songle', model: 'SRD-05VDC', interface: 'GPIO',
                interfaceConfig: { pins: 'PB0-PB3', activeLow: true },
                dataFormat: { ch1: 'bool', ch2: 'bool', ch3: 'bool', ch4: 'bool' },
                sampleRate: 'N/A', power: '5V', version: '1.1.0'
            },
            dataDisplay: 'relay-control', hasGenerator: false, builtIn: true
        },
        {
            id: 'light_sensor', name: '光照强度传感器 BH1750', icon: '☀️', category: '传感器',
            descriptor: {
                deviceId: 'BH1750-0x23-B3C4', deviceType: 'sensor', subType: 'light_intensity',
                manufacturer: 'ROHM', model: 'BH1750', interface: 'I2C',
                interfaceConfig: { address: '0x23', clockSpeed: '100kHz' },
                dataFormat: { illuminance: 'lux' },
                sampleRate: '5Hz', power: '3.3V', version: '1.3.0'
            },
            dataDisplay: 'value-cards', hasGenerator: true, builtIn: true
        },
        {
            id: 'usb_camera', name: 'USB摄像头模块', icon: '📷', category: '通信模块',
            descriptor: {
                deviceId: 'USB-CAM-UVC-007', deviceType: 'communication', subType: 'camera',
                manufacturer: 'Generic', model: 'UVC-Compatible', interface: 'USB',
                interfaceConfig: { vid: '0x1B71', pid: '0x0031' },
                dataFormat: { fps: 'fps', resolution: 'string', format: 'string' },
                sampleRate: '30Hz', power: '5V USB', version: '2.4.0'
            },
            dataDisplay: 'value-cards', hasGenerator: true, builtIn: true
        },
        {
            id: 'buzzer', name: '有源蜂鸣器模块', icon: '🔊', category: '执行器',
            descriptor: {
                deviceId: 'BUZZ-001', deviceType: 'actuator', subType: 'buzzer',
                manufacturer: 'TDK', model: 'Active-Buzzer', interface: 'GPIO',
                interfaceConfig: { pin: 'PC13', activeHigh: true },
                dataFormat: { state: 'bool', frequency: 'Hz' },
                sampleRate: 'N/A', power: '3.3V', version: '1.0.0'
            },
            dataDisplay: 'buzzer-control', hasGenerator: false, builtIn: true
        },
        {
            id: 'oled_screen', name: 'OLED显示屏 SSD1306', icon: '🖥️', category: '显示模块',
            descriptor: {
                deviceId: 'OLED-SSD1306-009', deviceType: 'display', subType: 'oled',
                manufacturer: 'Solomon', model: 'SSD1306', interface: 'I2C',
                interfaceConfig: { address: '0x3C', resolution: '128x64' },
                dataFormat: { content: 'buffer', contrast: '0-255' },
                sampleRate: 'N/A', power: '3.3V', version: '1.4.0'
            },
            dataDisplay: 'oled-control', hasGenerator: false, builtIn: true
        },
        {
            id: 'mpu6050', name: '六轴姿态传感器 MPU6050', icon: '🎯', category: '传感器',
            descriptor: {
                deviceId: 'MPU6050-0x68', deviceType: 'sensor', subType: 'imu',
                manufacturer: 'TDK InvenSense', model: 'MPU-6050', interface: 'I2C',
                interfaceConfig: { address: '0x68', clockSpeed: '400kHz' },
                dataFormat: { accelX: 'g', accelY: 'g', accelZ: 'g', gyroX: '°/s', gyroY: '°/s', gyroZ: '°/s', temp: '°C' },
                sampleRate: '100Hz', power: '3.3V', version: '2.1.0'
            },
            dataDisplay: 'value-cards', hasGenerator: true, builtIn: true
        },
        {
            id: 'hc_sr04', name: '超声波测距模块 HC-SR04', icon: '📏', category: '传感器',
            descriptor: {
                deviceId: 'HC-SR04-010', deviceType: 'sensor', subType: 'distance',
                manufacturer: 'SparkFun', model: 'HC-SR04', interface: 'GPIO',
                interfaceConfig: { trigPin: 'PA0', echoPin: 'PA1', maxRange: '4m' },
                dataFormat: { distance: 'cm' },
                sampleRate: '10Hz', power: '5V', version: '1.2.0'
            },
            dataDisplay: 'value-cards', hasGenerator: true, builtIn: true
        }
    ],

    attachGenerator(device) {
        if (!device) return device;
        if (device.hasGenerator && this.dataGenerators[device.id]) {
            device.dataGenerator = this.dataGenerators[device.id];
        } else if (!device.dataGenerator) {
            device.dataGenerator = null;
        }
        return device;
    },

    attachGenerators(devices) {
        return devices.map(d => this.attachGenerator(d));
    },

    stripForStorage(device) {
        const copy = { ...device };
        delete copy.dataGenerator;
        return copy;
    },

    async init() {
        try {
            await this.openDB();
            await this.ensureDefaultData();
            this.useIndexedDB = true;
            const storageEl = document.getElementById('storageType');
            if (storageEl) storageEl.textContent = 'IndexedDB (本地)';
        } catch (e) {
            console.warn('IndexedDB不可用，降级到localStorage:', e);
            this.useIndexedDB = false;
            this.ensureLocalStorageData();
            const storageEl = document.getElementById('storageType');
            if (storageEl) storageEl.textContent = 'localStorage (兼容模式)';
        }
    },

    openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.DB_NAME, this.dbVersion);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                    store.createIndex('category', 'category', { unique: false });
                    store.createIndex('interface', 'descriptor.interface', { unique: false });
                }
            };
            req.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };
            req.onerror = () => reject(req.error);
        });
    },

    async ensureDefaultData() {
        const count = await this.count();
        if (count === 0) {
            for (const dev of this.defaultDevices) {
                await this.add(dev);
            }
            console.log(`已初始化 ${this.defaultDevices.length} 个预置设备`);
        }
    },

    ensureLocalStorageData() {
        const stored = localStorage.getItem('hsiid_devices');
        if (!stored) {
            const map = {};
            this.defaultDevices.forEach(d => map[d.id] = d);
            localStorage.setItem('hsiid_devices', JSON.stringify(map));
        }
    },

    async getAll() {
        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(this.STORE_NAME, 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.getAll();
                req.onsuccess = () => resolve(this.attachGenerators(req.result));
                req.onerror = () => reject(req.error);
            });
        } else {
            const stored = JSON.parse(localStorage.getItem('hsiid_devices') || '{}');
            return this.attachGenerators(Object.values(stored));
        }
    },

    async getById(id) {
        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(this.STORE_NAME, 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.get(id);
                req.onsuccess = () => resolve(this.attachGenerator(req.result));
                req.onerror = () => reject(req.error);
            });
        } else {
            const stored = JSON.parse(localStorage.getItem('hsiid_devices') || '{}');
            return this.attachGenerator(stored[id] || null);
        }
    },

    async add(device) {
        const storable = this.stripForStorage(device);
        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.add(storable);
                req.onsuccess = () => resolve(device);
                req.onerror = () => reject(req.error);
            });
        } else {
            const stored = JSON.parse(localStorage.getItem('hsiid_devices') || '{}');
            stored[device.id] = storable;
            localStorage.setItem('hsiid_devices', JSON.stringify(stored));
            return device;
        }
    },

    async update(device) {
        const storable = this.stripForStorage(device);
        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.put(storable);
                req.onsuccess = () => resolve(device);
                req.onerror = () => reject(req.error);
            });
        } else {
            const stored = JSON.parse(localStorage.getItem('hsiid_devices') || '{}');
            stored[device.id] = storable;
            localStorage.setItem('hsiid_devices', JSON.stringify(stored));
            return device;
        }
    },

    async delete(id) {
        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.delete(id);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        } else {
            const stored = JSON.parse(localStorage.getItem('hsiid_devices') || '{}');
            delete stored[id];
            localStorage.setItem('hsiid_devices', JSON.stringify(stored));
        }
    },

    async count() {
        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(this.STORE_NAME, 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.count();
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        } else {
            const stored = JSON.parse(localStorage.getItem('hsiid_devices') || '{}');
            return Object.keys(stored).length;
        }
    },

    async exportData() {
        const devices = await this.getAll();
        return JSON.stringify(devices, null, 2);
    },

    async importData(jsonStr) {
        const devices = JSON.parse(jsonStr);
        if (!Array.isArray(devices)) throw new Error('格式错误：应为设备数组');
        let count = 0;
        for (const dev of devices) {
            if (dev.id && dev.name) {
                await this.update(dev);
                count++;
            }
        }
        return count;
    },

    async syncCloud(url) {
        // 预留云端同步接口
        console.log('云端同步（预留接口）:', url);
        return { success: true, message: '云端同步功能待配置' };
    },

    // 搜索
    async search(keyword) {
        const all = await this.getAll();
        if (!keyword) return all;
        const kw = keyword.toLowerCase();
        return all.filter(d =>
            d.name.toLowerCase().includes(kw) ||
            d.category.toLowerCase().includes(kw) ||
            d.descriptor?.model?.toLowerCase().includes(kw) ||
            d.descriptor?.manufacturer?.toLowerCase().includes(kw) ||
            d.descriptor?.interface?.toLowerCase().includes(kw) ||
            d.descriptor?.deviceType?.toLowerCase().includes(kw)
        );
    },

    async filterBy(category, iface) {
        const all = await this.getAll();
        return all.filter(d => {
            if (category && category !== 'all' && d.category !== category) return false;
            if (iface && iface !== 'all' && d.descriptor?.interface !== iface) return false;
            return true;
        });
    }
};

// ============================================================
//  3. 软件驱动库
// ============================================================
const DRIVERS = {
    'sensor.temperature_humidity': { name: 'temp_humidity_driver', version: 'v1.2.0', targetDevice: '温湿度传感器', capabilities: ['read_temperature', 'read_humidity', 'set_sample_rate'] },
    'actuator.led_matrix': { name: 'max7219_led_driver', version: 'v2.0.1', targetDevice: 'LED阵列控制器', capabilities: ['set_pixel', 'set_brightness', 'display_pattern', 'clear'] },
    'actuator.dc_motor': { name: 'l298n_motor_driver', version: 'v1.5.0', targetDevice: '直流电机驱动器', capabilities: ['set_speed', 'set_direction', 'brake', 'stop'] },
    'communication.gps': { name: 'nmea_gps_driver', version: 'v3.1.0', targetDevice: 'GPS定位模块', capabilities: ['parse_nmea', 'get_position', 'get_satellites'] },
    'sensor.gas_concentration': { name: 'mq135_gas_driver', version: 'v1.0.3', targetDevice: '气体浓度传感器', capabilities: ['read_ppm', 'calibrate', 'get_air_quality'] },
    'actuator.relay': { name: 'gpio_relay_driver', version: 'v1.1.0', targetDevice: '继电器模块', capabilities: ['set_channel', 'get_status', 'all_off', 'all_on'] },
    'sensor.light_intensity': { name: 'bh1750_light_driver', version: 'v1.3.0', targetDevice: '光照强度传感器', capabilities: ['read_lux', 'set_mode', 'continuous_read'] },
    'communication.camera': { name: 'uvc_camera_driver', version: 'v2.4.0', targetDevice: 'USB摄像头', capabilities: ['capture_frame', 'set_resolution', 'set_fps'] },
    'actuator.buzzer': { name: 'buzzer_driver', version: 'v1.0.0', targetDevice: '蜂鸣器', capabilities: ['beep', 'set_frequency', 'mute'] },
    'display.oled': { name: 'ssd1306_oled_driver', version: 'v1.4.0', targetDevice: 'OLED显示屏', capabilities: ['draw_text', 'draw_bitmap', 'set_contrast'] },
    'sensor.imu': { name: 'mpu6050_imu_driver', version: 'v2.1.0', targetDevice: 'IMU姿态传感器', capabilities: ['read_accel', 'read_gyro', 'read_temp', 'calibrate'] },
    'sensor.distance': { name: 'hcsr04_distance_driver', version: 'v1.2.0', targetDevice: '超声波测距', capabilities: ['read_distance', 'set_range'] }
};

// ============================================================
//  4. 全局状态
// ============================================================
const AppState = {
    connectedDevices: new Map(),
    activeDeviceId: null,
    dataLogEnabled: true,
    visionCount: 0,
    cloudSyncEnabled: false,
    logLevel: 'all'
};

// ============================================================
//  5. 图像识别模块 VisionRecognition
// ============================================================
const VisionRecognition = {
    currentImage: null,
    apiUrl: '',

    init() {
        this.bindUpload();
        const savedUrl = localStorage.getItem('hsiid-vision-api');
        if (savedUrl) {
            this.apiUrl = savedUrl;
            document.getElementById('visionApiUrl').value = savedUrl;
        }
        document.getElementById('visionApiUrl')?.addEventListener('change', (e) => {
            this.apiUrl = e.target.value;
            localStorage.setItem('hsiid-vision-api', e.target.value);
        });
    },

    bindUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const preview = document.getElementById('uploadPreview');
        const previewImg = document.getElementById('previewImage');

        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFile(e.target.files[0]));

        // 拖拽上传
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handleFile(e.dataTransfer.files[0]);
            }
        });

        document.getElementById('reUploadBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.resetUpload();
        });

        document.getElementById('identifyBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.recognize();
        });
    },

    handleFile(file) {
        if (!file.type.startsWith('image/')) {
            UIController.toast('请上传图片文件', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            UIController.toast('图片大小不能超过10MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = e.target.result;
            document.getElementById('previewImage').src = this.currentImage;
            document.getElementById('uploadArea').style.display = 'none';
            document.getElementById('uploadPreview').style.display = 'flex';
        };
        reader.readAsDataURL(file);
    },

    resetUpload() {
        this.currentImage = null;
        document.getElementById('fileInput').value = '';
        document.getElementById('previewImage').src = '';
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('uploadPreview').style.display = 'none';
        this.clearResult();
    },

    clearResult() {
        const body = document.getElementById('visionResultBody');
        const badge = document.getElementById('resultBadge');
        badge.textContent = '待识别';
        badge.className = 'badge badge-gray';
        body.innerHTML = `
            <div class="detail-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                </svg>
                <p>上传图片后开始识别</p>
            </div>
        `;
    },

    async recognize() {
        if (!this.currentImage) {
            UIController.toast('请先上传图片', 'warn');
            return;
        }

        const badge = document.getElementById('resultBadge');
        const body = document.getElementById('visionResultBody');
        badge.textContent = '识别中';
        badge.className = 'badge badge-warn';
        body.innerHTML = `
            <div class="identifying-state">
                <div class="identifying-spinner"></div>
                <p style="color:var(--text-secondary);">AI正在分析图片中的硬件设备...</p>
            </div>
        `;

        AppState.visionCount++;
        UIController.updateStats();
        UIController.log('info', `[图像识别] 开始分析图片...`);

        // 如果配置了真实API，调用真实接口
        if (this.apiUrl) {
            try {
                await this.callRealAPI();
                return;
            } catch (e) {
                UIController.log('warn', `[图像识别] API调用失败，使用本地模拟: ${e.message}`);
            }
        }

        // 本地模拟识别
        await this.simulateRecognition();
    },

    async callRealAPI() {
        const formData = new FormData();
        formData.append('image', this.currentImage);
        const res = await fetch(this.apiUrl, { method: 'POST', body: formData });
        if (!res.ok) throw new Error('API请求失败');
        const data = await res.json();
        this.renderResult(data.matches || []);
    },

    async simulateRecognition() {
        await sleep(1500);

        const allDevices = await DeviceDB.getAll();
        // 随机选择3-5个设备作为"识别结果"
        const shuffled = [...allDevices].sort(() => Math.random() - 0.5);
        const count = Math.min(3 + Math.floor(Math.random() * 3), shuffled.length);
        const matches = shuffled.slice(0, count).map((dev, i) => ({
            device: dev,
            confidence: (95 - i * 8 - Math.random() * 5).toFixed(1)
        })).sort((a, b) => b.confidence - a.confidence);

        this.renderResult(matches);
        UIController.log('success', `[图像识别] 完成，识别出 ${matches.length} 个候选设备`);

        // 记录历史
        if (typeof HistoryManager !== 'undefined' && matches.length > 0) {
            HistoryManager.addRecord(
                'vision',
                `图像识别: ${matches[0].device.name}`,
                `识别到 ${matches.length} 个候选设备，最佳匹配置信度 ${matches[0].confidence}%`,
                'success',
                { topMatch: matches[0].device.name, count: matches.length }
            );
        }
    },

    renderResult(matches) {
        const badge = document.getElementById('resultBadge');
        const body = document.getElementById('visionResultBody');
        badge.textContent = `识别到 ${matches.length} 个候选`;
        badge.className = 'badge badge-green';

        if (matches.length === 0) {
            body.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px 0;">未识别到相关硬件设备</p>`;
            return;
        }

        let html = `<div class="result-card">
            <div class="result-card-title">🎯 最佳匹配</div>
            <div class="match-item top" onclick="VisionRecognition.selectDevice('${matches[0].device.id}')">
                <div class="match-icon">${matches[0].device.icon}</div>
                <div class="match-info">
                    <div class="match-name">${matches[0].device.name}</div>
                    <div class="match-meta">${matches[0].device.category} · ${matches[0].device.descriptor.interface} · ${matches[0].device.descriptor.model}</div>
                    <div class="confidence-bar"><div class="confidence-fill" style="width:${matches[0].confidence}%"></div></div>
                </div>
                <div class="match-confidence">${matches[0].confidence}%</div>
            </div>
        </div>`;

        if (matches.length > 1) {
            html += `<div class="result-card">
                <div class="result-card-title">📋 其他候选</div>
                <div class="match-list">`;
            for (let i = 1; i < matches.length; i++) {
                const m = matches[i];
                html += `
                    <div class="match-item" onclick="VisionRecognition.selectDevice('${m.device.id}')">
                        <div class="match-icon">${m.device.icon}</div>
                        <div class="match-info">
                            <div class="match-name">${m.device.name}</div>
                            <div class="match-meta">${m.device.descriptor.interface} · ${m.device.descriptor.model}</div>
                            <div class="confidence-bar"><div class="confidence-fill" style="width:${m.confidence}%"></div></div>
                        </div>
                        <div class="match-confidence">${m.confidence}%</div>
                    </div>
                `;
            }
            html += `</div></div>`;
        }

        html += `<div class="result-card" style="margin-bottom:0;">
            <div class="result-card-title">📡 识别详情</div>
            <table class="desc-table">
                <tr><th>识别方式</th><td>${this.apiUrl ? '云端AI API' : '本地特征匹配（模拟）'}</td></tr>
                <tr><th>候选数量</th><td>${matches.length}</td></tr>
                <tr><th>最高置信度</th><td>${matches[0].confidence}%</td></tr>
                <tr><th>处理耗时</th><td>~1.5s</td></tr>
            </table>
        </div>`;

        body.innerHTML = html;
    },

    selectDevice(deviceId) {
        UIController.log('info', `[图像识别] 选择设备: ${deviceId}，跳转到设备库`);
        // 切换到控制台并连接该设备
        UIController.switchTab('dashboard');
        DeviceDB.getById(deviceId).then(device => {
            if (device) {
                SelfIdentification.connectDevice(device);
                UIController.toast(`已连接 ${device.name}`, 'success');
            }
        });
    }
};

// ============================================================
//  6. 自识别协议 SelfIdentification
// ============================================================
const SelfIdentification = {
    steps: ['接入检测', '读取描述符', '接口识别', '类型识别', '驱动加载', '通道建立'],

    async connectDevice(device) {
        if (AppState.connectedDevices.has(device.id)) {
            UIController.toast('设备已连接', 'warn');
            return;
        }

        UIController.log('info', `══════ 设备连接请求: ${device.name} ══════`);

        // 渲染总线项
        const busItem = UIController.renderBusDevice(device, 'identifying');
        const stepPills = busItem.querySelectorAll('.step-pill');

        let driver = null;
        for (let i = 0; i < this.steps.length; i++) {
            stepPills[i]?.classList.add('active');
            UIController.log('info', `▶ 步骤 ${i + 1}/${this.steps.length}: ${this.steps[i]}`);

            switch (i) {
                case 0: await sleep(200);
                    UIController.log('info', `物理连接建立: ${device.descriptor.interface} 接口`); break;
                case 1: await sleep(300);
                    UIController.log('info', `设备描述符: ${device.descriptor.deviceId}`); break;
                case 2: await sleep(250);
                    const cfg = JSON.stringify(device.descriptor.interfaceConfig).replace(/[{}"]/g, '');
                    UIController.log('success', `接口协议: ${device.descriptor.interface} { ${cfg} }`); break;
                case 3: await sleep(250);
                    UIController.log('info', `设备类型: ${device.descriptor.deviceType}/${device.descriptor.subType} | ${device.descriptor.manufacturer} ${device.descriptor.model}`); break;
                case 4:
                    driver = this.matchDriver(device);
                    await sleep(350);
                    if (driver) {
                        UIController.log('success', `驱动匹配: ${driver.name} ${driver.version}`);
                        UIController.log('success', `驱动加载完成，能力: ${driver.capabilities.join(', ')}`);
                    } else {
                        UIController.log('error', `未找到匹配驱动，使用通用驱动`);
                        driver = { name: 'generic_driver', version: 'v1.0.0', targetDevice: '通用设备', capabilities: ['basic_io'] };
                    }
                    break;
                case 5: await sleep(300);
                    UIController.log('success', `数据通道建立，设备就绪 ✓`); break;
            }

            stepPills[i]?.classList.remove('active');
            stepPills[i]?.classList.add('done');
        }

        // 更新状态
        busItem.classList.remove('identifying');
        busItem.classList.add('identified');
        const statusEl = busItem.querySelector('.bus-device-status');
        if (statusEl) statusEl.innerHTML = `<span class="flow-dot" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--success);margin-right:6px;animation:flow-blink 1s infinite;"></span>运行中 · ${device.descriptor.interface}`;

        // 存储连接信息
        const connInfo = {
            device: device,
            driver: driver,
            status: 'active',
            latestData: null,
            dataHistory: [],
            dataInterval: null,
            controlState: {}
        };
        AppState.connectedDevices.set(device.id, connInfo);

        // 启动数据交互
        this.startDataInteraction(device.id, connInfo);

        // 默认选中第一个连接的设备
        if (!AppState.activeDeviceId) {
            AppState.activeDeviceId = device.id;
        }

        UIController.updateStats();
        UIController.toast(`${device.name} 自识别完成`, 'success');

        // 记录历史
        if (typeof HistoryManager !== 'undefined') {
            HistoryManager.addRecord(
                'connect',
                device.name,
                `接口: ${device.descriptor.interface} · 型号: ${device.descriptor.model}`,
                'success',
                { deviceId: device.id }
            );
        }
    },

    matchDriver(device) {
        const key = `${device.descriptor.deviceType}.${device.descriptor.subType}`;
        return DRIVERS[key] || null;
    },

    disconnectDevice(deviceId) {
        const info = AppState.connectedDevices.get(deviceId);
        if (!info) return;

        if (info.dataInterval) clearInterval(info.dataInterval);
        AppState.connectedDevices.delete(deviceId);

        const busItem = document.getElementById(`bus-${deviceId}`);
        if (busItem) {
            busItem.style.transition = 'all 0.3s ease';
            busItem.style.opacity = '0';
            busItem.style.transform = 'translateX(30px)';
            setTimeout(() => busItem.remove(), 300);
        }

        UIController.log('warn', `设备已断开: ${info.device.name}`);

        if (AppState.activeDeviceId === deviceId) {
            AppState.activeDeviceId = AppState.connectedDevices.size > 0
                ? AppState.connectedDevices.keys().next().value
                : null;
            UIController.renderDetail();
        }

        UIController.updateStats();
        UIController.updateBusEmpty();
    },

    disconnectAll() {
        Array.from(AppState.connectedDevices.keys()).forEach(id => this.disconnectDevice(id));
        UIController.toast('已断开所有设备', 'info');
    },

    async autoConnectAll() {
        const all = await DeviceDB.getAll();
        for (const dev of all) {
            if (!AppState.connectedDevices.has(dev.id)) {
                await this.connectDevice(dev);
                await sleep(200);
            }
        }
        UIController.toast('所有设备自识别完成', 'success');
    },

    startDataInteraction(deviceId, connInfo) {
        const device = connInfo.device;
        if (!device.dataGenerator || typeof device.dataGenerator !== 'function') {
            return;
        }

        const rateMatch = device.descriptor.sampleRate?.match(/(\d+)Hz/);
        const interval = rateMatch ? Math.max(100, 1000 / parseInt(rateMatch[1])) : 1000;

        const tick = () => {
            const data = device.dataGenerator();
            connInfo.latestData = data;
            connInfo.dataHistory.push(data);
            if (connInfo.dataHistory.length > 30) connInfo.dataHistory.shift();

            if (AppState.dataLogEnabled) {
                const dataStr = Object.entries(data).slice(0, 3).map(([k, v]) => `${k}=${v}`).join(', ');
                UIController.log('data', `[${device.name}] ← ${dataStr}${Object.keys(data).length > 3 ? ' ...' : ''}`);
            }

            if (AppState.activeDeviceId === deviceId) {
                UIController.updateDetailData(connInfo);
            }
        };

        tick();
        connInfo.dataInterval = setInterval(tick, interval);
    }
};

// ============================================================
//  7. UI 控制器
// ============================================================
const UIController = {
    currentTab: 'dashboard',

    deviceView: 'grid',

    init() {
        this.bindTabs();
        this.bindButtons();
        this.bindGlobalSearch();
        this.bindDeviceLibrary();
        this.bindDeviceManagement();
        this.bindLog();
        this.bindModal();
        ThemeManager.init();
        this.updateStats();
    },

    // --- 页面切换 ---
    bindTabs() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
    },

    switchTab(tabId) {
        this.currentTab = tabId;
        document.querySelectorAll('.nav-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabId);
        });
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${tabId}`);
        });

        if (tabId === 'devices') this.refreshDeviceLibrary();
    },

    // --- 按钮绑定 ---
    bindButtons() {
        document.getElementById('autoConnectBtn')?.addEventListener('click', () => {
            SelfIdentification.autoConnectAll();
        });
        document.getElementById('disconnectAllBtn')?.addEventListener('click', () => {
            SelfIdentification.disconnectAll();
        });
        document.getElementById('clearLogBtn')?.addEventListener('click', () => {
            this.clearLog();
        });
        document.getElementById('resetDataBtn')?.addEventListener('click', () => {
            if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
                localStorage.clear();
                location.reload();
            }
        });
    },

    // --- 全局搜索 ---
    bindGlobalSearch() {
        const input = document.getElementById('globalSearch');
        let debounceTimer;
        input?.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const kw = e.target.value.trim();
                if (this.currentTab === 'devices') {
                    this.refreshDeviceLibrary(kw);
                } else {
                    this.switchTab('devices');
                    setTimeout(() => this.refreshDeviceLibrary(kw), 100);
                }
            }, 200);
        });

        // 快捷键
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                input?.focus();
            }
        });
    },

    // --- 设备库（合并浏览与管理）---
    async getFilteredDevices(keyword = '') {
        const catFilter = document.getElementById('categoryFilter')?.value || 'all';
        const ifFilter = document.getElementById('interfaceFilter')?.value || 'all';
        const searchKw = keyword || document.getElementById('deviceSearch')?.value || '';

        let devices = await DeviceDB.filterBy(catFilter, ifFilter);
        if (searchKw) {
            const kw = searchKw.toLowerCase();
            devices = devices.filter(d =>
                d.name.toLowerCase().includes(kw) ||
                d.descriptor?.model?.toLowerCase().includes(kw) ||
                d.descriptor?.manufacturer?.toLowerCase().includes(kw)
            );
        }
        return devices;
    },

    async refreshDeviceLibrary(keyword = '') {
        const devices = await this.getFilteredDevices(keyword);

        const countEl = document.getElementById('deviceCount');
        if (countEl) countEl.textContent = devices.length;

        if (this.deviceView === 'grid') {
            this.renderDeviceGrid(devices);
        } else {
            this.renderDeviceTable(devices);
        }
    },

    renderDeviceGrid(devices) {
        const grid = document.getElementById('deviceGrid');
        if (!grid) return;

        if (devices.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">
                <p style="margin-bottom:8px;">🔍 未找到匹配的设备</p>
                <p style="font-size:12px;">试试其他关键词，或点击上方"添加设备"</p>
            </div>`;
            return;
        }

        grid.innerHTML = devices.map(d => {
            const ifLower = (d.descriptor?.interface || '').toLowerCase();
            const connected = AppState.connectedDevices.has(d.id);
            return `
            <div class="device-card ${connected ? 'connected' : ''}" data-id="${d.id}">
                <div class="device-card-icon">${d.icon}</div>
                <div class="device-card-name">${d.name}</div>
                <div class="device-card-meta">
                    <span class="badge badge-if-${ifLower}">${d.descriptor?.interface || '-'}</span>
                    <span class="badge">${d.category}</span>
                </div>
                <div class="device-card-desc">${d.descriptor?.manufacturer || '-'} · ${d.descriptor?.model || '-'} · v${d.descriptor?.version || '1.0'}</div>
                <div class="device-card-actions">
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); UIController.connectDeviceFromLibrary('${d.id}')">
                        <span>🔌</span> 连接
                    </button>
                    <button class="btn btn-sm" onclick="event.stopPropagation(); UIController.editDevice('${d.id}')">
                        <span>✏️</span> 编辑
                    </button>
                </div>
            </div>
        `;
        }).join('');

        grid.querySelectorAll('.device-card').forEach(card => {
            card.addEventListener('click', async () => {
                const device = await DeviceDB.getById(card.dataset.id);
                if (device && !AppState.connectedDevices.has(device.id)) {
                    this.connectDeviceFromLibrary(card.dataset.id);
                }
            });
        });
    },

    async connectDeviceFromLibrary(id) {
        const device = await DeviceDB.getById(id);
        if (!device) return;
        if (AppState.connectedDevices.has(device.id)) {
            this.toast('设备已连接', 'info');
            return;
        }
        this.switchTab('dashboard');
        setTimeout(() => SelfIdentification.connectDevice(device), 150);
    },

    renderDeviceTable(devices) {
        const tbody = document.getElementById('deviceTableBody');
        if (!tbody) return;

        if (devices.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">暂无设备数据</td></tr>`;
            return;
        }

        tbody.innerHTML = devices.map(d => {
            const ifLower = (d.descriptor?.interface || '').toLowerCase();
            const isCloud = d.source === 'cloud';
            return `
            <tr>
                <td style="font-size:20px;">${d.icon}</td>
                <td><strong>${d.name}</strong>${d.builtIn ? ' <span class="badge">内置</span>' : ''}</td>
                <td style="font-family:monospace;">${d.descriptor?.model || '-'}</td>
                <td>${d.descriptor?.manufacturer || '-'}</td>
                <td><span class="badge">${d.category}</span></td>
                <td><span class="badge badge-if-${ifLower}">${d.descriptor?.interface || '-'}</span></td>
                <td style="font-family:monospace;font-size:12px;">${d.descriptor?.version || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-primary" onclick="UIController.connectDeviceFromLibrary('${d.id}')">连接</button>
                        <button class="btn btn-sm" onclick="UIController.editDevice('${d.id}')">编辑</button>
                        <button class="btn btn-sm btn-danger" onclick="UIController.deleteDevice('${d.id}')">删除</button>
                    </div>
                </td>
            </tr>
        `}).join('');
    },

    switchDeviceView(view) {
        this.deviceView = view;
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        document.querySelectorAll('.device-view').forEach(el => {
            el.classList.toggle('active', el.id === 'deviceView' + view.charAt(0).toUpperCase() + view.slice(1));
        });
        this.refreshDeviceLibrary();
    },

    bindDeviceLibrary() {
        document.getElementById('categoryFilter')?.addEventListener('change', () => this.refreshDeviceLibrary());
        document.getElementById('interfaceFilter')?.addEventListener('change', () => this.refreshDeviceLibrary());
        document.getElementById('deviceSearch')?.addEventListener('input', (e) => {
            clearTimeout(this._searchTimer);
            this._searchTimer = setTimeout(() => this.refreshDeviceLibrary(), 200);
        });
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchDeviceView(btn.dataset.view));
        });
    },

    // --- 设备管理操作 ---
    bindDeviceManagement() {
        document.getElementById('addDeviceBtn')?.addEventListener('click', () => this.showAddDeviceModal());
        document.getElementById('importDeviceBtn')?.addEventListener('click', () => this.importDevices());
        document.getElementById('exportDeviceBtn')?.addEventListener('click', () => this.exportDevices());

        document.getElementById('batchGenBtn')?.addEventListener('click', async () => {
            const countStr = prompt('请输入要生成的设备数量（建议10-500）：', '100');
            if (!countStr) return;
            const count = parseInt(countStr);
            if (isNaN(count) || count <= 0 || count > 5000) {
                this.toast('请输入有效的数量（1-5000）', 'error');
                return;
            }
            this.toast(`正在生成 ${count} 个设备...`, 'info');
            const added = await DatabaseManager.generateBatchDevices(count);
            this.toast(`成功生成 ${added} 个设备`, 'success');
            this.refreshDeviceLibrary();
        });

        document.getElementById('cloudSyncBtn')?.addEventListener('click', () => {
            this.showCloudSyncModal();
        });
    },

    showCloudSyncModal() {
        const modal = document.getElementById('modalOverlay');
        document.getElementById('modalTitle').textContent = '云端数据库同步';
        document.getElementById('modalBody').innerHTML = `
            <div style="padding:8px 0;">
                <div style="margin-bottom:20px;">
                    <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">同步状态</div>
                    <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-tertiary);border-radius:8px;">
                        <span style="font-size:24px;">☁️</span>
                        <div>
                            <div style="font-weight:500;">${DatabaseManager.lastSyncTime ? '已同步' : '从未同步'}</div>
                            <div style="font-size:12px;color:var(--text-muted);">${DatabaseManager.formatLastSync()}</div>
                        </div>
                    </div>
                </div>
                <div style="margin-bottom:20px;">
                    <label class="form-label">云端同步地址</label>
                    <input class="form-input" id="cloudSyncUrl" value="${DatabaseManager.syncUrl}" placeholder="https://api.example.com/devices/sync">
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">配置后可从云端拉取最新设备数据库</div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;text-align:center;">
                        <div style="font-size:24px;margin-bottom:4px;">📊</div>
                        <div style="font-weight:500;font-size:14px;">本地设备</div>
                        <div style="font-size:20px;font-weight:600;color:var(--accent);" id="syncLocalCount">-</div>
                    </div>
                    <div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;text-align:center;">
                        <div style="font-size:24px;margin-bottom:4px;">☁️</div>
                        <div style="font-weight:500;font-size:14px;">云端设备</div>
                        <div style="font-size:20px;font-weight:600;color:var(--purple);" id="syncCloudCount">-</div>
                    </div>
                </div>
                <div style="background:var(--accent-light);border:1px solid rgba(6,182,212,0.3);border-radius:8px;padding:12px;font-size:12px;color:var(--text-secondary);">
                    💡 <strong>Demo模式：</strong>点击"模拟同步"可模拟从云端拉取一批新设备
                </div>
            </div>
        `;
        document.getElementById('modalFooter').innerHTML = `
            <button class="btn btn-ghost" onclick="UIController.closeModal()">关闭</button>
            <button class="btn btn-outline" onclick="UIController.simulateCloudSync()">🎭 模拟同步</button>
            <button class="btn btn-primary" onclick="UIController.doCloudSync()">🔄 开始同步</button>
        `;
        modal.classList.add('active');

        DeviceDB.count().then(n => {
            const el = document.getElementById('syncLocalCount');
            if (el) el.textContent = n;
        });
        setTimeout(() => {
            const el = document.getElementById('syncCloudCount');
            if (el) el.textContent = Math.floor(Math.random() * 500) + 1000;
        }, 300);
    },

    async doCloudSync() {
        const url = document.getElementById('cloudSyncUrl')?.value?.trim();
        if (url) {
            DatabaseManager.syncUrl = url;
            DatabaseManager.saveConfig();
        }
        this.toast('正在同步云端数据库...', 'info');
        this.closeModal();
        const result = await DatabaseManager.syncFromCloud();
        if (result.success) {
            this.toast(`同步成功：新增 ${result.added}，更新 ${result.updated}`, 'success');
        } else {
            this.toast('同步失败：' + result.message, 'error');
        }
        this.refreshDeviceLibrary();
    },

    simulateCloudSync() {
        const url = document.getElementById('cloudSyncUrl')?.value?.trim();
        if (url) {
            DatabaseManager.syncUrl = url;
            DatabaseManager.saveConfig();
        }
        this.closeModal();
        this.toast('正在从云端同步设备数据...', 'info');
        DatabaseManager.simulateCloudSync();
        setTimeout(() => {
            this.refreshDeviceLibrary();
            this.toast('云端同步完成！已添加新设备', 'success');
        }, 2200);
    },

    showAddDeviceModal() {
        const modal = document.getElementById('modalOverlay');
        document.getElementById('modalTitle').textContent = '添加新设备';
        document.getElementById('modalBody').innerHTML = this.getDeviceFormHTML();
        document.getElementById('modalFooter').innerHTML = `
            <button class="btn btn-ghost" onclick="UIController.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="UIController.saveNewDevice()">保存</button>
        `;
        modal.classList.add('active');
    },

    async editDevice(id) {
        const device = await DeviceDB.getById(id);
        if (!device) return;
        const modal = document.getElementById('modalOverlay');
        document.getElementById('modalTitle').textContent = `编辑设备: ${device.name}`;
        document.getElementById('modalBody').innerHTML = this.getDeviceFormHTML(device);
        document.getElementById('modalFooter').innerHTML = `
            <button class="btn btn-ghost" onclick="UIController.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="UIController.saveEditDevice('${id}')">保存修改</button>
        `;
        modal.classList.add('active');
    },

    getDeviceFormHTML(device = {}) {
        const d = device.descriptor || {};
        return `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">设备ID</label>
                    <input class="form-input" id="f-id" value="${device.id || ''}" placeholder="如: my_sensor_01">
                </div>
                <div class="form-group">
                    <label class="form-label">设备名称</label>
                    <input class="form-input" id="f-name" value="${device.name || ''}" placeholder="如: 温湿度传感器">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">图标 (Emoji)</label>
                    <input class="form-input" id="f-icon" value="${device.icon || '📦'}" placeholder="如: 🌡️">
                </div>
                <div class="form-group">
                    <label class="form-label">分类</label>
                    <select class="form-input" id="f-category">
                        <option value="传感器" ${device.category === '传感器' ? 'selected' : ''}>传感器</option>
                        <option value="执行器" ${device.category === '执行器' ? 'selected' : ''}>执行器</option>
                        <option value="通信模块" ${device.category === '通信模块' ? 'selected' : ''}>通信模块</option>
                        <option value="显示模块" ${device.category === '显示模块' ? 'selected' : ''}>显示模块</option>
                        <option value="其他" ${device.category === '其他' ? 'selected' : ''}>其他</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">制造商</label>
                    <input class="form-input" id="f-manu" value="${d.manufacturer || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">型号</label>
                    <input class="form-input" id="f-model" value="${d.model || ''}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">接口类型</label>
                    <select class="form-input" id="f-interface">
                        ${['I2C','SPI','UART','GPIO','PWM','ADC','USB','I2S','CAN'].map(i =>
                            `<option value="${i}" ${d.interface === i ? 'selected' : ''}>${i}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">设备类型</label>
                    <select class="form-input" id="f-deviceType">
                        <option value="sensor" ${d.deviceType === 'sensor' ? 'selected' : ''}>sensor (传感器)</option>
                        <option value="actuator" ${d.deviceType === 'actuator' ? 'selected' : ''}>actuator (执行器)</option>
                        <option value="communication" ${d.deviceType === 'communication' ? 'selected' : ''}>communication (通信)</option>
                        <option value="display" ${d.deviceType === 'display' ? 'selected' : ''}>display (显示)</option>
                        <option value="other" ${d.deviceType === 'other' ? 'selected' : ''}>other (其他)</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">接口配置 (JSON)</label>
                <textarea class="form-input" id="f-ifConfig" rows="3">${JSON.stringify(d.interfaceConfig || {}, null, 2)}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">数据格式 (JSON)</label>
                <textarea class="form-input" id="f-dataFormat" rows="3">${JSON.stringify(d.dataFormat || {}, null, 2)}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">采样率</label>
                    <input class="form-input" id="f-sampleRate" value="${d.sampleRate || '1Hz'}">
                </div>
                <div class="form-group">
                    <label class="form-label">供电</label>
                    <input class="form-input" id="f-power" value="${d.power || '3.3V'}">
                </div>
            </div>
        `;
    },

    collectFormData() {
        const id = document.getElementById('f-id').value.trim();
        const name = document.getElementById('f-name').value.trim();
        if (!id || !name) {
            this.toast('设备ID和名称不能为空', 'error');
            return null;
        }
        try {
            var ifConfig = JSON.parse(document.getElementById('f-ifConfig').value || '{}');
            var dataFormat = JSON.parse(document.getElementById('f-dataFormat').value || '{}');
        } catch (e) {
            this.toast('JSON格式错误', 'error');
            return null;
        }
        return {
            id,
            name,
            icon: document.getElementById('f-icon').value || '📦',
            category: document.getElementById('f-category').value,
            descriptor: {
                deviceId: id.toUpperCase(),
                deviceType: document.getElementById('f-deviceType').value,
                subType: 'custom',
                manufacturer: document.getElementById('f-manu').value || 'Custom',
                model: document.getElementById('f-model').value || 'Custom',
                interface: document.getElementById('f-interface').value,
                interfaceConfig: ifConfig,
                dataFormat: dataFormat,
                sampleRate: document.getElementById('f-sampleRate').value || '1Hz',
                power: document.getElementById('f-power').value || '3.3V',
                version: '1.0.0'
            },
            dataDisplay: 'value-cards',
            hasGenerator: false,
            builtIn: false
        };
    },

    async saveNewDevice() {
        const data = this.collectFormData();
        if (!data) return;
        try {
            await DeviceDB.add(data);
            this.closeModal();
            this.refreshDeviceLibrary();
            this.toast('设备添加成功', 'success');
        } catch (e) {
            this.toast('添加失败: ' + e.message, 'error');
        }
    },

    async saveEditDevice(id) {
        const data = this.collectFormData();
        if (!data) return;
        const old = await DeviceDB.getById(id);
        if (old) {
            data.builtIn = old.builtIn;
            data.hasGenerator = old.hasGenerator;
            data.dataDisplay = old.dataDisplay;
        }
        try {
            await DeviceDB.update(data);
            this.closeModal();
            this.refreshDeviceLibrary();
            this.toast('设备更新成功', 'success');
        } catch (e) {
            this.toast('更新失败: ' + e.message, 'error');
        }
    },

    async deleteDevice(id) {
        if (!confirm('确定删除此设备吗？')) return;
        try {
            if (AppState.connectedDevices.has(id)) {
                SelfIdentification.disconnectDevice(id);
            }
            await DeviceDB.delete(id);
            this.refreshDeviceLibrary();
            this.toast('设备已删除', 'success');
        } catch (e) {
            this.toast('删除失败: ' + e.message, 'error');
        }
    },

    async exportDevices() {
        const data = await DeviceDB.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devices_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.toast('导出成功', 'success');
    },

    importDevices() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const count = await DeviceDB.importData(ev.target.result);
                    this.refreshDeviceLibrary();
                    this.toast(`成功导入 ${count} 个设备`, 'success');
                } catch (err) {
                    this.toast('导入失败: ' + err.message, 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    // --- 总线渲染 ---
    renderBusDevice(device, status) {
        const desc = device.descriptor;
        const ifCfg = Object.entries(desc.interfaceConfig || {})
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(',') : v}`).slice(0, 2).join(' | ');

        const el = document.createElement('div');
        el.className = `bus-device ${status}`;
        el.id = `bus-${device.id}`;
        el.innerHTML = `
            <div class="bus-device-header">
                <div class="bus-device-icon">${device.icon}</div>
                <div class="bus-device-info">
                    <div class="bus-device-name">${device.name}</div>
                    <div class="bus-device-status">正在自识别...</div>
                </div>
                <div class="bus-device-actions">
                    <button class="btn btn-sm" onclick="UIController.showDescriptor('${device.id}');event.stopPropagation();">详情</button>
                    <button class="btn btn-sm btn-danger" onclick="SelfIdentification.disconnectDevice('${device.id}');event.stopPropagation();">断开</button>
                </div>
            </div>
            <div class="identify-steps">
                ${SelfIdentification.steps.map((s, i) => `<span class="step-pill">${i + 1}.${s}</span>`).join('')}
            </div>
            <div class="descriptor-mini">
                <span class="d-label">DeviceID</span><span>${desc.deviceId}</span>
                <span class="d-label">Interface</span><span>${desc.interface} { ${ifCfg} }</span>
                <span class="d-label">Type</span><span>${desc.deviceType} / ${desc.subType}</span>
            </div>
        `;

        el.addEventListener('click', () => {
            AppState.activeDeviceId = device.id;
            document.querySelectorAll('.bus-device').forEach(b => b.classList.remove('active'));
            el.classList.add('active');
            this.renderDetail();
        });

        document.getElementById('busDevices').appendChild(el);
        document.getElementById('busEmpty').style.display = 'none';
        document.getElementById('busCount').textContent = AppState.connectedDevices.size + 1;

        return el;
    },

    updateBusEmpty() {
        const empty = document.getElementById('busEmpty');
        const count = AppState.connectedDevices.size;
        empty.style.display = count === 0 ? 'flex' : 'none';
        document.getElementById('busCount').textContent = count;
    },

    // --- 详情面板 ---
    renderDetail() {
        const body = document.getElementById('detailBody');
        const title = document.getElementById('detailTitle');
        const hint = document.getElementById('detailHint');

        if (!AppState.activeDeviceId || !AppState.connectedDevices.has(AppState.activeDeviceId)) {
            title.textContent = '数据详情';
            hint.textContent = '选择设备查看';
            body.innerHTML = `
                <div class="detail-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                        <path d="M3 3v18h18"/><path d="M18 9l-5 5-3-3-5 5"/>
                    </svg>
                    <p>选择一个已连接的设备查看实时数据</p>
                </div>
            `;
            return;
        }

        const info = AppState.connectedDevices.get(AppState.activeDeviceId);
        const device = info.device;
        title.textContent = device.name;
        hint.textContent = `${device.descriptor.interface} · ${device.descriptor.model}`;

        // 高亮对应总线项
        document.querySelectorAll('.bus-device').forEach(b => {
            b.classList.toggle('active', b.id === `bus-${device.id}`);
        });

        // 根据显示类型渲染
        let dataHtml = '';
        if (device.dataDisplay === 'value-cards') {
            dataHtml = this.getValueCardsHtml(info);
        } else if (device.dataDisplay === 'led-control') {
            dataHtml = '<div class="control-panel"><p style="text-align:center;color:var(--text-muted);">LED控制界面</p></div>';
        } else if (device.dataDisplay === 'motor-control') {
            dataHtml = '<div class="control-panel"><p style="text-align:center;color:var(--text-muted);">电机控制界面</p></div>';
        } else if (device.dataDisplay === 'relay-control') {
            dataHtml = '<div class="control-panel"><p style="text-align:center;color:var(--text-muted);">继电器控制界面</p></div>';
        } else if (device.dataDisplay === 'buzzer-control') {
            dataHtml = '<div class="control-panel"><p style="text-align:center;color:var(--text-muted);">蜂鸣器控制界面</p></div>';
        } else if (device.dataDisplay === 'oled-control') {
            dataHtml = '<div class="control-panel"><p style="text-align:center;color:var(--text-muted);">OLED控制界面</p></div>';
        } else {
            dataHtml = this.getValueCardsHtml(info);
        }

        const recommendHtml = SoftwareRecommend.renderHtml(device);

        body.innerHTML = dataHtml + '<div style="margin-top:20px;"></div>' + recommendHtml;

        if (device.dataDisplay === 'value-cards' || !device.dataGenerator) {
            this.drawChart(info);
        }
    },

    getValueCardsHtml(info) {
        const device = info.device;
        const data = info.latestData || {};
        const keys = Object.keys(device.descriptor.dataFormat || {});

        let html = '<div class="data-value-grid">';
        keys.forEach(key => {
            const val = data[key] !== undefined ? data[key] : '--';
            const fmt = device.descriptor.dataFormat[key] || '';
            const unitMatch = fmt.match(/[\d\s]*([a-zA-Z°%]+)/);
            const unit = unitMatch ? unitMatch[1] : '';
            html += `
                <div class="data-value-item">
                    <div class="dv-label">${key}</div>
                    <div class="dv-value" data-key="${key}">${val}</div>
                    <div class="dv-unit">${unit}</div>
                </div>
            `;
        });
        html += '</div>';
        html += '<canvas class="mini-chart" id="detailChart"></canvas>';
        return html;
    },

    updateDetailData(info) {
        if (!info || !info.latestData) return;
        const container = document.getElementById('detailBody');
        const device = info.device;

        if (device.dataDisplay === 'value-cards' || !device.dataGenerator) {
            Object.entries(info.latestData).forEach(([key, val]) => {
                const el = container.querySelector(`.dv-value[data-key="${key}"]`);
                if (el) el.textContent = val;
            });
            const chart = document.getElementById('detailChart');
            if (chart) this.drawChart(info);
        }
    },

    drawChart(info) {
        const canvas = document.getElementById('detailChart');
        if (!canvas || !info.dataHistory || info.dataHistory.length < 2) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth || 400;
        canvas.height = 100;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const firstKey = Object.keys(info.device.descriptor.dataFormat || {})[0];
        if (!firstKey) return;

        const values = info.dataHistory.map(d => parseFloat(d[firstKey])).filter(v => !isNaN(v));
        if (values.length < 2) return;

        const max = Math.max(...values);
        const min = Math.min(...values);
        const range = max - min || 1;

        // 网格线
        ctx.strokeStyle = 'var(--border)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 3; i++) {
            const y = 10 + (i / 3) * (canvas.height - 20);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // 折线
        // 获取CSS变量颜色
        const styles = getComputedStyle(document.documentElement);
        const accent = styles.getPropertyValue('--accent').trim() || '#06b6d4';

        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        values.forEach((v, i) => {
            const x = (i / (values.length - 1)) * canvas.width;
            const y = canvas.height - 10 - ((v - min) / range) * (canvas.height - 20);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // 填充区域
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, accent + '40');
        gradient.addColorStop(1, accent + '05');
        ctx.fillStyle = gradient;
        ctx.fill();
    },

    renderLedControl(container, info) {
        const state = info.controlState;
        if (!state.leds) state.leds = Array(8).fill(false);
        if (!state.brightness) state.brightness = 8;

        container.innerHTML = `
            <div class="control-section">
                <div class="control-section-title">💡 LED 控制 (8通道)</div>
                <div class="control-grid">
                    ${state.leds.map((on, i) => `
                        <div class="control-item">
                            <div class="led-indicator ${on ? 'on' : ''}" id="led-${i}"></div>
                            <div class="ci-label">D${i}</div>
                            <button class="btn btn-sm" onclick="UIController.toggleLed(${i})">${on ? 'ON' : 'OFF'}</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="control-section">
                <div class="control-section-title">🔆 亮度调节</div>
                <input type="range" min="0" max="15" value="${state.brightness}" oninput="UIController.setBrightness(this.value)">
                <div style="text-align:right;font-family:monospace;color:var(--accent);font-size:12px;margin-top:4px;">${state.brightness} / 15</div>
            </div>
            <div class="control-section">
                <button class="btn btn-ghost" onclick="UIController.ledAll(true)" style="width:100%;">全部点亮</button>
                <button class="btn btn-ghost" onclick="UIController.ledAll(false)" style="width:100%;margin-top:8px;">全部熄灭</button>
            </div>
        `;
    },

    toggleLed(i) {
        const info = AppState.connectedDevices.get(AppState.activeDeviceId);
        if (!info) return;
        info.controlState.leds[i] = !info.controlState.leds[i];
        const led = document.getElementById(`led-${i}`);
        const btn = led.nextElementSibling.nextElementSibling;
        led.classList.toggle('on');
        btn.textContent = info.controlState.leds[i] ? 'ON' : 'OFF';
        this.log('data', `[${info.device.name}] → LED[${i}] = ${info.controlState.leds[i] ? 'ON' : 'OFF'}`);
    },

    setBrightness(val) {
        const info = AppState.connectedDevices.get(AppState.activeDeviceId);
        if (!info) return;
        info.controlState.brightness = parseInt(val);
        this.log('data', `[${info.device.name}] → brightness = ${val}`);
    },

    ledAll(on) {
        const info = AppState.connectedDevices.get(AppState.activeDeviceId);
        if (!info) return;
        info.controlState.leds = info.controlState.leds.map(() => on);
        this.renderDetail();
        this.log('data', `[${info.device.name}] → ALL LED = ${on ? 'ON' : 'OFF'}`);
    },

    renderMotorControl(container, info) {
        const state = info.controlState;
        if (state.speed === undefined) state.speed = 0;
        if (!state.direction) state.direction = 'forward';

        container.innerHTML = `
            <div class="control-section">
                <div class="control-section-title">⚙️ 电机状态</div>
                <div class="data-value-grid">
                    <div class="data-value-item">
                        <div class="dv-label">转速</div>
                        <div class="dv-value">${state.speed}</div>
                        <div class="dv-unit">%</div>
                    </div>
                    <div class="data-value-item">
                        <div class="dv-label">方向</div>
                        <div class="dv-value" style="font-size:16px;">${state.direction === 'forward' ? '⬆ 正转' : '⬇ 反转'}</div>
                    </div>
                </div>
            </div>
            <div class="control-section">
                <div class="control-section-title">🎚️ 转速控制</div>
                <input type="range" min="-100" max="100" value="${state.speed}" oninput="UIController.setMotorSpeed(this.value)">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-top:4px;">
                    <span>-100%</span><span>0</span><span>+100%</span>
                </div>
            </div>
            <div class="control-section">
                <div class="control-section-title">🔀 方向控制</div>
                <button class="btn ${state.direction === 'forward' ? 'btn-primary' : 'btn-ghost'}" onclick="UIController.setMotorDir('forward')" style="width:48%;">⬆ 正转</button>
                <button class="btn ${state.direction === 'reverse' ? 'btn-primary' : 'btn-ghost'}" onclick="UIController.setMotorDir('reverse')" style="width:48%;margin-left:4%;">⬇ 反转</button>
            </div>
            <div class="control-section">
                <button class="btn btn-warn" onclick="UIController.setMotorSpeed(0)" style="width:100%;">紧急停止</button>
            </div>
        `;
    },

    setMotorSpeed(val) {
        const info = AppState.connectedDevices.get(AppState.activeDeviceId);
        if (!info) return;
        info.controlState.speed = parseInt(val);
        this.renderDetail();
        this.log('data', `[${info.device.name}] → speed = ${val}%`);
    },

    setMotorDir(dir) {
        const info = AppState.connectedDevices.get(AppState.activeDeviceId);
        if (!info) return;
        info.controlState.direction = dir;
        this.renderDetail();
        this.log('data', `[${info.device.name}] → direction = ${dir}`);
    },

    renderRelayControl(container, info) {
        const state = info.controlState;
        if (!state.channels) state.channels = [false, false, false, false];

        container.innerHTML = `
            <div class="control-section">
                <div class="control-section-title">🔌 继电器控制 (4通道)</div>
                <div class="control-grid">
                    ${state.channels.map((on, i) => `
                        <div class="control-item">
                            <div class="led-indicator ${on ? 'on' : ''}" id="relay-${i}"></div>
                            <div class="ci-label">CH${i + 1}</div>
                            <button class="btn btn-sm" onclick="UIController.toggleRelay(${i})">${on ? 'ON' : 'OFF'}</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="control-section">
                <button class="btn btn-ghost" onclick="UIController.relayAll(true)" style="width:100%;">全部吸合</button>
                <button class="btn btn-ghost" onclick="UIController.relayAll(false)" style="width:100%;margin-top:8px;">全部释放</button>
            </div>
        `;
    },

    toggleRelay(i) {
        const info = AppState.connectedDevices.get(AppState.activeDeviceId);
        if (!info) return;
        info.controlState.channels[i] = !info.controlState.channels[i];
        this.renderDetail();
        this.log('data', `[${info.device.name}] → CH${i + 1} = ${info.controlState.channels[i] ? 'ON' : 'OFF'}`);
    },

    relayAll(on) {
        const info = AppState.connectedDevices.get(AppState.activeDeviceId);
        if (!info) return;
        info.controlState.channels = info.controlState.channels.map(() => on);
        this.renderDetail();
        this.log('data', `[${info.device.name}] → ALL = ${on ? 'ON' : 'OFF'}`);
    },

    renderBuzzerControl(container, info) {
        const state = info.controlState;
        if (state.beeping === undefined) state.beeping = false;
        if (!state.frequency) state.frequency = 2000;

        container.innerHTML = `
            <div class="control-section">
                <div class="control-section-title">🔊 蜂鸣器</div>
                <button class="btn ${state.beeping ? 'btn-warn' : 'btn-primary'}" style="width:100%;padding:16px;" onclick="UIController.toggleBuzzer()">
                    ${state.beeping ? '🔇 停止鸣叫' : '🔔 开始鸣叫'}
                </button>
            </div>
            <div class="control-section">
                <div class="control-section-title">🎵 频率: ${state.frequency} Hz</div>
                <input type="range" min="200" max="5000" step="100" value="${state.frequency}" oninput="UIController.setBuzzerFreq(this.value)">
            </div>
        `;
    },

    toggleBuzzer() {
        const info = AppState.connectedDevices.get(AppState.activeDeviceId);
        if (!info) return;
        info.controlState.beeping = !info.controlState.beeping;
        this.renderDetail();
        this.log('data', `[${info.device.name}] → beep = ${info.controlState.beeping ? 'ON' : 'OFF'}`);
    },

    setBuzzerFreq(val) {
        const info = AppState.connectedDevices.get(AppState.activeDeviceId);
        if (!info) return;
        info.controlState.frequency = parseInt(val);
        this.renderDetail();
    },

    renderOledControl(container, info) {
        const state = info.controlState;
        if (!state.text) state.text = 'HSI·ID System';
        if (!state.contrast) state.contrast = 128;

        container.innerHTML = `
            <div class="control-section">
                <div class="control-section-title">📺 OLED 显示内容</div>
                <input class="form-input" value="${state.text}" oninput="UIController.setOledText(this.value)">
            </div>
            <div class="control-section">
                <div class="control-section-title">🔆 对比度: ${state.contrast}</div>
                <input type="range" min="0" max="255" value="${state.contrast}" oninput="UIController.setOledContrast(this.value)">
            </div>
            <div class="control-section">
                <div style="background:#000;border-radius:8px;padding:16px;text-align:center;">
                    <div style="color:#0f0;font-family:monospace;font-size:16px;letter-spacing:1px;">${state.text}</div>
                </div>
            </div>
        `;
    },

    setOledText(val) {
        const info = AppState.connectedDevices.get(AppState.activeDeviceId);
        if (!info) return;
        info.controlState.text = val;
        this.renderDetail();
    },

    setOledContrast(val) {
        const info = AppState.connectedDevices.get(AppState.activeDeviceId);
        if (!info) return;
        info.controlState.contrast = parseInt(val);
        this.renderDetail();
    },

    // --- 描述符弹窗 ---
    async showDescriptor(deviceId) {
        const device = await DeviceDB.getById(deviceId);
        if (!device) return;
        const d = device.descriptor;
        const conn = AppState.connectedDevices.get(deviceId);

        document.getElementById('modalTitle').textContent = `${device.icon} ${device.name} - 设备描述符`;
        document.getElementById('modalBody').innerHTML = `
            <table class="desc-table">
                <tr><th>设备ID</th><td>${d.deviceId}</td></tr>
                <tr><th>设备类型</th><td>${d.deviceType} / ${d.subType}</td></tr>
                <tr><th>分类</th><td>${device.category}</td></tr>
                <tr><th>制造商</th><td>${d.manufacturer}</td></tr>
                <tr><th>型号</th><td>${d.model}</td></tr>
                <tr><th>固件版本</th><td>${d.version}</td></tr>
                <tr><th>接口协议</th><td>${d.interface}</td></tr>
                <tr><th>接口配置</th><td><pre style="margin:0;white-space:pre-wrap;">${JSON.stringify(d.interfaceConfig, null, 2)}</pre></td></tr>
                <tr><th>数据格式</th><td><pre style="margin:0;white-space:pre-wrap;">${JSON.stringify(d.dataFormat, null, 2)}</pre></td></tr>
                <tr><th>采样率</th><td>${d.sampleRate}</td></tr>
                <tr><th>供电</th><td>${d.power}</td></tr>
                ${conn ? `
                <tr><th>匹配驱动</th><td>${conn.driver.name} ${conn.driver.version}</td></tr>
                <tr><th>驱动能力</th><td>${conn.driver.capabilities.join(', ')}</td></tr>
                ` : ''}
                <tr><th>内置设备</th><td>${device.builtIn ? '是' : '否（用户添加）'}</td></tr>
            </table>
        `;
        document.getElementById('modalFooter').innerHTML = `
            <button class="btn btn-ghost" onclick="UIController.closeModal()">关闭</button>
            ${!AppState.connectedDevices.has(deviceId) ? `<button class="btn btn-primary" onclick="UIController.connectFromModal('${deviceId}')">连接设备</button>` : ''}
        `;
        document.getElementById('modalOverlay').classList.add('active');
    },

    async connectFromModal(deviceId) {
        const device = await DeviceDB.getById(deviceId);
        if (device) {
            this.closeModal();
            SelfIdentification.connectDevice(device);
        }
    },

    // --- 弹窗系统 ---
    bindModal() {
        document.getElementById('modalClose')?.addEventListener('click', () => this.closeModal());
        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') this.closeModal();
        });
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
    },

    // --- 日志系统 ---
    log(level, message) {
        if (level === 'data' && !AppState.dataLogEnabled) return;
        if (AppState.logLevel !== 'all' && level !== AppState.logLevel) return;

        const container = document.getElementById('logContainer');
        if (!container) return;
        const empty = container.querySelector('.log-empty');
        if (empty) empty.remove();

        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        entry.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="log-level ${level}">${level.toUpperCase()}</span>
            <span class="log-message">${message}</span>
        `;
        container.appendChild(entry);

        // 限制日志条数
        if (container.children.length > 500) {
            container.removeChild(container.firstChild);
        }

        if (document.getElementById('autoScroll')?.checked) {
            container.scrollTop = container.scrollHeight;
        }
    },

    clearLog() {
        const container = document.getElementById('logContainer');
        container.innerHTML = '<div class="log-empty">日志已清空</div>';
    },

    bindLog() {
        document.getElementById('logLevelFilter')?.addEventListener('change', (e) => {
            AppState.logLevel = e.target.value;
        });
        document.getElementById('dataLogToggle')?.addEventListener('change', (e) => {
            AppState.dataLogEnabled = e.target.checked;
            localStorage.setItem('hsiid-datalog', e.target.checked);
        });
        const saved = localStorage.getItem('hsiid-datalog');
        if (saved !== null) {
            AppState.dataLogEnabled = saved === 'true';
            document.getElementById('dataLogToggle').checked = AppState.dataLogEnabled;
        }
    },

    // --- Toast 通知 ---
    toast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // --- 统计更新 ---
    async updateStats() {
        const total = await DeviceDB.count();
        document.getElementById('statTotal').textContent = total;
        document.getElementById('statConnected').textContent = AppState.connectedDevices.size;
        document.getElementById('statDrivers').textContent = AppState.connectedDevices.size;
        document.getElementById('statIdentified').textContent = AppState.visionCount;
    }
};

// ============================================================
//  8. 工具函数
// ============================================================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
//  8. 自动硬件扫描 AutoScanner
// ============================================================
const AutoScanner = {
    enabled: false,
    scanInterval: null,
    scanPeriodMs: 8000,
    detectedQueue: [],
    isScanning: false,

    init() {
        const toggle = document.getElementById('autoScanToggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                this.setEnabled(e.target.checked);
            });
        }
        const saved = localStorage.getItem('hsiid-autoscan') === 'true';
        if (saved && toggle) {
            toggle.checked = true;
            this.setEnabled(true);
        }
    },

    setEnabled(on) {
        this.enabled = on;
        localStorage.setItem('hsiid-autoscan', on);
        if (on) {
            this.startScanning();
            UIController.log('info', '[自动扫描] 已启用，将定期检测新接入的硬件设备');
            UIController.toast('自动扫描已启用', 'success');
        } else {
            this.stopScanning();
            UIController.log('info', '[自动扫描] 已停止');
        }
    },

    startScanning() {
        if (this.scanInterval) return;
        this.scanInterval = setInterval(() => {
            if (!this.isScanning) {
                this.scanOnce();
            }
        }, this.scanPeriodMs);
    },

    stopScanning() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
    },

    async scanOnce() {
        if (this.isScanning) return;
        this.isScanning = true;

        try {
            const allDevices = await DeviceDB.getAll();
            const connectedIds = new Set(AppState.connectedDevices.keys());
            const unconnected = allDevices.filter(d => !connectedIds.has(d.id) && d.builtIn);

            if (unconnected.length > 0 && Math.random() < 0.3) {
                const picked = unconnected[Math.floor(Math.random() * unconnected.length)];
                if (!AppState.connectedDevices.has(picked.id)) {
                    UIController.log('info', `[自动扫描] 检测到新设备接入: ${picked.name}`);
                    UIController.toast(`检测到新设备: ${picked.name}`, 'info');
                    await SelfIdentification.connectDevice(picked);
                }
            }
        } catch (e) {
            console.warn('扫描出错:', e);
        } finally {
            this.isScanning = false;
        }
    }
};

// ============================================================
//  9. 问题诊断系统 DiagnosticEngine
// ============================================================
const DiagnosticEngine = {
    knownIssues: [
        {
            id: 'ERR_001',
            name: '设备连接超时',
            category: 'connection',
            severity: 'warn',
            causes: [
                '硬件设备未正确连接到接口总线',
                '接口地址/引脚配置错误',
                '设备供电不足或电源未接通',
                '线缆接触不良或损坏'
            ],
            solutions: [
                '检查硬件设备物理连接是否牢固',
                '确认设备电源指示灯是否亮起',
                '在设备详情中核对接口地址配置',
                '尝试更换数据线或杜邦线',
                '重启设备后重新扫描'
            ],
            relatedDocs: ['faq', 'troubleshoot']
        },
        {
            id: 'ERR_002',
            name: '驱动加载失败',
            category: 'driver',
            severity: 'error',
            causes: [
                '设备描述符与驱动不匹配',
                '设备类型不在支持列表中',
                '驱动版本过低'
            ],
            solutions: [
                '确认设备型号是否在支持列表中',
                '手动添加设备并配置正确的描述符',
                '更新驱动库到最新版本',
                '联系技术支持获取定制驱动'
            ],
            relatedDocs: ['devices']
        },
        {
            id: 'ERR_003',
            name: '数据读取异常',
            category: 'data',
            severity: 'warn',
            causes: [
                '设备采样率设置过高',
                '总线通信干扰严重',
                '设备缓存溢出'
            ],
            solutions: [
                '降低设备采样频率',
                '检查周边是否有电磁干扰源',
                '重启设备清空缓存',
                '使用屏蔽线缆减少干扰'
            ],
            relatedDocs: ['troubleshoot']
        },
        {
            id: 'ERR_004',
            name: 'IndexedDB存储不可用',
            category: 'storage',
            severity: 'warn',
            causes: [
                '浏览器隐私模式限制了IndexedDB',
                '存储空间不足',
                '浏览器版本过低'
            ],
            solutions: [
                '关闭浏览器隐私/无痕模式',
                '清理浏览器缓存释放空间',
                '升级到最新版本的现代浏览器',
                '系统将自动降级到localStorage模式'
            ],
            relatedDocs: ['faq']
        },
        {
            id: 'ERR_005',
            name: '云端同步失败',
            category: 'cloud',
            severity: 'warn',
            causes: [
                '云端API地址配置错误',
                '网络连接不稳定',
                'API认证令牌失效'
            ],
            solutions: [
                '检查云端同步地址是否正确',
                '确认网络连接正常',
                '检查API密钥是否有效',
                '稍后重试或联系管理员'
            ],
            relatedDocs: ['api', 'faq']
        },
        {
            id: 'ERR_006',
            name: '图像识别无结果',
            category: 'vision',
            severity: 'info',
            causes: [
                '图片清晰度不足，设备特征不明显',
                '拍摄角度或光线不佳',
                '设备型号不在识别库中'
            ],
            solutions: [
                '确保图片清晰、光线充足',
                '从多个角度拍摄设备',
                '手动在设备库中搜索添加',
                '将设备照片提交以扩充识别库'
            ],
            relatedDocs: ['vision']
        }
    ],

    activeDiagnostics: [],

    getIssueById(id) {
        return this.knownIssues.find(i => i.id === id);
    },

    detectIssues() {
        const issues = [];
        if (!DeviceDB.useIndexedDB) {
            issues.push(this.getIssueById('ERR_004'));
        }
        return issues;
    },

    showIssueModal(issueId, context) {
        const issue = this.getIssueById(issueId);
        if (!issue) return;

        const severityColor = {
            error: 'var(--error-color)',
            warn: 'var(--warn-color)',
            info: 'var(--info-color)'
        }[issue.severity] || 'var(--accent)';

        const html = `
            <div class="diagnostic-modal">
                <div class="error-card" style="border-left-color: ${severityColor}">
                    <div class="error-icon" style="background: ${severityColor}20; color: ${severityColor}">
                        ${issue.severity === 'error' ? '✕' : issue.severity === 'warn' ? '⚠' : 'ℹ'}
                    </div>
                    <div class="error-info">
                        <div class="error-code">${issue.id}</div>
                        <div class="error-title">${issue.name}</div>
                        ${context ? `<div class="error-context">${context}</div>` : ''}
                    </div>
                </div>

                <div class="diag-section">
                    <h4>🔍 可能原因</h4>
                    <ul class="cause-list">
                        ${issue.causes.map(c => `<li>${c}</li>`).join('')}
                    </ul>
                </div>

                <div class="diag-section">
                    <h4>✅ 解决方案</h4>
                    <ol class="solution-steps">
                        ${issue.solutions.map((s, i) => `
                            <li class="solution-step">
                                <span class="step-num">${i + 1}</span>
                                <span class="step-text">${s}</span>
                            </li>
                        `).join('')}
                    </ol>
                </div>

                <div class="diag-section diag-help-links">
                    <span>相关文档：</span>
                    ${issue.relatedDocs.map(doc => {
                        const names = { faq: '常见问题', troubleshoot: '故障排查', devices: '设备管理', vision: '图像识别', api: '开放接口' };
                        return `<a href="javascript:void(0)" class="help-link" data-section="${doc}">${names[doc] || doc}</a>`;
                    }).join('')}
                </div>
            </div>
        `;

        UIController.showModal('问题诊断', html, `
            <button class="btn btn-ghost" onclick="UIController.closeModal()">关闭</button>
            <button class="btn btn-primary" onclick="DiagnosticEngine.runDiagnostic('${issue.id}'); UIController.closeModal();">自动诊断</button>
        `);

        setTimeout(() => {
            document.querySelectorAll('.help-link').forEach(link => {
                link.addEventListener('click', () => {
                    UIController.closeModal();
                    UIController.switchTab('help');
                    HelpCenter.showSection(link.dataset.section);
                });
            });
        }, 10);
    },

    runDiagnostic(issueId) {
        UIController.log('info', `[诊断] 开始诊断问题: ${issueId}`);
        UIController.toast('正在运行诊断...', 'info');

        setTimeout(() => {
            UIController.log('success', `[诊断] 诊断完成，请按照建议步骤操作`);
            UIController.toast('诊断完成，请查看建议', 'success');
        }, 1500);
    },

    reportError(issueId, context) {
        const issue = this.getIssueById(issueId);
        if (issue) {
            UIController.log(issue.severity, `[${issue.id}] ${issue.name}${context ? ': ' + context : ''}`);
            this.showIssueModal(issueId, context);
        }
    }
};

// ============================================================
//  10. 帮助中心 HelpCenter
// ============================================================
const HelpCenter = {
    sections: {
        'getting-started': {
            title: '🚀 快速入门',
            content: `
                <article class="help-article">
                    <h1>快速入门指南</h1>
                    <p class="lead">欢迎使用软硬件接口交互自识别系统！本指南将带您快速上手核心功能。</p>

                    <div class="help-step">
                        <div class="help-step-num">1</div>
                        <div class="help-step-content">
                            <h3>浏览设备库</h3>
                            <p>点击顶部导航栏的「设备库」，查看系统支持的所有硬件设备。您可以按分类（传感器、执行器、通信模块）和接口类型（I2C、SPI、UART等）筛选设备。</p>
                            <div class="help-tip">
                                <strong>💡 提示：</strong>使用顶部搜索框可以快速查找设备，支持按名称、型号、制造商搜索。
                            </div>
                        </div>
                    </div>

                    <div class="help-step">
                        <div class="help-step-num">2</div>
                        <div class="help-step-content">
                            <h3>连接硬件设备</h3>
                            <p>在设备库中点击任意设备卡片上的「连接」按钮，系统将自动执行6步自识别协议：</p>
                            <ul>
                                <li>连接检测 — 检测设备物理连接</li>
                                <li>读取描述符 — 获取设备身份与配置信息</li>
                                <li>接口识别 — 识别通信接口类型与参数</li>
                                <li>类型识别 — 匹配设备类型与功能</li>
                                <li>驱动加载 — 自动加载对应软件驱动</li>
                                <li>建立数据通道 — 开始实时数据传输</li>
                            </ul>
                        </div>
                    </div>

                    <div class="help-step">
                        <div class="help-step-num">3</div>
                        <div class="help-step-content">
                            <h3>查看实时数据</h3>
                            <p>设备连接成功后，会显示在控制台的「接口总线监控」区域。点击设备卡片右侧的「详情」按钮，即可在右侧面板查看该设备的实时数据。</p>
                        </div>
                    </div>

                    <div class="help-step">
                        <div class="help-step-num">4</div>
                        <div class="help-step-content">
                            <h3>使用一键识别</h3>
                            <p>点击「⚡ 一键识别全部」按钮，系统将自动连接并识别设备库中的所有硬件设备，适合批量操作。</p>
                            <div class="help-tip">
                                <strong>⚡ 自动扫描：</strong>开启「自动扫描」功能后，系统将定期检测新接入的硬件并自动识别，无需手动操作。
                            </div>
                        </div>
                    </div>

                    <div class="help-step">
                        <div class="help-step-num">5</div>
                        <div class="help-step-content">
                            <h3>使用图像识别</h3>
                            <p>切换到「图像识别」页面，上传一张硬件设备的照片，AI将自动识别设备类型并推荐匹配的驱动。</p>
                        </div>
                    </div>
                </article>
            `
        },
        'devices': {
            title: '📦 设备管理',
            content: `
                <article class="help-article">
                    <h1>设备管理指南</h1>
                    <p class="lead">学习如何管理本地设备库、添加自定义设备、导入导出设备数据。</p>

                    <h2>本地设备库</h2>
                    <p>系统使用 IndexedDB 在本地存储设备数据，支持离线访问。如果浏览器不支持 IndexedDB，将自动降级到 localStorage 模式。</p>

                    <h2>手动添加设备</h2>
                    <ol>
                        <li>进入「设备管理」页面</li>
                        <li>点击「＋ 手动添加设备」按钮</li>
                        <li>填写设备基本信息：名称、分类、接口类型等</li>
                        <li>配置接口参数（如I2C地址、SPI引脚等）</li>
                        <li>定义数据格式（可选）</li>
                        <li>点击「保存」完成添加</li>
                    </ol>

                    <h2>导入与导出</h2>
                    <p>系统支持 JSON 格式的设备数据导入导出，方便备份和迁移：</p>
                    <ul>
                        <li><strong>导出：</strong>点击「📤 导出」将当前所有设备保存为 JSON 文件</li>
                        <li><strong>导入：</strong>点击「📥 导入」选择 JSON 文件批量添加设备</li>
                    </ul>

                    <h2>云端同步</h2>
                    <p>配置云端同步地址后，可以：</p>
                    <ul>
                        <li>将本地设备库同步到云端服务器</li>
                        <li>从云端拉取最新设备数据</li>
                        <li>多设备间共享设备配置</li>
                    </ul>

                    <div class="help-warning">
                        <strong>⚠️ 注意：</strong>云端同步功能需要配置有效的API地址。请在设置页面中填写正确的云端接口地址。
                    </div>
                </article>
            `
        },
        'vision': {
            title: '🖼️ 图像识别',
            content: `
                <article class="help-article">
                    <h1>图像识别使用指南</h1>
                    <p class="lead">通过AI图像识别技术，快速识别硬件设备类型并自动匹配驱动。</p>

                    <h2>功能简介</h2>
                    <p>图像识别模块支持上传硬件设备的实物照片，系统将自动分析图片内容，识别设备类型、接口信息，并匹配对应的设备描述和驱动程序。</p>

                    <h2>使用步骤</h2>
                    <ol>
                        <li>切换到「图像识别」页面</li>
                        <li>将图片拖拽到上传区域，或点击上传区域选择图片</li>
                        <li>确认预览无误后，点击「🔍 开始识别」</li>
                        <li>等待AI分析完成（通常需要1-3秒）</li>
                        <li>查看识别结果，选择最匹配的设备</li>
                        <li>点击「连接设备」即可直接连接使用</li>
                    </ol>

                    <h2>拍照建议</h2>
                    <p>为获得最佳识别效果，拍照时请注意：</p>
                    <ul>
                        <li>确保光线充足，避免过暗或反光</li>
                        <li>设备主体占画面主要部分</li>
                        <li>正面拍摄，展示接口和主要特征</li>
                        <li>背景尽量简洁，避免干扰</li>
                        <li>图片清晰，无明显模糊</li>
                    </ul>

                    <div class="help-tip">
                        <strong>💡 识别不准？</strong>可以从多个角度拍摄多张图片进行识别，取置信度最高的结果。也可以手动在设备库中搜索。
                    </div>
                </article>
            `
        },
        'api': {
            title: '🔌 开放接口',
            content: `
                <article class="help-article">
                    <h1>开放接口文档</h1>
                    <p class="lead">本系统提供多种对外集成方式，方便其他网页或软件调用设备库功能。</p>

                    <h2>一、PostMessage API</h2>
                    <p>通过 <code>window.postMessage</code> 与嵌入的 iframe 进行跨域通信。</p>

                    <h3>1. 获取设备列表</h3>
                    <div class="code-block">
                        <pre><code>// 发送请求
iframe.contentWindow.postMessage({
  type: 'HSIID_GET_DEVICES',
  payload: { category: '传感器', interface: 'I2C' }
}, '*');

// 监听响应
window.addEventListener('message', (e) => {
  if (e.data.type === 'HSIID_DEVICES_RESULT') {
    console.log(e.data.payload.devices);
  }
});</code></pre>
                    </div>

                    <h3>2. 搜索设备</h3>
                    <div class="code-block">
                        <pre><code>iframe.contentWindow.postMessage({
  type: 'HSIID_SEARCH',
  payload: { keyword: '温度' }
}, '*');</code></pre>
                    </div>

                    <h3>3. 连接设备</h3>
                    <div class="code-block">
                        <pre><code>iframe.contentWindow.postMessage({
  type: 'HSIID_CONNECT',
  payload: { deviceId: 'dht22' }
}, '*');</code></pre>
                    </div>

                    <h2>二、URL Scheme</h2>
                    <p>通过URL参数直接打开系统并执行特定操作。</p>
                    <ul>
                        <li><code>?tab=devices</code> — 直接打开设备库页面</li>
                        <li><code>?tab=vision</code> — 直接打开图像识别</li>
                        <li><code>?device=dht22&action=connect</code> — 自动连接指定设备</li>
                        <li><code>?search=温度传感器</code> — 自动搜索并跳转结果</li>
                        <li><code>?theme=deepPurple</code> — 使用指定主题</li>
                    </ul>

                    <h2>三、事件订阅</h2>
                    <p>系统会在关键事件发生时通过 postMessage 向外通知：</p>
                    <ul>
                        <li><code>HSIID_DEVICE_CONNECTED</code> — 设备连接成功</li>
                        <li><code>HSIID_DEVICE_DISCONNECTED</code> — 设备断开</li>
                        <li><code>HSIID_DATA_UPDATE</code> — 设备数据更新</li>
                        <li><code>HSIID_VISION_RESULT</code> — 图像识别完成</li>
                    </ul>

                    <h2>四、REST API（云端）</h2>
                    <p>配置云端服务器后，可通过标准HTTP接口访问设备库：</p>
                    <table class="param-table">
                        <thead>
                            <tr><th>方法</th><th>路径</th><th>描述</th></tr>
                        </thead>
                        <tbody>
                            <tr><td><span class="http-method get">GET</span></td><td>/api/devices</td><td>获取设备列表</td></tr>
                            <tr><td><span class="http-method get">GET</span></td><td>/api/devices/:id</td><td>获取设备详情</td></tr>
                            <tr><td><span class="http-method post">POST</span></td><td>/api/devices</td><td>创建设备</td></tr>
                            <tr><td><span class="http-method put">PUT</span></td><td>/api/devices/:id</td><td>更新设备</td></tr>
                            <tr><td><span class="http-method delete">DELETE</span></td><td>/api/devices/:id</td><td>删除设备</td></tr>
                        </tbody>
                    </table>

                    <div class="help-tip">
                        <strong>🔧 集成示例：</strong>将系统嵌入您的物联网平台、教学系统或硬件管理工具中，提供统一的设备识别与管理能力。
                    </div>
                </article>
            `
        },
        'faq': {
            title: '❓ 常见问题',
            content: `
                <article class="help-article">
                    <h1>常见问题解答</h1>
                    <p class="lead">收集用户最常遇到的问题及解决方案。</p>

                    <h2>🔌 连接相关</h2>

                    <h3>Q: 设备连接失败怎么办？</h3>
                    <p>A: 请按以下步骤排查：</p>
                    <ol>
                        <li>确认硬件设备已正确连接并通电</li>
                        <li>检查接口类型和参数配置是否匹配</li>
                        <li>尝试断开后重新连接</li>
                        <li>更换数据线或检查接线</li>
                        <li>如仍无法解决，请参考「故障排查」页面</li>
                    </ol>

                    <h3>Q: 为什么有的设备识别很慢？</h3>
                    <p>A: 识别速度取决于设备类型和接口速度。I2C/SPI等数字接口通常较快，而UART/ADC等可能需要更长的协商时间。复杂设备（如带固件的模块）还需要额外的握手时间。</p>

                    <h2>💾 数据存储</h2>

                    <h3>Q: 数据会丢失吗？</h3>
                    <p>A: 设备数据存储在浏览器本地（IndexedDB或localStorage）。只要不清除浏览器数据，数据会一直保留。建议定期使用「导出」功能备份数据，或配置云端同步。</p>

                    <h3>Q: 如何在不同设备间同步数据？</h3>
                    <p>A: 有两种方式：</p>
                    <ol>
                        <li>使用「导出/导入」功能，通过JSON文件迁移</li>
                        <li>配置云端同步服务（需自行部署服务端）</li>
                    </ol>

                    <h2>🖼️ 图像识别</h2>

                    <h3>Q: 图像识别支持哪些设备？</h3>
                    <p>A: 目前支持设备库中的所有主流硬件类型。识别基于设备外观特征，对于形态相似的设备可能需要结合型号确认。持续扩充识别库中。</p>

                    <h2>🎨 主题与外观</h2>

                    <h3>Q: 可以自定义主题颜色吗？</h3>
                    <p>A: 系统内置6套精选主题，您可以在设置页面中切换。如需完全自定义，可以通过修改CSS变量实现。</p>

                    <h2>🔧 兼容性</h2>

                    <h3>Q: 支持哪些浏览器？</h3>
                    <p>A: 推荐使用 Chrome 90+、Edge 90+、Firefox 88+、Safari 14+。移动端浏览器也可正常使用，但体验可能有差异。</p>

                    <h3>Q: 可以离线使用吗？</h3>
                    <p>A: 可以！本系统是纯前端应用，所有核心功能（设备库、自识别、数据交互）都可以离线使用。图像识别的AI模式需要联网调用API。</p>
                </article>
            `
        },
        'troubleshoot': {
            title: '🔧 故障排查',
            content: `
                <article class="help-article">
                    <h1>故障排查指南</h1>
                    <p class="lead">遇到问题？按以下步骤系统性排查，大多数问题都能快速解决。</p>

                    <h2>第一步：检查基础连接</h2>
                    <div class="help-warning">
                        <strong>⚠️ 安全提示：</strong>插拔硬件前请确保设备已断电，避免短路损坏设备。
                    </div>
                    <ol>
                        <li>物理连接检查
                            <ul>
                                <li>数据线/杜邦线是否插紧</li>
                                <li>接口方向是否正确（注意VCC/GND不要接反）</li>
                                <li>线缆是否有明显损坏</li>
                            </ul>
                        </li>
                        <li>电源检查
                            <ul>
                                <li>设备电源指示灯是否亮起</li>
                                <li>供电电压是否符合设备要求（3.3V/5V/12V）</li>
                                <li>USB口供电是否充足</li>
                            </ul>
                        </li>
                    </ol>

                    <h2>第二步：软件配置检查</h2>
                    <ol>
                        <li>接口配置核对
                            <ul>
                                <li>I2C设备：地址是否正确（常见0x48/0x23/0x68等）</li>
                                <li>SPI设备：CS引脚、时钟极性、相位配置</li>
                                <li>UART设备：波特率、数据位、校验位是否匹配</li>
                                <li>GPIO设备：引脚编号是否正确</li>
                            </ul>
                        </li>
                        <li>设备描述符验证
                            <ul>
                                <li>在设备管理中查看设备详情</li>
                                <li>确认设备类型、子类型与实际一致</li>
                                <li>确认数据格式定义正确</li>
                            </ul>
                        </li>
                    </ol>

                    <h2>第三步：常见问题速查</h2>

                    <h3>连接超时</h3>
                    <p>可能原因：地址错误、设备无响应、总线冲突</p>
                    <p>解决方法：</p>
                    <ul>
                        <li>使用I2C扫描工具确认设备地址</li>
                        <li>检查总线上是否有地址冲突的设备</li>
                        <li>确认设备固件正常运行</li>
                    </ul>

                    <h3>数据异常/跳变</h3>
                    <p>可能原因：干扰、采样率过高、电源噪声</p>
                    <p>解决方法：</p>
                    <ul>
                        <li>降低采样频率观察</li>
                        <li>使用屏蔽线缆</li>
                        <li>电源端增加滤波电容</li>
                        <li>软件增加滑动平均滤波</li>
                    </ul>

                    <h3>驱动加载失败</h3>
                    <p>可能原因：设备类型不支持、描述符格式错误</p>
                    <p>解决方法：</p>
                    <ul>
                        <li>确认设备在支持列表中</li>
                        <li>手动添加自定义设备描述符</li>
                        <li>联系技术支持获取帮助</li>
                    </ul>

                    <h2>第四步：获取帮助</h2>
                    <p>如果以上步骤都无法解决问题：</p>
                    <ol>
                        <li>查看「系统日志」中的错误信息</li>
                        <li>打开浏览器开发者工具（F12）查看控制台</li>
                        <li>记录错误码和复现步骤</li>
                        <li>导出设备配置用于排查</li>
                    </ol>

                    <div class="help-tip">
                        <strong>📋 诊断报告：</strong>系统内置诊断功能，遇到问题时会自动弹出诊断窗口，提供可能的原因和解决方案建议。
                    </div>
                </article>
            `
        }
    },

    currentSection: 'getting-started',

    init() {
        const navItems = document.querySelectorAll('.help-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                this.showSection(item.dataset.helpSection);
            });
        });

        this.showSection('getting-started');
    },

    showSection(sectionId) {
        const section = this.sections[sectionId];
        if (!section) return;

        this.currentSection = sectionId;

        document.querySelectorAll('.help-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.helpSection === sectionId);
        });

        const content = document.getElementById('helpContent');
        if (content) {
            content.innerHTML = section.content;
        }
    }
};

// ============================================================
//  11. 云端存储管理器 CloudStorage
// ============================================================
const CloudStorage = {
    enabled: false,
    apiUrl: '',
    apiKey: '',
    lastSyncTime: null,
    cloudDevices: [],
    currentView: 'local',

    init() {
        const savedUrl = localStorage.getItem('hsiid-cloud-url') || '';
        const savedKey = localStorage.getItem('hsiid-cloud-key') || '';
        const savedEnabled = localStorage.getItem('hsiid-cloud-enabled') === 'true';

        this.apiUrl = savedUrl;
        this.apiKey = savedKey;
        this.enabled = savedEnabled;

        const cloudUrlEl = document.getElementById('cloudUrl');
        const cloudToggle = document.getElementById('cloudSyncToggle');
        if (cloudUrlEl && savedUrl) cloudUrlEl.value = savedUrl;
        if (cloudToggle) cloudToggle.checked = savedEnabled;

        if (cloudToggle) {
            cloudToggle.addEventListener('change', (e) => {
                this.setEnabled(e.target.checked);
            });
        }

        if (cloudUrlEl) {
            cloudUrlEl.addEventListener('change', (e) => {
                this.apiUrl = e.target.value;
                localStorage.setItem('hsiid-cloud-url', e.target.value);
            });
        }

        this.bindStorageTabs();
    },

    setEnabled(on) {
        this.enabled = on;
        localStorage.setItem('hsiid-cloud-enabled', on);
        if (on) {
            if (!this.apiUrl) {
                UIController.toast('请先配置云端API地址', 'warn');
                document.getElementById('cloudSyncToggle').checked = false;
                this.enabled = false;
                return;
            }
            UIController.log('info', '[云端] 云端同步已启用');
            this.syncFromCloud();
        } else {
            UIController.log('info', '[云端] 云端同步已关闭');
        }
        this.updateSyncStatus();
    },

    bindStorageTabs() {
        const tabs = document.querySelectorAll('.storage-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchView(tab.dataset.storage);
            });
        });
    },

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.storage-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.storage === view);
        });
        this.updateSyncStatus();
        if (UIController.refreshDeviceLibrary) {
            UIController.refreshDeviceLibrary();
        }
    },

    updateSyncStatus() {
        const statusEl = document.getElementById('syncStatusText');
        const dotEl = document.querySelector('.sync-dot');
        if (!statusEl) return;

        if (!this.enabled) {
            statusEl.textContent = '未连接云端';
            if (dotEl) dotEl.className = 'sync-dot';
        } else if (this.lastSyncTime) {
            statusEl.textContent = '已同步 · ' + this.formatTime(this.lastSyncTime);
            if (dotEl) dotEl.className = 'sync-dot sync-online';
        } else {
            statusEl.textContent = '同步中...';
            if (dotEl) dotEl.className = 'sync-dot sync-syncing';
        }
    },

    formatTime(date) {
        if (!date) return '从未';
        const d = new Date(date);
        return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    },

    async syncFromCloud() {
        if (!this.enabled || !this.apiUrl) return;

        UIController.log('info', '[云端] 正在从云端同步设备数据...');
        UIController.toast('正在从云端同步...', 'info');
        this.updateSyncStatus();

        try {
            const devices = await this.fetchCloudDevices();
            this.cloudDevices = devices;
            this.lastSyncTime = Date.now();
            localStorage.setItem('hsiid-cloud-devices', JSON.stringify(devices));
            localStorage.setItem('hsiid-cloud-lastSync', this.lastSyncTime);
            UIController.log('success', `[云端] 同步完成，共 ${devices.length} 个设备`);
            UIController.toast(`云端同步成功（${devices.length}个设备）`, 'success');
        } catch (e) {
            UIController.log('error', `[云端] 同步失败: ${e.message}`);
            DiagnosticEngine.reportError('ERR_005', e.message);
        }

        this.updateSyncStatus();
    },

    async fetchCloudDevices() {
        if (this.apiUrl === 'https://api.example.com/devices' || !this.apiUrl) {
            return this.getMockCloudDevices();
        }
        try {
            const res = await fetch(this.apiUrl, {
                headers: { 'Authorization': 'Bearer ' + this.apiKey }
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } catch (e) {
            console.warn('云端请求失败，使用演示数据:', e);
            return this.getMockCloudDevices();
        }
    },

    getMockCloudDevices() {
        return [
            {
                id: 'cloud_temp_pro',
                name: '工业级温度传感器 PT100',
                icon: '🌡️', category: '传感器', source: 'cloud',
                descriptor: {
                    deviceId: 'PT100-PRO-001', deviceType: 'sensor', subType: 'temperature',
                    manufacturer: 'IndustrialSens', model: 'PT100-Pro', interface: 'RS485',
                    dataFormat: { temperature: 'float °C' }, range: '-200~600°C',
                    sampleRate: '10Hz', power: '24V', version: '3.0.0'
                },
                dataDisplay: 'value-cards', hasGenerator: false, builtIn: false
            },
            {
                id: 'cloud_ethernet',
                name: '以太网控制模块 W5500',
                icon: '🌐', category: '通信模块', source: 'cloud',
                descriptor: {
                    deviceId: 'ETH-W5500-CLOUD', deviceType: 'communication', subType: 'ethernet',
                    manufacturer: 'WIZnet', model: 'W5500', interface: 'SPI',
                    dataFormat: { ip: 'string', mac: 'string', speed: 'Mbps' },
                    sampleRate: 'N/A', power: '3.3V', version: '1.0.0'
                },
                dataDisplay: 'value-cards', hasGenerator: false, builtIn: false
            },
            {
                id: 'cloud_servo',
                name: '总线舵机 STS3215',
                icon: '🦾', category: '执行器', source: 'cloud',
                descriptor: {
                    deviceId: 'SERVO-STS3215', deviceType: 'actuator', subType: 'servo',
                    manufacturer: 'Feetech', model: 'STS3215', interface: 'UART',
                    dataFormat: { angle: 'deg', speed: 'rpm', torque: 'kg.cm' },
                    sampleRate: '50Hz', power: '7.4V', version: '2.1.0'
                },
                dataDisplay: 'value-cards', hasGenerator: false, builtIn: false
            }
        ];
    },

    async pushToCloud(device) {
        console.log('[云端] 推送设备到云端 (模拟):', device.id);
        return true;
    },

    getCloudDevices() {
        return this.cloudDevices;
    },

    async importCloudDevice(cloudDevice) {
        const device = { ...cloudDevice, id: cloudDevice.id + '_local', builtIn: false };
        await DeviceDB.add(device);
        UIController.log('success', `[云端] 已导入设备: ${device.name}`);
        UIController.toast(`已导入: ${device.name}`, 'success');
    }
};

// ============================================================
//  12. 开放API ExternalAPI
// ============================================================
const ExternalAPI = {
    listeners: new Map(),

    init() {
        window.addEventListener('message', (e) => {
            this.handleMessage(e);
        });

        this.parseURLParams();
    },

    handleMessage(event) {
        const data = event.data;
        if (!data || !data.type || !data.type.startsWith('HSIID_')) return;

        const source = event.source;
        const origin = event.origin;

        switch (data.type) {
            case 'HSIID_GET_DEVICES':
                this.handleGetDevices(data.payload, source, origin);
                break;
            case 'HSIID_SEARCH':
                this.handleSearch(data.payload, source, origin);
                break;
            case 'HSIID_CONNECT':
                this.handleConnect(data.payload, source, origin);
                break;
            case 'HSIID_GET_DEVICE':
                this.handleGetDevice(data.payload, source, origin);
                break;
            case 'HSIID_VERSION':
                this.post(source, { type: 'HSIID_VERSION_RESULT', payload: { version: '2.1.0', apiVersion: '1.0.0' } }, origin);
                break;
        }
    },

    async handleGetDevices(payload, source, origin) {
        try {
            let devices = await DeviceDB.getAll();
            if (payload?.category && payload.category !== 'all') {
                devices = devices.filter(d => d.category === payload.category);
            }
            if (payload?.interface && payload.interface !== 'all') {
                devices = devices.filter(d => d.descriptor?.interface === payload.interface);
            }
            this.post(source, {
                type: 'HSIID_DEVICES_RESULT',
                payload: { devices: devices.map(d => this.sanitizeDevice(d)), total: devices.length }
            }, origin);
        } catch (e) {
            this.post(source, { type: 'HSIID_ERROR', payload: { message: e.message } }, origin);
        }
    },

    async handleSearch(payload, source, origin) {
        try {
            const devices = await DeviceDB.search(payload?.keyword || '');
            this.post(source, {
                type: 'HSIID_SEARCH_RESULT',
                payload: { devices: devices.map(d => this.sanitizeDevice(d)) }
            }, origin);
        } catch (e) {
            this.post(source, { type: 'HSIID_ERROR', payload: { message: e.message } }, origin);
        }
    },

    async handleConnect(payload, source, origin) {
        try {
            const device = await DeviceDB.getById(payload.deviceId);
            if (!device) {
                this.post(source, { type: 'HSIID_ERROR', payload: { message: '设备不存在' } }, origin);
                return;
            }
            await SelfIdentification.connectDevice(device);
            this.post(source, {
                type: 'HSIID_CONNECT_RESULT',
                payload: { deviceId: device.id, success: true }
            }, origin);
        } catch (e) {
            this.post(source, { type: 'HSIID_ERROR', payload: { message: e.message } }, origin);
        }
    },

    async handleGetDevice(payload, source, origin) {
        try {
            const device = await DeviceDB.getById(payload.deviceId);
            if (!device) {
                this.post(source, { type: 'HSIID_ERROR', payload: { message: '设备不存在' } }, origin);
                return;
            }
            this.post(source, {
                type: 'HSIID_DEVICE_RESULT',
                payload: { device: this.sanitizeDevice(device) }
            }, origin);
        } catch (e) {
            this.post(source, { type: 'HSIID_ERROR', payload: { message: e.message } }, origin);
        }
    },

    sanitizeDevice(device) {
        const d = { ...device };
        delete d.dataGenerator;
        return d;
    },

    post(target, data, origin) {
        try {
            target.postMessage(data, origin || '*');
        } catch (e) {
            console.warn('postMessage失败:', e);
        }
    },

    emit(event, payload) {
        const eventMap = {
            'device_connected': 'HSIID_DEVICE_CONNECTED',
            'device_disconnected': 'HSIID_DEVICE_DISCONNECTED',
            'data_update': 'HSIID_DATA_UPDATE',
            'vision_result': 'HSIID_VISION_RESULT'
        };
        const type = eventMap[event] || 'HSIID_EVENT';

        if (window.parent !== window) {
            this.post(window.parent, { type, payload }, '*');
        }
    },

    parseURLParams() {
        const params = new URLSearchParams(window.location.search);

        const tab = params.get('tab');
        if (tab) {
            setTimeout(() => UIController.switchTab(tab), 500);
        }

        const theme = params.get('theme');
        if (theme) {
            setTimeout(() => ThemeManager.applyTheme(theme), 100);
        }

        const search = params.get('search');
        if (search) {
            setTimeout(() => {
                document.getElementById('globalSearch').value = search;
                UIController.switchTab('devices');
            }, 500);
        }

        const device = params.get('device');
        const action = params.get('action');
        if (device && action === 'connect') {
            setTimeout(async () => {
                const dev = await DeviceDB.getById(device);
                if (dev) SelfIdentification.connectDevice(dev);
            }, 1000);
        }
    }
};

// ============================================================
//  13. 新手引导 GuideTour
// ============================================================
const GuideTour = {
    steps: [
        {
            target: '.logo-wrap',
            title: '欢迎使用 HSI·ID',
            content: '这是软硬件接口交互自识别系统，让我带您快速了解核心功能。',
            position: 'bottom'
        },
        {
            target: '.nav-tabs',
            title: '功能导航',
            content: '顶部导航栏包含5大功能模块：控制台、设备库、设备管理、图像识别、设置。',
            position: 'bottom'
        },
        {
            target: '#autoConnectBtn',
            title: '一键识别',
            content: '点击此按钮，系统将自动识别并连接所有支持的硬件设备。',
            position: 'bottom'
        },
        {
            target: '#autoScanToggle',
            title: '自动扫描',
            content: '开启自动扫描后，系统会定期检测新接入的硬件并自动识别。',
            position: 'bottom'
        },
        {
            target: '.search-box',
            title: '全局搜索',
            content: '快速搜索设备、型号、接口。按 Ctrl+K 可快速聚焦搜索框。',
            position: 'bottom'
        },
        {
            target: '#themeToggle',
            title: '主题切换',
            content: '点击切换不同主题配色，也可在设置页面选择更多主题。',
            position: 'bottom'
        }
    ],

    currentStep: 0,
    isActive: false,

    init() {
        const hasSeen = localStorage.getItem('hsiid-guide-seen');
        if (!hasSeen) {
            setTimeout(() => this.start(), 1500);
        }
    },

    start() {
        this.isActive = true;
        this.currentStep = 0;
        this.showStep(0);
    },

    showStep(index) {
        if (index < 0 || index >= this.steps.length) {
            this.end();
            return;
        }

        this.currentStep = index;
        const step = this.steps[index];
        const target = document.querySelector(step.target);

        let overlay = document.getElementById('guideOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'guideOverlay';
            overlay.className = 'guide-overlay';
            overlay.innerHTML = `
                <div class="guide-highlight" id="guideHighlight"></div>
                <div class="guide-tooltip" id="guideTooltip">
                    <div class="guide-progress">
                        ${this.steps.map((_, i) => `<span class="guide-dot" data-step="${i}"></span>`).join('')}
                    </div>
                    <h3 class="guide-title" id="guideTitle"></h3>
                    <p class="guide-content" id="guideContent"></p>
                    <div class="guide-actions">
                        <button class="btn btn-ghost" id="guideSkip">跳过</button>
                        <div class="guide-nav">
                            <button class="btn btn-ghost" id="guidePrev">上一步</button>
                            <button class="btn btn-primary" id="guideNext">下一步</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            document.getElementById('guideSkip').addEventListener('click', () => this.end());
            document.getElementById('guidePrev').addEventListener('click', () => this.showStep(index - 1));
            document.getElementById('guideNext').addEventListener('click', () => {
                if (index === this.steps.length - 1) {
                    this.end();
                } else {
                    this.showStep(index + 1);
                }
            });
        }

        if (target) {
            const rect = target.getBoundingClientRect();
            const highlight = document.getElementById('guideHighlight');
            const tooltip = document.getElementById('guideTooltip');
            const padding = 8;

            highlight.style.cssText = `
                top: ${rect.top - padding}px;
                left: ${rect.left - padding}px;
                width: ${rect.width + padding * 2}px;
                height: ${rect.height + padding * 2}px;
            `;

            const tooltipW = 320;
            let top, left;
            switch (step.position) {
                case 'bottom':
                    top = rect.bottom + 16;
                    left = rect.left + rect.width / 2 - tooltipW / 2;
                    break;
                case 'top':
                    top = rect.top - 120;
                    left = rect.left + rect.width / 2 - tooltipW / 2;
                    break;
                default:
                    top = rect.bottom + 16;
                    left = rect.left + rect.width / 2 - tooltipW / 2;
            }

            left = Math.max(16, Math.min(left, window.innerWidth - tooltipW - 16));
            top = Math.max(16, Math.min(top, window.innerHeight - 180));

            tooltip.style.top = top + 'px';
            tooltip.style.left = left + 'px';
        }

        document.getElementById('guideTitle').textContent = step.title;
        document.getElementById('guideContent').textContent = step.content;

        document.querySelectorAll('.guide-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
            dot.classList.toggle('done', i < index);
        });

        document.getElementById('guidePrev').style.visibility = index === 0 ? 'hidden' : 'visible';
        document.getElementById('guideNext').textContent = index === this.steps.length - 1 ? '完成' : '下一步';
    },

    end() {
        this.isActive = false;
        const overlay = document.getElementById('guideOverlay');
        if (overlay) overlay.remove();
        localStorage.setItem('hsiid-guide-seen', 'true');
    }
};

// ============================================================
//  14. 设置管理器 SettingsManager
// ============================================================
const SettingsManager = {
    defaults: {
        language: 'zh-CN',
        notifyConnect: true,
        notifyError: true,
        soundEnabled: false,
        aiEnabled: true,
        aiSuggestEnabled: true,
        scanIntervalMs: 8000,
        dataRefreshMs: 500,
        maxConcurrentTasks: 6,
        exportFormat: 'json',
        historyRetentionDays: 30,
        historySidebarVisible: true
    },

    current: {},

    init() {
        const saved = localStorage.getItem('hsiid-settings');
        this.current = saved ? { ...this.defaults, ...JSON.parse(saved) } : { ...this.defaults };
        this.bindUI();
        this.applyAll();
    },

    bindUI() {
        const bindings = [
            { id: 'languageSelect', key: 'language', event: 'change', type: 'value' },
            { id: 'notifyConnect', key: 'notifyConnect', event: 'change', type: 'checked' },
            { id: 'notifyError', key: 'notifyError', event: 'change', type: 'checked' },
            { id: 'soundToggle', key: 'soundEnabled', event: 'change', type: 'checked' },
            { id: 'aiToggle', key: 'aiEnabled', event: 'change', type: 'checked' },
            { id: 'aiSuggestToggle', key: 'aiSuggestEnabled', event: 'change', type: 'checked' },
            { id: 'scanIntervalSelect', key: 'scanIntervalMs', event: 'change', type: 'value-number' },
            { id: 'dataRefreshRate', key: 'dataRefreshMs', event: 'change', type: 'value-number' },
            { id: 'maxConcurrentTasks', key: 'maxConcurrentTasks', event: 'change', type: 'value-number' },
            { id: 'exportFormat', key: 'exportFormat', event: 'change', type: 'value' },
            { id: 'historyRetention', key: 'historyRetentionDays', event: 'change', type: 'value-number' },
            { id: 'historySidebarToggle', key: 'historySidebarVisible', event: 'change', type: 'checked' }
        ];

        bindings.forEach(b => {
            const el = document.getElementById(b.id);
            if (!el) return;

            if (b.type === 'checked') el.checked = this.current[b.key];
            else if (b.type === 'value' || b.type === 'value-number') el.value = this.current[b.key];

            el.addEventListener(b.event, () => {
                let val;
                if (b.type === 'checked') val = el.checked;
                else if (b.type === 'value-number') val = parseInt(el.value);
                else val = el.value;
                this.set(b.key, val);
            });
        });
    },

    set(key, value) {
        this.current[key] = value;
        localStorage.setItem('hsiid-settings', JSON.stringify(this.current));
        this.apply(key, value);
    },

    get(key) {
        return this.current[key];
    },

    applyAll() {
        Object.keys(this.current).forEach(key => this.apply(key, this.current[key]));
    },

    apply(key, value) {
        switch (key) {
            case 'scanIntervalMs':
                if (AutoScanner && AutoScanner.enabled) {
                    AutoScanner.stopScanning();
                    AutoScanner.scanPeriodMs = value;
                    AutoScanner.startScanning();
                }
                break;
            case 'dataRefreshMs':
                if (typeof SelfIdentification !== 'undefined') {
                    const activeIds = [];
                    AppState.connectedDevices.forEach((info, id) => {
                        if (info.dataInterval) {
                            clearInterval(info.dataInterval);
                            info.dataInterval = setInterval(() => {
                                SelfIdentification.updateDeviceData(id);
                            }, value);
                        }
                    });
                }
                break;
            case 'maxConcurrentTasks':
                if (TaskManager) TaskManager.maxConcurrent = value;
                break;
            case 'historySidebarVisible':
                const sidebar = document.getElementById('historySidebar');
                const toggleBtn = document.getElementById('historyToggleBtn');
                if (sidebar) sidebar.classList.toggle('hidden', !value);
                if (toggleBtn) toggleBtn.style.display = value ? 'none' : 'flex';
                break;
            case 'aiEnabled':
                const fab = document.getElementById('aiFab');
                if (fab) fab.style.display = value ? 'flex' : 'none';
                break;
        }
    },

    reset() {
        this.current = { ...this.defaults };
        localStorage.removeItem('hsiid-settings');
        this.bindUI();
        this.applyAll();
    }
};

// ============================================================
//  15. AI助手 AIAssistant
// ============================================================
const AIAssistant = {
    isOpen: false,
    isMinimized: false,
    messages: [],
    apiUrl: '',
    isTyping: false,

    quickResponses: {
        devices: '我来帮您查找设备！您可以告诉我：\n\n1. 您需要什么类型的设备？（传感器/执行器/通信模块）\n2. 使用什么接口？（I2C/SPI/UART/GPIO）\n3. 或者直接描述功能需求\n\n您也可以在设备库页面使用搜索功能快速查找。',
        diagnose: '让我帮您诊断问题。请告诉我：\n\n1. 遇到了什么问题？（连接失败/数据异常/驱动错误）\n2. 是什么设备？\n3. 错误提示是什么？\n\n您也可以点击错误弹窗中的「自动诊断」按钮，系统会自动分析常见原因并给出解决方案。',
        tutorial: '新手入门推荐学习路径：\n\n📚 **第一步：快速入门**\n阅读帮助中心的「快速入门」指南，5分钟了解核心功能。\n\n🔌 **第二步：连接第一个设备**\n从设备库选择一个简单的传感器（如温湿度传感器），点击连接观察自识别过程。\n\n📊 **第三步：查看数据**\n点击设备详情，查看实时数据和描述符信息。\n\n🖼️ **第四步：体验图像识别**\n上传一张硬件照片，看看AI能不能认出来！',
        recommend: '根据您当前的使用情况，以下是一些优化建议：\n\n💡 **性能优化**\n• 如果设备较多，建议在设置中降低数据刷新频率\n• 开启自动扫描可以及时发现新接入的设备\n\n🎨 **界面优化**\n• 尝试不同的主题配色，在设置页面有6套主题可选\n• 紧凑模式可以显示更多内容\n\n🔧 **功能建议**\n• 使用历史记录功能追踪您的操作\n• 配置云端同步，多设备共享设备库'
    },

    init() {
        const fab = document.getElementById('aiFab');
        const panel = document.getElementById('aiPanel');
        const closeBtn = document.getElementById('aiPanelClose');
        const minBtn = document.getElementById('aiPanelMinimize');
        const sendBtn = document.getElementById('aiSendBtn');
        const input = document.getElementById('aiInput');

        if (fab) fab.addEventListener('click', () => this.toggle());
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
        if (minBtn) minBtn.addEventListener('click', () => this.minimize());
        if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }

        document.querySelectorAll('.ai-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });

        const savedUrl = localStorage.getItem('hsiid-ai-api');
        if (savedUrl) this.apiUrl = savedUrl;

        const aiUrlEl = document.getElementById('aiApiUrl');
        if (aiUrlEl) {
            aiUrlEl.value = savedUrl || '';
            aiUrlEl.addEventListener('change', (e) => {
                this.apiUrl = e.target.value;
                localStorage.setItem('hsiid-ai-api', e.target.value);
            });
        }
    },

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    },

    open() {
        const panel = document.getElementById('aiPanel');
        if (panel) {
            panel.classList.add('active');
            panel.classList.remove('minimized');
        }
        this.isOpen = true;
        this.isMinimized = false;

        const badge = document.getElementById('aiFabBadge');
        if (badge) badge.style.display = 'none';
    },

    close() {
        const panel = document.getElementById('aiPanel');
        if (panel) panel.classList.remove('active');
        this.isOpen = false;
    },

    minimize() {
        const panel = document.getElementById('aiPanel');
        if (this.isMinimized) {
            panel.classList.remove('minimized');
            this.isMinimized = false;
        } else {
            panel.classList.add('minimized');
            this.isMinimized = true;
        }
    },

    handleQuickAction(action) {
        const response = this.quickResponses[action];
        if (response) {
            this.addMessage('user', this.getQuickActionLabel(action));
            setTimeout(() => {
                this.addMessage('bot', response);
            }, 500);
        }
    },

    getQuickActionLabel(action) {
        const labels = {
            devices: '帮我查找设备',
            diagnose: '我遇到问题了',
            tutorial: '新手怎么入门',
            recommend: '有什么优化建议'
        };
        return labels[action] || action;
    },

    async sendMessage() {
        const input = document.getElementById('aiInput');
        const text = input.value.trim();
        if (!text) return;

        this.addMessage('user', text);
        input.value = '';

        this.showTyping();

        setTimeout(() => {
            this.hideTyping();
            this.addMessage('bot', this.generateResponse(text));
        }, 800 + Math.random() * 1200);
    },

    generateResponse(text) {
        const lower = text.toLowerCase();

        if (lower.includes('设备') || lower.includes('找') || lower.includes('搜索')) {
            return '您可以通过以下方式查找设备：\n\n🔍 **全局搜索**：按 Ctrl+K 快速搜索\n📦 **设备库页面**：按分类和接口筛选\n🖼️ **图像识别**：上传照片自动识别\n\n您想找什么类型的设备呢？我可以帮您推荐。';
        }
        if (lower.includes('连接') || lower.includes('失败') || lower.includes('问题') || lower.includes('错误')) {
            return '遇到连接问题？请尝试：\n\n1. 🔌 检查物理连接是否牢固\n2. 💡 确认设备电源指示灯亮起\n3. ⚙️  核对接口地址/引脚配置\n4. 🔄 重启设备后重试\n\n如果问题仍在，可以查看帮助中心的「故障排查」页面，或告诉我具体的错误信息。';
        }
        if (lower.includes('教程') || lower.includes('怎么用') || lower.includes('入门')) {
            return '新手入门推荐：\n\n🚀 **快速上手**：帮助中心 → 快速入门\n📦 **核心概念**：设备描述符、自识别协议\n🔧 **实际操作**：连接一个传感器看实时数据\n🖼️ **趣味功能**：图像识别硬件\n\n有具体问题随时问我！';
        }
        if (lower.includes('你好') || lower.includes('hi') || lower.includes('hello')) {
            return '您好！👋 我是软硬件接口交互自识别系统的AI助手。\n\n我可以帮您：\n• 🔍 查找和推荐设备\n• 🩺 诊断连接问题\n• 📚 提供使用教程\n• 💡 给出优化建议\n\n有什么我可以帮您的吗？';
        }
        if (lower.includes('谢谢') || lower.includes('感谢')) {
            return '不客气！😊 如果还有其他问题随时问我。\n\n祝您使用愉快！';
        }

        return '我理解您的问题。让我来帮您分析：\n\n关于「' + text + '」，您可以：\n\n1. 查看帮助中心获取详细文档\n2. 使用设备管理中的搜索功能\n3. 检查系统日志查看具体错误\n\n如果需要更具体的帮助，请告诉我更多细节，比如设备型号、错误信息等。';
    },

    addMessage(role, text) {
        const container = document.getElementById('aiMessages');
        if (!container) return;

        const isBot = role === 'bot';
        const msgDiv = document.createElement('div');
        msgDiv.className = 'ai-message ' + (isBot ? 'ai-message-bot' : 'ai-message-user');

        msgDiv.innerHTML = `
            <div class="ai-avatar">${isBot ? '🤖' : '😊'}</div>
            <div class="ai-bubble">
                <div class="ai-bubble-text">${text.replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</div>
            </div>
        `;

        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;

        if (!this.isOpen) {
            const badge = document.getElementById('aiFabBadge');
            if (badge) {
                const count = parseInt(badge.textContent || '0') + 1;
                badge.textContent = count;
                badge.style.display = 'flex';
            }
        }
    },

    showTyping() {
        const container = document.getElementById('aiMessages');
        if (!container) return;

        const typing = document.createElement('div');
        typing.className = 'ai-message ai-message-bot typing-message';
        typing.id = 'aiTypingIndicator';
        typing.innerHTML = `
            <div class="ai-avatar">🤖</div>
            <div class="ai-bubble">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
        this.isTyping = true;
    },

    hideTyping() {
        const typing = document.getElementById('aiTypingIndicator');
        if (typing) typing.remove();
        this.isTyping = false;
    }
};

// ============================================================
//  16. 历史记录管理器 HistoryManager
// ============================================================
const HistoryManager = {
    records: [],
    currentFilter: 'all',
    searchKeyword: '',
    maxRecords: 200,
    selectedIds: new Set(),

    init() {
        this.load();
        this.bindUI();
        this.render();
    },

    bindUI() {
        const searchInput = document.getElementById('historySearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchKeyword = e.target.value;
                this.render();
            });
        }

        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentFilter = tab.dataset.historyType;
                document.querySelectorAll('.history-tab').forEach(t => t.classList.toggle('active', t === tab));
                this.render();
            });
        });

        const clearBtn = document.getElementById('historyClearBtn');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearAll());

        const exportBtn = document.getElementById('historyExportBtn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportHistory());

        const collapseBtn = document.getElementById('historyCollapseBtn');
        if (collapseBtn) collapseBtn.addEventListener('click', () => this.toggleSidebar());

        const toggleBtn = document.getElementById('historyToggleBtn');
        if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleSidebar());

        const selectAllCheckbox = document.getElementById('historySelectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        const deleteSelectedBtn = document.getElementById('historyDeleteSelectedBtn');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', () => this.deleteSelected());
        }
    },

    load() {
        try {
            const saved = localStorage.getItem('hsiid-history');
            this.records = saved ? JSON.parse(saved) : [];
        } catch (e) {
            this.records = [];
        }
        this.cleanupOld();
    },

    save() {
        try {
            if (this.records.length > this.maxRecords) {
                this.records = this.records.slice(0, this.maxRecords);
            }
            localStorage.setItem('hsiid-history', JSON.stringify(this.records));
        } catch (e) {
            console.warn('历史记录保存失败:', e);
        }
    },

    cleanupOld() {
        const retentionDays = SettingsManager.get('historyRetentionDays');
        if (!retentionDays) return;

        const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
        this.records = this.records.filter(r => r.timestamp > cutoff);
        this.save();
    },

    addRecord(type, title, detail, status, data) {
        const record = {
            id: 'h_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type,
            title,
            detail,
            status: status || 'success',
            data: data || null,
            timestamp: Date.now(),
            name: title
        };

        this.records.unshift(record);
        this.save();
        this.render();
        return record;
    },

    renameRecord(id, newName) {
        const record = this.records.find(r => r.id === id);
        if (record) {
            record.name = newName;
            this.save();
            this.render();
        }
    },

    removeRecord(id) {
        this.records = this.records.filter(r => r.id !== id);
        this.selectedIds.delete(id);
        this.save();
        this.render();
    },

    toggleSelect(id) {
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
        this.updateSelectAllState();
        this.updateDeleteButton();
        this.render();
    },

    toggleSelectAll(checked) {
        const filtered = this.getFiltered();
        if (checked) {
            filtered.forEach(r => this.selectedIds.add(r.id));
        } else {
            filtered.forEach(r => this.selectedIds.delete(r.id));
        }
        this.updateDeleteButton();
        this.render();
    },

    updateSelectAllState() {
        const selectAllCheckbox = document.getElementById('historySelectAll');
        if (!selectAllCheckbox) return;
        const filtered = this.getFiltered();
        selectAllCheckbox.checked = filtered.length > 0 && filtered.every(r => this.selectedIds.has(r.id));
        selectAllCheckbox.indeterminate = filtered.length > 0 && 
            this.selectedIds.size > 0 && 
            !selectAllCheckbox.checked;
    },

    updateDeleteButton() {
        const btn = document.getElementById('historyDeleteSelectedBtn');
        if (btn) btn.disabled = this.selectedIds.size === 0;
    },

    deleteSelected() {
        if (this.selectedIds.size === 0) return;
        if (!confirm(`确定要删除选中的 ${this.selectedIds.size} 条记录吗？`)) return;
        
        this.records = this.records.filter(r => !this.selectedIds.has(r.id));
        this.selectedIds.clear();
        this.save();
        this.render();
    },

    clearAll() {
        if (confirm('确定要清空所有历史记录吗？')) {
            this.records = [];
            this.selectedIds.clear();
            this.save();
            this.render();
        }
    },

    exportHistory() {
        const dataToExport = this.selectedIds.size > 0 
            ? this.records.filter(r => this.selectedIds.has(r.id))
            : this.records;

        if (dataToExport.length === 0) {
            alert('没有可导出的记录');
            return;
        }

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `历史记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    toggleSidebar() {
        const sidebar = document.getElementById('historySidebar');
        const toggleBtn = document.getElementById('historyToggleBtn');
        const isVisible = sidebar.classList.contains('hidden');

        sidebar.classList.toggle('hidden');
        toggleBtn.style.display = isVisible ? 'none' : 'flex';

        SettingsManager.set('historySidebarVisible', isVisible);
    },

    getFiltered() {
        let filtered = [...this.records];

        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(r => r.type === this.currentFilter);
        }

        if (this.searchKeyword) {
            const kw = this.searchKeyword.toLowerCase();
            filtered = filtered.filter(r =>
                r.title.toLowerCase().includes(kw) ||
                r.detail?.toLowerCase().includes(kw) ||
                r.name?.toLowerCase().includes(kw)
            );
        }

        return filtered;
    },

    render() {
        const list = document.getElementById('historyList');
        if (!list) return;

        const filtered = this.getFiltered();
        
        this.updateSelectAllState();
        this.updateDeleteButton();

        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="history-empty">
                    <div style="font-size:32px;margin-bottom:8px;">📭</div>
                    <div>暂无历史记录</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">
                        ${this.searchKeyword || this.currentFilter !== 'all' ? '没有匹配的记录' : '执行的操作会显示在这里'}
                    </div>
                </div>
            `;
            return;
        }

        const typeIcons = {
            connect: '🔌',
            vision: '🖼️',
            data: '📊',
            system: '⚙️'
        };

        const statusLabels = {
            success: { text: '成功', class: 'status-success' },
            failed: { text: '失败', class: 'status-failed' },
            running: { text: '进行中', class: 'status-running' }
        };

        list.innerHTML = filtered.map(r => {
            const icon = typeIcons[r.type] || '📋';
            const status = statusLabels[r.status] || statusLabels.success;
            const time = this.formatTime(r.timestamp);
            const isSelected = this.selectedIds.has(r.id);

            return `
                <div class="history-item ${isSelected ? 'selected' : ''}" data-id="${r.id}" onclick="HistoryManager.toggleSelect('${r.id}')">
                    <input type="checkbox" class="history-item-checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); HistoryManager.toggleSelect('${r.id}')">
                    <button class="history-item-delete" title="删除" onclick="event.stopPropagation(); HistoryManager.removeRecord('${r.id}')">✕</button>
                    <div class="history-item-header">
                        <div class="history-item-icon type-${r.type}">${icon}</div>
                        <div class="history-item-info">
                            <div class="history-item-title">${this.escapeHtml(r.name || r.title)}</div>
                            <div class="history-item-time">${time}</div>
                        </div>
                        <span class="history-item-status ${status.class}">${status.text}</span>
                    </div>
                    <div class="history-item-desc">${this.escapeHtml(r.detail || '')}</div>
                </div>
            `;
        }).join('');
    },

    promptRename(id) {
        const record = this.records.find(r => r.id === id);
        if (!record) return;

        const newName = prompt('重命名记录：', record.name || record.title);
        if (newName !== null && newName.trim()) {
            this.renameRecord(id, newName.trim());
        }
    },

    formatTime(ts) {
        const date = new Date(ts);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';

        return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// ============================================================
//  17. 软件推荐系统 SoftwareRecommend
// ============================================================
const SoftwareRecommend = {
    recommendations: {
        sensor: [
            {
                name: 'Arduino IDE',
                icon: '💚',
                desc: '最流行的嵌入式开发环境，适合入门',
                tags: ['入门推荐', '开源免费', '跨平台'],
                url: 'https://www.arduino.cc/en/software',
                tutorial: '新手5分钟上手Arduino开发'
            },
            {
                name: 'PlatformIO',
                icon: '🔧',
                desc: '专业级物联网开发平台，VS Code插件',
                tags: ['专业开发', '调试工具', '库管理'],
                url: 'https://platformio.org/',
                tutorial: 'PlatformIO高级调试指南'
            }
        ],
        actuator: [
            {
                name: 'STM32CubeMX',
                icon: '🔷',
                desc: 'ST官方配置工具，图形化引脚分配',
                tags: ['STM32', '官方工具', '图形化配置'],
                url: 'https://www.st.com/en/development-tools/stm32cubemx.html',
                tutorial: 'STM32电机控制快速入门'
            }
        ],
        communication: [
            {
                name: 'PuTTY',
                icon: '🖥️',
                desc: '经典串口调试工具，轻量易用',
                tags: ['串口调试', 'SSH', '免费开源'],
                url: 'https://www.putty.org/',
                tutorial: '串口调试新手教程'
            },
            {
                name: 'Wireshark',
                icon: '🦈',
                desc: '网络协议分析神器，支持多种协议',
                tags: ['协议分析', 'USB抓包', '网络调试'],
                url: 'https://www.wireshark.org/',
                tutorial: 'Wireshark入门与USB分析'
            }
        ],
        default: [
            {
                name: 'Arduino IDE',
                icon: '💚',
                desc: '最流行的嵌入式开发环境，适合入门',
                tags: ['入门推荐', '开源免费'],
                url: 'https://www.arduino.cc/en/software',
                tutorial: '新手入门第一步'
            }
        ]
    },

    getForDevice(device) {
        const type = device?.descriptor?.deviceType;
        return this.recommendations[type] || this.recommendations.default;
    },

    renderHtml(device) {
        const recs = this.getForDevice(device);

        return `
            <div class="software-recommend-section">
                <h4 style="margin-bottom:12px;">💡 推荐软件与工具</h4>
                <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
                    新手使用该设备推荐搭配以下软件
                </p>
                <div style="display:flex;flex-direction:column;gap:10px;">
                    ${recs.map(rec => `
                        <div class="software-recommend">
                            <div class="software-recommend-top"></div>
                            <div class="software-recommend-body">
                                <div class="software-recommend-icon">${rec.icon}</div>
                                <div class="software-recommend-info">
                                    <div class="software-recommend-header">
                                        <span class="software-recommend-name">${rec.name}</span>
                                        ${rec.tutorial ? `<span class="recommend-tutorial-tag">📚 新手教程</span>` : ''}
                                    </div>
                                    <div class="software-recommend-desc">${rec.desc}</div>
                                    <div class="software-recommend-tags">
                                        ${rec.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                                    </div>
                                    <div class="software-recommend-actions">
                                        <button class="btn btn-sm btn-primary">下载</button>
                                        ${rec.tutorial ? `<button class="btn btn-sm">查看教程</button>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

// ============================================================
//  18. 任务管理器 TaskManager
// ============================================================
const TaskManager = {
    tasks: [],
    maxConcurrent: 6,
    runningCount: 0,

    addTask(type, name, payload, onProgress, onComplete, onError) {
        const task = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type,
            name,
            payload,
            status: 'pending',
            progress: 0,
            result: null,
            error: null,
            createdAt: Date.now(),
            startedAt: null,
            completedAt: null,
            onProgress,
            onComplete,
            onError
        };

        this.tasks.unshift(task);
        this.processQueue();
        return task.id;
    },

    processQueue() {
        const pendingTasks = this.tasks.filter(t => t.status === 'pending');
        const availableSlots = this.maxConcurrent - this.runningCount;

        for (let i = 0; i < Math.min(availableSlots, pendingTasks.length); i++) {
            this.runTask(pendingTasks[i]);
        }
    },

    async runTask(task) {
        task.status = 'running';
        task.startedAt = Date.now();
        this.runningCount++;

        HistoryManager.addRecord(task.type, task.name, '任务开始执行', 'running');

        try {
            const result = await this.executeTask(task);
            task.status = 'completed';
            task.result = result;
            task.progress = 100;
            task.completedAt = Date.now();

            if (task.onComplete) task.onComplete(result);

            const histRec = HistoryManager.records.find(r => r.title === task.name && r.status === 'running');
            if (histRec) {
                histRec.status = 'success';
                HistoryManager.save();
                HistoryManager.render();
            }
        } catch (e) {
            task.status = 'failed';
            task.error = e.message;
            task.completedAt = Date.now();

            if (task.onError) task.onError(e);

            const histRec = HistoryManager.records.find(r => r.title === task.name && r.status === 'running');
            if (histRec) {
                histRec.status = 'failed';
                HistoryManager.save();
                HistoryManager.render();
            }
        } finally {
            this.runningCount--;
            this.processQueue();
        }
    },

    async executeTask(task) {
        for (let i = 1; i <= 10; i++) {
            await this.delay(80 + Math.random() * 100);
            task.progress = i * 10;
            if (task.onProgress) task.onProgress(task.progress);
        }

        switch (task.type) {
            case 'connect':
                return { connected: true, deviceId: task.payload?.deviceId };
            case 'vision':
                return { recognized: true, matches: [] };
            case 'data-export':
                return { exported: true, count: task.payload?.count || 0 };
            default:
                return { done: true };
        }
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    getRunningTasks() {
        return this.tasks.filter(t => t.status === 'running');
    },

    getPendingTasks() {
        return this.tasks.filter(t => t.status === 'pending');
    },

    cancelTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.status === 'pending') {
            task.status = 'cancelled';
            return true;
        }
        return false;
    },

    clearCompleted() {
        this.tasks = this.tasks.filter(t => t.status === 'running' || t.status === 'pending');
    }
};

// ============================================================
//  19. 快捷键管理器 KeyboardShortcuts
// ============================================================
const KeyboardShortcuts = {
    shortcuts: [
        { key: 'k', ctrl: true, action: () => {
            const search = document.getElementById('globalSearch');
            if (search) search.focus();
        }},
        { key: 'Enter', ctrl: true, action: () => SelfIdentification.autoConnectAll() },
        { key: 't', ctrl: true, action: () => ThemeManager.cycleTheme() },
        { key: '/', ctrl: true, action: () => AIAssistant.toggle() },
        { key: 'h', ctrl: true, action: () => HistoryManager.toggleSidebar() },
        { key: 'd', ctrl: true, shift: true, action: () => SelfIdentification.disconnectAll() }
    ],

    init() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            for (const shortcut of this.shortcuts) {
                const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
                const shiftMatch = shortcut.shift ? e.shiftKey : !shortcut.shift ? !e.shiftKey : true;
                const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

                if (ctrlMatch && shiftMatch && keyMatch) {
                    e.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        });
    }
};

// ============================================================
//  初始化
// ============================================================
async function initApp() {
    SettingsManager.init();
    await DeviceDB.init();
    UIController.init();
    VisionRecognition.init();
    AutoScanner.init();
    HelpCenter.init();
    CloudStorage.init();
    ExternalAPI.init();
    GuideTour.init();
    AIAssistant.init();
    HistoryManager.init();
    KeyboardShortcuts.init();
    FileManager.init();
    DashboardTabManager.init();
    SkillManager.init();
    DatabaseManager.init();
    NavManager.init();
    SettingsTabManager.init();

    UIController.log('info', '╔═══════════════════════════════════════════╗');
    UIController.log('info', '║  软硬件接口交互自识别系统 v2.2 已启动     ║');
    UIController.log('info', '║  支持 I2C/SPI/UART/GPIO/PWM/ADC/USB 等   ║');
    UIController.log('info', '╚═══════════════════════════════════════════╝');
    UIController.log('info', '系统就绪 — 共加载 ' + await DeviceDB.count() + ' 个设备');

    const issues = DiagnosticEngine.detectIssues();
    if (issues.length > 0) {
        UIController.log('warn', `检测到 ${issues.length} 个潜在问题，请查看帮助中心`);
    }

    HistoryManager.addRecord('system', '系统启动', '软硬件接口交互自识别系统初始化完成', 'success');

    UIController.updateStats();
}

// ============================================================
//  20. 文件管理器 FileManager
// ============================================================
const FileManager = {
    files: [],
    currentFilter: 'all',
    viewMode: 'grid',
    maxFiles: 100,
    maxSize: 50 * 1024 * 1024,

    init() {
        this.load();
        this.bindUI();
        this.render();
    },

    bindUI() {
        const typeFilter = document.getElementById('fileTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.render();
            });
        }

        const uploadInput = document.getElementById('fileUploadInput');
        if (uploadInput) {
            uploadInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
                e.target.value = '';
            });
        }

        const dropZone = document.getElementById('fileDropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                this.handleFileUpload(e.dataTransfer.files);
            });
        }
    },

    load() {
        try {
            const saved = localStorage.getItem('hsiid-files');
            this.files = saved ? JSON.parse(saved) : [];
        } catch (e) {
            this.files = [];
        }
    },

    save() {
        try {
            if (this.files.length > this.maxFiles) {
                this.files = this.files.slice(0, this.maxFiles);
            }
            localStorage.setItem('hsiid-files', JSON.stringify(this.files));
        } catch (e) {
            console.warn('文件列表保存失败:', e);
        }
    },

    handleFileUpload(fileList) {
        const files = Array.from(fileList);
        files.forEach(file => {
            if (file.size > this.maxSize) {
                alert(`文件 ${file.name} 超过大小限制 (50MB)`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    name: file.name,
                    type: this.getFileType(file),
                    size: file.size,
                    mimeType: file.type,
                    data: e.target.result,
                    uploadTime: Date.now()
                };
                this.files.unshift(fileData);
                this.save();
                this.render();
                HistoryManager.addRecord(
                    'system',
                    '文件上传',
                    `上传文件: ${file.name}`,
                    'success'
                );
            };
            reader.readAsDataURL(file);
        });
    },

    getFileType(file) {
        const name = file.name.toLowerCase();
        if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(name)) return 'image';
        if (/\.(pdf|doc|docx|txt|md|xls|xlsx|ppt|pptx)$/.test(name)) return 'document';
        if (/\.(zip|rar|7z|tar|gz)$/.test(name)) return 'archive';
        if (/\.(ino|cpp|c|h|py|js|ts|java|go|rs)$/.test(name)) return 'code';
        if (/\.(hex|bin|elf|uf2)$/.test(name)) return 'firmware';
        return 'other';
    },

    getFileIcon(type) {
        const icons = {
            image: '🖼️',
            document: '📄',
            archive: '📦',
            code: '💻',
            firmware: '🔧',
            other: '📁'
        };
        return icons[type] || icons.other;
    },

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    deleteFile(id) {
        if (!confirm('确定要删除这个文件吗？')) return;
        this.files = this.files.filter(f => f.id !== id);
        this.save();
        this.render();
    },

    clearAll() {
        if (!confirm('确定要清空所有文件吗？')) return;
        this.files = [];
        this.save();
        this.render();
    },

    downloadFile(id) {
        const file = this.files.find(f => f.id === id);
        if (!file) return;
        const a = document.createElement('a');
        a.href = file.data;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    compressAndDownload() {
        if (this.files.length === 0) {
            alert('没有可压缩的文件');
            return;
        }

        const data = {
            version: '1.0',
            exportTime: new Date().toISOString(),
            fileCount: this.files.length,
            files: this.files
        };

        const dataStr = JSON.stringify(data);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `文件备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        HistoryManager.addRecord(
            'system',
            '文件打包',
            `打包下载 ${this.files.length} 个文件`,
            'success'
        );
    },

    getFiltered() {
        if (this.currentFilter === 'all') return [...this.files];
        return this.files.filter(f => f.type === this.currentFilter);
    },

    render() {
        const listEl = document.getElementById('fileList');
        const gridEl = document.getElementById('fileGrid');
        const countEl = document.getElementById('fileCount');
        
        if (countEl) countEl.textContent = this.files.length;
        
        if (!listEl && !gridEl) return;

        const filtered = this.getFiltered();

        if (filtered.length === 0) {
            if (listEl) {
                listEl.innerHTML = `
                    <div class="file-list-empty">
                        <span>📁</span>
                        <p>暂无文件，拖拽或点击上传</p>
                    </div>
                `;
            }
            if (gridEl) {
                gridEl.innerHTML = `
                    <div class="file-grid-empty">
                        <span style="font-size:48px;">📁</span>
                        <p style="color:var(--text-muted);margin-top:12px;">暂无文件</p>
                    </div>
                `;
            }
            return;
        }

        if (listEl) {
            listEl.innerHTML = filtered.map(f => `
                <div class="file-item">
                    <div class="file-item-icon">${this.getFileIcon(f.type)}</div>
                    <div class="file-item-info">
                        <div class="file-item-name">${this.escapeHtml(f.name)}</div>
                        <div class="file-item-meta">${this.formatSize(f.size)} · ${new Date(f.uploadTime).toLocaleString('zh-CN')}</div>
                    </div>
                    <div class="file-item-actions">
                        <button class="btn btn-outline btn-xs" onclick="FileManager.downloadFile('${f.id}')">下载</button>
                        <button class="btn btn-danger btn-xs" onclick="FileManager.deleteFile('${f.id}')">删除</button>
                    </div>
                </div>
            `).join('');
        }

        if (gridEl) {
            gridEl.innerHTML = filtered.map(f => {
                const isImage = f.type === 'image';
                return `
                    <div class="file-grid-item">
                        <div class="file-grid-thumb">
                            ${isImage ? `<img src="${f.data}" alt="${this.escapeHtml(f.name)}">` : this.getFileIcon(f.type)}
                        </div>
                        <div class="file-grid-info">
                            <div class="file-grid-name" title="${this.escapeHtml(f.name)}">${this.escapeHtml(f.name)}</div>
                            <div class="file-grid-meta">${this.formatSize(f.size)}</div>
                        </div>
                        <div class="file-grid-actions">
                            <button class="btn btn-outline btn-xs" style="flex:1" onclick="FileManager.downloadFile('${f.id}')">下载</button>
                            <button class="btn btn-danger btn-xs" style="flex:1" onclick="FileManager.deleteFile('${f.id}')">删除</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// ============================================================
//  21. 控制台Tab管理器 DashboardTabManager
// ============================================================
const DashboardTabManager = {
    currentTab: 'bus',

    init() {
        this.bindUI();
    },

    bindUI() {
        document.querySelectorAll('.dashboard-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.dashboardTab);
            });
        });
    },

    switchTab(tabName) {
        this.currentTab = tabName;

        document.querySelectorAll('.dashboard-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.dashboardTab === tabName);
        });

        document.querySelectorAll('.dashboard-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === 'dashboard-' + tabName);
        });
    }
};

// ============================================================
//  22. Skills 管理器 SkillManager
// ============================================================
const SkillManager = {
    skills: {
        autoScan: {
            id: 'autoScan',
            name: '自动扫描',
            icon: '🔍',
            desc: '自动检测新接入的硬件设备，实时更新总线状态',
            enabled: true,
            category: 'core'
        },
        vision: {
            id: 'vision',
            name: '图像识别',
            icon: '🖼️',
            desc: '通过拍照或上传图片智能识别硬件设备类型',
            enabled: true,
            category: 'ai'
        },
        aiAssistant: {
            id: 'aiAssistant',
            name: 'AI助手',
            icon: '🤖',
            desc: '智能对话助手，提供故障诊断和优化建议',
            enabled: true,
            category: 'ai'
        },
        workflow: {
            id: 'workflow',
            name: '工作流编辑器',
            icon: '🔀',
            desc: '可视化搭建自动化工作流程，自定义识别链路',
            enabled: false,
            category: 'advanced'
        },
        cloudSync: {
            id: 'cloudSync',
            name: '云端同步',
            icon: '☁️',
            desc: '设备库云端同步，支持多设备数据共享与更新',
            enabled: false,
            category: 'data'
        },
        batchOps: {
            id: 'batchOps',
            name: '批量操作',
            icon: '📦',
            desc: '批量连接、识别、配置多台硬件设备',
            enabled: false,
            category: 'advanced'
        },
        scriptEngine: {
            id: 'scriptEngine',
            name: '脚本引擎',
            icon: '📜',
            desc: '支持自定义脚本控制硬件行为与数据处理',
            enabled: false,
            category: 'advanced'
        },
        dataExport: {
            id: 'dataExport',
            name: '数据导出',
            icon: '📊',
            desc: '导出设备数据为多种格式，支持第三方分析',
            enabled: true,
            category: 'data'
        },
        keyboardShortcuts: {
            id: 'keyboardShortcuts',
            name: '快捷键支持',
            icon: '⌨️',
            desc: '丰富的键盘快捷键，提升操作效率',
            enabled: true,
            category: 'core'
        },
        history: {
            id: 'history',
            name: '历史记录',
            icon: '📋',
            desc: '记录所有操作历史，支持搜索、回放与重命名',
            enabled: true,
            category: 'core'
        }
    },

    init() {
        this.load();
    },

    load() {
        try {
            const saved = localStorage.getItem('hsiid-skills');
            if (saved) {
                const savedSkills = JSON.parse(saved);
                Object.keys(savedSkills).forEach(id => {
                    if (this.skills[id]) {
                        this.skills[id].enabled = savedSkills[id];
                    }
                });
            }
        } catch (e) {
            console.warn('Skills加载失败:', e);
        }
    },

    save() {
        try {
            const data = {};
            Object.keys(this.skills).forEach(id => {
                data[id] = this.skills[id].enabled;
            });
            localStorage.setItem('hsiid-skills', JSON.stringify(data));
        } catch (e) {
            console.warn('Skills保存失败:', e);
        }
    },

    isEnabled(id) {
        return this.skills[id]?.enabled ?? false;
    },

    toggle(id) {
        if (!this.skills[id]) return false;
        this.skills[id].enabled = !this.skills[id].enabled;
        this.save();
        this.applySkill(id);
        return this.skills[id].enabled;
    },

    applySkill(id) {
        const enabled = this.skills[id].enabled;
        switch (id) {
            case 'autoScan':
                if (enabled) {
                    AutoScanner.start();
                } else {
                    AutoScanner.stop();
                }
                break;
            case 'aiAssistant':
                const aiBtn = document.getElementById('aiFabBtn');
                if (aiBtn) aiBtn.style.display = enabled ? 'flex' : 'none';
                break;
            case 'history':
                const historyBtn = document.getElementById('historyToggleBtn');
                if (historyBtn) historyBtn.style.display = enabled ? 'flex' : 'none';
                break;
        }
    },

    getByCategory(category) {
        return Object.values(this.skills).filter(s => s.category === category);
    },

    renderHtml() {
        const categories = [
            { id: 'core', name: '核心功能', icon: '⚡' },
            { id: 'ai', name: 'AI能力', icon: '🤖' },
            { id: 'data', name: '数据管理', icon: '💾' },
            { id: 'advanced', name: '高级功能', icon: '🔧' }
        ];

        return categories.map(cat => {
            const skills = this.getByCategory(cat.id);
            return `
                <div style="margin-bottom:24px;">
                    <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;color:var(--text-secondary);">
                        ${cat.icon} ${cat.name}
                    </h3>
                    <div class="skills-grid">
                        ${skills.map(skill => `
                            <div class="skill-card ${skill.enabled ? 'enabled' : ''}">
                                <div class="skill-card-header">
                                    <div class="skill-card-icon">${skill.icon}</div>
                                    <label class="switch">
                                        <input type="checkbox" ${skill.enabled ? 'checked' : ''} 
                                               onchange="SkillManager.toggle('${skill.id}'); this.closest('.skill-card').classList.toggle('enabled', this.checked);">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="skill-card-title">${skill.name}</div>
                                <div class="skill-card-desc">${skill.desc}</div>
                                <div class="skill-card-footer">
                                    <span class="skill-status ${skill.enabled ? 'enabled' : 'disabled'}">
                                        <span style="width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block;"></span>
                                        ${skill.enabled ? '已启用' : '未启用'}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }
};

// ============================================================
//  23. 数据库管理器 DatabaseManager
// ============================================================
const DatabaseManager = {
    syncUrl: '',
    lastSyncTime: null,
    syncStatus: 'idle',

    init() {
        this.loadConfig();
    },

    loadConfig() {
        try {
            const saved = localStorage.getItem('hsiid-db-config');
            if (saved) {
                const config = JSON.parse(saved);
                this.syncUrl = config.syncUrl || '';
                this.lastSyncTime = config.lastSyncTime || null;
            }
        } catch (e) {
            console.warn('数据库配置加载失败:', e);
        }
    },

    saveConfig() {
        try {
            localStorage.setItem('hsiid-db-config', JSON.stringify({
                syncUrl: this.syncUrl,
                lastSyncTime: this.lastSyncTime
            }));
        } catch (e) {
            console.warn('数据库配置保存失败:', e);
        }
    },

    async generateBatchDevices(count = 100) {
        const categories = ['传感器', '执行器', '通信模块', '处理器', '存储器', '电源管理', '显示模块'];
        const interfaces = ['I2C', 'SPI', 'UART', 'GPIO', 'PWM', 'ADC', 'USB', 'I2S', 'CAN'];
        const deviceTypes = ['sensor', 'actuator', 'communication', 'processor', 'memory', 'power', 'display'];
        
        const manufacturers = ['Arduino', 'Raspberry Pi', 'Espressif', 'STMicroelectronics', 'Texas Instruments', 
                               'NXP', 'Microchip', 'Bosch', 'ADI', 'Maxim', 'Nordic', 'Silicon Labs'];
        
        const sensorNames = ['温湿度传感器', '加速度计', '陀螺仪', '磁力计', '气压传感器', '光照传感器', 
                             '距离传感器', '心率传感器', '土壤湿度传感器', '气体传感器', '颜色传感器', '触控传感器'];
        
        const actuatorNames = ['直流电机驱动', '步进电机驱动', '舵机控制器', '继电器模块', 'LED驱动', 
                               '蜂鸣器模块', '振动马达', '电磁阀控制', '散热风扇', '显示屏背光'];
        
        const commNames = ['WiFi模块', '蓝牙模块', 'ZigBee模块', 'LoRa模块', 'NB-IoT模块', '4G模块',
                           '以太网模块', 'CAN总线模块', 'RS485模块', 'USB转串口'];

        const newDevices = [];
        
        for (let i = 0; i < count; i++) {
            const typeIndex = Math.floor(Math.random() * deviceTypes.length);
            const type = deviceTypes[typeIndex];
            const category = categories[typeIndex];
            const iface = interfaces[Math.floor(Math.random() * interfaces.length)];
            const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
            
            let nameList;
            if (type === 'sensor') nameList = sensorNames;
            else if (type === 'actuator') nameList = actuatorNames;
            else if (type === 'communication') nameList = commNames;
            else nameList = sensorNames.concat(actuatorNames, commNames);
            
            const baseName = nameList[Math.floor(Math.random() * nameList.length)];
            const model = `${manufacturer.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
            
            const device = {
                id: 'dev_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 5),
                name: `${manufacturer} ${baseName}`,
                icon: this.getIconForType(type),
                category: category,
                manufacturer: manufacturer,
                model: model,
                description: `${baseName}模块，支持${iface}接口，适用于工业控制、物联网、智能家居等场景。`,
                descriptor: {
                    vendorId: '0x' + Math.floor(Math.random() * 65535).toString(16).padStart(4, '0'),
                    productId: '0x' + Math.floor(Math.random() * 65535).toString(16).padStart(4, '0'),
                    deviceType: type,
                    interface: iface,
                    protocol: this.getProtocolForInterface(iface),
                    model: model,
                    serialNumber: 'SN' + Math.floor(Math.random() * 999999999).toString().padStart(9, '0'),
                    firmwareVersion: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`
                },
                specs: {
                    voltage: `${Math.floor(Math.random() * 5) + 1.8}V`,
                    current: `${Math.floor(Math.random() * 200 + 10)}mA`,
                    frequency: `${Math.floor(Math.random() * 100 + 1)}MHz`,
                    resolution: `${Math.floor(Math.random() * 16 + 8)}bit`
                },
                createdAt: Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
            };
            
            newDevices.push(device);
        }
        
        for (const device of newDevices) {
            await DeviceDB.add(device);
        }
        
        HistoryManager.addRecord(
            'system',
            '批量生成设备',
            `成功生成并添加 ${count} 个设备到数据库`,
            'success'
        );
        
        return newDevices.length;
    },

    getIconForType(type) {
        const icons = {
            sensor: '🌡️',
            actuator: '⚙️',
            communication: '📡',
            processor: '💻',
            memory: '💾',
            power: '🔋',
            display: '🖥️'
        };
        return icons[type] || '📦';
    },

    getProtocolForInterface(iface) {
        const protocols = {
            'I2C': 'I2C SMBus v3.0',
            'SPI': 'SPI Mode 0/1/2/3',
            'UART': 'UART 115200 8N1',
            'GPIO': 'GPIO Push-Pull',
            'PWM': 'PWM 8bit/16bit',
            'ADC': 'ADC SAR 12bit',
            'USB': 'USB 2.0 HS',
            'I2S': 'I2S Philips',
            'CAN': 'CAN 2.0B'
        };
        return protocols[iface] || 'Custom';
    },

    async syncFromCloud() {
        if (!this.syncUrl) {
            return { success: false, message: '请先配置云端同步地址' };
        }

        this.syncStatus = 'syncing';
        this.updateSyncUI();

        try {
            const response = await fetch(this.syncUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) throw new Error('网络请求失败');
            
            const data = await response.json();
            const devices = data.devices || [];
            
            let added = 0;
            let updated = 0;
            
            for (const device of devices) {
                const existing = await DeviceDB.getById(device.id);
                if (existing) {
                    await DeviceDB.update(device);
                    updated++;
                } else {
                    await DeviceDB.add(device);
                    added++;
                }
            }
            
            this.lastSyncTime = Date.now();
            this.saveConfig();
            this.syncStatus = 'synced';
            this.updateSyncUI();
            
            HistoryManager.addRecord(
                'system',
                '云端同步',
                `同步完成：新增 ${added} 个，更新 ${updated} 个设备`,
                'success'
            );
            
            return { success: true, added, updated };
        } catch (e) {
            this.syncStatus = 'error';
            this.updateSyncUI();
            return { success: false, message: e.message };
        }
    },

    simulateCloudSync() {
        this.syncStatus = 'syncing';
        this.updateSyncUI();
        
        setTimeout(async () => {
            const count = Math.floor(Math.random() * 50) + 20;
            await this.generateBatchDevices(count);
            this.lastSyncTime = Date.now();
            this.saveConfig();
            this.syncStatus = 'synced';
            this.updateSyncUI();
        }, 2000);
    },

    updateSyncUI() {
        const statusEl = document.getElementById('syncStatus');
        if (!statusEl) return;
        
        statusEl.className = 'sync-status ' + this.syncStatus;
        const labels = {
            idle: '未同步',
            syncing: '同步中...',
            synced: '已同步',
            error: '同步失败'
        };
        statusEl.innerHTML = `<span class="status-dot"></span><span>${labels[this.syncStatus] || '未知'}</span>`;
    },

    formatLastSync() {
        if (!this.lastSyncTime) return '从未同步';
        const date = new Date(this.lastSyncTime);
        return date.toLocaleString('zh-CN');
    }
};

// ============================================================
//  24. 工作流编辑器 WorkflowEditor
// ============================================================
const WorkflowEditor = {
    nodes: [],
    connections: [],
    selectedNode: null,
    dragState: null,
    nextNodeId: 1,

    nodeTypes: {
        start: { name: '开始', icon: '▶️', color: '#10b981', inputs: 0, outputs: 1, category: 'flow' },
        end: { name: '结束', icon: '⏹️', color: '#ef4444', inputs: 1, outputs: 0, category: 'flow' },
        connect: { name: '设备连接', icon: '🔌', color: '#3b82f6', inputs: 1, outputs: 1, category: 'device' },
        identify: { name: '自识别', icon: '🔍', color: '#8b5cf6', inputs: 1, outputs: 1, category: 'device' },
        readData: { name: '读取数据', icon: '📊', color: '#06b6d4', inputs: 1, outputs: 1, category: 'data' },
        writeData: { name: '写入数据', icon: '✏️', color: '#f59e0b', inputs: 1, outputs: 1, category: 'data' },
        vision: { name: '图像识别', icon: '🖼️', color: '#ec4899', inputs: 0, outputs: 1, category: 'ai' },
        aiAnalyze: { name: 'AI分析', icon: '🤖', color: '#a78bfa', inputs: 1, outputs: 1, category: 'ai' },
        condition: { name: '条件判断', icon: '🔀', color: '#f97316', inputs: 1, outputs: 2, category: 'logic' },
        delay: { name: '延时等待', icon: '⏳', color: '#64748b', inputs: 1, outputs: 1, category: 'flow' },
        notify: { name: '通知提醒', icon: '🔔', color: '#eab308', inputs: 1, outputs: 1, category: 'output' },
        log: { name: '日志记录', icon: '📝', color: '#14b8a6', inputs: 1, outputs: 1, category: 'output' }
    },

    init() {
        this.bindCanvas();
    },

    bindCanvas() {
        const canvas = document.getElementById('workflowCanvas');
        if (!canvas) return;

        canvas.addEventListener('click', (e) => {
            if (e.target === canvas || e.target.classList.contains('workflow-canvas-empty')) {
                this.deselectNode();
            }
        });

        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvas.classList.add('drag-over');
        });

        canvas.addEventListener('dragleave', (e) => {
            if (e.target === canvas) {
                canvas.classList.remove('drag-over');
            }
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            canvas.classList.remove('drag-over');
            this.handleDrop(e);
        });
    },

    handleDrop(e) {
        const nodeType = e.dataTransfer.getData('nodeType');
        if (!nodeType || !this.nodeTypes[nodeType]) return;

        const canvas = document.getElementById('workflowCanvas');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - 80;
        const y = e.clientY - rect.top - 30;

        this.addNode(nodeType, Math.max(0, x), Math.max(0, y));
    },

    addNode(type, x, y) {
        const nodeType = this.nodeTypes[type];
        if (!nodeType) return null;

        const node = {
            id: 'node_' + this.nextNodeId++,
            type: type,
            x: x,
            y: y,
            name: nodeType.name,
            config: {}
        };

        this.nodes.push(node);
        this.render();
        this.selectNode(node.id);
        return node;
    },

    removeNode(id) {
        this.nodes = this.nodes.filter(n => n.id !== id);
        this.connections = this.connections.filter(c => c.from !== id && c.to !== id);
        if (this.selectedNode === id) this.selectedNode = null;
        this.render();
    },

    selectNode(id) {
        this.selectedNode = id;
        this.render();
        this.renderProperties();
    },

    deselectNode() {
        this.selectedNode = null;
        this.render();
        this.renderProperties();
    },

    startDrag(id, offsetX, offsetY) {
        this.dragState = { id, offsetX, offsetY };
    },

    moveNode(x, y) {
        if (!this.dragState) return;
        const node = this.nodes.find(n => n.id === this.dragState.id);
        if (node) {
            node.x = x - this.dragState.offsetX;
            node.y = y - this.dragState.offsetY;
            this.render();
        }
    },

    endDrag() {
        this.dragState = null;
    },

    render() {
        const canvas = document.getElementById('workflowCanvas');
        if (!canvas) return;

        const countEl = document.getElementById('nodeCount');
        if (countEl) countEl.textContent = this.nodes.length;

        const emptyState = canvas.querySelector('.workflow-canvas-empty');
        
        if (this.nodes.length === 0) {
            canvas.innerHTML = `
                <div class="workflow-canvas-empty">
                    <div class="workflow-canvas-empty-icon">🔀</div>
                    <div style="font-size:14px;font-weight:500;margin-bottom:4px;">开始创建工作流</div>
                    <div style="font-size:12px;color:var(--text-muted);">从左侧拖拽节点到此画布</div>
                </div>
            `;
            this.renderProperties();
            return;
        }

        let html = '';
        
        for (const node of this.nodes) {
            const type = this.nodeTypes[node.type];
            const isSelected = this.selectedNode === node.id;
            
            html += `
                <div class="workflow-node ${isSelected ? 'selected' : ''}" 
                     style="left:${node.x}px;top:${node.y}px;"
                     data-id="${node.id}"
                     onmousedown="WorkflowEditor.startDrag('${node.id}', event.offsetX, event.offsetY)"
                     onclick="event.stopPropagation(); WorkflowEditor.selectNode('${node.id}')">
                    ${type.inputs > 0 ? `<div class="workflow-node-port input" title="输入"></div>` : ''}
                    <div class="workflow-node-header">
                        <span class="workflow-node-icon">${type.icon}</span>
                        <span>${node.name}</span>
                    </div>
                    <div class="workflow-node-body">${type.name}节点</div>
                    ${type.outputs > 0 ? `<div class="workflow-node-port output" title="输出"></div>` : ''}
                </div>
            `;
        }

        canvas.innerHTML = html;
        this.setupDragListeners();
    },

    setupDragListeners() {
        const canvas = document.getElementById('workflowCanvas');
        if (!canvas) return;

        document.addEventListener('mousemove', (e) => {
            if (this.dragState) {
                const rect = canvas.getBoundingClientRect();
                this.moveNode(e.clientX - rect.left, e.clientY - rect.top);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.dragState) {
                this.endDrag();
            }
        });
    },

    renderProperties() {
        const propsPanel = document.getElementById('workflowProperties');
        if (!propsPanel) return;

        if (!this.selectedNode) {
            propsPanel.innerHTML = `
                <div class="workflow-properties-title">属性面板</div>
                <div class="workflow-properties-empty">
                    选择一个节点<br>查看和编辑属性
                </div>
            `;
            return;
        }

        const node = this.nodes.find(n => n.id === this.selectedNode);
        if (!node) return;

        const type = this.nodeTypes[node.type];

        propsPanel.innerHTML = `
            <div class="workflow-properties-title">节点属性</div>
            <div style="margin-bottom:16px;">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">节点类型</div>
                <div style="font-size:14px;font-weight:500;display:flex;align-items:center;gap:8px;">
                    <span style="font-size:18px;">${type.icon}</span>
                    ${type.name}
                </div>
            </div>
            <div style="margin-bottom:16px;">
                <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">节点名称</label>
                <input type="text" class="text-input" style="width:100%;" value="${node.name}" 
                       onchange="WorkflowEditor.updateNodeName('${node.id}', this.value)">
            </div>
            <div style="margin-bottom:16px;">
                <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">节点ID</label>
                <div style="font-size:12px;font-family:monospace;background:var(--bg-tertiary);padding:6px 8px;border-radius:4px;">
                    ${node.id}
                </div>
            </div>
            <div style="display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" style="flex:1;" onclick="WorkflowEditor.duplicateNode('${node.id}')">
                    复制
                </button>
                <button class="btn btn-danger btn-sm" style="flex:1;" onclick="WorkflowEditor.removeNode('${node.id}')">
                    删除
                </button>
            </div>
        `;
    },

    updateNodeName(id, name) {
        const node = this.nodes.find(n => n.id === id);
        if (node) {
            node.name = name;
            this.render();
        }
    },

    duplicateNode(id) {
        const node = this.nodes.find(n => n.id === id);
        if (!node) return;
        
        this.addNode(node.type, node.x + 30, node.y + 30);
    },

    clearCanvas() {
        if (this.nodes.length === 0) return;
        if (!confirm('确定要清空画布吗？所有节点和连线都将被删除。')) return;
        
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.nextNodeId = 1;
        this.render();
    },

    saveWorkflow(name) {
        const workflow = {
            id: 'wf_' + Date.now(),
            name: name || '未命名工作流',
            nodes: this.nodes,
            connections: this.connections,
            createdAt: Date.now()
        };
        
        try {
            const saved = localStorage.getItem('hsiid-workflows');
            const workflows = saved ? JSON.parse(saved) : [];
            workflows.push(workflow);
            localStorage.setItem('hsiid-workflows', JSON.stringify(workflows));
            return workflow;
        } catch (e) {
            console.warn('工作流保存失败:', e);
            return null;
        }
    },

    renderPalette() {
        const categories = [
            { id: 'flow', name: '流程控制', icon: '🔀' },
            { id: 'device', name: '设备操作', icon: '📦' },
            { id: 'data', name: '数据处理', icon: '📊' },
            { id: 'ai', name: 'AI能力', icon: '🤖' },
            { id: 'logic', name: '逻辑判断', icon: '⚖️' },
            { id: 'output', name: '输出动作', icon: '📤' }
        ];

        return categories.map(cat => {
            const types = Object.entries(this.nodeTypes).filter(([k, v]) => v.category === cat.id);
            if (types.length === 0) return '';
            
            return `
                <div style="margin-bottom:16px;">
                    <div class="workflow-palette-title">${cat.icon} ${cat.name}</div>
                    ${types.map(([key, type]) => `
                        <div class="workflow-palette-item" draggable="true"
                             ondragstart="event.dataTransfer.setData('nodeType', '${key}')"
                             onclick="WorkflowEditor.addNode('${key}', 100, 100 + Math.random() * 200)">
                            <span class="workflow-palette-icon">${type.icon}</span>
                            <span>${type.name}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }).join('');
    }
};

// ============================================================
//  25. 设置标签管理器 SettingsTabManager
// ============================================================
const SettingsTabManager = {
    currentTab: 'appearance',
    _skillsInited: false,
    _appearanceInited: false,

    init() {
        this.bindUI();
        this.ensureSkillsPanel();
        this.ensureAppearancePanel();
    },

    bindUI() {
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.settingsTab);
            });
        });
    },

    switchTab(tabName) {
        this.currentTab = tabName;

        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.settingsTab === tabName);
        });

        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.settingsPanel === tabName);
        });

        if (tabName === 'skills') {
            this.ensureSkillsPanel();
        }
        if (tabName === 'appearance') {
            this.ensureAppearancePanel();
        }
    },

    ensureSkillsPanel() {
        if (this._skillsInited) return;
        const skillsPanel = document.querySelector('[data-settings-panel="skills"]');
        if (skillsPanel && skillsPanel.children.length === 0) {
            skillsPanel.innerHTML = SkillManager.renderHtml();
            this._skillsInited = true;
        } else if (skillsPanel && skillsPanel.querySelector('.skill-card')) {
            this._skillsInited = true;
        }
    },

    ensureAppearancePanel() {
        if (this._appearanceInited) return;
        const themeGrid = document.getElementById('themeGrid');
        if (themeGrid && themeGrid.children.length === 0) {
            ThemeManager.renderThemeGrid();
            this._appearanceInited = true;
        } else if (themeGrid && themeGrid.querySelector('.theme-card')) {
            this._appearanceInited = true;
        }
    }
};

// ============================================================
//  26. 新版导航管理器 NavManager
// ============================================================
const NavManager = {
    currentPage: 'dashboard',

    pageInfo: {
        dashboard: { title: '控制台', subtitle: '实时监控硬件接口状态与数据流' },
        devices: { title: '设备库', subtitle: '浏览所有硬件设备，连接到总线进行自识别' },
        workflow: { title: '工作流', subtitle: '可视化搭建自动化识别与控制流程' },
        settings: { title: '设置', subtitle: '自定义系统外观、功能与数据管理' },
        help: { title: '帮助中心', subtitle: '新手入门教程、常见问题与使用技巧' }
    },

    init() {
        this.bindUI();
    },

    bindUI() {
        document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchPage(btn.dataset.tab);
            });
        });

        document.querySelectorAll('.nav-tab[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchPage(btn.dataset.tab);
            });
        });
    },

    switchPage(pageName) {
        if (!this.pageInfo[pageName]) return;
        
        this.currentPage = pageName;

        document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === pageName);
        });

        document.querySelectorAll('.nav-tab[data-tab]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === pageName);
        });

        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === 'page-' + pageName);
        });

        const info = this.pageInfo[pageName];
        const titleEl = document.getElementById('pageTitle');
        const subtitleEl = document.getElementById('pageSubtitle');
        if (titleEl) titleEl.textContent = info.title;
        if (subtitleEl) subtitleEl.textContent = info.subtitle;

        if (pageName === 'workflow') {
            setTimeout(() => {
                WorkflowEditor.render();
                const palette = document.getElementById('workflowPalette');
                if (palette) palette.innerHTML = WorkflowEditor.renderPalette();
                WorkflowEditor.init();
            }, 50);
        }

        if (pageName === 'devices') {
            setTimeout(() => {
                if (UIController.refreshDeviceLibrary) {
                    UIController.refreshDeviceLibrary();
                }
            }, 50);
        }

        if (pageName === 'help') {
            setTimeout(() => {
                const helpContent = document.getElementById('helpContent');
                if (helpContent && helpContent.children.length === 0) {
                    HelpCenter.showSection(HelpCenter.currentSection || 'getting-started');
                }
            }, 50);
        }
    }
};

// 导出到全局供HTML onclick使用
window.SelfIdentification = SelfIdentification;
window.UIController = UIController;
window.VisionRecognition = VisionRecognition;
window.DeviceDB = DeviceDB;
window.DiagnosticEngine = DiagnosticEngine;
window.HelpCenter = HelpCenter;
window.CloudStorage = CloudStorage;
window.AutoScanner = AutoScanner;
window.ExternalAPI = ExternalAPI;
window.GuideTour = GuideTour;
window.AIAssistant = AIAssistant;
window.HistoryManager = HistoryManager;
window.SoftwareRecommend = SoftwareRecommend;
window.TaskManager = TaskManager;
window.SettingsManager = SettingsManager;
window.KeyboardShortcuts = KeyboardShortcuts;
window.FileManager = FileManager;
window.DashboardTabManager = DashboardTabManager;
window.SkillManager = SkillManager;
window.DatabaseManager = DatabaseManager;
window.WorkflowEditor = WorkflowEditor;
window.SettingsTabManager = SettingsTabManager;
window.NavManager = NavManager;

// 启动
document.addEventListener('DOMContentLoaded', initApp);
