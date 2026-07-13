var PixelTextureGenerator = (function() {
    'use strict';

    var PIXEL_SIZE = 4;

    function createCanvas(width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        return { canvas: canvas, ctx: ctx };
    }

    function drawPixel(ctx, x, y, color, size) {
        ctx.fillStyle = color;
        ctx.fillRect(x * size, y * size, size, size);
    }

    function generatePixelWoodFloor(options) {
        options = options || {};
        var baseColor = options.baseColor || '#C4A484';
        var darkColor = options.darkColor || '#A08468';
        var lightColor = options.lightColor || '#D4B896';
        var grainColor = options.grainColor || '#8B7355';
        var pixelSize = options.pixelSize || PIXEL_SIZE;
        var width = options.width || 256;
        var height = options.height || 128;

        var result = createCanvas(width, height);
        var ctx = result.ctx;
        var cols = Math.floor(width / pixelSize);
        var rows = Math.floor(height / pixelSize);

        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var color = baseColor;
                if (y % 8 === 0 || y % 8 === 1) {
                    color = darkColor;
                } else if (y % 8 === 4 || y % 8 === 5) {
                    color = lightColor;
                }
                if (Math.random() < 0.03) {
                    color = grainColor;
                }
                drawPixel(ctx, x, y, color, pixelSize);
            }
        }

        for (var i = 0; i < 5; i++) {
            var plankY = Math.floor(Math.random() * rows);
            var plankX = Math.floor(Math.random() * (cols - 20));
            var knotSize = 3 + Math.floor(Math.random() * 3);
            for (var ky = -knotSize; ky <= knotSize; ky++) {
                for (var kx = -knotSize; kx <= knotSize; kx++) {
                    if (kx * kx + ky * ky <= knotSize * knotSize) {
                        var px = plankX + kx;
                        var py = plankY + ky;
                        if (px >= 0 && px < cols && py >= 0 && py < rows) {
                            drawPixel(ctx, px, py, grainColor, pixelSize);
                        }
                    }
                }
            }
        }

        return result.canvas;
    }

    function generatePixelTileFloor(options) {
        options = options || {};
        var baseColor = options.baseColor || '#E8E4D8';
        var darkColor = options.darkColor || '#C8C4B8';
        var groutColor = options.groutColor || '#A8A498';
        var pixelSize = options.pixelSize || PIXEL_SIZE;
        var width = options.width || 256;
        var height = options.height || 128;
        var tileSize = options.tileSize || 16;

        var result = createCanvas(width, height);
        var ctx = result.ctx;
        var cols = Math.floor(width / pixelSize);
        var rows = Math.floor(height / pixelSize);

        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var inGrout = (x % tileSize === 0 || y % tileSize === 0);
                if (inGrout) {
                    drawPixel(ctx, x, y, groutColor, pixelSize);
                } else {
                    var color = baseColor;
                    if (((x / tileSize | 0) + (y / tileSize | 0)) % 2 === 0) {
                        color = darkColor;
                    }
                    if (Math.random() < 0.02) {
                        color = groutColor;
                    }
                    drawPixel(ctx, x, y, color, pixelSize);
                }
            }
        }

        return result.canvas;
    }

    function generatePixelCarpet(options) {
        options = options || {};
        var baseColor = options.baseColor || '#B89068';
        var patternColor1 = options.patternColor1 || '#D4A878';
        var patternColor2 = options.patternColor2 || '#987048';
        var pixelSize = options.pixelSize || PIXEL_SIZE;
        var width = options.width || 256;
        var height = options.height || 128;

        var result = createCanvas(width, height);
        var ctx = result.ctx;
        var cols = Math.floor(width / pixelSize);
        var rows = Math.floor(height / pixelSize);

        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var color = baseColor;
                if (Math.random() < 0.1) {
                    color = patternColor1;
                } else if (Math.random() < 0.08) {
                    color = patternColor2;
                }
                if ((x < 4 || x >= cols - 4 || y < 4 || y >= rows - 4) && (x + y) % 4 === 0) {
                    color = patternColor2;
                }
                drawPixel(ctx, x, y, color, pixelSize);
            }
        }

        return result.canvas;
    }

    function generatePixelBrickWall(options) {
        options = options || {};
        var baseColor = options.baseColor || '#E8DCC8';
        var darkColor = options.darkColor || '#D4C4A8';
        var mortarColor = options.mortarColor || '#C8B898';
        var pixelSize = options.pixelSize || PIXEL_SIZE;
        var width = options.width || 256;
        var height = options.height || 192;

        var result = createCanvas(width, height);
        var ctx = result.ctx;
        var cols = Math.floor(width / pixelSize);
        var rows = Math.floor(height / pixelSize);
        var brickWidth = 16;
        var brickHeight = 8;
        var mortarThickness = 1;

        for (var y = 0; y < rows; y++) {
            var rowInBrick = y % brickHeight;
            var rowIdx = (y / brickHeight) | 0;
            var offset = (rowIdx % 2 === 0) ? 0 : brickWidth / 2;

            for (var x = 0; x < cols; x++) {
                var xWithOffset = (x + offset) % brickWidth;
                var inMortar = rowInBrick < mortarThickness || rowInBrick >= brickHeight - mortarThickness ||
                    xWithOffset < mortarThickness || xWithOffset >= brickWidth - mortarThickness;

                if (inMortar) {
                    drawPixel(ctx, x, y, mortarColor, pixelSize);
                } else {
                    var color = baseColor;
                    if (rowInBrick === mortarThickness || rowInBrick === brickHeight - mortarThickness - 1) {
                        color = darkColor;
                    }
                    if (Math.random() < 0.02) {
                        color = darkColor;
                    }
                    drawPixel(ctx, x, y, color, pixelSize);
                }
            }
        }

        return result.canvas;
    }

    function generatePixelWallpaper(pattern, options) {
        options = options || {};
        var baseColor = options.baseColor || '#F5EEE8';
        var patternColor = options.patternColor || '#E8DCC8';
        var accentColor = options.accentColor || '#D4B896';
        var pixelSize = options.pixelSize || PIXEL_SIZE;
        var width = options.width || 256;
        var height = options.height || 192;

        var result = createCanvas(width, height);
        var ctx = result.ctx;
        var cols = Math.floor(width / pixelSize);
        var rows = Math.floor(height / pixelSize);

        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                drawPixel(ctx, x, y, baseColor, pixelSize);
            }
        }

        if (pattern === 'floral') {
            for (var fy = 8; fy < rows - 8; fy += 16) {
                for (var fx = 8; fx < cols - 8; fx += 16) {
                    var flowerX = fx + (Math.floor(fy / 16) % 2 === 0 ? 0 : 8);
                    drawPixel(ctx, flowerX, fy, accentColor, pixelSize);
                    drawPixel(ctx, flowerX - 2, fy - 1, patternColor, pixelSize);
                    drawPixel(ctx, flowerX + 2, fy - 1, patternColor, pixelSize);
                    drawPixel(ctx, flowerX - 1, fy - 2, patternColor, pixelSize);
                    drawPixel(ctx, flowerX + 1, fy - 2, patternColor, pixelSize);
                    drawPixel(ctx, flowerX, fy + 2, patternColor, pixelSize);
                }
            }
        } else if (pattern === 'stripe') {
            for (var sx = 0; sx < cols; sx += 8) {
                for (var sy = 0; sy < rows; sy++) {
                    drawPixel(ctx, sx, sy, patternColor, pixelSize);
                }
            }
        } else if (pattern === 'dot') {
            for (var dy = 6; dy < rows; dy += 12) {
                for (var dx = 6; dx < cols; dx += 12) {
                    var dd = dy + (Math.floor(dx / 12) % 2 === 0 ? 0 : 6);
                    drawPixel(ctx, dx, dd, patternColor, pixelSize);
                    drawPixel(ctx, dx + 1, dd, patternColor, pixelSize);
                    drawPixel(ctx, dx, dd + 1, patternColor, pixelSize);
                    drawPixel(ctx, dx + 1, dd + 1, patternColor, pixelSize);
                }
            }
        } else {
            for (var py = 0; py < rows; py += 20) {
                for (var px = 0; px < cols; px += 20) {
                    drawPixel(ctx, px + 2, py + 2, patternColor, pixelSize);
                    drawPixel(ctx, px + 3, py + 2, patternColor, pixelSize);
                    drawPixel(ctx, px + 2, py + 3, patternColor, pixelSize);
                }
            }
        }

        return result.canvas;
    }

    function generatePixelConcrete(options) {
        options = options || {};
        var baseColor = options.baseColor || '#B8B0A0';
        var darkColor = options.darkColor || '#A09888';
        var lightColor = options.lightColor || '#C8C0B0';
        var pixelSize = options.pixelSize || PIXEL_SIZE;
        var width = options.width || 256;
        var height = options.height || 192;

        var result = createCanvas(width, height);
        var ctx = result.ctx;
        var cols = Math.floor(width / pixelSize);
        var rows = Math.floor(height / pixelSize);

        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var color = baseColor;
                var rand = Math.random();
                if (rand < 0.15) {
                    color = darkColor;
                } else if (rand < 0.25) {
                    color = lightColor;
                }
                drawPixel(ctx, x, y, color, pixelSize);
            }
        }

        for (var i = 0; i < 8; i++) {
            var sx = Math.floor(Math.random() * cols);
            var sy = Math.floor(Math.random() * rows);
            var len = 4 + Math.floor(Math.random() * 8);
            for (var j = 0; j < len; j++) {
                if (sx + j < cols) {
                    drawPixel(ctx, sx + j, sy, darkColor, pixelSize);
                }
            }
        }

        return result.canvas;
    }

    function canvasToDataURL(canvas) {
        return canvas.toDataURL('image/png');
    }

    return {
        generatePixelWoodFloor: generatePixelWoodFloor,
        generatePixelTileFloor: generatePixelTileFloor,
        generatePixelCarpet: generatePixelCarpet,
        generatePixelBrickWall: generatePixelBrickWall,
        generatePixelWallpaper: generatePixelWallpaper,
        generatePixelConcrete: generatePixelConcrete,
        canvasToDataURL: canvasToDataURL
    };
})();
