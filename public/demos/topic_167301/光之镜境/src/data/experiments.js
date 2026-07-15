export const experiments = [
    {
        id: 1,
        name: '光的反射定律探究',
        description: '通过实验验证光的反射定律：三线共面、两线分居、两角相等',
        icon: '📐',
        elements: [
            { type: 'laser', x: 150, y: 300, rotation: 45, color: '#fbbf24' },
            { type: 'mirror', x: 400, y: 300, rotation: 0 },
            { type: 'protractor', x: 400, y: 300, rotation: 0 },
            { type: 'screen', x: 400, y: 150, rotation: 0 }
        ],
        knowledge: 'reflect_law'
    },
    {
        id: 2,
        name: '镜面反射演示',
        description: '观察平行光照射平面镜时的反射规律',
        icon: '🔍',
        elements: [
            { type: 'laser', x: 100, y: 200, rotation: 0, color: '#fbbf24' },
            { type: 'laser', x: 100, y: 280, rotation: 0, color: '#fbbf24' },
            { type: 'laser', x: 100, y: 360, rotation: 0, color: '#fbbf24' },
            { type: 'mirror', x: 400, y: 280, rotation: 45 },
            { type: 'screen', x: 650, y: 150, rotation: 0 }
        ],
        knowledge: 'specular_reflection'
    },
    {
        id: 3,
        name: '潜望镜光路模拟',
        description: '模拟潜望镜的工作原理，理解两次反射的应用',
        icon: '🔭',
        elements: [
            { type: 'laser', x: 200, y: 400, rotation: -90, color: '#fbbf24' },
            { type: 'mirror', x: 200, y: 300, rotation: 45 },
            { type: 'mirror', x: 400, y: 150, rotation: -45 },
            { type: 'target', x: 550, y: 150 },
            { type: 'obstacle', x: 300, y: 225, width: 80, height: 150 }
        ],
        knowledge: 'periscope'
    }
];

export const experimentKnowledge = {
    reflect_law: {
        title: '光的反射定律',
        content: '【三线共面】反射光线、入射光线和法线在同一平面内。\n【两线分居】反射光线和入射光线分别位于法线两侧。\n【两角相等】反射角等于入射角。',
        tips: '提示：尝试改变入射光线的角度，观察反射角的变化规律。'
    },
    specular_reflection: {
        title: '镜面反射',
        content: '当平行光线照射到光滑平面（如平面镜）上时，反射光线仍然是平行的，这种反射叫做镜面反射。\n\n特点：反射光线集中，只能在特定方向看到强光。',
        tips: '提示：对比观察漫反射和镜面反射的区别。'
    },
    periscope: {
        title: '潜望镜原理',
        content: '潜望镜利用光的反射原理，通过两次反射改变光路方向，使人能够在不暴露自己的情况下观察到上方或远处的物体。\n\n应用：潜艇潜望镜、战壕观察镜等。',
        tips: '提示：调整两面镜子的角度，使光线能够正确传播。'
    }
};
