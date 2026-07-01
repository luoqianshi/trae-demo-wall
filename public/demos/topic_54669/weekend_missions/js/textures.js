'use strict';

WM.textures = {
    drawPlayerFrame: function (g, dir, frame) {
        const PAL = WM.PAL;
        const x = 0, y = 0, step = frame;
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 3, y + 14, 10, 2);
        if (dir === 0) {
            g.fillStyle = PAL.hair; g.fillRect(x + 4, y + 1, 8, 3); g.fillRect(x + 3, y + 2, 10, 2);
            g.fillStyle = PAL.skin; g.fillRect(x + 4, y + 3, 8, 5);
            g.fillStyle = PAL.skinDk; g.fillRect(x + 4, y + 7, 8, 1);
            g.fillStyle = PAL.black; g.fillRect(x + 6, y + 5, 1, 2); g.fillRect(x + 9, y + 5, 1, 2);
            g.fillStyle = PAL.shirt; g.fillRect(x + 3, y + 8, 10, 5);
            g.fillStyle = PAL.shirtLt; g.fillRect(x + 4, y + 8, 8, 1);
            g.fillStyle = PAL.shirtDk; g.fillRect(x + 3, y + 12, 10, 1);
            g.fillStyle = PAL.skin; g.fillRect(x + 1, y + 9 + (step ? 1 : 0), 2, 4); g.fillRect(x + 13, y + 9 - (step ? 1 : 0), 2, 4);
            g.fillStyle = PAL.pants; g.fillRect(x + 4, y + 13, 3, 2 + (step ? 0 : 1)); g.fillRect(x + 9, y + 13, 3, 2 + (step ? 1 : 0));
            g.fillStyle = PAL.shoe; g.fillRect(x + 4, y + 15, 3, 1); g.fillRect(x + 9, y + 15, 3, 1);
        } else if (dir === 1) {
            g.fillStyle = PAL.hair; g.fillRect(x + 4, y + 1, 8, 5); g.fillRect(x + 3, y + 2, 10, 3);
            g.fillStyle = PAL.skin; g.fillRect(x + 4, y + 6, 8, 2);
            g.fillStyle = PAL.shirt; g.fillRect(x + 3, y + 8, 10, 5);
            g.fillStyle = PAL.shirtLt; g.fillRect(x + 4, y + 8, 8, 1);
            g.fillStyle = PAL.shirtDk; g.fillRect(x + 3, y + 12, 10, 1);
            g.fillStyle = PAL.skin; g.fillRect(x + 1, y + 9 + (step ? 1 : 0), 2, 4); g.fillRect(x + 13, y + 9 - (step ? 1 : 0), 2, 4);
            g.fillStyle = PAL.pants; g.fillRect(x + 4, y + 13, 3, 2 + (step ? 0 : 1)); g.fillRect(x + 9, y + 13, 3, 2 + (step ? 1 : 0));
            g.fillStyle = PAL.shoe; g.fillRect(x + 4, y + 15, 3, 1); g.fillRect(x + 9, y + 15, 3, 1);
        } else {
            const flip = dir === 2;
            g.save();
            if (flip) { g.translate(16, 0); g.scale(-1, 1); }
            g.fillStyle = PAL.hair; g.fillRect(4, 1, 8, 3); g.fillRect(3, 2, 10, 2);
            g.fillStyle = PAL.skin; g.fillRect(4, 3, 8, 5);
            g.fillStyle = PAL.skinDk; g.fillRect(4, 7, 8, 1);
            g.fillStyle = PAL.black; g.fillRect(9, 5, 1, 2);
            g.fillStyle = PAL.shirt; g.fillRect(3, 8, 10, 5);
            g.fillStyle = PAL.shirtLt; g.fillRect(4, 8, 8, 1);
            g.fillStyle = PAL.shirtDk; g.fillRect(3, 12, 10, 1);
            g.fillStyle = PAL.skin; g.fillRect(1, 9 + (step ? 1 : 0), 2, 4); g.fillRect(13, 9 - (step ? 1 : 0), 2, 4);
            g.fillStyle = PAL.pants; g.fillRect(5, 13, 3, 2 + (step ? 1 : 0)); g.fillRect(9, 13, 3, 2 + (step ? 0 : 1));
            g.fillStyle = PAL.shoe; g.fillRect(5, 15 + (step ? 1 : 0), 3, 1); g.fillRect(9, 15 + (step ? 0 : 1), 3, 1);
            g.restore();
        }
    },

    init: function () {
        const PAL = WM.PAL;
        const makeTex = WM.makeTex;
        const tex = WM.tex;
        const self = this;

        tex.floorA = makeTex(16, 16, function (g) {
            g.fillStyle = PAL.floor; g.fillRect(0, 0, 16, 16);
            g.fillStyle = PAL.floorDk; g.fillRect(0, 5, 16, 1); g.fillRect(0, 11, 16, 1);
            g.fillStyle = PAL.floorLt; g.fillRect(0, 0, 16, 1); g.fillRect(0, 6, 16, 1); g.fillRect(0, 12, 16, 1);
            g.fillStyle = PAL.floorDk; g.fillRect(7, 1, 1, 4); g.fillRect(3, 7, 1, 4); g.fillRect(11, 13, 1, 3);
        });
        tex.floorB = makeTex(16, 16, function (g) {
            g.fillStyle = PAL.floorLt; g.fillRect(0, 0, 16, 16);
            g.fillStyle = PAL.floor; g.fillRect(0, 5, 16, 1); g.fillRect(0, 11, 16, 1);
            g.fillStyle = PAL.floorDk; g.fillRect(5, 1, 1, 4); g.fillRect(9, 7, 1, 4); g.fillRect(0, 6, 16, 1); g.fillRect(0, 12, 16, 1);
        });
        tex.wallFloor = makeTex(16, 16, function (g) {
            g.fillStyle = PAL.wallDk; g.fillRect(0, 0, 16, 6);
            g.fillStyle = PAL.wallLt; g.fillRect(0, 0, 16, 1);
            g.fillStyle = PAL.floor; g.fillRect(0, 6, 16, 10);
            g.fillStyle = PAL.floorDk; g.fillRect(0, 11, 16, 1);
            g.fillStyle = PAL.floorLt; g.fillRect(0, 6, 16, 1); g.fillRect(0, 12, 16, 1);
        });
        tex.wall = makeTex(16, 16, function (g) {
            g.fillStyle = PAL.wall; g.fillRect(0, 0, 16, 16);
            g.fillStyle = PAL.wallDk;
            g.fillRect(0, 3, 16, 1); g.fillRect(0, 7, 16, 1); g.fillRect(0, 11, 16, 1); g.fillRect(0, 15, 16, 1);
            g.fillRect(7, 0, 1, 4); g.fillRect(3, 4, 1, 4); g.fillRect(11, 8, 1, 4); g.fillRect(7, 12, 1, 4);
            g.fillStyle = PAL.wallLt; g.fillRect(0, 0, 16, 1);
        });
        tex.bar = makeTex(32, 16, function (g) {
            g.fillStyle = PAL.bar; g.fillRect(0, 0, 32, 16);
            g.fillStyle = PAL.barTop; g.fillRect(0, 0, 32, 2);
            g.fillStyle = PAL.barLt; g.fillRect(0, 2, 32, 1);
            g.fillStyle = PAL.barDk; g.fillRect(0, 14, 32, 2);
            g.fillStyle = PAL.barDk; g.fillRect(5, 5, 1, 8); g.fillRect(15, 5, 1, 8); g.fillRect(25, 5, 1, 8);
        });
        tex.machine = makeTex(32, 32, function (g) {
            g.fillStyle = PAL.machine; g.fillRect(2, 6, 28, 24);
            g.fillStyle = PAL.machineDk; g.fillRect(0, 2, 32, 6);
            g.fillStyle = PAL.machineLt; g.fillRect(2, 6, 1, 24); g.fillRect(29, 6, 1, 24); g.fillRect(2, 6, 28, 1);
            g.fillStyle = PAL.black; g.fillRect(6, 10, 8, 4);
            g.fillStyle = '#44ff44'; g.fillRect(7, 11, 1, 2); g.fillRect(9, 11, 1, 2); g.fillRect(11, 11, 1, 2);
            g.fillStyle = PAL.machineBtn; g.fillRect(18, 10, 3, 3);
            g.fillStyle = PAL.lamp; g.fillRect(23, 10, 3, 3);
            g.fillStyle = PAL.machineDk; g.fillRect(12, 18, 8, 6);
            g.fillStyle = PAL.machineLt; g.fillRect(12, 18, 8, 1);
            g.fillStyle = PAL.white; g.fillRect(14, 24, 4, 4);
            g.fillStyle = PAL.coffee; g.fillRect(14, 24, 4, 1);
        });
        tex.table = makeTex(24, 16, function (g) {
            g.fillStyle = PAL.table; g.fillRect(0, 0, 24, 8);
            g.fillStyle = PAL.tableLt; g.fillRect(0, 0, 24, 2);
            g.fillStyle = PAL.tableDk; g.fillRect(0, 6, 24, 2);
            g.fillStyle = PAL.tableDk; g.fillRect(4, 8, 2, 6); g.fillRect(18, 8, 2, 6);
            g.fillStyle = PAL.white; g.fillRect(10, 2, 4, 3);
            g.fillStyle = PAL.coffee; g.fillRect(11, 3, 2, 1);
        });
        tex.chair = makeTex(16, 16, function (g) {
            g.fillStyle = PAL.chair; g.fillRect(0, 0, 16, 14);
            g.fillStyle = PAL.chairDk; g.fillRect(0, 12, 16, 2);
            g.fillStyle = PAL.tableLt; g.fillRect(0, 0, 16, 1);
            g.fillStyle = PAL.chairDk; g.fillRect(2, 0, 1, 4); g.fillRect(13, 0, 1, 4); g.fillRect(2, 0, 12, 1);
        });
        tex.lamp = makeTex(16, 16, function (g) {
            g.fillStyle = '#222222'; g.fillRect(7, 0, 2, 6);
            g.fillStyle = PAL.lampDk; g.fillRect(2, 6, 12, 6);
            g.fillStyle = PAL.lamp; g.fillRect(3, 7, 10, 4);
            g.fillStyle = PAL.lampGlow; g.fillRect(5, 9, 6, 1); g.fillRect(6, 10, 4, 1);
        });
        tex.menu = makeTex(32, 24, function (g) {
            g.fillStyle = PAL.boardFrame; g.fillRect(0, 0, 32, 24);
            g.fillStyle = PAL.boardBg; g.fillRect(2, 2, 28, 20);
            g.fillStyle = PAL.boardText;
            g.fillRect(6, 4, 2, 1); g.fillRect(9, 4, 2, 1); g.fillRect(12, 4, 2, 1); g.fillRect(15, 4, 2, 1); g.fillRect(18, 4, 2, 1);
            g.fillRect(4, 8, 16, 1); g.fillRect(4, 11, 12, 1); g.fillRect(4, 14, 18, 1);
            g.fillStyle = PAL.machineBtn; g.fillRect(22, 8, 6, 1); g.fillRect(22, 11, 6, 1); g.fillRect(22, 14, 6, 1);
        });
        tex.window = makeTex(32, 24, function (g) {
            g.fillStyle = PAL.windowFrame; g.fillRect(0, 0, 32, 24);
            g.fillStyle = PAL.windowSky; g.fillRect(2, 2, 28, 20);
            g.fillStyle = PAL.white;
            g.fillRect(5, 5, 8, 3); g.fillRect(7, 4, 4, 1);
            g.fillRect(18, 9, 6, 2); g.fillRect(4, 14, 5, 2); g.fillRect(18, 15, 7, 3);
            g.fillStyle = PAL.windowFrame; g.fillRect(15, 2, 2, 20); g.fillRect(2, 11, 28, 2);
        });
        tex.plant = makeTex(16, 24, function (g) {
            g.fillStyle = PAL.pot; g.fillRect(0, 12, 16, 12);
            g.fillStyle = PAL.potDk; g.fillRect(0, 22, 16, 2);
            g.fillStyle = PAL.tableLt; g.fillRect(0, 12, 16, 1);
            g.fillStyle = PAL.plant; g.fillRect(2, 6, 4, 6); g.fillRect(6, 2, 4, 10); g.fillRect(10, 6, 4, 6);
            g.fillStyle = PAL.plantLt; g.fillRect(3, 7, 2, 4); g.fillRect(7, 3, 2, 8); g.fillRect(11, 7, 2, 4);
        });
        tex.star = makeTex(16, 12, function (g) {
            g.fillStyle = PAL.star;
            g.fillRect(6, 0, 4, 2); g.fillRect(4, 2, 8, 2); g.fillRect(0, 4, 16, 4);
            g.fillRect(4, 8, 8, 2); g.fillRect(2, 10, 4, 2); g.fillRect(10, 10, 4, 2);
            g.fillStyle = PAL.starLt; g.fillRect(7, 1, 2, 1); g.fillRect(6, 4, 4, 2);
        });

        const player = [];
        for (let dir = 0; dir < 4; dir++) {
            player[dir] = [];
            for (let f = 0; f < 2; f++) {
                player[dir][f] = makeTex(16, 16, function (g) { self.drawPlayerFrame(g, dir, f); });
            }
        }
        tex.player = player;

        tex.playerHold = makeTex(16, 16, function (g) {
            self.drawPlayerFrame(g, 0, 0);
            g.fillStyle = PAL.white; g.fillRect(11, 9, 4, 4);
            g.fillStyle = PAL.coffee; g.fillRect(12, 10, 2, 1);
            g.fillStyle = PAL.skin; g.fillRect(10, 10, 1, 3);
        });

        tex.playerHoldBook = makeTex(16, 16, function (g) {
            self.drawPlayerFrame(g, 0, 0);
            g.fillStyle = PAL.green; g.fillRect(10, 9, 5, 4);
            g.fillStyle = PAL.white; g.fillRect(11, 10, 3, 2);
            g.fillStyle = PAL.plant; g.fillRect(10, 9, 5, 1);
            g.fillStyle = PAL.skin; g.fillRect(9, 10, 1, 3);
        });

        tex.playerHoldCamera = makeTex(16, 16, function (g) {
            self.drawPlayerFrame(g, 0, 0);
            g.fillStyle = PAL.black; g.fillRect(10, 8, 5, 4);
            g.fillStyle = PAL.machineLt; g.fillRect(11, 9, 2, 2);
            g.fillStyle = PAL.lamp; g.fillRect(13, 9, 1, 1);
            g.fillStyle = PAL.skin; g.fillRect(9, 9, 1, 3);
        });

        tex.playerSit = makeTex(16, 16, function (g) {
            g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(4, 14, 8, 2);
            g.fillStyle = PAL.hair; g.fillRect(5, 2, 6, 3); g.fillRect(4, 3, 8, 2);
            g.fillStyle = PAL.skin; g.fillRect(5, 4, 6, 4);
            g.fillStyle = PAL.skinDk; g.fillRect(5, 7, 6, 1);
            g.fillStyle = PAL.black; g.fillRect(6, 5, 1, 2); g.fillRect(9, 5, 1, 2);
            g.fillStyle = PAL.shirt; g.fillRect(4, 8, 8, 4);
            g.fillStyle = PAL.shirtLt; g.fillRect(5, 8, 6, 1);
            g.fillStyle = PAL.shirtDk; g.fillRect(4, 11, 8, 1);
            g.fillStyle = PAL.skin; g.fillRect(2, 9, 2, 3); g.fillRect(12, 9, 2, 3);
            g.fillStyle = PAL.pants; g.fillRect(4, 12, 3, 3); g.fillRect(9, 12, 3, 3);
            g.fillStyle = PAL.shoe; g.fillRect(4, 15, 3, 1); g.fillRect(9, 15, 3, 1);
        });

        function makeBuildingTex(color, winColor) {
            return makeTex(32, 48, function (g) {
                g.fillStyle = color; g.fillRect(0, 8, 32, 40);
                g.fillStyle = PAL.wallDk; g.fillRect(0, 0, 32, 8);
                g.fillStyle = PAL.wallLt; g.fillRect(0, 0, 32, 1);
                g.fillStyle = winColor;
                for (let row = 0; row < 3; row++) {
                    for (let col = 0; col < 3; col++) {
                        g.fillRect(4 + col * 9, 14 + row * 10, 5, 6);
                    }
                }
                g.fillStyle = PAL.wallDk; g.fillRect(13, 38, 6, 10);
                g.fillStyle = PAL.lamp; g.fillRect(17, 42, 1, 1);
            });
        }
        tex.building = [
            makeBuildingTex(PAL.bldg1, PAL.bldgWindow),
            makeBuildingTex(PAL.bldg2, PAL.bldgWindow2),
            makeBuildingTex(PAL.bldg3, PAL.bldgWindow),
        ];

        tex.tree = makeTex(16, 32, function (g) {
            g.fillStyle = PAL.treeTrunk; g.fillRect(6, 20, 4, 12);
            g.fillStyle = PAL.plant; g.fillRect(2, 4, 12, 16);
            g.fillStyle = PAL.plantLt; g.fillRect(4, 6, 8, 12);
            g.fillStyle = PAL.plant; g.fillRect(0, 8, 4, 8); g.fillRect(12, 8, 4, 8);
            g.fillStyle = PAL.plantLt; g.fillRect(6, 2, 4, 4);
        });

        tex.cloud = makeTex(32, 16, function (g) {
            g.fillStyle = PAL.white;
            g.fillRect(8, 4, 16, 8);
            g.fillRect(4, 6, 24, 4);
            g.fillRect(12, 2, 8, 4);
            g.fillRect(16, 10, 8, 4);
        });

        const bookColors = [PAL.red, PAL.green, PAL.cyan, PAL.yellow, PAL.shirt, PAL.pants];
        tex.bookshelf = makeTex(32, 40, function (g) {
            g.fillStyle = PAL.wallDk; g.fillRect(0, 0, 32, 40);
            g.fillStyle = PAL.wallLt; g.fillRect(0, 0, 32, 1);
            g.fillStyle = PAL.tableDk; g.fillRect(0, 0, 2, 40); g.fillRect(30, 0, 2, 40);
            for (let shelf = 0; shelf < 3; shelf++) {
                const sy = 2 + shelf * 13;
                g.fillStyle = PAL.barDk; g.fillRect(2, sy + 10, 28, 2);
                for (let b = 0; b < 6; b++) {
                    const bx = 3 + b * 4.5;
                    g.fillStyle = bookColors[(shelf * 6 + b) % bookColors.length];
                    g.fillRect(Math.round(bx), sy, 4, 10);
                    g.fillStyle = PAL.white; g.fillRect(Math.round(bx), sy + 2, 4, 1);
                }
            }
        });

        tex.readTable = makeTex(24, 16, function (g) {
            g.fillStyle = PAL.table; g.fillRect(0, 0, 24, 8);
            g.fillStyle = PAL.tableLt; g.fillRect(0, 0, 24, 2);
            g.fillStyle = PAL.tableDk; g.fillRect(0, 6, 24, 2);
            g.fillStyle = PAL.tableDk; g.fillRect(4, 8, 2, 6); g.fillRect(18, 8, 2, 6);
            g.fillStyle = PAL.green; g.fillRect(9, 2, 7, 4);
            g.fillStyle = PAL.white; g.fillRect(11, 3, 5, 2);
            g.fillStyle = PAL.plant; g.fillRect(9, 2, 7, 1);
        });

        tex.glassRail = makeTex(32, 16, function (g) {
            g.fillStyle = PAL.machineLt; g.fillRect(0, 0, 32, 2);
            g.fillStyle = 'rgba(108,180,232,0.35)'; g.fillRect(0, 2, 32, 12);
            g.fillStyle = PAL.machineLt;
            g.fillRect(2, 2, 2, 12); g.fillRect(15, 2, 2, 12); g.fillRect(28, 2, 2, 12);
            g.fillStyle = PAL.machine; g.fillRect(0, 14, 32, 2);
            g.fillStyle = PAL.white; g.fillRect(0, 0, 32, 1);
        });

        tex.bench = makeTex(32, 16, function (g) {
            g.fillStyle = PAL.chair; g.fillRect(0, 4, 32, 4);
            g.fillStyle = PAL.tableLt; g.fillRect(0, 4, 32, 1);
            g.fillStyle = PAL.chairDk; g.fillRect(0, 7, 32, 1);
            g.fillStyle = PAL.chair; g.fillRect(0, 0, 32, 3);
            g.fillStyle = PAL.tableLt; g.fillRect(0, 0, 32, 1);
            g.fillStyle = PAL.chairDk; g.fillRect(3, 8, 2, 8); g.fillRect(27, 8, 2, 8);
        });

        tex.vendingMachine = makeTex(24, 32, function (g) {
            g.fillStyle = PAL.machine; g.fillRect(0, 0, 24, 32);
            g.fillStyle = PAL.machineLt; g.fillRect(0, 0, 24, 1); g.fillRect(0, 0, 1, 32);
            g.fillStyle = PAL.machineDk; g.fillRect(23, 0, 1, 32); g.fillRect(0, 31, 24, 1);
            g.fillStyle = PAL.black; g.fillRect(3, 3, 12, 20);
            const items = [PAL.red, PAL.cyan, PAL.yellow, PAL.green, PAL.shirt, PAL.pants];
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 2; c++) {
                    g.fillStyle = items[(r * 2 + c) % items.length];
                    g.fillRect(4 + c * 6, 4 + r * 6, 4, 4);
                }
            }
            g.fillStyle = PAL.machineDk; g.fillRect(17, 4, 5, 12);
            g.fillStyle = PAL.machineBtn; g.fillRect(18, 5, 3, 2);
            g.fillStyle = PAL.lamp; g.fillRect(18, 8, 3, 2);
            g.fillStyle = PAL.cyan; g.fillRect(18, 11, 3, 2);
            g.fillStyle = PAL.black; g.fillRect(3, 25, 18, 4);
        });

        tex.benchPark = makeTex(32, 16, function (g) {
            g.fillStyle = PAL.treeTrunk; g.fillRect(0, 4, 32, 4);
            g.fillStyle = PAL.plantLt; g.fillRect(0, 4, 32, 1);
            g.fillStyle = PAL.ground2; g.fillRect(0, 7, 32, 1);
            g.fillStyle = PAL.treeTrunk; g.fillRect(0, 0, 32, 3);
            g.fillStyle = PAL.plantLt; g.fillRect(0, 0, 32, 1);
            g.fillStyle = PAL.machine; g.fillRect(3, 8, 2, 8); g.fillRect(27, 8, 2, 8);
        });

        tex.streetLamp = makeTex(8, 32, function (g) {
            g.fillStyle = PAL.machine; g.fillRect(3, 6, 2, 26);
            g.fillStyle = PAL.machineLt; g.fillRect(3, 6, 1, 26);
            g.fillStyle = PAL.lampDk; g.fillRect(1, 2, 6, 5);
            g.fillStyle = PAL.lamp; g.fillRect(2, 3, 4, 3);
            g.fillStyle = PAL.lampGlow; g.fillRect(3, 4, 2, 1);
            g.fillStyle = PAL.machineDk; g.fillRect(2, 30, 4, 2);
        });

        tex.beachTree = makeTex(16, 32, function (g) {
            g.fillStyle = PAL.treeTrunk; g.fillRect(7, 12, 3, 20);
            g.fillStyle = PAL.ground2; g.fillRect(7, 12, 1, 20);
            g.fillStyle = PAL.plant;
            g.fillRect(2, 6, 6, 2); g.fillRect(0, 4, 4, 2);
            g.fillRect(8, 6, 6, 2); g.fillRect(12, 4, 4, 2);
            g.fillRect(5, 2, 6, 3);
            g.fillStyle = PAL.plantLt;
            g.fillRect(2, 7, 5, 1); g.fillRect(9, 7, 5, 1); g.fillRect(6, 3, 4, 2);
            g.fillStyle = PAL.lampDk; g.fillRect(6, 8, 2, 2); g.fillRect(8, 9, 2, 2);
        });
    },
};
