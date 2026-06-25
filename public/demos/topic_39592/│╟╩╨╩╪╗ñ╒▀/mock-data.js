/* ============================================================
   城市守护者 · Mock 数据
   包含：工单示例数据、示例图片（内嵌 SVG base64）、地理位置
   ============================================================ */

(function () {
  /**
   * 把一段 SVG 转成可在 <img src> 中直接使用的 Data URL
   * 使用 SVG 生成占位图，避免依赖外部图片服务，确保本地即可演示。
   */
  function svgToDataUrl(svg) {
    // encodeURIComponent 可以处理 UTF-8，且比 base64 更短、更清晰
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ---------------- 示例图片 ---------------- */
  const IMG_PARKING_BEFORE = svgToDataUrl(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>
  <defs>
    <linearGradient id='skyP' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#CFE8FF'/>
      <stop offset='1' stop-color='#7FB5E8'/>
    </linearGradient>
    <linearGradient id='roadP' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#555F6E'/>
      <stop offset='1' stop-color='#2E3742'/>
    </linearGradient>
  </defs>
  <rect width='800' height='260' fill='url(#skyP)'/>
  <rect y='260' width='800' height='240' fill='url(#roadP)'/>
  <g opacity='0.85'>
    <rect x='0' y='258' width='800' height='4' fill='#F4C430'/>
  </g>
  <!-- 建筑 -->
  <g opacity='0.9'>
    <rect x='40' y='140' width='120' height='130' fill='#A5B4C5' rx='4'/>
    <rect x='180' y='100' width='160' height='170' fill='#8CA1B8' rx='4'/>
    <rect x='360' y='160' width='100' height='110' fill='#9DB0C4' rx='4'/>
    <rect x='480' y='120' width='140' height='150' fill='#93A6BC' rx='4'/>
    <rect x='640' y='150' width='120' height='120' fill='#A5B4C5' rx='4'/>
    <g fill='#FFF4C4' opacity='0.75'>
      <rect x='60' y='160' width='16' height='18'/><rect x='90' y='160' width='16' height='18'/>
      <rect x='60' y='190' width='16' height='18'/><rect x='90' y='190' width='16' height='18'/>
      <rect x='200' y='120' width='20' height='22'/><rect x='235' y='120' width='20' height='22'/>
      <rect x='270' y='120' width='20' height='22'/><rect x='305' y='120' width='20' height='22'/>
      <rect x='200' y='160' width='20' height='22'/><rect x='235' y='160' width='20' height='22'/>
      <rect x='500' y='140' width='18' height='20'/><rect x='535' y='140' width='18' height='20'/>
      <rect x='570' y='140' width='18' height='20'/><rect x='500' y='175' width='18' height='20'/>
    </g>
  </g>
  <!-- 人行道 -->
  <rect y='252' width='800' height='14' fill='#D8DCDF'/>
  <!-- 违停车辆 -->
  <g>
    <!-- 车牌反光 -->
    <rect x='130' y='295' width='220' height='100' rx='14' fill='#1F7CE5'/>
    <rect x='130' y='330' width='220' height='40' fill='#0D47A1' opacity='0.6'/>
    <rect x='200' y='290' width='70' height='24' rx='4' fill='#7DD3FC' opacity='0.7'/>
    <!-- 车窗 -->
    <rect x='160' y='300' width='160' height='32' rx='6' fill='#B7D6F2' opacity='0.85'/>
    <!-- 车牌 -->
    <rect x='210' y='360' width='60' height='22' rx='2' fill='#1E40AF'/>
    <text x='240' y='376' text-anchor='middle' font-family='Arial' font-size='14' font-weight='bold' fill='#FFFFFF'>浙A·88888</text>
    <!-- 车轮 -->
    <circle cx='160' cy='400' r='18' fill='#0F172A'/>
    <circle cx='320' cy='400' r='18' fill='#0F172A'/>
    <circle cx='160' cy='400' r='8' fill='#475569'/>
    <circle cx='320' cy='400' r='8' fill='#475569'/>
  </g>
  <!-- 第二辆车 -->
  <g opacity='0.95'>
    <rect x='430' y='305' width='190' height='90' rx='14' fill='#E11D48'/>
    <rect x='455' y='312' width='140' height='28' rx='6' fill='#B7D6F2' opacity='0.85'/>
    <rect x='500' y='368' width='50' height='18' rx='2' fill='#1E40AF'/>
    <text x='525' y='381' text-anchor='middle' font-family='Arial' font-size='12' font-weight='bold' fill='#FFFFFF'>浙A·66B89</text>
    <circle cx='465' cy='400' r='16' fill='#0F172A'/>
    <circle cx='590' cy='400' r='16' fill='#0F172A'/>
  </g>
  <!-- 禁停标志 -->
  <g transform='translate(660,260)'>
    <circle r='24' fill='#DC2626' stroke='#FFFFFF' stroke-width='3'/>
    <rect x='-14' y='-3' width='28' height='6' fill='#FFFFFF' rx='2' transform='rotate(25)'/>
    <text y='50' text-anchor='middle' font-family='Arial' font-size='12' font-weight='bold' fill='#DC2626'>禁停区</text>
  </g>
  <!-- 标签 -->
  <g>
    <rect x='30' y='30' width='180' height='40' rx='20' fill='#ffffff' opacity='0.92'/>
    <circle cx='52' cy='50' r='8' fill='#DC2626'/>
    <text x='68' y='54' font-family='Microsoft YaHei' font-size='16' font-weight='bold' fill='#0F172A'>市民随手拍 · 违停</text>
  </g>
</svg>`);

  const IMG_PARKING_AFTER = svgToDataUrl(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>
  <defs>
    <linearGradient id='skyA' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#EAF8F5'/>
      <stop offset='1' stop-color='#A8DCD0'/>
    </linearGradient>
    <linearGradient id='roadA' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#5D6A7B'/>
      <stop offset='1' stop-color='#38424F'/>
    </linearGradient>
  </defs>
  <rect width='800' height='260' fill='url(#skyA)'/>
  <rect y='260' width='800' height='240' fill='url(#roadA)'/>
  <rect x='0' y='258' width='800' height='4' fill='#F4C430'/>
  <g opacity='0.9'>
    <rect x='40' y='140' width='120' height='130' fill='#A5B4C5' rx='4'/>
    <rect x='180' y='100' width='160' height='170' fill='#8CA1B8' rx='4'/>
    <rect x='360' y='160' width='100' height='110' fill='#9DB0C4' rx='4'/>
    <rect x='480' y='120' width='140' height='150' fill='#93A6BC' rx='4'/>
    <rect x='640' y='150' width='120' height='120' fill='#A5B4C5' rx='4'/>
    <g fill='#FFF4C4' opacity='0.75'>
      <rect x='60' y='160' width='16' height='18'/><rect x='90' y='160' width='16' height='18'/>
      <rect x='60' y='190' width='16' height='18'/><rect x='90' y='190' width='16' height='18'/>
    </g>
  </g>
  <rect y='252' width='800' height='14' fill='#D8DCDF'/>
  <!-- 空荡荡的路面 -->
  <g opacity='0.6'>
    <circle cx='240' cy='380' r='3' fill='#94A3B8'/>
    <circle cx='420' cy='410' r='3' fill='#94A3B8'/>
    <circle cx='600' cy='380' r='3' fill='#94A3B8'/>
  </g>
  <!-- 交警铁骑水印 -->
  <g transform='translate(620,290)' opacity='0.85'>
    <rect width='140' height='28' rx='14' fill='#1F7CE5'/>
    <text x='70' y='18' text-anchor='middle' font-family='Microsoft YaHei' font-size='14' font-weight='bold' fill='#FFFFFF'>交警已处理 ✓</text>
  </g>
  <!-- 大树绿化 -->
  <g opacity='0.9'>
    <rect x='80' y='230' width='8' height='28' fill='#78350F'/>
    <circle cx='84' cy='220' r='22' fill='#13988A'/>
    <rect x='520' y='225' width='8' height='30' fill='#78350F'/>
    <circle cx='524' cy='215' r='26' fill='#26A69A'/>
  </g>
  <!-- 标签 -->
  <g>
    <rect x='30' y='30' width='200' height='40' rx='20' fill='#ffffff' opacity='0.95'/>
    <circle cx='52' cy='50' r='8' fill='#13988A'/>
    <text x='68' y='54' font-family='Microsoft YaHei' font-size='16' font-weight='bold' fill='#0F172A'>处理完成 · 道路畅通</text>
  </g>
</svg>`);

  const IMG_TRASH_BEFORE = svgToDataUrl(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>
  <defs>
    <linearGradient id='skyT' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#FEF3C7'/>
      <stop offset='1' stop-color='#FBBF24'/>
    </linearGradient>
    <linearGradient id='gndT' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#78716C'/>
      <stop offset='1' stop-color='#44403C'/>
    </linearGradient>
  </defs>
  <rect width='800' height='220' fill='url(#skyT)'/>
  <rect y='220' width='800' height='280' fill='url(#gndT)'/>
  <!-- 后景 -->
  <g opacity='0.85'>
    <rect x='30' y='140' width='140' height='90' fill='#A8A29E' rx='4'/>
    <rect x='200' y='120' width='200' height='110' fill='#8C857F' rx='4'/>
    <rect x='430' y='150' width='120' height='80' fill='#A8A29E' rx='4'/>
    <rect x='580' y='110' width='180' height='120' fill='#78716C' rx='4'/>
  </g>
  <!-- 乱堆垃圾 -->
  <g>
    <ellipse cx='200' cy='380' rx='140' ry='30' fill='#1F2937' opacity='0.35'/>
    <rect x='110' y='330' width='80' height='60' rx='4' fill='#64748B' transform='rotate(-8 150 360)'/>
    <rect x='175' y='310' width='90' height='70' rx='6' fill='#475569'/>
    <rect x='250' y='335' width='70' height='55' rx='4' fill='#64748B' transform='rotate(10 285 362)'/>
    <circle cx='130' cy='390' r='16' fill='#334155'/>
    <circle cx='300' cy='390' r='14' fill='#334155'/>
    <!-- 塑料袋 -->
    <path d='M160,320 Q190,280 210,320 Q200,340 180,345 Q155,345 160,320 Z' fill='#A7F3D0' opacity='0.85'/>
    <!-- 纸屑 -->
    <rect x='90' y='380' width='40' height='8' fill='#F3F4F6' transform='rotate(-15 110 384)'/>
    <rect x='320' y='385' width='50' height='8' fill='#E5E7EB' transform='rotate(12 345 389)'/>
  </g>
  <g>
    <ellipse cx='540' cy='395' rx='120' ry='28' fill='#1F2937' opacity='0.35'/>
    <rect x='460' y='340' width='120' height='70' rx='6' fill='#1F2937'/>
    <rect x='470' y='315' width='100' height='30' rx='4' fill='#334155'/>
    <circle cx='470' cy='400' r='12' fill='#1F2937'/>
    <circle cx='610' cy='405' r='14' fill='#1F2937'/>
    <path d='M490,360 Q510,330 540,360 Q530,380 510,380 Q485,380 490,360 Z' fill='#FDBA74' opacity='0.9'/>
  </g>
  <!-- 警告 -->
  <g transform='translate(400,60)'>
    <polygon points='-40,28 40,28 0,-30' fill='#DC2626' stroke='#FFFFFF' stroke-width='4'/>
    <text y='15' text-anchor='middle' font-family='Arial' font-size='28' font-weight='bold' fill='#FFFFFF'>!</text>
    <text y='60' text-anchor='middle' font-family='Microsoft YaHei' font-size='14' font-weight='bold' fill='#991B1B'>乱堆垃圾</text>
  </g>
  <!-- 标签 -->
  <g>
    <rect x='30' y='440' width='200' height='40' rx='20' fill='#ffffff' opacity='0.92'/>
    <circle cx='52' cy='460' r='8' fill='#DC2626'/>
    <text x='68' y='464' font-family='Microsoft YaHei' font-size='16' font-weight='bold' fill='#0F172A'>市民随手拍 · 脏乱</text>
  </g>
</svg>`);

  const IMG_TRASH_AFTER = svgToDataUrl(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>
  <defs>
    <linearGradient id='skyC' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#EAF8F5'/>
      <stop offset='1' stop-color='#86E3CE'/>
    </linearGradient>
    <linearGradient id='gndC' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#8CA1A5'/>
      <stop offset='1' stop-color='#5B6B70'/>
    </linearGradient>
  </defs>
  <rect width='800' height='220' fill='url(#skyC)'/>
  <rect y='220' width='800' height='280' fill='url(#gndC)'/>
  <g opacity='0.85'>
    <rect x='30' y='140' width='140' height='90' fill='#A8A29E' rx='4'/>
    <rect x='200' y='120' width='200' height='110' fill='#8C857F' rx='4'/>
    <rect x='430' y='150' width='120' height='80' fill='#A8A29E' rx='4'/>
    <rect x='580' y='110' width='180' height='120' fill='#78716C' rx='4'/>
  </g>
  <!-- 干净路面 + 绿化 -->
  <rect y='230' width='800' height='8' fill='#F4C430' opacity='0.6'/>
  <g>
    <rect x='120' y='400' width='2' height='20' fill='#78350F'/>
    <circle cx='121' cy='395' r='28' fill='#26A69A'/>
    <rect x='360' y='410' width='2' height='20' fill='#78350F'/>
    <circle cx='361' cy='405' r='32' fill='#13988A'/>
    <rect x='620' y='400' width='2' height='20' fill='#78350F'/>
    <circle cx='621' cy='395' r='28' fill='#4CBFB2'/>
  </g>
  <!-- 环卫工人水印 -->
  <g transform='translate(560,290)' opacity='0.9'>
    <rect width='200' height='30' rx='15' fill='#13988A'/>
    <text x='100' y='20' text-anchor='middle' font-family='Microsoft YaHei' font-size='14' font-weight='bold' fill='#FFFFFF'>环卫已清理 ✓</text>
  </g>
  <!-- 标签 -->
  <g>
    <rect x='30' y='440' width='220' height='40' rx='20' fill='#ffffff' opacity='0.95'/>
    <circle cx='52' cy='460' r='8' fill='#13988A'/>
    <text x='68' y='464' font-family='Microsoft YaHei' font-size='16' font-weight='bold' fill='#0F172A'>处理完成 · 整洁如新</text>
  </g>
</svg>`);

  /* ---------------- 地理位置池 ---------------- */
  const ADDRESSES = [
    "杭州市西湖区文三路 258 号",
    "杭州市西湖区天目山路 132 号",
    "杭州市上城区庆春东路 88 号",
    "杭州市拱墅区莫干山路 766 号",
    "杭州市滨江区江南大道 3588 号",
    "杭州市余杭区文一西路 1500 号"
  ];

  /* ---------------- 车牌池 ---------------- */
  const PLATES = ["浙A·88888", "浙A·66B89", "浙A·12345", "浙A·2K99P", "浙A·HQ789"];

  /* ---------------- 问题分类 ---------------- */
  const CATEGORIES = [
    { key: "parking", label: "违章停车", icon: "🅿️", targetDept: "交警部门", color: "blue" },
    { key: "trash",   label: "垃圾乱倒", icon: "🗑️", targetDept: "城管部门", color: "amber" },
    { key: "damage",  label: "设施损坏", icon: "🚧", targetDept: "市政部门", color: "rose" },
    { key: "green",   label: "绿化破坏", icon: "🌿", targetDept: "园林部门", color: "emerald" }
  ];

  /* ---------------- 预定义工单（演示用） ---------------- */
  const SEED_TICKETS = [
    {
      id: "T-20260616-003",
      category: "parking",
      title: "禁停区私家车长时间违停",
      description: "在文三路教工路口西侧，有两辆轿车长期停放在禁停区域内，占用非机动车道，影响通行。已多次观察未开走，烦请交警部门核查处理。",
      imgBefore: IMG_PARKING_BEFORE,
      imgAfter:  IMG_PARKING_AFTER,
      address: "杭州市西湖区文三路 258 号",
      submitter: "市民 张**",
      createdAt: "2026-06-16 08:42",
      aiRecognizedAt: "2026-06-16 08:43",
      dispatchedAt: "2026-06-16 08:45",
      processedAt: "2026-06-16 14:20",
      closedAt: "2026-06-16 18:05",
      status: "closed",
      plate: "浙A·88888",
      targetDept: "交警部门",
      aiResult: "确属违章停放",
      processingNote: "交警机动中队已到达现场处置，两辆违停车辆均已驶离，现场恢复畅通。"
    },
    {
      id: "T-20260614-021",
      category: "trash",
      title: "居民区后侧生活垃圾乱堆",
      description: "天目山路 132 号后侧的小路与围墙边，生活垃圾堆放数日，出现异味与蚊虫，希望城管尽快清理并加强巡查。",
      imgBefore: IMG_TRASH_BEFORE,
      imgAfter:  IMG_TRASH_AFTER,
      address: "杭州市西湖区天目山路 132 号",
      submitter: "市民 李**",
      createdAt: "2026-06-14 19:10",
      aiRecognizedAt: "2026-06-14 19:11",
      dispatchedAt: "2026-06-14 19:15",
      processedAt: "2026-06-15 10:30",
      closedAt: "2026-06-15 17:00",
      status: "closed",
      plate: null,
      targetDept: "城管部门",
      aiResult: "确属生活垃圾乱堆",
      processingNote: "西湖区城管局已安排环卫作业车辆清运，并在该区域增设临时警示标识与巡检点位。"
    },
    {
      id: "T-20260617-114",
      category: "damage",
      title: "人行道路面破损",
      description: "庆春东路 88 号附近人行道地砖破损严重，老人与儿童易绊倒，希望尽快修复。",
      imgBefore: null,
      imgAfter: null,
      address: "杭州市上城区庆春东路 88 号",
      submitter: "市民 王**",
      createdAt: "2026-06-17 07:55",
      aiRecognizedAt: null,
      dispatchedAt: null,
      processedAt: null,
      closedAt: null,
      status: "queued",
      plate: null,
      targetDept: "市政部门",
      aiResult: null,
      processingNote: null
    }
  ];

  // 暴露到全局
  window.MOCK = {
    images: {
      parkingBefore: IMG_PARKING_BEFORE,
      parkingAfter:  IMG_PARKING_AFTER,
      trashBefore:   IMG_TRASH_BEFORE,
      trashAfter:    IMG_TRASH_AFTER
    },
    addresses: ADDRESSES,
    plates: PLATES,
    categories: CATEGORIES,
    seedTickets: SEED_TICKETS
  };
})();
