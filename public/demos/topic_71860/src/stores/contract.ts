import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Contract {
  id: string
  title: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason?: string
  signatureImage?: string
  companySeal?: string
  signTime?: string
  idCardFront?: string
  idCardBack?: string
  idCardInfo?: {
    name: string
    idNumber: string
    address: string
  }
  createTime: string
}

export const useContractStore = defineStore('contract', () => {
  const contracts = ref<Contract[]>([
    {
      id: '1',
      title: '电子服务合同',
      content: '',
      status: 'pending',
      signatureImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0yMCA1MCBRMzAgMzAgNTAgNDAgUTcwIDUwIDkwIDM1IFExMTAgMjAgMTMwIDQ1IFExNTAgNzAgMTcwIDQwIFExOTAgMTAgMjIwIDUwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjx0ZXh0IHg9IjgwIiB5PSI4MCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OSI+572R5Z2A56eD5aS05Zyw5Zu+PC90ZXh0Pjwvc3ZnPg==',
      companySeal: '',
      signTime: '2026-06-22 14:30:00',
      idCardFront: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjgwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI2U4ZjVlOSIgc3Ryb2tlPSIjY2NjIi8+PHRleHQgeD0iMTQwIiB5PSI5MCIgZm9udC1zaXplPSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NiI+5bmz5Y+w6Iux6K+t5Zu+54mH5p2D6ZmQPC90ZXh0Pjx0ZXh0IHg9IjE0MCIgeT0iMTIwIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij7kvZzogIXnsbvlnovln44g5YWs6aSoPC90ZXh0Pjwvc3ZnPg==',
      idCardBack: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjgwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI2U4ZjVlOSIgc3Ryb2tlPSIjY2NjIi8+PHRleHQgeD0iMTQwIiB5PSI5MCIgZm9udC1zaXplPSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NiI+5bmz5Y+w6Iux6K+t5Zu+54mH5p2D6ZmRPC90ZXh0Pjx0ZXh0IHg9IjE0MCIgeT0iMTIwIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij7kvZzogIXnsbvlnovln44g5YWs6aSoPC90ZXh0Pjwvc3ZnPg==',
      idCardInfo: {
        name: '张三',
        idNumber: '110101199001011234',
        address: '北京市朝阳区xxx街道xxx号',
      },
      createTime: '2026-06-22 10:00:00',
    },
    {
      id: '2',
      title: '电子服务合同',
      content: '',
      status: 'rejected',
      rejectReason: '身份证照片不清晰，无法识别证件信息。请重新拍摄身份证正反面照片，确保照片清晰、完整、无遮挡。',
      signatureImage: '',
      companySeal: '',
      signTime: '2026-06-20 14:30:00',
      idCardFront: '',
      idCardBack: '',
      idCardInfo: {
        name: '张三',
        idNumber: '110101199001011234',
        address: '北京市朝阳区xxx街道xxx号',
      },
      createTime: '2026-06-20 14:00:00',
    },
    {
      id: '3',
      title: '电子服务合同',
      content: '',
      status: 'approved',
      signatureImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0yMCA1MCBRMzAgMzAgNTAgNDAgUTcwIDUwIDkwIDM1IFExMTAgMjAgMTMwIDQ1IFExNTAgNzAgMTcwIDQwIFExOTAgMTAgMjIwIDUwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjx0ZXh0IHg9IjgwIiB5PSI4MCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OSI+572R5Z2A56eD5aS05Zyw5Zu+PC90ZXh0Pjwvc3ZnPg==',
      companySeal: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjkwIiBzdHJva2U9IiNmNTIyMmQiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODIiIHN0cm9rZT0iI2Y1MjIyZCIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEwMCA1NSBMMTA1IDcwIEwxMjAgNzAgTDEwOCA4MCBMMTEyIDk1IEwxMDAgODUgTDg4IDk1IEw5MiA4MCBMODAgNzAgTDk1IDcwIFoiIGZpbGw9IiNmNTIyMmQiLz48dGV4dCB4PSIxMDAiIHk9IjEyNSIgZm9udC1zaXplPSIxOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2Y1MjIyZCIgZm9udC13ZWlnaHQ9ImJvbGQiPueUteWtkOWVheeUtTwvdGV4dD48dGV4dCB4PSIxMDAiIHk9IjE1MCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2Y1MjIyZCI+5Z+O5biC5Luj55CG5a6J5YWo56eDPC90ZXh0Pjwvc3ZnPg==',
      signTime: '2026-06-18 10:30:00',
      idCardFront: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjgwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI2U4ZjVlOSIgc3Ryb2tlPSIjY2NjIi8+PHRleHQgeD0iMTQwIiB5PSI5MCIgZm9udC1zaXplPSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NiI+5bmz5Y+w6Iux6K+t5Zu+54mH5p2D6ZmQPC90ZXh0Pjx0ZXh0IHg9IjE0MCIgeT0iMTIwIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij7kvZzogIXnsbvlnovln44g5YWs6aSoPC90ZXh0Pjwvc3ZnPg==',
      idCardBack: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjgwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI2U4ZjVlOSIgc3Ryb2tlPSIjY2NjIi8+PHRleHQgeD0iMTQwIiB5PSI5MCIgZm9udC1zaXplPSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NiI+5bmz5Y+w6Iux6K+t5Zu+54mH5p2D6ZmRPC90ZXh0Pjx0ZXh0IHg9IjE0MCIgeT0iMTIwIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij7kvZzogIXnsbvlnovln44g5YWs6aSoPC90ZXh0Pjwvc3ZnPg==',
      idCardInfo: {
        name: '张三',
        idNumber: '110101199001011234',
        address: '北京市朝阳区xxx街道xxx号',
      },
      createTime: '2026-06-18 09:00:00',
    },
  ])

  const currentContract = ref<Contract | null>(null)

  const pendingContracts = computed(() =>
    contracts.value.filter(c => c.status === 'pending')
  )

  const approvedContracts = computed(() =>
    contracts.value.filter(c => c.status === 'approved')
  )

  const rejectedContracts = computed(() =>
    contracts.value.filter(c => c.status === 'rejected')
  )

  function setCurrentContract(contract: Contract) {
    currentContract.value = contract
  }

  function updateContract(contract: Partial<Contract> & { id: string }) {
    const index = contracts.value.findIndex(c => c.id === contract.id)
    if (index !== -1) {
      contracts.value[index] = { ...contracts.value[index], ...contract }
    }
  }

  function addContract(contract: Contract) {
    contracts.value.unshift(contract)
  }

  return {
    contracts,
    currentContract,
    pendingContracts,
    approvedContracts,
    rejectedContracts,
    setCurrentContract,
    updateContract,
    addContract,
  }
})
