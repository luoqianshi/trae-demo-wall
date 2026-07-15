import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView } from 'expo-camera';
import * as Speech from 'expo-speech';

export default function NavigationScreen({ state, cameraActive, onToggleCamera }) {
  const [guidance, setGuidance] = useState('准备出发');

  useEffect(() => {
    if (state) {
      const timer = setInterval(() => {
        const steps = [
          '沿当前道路直行200米',
          '前方50米右转',
          '注意，前方有台阶，请小心',
          '已到达目标区域附近',
        ];
        const random = steps[Math.floor(Math.random() * steps.length)];
        setGuidance(random);
        Speech.speak(random, { language: 'zh-CN', rate: 0.9 });
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [state]);

  return (
    <View style={styles.container}>
      {/* 导航信息 */}
      <View style={styles.navHeader}>
        <Text style={styles.destText}>{state?.destination || '导航中'}</Text>
        <Text style={styles.distText}>剩余 {state?.distance || 0} 米 · {state?.eta || 0} 分钟</Text>
      </View>

      {/* 当前指引 */}
      <View style={styles.guidanceCard}>
        <Text style={styles.guidanceText}>{guidance}</Text>
      </View>

      {/* 摄像头预览（左滑激活） */}
      {cameraActive && (
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing="back">
            <View style={styles.aiOverlay}>
              <Text style={styles.aiText}>AI 识别中...</Text>
              <Text style={styles.aiDetail}>检测到：盲道、前方无障碍物</Text>
            </View>
          </CameraView>
        </View>
      )}

      {/* 模式指示 */}
      <View style={styles.modeBar}>
        <Text style={styles.modeText}>🚶 步行模式</Text>
        <Text style={styles.modeHint}>左滑打开AI摄像头辅助</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  navHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  destText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  distText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  guidanceCard: {
    backgroundColor: 'rgba(13,148,136,0.2)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13,148,136,0.4)',
    marginBottom: 20,
  },
  guidanceText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0D9488',
    textAlign: 'center',
  },
  cameraContainer: {
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  aiOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
  },
  aiText: {
    color: '#0D9488',
    fontSize: 14,
    fontWeight: '600',
  },
  aiDetail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  modeBar: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
  },
  modeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modeHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});