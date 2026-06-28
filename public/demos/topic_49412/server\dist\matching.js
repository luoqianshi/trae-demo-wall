import { v4 as uuidv4 } from 'uuid';
// 生成随机身份码 (6位数字字母)
export function generateUserCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除易混淆字符
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
// 生成随机头像
export function generateRandomAvatar() {
    const bgColors = [
        '#1a1a2e', '#16213e', '#0f3460', '#1f4068',
        '#2c3e50', '#34495e', '#2d3436', '#192a56',
        '#1e3799', '#0c2461', '#182C25', '#1B4332'
    ];
    const textColors = [
        '#00fff5', '#ff6b6b', '#ffd93d', '#6bcb77',
        '#4d96ff', '#ff8fab', '#a8e6cf', '#ffeaa7',
        '#74b9ff', '#fd79a8', '#55efc4', '#ffeaa7'
    ];
    const kaomojis = [
        '˶>ᗜ<˶', 'ㅎㅅㅎ', '¯꒳¯', 'T^T',
        '∩_∩', '￣～￣', '◦˙▽˙◦', '⩌ᴗ⩌',
        '*¯︶¯*', 'ᗜ - ᗜ', ',,ᗜ - ᗜ,,', 'ᗜ ᴗ ᗜ',
        'ᗜ ‸ ᗜ', 'ᗜ ֊ ᗜ', 'ᗜ 𖥦 ᗜ'
    ];
    return {
        bgColor: bgColors[Math.floor(Math.random() * bgColors.length)],
        textColor: textColors[Math.floor(Math.random() * textColors.length)],
        kaomoji: kaomojis[Math.floor(Math.random() * kaomojis.length)]
    };
}
// 创建新用户
export function createUser() {
    const avatar = generateRandomAvatar();
    return {
        id: uuidv4(),
        code: generateUserCode(),
        avatar,
        nickname: `用户${Math.floor(Math.random() * 9000) + 1000}`,
        selfAvatar: { ...avatar }
    };
}
// 创建新对话
export function createConversation(user1Id, user2Id) {
    return {
        id: uuidv4(),
        participants: [user1Id, user2Id],
        messages: [],
        createdAt: Date.now(),
        preserved: false,
        ratings: {}
    };
}
// 创建消息
export function createMessage(senderId, content, type = 'user') {
    return {
        id: uuidv4(),
        senderId,
        content,
        timestamp: Date.now(),
        type
    };
}
// 验证身份码格式
export function isValidCode(code) {
    return /^[A-HJ-NP-Z2-9]{6}$/.test(code);
}
