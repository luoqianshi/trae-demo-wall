/**
 * simulation.js - 模拟房间状态模块
 * 包含：设备状态同步、昼夜模式、运行时间追踪、蒸汽效果等
 */

// 更新智能音箱状态
function updateSpeakers(on, partyMode = false) {
    const speakers = document.querySelectorAll('.sim-speaker');
    speakers.forEach(s => {
        if (on) {
            s.classList.add('on');
            if (partyMode) s.classList.add('party-mode');
            else s.classList.remove('party-mode');
        } else {
            s.classList.remove('on', 'party-mode');
        }
    });
}

// 初始化运行时间追踪
function initRuntimeTracking(app) {
    updateRuntimeDisplays(app);
    // 每秒更新一次运行时间
    app.runtimeTimer = setInterval(() => updateRuntimeDisplays(app), 1000);
}

// 格式化运行时长（毫秒 -> "MM:SS" 或 "HH:MM:SS"）
function formatRuntime(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 更新所有运行时间显示
function updateRuntimeDisplays(app) {
    const now = Date.now();
    // 更新所有空调的运行时间显示
    app.devices.forEach(device => {
        if (device.type === 'ac' && device.on && device.startedAt) {
            const runtime = formatRuntime(now - device.startedAt);
            // 查找对应的空调 DOM 元素
            const simAc = document.querySelector(`.sim-ac[data-device-id="${device.id}"]`);
            if (simAc) {
                const runtimeEl = simAc.querySelector('.sim-ac-runtime');
                if (runtimeEl) {
                    runtimeEl.textContent = runtime;
                }
            }
        }
    });
}

// 更新昼夜背景模式
function updateDayNightMode(app) {
    const currentIsDaytime = checkDaytime();
    
    // 只在昼夜状态变化时更新
    if (currentIsDaytime !== app.isDaytime) {
        app.isDaytime = currentIsDaytime;
        
        // 获取所有模拟房间视图
        const roomViews = document.querySelectorAll('.sim-room-view');
        
        roomViews.forEach(roomView => {
            if (app.isDaytime) {
                roomView.classList.remove('night');
                roomView.classList.add('day');
            } else {
                roomView.classList.remove('day');
                roomView.classList.add('night');
            }
        });
    }
}

// 根据色温计算颜色（线性插值）
function getColorTempColor(colorTemp) {
    // 3000K（暖光）: #fbbf24 偏黄
    // 4000K（中性）: #fef3c7
    // 6000K（冷光）: #e0f2fe 偏白
    const colors = {
        3000: { r: 251, g: 191, b: 36 },   // #fbbf24
        4000: { r: 254, g: 243, b: 199 },  // #fef3c7
        6000: { r: 224, g: 242, b: 254 }   // #e0f2fe
    };

    let r, g, b;

    if (colorTemp <= 4000) {
        // 从3000K到4000K插值
        const t = (colorTemp - 3000) / (4000 - 3000);
        r = Math.round(colors[3000].r + t * (colors[4000].r - colors[3000].r));
        g = Math.round(colors[3000].g + t * (colors[4000].g - colors[3000].g));
        b = Math.round(colors[3000].b + t * (colors[4000].b - colors[3000].b));
    } else {
        // 从4000K到6000K插值
        const t = (colorTemp - 4000) / (6000 - 4000);
        r = Math.round(colors[4000].r + t * (colors[6000].r - colors[4000].r));
        g = Math.round(colors[4000].g + t * (colors[6000].g - colors[4000].g));
        b = Math.round(colors[4000].b + t * (colors[6000].b - colors[4000].b));
    }

    return `rgb(${r}, ${g}, ${b})`;
}

// 获取空气质量等级（模拟数据）
function getAqiLevel() {
    // 可根据实际空气质量数据动态返回
    // excellent: 优（0-50），good: 良（51-100），moderate: 中度（101-150），poor: 差（151+）
    // 这里默认返回excellent（优），绿色指示灯
    return 'excellent';
}

// 计算空调风速等级
function getWindSpeedLevel(temperature) {
    const roomTemp = 24; // 室温24°C
    const tempDiff = Math.abs(temperature - roomTemp);

    if (tempDiff <= 2) {
        return 'slow'; // 低风速：温度差0-2
    } else if (tempDiff <= 5) {
        return 'medium'; // 中风速：温度差3-5
    } else {
        return 'fast'; // 高风速：温度差6+
    }
}

// 更新空调风速可视化
function updateAcWindSpeed(simAc, temperature) {
    if (!simAc) return;

    const windSpeed = getWindSpeedLevel(temperature);

    // 获取所有风速粒子容器
    const windContainers = simAc.querySelectorAll('.sim-ac-wind');

    windContainers.forEach(container => {
        // 移除旧的风速类
        container.classList.remove('slow', 'medium', 'fast');
        // 添加新的风速类
        container.classList.add(windSpeed);

        // 高风速时增加粒子数量
        if (windSpeed === 'fast') {
            // 检查是否已有6个粒子，如果没有则添加
            const particles = container.querySelectorAll('.sim-wind-particle');
            if (particles.length < 6) {
                // 添加额外的粒子
                const particleEmoji = container.classList.contains('sim-ac-wind-cool') ? '❄️' : '🔥';
                for (let i = particles.length; i < 6; i++) {
                    const newParticle = document.createElement('span');
                    newParticle.className = 'sim-wind-particle';
                    newParticle.textContent = particleEmoji;
                    container.appendChild(newParticle);
                }
            }
        } else {
            // 低/中风速时保持3个粒子
            const particles = container.querySelectorAll('.sim-wind-particle');
            if (particles.length > 3) {
                // 移除多余的粒子
                for (let i = 3; i < particles.length; i++) {
                    particles[i].remove();
                }
            }
        }
    });
}

// 更新蒸汽效果
function updateSteamEffect(container, temperature) {
    const tempDiff = temperature - 40;
    const maxParticles = 8;
    const minParticles = 2;
    const particleCount = Math.min(maxParticles, Math.max(minParticles, Math.floor(minParticles + tempDiff / 3)));
    
    const currentParticles = container.querySelectorAll('.sim-steam-particle').length;
    
    if (currentParticles === particleCount) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'sim-steam-particle';
        
        const size = 6 + Math.random() * 10;
        const left = 10 + Math.random() * 30;
        const delay = Math.random() * 2;
        const duration = 2.5 + Math.random() * 1.5;
        const drift = (Math.random() - 0.5) * 20;
        
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = left + 'px';
        particle.style.animationDelay = delay + 's';
        particle.style.animationDuration = duration + 's';
        
        particle.animate([
            { transform: 'translateY(0) translateX(0) scale(0.5)', opacity: 0 },
            { transform: `translateY(-15px) translateX(${drift * 0.3}px) scale(0.8)`, opacity: 0.7, offset: 0.15 },
            { transform: `translateY(-30px) translateX(${drift * 0.6}px) scale(1.2)`, opacity: 0.5, offset: 0.5 },
            { transform: `translateY(-50px) translateX(${drift}px) scale(1.8)`, opacity: 0 }
        ], {
            duration: duration * 1000,
            iterations: Infinity,
            delay: delay * 1000,
            easing: 'ease-out'
        });
        
        container.appendChild(particle);
    }
}

// 更新模拟灯状态
function updateSimLight(elementId, lightDevice) {
    const simLight = document.getElementById(elementId);
    if (!simLight || !lightDevice) return;

    if (lightDevice.on) {
        simLight.classList.add('on');
        const lightColor = getColorTempColor(lightDevice.colorTemp || 4000);
        simLight.style.setProperty('--light-color', lightColor);
        
        const brightness = lightDevice.brightness || 50;
        const glowSize = 20 + (brightness / 100) * 100;
        const glowOpacity = 0.1 + (brightness / 100) * 0.7;
        
        const glowElement = simLight.querySelector('.sim-light-glow');
        if (glowElement) {
            glowElement.style.width = glowSize + 'px';
            glowElement.style.height = glowSize + 'px';
            glowElement.style.opacity = glowOpacity;
        }
    } else {
        simLight.classList.remove('on');
    }
}

// 更新灯光斑效果
function updateSimLightSpot(elementId, lightDevice) {
    const simLightSpot = document.getElementById(elementId);
    if (!simLightSpot || !lightDevice) return;

    if (lightDevice.on) {
        simLightSpot.classList.add('on');
        const brightness = lightDevice.brightness || 50;
        const spotWidth = 60 + (brightness / 100) * 80;
        const spotHeight = 30 + (brightness / 100) * 40;
        const spotOpacity = 0.1 + (brightness / 100) * 0.4;
        const lightColor = getColorTempColor(lightDevice.colorTemp || 4000);
        
        simLightSpot.style.width = spotWidth + 'px';
        simLightSpot.style.height = spotHeight + 'px';
        simLightSpot.style.opacity = spotOpacity;
        simLightSpot.style.background = `radial-gradient(ellipse at center, ${lightColor}40 0%, ${lightColor}20 40%, transparent 70%)`;
    } else {
        simLightSpot.classList.remove('on');
    }
}

// 更新模拟空调状态
function updateSimAc(elementId, acDevice) {
    const simAc = document.getElementById(elementId);
    if (!simAc || !acDevice) return;

    const display = simAc.querySelector('.sim-ac-display');
    if (acDevice.on) {
        simAc.classList.add('on');
        simAc.dataset.mode = acDevice.mode;
        display.textContent = acDevice.temperature + '°C';
        updateAcWindSpeed(simAc, acDevice.temperature);
    } else {
        simAc.classList.remove('on');
        display.textContent = '--°C';
    }
}

// 更新模拟房间状态（核心同步函数）
function updateSimulation(app) {
    // 客厅设备
    const livingLight = app.devices.find(d => d.room === 'living' && d.type === 'light');
    const livingAc = app.devices.find(d => d.room === 'living' && d.type === 'ac');
    const livingCurtain = app.devices.find(d => d.room === 'living' && d.type === 'curtain');
    const livingTv = app.devices.find(d => d.room === 'living' && d.type === 'tv');
    const livingLock = app.devices.find(d => d.room === 'living' && d.type === 'lock');
    const livingRobot = app.devices.find(d => d.room === 'living' && d.type === 'robot');

    // 同步 tooltip 文本（设备悬停详情提示）
    updateSimTooltip('1', livingLight);
    updateSimTooltip('2', livingAc);
    updateSimTooltip('3', livingCurtain);
    updateSimTooltip('4', livingTv);
    updateSimTooltip('8', livingLock);
    updateSimTooltip('9', livingRobot);

    // 客厅灯
    updateSimLight('sim-living-light', livingLight);

    // 客厅灯光斑
    updateSimLightSpot('sim-living-light-spot', livingLight);

    // 客厅空调
    updateSimAc('sim-living-ac', livingAc);

    // 客厅窗帘 - 开合百分比可视化
    const simLivingCurtain = document.getElementById('sim-living-curtain');
    if (simLivingCurtain) {
        const curtainLeft = simLivingCurtain.querySelector('.sim-curtain-left');
        const curtainRight = simLivingCurtain.querySelector('.sim-curtain-right');
        
        if (livingCurtain && livingCurtain.on) {
            // 获取开合百分比（0-100）
            const openPercent = livingCurtain.openPercent || 0;
            // 计算scaleY值：openPercent=100时scaleY(0.05)，openPercent=0时scaleY(1)
            // 线性映射：scaleY = 1 - (openPercent / 100) * 0.95
            const scaleY = 1 - (openPercent / 100) * 0.95;
            // opacity反映开合程度
            const opacity = 0.3 + (1 - openPercent / 100) * 0.7;
            
            if (curtainLeft) {
                curtainLeft.style.transform = `scaleY(${scaleY})`;
                curtainLeft.style.opacity = opacity;
            }
            if (curtainRight) {
                curtainRight.style.transform = `scaleY(${scaleY})`;
                curtainRight.style.opacity = opacity;
            }
            
            simLivingCurtain.classList.add('on');
        } else {
            // 窗帘关闭时恢复默认状态
            if (curtainLeft) {
                curtainLeft.style.transform = 'scaleY(1)';
                curtainLeft.style.opacity = '1';
            }
            if (curtainRight) {
                curtainRight.style.transform = 'scaleY(1)';
                curtainRight.style.opacity = '1';
            }
            simLivingCurtain.classList.remove('on');
        }
    }

    // 客厅电视
    const simLivingTv = document.getElementById('sim-living-tv');
    if (simLivingTv) {
        if (livingTv && livingTv.on) {
            simLivingTv.classList.add('on');
        } else {
            simLivingTv.classList.remove('on');
        }
    }

    // 电视光线反射
    const simLivingTvReflection = document.getElementById('sim-living-tv-reflection');
    if (simLivingTvReflection) {
        if (livingTv && livingTv.on) {
            simLivingTvReflection.classList.add('on');
            const tvVolume = livingTv.volume || 30;
            const reflectionWidth = 40 + (tvVolume / 100) * 40;
            const reflectionOpacity = 0.3 + (tvVolume / 100) * 0.7;
            simLivingTvReflection.style.width = reflectionWidth + 'px';
        } else {
            simLivingTvReflection.classList.remove('on');
        }
    }

    // 客厅智能门锁
    const simLivingLock = document.getElementById('sim-living-lock');
    if (simLivingLock) {
        const lockIcon = simLivingLock.querySelector('.sim-lock-icon');
        if (livingLock) {
            if (livingLock.on) {
                simLivingLock.classList.add('on');
                if (lockIcon) {
                    lockIcon.textContent = '🔒';
                }
                simLivingLock.classList.remove('unlocked');
            } else {
                simLivingLock.classList.remove('on');
                simLivingLock.classList.add('unlocked');
                if (lockIcon) {
                    lockIcon.textContent = '🔓';
                }
            }
        }
    }

    // 客厅扫地机器人
    const simLivingRobot = document.getElementById('sim-living-robot');
    if (simLivingRobot) {
        if (livingRobot && livingRobot.on) {
            simLivingRobot.classList.add('on');
        } else {
            simLivingRobot.classList.remove('on');
        }
    }

    // 窗帘透光效果
    const simLivingCurtainGlow = document.getElementById('sim-living-curtain-glow');
    if (simLivingCurtainGlow) {
        simLivingCurtainGlow.classList.remove('day', 'night', 'inner-light');
        
        if (app.isDaytime) {
            simLivingCurtainGlow.classList.add('day');
            const openPercent = livingCurtain ? (livingCurtain.openPercent || 0) : 0;
            const glowOpacity = 0.2 + (openPercent / 100) * 0.8;
            simLivingCurtainGlow.style.opacity = glowOpacity;
        } else {
            simLivingCurtainGlow.classList.add('night');
            if (livingLight && livingLight.on) {
                simLivingCurtainGlow.classList.add('inner-light');
                const openPercent = livingCurtain ? (livingCurtain.openPercent || 0) : 0;
                const glowOpacity = 0.1 + (openPercent / 100) * 0.6;
                const brightness = livingLight.brightness || 50;
                const finalOpacity = glowOpacity * (brightness / 100);
                simLivingCurtainGlow.style.opacity = finalOpacity;
            } else {
                simLivingCurtainGlow.style.opacity = 0;
            }
        }
    }

    // 卧室设备
    const bedroomLight = app.devices.find(d => d.room === 'bedroom' && d.type === 'light');
    const bedroomAc = app.devices.find(d => d.room === 'bedroom' && d.type === 'ac');
    const bedroomPurifier = app.devices.find(d => d.room === 'bedroom' && d.type === 'purifier');

    // 同步 tooltip 文本（设备悬停详情提示）
    updateSimTooltip('5', bedroomLight);
    updateSimTooltip('6', bedroomAc);
    updateSimTooltip('7', bedroomPurifier);

    // 卧室灯
    updateSimLight('sim-bedroom-light', bedroomLight);

    // 卧室灯光斑
    updateSimLightSpot('sim-bedroom-light-spot', bedroomLight);

    // 卧室空调
    updateSimAc('sim-bedroom-ac', bedroomAc);

    // 卧室净化器
    const simBedroomPurifier = document.getElementById('sim-bedroom-purifier');
    if (simBedroomPurifier) {
        if (bedroomPurifier && bedroomPurifier.on) {
            simBedroomPurifier.classList.add('on');
            // 根据空气质量设置指示灯颜色（模拟：优-绿色，良-黄色，差-红色）
            // 这里默认显示绿色（优），可以根据实际空气质量数据动态调整
            const aqiLevel = getAqiLevel();
            const indicatorColors = {
                excellent: '#10b981',
                good: '#fbbf24',
                moderate: '#f97316',
                poor: '#f43f5e'
            };
            simBedroomPurifier.style.setProperty('--indicator-color', indicatorColors[aqiLevel] || indicatorColors.excellent);
        } else {
            simBedroomPurifier.classList.remove('on');
        }
    }

    // 厨房设备
    const kitchenLight = app.devices.find(d => d.room === 'kitchen' && d.type === 'light');
    const kitchenFridge = app.devices.find(d => d.room === 'kitchen' && d.type === 'fridge');

    // 同步 tooltip 文本（设备悬停详情提示）
    updateSimTooltip('10', kitchenLight);
    updateSimTooltip('14', kitchenFridge);

    // 厨房灯
    updateSimLight('sim-kitchen-light', kitchenLight);

    // 厨房冰箱
    const simKitchenFridge = document.getElementById('sim-kitchen-fridge');
    if (simKitchenFridge) {
        if (kitchenFridge && kitchenFridge.on) {
            simKitchenFridge.classList.add('on');
        } else {
            simKitchenFridge.classList.remove('on');
        }
    }

    // 浴室设备
    const bathroomLight = app.devices.find(d => d.room === 'bathroom' && d.type === 'light');
    const bathroomHeater = app.devices.find(d => d.room === 'bathroom' && d.type === 'heater');
    const bathroomExhaust = app.devices.find(d => d.room === 'bathroom' && d.type === 'exhaust');

    // 同步 tooltip 文本（设备悬停详情提示）
    updateSimTooltip('11', bathroomHeater);
    updateSimTooltip('13', bathroomLight);
    updateSimTooltip('16', bathroomExhaust);

    // 浴室灯
    updateSimLight('sim-bathroom-light', bathroomLight);

    // 浴室排气扇
    const simBathroomExhaust = document.getElementById('sim-bathroom-exhaust');
    if (simBathroomExhaust) {
        if (bathroomExhaust && bathroomExhaust.on) {
            simBathroomExhaust.classList.add('on');
        } else {
            simBathroomExhaust.classList.remove('on');
        }
    }

    // 浴室热水器
    const simBathroomHeater = document.getElementById('sim-bathroom-heater');
    if (simBathroomHeater) {
        const display = simBathroomHeater.querySelector('.sim-heater-display');
        if (bathroomHeater && bathroomHeater.on) {
            simBathroomHeater.classList.add('on');
            display.textContent = bathroomHeater.temperature + '°C';
            
            // 蒸汽效果 - 温度>40°C时显示
            const steamContainer = document.getElementById('sim-steam-container');
            if (steamContainer && bathroomHeater.temperature > 40) {
                updateSteamEffect(steamContainer, bathroomHeater.temperature);
            } else if (steamContainer) {
                steamContainer.innerHTML = '';
            }
            
            // 淋浴水滴效果 - 热水器开启时显示
            const showerWater = document.getElementById('sim-shower-water');
            if (showerWater) {
                showerWater.classList.add('active');
            }
        } else {
            simBathroomHeater.classList.remove('on');
            display.textContent = '--°C';
            
            // 清除蒸汽
            const steamContainer = document.getElementById('sim-steam-container');
            if (steamContainer) {
                steamContainer.innerHTML = '';
            }
            
            // 关闭淋浴水滴
            const showerWater = document.getElementById('sim-shower-water');
            if (showerWater) {
                showerWater.classList.remove('active');
            }
        }
    }

    // 书房设备
    const studyLight = app.devices.find(d => d.room === 'study' && d.type === 'light');
    const studyComputer = app.devices.find(d => d.room === 'study' && d.type === 'computer');

    // 同步 tooltip 文本（设备悬停详情提示）
    updateSimTooltip('12', studyLight);
    updateSimTooltip('15', studyComputer);

    // 书房灯
    updateSimLight('sim-study-light', studyLight);

    // 书房电脑
    const simStudyComputer = document.getElementById('sim-study-computer');
    if (simStudyComputer) {
        if (studyComputer && studyComputer.on) {
            simStudyComputer.classList.add('on');
        } else {
            simStudyComputer.classList.remove('on');
        }
    }

    // 同步更新温湿度传感器
    updateSensors(app);
}