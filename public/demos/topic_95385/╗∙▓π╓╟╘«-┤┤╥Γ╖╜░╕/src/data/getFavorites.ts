import { getPolicyById } from './policies'

export default function getFavorites() {
  const favoriteIds = ['1', '3', '5']
  const favorites = favoriteIds.map(id => ({
    id: 'fav_' + id,
    policyId: id,
    policy: getPolicyById(id),
    createTime: new Date().toISOString()
  })).filter(f => f.policy)
  
  return {
    favorites,
    total: favorites.length
  }
}