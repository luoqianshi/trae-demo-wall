// ============================================================
// TouchSee Scene Data — 6 个模拟场景的完整轨迹数据
// ============================================================
(function (global) {
  'use strict';

  var SCENES = [
    // ====== 场景 1: 十字路口过街 ======
    {
      id: 'crossroad',
      name: '十字路口过街',
      description: '高峰期过马路，车辆与行人交织',
      duration: 18,
      fps: 20,
      bgColor: '#0A1F2E',
      groundColor: '#1A2F3E',
      obstacles: [
        {
          id: 'OBS_C1', type: 'vehicle', label: '左转车辆',
          trajectory: [
            { t: 0.0, azimuth: -55, elevation: 0, distance: 5.5, confidence: 0.82 },
            { t: 3.0, azimuth: -40, elevation: 0, distance: 3.8, confidence: 0.89 },
            { t: 6.0, azimuth: -25, elevation: 0, distance: 2.2, confidence: 0.94 },
            { t: 8.0, azimuth: -15, elevation: 0, distance: 1.2, confidence: 0.97 },
            { t: 10.0, azimuth: -5, elevation: 0, distance: 2.0, confidence: 0.92 },
            { t: 13.0, azimuth: 10, elevation: 0, distance: 4.0, confidence: 0.85 },
            { t: 18.0, azimuth: 25, elevation: 0, distance: 6.0, confidence: 0.78 },
          ],
        },
        {
          id: 'OBS_C2', type: 'person', label: '对面行人',
          trajectory: [
            { t: 1.0, azimuth: 10, elevation: 0, distance: 5.0, confidence: 0.86 },
            { t: 4.0, azimuth: 8, elevation: 0, distance: 3.5, confidence: 0.91 },
            { t: 7.0, azimuth: 5, elevation: 0, distance: 2.0, confidence: 0.95 },
            { t: 9.0, azimuth: 3, elevation: 0, distance: 1.5, confidence: 0.97 },
            { t: 11.0, azimuth: -5, elevation: 0, distance: 2.5, confidence: 0.93 },
            { t: 14.0, azimuth: -15, elevation: 0, distance: 4.5, confidence: 0.87 },
            { t: 18.0, azimuth: -25, elevation: 0, distance: 6.0, confidence: 0.80 },
          ],
        },
        {
          id: 'OBS_C3', type: 'pole', label: '红绿灯柱',
          trajectory: [
            { t: 0.0, azimuth: 40, elevation: 15, distance: 4.0, confidence: 0.88 },
            { t: 9.0, azimuth: 45, elevation: 20, distance: 3.0, confidence: 0.90 },
            { t: 18.0, azimuth: 55, elevation: 25, distance: 4.5, confidence: 0.85 },
          ],
        },
      ],
    },

    // ====== 场景 2: 地铁站换乘 ======
    {
      id: 'subway_station',
      name: '地铁站换乘',
      description: '高峰期人流密集，含台阶与悬空指示牌',
      duration: 22,
      fps: 20,
      bgColor: '#0F1520',
      groundColor: '#1A1F2A',
      obstacles: [
        {
          id: 'OBS_S1', type: 'person', label: '迎面行人 A',
          trajectory: [
            { t: 0.0, azimuth: -20, elevation: 0, distance: 5.0, confidence: 0.84 },
            { t: 3.0, azimuth: -15, elevation: 0, distance: 3.2, confidence: 0.90 },
            { t: 5.5, azimuth: -10, elevation: 0, distance: 1.8, confidence: 0.95 },
            { t: 7.0, azimuth: -5, elevation: 0, distance: 1.0, confidence: 0.98 },
            { t: 9.0, azimuth: 5, elevation: 0, distance: 2.2, confidence: 0.92 },
            { t: 12.0, azimuth: 15, elevation: 0, distance: 4.5, confidence: 0.85 },
          ],
        },
        {
          id: 'OBS_S2', type: 'person', label: '侧方行人 B',
          trajectory: [
            { t: 2.0, azimuth: -60, elevation: 0, distance: 4.0, confidence: 0.80 },
            { t: 5.0, azimuth: -50, elevation: 0, distance: 2.5, confidence: 0.87 },
            { t: 8.0, azimuth: -40, elevation: 0, distance: 1.5, confidence: 0.93 },
            { t: 10.0, azimuth: -30, elevation: 0, distance: 2.0, confidence: 0.90 },
            { t: 14.0, azimuth: -10, elevation: 0, distance: 4.0, confidence: 0.84 },
          ],
        },
        {
          id: 'OBS_S3', type: 'stairs', label: '下行台阶',
          trajectory: [
            { t: 8.0, azimuth: 0, elevation: -25, distance: 4.0, confidence: 0.86 },
            { t: 12.0, azimuth: 0, elevation: -30, distance: 2.5, confidence: 0.92 },
            { t: 16.0, azimuth: 0, elevation: -35, distance: 1.5, confidence: 0.96 },
            { t: 20.0, azimuth: 0, elevation: -40, distance: 1.0, confidence: 0.98 },
            { t: 22.0, azimuth: 0, elevation: -40, distance: 1.2, confidence: 0.97 },
          ],
        },
        {
          id: 'OBS_S4', type: 'overhead', label: '悬空指示牌',
          trajectory: [
            { t: 5.0, azimuth: -10, elevation: 40, distance: 3.5, confidence: 0.83 },
            { t: 10.0, azimuth: 0, elevation: 45, distance: 2.5, confidence: 0.88 },
            { t: 15.0, azimuth: 10, elevation: 40, distance: 3.0, confidence: 0.85 },
          ],
        },
      ],
    },

    // ====== 场景 3: 办公楼走廊 ======
    {
      id: 'office_corridor',
      name: '办公楼走廊',
      description: '门框、迎面行人与墙角',
      duration: 16,
      fps: 20,
      bgColor: '#121820',
      groundColor: '#1E2530',
      obstacles: [
        {
          id: 'OBS_O1', type: 'doorframe', label: '办公室门框',
          trajectory: [
            { t: 0.0, azimuth: -5, elevation: 5, distance: 4.0, confidence: 0.87 },
            { t: 4.0, azimuth: -3, elevation: 5, distance: 2.5, confidence: 0.92 },
            { t: 7.0, azimuth: 0, elevation: 5, distance: 1.5, confidence: 0.96 },
            { t: 9.0, azimuth: 0, elevation: 5, distance: 1.0, confidence: 0.98 },
            { t: 11.0, azimuth: 3, elevation: 5, distance: 2.0, confidence: 0.93 },
            { t: 14.0, azimuth: 8, elevation: 5, distance: 4.0, confidence: 0.86 },
          ],
        },
        {
          id: 'OBS_O2', type: 'person', label: '同事迎面走来',
          trajectory: [
            { t: 3.0, azimuth: 15, elevation: 0, distance: 5.5, confidence: 0.82 },
            { t: 6.0, azimuth: 12, elevation: 0, distance: 3.5, confidence: 0.89 },
            { t: 9.0, azimuth: 8, elevation: 0, distance: 2.0, confidence: 0.94 },
            { t: 11.0, azimuth: 5, elevation: 0, distance: 1.2, confidence: 0.97 },
            { t: 13.0, azimuth: -5, elevation: 0, distance: 2.5, confidence: 0.91 },
            { t: 16.0, azimuth: -15, elevation: 0, distance: 5.0, confidence: 0.83 },
          ],
        },
        {
          id: 'OBS_O3', type: 'wall', label: '走廊墙角',
          trajectory: [
            { t: 8.0, azimuth: -45, elevation: 0, distance: 3.0, confidence: 0.85 },
            { t: 12.0, azimuth: -35, elevation: 0, distance: 2.0, confidence: 0.90 },
            { t: 16.0, azimuth: -25, elevation: 0, distance: 3.0, confidence: 0.86 },
          ],
        },
      ],
    },

    // ====== 场景 4: 户外公园步道 ======
    {
      id: 'park_trail',
      name: '户外公园步道',
      description: '路灯柱、蹲伏儿童与台阶',
      duration: 20,
      fps: 20,
      bgColor: '#0A1A14',
      groundColor: '#152018',
      obstacles: [
        {
          id: 'OBS_P1', type: 'pole', label: '路灯柱',
          trajectory: [
            { t: 0.0, azimuth: 30, elevation: 10, distance: 4.5, confidence: 0.84 },
            { t: 5.0, azimuth: 25, elevation: 10, distance: 3.0, confidence: 0.90 },
            { t: 9.0, azimuth: 20, elevation: 10, distance: 1.8, confidence: 0.95 },
            { t: 11.0, azimuth: 15, elevation: 10, distance: 1.2, confidence: 0.97 },
            { t: 14.0, azimuth: 5, elevation: 10, distance: 2.5, confidence: 0.91 },
            { t: 20.0, azimuth: -10, elevation: 10, distance: 5.0, confidence: 0.82 },
          ],
        },
        {
          id: 'OBS_P2', type: 'person', label: '蹲伏儿童',
          trajectory: [
            { t: 4.0, azimuth: -10, elevation: -15, distance: 4.0, confidence: 0.78 },
            { t: 7.0, azimuth: -8, elevation: -15, distance: 2.5, confidence: 0.85 },
            { t: 10.0, azimuth: -5, elevation: -15, distance: 1.5, confidence: 0.91 },
            { t: 12.0, azimuth: -3, elevation: -15, distance: 1.0, confidence: 0.95 },
            { t: 15.0, azimuth: 0, elevation: -15, distance: 2.0, confidence: 0.88 },
            { t: 20.0, azimuth: 10, elevation: -15, distance: 4.5, confidence: 0.80 },
          ],
        },
        {
          id: 'OBS_P3', type: 'stairs', label: '步道台阶',
          trajectory: [
            { t: 10.0, azimuth: 0, elevation: -20, distance: 3.5, confidence: 0.86 },
            { t: 14.0, azimuth: 0, elevation: -25, distance: 2.0, confidence: 0.92 },
            { t: 17.0, azimuth: 0, elevation: -30, distance: 1.2, confidence: 0.96 },
            { t: 20.0, azimuth: 0, elevation: -30, distance: 1.5, confidence: 0.94 },
          ],
        },
      ],
    },

    // ====== 场景 5: 商场入口 ======
    {
      id: 'mall_entrance',
      name: '商场入口',
      description: '玻璃门框、人群与展台',
      duration: 18,
      fps: 20,
      bgColor: '#15121A',
      groundColor: '#221E28',
      obstacles: [
        {
          id: 'OBS_M1', type: 'doorframe', label: '玻璃门框',
          trajectory: [
            { t: 0.0, azimuth: 0, elevation: 5, distance: 4.5, confidence: 0.85 },
            { t: 4.0, azimuth: 0, elevation: 5, distance: 3.0, confidence: 0.91 },
            { t: 8.0, azimuth: 0, elevation: 5, distance: 1.5, confidence: 0.96 },
            { t: 10.0, azimuth: 0, elevation: 5, distance: 1.0, confidence: 0.98 },
            { t: 13.0, azimuth: 0, elevation: 5, distance: 2.5, confidence: 0.92 },
            { t: 18.0, azimuth: 0, elevation: 5, distance: 5.0, confidence: 0.84 },
          ],
        },
        {
          id: 'OBS_M2', type: 'person', label: '人群 A',
          trajectory: [
            { t: 1.0, azimuth: -25, elevation: 0, distance: 4.0, confidence: 0.83 },
            { t: 4.0, azimuth: -20, elevation: 0, distance: 2.5, confidence: 0.89 },
            { t: 7.0, azimuth: -15, elevation: 0, distance: 1.5, confidence: 0.94 },
            { t: 10.0, azimuth: -10, elevation: 0, distance: 2.0, confidence: 0.91 },
            { t: 14.0, azimuth: -5, elevation: 0, distance: 4.0, confidence: 0.85 },
          ],
        },
        {
          id: 'OBS_M3', type: 'person', label: '人群 B',
          trajectory: [
            { t: 2.0, azimuth: 25, elevation: 0, distance: 4.5, confidence: 0.81 },
            { t: 5.0, azimuth: 20, elevation: 0, distance: 3.0, confidence: 0.87 },
            { t: 8.0, azimuth: 15, elevation: 0, distance: 1.8, confidence: 0.92 },
            { t: 11.0, azimuth: 10, elevation: 0, distance: 2.2, confidence: 0.89 },
            { t: 15.0, azimuth: 5, elevation: 0, distance: 4.5, confidence: 0.83 },
          ],
        },
        {
          id: 'OBS_M4', type: 'wall', label: '展台',
          trajectory: [
            { t: 6.0, azimuth: 40, elevation: -5, distance: 3.0, confidence: 0.84 },
            { t: 10.0, azimuth: 35, elevation: -5, distance: 2.0, confidence: 0.89 },
            { t: 14.0, azimuth: 30, elevation: -5, distance: 2.5, confidence: 0.86 },
          ],
        },
      ],
    },

    // ====== 场景 6: 夜间小巷 ======
    {
      id: 'night_alley',
      name: '夜间小巷',
      description: '电动车、垃圾桶与悬空空调外机',
      duration: 20,
      fps: 20,
      bgColor: '#050810',
      groundColor: '#0A1020',
      obstacles: [
        {
          id: 'OBS_N1', type: 'vehicle', label: '电动车',
          trajectory: [
            { t: 0.0, azimuth: -15, elevation: 0, distance: 5.5, confidence: 0.76 },
            { t: 3.0, azimuth: -10, elevation: 0, distance: 3.5, confidence: 0.84 },
            { t: 5.5, azimuth: -5, elevation: 0, distance: 2.0, confidence: 0.91 },
            { t: 7.0, azimuth: 0, elevation: 0, distance: 1.2, confidence: 0.95 },
            { t: 9.0, azimuth: 8, elevation: 0, distance: 2.5, confidence: 0.88 },
            { t: 13.0, azimuth: 20, elevation: 0, distance: 5.0, confidence: 0.78 },
            { t: 20.0, azimuth: 35, elevation: 0, distance: 6.0, confidence: 0.72 },
          ],
        },
        {
          id: 'OBS_N2', type: 'pole', label: '垃圾桶',
          trajectory: [
            { t: 2.0, azimuth: 35, elevation: -10, distance: 3.5, confidence: 0.79 },
            { t: 6.0, azimuth: 30, elevation: -10, distance: 2.0, confidence: 0.86 },
            { t: 9.0, azimuth: 25, elevation: -10, distance: 1.5, confidence: 0.90 },
            { t: 12.0, azimuth: 20, elevation: -10, distance: 2.5, confidence: 0.85 },
            { t: 16.0, azimuth: 15, elevation: -10, distance: 4.0, confidence: 0.80 },
          ],
        },
        {
          id: 'OBS_N3', type: 'overhead', label: '空调外机',
          trajectory: [
            { t: 5.0, azimuth: -10, elevation: 45, distance: 3.0, confidence: 0.81 },
            { t: 9.0, azimuth: -5, elevation: 50, distance: 2.0, confidence: 0.87 },
            { t: 12.0, azimuth: 0, elevation: 50, distance: 1.5, confidence: 0.92 },
            { t: 15.0, azimuth: 5, elevation: 45, distance: 2.5, confidence: 0.86 },
            { t: 20.0, azimuth: 15, elevation: 40, distance: 4.0, confidence: 0.80 },
          ],
        },
      ],
    },
  ];

  // ====== 障碍物颜色映射 (用于 Canvas 绘制) ======
  var OBSTACLE_COLORS = {
    person:    '#00D4FF',
    vehicle:   '#EF4444',
    stairs:    '#FBBF24',
    doorframe: '#10B981',
    overhead:  '#8B5CF6',
    wall:      '#F97316',
    pole:      '#06B6D4',
  };

  // ====== 障碍物图标 (用于 Canvas 绘制) ======
  var OBSTACLE_ICONS = {
    person:    'P',
    vehicle:   'V',
    stairs:    'S',
    doorframe: 'D',
    overhead:  'O',
    wall:      'W',
    pole:      'L',
  };

  global.TouchSee = global.TouchSee || {};
  global.TouchSee.Scenes = {
    SCENES: SCENES,
    OBSTACLE_COLORS: OBSTACLE_COLORS,
    OBSTACLE_ICONS: OBSTACLE_ICONS,
  };
})(window);
