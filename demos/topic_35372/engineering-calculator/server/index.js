const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============ 1. 螺旋机械出力 ============
app.post('/api/spiral-conveyor', (req, res) => {
  const { spiralDia, rpm, pitch, fillCoeff, angleCoeff, density, nonStd, spiralDia2, shaftDia, rpm2, pitch2, bladeThick, fillCoeff2, angleCoeff2, density2, outputRate, resistanceCoeff, distance, height, powerDia, powerCoeff, efficiency } = req.body;

  const stdQ = 47 * (spiralDia/1000)**2 * rpm * (pitch/1000) * fillCoeff * angleCoeff;
  const stdOutput = stdQ * density;

  let nonStdQ = 0, nonStdOutput = 0;
  if (nonStd) {
    nonStdQ = (Math.PI * (spiralDia2/2000)**2 - Math.PI * (shaftDia/2000)**2) * (pitch2/1000 - bladeThick/1000) * rpm2 * fillCoeff2 * angleCoeff2 * 60;
    nonStdOutput = nonStdQ * density2;
  }

  const power = ((outputRate * (resistanceCoeff * distance + height) / 367) + (powerDia/1000) * distance / 20) * powerCoeff / efficiency;

  const limitRpm = Math.ceil(40 / Math.sqrt(spiralDia/1000));
  const actualRpm = limitRpm;
  const verifyFill = stdQ / (47 * (spiralDia/1000)**2 * actualRpm * (pitch/1000) * angleCoeff);

  res.json({
    inputs: req.body,
    results: {
      stdQ: +stdQ.toFixed(2),
      stdOutput: +stdOutput.toFixed(2),
      nonStdQ: nonStd ? +nonStdQ.toFixed(2) : null,
      nonStdOutput: nonStd ? +nonStdOutput.toFixed(2) : null,
      power: +power.toFixed(2),
      limitRpm,
      verifyFill: +verifyFill.toFixed(3),
    }
  });
});

// ============ 2. 水冷螺旋输送机热出力 ============
app.post('/api/water-cooled-spiral', (req, res) => {
  const { specificHeat, singleBladeArea, bladeCount, shaftArea, innerArea, slagInTemp, slagOutTemp, waterInTemp, waterOutTemp, heatTransferCoeff, slagRate, spiralCount } = req.body;

  const specificHeatCal = Math.ceil(specificHeat / 4.184 * 1000) / 1000;
  const bladeTotalArea = singleBladeArea * bladeCount;
  const totalHeatArea = innerArea + shaftArea + bladeTotalArea;
  const tempDiff = ((slagInTemp - waterOutTemp) - (slagOutTemp - waterInTemp)) / Math.log((slagInTemp - waterOutTemp) / (slagOutTemp - waterInTemp));
  const heatTransfer = tempDiff * heatTransferCoeff * totalHeatArea;
  const heatReleased = specificHeatCal * slagRate * 1000 * (slagInTemp - slagOutTemp);
  const actualOutput = heatTransfer / heatReleased * slagRate;
  const totalOutput = Math.ceil(spiralCount * actualOutput * 10) / 10;

  res.json({
    inputs: req.body,
    results: {
      specificHeatCal,
      bladeTotalArea,
      totalHeatArea,
      tempDiff: +tempDiff.toFixed(2),
      heatTransfer: +heatTransfer.toFixed(2),
      heatReleased: +heatReleased.toFixed(2),
      actualOutput: +actualOutput.toFixed(2),
      totalOutput,
    }
  });
});

// ============ 3. 料仓有效容积 ============
app.post('/api/silo-volume', (req, res) => {
  const { siloDia, reposeAngle, cylinderHeight, coneAngle, frictionAngle0, frictionAngle1 } = req.body;

  const sinPhi1 = Math.sin(frictionAngle1 * Math.PI / 180);
  const sinPhi0 = Math.sin(frictionAngle0 * Math.PI / 180);
  const B8 = Math.acos((1 - sinPhi1) / (2 * sinPhi1)) * 180 / Math.PI;
  const B9 = Math.asin(sinPhi0 / sinPhi1) * 180 / Math.PI;
  const maxHalfAngle = ((180 - B8) / 2) - ((B8 - B9) / 2) - 3;
  const K = 2.01;

  const volume = (K * (Math.PI * siloDia**3) / 24) * Math.tan(reposeAngle * Math.PI / 180) + (Math.PI * siloDia**2 * cylinderHeight / 4) + ((Math.PI * siloDia**3) / 24) * Math.tan(coneAngle * Math.PI / 180);

  res.json({
    inputs: req.body,
    results: {
      B8: +B8.toFixed(2),
      B9: +B9.toFixed(2),
      maxHalfAngle: +maxHalfAngle.toFixed(2),
      K,
      volume: +volume.toFixed(2),
    }
  });
});

// ============ 4. 粗牙螺栓规格外漏长度 ============
app.post('/api/bolt-exposed', (req, res) => {
  const { specs } = req.body;
  const results = specs.map(s => ({
    spec: s.spec,
    pitch: s.pitch,
    exposed2: +(s.pitch * 2).toFixed(2),
    exposed3: +(s.pitch * 3).toFixed(2),
  }));
  res.json({ results });
});

// ============ 5. 斗提机干湿粉料出力对比 ============
app.post('/api/bucket-elevator', (req, res) => {
  const { lineSpeed, bucketVolume, bucketPitch, fillCoeffDry, fillCoeffWet, bulkDensity, bulkDensityWet } = req.body;
  const Q_dry = 3.6 * lineSpeed * bucketVolume / bucketPitch * fillCoeffDry * bulkDensity;
  const Q_wet = 3.6 * lineSpeed * bucketVolume / bucketPitch * fillCoeffWet * bulkDensityWet;
  res.json({
    inputs: req.body,
    results: { Q_dry: +Q_dry.toFixed(2), Q_wet: +Q_wet.toFixed(2), ratio: +(Q_dry/Q_wet).toFixed(2) }
  });
});

// ============ 6. 链斗机链条配件 ============
app.post('/api/chain-parts', (req, res) => {
  const { pitch, chainLength, unitWeight } = req.body;
  const actualLength = Math.ceil(chainLength / pitch) * pitch;
  const links = Math.ceil(actualLength / 2 / 1.89);
  const pins = links * 2;
  const totalWeight = actualLength * unitWeight;
  res.json({
    inputs: req.body,
    results: { actualLength: +actualLength.toFixed(2), links, pins, totalWeight: +totalWeight.toFixed(1) }
  });
});

// ============ 7. 机械出力冷渣机速比选型 ============
app.post('/api/speed-ratio', (req, res) => {
  const { reposeAngle, bulkDensity, drumInnerDia, screwPitch, threadStarts, dragArea, totalArea, outputRate, motorSpeed, smallTeeth, largeTeeth } = req.body;
  const lead = threadStarts * screwPitch;
  const actualArea = totalArea - dragArea;
  const rpm = outputRate / (60 * actualArea * (lead / 1000) * bulkDensity * 0.8);
  const chainRatio = smallTeeth / largeTeeth;
  const theoryRatio = motorSpeed * chainRatio / rpm;
  res.json({
    inputs: req.body,
    results: { lead, actualArea: +actualArea.toFixed(4), rpm: +rpm.toFixed(2), chainRatio: +chainRatio.toFixed(4), theoryRatio: +theoryRatio.toFixed(2) }
  });
});

// ============ 8. 根据管径计算出水温度 ============
app.post('/api/pipe-water-temp', (req, res) => {
  const { outputRate, slagSpecificHeat, slagInTemp, slagOutTemp, waterInTemp, waterSpecificHeat, pipeDia, waterSpeed } = req.body;
  const waterFlow = 3.14 * ((pipeDia/1000)**2 / 4) * waterSpeed * 3600;
  const heatReleased = slagSpecificHeat * outputRate * 1000 * (slagInTemp - slagOutTemp);
  const waterOutTemp = Math.ceil(heatReleased / waterSpecificHeat / waterFlow / 1000 + waterInTemp * 10) / 10;
  const tempRise = waterOutTemp - waterInTemp;
  res.json({
    inputs: req.body,
    results: { waterFlow: +waterFlow.toFixed(2), heatReleased: +heatReleased.toFixed(2), waterOutTemp, tempRise: +tempRise.toFixed(1) }
  });
});

// ============ 9. 除尘器选型计算 ============
app.post('/api/dust-collector', (req, res) => {
  const { feedLength, feedWidth, feedWindSpeed, unloadLength, unloadWidth, unloadWindSpeed, lambda, pipeLength, pipeDia, airDensity, pipeWindSpeed, xi, bendCount, dustCollectorResistance } = req.body;
  const feedArea = feedLength/1000 * feedWidth/1000;
  const feedAir = feedArea * feedWindSpeed * 3600;
  const unloadArea = unloadLength/1000 * unloadWidth/1000;
  const unloadAir = unloadArea * unloadWindSpeed * 3600;
  const totalAir = feedAir + unloadAir;
  const dPm = lambda * (pipeLength/pipeDia) * airDensity * (pipeWindSpeed**2 / 2);
  const dynamicPressure = airDensity * pipeWindSpeed**2 / 2;
  const Z = dynamicPressure * bendCount * xi;
  const totalResistance = dPm + Z + dustCollectorResistance;
  res.json({
    inputs: req.body,
    results: { feedArea: +feedArea.toFixed(4), feedAir: +feedAir.toFixed(2), unloadArea: +unloadArea.toFixed(4), unloadAir: +unloadAir.toFixed(2), totalAir: +totalAir.toFixed(2), dPm: +dPm.toFixed(2), dynamicPressure: +dynamicPressure.toFixed(2), Z: +Z.toFixed(2), totalResistance: +totalResistance.toFixed(2) }
  });
});

// ============ 10. 高温闸阀扭矩 ============
app.post('/api/gate-valve-torque', (req, res) => {
  const { diameter, pressure, K, packingFriction, safetyFactor, stemCoeff, materialTemp, ambientTemp, creepCoeff, rpm } = req.body;
  const F = Math.PI * diameter * diameter / 4 / 100;
  const P1 = F * pressure * K;
  const totalForce = packingFriction + P1;
  const T = totalForce * safetyFactor * stemCoeff * 9.8;
  const T_high = T * (1 + creepCoeff * (materialTemp - ambientTemp));
  const ratedTorque = T_high * 1.5;
  const power = Math.ceil(ratedTorque * rpm / 9550 * 1000) / 1000;
  res.json({
    inputs: req.body,
    results: { F: +F.toFixed(2), P1: +P1.toFixed(2), totalForce: +totalForce.toFixed(2), T: +T.toFixed(2), T_high: +T_high.toFixed(2), ratedTorque: +ratedTorque.toFixed(2), power }
  });
});

// ============ 11. 纯风冷渣量对应的风量 ============
app.post('/api/air-cooling-volume', (req, res) => {
  const { slagInTemp, slagOutTemp, airInTemp, airOutTemp, specificHeat, slagRate, airSpecificHeat, leakCoeff } = req.body;
  const slagRateKgS = Math.ceil(slagRate * 1000 / 3600 * 100) / 100;
  const heatQ = slagRateKgS * specificHeat * (slagInTemp - slagOutTemp);
  const airDensityIn = Math.ceil(1.293 * (273/(273+airInTemp)) * 1000) / 1000;
  const airDensityOut = Math.ceil(1.293 * (273/(273+airOutTemp)) * 1000) / 1000;
  const airDensityAvg = (airDensityIn + airDensityOut) / 2;
  const theoryVolume = heatQ / (airDensityAvg * airSpecificHeat * (airOutTemp - airInTemp)) * 3600;
  const designVolume = leakCoeff * theoryVolume;
  const verifyFlowS = heatQ / (airSpecificHeat * airDensityAvg * (airOutTemp - airInTemp));
  const verifyFlowH = verifyFlowS * 3600;
  res.json({
    inputs: req.body,
    results: { slagRateKgS, heatQ: +heatQ.toFixed(2), airDensityIn, airDensityOut, airDensityAvg: +airDensityAvg.toFixed(4), theoryVolume: +theoryVolume.toFixed(2), designVolume: +designVolume.toFixed(2), verifyFlowS: +verifyFlowS.toFixed(4), verifyFlowH: +verifyFlowH.toFixed(2) }
  });
});

// ============ 12. 煤节能效益 ============
app.post('/api/coal-energy-saving', (req, res) => {
  const { coalRate, tempDiff, waterFlow, coalHeatKcal, coalHeatKJ, coalPrice, workDays } = req.body;
  const totalHeat = 4.18 * waterFlow * 1000 * tempDiff;
  const coalWeight = totalHeat / coalHeatKJ;
  const costPerHour = coalHeatKcal * coalWeight * coalPrice / 1000;
  const annualSaving = Math.ceil(costPerHour * 24 * workDays / 10000 * 100) / 100;
  res.json({
    inputs: req.body,
    results: { totalHeat: +totalHeat.toFixed(2), coalWeight: +coalWeight.toFixed(4), costPerHour: +costPerHour.toFixed(2), annualSaving }
  });
});

// ============ 13. 安全阀选型 ============
app.post('/api/safety-valve', (req, res) => {
  const { slagRate, slagInTemp, slagOutTemp, designPressure, coeff6, q, K } = req.body;
  const heatH = slagRate * 10000 * 1 * (slagInTemp - slagOutTemp);
  const Amin = Math.ceil(heatH / (coeff6 * q * K * designPressure) / 10);
  const d0 = Math.sqrt(4 * Amin / Math.PI);
  res.json({
    inputs: req.body,
    results: { heatH: +heatH.toFixed(2), Amin, d0: +d0.toFixed(2) }
  });
});

// ============ 14. 扶梯踏步参数 ============
app.post('/api/stair-params', (req, res) => {
  const { treadWidth, treadHeight } = req.body;
  const gPlus2r = treadWidth + 2 * treadHeight;
  res.json({
    inputs: req.body,
    results: { gPlus2r, valid: gPlus2r >= 550 && gPlus2r <= 700 }
  });
});

// ============ 15. 余热回收系统金属软管压力 ============
app.post('/api/metal-hose-pressure', (req, res) => {
  const { outerDia, wallThickness, platformHeight, hoseHeight, workPressure, reliefPressure, designPressure, pressureDrop } = req.body;
  const innerDia = outerDia - wallThickness * 2;
  const deltaH = platformHeight - hoseHeight;
  const staticPressure = 1000 * 9.81 * deltaH / 1000000;
  const totalPressure = designPressure + staticPressure;
  const P = totalPressure * 1000000;
  const A = Math.PI * (innerDia/1000/2)**2;
  const forceN = P * A / 10000;
  const forceTon = Math.ceil(forceN * 10) / 10;
  const outPressure = totalPressure - pressureDrop;
  const outForceN = outPressure * A * 1000000;
  const outForceTon = Math.ceil(outForceN / 10000 * 10) / 10;

  const designInstitutePressure = reliefPressure * 1.15;
  const diTotalPressure = designInstitutePressure + staticPressure;
  const diP = diTotalPressure * 1000000;
  const diForceN = diP * A / 10000;
  const diForceTon = Math.ceil(diForceN * 10) / 10;
  const diOutForceN = (diTotalPressure - pressureDrop) * A * 1000000;
  const diOutForceTon = Math.ceil(diOutForceN / 10000 * 10) / 10;

  res.json({
    inputs: req.body,
    results: {
      innerDia, deltaH: +deltaH.toFixed(3), staticPressure: +staticPressure.toFixed(4),
      totalPressure: +totalPressure.toFixed(4), forceN: +forceN.toFixed(2), forceTon,
      outPressure: +outPressure.toFixed(4), outForceN: +outForceN.toFixed(2), outForceTon,
      diTotalPressure: +diTotalPressure.toFixed(4), diForceN: +diForceN.toFixed(2), diForceTon,
      diOutForceN: +diOutForceN.toFixed(2), diOutForceTon,
    }
  });
});

// ============ 16. 冷渣机负压风量 ============
app.post('/api/negative-pressure-volume', (req, res) => {
  const { K1, dia1, H1, V1, coeff1, K2, dia2, H2, V2, coeff2, pipeDia, pipeWindSpeed } = req.body;
  const perimeter1 = dia1 * Math.PI;
  const Q1 = V1 * H1 * perimeter1 * K1;
  const actualQ1 = Q1 * coeff1;
  const perimeter2 = dia2 * Math.PI;
  const Q2 = V2 * H2 * perimeter2 * K2;
  const actualQ2 = Q2 * coeff2;
  const pipeQ = Math.PI * (pipeDia/1000/2)**2 * 3600 * pipeWindSpeed;
  res.json({
    inputs: req.body,
    results: {
      perimeter1: +perimeter1.toFixed(4), Q1: +Q1.toFixed(2), actualQ1: +actualQ1.toFixed(2),
      perimeter2: +perimeter2.toFixed(4), Q2: +Q2.toFixed(2), actualQ2: +actualQ2.toFixed(2),
      pipeQ: +pipeQ.toFixed(2),
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`工程计算器后端服务已启动: http://localhost:${PORT}`);
});
