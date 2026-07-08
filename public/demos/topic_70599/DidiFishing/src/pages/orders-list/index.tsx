import React, { useEffect, useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import OrderCard from '../../components/OrderCard';
import Empty from '../../components/Empty';
import { getMyOrders } from '../../services/api';
import { useOrderStore } from '../../store/orderStore';
import type { Order } from '../../types/order';
import styles from './index.module.scss';

const STATUS_TABS: { value: string; label: string; status?: string }[] = [
  { value: 'recruiting', label: '招募中', status: 'recruiting' },
  { value: 'ongoing', label: '进行中', status: 'ongoing' },
  { value: 'completed', label: '已完成', status: 'completed' },
  { value: 'all', label: '全部' }
];

const OrdersListPage: React.FC = () => {
  const params = Taro.getCurrentInstance().router?.params;
  const initialTab = params?.status || 'all';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const userOrders = useOrderStore((s) => s.userOrders);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  useDidShow(() => {
    fetchOrders();
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const status = STATUS_TABS.find((t) => t.value === activeTab)?.status || 'all';
      const res = await getMyOrders(status as any);
      const apiList: Order[] = res.data.list;
      const userList = userOrders.filter((o) => {
        if (status === 'all') return true;
        return o.status === status;
      });
      // 合并：用户发布 + mock 中属于当前用户
      const merged = [...userList, ...apiList];
      const list = merged.filter((o) => {
        if (status === 'all') {
          return o.publisherId === 'u_current' || o.matchedUserId === 'u_current';
        }
        return o.status === status;
      });
      setOrders(list);
    } catch (err) {
      console.error('[OrdersList] fetch failed:', err);
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  };

  const tabCounts = useMemo(() => {
    const all = [...userOrders];
    return {
      recruiting: all.filter((o) => o.status === 'recruiting').length,
      ongoing: all.filter((o) => o.status === 'ongoing').length,
      completed: all.filter((o) => o.status === 'completed').length
    };
  }, [userOrders]);

  const handleOrderClick = (order: Order) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` });
  };

  const handlePublish = () => {
    Taro.navigateTo({ url: '/pages/order-publish/index' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.tabs}>
        {STATUS_TABS.map((tab) => {
          const count = tab.value !== 'all' ? tabCounts[tab.value as keyof typeof tabCounts] : 0;
          return (
            <View
              key={tab.value}
              className={classnames(styles.tab, activeTab === tab.value && styles.tabActive)}
              onClick={() => setActiveTab(tab.value)}
            >
              <Text className={classnames(styles.tabText, activeTab === tab.value && styles.tabTextActive)}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View className={styles.tabBadge}>
                  <Text className={styles.tabBadgeText}>{count}</Text>
                </View>
              )}
              {activeTab === tab.value && <View className={styles.tabIndicator} />}
            </View>
          );
        })}
      </View>

      <View className={styles.summary}>
        <Text className={styles.summaryText}>共 {orders.length} 单</Text>
      </View>

      <View className={styles.list}>
        {!loading && orders.length === 0 ? (
          <Empty
            icon="📋"
            title="暂无相关订单"
            desc="快去发布一个订单，或到首页看看其他钓友的订单吧～"
            actionText="去发布"
            onAction={handlePublish}
          />
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => handleOrderClick(order)}
              isOwner={true}
              showInviteButton={false}
            />
          ))
        )}
      </View>
    </View>
  );
};

export default OrdersListPage;
