import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import Empty from '../../components/Empty';
import { getInvitations, respondInvitation } from '../../services/api';
import { useUserStore } from '../../store/userStore';
import { formatRelativeTime, getLevelLabel } from '../../utils/format';
import type { Invitation, InvitationStatus } from '../../types/invitation';
import styles from './index.module.scss';

type TabValue = 'pending' | 'all';

const InvitationListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('pending');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useUserStore((s) => s.currentUser);

  useEffect(() => {
    fetchInvitations();
  }, []);

  useDidShow(() => {
    fetchInvitations();
  });

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await getInvitations();
      // 只显示我是发单人的邀请（我收到的邀请）
      const list = res.data.list.filter((i) => i.publisherId === 'u_current');
      setInvitations(list);
    } catch (err) {
      console.error('[InvitationList] fetch failed:', err);
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  };

  const filtered = useMemo(() => {
    if (activeTab === 'pending') {
      return invitations.filter((i) => i.status === 'pending');
    }
    return invitations;
  }, [invitations, activeTab]);

  const pendingCount = useMemo(
    () => invitations.filter((i) => i.status === 'pending').length,
    [invitations]
  );

  const handleOrderClick = (orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  };

  const handleRespond = async (invitation: Invitation, status: 'accepted' | 'rejected') => {
    Taro.showModal({
      title: status === 'accepted' ? '接受邀请' : '婉拒邀请',
      content:
        status === 'accepted'
          ? `确认接受「${invitation.inviterName}」的邀请吗？接受后将自动撮合。`
          : `确认婉拒「${invitation.inviterName}」的邀请吗？`,
      confirmText: status === 'accepted' ? '接受' : '婉拒',
      cancelText: '再想想',
      confirmColor: status === 'accepted' ? '#0e7c7b' : '#86909c',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await respondInvitation(invitation.id, status as InvitationStatus);
          Taro.showToast({
            title: status === 'accepted' ? '已接受，撮合成功！' : '已婉拒',
            icon: 'success'
          });
          Taro.vibrateShort({ type: 'medium' });
          setInvitations((prev) =>
            prev.map((i) =>
              i.id === invitation.id
                ? { ...i, status, respondedAt: new Date().toISOString() }
                : i
            )
          );
        } catch (err) {
          console.error('[InvitationList] respond failed:', err);
          Taro.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    });
  };

  const handleViewOrder = (orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  };

  const renderStatusBadge = (status: InvitationStatus) => {
    const map: Record<InvitationStatus, { text: string; cls: string }> = {
      pending: { text: '待处理', cls: styles.statusPending },
      accepted: { text: '已接受', cls: styles.statusAccepted },
      rejected: { text: '已婉拒', cls: styles.statusRejected },
      cancelled: { text: '已取消', cls: styles.statusCancelled }
    };
    const info = map[status];
    return (
      <View className={classnames(styles.statusBadge, info.cls)}>
        <Text className={styles.statusBadgeText}>{info.text}</Text>
      </View>
    );
  };

  return (
    <View className={styles.page}>
      <View className={styles.headerInfo}>
        <Text className={styles.headerInfoText}>
          {pendingCount > 0
            ? `你有 ${pendingCount} 条待处理的钓友邀请`
            : '暂时没有待处理的邀请'}
        </Text>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tab, activeTab === 'pending' && styles.tabActive)}
          onClick={() => setActiveTab('pending')}
        >
          <Text className={classnames(styles.tabText, activeTab === 'pending' && styles.tabTextActive)}>
            待处理
          </Text>
          {pendingCount > 0 && (
            <View className={styles.tabBadge}>
              <Text className={styles.tabBadgeText}>{pendingCount}</Text>
            </View>
          )}
          {activeTab === 'pending' && <View className={styles.tabIndicator} />}
        </View>
        <View
          className={classnames(styles.tab, activeTab === 'all' && styles.tabActive)}
          onClick={() => setActiveTab('all')}
        >
          <Text className={classnames(styles.tabText, activeTab === 'all' && styles.tabTextActive)}>
            全部
          </Text>
          {activeTab === 'all' && <View className={styles.tabIndicator} />}
        </View>
      </View>

      <View className={styles.list}>
        {!loading && filtered.length === 0 ? (
          <Empty
            icon="📨"
            title={activeTab === 'pending' ? '没有待处理的邀请' : '暂无邀请记录'}
            desc={
              activeTab === 'pending'
                ? '当你发布的订单被钓友邀请时，会在这里收到通知'
                : '所有邀请都会显示在这里'
            }
          />
        ) : (
          filtered.map((inv) => (
            <View key={inv.id} className={styles.card}>
              <View className={styles.cardHeader}>
                <View className={styles.inviterRow}>
                  <Image
                    className={styles.inviterAvatar}
                    src={inv.inviterAvatar}
                    mode="aspectFill"
                  />
                  <View className={styles.inviterInfo}>
                    <View className={styles.inviterNameRow}>
                      <Text className={styles.inviterName}>{inv.inviterName}</Text>
                      <View className={styles.levelTag}>
                        <Text className={styles.levelText}>Lv{inv.inviterLevel}</Text>
                      </View>
                    </View>
                    <Text className={styles.inviterMeta}>
                      {getLevelLabel(inv.inviterLevel)} · 钓龄{inv.inviterYears}年
                    </Text>
                  </View>
                </View>
                {renderStatusBadge(inv.status)}
              </View>

              <View className={styles.orderBox} onClick={() => handleViewOrder(inv.orderId)}>
                <Text className={styles.orderLabel}>邀请订单</Text>
                <Text className={styles.orderTitle}>{inv.orderTitle}</Text>
                <View className={styles.orderMeta}>
                  <Text className={styles.orderMetaText}>📍 {inv.orderSpot}</Text>
                  <Text className={styles.orderMetaText}>📅 {inv.orderDate}</Text>
                </View>
              </View>

              <View className={styles.messageBox}>
                <Text className={styles.messageLabel}>💬 邀请留言</Text>
                <Text className={styles.messageText}>{inv.message}</Text>
              </View>

              <View className={styles.tagRow}>
                {inv.inviterTags.slice(0, 3).map((t) => (
                  <View key={t} className={styles.skillTag}>
                    <Text className={styles.skillTagText}>#{t}</Text>
                  </View>
                ))}
              </View>

              <View className={styles.cardFooter}>
                <Text className={styles.timeText}>
                  {inv.respondedAt
                    ? `${formatRelativeTime(inv.respondedAt)}已${inv.status === 'accepted' ? '接受' : '婉拒'}`
                    : `${formatRelativeTime(inv.createdAt)}发起`}
                </Text>
                {inv.status === 'pending' && (
                  <View className={styles.actions}>
                    <View
                      className={styles.rejectBtn}
                      onClick={() => handleRespond(inv, 'rejected')}
                    >
                      <Text className={styles.rejectBtnText}>婉拒</Text>
                    </View>
                    <View
                      className={styles.acceptBtn}
                      onClick={() => handleRespond(inv, 'accepted')}
                    >
                      <Text className={styles.acceptBtnText}>接受邀请</Text>
                    </View>
                  </View>
                )}
                {inv.status === 'accepted' && (
                  <View
                    className={styles.viewBtn}
                    onClick={() => handleOrderClick(inv.orderId)}
                  >
                    <Text className={styles.viewBtnText}>查看订单 ›</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

export default InvitationListPage;
