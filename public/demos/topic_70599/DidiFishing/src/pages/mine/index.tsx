import React, { useEffect, useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { getCurrentUser, getInvitations, getMyOrders } from '../../services/api';
import { useUserStore } from '../../store/userStore';
import { useOrderStore } from '../../store/orderStore';
import { getLevelLabel } from '../../utils/format';
import type { Invitation } from '../../types/invitation';
import type { User } from '../../types/user';
import type { Order } from '../../types/order';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const { currentUser: storedUser, stats: storedStats, fetchUser } = useUserStore();
  const [user, setUser] = useState<User | null>(storedUser);
  const [ongoingCount, setOngoingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);

  useEffect(() => {
    loadAll();
  }, []);

  useDidShow(() => {
    loadAll();
  });

  const loadAll = async () => {
    await fetchUser();
    try {
      const userRes = await getCurrentUser();
      setUser(userRes.data.user);

      const ordersRes = await getMyOrders('all');
      const userOrders = useOrderStore.getState().userOrders;
      // 合并：用户发布的 + API 数据
      const seen = new Set<string>();
      const all: Order[] = [...userOrders, ...ordersRes.data.list].filter((o) => {
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });
      setOngoingCount(all.filter((o) => o.status === 'ongoing' && o.matchedUserId === 'u_current').length);
      setCompletedCount(
        all.filter((o) => o.status === 'completed' && (o.matchedUserId === 'u_current' || o.publisherId === 'u_current'))
          .length
      );
      setPublishedCount(all.filter((o) => o.publisherId === 'u_current').length);

      const invRes = await getInvitations();
      const invites: Invitation[] = invRes.data.list;
      setPendingInviteCount(
        invites.filter((i) => i.publisherId === 'u_current' && i.status === 'pending').length
      );
    } catch (err) {
      console.error('[Mine] load failed:', err);
    }
  };

  const handleEditProfile = () => {
    Taro.navigateTo({ url: '/pages/profile-edit/index' });
  };

  const handleMyOrders = (filter: 'recruiting' | 'ongoing' | 'completed') => {
    Taro.navigateTo({ url: `/pages/orders-list/index?status=${filter}` });
  };

  const handleInvitations = () => {
    Taro.navigateTo({ url: '/pages/invitation-list/index' });
  };

  const handlePublish = () => {
    Taro.navigateTo({ url: '/pages/order-publish/index' });
  };

  const handleMenuClick = (key: string) => {
    const map: Record<string, string> = {
      articles: '我的文章功能开发中',
      favorites: '我的收藏功能开发中',
      coupons: '优惠券功能开发中',
      settings: '设置功能开发中',
      customer: '客服功能开发中',
      about: '关于版本功能开发中'
    };
    Taro.showToast({ title: map[key] || '功能开发中', icon: 'none' });
  };

  if (!user) {
    return (
      <View className={styles.page}>
        <View className={styles.header}>
          <View className={styles.userRow}>
            <View className={styles.avatarWrap}>
              <View className={styles.avatar} style={{ backgroundColor: '#fff' }} />
            </View>
            <View className={styles.userInfo}>
              <Text className={styles.nickname}>加载中...</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.editBtn} onClick={handleEditProfile}>
          <Text className={styles.editBtnText}>编辑资料</Text>
        </View>

        <View className={styles.userRow}>
          <View className={styles.avatarWrap}>
            <Image className={styles.avatar} src={user.avatar} mode="aspectFill" />
            <View className={styles.levelTag}>Lv{user.level}</View>
          </View>
          <View className={styles.userInfo}>
            <Text className={styles.nickname}>{user.nickname}</Text>
            <Text className={styles.bio}>{user.bio}</Text>
            <View className={styles.tags}>
              <View className={styles.userTag}>
                <Text>📍 {user.location}</Text>
              </View>
              <View className={styles.userTag}>
                <Text>🎣 钓龄{user.years}年</Text>
              </View>
              <View className={styles.userTag}>
                <Text>🏆 {getLevelLabel(user.level)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.statsCard}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{storedStats.articles}</Text>
            <Text className={styles.statLabel}>文章</Text>
          </View>
          <View className={styles.statDivider} />
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{storedStats.completedOrders}</Text>
            <Text className={styles.statLabel}>完成</Text>
          </View>
          <View className={styles.statDivider} />
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{user.rating}</Text>
            <Text className={styles.statLabel}>评分</Text>
          </View>
          <View className={styles.statDivider} />
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{user.tags.length}</Text>
            <Text className={styles.statLabel}>擅长</Text>
          </View>
        </View>
      </View>

      <View className={styles.ordersCard}>
        <View className={styles.ordersHeader}>
          <Text className={styles.ordersTitle}>我的订单</Text>
          <View className={styles.ordersAll} onClick={() => handleMyOrders('recruiting')}>
            <Text className={styles.ordersAllText}>全部订单</Text>
            <Text className={styles.ordersAllIcon}>›</Text>
          </View>
        </View>
        <View className={styles.orderTypes}>
          <View className={styles.orderTypeItem} onClick={() => handleMyOrders('recruiting')}>
            <View className={classnames(styles.orderTypeIcon, styles.orderTypeIcon_recruit)}>
              <Text>📢</Text>
            </View>
            <Text className={styles.orderTypeLabel}>招募中</Text>
            {publishedCount > 0 && <View className={styles.badge}>{publishedCount}</View>}
          </View>
          <View className={styles.orderTypeItem} onClick={() => handleMyOrders('ongoing')}>
            <View className={classnames(styles.orderTypeIcon, styles.orderTypeIcon_ongoing)}>
              <Text>🎣</Text>
            </View>
            <Text className={styles.orderTypeLabel}>进行中</Text>
            {ongoingCount > 0 && <View className={styles.badge}>{ongoingCount}</View>}
          </View>
          <View className={styles.orderTypeItem} onClick={() => handleMyOrders('completed')}>
            <View className={classnames(styles.orderTypeIcon, styles.orderTypeIcon_completed)}>
              <Text>✅</Text>
            </View>
            <Text className={styles.orderTypeLabel}>已完成</Text>
            {completedCount > 0 && <View className={styles.badge}>{completedCount}</View>}
          </View>
          <View className={styles.orderTypeItem} onClick={handleInvitations}>
            <View className={classnames(styles.orderTypeIcon, styles.orderTypeIcon_invite)}>
              <Text>📨</Text>
            </View>
            <Text className={styles.orderTypeLabel}>收到的邀请</Text>
            {pendingInviteCount > 0 && <View className={styles.badge}>{pendingInviteCount}</View>}
          </View>
        </View>
      </View>

      <View className={styles.menus}>
        <View className={styles.menuItem} onClick={() => handleMenuClick('articles')}>
          <View className={styles.menuItemIcon} style={{ backgroundColor: '#e6f5f4' }}>
            <Text>📝</Text>
          </View>
          <View className={styles.menuItemInfo}>
            <Text className={styles.menuItemTitle}>我的文章</Text>
            <Text className={styles.menuItemSub}>查看已发布的文章</Text>
          </View>
          <Text className={styles.menuItemExtra}>{storedStats.articles} 篇</Text>
          <Text className={styles.menuItemArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => handleMenuClick('favorites')}>
          <View className={styles.menuItemIcon} style={{ backgroundColor: '#fff2e8' }}>
            <Text>⭐</Text>
          </View>
          <View className={styles.menuItemInfo}>
            <Text className={styles.menuItemTitle}>我的收藏</Text>
            <Text className={styles.menuItemSub}>钓点、文章、钓友</Text>
          </View>
          <Text className={styles.menuItemExtra}>12</Text>
          <Text className={styles.menuItemArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => handleMenuClick('coupons')}>
          <View className={styles.menuItemIcon} style={{ backgroundColor: '#fff3e0' }}>
            <Text>🎁</Text>
          </View>
          <View className={styles.menuItemInfo}>
            <Text className={styles.menuItemTitle}>优惠券</Text>
            <Text className={styles.menuItemSub}>优惠券和积分</Text>
          </View>
          <Text className={styles.menuItemExtra}>3 张</Text>
          <Text className={styles.menuItemArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => handleMenuClick('customer')}>
          <View className={styles.menuItemIcon} style={{ backgroundColor: '#e8f8ec' }}>
            <Text>💬</Text>
          </View>
          <View className={styles.menuItemInfo}>
            <Text className={styles.menuItemTitle}>在线客服</Text>
            <Text className={styles.menuItemSub}>有问题，找客服</Text>
          </View>
          <Text className={styles.menuItemArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => handleMenuClick('settings')}>
          <View className={styles.menuItemIcon} style={{ backgroundColor: '#f2f3f5' }}>
            <Text>⚙️</Text>
          </View>
          <View className={styles.menuItemInfo}>
            <Text className={styles.menuItemTitle}>设置</Text>
            <Text className={styles.menuItemSub}>通知、隐私等</Text>
          </View>
          <Text className={styles.menuItemArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => handleMenuClick('about')}>
          <View className={styles.menuItemIcon} style={{ backgroundColor: '#fef0e8' }}>
            <Text>ℹ️</Text>
          </View>
          <View className={styles.menuItemInfo}>
            <Text className={styles.menuItemTitle}>关于滴滴带钓</Text>
            <Text className={styles.menuItemSub}>v1.0.0</Text>
          </View>
          <Text className={styles.menuItemArrow}>›</Text>
        </View>
      </View>

      <View className={styles.fab} onClick={handlePublish}>
        <Text className={styles.fabIcon}>＋</Text>
        <Text className={styles.fabText}>发单</Text>
      </View>
    </View>
  );
};

export default MinePage;
