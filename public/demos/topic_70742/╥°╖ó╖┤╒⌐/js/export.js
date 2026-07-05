/**
 * 银发反诈守护人 - 提醒卡导出模块
 * 支持将反诈提醒卡导出为PNG图片
 */

const CardExport = {
  /**
   * 生成家庭反诈提醒卡并导出为PNG
   */
  async exportCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');

    // 背景
    const gradient = ctx.createLinearGradient(0, 0, 0, 1200);
    gradient.addColorStop(0, '#F0F9FF');
    gradient.addColorStop(0.5, '#E0F2FE');
    gradient.addColorStop(1, '#F0F9FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 1200);

    // 顶部装饰条
    const topGradient = ctx.createLinearGradient(0, 0, 800, 0);
    topGradient.addColorStop(0, '#0369A1');
    topGradient.addColorStop(0.5, '#38BDF8');
    topGradient.addColorStop(1, '#0369A1');
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, 800, 8);

    // 标题
    ctx.fillStyle = '#0369A1';
    ctx.font = 'bold 36px "Lexend", "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('家庭反诈提醒卡', 400, 80);

    // 副标题
    ctx.fillStyle = '#0C4A6E';
    ctx.font = '18px "Source Sans 3", "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('守护家人，远离诈骗', 400, 120);

    // 分隔线
    ctx.strokeStyle = 'rgba(3, 105, 161, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 150);
    ctx.lineTo(700, 150);
    ctx.stroke();

    let y = 190;

    // 获取已解锁的图鉴内容
    const encyclopediaProgress = Storage.getEncyclopediaProgress();
    const encyclopedia = encyclopediaProgress.length > 0
      ? encyclopediaProgress.map(id => ENCYCLOPEDIA[id]).filter(Boolean)
      : Object.values(ENCYCLOPEDIA);

    // 四大防骗要点
    ctx.fillStyle = '#0369A1';
    ctx.font = 'bold 24px "Lexend", "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('四大防骗要点', 80, y);
    y += 50;

    const tips = [
      { icon: '01', title: '不轻信', desc: '不轻信陌生来电、短信和网络信息，遇到可疑情况及时与家人核实。' },
      { icon: '02', title: '不透露', desc: '不向陌生人透露身份证号、银行卡号、密码、验证码等个人信息。' },
      { icon: '03', title: '不转账', desc: '不向陌生账户转账汇款，公检法机关不存在"安全账户"。' },
      { icon: '04', title: '不链接', desc: '不点击陌生链接，不扫描来历不明的二维码，不下载不明APP。' }
    ];

    tips.forEach(tip => {
      // 图标背景
      ctx.fillStyle = '#0369A1';
      ctx.beginPath();
      ctx.arc(100, y + 15, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "Lexend", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tip.icon, 100, y + 20);

      ctx.fillStyle = '#0C4A6E';
      ctx.font = 'bold 20px "Lexend", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(tip.title, 140, y + 10);

      ctx.fillStyle = '#475569';
      ctx.font = '14px "Source Sans 3", "PingFang SC", "Microsoft YaHei", sans-serif';
      // 文字换行
      const words = tip.desc;
      const maxWidth = 560;
      const lineHeight = 22;
      let line = '';
      let lineY = y + 38;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
          ctx.fillText(line, 140, lineY);
          line = words[i];
          lineY += lineHeight;
        } else {
          line = words[i];
        }
      }
      if (line.length > 0) {
        ctx.fillText(line, 140, lineY);
      }

      y += 80;
    });

    // 分隔线
    y += 10;
    ctx.strokeStyle = 'rgba(3, 105, 161, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(720, y);
    ctx.stroke();
    y += 40;

    // 已解锁图鉴
    if (encyclopedia.length > 0) {
      ctx.fillStyle = '#0369A1';
      ctx.font = 'bold 24px "Lexend", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('已解锁反诈图鉴', 80, y);
      y += 45;

      encyclopedia.forEach(entry => {
        // 卡片背景
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = 'rgba(3, 105, 161, 0.2)';
        ctx.lineWidth = 1;
        roundRect(ctx, 80, y, 640, 95, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0C4A6E';
        ctx.font = 'bold 18px "Lexend", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(entry.title, 110, y + 30);

        // 提示
        ctx.fillStyle = '#475569';
        ctx.font = '13px "Source Sans 3", "PingFang SC", "Microsoft YaHei", sans-serif';
        const tipsText = entry.tips.join(' · ');
        ctx.fillText(tipsText, 110, y + 55);

        y += 110;
      });
    }

    // 底部求助信息
    y += 10;
    ctx.fillStyle = '#0369A1';
    ctx.font = 'bold 22px "Lexend", "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('求助方式', 400, y);
    y += 40;

    const helpItems = [
      { label: '反诈专线', value: '96110' },
      { label: '报警电话', value: '110' },
      { label: '消费者投诉', value: '12315' }
    ];

    helpItems.forEach(item => {
      ctx.fillStyle = '#0C4A6E';
      ctx.font = '16px "Source Sans 3", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(`${item.label}：${item.value}`, 400, y);
      y += 30;
    });

    // 底部
    y += 20;
    const bottomGradient = ctx.createLinearGradient(0, 0, 800, 0);
    bottomGradient.addColorStop(0, '#0369A1');
    bottomGradient.addColorStop(0.5, '#38BDF8');
    bottomGradient.addColorStop(1, '#0369A1');
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, 1180, 800, 20);

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '12px "Source Sans 3", "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('银发反诈守护人 · 守护家人财产安全 · 从我做起', 400, 1195);

    // 导出为PNG
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = '家庭反诈提醒卡.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve(true);
        } else {
          reject(new Error('导出失败'));
        }
      }, 'image/png');
    });
  }
};

// 辅助函数：绘制圆角矩形
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}