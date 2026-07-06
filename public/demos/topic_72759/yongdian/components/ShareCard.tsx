'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2 } from 'lucide-react';
import { WisdomCardData } from '@/lib/types';

interface ShareCardProps {
  data: WisdomCardData;
}

/** 分享卡片内联样式（确保SVG导出兼容，不依赖外部CSS） */
const S = {
  card: {
    width: '400px', minHeight: '640px', padding: '28px 24px', boxSizing: 'border-box',
    background: 'linear-gradient(135deg, #F5F0E6 0%, #EDE4D0 100%)',
    border: '3px double #8B7355', display: 'flex', flexDirection: 'column',
    fontFamily: '"Noto Serif SC", "Songti SC", serif', color: '#2C2C2C',
    position: 'relative', boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  seal: {
    display: 'inline-block', backgroundColor: '#C8442A', color: '#F5F0E6',
    fontWeight: '700', borderRadius: '4px',
  } as React.CSSProperties,
  label: {
    color: '#8B7355', fontFamily: '"Noto Sans SC", sans-serif',
  } as React.CSSProperties,
  vertical: {
    writingMode: 'vertical-rl', textOrientation: 'upright', fontSize: '18px',
    lineHeight: '2.2', letterSpacing: '0.3em', color: '#2C2C2C', maxHeight: '180px',
    fontFamily: '"LXGW WenKai", "Kaiti SC", "KaiTi", serif',
  } as React.CSSProperties,
};

export default function ShareCard({ data }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  /** 下载为 SVG 图片（纯CSS实现，不使用canvas） */
  const handleDownload = () => {
    const cardEl = cardRef.current;
    if (!cardEl) return;
    const serializer = new XMLSerializer();
    const cloned = cardEl.cloneNode(true) as HTMLElement;
    const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="640" viewBox="0 0 400 640">
  <foreignObject width="400" height="640">${serializer.serializeToString(cloned)}</foreignObject>
</svg>`;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '用典-智慧卡片.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /** 复制文字到剪贴板 */
  const handleCopy = () => {
    const text = `【用典】\n古文：${data.originalText}\n译文：${data.translation}\n出处：《${data.book}》${data.chapter}\n今用：${data.advice}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-3">
      {/* 可下载的古风分享卡片 */}
      <div className="flex justify-center">
        <div ref={cardRef} style={S.card}>
          {/* 顶部标题 */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ ...S.seal, fontSize: '16px', padding: '4px 20px', letterSpacing: '0.3em' }}>
              用 典
            </span>
            <p style={{ ...S.label, fontSize: '11px', marginTop: '8px' }}>
              让千年典籍智慧，主动为你解今之忧
            </p>
          </div>

          {/* 用户问题 */}
          <div style={{ borderBottom: '1px solid rgba(139,115,85,0.2)', paddingBottom: '12px', marginBottom: '16px' }}>
            <p style={{ ...S.label, fontSize: '11px', marginBottom: '4px' }}>问：</p>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#2C2C2C' }}>{data.query}</p>
          </div>

          {/* 古文竖排 */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', marginBottom: '12px' }}>
            <div style={S.vertical}>{data.originalText}</div>
          </div>

          {/* 出处印章 */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <span style={{ ...S.seal, fontSize: '12px', padding: '3px 14px', borderRadius: '3px', letterSpacing: '0.15em' }}>
              {data.book} · {data.chapter}
            </span>
            <span style={{ ...S.label, fontSize: '11px', marginLeft: '8px' }}>{data.era}</span>
          </div>

          {/* 译文 */}
          <p style={{ ...S.label, fontSize: '12px', lineHeight: '1.8', marginBottom: '16px', textAlign: 'justify' }}>
            {data.translation}
          </p>

          {/* 今用建议 */}
          <div style={{ borderTop: '1px solid rgba(139,115,85,0.2)', paddingTop: '12px', flex: '1' }}>
            <p style={{ fontSize: '11px', color: '#5C8D89', marginBottom: '6px', fontWeight: '600', fontFamily: '"Noto Sans SC", sans-serif' }}>
              今用建议
            </p>
            <p style={{ fontSize: '12px', lineHeight: '1.7', color: '#2C2C2C', fontFamily: '"Noto Sans SC", sans-serif' }}>
              {data.advice}
            </p>
          </div>

          {/* 底部装饰 */}
          <p style={{ ...S.label, textAlign: 'center', marginTop: '16px', fontSize: '10px', color: 'rgba(139,115,85,0.5)' }}>
            — 用典 · 古籍智慧生活顾问 —
          </p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-lg bg-zhusha px-5 py-2 font-hei text-sm text-xuanzhi shadow-sm transition-shadow hover:shadow-md"
        >
          <Download size={16} />
          下载分享图
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-lg border border-danmo/40 bg-xuanzhi px-5 py-2 font-hei text-sm text-danmo transition-colors hover:bg-danmo/5"
        >
          <Share2 size={16} />
          {copied ? '已复制' : '复制文字'}
        </motion.button>
      </div>
    </div>
  );
}
