// demo-data.js - 演示数据生成器
// 一键生成丰富的大赛级演示场景

import { genId, formatDate } from './utils.js';

const SCENARIOS = {
    sprint: {
        name: '期末冲刺（7天）',
        subjects: [
            { name: '高等数学', difficulty: 3, points: ['极限与连续', '导数应用', '积分计算', '微分方程', '级数求和'] },
            { name: '线性代数', difficulty: 3, points: ['矩阵运算', '特征值', '二次型', '向量空间'] },
            { name: '大学英语', difficulty: 2, points: ['阅读理解', '听力训练', '写作模板', '词汇语法'] },
            { name: '数据结构', difficulty: 3, points: ['链表与树', '排序算法', '图论基础', '哈希表', '动态规划'] }
        ],
        days: 7,
        slots: [
            { timeFrom: '07:00', timeTo: '12:00', duration: 90 },
            { timeFrom: '14:00', timeTo: '18:00', duration: 60 },
            { timeFrom: '19:30', timeTo: '23:00', duration: 60 }
        ]
    },
    balanced: {
        name: '中期备考（14天）',
        subjects: [
            { name: '高等数学', difficulty: 3, points: ['函数极限', '微分中值', '不定积分', '定积分应用', '多元微分', '重积分'] },
            { name: '大学物理', difficulty: 3, points: ['力学', '电磁学', '热学', '光学', '近代物理'] },
            { name: '数据结构', difficulty: 3, points: ['数组链表', '栈与队列', '二叉树', '图算法', '排序查找'] },
            { name: '计算机网络', difficulty: 2, points: ['OSI模型', 'TCP/IP', 'HTTP协议', '网络安全'] },
            { name: '大学英语', difficulty: 2, points: ['词汇3500', '听力精听', '阅读理解', '作文模板', '翻译训练'] }
        ],
        days: 14,
        slots: [
            { timeFrom: '08:00', timeTo: '12:00', duration: 60 },
            { timeFrom: '14:00', timeTo: '17:00', duration: 60 },
            { timeFrom: '19:00', timeTo: '22:00', duration: 60 }
        ]
    },
    longterm: {
        name: '长期规划（30天）',
        subjects: [
            { name: '高等数学', difficulty: 3, points: ['函数与极限', '导数与微分', '中值定理', '积分学', '微分方程', '级数', '多元函数'] },
            { name: '线性代数', difficulty: 3, points: ['行列式', '矩阵', '线性方程组', '特征值', '二次型'] },
            { name: '概率统计', difficulty: 2, points: ['随机变量', '分布函数', '数字特征', '大数定律', '假设检验'] },
            { name: '数据结构', difficulty: 3, points: ['线性表', '树', '图', '查找', '排序', '算法分析'] },
            { name: '操作系统', difficulty: 2, points: ['进程管理', '内存管理', '文件系统', 'I/O系统'] },
            { name: '大学英语', difficulty: 2, points: ['词汇', '语法', '听力', '阅读', '写作', '口语'] }
        ],
        days: 30,
        slots: [
            { timeFrom: '08:00', timeTo: '11:00', duration: 60 },
            { timeFrom: '14:00', timeTo: '17:00', duration: 60 },
            { timeFrom: '19:30', timeTo: '21:30', duration: 60 }
        ]
    }
};

export function getScenarios() {
    return Object.entries(SCENARIOS).map(([key, s]) => ({ key, name: s.name }));
}

export function generateDemoData(scenarioKey) {
    const s = SCENARIOS[scenarioKey];
    if (!s) throw new Error('未知场景');

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + s.days);

    const subjects = s.subjects.map(sub => ({
        id: genId(),
        name: sub.name,
        difficulty: sub.difficulty,
        points: sub.points,
        completedPoints: []
    }));

    const timeSlots = s.slots.map(slot => ({
        id: genId(),
        startDate: formatDate(today),
        endDate: formatDate(endDate),
        timeFrom: slot.timeFrom,
        timeTo: slot.timeTo,
        duration: slot.duration
    }));

    return { subjects, timeSlots, settings: { useEbbinghaus: true } };
}

export function generateCompletedSchedule(schedule, ratio = 0.35) {
    // 随机标记一部分计划为已完成，让演示数据更真实
    return schedule.map(item => ({
        ...item,
        completed: Math.random() < ratio
    }));
}
