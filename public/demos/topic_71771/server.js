const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// 确保 uploads 目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const foodId = req.params.foodId;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${foodId}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 JPG/PNG/WEBP/GIF 格式'));
    }
  }
});

// 静态文件服务
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadDir));

// 上传图片 API
app.post('/api/upload/:foodId', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: '未上传文件' });
  }
  res.json({
    success: true,
    url: `/uploads/${req.file.filename}`,
    foodId: req.params.foodId
  });
});

// 获取已上传图片映射
app.get('/api/uploads', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.json({});
    const map = {};
    files.forEach(f => {
      const id = parseInt(path.basename(f, path.extname(f)));
      if (!isNaN(id)) map[id] = `/uploads/${f}`;
    });
    res.json(map);
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`🍽️ 今天吃什么 服务器已启动`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📁 上传目录: ${uploadDir}`);
});
