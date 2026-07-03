/**
 * 易道 App - 卦象动画工具
 */

const Anim = {
  // 生成裂纹路径
  generateCrackPaths(centerX, centerY, count) {
    const paths = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (360 / count) * i + Math.random() * 30 - 15;
      const rad = angle * Math.PI / 180;
      const length = 80 + Math.random() * 60;
      
      const path = {
        points: []
      };
      
      // 起点
      path.points.push({ x: centerX, y: centerY });
      
      // 主路径点
      const steps = 15;
      for (let j = 1; j <= steps; j++) {
        const dist = (length / steps) * j;
        const wobble = Math.random() * 8 - 4;
        
        path.points.push({
          x: centerX + Math.cos(rad) * dist + wobble,
          y: centerY + Math.sin(rad) * dist + wobble
        });
        
        // 随机添加分支
        if (Math.random() > 0.7 && j > 5) {
          const branchAngle = angle + Math.random() * 40 - 20;
          const branchRad = branchAngle * Math.PI / 180;
          const branchLength = 15 + Math.random() * 25;
          
          const lastPoint = path.points[path.points.length - 1];
          path.points.push({
            x: lastPoint.x + Math.cos(branchRad) * branchLength,
            y: lastPoint.y + Math.sin(branchRad) * branchLength,
            branch: true
          });
        }
      }
      
      paths.push(path);
    }
    
    return paths;
  },
  
  // 动画绘制裂纹
  animateCracks(canvas, ctx, paths, duration) {
    const totalPaths = paths.length;
    let currentPath = 0;
    let progress = 0;
    const interval = 50;
    const stepsPerPath = duration / interval / totalPaths;
    
    const draw = () => {
      // 绘制已完成路径
      paths.slice(0, currentPath).forEach(path => {
        this.drawFullPath(ctx, path);
      });
      
      // 绘制当前路径（渐进）
      if (currentPath < totalPaths) {
        const currentCrack = paths[currentPath];
        const visiblePoints = Math.floor(currentCrack.points.length * (progress / stepsPerPath));
        
        ctx.strokeStyle = '#C9A227';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#C9A227';
        ctx.shadowBlur = 10;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(currentCrack.points[0].x, currentCrack.points[0].y);
        
        for (let i = 1; i <= Math.min(visiblePoints, currentCrack.points.length - 1); i++) {
          ctx.lineTo(currentCrack.points[i].x, currentCrack.points[i].y);
        }
        
        ctx.stroke();
        
        progress++;
        if (progress >= stepsPerPath) {
          progress = 0;
          currentPath++;
        }
      }
      
      if (currentPath < totalPaths) {
        setTimeout(draw, interval);
      }
    };
    
    draw();
  },
  
  // 绘制完整路径
  drawFullPath(ctx, path) {
    ctx.strokeStyle = '#C9A227';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#C9A227';
    ctx.shadowBlur = 10;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    
    path.points.forEach((point, i) => {
      if (i > 0) {
        ctx.lineTo(point.x, point.y);
      }
    });
    
    ctx.stroke();
  },
  
  // 爻线渐显动画
  revealLines(container, lines, delay) {
    container.innerHTML = '';
    
    lines.forEach((lineType, index) => {
      setTimeout(() => {
        const lineEl = document.createElement('div');
        lineEl.className = `hexagram-line ${lineType}`;
        lineEl.style.opacity = '0';
        lineEl.style.transform = 'translateX(-20px)';
        container.appendChild(lineEl);
        
        requestAnimationFrame(() => {
          lineEl.style.transition = 'opacity 300ms, transform 300ms';
          lineEl.style.opacity = '1';
          lineEl.style.transform = 'translateX(0)';
        });
      }, index * delay);
    });
  }
};