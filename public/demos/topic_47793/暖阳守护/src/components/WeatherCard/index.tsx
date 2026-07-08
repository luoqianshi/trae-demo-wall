import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import type { WeatherInfo } from '@/types';

interface WeatherCardProps {
  weather: WeatherInfo;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
  const getWeatherIcon = () => {
    switch (weather.weather) {
      case '晴':
        return '☀️';
      case '多云':
        return '⛅';
      case '阴':
        return '☁️';
      case '雨':
        return '🌧️';
      case '雪':
        return '❄️';
      default:
        return '🌤️';
    }
  };

  return (
    <View className={styles.weatherCard}>
      <View className={styles.left}>
        <Text className={styles.icon}>{getWeatherIcon()}</Text>
        <View className={styles.tempInfo}>
          <Text className={styles.temperature}>{weather.temperature}°</Text>
          <Text className={styles.weatherText}>{weather.weather}</Text>
        </View>
      </View>
      <View className={styles.right}>
        <Text className={styles.city}>{weather.city}</Text>
        <Text className={styles.details}>{weather.humidity} | {weather.wind}</Text>
      </View>
    </View>
  );
};

export default WeatherCard;