/* 富文本渲染：Markdown + ECharts + Mermaid — Indigo 紫色系 */
(function () {
  if (window.marked) {
    marked.setOptions({ breaks: true, gfm: true });
  }
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        primaryColor: "#EEF2FF",
        primaryTextColor: "#4338CA",
        primaryBorderColor: "#4F46E5",
        lineColor: "#6366F1",
        secondaryColor: "#F5F6FF",
        tertiaryColor: "#F8F8FC",
        fontFamily: "inherit",
      },
    });
  }

  const chartRegistry = [];
  var chartSeq = 0;
  var mermaidSeq = 0;

  function sanitize(html) {
    if (window.DOMPurify) {
      return DOMPurify.sanitize(html, { ADD_ATTR: ["target"] });
    }
    return html;
  }

  function parseOption(raw) {
    const text = raw.trim();
    try {
      return JSON.parse(text);
    } catch (e) {
      try {
        return Function('"use strict"; return (' + text + ")")();
      } catch (e2) {
        return null;
      }
    }
  }

  function appendMarkdown(container, md) {
    if (!md.trim()) return;
    const div = document.createElement("div");
    div.className = "md-block";
    div.innerHTML = sanitize(window.marked ? marked.parse(md) : md);
    div.querySelectorAll("a").forEach(function (a) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
    container.appendChild(div);
  }

  function appendEcharts(container, code) {
    const wrap = document.createElement("div");
    wrap.className = "chart-block";
    const el = document.createElement("div");
    el.className = "chart-canvas";
    el.id = "chart_" + chartSeq++;
    wrap.appendChild(el);
    container.appendChild(wrap);

    const option = parseOption(code);
    if (!option) {
      el.classList.add("chart-error");
      el.textContent = "图表配置解析失败，原始内容：\n" + code;
      return;
    }
    if (!option.color) {
      option.color = ["#4F46E5", "#7C3AED", "#6366F1", "#A78BFA", "#C4B5FD", "#DDD6FE", "#818CF8", "#4338CA"];
    }
    requestAnimationFrame(function () {
      try {
        const chart = echarts.init(el, null, { renderer: "canvas" });
        chart.setOption(option);
        chartRegistry.push(chart);
      } catch (err) {
        el.classList.add("chart-error");
        el.textContent = "图表渲染失败：" + err.message;
      }
    });
  }

  function appendMermaid(container, code) {
    const wrap = document.createElement("div");
    wrap.className = "mermaid-block";
    const id = "mermaid_" + mermaidSeq++;
    wrap.id = id;
    wrap.textContent = code;
    container.appendChild(wrap);
    if (window.mermaid) {
      mermaid
        .render(id + "_svg", code)
        .then(function (result) {
          wrap.innerHTML = result.svg;
        })
        .catch(function (err) {
          wrap.classList.add("chart-error");
          wrap.textContent = "Mermaid 渲染失败：" + err.message + "\n" + code;
        });
    }
  }

  function renderRich(container, text) {
    container.innerHTML = "";
    const fence = /```(\w+)?[ \t]*\r?\n([\s\S]*?)```/g;
    var lastIndex = 0;
    var m;
    while ((m = fence.exec(text)) !== null) {
      const lang = (m[1] || "").toLowerCase();
      if (lang === "echarts" || lang === "mermaid") {
        appendMarkdown(container, text.slice(lastIndex, m.index));
        if (lang === "echarts") appendEcharts(container, m[2]);
        else appendMermaid(container, m[2]);
        lastIndex = fence.lastIndex;
      }
    }
    appendMarkdown(container, text.slice(lastIndex));
  }

  function resizeCharts() {
    chartRegistry.forEach(function (c) {
      try { c.resize(); } catch (e) { /* ignore */ }
    });
  }
  window.addEventListener("resize", resizeCharts);

  window.Render = { renderRich: renderRich, resizeCharts: resizeCharts };
})();