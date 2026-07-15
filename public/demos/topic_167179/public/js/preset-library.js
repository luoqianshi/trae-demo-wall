/* ============================================================
   preset-library.js — 包装预设库（前端）
   提供每类 5 个预设的名称、适用场景和简单预览渲染
   ============================================================ */

const PresetLibrary = (() => {
  'use strict';

  const accentColor = (theme) => theme === 'blue' ? '#3b82f6' : '#f59e0b';
  const textColor = 'var(--color-ink-primary)';
  const mutedColor = 'var(--color-ink-muted)';

  function renderDataCardPreview(presetKey, params, theme) {
    const c = accentColor(theme);
    const displayText = params.displayText || '';
    const number = params.number || displayText || params.mainText || '30';
    const unit = params.unit || '';
    const sub = params.subText || (params.source ? params.source.slice(0, 12) : '');

    switch (presetKey) {
      case 'compare':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="display:flex;align-items:center;gap:24px;width:90%;">
              <div style="text-align:center;flex:1;">
                <div style="font-size:2rem;font-weight:800;color:${c};">${number}${unit}</div>
                <div style="font-size:0.7rem;color:${mutedColor};">本期</div>
              </div>
              <div style="width:1px;height:60px;background:${mutedColor};"></div>
              <div style="text-align:center;flex:1;">
                <div style="font-size:2rem;font-weight:800;color:${mutedColor};">--</div>
                <div style="font-size:0.7rem;color:${mutedColor};">对比</div>
              </div>
            </div>
          </div>`;
      case 'trend':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="text-align:center;">
              <div style="font-size:1rem;color:${c};margin-bottom:8px;">▲ 上升</div>
              <div style="font-size:2.5rem;font-weight:900;color:${textColor};">${number}${unit}</div>
              <div style="font-size:0.8rem;color:${mutedColor};">${sub}</div>
            </div>
          </div>`;
      case 'ring':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="position:relative;width:120px;height:120px;border-radius:50%;border:10px solid ${c};border-right-color:transparent;display:flex;align-items:center;justify-content:center;">
              <div style="text-align:center;">
                <div style="font-size:1.8rem;font-weight:900;color:${textColor};">${number}${unit}</div>
              </div>
            </div>
          </div>`;
      case 'tag':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="display:inline-flex;align-items:baseline;gap:6px;background:${c}20;border:1px solid ${c};border-radius:999px;padding:8px 20px;">
              <span style="font-size:1.4rem;font-weight:800;color:${c};">${number}</span>
              <span style="font-size:0.9rem;color:${textColor};">${unit}</span>
            </div>
          </div>`;
      case 'gold_single_stat':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:8%;">
            <div style="text-align:center;position:relative;">
              <div style="width:80px;height:80px;border-radius:50%;border:2px solid ${c};margin:0 auto 8px;opacity:0.4;box-shadow:0 0 16px ${c}40;"></div>
              <div style="font-size:2.8rem;font-weight:900;color:#fef3c7;text-shadow:-1px -1px 0 #78350f,1px 1px 0 #78350f,0 0 12px ${c}90;line-height:1;margin-bottom:6px;">${number}${unit}</div>
              <div style="font-size:0.8rem;color:${c};letter-spacing:2px;">${sub || '说明'}</div>
              <div style="position:absolute;top:-8px;right:-16px;color:${c};font-size:1rem;opacity:0.6;">✦</div>
            </div>
          </div>`;
      case 'gold_data_compare':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:8%;">
            <div style="display:flex;align-items:center;gap:16px;width:90%;">
              <div style="text-align:center;flex:1;background:${c}10;border-radius:12px;padding:12px 8px;">
                <div style="font-size:1.6rem;font-weight:900;color:#fef3c7;text-shadow:-1px -1px 0 #78350f,1px 1px 0 #78350f,0 0 10px ${c}80;">${number}${unit}</div>
              </div>
              <div style="color:${c};font-size:1.2rem;font-weight:700;">VS</div>
              <div style="text-align:center;flex:1;background:#3b82f610;border-radius:12px;padding:12px 8px;">
                <div style="font-size:1.6rem;font-weight:900;color:#dbeafe;text-shadow:-1px -1px 0 #1e3a8a,1px 1px 0 #1e3a8a,0 0 10px #3b82f680;">${params.textRight || '--'}</div>
              </div>
            </div>
          </div>`;
      case 'gold_trend_ratio':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:8%;">
            <div style="text-align:center;">
              <div style="width:60px;height:60px;border-radius:50%;border:6px solid ${c};border-right-color:transparent;margin:0 auto 8px;"></div>
              <div style="font-size:1rem;color:#22c55e;margin-bottom:4px;">↑ 上升</div>
              <div style="font-size:2.2rem;font-weight:900;color:#fef3c7;text-shadow:-1px -1px 0 #78350f,1px 1px 0 #78350f,0 0 12px ${c}90;">${number}${unit}</div>
              <div style="font-size:0.8rem;color:${c};margin-top:4px;">${sub || '较上期'}</div>
            </div>
          </div>`;
      case 'gold_data_to_conclusion':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:6%;">
            <div style="text-align:center;position:relative;">
              <div style="font-size:1.8rem;font-weight:900;color:#fef3c7;text-shadow:-1px -1px 0 #78350f,1px 1px 0 #78350f,0 0 12px ${c}90;margin-bottom:6px;">${params.textResult || displayText || '结论'}</div>
              <div style="display:flex;gap:12px;justify-content:center;margin-top:8px;">
                <div style="font-size:0.9rem;color:${c};background:${c}15;padding:4px 10px;border-radius:8px;">${number}${unit}</div>
                <div style="font-size:0.9rem;color:#3b82f6;background:#3b82f615;padding:4px 10px;border-radius:8px;">${params.textRight || '--'}</div>
              </div>
              <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);width:60px;height:60px;border-radius:50%;border:2px solid ${c};opacity:0.3;"></div>
            </div>
          </div>`;
      case 'classic':
      default:
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="text-align:center;">
              <div style="font-size:3rem;font-weight:900;color:${c};line-height:1;margin-bottom:8px;">${number}<span style="font-size:1.5rem;">${unit}</span></div>
              <div style="font-size:0.9rem;color:${mutedColor};">${sub}</div>
            </div>
          </div>`;
    }
  }

  function renderQuotePreview(presetKey, params, theme) {
    const c = accentColor(theme);
    const text = params.displayText || params.quoteText || params.mainText || '核心观点引用';
    const shortText = text.length > 18 ? text.slice(0, 18) + '…' : text;
    const source = params.source || params.subText || '';

    switch (presetKey) {
      case 'center':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:12%;">
            <div style="text-align:center;">
              <div style="font-size:2rem;color:${c};margin-bottom:8px;">"</div>
              <div style="font-size:1.1rem;font-weight:700;color:${textColor};line-height:1.5;">${shortText}</div>
            </div>
          </div>`;
      case 'speaker':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="display:flex;align-items:center;gap:16px;width:90%;">
              <div style="width:48px;height:48px;border-radius:50%;background:${c}30;display:flex;align-items:center;justify-content:center;color:${c};font-weight:700;">人</div>
              <div>
                <div style="font-size:1rem;font-weight:700;color:${textColor};margin-bottom:4px;">${shortText}</div>
                <div style="font-size:0.75rem;color:${mutedColor};">${source || '发言人'}</div>
              </div>
            </div>
          </div>`;
      case 'bubble':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="position:relative;background:${c}15;border-radius:16px;padding:16px 20px;max-width:90%;">
              <div style="font-size:1rem;font-weight:700;color:${textColor};line-height:1.5;">${shortText}</div>
              <div style="position:absolute;bottom:-10px;left:24px;width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:10px solid ${c}15;"></div>
            </div>
          </div>`;
      case 'underline':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="text-align:center;max-width:90%;">
              <div style="font-size:1.3rem;font-weight:700;color:${textColor};line-height:1.5;margin-bottom:12px;">${shortText}</div>
              <div style="width:80px;height:4px;background:${c};margin:0 auto;border-radius:2px;"></div>
            </div>
          </div>`;
      case 'gold_quote_callout':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:8%;">
            <div style="display:flex;gap:12px;align-items:flex-start;max-width:95%;">
              <div style="width:4px;height:80px;background:linear-gradient(180deg,${c},transparent);border-radius:2px;flex-shrink:0;margin-top:4px;"></div>
              <div>
                <div style="font-family:Georgia,serif;font-size:1.6rem;color:${c};opacity:0.6;line-height:1;margin-bottom:2px;">"</div>
                <div style="font-size:1rem;font-weight:700;color:#fef3c7;text-shadow:-1px 0 0 #78350f,1px 0 0 #78350f,0 0 8px ${c}70;line-height:1.4;">${shortText}</div>
                <div style="font-size:0.7rem;color:${c};margin-top:6px;">——${source || '发言人'}</div>
              </div>
            </div>
          </div>`;
      case 'classic':
      default:
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="display:flex;gap:16px;align-items:center;max-width:90%;">
              <div style="width:4px;height:80px;background:${c};border-radius:2px;flex-shrink:0;"></div>
              <div>
                <div style="font-size:1.1rem;font-weight:700;color:${textColor};line-height:1.5;">${shortText}</div>
                <div style="font-size:0.75rem;color:${mutedColor};margin-top:4px;">${source}</div>
              </div>
            </div>
          </div>`;
    }
  }

  function renderTimelinePreview(presetKey, params, theme) {
    const c = accentColor(theme);
    const time = params.displayText || params.timeText || params.mainText || '时间';
    const text = params.displayText || (params.items && params.items[0] ? params.items[0].text : '');
    const shortText = text.length > 12 ? text.slice(0, 12) + '…' : text;

    switch (presetKey) {
      case 'dual':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="display:flex;align-items:center;gap:12px;width:90%;">
              <div style="text-align:center;flex:1;">
                <div style="font-size:0.8rem;color:${mutedColor};">过去</div>
                <div style="font-size:1.1rem;font-weight:700;color:${mutedColor};">--</div>
              </div>
              <div style="font-size:1.2rem;color:${c};">→</div>
              <div style="text-align:center;flex:1;">
                <div style="font-size:0.8rem;color:${c};">现在</div>
                <div style="font-size:1.1rem;font-weight:700;color:${textColor};">${time}</div>
              </div>
            </div>
          </div>`;
      case 'flow':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;">
              <div style="width:10px;height:10px;border-radius:50%;background:${c};"></div>
              <div style="flex:1;height:2px;background:${c};"></div>
              <div style="width:10px;height:10px;border-radius:50%;background:${c};"></div>
              <div style="flex:1;height:2px;background:${mutedColor};"></div>
              <div style="width:10px;height:10px;border-radius:50%;background:${mutedColor};"></div>
            </div>
          </div>`;
      case 'date_card':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="text-align:center;">
              <div style="font-size:2.2rem;font-weight:900;color:${c};line-height:1;">${time}</div>
              <div style="font-size:0.85rem;color:${textColor};margin-top:8px;">${shortText || '事件节点'}</div>
            </div>
          </div>`;
      case 'milestone':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="position:relative;width:100%;height:80px;">
              <div style="position:absolute;left:20%;top:20px;width:12px;height:12px;border-radius:50%;background:${c};"></div>
              <div style="position:absolute;left:20%;top:36px;font-size:0.75rem;color:${textColor};">${time}</div>
              <div style="position:absolute;left:60%;top:40px;width:12px;height:12px;border-radius:50%;background:${mutedColor};"></div>
              <div style="position:absolute;left:60%;top:56px;font-size:0.75rem;color:${mutedColor};">下一步</div>
              <div style="position:absolute;left:20%;right:20%;top:25px;height:2px;background:${mutedColor};"></div>
            </div>
          </div>`;
      case 'classic':
      default:
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="text-align:center;">
              <div style="width:16px;height:16px;border-radius:50%;background:${c};margin:0 auto 12px;"></div>
              <div style="font-size:1.2rem;font-weight:700;color:${c};">${time}</div>
              <div style="font-size:0.85rem;color:${textColor};margin-top:4px;">${shortText}</div>
            </div>
          </div>`;
    }
  }

  function renderTitlePreview(presetKey, params, theme) {
    const c = accentColor(theme);
    const title = params.displayText || params.titleText || params.mainText || '标题';
    const shortTitle = title.length > 14 ? title.slice(0, 14) + '…' : title;
    const sub = params.subText || '';

    switch (presetKey) {
      case 'subtitle':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="text-align:center;max-width:90%;">
              <div style="font-size:1.5rem;font-weight:900;color:${textColor};margin-bottom:8px;">${shortTitle}</div>
              <div style="font-size:0.85rem;color:${mutedColor};">${sub || '一句话副标题说明'}</div>
            </div>
          </div>`;
      case 'left_bar':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="display:flex;gap:16px;align-items:center;max-width:90%;">
              <div style="width:6px;height:70px;background:${c};border-radius:3px;flex-shrink:0;"></div>
              <div style="font-size:1.4rem;font-weight:800;color:${textColor};line-height:1.4;">${shortTitle}</div>
            </div>
          </div>`;
      case 'conclusion':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="text-align:center;max-width:90%;">
              <div style="font-size:0.85rem;color:${c};margin-bottom:8px;letter-spacing:2px;">结论</div>
              <div style="font-size:1.3rem;font-weight:800;color:${textColor};line-height:1.5;">${shortTitle}</div>
            </div>
          </div>`;
      case 'chapter':
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="display:flex;align-items:center;gap:12px;max-width:90%;">
              <div style="width:36px;height:36px;border-radius:50%;border:2px solid ${c};display:flex;align-items:center;justify-content:center;color:${c};font-weight:800;">1</div>
              <div style="font-size:1.3rem;font-weight:800;color:${textColor};">${shortTitle}</div>
            </div>
          </div>`;
      case 'classic':
      default:
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:10%;">
            <div style="text-align:center;max-width:90%;">
              <div style="font-size:1.6rem;font-weight:900;color:${c};letter-spacing:0.05em;line-height:1.3;">${shortTitle}</div>
            </div>
          </div>`;
    }
  }

  const previewRenderers = {
    data_card: renderDataCardPreview,
    quote_highlight: renderQuotePreview,
    timeline_node: renderTimelinePreview,
    title_card: renderTitlePreview,
    story_graphic: function(presetKey, params, theme) {
      const c = accentColor(theme);
      switch (presetKey) {
        case 'media_radar':
          return `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:8%;">
              <div style="text-align:center;">
                <div style="position:relative;width:120px;height:120px;margin:0 auto;">
                  <svg viewBox="0 0 120 120" width="120" height="120">
                    <polygon points="60,15 105,45 95,95 25,95 15,45" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.4"/>
                    <polygon points="60,30 90,50 85,85 35,85 30,50" fill="${c}20" stroke="${c}" stroke-width="1"/>
                  </svg>
                </div>
                <div style="font-size:0.8rem;color:${c};margin-top:8px;">8s 雷达图</div>
              </div>
            </div>`;
        case 'us_marketcap_race':
          return `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:8%;">
              <div style="text-align:center;width:90%;">
                <div style="display:flex;flex-direction:column;gap:6px;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:0.7rem;color:${c};width:24px;">#1</span>
                    <div style="flex:3;height:16px;background:${c};border-radius:3px;"></div>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:0.7rem;color:${c};width:24px;">#2</span>
                    <div style="flex:2;height:16px;background:${c}80;border-radius:3px;"></div>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:0.7rem;color:${c};width:24px;">#3</span>
                    <div style="flex:1.5;height:16px;background:${c}50;border-radius:3px;"></div>
                  </div>
                </div>
                <div style="font-size:0.8rem;color:${c};margin-top:8px;">15s 竞速动画</div>
              </div>
            </div>`;
        default:
          return '<div style="display:flex;align-items:center;justify-content:center;height:100%;">信息图</div>';
      }
    },
  };

  const presetMap = {
    data_card: [
      { id: 'data_card_v1', name: '大气数字', scene: '核心 KPI、关键指标，单个大数字加单位居中展示，视觉冲击强', presetKey: 'classic' },
      { id: 'data_card_v2', name: '对比卡片', scene: '同比环比、前后对比，两个数字左右并列，突出变化', presetKey: 'compare' },
      { id: 'data_card_v3', name: '趋势卡片', scene: '增长/下降数据，数字配箭头，强调趋势方向', presetKey: 'trend' },
      { id: 'data_card_v4', name: '环形进度', scene: '完成率、占比、进度类数据，环形图包裹数字', presetKey: 'ring' },
      { id: 'data_card_v5', name: '迷你标签', scene: '次要数据、辅助指标，小尺寸标签不抢主画面', presetKey: 'tag' },
      { id: 'single-stat', name: '★ 单一核心数据', scene: '金标准：突出展示一个核心数据，数字缩放弹入+光环扩散+星光', presetKey: 'gold_single_stat', isGoldStandard: true },
      { id: 'data-compare', name: '★ 双数据对比', scene: '金标准：左右对比两个数据，标签先后弹入+星光装饰', presetKey: 'gold_data_compare', isGoldStandard: true },
      { id: 'trend-ratio', name: '★ 趋势/比例数据', scene: '金标准：带趋势方向的数据展示，SVG圆环+箭头+数字弹出', presetKey: 'gold_trend_ratio', isGoldStandard: true },
      { id: 'data-to-conclusion', name: '★ 双数据到结论', scene: '金标准：两个数据铺垫→推出核心结论，三段式动画', presetKey: 'gold_data_to_conclusion', isGoldStandard: true },
    ],
    quote_highlight: [
      { id: 'quote_highlight_v1', name: '左线引用', scene: '标准引语高亮，左侧竖线强调，适合人物观点', presetKey: 'classic' },
      { id: 'quote_highlight_v2', name: '居中引用', scene: '短句金句居中展示，引号放大，适合传播性语录', presetKey: 'center' },
      { id: 'quote_highlight_v3', name: '说话人卡片', scene: '带发言人姓名/身份的引用，适合访谈、发布会', presetKey: 'speaker' },
      { id: 'quote_highlight_v4', name: '气泡引用', scene: '对话气泡样式，轻松活泼，适合新媒体、对话场景', presetKey: 'bubble' },
      { id: 'quote_highlight_v5', name: '下划线强调', scene: '底部粗线+引号，稳重正式，适合政策/专家观点', presetKey: 'underline' },
      { id: 'quote-callout', name: '★ 人物观点花字', scene: '金标准：高亮展示一句话观点，左侧竖线+引号+说话人跟随', presetKey: 'gold_quote_callout', isGoldStandard: true },
    ],
    timeline_node: [
      { id: 'timeline_node_v1', name: '单节点', scene: '单一时间点强调，如"2024年7月"、"本季度"', presetKey: 'classic' },
      { id: 'timeline_node_v2', name: '双节点对比', scene: '前后两个时间点并列，适合"过去 vs 现在"', presetKey: 'dual' },
      { id: 'timeline_node_v3', name: '流程轴', scene: '横向时间流程，适合多步骤发展过程', presetKey: 'flow' },
      { id: 'timeline_node_v4', name: '日期卡片', scene: '大日期+事件简述，适合新闻节点、发布日', presetKey: 'date_card' },
      { id: 'timeline_node_v5', name: '里程碑', scene: '上下交错里程碑，适合回顾、阶段性成果', presetKey: 'milestone' },
    ],
    title_card: [
      { id: 'title_card_v1', name: '大气标题', scene: '章节大标题，单句核心主题居中展示', presetKey: 'classic' },
      { id: 'title_card_v2', name: '副标题卡片', scene: '主标题+一句话副标题，适合段落导语', presetKey: 'subtitle' },
      { id: 'title_card_v3', name: '左线标题', scene: '左侧强调线+标题，新闻感强', presetKey: 'left_bar' },
      { id: 'title_card_v4', name: '结论卡片', scene: '段落结论、总结句，适合转折或收尾', presetKey: 'conclusion' },
      { id: 'title_card_v5', name: '章节标签', scene: '编号+小标题，适合分点论述、结构清晰', presetKey: 'chapter' },
    ],
    story_graphic: [
      { id: 'media_radar', name: '媒体雷达图', scene: '8秒全屏信息图，多维度话题雷达展示，需人工选用', presetKey: 'media_radar', isStoryGraphic: true },
      { id: 'us_marketcap_race', name: '市值竞速动画', scene: '15秒全屏信息图，动态柱状图排名变化，需人工选用', presetKey: 'us_marketcap_race', isStoryGraphic: true },
    ],
  };

  function getPresetsByType(type) {
    return presetMap[type] || [];
  }

  function getPreset(type, presetId) {
    return getPresetsByType(type).find(p => p.id === presetId);
  }

  function getPresetKey(type, presetId) {
    const preset = getPreset(type, presetId);
    return preset ? preset.presetKey : 'classic';
  }

  function renderPreview(type, presetId, params, theme) {
    const renderer = previewRenderers[type];
    if (!renderer) return '<div style="display:flex;align-items:center;justify-content:center;height:100%;">无预览</div>';
    const presetKey = getPresetKey(type, presetId);
    return renderer(presetKey, params || {}, theme || 'amber');
  }

  function getCategoryLabel(type) {
    const labels = {
      data_card: '数据卡',
      quote_highlight: '观点花字',
      timeline_node: '时间轴',
      title_card: '标题/结论卡',
      story_graphic: '故事图形',
    };
    return labels[type] || type;
  }

  return {
    getPresetsByType,
    getPreset,
    getPresetKey,
    renderPreview,
    getCategoryLabel,
    presetMap,
  };
})();

window.PresetLibrary = PresetLibrary;
