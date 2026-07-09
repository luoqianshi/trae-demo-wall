export default function login() {
  return {
    openid: 'mock_openid_' + Math.random().toString(36).substr(2, 9),
    userInfo: {
      nickname: '基层工作者',
      avatar: '',
      role: 'community'
    }
  }
}