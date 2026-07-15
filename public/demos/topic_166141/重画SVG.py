# -*- coding: utf-8 -*-
"""
重画 emperor-time-manager 的 5 张 SVG 资源 v1.5
按用户最新参考图重画,补齐关键元素:
1. bg-qianqing.svg    - 紫禁城(米黄天空+金黄瓦+朱红墙+淡绿远山+云中宫殿+玉带桥+正门)
2. bg-yuhuayuan.svg   - 御花园(垂柳+太湖石+莲池+拱桥+亭台+远山)
3. bg-yuanmingyuan.svg- 圆明园(湖光+远山+五孔拱桥+亭台+垂柳)
4. emperor-male.svg   - Q版男帝(帝冕+12旒+黄袍+双手持玉玺"中国")
5. emperor-female.svg - Q版女帝(凤冠F屏+黑红袍+持玉玺)
"""
import os
import sys

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

DEST = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    'assets', 'images')

# ============================================================
# 1. 紫禁城·乾清宫  (米黄天空 + 淡绿远山 + 金黄瓦 + 朱红墙 + 玉带桥)
# ============================================================
bg_qianqing = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f3e6c4"/>
      <stop offset="0.45" stop-color="#e8d2a0"/>
      <stop offset="1" stop-color="#c89870"/>
    </linearGradient>
    <linearGradient id="mountainFar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a8c4a8"/>
      <stop offset="1" stop-color="#7a9a82" stop-opacity="0.7"/>
    </linearGradient>
    <linearGradient id="mountainMid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#88a890"/>
      <stop offset="1" stop-color="#5a7060"/>
    </linearGradient>
    <linearGradient id="mountainFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6a8a70"/>
      <stop offset="1" stop-color="#3a5a40"/>
    </linearGradient>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b22a3a"/>
      <stop offset="1" stop-color="#7a1822"/>
    </linearGradient>
    <linearGradient id="tile" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f0c060"/>
      <stop offset="0.5" stop-color="#d49a30"/>
      <stop offset="1" stop-color="#a86a1c"/>
    </linearGradient>
    <linearGradient id="tileBack" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dab060"/>
      <stop offset="1" stop-color="#9a7220"/>
    </linearGradient>
    <linearGradient id="cloud" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff8e4" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#f0d8a0" stop-opacity="0.5"/>
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b09868"/>
      <stop offset="1" stop-color="#5a3e22"/>
    </linearGradient>
    <linearGradient id="bridge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f0ece0"/>
      <stop offset="1" stop-color="#a8a090"/>
    </linearGradient>
  </defs>

  <!-- 米黄天空 -->
  <rect width="1920" height="1080" fill="url(#sky)"/>

  <!-- 远山(淡绿) -->
  <path d="M0 380 Q200 320 380 360 Q540 290 720 350 Q900 280 1080 340 Q1280 280 1460 340 Q1640 290 1820 340 L1920 360 L1920 700 L0 700 Z" fill="url(#mountainFar)" opacity="0.85"/>
  <path d="M0 450 Q220 380 420 420 Q620 360 820 410 Q1020 360 1220 410 Q1420 360 1620 410 Q1820 380 1920 400 L1920 700 L0 700 Z" fill="url(#mountainMid)" opacity="0.9"/>
  <path d="M0 540 Q160 480 320 520 Q480 460 640 510 Q800 470 960 520 Q1120 470 1280 520 Q1440 480 1600 520 Q1760 480 1920 510 L1920 700 L0 700 Z" fill="url(#mountainFront)" opacity="0.85"/>

  <!-- 云气层(覆盖中景,营造"云中"效果) -->
  <g>
    <ellipse cx="960" cy="500" rx="700" ry="80" fill="url(#cloud)"/>
    <ellipse cx="500" cy="540" rx="400" ry="55" fill="url(#cloud)"/>
    <ellipse cx="1420" cy="540" rx="420" ry="60" fill="url(#cloud)"/>
    <ellipse cx="960" cy="600" rx="800" ry="60" fill="url(#cloud)" opacity="0.85"/>
    <ellipse cx="200" cy="600" rx="350" ry="45" fill="url(#cloud)" opacity="0.6"/>
    <ellipse cx="1700" cy="610" rx="380" ry="48" fill="url(#cloud)" opacity="0.6"/>
  </g>

  <!-- 远景:云中宫殿(中轴) -->
  <g transform="translate(960, 380)">
    <!-- 高台 -->
    <rect x="-300" y="120" width="600" height="50" fill="url(#wall)" opacity="0.85"/>
    <rect x="-280" y="100" width="560" height="22" fill="url(#tileBack)"/>
    <!-- 主殿 -->
    <rect x="-260" y="0" width="520" height="100" fill="#e8c890"/>
    <rect x="-260" y="0" width="520" height="10" fill="#7a5020"/>
    <!-- 屋顶(歇山顶) -->
    <path d="M-300 0 Q-150 -90 0 -100 Q150 -90 300 0 L320 14 L-320 14 Z" fill="url(#tileBack)"/>
    <path d="M-300 0 Q-150 -90 0 -100 Q150 -90 300 0" fill="none" stroke="#5a3818" stroke-width="2"/>
    <!-- 屋脊 -->
    <rect x="-8" y="-110" width="16" height="18" fill="#a4243b"/>
    <circle cx="0" cy="-112" r="4" fill="#fcd34d"/>
    <!-- 屋脊兽 -->
    <circle cx="-260" cy="-10" r="6" fill="#7a4818"/>
    <circle cx="260" cy="-10" r="6" fill="#7a4818"/>
    <!-- 窗格 -->
    <g fill="#3a1a10" stroke="#d4a24c" stroke-width="2">
      <rect x="-200" y="20" width="60" height="60"/>
      <rect x="-110" y="20" width="60" height="60"/>
      <rect x="-20" y="20" width="60" height="60"/>
      <rect x="70" y="20" width="60" height="60"/>
      <rect x="160" y="20" width="60" height="60"/>
    </g>
    <g stroke="#d4a24c" stroke-width="1.5">
      <line x1="-170" y1="20" x2="-170" y2="80"/>
      <line x1="-200" y1="50" x2="-140" y2="50"/>
      <line x1="-80" y1="20" x2="-80" y2="80"/>
      <line x1="-110" y1="50" x2="-50" y2="50"/>
      <line x1="10" y1="20" x2="10" y2="80"/>
      <line x1="-20" y1="50" x2="40" y2="50"/>
      <line x1="100" y1="20" x2="100" y2="80"/>
      <line x1="70" y1="50" x2="130" y2="50"/>
      <line x1="190" y1="20" x2="190" y2="80"/>
      <line x1="160" y1="50" x2="220" y2="50"/>
    </g>
    <!-- 匾额 -->
    <rect x="-100" y="-50" width="200" height="32" fill="#3a1a08" stroke="#d4a24c" stroke-width="2"/>
    <text x="0" y="-30" font-size="22" text-anchor="middle" fill="#fcd34d" font-family="serif" font-weight="bold">乾清宫</text>
  </g>

  <!-- 中景:左右次殿(半隐云中) -->
  <g transform="translate(360, 580)" opacity="0.9">
    <rect x="-130" y="50" width="260" height="20" fill="url(#tileBack)"/>
    <rect x="-120" y="0" width="240" height="52" fill="#c8a060"/>
    <path d="M-140 0 Q0 -60 140 0 L150 12 L-150 12 Z" fill="url(#tileBack)"/>
    <path d="M-140 0 Q0 -60 140 0" fill="none" stroke="#5a3818" stroke-width="2"/>
    <rect x="-4" y="-66" width="8" height="14" fill="#a4243b"/>
  </g>
  <g transform="translate(1560, 580)" opacity="0.9">
    <rect x="-130" y="50" width="260" height="20" fill="url(#tileBack)"/>
    <rect x="-120" y="0" width="240" height="52" fill="#c8a060"/>
    <path d="M-140 0 Q0 -60 140 0 L150 12 L-150 12 Z" fill="url(#tileBack)"/>
    <path d="M-140 0 Q0 -60 140 0" fill="none" stroke="#5a3818" stroke-width="2"/>
    <rect x="-4" y="-66" width="8" height="14" fill="#a4243b"/>
  </g>

  <!-- 远景:朱红宫墙(横向延展,带黄色琉璃瓦顶) -->
  <rect x="0" y="720" width="1920" height="200" fill="url(#wall)"/>
  <rect x="0" y="708" width="1920" height="14" fill="url(#tile)"/>
  <rect x="0" y="704" width="1920" height="6" fill="#7a4818"/>
  <!-- 墙脊小兽 -->
  <g fill="#7a4818">
    <circle cx="80" cy="709" r="3"/>
    <circle cx="240" cy="709" r="3"/>
    <circle cx="400" cy="709" r="3"/>
    <circle cx="560" cy="709" r="3"/>
    <circle cx="720" cy="709" r="3"/>
    <circle cx="880" cy="709" r="3"/>
    <circle cx="1040" cy="709" r="3"/>
    <circle cx="1200" cy="709" r="3"/>
    <circle cx="1360" cy="709" r="3"/>
    <circle cx="1520" cy="709" r="3"/>
    <circle cx="1680" cy="709" r="3"/>
    <circle cx="1840" cy="709" r="3"/>
  </g>

  <!-- 前景:正门(主殿) - 大门居中 -->
  <g transform="translate(960, 800)">
    <!-- 台阶(三级) -->
    <rect x="-320" y="200" width="640" height="22" fill="#8a7050"/>
    <rect x="-300" y="178" width="600" height="24" fill="#a48868"/>
    <rect x="-280" y="156" width="560" height="24" fill="#bca080"/>
    <!-- 须弥座 -->
    <rect x="-300" y="150" width="600" height="8" fill="#5a3e22"/>
    <!-- 主墙体 -->
    <rect x="-280" y="0" width="560" height="150" fill="url(#wall)"/>
    <!-- 墙顶黄色瓦 -->
    <rect x="-300" y="-10" width="600" height="16" fill="url(#tile)"/>
    <rect x="-300" y="-16" width="600" height="8" fill="#7a4818"/>
    <!-- 屋顶(歇山顶,带吻兽) -->
    <path d="M-330 -10 L-240 -80 L-150 -68 L0 -110 L150 -68 L240 -80 L330 -10 Z" fill="url(#tile)"/>
    <path d="M-330 -10 L-240 -80 L-150 -68 L0 -110 L150 -68 L240 -80 L330 -10" fill="none" stroke="#5a3818" stroke-width="2"/>
    <!-- 吻兽(屋脊两端) -->
    <path d="M-330 -10 L-340 -30 L-310 -28 L-310 -10 Z" fill="#7a4818"/>
    <path d="M330 -10 L340 -30 L310 -28 L310 -10 Z" fill="#7a4818"/>
    <!-- 屋脊中央宝顶 -->
    <rect x="-6" y="-120" width="12" height="20" fill="#a4243b"/>
    <circle cx="0" cy="-122" r="4" fill="#fcd34d"/>
    <!-- 中门洞(拱形) -->
    <path d="M-50 150 L-50 50 Q-50 0 0 0 Q50 0 50 50 L50 150 Z" fill="#1a0a08"/>
    <!-- 门板(双扇) -->
    <rect x="-46" y="0" width="46" height="150" fill="#5a1a18"/>
    <line x1="0" y1="0" x2="0" y2="150" stroke="#3a0a08" stroke-width="2"/>
    <!-- 门钉(双扇各9颗) -->
    <g fill="#d4a24c">
      <circle cx="-32" cy="20" r="2.5"/><circle cx="-14" cy="20" r="2.5"/>
      <circle cx="-32" cy="40" r="2.5"/><circle cx="-14" cy="40" r="2.5"/>
      <circle cx="-32" cy="60" r="2.5"/><circle cx="-14" cy="60" r="2.5"/>
      <circle cx="-32" cy="80" r="2.5"/><circle cx="-14" cy="80" r="2.5"/>
      <circle cx="-32" cy="100" r="2.5"/><circle cx="-14" cy="100" r="2.5"/>
      <circle cx="14" cy="20" r="2.5"/><circle cx="32" cy="20" r="2.5"/>
      <circle cx="14" cy="40" r="2.5"/><circle cx="32" cy="40" r="2.5"/>
      <circle cx="14" cy="60" r="2.5"/><circle cx="32" cy="60" r="2.5"/>
      <circle cx="14" cy="80" r="2.5"/><circle cx="32" cy="80" r="2.5"/>
      <circle cx="14" cy="100" r="2.5"/><circle cx="32" cy="100" r="2.5"/>
    </g>
    <!-- 侧窗(对称) -->
    <g>
      <rect x="-240" y="40" width="60" height="100" fill="#3a1a18" stroke="#d4a24c" stroke-width="2"/>
      <line x1="-210" y1="40" x2="-210" y2="140" stroke="#d4a24c" stroke-width="2"/>
      <line x1="-240" y1="90" x2="-180" y2="90" stroke="#d4a24c" stroke-width="2"/>
    </g>
    <g>
      <rect x="180" y="40" width="60" height="100" fill="#3a1a18" stroke="#d4a24c" stroke-width="2"/>
      <line x1="210" y1="40" x2="210" y2="140" stroke="#d4a24c" stroke-width="2"/>
      <line x1="180" y1="90" x2="240" y2="90" stroke="#d4a24c" stroke-width="2"/>
    </g>
    <!-- 匾额 -->
    <rect x="-90" y="-30" width="180" height="34" fill="#3a1a08" stroke="#d4a24c" stroke-width="2"/>
    <text x="0" y="-7" font-size="24" text-anchor="middle" fill="#fcd34d" font-family="serif" font-weight="bold">乾清宫</text>
  </g>

  <!-- 前景:玉带桥(白色大理石单拱) -->
  <g transform="translate(960, 940)">
    <!-- 桥拱倒影(水中) -->
    <ellipse cx="0" cy="100" rx="180" ry="22" fill="#000" opacity="0.2"/>
    <!-- 桥身 -->
    <path d="M-220 0 L-200 -10 L-180 0 L-180 -60 Q-180 -100 -100 -100 Q-50 -100 -30 -90 L-10 -80 L0 -78 L10 -80 L30 -90 Q50 -100 100 -100 Q180 -100 180 -60 L180 0 L200 -10 L220 0 L220 14 L-220 14 Z" fill="url(#bridge)"/>
    <!-- 桥面中央线 -->
    <line x1="-220" y1="0" x2="220" y2="0" stroke="#8a8070" stroke-width="1"/>
    <!-- 桥栏(白色) -->
    <rect x="-220" y="-12" width="440" height="6" fill="#f0ece0"/>
    <g fill="#f0ece0">
      <rect x="-200" y="-44" width="5" height="34"/>
      <rect x="-160" y="-44" width="5" height="34"/>
      <rect x="-120" y="-44" width="5" height="34"/>
      <rect x="-80" y="-44" width="5" height="34"/>
      <rect x="-40" y="-44" width="5" height="34"/>
      <rect x="0" y="-44" width="5" height="34"/>
      <rect x="40" y="-44" width="5" height="34"/>
      <rect x="80" y="-44" width="5" height="34"/>
      <rect x="120" y="-44" width="5" height="34"/>
      <rect x="160" y="-44" width="5" height="34"/>
      <rect x="195" y="-44" width="5" height="34"/>
    </g>
    <!-- 桥洞(水中倒影) -->
    <ellipse cx="0" cy="40" rx="100" ry="20" fill="#5a4030" opacity="0.3"/>
  </g>

  <!-- 前景:左侧松树(常青) -->
  <g transform="translate(180, 850)">
    <rect x="-10" y="0" width="20" height="130" fill="#3a1a08"/>
    <path d="M0 0 Q-40 -50 -65 -30 Q-55 -20 -15 -20" fill="#2a4a30"/>
    <path d="M0 -25 Q-50 -75 -75 -55 Q-60 -45 -15 -45" fill="#3a5a40"/>
    <path d="M0 -50 Q40 -100 65 -80 Q50 -70 15 -70" fill="#2a4a30"/>
    <path d="M0 15 Q50 -25 75 -5 Q60 5 15 5" fill="#3a5a40"/>
    <path d="M0 -15 Q-25 -55 0 -110 Q25 -55 0 -15" fill="#4a6a50"/>
    <path d="M-5 -130 Q-30 -160 -45 -150" stroke="#3a1a08" stroke-width="3" fill="none"/>
    <path d="M5 -120 Q30 -150 50 -140" stroke="#3a1a08" stroke-width="3" fill="none"/>
  </g>

  <!-- 前景:右侧松树 -->
  <g transform="translate(1740, 850)">
    <rect x="-10" y="0" width="20" height="130" fill="#3a1a08"/>
    <path d="M0 0 Q40 -50 65 -30 Q55 -20 15 -20" fill="#2a4a30"/>
    <path d="M0 -25 Q50 -75 75 -55 Q60 -45 15 -45" fill="#3a5a40"/>
    <path d="M0 -50 Q-40 -100 -65 -80 Q-50 -70 -15 -70" fill="#2a4a30"/>
    <path d="M0 15 Q-50 -25 -75 -5 Q-60 5 -15 5" fill="#3a5a40"/>
    <path d="M0 -15 Q25 -55 0 -110 Q-25 -55 0 -15" fill="#4a6a50"/>
  </g>

  <!-- 前景:左侧干枝(冬意) -->
  <g transform="translate(280, 870)">
    <path d="M0 100 Q-5 40 5 -10 Q10 -60 -5 -120" stroke="#5a3a20" stroke-width="4" fill="none"/>
    <path d="M5 50 Q-25 30 -45 10" stroke="#5a3a20" stroke-width="2" fill="none"/>
    <path d="M0 0 Q30 -20 50 -30" stroke="#5a3a20" stroke-width="2" fill="none"/>
    <path d="M-5 -50 Q-30 -70 -50 -80" stroke="#5a3a20" stroke-width="2" fill="none"/>
    <path d="M5 -80 Q25 -100 40 -110" stroke="#5a3a20" stroke-width="2" fill="none"/>
  </g>

  <!-- 前景:右侧干枝 -->
  <g transform="translate(1640, 880)">
    <path d="M0 100 Q5 40 -5 -10 Q-10 -60 5 -120" stroke="#5a3a20" stroke-width="4" fill="none"/>
    <path d="M-5 50 Q25 30 45 10" stroke="#5a3a20" stroke-width="2" fill="none"/>
    <path d="M0 0 Q-30 -20 -50 -30" stroke="#5a3a20" stroke-width="2" fill="none"/>
    <path d="M5 -50 Q30 -70 50 -80" stroke="#5a3a20" stroke-width="2" fill="none"/>
  </g>

  <!-- 前景:地面石板路 -->
  <rect x="0" y="990" width="1920" height="90" fill="url(#ground)"/>
  <g stroke="#3a2010" stroke-width="1" opacity="0.4">
    <line x1="0" y1="1010" x2="1920" y2="1010"/>
    <line x1="0" y1="1050" x2="1920" y2="1050"/>
    <line x1="160" y1="990" x2="160" y2="1080"/>
    <line x1="400" y1="990" x2="400" y2="1080"/>
    <line x1="640" y1="990" x2="640" y2="1080"/>
    <line x1="880" y1="990" x2="880" y2="1080"/>
    <line x1="1120" y1="990" x2="1120" y2="1080"/>
    <line x1="1360" y1="990" x2="1360" y2="1080"/>
    <line x1="1600" y1="990" x2="1600" y2="1080"/>
    <line x1="1840" y1="990" x2="1840" y2="1080"/>
  </g>
</svg>'''

# ============================================================
# 2. 御花园 - 垂柳+太湖石+莲池+拱桥+亭台
# ============================================================
bg_yuhuayuan = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f4ecdc"/>
      <stop offset="0.5" stop-color="#e8d8b8"/>
      <stop offset="1" stop-color="#c8b888"/>
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a8c4a8" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#6a8a6a"/>
    </linearGradient>
    <linearGradient id="tileR" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e0b850"/>
      <stop offset="1" stop-color="#a07820"/>
    </linearGradient>
    <linearGradient id="tileG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a8060"/>
      <stop offset="1" stop-color="#2a4a30"/>
    </linearGradient>
    <radialGradient id="stone" cx="0.4" cy="0.3" r="0.7">
      <stop offset="0" stop-color="#f0f0f0"/>
      <stop offset="0.6" stop-color="#a8a8a8"/>
      <stop offset="1" stop-color="#5a5a5a"/>
    </radialGradient>
    <linearGradient id="willow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a8c898"/>
      <stop offset="1" stop-color="#6a8a58"/>
    </linearGradient>
  </defs>

  <!-- 米黄天空 -->
  <rect width="1920" height="1080" fill="url(#sky2)"/>

  <!-- 远山(淡青) -->
  <path d="M0 360 Q300 310 600 340 Q900 300 1200 330 Q1500 300 1920 340 L1920 580 L0 580 Z" fill="#a8c4a8" opacity="0.5"/>
  <path d="M0 420 Q400 370 800 400 Q1200 370 1920 410 L1920 580 L0 580 Z" fill="#8aa888" opacity="0.55"/>

  <!-- 远景:殿宇一角(中后) -->
  <g transform="translate(960, 360)" opacity="0.9">
    <rect x="-160" y="80" width="320" height="40" fill="url(#tileR)"/>
    <rect x="-150" y="0" width="300" height="80" fill="#e8d4a8"/>
    <rect x="-150" y="0" width="300" height="14" fill="#7a5020"/>
    <path d="M-170 0 Q0 -90 170 0 L180 14 L-180 14 Z" fill="url(#tileR)"/>
    <path d="M-170 0 Q0 -90 170 0" fill="none" stroke="#5a3818" stroke-width="2"/>
    <rect x="-110" y="20" width="50" height="50" fill="#3a2010"/>
    <rect x="-30" y="20" width="50" height="50" fill="#3a2010"/>
    <rect x="50" y="20" width="50" height="50" fill="#3a2010"/>
    <rect x="-4" y="-100" width="8" height="14" fill="#a4243b"/>
  </g>

  <!-- 莲池(占据中下) -->
  <rect x="0" y="580" width="1920" height="400" fill="url(#water)"/>

  <!-- 池中荷叶(粉绿,大量) -->
  <g>
    <ellipse cx="120" cy="720" rx="55" ry="13" fill="#5a8a5a" opacity="0.85"/>
    <ellipse cx="280" cy="800" rx="70" ry="16" fill="#6a9a6a" opacity="0.85"/>
    <ellipse cx="500" cy="760" rx="80" ry="18" fill="#5a8a5a" opacity="0.85"/>
    <ellipse cx="720" cy="850" rx="65" ry="15" fill="#6a9a6a" opacity="0.85"/>
    <ellipse cx="900" cy="800" rx="75" ry="17" fill="#5a8a5a" opacity="0.85"/>
    <ellipse cx="1100" cy="850" rx="80" ry="18" fill="#6a9a6a" opacity="0.85"/>
    <ellipse cx="1340" cy="780" rx="65" ry="15" fill="#5a8a5a" opacity="0.85"/>
    <ellipse cx="1560" cy="850" rx="75" ry="17" fill="#6a9a6a" opacity="0.85"/>
    <ellipse cx="1780" cy="800" rx="55" ry="13" fill="#5a8a5a" opacity="0.85"/>
    <ellipse cx="200" cy="900" rx="50" ry="12" fill="#6a9a6a" opacity="0.85"/>
    <ellipse cx="600" cy="930" rx="65" ry="15" fill="#5a8a5a" opacity="0.85"/>
    <ellipse cx="1250" cy="930" rx="70" ry="16" fill="#6a9a6a" opacity="0.85"/>
    <ellipse cx="1700" cy="920" rx="55" ry="13" fill="#5a8a5a" opacity="0.85"/>
  </g>
  <!-- 荷花 -->
  <g>
    <g transform="translate(180, 700)">
      <ellipse cx="0" cy="0" rx="14" ry="6" fill="#f0a0c0"/>
      <ellipse cx="-6" cy="-2" rx="8" ry="3" fill="#fcd0d8"/>
      <circle cx="0" cy="0" r="3" fill="#fcd34d"/>
    </g>
    <g transform="translate(360, 780)">
      <ellipse cx="0" cy="0" rx="16" ry="7" fill="#f4b4cc"/>
      <ellipse cx="-7" cy="-3" rx="9" ry="3" fill="#fcd0d8"/>
      <circle cx="0" cy="0" r="3" fill="#fcd34d"/>
    </g>
    <g transform="translate(580, 740)">
      <ellipse cx="0" cy="0" rx="14" ry="6" fill="#f0a0c0"/>
      <ellipse cx="-6" cy="-2" rx="8" ry="3" fill="#fcd0d8"/>
      <circle cx="0" cy="0" r="3" fill="#fcd34d"/>
    </g>
    <g transform="translate(800, 830)">
      <ellipse cx="0" cy="0" rx="15" ry="7" fill="#f4b4cc"/>
      <ellipse cx="-7" cy="-3" rx="8" ry="3" fill="#fcd0d8"/>
      <circle cx="0" cy="0" r="3" fill="#fcd34d"/>
    </g>
    <g transform="translate(1180, 830)">
      <ellipse cx="0" cy="0" rx="16" ry="7" fill="#f0a0c0"/>
      <ellipse cx="-7" cy="-3" rx="9" ry="3" fill="#fcd0d8"/>
      <circle cx="0" cy="0" r="3" fill="#fcd34d"/>
    </g>
    <g transform="translate(1420, 760)">
      <ellipse cx="0" cy="0" rx="14" ry="6" fill="#f4b4cc"/>
      <ellipse cx="-6" cy="-2" rx="8" ry="3" fill="#fcd0d8"/>
      <circle cx="0" cy="0" r="3" fill="#fcd34d"/>
    </g>
    <g transform="translate(1640, 830)">
      <ellipse cx="0" cy="0" rx="15" ry="7" fill="#f0a0c0"/>
      <ellipse cx="-7" cy="-3" rx="8" ry="3" fill="#fcd0d8"/>
      <circle cx="0" cy="0" r="3" fill="#fcd34d"/>
    </g>
  </g>

  <!-- 倒影(柔光) -->
  <g opacity="0.3">
    <ellipse cx="960" cy="900" rx="800" ry="20" fill="#fff"/>
  </g>

  <!-- 太湖石(左侧,主石) -->
  <g transform="translate(120, 660)">
    <path d="M0 0 Q-30 -50 -10 -100 Q15 -130 0 -170 Q-25 -200 0 -220 Q30 -240 40 -270 Q70 -260 80 -230 Q90 -190 65 -160 Q90 -130 70 -100 Q90 -60 60 -30 Q50 -10 30 0 Z" fill="url(#stone)"/>
    <!-- 孔洞 -->
    <ellipse cx="20" cy="-160" rx="8" ry="14" fill="#5a5a5a" opacity="0.6"/>
    <ellipse cx="-5" cy="-100" rx="6" ry="10" fill="#5a5a5a" opacity="0.6"/>
    <ellipse cx="50" cy="-220" rx="5" ry="8" fill="#5a5a5a" opacity="0.6"/>
    <!-- 阴影 -->
    <ellipse cx="0" cy="0" rx="60" ry="6" fill="#000" opacity="0.25"/>
  </g>
  <!-- 太湖石(左中,小) -->
  <g transform="translate(330, 700)">
    <path d="M0 0 Q-15 -25 -5 -50 Q10 -65 0 -85 Q15 -95 20 -110 Q35 -100 30 -80 Q40 -60 25 -45 Q35 -25 15 -10 Z" fill="url(#stone)"/>
    <ellipse cx="0" cy="0" rx="30" ry="4" fill="#000" opacity="0.2"/>
  </g>
  <!-- 太湖石(右侧) -->
  <g transform="translate(1820, 660)">
    <path d="M0 0 Q-25 -50 -5 -100 Q20 -130 -5 -160 Q-25 -190 -5 -220 Q25 -250 50 -260 Q80 -240 75 -210 Q90 -170 60 -140 Q85 -110 65 -80 Q85 -50 55 -30 Q35 -10 0 0 Z" fill="url(#stone)"/>
    <ellipse cx="0" cy="0" rx="55" ry="7" fill="#000" opacity="0.2"/>
  </g>

  <!-- 拱桥(中央) -->
  <g transform="translate(960, 700)">
    <!-- 桥拱倒影 -->
    <ellipse cx="0" cy="80" rx="180" ry="22" fill="#000" opacity="0.2"/>
    <!-- 桥身(单拱) -->
    <path d="M-220 0 Q-220 -130 0 -130 Q220 -130 220 0 L200 0 Q200 -110 0 -110 Q-200 -110 -200 0 Z" fill="#d8c4a4"/>
    <!-- 桥面 -->
    <path d="M-240 -10 Q-240 -140 0 -140 Q240 -140 240 -10 L230 -10 L-230 -10 Z" fill="#c8a888"/>
    <!-- 桥栏(白色) -->
    <rect x="-240" y="-15" width="480" height="6" fill="#f0ece0"/>
    <g fill="#f0ece0">
      <rect x="-220" y="-50" width="6" height="40"/>
      <rect x="-180" y="-50" width="6" height="40"/>
      <rect x="-140" y="-50" width="6" height="40"/>
      <rect x="-100" y="-50" width="6" height="40"/>
      <rect x="-60" y="-50" width="6" height="40"/>
      <rect x="-20" y="-50" width="6" height="40"/>
      <rect x="20" y="-50" width="6" height="40"/>
      <rect x="60" y="-50" width="6" height="40"/>
      <rect x="100" y="-50" width="6" height="40"/>
      <rect x="140" y="-50" width="6" height="40"/>
      <rect x="180" y="-50" width="6" height="40"/>
      <rect x="214" y="-50" width="6" height="40"/>
    </g>
    <!-- 桥洞(水中倒影) -->
    <ellipse cx="0" cy="50" rx="160" ry="40" fill="#6a8a6a" opacity="0.5"/>
  </g>

  <!-- 亭台(左侧,金色瓦) -->
  <g transform="translate(380, 480)">
    <rect x="-60" y="60" width="120" height="40" fill="#c8a888"/>
    <rect x="-65" y="56" width="130" height="8" fill="#a48868"/>
    <rect x="-50" y="-40" width="6" height="100" fill="#a4243b"/>
    <rect x="44" y="-40" width="6" height="100" fill="#a4243b"/>
    <rect x="-3" y="-40" width="6" height="100" fill="#a4243b"/>
    <path d="M-70 -40 Q-50 -90 0 -110 Q50 -90 70 -40 Z" fill="url(#tileR)"/>
    <path d="M-70 -40 L0 -110 L70 -40" fill="none" stroke="#5a3818" stroke-width="2"/>
    <rect x="-4" y="-120" width="8" height="14" fill="#a4243b"/>
    <circle cx="0" cy="-122" r="3" fill="#fcd34d"/>
  </g>

  <!-- 亭台(右侧,绿色瓦) -->
  <g transform="translate(1540, 480)">
    <rect x="-60" y="60" width="120" height="40" fill="#c8a888"/>
    <rect x="-65" y="56" width="130" height="8" fill="#a48868"/>
    <rect x="-50" y="-40" width="6" height="100" fill="#a4243b"/>
    <rect x="44" y="-40" width="6" height="100" fill="#a4243b"/>
    <rect x="-3" y="-40" width="6" height="100" fill="#a4243b"/>
    <path d="M-70 -40 Q-50 -90 0 -110 Q50 -90 70 -40 Z" fill="url(#tileG)"/>
    <path d="M-70 -40 L0 -110 L70 -40" fill="none" stroke="#1a2a20" stroke-width="2"/>
    <rect x="-4" y="-120" width="8" height="14" fill="#a4243b"/>
    <circle cx="0" cy="-122" r="3" fill="#fcd34d"/>
  </g>

  <!-- 垂柳(左前,主体) -->
  <g transform="translate(60, 0)">
    <path d="M80 0 L75 700" stroke="#5a3818" stroke-width="14" fill="none"/>
    <g stroke="url(#willow)" stroke-width="2.5" fill="none" opacity="0.95">
      <path d="M80 0 Q50 60 30 130 Q20 200 10 280"/>
      <path d="M80 0 Q65 50 50 120 Q40 190 30 270"/>
      <path d="M80 0 Q85 60 90 130 Q95 200 100 280"/>
      <path d="M80 0 Q35 70 5 150 Q-15 230 -35 320"/>
      <path d="M80 0 Q110 60 130 130 Q140 200 150 280"/>
      <path d="M80 0 Q95 50 105 120 Q110 190 115 270"/>
      <path d="M80 -10 Q55 50 35 110 Q20 170 5 240"/>
      <path d="M80 -10 Q105 50 125 110 Q140 170 155 240"/>
      <path d="M80 50 Q40 130 20 220 Q0 320 -20 420"/>
      <path d="M80 50 Q120 130 140 220 Q160 320 180 420"/>
    </g>
    <!-- 柳叶 -->
    <g fill="#7aa868" opacity="0.85">
      <ellipse cx="30" cy="130" rx="2.5" ry="8"/>
      <ellipse cx="50" cy="120" rx="2.5" ry="8"/>
      <ellipse cx="90" cy="130" rx="2.5" ry="8"/>
      <ellipse cx="130" cy="130" rx="2.5" ry="8"/>
      <ellipse cx="20" cy="190" rx="2.5" ry="8"/>
      <ellipse cx="40" cy="180" rx="2.5" ry="8"/>
      <ellipse cx="100" cy="190" rx="2.5" ry="8"/>
      <ellipse cx="140" cy="190" rx="2.5" ry="8"/>
      <ellipse cx="10" cy="280" rx="2.5" ry="8"/>
      <ellipse cx="30" cy="270" rx="2.5" ry="8"/>
      <ellipse cx="100" cy="280" rx="2.5" ry="8"/>
      <ellipse cx="150" cy="280" rx="2.5" ry="8"/>
      <ellipse cx="5" cy="150" rx="2.5" ry="8"/>
      <ellipse cx="155" cy="150" rx="2.5" ry="8"/>
      <ellipse cx="20" cy="220" rx="2.5" ry="8"/>
      <ellipse cx="140" cy="220" rx="2.5" ry="8"/>
      <ellipse cx="5" cy="250" rx="2.5" ry="8"/>
      <ellipse cx="155" cy="250" rx="2.5" ry="8"/>
    </g>
  </g>

  <!-- 垂柳(右前) -->
  <g transform="translate(1780, 0)">
    <path d="M80 0 L85 700" stroke="#5a3818" stroke-width="14" fill="none"/>
    <g stroke="url(#willow)" stroke-width="2.5" fill="none" opacity="0.95">
      <path d="M80 0 Q110 60 130 130 Q140 200 150 280"/>
      <path d="M80 0 Q95 50 105 120 Q110 190 115 270"/>
      <path d="M80 0 Q75 60 70 130 Q65 200 60 280"/>
      <path d="M80 0 Q125 70 155 150 Q175 230 195 320"/>
      <path d="M80 0 Q50 60 30 130 Q20 200 10 280"/>
      <path d="M80 0 Q65 50 55 120 Q50 190 45 270"/>
      <path d="M80 -10 Q105 50 125 110 Q140 170 155 240"/>
      <path d="M80 50 Q120 130 140 220 Q160 320 180 420"/>
    </g>
    <g fill="#7aa868" opacity="0.85">
      <ellipse cx="130" cy="130" rx="2.5" ry="8"/>
      <ellipse cx="105" cy="120" rx="2.5" ry="8"/>
      <ellipse cx="70" cy="130" rx="2.5" ry="8"/>
      <ellipse cx="30" cy="130" rx="2.5" ry="8"/>
      <ellipse cx="140" cy="190" rx="2.5" ry="8"/>
      <ellipse cx="115" cy="180" rx="2.5" ry="8"/>
      <ellipse cx="60" cy="190" rx="2.5" ry="8"/>
      <ellipse cx="20" cy="190" rx="2.5" ry="8"/>
      <ellipse cx="150" cy="280" rx="2.5" ry="8"/>
      <ellipse cx="115" cy="270" rx="2.5" ry="8"/>
      <ellipse cx="60" cy="280" rx="2.5" ry="8"/>
      <ellipse cx="10" cy="280" rx="2.5" ry="8"/>
      <ellipse cx="155" cy="150" rx="2.5" ry="8"/>
      <ellipse cx="5" cy="150" rx="2.5" ry="8"/>
      <ellipse cx="140" cy="220" rx="2.5" ry="8"/>
      <ellipse cx="20" cy="220" rx="2.5" ry="8"/>
      <ellipse cx="155" cy="250" rx="2.5" ry="8"/>
      <ellipse cx="5" cy="250" rx="2.5" ry="8"/>
    </g>
  </g>

  <!-- 飘落花瓣 -->
  <g fill="#f4b4cc" opacity="0.7">
    <circle cx="400" cy="280" r="3"/>
    <circle cx="600" cy="180" r="2.5"/>
    <circle cx="800" cy="320" r="3"/>
    <circle cx="1100" cy="220" r="2.5"/>
    <circle cx="1300" cy="350" r="3"/>
    <circle cx="500" cy="420" r="2.5"/>
    <circle cx="1400" cy="400" r="2.5"/>
    <circle cx="700" cy="500" r="3"/>
    <circle cx="200" cy="350" r="2"/>
    <circle cx="1700" cy="450" r="2.5"/>
    <circle cx="900" cy="200" r="2"/>
  </g>
</svg>'''

# ============================================================
# 3. 圆明园 - 湖光 + 远山 + 五孔拱桥 + 亭台 + 垂柳
# ============================================================
bg_yuanmingyuan = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8e4d0"/>
      <stop offset="0.5" stop-color="#d0d8c0"/>
      <stop offset="1" stop-color="#a8b888"/>
    </linearGradient>
    <linearGradient id="water3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a8c8c8"/>
      <stop offset="0.5" stop-color="#88a8a8"/>
      <stop offset="1" stop-color="#5a8080"/>
    </linearGradient>
    <linearGradient id="tile3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e0b850"/>
      <stop offset="1" stop-color="#a07820"/>
    </linearGradient>
    <linearGradient id="tile3G" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a8060"/>
      <stop offset="1" stop-color="#2a4a30"/>
    </linearGradient>
    <linearGradient id="willow3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a8c898"/>
      <stop offset="1" stop-color="#6a8a58"/>
    </linearGradient>
    <linearGradient id="mountain3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7a9a78" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#5a7a58"/>
    </linearGradient>
  </defs>

  <!-- 米黄天空 -->
  <rect width="1920" height="1080" fill="url(#sky3)"/>

  <!-- 远山层叠(青绿) -->
  <path d="M0 360 Q200 300 400 340 Q600 290 800 330 Q1000 280 1200 320 Q1400 280 1600 320 Q1800 290 1920 330 L1920 580 L0 580 Z" fill="#7a9a78" opacity="0.5"/>
  <path d="M0 420 Q300 360 600 400 Q900 360 1200 400 Q1500 360 1920 410 L1920 580 L0 580 Z" fill="url(#mountain3)" opacity="0.85"/>

  <!-- 湖水 -->
  <rect x="0" y="560" width="1920" height="520" fill="url(#water3)"/>

  <!-- 远景:连绵殿宇(沿岸) -->
  <g transform="translate(120, 480)" opacity="0.92">
    <rect x="-60" y="40" width="120" height="20" fill="url(#tile3)"/>
    <rect x="-55" y="0" width="110" height="42" fill="#d8c088"/>
    <path d="M-65 0 Q0 -50 65 0 L70 8 L-70 8 Z" fill="url(#tile3)"/>
  </g>
  <g transform="translate(380, 500)" opacity="0.92">
    <rect x="-80" y="50" width="160" height="22" fill="url(#tile3)"/>
    <rect x="-75" y="0" width="150" height="52" fill="#d8c088"/>
    <path d="M-85 0 Q0 -60 85 0 L92 10 L-92 10 Z" fill="url(#tile3)"/>
  </g>
  <g transform="translate(720, 490)" opacity="0.92">
    <rect x="-90" y="50" width="180" height="22" fill="url(#tile3)"/>
    <rect x="-85" y="0" width="170" height="52" fill="#d8c088"/>
    <path d="M-95 0 Q0 -70 95 0 L102 10 L-102 10 Z" fill="url(#tile3)"/>
    <rect x="-4" y="-78" width="8" height="14" fill="#a4243b"/>
  </g>
  <g transform="translate(1200, 500)" opacity="0.92">
    <rect x="-80" y="50" width="160" height="22" fill="url(#tile3G)"/>
    <rect x="-75" y="0" width="150" height="52" fill="#d8c088"/>
    <path d="M-85 0 Q0 -60 85 0 L92 10 L-92 10 Z" fill="url(#tile3G)"/>
  </g>
  <g transform="translate(1560, 510)" opacity="0.92">
    <rect x="-60" y="40" width="120" height="20" fill="url(#tile3)"/>
    <rect x="-55" y="0" width="110" height="42" fill="#d8c088"/>
    <path d="M-65 0 Q0 -50 65 0 L70 8 L-70 8 Z" fill="url(#tile3)"/>
  </g>
  <g transform="translate(1820, 530)" opacity="0.92">
    <rect x="-50" y="30" width="100" height="20" fill="url(#tile3)"/>
    <rect x="-45" y="0" width="90" height="32" fill="#d8c088"/>
    <path d="M-55 0 Q0 -40 55 0 L60 6 L-60 6 Z" fill="url(#tile3)"/>
  </g>

  <!-- 拱桥(中央,五孔石桥) -->
  <g transform="translate(960, 660)">
    <ellipse cx="0" cy="80" rx="400" ry="14" fill="#000" opacity="0.2"/>
    <!-- 主桥面(弧形) -->
    <path d="M-380 0 L-380 -30 L-340 -55 L-220 -60 L-110 -55 L0 -60 L110 -55 L220 -60 L340 -55 L380 -30 L380 0 Z" fill="#c8b888"/>
    <!-- 桥栏(白色) -->
    <rect x="-380" y="-42" width="760" height="8" fill="#f0ece0"/>
    <g fill="#f0ece0">
      <rect x="-360" y="-72" width="6" height="30"/>
      <rect x="-300" y="-72" width="6" height="30"/>
      <rect x="-240" y="-72" width="6" height="30"/>
      <rect x="-180" y="-72" width="6" height="30"/>
      <rect x="-120" y="-72" width="6" height="30"/>
      <rect x="-60" y="-72" width="6" height="30"/>
      <rect x="0" y="-72" width="6" height="30"/>
      <rect x="60" y="-72" width="6" height="30"/>
      <rect x="120" y="-72" width="6" height="30"/>
      <rect x="180" y="-72" width="6" height="30"/>
      <rect x="240" y="-72" width="6" height="30"/>
      <rect x="300" y="-72" width="6" height="30"/>
      <rect x="354" y="-72" width="6" height="30"/>
    </g>
    <!-- 桥洞(5孔) -->
    <g>
      <ellipse cx="-280" cy="20" rx="42" ry="22" fill="#5a8080"/>
      <ellipse cx="-140" cy="20" rx="42" ry="22" fill="#5a8080"/>
      <ellipse cx="0" cy="20" rx="52" ry="28" fill="#5a8080"/>
      <ellipse cx="140" cy="20" rx="42" ry="22" fill="#5a8080"/>
      <ellipse cx="280" cy="20" rx="42" ry="22" fill="#5a8080"/>
    </g>
  </g>

  <!-- 亭台(中后,六角攒尖) -->
  <g transform="translate(960, 440)">
    <rect x="-70" y="60" width="140" height="40" fill="#c8a888"/>
    <rect x="-75" y="56" width="150" height="8" fill="#a48868"/>
    <rect x="-55" y="-50" width="6" height="110" fill="#a4243b"/>
    <rect x="49" y="-50" width="6" height="110" fill="#a4243b"/>
    <rect x="-3" y="-50" width="6" height="110" fill="#a4243b"/>
    <path d="M-80 -50 Q-55 -110 0 -130 Q55 -110 80 -50 Z" fill="url(#tile3)"/>
    <path d="M-80 -50 L0 -130 L80 -50" fill="none" stroke="#5a3818" stroke-width="2"/>
    <rect x="-4" y="-140" width="8" height="14" fill="#a4243b"/>
    <circle cx="0" cy="-142" r="3" fill="#fcd34d"/>
  </g>

  <!-- 湖面波纹 -->
  <g opacity="0.45" stroke="#fff" fill="none">
    <path d="M0 700 Q200 695 400 700" stroke-width="1.5"/>
    <path d="M200 740 Q400 735 600 740" stroke-width="1.2"/>
    <path d="M1200 740 Q1400 735 1600 740" stroke-width="1.2"/>
    <path d="M0 800 Q300 795 600 800" stroke-width="1.5"/>
    <path d="M1100 810 Q1400 805 1700 810" stroke-width="1.5"/>
    <path d="M300 860 Q600 855 900 860" stroke-width="1.2"/>
    <path d="M1000 870 Q1300 865 1600 870" stroke-width="1.2"/>
    <path d="M0 930 Q400 925 800 930" stroke-width="1.5"/>
    <path d="M1200 940 Q1600 935 1920 940" stroke-width="1.5"/>
    <path d="M0 1000 Q500 995 1000 1000" stroke-width="1.2"/>
    <path d="M1200 1010 Q1600 1005 1920 1010" stroke-width="1.2"/>
  </g>

  <!-- 垂柳(左前) -->
  <g transform="translate(180, 0)">
    <path d="M0 0 L-5 700" stroke="#5a3818" stroke-width="12" fill="none"/>
    <g stroke="url(#willow3)" stroke-width="2.5" fill="none" opacity="0.95">
      <path d="M0 0 Q-30 60 -50 130 Q-60 200 -70 280"/>
      <path d="M0 0 Q-15 50 -30 120 Q-40 190 -50 280"/>
      <path d="M0 0 Q5 60 10 130 Q15 200 20 280"/>
      <path d="M0 0 Q-45 70 -80 150 Q-100 230 -120 320"/>
      <path d="M0 0 Q30 60 50 130 Q60 200 70 280"/>
      <path d="M0 0 Q15 50 25 120 Q30 190 35 280"/>
    </g>
    <g fill="#7aa868" opacity="0.85">
      <ellipse cx="-50" cy="130" rx="2.5" ry="8"/>
      <ellipse cx="-30" cy="120" rx="2.5" ry="8"/>
      <ellipse cx="10" cy="130" rx="2.5" ry="8"/>
      <ellipse cx="50" cy="130" rx="2.5" ry="8"/>
      <ellipse cx="-60" cy="190" rx="2.5" ry="8"/>
      <ellipse cx="-40" cy="180" rx="2.5" ry="8"/>
      <ellipse cx="20" cy="190" rx="2.5" ry="8"/>
      <ellipse cx="60" cy="190" rx="2.5" ry="8"/>
      <ellipse cx="-70" cy="280" rx="2.5" ry="8"/>
      <ellipse cx="-50" cy="280" rx="2.5" ry="8"/>
      <ellipse cx="20" cy="280" rx="2.5" ry="8"/>
      <ellipse cx="70" cy="280" rx="2.5" ry="8"/>
    </g>
  </g>

  <!-- 垂柳(右前) -->
  <g transform="translate(1740, 0)">
    <path d="M0 0 L5 700" stroke="#5a3818" stroke-width="12" fill="none"/>
    <g stroke="url(#willow3)" stroke-width="2.5" fill="none" opacity="0.95">
      <path d="M0 0 Q30 60 50 130 Q60 200 70 280"/>
      <path d="M0 0 Q15 50 30 120 Q40 190 50 280"/>
      <path d="M0 0 Q-5 60 -10 130 Q-15 200 -20 280"/>
      <path d="M0 0 Q45 70 80 150 Q100 230 120 320"/>
    </g>
    <g fill="#7aa868" opacity="0.85">
      <ellipse cx="50" cy="130" rx="2.5" ry="8"/>
      <ellipse cx="30" cy="120" rx="2.5" ry="8"/>
      <ellipse cx="-10" cy="130" rx="2.5" ry="8"/>
      <ellipse cx="-50" cy="130" rx="2.5" ry="8"/>
      <ellipse cx="60" cy="190" rx="2.5" ry="8"/>
      <ellipse cx="40" cy="180" rx="2.5" ry="8"/>
      <ellipse cx="-20" cy="190" rx="2.5" ry="8"/>
      <ellipse cx="-60" cy="190" rx="2.5" ry="8"/>
      <ellipse cx="70" cy="280" rx="2.5" ry="8"/>
      <ellipse cx="50" cy="280" rx="2.5" ry="8"/>
      <ellipse cx="-20" cy="280" rx="2.5" ry="8"/>
      <ellipse cx="-70" cy="280" rx="2.5" ry="8"/>
    </g>
  </g>

  <!-- 前景:芦苇 -->
  <g>
    <line x1="450" y1="950" x2="455" y2="850" stroke="#7a9050" stroke-width="2"/>
    <ellipse cx="455" cy="850" rx="3" ry="14" fill="#a4a468"/>
    <line x1="480" y1="950" x2="485" y2="870" stroke="#7a9050" stroke-width="2"/>
    <ellipse cx="485" cy="870" rx="3" ry="12" fill="#a4a468"/>
    <line x1="510" y1="950" x2="515" y2="860" stroke="#7a9050" stroke-width="2"/>
    <ellipse cx="515" cy="860" rx="3" ry="13" fill="#a4a468"/>
    <line x1="1430" y1="960" x2="1435" y2="850" stroke="#7a9050" stroke-width="2"/>
    <ellipse cx="1435" cy="850" rx="3" ry="14" fill="#a4a468"/>
    <line x1="1460" y1="960" x2="1465" y2="880" stroke="#7a9050" stroke-width="2"/>
    <ellipse cx="1465" cy="880" rx="3" ry="12" fill="#a4a468"/>
    <line x1="1490" y1="960" x2="1495" y2="870" stroke="#7a9050" stroke-width="2"/>
    <ellipse cx="1495" cy="870" rx="3" ry="13" fill="#a4a468"/>
  </g>
</svg>'''

# ============================================================
# 4. Q版男帝 - 帝冕(12旒)+黄袍+双手持玉玺"中国"
# ============================================================
emperor_male_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <defs>
    <linearGradient id="m_robe" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fcd34d"/>
      <stop offset="0.5" stop-color="#f0b030"/>
      <stop offset="1" stop-color="#c88818"/>
    </linearGradient>
    <linearGradient id="m_robeInner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a4243b"/>
      <stop offset="1" stop-color="#6b1422"/>
    </linearGradient>
    <linearGradient id="m_crown" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a1a08"/>
      <stop offset="1" stop-color="#1a0a04"/>
    </linearGradient>
    <linearGradient id="m_crownTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fcd34d"/>
      <stop offset="1" stop-color="#a07018"/>
    </linearGradient>
    <linearGradient id="m_jade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b8e8c8"/>
      <stop offset="1" stop-color="#5a9870"/>
    </linearGradient>
    <radialGradient id="m_face" cx="0.5" cy="0.4" r="0.5">
      <stop offset="0" stop-color="#fde2c4"/>
      <stop offset="1" stop-color="#f5cba0"/>
    </radialGradient>
  </defs>

  <!-- 阴影 -->
  <ellipse cx="200" cy="478" rx="130" ry="10" fill="#000" opacity="0.2"/>

  <!-- 后摆龙袍(地) -->
  <path d="M50 470 Q30 380 100 350 L300 350 Q370 380 350 470 L340 480 L60 480 Z" fill="url(#m_robeInner)"/>

  <!-- 黄袍主体 -->
  <path d="M110 360 Q90 350 145 350 L255 350 Q310 350 290 360 L300 470 L100 470 Z" fill="url(#m_robe)"/>
  <!-- 黑色滚边 -->
  <path d="M105 358 Q88 348 145 348 L255 348 Q312 348 295 358" fill="none" stroke="#3a2010" stroke-width="4"/>
  <path d="M100 470 L300 470" stroke="#3a2010" stroke-width="6"/>
  <!-- 衣领交叉(朱红) -->
  <path d="M168 360 L200 380 L232 360 L232 380 L200 400 L168 380 Z" fill="url(#m_robeInner)"/>
  <!-- 玉带(金色宽带) -->
  <rect x="95" y="395" width="210" height="18" fill="#c8a45c"/>
  <rect x="95" y="395" width="210" height="3" fill="#8a6f3c"/>
  <rect x="95" y="410" width="210" height="3" fill="#8a6f3c"/>
  <!-- 玉带板(中央) -->
  <rect x="165" y="397" width="70" height="14" fill="url(#m_jade)"/>
  <text x="200" y="408" font-size="11" text-anchor="middle" fill="#1a1a1a" font-family="serif" font-weight="bold">龍</text>
  <!-- 龙纹底饰(对称,大面积) -->
  <g fill="#c88818" opacity="0.7">
    <path d="M135 430 Q145 415 155 425 Q165 440 155 450 Q145 455 135 450 Z"/>
    <path d="M265 430 Q255 415 245 425 Q235 440 245 450 Q255 455 265 450 Z"/>
  </g>
  <g fill="#a4243b" opacity="0.5">
    <text x="138" y="452" font-size="9" text-anchor="middle" fill="#a4243b" font-family="serif" font-weight="bold">龍</text>
    <text x="262" y="452" font-size="9" text-anchor="middle" fill="#a4243b" font-family="serif" font-weight="bold">龍</text>
  </g>
  <!-- 金色大龙纹(中央,垂至袍底) -->
  <g transform="translate(200, 450)">
    <path d="M-25 0 Q-30 -10 -20 -15 Q-10 -18 0 -15 Q10 -18 20 -15 Q30 -10 25 0 Q20 10 0 12 Q-20 10 -25 0" fill="none" stroke="#a07018" stroke-width="2"/>
    <path d="M-20 -5 Q-15 -10 -10 -8 Q-5 -10 0 -8 Q5 -10 10 -8 Q15 -10 20 -5" fill="none" stroke="#a07018" stroke-width="1.5"/>
  </g>

  <!-- 双手 -->
  <ellipse cx="158" cy="392" rx="15" ry="10" fill="url(#m_face)"/>
  <ellipse cx="242" cy="392" rx="15" ry="10" fill="url(#m_face)"/>

  <!-- 玉玺(双手捧) -->
  <g transform="translate(200, 382)">
    <!-- 印纽(交龙钮) -->
    <rect x="-18" y="-32" width="36" height="16" fill="url(#m_jade)"/>
    <path d="M-18 -32 Q-18 -50 0 -55 Q18 -50 18 -32" fill="url(#m_jade)"/>
    <ellipse cx="0" cy="-55" rx="10" ry="5" fill="url(#m_jade)"/>
    <ellipse cx="0" cy="-55" rx="4" ry="2" fill="#1a3a28"/>
    <!-- 印体(方) -->
    <rect x="-35" y="-16" width="70" height="22" fill="#d4b46c"/>
    <rect x="-35" y="-16" width="70" height="4" fill="#8a6f3c"/>
    <rect x="-35" y="2" width="70" height="4" fill="#8a6f3c"/>
    <!-- 印面"中国" -->
    <rect x="-30" y="-12" width="60" height="14" fill="#fcd34d" stroke="#a07018" stroke-width="1"/>
    <text x="0" y="-2" font-size="11" text-anchor="middle" fill="#a4243b" font-family="serif" font-weight="bold">中国</text>
  </g>

  <!-- 颈 -->
  <rect x="180" y="248" width="40" height="28" fill="#f5cba0"/>
  <!-- 领(朱红底) -->
  <path d="M168 350 L200 330 L232 350 L232 360 L168 360 Z" fill="url(#m_robeInner)" opacity="0.7"/>

  <!-- 头(脸) -->
  <circle cx="200" cy="200" r="78" fill="url(#m_face)"/>
  <!-- 耳朵 -->
  <ellipse cx="124" cy="205" rx="8" ry="14" fill="#f5cba0"/>
  <ellipse cx="276" cy="205" rx="8" ry="14" fill="#f5cba0"/>
  <path d="M122 205 Q124 201 128 201" fill="none" stroke="#d4a878" stroke-width="1.5"/>
  <path d="M278 205 Q276 201 272 201" fill="none" stroke="#d4a878" stroke-width="1.5"/>
  <!-- 耳坠 -->
  <circle cx="124" cy="223" r="3" fill="#fcd34d"/>
  <circle cx="276" cy="223" r="3" fill="#fcd34d"/>

  <!-- 发际线(中分,顶髻) -->
  <path d="M168 150 Q200 130 232 150" fill="#1a0a04"/>
  <path d="M160 155 Q175 145 195 145 Q200 152 200 168 Q200 152 205 145 Q225 145 240 155" fill="#1a0a04"/>
  <!-- 顶髻(帝冠底座) -->
  <ellipse cx="200" cy="125" rx="35" ry="20" fill="#1a0a04"/>

  <!-- 眉(剑眉) -->
  <path d="M165 183 Q180 175 192 180" stroke="#1a0a04" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M235 183 Q220 175 208 180" stroke="#1a0a04" stroke-width="3.5" fill="none" stroke-linecap="round"/>

  <!-- 眼(凤眼,Q版) -->
  <ellipse cx="178" cy="205" rx="9" ry="6" fill="#fff"/>
  <ellipse cx="222" cy="205" rx="9" ry="6" fill="#fff"/>
  <circle cx="179" cy="205" r="5" fill="#1a0a04"/>
  <circle cx="223" cy="205" r="5" fill="#1a0a04"/>
  <circle cx="180" cy="203" r="1.5" fill="#fff"/>
  <circle cx="224" cy="203" r="1.5" fill="#fff"/>
  <path d="M170 203 Q178 199 186 203" stroke="#1a0a04" stroke-width="1.5" fill="none"/>
  <path d="M214 203 Q222 199 230 203" stroke="#1a0a04" stroke-width="1.5" fill="none"/>

  <!-- 鼻(Q版小鼻) -->
  <path d="M198 220 Q200 226 202 220" stroke="#d4a878" stroke-width="1.5" fill="none"/>
  <ellipse cx="200" cy="225" rx="3" ry="2" fill="#e8a888" opacity="0.6"/>

  <!-- 嘴(微笑) -->
  <path d="M190 240 Q200 246 210 240" stroke="#a4243b" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M192 240 Q200 243 208 240" fill="#a4243b" opacity="0.5"/>

  <!-- 红晕 -->
  <ellipse cx="160" cy="225" rx="10" ry="6" fill="#f4a0a0" opacity="0.4"/>
  <ellipse cx="240" cy="225" rx="10" ry="6" fill="#f4a0a0" opacity="0.4"/>

  <!-- ============ 帝冕 ============ -->
  <!-- 冠顶长板(黑底金边) -->
  <rect x="125" y="100" width="150" height="16" fill="url(#m_crown)"/>
  <rect x="125" y="100" width="150" height="3" fill="#fcd34d"/>
  <rect x="125" y="113" width="150" height="3" fill="#a07018"/>
  <!-- 冠顶正脊"南"(向南) -->
  <text x="200" y="112" font-size="10" text-anchor="middle" fill="#fcd34d" font-family="serif" font-weight="bold">南</text>
  <!-- 冠顶两端翘起 -->
  <path d="M125 100 L115 95 L120 100 Z" fill="url(#m_crown)"/>
  <path d="M275 100 L285 95 L280 100 Z" fill="url(#m_crown)"/>
  <!-- 冠身(武,贴头) -->
  <path d="M135 116 L132 145 L268 145 L265 116 Z" fill="url(#m_crown)"/>
  <rect x="132" y="142" width="136" height="5" fill="#fcd34d"/>
  <!-- 冠身装饰(纵向条纹) -->
  <g stroke="#c8a45c" stroke-width="1" fill="none" opacity="0.7">
    <path d="M150 120 L150 140"/>
    <path d="M170 120 L170 140"/>
    <path d="M190 120 L190 140"/>
    <path d="M210 120 L210 140"/>
    <path d="M230 120 L230 140"/>
    <path d="M250 120 L250 140"/>
  </g>
  <!-- 玉簪(横贯) -->
  <rect x="95" y="135" width="210" height="4" fill="#c8a45c"/>
  <circle cx="95" cy="137" r="5" fill="url(#m_jade)"/>
  <circle cx="305" cy="137" r="5" fill="url(#m_jade)"/>
  <circle cx="95" cy="137" r="2" fill="#1a3a28"/>
  <circle cx="305" cy="137" r="2" fill="#1a3a28"/>

  <!-- 冕旒(前12旒+后12旒,各下垂3珠) -->
  <!-- 前12旒 -->
  <g>
    <line x1="135" y1="147" x2="135" y2="180" stroke="#c8a45c" stroke-width="0.8"/>
    <circle cx="135" cy="153" r="2" fill="#fcd34d"/>
    <circle cx="135" cy="162" r="2" fill="#a4243b"/>
    <circle cx="135" cy="171" r="2" fill="#fcd34d"/>
    <line x1="145" y1="147" x2="145" y2="180" stroke="#c8a45c" stroke-width="0.8"/>
    <circle cx="145" cy="153" r="2" fill="#a4243b"/>
    <circle cx="145" cy="162" r="2" fill="#fcd34d"/>
    <circle cx="145" cy="171" r="2" fill="#a4243b"/>
    <line x1="155" y1="147" x2="155" y2="180" stroke="#c8a45c" stroke-width="0.8"/>
    <circle cx="155" cy="153" r="2" fill="#fcd34d"/>
    <circle cx="155" cy="162" r="2" fill="#a4243b"/>
    <circle cx="155" cy="171" r="2" fill="#fcd34d"/>
    <line x1="165" y1="147" x2="165" y2="180" stroke="#c8a45c" stroke-width="0.8"/>
    <circle cx="165" cy="153" r="2" fill="#a4243b"/>
    <circle cx="165" cy="162" r="2" fill="#fcd34d"/>
    <circle cx="165" cy="171" r="2" fill="#a4243b"/>
    <line x1="175" y1="147" x2="175" y2="180" stroke="#c8a45c" stroke-width="0.8"/>
    <circle cx="175" cy="153" r="2" fill="#fcd34d"/>
    <circle cx="175" cy="162" r="2" fill="#a4243b"/>
    <circle cx="175" cy="171" r="2" fill="#fcd34d"/>
    <line x1="185" y1="147" x2="185" y2="180" stroke="#c8a45c" stroke-width="0.8"/>
    <circle cx="185" cy="153" r="2" fill="#a4243b"/>
    <circle cx="185" cy="162" r="2" fill="#fcd34d"/>
    <circle cx="185" cy="171" r="2" fill="#a4243b"/>
    <line x1="215" y1="147" x2="215" y2="180" stroke="#c8a45c" stroke-width="0.8"/>
    <circle cx="215" cy="153" r="2" fill="#fcd34d"/>
    <circle cx="215" cy="162" r="2" fill="#a4243b"/>
    <circle cx="215" cy="171" r="2" fill="#fcd34d"/>
    <line x1="225" y1="147" x2="225" y2="180" stroke="#c8a45c" stroke-width="0.8"/>
    <circle cx="225" cy="153" r="2" fill="#a4243b"/>
    <circle cx="225" cy="162" r="2" fill="#fcd34d"/>
    <circle cx="225" cy="171" r="2" fill="#a4243b"/>
    <line x1="235" y1="147" x2="235" y2="180" stroke="#c8a45c" stroke-width="0.8"/>
    <circle cx="235" cy="153" r="2" fill="#fcd34d"/>
    <circle cx="235" cy="162" r="2" fill="#a4243b"/>
    <circle cx="235" cy="171" r="2" fill="#fcd34d"/>
    <line x1="245" y1="147" x2="245" y2="180" stroke="#c8a45c" stroke-width="0.8"/>
    <circle cx="245" cy="153" r="2" fill="#a4243b"/>
    <circle cx="245" cy="162" r="2" fill="#fcd34d"/>
    <circle cx="245" cy="171" r="2" fill="#a4243b"/>
    <line x1="255" y1="147" x2="255" y2="180" stroke="#c8a45c" stroke-width="0.8"/>
    <circle cx="255" cy="153" r="2" fill="#fcd34d"/>
    <circle cx="255" cy="162" r="2" fill="#a4243b"/>
    <circle cx="255" cy="171" r="2" fill="#fcd34d"/>
    <line x1="265" y1="147" x2="265" y2="180" stroke="#c8a45c" stroke-width="0.8"/>
    <circle cx="265" cy="153" r="2" fill="#a4243b"/>
    <circle cx="265" cy="162" r="2" fill="#fcd34d"/>
    <circle cx="265" cy="171" r="2" fill="#a4243b"/>
  </g>

  <!-- 冠顶中心宝石 -->
  <ellipse cx="200" cy="93" rx="7" ry="4" fill="#a4243b"/>
  <ellipse cx="200" cy="92" rx="3" ry="2" fill="#fcd34d" opacity="0.8"/>
</svg>'''

# ============================================================
# 5. Q版女帝 - 凤冠(3扇屏)+黑红袍+持玉玺
# ============================================================
emperor_female_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <defs>
    <linearGradient id="f_robe" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a02030"/>
      <stop offset="0.5" stop-color="#6b1422"/>
      <stop offset="1" stop-color="#3a0810"/>
    </linearGradient>
    <linearGradient id="f_robeInner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fcd34d"/>
      <stop offset="1" stop-color="#c88818"/>
    </linearGradient>
    <linearGradient id="f_dress" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d8344a"/>
      <stop offset="1" stop-color="#8a1828"/>
    </linearGradient>
    <linearGradient id="f_crownGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fcd34d"/>
      <stop offset="1" stop-color="#a07018"/>
    </linearGradient>
    <linearGradient id="f_crownWing" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fcd34d"/>
      <stop offset="0.5" stop-color="#a4243b"/>
      <stop offset="1" stop-color="#fcd34d"/>
    </linearGradient>
    <linearGradient id="f_jade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b8e8c8"/>
      <stop offset="1" stop-color="#5a9870"/>
    </linearGradient>
    <radialGradient id="f_face" cx="0.5" cy="0.4" r="0.5">
      <stop offset="0" stop-color="#fde2c4"/>
      <stop offset="1" stop-color="#f5cba0"/>
    </radialGradient>
  </defs>

  <!-- 阴影 -->
  <ellipse cx="200" cy="478" rx="130" ry="10" fill="#000" opacity="0.2"/>

  <!-- 后摆(地) -->
  <path d="M50 470 Q30 380 100 350 L300 350 Q370 380 350 470 L340 480 L60 480 Z" fill="#1a0410"/>
  <!-- 内裙(红色,稍外露) -->
  <path d="M85 470 Q70 410 115 380 L285 380 Q330 410 315 470 L300 480 L100 480 Z" fill="url(#f_dress)"/>

  <!-- 黑袍主体(外袍) -->
  <path d="M110 360 Q90 350 145 350 L255 350 Q310 350 290 360 L300 470 L100 470 Z" fill="url(#f_robe)"/>
  <!-- 金色滚边 -->
  <path d="M105 358 Q88 348 145 348 L255 348 Q312 348 295 358" fill="none" stroke="#c8a45c" stroke-width="3"/>
  <path d="M100 470 L300 470" stroke="#c8a45c" stroke-width="4"/>
  <!-- 衣领(金色V领) -->
  <path d="M168 360 L200 380 L232 360 L232 380 L200 400 L168 380 Z" fill="url(#f_robeInner)"/>
  <!-- 衣身金色凤凰纹(对称) -->
  <g fill="#fcd34d" opacity="0.8">
    <!-- 左凤纹 -->
    <path d="M120 420 Q130 400 145 410 Q155 425 150 440 Q140 445 130 435 Q115 430 120 420 Z"/>
    <text x="135" y="445" font-size="9" text-anchor="middle" fill="#fcd34d" font-family="serif" font-weight="bold">鳳</text>
    <!-- 右凤纹 -->
    <path d="M280 420 Q270 400 255 410 Q245 425 250 440 Q260 445 270 435 Q285 430 280 420 Z"/>
    <text x="265" y="445" font-size="9" text-anchor="middle" fill="#fcd34d" font-family="serif" font-weight="bold">鳳</text>
  </g>
  <!-- 玉带(金色宽带) -->
  <rect x="95" y="395" width="210" height="18" fill="#c8a45c"/>
  <rect x="95" y="395" width="210" height="3" fill="#8a6f3c"/>
  <rect x="95" y="410" width="210" height="3" fill="#8a6f3c"/>
  <rect x="165" y="397" width="70" height="14" fill="url(#f_jade)"/>
  <text x="200" y="408" font-size="11" text-anchor="middle" fill="#1a1a1a" font-family="serif" font-weight="bold">鳳</text>

  <!-- 手(左,持玉玺) -->
  <ellipse cx="158" cy="392" rx="15" ry="10" fill="url(#f_face)"/>

  <!-- 玉玺(单手持,左) -->
  <g transform="translate(200, 382)">
    <rect x="-18" y="-32" width="36" height="16" fill="url(#f_jade)"/>
    <path d="M-18 -32 Q-18 -50 0 -55 Q18 -50 18 -32" fill="url(#f_jade)"/>
    <ellipse cx="0" cy="-55" rx="10" ry="5" fill="url(#f_jade)"/>
    <ellipse cx="0" cy="-55" rx="4" ry="2" fill="#1a3a28"/>
    <rect x="-35" y="-16" width="70" height="22" fill="#d4b46c"/>
    <rect x="-35" y="-16" width="70" height="4" fill="#8a6f3c"/>
    <rect x="-35" y="2" width="70" height="4" fill="#8a6f3c"/>
    <rect x="-30" y="-12" width="60" height="14" fill="#fcd34d" stroke="#a07018" stroke-width="1"/>
    <text x="0" y="-2" font-size="11" text-anchor="middle" fill="#a4243b" font-family="serif" font-weight="bold">中国</text>
  </g>

  <!-- 颈 -->
  <rect x="180" y="248" width="40" height="28" fill="#f5cba0"/>

  <!-- 头(脸) -->
  <circle cx="200" cy="200" r="78" fill="url(#f_face)"/>
  <!-- 耳朵 -->
  <ellipse cx="124" cy="205" rx="8" ry="14" fill="#f5cba0"/>
  <ellipse cx="276" cy="205" rx="8" ry="14" fill="#f5cba0"/>
  <path d="M122 205 Q124 201 128 201" fill="none" stroke="#d4a878" stroke-width="1.5"/>
  <path d="M278 205 Q276 201 272 201" fill="none" stroke="#d4a878" stroke-width="1.5"/>
  <!-- 长耳坠(金色链+红玉) -->
  <line x1="124" y1="217" x2="124" y2="232" stroke="#fcd34d" stroke-width="0.8"/>
  <circle cx="124" cy="236" r="5" fill="#a4243b"/>
  <line x1="276" y1="217" x2="276" y2="232" stroke="#fcd34d" stroke-width="0.8"/>
  <circle cx="276" cy="236" r="5" fill="#a4243b"/>

  <!-- 发(中分,两侧包耳,大发髻) -->
  <path d="M125 165 Q140 120 200 115 Q260 120 275 165 L275 210 Q265 230 250 210 L260 175 Q230 155 200 155 Q170 155 140 175 L150 210 Q135 230 125 210 Z" fill="#1a0a04"/>
  <!-- 刘海 -->
  <path d="M165 160 Q175 148 195 148 Q200 153 200 170 Q200 153 205 148 Q225 148 235 160 Q230 170 215 165 L210 180 Q200 170 200 180 Q200 170 190 180 L185 165 Q170 170 165 160 Z" fill="#1a0a04"/>
  <!-- 大发髻(高耸) -->
  <ellipse cx="200" cy="115" rx="40" ry="25" fill="#1a0a04"/>
  <!-- 发簪(竖) -->
  <line x1="200" y1="55" x2="200" y2="95" stroke="#fcd34d" stroke-width="2.5"/>
  <circle cx="200" cy="55" r="6" fill="#a4243b"/>
  <circle cx="200" cy="53" r="2.5" fill="#fcd34d"/>
  <!-- 簪花(红花) -->
  <g transform="translate(210, 70)">
    <ellipse cx="0" cy="0" rx="5" ry="4" fill="#a4243b"/>
    <circle cx="0" cy="0" r="2" fill="#fcd34d"/>
  </g>

  <!-- 眉(柳叶眉) -->
  <path d="M165 183 Q180 175 192 185" stroke="#1a0a04" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M235 183 Q220 175 208 185" stroke="#1a0a04" stroke-width="2.5" fill="none" stroke-linecap="round"/>

  <!-- 眼(大眼,Q版) -->
  <ellipse cx="178" cy="205" rx="11" ry="7" fill="#fff"/>
  <ellipse cx="222" cy="205" rx="11" ry="7" fill="#fff"/>
  <ellipse cx="180" cy="205" rx="6" ry="6.5" fill="#1a0a04"/>
  <ellipse cx="224" cy="205" rx="6" ry="6.5" fill="#1a0a04"/>
  <circle cx="181" cy="203" r="2" fill="#fff"/>
  <circle cx="225" cy="203" r="2" fill="#fff"/>
  <path d="M167 203 Q178 197 189 203" stroke="#1a0a04" stroke-width="1.5" fill="none"/>
  <path d="M211 203 Q222 197 233 203" stroke="#1a0a04" stroke-width="1.5" fill="none"/>
  <!-- 睫毛(细) -->
  <path d="M170 199 L168 196" stroke="#1a0a04" stroke-width="1"/>
  <path d="M186 199 L188 196" stroke="#1a0a04" stroke-width="1"/>
  <path d="M214 199 L212 196" stroke="#1a0a04" stroke-width="1"/>
  <path d="M230 199 L232 196" stroke="#1a0a04" stroke-width="1"/>

  <!-- 鼻(Q版) -->
  <path d="M198 220 Q200 226 202 220" stroke="#d4a878" stroke-width="1.5" fill="none"/>
  <ellipse cx="200" cy="225" rx="3" ry="2" fill="#e8a888" opacity="0.6"/>

  <!-- 嘴(微笑,小) -->
  <path d="M191 240 Q200 246 209 240" stroke="#a4243b" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M194 241 Q200 244 206 241" fill="#a4243b" opacity="0.6"/>

  <!-- 红晕(明显) -->
  <ellipse cx="160" cy="225" rx="12" ry="7" fill="#f4a0a0" opacity="0.55"/>
  <ellipse cx="240" cy="225" rx="12" ry="7" fill="#f4a0a0" opacity="0.55"/>

  <!-- ============ 凤冠 ============ -->
  <!-- 冠底(环形,贴头) -->
  <path d="M120 155 Q120 130 200 130 Q280 130 280 155 L275 170 Q200 162 125 170 Z" fill="url(#f_crownGold)"/>
  <rect x="120" y="152" width="160" height="6" fill="#a07018"/>
  <!-- 冠底宝石 -->
  <g>
    <circle cx="135" cy="160" r="2" fill="#a4243b"/>
    <circle cx="155" cy="158" r="2" fill="#5a9870"/>
    <circle cx="175" cy="156" r="2" fill="#a4243b"/>
    <circle cx="195" cy="155" r="2" fill="#5a9870"/>
    <circle cx="215" cy="155" r="2" fill="#a4243b"/>
    <circle cx="235" cy="156" r="2" fill="#5a9870"/>
    <circle cx="255" cy="158" r="2" fill="#a4243b"/>
    <circle cx="270" cy="160" r="2" fill="#5a9870"/>
  </g>
  <!-- 凤冠主体(3扇屏风) -->
  <path d="M130 130 L130 90 L160 65 L160 130 Z" fill="url(#f_crownWing)"/>
  <path d="M160 130 L160 50 L200 30 L240 50 L240 130 Z" fill="url(#f_crownWing)"/>
  <path d="M240 130 L240 65 L270 90 L270 130 Z" fill="url(#f_crownWing)"/>
  <!-- 屏风边框 -->
  <g stroke="#a07018" stroke-width="1.5" fill="none">
    <path d="M130 130 L130 90 L160 65 L160 130"/>
    <path d="M160 130 L160 50 L200 30 L240 50 L240 130"/>
    <path d="M240 130 L240 65 L270 90 L270 130"/>
  </g>
  <!-- 屏风装饰(凤凰) -->
  <g>
    <!-- 左扇小凤 -->
    <g transform="translate(145, 100)">
      <path d="M-7 0 Q-8 -4 -4 -6 Q0 -8 4 -6 Q8 -4 7 0 Q6 4 0 5 Q-6 4 -7 0" fill="#a4243b"/>
      <circle cx="-2" cy="-2" r="0.8" fill="#fcd34d"/>
      <circle cx="2" cy="-2" r="0.8" fill="#fcd34d"/>
      <path d="M-4 5 Q-8 10 -10 9" stroke="#a4243b" stroke-width="1.5" fill="none"/>
      <path d="M4 5 Q8 10 10 9" stroke="#a4243b" stroke-width="1.5" fill="none"/>
    </g>
    <!-- 右扇小凤 -->
    <g transform="translate(255, 100)">
      <path d="M-7 0 Q-8 -4 -4 -6 Q0 -8 4 -6 Q8 -4 7 0 Q6 4 0 5 Q-6 4 -7 0" fill="#a4243b"/>
      <circle cx="-2" cy="-2" r="0.8" fill="#fcd34d"/>
      <circle cx="2" cy="-2" r="0.8" fill="#fcd34d"/>
      <path d="M-4 5 Q-8 10 -10 9" stroke="#a4243b" stroke-width="1.5" fill="none"/>
      <path d="M4 5 Q8 10 10 9" stroke="#a4243b" stroke-width="1.5" fill="none"/>
    </g>
  </g>
  <!-- 凤凰(中扇,主凤) -->
  <g transform="translate(200, 80)">
    <path d="M-12 0 Q-15 -6 -10 -10 Q-5 -12 0 -10 Q5 -12 10 -10 Q15 -6 12 0 Q10 6 0 7 Q-10 6 -12 0" fill="#a4243b"/>
    <!-- 凤眼 -->
    <circle cx="-4" cy="-3" r="1.2" fill="#fcd34d"/>
    <circle cx="4" cy="-3" r="1.2" fill="#fcd34d"/>
    <!-- 凤嘴 -->
    <path d="M-15 0 L-19 -2 L-15 1 Z" fill="#fcd34d"/>
    <!-- 凤冠羽(3根) -->
    <path d="M-3 -10 Q-5 -16 -8 -18" stroke="#a4243b" stroke-width="2" fill="none"/>
    <path d="M0 -12 Q0 -18 -2 -20" stroke="#a4243b" stroke-width="2" fill="none"/>
    <path d="M3 -10 Q5 -16 8 -18" stroke="#a4243b" stroke-width="2" fill="none"/>
    <circle cx="-8" cy="-18" r="1.5" fill="#a4243b"/>
    <circle cx="-2" cy="-20" r="1.5" fill="#a4243b"/>
    <circle cx="8" cy="-18" r="1.5" fill="#a4243b"/>
    <!-- 凤尾(3羽,长) -->
    <path d="M-8 7 Q-18 18 -25 16" stroke="#a4243b" stroke-width="2" fill="none"/>
    <path d="M-3 7 Q-8 22 -12 28" stroke="#a4243b" stroke-width="2" fill="none"/>
    <path d="M0 7 Q0 24 -3 30" stroke="#a4243b" stroke-width="2" fill="none"/>
    <path d="M3 7 Q8 22 12 28" stroke="#a4243b" stroke-width="2" fill="none"/>
    <path d="M8 7 Q18 18 25 16" stroke="#a4243b" stroke-width="2" fill="none"/>
    <ellipse cx="-25" cy="16" rx="3" ry="5" fill="#a4243b"/>
    <ellipse cx="-12" cy="28" rx="3" ry="5" fill="#a4243b"/>
    <ellipse cx="12" cy="28" rx="3" ry="5" fill="#a4243b"/>
    <ellipse cx="25" cy="16" rx="3" ry="5" fill="#a4243b"/>
  </g>
  <!-- 凤冠中央宝顶 -->
  <ellipse cx="200" cy="30" rx="9" ry="7" fill="#a4243b"/>
  <ellipse cx="200" cy="28" rx="4" ry="3" fill="#fcd34d"/>
  <!-- 宝顶上方三珠(凤翎) -->
  <line x1="200" y1="22" x2="200" y2="14" stroke="#fcd34d" stroke-width="1"/>
  <circle cx="200" cy="13" r="2.5" fill="#a4243b"/>
  <line x1="195" y1="24" x2="190" y2="18" stroke="#fcd34d" stroke-width="0.8"/>
  <circle cx="189" cy="17" r="2" fill="#5a9870"/>
  <line x1="205" y1="24" x2="210" y2="18" stroke="#fcd34d" stroke-width="0.8"/>
  <circle cx="211" cy="17" r="2" fill="#5a9870"/>
  <!-- 两侧垂珠流苏 -->
  <g>
    <line x1="125" y1="170" x2="125" y2="195" stroke="#fcd34d" stroke-width="0.8"/>
    <circle cx="125" cy="178" r="1.8" fill="#a4243b"/>
    <circle cx="125" cy="187" r="1.8" fill="#fcd34d"/>
    <circle cx="125" cy="195" r="2" fill="#a4243b"/>
    <line x1="275" y1="170" x2="275" y2="195" stroke="#fcd34d" stroke-width="0.8"/>
    <circle cx="275" cy="178" r="1.8" fill="#a4243b"/>
    <circle cx="275" cy="187" r="1.8" fill="#fcd34d"/>
    <circle cx="275" cy="195" r="2" fill="#a4243b"/>
  </g>
</svg>'''


def main():
    os.makedirs(DEST, exist_ok=True)
    files = [
        ('bg-qianqing.svg', bg_qianqing),
        ('bg-yuhuayuan.svg', bg_yuhuayuan),
        ('bg-yuanmingyuan.svg', bg_yuanmingyuan),
        ('emperor-male.svg', emperor_male_svg),
        ('emperor-female.svg', emperor_female_svg),
    ]
    for filename, content in files:
        path = os.path.join(DEST, filename)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        size = os.path.getsize(path)
        print(f'✓ {filename}: {size} bytes')


if __name__ == '__main__':
    main()
