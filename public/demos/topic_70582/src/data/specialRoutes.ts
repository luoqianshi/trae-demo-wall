import type { Route, Segment, Layover, RouteType } from '@shared/types';
import { cityDatabase, airlines, calculateDistance, allCityNames } from './cityDatabase';

const nearbyCityPairs: [string, string][] = [
  ['北京', '天津'], ['北京', '石家庄'], ['北京', '唐山'],
  ['上海', '无锡'], ['上海', '常州'], ['上海', '苏州'], ['上海', '杭州'],
  ['广州', '深圳'], ['广州', '东莞'], ['广州', '佛山'],
  ['成都', '重庆'], ['成都', '绵阳'],
  ['武汉', '长沙'], ['武汉', '郑州'],
  ['南京', '杭州'], ['南京', '苏州'],
  ['西安', '郑州'], ['西安', '兰州'],
  ['沈阳', '大连'],
  ['昆明', '贵阳'],
  ['济南', '青岛'],
  ['合肥', '南京'],
  ['福州', '厦门'],
  ['南宁', '海口'],
  ['哈尔滨', '长春'],
];

const popularTouristCities = [
  '成都', '重庆', '西安', '杭州', '昆明', '厦门', '青岛', '三亚',
  '广州', '深圳', '上海', '北京', '长沙', '南京', '武汉', '桂林',
];

const cachedRoutes = new Map<string, Route[]>();

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateFlightNo(rand: () => number): string {
  const code = ['CA', 'MU', 'CZ', 'HU', 'ZH', '3U', 'MF', 'SC', 'HO', '9C'][Math.floor(rand() * 10)];
  const num = Math.floor(rand() * 9000) + 1000;
  return `${code}${num}`;
}

function calculateFlightTime(distance: number): number {
  return Math.round((distance / 800) * 60 + 30);
}

function calculateFlightPrice(distance: number, tier1: number, tier2: number, rand: () => number): number {
  const basePrice = distance * 0.7 + 50;
  const tierMultiplier = 1 + (tier1 - 1) * 0.1 + (tier2 - 1) * 0.1;
  const variation = 0.6 + rand() * 0.4;
  return Math.round((basePrice * tierMultiplier * variation) / 10) * 10;
}

function timeToString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getNearbyCities(from: string): string[] {
  const cached = cachedRoutes.get(`nearby-${from}`);
  if (cached) return cached.map(r => r.to);
  
  const nearby = nearbyCityPairs
    .filter(pair => pair[0] === from || pair[1] === from)
    .map(pair => pair[0] === from ? pair[1] : pair[0]);

  if (nearby.length === 0) {
    const distances = allCityNames
      .filter(c => c !== from)
      .map(c => ({ city: c, dist: calculateDistance(from, c) }))
      .sort((a, b) => a.dist - b.dist);
    nearby.push(...distances.slice(0, 3).map(d => d.city));
  }

  return nearby;
}

export function generateBoomerangRoutes(from: string, date: string, limit: number = 3): Route[] {
  const cacheKey = `boomerang-${from}-${date}`;
  const cached = cachedRoutes.get(cacheKey);
  if (cached) return cached;

  const routes: Route[] = [];
  if (!cityDatabase[from]) return routes;

  const nearbyCities = getNearbyCities(from).slice(0, 2);

  nearbyCities.forEach((nearbyCity) => {
    const touristCities = popularTouristCities
      .filter(c => c !== from && c !== nearbyCity)
      .slice(0, limit);

    touristCities.forEach((destinationCity) => {
      const seed = stringToSeed(`${from}-${destinationCity}-${nearbyCity}-${date}-boomerang`);
      const rand = seededRandom(seed);

      const fromCity = cityDatabase[from];
      const destCity = cityDatabase[destinationCity];
      const nearbyCityInfo = cityDatabase[nearbyCity];

      const dist1 = calculateDistance(from, destinationCity);
      const dist2 = calculateDistance(destinationCity, nearbyCity);

      const seg1Duration = calculateFlightTime(dist1);
      const seg1Price = calculateFlightPrice(dist1, fromCity.tier, destCity.tier, rand);
      const seg2Duration = calculateFlightTime(dist2);
      const seg2Price = calculateFlightPrice(dist2, destCity.tier, nearbyCityInfo.tier, rand);

      const layoverOptions = [
        900 + Math.floor(rand() * 360),
        1200 + Math.floor(rand() * 480),
        1680 + Math.floor(rand() * 720),
        2400 + Math.floor(rand() * 1080),
        3600 + Math.floor(rand() * 720),
      ];
      const layoverDuration = layoverOptions[Math.floor(rand() * layoverOptions.length)];

      const startMinutes = 360 + Math.floor(rand() * 180);
      const seg1Departure = startMinutes;
      const seg1Arrival = seg1Departure + seg1Duration;
      const seg2Departure = seg1Arrival + layoverDuration;
      const seg2Arrival = seg2Departure + seg2Duration;

      const totalPrice = seg1Price + seg2Price;
      const totalDuration = seg1Duration + layoverDuration + seg2Duration;

      const directDistance = calculateDistance(from, destinationCity);
      const directPrice = Math.round(totalPrice * 1.8);
      const savings = directPrice - totalPrice;

      const segments: Segment[] = [
        {
          id: `seg-${seed}-1`,
          type: 'flight',
          from: fromCity.airportName,
          to: destCity.airportName,
          departureTime: timeToString(seg1Departure),
          arrivalTime: timeToString(seg1Arrival),
          duration: seg1Duration,
          price: seg1Price,
          carrier: airlines[Math.floor(rand() * airlines.length)],
          flightNo: generateFlightNo(rand),
        },
        {
          id: `seg-${seed}-2`,
          type: 'flight',
          from: destCity.airportName,
          to: nearbyCityInfo.airportName,
          departureTime: timeToString(seg2Departure),
          arrivalTime: timeToString(seg2Arrival),
          duration: seg2Duration,
          price: seg2Price,
          carrier: airlines[Math.floor(rand() * airlines.length)],
          flightNo: generateFlightNo(rand),
        },
      ];

      const layovers: Layover[] = [
        {
          city: destinationCity,
          duration: layoverDuration,
          type: 'city',
          tips: [`${destinationCity}深度游，停留${Math.round(layoverDuration / 60)}小时`],
        },
      ];

      const highlights = [
        `${destinationCity}停留${Math.round(layoverDuration / 60)}小时深度游`,
        `比直飞${destinationCity}省${Math.round(savings / (directPrice || 1) * 100)}%`,
        destCity.specialties[0] ? `可品尝${destCity.specialties[0]}` : '',
      ].filter(Boolean);

      routes.push({
        id: `boomerang-${from}-${destinationCity}-${nearbyCity}-${date}`,
        type: 'boomerang',
        typeLabel: '回旋镖航线',
        from,
        to: nearbyCity,
        date,
        totalPrice,
        totalDuration,
        segments,
        layovers,
        savings,
        extraTime: totalDuration - calculateFlightTime(directDistance),
        highlights,
        rating: Math.round((4.0 + rand() * 1.0) * 10) / 10,
        reviewCount: Math.floor(rand() * 200) + 50,
        directPrice,
        directDuration: calculateFlightTime(directDistance),
      });
    });
  });

  cachedRoutes.set(cacheKey, routes);
  return routes;
}

export function generateNunchakuRoutes(from: string, to: string, date: string, limit: number = 3): Route[] {
  const cacheKey = `nunchaku-${from}-${to}-${date}`;
  const cached = cachedRoutes.get(cacheKey);
  if (cached) return cached;

  const routes: Route[] = [];
  if (!cityDatabase[from]) return routes;

  if (to && cityDatabase[to] && to !== from) {
    const transitCities = popularTouristCities
      .filter(c => c !== from && c !== to)
      .slice(0, limit);

    transitCities.forEach((transitCity) => {
      const seed = stringToSeed(`${from}-${transitCity}-${to}-${date}-nunchaku`);
      const rand = seededRandom(seed);

      const fromCity = cityDatabase[from];
      const transitCityInfo = cityDatabase[transitCity];
      const toCity = cityDatabase[to];

      const dist1 = calculateDistance(from, transitCity);
      const dist2 = calculateDistance(transitCity, to);

      const seg1Duration = calculateFlightTime(dist1);
      const seg1Price = calculateFlightPrice(dist1, fromCity.tier, transitCityInfo.tier, rand);
      const seg2Duration = calculateFlightTime(dist2);
      const seg2Price = calculateFlightPrice(dist2, transitCityInfo.tier, toCity.tier, rand);

      const layoverOptions = [
        720 + Math.floor(rand() * 360),
        1080 + Math.floor(rand() * 480),
        1680 + Math.floor(rand() * 720),
        2400 + Math.floor(rand() * 1080),
        3600 + Math.floor(rand() * 720),
      ];
      const layoverDuration = layoverOptions[Math.floor(rand() * layoverOptions.length)];

      const startMinutes = 360 + Math.floor(rand() * 180);
      const seg1Departure = startMinutes;
      const seg1Arrival = seg1Departure + seg1Duration;
      const seg2Departure = seg1Arrival + layoverDuration;
      const seg2Arrival = seg2Departure + seg2Duration;

      const totalPrice = seg1Price + seg2Price;
      const totalDuration = seg1Duration + layoverDuration + seg2Duration;

      const directDistance = calculateDistance(from, to);
      const directPrice = Math.round(totalPrice * 1.5);
      const savings = directPrice - totalPrice;

      const segments: Segment[] = [
        {
          id: `seg-${seed}-1`,
          type: 'flight',
          from: fromCity.airportName,
          to: transitCityInfo.airportName,
          departureTime: timeToString(seg1Departure),
          arrivalTime: timeToString(seg1Arrival),
          duration: seg1Duration,
          price: seg1Price,
          carrier: airlines[Math.floor(rand() * airlines.length)],
          flightNo: generateFlightNo(rand),
        },
        {
          id: `seg-${seed}-2`,
          type: 'flight',
          from: transitCityInfo.airportName,
          to: toCity.airportName,
          departureTime: timeToString(seg2Departure),
          arrivalTime: timeToString(seg2Arrival),
          duration: seg2Duration,
          price: seg2Price,
          carrier: airlines[Math.floor(rand() * airlines.length)],
          flightNo: generateFlightNo(rand),
        },
      ];

      const layovers: Layover[] = [
        {
          city: transitCity,
          duration: layoverDuration,
          type: 'city',
          tips: [`${transitCity}游玩，停留${Math.round(layoverDuration / 60)}小时`],
        },
      ];

      const highlights = [
        `${transitCity}停留${Math.round(layoverDuration / 60)}小时`,
        `先玩${transitCity}再去${to}`,
        `比直飞${to}省${Math.round(savings / (directPrice || 1) * 100)}%`,
      ];

      routes.push({
        id: `nunchaku-${from}-${transitCity}-${to}-${date}`,
        type: 'nunchaku',
        typeLabel: '双截棍航线',
        from,
        to,
        date,
        totalPrice,
        totalDuration,
        segments,
        layovers,
        savings,
        extraTime: totalDuration - calculateFlightTime(directDistance),
        highlights,
        rating: Math.round((4.0 + rand() * 1.0) * 10) / 10,
        reviewCount: Math.floor(rand() * 200) + 50,
        directPrice,
        directDuration: calculateFlightTime(directDistance),
      });
    });
  } else {
    const randomDestinations = popularTouristCities
      .filter(c => c !== from)
      .slice(0, 3);

    randomDestinations.forEach((dest) => {
      const transitCities = popularTouristCities
        .filter(c => c !== from && c !== dest)
        .slice(0, 2);

      transitCities.forEach((transit) => {
        const seed = stringToSeed(`${from}-${transit}-${dest}-${date}-nunchaku-random`);
        const rand = seededRandom(seed);

        const fromCity = cityDatabase[from];
        const transitCityInfo = cityDatabase[transit];
        const toCity = cityDatabase[dest];

        const dist1 = calculateDistance(from, transit);
        const dist2 = calculateDistance(transit, dest);

        const seg1Duration = calculateFlightTime(dist1);
        const seg1Price = calculateFlightPrice(dist1, fromCity.tier, transitCityInfo.tier, rand);
        const seg2Duration = calculateFlightTime(dist2);
        const seg2Price = calculateFlightPrice(dist2, transitCityInfo.tier, toCity.tier, rand);

        const layoverOptions = [
          720 + Math.floor(rand() * 360),
          1080 + Math.floor(rand() * 480),
          1680 + Math.floor(rand() * 720),
        ];
        const layoverDuration = layoverOptions[Math.floor(rand() * layoverOptions.length)];

        const startMinutes = 360 + Math.floor(rand() * 180);
        const seg1Departure = startMinutes;
        const seg1Arrival = seg1Departure + seg1Duration;
        const seg2Departure = seg1Arrival + layoverDuration;
        const seg2Arrival = seg2Departure + seg2Duration;

        const totalPrice = seg1Price + seg2Price;
        const totalDuration = seg1Duration + layoverDuration + seg2Duration;

        const directDistance = calculateDistance(from, dest);
        const directPrice = Math.round(totalPrice * 1.5);
        const savings = directPrice - totalPrice;

        const segments: Segment[] = [
          {
            id: `seg-${seed}-1`,
            type: 'flight',
            from: fromCity.airportName,
            to: transitCityInfo.airportName,
            departureTime: timeToString(seg1Departure),
            arrivalTime: timeToString(seg1Arrival),
            duration: seg1Duration,
            price: seg1Price,
            carrier: airlines[Math.floor(rand() * airlines.length)],
            flightNo: generateFlightNo(rand),
          },
          {
            id: `seg-${seed}-2`,
            type: 'flight',
            from: transitCityInfo.airportName,
            to: toCity.airportName,
            departureTime: timeToString(seg2Departure),
            arrivalTime: timeToString(seg2Arrival),
            duration: seg2Duration,
            price: seg2Price,
            carrier: airlines[Math.floor(rand() * airlines.length)],
            flightNo: generateFlightNo(rand),
          },
        ];

        const layovers: Layover[] = [
          {
            city: transit,
            duration: layoverDuration,
            type: 'city',
            tips: [`${transit}游玩，停留${Math.round(layoverDuration / 60)}小时`],
          },
        ];

        const highlights = [
          `${transit}停留${Math.round(layoverDuration / 60)}小时`,
          `先玩${transit}再去${dest}`,
          `比直飞${dest}省${Math.round(savings / (directPrice || 1) * 100)}%`,
        ];

        routes.push({
          id: `nunchaku-${from}-${transit}-${dest}-${date}-random`,
          type: 'nunchaku',
          typeLabel: '双截棍航线',
          from,
          to: dest,
          date,
          totalPrice,
          totalDuration,
          segments,
          layovers,
          savings,
          extraTime: totalDuration - calculateFlightTime(directDistance),
          highlights,
          rating: Math.round((4.0 + rand() * 1.0) * 10) / 10,
          reviewCount: Math.floor(rand() * 200) + 50,
          directPrice,
          directDuration: calculateFlightTime(directDistance),
        });
      });
    });
  }

  cachedRoutes.set(cacheKey, routes);
  return routes;
}

export function clearRouteCache(): void {
  cachedRoutes.clear();
}
