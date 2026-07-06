const fs = require('fs');
const root = 'c:/Users/dfbz/AppData/Roaming/TRAE SOLO CN/ModularData/ai-agent/work-mode-projects/6a3f3550e526084e89143394/green-energy-project';
const p = root + '/monitor-screen.html';

let c = fs.readFileSync(p, 'utf8');

// 1. Replace createDeviceNodes
const newDevices = fs.readFileSync(root + '/_new_devices.js', 'utf8');
let start = c.indexOf('function createDeviceNodes()');
let end = c.indexOf('function createFlowPaths()');
if (start === -1 || end === -1) { console.error('Cannot find device/flow markers'); process.exit(1); }
c = c.substring(0, start) + newDevices + '\n\n' + c.substring(end);

// 2. Replace createFlowPaths
const newFlows = fs.readFileSync(root + '/_new_flows.js', 'utf8');
start = c.indexOf('function createFlowPaths()');
end = c.indexOf('function createLabels()');
if (start === -1 || end === -1) { console.error('Cannot find flow/label markers'); process.exit(1); }
c = c.substring(0, start) + newFlows + '\n' + c.substring(end);

// 3. Replace animateThree
const newAnim = fs.readFileSync(root + '/_new_animate.js', 'utf8');
start = c.indexOf('function animateThree()');
end = c.indexOf('function onThreeResize()');
if (start === -1 || end === -1) { console.error('Cannot find animate/resize markers'); process.exit(1); }
c = c.substring(0, start) + newAnim + '\n\n' + c.substring(end);

fs.writeFileSync(p, c, 'utf8');
console.log('Successfully replaced createDeviceNodes, createFlowPaths, and animateThree');
