(function () {
  const data = window.MiniFishData = window.MiniFishData || {};
  data.accounts = {
    notices: [
      { id:1, type:'warn', tag:'过期', title:'小红书「甜品研究所」Cookie 将于 2 小时后过期', time:'5 分钟前' },
      { id:2, type:'info', tag:'完成', title:'抖音热搜抓取任务完成，新增 50 条素材', time:'18 分钟前' },
      { id:3, type:'success', tag:'余额', title:'DeepSeek API 充值成功 +¥200', time:'1 小时前' },
      { id:4, type:'info', tag:'告警', title:'GLM-4 调用延迟高于平均，建议切换模型', time:'2 小时前' }
    ],
    showAddAccount: false,
    cookieOverview: [
      { label:'管理账号总数', value:'14', color:'#e8755e' },
      { label:'正常运行', value:'9', color:'#7ba989' },
      { label:'即将过期', value:'3', color:'#d4a04c' },
      { label:'已失效', value:'2', color:'#e06c6c' }
    ],
    cookiePlatforms: [
      { name:'抖音', color:'#737373', status:'warn', statusText:'部分异常', valid:3, expiring:1, expired:0,
        accounts:[
          { id:1, name:'甜品研究所', uid:'MS4wLjAB', color:'#FF6B6B', status:'valid', percent:72, remain:'5天12时', expire:'2026-07-09' },
          { id:2, name:'生活观察家', uid:'MS4wLjCD', color:'#5E8C5E', status:'expiring', percent:18, remain:'6小时', expire:'2026-07-03 18:00' },
          { id:3, name:'萌宠日记', uid:'MS4wLjEF', color:'#7B6FB0', status:'valid', percent:85, remain:'12天', expire:'2026-07-15' }
        ] },
      { name:'小红书', color:'#FF2442', status:'err', statusText:'存在失效', valid:2, expiring:1, expired:1,
        accounts:[
          { id:5, name:'穿搭研究所', uid:'5f8d2a', color:'#FF2442', status:'valid', percent:90, remain:'15天', expire:'2026-07-18' },
          { id:6, name:'美食记', uid:'5f8d3b', color:'#FF6B6B', status:'expiring', percent:12, remain:'2小时', expire:'2026-07-03 14:00' },
          { id:7, name:'护肤日记', uid:'5f8d4c', color:'#C75450', status:'expired', percent:0, remain:'已失效', expire:'2026-07-02' }
        ] },
      { name:'B站', color:'#FB7299', status:'warn', statusText:'部分过期', valid:1, expiring:1, expired:1,
        accounts:[
          { id:10, name:'科技小玩童', uid:'uid:1234', color:'#4A90E2', status:'valid', percent:88, remain:'14天', expire:'2026-07-17' },
          { id:11, name:'青春影像', uid:'uid:5678', color:'#C9A0DC', status:'expiring', percent:15, remain:'3小时', expire:'2026-07-03 15:00' },
          { id:12, name:'数码测评', uid:'uid:9012', color:'#9C9580', status:'expired', percent:0, remain:'已失效', expire:'2026-07-01' }
        ] }
    ]
  };
})();
