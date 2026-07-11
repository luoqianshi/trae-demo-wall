/* ==================== 评分系统 ==================== */
const Scoring = {
    // 计算单发评分（综合评分 0~100）
    // shot: 射击记录
    // targetCX, targetCY: 靶心坐标
    // targetRadius: 靶纸半径
    calculateShotScore(shot, targetCX, targetCY, targetRadius) {
        // 1. 晃动幅度评分（权重 30%）
        // stability 已经是 0~100 的值
        const wobbleScore = shot.stability || 50;

        // 2. 击发时机评分（权重 25%）
        // 速度越低越好，速度 < 10 得满分，> 100 得 0 分
        const speedVal = shot.speed || 50;
        const timingScore = Utils.clamp(100 - speedVal, 0, 100);

        // 3. 弹着点偏差评分（权重 30%）
        const dist = Utils.distance(shot.impactX, shot.impactY, targetCX, targetCY);
        const distRatio = dist / targetRadius;
        const deviationScore = Utils.clamp((1 - distRatio) * 100, 0, 100);

        // 4. 弹道一致性（权重 15%）
        // 第一发给基准分，后续发与前一发的偏差越小越好
        let consistencyScore = 75; // 默认中等
        if (Shooting.shots.length >= 2) {
            const prev = Shooting.shots[Shooting.shots.length - 2];
            const prevDist = Utils.distance(prev.impactX, prev.impactY, targetCX, targetCY);
            const currDist = dist;
            const consistency = Math.abs(currDist - prevDist);
            consistencyScore = Utils.clamp(100 - consistency * 2, 0, 100);
        }

        // 加权总分
        const totalScore = Math.round(
            wobbleScore * 0.30 +
            timingScore * 0.25 +
            deviationScore * 0.30 +
            consistencyScore * 0.15
        );

        return {
            total: totalScore,
            wobble: Math.round(wobbleScore),
            timing: Math.round(timingScore),
            deviation: Math.round(deviationScore),
            consistency: Math.round(consistencyScore)
        };
    },

    // 计算训练总结评分
    calculateSessionSummary() {
        const shots = Shooting.shots;
        if (shots.length === 0) {
            return { totalScore: 0, avgRing: 0, bestShot: 0, spread: 0, grade: '--' };
        }

        const totalRingScore = shots.reduce((s, sh) => s + sh.score, 0);
        const avgRing = totalRingScore / shots.length;
        const bestShot = Math.max(...shots.map(s => s.score));

        // 散布（所有弹着点到靶心的平均距离）
        // 需要外部传入靶心参数，这里简化处理
        let spread = 0;
        if (shots.length >= 2) {
            let sumDist = 0;
            const cx = shots.reduce((s, sh) => s + sh.impactX, 0) / shots.length;
            const cy = shots.reduce((s, sh) => s + sh.impactY, 0) / shots.length;
            for (const sh of shots) {
                sumDist += Utils.distance(sh.impactX, sh.impactY, cx, cy);
            }
            spread = sumDist / shots.length;
        }

        const grade = Utils.getGrade(avgRing * 10);

        return {
            totalScore: Math.round(totalRingScore * 10) / 10,
            avgRing: Math.round(avgRing * 10) / 10,
            bestShot: bestShot,
            spread: Math.round(spread * 10) / 10,
            grade: grade.text,
            gradeColor: grade.color,
            shotCount: shots.length
        };
    }
};
