/**
 * DevicePhotoGallery - 设备照片展示组件
 * 展示 ESP32 设备上传的答题前/后照片
 */
import React, { useState, useEffect } from 'react';
import { Row, Col, Image, Card, Spin, Empty, Tag, Typography } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import { devicePhotoAPI } from '../api/client';

const { Text } = Typography;

interface DevicePhotoGalleryProps {
  deviceId: string;
  deviceName?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

export default function DevicePhotoGallery({ deviceId, deviceName }: DevicePhotoGalleryProps) {
  const [photos, setPhotos] = useState<Array<{ filename: string; size: number; mod_time: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deviceId) return;
    setLoading(true);
    devicePhotoAPI.list(deviceId)
      .then(res => setPhotos(res.data))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, [deviceId]);

  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

  if (photos.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无照片，设备打卡后会在这里显示"
      />
    );
  }

  return (
    <div>
      <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
        <CameraOutlined /> 共 {photos.length} 张照片
      </Text>
      <Row gutter={[12, 12]}>
        {photos.map(photo => {
          const imgUrl = devicePhotoAPI.getUrl(deviceId, photo.filename);
          const isPre = photo.filename.startsWith('pre_');
          const isPost = photo.filename.startsWith('post_');
          const label = isPre ? '答题前' : isPost ? '答题后' : '其他';
          const color = isPre ? 'blue' : isPost ? 'green' : 'default';
          return (
            <Col key={photo.filename} xs={12} sm={8} md={6} lg={4}>
              <Card
                size="small"
                hoverable
                cover={
                  <Image
                    src={imgUrl}
                    alt={photo.filename}
                    style={{ height: 140, objectFit: 'cover' }}
                    preview={{ src: imgUrl }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                  />
                }
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Tag color={color} style={{ margin: 0 }}>{label}</Tag>
                  <Text type="secondary" style={{ fontSize: 11 }}>{formatFileSize(photo.size)}</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                  {formatTime(photo.mod_time)}
                </Text>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}