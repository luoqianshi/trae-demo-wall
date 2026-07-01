const fs = require('fs');
const path = require('path');

const key = process.env.AMAP_KEY;
if (!key) {
    console.error('Missing AMAP_KEY environment variable.');
    process.exit(1);
}

const outDir = path.join(__dirname, '..', 'docs', 'maps');

const configs = {
    hangzhou: {
        city: '杭州',
        mapFile: 'hangzhou.png',
        routeFile: 'routes-hangzhou.json',
        map: { location: '120.15,30.28', zoom: 13, size: '800*600' },
        places: [
            { name: '西湖边的小茶馆', query: '杭州 西湖边 茶馆' },
            { name: '河坊街老面馆', query: '杭州 河坊街 面馆' },
            { name: '中国美术学院南山校区', query: '中国美术学院南山校区' },
            { name: '南宋御街', query: '南宋御街' },
            { name: '宝石山日落', query: '杭州 宝石山' },
        ],
    },
    shanghai: {
        city: '上海',
        mapFile: 'shanghai.png',
        routeFile: 'routes-shanghai.json',
        map: { location: '121.47,31.23', zoom: 13, size: '800*600' },
        places: [
            { name: '武康路咖啡', query: '上海 武康路 咖啡' },
            { name: '老上海本帮菜', query: '上海 黄浦区 本帮菜' },
            { name: '田子坊艺术区', query: '田子坊' },
            { name: '南京路步行街', query: '南京路步行街' },
            { name: '外滩夜景', query: '外滩' },
        ],
    },
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestJson(url, label) {
    for (let attempt = 1; attempt <= 6; attempt++) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${label || url.origin + url.pathname}`);
        const data = await res.json();
        if (data.status === '1') {
            await sleep(450);
            return data;
        }
        if (data.infocode === '10021' && attempt < 6) {
            const wait = attempt * 1200;
            console.log(`QPS limit, retry ${attempt}/5 after ${wait}ms: ${label || url.origin + url.pathname}`);
            await sleep(wait);
            continue;
        }
        throw new Error(`${data.info || 'AMAP_ERROR'} (${data.infocode || 'no infocode'}): ${label || url.origin + url.pathname}`);
    }
}

async function downloadFile(url, filePath) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buf);
}

async function geocode(place, city) {
    const poiUrl = new URL('https://restapi.amap.com/v3/place/text');
    poiUrl.searchParams.set('key', key);
    poiUrl.searchParams.set('keywords', place.query);
    poiUrl.searchParams.set('city', city);
    poiUrl.searchParams.set('citylimit', 'true');
    poiUrl.searchParams.set('offset', '1');
    poiUrl.searchParams.set('page', '1');
    poiUrl.searchParams.set('output', 'JSON');
    const poiData = await requestJson(poiUrl, `POI ${city} ${place.query}`);
    const poi = poiData.pois && poiData.pois[0];
    if (poi && poi.location) {
        const [lng, lat] = poi.location.split(',').map(Number);
        return { name: place.name, lng, lat, source: poi.name || place.query };
    }

    const geoUrl = new URL('https://restapi.amap.com/v3/geocode/geo');
    geoUrl.searchParams.set('key', key);
    geoUrl.searchParams.set('address', place.query);
    geoUrl.searchParams.set('city', city);
    geoUrl.searchParams.set('output', 'JSON');
    const geoData = await requestJson(geoUrl, `GEO ${city} ${place.query}`);
    const item = geoData.geocodes && geoData.geocodes[0];
    if (!item || !item.location) throw new Error(`No geocode result for ${place.query}`);
    const [lng, lat] = item.location.split(',').map(Number);
    return { name: place.name, lng, lat, source: item.formatted_address || place.query };
}

async function walkingRoute(from, to) {
    const url = new URL('https://restapi.amap.com/v3/direction/walking');
    url.searchParams.set('key', key);
    url.searchParams.set('origin', `${from.lng},${from.lat}`);
    url.searchParams.set('destination', `${to.lng},${to.lat}`);
    url.searchParams.set('output', 'JSON');
    const data = await requestJson(url, `WALK ${from.name} -> ${to.name}`);
    const route = data.route;
    const path0 = route && route.paths && route.paths[0];
    if (!path0 || !path0.steps) throw new Error(`No walking path for ${from.name} -> ${to.name}`);
    const points = [];
    path0.steps.forEach(step => {
        if (!step.polyline) return;
        step.polyline.split(';').forEach(pair => {
            const [lng, lat] = pair.split(',').map(Number);
            if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
            const last = points[points.length - 1];
            if (!last || last.lng !== lng || last.lat !== lat) points.push({ lng, lat });
        });
    });
    return {
        from: from.name,
        to: to.name,
        distance: Number(path0.distance || 0),
        duration: Number(path0.duration || 0),
        points,
    };
}

async function fetchStaticMap(config) {
    const url = new URL('https://restapi.amap.com/v3/staticmap');
    url.searchParams.set('key', key);
    url.searchParams.set('location', config.map.location);
    url.searchParams.set('zoom', String(config.map.zoom));
    url.searchParams.set('size', config.map.size);
    url.searchParams.set('scale', '1');
    url.searchParams.set('traffic', '0');
    const out = path.join(outDir, config.mapFile);
    await downloadFile(url, out);
    return out;
}

async function runCity(id, config) {
    console.log(`\n== ${id} / ${config.city} ==`);
    const mapPath = await fetchStaticMap(config);
    console.log(`map -> ${path.relative(process.cwd(), mapPath)}`);

    const places = [];
    for (const p of config.places) {
        const geo = await geocode(p, config.city);
        places.push(geo);
        console.log(`place ${geo.name}: ${geo.lng},${geo.lat} (${geo.source})`);
    }

    const routes = [];
    for (let i = 0; i < places.length - 1; i++) {
        const r = await walkingRoute(places[i], places[i + 1]);
        routes.push(r);
        console.log(`route ${r.from} -> ${r.to}: ${r.points.length} pts, ${r.distance}m`);
    }

    const output = {
        places: places.map(({ name, lng, lat }) => ({ name, lng, lat })),
        routes,
    };
    const routePath = path.join(outDir, config.routeFile);
    fs.writeFileSync(routePath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`routes -> ${path.relative(process.cwd(), routePath)}`);
}

(async () => {
    fs.mkdirSync(outDir, { recursive: true });
    for (const [id, cfg] of Object.entries(configs)) {
        await runCity(id, cfg);
    }
})().catch(err => {
    console.error(err);
    process.exit(1);
});
