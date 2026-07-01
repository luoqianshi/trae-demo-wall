// 闲位通 - 模拟数据

const parkingSpots = [
    {
        id: 'SP001',
        name: '阳光花园小区 - 地下B2层',
        address: '朝阳区建国路88号',
        distance: 180,
        type: 'underground',
        features: ['有监控', '24小时'],
        timeRange: { start: '08:00', end: '18:00' },
        price: 10,
        owner: { name: '张先生', credit: 4.8, avatar: '👨' },
        rating: 4.6,
        reviews: 23,
        status: 'available',
        desc: '地下B2层固定车位，有24小时监控，电梯直达，限高2.1米',
        mapPosition: { top: '30px', left: '120px' },
        reviewList: [
            { name: '王先生', avatar: '👨', date: '06-20', rating: 5, text: '车位很干净，位置好找，电梯直达很方便！' },
            { name: '刘女士', avatar: '👩', date: '06-18', rating: 4, text: '位置不错，价格实惠，下次还会租。' },
            { name: '赵先生', avatar: '👨‍💼', date: '06-15', rating: 5, text: '地下车位安全有保障，业主也很友好。' }
        ]
    },
    {
        id: 'SP002',
        name: 'SOHO现代城 - 地面停车位',
        address: '朝阳区大望路12号',
        distance: 320,
        type: 'ground',
        features: ['带充电桩', '有遮阳棚'],
        timeRange: { start: '09:00', end: '19:00' },
        price: 15,
        owner: { name: '李女士', credit: 4.9, avatar: '👩' },
        rating: 4.8,
        reviews: 31,
        status: 'available',
        desc: '地面停车位带充电桩，有遮阳棚，适合新能源车',
        mapPosition: { top: '100px', left: '80px' },
        reviewList: [
            { name: '孙先生', avatar: '👨', date: '06-19', rating: 5, text: '充电桩很好用，遮阳棚夏天太贴心了！' },
            { name: '周女士', avatar: '👩', date: '06-16', rating: 4, text: '位置便利，周边商圈逛完直接取车。' },
            { name: '吴先生', avatar: '👨‍💼', date: '06-12', rating: 5, text: '新能源车主福音，充电速度快。' }
        ]
    },
    {
        id: 'SP003',
        name: '万达广场住宅区 - 固定车位',
        address: '朝阳区双井桥东',
        distance: 500,
        type: 'fixed',
        features: ['有地锁', '有监控', '周末可用'],
        timeRange: { start: '08:00', end: '18:00' },
        price: 12,
        owner: { name: '王先生', credit: 4.7, avatar: '👨‍💼' },
        rating: 4.5,
        reviews: 18,
        status: 'available',
        desc: '固定车位带地锁，工作日白天空闲，周末全天可用',
        mapPosition: { top: '60px', right: '100px' },
        reviewList: [
            { name: '钱女士', avatar: '👩', date: '06-17', rating: 4, text: '地锁很稳固，不用担心被占。' },
            { name: '郑先生', avatar: '👨', date: '06-14', rating: 5, text: '周末带孩子去万达停车超方便。' }
        ]
    },
    {
        id: 'SP004',
        name: '望京新城 - 地下车位',
        address: '朝阳区望京街66号',
        distance: 650,
        type: 'underground',
        features: ['24小时', '有监控'],
        timeRange: { start: '07:00', end: '19:00' },
        price: 8,
        owner: { name: '赵女士', credit: 4.6, avatar: '👩‍💼' },
        rating: 4.3,
        reviews: 15,
        status: 'available',
        desc: '地下车位宽敞，近电梯口，24小时保安巡逻',
        mapPosition: { bottom: '40px', right: '60px' },
        reviewList: [
            { name: '冯先生', avatar: '👨', date: '06-18', rating: 4, text: '价格很实惠，近电梯口很方便。' },
            { name: '陈女士', avatar: '👩', date: '06-11', rating: 5, text: '空间宽敞，大车也能轻松停入。' },
            { name: '黄先生', avatar: '👨‍💼', date: '06-08', rating: 4, text: '保安巡逻让人放心，推荐。' }
        ]
    },
    {
        id: 'SP005',
        name: '国贸公寓 - 地面车位',
        address: '朝阳区建国门外大街1号',
        distance: 420,
        type: 'ground',
        features: ['带充电桩', '有遮阳棚', '有监控'],
        timeRange: { start: '08:30', end: '17:30' },
        price: 20,
        owner: { name: '陈先生', credit: 4.9, avatar: '👨‍💻' },
        rating: 4.7,
        reviews: 42,
        status: 'occupied',
        desc: '高端公寓地面车位，带充电桩和遮阳棚，位置优越',
        mapPosition: { top: '140px', left: '200px' },
        reviewList: [
            { name: '林女士', avatar: '👩', date: '06-21', rating: 5, text: '位置绝佳，去国贸办公停车首选。' },
            { name: '何先生', avatar: '👨', date: '06-15', rating: 4, text: '设施齐全，就是价格偏高。' }
        ]
    },
    {
        id: 'SP006',
        name: '三里屯SOHO - 地下B1层',
        address: '朝阳区工人体育场北路8号',
        distance: 280,
        type: 'underground',
        features: ['24小时', '有监控', '近电梯'],
        timeRange: { start: '10:00', end: '22:00' },
        price: 18,
        owner: { name: '刘女士', credit: 4.8, avatar: '👩‍🎨' },
        rating: 4.9,
        reviews: 56,
        status: 'available',
        desc: '三里屯商圈地下车位，近电梯口，适合商圈上班族',
        mapPosition: { top: '80px', right: '150px' },
        reviewList: [
            { name: '许先生', avatar: '👨', date: '06-22', rating: 5, text: '三里屯上班族必备，近电梯超方便。' },
            { name: '杨女士', avatar: '👩', date: '06-19', rating: 5, text: '车位规整，业主回复很及时。' },
            { name: '罗先生', avatar: '👨‍💼', date: '06-16', rating: 4, text: '商圈核心位置，虽然贵一点但值得。' }
        ]
    },
    {
        id: 'SP007',
        name: '朝阳公园南门 - 地面车位',
        address: '朝阳区朝阳公园南路',
        distance: 750,
        type: 'ground',
        features: ['有遮阳棚'],
        timeRange: { start: '06:00', end: '20:00' },
        price: 6,
        owner: { name: '孙先生', credit: 4.5, avatar: '👨‍🏫' },
        rating: 4.2,
        reviews: 12,
        status: 'available',
        desc: '朝阳公园附近地面车位，价格实惠，适合晨练停车',
        mapPosition: { bottom: '80px', left: '150px' },
        reviewList: [
            { name: '马先生', avatar: '👨', date: '06-20', rating: 4, text: '晨练停车好去处，价格很便宜。' },
            { name: '宋女士', avatar: '👩', date: '06-13', rating: 4, text: '离公园近，停车方便。' }
        ]
    },
    {
        id: 'SP008',
        name: '东直门内大街 - 固定车位',
        address: '东城区东直门内大街',
        distance: 920,
        type: 'fixed',
        features: ['有地锁', '有监控', '24小时'],
        timeRange: { start: '08:00', end: '20:00' },
        price: 14,
        owner: { name: '周女士', credit: 4.7, avatar: '👩‍⚕️' },
        rating: 4.6,
        reviews: 28,
        status: 'available',
        desc: '固定车位带地锁，24小时监控，位置安全',
        mapPosition: { top: '20px', left: '280px' },
        reviewList: [
            { name: '田先生', avatar: '👨', date: '06-21', rating: 5, text: '安全可靠，地锁很结实。' },
            { name: '方女士', avatar: '👩', date: '06-18', rating: 4, text: '东直门附近停车的好选择。' },
            { name: '谢先生', avatar: '👨‍💼', date: '06-10', rating: 5, text: '业主管理很规范，值得信赖。' }
        ]
    }
];

const orders = [
    {
        id: 'XWT20250622001',
        spotId: 'SP001',
        status: 'active',
        date: '2026-06-22',
        timeRange: { start: '08:00', end: '18:00' },
        amount: 10,
        spotName: '阳光花园小区 - 地下B2层',
        spotAddress: '朝阳区建国路88号',
        ownerName: '张先生'
    },
    {
        id: 'XWT20250621002',
        spotId: 'SP002',
        status: 'completed',
        date: '2026-06-21',
        timeRange: { start: '09:00', end: '17:00' },
        amount: 15,
        spotName: 'SOHO现代城 - 地面停车位',
        spotAddress: '朝阳区大望路12号',
        ownerName: '李女士'
    },
    {
        id: 'XWT20250620003',
        spotId: 'SP003',
        status: 'completed',
        date: '2026-06-20',
        timeRange: { start: '08:00', end: '18:00' },
        amount: 12,
        spotName: '万达广场住宅区 - 固定车位',
        spotAddress: '朝阳区双井桥东',
        ownerName: '王先生'
    },
    {
        id: 'XWT20250623004',
        spotId: 'SP006',
        status: 'pending',
        date: '2026-06-23',
        timeRange: { start: '10:00', end: '22:00' },
        amount: 18,
        spotName: '三里屯SOHO - 地下B1层',
        spotAddress: '朝阳区工人体育场北路8号',
        ownerName: '刘女士'
    }
];

const incomeRecords = [
    { date: '2026-06-22', spotName: '阳光花园小区 - 地下B2层', amount: 10, status: '已完成' },
    { date: '2026-06-21', spotName: '阳光花园小区 - 地下B2层', amount: 10, status: '已完成' },
    { date: '2026-06-20', spotName: '万达广场住宅区 - 固定车位', amount: 12, status: '已完成' },
    { date: '2026-06-19', spotName: '阳光花园小区 - 地下B2层', amount: 10, status: '已完成' },
    { date: '2026-06-18', spotName: 'SOHO现代城 - 地面停车位', amount: 15, status: '已完成' },
    { date: '2026-06-17', spotName: '阳光花园小区 - 地下B2层', amount: 10, status: '已完成' },
    { date: '2026-06-16', spotName: '万达广场住宅区 - 固定车位', amount: 12, status: '已完成' }
];

const mySpots = [
    {
        id: 'MY001',
        name: '阳光花园小区 - 地下B2层',
        address: '朝阳区建国路88号',
        type: 'underground',
        price: 10,
        timeRange: { start: '08:00', end: '18:00' },
        status: 'published',
        bookings: 23,
        income: 230,
        bookingRecords: [
            { user: '小明', date: '2026-06-27', timeRange: {start:'08:00', end:'18:00'}, amount: 10, status: 'completed' },
            { user: '张三', date: '2026-06-26', timeRange: {start:'14:00', end:'20:00'}, amount: 10, status: 'completed' },
            { user: '李四', date: '2026-06-25', timeRange: {start:'09:00', end:'12:00'}, amount: 10, status: 'completed' },
            { user: '王五', date: '2026-06-28', timeRange: {start:'08:00', end:'18:00'}, amount: 10, status: 'pending' },
        ]
    },
    {
        id: 'MY002',
        name: 'SOHO现代城 - 地面停车位',
        address: '朝阳区大望路12号',
        type: 'ground',
        price: 15,
        timeRange: { start: '09:00', end: '19:00' },
        status: 'published',
        bookings: 15,
        income: 225,
        bookingRecords: [
            { user: '小红', date: '2026-06-27', timeRange: {start:'10:00', end:'16:00'}, amount: 15, status: 'completed' },
            { user: '小刚', date: '2026-06-26', timeRange: {start:'08:00', end:'18:00'}, amount: 15, status: 'completed' },
            { user: '小丽', date: '2026-06-28', timeRange: {start:'09:00', end:'17:00'}, amount: 15, status: 'pending' },
        ]
    },
    {
        id: 'MY003',
        name: '万达广场住宅区 - 固定车位',
        address: '朝阳区双井桥东',
        type: 'fixed',
        price: 12,
        timeRange: { start: '08:00', end: '18:00' },
        status: 'offline',
        bookings: 8,
        income: 96,
        bookingRecords: [
            { user: '小芳', date: '2026-06-27', timeRange: {start:'08:00', end:'12:00'}, amount: 12, status: 'completed' },
            { user: '小强', date: '2026-06-26', timeRange: {start:'14:00', end:'18:00'}, amount: 12, status: 'completed' },
            { user: '小美', date: '2026-06-28', timeRange: {start:'10:00', end:'16:00'}, amount: 12, status: 'pending' },
        ]
    }
];

// 用户数据
const userData = {
    name: '停车达人',
    avatar: '👤',
    credit: 95,
    creditLevel: '金牌车主',
    publishedSpots: 3,
    totalBookings: 12,
    totalIncome: 356,
    totalSpent: 89
};

// 工具函数
function formatDistance(meters) {
    if (meters < 1000) {
        return `${meters}米`;
    }
    return `${(meters / 1000).toFixed(1)}公里`;
}

function formatPrice(price) {
    return `¥${price}`;
}

function getTypeName(type) {
    const typeMap = {
        'underground': '地下车位',
        'ground': '地面车位',
        'fixed': '固定车位'
    };
    return typeMap[type] || type;
}

function getTypeIcon(type) {
    const iconMap = {
        'underground': '🏢',
        'ground': '🅿️',
        'fixed': '🔒'
    };
    return iconMap[type] || '📍';
}

function getStatusText(status) {
    const statusMap = {
        'active': '进行中',
        'pending': '待使用',
        'completed': '已完成'
    };
    return statusMap[status] || status;
}

function getStatusClass(status) {
    const classMap = {
        'active': 'status-active',
        'pending': 'status-pending',
        'completed': 'status-completed'
    };
    return classMap[status] || '';
}

// 预约通知数据
const bookingNotifications = [
    { id: 'BN001', type: 'booking', title: '新的预约请求', content: '用户"小明"预约了您的车位"阳光花园B2层"', time: '10分钟前', spotId: 'MY001', read: false },
    { id: 'BN002', type: 'booking', title: '预约已确认', content: '车主已确认您"万达广场"的预约', time: '1小时前', spotId: 'SP001', read: false },
    { id: 'BN003', type: 'booking', title: '新的预约请求', content: '用户"张三"预约了您的车位"万达广场住宅区"', time: '2小时前', spotId: 'MY003', read: true },
];

// 优惠券数据
const coupons = [
    { id: 'CP001', name: '新用户立减5元', type: 'discount', value: 5, minAmount: 10, expireDate: '2026-07-31', status: 'available', condition: '全场可用' },
    { id: 'CP002', name: '周末停车8折', type: 'percent', value: 8, minAmount: 15, expireDate: '2026-08-15', status: 'available', condition: '仅限周末使用' },
    { id: 'CP003', name: '满30减8元', type: 'discount', value: 8, minAmount: 30, expireDate: '2026-06-30', status: 'used', condition: '限地下车位' }
];

// 聊天历史数据
const chatHistory = [
    { from: 'other', text: '您好，请问车位现在还可以预约吗？', time: '10:30' },
    { from: 'me', text: '可以的，您需要什么时候停？', time: '10:32' },
    { from: 'other', text: '明天下午2点到5点，可以吗？', time: '10:33' },
    { from: 'me', text: '没问题，已为您预留', time: '10:35' },
];

// 导出数据（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parkingSpots,
        orders,
        incomeRecords,
        mySpots,
        bookingNotifications,
        userData,
        formatDistance,
        formatPrice,
        getTypeName,
        getTypeIcon,
        getStatusText,
        getStatusClass
    };
}
