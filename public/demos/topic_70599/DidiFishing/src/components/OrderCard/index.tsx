import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import Tag from '../Tag';
import { formatDate, formatWeekday, formatPrice, getStatusInfo } from '../../utils/format';
import type { Order } from '../../types/order';
import styles from './index.module.scss';

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
  onInvite?: () => void;
  isOwner?: boolean;
  showInviteButton?: boolean;
  isInvited?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onClick,
  onInvite,
  isOwner = false,
  showInviteButton = true,
  isInvited = false
}) => {
  const status = getStatusInfo(order.status);
  const dateLabel = `${formatDate(order.date, 'MM月DD日')} ${formatWeekday(order.date)}`;
  const isFree = order.price === 0;

  const handleInvite = (e: any) => {
    e?.stopPropagation?.();
    if (isInvited) {
      Taro.showToast({ title: '已邀请过，请等待回复', icon: 'none' });
      return;
    }
    onInvite?.();
  };

  return (
    <View className={styles.card} onClick={onClick}>
      <View className={styles.coverWrap}>
        <Image className={styles.cover} src={order.spotImage} mode="aspectFill" />
        <View className={classnames(styles.statusBadge, styles[status.color])}>
          <Text className={styles.statusText}>{status.label}</Text>
        </View>
        <View className={styles.dateTag}>
          <Text className={styles.dateText}>{dateLabel}</Text>
        </View>
      </View>

      <View className={styles.body}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{order.title}</Text>
        </View>

        <View className={styles.spotRow}>
          <Text className={styles.spotIcon}>📍</Text>
          <Text className={styles.spotText}>{order.spot} · {order.city}</Text>
        </View>

        <View className={styles.tagRow}>
          <Tag text={order.fishingType} color="primary" />
          {order.fishTypes.slice(0, 2).map((f) => (
            <Tag key={f} text={f} color="accent" />
          ))}
          {order.fishTypes.length > 2 && <Tag text={`+${order.fishTypes.length - 2}`} color="grey" />}
        </View>

        <View className={styles.infoRow}>
          <View className={styles.infoItem}>
            <Text className={styles.infoValue}>{order.duration}</Text>
            <Text className={styles.infoLabel}>时长</Text>
          </View>
          <View className={styles.divider} />
          <View className={styles.infoItem}>
            <Text className={styles.infoValue}>
              {order.peopleJoined}/{order.peopleNeeded}
            </Text>
            <Text className={styles.infoLabel}>人数</Text>
          </View>
          <View className={styles.divider} />
          <View className={styles.infoItem}>
            <Text className={classnames(styles.infoValue, isFree && styles.freeText)}>
              {isFree ? '免费' : formatPrice(order.price)}
            </Text>
            <Text className={styles.infoLabel}>人均</Text>
          </View>
        </View>

        <View className={styles.footer}>
          <View className={styles.publisher}>
            <Image className={styles.publisherAvatar} src={order.publisherAvatar} mode="aspectFill" />
            <View className={styles.publisherInfo}>
              <Text className={styles.publisherName}>{order.publisherName}</Text>
              <Text className={styles.publisherMeta}>
                Lv{order.publisherLevel} · 钓龄{order.publisherYears}年
              </Text>
            </View>
          </View>

          {showInviteButton && order.status === 'recruiting' && !isOwner && (
            <View className={classnames(styles.inviteBtn, isInvited && styles.inviteBtnDisabled)} onClick={handleInvite}>
              <Text className={styles.inviteBtnText}>{isInvited ? '已邀请' : '邀请带钓'}</Text>
            </View>
          )}

          {order.status === 'matched' && (
            <View className={styles.matchedBadge}>
              <Text className={styles.matchedText}>已撮合</Text>
            </View>
          )}

          {order.status === 'ongoing' && (
            <View className={styles.ongoingBadge}>
              <Text className={styles.ongoingText}>进行中</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default OrderCard;
