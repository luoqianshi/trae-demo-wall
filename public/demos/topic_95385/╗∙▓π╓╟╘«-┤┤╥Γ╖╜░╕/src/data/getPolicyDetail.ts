import { getPolicyById } from './policies'

export default function getPolicyDetail(params: { id: string }) {
  const policy = getPolicyById(params.id)
  return { policy }
}