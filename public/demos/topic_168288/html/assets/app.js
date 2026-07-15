(function () {
  'use strict'

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(function (element) { element.textContent = value })
  }

  function createMetric(metric) {
    var article = document.createElement('article')
    article.className = 'metric-card metric-card--' + metric.tone
    var symbol = document.createElement('span')
    symbol.className = 'metric-card__symbol'
    symbol.setAttribute('aria-hidden', 'true')
    symbol.textContent = metric.symbol
    var copy = document.createElement('div')
    var label = document.createElement('small')
    label.textContent = metric.label
    var value = document.createElement('strong')
    value.textContent = String(metric.value)
    copy.append(label, value)
    article.append(symbol, copy)
    return article
  }

  function createTerminalStatus(item) {
    var article = document.createElement('article')
    article.className = 'recent-card recent-card--' + item.tone
    var label = document.createElement('small')
    label.textContent = item.terminal
    var title = document.createElement('strong')
    title.textContent = item.status
    var detail = document.createElement('span')
    detail.textContent = item.detail
    article.append(label, title, detail)
    return article
  }

  document.addEventListener('DOMContentLoaded', function () {
    var data = window.FENGYU_DEMO_DATA
    if (!data || !data.event) return
    setText('[data-event-name]', data.event.name)
    setText('[data-event-summary]', data.event.summary)
    setText('[data-event-phase]', data.event.phase)
    setText('[data-event-warning]', data.event.warning)

    var metricGrid = document.querySelector('[data-metric-grid]')
    if (metricGrid) metricGrid.replaceChildren.apply(metricGrid, data.metrics.map(createMetric))
    var terminalStatus = document.querySelector('[data-terminal-status]')
    if (terminalStatus) terminalStatus.replaceChildren.apply(terminalStatus, data.terminalStatus.map(createTerminalStatus))
  })
})()
