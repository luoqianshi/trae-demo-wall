/* ==================== 靶纸类型系统 ==================== */
const TargetTypes = {
    list: [
        {
            id: 'precision',
            name: '精准圆靶',
            nameEn: 'PRECISION',
            image: 'assets/target-paper.jpg',
            description: '标准ISSF 10m气步枪靶',
            scoreZones: 10, // 10环制
            centerRatio: 0.15 // 中心区域占比
        },
        {
            id: 'ipsc',
            name: 'IPSC靶',
            nameEn: 'IPSC',
            image: 'assets/target-ipsc.jpg',
            description: '实用射击标准靶',
            scoreZones: 4, // A/B/C/D
            centerRatio: 0.25
        },
        {
            id: 'idpa',
            name: 'IDPA靶',
            nameEn: 'IDPA',
            image: 'assets/target-idpa.jpg',
            description: '防御射击人形靶',
            scoreZones: 3, // -0/-1/-3
            centerRatio: 0.2
        },
        {
            id: 'human',
            name: '人形靶',
            nameEn: 'HUMANOID',
            image: 'assets/target-human.jpg',
            description: '战术训练全身靶',
            scoreZones: 5, // 头/胸/腹/四肢/外
            centerRatio: 0.18
        }
    ],

    currentIndex: 0,
    images: {},
    imagesLoaded: false,

    get current() {
        return this.list[this.currentIndex];
    },

    init() {
        return new Promise((resolve) => {
            let loaded = 0;
            const total = this.list.length;
            const onLoad = () => {
                loaded++;
                if (loaded >= total) {
                    this.imagesLoaded = true;
                    resolve();
                }
            };
            for (const type of this.list) {
                const img = new Image();
                img.onload = onLoad;
                img.onerror = onLoad;
                img.src = type.image;
                this.images[type.id] = img;
            }
        });
    },

    switchTo(index) {
        if (index === this.currentIndex || index < 0 || index >= this.list.length) return;
        this.currentIndex = index;
        // 通知外部更新
        if (window.onTargetTypeChange) {
            window.onTargetTypeChange(this.current);
        }
    },

    switchNext() {
        this.switchTo((this.currentIndex + 1) % this.list.length);
    },

    switchPrev() {
        this.switchTo((this.currentIndex - 1 + this.list.length) % this.list.length);
    },

    getImage(id) {
        return this.images[id || this.current.id];
    },

    // 根据距离靶心距离计算分数（针对不同靶纸类型）
    // 返回 {score, ring}
    calculateScore(dist, maxDist) {
        const type = this.current;
        // 应用距离计分缩放因子：远距离同样散布得分更低
        const scoreFactor = DistanceSystem.getScoreFactor();
        const adjustedDist = dist * scoreFactor;
        const ratio = adjustedDist / maxDist;

        switch (type.id) {
            case 'precision':
                // 精准圆靶：10环制
                if (ratio < 0.05) return { score: 10.9, ring: 'X' };
                if (ratio < 0.10) return { score: 10, ring: 10 };
                if (ratio < 0.20) return { score: 9, ring: 9 };
                if (ratio < 0.30) return { score: 8, ring: 8 };
                if (ratio < 0.40) return { score: 7, ring: 7 };
                if (ratio < 0.50) return { score: 6, ring: 6 };
                if (ratio < 0.60) return { score: 5, ring: 5 };
                if (ratio < 0.70) return { score: 4, ring: 4 };
                if (ratio < 0.80) return { score: 3, ring: 3 };
                if (ratio < 0.90) return { score: 2, ring: 2 };
                if (ratio < 1.00) return { score: 1, ring: 1 };
                return { score: 0, ring: 0 };

            case 'ipsc':
                // IPSC：A=5分, B=4分, C=3分, D=2分
                if (ratio < 0.25) return { score: 5, ring: 'A' };
                if (ratio < 0.50) return { score: 4, ring: 'B' };
                if (ratio < 0.75) return { score: 3, ring: 'C' };
                if (ratio < 1.0)  return { score: 2, ring: 'D' };
                return { score: 0, ring: 'M' };

            case 'idpa':
                // IDPA：-0=5分, -1=3分, -3=1分
                if (ratio < 0.30) return { score: 5, ring: '-0' };
                if (ratio < 0.60) return { score: 3, ring: '-1' };
                if (ratio < 1.0)  return { score: 1, ring: '-3' };
                return { score: 0, ring: 'M' };

            case 'human':
                // 人形靶：头=10, 胸=8, 腹=6, 四肢=4, 外=2
                if (ratio < 0.10) return { score: 10, ring: '头' };
                if (ratio < 0.25) return { score: 8, ring: '胸' };
                if (ratio < 0.40) return { score: 6, ring: '腹' };
                if (ratio < 0.65) return { score: 4, ring: '肢' };
                if (ratio < 1.0)  return { score: 2, ring: '外' };
                return { score: 0, ring: '脱' };

            default:
                const s = Math.max(0, Math.round(10 - ratio * 10));
                return { score: s, ring: s };
        }
    },

    reset() {
        // 保持当前靶纸类型不变，不重置 currentIndex
    }
};
