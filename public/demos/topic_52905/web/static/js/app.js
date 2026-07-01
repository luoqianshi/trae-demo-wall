let priceChart = null;
let platformChart = null;
let countChart = null;
let boxplotChart = null;

const PLATFORM_COLORS = {
    jd: "#E2231A",
    taobao: "#FF5000",
    pdd: "#E02E24",
    mock: "#6C5CE7",
};

const PLATFORM_NAMES = {
    jd: "京东",
    taobao: "淘宝",
    pdd: "拼多多",
    mock: "模拟",
};

document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("keywordInput");
    input.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            doSearch();
        }
    });
});

async function doSearch() {
    const keyword = document.getElementById("keywordInput").value.trim();
    if (!keyword) {
        alert("请输入关键词");
        return;
    }

    const platforms = [];
    document.querySelectorAll('.platform-select input[type="checkbox"]:checked').forEach(cb => {
        platforms.push(cb.value);
    });
    if (platforms.length === 0) {
        alert("请至少选择一个平台");
        return;
    }

    const pages = parseInt(document.getElementById("pagesSelect").value);

    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("results").classList.add("hidden");
    document.getElementById("demo-section").classList.add("hidden");

    try {
        const resp = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyword, platforms, pages, use_mock: true }),
        });
        const data = await resp.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        renderResults(data);
    } catch (err) {
        alert("请求失败：" + err.message);
    } finally {
        document.getElementById("loading").classList.add("hidden");
        document.getElementById("results").classList.remove("hidden");
    }
}

function renderResults(data) {
    const report = data.report;
    const rec = data.recommendation;

    document.getElementById("totalCount").textContent = report.total_products;
    document.getElementById("priceRange").textContent =
        `¥${report.price_quartiles[0].toFixed(2)} - ¥${report.price_quartiles[4].toFixed(2)}`;
    document.getElementById("avgPrice").textContent = `¥${report.price_quartiles[2].toFixed(2)}`;
    document.getElementById("platformCount").textContent = report.platforms.length;

    renderRecommendation(rec);
    renderPlatformTable(report.platform_stats);
    renderProductGrid(report.sorted_by_price);
    document.getElementById("summaryText").textContent = rec.summary;

    renderPriceChart(data.charts.price_bar);
    renderPlatformChart(data.charts.platform_price);
    renderCountChart(data.charts.platform_count);
    renderBoxplotChart(data.charts.boxplot);
}

function renderRecommendation(rec) {
    function setRec(prefix, item) {
        if (!item) return;
        document.getElementById(prefix + "Title").textContent = item.title;
        document.getElementById(prefix + "Price").textContent = `¥${item.price.toFixed(2)}`;
        document.getElementById(prefix + "Meta").textContent =
            `${PLATFORM_NAMES[item.platform] || item.platform} · ${item.shop_name} · 评分 ${item.shop_rating}`;
    }
    setRec("recBestValue", rec.best_value);
    setRec("recCheapest", rec.cheapest);
    setRec("recPopular", rec.popular);
    setRec("recPremium", rec.premium);
}

function renderPlatformTable(stats) {
    const tbody = document.querySelector("#platformTable tbody");
    tbody.innerHTML = "";
    for (const [plat, s] of Object.entries(stats)) {
        const tr = document.createElement("tr");
        const platName = PLATFORM_NAMES[plat] || plat;
        const color = PLATFORM_COLORS[plat] || "#666";
        tr.innerHTML = `
            <td><span class="platform-tag" style="background:${color}">${platName}</span></td>
            <td>${s.count}</td>
            <td style="color:#27ae60;font-weight:600">¥${s.min_price.toFixed(2)}</td>
            <td>¥${s.max_price.toFixed(2)}</td>
            <td>¥${s.avg_price.toFixed(2)}</td>
            <td>¥${s.median_price.toFixed(2)}</td>
            <td>⭐ ${s.avg_rating}</td>
            <td>${formatNumber(s.total_sales)}</td>
        `;
        tbody.appendChild(tr);
    }
}

function renderProductGrid(products) {
    const grid = document.getElementById("productGrid");
    grid.innerHTML = "";
    const topN = Math.min(products.length, 24);
    for (let i = 0; i < topN; i++) {
        const p = products[i];
        const color = PLATFORM_COLORS[p.platform] || "#666";
        const platName = PLATFORM_NAMES[p.platform] || p.platform;
        const tags = (p.tags || []).map(t => `<span class="product-tag">${t}</span>`).join("");
        const card = document.createElement("div");
        card.className = "product-card";
        card.onclick = () => window.open(p.url, "_blank");
        card.innerHTML = `
            <div class="product-top">
                <div class="product-price">¥${p.price.toFixed(2)}</div>
                <span class="product-platform" style="background:${color}">${platName}</span>
            </div>
            <div class="product-name">${p.title}</div>
            <div class="product-bottom">
                <span class="product-shop">${p.shop_name || "未知店铺"}</span>
                <span>⭐ ${p.shop_rating}</span>
            </div>
            <div class="product-bottom">
                <span>销量 ${formatNumber(p.sales)}</span>
            </div>
            ${tags ? `<div class="product-tags">${tags}</div>` : ""}
        `;
        grid.appendChild(card);
    }
}

function renderPriceChart(config) {
    const ctx = document.getElementById("priceChart").getContext("2d");
    if (priceChart) priceChart.destroy();
    priceChart = new Chart(ctx, config);
}

function renderPlatformChart(config) {
    const ctx = document.getElementById("platformChart").getContext("2d");
    if (platformChart) platformChart.destroy();
    platformChart = new Chart(ctx, config);
}

function renderCountChart(config) {
    const ctx = document.getElementById("countChart").getContext("2d");
    if (countChart) countChart.destroy();
    countChart = new Chart(ctx, config);
}

function renderBoxplotChart(boxplotData) {
    const ctx = document.getElementById("boxplotChart").getContext("2d");
    if (boxplotChart) boxplotChart.destroy();

    const labels = Object.keys(boxplotData);
    const data = labels.map(l => {
        const d = boxplotData[l];
        return [d.min, d.q1, d.median, d.q3, d.max];
    });
    const colors = labels.map(l => boxplotData[l].color);

    boxplotChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "价格区间 (箱线图示意)",
                    data: data.map(d => d[4] - d[0]),
                    backgroundColor: colors.map(c => c + "33"),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: "各平台价格分布（箱线图示意）" },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            const idx = ctx.dataIndex;
                            const d = data[idx];
                            return [
                                `最低: ¥${d[0].toFixed(2)}`,
                                `Q1: ¥${d[1].toFixed(2)}`,
                                `中位数: ¥${d[2].toFixed(2)}`,
                                `Q3: ¥${d[3].toFixed(2)}`,
                                `最高: ¥${d[4].toFixed(2)}`,
                            ];
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: "价格 (元)" } },
            }
        }
    });
}

function formatNumber(n) {
    if (n >= 10000) {
        return (n / 10000).toFixed(1) + "万";
    }
    return n.toLocaleString();
}
