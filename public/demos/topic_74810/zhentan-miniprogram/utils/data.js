const places = [
  {
    id: 1,
    name: '杭州西湖·少年宫广场',
    location: '杭州市西湖区',
    type: '亲子',
    tags: ['免费', '户外', '适合3-12岁'],
    rating: 4.2,
    reviewCount: 128,
    promoImg: 'https://images.unsplash.com/photo-1537531383496-f4749b8032cf?w=480&h=300&fit=crop',
    realImg: 'https://images.unsplash.com/photo-1569091791842-7cfb64e04797?w=480&h=300&fit=crop',
    description: '市中心最近的户外遛娃场地，有滑梯、沙坑等设施。',
    distance: '2.3km',
    dimensions: { env: 4.0, facility: 3.8, service: 3.5, value: 4.5, safety: 4.2, fun: 4.0 },
    promoDesc: '官方宣传："绿荫环绕的亲子乐园，设施齐全，安全无忧"',
    realDesc: '真探实测：周末人非常多，设施有些老旧，但免费确实香',
    compareScore: { promo: 95, real: 68 },
    timeline: [
      { month: '2026-03', season: '春季', desc: '柳絮飞扬，建议戴口罩', img: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=300&h=200&fit=crop' },
      { month: '2026-01', season: '冬季', desc: '冬天比较冷清，但人少体验好', img: 'https://images.unsplash.com/photo-1483664852095-d6cc6870705d?w=300&h=200&fit=crop' },
      { month: '2025-08', season: '夏季', desc: '暑假人爆满，滑梯要排队', img: 'https://images.unsplash.com/photo-1569091791842-7cfb64e04797?w=300&h=200&fit=crop' }
    ]
  },
  {
    id: 2,
    name: '某网红亲子农场',
    location: '杭州市余杭区',
    type: '亲子',
    tags: ['收费', '室内+户外', '适合2-8岁'],
    rating: 2.8,
    reviewCount: 86,
    promoImg: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=480&h=300&fit=crop',
    realImg: 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=480&h=300&fit=crop',
    description: '小红书爆款"宝藏农场"，实际体验与宣传差距较大。',
    distance: '15.6km',
    dimensions: { env: 2.5, facility: 2.0, service: 3.0, value: 2.0, safety: 3.5, fun: 2.5 },
    promoDesc: '商家宣传："宫崎骏同款田园牧场，拍照超出片，孩子玩一天不想走"',
    realDesc: '真探实测：场地很小，动物就几只兔子，互动还要另收费。门票168不值',
    compareScore: { promo: 98, real: 32 },
    timeline: [
      { month: '2026-05', season: '春季', desc: '草地还是黄的，和宣传图差距大', img: 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=300&h=200&fit=crop' },
      { month: '2026-02', season: '冬季', desc: '冬天基本没什么可玩的', img: 'https://images.unsplash.com/photo-1483664852095-d6cc6870705d?w=300&h=200&fit=crop' }
    ]
  },
  {
    id: 3,
    name: '良渚古城遗址公园',
    location: '杭州市余杭区',
    type: '文化',
    tags: ['收费', '户外', '适合6-14岁'],
    rating: 4.5,
    reviewCount: 256,
    promoImg: 'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?w=480&h=300&fit=crop',
    realImg: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=480&h=300&fit=crop',
    description: '世界文化遗产，鹿苑是孩子的最爱。',
    distance: '22.1km',
    dimensions: { env: 4.8, facility: 4.0, service: 4.2, value: 4.5, safety: 4.5, fun: 4.3 },
    promoDesc: '官方宣传："五千年文明的圣地，寓教于乐的最佳场所"',
    realDesc: '真探实测：鹿苑确实很棒，但园区很大建议租电瓶车',
    compareScore: { promo: 88, real: 82 },
    timeline: [
      { month: '2026-04', season: '春季', desc: '鹿苑小鹿很亲人，孩子超开心', img: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=300&h=200&fit=crop' },
      { month: '2025-10', season: '秋季', desc: '秋天稻田金黄，非常出片', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&h=200&fit=crop' }
    ]
  }
];

const reviews = [
  {
    id: 1,
    placeId: 1,
    user: '宝妈小林',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    level: '真探',
    verified: true,
    time: '2026-07-05',
    rating: 4,
    content: '周末带儿子来玩的，人确实多，但孩子玩得很开心。滑梯和沙坑是免费的，这点很赞。建议工作日来，体验会好很多。',
    tags: ['人多', '免费', '建议工作日'],
    imgs: ['https://images.unsplash.com/photo-1569091791842-7cfb64e04797?w=200&h=200&fit=crop'],
    dimensions: { env: 4, facility: 4, service: 3, value: 5, safety: 4, fun: 4 }
  },
  {
    id: 2,
    placeId: 1,
    user: '遛娃老王',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
    level: '鉴定师',
    verified: true,
    time: '2026-06-28',
    rating: 3,
    content: '设施确实有点旧了，沙坑里的沙子不太干净。不过位置方便，地铁直达。',
    tags: ['设施旧', '交通便利'],
    imgs: [],
    dimensions: { env: 3, facility: 3, service: 3, value: 4, safety: 3, fun: 3 }
  },
  {
    id: 3,
    placeId: 2,
    user: '踩坑专业户',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
    level: '真探',
    verified: true,
    time: '2026-07-01',
    rating: 1,
    content: '大踩雷！小红书上的照片滤镜太重了，实际场地只有宣传图的三分之一大。动物区就几只兔子和羊，互动还要另收费。门票168一个人，一家三口花了500多，玩了不到一小时孩子就想走了。强烈不推荐！',
    tags: ['照骗', '性价比低', '不推荐'],
    imgs: ['https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=200&h=200&fit=crop'],
    dimensions: { env: 2, facility: 1, service: 2, value: 1, safety: 3, fun: 2 }
  },
  {
    id: 4,
    placeId: 3,
    user: '文化爸爸',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
    level: '探索者',
    verified: true,
    time: '2026-07-03',
    rating: 5,
    content: '鹿苑真的太治愈了！小鹿很温顺，可以近距离接触。建议买电瓶车票，园区太大走路会很累。',
    tags: ['鹿苑超赞', '建议租车'],
    imgs: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=200&h=200&fit=crop'],
    dimensions: { env: 5, facility: 4, service: 4, value: 5, safety: 5, fun: 5 }
  }
];

const currentUser = {
  name: '探店达人',
  level: '探索者',
  contributions: 45,
  reviews: 3,
  photos: 8,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me'
};

module.exports = { places, reviews, currentUser };
