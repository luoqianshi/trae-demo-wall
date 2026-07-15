export const levels = [
    {
        id: 1,
        name: '入门练习',
        difficulty: 'easy',
        description: '使用1面镜子将光线反射到目标点',
        knowledge: 'reflect_angle',
        maxMirrors: 1,
        elements: [
            { type: 'laser', x: 100, y: 300, rotation: 0, color: '#fbbf24' },
            { type: 'target', x: 600, y: 300 }
        ],
        requiredMirrors: [{ type: 'mirror', x: 350, y: 300, rotation: 45 }]
    },
    {
        id: 2,
        name: '角度挑战',
        difficulty: 'easy',
        description: '调整镜子角度，使光线精准命中靶点',
        knowledge: 'reflect_angle',
        maxMirrors: 1,
        elements: [
            { type: 'laser', x: 100, y: 200, rotation: 30, color: '#fbbf24' },
            { type: 'target', x: 500, y: 400 }
        ],
        requiredMirrors: [{ type: 'mirror', x: 300, y: 300, rotation: -30 }]
    },
    {
        id: 3,
        name: '障碍绕行',
        difficulty: 'medium',
        description: '绕过障碍物，使用2面镜子完成光路',
        knowledge: 'multiple_reflection',
        maxMirrors: 2,
        elements: [
            { type: 'laser', x: 100, y: 300, rotation: 0, color: '#fbbf24' },
            { type: 'obstacle', x: 350, y: 300, width: 80, height: 120 },
            { type: 'target', x: 600, y: 300 }
        ],
        requiredMirrors: [
            { type: 'mirror', x: 250, y: 200, rotation: 45 },
            { type: 'mirror', x: 450, y: 200, rotation: -45 }
        ]
    },
    {
        id: 4,
        name: 'Z字形光路',
        difficulty: 'medium',
        description: '设计Z字形光路，绕过多个障碍',
        knowledge: 'multiple_reflection',
        maxMirrors: 2,
        elements: [
            { type: 'laser', x: 80, y: 150, rotation: 90, color: '#fbbf24' },
            { type: 'obstacle', x: 250, y: 250, width: 40, height: 100 },
            { type: 'obstacle', x: 450, y: 250, width: 40, height: 100 },
            { type: 'target', x: 600, y: 400 }
        ],
        requiredMirrors: [
            { type: 'mirror', x: 250, y: 150, rotation: -45 },
            { type: 'mirror', x: 450, y: 300, rotation: 45 }
        ]
    },
    {
        id: 5,
        name: '三角反射',
        difficulty: 'hard',
        description: '使用3面镜子构建三角光路',
        knowledge: 'complex_reflection',
        maxMirrors: 3,
        elements: [
            { type: 'laser', x: 150, y: 150, rotation: 45, color: '#fbbf24' },
            { type: 'obstacle', x: 300, y: 250, width: 60, height: 60 },
            { type: 'obstacle', x: 450, y: 250, width: 60, height: 60 },
            { type: 'target', x: 350, y: 400 }
        ],
        requiredMirrors: [
            { type: 'mirror', x: 250, y: 250, rotation: 0 },
            { type: 'mirror', x: 400, y: 250, rotation: 0 },
            { type: 'mirror', x: 350, y: 350, rotation: 135 }
        ]
    },
    {
        id: 6,
        name: '迷宫突破',
        difficulty: 'hard',
        description: '在迷宫中找到正确的光路路径',
        knowledge: 'complex_reflection',
        maxMirrors: 4,
        elements: [
            { type: 'laser', x: 100, y: 100, rotation: 45, color: '#fbbf24' },
            { type: 'obstacle', x: 250, y: 150, width: 40, height: 80 },
            { type: 'obstacle', x: 250, y: 300, width: 40, height: 80 },
            { type: 'obstacle', x: 450, y: 150, width: 40, height: 80 },
            { type: 'obstacle', x: 450, y: 300, width: 40, height: 80 },
            { type: 'target', x: 600, y: 400 }
        ],
        requiredMirrors: [
            { type: 'mirror', x: 350, y: 100, rotation: 90 },
            { type: 'mirror', x: 350, y: 225, rotation: 0 },
            { type: 'mirror', x: 350, y: 350, rotation: 90 },
            { type: 'mirror', x: 525, y: 275, rotation: -45 }
        ]
    }
];

export const levelKnowledge = {
    reflect_angle: {
        title: '反射角等于入射角',
        content: '根据光的反射定律，反射角的大小等于入射角的大小。\n\n关键技巧：当光线需要改变方向时，镜子的角度应该是入射光线和目标方向夹角的一半。',
        summary: '掌握了反射角等于入射角的基本规律！'
    },
    multiple_reflection: {
        title: '多次反射',
        content: '当光线在多个反射面之间传播时，每次反射都遵循光的反射定律。\n\n关键技巧：可以分段分析，先确定第一段反射的方向，再计算第二段反射。',
        summary: '学会了分析和设计多次反射光路！'
    },
    complex_reflection: {
        title: '复杂反射系统',
        content: '在复杂场景中，可以通过逆向思维从目标点反推光路，或者使用对称法简化分析。\n\n关键技巧：将镜子看作对称轴，目标点的镜像位置就是光线的"虚拟"直线传播方向。',
        summary: '掌握了复杂反射系统的设计方法！'
    }
};
