const fs = require('fs');
const path = require('path');

const exercises = [
  'leg_001', 'leg_002', 'leg_003', 'leg_004', 'leg_005', 'leg_006', 'leg_007', 'leg_008', 'leg_009', 'leg_010', 'leg_011', 'leg_012',
  'upper_001', 'upper_002', 'upper_003', 'upper_004', 'upper_005', 'upper_006', 'upper_007', 'upper_008', 'upper_009', 'upper_010', 'upper_011', 'upper_012', 'upper_013',
  'fullbody_001', 'fullbody_002', 'fullbody_003', 'fullbody_004', 'fullbody_005', 'fullbody_006', 'fullbody_007', 'fullbody_008', 'fullbody_009',
  'bodyweight_001', 'bodyweight_002', 'bodyweight_003', 'bodyweight_004', 'bodyweight_005', 'bodyweight_006', 'bodyweight_007',
  'crossfit_001', 'crossfit_002', 'crossfit_003', 'crossfit_004', 'crossfit_005', 'crossfit_006', 'crossfit_007', 'crossfit_008',
  'landmine_001', 'landmine_002', 'landmine_003', 'landmine_004'
];

const outputDir = '/workspace/actionpro-app/assets/images/exercises';

const createExerciseSVG = (id, type) => {
  const isEnd = type === 'end';
  const legYOffset = isEnd ? 50 : 0;
  
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffdab9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f5deb3;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="muscleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#818cf8;stop-opacity:0.6" />
    </linearGradient>
  </defs>
  <rect width="400" height="500" fill="#1e293b"/>
  <circle cx="200" cy="80" r="30" fill="url(#skinGrad)" stroke="#f8fafc" stroke-width="2"/>
  <rect x="170" y="110" width="60" height="100" rx="15" fill="url(#muscleGrad)" stroke="#f8fafc" stroke-width="1"/>
  <line x1="200" y1="110" x2="200" y2="350" stroke="#f8fafc" stroke-width="4"/>
  <line x1="170" y1="140" x2="100" y2="180" stroke="#f8fafc" stroke-width="4"/>
  <line x1="100" y1="180" x2="100" y2="220" stroke="#f8fafc" stroke-width="3"/>
  <line x1="230" y1="140" x2="300" y2="180" stroke="#f8fafc" stroke-width="4"/>
  <line x1="300" y1="180" x2="300" y2="220" stroke="#f8fafc" stroke-width="3"/>
  <line x1="200" y1="250" x2="130" y2="${350 + legYOffset}" stroke="#f8fafc" stroke-width="4"/>
  <line x1="130" y1="${350 + legYOffset}" x2="130" y2="${420 + legYOffset}" stroke="#f8fafc" stroke-width="3"/>
  <line x1="200" y1="250" x2="270" y2="${350 + legYOffset}" stroke="#f8fafc" stroke-width="4"/>
  <line x1="270" y1="${350 + legYOffset}" x2="270" y2="${420 + legYOffset}" stroke="#f8fafc" stroke-width="3"/>
</svg>
  `.trim();
};

exercises.forEach(id => {
  const startPath = path.join(outputDir, `${id}_start.svg`);
  const endPath = path.join(outputDir, `${id}_end.svg`);
  
  fs.writeFileSync(startPath, createExerciseSVG(id, 'start'));
  fs.writeFileSync(endPath, createExerciseSVG(id, 'end'));
});

console.log(`Generated ${exercises.length * 2} SVG files successfully!`);
