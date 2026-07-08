// 业务 Service 封装 - 通过 cloud.ts 走 mock 或云函数
import { callFunction } from './cloud';
import { useOrderStore } from '../store/orderStore';
import type { Order, OrderStatus } from '../types/order';
import type { Article, ArticleCategory } from '../types/article';
import type { Invitation, InvitationStatus } from '../types/invitation';
import type { User } from '../types/user';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// ================= 订单 =================
export async function getOrders(): Promise<ApiResponse<{ list: Order[] }>> {
  return callFunction('orders');
}

export async function getMyOrders(status: OrderStatus | 'all'): Promise<ApiResponse<{ list: Order[] }>> {
  return callFunction('orders', { status });
}

export async function getOrderDetail(id: string): Promise<ApiResponse<{ order: Order | null }>> {
  // 优先查找用户发布的订单
  const userOrder = useOrderStore.getState().userOrders.find((o) => o.id === id);
  if (userOrder) {
    return { code: 0, message: 'ok', data: { order: userOrder } };
  }
  const res = await callFunction<{ list: Order[] }>('orders');
  const order = res.list.find((o) => o.id === id) || null;
  return { code: 0, message: 'ok', data: { order } };
}

export async function publishOrder(payload: Partial<Order>): Promise<ApiResponse<{ success: boolean }>> {
  console.info('[Order] publish:', payload);
  return { code: 0, message: 'ok', data: { success: true } };
}

// ================= 文章 =================
export async function getArticles(category?: ArticleCategory): Promise<ApiResponse<{ list: Article[] }>> {
  return callFunction('articles', { category });
}

export async function getArticleDetail(id: string): Promise<ApiResponse<{ article: Article | null }>> {
  const res = await callFunction<{ list: Article[] }>('articles');
  const article = res.list.find((a) => a.id === id) || null;
  return { code: 0, message: 'ok', data: { article } };
}

export async function toggleLikeArticle(id: string): Promise<ApiResponse<{ success: boolean }>> {
  console.info('[Article] toggleLike:', id);
  return { code: 0, message: 'ok', data: { success: true } };
}

export async function publishArticle(payload: Partial<Article>): Promise<ApiResponse<{ success: boolean }>> {
  console.info('[Article] publish:', payload);
  return { code: 0, message: 'ok', data: { success: true } };
}

// ================= 邀请 =================
export async function getInvitations(): Promise<ApiResponse<{ list: Invitation[] }>> {
  return callFunction('invitations');
}

export async function createInvitation(
  payload: Partial<Invitation>
): Promise<ApiResponse<{ success: boolean }>> {
  console.info('[Invitation] create:', payload);
  return { code: 0, message: 'ok', data: { success: true } };
}

export async function respondInvitation(
  id: string,
  status: InvitationStatus
): Promise<ApiResponse<{ success: boolean }>> {
  console.info('[Invitation] respond:', id, status);
  return { code: 0, message: 'ok', data: { success: true } };
}

// ================= 用户 =================
export async function getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
  const res = await callFunction<{ currentUser: User; users: User[] }>('users');
  return { code: 0, message: 'ok', data: { user: res.currentUser } };
}

export async function getUserById(id: string): Promise<ApiResponse<{ user: User | null }>> {
  const res = await callFunction<{ currentUser: User; users: User[] }>('users');
  const user = res.users.find((u) => u.id === id) || null;
  return { code: 0, message: 'ok', data: { user } };
}

export async function updateProfile(payload: Partial<User>): Promise<ApiResponse<{ success: boolean }>> {
  console.info('[User] updateProfile:', payload);
  return { code: 0, message: 'ok', data: { success: true } };
}
