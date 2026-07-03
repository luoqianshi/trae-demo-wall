const fs = require('fs');
const path = require('path');

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function generateKLine(basePrice, tradingDays, volatility, trend = 0) {
    const kline = [];
    let currentPrice = basePrice;
    let date = new Date();
    date.setDate(date.getDate() - 1);

    while (kline.length < tradingDays) {
        if (date.getDay() !== 0 && date.getDay() !== 6) {
            const dailyVol = currentPrice * volatility;
            const dailyTrend = currentPrice * trend / tradingDays;
            const change = (Math.random() - 0.5) * dailyVol * 2 + dailyTrend;
            const open = currentPrice + (Math.random() - 0.5) * dailyVol * 0.3;
            const close = currentPrice + change;
            const high = Math.max(open, close) + Math.random() * dailyVol * 0.5;
            const low = Math.min(open, close) - Math.random() * dailyVol * 0.5;
            const volume = Math.floor((Math.random() * 0.5 + 0.5) * 10000000 * (basePrice / 50));

            kline.unshift({
                date: formatDate(date),
                open: +open.toFixed(2),
                close: +close.toFixed(2),
                high: +high.toFixed(2),
                low: +low.toFixed(2),
                volume: volume
            });

            currentPrice = close;
        }
        date.setDate(date.getDate() - 1);
    }

    return kline;
}

function calculateMA(kline, period) {
    const result = [];
    for (let i = 0; i < kline.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += kline[i - j].close;
            }
            result.push(+(sum / period).toFixed(2));
        }
    }
    return result;
}

function calculateMACD(kline, fast = 12, slow = 26, signal = 9) {
    const closes = kline.map(k => k.close);
    const emaFast = [];
    const emaSlow = [];
    const dif = [];
    const dea = [];
    const macd = [];

    let emaFastVal = closes[0];
    let emaSlowVal = closes[0];
    for (let i = 0; i < closes.length; i++) {
        emaFastVal = (closes[i] * 2 + emaFastVal * (fast - 1)) / (fast + 1);
        emaSlowVal = (closes[i] * 2 + emaSlowVal * (slow - 1)) / (slow + 1);
        emaFast.push(+emaFastVal.toFixed(2));
        emaSlow.push(+emaSlowVal.toFixed(2));
        dif.push(+(emaFastVal - emaSlowVal).toFixed(2));
    }

    let deaVal = dif[0];
    for (let i = 0; i < dif.length; i++) {
        deaVal = (dif[i] * 2 + deaVal * (signal - 1)) / (signal + 1);
        dea.push(+deaVal.toFixed(2));
        macd.push(+((dif[i] - deaVal) * 2).toFixed(2));
    }

    return { dif, dea, macd };
}

function calculateRSI(kline, period = 14) {
    const result = [];
    const closes = kline.map(k => k.close);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = closes[i] - closes[i - 1];
        if (change >= 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    result.push(null);
    result.push(+((avgGain / (avgGain + avgLoss)) * 100).toFixed(2));

    for (let i = period + 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        result.push(+((avgGain / (avgGain + avgLoss)) * 100).toFixed(2));
    }

    while (result.length < kline.length) {
        result.unshift(null);
    }

    return result;
}

function calculateKDJ(kline, n = 9, m1 = 3, m2 = 3) {
    const kValues = [];
    const dValues = [];
    const jValues = [];

    for (let i = 0; i < kline.length; i++) {
        if (i < n - 1) {
            kValues.push(null);
            dValues.push(null);
            jValues.push(null);
            continue;
        }

        let lowest = Infinity;
        let highest = -Infinity;
        for (let j = 0; j < n; j++) {
            lowest = Math.min(lowest, kline[i - j].low);
            highest = Math.max(highest, kline[i - j].high);
        }

        const rsv = highest === lowest ? 50 : ((kline[i].close - lowest) / (highest - lowest)) * 100;
        const prevK = kValues[i - 1] || 50;
        const prevD = dValues[i - 1] || 50;
        const k = (prevK * (m1 - 1) + rsv) / m1;
        const d = (prevD * (m2 - 1) + k) / m2;
        const j = 3 * k - 2 * d;

        kValues.push(+k.toFixed(2));
        dValues.push(+d.toFixed(2));
        jValues.push(+j.toFixed(2));
    }

    return { k: kValues, d: dValues, j: jValues };
}

function calculateBOLL(kline, period = 20, multiplier = 2) {
    const upper = [];
    const middle = [];
    const lower = [];

    for (let i = 0; i < kline.length; i++) {
        if (i < period - 1) {
            upper.push(null);
            middle.push(null);
            lower.push(null);
            continue;
        }

        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += kline[i - j].close;
        }
        const ma = sum / period;

        let variance = 0;
        for (let j = 0; j < period; j++) {
            variance += Math.pow(kline[i - j].close - ma, 2);
        }
        const std = Math.sqrt(variance / period);

        upper.push(+(ma + multiplier * std).toFixed(2));
        middle.push(+ma.toFixed(2));
        lower.push(+(ma - multiplier * std).toFixed(2));
    }

    return { upper, middle, lower };
}

function getLast(arr, count = 1) {
    return arr.slice(-count).filter(v => v !== null);
}

function generateStockData(config) {
    const { code, name, industry, basePrice, volatility, trend, sector, tags } = config;
    const kline = generateKLine(basePrice, 60, volatility, trend);
    const currentPrice = kline[kline.length - 1].close;
    const prevClose = kline[kline.length - 2].close;
    const changePercent = +((currentPrice - prevClose) / prevClose * 100).toFixed(2);

    const ma5 = calculateMA(kline, 5);
    const ma10 = calculateMA(kline, 10);
    const ma20 = calculateMA(kline, 20);
    const macd = calculateMACD(kline);
    const rsi = calculateRSI(kline);
    const kdj = calculateKDJ(kline);
    const boll = calculateBOLL(kline);

    const lastMA5 = getLast(ma5)[0];
    const lastMA10 = getLast(ma10)[0];
    const lastMA20 = getLast(ma20)[0];
    const lastDIF = getLast(macd.dif)[0];
    const lastDEA = getLast(macd.dea)[0];
    const lastMACD = getLast(macd.macd)[0];
    const lastRSI = getLast(rsi)[0];
    const lastKDJ_K = getLast(kdj.k)[0];
    const lastKDJ_D = getLast(kdj.d)[0];
    const lastKDJ_J = getLast(kdj.j)[0];
    const lastBOLL_Upper = getLast(boll.upper)[0];
    const lastBOLL_Middle = getLast(boll.middle)[0];
    const lastBOLL_Lower = getLast(boll.lower)[0];

    let maSignal = '中性';
    if (lastMA5 > lastMA10 && lastMA10 > lastMA20) maSignal = '看多';
    else if (lastMA5 < lastMA10 && lastMA10 < lastMA20) maSignal = '看空';

    let macdSignal = '中性';
    if (lastDIF > lastDEA && lastMACD > 0) macdSignal = '看多';
    else if (lastDIF < lastDEA && lastMACD < 0) macdSignal = '看空';

    let rsiSignal = '中性';
    if (lastRSI < 30) rsiSignal = '看多';
    else if (lastRSI > 70) rsiSignal = '看空';

    let kdjSignal = '中性';
    if (lastKDJ_J < 20 && lastKDJ_K < lastKDJ_D && trend > 0) kdjSignal = '看多';
    else if (lastKDJ_J > 80 && lastKDJ_K > lastKDJ_D && trend < 0) kdjSignal = '看空';

    let bollSignal = '中性';
    if (currentPrice <= lastBOLL_Lower) bollSignal = '看多';
    else if (currentPrice >= lastBOLL_Upper) bollSignal = '看空';

    let lowPrices = kline.map(k => k.low);
    let highPrices = kline.map(k => k.high);
    lowPrices.sort((a, b) => a - b);
    highPrices.sort((a, b) => b - a);
    const support = +(lowPrices[Math.floor(lowPrices.length * 0.1)]).toFixed(2);
    const resistance = +(highPrices[Math.floor(highPrices.length * 0.1)]).toFixed(2);

    let shortTrend = 50;
    if (trend > 0 && changePercent > 0) shortTrend = 65 + Math.random() * 20;
    else if (trend < 0 && changePercent < 0) shortTrend = 20 + Math.random() * 25;
    else shortTrend = 40 + Math.random() * 30;
    shortTrend = Math.round(shortTrend);

    let midTrend = 50;
    if (maSignal === '看多') midTrend = 60 + Math.random() * 25;
    else if (maSignal === '看空') midTrend = 25 + Math.random() * 25;
    else midTrend = 40 + Math.random() * 30;
    midTrend = Math.round(midTrend);

    return {
        basic: {
            code,
            name,
            currentPrice,
            changePercent,
            industry
        },
        technical: {
            kline,
            indicators: {
                ma: {
                    ma5: lastMA5,
                    ma10: lastMA10,
                    ma20: lastMA20,
                    ma5_values: ma5,
                    ma10_values: ma10,
                    ma20_values: ma20,
                    signal: maSignal
                },
                macd: {
                    dif: lastDIF,
                    dea: lastDEA,
                    macd: lastMACD,
                    dif_values: macd.dif,
                    dea_values: macd.dea,
                    macd_values: macd.macd,
                    signal: macdSignal
                },
                rsi: {
                    value: lastRSI,
                    values: rsi,
                    signal: rsiSignal
                },
                kdj: {
                    k: lastKDJ_K,
                    d: lastKDJ_D,
                    j: lastKDJ_J,
                    k_values: kdj.k,
                    d_values: kdj.d,
                    j_values: kdj.j,
                    signal: kdjSignal
                },
                boll: {
                    upper: lastBOLL_Upper,
                    middle: lastBOLL_Middle,
                    lower: lastBOLL_Lower,
                    upper_values: boll.upper,
                    middle_values: boll.middle,
                    lower_values: boll.lower,
                    signal: bollSignal
                }
            },
            support_resistance: {
                support: support,
                resistance: resistance
            },
            trend: {
                short_term: shortTrend,
                mid_term: midTrend
            },
            ai_analysis: config.technicalAnalysis
        },
        fundamental: {
            company_intro: config.companyIntro,
            business_segments: config.businessSegments,
            financials: config.financials,
            health_score: config.healthScore,
            hot_tags: tags,
            ai_analysis: config.fundamentalAnalysis
        },
        industry: {
            name: industry,
            lifecycle: config.industryLifecycle,
            policy: config.industryPolicy,
            competition: config.industryCompetition,
            rating: config.industryRating,
            ai_analysis: config.industryAnalysis
        },
        macro: {
            events: config.macroEvents,
            ai_analysis: config.macroAnalysis
        },
        summary: {
            one_sentence: config.oneSentence,
            bull_factors: config.bullFactors,
            bear_factors: config.bearFactors,
            scores: config.scores,
            cross_validation: config.crossValidation
        }
    };
}

const stocksConfig = [
    {
        code: '688981',
        name: '中芯国际',
        industry: '半导体',
        basePrice: 58,
        volatility: 0.035,
        trend: 0.18,
        sector: '科技',
        tags: ['国产替代', '芯片制造', '科创板', '大基金', 'AI算力', '先进制程'],
        companyIntro: '中芯国际集成电路制造有限公司是中国大陆规模最大、技术最先进的集成电路晶圆代工企业，主要从事集成电路晶圆代工业务，以及相关的设计服务与IP支持、光掩模制造、凸块加工及测试等配套服务。公司拥有0.35微米至14纳米多种技术节点的量产经验，在逻辑芯片、系统芯片、射频芯片、嵌入式存储等领域具备综合技术实力。',
        businessSegments: [
            { name: '晶圆代工（逻辑）', ratio: 0.72 },
            { name: '晶圆代工（特色工艺）', ratio: 0.18 },
            { name: '设计与IP服务', ratio: 0.06 },
            { name: '其他配套服务', ratio: 0.04 }
        ],
        financials: [
            { period: '2024Q4', gross_margin: 22.5, net_margin: 8.3, roe: 4.2 },
            { period: '2025Q1', gross_margin: 24.1, net_margin: 10.1, roe: 5.1 },
            { period: '2025Q2', gross_margin: 26.8, net_margin: 12.5, roe: 6.3 },
            { period: '2025Q3', gross_margin: 28.3, net_margin: 14.2, roe: 7.1 },
            { period: '2025Q4', gross_margin: 29.7, net_margin: 15.8, roe: 8.0 }
        ],
        healthScore: {
            score: 76,
            description: '财务状况稳健，现金流充裕，但受行业周期性影响较大，研发投入持续高企对短期利润形成压力。'
        },
        technicalAnalysis: '中芯国际当前股价处于中期上升趋势中，MA5上穿MA10形成金叉，MACD柱体持续放大，多头动能强劲。RSI处于62附近的偏强区间但未超买，KDJ指标在中高位钝化显示趋势延续性较好。布林带开口向上发散，价格沿上轨运行。支撑位在52.5元附近，压力位在65.8元附近。建议关注成交量配合情况，若放量突破压力位则上行空间打开。',
        fundamentalAnalysis: '中芯国际作为国内晶圆代工龙头，深度受益于国产替代大趋势。公司14纳米工艺已实现稳定量产，7纳米工艺正在研发推进中。受益于AI算力需求爆发，公司成熟制程产能利用率持续提升，业绩逐季改善。研发投入占营收比例超过20%，技术追赶步伐稳健。风险点在于全球半导体周期波动、地缘政治不确定性以及先进制程突破进度不及预期。',
        industryLifecycle: '成长期',
        industryPolicy: '国家高度重视半导体产业自主可控，大基金三期已启动募资，预计规模超过3000亿元。十四五规划将集成电路列为战略性新兴产业首位，各地出台税收减免、研发补贴等多项扶持政策。',
        industryCompetition: '全球晶圆代工市场高度集中，台积电占据超过50%市场份额。中芯国际在全球排名前五，在中国大陆市场占据主导地位。国内厂商在先进制程与国际龙头仍有2-3代差距，但在成熟制程领域具备较强竞争力。',
        industryRating: {
            level: '向好',
            reasons: [
                '国产替代加速推进，国内晶圆厂扩产周期明确',
                'AI算力需求爆发带动芯片需求增长',
                '政策支持力度持续加大，产业资本加速流入',
                '汽车电子、工业控制等下游需求多元化'
            ]
        },
        industryAnalysis: '半导体行业正处于新一轮景气上行周期的起点。全球AI大模型竞赛带动高端芯片需求爆发，同时国产替代进入深水区，国内晶圆厂迎来历史性发展机遇。行业短期受库存调整影响有波动，但中长期成长逻辑清晰。先进制程突破、特色工艺拓展、设备材料国产化是三大核心投资主线。需关注全球经济复苏力度、地缘政治风险以及技术突破进度。',
        macroEvents: [
            { type: '政策', title: '大基金三期募资启动', time: '2026-03', impact_direction: '利好', impact_level: '高', description: '国家集成电路产业投资基金三期正式启动募资，预计总规模超过3000亿元，重点投向芯片制造、设备材料等环节。' },
            { type: '行业', title: '全球AI芯片需求激增', time: '2026-04', impact_direction: '利好', impact_level: '高', description: 'OpenAI、Google等科技巨头持续加大AI算力投入，带动全球芯片需求快速增长。' },
            { type: '地缘', title: '美对华芯片出口管制升级', time: '2026-02', impact_direction: '利空', impact_level: '中', description: '美国进一步收紧对华先进芯片制造设备出口管制，短期影响国内先进制程发展进度。' },
            { type: '经济', title: '国内经济复苏超预期', time: '2026-05', impact_direction: '利好', impact_level: '中', description: '一季度GDP同比增长5.6%，消费和投资双双回暖，带动半导体下游需求复苏。' }
        ],
        macroAnalysis: '宏观面对中芯国际整体偏利好。政策面，国家大基金三期落地为行业提供充裕资金支持；需求面，AI产业浪潮带来结构性增量需求；经济面，国内经济复苏带动消费电子、汽车电子等下游需求回暖。主要风险来自地缘政治层面，美国对华芯片管制持续升级可能影响公司先进制程设备采购和技术合作。预计政策红利和国产替代趋势将持续2-3年，而地缘政治风险具有长期性和不确定性，需要持续跟踪评估。',
        oneSentence: '国产替代核心标的，受益AI算力需求爆发，技术面多头排列，基本面逐季改善，中长期看好。',
        bullFactors: ['国产替代大趋势明确', 'AI算力需求爆发', '大基金三期资金支持', '业绩逐季改善', '技术面多头排列'],
        bearFactors: ['美国芯片管制升级风险', '半导体行业周期性波动', '先进制程突破不及预期', '研发投入高企压制利润', '估值相对偏高'],
        scores: {
            technical: 78,
            fundamental: 75,
            industry: 82,
            macro: 72
        },
        crossValidation: '四个维度整体一致性较强，技术面与基本面形成共振：技术面多头趋势确认，基本面业绩逐季改善相互印证；行业面景气上行与宏观面政策支持形成合力。矛盾点在于：宏观面地缘政治风险与行业面国产加速逻辑并存，短期可能造成股价波动加剧；技术面短期涨幅较大存在回调需求，但中长期上升趋势未改。综合判断：中长期向上趋势明确，短期需警惕技术回调风险，建议逢低布局。'
    },
    {
        code: '600519',
        name: '贵州茅台',
        industry: '白酒',
        basePrice: 1680,
        volatility: 0.012,
        trend: -0.12,
        sector: '消费',
        tags: ['白酒龙头', '消费白马', '高端消费', '高股息', '国企改革', '提价预期'],
        companyIntro: '贵州茅台酒股份有限公司是中国白酒行业龙头企业，主要生产销售茅台酒及系列酒。公司主导产品贵州茅台酒是中国大曲酱香型白酒的鼻祖和典型代表，具有悠久的历史文化底蕴和强大的品牌影响力。公司拥有独特的酿造工艺、不可复制的地理环境和微生物群落，构建了深厚的品牌护城河。',
        businessSegments: [
            { name: '茅台酒', ratio: 0.88 },
            { name: '系列酒', ratio: 0.12 }
        ],
        financials: [
            { period: '2024Q4', gross_margin: 91.5, net_margin: 52.3, roe: 32.1 },
            { period: '2025Q1', gross_margin: 91.8, net_margin: 53.1, roe: 33.5 },
            { period: '2025Q2', gross_margin: 91.2, net_margin: 51.8, roe: 31.8 },
            { period: '2025Q3', gross_margin: 90.8, net_margin: 50.5, roe: 29.7 },
            { period: '2025Q4', gross_margin: 90.2, net_margin: 48.9, roe: 27.5 }
        ],
        healthScore: {
            score: 95,
            description: '财务状况极为优秀，毛利率超过90%，净利率接近50%，现金流极其充沛，几乎没有有息负债，分红比例持续提升。'
        },
        technicalAnalysis: '贵州茅台当前处于中期调整趋势中，股价从高点回落超过25%。MA5在MA10下方运行，短期均线空头排列。MACD绿柱虽然在收窄但仍在零轴下方，DIF尚未上穿DEA。RSI处于38附近，接近超卖区域。KDJ在低位有金叉迹象，显示短期可能有技术性反弹。布林带收口走平，价格在中轨下方运行。支撑位在1520元附近，压力位在1780元附近。关注能否有效站稳中轨，若能则有望开启反弹。',
        fundamentalAnalysis: '贵州茅台作为A股消费白马股标杆，基本面依然扎实。公司毛利率超过90%，净利率接近50%，盈利能力在A股首屈一指。经营现金流充沛，资产负债表极为健康。但近期受宏观经济增速放缓、高端消费需求疲软、渠道库存较高等因素影响，业绩增速有所放缓。中长期看，公司品牌护城河深厚，价格带天花板高，渠道改革和系列酒拓展仍有增长空间。当前估值已回落至历史较低区间，具备中长期配置价值。',
        industryLifecycle: '成熟期',
        industryPolicy: '白酒行业整体处于成熟期，政策面整体中性。消费税改革预期仍存但落地节奏不确定。食品安全监管趋严，行业规范化程度提升。国企改革持续推进，白酒上市公司治理水平有望提升。',
        industryCompetition: '高端白酒市场格局稳定，茅台、五粮液、泸州老窖占据主导地位。茅台凭借品牌和产能优势稳居行业第一，领先优势明显。次高端和区域白酒竞争激烈，价格带挤压现象明显。行业集中度持续提升，头部企业优势扩大。',
        industryRating: {
            level: '中性',
            reasons: [
                '行业进入存量竞争阶段，整体增速放缓',
                '高端白酒需求受经济周期影响显现',
                '行业集中度持续提升，头部企业优势稳固',
                '渠道库存偏高，短期去库存压力较大'
            ]
        },
        industryAnalysis: '白酒行业已从高速增长期进入高质量发展的成熟期。行业总量基本稳定，结构升级仍是主线，但高端化速度有所放缓。短期行业面临渠道库存高企、需求疲软等压力，企业以去库存、稳价格为主。中长期看，行业集中度提升、品牌化消费趋势、消费升级等逻辑仍在。高端白酒具备强定价权和品牌护城河，抗周期能力相对更强。需关注宏观经济复苏力度、消费修复进度以及政策变化。',
        macroEvents: [
            { type: '经济', title: '国内消费复苏不及预期', time: '2026-04', impact_direction: '利空', impact_level: '中', description: '社零数据连续两个月低于市场预期，高端消费修复力度偏弱。' },
            { type: '政策', title: '消费税改革传闻再起', time: '2026-03', impact_direction: '利空', impact_level: '低', description: '市场传闻白酒消费税可能调整，对行业情绪形成一定扰动。' },
            { type: '政策', title: '促消费政策持续发力', time: '2026-05', impact_direction: '利好', impact_level: '中', description: '多部门联合出台促消费若干措施，发放消费券，提振消费信心。' },
            { type: '行业', title: '白酒渠道去库存进行中', time: '2026-02', impact_direction: '中性', impact_level: '中', description: '白酒行业渠道去库存周期已持续半年，部分品牌库存回归合理水平。' }
        ],
        macroAnalysis: '宏观面对茅台短期偏空、中长期中性偏多。短期来看，国内消费复苏力度不及预期，高端白酒需求承压，渠道去库存仍在进行中，对公司业绩增速形成压制。中长期来看，促消费政策持续发力，经济逐步回暖将带动消费复苏。消费税改革预期是悬在行业头上的达摩克利斯之剑，但对茅台这类高端品牌的实际影响相对有限。预计消费复苏进程可能需要1-2个季度，期间股价可能震荡筑底，待基本面信号明确后有望重拾升势。',
        oneSentence: '白酒龙头基本面依然扎实，估值回落至历史低位，短期承压但中长期配置价值凸显，等待基本面拐点。',
        bullFactors: ['品牌护城河深厚', '盈利能力极强', '估值处于历史低位', '高股息率', '经济复苏带动消费回暖'],
        bearFactors: ['消费复苏不及预期', '渠道库存偏高', '业绩增速放缓', '消费税改革预期', '机构持仓集中'],
        scores: {
            technical: 38,
            fundamental: 88,
            industry: 60,
            macro: 55
        },
        crossValidation: '四个维度存在明显分化：基本面和行业面中长期依然向好，但技术面和宏观面短期偏空。技术面空头排列与基本面优秀形成背离，反映市场对短期业绩增速放缓的担忧。宏观面消费疲软与行业面结构升级存在短期与长期的矛盾。综合判断：中长期投资价值已现，但短期趋势尚未扭转，可能继续震荡筑底。建议左侧投资者分批布局，右侧投资者等待技术面确认拐点。'
    },
    {
        code: '600036',
        name: '招商银行',
        industry: '银行',
        basePrice: 32,
        volatility: 0.015,
        trend: -0.04,
        sector: '金融',
        tags: ['银行龙头', '零售之王', '高股息', '低估值', '财富管理', '金融科技'],
        companyIntro: '招商银行股份有限公司是中国境内第一家完全由企业法人持股的股份制商业银行，也是国家从体制外推动银行业改革的第一家试点银行。公司坚持"科技兴行"战略，以零售业务为核心，在财富管理、私人银行、信用卡等领域建立了显著的竞争优势，被誉为"零售之王"。公司积极推进金融科技转型，数字化能力行业领先。',
        businessSegments: [
            { name: '零售金融业务', ratio: 0.52 },
            { name: '批发金融业务', ratio: 0.38 },
            { name: '资金业务', ratio: 0.08 },
            { name: '其他业务', ratio: 0.02 }
        ],
        financials: [
            { period: '2024Q4', gross_margin: null, net_margin: 35.2, roe: 14.8 },
            { period: '2025Q1', gross_margin: null, net_margin: 34.8, roe: 14.5 },
            { period: '2025Q2', gross_margin: null, net_margin: 34.1, roe: 14.1 },
            { period: '2025Q3', gross_margin: null, net_margin: 33.5, roe: 13.6 },
            { period: '2025Q4', gross_margin: null, net_margin: 32.8, roe: 13.2 }
        ],
        healthScore: {
            score: 88,
            description: '资产质量优良，拨备覆盖率高，资本充足率满足监管要求，零售业务护城河深厚，盈利能力在股份制银行中领先。'
        },
        technicalAnalysis: '招商银行当前股价处于横盘震荡整理阶段。MA5、MA10、MA20三条均线纠缠在一起，短期趋势不明朗。MACD在零轴附近徘徊，柱体微小，多空力量均衡。RSI在50附近震荡，处于中性区间。KDJ在中位区来回交叉，无明确方向信号。布林带持续收窄，显示变盘窗口临近。支撑位在30.2元附近，压力位在34.5元附近。当前处于方向选择关键期，关注布林带突破方向。',
        fundamentalAnalysis: '招商银行作为股份制银行龙头，零售业务优势显著，财富管理和私人银行业务竞争力突出。公司资产质量优良，拨备覆盖率超过400%，风险抵御能力强。受LPR下调、息差收窄影响，公司业绩增速有所放缓，但盈利质量依然较高。公司积极推进数字化转型，金融科技投入持续加大，长期成长逻辑清晰。估值处于历史低位，股息率超过5%，具备较高的安全边际和配置价值。',
        industryLifecycle: '成熟期',
        industryPolicy: '货币政策保持稳健中性，LPR下调降低实体经济融资成本，但也压缩银行息差。监管部门引导银行加大对实体经济支持力度，同时防范化解金融风险。存款利率市场化调整机制建立，有助于缓解银行负债端压力。',
        industryCompetition: '银行业竞争激烈，同质化严重。国有大行凭借网点和资金成本优势占据主导地位，股份制银行在细分领域寻求差异化竞争。招商银行在零售业务、财富管理领域建立了较强的品牌和护城河。互联网金融、金融科技公司对传统银行形成一定冲击。',
        industryRating: {
            level: '中性',
            reasons: [
                '息差持续收窄压制盈利增长',
                '资产质量总体稳定但需关注房地产风险',
                '高股息低估值提供安全边际',
                '经济复苏有望带动信贷需求回暖'
            ]
        },
        industryAnalysis: '银行业处于成熟发展阶段，整体增速放缓。息差收窄是行业面临的共同挑战，银行纷纷通过财富管理、零售转型、金融科技等方式寻求新的增长点。短期来看，经济复苏力度偏弱，信贷需求不足，息差仍有下行压力。中长期来看，随着经济企稳回升、财富管理需求增长、数字化转型深化，头部银行有望实现稳健增长。高股息低估值特征明显，配置价值凸显。',
        macroEvents: [
            { type: '政策', title: 'LPR再次下调', time: '2026-05', impact_direction: '利空', impact_level: '中', description: '1年期LPR下调10BP，5年期以上LPR下调15BP，银行息差进一步承压。' },
            { type: '政策', title: '降准释放长期资金', time: '2026-03', impact_direction: '利好', impact_level: '中', description: '央行全面降准0.5个百分点，释放长期资金约1万亿元，改善银行流动性。' },
            { type: '经济', title: '房地产市场企稳迹象', time: '2026-04', impact_direction: '利好', impact_level: '中', description: '一线城市商品房成交量环比回升，房地产风险担忧有所缓解。' },
            { type: '政策', title: '存款利率市场化调整', time: '2026-02', impact_direction: '利好', impact_level: '高', description: '央行建立存款利率市场化调整机制，引导银行合理控制负债成本。' }
        ],
        macroAnalysis: '宏观面对银行板块影响偏中性，多空因素交织。利空因素主要是LPR下调导致息差收窄，压制盈利增长；利好因素包括降准释放流动性、存款利率市场化缓解负债端压力、房地产市场企稳降低资产质量担忧。经济复苏进程是影响银行股走势的关键变量，若经济持续回暖将带动信贷需求增长和资产质量改善。预计息差收窄趋势仍将持续1-2个季度，之后有望逐步企稳。银行股高股息防御属性在震荡市中具备配置价值。',
        oneSentence: '零售银行龙头，资产质量优良，高股息低估值，息差承压但安全边际足，适合中长期稳健配置。',
        bullFactors: ['零售业务护城河深厚', '资产质量优良', '高股息率（>5%）', '估值处于历史低位', '财富管理长期空间大'],
        bearFactors: ['息差持续收窄', '业绩增速放缓', '房地产风险暴露', '信贷需求不足', '金融监管趋严'],
        scores: {
            technical: 52,
            fundamental: 82,
            industry: 58,
            macro: 55
        },
        crossValidation: '四个维度整体偏中性，基本面与估值面呈现一定背离：基本面优良但技术面横盘震荡，反映市场对息差收窄和经济复苏力度的担忧。行业面中性评级与宏观面多空交织相互印证。技术面布林带收窄预示变盘临近，方向选择取决于经济复苏和政策信号。综合判断：向下空间有限（高股息低估值支撑），向上需要催化剂（经济超预期复苏、政策利好）。当前位置性价比突出，建议中长期投资者逢低布局。'
    },
    {
        code: '601857',
        name: '中国石油',
        industry: '石油',
        basePrice: 9.5,
        volatility: 0.018,
        trend: 0.10,
        sector: '资源',
        tags: ['石油龙头', '中字头', '高股息', '能源安全', '低估值', '国企改革'],
        companyIntro: '中国石油天然气股份有限公司是中国油气行业占主导地位的最大的油气生产和销售商，是中国销售收入最大的公司之一，也是世界最大的石油公司之一。公司主要业务包括原油及天然气的勘探、开发、生产和销售；原油及石油产品的炼制，基本及衍生化工产品、其他化工产品的生产和销售；油气产品的运输及销售；天然气的销售等。',
        businessSegments: [
            { name: '勘探与生产', ratio: 0.35 },
            { name: '炼油与化工', ratio: 0.32 },
            { name: '销售', ratio: 0.28 },
            { name: '天然气与管道', ratio: 0.05 }
        ],
        financials: [
            { period: '2024Q4', gross_margin: 28.5, net_margin: 6.8, roe: 7.2 },
            { period: '2025Q1', gross_margin: 30.2, net_margin: 7.5, roe: 7.8 },
            { period: '2025Q2', gross_margin: 29.6, net_margin: 7.2, roe: 7.5 },
            { period: '2025Q3', gross_margin: 31.1, net_margin: 8.1, roe: 8.3 },
            { period: '2025Q4', gross_margin: 32.0, net_margin: 8.6, roe: 8.8 }
        ],
        healthScore: {
            score: 78,
            description: '能源央企龙头，资源储量丰富，现金流稳定，分红比例高。但受国际油价波动影响大，资本开支规模大，转型压力较大。'
        },
        technicalAnalysis: '中国石油当前股价处于缓慢上升通道中。MA5在MA10上方，MA10在MA20上方，均线呈现多头排列，但斜率较缓，显示上涨动力不是很强。MACD在零轴上方运行，柱体小幅放大，多头占优但动能一般。RSI在58附近，处于偏强但不超买的健康区间。KDJ在中高位运行，尚未出现明显顶背离信号。布林带开口温和向上，价格在中轨和上轨之间运行。支撑位在8.8元附近，压力位在10.5元附近。趋势稳健但爆发力有限，适合波段操作。',
        fundamentalAnalysis: '中国石油作为国内油气行业龙头，直接受益于能源安全战略和油价中枢抬升。公司油气资源储量丰富，上游勘探开采业务盈利能力强。国企改革持续推进，经营效率有望提升。公司分红比例稳定在40%以上，股息率超过6%，防御属性突出。风险点在于国际油价波动较大，新能源转型压力长期存在，炼油化工板块盈利受周期影响。当前估值处于历史低位，安全边际较高。',
        industryLifecycle: '成熟期',
        industryPolicy: '国家能源安全战略提升至新高度，加大国内油气勘探开发力度，增储上产政策持续推进。双碳目标下，传统能源企业面临转型压力，但石油作为基础能源的地位短期内难以替代。国企改革深化，能源央企估值重塑可期。',
        industryCompetition: '国内石油市场形成三桶油（中石油、中石化、中海油）主导的竞争格局。中石油在上游勘探开采领域优势明显，中石化在炼化和销售领域实力较强。国际市场上，石油输出国组织（OPEC）对油价有重要影响力。新能源快速发展对传统能源形成长期替代压力。',
        industryRating: {
            level: '向好',
            reasons: [
                '能源安全战略支撑国内油气增储上产',
                'OPEC+减产支撑油价中枢抬升',
                '国企改革深化，估值重塑空间大',
                '高股息低估值，防御属性突出'
            ]
        },
        industryAnalysis: '石油行业处于成熟期，需求增长放缓但供需格局整体偏紧。供给端，OPEC+持续减产，美国页岩油增长乏力，全球油气资本开支持续不足；需求端，全球经济复苏带动石油需求温和增长，新能源替代是长期趋势但短期影响有限。地缘政治冲突频发加剧油价波动。国内方面，能源安全战略推动国内油气企业加大勘探开发力度，国企改革带来经营效率提升和估值修复机会。高股息特征在利率下行周期具备吸引力。',
        macroEvents: [
            { type: '地缘', title: 'OPEC+延长减产协议', time: '2026-04', impact_direction: '利好', impact_level: '高', description: 'OPEC+宣布将减产协议延长至2026年底，支撑国际油价维持高位。' },
            { type: '地缘', title: '中东局势紧张升级', time: '2026-05', impact_direction: '利好', impact_level: '高', description: '红海航运受阻持续，原油运输成本上升，地缘溢价推高油价。' },
            { type: '政策', title: '国企改革深化提升行动', time: '2026-03', impact_direction: '利好', impact_level: '中', description: '国资委部署新一轮国企改革深化提升行动，推动央企估值合理回归。' },
            { type: '经济', title: '全球经济复苏温和', time: '2026-02', impact_direction: '中性', impact_level: '中', description: 'IMF上调全球经济增长预期，但复苏力度整体偏弱，石油需求增长有限。' }
        ],
        macroAnalysis: '宏观面对中国石油整体偏利好。地缘政治层面，OPEC+延长减产、中东局势紧张支撑油价中枢维持在较高水平，有利于上游业务盈利。政策层面，能源安全战略和国企改革深化为公司带来发展机遇和估值修复空间。经济层面，全球经济温和复苏支撑石油需求，但增长力度有限。新能源替代是长期风险，但短期内对传统能源需求影响可控。预计高油价环境至少维持到2026年底，期间公司盈利有保障。地缘政治风险具有突发性和不确定性，可能导致油价大幅波动。',
        oneSentence: '能源央企龙头，受益于油价高位和国企改革，高股息低估值，稳健上行趋势，适合防御型配置。',
        bullFactors: ['能源安全战略支撑', 'OPEC+减产推高油价', '国企改革估值重塑', '高股息率（>6%）', '估值处于历史低位'],
        bearFactors: ['国际油价波动风险', '新能源长期替代压力', '经济复苏不及预期', '资本开支持续高企', '炼化板块盈利波动'],
        scores: {
            technical: 68,
            fundamental: 75,
            industry: 72,
            macro: 78
        },
        crossValidation: '四个维度一致性较好，均偏向乐观。技术面缓慢上行与基本面盈利稳健相互印证；行业面景气向好与宏观面地缘政治支撑形成合力。矛盾点相对较少，主要是：短期油价已处高位，继续上行空间可能有限；长期新能源替代压力与短期高盈利并存。综合判断：上行趋势稳健但斜率不高，以震荡上行为主，适合作为底仓配置获取股息收益和估值修复收益。需关注OPEC+政策变化和地缘政治局势演变。'
    }
];

const stocks = stocksConfig.map(config => generateStockData(config));

const outputPath = path.join(__dirname, 'stocks.json');
fs.writeFileSync(outputPath, JSON.stringify(stocks, null, 2), 'utf8');
console.log('stocks.json 生成成功，共', stocks.length, '只股票');
console.log('文件路径:', outputPath);
