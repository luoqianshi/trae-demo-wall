<template>
  <div class="analytics-report-page">
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <i class="fas fa-chart-bar"></i>
        </div>
        <div class="header-title">
          <h1>数据分析报告</h1>
          <p>AI自动生成的运营分析报告</p>
        </div>
      </div>
      <div class="header-right">
        <el-select v-model="reportPeriod" class="period-select">
          <el-option label="本周" value="week" />
          <el-option label="本月" value="month" />
          <el-option label="本季度" value="quarter" />
        </el-select>
        <el-button type="primary" class="btn-primary" @click="generateReport">
          <i class="fas fa-refresh mr-2"></i> 生成报告
        </el-button>
        <el-button class="btn-secondary" @click="exportReport">
          <i class="fas fa-download mr-2"></i> 导出报告
        </el-button>
      </div>
    </div>

    <div class="report-stats">
      <div class="stat-card">
        <div class="stat-icon revenue">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-info">
          <p class="stat-label">总收入</p>
          <p class="stat-value">¥{{ formatNumber(reportData.revenue) }}</p>
          <p class="stat-change positive">↑ {{ reportData.revenueChange }}%</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orders">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <div class="stat-info">
          <p class="stat-label">订单数</p>
          <p class="stat-value">{{ reportData.orderCount }}</p>
          <p class="stat-change positive">↑ {{ reportData.orderChange }}%</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon customers">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-info">
          <p class="stat-label">新增会员</p>
          <p class="stat-value">{{ reportData.newCustomers }}</p>
          <p class="stat-change negative">↓ {{ reportData.customerChange }}%</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon conversion">
          <i class="fas fa-percentage"></i>
        </div>
        <div class="stat-info">
          <p class="stat-label">转化率</p>
          <p class="stat-value">{{ reportData.conversionRate }}%</p>
          <p class="stat-change positive">↑ {{ reportData.conversionChange }}%</p>
        </div>
      </div>
    </div>

    <div class="report-content">
      <div class="report-section chart-section">
        <div class="section-header">
          <h2 class="section-title">
            <i class="fas fa-chart-bar"></i> 销售趋势分析
          </h2>
          <p class="section-desc">近7天销售额变化</p>
        </div>
        <div class="chart-container">
          <div class="sales-chart">
            <div class="chart-bars">
              <div v-for="(item, idx) in reportData.salesTrend" :key="idx" class="bar-item">
                <div class="bar-wrapper">
                  <div class="bar" :style="{ height: item.percentage + '%' }"></div>
                </div>
                <span class="bar-label">{{ item.label }}</span>
                <span class="bar-value">¥{{ formatNumber(item.value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="report-section chart-section">
        <div class="section-header">
          <h2 class="section-title">
            <i class="fas fa-pie-chart"></i> 菜品销量占比
          </h2>
          <p class="section-desc">各菜品销售贡献</p>
        </div>
        <div class="chart-container">
          <div class="pie-chart-wrapper">
            <div class="pie-chart" :style="{ background: pieChartGradient }"></div>
            <div class="pie-legend">
              <div v-for="(item, idx) in reportData.productShare" :key="idx" class="legend-item">
                <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
                <span class="legend-text">{{ item.name }}</span>
                <span class="legend-value">{{ item.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="report-section insights-section">
        <div class="section-header">
          <h2 class="section-title">
            <i class="fas fa-brain"></i> AI分析洞察
          </h2>
        </div>
        <div class="insight-cards">
          <div v-for="(insight, idx) in reportData.insights" :key="idx" class="insight-card" :class="insight.type">
            <div class="insight-icon">
              <i :class="insight.icon"></i>
            </div>
            <div class="insight-content">
              <h3>{{ insight.title }}</h3>
              <p>{{ insight.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="report-section anomaly-section">
        <div class="section-header">
          <h2 class="section-title">
            <i class="fas fa-exclamation-triangle"></i> 异常检测
          </h2>
        </div>
        <div class="anomaly-list">
          <div v-for="(anomaly, idx) in reportData.anomalies" :key="idx" class="anomaly-item">
            <div class="anomaly-icon" :class="anomaly.level">
              <i :class="anomaly.icon"></i>
            </div>
            <div class="anomaly-info">
              <h3>{{ anomaly.title }}</h3>
              <p>{{ anomaly.description }}</p>
            </div>
            <div class="anomaly-meta">
              <span class="anomaly-time">{{ anomaly.time }}</span>
              <el-button type="text" size="small" class="handle-btn">处理</el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="report-section suggestion-section">
        <div class="section-header">
          <h2 class="section-title">
            <i class="fas fa-lightbulb"></i> 优化建议
          </h2>
        </div>
        <div class="suggestion-list">
          <div v-for="(suggestion, idx) in reportData.suggestions" :key="idx" class="suggestion-item">
            <div class="suggestion-number">{{ idx + 1 }}</div>
            <div class="suggestion-content">
              <h3>{{ suggestion.title }}</h3>
              <p>{{ suggestion.description }}</p>
              <div class="suggestion-meta">
                <span class="suggestion-tag">{{ suggestion.tag }}</span>
                <span class="suggestion-impact">预计提升: {{ suggestion.impact }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const reportPeriod = ref('week');

const reportData = ref({
  revenue: 125680,
  revenueChange: 12.5,
  orderCount: 3256,
  orderChange: 8.3,
  newCustomers: 286,
  customerChange: 3.2,
  conversionRate: 18.5,
  conversionChange: 2.1,
  salesTrend: [
    { label: '周一', value: 18500, percentage: 70 },
    { label: '周二', value: 22300, percentage: 85 },
    { label: '周三', value: 15600, percentage: 60 },
    { label: '周四', value: 28900, percentage: 100 },
    { label: '周五', value: 26800, percentage: 95 },
    { label: '周六', value: 32500, percentage: 100 },
    { label: '周日', value: 29800, percentage: 90 }
  ],
  productShare: [
    { name: '招牌红烧肉', percentage: 25, color: '#b45309' },
    { name: '清蒸鲈鱼', percentage: 20, color: '#10b981' },
    { name: '蒜蓉西兰花', percentage: 15, color: '#f59e0b' },
    { name: '麻婆豆腐', percentage: 12, color: '#ec4899' },
    { name: '其他', percentage: 28, color: '#6b7280' }
  ],
  insights: [
    {
      type: 'positive',
      icon: 'fas fa-thumbs-up',
      title: '周末销售高峰期',
      description: '周六和周日的销售额明显高于工作日，建议在周末增加促销活动以进一步提升业绩。'
    },
    {
      type: 'warning',
      icon: 'fas fa-alert-triangle',
      title: '周三销售低谷',
      description: '周三销售额处于本周最低点，建议推出周三专属优惠活动来提振销售。'
    },
    {
      type: 'info',
      icon: 'fas fa-info-circle',
      title: '会员消费占比提升',
      description: '会员消费占比达到45%，会员忠诚度计划效果显著，建议继续优化会员权益。'
    }
  ],
  anomalies: [
    {
      level: 'warning',
      icon: 'fas fa-exclamation-circle',
      title: '库存预警',
      description: '招牌红烧肉原材料库存不足，预计还能支撑3天销售，建议尽快补货。',
      time: '2小时前'
    },
    {
      level: 'error',
      icon: 'fas fa-times-circle',
      title: '订单异常',
      description: '发现5笔订单超过24小时未完成，可能存在服务问题，请及时处理。',
      time: '1小时前'
    },
    {
      level: 'info',
      icon: 'fas fa-info-circle',
      title: '会员流失预警',
      description: '有12位高价值会员超过30天未消费，建议发送个性化关怀消息。',
      time: '5小时前'
    }
  ],
  suggestions: [
    {
      title: '周三特惠活动',
      description: '针对周三销售低谷，建议推出"周三半价日"活动，选择2-3款热门菜品进行半价促销，预计可提升30%销售额。',
      tag: '促销活动',
      impact: '30%'
    },
    {
      title: '会员专属礼包',
      description: '为超过30天未消费的会员发送专属优惠券礼包，包含满减券和新品体验券，预计召回率可达25%。',
      tag: '会员运营',
      impact: '25%'
    },
    {
      title: '库存优化',
      description: '根据销售预测调整原材料采购周期，将招牌红烧肉的库存安全天数从3天增加到5天，避免缺货影响销售。',
      tag: '库存管理',
      impact: '15%'
    }
  ]
});

const pieChartGradient = computed(() => {
  const colors = reportData.value.productShare.map(p => p.color);
  const percentages = reportData.value.productShare.map(p => p.percentage);
  let gradient = 'conic-gradient(';
  let angle = 0;
  percentages.forEach((p, i) => {
    const endAngle = angle + (p / 100) * 360;
    gradient += `${colors[i]} ${angle}deg ${endAngle}deg`;
    if (i < percentages.length - 1) gradient += ', ';
    angle = endAngle;
  });
  gradient += ')';
  return gradient;
});

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
}

function generateReport() {
  alert('正在生成' + (reportPeriod.value === 'week' ? '周报' : reportPeriod.value === 'month' ? '月报' : '季度报告') + '...');
}

function exportReport() {
  alert('报告导出功能开发中...');
}
</script>

<style scoped>
.analytics-report-page {
  padding: 0;
  background: var(--ds-bg);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 18px;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  box-shadow: var(--ds-shadow-card);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--ds-primary) 0%, var(--ds-food) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
}

.header-title h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.header-title p {
  font-size: 14px;
  color: #64748b;
  margin: 4px 0 0 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.period-select {
  width: 120px;
  border-radius: 10px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--ds-primary) 0%, var(--ds-food) 100%) !important;
  border: none !important;
  border-radius: 10px !important;
  padding: 10px 20px !important;
  font-weight: 500 !important;
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.22) !important;
  transition: all 0.3s ease !important;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(180, 83, 9, 0.28) !important;
}

.btn-secondary {
  border-radius: 10px !important;
  padding: 10px 20px !important;
  color: #64748b !important;
  border-color: #e2e8f0 !important;
  background: white !important;
}

.report-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--ds-shadow-card);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.revenue {
  background: linear-gradient(135deg, var(--ds-primary) 0%, var(--ds-food) 100%);
}

.stat-icon.orders {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-icon.customers {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-icon.conversion {
  background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 6px 0;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.stat-change {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

.report-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 16px;
}

.report-section {
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  padding: 18px;
  box-shadow: var(--ds-shadow-card);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title i {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--ds-primary-soft);
  color: var(--ds-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.section-desc {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.chart-container {
  padding: 20px 0;
}

.sales-chart {
  height: 220px;
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 100%;
  padding-bottom: 40px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.bar-wrapper {
  width: 36px;
  height: 160px;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, var(--ds-primary) 0%, var(--ds-food) 100%);
  border-radius: 8px;
  transition: height 0.6s ease;
}

.bar-label {
  font-size: 12px;
  color: #64748b;
}

.bar-value {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
}

.pie-chart-wrapper {
  display: flex;
  align-items: center;
  gap: 40px;
}

.pie-chart {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pie-legend {
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-text {
  flex: 1;
  font-size: 14px;
  color: #475569;
}

.legend-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.insight-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.insight-card {
  padding: 20px;
  border-radius: 12px;
  display: flex;
  gap: 16px;
  transition: transform 0.3s ease;
}

.insight-card:hover {
  transform: translateX(4px);
}

.insight-card.positive {
  background: #f0fdf4;
  border-left: 4px solid #22c55e;
}

.insight-card.warning {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
}

.insight-card.info {
  background: var(--ds-primary-soft);
  border-left: 4px solid var(--ds-primary);
}

.insight-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.insight-card.positive .insight-icon {
  background: #dcfce7;
  color: #16a34a;
}

.insight-card.warning .insight-icon {
  background: #fef3c7;
  color: #d97706;
}

.insight-card.info .insight-icon {
  background: #fff7ed;
  color: var(--ds-primary);
}

.insight-content h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.insight-content p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
}

.anomaly-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.anomaly-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.anomaly-item:hover {
  background: #f1f5f9;
}

.anomaly-icon {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.anomaly-icon.warning {
  background: #fef3c7;
  color: #d97706;
}

.anomaly-icon.error {
  background: #fee2e2;
  color: #ef4444;
}

.anomaly-icon.info {
  background: var(--ds-primary-soft);
  color: var(--ds-primary);
}

.anomaly-info {
  flex: 1;
}

.anomaly-info h3 {
  margin: 0 0 6px 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.anomaly-info p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.anomaly-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.anomaly-time {
  font-size: 12px;
  color: #94a3b8;
}

.handle-btn {
  color: var(--ds-primary) !important;
  font-weight: 500 !important;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suggestion-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
}

.suggestion-number {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--ds-primary) 0%, var(--ds-food) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
}

.suggestion-content h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.suggestion-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
}

.suggestion-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.suggestion-tag {
  background: var(--ds-primary-soft);
  color: var(--ds-primary-700);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.suggestion-impact {
  font-size: 13px;
  font-weight: 600;
  color: #10b981;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-right {
    flex-wrap: wrap;
    justify-content: center;
  }

  .report-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .report-content {
    grid-template-columns: 1fr;
  }

  .pie-chart-wrapper {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
