(function () {
  "use strict";

  function drawTrend(canvas, rangeData) {
    var ctx = canvas.getContext("2d");
    var width = canvas.width;
    var height = canvas.height;
    var padding = 34;
    var chartWidth = width - padding * 2;
    var chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);
    var bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "rgba(255,255,255,0.88)");
    bg.addColorStop(1, "rgba(233,247,255,0.6)");
    ctx.fillStyle = bg;
    roundRect(ctx, 0, 0, width, height, 28);
    ctx.fill();

    ctx.strokeStyle = "rgba(84, 137, 184, 0.18)";
    ctx.lineWidth = 1;
    ctx.font = "22px sans-serif";
    ctx.fillStyle = "rgba(37, 64, 95, 0.48)";

    for (var score = 1; score <= 5; score += 1) {
      var y = scoreToY(score, padding, chartHeight);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      ctx.fillText(String(score), 12, y + 7);
    }

    var points = rangeData.map(function (item, index) {
      var x = padding + (rangeData.length === 1 ? chartWidth / 2 : chartWidth * index / (rangeData.length - 1));
      var scoreValue = item.record ? item.record.moodScore : 3;
      return {
        x: x,
        y: scoreToY(scoreValue, padding, chartHeight),
        item: item,
        score: scoreValue
      };
    });

    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    var lineGradient = ctx.createLinearGradient(padding, 0, width - padding, 0);
    lineGradient.addColorStop(0, "#6e8db9");
    lineGradient.addColorStop(0.5, "#54a9f7");
    lineGradient.addColorStop(1, "#ffaf5f");
    ctx.strokeStyle = lineGradient;
    ctx.beginPath();
    points.forEach(function (point, index) {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    points.forEach(function (point, index) {
      var weather = point.item.record ? window.MoodStorage.getWeather(point.item.record.weather) : null;
      ctx.beginPath();
      ctx.fillStyle = weather ? "#ffffff" : "rgba(255,255,255,0.55)";
      ctx.arc(point.x, point.y, rangeData.length > 12 ? 7 : 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = weather ? "#54a9f7" : "rgba(84, 169, 247, 0.2)";
      ctx.stroke();
      if (weather && rangeData.length <= 12) {
        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#25405f";
        ctx.fillText(weather.emoji, point.x - 10, point.y - 14);
      }
      if (index % Math.ceil(rangeData.length / 6) === 0 || index === rangeData.length - 1) {
        var day = point.item.date.slice(5).replace("-", "/");
        ctx.font = "18px sans-serif";
        ctx.fillStyle = "rgba(37, 64, 95, 0.55)";
        ctx.fillText(day, point.x - 20, height - 10);
      }
    });
  }

  function scoreToY(score, padding, chartHeight) {
    return padding + (5 - score) / 4 * chartHeight;
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  window.MoodCharts = {
    drawTrend: drawTrend
  };
})();
