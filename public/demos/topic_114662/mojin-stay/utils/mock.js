const rooms = [
  {
    id: "R-301",
    name: "云栖山景套房",
    city: "大理",
    cover: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&w=900&q=80",
    status: "在租",
    tenant: "林可",
    phone: "138****0421",
    rent: 3680,
    deposit: 5000,
    cycle: "月付",
    dueDay: 12,
    water: 3.8,
    electric: 0.88,
    startDate: "2026-07-12",
    endDate: "2026-10-12",
    tags: ["山景", "可短租", "含保洁"]
  },
  {
    id: "R-205",
    name: "松间花园房",
    city: "杭州",
    cover: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&w=900&q=80",
    status: "待收租",
    tenant: "周扬",
    phone: "136****8720",
    rent: 2980,
    deposit: 3000,
    cycle: "月付",
    dueDay: 15,
    water: 4.2,
    electric: 0.92,
    startDate: "2026-06-15",
    endDate: "2026-09-15",
    tags: ["近地铁", "长租优惠"]
  },
  {
    id: "R-108",
    name: "海风独院小屋",
    city: "厦门",
    cover: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&w=900&q=80",
    status: "空置",
    tenant: "",
    phone: "",
    rent: 4280,
    deposit: 6000,
    cycle: "月付",
    dueDay: 10,
    water: 3.5,
    electric: 0.86,
    startDate: "",
    endDate: "",
    tags: ["独院", "近海", "可带宠物"]
  }
]

const bills = [
  {
    id: "B-202607-301",
    roomId: "R-301",
    roomName: "云栖山景套房",
    tenant: "林可",
    month: "2026-07",
    rent: 3680,
    waterFee: 76,
    electricFee: 188,
    serviceFee: 120,
    depositOffset: 0,
    total: 4064,
    status: "待收",
    dueDate: "2026-07-12"
  },
  {
    id: "B-202607-205",
    roomId: "R-205",
    roomName: "松间花园房",
    tenant: "周扬",
    month: "2026-07",
    rent: 2980,
    waterFee: 62,
    electricFee: 146,
    serviceFee: 100,
    depositOffset: 0,
    total: 3288,
    status: "逾期",
    dueDate: "2026-07-15"
  },
  {
    id: "B-202606-301",
    roomId: "R-301",
    roomName: "云栖山景套房",
    tenant: "林可",
    month: "2026-06",
    rent: 3680,
    waterFee: 69,
    electricFee: 173,
    serviceFee: 120,
    depositOffset: 0,
    total: 4042,
    status: "已收",
    dueDate: "2026-06-12"
  }
]

const meters = [
  { id: "M-301", roomId: "R-301", roomName: "云栖山景套房", month: "2026-07", waterStart: 120, waterEnd: 140, electricStart: 860, electricEnd: 1074, status: "已录入" },
  { id: "M-205", roomId: "R-205", roomName: "松间花园房", month: "2026-07", waterStart: 96, waterEnd: 111, electricStart: 640, electricEnd: 799, status: "待确认" }
]

const stats = {
  monthIncome: 11394,
  pendingAmount: 7352,
  occupancyRate: 67,
  overdueCount: 1,
  yearIncome: 82640,
  cost: 16380,
  months: [
    { name: "2月", income: 9200 },
    { name: "3月", income: 11800 },
    { name: "4月", income: 12820 },
    { name: "5月", income: 10400 },
    { name: "6月", income: 15120 },
    { name: "7月", income: 11394 }
  ]
}

function getRoom(id) {
  return rooms.find((item) => item.id === id) || rooms[0]
}

function getBill(id) {
  return bills.find((item) => item.id === id) || bills[0]
}

module.exports = {
  rooms,
  bills,
  meters,
  stats,
  getRoom,
  getBill
}
