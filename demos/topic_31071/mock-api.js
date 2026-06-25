(function(){
'use strict';
function uuid(){return 'xxxx-xxxx-xxxx'.replace(/x/g,function(){return Math.floor(Math.random()*16).toString(16)})}
function now(){return new Date().toISOString().replace('T',' ').substring(0,19)}
function daysAgo(n){var d=new Date();d.setDate(d.getDate()-n);return d.toISOString().replace('T',' ').substring(0,19)}
function json(d,s){return{status:s||200,headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}}
function success(d){return json({code:0,message:'操作成功',data:d})}
function error(m){return json({code:-1,message:m,data:null},400)}

var USERS=[
  {id:1,username:'admin',nickname:'超级管理员',email:'admin@cms.com',phone:'13800000001',role:'super_admin',avatar:'',status:'active',department_id:1,created_at:daysAgo(90)},
  {id:2,username:'editor',nickname:'内容编辑',email:'editor@cms.com',phone:'13800000002',role:'editor',avatar:'',status:'active',department_id:2,created_at:daysAgo(60)}
];
var DEPTS=[
  {id:1,name:'总公司',parent_id:null,sort_order:1,leader:'超级管理员',created_at:daysAgo(90)},
  {id:2,name:'内容运营部',parent_id:1,sort_order:1,leader:'内容编辑',created_at:daysAgo(60)},
  {id:3,name:'审核合规部',parent_id:1,sort_order:2,leader:'审核员',created_at:daysAgo(45)},
  {id:4,name:'技术部',parent_id:1,sort_order:3,leader:'',created_at:daysAgo(30)},
  {id:5,name:'新媒体组',parent_id:2,sort_order:1,leader:'',created_at:daysAgo(20)}
];
var CATS=[
  {id:1,name:'行业资讯',slug:'industry-news',parent_id:null,description:'最新行业动态',sort_order:1,article_count:12,created_at:daysAgo(90)},
  {id:2,name:'产品动态',slug:'product-updates',parent_id:null,description:'产品更新',sort_order:2,article_count:8,created_at:daysAgo(85)},
  {id:3,name:'技术分享',slug:'tech-sharing',parent_id:null,description:'技术文章',sort_order:3,article_count:15,created_at:daysAgo(80)},
  {id:4,name:'使用教程',slug:'tutorials',parent_id:null,description:'使用指南',sort_order:4,article_count:6,created_at:daysAgo(70)},
  {id:5,name:'Vue.js',slug:'vuejs',parent_id:3,description:'Vue.js 技术',sort_order:1,article_count:5,created_at:daysAgo(60)},
  {id:6,name:'Node.js',slug:'nodejs',parent_id:3,description:'Node.js 后端',sort_order:2,article_count:4,created_at:daysAgo(55)}
];
var TAGS=[
  {id:1,name:'Vue3',article_count:8},{id:2,name:'Element Plus',article_count:5},
  {id:3,name:'Node.js',article_count:6},{id:4,name:'MySQL',article_count:3},
  {id:5,name:'CMS',article_count:10},{id:6,name:'内容管理',article_count:7},
  {id:7,name:'企业微信',article_count:2},{id:8,name:'多平台分发',article_count:4}
];
var ARTICLES=[
  {id:1,title:'CMS智能内容中台正式发布',slug:'cms-launch',summary:'全新的企业级内容管理系统，助力企业内容运营效率提升10倍。',content:'<p>CMS智能内容中台是一款面向企业的内容管理系统，支持多平台一键分发、智能审批流程、企微组织架构同步等核心功能。</p><h3>核心功能亮点</h3><ul><li>多平台一键分发：支持微信公众号、抖音、微博、小红书、今日头条</li><li>智能审批流：多级审批、分类级配置</li><li>企微深度集成：自动同步通讯录和部门架构</li><li>内容安全：敏感词库管理，发布前自动检测拦截</li></ul>',category_id:2,status:'published',author_id:1,author_name:'超级管理员',cover_image:'',view_count:1256,like_count:89,comment_count:12,is_top:1,allow_comment:1,published_at:daysAgo(1),created_at:daysAgo(3),updated_at:daysAgo(1),tags:[1,5,6]},
  {id:2,title:'如何用Vue3构建企业级后台管理系统',slug:'vue3-enterprise-admin',summary:'从零搭建一个基于Vue3 + Element Plus的企业级后台管理系统。',content:'<p>本文将详细介绍如何使用Vue3和Element Plus构建一个功能完善的企业级后台管理系统。</p>',category_id:5,status:'published',author_id:2,author_name:'内容编辑',cover_image:'',view_count:856,like_count:45,comment_count:8,is_top:0,allow_comment:1,published_at:daysAgo(3),created_at:daysAgo(5),updated_at:daysAgo(3),tags:[1,2]},
  {id:3,title:'Node.js后端API设计最佳实践',slug:'nodejs-api-best-practices',summary:'分享Node.js后端API设计的经验和最佳实践。',content:'<p>在构建企业级应用时，API设计是至关重要的一环。</p>',category_id:6,status:'published',author_id:2,author_name:'内容编辑',cover_image:'',view_count:623,like_count:32,comment_count:5,is_top:0,allow_comment:1,published_at:daysAgo(5),created_at:daysAgo(7),updated_at:daysAgo(5),tags:[3]},
  {id:4,title:'企业微信集成方案详解',slug:'wework-integration',summary:'详解如何将CMS系统与企业微信深度集成。',content:'<p>企业微信集成是CMS系统的核心功能之一。</p>',category_id:1,status:'published',author_id:1,author_name:'超级管理员',cover_image:'',view_count:445,like_count:28,comment_count:3,is_top:0,allow_comment:1,published_at:daysAgo(7),created_at:daysAgo(10),updated_at:daysAgo(7),tags:[7]},
  {id:5,title:'多平台内容分发策略指南',slug:'multi-platform-distribution',summary:'如何高效地将内容分发到多个平台。',content:'<p>内容分发是内容运营的核心环节。</p>',category_id:1,status:'published',author_id:2,author_name:'内容编辑',cover_image:'',view_count:334,like_count:19,comment_count:2,is_top:0,allow_comment:1,published_at:daysAgo(10),created_at:daysAgo(12),updated_at:daysAgo(10),tags:[8,6]},
  {id:6,title:'内容安全与敏感词检测',slug:'content-security',summary:'介绍CMS系统中的内容安全机制。',content:'<p>内容安全是企业内容管理的重要保障。</p>',category_id:2,status:'published',author_id:1,author_name:'超级管理员',cover_image:'',view_count:278,like_count:15,comment_count:1,is_top:0,allow_comment:1,published_at:daysAgo(15),created_at:daysAgo(18),updated_at:daysAgo(15),tags:[5]},
  {id:7,title:'CMS系统V2.0升级公告',slug:'cms-v2-upgrade',summary:'V2.0版本新增审批流、消息通知等功能。',content:'<p>CMS系统V2.0版本正式发布。</p>',category_id:2,status:'published',author_id:1,author_name:'超级管理员',cover_image:'',view_count:567,like_count:38,comment_count:6,is_top:0,allow_comment:1,published_at:daysAgo(20),created_at:daysAgo(22),updated_at:daysAgo(20),tags:[5]},
  {id:8,title:'2026年内容运营趋势报告',slug:'content-trends-2026',summary:'分析2026年内容运营的最新趋势。',content:'<p>2026年内容运营领域出现了许多新趋势。</p>',category_id:1,status:'draft',author_id:2,author_name:'内容编辑',cover_image:'',view_count:0,like_count:0,comment_count:0,is_top:0,allow_comment:1,published_at:null,created_at:daysAgo(1),updated_at:daysAgo(1),tags:[6]},
  {id:9,title:'MySQL性能优化实战经验',slug:'mysql-performance',summary:'分享MySQL数据库性能优化的实战经验。',content:'<p>数据库性能优化是后端开发的重要技能。</p>',category_id:6,status:'pending',author_id:2,author_name:'内容编辑',cover_image:'',view_count:0,like_count:0,comment_count:0,is_top:0,allow_comment:1,published_at:null,created_at:daysAgo(2),updated_at:daysAgo(2),tags:[4,3]},
  {id:10,title:'Element Plus高级组件使用技巧',slug:'element-plus-tips',summary:'深入讲解Element Plus高级组件的使用方法。',content:'<p>Element Plus提供了丰富的组件。</p>',category_id:5,status:'published',author_id:2,author_name:'内容编辑',cover_image:'',view_count:412,like_count:22,comment_count:4,is_top:0,allow_comment:1,published_at:daysAgo(25),created_at:daysAgo(28),updated_at:daysAgo(25),tags:[1,2]}
];
var COMMENTS=[
  {id:1,article_id:1,content:'非常棒的系统！',author_name:'读者A',status:'approved',created_at:daysAgo(1)},
  {id:2,article_id:1,content:'多平台分发功能太好用了。',author_name:'读者B',status:'approved',created_at:daysAgo(1)},
  {id:3,article_id:2,content:'学到了很多Vue3的技巧。',author_name:'读者C',status:'approved',created_at:daysAgo(3)},
  {id:4,article_id:1,content:'审批流程可以再优化一下。',author_name:'读者D',status:'pending',created_at:daysAgo(0)}
];
var MEDIA=[
  {id:1,name:'banner-1.jpg',type:'image',mime_type:'image/jpeg',size:245678,url:'https://picsum.photos/seed/cms1/800/400',folder_id:null,created_at:daysAgo(30)},
  {id:2,name:'banner-2.jpg',type:'image',mime_type:'image/jpeg',size:189234,url:'https://picsum.photos/seed/cms2/800/400',folder_id:null,created_at:daysAgo(25)},
  {id:3,name:'doc-guide.pdf',type:'document',mime_type:'application/pdf',size:567890,url:'',folder_id:null,created_at:daysAgo(20)},
  {id:4,name:'icon-logo.png',type:'image',mime_type:'image/png',size:34567,url:'https://picsum.photos/seed/cms3/200/200',folder_id:null,created_at:daysAgo(15)}
];
var ROLES=[
  {id:1,name:'super_admin',display_name:'超级管理员',description:'拥有系统所有权限',permissions:['*'],user_count:1,created_at:daysAgo(90)},
  {id:2,name:'admin',display_name:'管理员',description:'管理用户和内容',permissions:['article:*','category:*','tag:*','media:*','comment:*','platform:*','user:list','stats:*'],user_count:1,created_at:daysAgo(90)},
  {id:3,name:'editor',display_name:'编辑',description:'内容编辑权限',permissions:['article:list','article:create','article:edit','category:list','tag:list','media:list','media:upload','comment:list','platform:list'],user_count:2,created_at:daysAgo(90)}
];
var PERMS=['article:list','article:create','article:edit','article:delete','article:review','article:publish','category:list','category:create','category:edit','category:delete','tag:list','tag:create','tag:edit','tag:delete','media:list','media:upload','media:delete','comment:list','comment:approve','comment:delete','platform:list','platform:manage','platform:publish','user:list','user:create','user:edit','user:delete','role:list','role:create','role:edit','role:delete','stats:*','settings:*'];
var PLAT_CFG=[{id:1,platform:'wechat',app_id:'wx41e960f9dcd448ac',app_secret:'***',status:'configured',token_expires_at:null,created_at:daysAgo(10)}];
var NOTIFS=[
  {id:1,type:'system',title:'系统更新通知',content:'CMS系统V2.0已发布',related_type:null,related_id:null,is_read:0,created_at:daysAgo(1)},
  {id:2,type:'approval_pending',title:'新文章待审核',content:'文章已提交审核',related_type:'article',related_id:8,is_read:0,created_at:daysAgo(0)},
  {id:3,type:'comment',title:'新评论通知',content:'读者A评论了《CMS智能内容中台正式发布》',related_type:'article',related_id:1,is_read:1,created_at:daysAgo(1)}
];
var SYSCFG={site_name:'CMS智能内容中台',site_description:'企业级内容管理系统',logo:'',favicon:'',icp:'',analytics:'',articles_per_page:10,allow_register:false,default_role:'editor'};
var LOGS=Array.from({length:20},function(_,i){return{id:i+1,user_id:[1,2,3][i%3],username:['admin','editor','reviewer'][i%3],action:['login','article:create','article:edit','article:publish','category:create','media:upload'][i%6],detail:['登录系统','创建文章','编辑文章','发布文章','创建分类','上传媒体'][i%6],ip:'192.168.1.'+(i+1),created_at:daysAgo(i)}});
var APIKEYS=[{id:1,name:'门户API密钥',key:'cms_ak_demo',secret:'cms_sk_demo',status:'active',last_used_at:daysAgo(1),created_at:daysAgo(30)}];

var db={articles:ARTICLES.slice(),categories:CATS.slice(),tags:TAGS.slice(),comments:COMMENTS.slice(),media:MEDIA.slice(),notifications:NOTIFS.slice(),logs:LOGS.slice(),platformConfigs:PLAT_CFG.slice(),apiKeys:APIKEYS.slice()};

function handle(url,method,body){
  var u=new URL(url,location.origin);
  var p=u.pathname.split('/').filter(Boolean);
  var data={};
  try{data=body?JSON.parse(body):{};}catch(e){}
  
  // Auth
  if(method==='POST'&&p[0]==='api'&&p[1]==='v1'&&p[2]==='auth'&&p[3]==='login'){
    var user=USERS.find(function(x){return x.username===data.username});
    if(!user||(data.password!=='admin123'&&data.password!=='editor123'))return error('用户名或密码错误');
    var perms=user.role==='super_admin'?['*']:(ROLES.find(function(r){return r.name===user.role})||{}).permissions||[];
    return success({token:'demo_token_'+user.username+'_'+Date.now(),user:Object.assign({},user,{permissions:perms}),permissions:perms});
  }
  if(method==='GET'&&u.pathname==='/api/v1/auth/me'){
    var t=(localStorage.getItem('cms_token')||'').replace('demo_token_','').split('_')[0];
    var user=USERS.find(function(x){return x.username===t})||USERS[0];
    var perms=user.role==='super_admin'?['*']:(ROLES.find(function(r){return r.name===user.role})||{}).permissions||[];
    return success(Object.assign({},user,{permissions:perms}));
  }
  if(method==='PUT'&&u.pathname==='/api/v1/auth/change-password')return success({message:'密码修改成功（Demo）'});

  // Articles
  if(method==='GET'&&u.pathname==='/api/v1/articles'){
    var pg=parseInt(u.searchParams.get('page'))||1,ps=parseInt(u.searchParams.get('pageSize'))||10;
    var st=u.searchParams.get('status'),kw=u.searchParams.get('keyword');
    var l=db.articles.slice();if(st)l=l.filter(function(a){return a.status===st});if(kw)l=l.filter(function(a){return a.title.indexOf(kw)!==-1});
    return success({list:l.slice((pg-1)*ps,pg*ps),total:l.length,page:pg,pageSize:ps});
  }
  if(method==='POST'&&u.pathname==='/api/v1/articles'){
    var a={id:Math.max.apply(null,db.articles.map(function(a){return a.id}))+1};
    Object.assign(a,data,{status:data.status||'draft',author_id:1,author_name:'超级管理员',view_count:0,like_count:0,comment_count:0,is_top:0,allow_comment:1,published_at:null,created_at:now(),updated_at:now()});
    db.articles.unshift(a);return success(a);
  }
  if(p.length===4&&p[2]==='articles'&&method==='GET'){var a=db.articles.find(function(a){return a.id==p[3]});return a?success(a):error('文章不存在');}
  if(p.length===4&&p[2]==='articles'&&method==='PUT'){var i=db.articles.findIndex(function(a){return a.id==p[3]});if(i!==-1){Object.assign(db.articles[i],data,{updated_at:now()});return success({message:'更新成功'})}return error('文章不存在');}
  if(p.length===4&&p[2]==='articles'&&method==='DELETE'){db.articles=db.articles.filter(function(a){return a.id!=p[3]});return success({message:'删除成功'});}
  if(u.pathname==='/api/v1/articles/batch-delete'&&method==='POST')return success({message:'操作成功'});
  if(u.pathname==='/api/v1/articles/batch-status'&&method==='POST')return success({message:'操作成功'});
  if(u.pathname==='/api/v1/articles/trash'&&method==='GET')return success({list:[],total:0});
  if(u.pathname==='/api/v1/articles/check-slug'&&method==='GET')return success({available:true});

  // Categories
  if(method==='GET'&&u.pathname==='/api/v1/categories')return success(db.categories);
  if(method==='GET'&&u.pathname==='/api/v1/categories/flat')return success(db.categories);
  if(method==='POST'&&u.pathname==='/api/v1/categories'){var c={id:Math.max.apply(null,db.categories.map(function(c){return c.id}))+1};Object.assign(c,data,{article_count:0,created_at:now()});db.categories.push(c);return success(c);}
  if(p.length===4&&p[2]==='categories'&&method==='PUT'){var i=db.categories.findIndex(function(c){return c.id==p[3]});if(i!==-1)Object.assign(db.categories[i],data);return success({message:'更新成功'});}
  if(p.length===4&&p[2]==='categories'&&method==='DELETE'){db.categories=db.categories.filter(function(c){return c.id!=p[3]});return success({message:'删除成功'});}

  // Tags
  if(method==='GET'&&u.pathname==='/api/v1/tags')return success(db.tags);
  if(method==='POST'&&u.pathname==='/api/v1/tags'){var t={id:Math.max.apply(null,db.tags.map(function(t){return t.id}))+1};Object.assign(t,data,{article_count:0,created_at:now()});db.tags.push(t);return success(t);}
  if(p.length===4&&p[2]==='tags'&&method==='PUT'){var i=db.tags.findIndex(function(t){return t.id==p[3]});if(i!==-1)Object.assign(db.tags[i],data);return success({message:'更新成功'});}
  if(p.length===4&&p[2]==='tags'&&method==='DELETE'){db.tags=db.tags.filter(function(t){return t.id!=p[3]});return success({message:'删除成功'});}

  // Media
  if(method==='GET'&&u.pathname==='/api/v1/media')return success({list:db.media,total:db.media.length,page:1,pageSize:20});
  if(method==='POST'&&u.pathname==='/api/v1/media/upload')return success({id:db.media.length+1,name:'uploaded.jpg',url:'https://picsum.photos/seed/up'+Date.now()+'/400/300'});
  if(p.length===4&&p[2]==='media'&&method==='DELETE'){db.media=db.media.filter(function(m){return m.id!=p[3]});return success({message:'删除成功'});}
  if(method==='GET'&&u.pathname==='/api/v1/media/folders/list')return success([]);

  // Comments
  if(method==='GET'&&u.pathname==='/api/v1/comments'){var aid=u.searchParams.get('article_id');var l=db.comments.slice();if(aid)l=l.filter(function(c){return c.article_id==aid});return success({list:l,total:l.length});}
  if(u.pathname==='/api/v1/comments/batch-approve'&&method==='POST')return success({message:'操作成功'});

  // Users & Depts
  if(method==='GET'&&u.pathname==='/api/v1/users')return success({list:USERS,total:USERS.length});
  if(method==='GET'&&u.pathname==='/api/v1/departments')return success(DEPTS);
  if(method==='GET'&&u.pathname==='/api/v1/roles')return success(ROLES);
  if(method==='GET'&&u.pathname==='/api/v1/roles/permissions')return success(PERMS);

  // Platforms
  if(method==='GET'&&u.pathname==='/api/v1/platforms/info'){
    var plats=[
      {platform:'wechat',name:'微信公众号',icon:'ChatDotRound',color:'#07C160',authType:'token',fields:[{key:'app_id',label:'AppID',placeholder:'请输入微信公众号AppID'},{key:'app_secret',label:'AppSecret',placeholder:'请输入微信公众号AppSecret'}]},
      {platform:'douyin',name:'抖音',icon:'VideoCameraFilled',color:'#000000',authType:'oauth',fields:[{key:'app_id',label:'Client Key',placeholder:'请输入抖音Client Key'},{key:'app_secret',label:'Client Secret',placeholder:'请输入抖音Client Secret'}]},
      {platform:'weibo',name:'微博',icon:'Connection',color:'#FF8200',authType:'oauth',fields:[{key:'app_id',label:'App Key',placeholder:'请输入微博App Key'},{key:'app_secret',label:'App Secret',placeholder:'请输入微博App Secret'}]},
      {platform:'xiaohongshu',name:'小红书',icon:'Film',color:'#E94F88',authType:'oauth',fields:[{key:'app_id',label:'App ID',placeholder:'请输入小红书App ID'},{key:'app_secret',label:'App Secret',placeholder:'请输入小红书App Secret'}]},
      {platform:'toutiao',name:'今日头条',icon:'Document',color:'#FF6B35',authType:'token',fields:[{key:'app_id',label:'App Key',placeholder:'请输入今日头条App Key'},{key:'app_secret',label:'App Secret',placeholder:'请输入今日头条App Secret'}]}
    ];
    var cm={};db.platformConfigs.forEach(function(c){cm[c.platform]=c;});
    return success(plats.map(function(p){return Object.assign({},p,{configured:!!cm[p.platform],config:cm[p.platform]||null})}));
  }
  if(method==='POST'&&u.pathname==='/api/v1/platforms/config'){
    var pl=data.platform,cfg=data.config;var i=db.platformConfigs.findIndex(function(c){return c.platform===pl});
    if(i!==-1){Object.assign(db.platformConfigs[i],{app_id:cfg.app_id,app_secret:cfg.app_secret,status:'configured'});}
    else{db.platformConfigs.push({id:Date.now(),platform:pl,app_id:cfg.app_id,app_secret:cfg.app_secret,status:'configured',created_at:now()});}
    return success({message:'配置保存成功'});
  }
  if(u.pathname.indexOf('/api/v1/platforms/test/')===0&&method==='POST')return success({message:'连接测试成功（Demo）'});
  if(u.pathname.indexOf('/api/v1/platforms/disconnect/')===0&&method==='POST'){var pl=u.pathname.split('/').pop();db.platformConfigs=db.platformConfigs.filter(function(c){return c.platform!==pl});return success({message:'已断开连接'});}
  if(method==='GET'&&u.pathname==='/api/v1/platforms/records')return success({list:[],total:0});
  if(method==='POST'&&u.pathname==='/api/v1/platforms/publish')return success([{platform:(data.platforms||[])[0],status:'success',platform_url:'#'}]);

  // Stats
  if(method==='GET'&&u.pathname==='/api/v1/stats/dashboard'){
    var pub=db.articles.filter(function(a){return a.status==='published'});
    return success({total_articles:db.articles.length,published_articles:pub.length,draft_articles:db.articles.filter(function(a){return a.status==='draft'}).length,pending_articles:db.articles.filter(function(a){return a.status==='pending'}).length,total_views:db.articles.reduce(function(s,a){return s+a.view_count},0),total_likes:db.articles.reduce(function(s,a){return s+a.like_count},0),total_comments:db.comments.length,total_categories:db.categories.length,total_tags:db.tags.length,total_users:USERS.length,recent_articles:db.articles.slice(0,5),popular_articles:pub.sort(function(a,b){return b.view_count-a.view_count}).slice(0,5)});
  }
  if(method==='GET'&&u.pathname==='/api/v1/stats/logs')return success({list:db.logs,total:db.logs.length});
  if(method==='GET'&&u.pathname==='/api/v1/stats/system')return success({os:'Demo Mode',node:'N/A',cpu:'N/A',memory:'N/A',uptime:'N/A'});

  // Settings
  if(method==='GET'&&u.pathname==='/api/v1/settings/config')return success(SYSCFG);
  if(method==='PUT'&&u.pathname==='/api/v1/settings/config'){Object.assign(SYSCFG,data);return success({message:'保存成功'});}
  if(method==='GET'&&u.pathname==='/api/v1/settings/wework')return success({corp_id:'',agent_id:'',secret:'',contacts_secret:'',sync_enabled:false});
  if(method==='PUT'&&u.pathname==='/api/v1/settings/wework')return success({message:'保存成功'});

  // Notifications
  if(method==='GET'&&u.pathname==='/api/v1/notifications')return success({list:db.notifications,total:db.notifications.length});
  if(method==='GET'&&u.pathname==='/api/v1/notifications/unread-count')return success({count:db.notifications.filter(function(n){return!n.is_read}).length});
  if(method==='PUT'&&u.pathname==='/api/v1/notifications/read-all'){db.notifications.forEach(function(n){n.is_read=1});return success({message:'全部已读'});}
  if(p.length===4&&p[2]==='notifications'&&method==='PUT'){var n=db.notifications.find(function(n){return n.id==p[3]});if(n)n.is_read=1;return success({message:'已读'});}

  // API Keys
  if(method==='GET'&&u.pathname==='/api/v1/api-keys')return success(db.apiKeys);
  if(method==='POST'&&u.pathname==='/api/v1/api-keys')return success({id:Date.now(),name:data.name||'',key:'cms_ak_'+uuid(),secret:'cms_sk_'+uuid(),status:'active',created_at:now()});

  // Sensitive words
  if(method==='GET'&&u.pathname==='/api/v1/sensitive-words')return success({list:[{id:1,word:'测试敏感词1',category:'政治',status:'active'},{id:2,word:'测试敏感词2',category:'广告',status:'active'}],total:2});

  // Approval flows
  if(method==='GET'&&u.pathname==='/api/v1/approval-flows')return success([]);

  // Public API
  if(method==='GET'&&u.pathname==='/api/public/site')return success({name:SYSCFG.site_name,description:SYSCFG.site_description});
  if(method==='GET'&&u.pathname==='/api/public/articles'){
    var pg=parseInt(u.searchParams.get('page'))||1,ps=parseInt(u.searchParams.get('pageSize'))||10;
    var l=db.articles.filter(function(a){return a.status==='published'});
    return success({list:l.slice((pg-1)*ps,pg*ps),total:l.length});
  }
  if(u.pathname.indexOf('/api/public/articles/')===0&&method==='GET'){var a=db.articles.find(function(a){return a.id==p[3]});return a?success(a):error('不存在');}
  if(method==='GET'&&u.pathname==='/api/public/categories')return success(db.categories.filter(function(c){return!c.parent_id}));
  if(method==='GET'&&u.pathname==='/api/public/tags')return success(db.tags);
  if(method==='GET'&&u.pathname==='/api/public/featured')return success(db.articles.filter(function(a){return a.status==='published'}).slice(0,5));
  if(method==='GET'&&u.pathname==='/api/public/popular')return success(db.articles.filter(function(a){return a.status==='published'}).sort(function(a,b){return b.view_count-a.view_count}).slice(0,5));
  if(method==='GET'&&u.pathname==='/api/public/config')return success(SYSCFG);

  return null;
}

// Intercept fetch
var origFetch=window.fetch;
window.fetch=function(input,init){
  var url=typeof input==='string'?input:input.url;
  var method=(init&&init.method||'GET').toUpperCase();
  if(url.indexOf('/api/')===-1)return origFetch.apply(this,arguments);
  var r=handle(url,method,init&&init.body);
  if(r){
    return new Promise(function(resolve){
      setTimeout(function(){resolve(new Response(r.body,{status:r.status,headers:r.headers}));},150+Math.random()*200);
    });
  }
  return origFetch.apply(this,arguments);
};

// Intercept XHR
var origOpen=XMLHttpRequest.prototype.open;
var origSend=XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open=function(m,url){this._mu=url;this._mm=m;return origOpen.apply(this,arguments);};
XMLHttpRequest.prototype.send=function(body){
  if(this._mu&&this._mu.indexOf('/api/')!==-1){
    var r=handle(this._mu,this._mm,body);
    if(r){
      var self=this;
      setTimeout(function(){
        Object.defineProperty(self,'status',{value:r.status,writable:false});
        Object.defineProperty(self,'responseText',{value:r.body,writable:false});
        Object.defineProperty(self,'response',{value:r.body,writable:false});
        Object.defineProperty(self,'readyState',{value:4,writable:false});
        self.dispatchEvent(new Event('load'));
        self.dispatchEvent(new Event('loadend'));
      },150+Math.random()*200);
      return;
    }
  }
  return origSend.apply(this,arguments);
};

console.log('%c✅ CMS Demo Mock API 已启动','color:#07C160;font-size:14px;font-weight:bold');
console.log('%c账号: admin/admin123 | editor/editor123','color:#409eff');
})();
