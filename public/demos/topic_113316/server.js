const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

function parseNvidiaSmi(output) {
  const lines = output.split('\n');
  const data = [];
  
  let inGPUSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 跳过空行和分割线
    if (!line || line.startsWith('+') || line.startsWith('=')) continue;
    
    // 检测GPU部分的开始
    if (line.startsWith('| GPU  Name')) {
      inGPUSection = true;
      continue;
    }
    
    // 检测进程部分的开始，结束GPU解析
    if (line.startsWith('| Processes:')) {
      break;
    }
    
    // 只处理GPU数据行
    if (inGPUSection && line.startsWith('|')) {
      // 移除前后的|字符并分割
      const cleanedLine = line.replace(/^\|\s*|\s*\|$/g, '');
      const parts = cleanedLine.split(/\s*\|\s*/).filter(p => p !== '');
      
      if (parts.length >= 9) {
        const gpuIndex = parts[0].trim();
        const name = parts[1].trim();
        const temp = parts[2].trim();
        const perf = parts[3].trim();
        const pwrUsage = parts[4].trim();
        const memUsage = parts[5].trim();
        const util = parts[6].trim();
        const compute = parts[7].trim();
        
        // 提取数值
        const tempMatch = temp.match(/(\d+)/);
        const memMatch = memUsage.match(/(\d+)MiB/);
        const memTotalMatch = memUsage.match(/\/(\d+)MiB/);
        const utilMatch = util.match(/(\d+)%/);
        const pwrUsageMatch = pwrUsage.match(/(\d+)W/);
        const pwrCapMatch = pwrUsage.match(/\/(\d+)W/);
        
        data.push({
          id: gpuIndex,
          name: name,
          temperature: tempMatch ? parseInt(tempMatch[1]) : 0,
          powerUsage: pwrUsageMatch ? parseInt(pwrUsageMatch[1]) : 0,
          powerLimit: pwrCapMatch ? parseInt(pwrCapMatch[1]) : 0,
          memoryUsed: memMatch ? parseInt(memMatch[1]) : 0,
          memoryTotal: memTotalMatch ? parseInt(memTotalMatch[1]) : 0,
          utilization: utilMatch ? parseInt(utilMatch[1]) : 0,
          performanceState: perf,
          persistenceMode: 'N/A',
          computeMode: compute,
          pciBusId: 'N/A',
          gpuUuid: 'N/A',
          driverVersion: 'N/A',
          cudaVersion: 'N/A',
          clockSm: 0,
          clockMemory: 0,
          clockGraphics: 0,
          clockVideo: 0,
          fanSpeed: 0,
          memReserved: 0
        });
      }
    }
  }
  
  return data;
}

app.get('/api/gpu-info', (req, res) => {
  // 方法1: 使用简单的CSV格式获取基本信息
  exec('nvidia-smi --query-gpu=index,name,temperature.gpu,utilization.gpu,utilization.memory,memory.used,memory.total,power.draw,power.limit --format=csv,noheader,nounits', (error, stdout, stderr) => {
    if (error) {
      console.error('nvidia-smi error:', error);
      // 方法2: 尝试使用不同的命令格式
      exec('nvidia-smi', (error2, stdout2, stderr2) => {
        if (error2) {
          console.error('nvidia-smi fallback error:', error2);
          res.json({ error: '无法获取GPU信息' });
          return;
        }
        
        // 解析默认格式输出
        const data = parseNvidiaSmi(stdout2);
        res.json(data);
      });
      return;
    }
    
    const lines = stdout.trim().split('\n');
    const gpuData = [];
    
    lines.forEach(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 9) {
        gpuData.push({
          id: parts[0],
          name: parts[1],
          temperature: parseInt(parts[2]) || 0,
          utilization: parseInt(parts[3]) || 0,
          memoryUtilization: parseInt(parts[4]) || 0,
          memoryUsed: parseInt(parts[5]) || 0,
          memoryTotal: parseInt(parts[6]) || 0,
          powerUsage: parseFloat(parts[7]) || 0,
          powerLimit: parseFloat(parts[8]) || 0,
          clockSm: 0,
          clockGraphics: 0,
          clockVideo: 0,
          fanSpeed: 0,
          performanceState: 'N/A',
          persistenceMode: 'N/A',
          computeMode: 'N/A',
          pciBusId: 'N/A',
          gpuUuid: 'N/A',
          driverVersion: 'N/A',
          cudaVersion: 'N/A',
          clockMemory: 0,
          memReserved: 0
        });
      }
    });
    
    res.json(gpuData);
  });
});

app.get('/api/gpu-history', (req, res) => {
  exec('nvidia-smi dmon -c 1 -s puct', (error, stdout, stderr) => {
    if (error) {
      console.error('nvidia-smi dmon error:', error);
      res.json({ error: '无法获取GPU历史数据' });
      return;
    }
    
    res.json({ message: '历史数据功能' });
  });
});

app.listen(PORT, () => {
  console.log(`GPU监控服务器运行在 http://localhost:${PORT}`);
});
