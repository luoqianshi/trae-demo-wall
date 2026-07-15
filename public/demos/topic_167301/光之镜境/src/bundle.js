const icons = {
    lightbulb: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
    mousePointer: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v4"/><path d="M9 3v10"/><path d="M13 3v8"/><path d="M17 7v10"/><path d="M21 11v4"/><path d="M21 15h-8"/><path d="M13 15H3"/></svg>',
    gamepad: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/><path d="M15.5 6.5 18 9"/><path d="M8.5 17.5 6 15"/><path d="M6 9h12"/><path d="M12 15V9"/></svg>',
    flask: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 2v2.6c.3.2.6.5.8.9l2.6 4A6 6 0 0 1 6.5 18H4v2h20v-2h-2.5a6 6 0 0 1-5.4-9.5l2.6-4c.2-.4.5-.7.8-.9V2z"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    arrowLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    save: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
    rulerCombined: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2"/><path d="M7 22V10"/><path d="M17 22V10"/><path d="M3 10h18"/></svg>',
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    cog: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    book: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    questionCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
    star: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    redo: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    paintBrush: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    puzzlePiece: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 12v5"/><path d="M9 9h5"/></svg>',
    qrcode: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="4" height="4" x="3" y="3"/><rect width="4" height="4" x="3" y="10"/><rect width="4" height="4" x="3" y="17"/><rect width="4" height="4" x="10" y="3"/><rect width="4" height="4" x="10" y="10"/><rect width="4" height="4" x="10" y="17"/><rect width="4" height="4" x="17" y="3"/><rect width="4" height="4" x="17" y="10"/><rect width="4" height="4" x="17" y="17"/></svg>',
    recordVinyl: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/></svg>',
    stop: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4"/></svg>',
    bookOpen: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    compare: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16V8a2 2 0 0 0-2-2H2"/><path d="M22 16V8a2 2 0 0 0-2-2H10"/><path d="M14 16v6a2 2 0 0 0 2 2h8"/><path d="M10 16v6a2 2 0 0 1-2 2H2"/></svg>',
    lock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    square: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>',
    tv: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
    circle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>',
    ban: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 8l8 8"/><path d="M16 8l-8 8"/></svg>',
    palette: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="11.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.463-.18-.902-.437-1.219-.293-.366-.438-.85-.438-1.344 0-.528.276-.987.742-1.299.466-.312.743-.79.743-1.321 0-.531-.277-.993-.743-1.305C13.322 7.795 13 7.336 13 6.805c0-.531.277-.993.742-1.305C14.223 5.178 14.5 4.719 14.5 4.188c0-.531-.277-.993-.742-1.305C13.322 2.578 13 2.119 13 1.588c0-.942.722-1.688 1.648-1.688.544 0 1.06.228 1.425.625.366.397.575.922.575 1.484 0 .531-.277.993-.742 1.305C15.322 4.195 15 4.654 15 5.188c0 .531.277.993.742 1.305.466.312.743.79.743 1.321 0 .531-.277.993-.743 1.305C15.322 9.405 15 9.864 15 10.395c0 .531.277.993.742 1.305.466.312.743.79.743 1.321 0 .531-.277.993-.743 1.305-.465.312-.742.771-.742 1.302 0 .518.266.986.693 1.305.426.319.936.504 1.485.504 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>',
    infoCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    refresh: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>'
};

const experiments = [
    { id: 1, name: '光的反射定律探究', description: '用量角器测量入射角与反射角', icon: '🔬', knowledge: 'reflect_law', elements: [
        { type: 'laser', x: 150, y: 300, rotation: 0, color: '#fbbf24', width: 30, height: 20 },
        { type: 'mirror', x: 400, y: 300, rotation: 45, width: 80, height: 12 },
        { type: 'protractor', x: 400, y: 300, rotation: 0 }
    ]},
    { id: 2, name: '镜面反射演示', description: '观察平行光在平面镜上的反射', icon: '💫', knowledge: 'mirror_reflection', elements: [
        { type: 'laser', x: 100, y: 200, rotation: 0, color: '#fbbf24', width: 30, height: 20 },
        { type: 'laser', x: 100, y: 300, rotation: 0, color: '#fbbf24', width: 30, height: 20 },
        { type: 'laser', x: 100, y: 400, rotation: 0, color: '#fbbf24', width: 30, height: 20 },
        { type: 'mirror', x: 400, y: 300, rotation: 0, width: 120, height: 12 },
        { type: 'screen', x: 650, y: 300, rotation: 0, width: 100, height: 8, hit: false, hitPos: null }
    ]},
    { id: 3, name: '潜望镜光路模拟', description: '搭建简易潜望镜', icon: '🔭', knowledge: 'periscope', elements: [
        { type: 'laser', x: 300, y: 100, rotation: 90, color: '#fbbf24', width: 30, height: 20 },
        { type: 'mirror', x: 300, y: 200, rotation: 45, width: 80, height: 12 },
        { type: 'mirror', x: 300, y: 400, rotation: -45, width: 80, height: 12 },
        { type: 'screen', x: 300, y: 550, rotation: 0, width: 100, height: 8, hit: false, hitPos: null }
    ]}
];

const experimentKnowledge = {
    reflect_law: { title: '光的反射定律', content: '1. 反射光线、入射光线和法线在同一平面内\n2. 反射光线和入射光线分别位于法线两侧\n3. 反射角等于入射角' },
    mirror_reflection: { title: '镜面反射', content: '当平行光照射到光滑的平面上时，反射光线也是平行的，这种反射叫做镜面反射。' },
    periscope: { title: '潜望镜原理', content: '潜望镜利用光的反射原理，通过两块平行的平面镜，使光线经过两次反射后改变传播方向。' }
};

const levels = [
    { id: 1, name: '精准打靶', description: '用一面镜子将光线反射到目标', difficulty: 'easy', maxMirrors: 1, knowledge: 'basic_reflection', elements: [
        { type: 'laser', x: 150, y: 300, rotation: 0, color: '#fbbf24', width: 30, height: 20 },
        { type: 'target', x: 650, y: 150, rotation: 0, radius: 25, hit: false, hitTime: null }
    ]},
    { id: 2, name: '光路绕障', description: '绕过障碍物击中目标', difficulty: 'easy', maxMirrors: 2, knowledge: 'multiple_reflection', elements: [
        { type: 'laser', x: 100, y: 300, rotation: 0, color: '#fbbf24', width: 30, height: 20 },
        { type: 'target', x: 700, y: 300, rotation: 0, radius: 25, hit: false, hitTime: null },
        { type: 'obstacle', x: 400, y: 300, rotation: 0, width: 60, height: 40 }
    ]},
    { id: 3, name: 'Z字形光路', description: '利用两面镜子形成Z字形光路', difficulty: 'medium', maxMirrors: 2, knowledge: 'angle_control', elements: [
        { type: 'laser', x: 100, y: 150, rotation: 0, color: '#fbbf24', width: 30, height: 20 },
        { type: 'target', x: 700, y: 450, rotation: 0, radius: 25, hit: false, hitTime: null }
    ]},
    { id: 4, name: '三角反射', description: '在三面镜子间多次反射', difficulty: 'medium', maxMirrors: 3, knowledge: 'complex_reflection', elements: [
        { type: 'laser', x: 200, y: 200, rotation: 45, color: '#fbbf24', width: 30, height: 20 },
        { type: 'target', x: 600, y: 400, rotation: 0, radius: 25, hit: false, hitTime: null },
        { type: 'obstacle', x: 400, y: 300, rotation: 0, width: 80, height: 60 }
    ]},
    { id: 5, name: '迷宫突破', description: '穿过复杂的障碍物迷宫', difficulty: 'hard', maxMirrors: 3, knowledge: 'path_planning', elements: [
        { type: 'laser', x: 100, y: 100, rotation: 45, color: '#fbbf24', width: 30, height: 20 },
        { type: 'target', x: 700, y: 500, rotation: 0, radius: 25, hit: false, hitTime: null },
        { type: 'obstacle', x: 300, y: 200, rotation: 0, width: 60, height: 60 },
        { type: 'obstacle', x: 500, y: 300, rotation: 0, width: 60, height: 60 },
        { type: 'obstacle', x: 300, y: 400, rotation: 0, width: 60, height: 60 }
    ]},
    { id: 6, name: '终极挑战', description: '综合运用所有反射知识', difficulty: 'hard', maxMirrors: 4, knowledge: 'master_level', elements: [
        { type: 'laser', x: 100, y: 300, rotation: 0, color: '#fbbf24', width: 30, height: 20 },
        { type: 'target', x: 700, y: 300, rotation: 0, radius: 25, hit: false, hitTime: null },
        { type: 'obstacle', x: 250, y: 200, rotation: 0, width: 50, height: 50 },
        { type: 'obstacle', x: 450, y: 400, rotation: 0, width: 50, height: 50 },
        { type: 'obstacle', x: 600, y: 200, rotation: 0, width: 50, height: 50 }
    ]}
];

const levelKnowledge = {
    basic_reflection: { title: '反射角等于入射角', content: '当光线照射到平面镜上时，反射角等于入射角。', summary: '通过本关卡，你验证了"反射角等于入射角"的基本规律。' },
    multiple_reflection: { title: '多次反射', content: '光线可以在多面镜子之间连续反射。', summary: '通过本关卡，你学会了利用多次反射来改变光路方向。' },
    angle_control: { title: '角度控制', content: '通过控制镜子角度，可以精确控制反射光线的方向。', summary: '通过本关卡，你掌握了角度控制的技巧。' },
    complex_reflection: { title: '复杂反射', content: '在多面镜子之间进行复杂反射时，需要系统规划光路。', summary: '通过本关卡，你锻炼了复杂光路的规划能力。' },
    path_planning: { title: '光路规划', content: '在障碍物较多的场景中，需要仔细规划光路。', summary: '通过本关卡，你学会了在复杂环境中规划光路的方法。' },
    master_level: { title: '综合应用', content: '综合运用光的反射知识解决复杂问题。', summary: '恭喜你完成了所有关卡！' }
};

const commonKnowledge = {
    reflect_law_summary: { title: '光的反射定律', points: [
        { text: '三线共面', desc: '反射光线、入射光线和法线在同一平面内' },
        { text: '两线分居', desc: '反射光线和入射光线分别位于法线两侧' },
        { text: '两角相等', desc: '反射角等于入射角' }
    ]},
    mirror_vs_diffuse: { title: '镜面反射与漫反射', mirror: { title: '镜面反射', description: '平行光照射到光滑表面时，反射光线也保持平行', example: '镜子、水面、抛光金属' }, diffuse: { title: '漫反射', description: '平行光照射到粗糙表面时，反射光线向各个方向散射', example: '墙壁、纸张、地面' }},
    real_life_applications: [
        { icon: '🚗', title: '汽车后视镜', description: '利用反射扩大视野范围' },
        { icon: '🔭', title: '潜望镜', description: '通过两次反射观察障碍物后方' },
        { icon: '💡', title: '光纤通信', description: '光在光纤内多次反射传输信号' },
        { icon: '🏠', title: '镜子', description: '日常梳妆、装饰用途' },
        { icon: '📡', title: '雷达', description: '利用电磁波反射探测目标' },
        { icon: '✨', title: '反光衣', description: '利用反射提高夜间可见度' }
    ]
};

export { icons, experiments, experimentKnowledge, levels, levelKnowledge, commonKnowledge };