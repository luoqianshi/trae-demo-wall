# 汉字扫雷 v1.13.3

> 汉字扫盲系统 | 2026-06-27

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-06-19 | 初稿设计（调研/玩法/算法） |
| v1.0 | 2026-06-20 | 首个可玩版本（4模式/组字/扫雷融合） |
| v1.1 | 2026-06-20 | 修复无尽模式卡死/右键作弊/扩展汉字库 |
| v1.2 | 2026-06-21 | Chord操作/部首共鸣/连击奖励/Buff稀有度/右键探测 |
| v1.3 | 2026-06-21 | ES Modules 模块化拆分 |
| v1.4 | 2026-06-21 | 修复组字卡关问题 |
| **v1.5** | **2026-06-27** | **汉字扫盲系统：等级/收集/开放组字/拆字库/消除技能** |
| v1.5.1 | 2026-06-27 | 更新测试Skill文档；无尽模式压力测试报告 |
| v1.5.2 | 2026-06-27 | 修复组字阶段无法自由组合任意汉字的bug |
| v1.5.3 | 2026-06-27 | 修复「唐」错误拆解（3部件字→移除）；补全拆字库缺失的「问」 |
| v1.5.4 | 2026-06-27 | 修复消除技能使用后游戏无法结束的bug（移除汉字+配对部首） |
| v1.5.5 | 2026-06-27 | 汉字拆解审计：删除11个错误拆解（束/金/介/制/嘉/器/微/漱/磐/驫/辩）+ 5个重复条目 |
| v1.5.6 | 2026-06-27 | 笔划模式多项优化：部首格显示笔划数 + 右键数字格Chord + 自动合成 + 棋盘上直接点选合成 + 合成后格子消失 + 右键探测（猜中部首免费收集） |
| v1.5.7 | 2026-06-28 | 补充测试Skill文档：添加笔划模式测试说明（启动/格子交互/背包组字/Chord操作/UI选择器/测试模板） |
| v1.5.8 | 2026-06-28 | 无尽模式自动化测试：验证扫雷/探测/组字核心流程正常，发现神器汉字机制导致无法进入第2波波次过渡的Bug |
| v1.5.9 | 2026-06-28 | 优化测试Skill：主agent触发时自动委托给webapp-tester agent执行测试，webapp-tester自行调用Skill获取完整知识库 |
| v1.5.10 | 2026-06-28 | 修复无尽模式波次过渡Bug：神器汉字匹配后直接gameOver导致无法进入第2波；改为无尽模式下神器匹配给予额外奖励(+100分+30能量)而非结束游戏；修复词条文本覆盖神器奖励文本的+=问题 |
| v1.6.0 | 2026-06-28 | 重构测试架构：SKILL.md瘦身为纯调度器(425行→83行)，所有测试知识迁移至webapp-tester子代理；webapp-tester新增Grep/Glob/SearchCodebase工具支持自主定位bug；project_rules.md新增测试委托硬约束，主agent禁止直接执行Playwright操作 |
| v1.6.1 | 2026-06-28 | 神器/词条系统从经典模式迁移至笔划模式：game.js移除artifactChar/traitSlots/shieldActive/storeTrait/useTrait/renderTraitSlots（约200行）；strokes.js新增神器锻造+词条收集+护盾机制；index.html经典页面移除神器目标/词条槽UI，笔划页面新增对应UI |
| v1.7.0 | 2026-06-28 | 笔划模式v2独立文件 - 多层棋盘地牢探险架构：新增stroke-v2/目录(dungeon.js地牢管理器/房间配置/全局状态/碎片收集, board.js棋盘生成支持入口字, game.js游戏逻辑/合成/词条/锻造, main.js入口, index.html独立页面, css/style.css样式)；主城+外郭+宫殿+港口+市集5个房间，神器碎片收集与锻造通关 |
| v1.7.1 | 2026-06-28 | 修复笔划模式血条失效：HP血条(50点)改为生命系统(3条命❤❤❤)；左键翻部首格扣1命(原扣笔画数)；右键探测猜错扣1命(原无代价,导致可右键遍历全棋盘作弊)；合成成功回1命；词条heal/fullHeal/shield适配生命系统；更新UI与文案 |
| v1.7.2 | 2026-06-28 | 笔划模式v2同步生命系统：stroke-v2地牢探险HP(50点)改为3条命❤❤❤；左键翻部首格扣1命；合成回1命；词条heal/fullHeal/shield适配；移除HP百分比血条UI改为❤❤❤显示；生命跨房间共享 |
| v1.7.3 | 2026-06-28 | stroke-v2右键改为探测机制(与v1统一):右键隐藏格子→猜对(部首)免费收集不扣命,猜错(数字)扣1命并翻开；修复原右键插旗无法取消的bug(三元表达式恒为flagged)；右键已翻开数字格保留Chord；更新玩法说明文案 |
| v1.7.4 | 2026-06-28 | stroke-v2通关修复：①"郭"字加入HANZI_DB(享+阝此前无法合成,导致外郭入口字成幽灵目标)；②碎片房间生成棋盘时强制包含神器字部首(修复神器字所需罕见部首不在棋盘上导致碎片永远0/3的幽灵目标bug)；③状态栏提示优化:碎片房间显示"合成「字」收集碎片进度",主城未集齐时显示"前往外郭/宫殿/港口收集3片碎片后回此锻造" |
| v1.7.5 | 2026-06-28 | stroke-v2测试调试：生命值临时调为1000(maxHp>10时UI显示数字格式❤ 1000/1000,否则保持❤❤❤)便于通关测试 |
| v1.8.0 | 2026-06-28 | stroke-v2三大玩法升级：①笔划扣血机制(HP 3命→20点,左键翻部首扣笔画数1-8,右键探测猜错扣2命,合成回3命,reduceStroke减半,scoreMultiplier影响分数)；②词条系统全实现(9个缺失效果:eliminateRadical消除部首/reduceStroke笔画减半/xpBoost分数+30%/peekArea透视8格/energy翻3格/weakenAll全体笔画-1/resetCell重置格/revealRow翻行/revealArea标记部首 + 新增spread蔓延3次/peekStart照明翻3格 + 瞄准模式交互 + recalculateNumbers重算数字)；③新地图2房间(密林7x7词条房+矿洞8x8分数+50%) |
| v1.8.1 | 2026-06-28 | stroke-v2词条系统可发现性增强：①修复词条获取消息被合成消息覆盖的bug(storeTrait不再单独setStatus,由synthesize统一拼接)；②词条检测从else分支移出,所有合成都检测词条(入口字/神器字也能获得词条)；③新增14个字的词条(休/早/灯/让/抱/会/跑/闻/问/闭/树/权/想/保)，总共20个字有词条覆盖全部15种效果；④selectCharacters优先选择有词条的字,确保用户每次都能遇到；⑤HP临时调为1000便于测试 |
| v1.9.0 | 2026-06-28 | stroke-v2视觉改进+五行被动技能系统：①合成后字显示在格子上(left格显示完整汉字+right格虚线占位)；②五行属性分类(data.js新增getWuxing函数按部首判断金木水火土)；③五行被动技能实现(金十字翻开/木向中心延伸/水四周蔓延需火激活/火激活水/土随机落石)；④无五行属性字归为一次技能(保留现有trait系统)；⑤CSS样式(matched格子绿色高亮/consumed虚线/五行属性颜色边框)；⑥UI更新(info-bar显示五行状态/玩法说明更新) |
| v1.9.1 | 2026-06-28 | stroke-v2三项修正：①right格虚线显示原部首内容(原显示"··"或消失，改为存储consumedComp用line-through dashed样式显示部首文字)；②地点保持上方dungeon-map显示(不改为格子点击入口)；③五行被动技能占用技能栏位(原为永久独立状态，现与一次技能共享3槽位)，栏满时新技能进入pendingTrait待替换状态，点击任意槽位替换该槽技能(triggerWuxingEffects与updateUI改为从traitSlots读取五行状态) |
| v1.9.2 | 2026-06-28 | stroke-v2三项改进：①right格改为显示虚线合成后的完整汉字(原显示被消耗的部首，现left实心+right虚线显示同一个合成字，视觉统一)；②技能栏字体按类型/稀有度着色(五行被动用对应五行色金木水火土，一次技能按稀有度common灰/rare紫/epic金)；③获得新技能时总是进入pendingTrait待放置状态(用户点击空槽放入或点击占用槽替换，删除storeTraitOrReplace自动放入逻辑，useTrait区分"已放入"与"已替换"提示) |
| v1.9.3 | 2026-06-28 | stroke-v2点击合成汉字显示词条：handleCellClick新增matched/consumed状态处理，点击格子上的合成汉字触发showCharTraitInfo，状态栏显示该字的五行被动或词条信息(名称/类型/稀有度/描述)，无词条显示"无词条" |
| v1.9.4 | 2026-06-28 | stroke-v2词条收集机制重构：①合成后不再自动进入pendingTrait强制选择，改为提示"含技能点击收集"，用户可随时点击格子上的合成字收集；②点击未收集的合成字→进入pendingTrait待放置(记录sourceCell)，点击空槽放入/占用槽替换；③放置技能后标记源格子traitCollected=true，渲染时加.trait-collected类变虚(opacity 0.4+saturate 0.5)；④已收集的格子点击仅显示词条信息；⑤重构getCharTrait辅助方法统一五行/词条查找逻辑，synthesize复用之；⑥已拥有相同效果时自动标记已收集 |
| v1.9.5 | 2026-06-28 | stroke-v2修复旗子标记格无法翻开：handleCellClick新增flagged状态处理，点击revealRadicals标记的部首格(已在背包)直接翻开不扣血，点击revealArea标记的部首格(未收集)扣血翻开并加入背包，数字格标记保险翻开 |
| v1.9.6 | 2026-06-28 | stroke-v2水+火组合增强：原仅随机翻开周围1格，改为周围一圈8格全部翻开，描述更新为"周围一圈全翻(需火激活)" |
| v1.10.0 | 2026-06-28 | stroke-v2音效与动画系统：①新增sound.js音效系统(Web Audio API生成20+种音效：点击/翻开部首/翻开数字/探测成功/探测失败/合成成功/合成失败/消除/技能激活/技能使用/受伤/治疗/解锁房间/收集碎片/锻造神器/游戏结束/胜利/按钮点击/切换房间/护盾激活/五行触发/连击)；②CSS动画增强(格子翻开3D翻转/部首发现发光脉冲/合成成功光晕/消除破碎/技能激活魔法光环/技能使用光波/受伤红色闪烁震动/治疗绿色光晕/分数弹跳/房间解锁高亮/碎片收集旋转/锻造史诗光效/护盾脉冲/五行触发/连击显示/目标完成/背包添加/页面滑入/界面震动/浮动文字伤害治疗分数/粒子效果)；③game.js集成音效动画(所有关键交互点触发对应音效和动画：handleCellClick翻部首/翻数字/护盾抵挡/受伤/死亡，handleCellRightClick探测成功/失败，synthesize合成成功/失败/连击/解锁房间/收集碎片，useTrait技能激活/使用，applyTraitEffect治疗/护盾/消除，forgeArtifact锻造/胜利，triggerWuxingEffects五行触发)；④main.js按钮音效(菜单/游戏内/结算所有按钮点击音效) |
| v1.10.1 | 2026-07-04 | stroke-v2技能/词条系统13项Bug修复：①getCharTrait改为HANZI_DB词条优先(修复五行被动遮蔽8个一次技能：河/休/灯/尘/树/权/淡/炎，含河→蔓延不可达)；②eliminateRadical随机模式只选hidden格(原state!=='revealed'会选中matched/consumed格破坏合成记录)；③瞄准模式新增目标验证(eliminateRadical须hidden部首格/resetCell须已翻数字格，非法目标不消耗词条)；④右键取消瞄准模式+chord防御性检查(修复Chord误触发瞄准消耗词条)；⑤heal/xpBoost参数化value字段(疗回1血/休抱回2血,悟+20%/权+30%)；⑥星描述改为"翻3数字格"(无能量系统)；⑦peekStart(明)改为翻3个随机隐藏格含部首格(原只翻数字格)；⑧revealArea加入背包(与revealRadicals一致)；⑨selectBackpackItem防止重复选同一格；⑩pairCell双向链接防止一次性词条从consumed格重复收集；⑪清理dungeon.wuxing死代码 |
| v1.11.0 | 2026-07-04 | stroke-v2特效系统Canvas重构：①effects.js全面重写为Canvas+requestAnimationFrame粒子系统(Particle类支持glow/spark/ring/shard/plus/ringRect 6种粒子,EffectSystem单例管理rAF循环,additive blending发光叠加,粒子数0时自动停止零CPU空闲)；②9个特效发射器全部重绘(金·metalSlash十字光剑+爆闪+火花/木·woodExtend藤蔓光束+绿叶爆散/水·waterWave同心圆环+水滴飞溅/火·fireBurn火焰上升+火星/土·earthRockFall石头下落+尘云+震动/治疗·healEffect绿色十字+光环/护盾·shieldEffect多层光环+环绕粒子/透视·peekEffect扫描方框+扫描线/消除·eliminateEffect红色碎片+爆闪)；③时序修复(数字格分支playCellRevealAnim移至render后,eliminateRadical通过_pendingEliminateAnim标志延迟到render后执行,彻底消除"格子先翻开特效后出现"的滞后)；④style.css清理(移除.particle-container/.particle/@keyframes particleFly旧DOM粒子样式,新增#effectCanvas显式声明) |
| v1.12.0 | 2026-07-04 | 架构整合：stroke-v2成为主游戏"笔划模式"：①移除限时模式和收集模式(index.html/game.js/style.css清理time/challenge分支/方法/样式)；②移除v1笔划模式(删除js/strokes.js，清理index.html的pageStrokeGame/pageStrokeResult/strokeCelebration，清理css/style.css中v1笔划样式)；③整合stroke-v2为主菜单第三模式(js/main.js导入StrokeGame创建dungeonGame实例，index.html嵌入pageDungeon/pageDungeonResult页面，追加stroke-v2/css/style.css引用)；④统一showPage约定(stroke-v2/js/game.js的showPage从getElementById(page)改为getElementById(page${Name})，新增backToMenu方法)；⑤按钮onclick化(与主游戏一致使用HTML onclick属性，删除stroke-v2/js/main.js，按钮ID加dungeon前缀)；⑥统一浅色主题(stroke-v2/css/style.css删除全局声明:root/body/.page/#app，深色改浅色rgba(255,255,255,0.0x)→rgba(0,0,0,0.0x)，冲突样式作用域化到.dungeon-page/.dungeon-result-page下)；⑦howToPlayModal追加笔划模式说明 |
| v1.12.1 | 2026-07-04 | stroke-v2整合Bug修复：①修复js/main.js导入路径错误('./stroke-v2/js/game.js'→'../stroke-v2/js/game.js'，main.js位于js/目录需上一级，原路径导致game和dungeonGame未定义所有模式无法启动)；②修复playForgeAnim残留旧按钮ID(stroke-v2/js/game.js第162行btnForgeArtifact→dungeonBtnForge，导致锻造动画不播放) |
| v1.12.2 | 2026-07-04 | stroke-v2样式统一修复：①全面作用域化stroke-v2/css/style.css(所有选择器加.dungeon-page/.dungeon-result-page前缀，消除与主游戏冲突：.btn-back/.room-name/.sidebar/.backpack-item/.status-bar/.btn-forge/.btn-synthesize/.celebration-overlay/.floating-text/.combo-display/button:active/.page.slide-in等)；②格子对比度提升(隐藏格rgba(0,0,0,0.05)→实色渐变#b0bec5→#78909c与主游戏一致，数字格rgba(0,0,0,0.02)→white实色，部首格rgba(239,68,68,0.15)→红色渐变#fecaca→#fca5a5)；③信息栏边框修复(rgba(255,255,255,0.3)白色不可见→rgba(0,0,0,0.1)深色可见)；④棋盘容器加灰色渐变背景(与主游戏一致#cbd5e0→#a0aec0)；⑤数字格支持8色编码(number-1蓝~number-8绿)；⑥合成格/消耗格/选中格改用高对比度实色渐变 |
| v1.12.3 | 2026-07-04 | stroke-v2文字对比度修复：①信息栏文字加深(#6b7280→#374151标签/#111827数值)；②词条栏背景改白(淡紫色透明rgba(139,92,246,0.08)→白色var(--card-bg))；③词条槽背景改浅灰白(rgba(0,0,0,0.03)→#f9fafb)+文字加深(#6b7280→#374151)；④目标字列表加白色卡片背景(原透明透出紫色页面背景)+目标项背景改实色(#f3f4f6)+文字加深(#111827)；⑤状态栏文字加深(#111827)+字重600；⑥合成字matched-char加深(#14532d→#064e3b)+白色文字阴影；⑦消耗字consumed-char改深灰(rgba(16,185,129,0.5)→#6b7280)；⑧部首笔划radical-strokes改实色(#7f1d1d)；⑨侧边栏标题/地图名称/背包笔划/已合成详情等次要文字全面加深 |
| v1.12.4 | 2026-07-05 | 笔划模式五行词条均衡分布：①重构selectCharacters(stroke-v2/js/board.js)按五行数量升序优先补充最少五行，优先选择带trait的字；②HANZI_DB补充40个五行属性字(20金:铁铜银钢钟锐错锋铸镇锦镜锻链钥锅钦锡钧铂 / 10火:灿炒烤烧烟烦炼煌煤燃 / 10土:地场坡块塘墙填增培坚)，解决原metal=0/fire=3/earth=1严重失衡；③新增trait字：锐(锐利-削弱)/锻(锻造-减笔)/烧(烈焰-减笔)/培(培育-治愈)/坚(坚壁-护盾)；④测试验证5字棋盘完美1:1:1:1:1分布(极差=0)，6/8字棋盘极差≤1 |
| v1.12.5 | 2026-07-05 | 笔划模式4项问题修复：①pendingTrait跨房间泄漏bug修复(stroke-v2/js/game.js的enterRoom方法新增清空pendingTrait和targetingMode，避免房间A激活技能后切换到房间B槽位仍显示替换高亮且sourceCell悬空引用旧房间格子)；②删除9个difficulty:9罕见字(js/data.js移除龉龊龌齉靉靆灪灩驧，含笔画错误的"灩"字right='豐'实际17画但getStrokeCount返回默认5画，HANZI_DB总数303→294)；③跨房间已用字去重(DungeonManager新增usedChars Set和getUsedChars/addUsedChars方法，selectCharacters/tryGenerateStrokeBoard/generateStrokeBoard接收excludeChars参数，enterRoom生成棋盘时传入已用字排除列表并记录本房间已用字，入口字允许跨房间重复，排除后无法生成时自动逐步放宽限制)；④src/data/hanzi-db.ts顶部添加注释说明与js/data.js的关系(运行时主数据源vs TS算法验证测试夹具，非冗余) |
| v1.12.6 | 2026-07-05 | 五行被动技能遮蔽修复：移除5个五行属性字的显式trait(锐/锻→金·十字，烧→火·激活，培/坚→土·落石)，因getCharTrait方法优先返回HANZI_DB显式trait导致五行被动被遮蔽，用户合成这些字后无法触发对应的五行被动技能(土·落石不显示、水火组合无法触发)。修复后所有五行属性字统一回归五行被动技能，测试验证土·落石随机翻开1格、水火组合翻开周围一圈、金·十字十字翻开均正常触发，只有水没有火时不触发(符合设计意图) |
| v1.12.7 | 2026-07-05 | 五行技能平衡调整：①木·延伸从向中心翻1格改为向中心方向连续翻3格(stroke-v2/js/game.js triggerWuxingEffects方法木分支改为for循环step 1-3)；②土·落石从随机翻1格改为随机翻3格(土分支改为for循环3次从hidden数组随机抽取并移除已选项避免重复)；③更新getCharTrait中木和土的技能描述(木:'向中心方向翻3格'，土:'随机翻开3格')；④金·十字保持4格、水火组合保持8格不变；⑤测试验证木翻3格、土翻3格、金十字4格、水火8格均正常触发 |
| v1.13.0 | 2026-07-05 | 项目目录与文档整合：①合并stroke-v2/css/style.css到css/style.css(追加779行笔划模式样式到末尾，消除跨目录引用)；②删除废弃stroke-v2/index.html及空stroke-v2/目录；③重组docs/目录结构(创建design/test-reports/proposal三个子目录，移动8个文档并统一中文命名，删除空draft/和v2/目录)；④更新CHANGELOG标题v1.5.0→v1.13.0 |
| v1.13.1 | 2026-07-05 | 文档更新：①重写docs/design/笔划扫雷.md设计文档(从早期单棋盘概念全面更新为当前地牢探险模式实际规则，含7房间系统/神器碎片/五行技能/15种词条/合成流程/血量系统等10章节)；②更新docs/CHANGELOG.md过时章节(当前版本特性改为v1.13.0三大模式特性，游戏模式移除限时/收集模式新增笔划模式，项目结构更新为js/stroke/+docs/design/等当前结构，代码结构更新为v1.13.0模块列表) |
| v1.13.2 | 2026-07-05 | 撰写初赛Demo作品帖(docs/proposal/初赛Demo作品帖.md)，按官方参赛指南模板包含4部分：Demo简介(3种模式介绍)/创作思路/体验地址(打包HTML上传)/TRAE实践过程(7个开发阶段，预留Session ID和截图占位符) |
| v1.13.3 | 2026-07-05 | 单文件打包版：①新增standalone.html(11269行，400KB)，将12个ES模块+css/style.css全部内联到单个HTML文件中，解决file://协议下ES Module无法加载的问题，实现"双击即玩"；②重命名笔划模式4个冲突标识符(stroke/sound.js的SoundSystem→StrokeSoundSystem，stroke/board.js的selectCharacters→selectStrokeCharacters/createRadicalEntries→createStrokeRadicalEntries/matchComponents→matchStrokeComponents，同步更新stroke/game.js的matchComponents调用为matchStrokeComponents)；③更新初赛Demo作品帖体验地址为双击standalone.html；④原index.html和js/源文件保持不变，保留模块化开发流程(npm start启动开发服务器加载index.html) |

---

### 当前版本特性（v1.13.0）

#### 三大游戏模式

##### 经典模式
- 传统扫雷 + 组字，3 条命（困难 2 命）
- 三种难度：简单(6×6/3字) / 中等(8×8/5字) / 困难(10×10/8字)
- 右键探测：部首格免费插旗，数字格消耗 5 能量
- Chord 操作：右键数字格周围旗帜数=数字时翻开邻居
- 能量技能：透视/提示/回血/连锁/消除
- 连击奖励：3连闪白+10分 / 5连翻2格+30分 / 8连高亮+50分 / 10连自动完成

##### 无尽模式
- 波次递增 roguelike，每波字数递增（上限 12 字）
- 每波开始回 2 命，波次间选 buff
- 11 个 buff 按稀有度分布（common/rare/epic/legendary）
- 每 3 波首选项强制为 epic/legendary

##### 笔划模式（地牢探险）
- 多层地牢探险，7 个房间（主城+6 个探索房）
- HP 血量系统（设计 20 点），翻部首扣笔画数，合成回 3 点
- 神器碎片收集：3 片碎片散落外郭/宫殿/港口，集齐回主城锻造通关
- 五行被动技能：金十字4格/木向心3格/水火组合8格/土随机3格
- 15 种一次技能词条 + 3 槽位技能栏 + 瞄准模式
- 跨房间字去重，入口字解锁房间
- Canvas 粒子特效 + Web Audio API 音效系统

### 游戏模式
- **经典模式**：传统扫雷 + 组字，3 条命，3 种难度
- **无尽模式**：波次递增，roguelike buff 系统
- **笔划模式**：多层地牢探险，神器碎片收集与锻造通关

### 核心玩法
- 扫雷阶段：左键翻开格子，右键插旗探测
- 组字阶段：选择两个部首组合成汉字
- 连锁反应：组字成功自动翻开周围格子

### 代码结构（v1.13.0）
- **模块化拆分**：ES Modules 模块化结构
- **模块划分**：
  - `css/style.css`：样式文件（主游戏 + 笔划模式样式合并）
  - `js/main.js`：入口文件（实例化 HanziSweeperGame + StrokeGame）
  - `js/game.js`：经典/无尽模式主类（HanziSweeperGame）
  - `js/data.js`：汉字数据库（HANZI_DB 294字 + 五行 + 神器池）
  - `js/config.js`：难度常量（DIFFICULTY）
  - `js/board.js`：经典模式棋盘生成
  - `js/systems.js`：音效/存储/Collection 系统
  - `js/decomposition.js`：拆字反向查找表（3265 个部首组合）
  - `js/stroke/game.js`：笔划模式主类（StrokeGame）
  - `js/stroke/dungeon.js`：地牢管理器 + 房间配置
  - `js/stroke/board.js`：笔划棋盘生成 + STROKE_MAP
  - `js/stroke/effects.js`：Canvas 粒子特效系统
  - `js/stroke/sound.js`：Web Audio API 音效系统

### v1.4 Bug 修复
- **修复组字卡关**：`matchComponents` 原允许组合 HANZI_DB 中任意汉字，玩家误组非目标汉字（如"们"）会消耗目标汉字所需的部首导致卡关。新增 `matchTargetComponents` 方法，仅允许组合目标列表中的汉字，误组时提示并清除选择

### v1.2 新增特性

#### Chord 操作
- 右键已翻开数字格 → 周围旗帜数=数字时自动翻开所有未标记邻居
- 踩到部首扣1血

#### 部首共鸣
- 组字阶段选中第一个部首后，可配对的部首发出绿色脉冲光波
- 只有一个可配对目标时自动组合

#### 连击奖励阶梯
| 连击 | 奖励 |
|------|------|
| 3连击 | 屏幕闪白 + 额外10分 |
| 5连击 | 额外30分 + 随机翻开2格 |
| 8连击 | 额外50分 + 全屏部首高亮3秒 |
| 10连击 | 自动完成本波剩余所有组字 |

#### Buff 卡牌系统（纯增益 + 稀有度）
| 稀有度 | Buff |
|--------|------|
| 普通（白） | 小天眼、分数×2、生命+1、能量+50 |
| 稀有（蓝） | 天眼通、分数狂热×3、幸运星、满血回复 |
| 史诗（紫） | 全知之眼、连击永动、连锁大师 |
| 传说（金） | 一键通关 |

#### 右键探测机制
- 猜对（是部首）→ 免费插旗 + 显示部首
- 猜错（不是部首）→ 消耗5能量 + 插旗
- 能量不足 → 无法探测

---

## 项目结构

```
HanziSweeper/
├── index.html              # 入口 HTML（引用外部 CSS/JS 模块）
├── css/
│   └── style.css           # 样式文件（主游戏 + 笔划模式样式）
├── js/
│   ├── main.js             # 入口文件（实例化 HanziSweeperGame + StrokeGame）
│   ├── game.js             # 经典/无尽模式主类（HanziSweeperGame）
│   ├── data.js             # 汉字数据库（HANZI_DB 294字 + 五行 + 神器池）
│   ├── config.js           # 难度常量（DIFFICULTY）
│   ├── board.js            # 经典模式棋盘生成
│   ├── systems.js          # 音效/存储/Collection 系统
│   ├── decomposition.js    # 拆字反向查找表（3265 个部首组合）
│   └── stroke/             # 笔划模式（地牢探险）模块
│       ├── game.js         # StrokeGame 主类
│       ├── dungeon.js      # DungeonManager + DUNGEON_MAP 房间配置
│       ├── board.js        # 笔划棋盘生成 + STROKE_MAP
│       ├── effects.js      # Canvas 粒子特效系统
│       └── sound.js        # Web Audio API 音效系统
├── docs/
│   ├── CHANGELOG.md        # 版本历史（本文件）
│   ├── design/             # 设计文档
│   │   ├── 01-游戏调研报告.md
│   │   ├── 02-核心玩法设计文档.md
│   │   ├── 03-核心算法验证报告.md
│   │   └── 笔划扫雷.md
│   ├── test-reports/       # 测试报告
│   └── proposal/           # 创意提案
├── src/                    # TypeScript 算法验证脚本（独立于运行时）
│   ├── core/
│   ├── data/
│   └── validate.ts
├── tools/                  # 数据处理脚本
├── data/                   # 拆字原始数据
├── .trae/                  # Trae IDE 配置
├── package.json
└── tsconfig.json
```

---

## 技术栈

- **前端**：HTML + CSS + JavaScript（ES Modules 模块化）
- **测试**：Playwright MCP 自动化测试
- **汉字库**：300+汉字含难度分级（一年级到大学），拆字库 3265 个部首组合
- **数据来源**：kfcd/chaizi 开源拆字数据（CC BY 3.0）

---
