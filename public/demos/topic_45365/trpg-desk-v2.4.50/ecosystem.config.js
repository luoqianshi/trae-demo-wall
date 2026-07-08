// PM2 进程管理配置 - 用于服务器部署
// 用法: pm2 start ecosystem.config.js
//       pm2 stop trpg-desk
//       pm2 restart trpg-desk
//       pm2 logs trpg-desk
module.exports = {
  apps: [{
    name: 'trpg-desk',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
