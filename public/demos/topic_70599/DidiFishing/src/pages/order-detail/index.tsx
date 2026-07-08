import React, { useEffect, useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import Tag from '../../components/Tag';
import { getOrderDetail, createInvitation, getInvitations } from '../../services/api';
import { useUserStore } from '../../store/userStore';
import { formatDate, formatWeekday, formatPrice, getStatusInfo } from '../../utils/format';
import type { Order } from '../../types/order';
import type { Invitation } from '../../types/invitation';
import styles from './index.module.scss';

const OrderDetailPage: React.FC = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasInvited, setHasInvited] = useState(false);
  const [invitationCount, setInvitationCount] = useState(0);
  const params = Taro.getCurrentInstance().router?.params;
  const orderId = params?.id || '';
  const currentUser = useUserStore((s) => s.currentUser);

  useEffect(() => {
    if (orderId) {
      fetchDetail();
    }
  }, [orderId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await getOrderDetail(orderId);
      setOrder(res.data.order);
      // 查询当前用户是否已经邀请过
      const invRes = await getInvitations();
      const allInvites: Invitation[] = invRes.data.list;
      const orderInvites = allInvites.filter((i) => i.orderId === orderId);
      setInvitationCount(orderInvites.length);
      setHasInvited(orderInvites.some((i) => i.inviterId === 'u_current'));
    } catch (err) {
      console.error('[OrderDetail] fetch failed:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Taro.navigateBack();
  };

  const handleInvite = async () => {
    if (!order) return;
    if (order.publisherId === currentUser?.id) {
      Taro.showToast({ title: '不能邀请自己', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '发起邀请',
      content: `向「${order.publisherName}」发起带钓邀请，附上你的留言：`,
      editable: true,
      placeholderText: '简单介绍一下自己...',
      success: async (res) => {
        if (!res.confirm) return;
        const message = res.content || `${currentUser?.nickname}：希望能同行！`;
        try {
          await createInvitation({
            orderId: order.id,
            orderTitle: order.title,
            inviterId: currentUser?.id,
            inviterName: currentUser?.nickname,
            inviterAvatar: currentUser?.avatar,
            inviterLevel: currentUser?.level,
            inviterYears: currentUser?.years,
            inviterBio: currentUser?.bio,
            inviterTags: currentUser?.tags,
            publisherId: order.publisherId,
            message
          });
          Taro.showToast({ title: '邀请已发送', icon: 'success' });
          Taro.vibrateShort({ type: 'light' });
          setHasInvited(true);
          setInvitationCount((c) => c + 1);
        } catch (err) {
          console.error('[OrderDetail] invite failed:', err);
          Taro.showToast({ title: '邀请失败', icon: 'none' });
        }
      }
    });
  };

  const handleContact = () => {
    Taro.showToast({ title: '联系方式功能开发中', icon: 'none' });
  };

  const handleCollect = () => {
    Taro.showToast({ title: '已收藏', icon: 'success' });
  };

  if (loading || !order) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '200rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ color: '#86909c' }}>{loading ? '加载中...' : '订单不存在'}</Text>
        </View>
      </View>
    );
  }

  const status = getStatusInfo(order.status);
  const isFree = order.price === 0;
  const isOwner = currentUser?.id === order.publisherId;
  const dateLabel = `${formatDate(order.date, 'YYYY年MM月DD日')} ${formatWeekday(order.date)}`;

  return (
    <View className={styles.page}>
      <View className={styles.coverWrap}>
        <Image className={styles.cover} src={order.spotImage} mode="aspectFill" />
        <View className={styles.coverMask} />
        <View className={styles.backBtn} onClick={handleBack}>
          <Text className={styles.backIcon}>‹</Text>
        </View>
        <View className={classnames(styles.statusBadge, styles[`statusBadge_${order.status === 'recruiting' ? 'recruit' : order.status}`])}>
          <Text>{status.label}</Text>
        </View>
        <View className={styles.coverInfo}>
          <Text className={styles.coverTitle}>{order.title}</Text>
          <View className={styles.coverMeta}>
            <Text className={styles.coverMetaText}>📅 {dateLabel}</Text>
            <Text className={styles.coverMetaText}>⏱ {order.duration}</Text>
            <Text className={styles.coverMetaText}>👥 {order.peopleJoined}/{order.peopleNeeded}人</Text>
          </View>
        </View>
      </View>

      <View className={styles.body}>
        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionBar} />
            <Text>订单信息</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>钓点</Text>
            <Text className={styles.infoValue}>{order.spot}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>所在城市</Text>
            <Text className={styles.infoValue}>{order.city}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>钓法</Text>
            <View className={styles.tagRow}>
              <Tag text={order.fishingType} color="primary" size="md" />
            </View>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>目标鱼种</Text>
            <View className={styles.tagRow}>
              {order.fishTypes.map((f) => (
                <Tag key={f} text={f} color="accent" size="md" />
              ))}
            </View>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>人均费用</Text>
            <Text className={classnames(styles.infoValue, styles.priceText)}>
              {isFree ? '🆓 免费' : `${formatPrice(order.price)}/人`}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>招募人数</Text>
            <Text className={styles.infoValue}>还差 {order.peopleNeeded - order.peopleJoined} 人</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>邀请数</Text>
            <Text className={styles.infoValue}>{invitationCount} 位钓友发起邀请</Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionBar} />
            <Text>详细说明</Text>
          </View>
          <Text className={styles.desc}>{order.description}</Text>
          {order.requirements && (
            <>
              <View style={{ height: '24rpx' }} />
              <Text className={styles.desc}>📌 招募要求：{order.requirements}</Text>
            </>
          )}
        </View>

        {(order.status === 'matched' || order.status === 'ongoing' || order.status === 'completed') && order.matchedUserName && (
          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <View className={styles.sectionBar} />
              <Text>已撮合钓友</Text>
            </View>
            <View className={styles.matchedUser}>
              <Image className={styles.matchedAvatar} src={order.matchedUserAvatar} mode="aspectFill" />
              <View className={styles.matchedInfo}>
                <Text className={styles.matchedName}>{order.matchedUserName}</Text>
                <Text className={styles.matchedMeta}>撮合成功，期待同行</Text>
              </View>
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionBar} />
            <Text>发单人信息</Text>
          </View>
          <View className={styles.publisher}>
            <Image className={styles.publisherAvatar} src={order.publisherAvatar} mode="aspectFill" />
            <View className={styles.publisherInfo}>
              <Text className={styles.publisherName}>{order.publisherName}</Text>
              <Text className={styles.publisherMeta}>
                Lv{order.publisherLevel} · 钓龄{order.publisherYears}年
              </Text>
            </View>
          </View>
          <Text className={styles.publisherBio}>发布于 {order.createdAt}</Text>
        </View>
      </View>

      <View className={styles.actionBar}>
        <View className={styles.actionLeft}>
          <View className={styles.iconBtn} onClick={handleContact}>
            <Text className={styles.iconBtnIcon}>💬</Text>
            <Text className={styles.iconBtnText}>咨询</Text>
          </View>
          <View className={styles.iconBtn} onClick={handleCollect}>
            <Text className={styles.iconBtnIcon}>⭐</Text>
            <Text className={styles.iconBtnText}>收藏</Text>
          </View>
        </View>

        <View className={styles.inviteAction}>
          {isOwner ? (
            <View className={styles.matchedStatusBtn}>
              <Text className={styles.matchedStatusText}>我发布的</Text>
            </View>
          ) : order.status === 'recruiting' ? (
            <View
              className={classnames(styles.inviteBtn, hasInvited && styles.inviteBtnDisabled)}
              onClick={hasInvited ? undefined : handleInvite}
            >
              <Text className={classnames(styles.inviteBtnText, hasInvited && styles.inviteBtnTextDisabled)}>
                {hasInvited ? '已邀请，等待回复' : '邀请带钓'}
              </Text>
            </View>
          ) : (
            <View className={styles.matchedStatusBtn}>
              <Text className={styles.matchedStatusText}>{status.label}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default OrderDetailPage;
