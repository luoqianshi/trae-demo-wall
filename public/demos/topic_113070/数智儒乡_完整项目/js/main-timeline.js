const timelineData = [
  { year: '公元前551年', age: '出生', title: '尼山降圣', content: '孔子名丘，字仲尼，出生于鲁国陬邑昌平乡（今山东曲阜市东南尼山镇附近）。其父叔梁纥为鲁国武士，母亲颜征在。相传孔子出生时尼山现瑞，故以丘为名。' },
  { year: '公元前545年', age: '七岁', title: '年少好礼', content: '孔子三岁丧父，家境贫寒。少年时便喜欢陈列俎豆等礼器，模仿祭祀礼仪，常以俎豆为戏。鲁人说："年少好礼，孰能过焉。"少年时做过委吏（管理仓库）、乘田（管理畜牧），每件事都认真负责。' },
  { year: '公元前536年', age: '十五岁', title: '志于学', content: '孔子十五岁立志向学，开始系统地学习礼、乐、射、御、书、数六艺。这是他一生的转折点，确定了以学问修身济世的志向。' },
  { year: '公元前522年', age: '三十岁', title: '三十而立', content: '孔子三十岁时学问已有所成，开始收徒讲学，创立私学。他主张"有教无类"，打破贵族教育垄断，使平民子弟也能接受教育。' },
  { year: '公元前517年', age: '三十五岁', title: '避乱适齐', content: '鲁国发生内乱，孔子离开鲁国前往齐国，希望得到齐景公的重用。齐景公曾问政于孔子，孔子提出"君君、臣臣、父父、子子"的主张。' },
  { year: '公元前501年', age: '五十一岁', title: '出仕鲁国', content: '孔子任鲁国中都宰，治理中都一年，政绩显著，四方皆则之。后升任司空、大司寇，摄相事。' },
  { year: '公元前498年', age: '五十四岁', title: '堕三都', content: '孔子为加强鲁君权力，主张拆除季孙氏、叔孙氏、孟孙氏三家大夫的都城。此举触犯了三桓利益，最终未能完全成功。' },
  { year: '公元前497年', age: '五十五岁', title: '周游列国', content: '孔子离开鲁国，开始了长达十四年的周游列国之旅。先后到过卫、曹、宋、郑、陈、蔡、楚等国，希望推行自己的政治主张。' },
  { year: '公元前493年', age: '五十九岁', title: '厄于陈蔡', content: '孔子在陈、蔡之间遭遇困厄，断粮数日，弟子们面有饥色。但孔子依然讲诵弦歌不衰，展现了君子固穷的精神。' },
  { year: '公元前484年', age: '六十八岁', title: '返回鲁国', content: '孔子在弟子冉有的帮助下，终于回到鲁国。鲁哀公和季康子虽尊其为"国老"，但并未真正重用。' },
  { year: '公元前481年', age: '七十一岁', title: '西狩获麟', content: '鲁人在西郊打猎捕获麒麟，孔子认为这是不祥之兆，感叹"吾道穷矣"，停止了《春秋》的编纂。' },
  { year: '公元前479年', age: '七十三岁', title: '泰山其颓', content: '孔子病逝于鲁国，享年七十三岁。弟子们为其服丧三年，子贡守墓六年。孔子葬于鲁城北泗上，弟子及鲁人从冢而家者百余户。' }
];

function renderTimeline() {
  const timeline = document.getElementById('timeline');
  if (!timeline) return;
  
  timelineData.forEach((item, index) => {
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    
    timelineItem.innerHTML = `
      <div class="timeline-card">
        <div>
          <span class="timeline-year">${item.year}</span>
          <span class="timeline-age">${item.age}</span>
        </div>
        <h3 class="timeline-title">${item.title}</h3>
        <p class="timeline-content">${item.content}</p>
      </div>
    `;
    
    timeline.appendChild(timelineItem);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderTimeline();
});