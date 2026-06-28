'use client';

import { Button, Card, Space, Typography } from 'antd';

interface MetricItem {
  label: string;
  value: string;
  hint?: string;
}

interface ReferenceItem {
  label: string;
  value: string;
  detail: string;
}

interface PageHeroProps {
  kicker: string;
  title: string;
  description: string;
  metrics: MetricItem[];
  references?: ReferenceItem[];
  highlights?: string[];
  actions?: React.ReactNode;
  sideStats?: MetricItem[];
}

export function PageHero({ kicker, title, description, metrics, references = [], highlights = [], actions, sideStats = [] }: PageHeroProps) {
  return (
    <Card className="jobscope-hero-board" bordered={false}>
      <div className="jobscope-hero-grid">
        <div className="jobscope-hero-copy">
          <span className="jobscope-hero-kicker jobscope-reveal jobscope-reveal-1">{kicker}</span>
          <div className="jobscope-hero-badge jobscope-reveal jobscope-reveal-2">
            <span className="jobscope-hero-badge-dot" />
            当前页面用于展示模块说明、核心信息与操作入口
          </div>
          <Typography.Title level={1} className="jobscope-hero-title jobscope-reveal jobscope-reveal-3">
            {title}
          </Typography.Title>
          <Typography.Paragraph className="jobscope-hero-description jobscope-reveal jobscope-reveal-4">{description}</Typography.Paragraph>
          {highlights.length ? (
            <div className="jobscope-hero-highlights jobscope-reveal jobscope-reveal-5">
              {highlights.map((item, index) => (
                <span key={item} className="jobscope-hero-chip" style={{ animationDelay: `${0.3 + index * 0.08}s` }}>
                  {item}
                </span>
              ))}
            </div>
          ) : null}
          {actions ? <Space wrap className="jobscope-reveal jobscope-reveal-6">{actions}</Space> : null}
          <div className="jobscope-hero-metrics jobscope-reveal jobscope-reveal-7">
            {metrics.map((metric, index) => (
              <div key={metric.label} className="jobscope-hero-metric" style={{ animationDelay: `${0.45 + index * 0.08}s` }}>
                <span className="jobscope-hero-metric-label">{metric.label}</span>
                <strong>{metric.value}</strong>
                <span>{metric.hint ?? '实时汇总'}</span>
              </div>
            ))}
          </div>
          {references.length ? (
            <div className="jobscope-reference-strip jobscope-reveal jobscope-reveal-8">
              {references.map((item, index) => (
                <div key={item.label} className="jobscope-reference-card" style={{ animationDelay: `${0.6 + index * 0.08}s` }}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="jobscope-hero-visual jobscope-reveal jobscope-reveal-4">
          <div className="jobscope-hero-scroll-hint">
            <span />
            <b>Overview / Introduction / Guidance</b>
          </div>
          <div className="jobscope-hero-side-stats">
            {sideStats.map((item, index) => (
              <div key={item.label} className={`jobscope-side-stat-card ${index === 1 ? 'accent' : ''}`} style={{ animationDelay: `${0.4 + index * 0.1}s` }}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.hint ?? '状态稳定'}</small>
              </div>
            ))}
          </div>
          <Button type="default" size="large">
            当前模块功能导览
          </Button>
        </div>
      </div>
    </Card>
  );
}
