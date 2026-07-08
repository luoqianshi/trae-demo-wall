import type { Invitation } from '../types/invitation';

// 邀请 Mock 数据
export const invitations: Invitation[] = [
  {
    id: 'i_001',
    orderId: 'o_001',
    orderTitle: '青山湖水库·大物约钓',
    orderSpot: '青山湖水库·东岸钓位',
    orderDate: '2026-07-12',
    inviterId: 'u_004',
    inviterName: '路亚强子',
    inviterAvatar: 'https://picsum.photos/id/1027/200/200',
    inviterLevel: 5,
    inviterYears: 12,
    inviterBio: '竞技路亚选手，全国巡回赛常客。',
    inviterTags: ['路亚', '竞技', '鲈鱼'],
    publisherId: 'u_current',
    message: '老张好，我玩路亚十几年了，野钓大物也有经验。可以独立打窝看漂，请多关照！',
    status: 'pending',
    createdAt: '2026-07-03 11:30'
  },
  {
    id: 'i_002',
    orderId: 'o_002',
    orderTitle: '千岛湖路亚·翘嘴专场',
    orderSpot: '千岛湖·中心湖区',
    orderDate: '2026-07-08',
    inviterId: 'u_002',
    inviterName: '海钓阿杰',
    inviterAvatar: 'https://picsum.photos/id/91/200/200',
    inviterLevel: 5,
    inviterYears: 15,
    inviterBio: '东海船钓 15 年，专攻大物。',
    inviterTags: ['海钓', '船钓', '大物'],
    publisherId: 'u_current',
    message: '千岛湖我也常去，这次想挑战一下翘嘴，装备齐全，希望能同行。',
    status: 'pending',
    createdAt: '2026-07-03 15:20'
  },
  {
    id: 'i_003',
    orderId: 'o_005',
    orderTitle: '南太湖青鱼巨物',
    orderSpot: '湖州·南太湖',
    orderDate: '2026-07-20',
    inviterId: 'u_001',
    inviterName: '临安老张',
    inviterAvatar: 'https://picsum.photos/id/64/200/200',
    inviterLevel: 5,
    inviterYears: 18,
    inviterBio: '临安本地通，熟悉周边水库，主攻大物。',
    inviterTags: ['台钓', '鲤鱼', '草鱼'],
    publisherId: 'u_004',
    message: '强子好，南太湖巨物我有经验，可以同去。',
    status: 'pending',
    createdAt: '2026-07-03 09:15'
  },
  {
    id: 'i_004',
    orderId: 'o_006',
    orderTitle: '渔山列岛矶钓',
    orderSpot: '宁波·渔山列岛',
    orderDate: '2026-07-13',
    inviterId: 'u_006',
    inviterName: '千岛湖飞侠',
    inviterAvatar: 'https://picsum.photos/id/64/200/200',
    inviterLevel: 4,
    inviterYears: 8,
    inviterBio: '千岛湖本地钓友，熟悉各岛屿钓点。',
    inviterTags: ['路亚', '翘嘴', '鳜鱼'],
    publisherId: 'u_007',
    message: '大刘好，我之前去渔山几次，可以帮忙找钓位。',
    status: 'accepted',
    createdAt: '2026-07-02 20:00',
    respondedAt: '2026-07-02 22:30'
  },
  {
    id: 'i_005',
    orderId: 'o_004',
    orderTitle: '太湖路亚·鲈鱼爆钓',
    orderSpot: '苏州·太湖东山',
    orderDate: '2026-07-09',
    inviterId: 'u_003',
    inviterName: '西溪小师妹',
    inviterAvatar: 'https://picsum.photos/id/338/200/200',
    inviterLevel: 3,
    inviterYears: 5,
    inviterBio: '野钓爱好者，喜欢拍鱼获美照。',
    inviterTags: ['台钓', '鲫鱼', '野钓'],
    publisherId: 'u_004',
    message: '想跟你学学路亚，能带上我吗？',
    status: 'rejected',
    createdAt: '2026-07-02 17:30',
    respondedAt: '2026-07-02 19:00'
  }
];

export default function mockInvitations() {
  return {
    code: 0,
    message: 'ok',
    data: {
      list: invitations
    }
  };
}
