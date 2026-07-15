/**
 * abMatchResults.js
 * 用途：预计算的AB表匹配结果，每行A表保留Top-3候选。
 * 挂载到 window.ABMatchResults。
 * 与 tableA.js 的10行一一对应，candidates 按 matchScore 从高到低排列。
 * calcPrice 采用加权平均法(WeightedAverage)，以 weightedScore 为权重计算。
 * matchScore 为综合匹配分；weightedScore 在 matchScore 基础上叠加日期新旧等因素，略低。
 */
window.ABMatchResults = [
    // A1: 无缝碳钢管 DN50 20# → B1/B2/B3
    {
        aRowIndex: 1,
        bestMatch: {bRowIndex:1, matchScore:0.95, weightedScore:0.88, price:5200, date:'2026-05-15'},
        candidates: [
            {bRowIndex:1, matchScore:0.95, weightedScore:0.88, price:5200, date:'2026-05-15'},
            {bRowIndex:2, matchScore:0.82, weightedScore:0.75, price:5250, date:'2026-03-20'},
            {bRowIndex:3, matchScore:0.76, weightedScore:0.68, price:5180, date:'2026-06-01'}
        ],
        calcPrice: 5209.5,
        calcMethod: 'WeightedAverage'
    },
    // A2: 无缝碳钢管 DN100 20# → B4/B5/B6
    {
        aRowIndex: 2,
        bestMatch: {bRowIndex:4, matchScore:0.94, weightedScore:0.87, price:4800, date:'2026-04-10'},
        candidates: [
            {bRowIndex:4, matchScore:0.94, weightedScore:0.87, price:4800, date:'2026-04-10'},
            {bRowIndex:5, matchScore:0.85, weightedScore:0.78, price:4850, date:'2026-02-18'},
            {bRowIndex:6, matchScore:0.72, weightedScore:0.65, price:4780, date:'2026-06-05'}
        ],
        calcPrice: 4811.3,
        calcMethod: 'WeightedAverage'
    },
    // A3: 无缝碳钢管 DN200 20# → B7/B8 + B5(低分跨规格)
    {
        aRowIndex: 3,
        bestMatch: {bRowIndex:7, matchScore:0.96, weightedScore:0.89, price:4500, date:'2026-05-08'},
        candidates: [
            {bRowIndex:7, matchScore:0.96, weightedScore:0.89, price:4500, date:'2026-05-08'},
            {bRowIndex:8, matchScore:0.88, weightedScore:0.81, price:4550, date:'2026-03-25'},
            {bRowIndex:5, matchScore:0.42, weightedScore:0.35, price:4850, date:'2026-02-18'}
        ],
        calcPrice: 4578.5,
        calcMethod: 'WeightedAverage'
    },
    // A4: 合金钢管 DN150 15CrMo → B9/B10 + B1(低分跨材质)
    {
        aRowIndex: 4,
        bestMatch: {bRowIndex:9, matchScore:0.93, weightedScore:0.86, price:7800, date:'2026-04-20'},
        candidates: [
            {bRowIndex:9, matchScore:0.93, weightedScore:0.86, price:7800, date:'2026-04-20'},
            {bRowIndex:10, matchScore:0.86, weightedScore:0.79, price:7750, date:'2026-06-12'},
            {bRowIndex:1, matchScore:0.32, weightedScore:0.25, price:5200, date:'2026-05-15'}
        ],
        calcPrice: 7437.1,
        calcMethod: 'WeightedAverage'
    },
    // A5: 镀锌钢管 DN80 Q235 → B11/B12 + B3(低分跨规格)
    {
        aRowIndex: 5,
        bestMatch: {bRowIndex:11, matchScore:0.92, weightedScore:0.85, price:3800, date:'2026-05-22'},
        candidates: [
            {bRowIndex:11, matchScore:0.92, weightedScore:0.85, price:3800, date:'2026-05-22'},
            {bRowIndex:12, matchScore:0.84, weightedScore:0.77, price:3750, date:'2026-02-10'},
            {bRowIndex:3, matchScore:0.35, weightedScore:0.28, price:5180, date:'2026-06-01'}
        ],
        calcPrice: 3983.1,
        calcMethod: 'WeightedAverage'
    },
    // A6: 电力电缆 YJV-3*95 铜芯 → B13/B14 + B15(低分跨规格)
    {
        aRowIndex: 6,
        bestMatch: {bRowIndex:13, matchScore:0.95, weightedScore:0.88, price:6500, date:'2026-04-15'},
        candidates: [
            {bRowIndex:13, matchScore:0.95, weightedScore:0.88, price:6500, date:'2026-04-15'},
            {bRowIndex:14, matchScore:0.83, weightedScore:0.76, price:6450, date:'2026-06-08'},
            {bRowIndex:15, matchScore:0.52, weightedScore:0.45, price:7200, date:'2026-03-18'}
        ],
        calcPrice: 6632.5,
        calcMethod: 'WeightedAverage'
    },
    // A7: 电力电缆 YJV-3*120 铜芯 → B15/B16 + B13(低分跨规格)
    {
        aRowIndex: 7,
        bestMatch: {bRowIndex:15, matchScore:0.96, weightedScore:0.89, price:7200, date:'2026-03-18'},
        candidates: [
            {bRowIndex:15, matchScore:0.96, weightedScore:0.89, price:7200, date:'2026-03-18'},
            {bRowIndex:16, matchScore:0.85, weightedScore:0.78, price:7250, date:'2026-05-30'},
            {bRowIndex:13, matchScore:0.48, weightedScore:0.41, price:6500, date:'2026-04-15'}
        ],
        calcPrice: 7080.8,
        calcMethod: 'WeightedAverage'
    },
    // A8: 配电箱 GGD-800A → B17/B18 + B23(低分跨类)
    {
        aRowIndex: 8,
        bestMatch: {bRowIndex:17, matchScore:0.94, weightedScore:0.87, price:3500, date:'2026-04-05'},
        candidates: [
            {bRowIndex:17, matchScore:0.94, weightedScore:0.87, price:3500, date:'2026-04-05'},
            {bRowIndex:18, matchScore:0.82, weightedScore:0.75, price:3450, date:'2026-06-20'},
            {bRowIndex:23, matchScore:0.28, weightedScore:0.21, price:1500, date:'2026-01-20'}
        ],
        calcPrice: 3250.0,
        calcMethod: 'WeightedAverage'
    },
    // A9: 温度变送器 0-200℃ → B19/B20 + B21(低分跨类)
    {
        aRowIndex: 9,
        bestMatch: {bRowIndex:19, matchScore:0.91, weightedScore:0.84, price:2800, date:'2026-03-10'},
        candidates: [
            {bRowIndex:19, matchScore:0.91, weightedScore:0.84, price:2800, date:'2026-03-10'},
            {bRowIndex:20, matchScore:0.80, weightedScore:0.73, price:2850, date:'2026-05-25'},
            {bRowIndex:21, matchScore:0.40, weightedScore:0.33, price:4200, date:'2026-02-28'}
        ],
        calcPrice: 3062.4,
        calcMethod: 'WeightedAverage'
    },
    // A10: 电磁流量计 DN50 → B21/B22 + B19(低分跨类)
    {
        aRowIndex: 10,
        bestMatch: {bRowIndex:21, matchScore:0.90, weightedScore:0.83, price:4200, date:'2026-02-28'},
        candidates: [
            {bRowIndex:21, matchScore:0.90, weightedScore:0.83, price:4200, date:'2026-02-28'},
            {bRowIndex:22, matchScore:0.79, weightedScore:0.72, price:4250, date:'2026-06-15'},
            {bRowIndex:19, matchScore:0.38, weightedScore:0.31, price:2800, date:'2026-03-10'}
        ],
        calcPrice: 3986.0,
        calcMethod: 'WeightedAverage'
    }
];
