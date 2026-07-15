// knowledge.js - 科普中心数据(内联版)

const Knowledge = (() => {
  const data = {
    shichen_knowledge: {
      title: '十二时辰与更鼓制度',
      summary: '古人将一昼夜分为十二时辰,各以地支命名。每时辰又分为初、正两部分,合二十四小时,精确对应现代计时。',
      items: [
        { name: '子时', alias: '夜半', time: '23:00-01:00', poem: '夜半钟声到客船' },
        { name: '丑时', alias: '鸡鸣', time: '01:00-03:00', poem: '鸡鸣茅店月' },
        { name: '寅时', alias: '平旦', time: '03:00-05:00', poem: '平旦驱驷马' },
        { name: '卯时', alias: '日出', time: '05:00-07:00', poem: '日出而作' },
        { name: '辰时', alias: '食时', time: '07:00-09:00', poem: '朝食有麦饘' },
        { name: '巳时', alias: '隅中', time: '09:00-11:00', poem: '至于衡阳' },
        { name: '午时', alias: '日中', time: '11:00-13:00', poem: '日中则昃' },
        { name: '未时', alias: '日昳', time: '13:00-15:00', poem: '日昳之离' },
        { name: '申时', alias: '哺时', time: '15:00-17:00', poem: '哺时而还' },
        { name: '酉时', alias: '日入', time: '17:00-19:00', poem: '日入而息' },
        { name: '戌时', alias: '黄昏', time: '19:00-21:00', poem: '黄昏独倚门' },
        { name: '亥时', alias: '人定', time: '21:00-23:00', poem: '人定月胧明' }
      ],
      genggu: '清代宫中设更夫五轮巡更:起更(19-21点)、二更(21-23点)、三更(23-1点)、四更(1-3点)、五更(3-5点)。每更以击梆为号,起更一梆,二更二梆,以次递加,五更五梆,合十二时辰制。乾清门、坤宁门外各设更鼓,以传宵禁时刻。'
    },
    qingshilu: [
      { title: '康熙起居注节选', content: '康熙二十一年十一月初四日,寅时,上御乾清门听政,部院各衙门奏事毕,上回宫,御书房进膳,未时复出理政,申时召翰林院侍读学士张英等入内廷讲论经史,至酉时方退。' },
      { title: '雍正朱批节选', content: '雍正三年六月十九日,览湖广总督杨宗仁奏,朱批云:朕之勤政爱民,实为天下臣民所共见。尔等封疆大吏,当以实心行实政,不可徒尚虚文。' },
      { title: '乾隆实录节选', content: '乾隆十三年二月初八日,上以春雨应时,亲诣黑龙潭祈雨。回銮后,御勤政殿听政,披阅奏折六十余件,直至戌时方休。' },
      { title: '清宫起居注体例', content: '起居注,专记帝之一言一行、饮食起居、临朝理政、召见臣工、批阅奏折、后宫生活,逐日记录,无有遗漏。其制始于汉,完备于清康熙朝。' }
    ],
    emperors: [
      { name: '康熙帝', temple: '圣祖', period: '1661-1722', wakeTime: '寅正三刻', sleepTime: '亥初',
        feature: '勤于政事,日御门听政,日讲经史,纵览经典。春夏秋冬,少有懈怠。',
        achievement: '削三藩、收台湾、平准噶尔、治河通漕,开康乾盛世之基。' },
      { name: '雍正帝', temple: '世宗', period: '1722-1735', wakeTime: '寅时一刻', sleepTime: '子初',
        feature: '以勤政著称,自诩以勤先天下。在位十三年,批阅奏折逾二十万件,常批至深夜。',
        achievement: '整顿吏治、摊丁入亩、火耗归公、改土归流,为乾隆盛世奠基。' },
      { name: '乾隆帝', temple: '高宗', period: '1735-1796', wakeTime: '卯初', sleepTime: '亥正',
        feature: '前期勤政,后期倦勤。六下江南,自号十全老人,文治武功兼隆。',
        achievement: '平定准部、回部,编四库全书,国势臻于极盛。' }
    ],
    court_knowledge: [
      { title: '御门听政', content: '清代皇帝于乾清门(后改御门)听政之制,康熙朝最为勤恪,日日御门,雍正朝改于养心殿批阅本章,乾清门听政遂成虚典。' },
      { title: '朱批奏折', content: '奏折经皇帝亲笔批示,称朱批,以红墨(殊砂)书写。雍正帝朱批常逾千言,字斟句酌,字字心血。' },
      { title: '军机处', content: '雍正七年设军机处,承旨出政,总汇军国大计。其大臣每日入值,听候皇帝差遣,君臣一体。' },
      { title: '养心殿', content: '雍正以后,清帝日常理政之所。殿内设勤政亲贤匾,御案北向,批阅奏折于此。养心殿东暖阁为召见臣工之地。' }
    ]
  };

  function load() { return Promise.resolve(data); }

  function render(containerId) {
    const wrap = document.getElementById(containerId || 'knowledge-content');
    if (!wrap) return;
    wrap.innerHTML =
      '<section class="mb-8">' +
        '<h2 class="font-kai text-2xl text-amber-100 mb-4 flex items-center gap-2"><span>🕐</span><span>十二时辰与更鼓制度</span></h2>' +
        '<div class="bg-amber-50/5 border border-amber-300/30 rounded-lg p-4 mb-4"><p class="text-amber-100/80 text-sm leading-relaxed font-kai">' + data.shichen_knowledge.summary + '</p></div>' +
        '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">' +
          data.shichen_knowledge.items.map(s =>
            '<div class="bg-gradient-to-br from-amber-50/10 to-amber-900/20 border border-amber-300/30 rounded-lg p-3">' +
              '<div class="flex items-baseline justify-between mb-1"><span class="font-kai text-amber-200 text-lg">' + s.name + '</span><span class="text-amber-200/60 text-xs">' + s.alias + '</span></div>' +
              '<div class="text-xs text-amber-100/70 font-mono mb-1">' + s.time + '</div>' +
              '<div class="text-xs text-amber-200/50 italic">' + s.poem + '</div>' +
            '</div>'
          ).join('') +
        '</div>' +
        '<div class="bg-amber-900/30 border border-amber-600/40 rounded-lg p-4"><h3 class="font-kai text-amber-200 text-base mb-2">🎴 更鼓制度</h3><p class="text-amber-100/80 text-sm leading-relaxed font-kai">' + data.shichen_knowledge.genggu + '</p></div>' +
      '</section>' +
      '<section class="mb-8">' +
        '<h2 class="font-kai text-2xl text-amber-100 mb-4 flex items-center gap-2"><span>📜</span><span>《清实录》《起居注》节选</span></h2>' +
        '<div class="space-y-3">' +
          data.qingshilu.map(q =>
            '<div class="bg-amber-50/5 border-l-4 border-amber-500 p-4 rounded">' +
              '<h3 class="font-kai text-amber-200 text-base mb-2">' + q.title + '</h3>' +
              '<p class="text-amber-100/80 text-sm leading-loose font-kai whitespace-pre-line">' + q.content + '</p>' +
            '</div>'
          ).join('') +
        '</div>' +
      '</section>' +
      '<section class="mb-8">' +
        '<h2 class="font-kai text-2xl text-amber-100 mb-4 flex items-center gap-2"><span>👑</span><span>康雍乾三代帝王作息对比</span></h2>' +
        '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">' +
          data.emperors.map(e =>
            '<div class="bg-gradient-to-b from-amber-50/10 to-amber-900/30 border border-amber-300/30 rounded-lg p-4">' +
              '<div class="text-center mb-3">' +
                '<div class="text-3xl mb-1">' + (e.name.includes('康熙') ? '🐲' : e.name.includes('雍正') ? '🐉' : '🦚') + '</div>' +
                '<div class="font-kai text-xl text-amber-100">' + e.name + '</div>' +
                '<div class="text-xs text-amber-200/60">' + e.temple + ' · ' + e.period + '</div>' +
              '</div>' +
              '<div class="space-y-2 text-xs">' +
                '<div class="flex justify-between"><span class="text-amber-200/70">起床</span><span class="text-amber-100 font-kai">' + e.wakeTime + '</span></div>' +
                '<div class="flex justify-between"><span class="text-amber-200/70">就寝</span><span class="text-amber-100 font-kai">' + e.sleepTime + '</span></div>' +
                '<div class="mt-2 pt-2 border-t border-amber-700/30"><p class="text-amber-100/80 font-kai leading-relaxed">' + e.feature + '</p></div>' +
                '<div class="mt-2 pt-2 border-t border-amber-700/30"><p class="text-amber-200/60 text-[10px]">主要功绩</p><p class="text-amber-100/80 text-xs font-kai leading-relaxed">' + e.achievement + '</p></div>' +
              '</div>' +
            '</div>'
          ).join('') +
        '</div>' +
      '</section>' +
      '<section class="mb-8">' +
        '<h2 class="font-kai text-2xl text-amber-100 mb-4 flex items-center gap-2"><span>🏯</span><span>宫廷常识小百科</span></h2>' +
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-3">' +
          data.court_knowledge.map(c =>
            '<div class="bg-amber-50/5 border border-amber-300/30 rounded-lg p-4">' +
              '<h3 class="font-kai text-amber-200 text-base mb-2">' + c.title + '</h3>' +
              '<p class="text-amber-100/80 text-sm leading-relaxed font-kai">' + c.content + '</p>' +
            '</div>'
          ).join('') +
        '</div>' +
      '</section>';
  }

  return { load, render };
})();
