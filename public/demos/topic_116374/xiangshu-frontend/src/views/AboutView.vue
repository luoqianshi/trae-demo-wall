<script setup>
// 关于页：项目介绍、使命愿景、创收模式
</script>

<template>
  <div class="page">
    <div class="about-hero">
      <div class="section-eyebrow center">关于乡书</div>
      <h2 class="section-title">把根留住，把故事讲下去</h2>
      <p class="section-sub center">
        乡书是一个帮助乡村家庭建立数字档案的项目。我们相信，每一个普通家庭的故事，都值得被认真保存。
      </p>
    </div>

    <div class="about-cards">
      <div class="about-card moss">
        <div class="card-icon"><AppIcon icon="lucide:archive" :size="26" /></div>
        <h4>我们做什么</h4>
        <p>为乡村家庭提供一套完整的数字建档工具：扫描老照片、记录口述历史、整理家族谱系、归档老旧文档，让脆弱的家族记忆获得永久的数字生命。</p>
      </div>
      <div class="about-card earth">
        <div class="card-icon"><AppIcon icon="lucide:heart" :size="26" /></div>
        <h4>为什么做</h4>
        <p>农村家庭有大量珍贵资料正在消失：发黄的老照片、虫蛀的家谱、模糊的地契、老人的口述。这些一旦丢失，就再也找不回来了。我们想让它们被认真对待。</p>
      </div>
      <div class="about-card seal">
        <div class="card-icon"><AppIcon icon="lucide:eye" :size="26" /></div>
        <h4>我们的愿景</h4>
        <p>让每一个乡村家庭都有一本可以传给后代的"数字家书"。无论孩子走多远，打开乡书，就能看见自己从哪里来。</p>
      </div>
    </div>

    <div class="mission-band">
      <blockquote>"一个没有记忆的家庭，<br />就像一棵没有根的树。"</blockquote>
      <cite>— 乡书 · 创办初衷</cite>
    </div>

    <div class="biz-section">
      <div class="section-eyebrow">可持续</div>
      <h2 class="section-title">我们如何延续</h2>
      <div class="about-cards">
        <div class="about-card earth">
          <div class="card-icon"><AppIcon icon="lucide:sparkles" :size="26" /></div>
          <h4>付费精修服务</h4>
          <p>提供老照片 AI 修复、上色、家族纪念册印刷等增值服务，所得用于维持平台运转。</p>
        </div>
        <div class="about-card moss">
          <div class="card-icon"><AppIcon icon="lucide:handshake" :size="26" /></div>
          <h4>机构合作</h4>
          <p>与地方文旅、文化馆、高校合作，开展乡村记忆抢救计划，共同保存地方文化。</p>
        </div>
        <div class="about-card seal">
          <div class="card-icon"><AppIcon icon="lucide:gift" :size="26" /></div>
          <h4>公益建档</h4>
          <p>对偏远山区、留守老人家庭，提供免费建档支持，确保记忆保护不分贫富。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-hero {
  text-align: center;
  max-width: 760px;
  margin: 0 auto 50px;
}

.section-eyebrow.center {
  justify-content: center;
}

.section-sub.center {
  margin: 0 auto;
}

.about-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 40px;
}

.about-card {
  background: var(--bg-warm);
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow-soft);
  border-top: 3px solid var(--moss);
}

.about-card.seal { border-top-color: var(--seal); }
.about-card.earth { border-top-color: var(--primary-light); }

.card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  background: rgba(90, 122, 107, 0.12);
  color: var(--moss-deep);
}

.about-card.earth .card-icon {
  background: rgba(212, 165, 116, 0.18);
  color: var(--primary-deep);
}

.about-card.seal .card-icon {
  background: rgba(168, 50, 50, 0.1);
  color: var(--seal);
}

.about-card h4 {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--primary-deep);
  margin-bottom: 10px;
  font-weight: 400;
}

.about-card p {
  font-size: 14px;
  color: var(--text-light);
  line-height: 1.7;
}

.mission-band {
  background: linear-gradient(135deg, var(--bg-warm), var(--bg-deep));
  border-radius: var(--radius-lg);
  padding: 50px;
  text-align: center;
  box-shadow: var(--shadow-soft);
  position: relative;
  overflow: hidden;
  margin-bottom: 40px;
}

.mission-band::before {
  content: '';
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(168, 50, 50, 0.05);
}

.mission-band blockquote {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--primary-deep);
  line-height: 1.6;
  margin-bottom: 14px;
  position: relative;
  font-weight: 400;
}

.mission-band cite {
  font-style: normal;
  color: var(--seal);
  letter-spacing: 3px;
  font-size: 13px;
}

.biz-section {
  margin-top: 40px;
}

@media (max-width: 768px) {
  .about-cards {
    grid-template-columns: 1fr;
  }
  .mission-band {
    padding: 30px 20px;
  }
  .mission-band blockquote {
    font-size: 22px;
  }
}
</style>
