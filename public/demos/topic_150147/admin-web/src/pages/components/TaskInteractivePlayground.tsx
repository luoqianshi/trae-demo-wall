import { useRef, useEffect, useState } from 'react';
import { Card, Tag, Spin } from 'antd';
import { CodeOutlined, ReloadOutlined, FullscreenOutlined } from '@ant-design/icons';

interface Props {
  demoHtml: string;
  title: string;
}

export default function TaskInteractivePlayground({ demoHtml, title }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!demoHtml) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const iframe = iframeRef.current;
      if (iframe) {
        iframe.srcdoc = demoHtml;
      }
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  }, [demoHtml]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      setLoading(true);
      iframeRef.current.srcdoc = demoHtml;
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    }
  };

  if (!demoHtml) return null;

  return (
    <Card
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CodeOutlined style={{ color: '#1677ff' }} />
          <span>在线交互演示</span>
          <Tag color="blue" style={{ borderRadius: 4, fontSize: 11 }}>试试看！</Tag>
        </span>
      }
      extra={
        <div style={{ display: 'flex', gap: 6 }}>
          <span
            onClick={handleRefresh}
            style={{ cursor: 'pointer', color: '#8c8c8c', fontSize: 16, padding: '2px 6px', borderRadius: 4 }}
            title="刷新"
          >
            <ReloadOutlined />
          </span>
          <span
            onClick={handleFullscreen}
            style={{ cursor: 'pointer', color: '#8c8c8c', fontSize: 16, padding: '2px 6px', borderRadius: 4 }}
            title="全屏"
          >
            <FullscreenOutlined />
          </span>
        </div>
      }
      style={{
        marginBottom: 16,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
      styles={{ body: { padding: 0, position: 'relative' } }}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        {loading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fafcff', zIndex: 1, borderRadius: '0 0 12px 12px',
          }}>
            <Spin tip="加载中..." />
          </div>
        )}
        {error ? (
          <div style={{
            padding: 40, textAlign: 'center', color: '#8c8c8c',
            background: '#fafafa', borderRadius: '0 0 12px 12px',
          }}>
            <CodeOutlined style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
            演示内容加载失败
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title={`${title} 交互演示`}
            style={{
              width: '100%',
              height: 480,
              border: 'none',
              borderRadius: '0 0 12px 12px',
              background: '#fff',
            }}
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => setLoading(false)}
          />
        )}
      </div>
    </Card>
  );
}
