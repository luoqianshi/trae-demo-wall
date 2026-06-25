import { Link } from 'react-router-dom';
import Starfield from '../components/Starfield';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-page">
      <Starfield />
      <section className="hero-section">
        <div className="hero-content">
          <h1>
            研易记：<em>基于大模型的</em>
            <br />
            沉浸式论文公式提取与复刻助手
          </h1>
          <p className="hero-subtitle">
            一键框选，秒级生成 LaTeX —— 让科研工作者从机械排版中解放，专注于创新本身。
          </p>
          <div className="hero-actions">
            <Link to="/upload" className="btn btn-primary btn-lg">
              开始使用
            </Link>
            <Link to="/library" className="btn btn-secondary btn-lg">
              我的公式库
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2 className="section-title">核心功能</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🖥</div>
              <h3>桌面端截屏识别</h3>
              <p>全局快捷键 Ctrl+Shift+Y 唤起截屏，框选公式区域，大模型实时解析并返回 LaTeX 代码。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>网页端交互式提取</h3>
              <p>上传 PDF 图片，在网页中框选目标公式，支持批量识别与在线编辑预览。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>智能笔记管理</h3>
              <p>提取结果自动归档至个人公式库，支持按论文、主题、标签分类检索，构建公式知识图谱。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <h2 className="section-title">效率数据</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-num">10x</div>
              <div className="stat-label">平均效率提升</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">95%</div>
              <div className="stat-label">识别准确率</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">3s</div>
              <div className="stat-label">平均响应延迟</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">80%</div>
              <div className="stat-label">心流保持率</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;