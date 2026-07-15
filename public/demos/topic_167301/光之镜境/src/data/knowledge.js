export const commonKnowledge = {
    reflect_law_summary: {
        title: '光的反射定律总结',
        points: [
            { text: '三线共面', desc: '反射光线、入射光线和法线在同一平面内' },
            { text: '两线分居', desc: '反射光线和入射光线分别位于法线两侧' },
            { text: '两角相等', desc: '反射角等于入射角' }
        ]
    },
    mirror_vs_diffuse: {
        title: '镜面反射与漫反射',
        mirror: {
            title: '镜面反射',
            description: '平行光线照射到光滑表面时，反射光线仍然平行',
            example: '镜子、水面、抛光金属'
        },
        diffuse: {
            title: '漫反射',
            description: '平行光线照射到粗糙表面时，反射光线向各个方向散射',
            example: '墙壁、纸张、地面'
        }
    },
    real_life_applications: [
        {
            title: '潜望镜',
            description: '利用两次反射改变光路，常用于潜艇和战壕观察',
            icon: '🔭'
        },
        {
            title: '后视镜',
            description: '利用反射扩大视野范围，确保行车安全',
            icon: '🚗'
        },
        {
            title: '光纤通信',
            description: '利用光的全反射原理，实现高速数据传输',
            icon: '🔌'
        },
        {
            title: '激光测距',
            description: '利用反射时间计算距离，精度可达毫米级',
            icon: '📏'
        },
        {
            title: '太阳能热水器',
            description: '利用反射镜聚集太阳光，提高集热效率',
            icon: '☀️'
        },
        {
            title: '电影银幕',
            description: '利用漫反射使各个位置的观众都能看到画面',
            icon: '🎬'
        }
    ]
};

export const tips = {
    drag: '提示：点击器材可拖拽移动，右键可旋转角度',
    rotate: '提示：按住右键拖动可旋转选中的元件',
    delete: '提示：选中元件后按Delete键可删除',
    normal: '提示：开启法线显示可帮助理解反射角度',
    darkMode: '提示：开启暗室模式可更清晰地观察光束效果'
};
