export class StrokeRecognizer {
  constructor() {
    this.strokeTemplates = {
      '一': this.createHorizontalStroke(),
      '丨': this.createVerticalStroke(),
      '丿': this.createLeftStroke(),
      '㇏': this.createRightStroke(),
      '丶': this.createDotStroke(),
      '亅': this.createHookStroke(),
      '𠃌': this.createCornerStroke(),
      '乚': this.createHook2Stroke(),
      '㇇': this.createTurnStroke(),
      '乛': this.createHook3Stroke(),
      '㇀': this.createShortStroke(),
      '㇄': this.createMountainStroke(),
      'ㄥ': this.createCorner2Stroke(),
      '㇂': this.createLeftDownStroke(),
      '㇉': this.createDoubleStroke(),
      '一': this.createHorizontalStroke(),
    };
  }

  createHorizontalStroke() {
    return [{ x: 0, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 1, y: 0.5 }];
  }

  createVerticalStroke() {
    return [{ x: 0.5, y: 0 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 1 }];
  }

  createLeftStroke() {
    return [{ x: 0.5, y: 0 }, { x: 0.2, y: 0.6 }, { x: 0.1, y: 1 }];
  }

  createRightStroke() {
    return [{ x: 0.5, y: 0 }, { x: 0.8, y: 0.6 }, { x: 0.9, y: 1 }];
  }

  createDotStroke() {
    return [{ x: 0.5, y: 0.3 }, { x: 0.55, y: 0.5 }, { x: 0.5, y: 0.7 }];
  }

  createHookStroke() {
    return [{ x: 0.5, y: 0 }, { x: 0.5, y: 0.7 }, { x: 0.3, y: 1 }];
  }

  createCornerStroke() {
    return [{ x: 0.5, y: 0 }, { x: 0.5, y: 0.7 }, { x: 0.2, y: 0.7 }, { x: 0.2, y: 1 }];
  }

  createHook2Stroke() {
    return [{ x: 0.5, y: 0 }, { x: 0.2, y: 0.6 }, { x: 0.1, y: 0.8 }, { x: 0.3, y: 1 }];
  }

  createTurnStroke() {
    return [{ x: 0.5, y: 0 }, { x: 0.5, y: 0.4 }, { x: 0.2, y: 0.5 }, { x: 0.2, y: 0.8 }];
  }

  createHook3Stroke() {
    return [{ x: 0.3, y: 0 }, { x: 0.3, y: 0.4 }, { x: 0.6, y: 0.5 }, { x: 0.7, y: 0.8 }];
  }

  createShortStroke() {
    return [{ x: 0.3, y: 0.5 }, { x: 0.5, y: 0.45 }, { x: 0.7, y: 0.5 }];
  }

  createMountainStroke() {
    return [{ x: 0.2, y: 0.3 }, { x: 0.5, y: 0 }, { x: 0.8, y: 0.3 }];
  }

  createCorner2Stroke() {
    return [{ x: 0.3, y: 0 }, { x: 0.3, y: 0.5 }, { x: 0.7, y: 0.7 }, { x: 0.7, y: 1 }];
  }

  createLeftDownStroke() {
    return [{ x: 0.5, y: 0 }, { x: 0.3, y: 0.4 }, { x: 0.5, y: 0.7 }, { x: 0.3, y: 1 }];
  }

  createDoubleStroke() {
    return [{ x: 0.4, y: 0 }, { x: 0.3, y: 0.5 }, { x: 0.6, y: 0.5 }, { x: 0.5, y: 1 }];
  }

  normalizePoints(points) {
    if (points.length < 2) return [];
    
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    
    return points.map(p => ({
      x: (p.x - minX) / width,
      y: (p.y - minY) / height
    }));
  }

  downsample(points, targetCount = 20) {
    if (points.length <= targetCount) return points;
    
    const step = (points.length - 1) / (targetCount - 1);
    const result = [];
    
    for (let i = 0; i < targetCount; i++) {
      const index = Math.round(i * step);
      result.push(points[index]);
    }
    
    return result;
  }

  dtwDistance(s1, s2) {
    const n = s1.length;
    const m = s2.length;
    
    const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(Infinity));
    dp[0][0] = 0;
    
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const cost = Math.sqrt(
          Math.pow(s1[i - 1].x - s2[j - 1].x, 2) +
          Math.pow(s1[i - 1].y - s2[j - 1].y, 2)
        );
        
        dp[i][j] = cost + Math.min(
          dp[i - 1][j],
          dp[i][j - 1],
          dp[i - 1][j - 1]
        );
      }
    }
    
    return dp[n][m] / Math.max(n, m);
  }

  recognize(strokePoints, targetRadical) {
    if (!this.strokeTemplates[targetRadical]) {
      return 0.5;
    }
    
    const template = this.strokeTemplates[targetRadical];
    const normalized = this.normalizePoints(strokePoints);
    const downsampled = this.downsample(normalized, 15);
    
    if (downsampled.length < 2) {
      return 0;
    }
    
    const distance = this.dtwDistance(downsampled, template);
    const score = Math.max(0, 1 - distance * 2);
    
    return score;
  }

  isMatch(strokePoints, targetRadical) {
    const score = this.recognize(strokePoints, targetRadical);
    return score >= 0.5;
  }
}