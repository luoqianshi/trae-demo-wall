(function () {
  const data = window.MiniFishData = window.MiniFishData || {};
  data.dashboard = {
    dashboard: {
      stats: [
        { label:'今日发布', value:'12', trend:8.5, bg:'linear-gradient(135deg,#e8755e,#d96548)', icon:'<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#fff" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z"/></svg>' },
        { label:'粉丝净增', value:'+2,847', trend:12.3, bg:'linear-gradient(135deg,#6b8cb8,#4f6f99)', icon:'<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#fff" d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3c0-2.66-5.33-4-8-4z"/></svg>' },
        { label:'内容互动', value:'48.2K', trend:5.1, bg:'linear-gradient(135deg,#7ba989,#5e8a6e)', icon:'<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#fff" d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>' },
        { label:'API 调用', value:'3,156', trend:-3.2, bg:'linear-gradient(135deg,#d4a04c,#b8862e)', icon:'<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#fff" d="M9 21h6v-2H9zm3-19a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2z"/></svg>' }
      ],
      todos: [
        { id:1, text:'完成「夏日饮品」选题脚本撰写', done:false, priority:'high' },
        { id:2, text:'发布抖音今日 3 条短视频', done:true, priority:'mid' },
        { id:3, text:'回复小红书评论区 TOP 20', done:false, priority:'mid' },
        { id:4, text:'分析竞品「美食记」近期爆款', done:false, priority:'high' },
        { id:5, text:'更新 Cookie：抖音运营号', done:false, priority:'low' }
      ],
      todaySummary: {
        title: '今日创作状态：稳中有进，粉丝增长超预期',
        score: 78,
        scoreLabel: '今日健康度',
        scoreColor: 'green',
        highlights: [
          { label:'核心亮点', desc:'粉丝净增2847人，较昨日提升12.3%，互动率保持在健康水平' },
          { label:'注意事项', desc:'API调用量下降3.2%，建议检查数据采集任务是否正常运行' },
          { label:'优先行动', desc:'完成「夏日饮品」脚本并发布，该选题近7天搜索热度上升' }
        ]
      },
      fanInsights: [
        { label:'核心粉丝占比', value:'38%', trend:'+2.1%', status:'green' },
        { label:'新增粉丝来源', value:'短视频62%', trend:'', status:'blue' },
        { label:'活跃粉丝时段', value:'19-22点', trend:'', status:'blue' }
      ],
      contentPerformance: {
        bestTitle: '「AI工具免费替代」系列',
        bestViews: '12.8w',
        bestFavRate: '7.2%',
        tip: '教程类内容收藏率高于均值42%，建议持续深耕'
      },
      dataMeta: {
        range: '近7天数据',
        updateTime: '2026-03-21 09:30',
        source: '多平台数据汇总'
      }
    }
  };
})();