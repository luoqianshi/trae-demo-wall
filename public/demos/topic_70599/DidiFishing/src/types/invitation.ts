// 邀请相关类型定义
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Invitation {
  id: string;
  orderId: string;
  orderTitle: string;
  orderSpot: string;
  orderDate: string;
  inviterId: string; // 发起邀请的钓友
  inviterName: string;
  inviterAvatar: string;
  inviterLevel: number;
  inviterYears: number;
  inviterBio: string;
  inviterTags: string[];
  publisherId: string; // 发单人
  message: string; // 邀请留言
  status: InvitationStatus;
  createdAt: string;
  respondedAt?: string;
}
