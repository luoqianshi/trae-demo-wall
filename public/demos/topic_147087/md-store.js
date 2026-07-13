/* ============================================
 * 事刻 V0.3 — MD 解析器与序列化器
 * 纯原生 JavaScript，不依赖任何外部库
 * 提供 4 个全局函数：
 *   window.parseNodeMarkdown(mdString)
 *   window.parseTimelineMarkdown(mdString)
 *   window.serializeNode(nodeObj)
 *   window.serializeTimeline(timelineObj)
 * ============================================ */

(function (global) {
  'use strict';

  /* ----------------------------------------
   * YAML 子集解析器
   * 支持：string / number / boolean / null / 空值
   *       数组（[a,b,c] 行内 与 - item 多行）
   *       对象嵌套（key: value 子层）
   *       带引号字符串（"..." 与 '...'）
   * ---------------------------------------- */

  function parseYamlValue(raw) {
    if (raw === undefined) return null;
    var s = String(raw).trim();
    if (s === '') return null;

    // 带引号字符串
    if ((s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') ||
        (s.charAt(0) === "'" && s.charAt(s.length - 1) === "'")) {
      return s.slice(1, -1);
    }
    // null / 空
    if (s === 'null' || s === '~' || s === 'Null' || s === 'NULL') return null;
    // boolean
    if (s === 'true' || s === 'True' || s === 'TRUE') return true;
    if (s === 'false' || s === 'False' || s === 'FALSE') return false;
    // number
    if (/^-?\d+$/.test(s)) return parseInt(s, 10);
    if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
    // 行内数组 [a, b, c]
    if (s.charAt(0) === '[' && s.charAt(s.length - 1) === ']') {
      var inner = s.slice(1, -1).trim();
      if (inner === '') return [];
      return inner.split(',').map(function (item) {
        return parseYamlValue(item.trim());
      });
    }
    // 普通字符串
    return s;
  }

  // 解析 YAML 块为对象/数组。只支持 mapping（对象）顶层。
  function parseYamlBlock(yamlText) {
    var lines = yamlText.replace(/\r\n/g, '\n').split('\n');
    var result = {};
    var i = 0;

    function parseValueAtLine(line, lineIndex) {
      var colonIdx = line.indexOf(':');
      if (colonIdx === -1) return null;
      var key = line.slice(0, colonIdx).trim();
      var valRaw = line.slice(colonIdx + 1).trim();
      if (valRaw !== '') {
        // 行内值
        return { key: key, value: parseYamlValue(valRaw) };
      }
      // 值为空 → 看下一行是否缩进（数组或子对象）
      var child = {};
      var arr = [];
      var isArray = false;
      var isObject = false;
      var j = lineIndex + 1;
      while (j < lines.length) {
        var subLine = lines[j];
        if (subLine.trim() === '') { j++; continue; }
        // 缩进判断
        if (/^\s+/.test(subLine)) {
          var trimmed = subLine.trim();
          if (trimmed.charAt(0) === '-' && (trimmed.charAt(1) === ' ' || trimmed.length === 1)) {
            isArray = true;
            arr.push(parseYamlValue(trimmed.replace(/^-\s*/, '')));
            j++;
          } else if (/^-/.test(trimmed) && trimmed.length > 1) {
            // 可能是 -item 紧贴
            isArray = true;
            arr.push(parseYamlValue(trimmed.replace(/^-\s*/, '')));
            j++;
          } else {
            // 子对象 key: value
            isObject = true;
            var subColon = trimmed.indexOf(':');
            if (subColon !== -1) {
              var subKey = trimmed.slice(0, subColon).trim();
              var subVal = trimmed.slice(subColon + 1).trim();
              if (subVal !== '') {
                child[subKey] = parseYamlValue(subVal);
              } else {
                child[subKey] = [];
              }
            }
            j++;
          }
        } else {
          break;
        }
      }
      if (isArray) return { key: key, value: arr };
      if (isObject) return { key: key, value: child };
      return { key: key, value: null };
    }

    while (i < lines.length) {
      var line = lines[i];
      if (line.trim() === '') { i++; continue; }
      // 顶层必须是非缩进 key: value
      if (/^\s+/.test(line)) { i++; continue; }
      var parsed = parseValueAtLine(line, i);
      if (parsed) {
        result[parsed.key] = parsed.value;
      }
      i++;
    }
    return result;
  }

  /* ----------------------------------------
   * YAML 序列化（对象/值 → YAML 字符串）
   * ---------------------------------------- */

  function serializeYamlValue(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'string') {
      // 含特殊字符则加引号
      if (/[:\[\]\{\},#&\*!\|>'"%@`\-]/.test(val) || val === '' || val !== val.trim()) {
        return '"' + val.replace(/"/g, '\\"') + '"';
      }
      return val;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      return '[' + val.map(serializeYamlValue).join(', ') + ']';
    }
    if (typeof val === 'object') {
      // 行内对象（用于 tags 等）
      var keys = Object.keys(val);
      if (keys.length === 0) return '{}';
      var parts = keys.map(function (k) {
        return k + ': ' + serializeYamlValue(val[k]);
      });
      return '{ ' + parts.join(', ') + ' }';
    }
    return String(val);
  }

  // 序列化对象为 YAML 多行（顶层 mapping）
  function serializeYamlBlock(obj, fieldOrder) {
    var lines = [];
    var keys = fieldOrder || Object.keys(obj);
    keys.forEach(function (key) {
      var val = obj[key];
      if (val === null || val === undefined) {
        lines.push(key + ':');
        return;
      }
      if (Array.isArray(val)) {
        if (val.length === 0) {
          lines.push(key + ': []');
        } else {
          lines.push(key + ':');
          val.forEach(function (item) {
            lines.push('  - ' + serializeYamlValue(item));
          });
        }
        return;
      }
      if (typeof val === 'object' && !Array.isArray(val)) {
        // 嵌套对象，如 tags
        var subKeys = Object.keys(val);
        if (subKeys.length === 0) {
          lines.push(key + ': {}');
        } else {
          lines.push(key + ':');
          subKeys.forEach(function (sk) {
            var sv = val[sk];
            if (Array.isArray(sv)) {
              if (sv.length === 0) {
                lines.push('  ' + sk + ': []');
              } else {
                lines.push('  ' + sk + ': [' + sv.map(serializeYamlValue).join(', ') + ']');
              }
            } else {
              lines.push('  ' + sk + ': ' + serializeYamlValue(sv));
            }
          });
        }
        return;
      }
      // 标量
      lines.push(key + ': ' + serializeYamlValue(val));
    });
    return lines.join('\n');
  }

  /* ----------------------------------------
   * Frontmatter 提取与生成
   * ---------------------------------------- */

  function splitFrontmatter(mdString) {
    var str = String(mdString).replace(/\r\n/g, '\n');
    if (str.charAt(0) !== '-' || str.slice(0, 4) !== '---\n') {
      return { frontmatter: '', body: str };
    }
    var end = str.indexOf('\n---\n', 4);
    if (end === -1) {
      // 可能末尾就是 ---\n
      end = str.indexOf('\n---', 4);
      if (end === -1) return { frontmatter: '', body: str };
      return { frontmatter: str.slice(4, end), body: str.slice(end + 4).replace(/^\n/, '') };
    }
    return {
      frontmatter: str.slice(4, end),
      body: str.slice(end + 5)
    };
  }

  /* ----------------------------------------
   * parseNodeMarkdown
   * ---------------------------------------- */

  function parseNodeMarkdown(mdString) {
    var parts = splitFrontmatter(mdString);
    var fm = parseYamlBlock(parts.frontmatter);
    var body = parts.body.replace(/^\n+/, '').replace(/\s+$/, '');

    // 提取 note（> 引用块）
    var note = '';
    var summary = '';
    if (body) {
      var bodyLines = body.split('\n');
      var noteLines = [];
      var summaryLines = [];
      var inNote = false;
      for (var i = 0; i < bodyLines.length; i++) {
        var ln = bodyLines[i];
        if (/^>\s?/.test(ln)) {
          inNote = true;
          noteLines.push(ln.replace(/^>\s?/, ''));
        } else if (inNote && ln.trim() === '') {
          // 空行继续
          noteLines.push('');
        } else if (inNote && !/^>\s?/.test(ln) && ln.trim() !== '') {
          // 引用块结束
          inNote = false;
          summaryLines.push(ln);
        } else {
          summaryLines.push(ln);
        }
      }
      summary = summaryLines.join('\n').trim();
      note = noteLines.join('\n').replace(/\s+$/, '');
    }

    // 空值规范化：undefined / null → null，保留空字符串 ''
    function val(v, def) {
      if (v === undefined || v === null) return (def === undefined ? null : def);
      return v;
    }

    return {
      id: val(fm.id),
      type: val(fm.type, 'event'),
      title: val(fm.title, ''),
      startTime: val(fm.startTime),
      endTime: val(fm.endTime),
      importance: val(fm.importance, 'minor'),
      summary: summary,
      note: note,
      tags: fm.tags || {},
      source: val(fm.source, ''),
      aliases: fm.aliases || [],
      versionNumber: val(fm.versionNumber),
      versionTag: val(fm.versionTag),
      changelog: fm.changelog || [],
      createdAt: val(fm.createdAt, ''),
      updatedAt: val(fm.updatedAt, ''),
      createdBy: val(fm.createdBy, ''),
      status: val(fm.status, 'pending')
    };
  }

  /* ----------------------------------------
   * parseTimelineMarkdown
   * ---------------------------------------- */

  function parseTimelineMarkdown(mdString) {
    var parts = splitFrontmatter(mdString);
    var fm = parseYamlBlock(parts.frontmatter);
    var body = parts.body.replace(/^\n+/, '');

    var nodes = [];
    // 按 ### 拆分节点块
    var nodeBlockRegex = /^###\s+(.+?)$/gm;
    var matches = [];
    var m;
    while ((m = nodeBlockRegex.exec(body)) !== null) {
      matches.push({ start: m.index, header: m[1] });
    }
    for (var i = 0; i < matches.length; i++) {
      var header = matches[i].header;
      var contentStart = matches[i].start + matches[i].header.length + 4; // '### ' length
      var contentEnd = (i + 1 < matches.length) ? matches[i + 1].start : body.length;
      var blockContent = body.slice(contentStart, contentEnd).trim();

      // header 格式: {时间} · {标题}
      var headerParts = header.split('·');
      var time = headerParts[0] ? headerParts[0].trim() : '';
      var title = headerParts.slice(1).join('·').trim();

      // 解析块内的 - key: value 字段（列表项格式的 mapping）
      var nodeObj = parseListMapping(blockContent);
      var relations = [];
      if (Array.isArray(nodeObj.relations)) {
        for (var r = 0; r < nodeObj.relations.length; r++) {
          var relStr = String(nodeObj.relations[r]).trim();
          if (!relStr) continue;
          var parsed = parseRelation(relStr);
          if (parsed) relations.push(parsed);
        }
      }

      nodes.push({
        time: time,
        title: title,
        nodeId: nodeObj.node || null,
        importance: nodeObj.importance || 'minor',
        relations: relations
      });
    }

    return {
      id: fm.id || null,
      title: fm.title || '',
      description: fm.description || '',
      author: fm.author || '',
      visibility: fm.visibility || 'public',
      displayType: fm.displayType || 'standard',
      sortField: fm.sortField || 'time',
      sortOrder: fm.sortOrder || 'asc',
      icon: fm.icon || '',
      rating: fm.rating !== undefined ? fm.rating : 0,
      ratingCount: fm.ratingCount !== undefined ? fm.ratingCount : 0,
      createdAt: fm.createdAt || '',
      updatedAt: fm.updatedAt || '',
      status: fm.status || 'draft',
      nodes: nodes
    };
  }

  // 解析 "- key: value" 列表项格式的 mapping
  // 例如：
  //   - node: by-founding
  //   - importance: important
  //   - relations:
  //     - 导致 ← by-toutiao @ tl-bd-main
  function parseListMapping(text) {
    var result = {};
    var lines = text.replace(/\r\n/g, '\n').split('\n');
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (line.trim() === '') { i++; continue; }
      // 匹配 "- key: value" 或 "- key:" (后接子列表)
      var m = line.match(/^-\s+(\S[^:]*?):\s*(.*)$/);
      if (m) {
        var key = m[1].trim();
        var val = m[2].trim();
        if (val !== '') {
          // 行内值
          result[key] = parseYamlValue(val);
          // 检查是否有缩进的子列表（如 - 导致 → xxx @ tl-xxx）
          var subItems = [];
          var j = i + 1;
          while (j < lines.length) {
            var subLine = lines[j];
            if (subLine.trim() === '') { j++; continue; }
            if (/^\s+-\s/.test(subLine)) {
              subItems.push(subLine.replace(/^\s+-\s+/, '').trim());
              j++;
            } else {
              break;
            }
          }
          if (subItems.length > 0) {
            result['relations'] = subItems;
          }
        } else {
          // 值为空，检查下面是否有缩进的子列表（- item）
          var subItems = [];
          var j = i + 1;
          while (j < lines.length) {
            var subLine = lines[j];
            if (subLine.trim() === '') { j++; continue; }
            // 缩进 + "- " 开头
            if (/^\s+-\s/.test(subLine)) {
              subItems.push(subLine.replace(/^\s+-\s+/, '').trim());
              j++;
            } else {
              break;
            }
          }
          if (subItems.length > 0) {
            result[key] = subItems;
          } else {
            result[key] = null;
          }
        }
      }
      i++;
    }
    return result;
  }

  // 解析单条 relation 字符串
  // 格式: {关系名} {方向} {目标节点ID} @ {目标事件线ID}
  // 或:   {关系名} {方向} {目标节点ID}   (独立事件)
  function parseRelation(str) {
    var s = String(str).trim();
    if (!s) return null;

    // 方向 → 或 ←
    var direction = null;
    var dirIdx = -1;
    if (s.indexOf('→') !== -1) { direction = '→'; dirIdx = s.indexOf('→'); }
    else if (s.indexOf('←') !== -1) { direction = '←'; dirIdx = s.indexOf('←'); }
    else { return null; }

    var label = s.slice(0, dirIdx).trim();
    var rest = s.slice(dirIdx + 1).trim();

    // 检查 @
    var atIdx = rest.indexOf('@');
    var targetNodeId, targetTimelineId;
    if (atIdx !== -1) {
      targetNodeId = rest.slice(0, atIdx).trim();
      targetTimelineId = rest.slice(atIdx + 1).trim();
    } else {
      targetNodeId = rest.trim();
      targetTimelineId = null;
    }

    return {
      label: label,
      direction: direction,
      targetNodeId: targetNodeId,
      targetTimelineId: targetTimelineId
    };
  }

  /* ----------------------------------------
   * serializeNode
   * ---------------------------------------- */

  var NODE_FIELD_ORDER = [
    'id', 'type', 'title', 'startTime', 'endTime', 'importance',
    'tags', 'source', 'aliases', 'versionNumber', 'versionTag', 'changelog',
    'createdAt', 'updatedAt', 'createdBy', 'status'
  ];

  function serializeNode(nodeObj) {
    var fm = serializeYamlBlock(nodeObj, NODE_FIELD_ORDER);
    var body = '';
    if (nodeObj.summary) {
      body += nodeObj.summary;
    }
    if (nodeObj.note) {
      if (body) body += '\n\n';
      var noteLines = String(nodeObj.note).split('\n');
      for (var i = 0; i < noteLines.length; i++) {
        body += '> ' + noteLines[i] + '\n';
      }
      body = body.replace(/\n$/, '');
    }
    return '---\n' + fm + '\n---\n\n' + body + '\n';
  }

  /* ----------------------------------------
   * serializeTimeline
   * ---------------------------------------- */

  var TIMELINE_FIELD_ORDER = [
    'id', 'title', 'description', 'author', 'visibility',
    'displayType', 'sortField', 'sortOrder', 'icon',
    'rating', 'ratingCount', 'createdAt', 'updatedAt', 'status'
  ];

  function serializeTimeline(timelineObj) {
    var fm = serializeYamlBlock(timelineObj, TIMELINE_FIELD_ORDER);
    var body = '';
    if (timelineObj.description) {
      body += timelineObj.description + '\n\n';
    }
    body += '## 节点序列\n';

    if (Array.isArray(timelineObj.nodes)) {
      for (var i = 0; i < timelineObj.nodes.length; i++) {
        var n = timelineObj.nodes[i];
        body += '\n### ' + (n.time || '') + ' · ' + (n.title || '') + '\n';
        body += '- node: ' + (n.nodeId || '') + '\n';
        body += '- importance: ' + (n.importance || 'minor') + '\n';
        if (n.relations && n.relations.length > 0) {
          body += '- relations:\n';
          for (var r = 0; r < n.relations.length; r++) {
            var rel = n.relations[r];
            var line = '  - ' + rel.label + ' ' + rel.direction + ' ' + rel.targetNodeId;
            if (rel.targetTimelineId) {
              line += ' @ ' + rel.targetTimelineId;
            }
            body += line + '\n';
          }
        } else {
          body += '- relations:\n';
        }
      }
    }
    return '---\n' + fm + '\n---\n\n' + body;
  }

  /* ----------------------------------------
   * 挂载到全局
   * ---------------------------------------- */

  global.parseNodeMarkdown = parseNodeMarkdown;
  global.parseTimelineMarkdown = parseTimelineMarkdown;
  global.serializeNode = serializeNode;
  global.serializeTimeline = serializeTimeline;

  /* ----------------------------------------
   * 自测代码（控制台输出）
   * ---------------------------------------- */

  global.__mdStoreSelfTest = function () {
    console.log('=== md-store.js 自测开始 ===');

    // 测试 1：节点解析
    var nodeMd = '---\n' +
      'id: by-founding\n' +
      'type: event\n' +
      'title: 字节跳动公司成立\n' +
      'startTime: 2012-03-09\n' +
      'endTime:\n' +
      'importance: important\n' +
      'tags:\n' +
      '  person: [张一鸣]\n' +
      '  eventType: [创业]\n' +
      'source: 公开资料\n' +
      'aliases: []\n' +
      'versionNumber:\n' +
      'versionTag:\n' +
      'changelog: []\n' +
      'createdAt: 2026-06-24T00:00:00.000Z\n' +
      'updatedAt: 2026-06-24T00:00:00.000Z\n' +
      'createdBy: curator\n' +
      'status: approved\n' +
      '---\n\n' +
      '张一鸣在北京创立字节跳动，瞄准移动互联网与个性化信息分发。\n\n' +
      '> AI 基因在此刻种下——从一开始就没有编辑，只有算法。';

    var parsedNode = parseNodeMarkdown(nodeMd);
    console.log('T1.1 parseNodeMarkdown:', parsedNode);
    console.log('T1.1 summary:', parsedNode.summary);
    console.log('T1.1 note:', parsedNode.note);
    console.log('T1.1 tags:', parsedNode.tags);

    // 测试 2：节点序列化往返
    var serializedNode = serializeNode(parsedNode);
    var reparsedNode = parseNodeMarkdown(serializedNode);
    var nodeRoundtrip = JSON.stringify(parsedNode) === JSON.stringify(reparsedNode);
    console.log('T1.7 serializeNode 往返一致:', nodeRoundtrip);
    if (!nodeRoundtrip) {
      console.log('原始:', JSON.stringify(parsedNode));
      console.log('重解析:', JSON.stringify(reparsedNode));
    }

    // 测试 3：事件线解析
    var timelineMd = '---\n' +
      'id: tl-bd-main\n' +
      'title: 字节 AI 发展编年史\n' +
      'description: 从2012年公司成立至今。\n' +
      'author: curator\n' +
      'visibility: public\n' +
      'displayType: standard\n' +
      'sortField: time\n' +
      'sortOrder: asc\n' +
      'icon: 🎯\n' +
      'rating: 4.8\n' +
      'ratingCount: 12\n' +
      'createdAt: 2026-06-24T00:00:00.000Z\n' +
      'updatedAt: 2026-06-24T00:00:00.000Z\n' +
      'status: published\n' +
      '---\n\n' +
      '## 节点序列\n\n' +
      '### 2012-03-09 · 字节跳动公司成立\n' +
      '- node: by-founding\n' +
      '- importance: important\n' +
      '- relations:\n\n' +
      '### 2023-02-15 · Seed 团队成立\n' +
      '- node: by-seed\n' +
      '- importance: breakthrough\n' +
      '- relations:\n' +
      '  - 响应 ← by-chatgpt-shock @ tl-oa-gpt\n' +
      '  - 催生 → by-volc-ark @ tl-bd-main\n' +
      '  - 关联 → standalone-event-001\n';

    var parsedTimeline = parseTimelineMarkdown(timelineMd);
    console.log('T1.4 parseTimelineMarkdown:', parsedTimeline);
    console.log('T1.4 nodes 数量:', parsedTimeline.nodes.length);
    console.log('T1.4 第二个节点的 relations:', parsedTimeline.nodes[1].relations);

    // 测试 relations 解析
    var rels = parsedTimeline.nodes[1].relations;
    console.log('T1.5 relation1 方向:', rels[0].direction, 'targetTimelineId:', rels[0].targetTimelineId);
    console.log('T1.6 独立事件 targetTimelineId:', rels[2].targetTimelineId, '(应为 null)');

    // 测试 4：事件线序列化往返
    var serializedTimeline = serializeTimeline(parsedTimeline);
    var reparsedTimeline = parseTimelineMarkdown(serializedTimeline);
    var timelineRoundtrip = JSON.stringify(parsedTimeline) === JSON.stringify(reparsedTimeline);
    console.log('T1.8 serializeTimeline 往返一致:', timelineRoundtrip);
    if (!timelineRoundtrip) {
      console.log('原始:', JSON.stringify(parsedTimeline));
      console.log('重解析:', JSON.stringify(reparsedTimeline));
    }

    console.log('=== md-store.js 自测结束 ===');
    return {
      nodeParsed: !!parsedNode.id,
      timelineParsed: !!parsedTimeline.id && parsedTimeline.nodes.length > 0,
      nodeRoundtrip: nodeRoundtrip,
      timelineRoundtrip: timelineRoundtrip,
      relationDirection: rels[0].direction === '←',
      standaloneNull: rels[2].targetTimelineId === null
    };
  };

})(typeof window !== 'undefined' ? window : this);
