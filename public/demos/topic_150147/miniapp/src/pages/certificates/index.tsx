import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { certAPI } from '../../services/api';

export default function Certificates() {
  const [certs, setCerts] = useState<any[]>([]);
  const [previewCert, setPreviewCert] = useState<any>(null);

  useEffect(() => { loadCerts(); }, []);

  const loadCerts = async () => {
    try {
      const res: any = await certAPI.getMy();
      if (res.code === 0) setCerts(res.data || []);
    } catch { /* ignore */ }
  };

  const certTypeBadge = (type: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      completion: { label: '结营证书', color: '#1677ff', bg: '#e6f7ff' },
      excellent: { label: '优秀证书', color: '#fa8c16', bg: '#fff7e6' },
      special: { label: '特别证书', color: '#722ed1', bg: '#f9f0ff' },
    };
    const info = map[type] || { label: type || '证书', color: '#8c8c8c', bg: '#f5f5f5' };
    return (
      <Text style={{
        fontSize: '12px', padding: '2px 8px', borderRadius: '4px',
        background: info.bg, color: info.color, display: 'inline-block',
      }}>
        {info.label}
      </Text>
    );
  };

  return (
    <ScrollView scrollY style={{ height: '100vh', padding: '16px' }}>
      <View style={{ padding: '16px 0' }}>
        <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>我的证书</Text>
      </View>

      {certs.length === 0 ? (
        <View style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c' }}>
          <Text style={{ display: 'block', fontSize: '16px', marginBottom: '8px' }}>暂无证书</Text>
          <Text style={{ display: 'block', fontSize: '13px' }}>完成PBL项目后，老师将为你颁发证书</Text>
        </View>
      ) : (
        certs.map((cert: any) => (
          <View
            key={cert.id}
            style={{
              background: '#fff', borderRadius: '12px', padding: '24px',
              marginBottom: '12px', textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
            onClick={() => setPreviewCert(cert)}
          >
            <View style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffd700, #ffec3d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', boxShadow: '0 2px 8px rgba(255,215,0,0.3)',
            }}>
              <Text style={{ fontSize: '28px' }}>奖</Text>
            </View>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              {cert.camp_name}
            </Text>
            {certTypeBadge(cert.type)}
            <Text style={{ color: '#8c8c8c', fontSize: '12px', display: 'block', marginTop: '8px' }}>
              颁发时间: {cert.issued_at}
            </Text>
            <Text style={{ color: '#1677ff', fontSize: '12px', display: 'block', marginTop: '4px' }}>
              点击查看详情
            </Text>
          </View>
        ))
      )}

      {/* 证书预览弹窗 */}
      {previewCert && (
        <View style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <View style={{
            width: '85%', maxHeight: '75%', background: '#fff',
            borderRadius: '16px', padding: '24px', position: 'relative',
          }}>
            <View
              style={{
                position: 'absolute', top: '12px', right: '16px',
                width: '30px', height: '30px', borderRadius: '50%',
                background: '#f5f5f5', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
              onClick={() => setPreviewCert(null)}
            >
              <Text style={{ fontSize: '16px', color: '#666' }}>X</Text>
            </View>

            <View style={{ textAlign: 'center', paddingTop: '8px' }}>
              <View style={{
                width: '70px', height: '70px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffd700, #ffec3d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Text style={{ fontSize: '32px' }}>奖</Text>
              </View>

              <Text style={{ fontSize: '18px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                {previewCert.type === 'completion' ? '结营证书' : previewCert.type === 'excellent' ? '优秀证书' : '特别证书'}
              </Text>
              <Text style={{ fontSize: '15px', color: '#333', display: 'block', marginBottom: '4px' }}>
                {previewCert.camp_name}
              </Text>

              <View style={{
                background: '#fafafa', borderRadius: '12px', padding: '16px',
                textAlign: 'left', marginTop: '12px',
              }}>
                <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text style={{ color: '#8c8c8c', fontSize: '13px' }}>颁发时间</Text>
                  <Text style={{ color: '#333', fontSize: '13px' }}>{previewCert.issued_at}</Text>
                </View>
                {previewCert.description && (
                  <View style={{ marginTop: '8px' }}>
                    <Text style={{ color: '#8c8c8c', fontSize: '13px', display: 'block', marginBottom: '4px' }}>说明</Text>
                    <Text style={{ color: '#333', fontSize: '13px', lineHeight: '1.5', display: 'block' }}>
                      {previewCert.description}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={{ color: '#bfbfbf', fontSize: '11px', display: 'block', marginTop: '16px' }}>
                此证书由PBL教育平台颁发
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}