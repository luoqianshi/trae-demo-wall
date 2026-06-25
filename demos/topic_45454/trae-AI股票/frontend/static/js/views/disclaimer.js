/**
 * 免责声明视图
 */
const DisclaimerView = {
  name: "DisclaimerView",
  template: `
    <div>
      <div class="card disclaimer-card">
        <div class="card-title">⚠️ 免责声明</div>

        <div class="disclaimer-section">
          <h3>一、使用范围</h3>
          <p>本项目（AI智股）仅面向<strong>金融类、大数据技术等专业学生</strong>用于学习与教学使用，旨在帮助学习者理解时序预测、模型评估、数据可视化等抽象概念，降低 AI 学习曲线。</p>
        </div>

        <div class="disclaimer-section">
          <h3>二、预测结果说明</h3>
          <p>本平台所展示的所有预测结果<strong>仅为模拟参考</strong>，基于历史数据与数学模型计算得出，不代表未来真实走势。模型表现受数据质量、参数设置、市场环境等多种因素影响，存在不可避免的不确定性。</p>
        </div>

        <div class="disclaimer-section">
          <h3>三、不构成投资建议</h3>
          <p>本平台所有内容<strong>不构成任何形式的投资建议</strong>。股票市场具有高风险性，实际投资决策应基于个人风险承受能力、独立研究及专业金融顾问的意见。因使用本平台内容而产生的任何直接或间接损失，本项目及开发者不承担任何责任。</p>
        </div>

        <div class="disclaimer-section">
          <h3>四、数据来源</h3>
          <p>本平台使用的数据包括用户自行上传的 CSV/Excel/JSON 文件、本地数据库数据，以及平台生成的模拟数据。所有数据仅用于教学演示，不涉及任何真实交易数据。</p>
        </div>

        <div class="disclaimer-section">
          <h3>五、请慎重考虑</h3>
          <p>请用户在使用本平台时<strong>慎重考虑</strong>以下事项：</p>
          <ul>
            <li>本平台为学习工具，不可用于实际投资决策；</li>
            <li>历史表现不代表未来收益，模型预测存在误差；</li>
            <li>股票投资有风险，入市需谨慎；</li>
            <li>请遵守所在地区相关法律法规，理性使用本工具。</li>
          </ul>
        </div>

        <div class="disclaimer-confirm">
          <label class="flex gap-1" style="align-items:center;cursor:pointer;">
            <input type="checkbox" v-model="agreed" style="width:18px;height:18px;" />
            <span>我已阅读并理解上述免责声明，确认本平台仅用于学习目的，预测结果不构成投资建议。</span>
          </label>
          <div class="mt-2">
            <router-link to="/" class="btn" :class="{ 'btn-outline': !agreed }">
              {{ agreed ? '返回首页 →' : '我知道了' }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return { agreed: false };
  },
};

window.DisclaimerView = DisclaimerView;
