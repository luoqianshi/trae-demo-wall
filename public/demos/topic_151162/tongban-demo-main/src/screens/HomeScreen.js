import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

export default function HomeScreen({ onStartNavigation }) {
  const [inputMode, setInputMode] = useState(false);
  const [destination, setDestination] = useState('');

  const speak = (text) => {
    Speech.stop();
    Speech.speak(text, { language: 'zh-CN', rate: 0.9 });
  };

  const quickDestinations = [
    { name: '回家', icon: 'home' },
    { name: '最近医院', icon: 'medical' },
    { name: '附近超市', icon: 'cart' },
    { name: '公交站', icon: 'bus' },
  ];

  return (
    <View style={styles.container}>
      {/* 顶部状态 */}
      <View style={styles.header}>
        <Text style={styles.logo}>瞳伴</Text>
        <Text style={styles.subtitle}>AI 出行伙伴</Text>
      </View>

      {/* 快捷目的地 */}
      <View style={styles.quickGrid}>
        {quickDestinations.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickBtn}
            onPress={() => {
              speak(`开始导航到${item.name}`);
              onStartNavigation(item.name);
            }}
          >
            <Ionicons name={item.icon} size={28} color="#0D9488" />
            <Text style={styles.quickText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 语音输入提示 */}
      <View style={styles.voiceHint}>
        <Text style={styles.voiceText}>说出目的地，例如"去朝阳医院"</Text>
      </View>

      {/* 当前位置 */}
      <View style={styles.locationCard}>
        <Text style={styles.locationLabel}>当前位置</Text>
        <Text style={styles.locationValue}>北京市朝阳区建国路88号附近</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    letterSpacing: 2,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  quickBtn: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  voiceHint: {
    backgroundColor: 'rgba(13,148,136,0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(13,148,136,0.3)',
  },
  voiceText: {
    color: '#0D9488',
    fontSize: 14,
  },
  locationCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  locationLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 4,
  },
  locationValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});