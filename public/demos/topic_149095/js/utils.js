// 工具函数模块

function parseNumber(value, defaultValue, min, max) {
  const num = parseFloat(value);
  if (isNaN(num) || !isFinite(num)) return defaultValue;
  let result = num;
  if (min !== undefined && min !== null) result = Math.max(min, result);
  if (max !== undefined && max !== null) result = Math.min(max, result);
  return result;
}

function randomColor() {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(70 + Math.random() * 25);
  const l = Math.floor(55 + Math.random() * 15);
  return hslToHex(h, s, l);
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function getBodyRadius(mass) {
  return 8 + Math.pow(mass / State.baseMass, 0.4) * 8;
}

function getRandomParams() {
  let massMin = parseNumber(
    document.getElementById("massMinInput")?.value,
    500,
    0.001,
    1e6,
  );
  let massMax = parseNumber(
    document.getElementById("massMaxInput")?.value,
    1500,
    0.001,
    1e6,
  );
  if (massMin > massMax) [massMin, massMax] = [massMax, massMin];

  let speedMin = parseNumber(
    document.getElementById("speedMinInput")?.value,
    0.5,
    0,
    1000,
  );
  let speedMax = parseNumber(
    document.getElementById("speedMaxInput")?.value,
    1.3,
    0,
    1000,
  );
  if (speedMin > speedMax) [speedMin, speedMax] = [speedMax, speedMin];

  const posRange = parseNumber(
    document.getElementById("posRangeInput")?.value,
    200,
    1,
    10000,
  );

  return { massMin, massMax, speedMin, speedMax, posRange };
}
