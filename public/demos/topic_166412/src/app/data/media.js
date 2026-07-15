(function () {
  const data = window.MiniFishData = window.MiniFishData || {};
  data.media = {
    transcript: [
      { time:'00:03', text:'哈喽宝宝们～今天教大家做一杯超好看的夏日水蜜桃气泡水！', sent:'pos' },
      { time:'00:10', text:'首先准备一个成熟的水蜜桃，切成小块。', sent:'neu' },
      { time:'00:18', text:'颜值担当就在这一步啦，记得切得好看一点哦。', sent:'pos' },
      { time:'00:25', text:'把桃肉放进杯子里，用捣棒轻轻捣出汁。', sent:'neu' },
      { time:'00:33', text:'加入满满冰块，这一步看着就超治愈有没有！', sent:'pos' },
      { time:'00:40', text:'最后倒入气泡水，滋滋的声音绝了～', sent:'pos' },
      { time:'00:48', text:'如果觉得不够甜可以加一点蜂蜜，口感更柔和。', sent:'neu' },
      { time:'01:02', text:'成品就是这个样子，粉粉嫩嫩，朋友圈必备！', sent:'pos' },
      { time:'01:15', text:'记得点赞收藏，关注我解锁更多夏日饮品～', sent:'pos' }
    ],
    keyframes: [
      { time:'00:03', gradient:'linear-gradient(135deg,#FF9F8E,#FF6B6B)', tags:['开场','特写','出镜'] },
      { time:'00:18', gradient:'linear-gradient(135deg,#FFC93C,#E8A523)', tags:['切水果','ASMR'] },
      { time:'00:33', gradient:'linear-gradient(135deg,#A8A3FF,#7B6FB0)', tags:['加冰','治愈'] },
      { time:'00:40', gradient:'linear-gradient(135deg,#4A90E2,#2E6BB8)', tags:['倒气泡水','声音'] },
      { time:'00:48', gradient:'linear-gradient(135deg,#FFB347,#FF8C42)', tags:['蜂蜜','细节'] },
      { time:'01:02', gradient:'linear-gradient(135deg,#FF9F8E,#FF6B6B)', tags:['成品','高颜值'] },
      { time:'01:15', gradient:'linear-gradient(135deg,#C9A0DC,#9B7FB8)', tags:['引导关注','结尾'] }
    ],
    videoStructure: [
      { range:'00:00-00:03', stage:'黄金钩子', desc:'出镜特写 + 高颜值成品预览，3秒抓住注意力' },
      { range:'00:03-00:25', stage:'痛点铺垫', desc:'展示食材准备，ASMR切水果音效，建立期待' },
      { range:'00:25-00:48', stage:'核心制作', desc:'分步骤演示，每步配治愈画面，节奏明快' },
      { range:'00:48-01:02', stage:'成品展示', desc:'多角度成品特写 + 氛围感布景，激发分享欲' },
      { range:'01:02-01:30', stage:'行动号召', desc:'点赞收藏引导 + 关注钩子，承接评论区话题' }
    ]
  };
})();
