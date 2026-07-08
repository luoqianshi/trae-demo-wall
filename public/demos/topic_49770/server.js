const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;
const baseDir = __dirname;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const defaultData = {
  '/api/inputs/profile.json': {
    basics: { name: '王洪亮', birthMonth: '1996-03', gender: 'male', maritalStatus: 'married', currentTitle: '产品经理', location: '北京', yearsOfExperience: 8 },
    summary: '8年产品管理经验，专注于职业发展领域的产品设计与规划。具备优秀的需求分析能力和跨团队协作经验，擅长将复杂问题拆解为可执行的方案。对新技术和用户体验有持续的探索热情。',
    family: { childrenBirthMonths: ['2022-06'], parents: { fatherBirthMonth: '1968-05', motherBirthMonth: '1970-08', fatherHasPension: 'yes', motherHasPension: 'yes', fatherLifeStatus: 'alive', motherLifeStatus: 'alive' }, socialSecurityYears: 8 },
    preferences: { industries: ['互联网', 'AI/大模型'], roleDirections: ['产品经理', '产品总监'], workMode: 'hybrid', geoPreference: '北京', salaryExpectation: '35k-45k' }
  },
  '/api/inputs/education.json': { items: [{ id: '1', school: '北京理工大学', degree: '本科', academicDegree: '学士', eduType: '全日制', campus: '', field: '软件工程', start: '2014-09', end: '2018-06', highlights: 'GPA 3.5/4.0，获得校级奖学金' }] },
  '/api/inputs/experience.json': { items: [{ id: '1', company: '字节跳动', companyType: '私企', title: '高级前端工程师', monthlySalary: 28, reportingTo: '技术总监', managedCount: 8, location: '北京', start: '2021-03', end: '至今', highlights: '主导抖音Web端性能优化项目，首屏加载时间从3.2s优化至1.9s；搭建前端监控平台，线上问题发现时间从2小时缩短至5分钟' }, { id: '2', company: '美团', companyType: '私企', title: '前端工程师', monthlySalary: 20, reportingTo: '前端负责人', managedCount: 0, location: '北京', start: '2018-06', end: '2021-03', highlights: '参与美团外卖核心页面重构，性能提升30%；主导微前端架构改造，接入10+应用' }, { id: '3', company: '北京XX科技有限公司', companyType: '私企', title: '前端开发工程师', monthlySalary: 12, reportingTo: '技术经理', managedCount: 0, location: '北京', start: '2018-06', end: '2019-03', highlights: '独立完成公司官网开发；优化产品性能，加载速度提升40%' }] },
  '/api/inputs/artifacts.json': { items: [] },
  '/api/inputs/projects.json': { items: [] },
  '/api/inputs/moments.json': { items: [] },
  '/api/inputs/awards.json': { items: [] },
  '/api/inputs/honors.json': { items: [] },
  '/api/inputs/achievements.json': { items: [] },
  '/api/inputs/certificates.json': { items: [] },
  '/api/inputs/speech.json': { items: [] },
  '/api/inputs/community.json': { items: [] },
  '/api/inputs/social_media.json': { items: [] },
  '/api/inputs/strengths.json': { items: [] },
  '/api/inputs/weaknesses.json': { items: [] },
  '/api/inputs/skills.json': { items: [] },
  '/api/inputs/tools.json': { items: [] },
  '/api/inputs/languages.json': { items: [] },
  '/api/inputs/job_intent.json': { items: [] },
  '/api/inputs/personality.json': { items: [] },
  '/api/inputs/goals.json': { timeWindow: '', successCriteria: '', items: [] },
  '/api/inputs/constraints.json': { hoursPerWeek: null, geoAndMode: '', housingType: 'unknown', rentType: 'unknown', commuteMode: 'unknown', notes: '' },
  '/api/inputs/verification.json': { target: { city: '', role: '', updatedAt: '' }, salary: { grossMinK: null, grossMaxK: null, netMinK: null, netMaxK: null, bonusMonths: null, notes: '', sources: [] }, cost: { rentK: null, commuteK: null, foodK: null, otherK: null, notes: '' }, tax: { notes: '' } },
  '/api/inputs/hashtag.json': { selected: [] },
  '/api/outputs/plan.json': { milestones: [], todos: [], weeklyRoutine: {}, projects: [] },
  '/api/outputs/job_candidates.json': { items: [] },
  '/api/artifacts/analysis_history.json': { items: [] },
  '/api/artifacts/analysis_latest.json': null
};

const server = http.createServer((req, res) => {
  let filePath = path.join(baseDir, req.url === '/' ? 'index.html' : req.url);
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  if (req.url.startsWith('/api/')) {
    const data = defaultData[req.url];
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data ?? null));
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log('Press Ctrl+C to stop the server');
});