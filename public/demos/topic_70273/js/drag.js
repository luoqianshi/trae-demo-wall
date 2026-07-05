// 拖拽逻辑模块 - 基于 interact.js（精准支持 mouse + touch）

const DragManager = {
    initialized: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        const commonDraggable = this.createDraggableConfig();

        // 设置可拖拽元素
        this.setupDraggables(commonDraggable);

        // 设置放置区域
        this.setupDropzones();
    },

    // 通用可拖拽配置
    createDraggableConfig() {
        return {
            inertia: false,
            autoScroll: false,
            modifiers: [],
            listeners: {
                start(event) {
                    const el = event.target;

                    // 添加拖拽中标记类（禁用CSS动画）
                    el.classList.add('interact-dragging');

                    // 保存原始样式
                    el.dataset.savedBorderRadius = el.style.borderRadius || '';
                    el.dataset.savedClipPath = el.style.clipPath || '';

                    // 重置累计位移（从当前位置开始拖拽）
                    el.dataset.x = '0';
                    el.dataset.y = '0';

                    // 提升层级，确保拖拽元素在最上层
                    el.style.zIndex = '9999';

                    // 高亮可放置区域
                    DragManager.highlightDropZones(el, true);
                },
                move(event) {
                    const el = event.target;
                    const x = (parseFloat(el.dataset.x) || 0) + event.dx;
                    const y = (parseFloat(el.dataset.y) || 0) + event.dy;
                    el.dataset.x = x;
                    el.dataset.y = y;
                    el.style.transform = `translate(${x}px, ${y}px)`;
                },
                end(event) {
                    const el = event.target;

                    // 移除拖拽中标记类
                    el.classList.remove('interact-dragging');

                    // 重置位置（让CSS动画恢复）
                    el.dataset.x = '0';
                    el.dataset.y = '0';
                    el.style.transform = '';
                    el.style.borderRadius = el.dataset.savedBorderRadius || '';
                    el.style.clipPath = el.dataset.savedClipPath || '';
                    el.style.zIndex = '';

                    // 移除高亮
                    DragManager.highlightDropZones(el, false);
                }
            }
        };
    },

    // 设置可拖拽元素
    setupDraggables(config) {
        // 蚕丝
        interact('#silk').draggable(config);

        // 剪刀
        interact('#scissors').draggable(config);

        // 花朵头
        interact('#flowerHead').draggable(config);

        // 叶子
        this.setupLeafDraggable(config);
    },

    setupLeafDraggable(config) {
        document.querySelectorAll('.leaf').forEach(leaf => {
            if (!interact.isSet(leaf)) {
                interact(leaf).draggable(config);
            }
        });
    },

    // 重新绑定动态生成的花瓣
    setupPetalDraggables() {
        const config = this.createDraggableConfig();
        document.querySelectorAll('.petal').forEach(petal => {
            if (!interact.isSet(petal)) {
                interact(petal).draggable(config);
            }
        });
    },

    // 设置放置区域
    setupDropzones() {
        // 染缸
        interact('.dye-pot').dropzone({
            accept: '#silk',
            overlap: 0.3,
            ondropactivate(event) {
                event.target.classList.add('active');
            },
            ondragenter(event) {
                event.target.classList.add('active');
            },
            ondragleave(event) {
                event.target.classList.remove('active');
            },
            ondrop(event) {
                event.target.classList.remove('active');
                const pot = event.target;
                const color = pot.dataset.color;
                const colorName = pot.dataset.name;
                document.dispatchEvent(new CustomEvent('silkDyed', {
                    detail: { color, colorName }
                }));
            },
            ondropdeactivate(event) {
                event.target.classList.remove('active');
            }
        });

        // 绒毛（剪刀目标）
        interact('#fur').dropzone({
            accept: '#scissors',
            overlap: 0.3,
            ondropactivate(event) {
                event.target.classList.add('drop-zone-highlight');
            },
            ondragenter(event) {
                event.target.classList.add('drop-zone-highlight');
            },
            ondragleave(event) {
                event.target.classList.remove('drop-zone-highlight');
            },
            ondrop(event) {
                event.target.classList.remove('drop-zone-highlight');
                document.dispatchEvent(new CustomEvent('scissorsOnFur'));
            },
            ondropdeactivate(event) {
                event.target.classList.remove('drop-zone-highlight');
            }
        });

        // 花瓣槽位
        interact('.petal-slot').dropzone({
            accept: '.petal',
            overlap: 0.3,
            ondropactivate(event) {
                event.target.classList.add('drop-zone-highlight');
            },
            ondragenter(event) {
                event.target.classList.add('drop-zone-highlight');
            },
            ondragleave(event) {
                event.target.classList.remove('drop-zone-highlight');
            },
            ondrop(event) {
                event.target.classList.remove('drop-zone-highlight');
                const slot = event.target;
                if (!slot.classList.contains('filled')) {
                    document.dispatchEvent(new CustomEvent('petalPlaced', {
                        detail: { slot, petal: event.relatedTarget }
                    }));
                }
            },
            ondropdeactivate(event) {
                event.target.classList.remove('drop-zone-highlight');
            }
        });

        // 花朵放置区域
        interact('#flowerDropZone').dropzone({
            accept: '#flowerHead',
            overlap: 0.3,
            ondropactivate(event) {
                event.target.classList.add('active');
            },
            ondragenter(event) {
                event.target.classList.add('active');
            },
            ondragleave(event) {
                event.target.classList.remove('active');
            },
            ondrop(event) {
                event.target.classList.remove('active');
                document.dispatchEvent(new CustomEvent('flowerPlaced', {
                    detail: { flower: event.relatedTarget }
                }));
            },
            ondropdeactivate(event) {
                event.target.classList.remove('active');
            }
        });

        // 叶子放置区域
        interact('#leavesDropZone').dropzone({
            accept: '.leaf',
            overlap: 0.3,
            ondropactivate(event) {
                event.target.classList.add('active');
            },
            ondragenter(event) {
                event.target.classList.add('active');
            },
            ondragleave(event) {
                event.target.classList.remove('active');
            },
            ondrop(event) {
                event.target.classList.remove('active');
                document.dispatchEvent(new CustomEvent('leafPlaced', {
                    detail: { leaf: event.relatedTarget }
                }));
            },
            ondropdeactivate(event) {
                event.target.classList.remove('active');
            }
        });
    },

    // 高亮放置区域
    highlightDropZones(draggedEl, active) {
        if (!active) {
            document.querySelectorAll('.active, .drop-zone-highlight').forEach(node => {
                node.classList.remove('active', 'drop-zone-highlight');
            });
            return;
        }

        if (draggedEl.classList.contains('silk') || draggedEl.id === 'silk') {
            document.querySelectorAll('.dye-pot').forEach(pot => pot.classList.add('active'));
        } else if (draggedEl.classList.contains('scissors') || draggedEl.id === 'scissors') {
            const fur = document.getElementById('fur');
            if (fur) fur.classList.add('drop-zone-highlight');
        } else if (draggedEl.classList.contains('petal')) {
            document.querySelectorAll('.petal-slot').forEach(slot => slot.classList.add('drop-zone-highlight'));
        } else if (draggedEl.classList.contains('flower-head') || draggedEl.id === 'flowerHead') {
            const zone = document.getElementById('flowerDropZone');
            if (zone) zone.classList.add('active');
        } else if (draggedEl.classList.contains('leaf')) {
            const zone = document.getElementById('leavesDropZone');
            if (zone) zone.classList.add('active');
        }
    },

    // 重新初始化动态生成的元素（花瓣等）
    reinit() {
        this.setupPetalDraggables();
        this.setupLeafDraggable(this.createDraggableConfig());
    },

    // 动态生成花瓣槽位后，重新绑定 dropzone
    setupPetalSlotDropzones() {
        document.querySelectorAll('.petal-slot').forEach(slot => {
            if (!interact.isSet(slot)) {
                interact(slot).dropzone({
                    accept: '.petal',
                    overlap: 0.3,
                    ondropactivate(event) {
                        event.target.classList.add('drop-zone-highlight');
                    },
                    ondragenter(event) {
                        event.target.classList.add('drop-zone-highlight');
                    },
                    ondragleave(event) {
                        event.target.classList.remove('drop-zone-highlight');
                    },
                    ondrop(event) {
                        event.target.classList.remove('drop-zone-highlight');
                        const slot = event.target;
                        if (!slot.classList.contains('filled')) {
                            document.dispatchEvent(new CustomEvent('petalPlaced', {
                                detail: { slot, petal: event.relatedTarget }
                            }));
                        }
                    },
                    ondropdeactivate(event) {
                        event.target.classList.remove('drop-zone-highlight');
                    }
                });
            }
        });
    }
};

window.DragManager = DragManager;
