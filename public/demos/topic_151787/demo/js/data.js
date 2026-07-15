var mockData = {
    users: [
        { id: 1, name: '王阿姨', avatar: '👵', role: 'publisher', phone: '138****1234', address: '北京市朝阳区幸福小区', status: 'active' },
        { id: 2, name: '李叔叔', avatar: '👴', role: 'publisher', phone: '139****5678', address: '北京市海淀区阳光花园', status: 'active' },
        { id: 3, name: '张小明', avatar: '👨‍🎓', role: 'taker', phone: '137****9012', address: '北京市朝阳区', status: 'active', description: '大学生志愿者，擅长聊天陪伴、手机教学' },
        { id: 4, name: '刘小红', avatar: '👩‍🎓', role: 'taker', phone: '136****3456', address: '北京市海淀区', status: 'active', description: '热心公益，可提供上门陪护、陪同就医服务' },
        { id: 5, name: '赵大哥', avatar: '👨‍💼', role: 'taker', phone: '135****7890', address: '北京市西城区', status: 'active', description: '兼职服务者，可代办跑腿、日常陪伴' }
    ],
    tasks: [
        { id: 1, type: 'chat', title: '聊天陪伴', serviceType: '聊天陪伴', date: '2026-07-15', time: '上午 09:00-11:00', location: '北京市朝阳区幸福小区', description: '老人独居在家，希望有人来聊聊天、读读报纸', reward: 80, status: 'pending', publisherId: 1, takerId: null, createdAt: '2026-07-10' },
        { id: 2, type: 'accompany', title: '陪同就医', serviceType: '陪同就医', date: '2026-07-12', time: '下午 14:00-16:00', location: '北京市朝阳区人民医院', description: '需要去医院复诊取药，希望有人陪同', reward: 150, status: 'accepted', publisherId: 2, takerId: 3, createdAt: '2026-07-09' },
        { id: 3, type: 'run', title: '代购跑腿', serviceType: '代购跑腿', date: '2026-07-11', time: '上午 10:00-12:00', location: '北京市海淀区阳光花园', description: '帮忙购买生活用品：米面油、蔬菜', reward: 60, status: 'in_progress', publisherId: 2, takerId: 5, createdAt: '2026-07-08' },
        { id: 4, type: 'home', title: '上门陪护', serviceType: '上门陪护', date: '2026-07-13', time: '全天', location: '北京市西城区和平里', description: '子女出差，需要有人上门陪伴老人一天', reward: 300, status: 'pending', publisherId: 1, takerId: null, createdAt: '2026-07-10' },
        { id: 5, type: 'walk', title: '日常散步', serviceType: '日常散步陪伴', date: '2026-07-14', time: '下午 15:00-17:00', location: '北京市朝阳区公园', description: '希望有人陪同在公园散步、锻炼身体', reward: 50, status: 'pending', publisherId: 2, takerId: null, createdAt: '2026-07-10' },
        { id: 6, type: 'festival', title: '节日慰问', serviceType: '节日慰问', date: '2026-07-16', time: '下午 14:00-16:00', location: '北京市海淀区养老院', description: '端午节慰问老人，陪伴过节', reward: 100, status: 'completed', publisherId: 1, takerId: 4, createdAt: '2026-07-05' }
    ],
    categories: [
        { id: 'chat', name: '聊天陪伴', icon: '💬', color: '#FF9966' },
        { id: 'home', name: '上门陪护', icon: '🏠', color: '#FF6B6B' },
        { id: 'hospital', name: '陪同就医', icon: '🏥', color: '#4ECDC4' },
        { id: 'run', name: '代购跑腿', icon: '🏪', color: '#FFE66D' },
        { id: 'festival', name: '节日慰问', icon: '🎁', color: '#95E1D3' },
        { id: 'walk', name: '日常散步陪伴', icon: '🚶', color: '#A8E6CF' }
    ],
    stats: {
        totalTasks: 156,
        pendingTasks: 23,
        completedServices: 108,
        activeUsers: 89,
        publishers: 45,
        takers: 44
    }
};

var currentUser = {
    id: 1,
    name: '王阿姨',
    avatar: '👵',
    role: 'publisher'
};

var pageState = {
    currentPage: 'home',
    currentRole: 'publisher'
};