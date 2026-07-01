'use strict';

WM.map = {
    MAP_CENTER_LNG: 113.945129,
    MAP_CENTER_LAT: 22.500940,
    MAP_ZOOM: 14,
    MAP_IMG_W: 800,
    MAP_IMG_H: 600,
    img: null,
    loaded: false,

    PLACES: [
        { name: '海上世界', lng: 113.917846, lat: 22.482264 },
        { name: '南海意馆', lng: 113.917656, lat: 22.486738 },
        { name: '南山书城', lng: 113.929568, lat: 22.519613 },
        { name: '海岸城', lng: 113.935647, lat: 22.516961 },
        { name: '深圳湾公园', lng: 113.972602, lat: 22.518968 },
    ],

    init: function () {
        const self = this;
        const theme = WM.currentTheme;
        if (theme && theme.map) {
            this.MAP_CENTER_LNG = theme.map.centerLng;
            this.MAP_CENTER_LAT = theme.map.centerLat;
            this.MAP_ZOOM = theme.map.zoom;
            this.MAP_IMG_W = theme.map.imgW;
            this.MAP_IMG_H = theme.map.imgH;
            this.PLACES = theme.map.places;
        }
        const imgSrc = (theme && theme.map && theme.map.img) ? theme.map.img : 'docs/maps/shenzhen_full.png';
        const hideLoading = function () {
            const el = document.getElementById('loading');
            if (el) el.style.display = 'none';
        };
        this.loaded = false;
        WM.mapImgLoaded = false;
        this.img = new Image();
        this.img.onload = function () {
            self.loaded = true;
            WM.mapImgLoaded = true;
            hideLoading();
        };
        this.img.onerror = function () {
            self.loaded = false;
            WM.mapImgLoaded = false;
            hideLoading();
            console.warn('地图图片加载失败，使用纯色背景。');
        };
        this.img.src = imgSrc;
        setTimeout(function () {
            if (!self.loaded) hideLoading();
        }, 100);
        this.resize();
    },

    resize: function () {
        const rect = WM.mapCanvas.parentElement.getBoundingClientRect();
        let w = rect.width, h = rect.height;
        if (w < 2) w = 800;
        if (h < 2) h = w * 3 / 5;
        const dpr = window.devicePixelRatio || 1;
        WM.mapCanvas.width = Math.round(w * dpr);
        WM.mapCanvas.height = Math.round(h * dpr);
        WM.mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this._cw = w;
        this._ch = h;
    },

    computeView: function (routePts, fill) {
        const cw = this._cw, ch = this._ch;
        const pts = routePts.map(p => this.lngLatToPixel(p[0], p[1]));
        let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
        pts.forEach(p => {
            if (p.x < minx) minx = p.x;
            if (p.x > maxx) maxx = p.x;
            if (p.y < miny) miny = p.y;
            if (p.y > maxy) maxy = p.y;
        });
        const rcx = (minx + maxx) / 2, rcy = (miny + maxy) / 2;
        const routeW = Math.max(maxx - minx, 1), routeH = Math.max(maxy - miny, 1);
        const coverScale = Math.max(cw / this.MAP_IMG_W, ch / this.MAP_IMG_H);
        const fitRouteScale = Math.min(cw / routeW * fill, ch / routeH * fill);
        const scale = Math.max(coverScale, fitRouteScale);
        const drawW = this.MAP_IMG_W * scale, drawH = this.MAP_IMG_H * scale;
        let offX = cw / 2 - rcx * scale;
        let offY = ch / 2 - rcy * scale;
        if (offX > 0) offX = 0;
        if (offX < cw - drawW) offX = cw - drawW;
        if (offY > 0) offY = 0;
        if (offY < ch - drawH) offY = ch - drawH;
        return { scale: scale, offX: offX, offY: offY, drawW: drawW, drawH: drawH };
    },

    lngLatToPixel: function (lng, lat) {
        const R = 6378137, ts = 256;
        const res = 2 * Math.PI * R / ts / Math.pow(2, this.MAP_ZOOM);
        const x = R * lng * Math.PI / 180;
        const y = R * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
        const cx = R * this.MAP_CENTER_LNG * Math.PI / 180;
        const cy = R * Math.log(Math.tan(Math.PI / 4 + this.MAP_CENTER_LAT * Math.PI / 360));
        return { x: (x - cx) / res + this.MAP_IMG_W / 2, y: (cy - y) / res + this.MAP_IMG_H / 2 };
    },

    drawGridFallback: function (cw, ch) {
        const mctx = WM.mctx;
        mctx.fillStyle = '#2d3a4a';
        mctx.fillRect(0, 0, cw, ch);
        mctx.strokeStyle = '#3a4a5a';
        mctx.lineWidth = 1;
        for (let x = 0; x < cw; x += 40) { mctx.beginPath(); mctx.moveTo(x, 0); mctx.lineTo(x, ch); mctx.stroke(); }
        for (let y = 0; y < ch; y += 40) { mctx.beginPath(); mctx.moveTo(0, y); mctx.lineTo(cw, y); mctx.stroke(); }
    },

    syncSize: function () {
        const rect = WM.mapCanvas.parentElement.getBoundingClientRect();
        if (rect.width >= 2 && rect.height >= 2) {
            if (Math.abs(rect.width - (this._cw || 0)) > 0.5 || Math.abs(rect.height - (this._ch || 0)) > 0.5) {
                this.resize();
            }
        } else if (!this._cw) {
            this.resize();
        }
    },

    draw: function (stageIndex) {
        const route = WM.ROUTES[stageIndex + 1];
        if (!route || !route.pts || !route.pts.length) return;
        this.syncSize();
        const mctx = WM.mctx;
        const cw = this._cw, ch = this._ch;
        mctx.clearRect(0, 0, cw, ch);

        const view = this.computeView(route.pts, 0.62);
        const scale = view.scale, offX = view.offX, offY = view.offY;

        if (this.loaded) {
            mctx.drawImage(this.img, offX, offY, view.drawW, view.drawH);
        } else {
            this.drawGridFallback(cw, ch);
        }

        const canvasPoints = route.pts.map(p => {
            const px = this.lngLatToPixel(p[0], p[1]);
            return { x: offX + px.x * scale, y: offY + px.y * scale };
        });

        mctx.strokeStyle = 'rgba(231,76,60,0.3)';
        mctx.lineWidth = 9; mctx.lineCap = 'round'; mctx.lineJoin = 'round';
        mctx.beginPath();
        canvasPoints.forEach((p, j) => j === 0 ? mctx.moveTo(p.x, p.y) : mctx.lineTo(p.x, p.y));
        mctx.stroke();

        mctx.strokeStyle = '#E74C3C'; mctx.lineWidth = 4;
        mctx.beginPath();
        canvasPoints.forEach((p, j) => j === 0 ? mctx.moveTo(p.x, p.y) : mctx.lineTo(p.x, p.y));
        mctx.stroke();

        const sC = canvasPoints[0];
        const eC = canvasPoints[canvasPoints.length - 1];
        this.drawMarker(sC.x, sC.y, '#2ECC71', 'S', route.from);
        this.drawMarker(eC.x, eC.y, '#FFD700', 'G', route.to);

        const phase = WM.state.phase;
        if (phase === 'walk') {
            const idx = Math.floor((WM.state.progress / 100) * (canvasPoints.length - 1));
            const pos = canvasPoints[idx];
            if (pos) {
                mctx.strokeStyle = 'rgba(231,76,60,0.6)'; mctx.lineWidth = 2;
                const r = 13 + Math.sin(Date.now() / 200) * 4;
                mctx.beginPath(); mctx.arc(pos.x, pos.y, r, 0, Math.PI * 2); mctx.stroke();
                mctx.fillStyle = '#E74C3C';
                mctx.beginPath(); mctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2); mctx.fill();
                mctx.fillStyle = '#F8F8F8';
                mctx.beginPath(); mctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2); mctx.fill();
            }
        } else if (phase === 'arrived' || phase === 'transition' || phase === 'ending' || phase === 'clear') {
            mctx.fillStyle = '#E74C3C';
            mctx.beginPath(); mctx.arc(eC.x, eC.y, 7, 0, Math.PI * 2); mctx.fill();
            mctx.fillStyle = '#F8F8F8';
            mctx.beginPath(); mctx.arc(eC.x, eC.y, 3, 0, Math.PI * 2); mctx.fill();
        }
    },

    drawAll: function () {
        this.syncSize();
        const mctx = WM.mctx;
        const cw = this._cw, ch = this._ch;
        mctx.clearRect(0, 0, cw, ch);

        const allPoints = [];
        const routeKeys = Object.keys(WM.ROUTES);
        routeKeys.forEach(function (k) {
            const route = WM.ROUTES[k];
            if (!route || !route.pts || !route.pts.length) return;
            route.pts.forEach(p => allPoints.push(p));
        });
        this.PLACES.forEach(pl => allPoints.push([pl.lng, pl.lat]));
        if (!allPoints.length) return;

        const view = this.computeView(allPoints, 0.9);
        const scale = view.scale, offX = view.offX, offY = view.offY;

        if (this.loaded) {
            mctx.drawImage(this.img, offX, offY, view.drawW, view.drawH);
        } else {
            this.drawGridFallback(cw, ch);
        }

        routeKeys.forEach(function (k) {
            const route = WM.ROUTES[k];
            if (!route || !route.pts || !route.pts.length) return;
            const canvasPoints = route.pts.map(p => {
                const px = WM.map.lngLatToPixel(p[0], p[1]);
                return { x: offX + px.x * scale, y: offY + px.y * scale };
            });
            mctx.strokeStyle = 'rgba(46,204,113,0.3)';
            mctx.lineWidth = 9; mctx.lineCap = 'round'; mctx.lineJoin = 'round';
            mctx.beginPath();
            canvasPoints.forEach((p, j) => j === 0 ? mctx.moveTo(p.x, p.y) : mctx.lineTo(p.x, p.y));
            mctx.stroke();
            mctx.strokeStyle = '#2ECC71'; mctx.lineWidth = 4;
            mctx.beginPath();
            canvasPoints.forEach((p, j) => j === 0 ? mctx.moveTo(p.x, p.y) : mctx.lineTo(p.x, p.y));
            mctx.stroke();
        });

        this.PLACES.forEach((pl, i) => {
            const px = this.lngLatToPixel(pl.lng, pl.lat);
            const x = offX + px.x * scale, y = offY + px.y * scale;
            this.drawMarker(x, y, '#2ECC71', String(i + 1), pl.name);
        });
    },

    drawMarker: function (x, y, color, label, name) {
        const mctx = WM.mctx;
        const grad = mctx.createRadialGradient(x, y, 0, x, y, 18);
        grad.addColorStop(0, 'rgba(255,215,0,0.3)');
        grad.addColorStop(1, 'rgba(255,215,0,0)');
        mctx.fillStyle = grad;
        mctx.beginPath(); mctx.arc(x, y, 18, 0, Math.PI * 2); mctx.fill();
        mctx.fillStyle = color;
        mctx.beginPath(); mctx.arc(x, y, 12, 0, Math.PI * 2); mctx.fill();
        mctx.fillStyle = '#F8F8F8';
        mctx.beginPath(); mctx.arc(x, y, 7, 0, Math.PI * 2); mctx.fill();
        mctx.fillStyle = '#0D0D0D'; mctx.font = 'bold 11px monospace';
        mctx.textAlign = 'center'; mctx.textBaseline = 'middle';
        mctx.fillText(label, x, y);
        mctx.fillStyle = 'rgba(13,13,13,0.85)';
        mctx.fillRect(x - 45, y - 32, 90, 18);
        mctx.fillStyle = '#FFD700'; mctx.font = '11px monospace';
        mctx.fillText(name, x, y - 23);
    },
};
