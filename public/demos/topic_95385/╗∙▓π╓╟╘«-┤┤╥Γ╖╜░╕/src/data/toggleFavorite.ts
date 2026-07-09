export default function toggleFavorite(params: { policyId: string }) {
  return {
    status: 'success',
    message: '收藏状态已更新'
  }
}