/* ==================== 武器系统 ==================== */
const Weapons = {
    // 武器定义
    list: [
        {
            id: 'pistol',
            name: '格洛克 17',
            nameEn: 'GLOCK 17',
            type: '手枪',
            ammo: 15,
            maxAmmo: 15,
            recoil: 20,          // 后坐力强度
            recoilSide: 6,       // 横向后坐力
            spread: 0.8,         // 散布系数
            fireRate: 0.3,       // 射击间隔（秒）
            swaySpeed: 2.0,      // 枪身晃动速度
            breathAmp: 4,        // 呼吸幅度
            image: 'assets/pistol-fps.jpg',
            // 渲染参数
            gunScale: 0.75,      // 枪械缩放
            gunOffsetY: 0.15,    // 枪械底部偏移（正值=往下移，避免遮挡靶盘）
            muzzleOffsetX: 0.02, // 枪口位置（相对画面宽度，从中心偏移）
            muzzleOffsetY: -0.35 // 枪口位置（相对画面高度，负=向上）
        },
        {
            id: 'rifle',
            name: 'M4A1 卡宾枪',
            nameEn: 'M4A1 CARBINE',
            type: '步枪',
            ammo: 30,
            maxAmmo: 30,
            recoil: 35,
            recoilSide: 10,
            spread: 0.5,
            fireRate: 0.15,
            swaySpeed: 1.5,
            breathAmp: 7,
            image: 'assets/rifle-fps.jpg',
            gunScale: 0.85,
            gunOffsetY: 0.15,
            muzzleOffsetX: 0.0,
            muzzleOffsetY: -0.45
        },
        {
            id: 'smg',
            name: 'MP5 冲锋枪',
            nameEn: 'MP5A4 SMG',
            type: '冲锋枪',
            ammo: 30,
            maxAmmo: 30,
            recoil: 25,
            recoilSide: 8,
            spread: 0.6,
            fireRate: 0.1,
            swaySpeed: 2.5,
            breathAmp: 5,
            image: 'assets/smg-fps(2).jpg',
            gunScale: 0.8,
            gunOffsetY: 0.15,
            muzzleOffsetX: 0.01,
            muzzleOffsetY: -0.4
        }
    ],

    currentIndex: 0,
    images: {},          // id -> Image
    imagesLoaded: false,
    switching: false,    // 切枪动画中
    switchProgress: 0,
    switchFrom: 0,
    switchTarget: 0,     // 切枪目标索引（注意：不能用 switchTo，会与方法名冲突）

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
            for (const weapon of this.list) {
                const img = new Image();
                img.onload = onLoad;
                img.onerror = onLoad;
                img.src = weapon.image;
                this.images[weapon.id] = img;
            }
        });
    },

    switchTo(index) {
        if (index === this.currentIndex || this.switching) return;
        if (index < 0 || index >= this.list.length) return;
        this.switching = true;
        this.switchProgress = 0;
        this.switchFrom = this.currentIndex;
        this.switchTarget = index;
    },

    switchByIndex(index) {
        this.switchTo(index);
    },

    switchNext() {
        this.switchTo((this.currentIndex + 1) % this.list.length);
    },

    switchPrev() {
        this.switchTo((this.currentIndex - 1 + this.list.length) % this.list.length);
    },

    update(dt) {
        // 切枪动画
        if (this.switching) {
            this.switchProgress += dt * 4; // 0.25秒完成切枪
            if (this.switchProgress >= 1) {
                this.switchProgress = 1;
                this.switching = false;
                this.currentIndex = this.switchTarget;
                // 使用训练弹数设置
                const ammoSelect = document.getElementById('ammo-select');
                const trainingAmmo = ammoSelect ? parseInt(ammoSelect.value) : 10;
                Shooting.maxAmmo = trainingAmmo;
                Shooting.ammo = trainingAmmo;
            }
        }
    },

    // 获取切枪动画偏移（Y轴下降再上升）
    getSwitchOffset() {
        if (!this.switching) return 0;
        // 前半段下降，后半段上升
        const t = this.switchProgress;
        if (t < 0.5) {
            return t * 2 * 200; // 下降到200px
        } else {
            return (1 - (t - 0.5) * 2) * 200; // 从200px上升
        }
    },

    getImage(id) {
        return this.images[id || this.current.id];
    },

    reset() {
        for (const weapon of this.list) {
            weapon.ammo = weapon.maxAmmo;
        }
        this.currentIndex = 0;
        this.switching = false;
        // 使用训练弹数设置，而不是武器默认弹容量
        const ammoSelect = document.getElementById('ammo-select');
        const trainingAmmo = ammoSelect ? parseInt(ammoSelect.value) : 10;
        Shooting.maxAmmo = trainingAmmo;
        Shooting.ammo = trainingAmmo;
    }
};
