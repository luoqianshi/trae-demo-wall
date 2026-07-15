#!/usr/bin/env node
/**
 * 单元测试运行器（使用子进程隔离）
 * 使用方法：node tests/run-tests.js
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const testsDir = __dirname;
const testFiles = [];

function collectTestFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      collectTestFiles(fullPath);
    } else if (file.endsWith('.test.js')) {
      testFiles.push(fullPath);
    }
  });
}

collectTestFiles(testsDir);

console.log('========================================');
console.log('  Poop Tracker Mini Program - 单元测试');
console.log('========================================');
console.log('发现 ' + testFiles.length + ' 个测试文件\n');

let totalFilesPassed = 0;
let totalFilesFailed = 0;
const failures = [];

testFiles.forEach(file => {
  const relativePath = path.relative(testsDir, file);
  console.log('\n>>> ' + relativePath);

  const result = spawnSync(process.execPath, [file], {
    cwd: path.join(testsDir, '..'),
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  if (result.status === 0) {
    totalFilesPassed++;
  } else {
    totalFilesFailed++;
    failures.push({ file: relativePath, code: result.status, stderr: result.stderr });
  }
});

console.log('\n========================================');
console.log('  测试汇总');
console.log('========================================');
console.log('通过文件: ' + totalFilesPassed);
console.log('失败文件: ' + totalFilesFailed);
console.log('总计:     ' + testFiles.length);

if (failures.length > 0) {
  console.log('\n失败详情:');
  failures.forEach(f => {
    console.log('  - ' + f.file + ' (退出码 ' + f.code + ')');
    if (f.stderr) console.log('    ' + f.stderr.split('\n')[0]);
  });
  process.exit(1);
} else {
  console.log('\n[OK] 全部测试通过');
  process.exit(0);
}
