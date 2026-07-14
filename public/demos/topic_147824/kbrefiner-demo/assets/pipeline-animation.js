(function() {
  'use strict';

  var utils;
  var data;

  var stepTitles = ['文档清洗与结构化', '语义级智能分块', '口语化QA生成', '多维元数据打标'];
  var stepLabels = ['准备就绪', '正在清洗...', '正在分块...', '正在生成QA...', '正在打标...', '处理完成'];

  document.addEventListener('DOMContentLoaded', function() {
    utils = window.AppUtils;
    data = window.SAMPLE_DATA;
    if (!utils || !data) {
      console.error('依赖加载失败: AppUtils=', typeof window.AppUtils, 'SAMPLE_DATA=', typeof window.SAMPLE_DATA);
      return;
    }
    initPipeline();
    initValidation();
    initComparison();
  });

  function initPipeline() {
    var btnStart = utils.$('#btn-start-pipeline');
    var btnView = utils.$('#btn-view-comparison');
    var btnReset = utils.$('#btn-reset-pipeline');

    btnStart.addEventListener('click', startPipeline);
    btnView.addEventListener('click', function() {
      utils.scrollTo('comparison-section');
    });
    btnReset.addEventListener('click', resetPipeline);
  }

  function startPipeline() {
    var btnStart = utils.$('#btn-start-pipeline');
    btnStart.disabled = true;

    resetPipeline(false);

    (async function() {
      await runStage1();
      await utils.delay(500);
      await runStage2();
      await utils.delay(500);
      await runStage3();
      await utils.delay(500);
      await runStage4();
      completePipeline();
    })();
  }

  function resetPipeline(hideOutput) {
    hideOutput = hideOutput !== false;

    $$('.pipeline-step').forEach(function(step) {
      step.classList.remove('active', 'completed');
      var badge = step.querySelector('.status-badge');
      badge.className = 'status-badge status-pending';
      badge.textContent = '等待中';
    });

    updateProgress(0, stepLabels[0]);

    var btnStart = utils.$('#btn-start-pipeline');
    var btnView = utils.$('#btn-view-comparison');
    var btnReset = utils.$('#btn-reset-pipeline');

    btnStart.disabled = false;
    btnStart.classList.remove('hidden');
    btnView.classList.add('hidden');
    btnReset.classList.add('hidden');

    if (hideOutput) {
      utils.$('#pipeline-output').classList.add('hidden');
      $$('.stage-output').forEach(function(output) {
        output.classList.add('hidden');
        output.innerHTML = '';
      });
      utils.$('#stage-1-output').innerHTML = '<h4 class="stage-title">Stage 1 - 清洗结果</h4><div class="clean-comparison"><div class="clean-panel clean-before"><div class="panel-header"><span class="tag tag-error">原始文档（问题标注）</span></div><div class="panel-body" id="clean-before-content"></div></div><div class="clean-arrow"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div><div class="clean-panel clean-after"><div class="panel-header"><span class="tag tag-success">清洗后（修正标注）</span></div><div class="panel-body" id="clean-after-content"></div></div></div>';
      utils.$('#stage-2-output').innerHTML = '<h4 class="stage-title">Stage 2 - 分块结果</h4><div class="chunk-list" id="chunk-list"></div>';
      utils.$('#stage-3-output').innerHTML = '<h4 class="stage-title">Stage 3 - QA生成结果</h4><div class="qa-results" id="qa-results"></div>';
      utils.$('#stage-4-output').innerHTML = '<h4 class="stage-title">Stage 4 - 元数据打标</h4><div class="tag-results" id="tag-results"></div>';
    }
  }

  function updateProgress(percent, label) {
    var fill = utils.$('#pipeline-progress-fill');
    var labelEl = utils.$('#pipeline-progress-label');
    var percentEl = utils.$('#pipeline-progress-percent');

    fill.style.width = percent + '%';
    labelEl.textContent = label;
    percentEl.textContent = percent + '%';
  }

  function activateStep(stepNum) {
    var step = utils.$('#step-clean');
    switch(stepNum) {
      case 2: step = utils.$('#step-chunk'); break;
      case 3: step = utils.$('#step-qa'); break;
      case 4: step = utils.$('#step-tag'); break;
    }

    step.classList.add('active');
    var badge = step.querySelector('.status-badge');
    badge.className = 'status-badge status-active';
    badge.textContent = '处理中';
  }

  function completeStep(stepNum) {
    var step = utils.$('#step-clean');
    switch(stepNum) {
      case 2: step = utils.$('#step-chunk'); break;
      case 3: step = utils.$('#step-qa'); break;
      case 4: step = utils.$('#step-tag'); break;
    }

    step.classList.remove('active');
    step.classList.add('completed');
    var badge = step.querySelector('.status-badge');
    badge.className = 'status-badge status-completed';
    badge.textContent = '已完成';
  }

  async function runStage1() {
    activateStep(1);
    updateProgress(10, stepLabels[1]);

    utils.$('#pipeline-output').classList.remove('hidden');

    await utils.delay(500);

    var rawText = data.dirty_doc.raw_text;
    var issues = data.dirty_doc.issues;

    var beforeContent = utils.$('#clean-before-content');
    var highlightedText = rawText;

    issues.forEach(function(issue) {
      var patterns = [
        issue.line_hint,
        issue.description.match(/[\u4e00-\u9fa5]{4,}/g)
      ].filter(Boolean);

      patterns.forEach(function(pattern) {
        if (typeof pattern === 'string') {
          var escaped = escapeRegExp(pattern);
          highlightedText = highlightedText.replace(new RegExp(escaped, 'g'), '<span class="issue-highlight">' + pattern + '</span>');
        } else if (Array.isArray(pattern)) {
          pattern.forEach(function(p) {
            var escaped = escapeRegExp(p);
            highlightedText = highlightedText.replace(new RegExp(escaped, 'g'), '<span class="issue-highlight">' + p + '</span>');
          });
        }
      });
    });

    beforeContent.innerHTML = highlightedText;

    await utils.delay(1000);

    updateProgress(20, stepLabels[1]);

    var afterContent = utils.$('#clean-after-content');
    var cleanText = rawText
      .replace(/WY-25597/g, '<span class="fix-highlight">***【敏感数据-已脱敏】</span>')
      .replace(/xckey_s4lt_2024_prod/g, '<span class="fix-highlight">***【敏感数据-已脱敏】</span>')
      .replace(/2024年3月15日/g, '<span class="fix-highlight">2024-03-15</span>')
      .replace(/2024\/03\/15/g, '<span class="fix-highlight">2024-03-15</span>')
      .replace(/2023\/11\/08/g, '<span class="fix-highlight">2023-11-08</span>')
      .replace(/2023\.09\.01/g, '<span class="fix-highlight">2023-09-01</span>')
      .replace(/2023\/06\/15/g, '<span class="fix-highlight">2023-06-15</span>')
      .replace(/Q3：消息推送失败怎么办？（注：重复问题）[\s\S]*?A3：参考Q1的解答。/g, '<span class="fix-highlight">【重复问题已移除】</span>');

    afterContent.innerHTML = cleanText;

    utils.$('#stage-1-output').classList.remove('hidden');

    await utils.delay(500);
    updateProgress(25, stepLabels[1]);

    completeStep(1);
  }

  async function runStage2() {
    activateStep(2);
    updateProgress(40, stepLabels[2]);

    var chunkList = utils.$('#chunk-list');
    var atoms = data.clean_atoms;

    for (var i = 0; i < atoms.length; i++) {
      var atom = atoms[i];
      var card = createChunkCard(atom);
      chunkList.appendChild(card);

      await utils.delay(100);

      card.classList.add('visible');

      var progress = 40 + Math.round((i + 1) / atoms.length * 15);
      updateProgress(Math.min(progress, 55), stepLabels[2]);

      await utils.delay(200);
    }

    utils.$('#stage-2-output').classList.remove('hidden');

    await utils.delay(300);
    updateProgress(55, stepLabels[2]);

    completeStep(2);
  }

  function createChunkCard(atom) {
    var card = utils.createElement('div', { className: 'chunk-card' });

    var chunkId = utils.createElement('div', { className: 'chunk-id', textContent: atom.chunk_id });
    var title = utils.createElement('div', { className: 'chunk-title', textContent: atom.title });

    var meta = utils.createElement('div', { className: 'chunk-meta' });
    meta.appendChild(utils.createElement('span', { textContent: '字数: ' + atom.char_count }));
    meta.appendChild(utils.createElement('span', { textContent: atom.meta.knowledge_type }));

    var preview = utils.createElement('div', { className: 'chunk-preview', textContent: atom.content });

    card.appendChild(chunkId);
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(preview);

    return card;
  }

  async function runStage3() {
    activateStep(3);
    updateProgress(60, stepLabels[3]);

    var qaResults = utils.$('#qa-results');
    var atoms = data.clean_atoms.slice(0, 4);

    for (var i = 0; i < atoms.length; i++) {
      var atom = atoms[i];
      var qas = atom.qa_list.slice(0, 2);

      for (var j = 0; j < qas.length; j++) {
        var qa = qas[j];
        var card = createQACard(qa);
        qaResults.appendChild(card);

        await utils.delay(150);
        card.classList.add('visible');

        var qEl = card.querySelector('.qa-question');
        var aEl = card.querySelector('.qa-answer');
        var confNum = card.querySelector('.confidence-number');
        var confFill = card.querySelector('.confidence-fill');

        await new Promise(function(resolve) {
          utils.typeWriter(qEl, qa.question, 25, resolve);
        });

        await utils.delay(200);

        await new Promise(function(resolve) {
          utils.typeWriter(aEl, qa.answer, 20, resolve);
        });

        await utils.delay(100);

        confFill.style.width = qa.confidence + '%';
        utils.animateNumber(confNum, 0, qa.confidence, 600, 0);

        var progress = 60 + Math.round(((i * qas.length + j + 1) / (atoms.length * qas.length)) * 15);
        updateProgress(Math.min(progress, 75), stepLabels[3]);

        await utils.delay(300);
      }
    }

    utils.$('#stage-3-output').classList.remove('hidden');

    await utils.delay(300);
    updateProgress(75, stepLabels[3]);

    completeStep(3);
  }

  function createQACard(qa) {
    var card = utils.createElement('div', { className: 'qa-card' });

    var header = utils.createElement('div', { className: 'qa-header' });
    header.appendChild(utils.createElement('span', { className: 'qa-type', textContent: qa.question_type }));

    var confidence = utils.createElement('div', { className: 'qa-confidence' });
    var bar = utils.createElement('div', { className: 'confidence-bar' });
    var fillClass = qa.confidence >= 90 ? 'high' : qa.confidence >= 70 ? 'medium' : 'low';
    bar.appendChild(utils.createElement('div', { className: 'confidence-fill ' + fillClass, style: 'width: 0%' }));
    confidence.appendChild(bar);
    confidence.appendChild(utils.createElement('span', { className: 'confidence-number', textContent: '0' }));
    header.appendChild(confidence);

    card.appendChild(header);
    card.appendChild(utils.createElement('div', { className: 'qa-question' }));
    card.appendChild(utils.createElement('div', { className: 'qa-answer' }));

    return card;
  }

  async function runStage4() {
    activateStep(4);
    updateProgress(80, stepLabels[4]);

    var tagResults = utils.$('#tag-results');
    var atoms = data.clean_atoms;

    for (var i = 0; i < atoms.length; i++) {
      var atom = atoms[i];
      var card = createTagCard(atom);
      tagResults.appendChild(card);

      var tags = card.querySelectorAll('.meta-tag');
      for (var j = 0; j < tags.length; j++) {
        await utils.delay(80);
        tags[j].classList.add('visible');
      }

      var progress = 80 + Math.round((i + 1) / atoms.length * 15);
      updateProgress(Math.min(progress, 95), stepLabels[4]);

      await utils.delay(150);
    }

    utils.$('#stage-4-output').classList.remove('hidden');

    await utils.delay(500);
    updateProgress(100, stepLabels[5]);

    completeStep(4);
  }

  function createTagCard(atom) {
    var card = utils.createElement('div', { className: 'tag-atom-card' });

    card.appendChild(utils.createElement('div', { className: 'tag-chunk-id', textContent: atom.chunk_id }));
    card.appendChild(utils.createElement('div', { className: 'tag-title', textContent: atom.title }));

    var metaTags = utils.createElement('div', { className: 'meta-tags' });
    metaTags.appendChild(utils.createElement('span', { className: 'meta-tag audience', textContent: '目标受众: ' + atom.meta.target_audience }));
    metaTags.appendChild(utils.createElement('span', { className: 'meta-tag module', textContent: '业务模块: ' + atom.meta.business_module }));
    metaTags.appendChild(utils.createElement('span', { className: 'meta-tag type', textContent: '知识类型: ' + atom.meta.knowledge_type }));
    metaTags.appendChild(utils.createElement('span', { className: 'meta-tag version', textContent: '版本时效: ' + atom.meta.version_timeliness }));
    metaTags.appendChild(utils.createElement('span', { className: 'meta-tag summary', textContent: '摘要: ' + atom.meta.summary }));

    card.appendChild(metaTags);

    return card;
  }

  function completePipeline() {
    var btnStart = utils.$('#btn-start-pipeline');
    var btnView = utils.$('#btn-view-comparison');
    var btnReset = utils.$('#btn-reset-pipeline');

    btnStart.classList.add('hidden');
    btnView.classList.remove('hidden');
    btnReset.classList.remove('hidden');

    var fill = utils.$('#pipeline-progress-fill');
    fill.classList.add('success');
  }

  function initValidation() {
    var btnRun = utils.$('#btn-run-validation');
    btnRun.addEventListener('click', runValidation);
  }

  async function runValidation() {
    var btnRun = utils.$('#btn-run-validation');
    btnRun.disabled = true;

    var codeLines = $$('#validation-code-block .code-line');
    var resultList = utils.$('#validation-result-list');
    var stats = utils.$('#validation-stats');

    resultList.innerHTML = '';
    stats.innerHTML = '<span class="stat-passed text-success">通过: 0</span><span class="stat-failed text-error">修正: 0</span>';

    var activeCount = 0;
    var maxActive = 6;

    for (var i = 0; i < codeLines.length; i++) {
      codeLines[i].classList.add('active');
      activeCount++;

      if (activeCount > maxActive && i >= maxActive) {
        codeLines[i - maxActive].classList.remove('active');
      }

      await utils.delay(80);
    }

    await utils.delay(300);

    var checks = data.validation_results.checks;
    var passed = 0;
    var failed = 0;

    for (var j = 0; j < checks.length; j++) {
      var check = checks[j];
      var row = createValidationRow(check);
      resultList.appendChild(row);

      await utils.delay(200);
      row.classList.add('visible');

      if (check.status === 'passed') {
        passed++;
      } else {
        failed++;
      }

      stats.innerHTML = '<span class="stat-passed text-success">通过: ' + passed + '</span><span class="stat-failed text-error">修正: ' + failed + '</span>';

      if (typeof check.original === 'number') {
        var numEl = row.querySelector('.corrected-value');
        if (numEl) {
          utils.animateNumber(numEl, check.original, check.corrected, 500, check.corrected % 1 !== 0 ? 1 : 0);
        }
      }

      await utils.delay(300);
    }

    await utils.delay(500);

    var summary = createValidationSummary(data.validation_results.summary);
    resultList.appendChild(summary);
    summary.classList.add('visible');

    codeLines.forEach(function(line) {
      line.classList.remove('active');
    });

    btnRun.disabled = false;
  }

  function createValidationRow(check) {
    var row = utils.createElement('div', { className: 'validation-row', style: 'opacity: 0; transform: translateY(10px); transition: opacity 0.4s ease, transform 0.4s ease;' });

    var header = utils.createElement('div', { className: 'validation-row-header' });
    header.appendChild(utils.createElement('span', { className: check.status === 'passed' ? 'tag tag-success' : 'tag tag-error', textContent: check.status === 'passed' ? 'PASS' : 'FAIL' }));
    header.appendChild(utils.createElement('span', { className: 'validation-check-id', textContent: check.id }));
    header.appendChild(utils.createElement('span', { className: 'validation-script-name', textContent: check.script_name }));

    var field = utils.createElement('div', { className: 'validation-field', textContent: check.field });
    var rule = utils.createElement('div', { className: 'validation-rule', textContent: check.rule });

    var change = utils.createElement('div', { className: 'change-detail' });
    change.appendChild(utils.createElement('span', { className: 'text-error', textContent: String(check.original) }));
    change.appendChild(utils.createElement('span', { textContent: '→' }));

    var correctedSpan = utils.createElement('span', { className: 'text-success corrected-value', textContent: String(check.corrected) });
    change.appendChild(correctedSpan);

    var detail = utils.createElement('div', { className: 'validation-detail', textContent: check.detail });

    row.appendChild(header);
    row.appendChild(field);
    row.appendChild(rule);
    row.appendChild(change);
    row.appendChild(detail);

    return row;
  }

  function createValidationSummary(summary) {
    var el = utils.createElement('div', { className: 'validation-summary', style: 'opacity: 0; transition: opacity 0.5s ease;' });
    var content = utils.createElement('div', { className: 'summary-content' });

    content.appendChild(utils.createElement('div', { className: 'summary-title', textContent: '校验汇总' }));

    var stats = utils.createElement('div', { className: 'summary-stats' });
    stats.appendChild(utils.createElement('span', { textContent: '总检查数: ' + summary.total_checks }));
    stats.appendChild(utils.createElement('span', { textContent: '自动修正: ' + summary.auto_fixed }));
    stats.appendChild(utils.createElement('span', { textContent: '耗时: ' + summary.execution_time }));

    content.appendChild(stats);

    var scripts = utils.createElement('div', { className: 'summary-scripts', style: 'font-size: 0.85rem; color: var(--color-text-muted);' });
    scripts.textContent = '执行脚本: ' + summary.scripts_executed.join(', ');
    content.appendChild(scripts);

    el.appendChild(content);

    return el;
  }

  function initComparison() {
    renderDirtyDoc();
    renderCleanAtoms();

    $$('.issue-inline').forEach(function(el) {
      el.addEventListener('click', function() {
        var issueId = this.getAttribute('data-issue-id');
        highlightAtom(issueId);
      });
    });
  }

  function renderDirtyDoc() {
    var titleEl = utils.$('#dirty-doc-title');
    var contentEl = utils.$('#comparison-dirty-doc');

    titleEl.textContent = data.dirty_doc.title;

    var rawText = data.dirty_doc.raw_text;
    var issues = data.dirty_doc.issues;

    var issueMap = {
      'ISS-001': ['2024/03/15', '2024年03月20日', '2024年3月15日'],
      'ISS-002': ['WY-25597'],
      'ISS-003': ['xckey_s4lt_2024_prod'],
      'ISS-004': ['Q3', '重复问题'],
      'ISS-005': ['3.2节 Salt值'],
      'ISS-006': ['2023/11/08', '2023.09.01', '2023/06/15']
    };

    var highlighted = rawText;
    issues.forEach(function(issue) {
      var keywords = issueMap[issue.id] || [issue.line_hint];
      keywords.forEach(function(keyword) {
        var escaped = escapeRegExp(keyword);
        highlighted = highlighted.replace(new RegExp(escaped, 'g'), '<span class="issue-inline" data-issue-id="' + issue.id + '" data-target-chunk="' + getChunkFromIssue(issue.id) + '">' + keyword + '</span>');
      });
    });

    contentEl.innerHTML = '<div class="dirty-doc-content">' + highlighted + '</div>';
  }

  function renderCleanAtoms() {
    var countEl = utils.$('#clean-atoms-count');
    var listEl = utils.$('#comparison-clean-atoms');

    countEl.textContent = '共 ' + data.clean_atoms.length + ' 个知识原子';

    var atoms = data.clean_atoms;
    var list = utils.createElement('div', { className: 'clean-atoms-list' });

    atoms.forEach(function(atom) {
      var card = utils.createElement('div', { className: 'atom-card', id: 'atom-' + atom.chunk_id });
      card.appendChild(utils.createElement('div', { className: 'atom-chunk-id', textContent: atom.chunk_id }));
      card.appendChild(utils.createElement('div', { className: 'atom-title', textContent: atom.title }));
      card.appendChild(utils.createElement('div', { className: 'atom-content', textContent: atom.content }));

      if (atom.qa_list && atom.qa_list.length > 0) {
        var qaSection = utils.createElement('div', { className: 'atom-qa-section' });
        var qaPair = utils.createElement('div', { className: 'qa-pair' });
        qaPair.appendChild(utils.createElement('div', { className: 'qa-q', textContent: 'Q: ' + atom.qa_list[0].question }));
        qaPair.appendChild(utils.createElement('div', { className: 'qa-a', textContent: 'A: ' + atom.qa_list[0].answer }));
        qaSection.appendChild(qaPair);
        card.appendChild(qaSection);
      }

      list.appendChild(card);
    });

    listEl.appendChild(list);
  }

  function getChunkFromIssue(issueId) {
    var map = {
      'ISS-001': 'P1-C008',
      'ISS-002': 'P1-C001',
      'ISS-003': 'P1-C003',
      'ISS-004': 'P1-C005',
      'ISS-005': 'P1-C004',
      'ISS-006': 'P1-C008'
    };
    return map[issueId] || 'P1-C001';
  }

  function highlightAtom(issueId) {
    var chunkId = getChunkFromIssue(issueId);
    var card = utils.$('#atom-' + chunkId);

    if (card) {
      card.classList.remove('highlighted');
      void card.offsetWidth;
      card.classList.add('highlighted');

      card.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(function() {
        card.classList.remove('highlighted');
      }, 1500);
    }
  }

  function $$(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

})();