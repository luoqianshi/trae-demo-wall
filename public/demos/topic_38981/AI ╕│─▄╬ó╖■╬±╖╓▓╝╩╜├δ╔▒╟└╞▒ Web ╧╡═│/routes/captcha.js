const express = require('express');
const router = express.Router();

const captchaStore = {};

function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let text = '';
  for (let i = 0; i < 4; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function createCaptchaImage(text) {
  const width = 120;
  const height = 40;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#1e293b"/>
    <defs>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
    </defs>
    <rect width="${width}" height="${height}" filter="url(#noise)" opacity="0.15"/>
  `;
  
  for (let i = 0; i < 20; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#334155" stroke-width="1"/>`;
  }
  
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 2 + 1;
    svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="#475569"/>`;
  }
  
  const colors = ['#667eea', '#22c55e', '#f97316', '#ef4444', '#3b82f6'];
  const startX = 15;
  const charWidth = 25;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const x = startX + i * charWidth;
    const y = 25 + Math.random() * 10 - 5;
    const rotation = Math.random() * 30 - 15;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const fontSize = 24 + Math.random() * 8;
    
    svg += `<text x="${x}" y="${y}" 
      font-family="Arial, sans-serif" 
      font-size="${fontSize}" 
      font-weight="bold"
      fill="${color}"
      transform="rotate(${rotation}, ${x}, ${y})"
      style="text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${char}</text>`;
  }
  
  svg += '</svg>';
  return svg;
}

router.get('/generate', (req, res) => {
  const captchaId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  const captchaText = generateCaptcha();
  
  captchaStore[captchaId] = {
    text: captchaText.toLowerCase(),
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000
  };
  
  const svgImage = createCaptchaImage(captchaText);
  
  res.json({
    code: 200,
    data: {
      captchaId,
      image: 'data:image/svg+xml;base64,' + Buffer.from(svgImage).toString('base64')
    }
  });
});

router.post('/verify', (req, res) => {
  const { captchaId, captchaText } = req.body;
  
  if (!captchaId || !captchaText) {
    return res.status(400).json({ 
      code: 400, 
      message: '验证码ID和验证码文本不能为空' 
    });
  }
  
  const captcha = captchaStore[captchaId];
  
  if (!captcha) {
    return res.status(400).json({ 
      code: 400, 
      message: '验证码不存在或已过期' 
    });
  }
  
  if (Date.now() > captcha.expiresAt) {
    delete captchaStore[captchaId];
    return res.status(400).json({ 
      code: 400, 
      message: '验证码已过期，请重新获取' 
    });
  }
  
  if (captchaText.toLowerCase() !== captcha.text) {
    return res.status(400).json({ 
      code: 400, 
      message: '验证码错误' 
    });
  }
  
  delete captchaStore[captchaId];
  
  res.json({
    code: 200,
    message: '验证码验证成功',
    data: { verified: true }
  });
});

setInterval(() => {
  const now = Date.now();
  Object.keys(captchaStore).forEach(id => {
    if (now > captchaStore[id].expiresAt) {
      delete captchaStore[id];
    }
  });
}, 60000);

module.exports = router;