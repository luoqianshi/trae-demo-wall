const repairShortcuts = [
  { id: "light", title: "灯具安装", description: "吸顶灯、吊灯与开关安装", iconPath: "../../assets/icons/source/bulb.svg", action: "repair", serviceType: "light_install" },
  { id: "faucet", title: "龙头维修", description: "松动、滴水与出水异常", iconPath: "../../assets/icons/source/faucet.svg", action: "repair", serviceType: "bathroom_repair" },
  { id: "sink", title: "水槽漏水", description: "下水、软管与接口渗漏", iconPath: "../../assets/icons/source/sink.svg", action: "repair", serviceType: "pipe_leak" },
  { id: "circuit", title: "电路故障", description: "跳闸、断电与插座异常", iconPath: "../../assets/icons/source/bolt.svg", action: "repair", serviceType: "circuit_fault" },
  { id: "heater", title: "热水器检修", description: "不加热、漏水与异常排查", iconPath: "../../assets/icons/source/heater.svg", action: "repair", serviceType: "appliance_check" },
  { id: "drain", title: "管道疏通", description: "厨房与卫生间下水快速排堵", iconPath: "../../assets/icons/source/sink.svg", action: "repair", serviceType: "drain_unblock" },
  { id: "socket", title: "开关插座", description: "更换、增设与接触不良检修", iconPath: "../../assets/icons/source/bolt.svg", action: "repair", serviceType: "socket_install" },
  { id: "waterproof", title: "防水补漏", description: "厨卫、阳台渗水定位与修复", iconPath: "../../assets/icons/source/wrench.svg", action: "repair", serviceType: "waterproof_repair" },
  { id: "smart-home", title: "智能家居", description: "网络、门铃与弱电设备安装", iconPath: "../../assets/icons/source/technician.svg", action: "repair", serviceType: "smart_home" },
  { id: "technician", title: "找维修师傅", description: "按评分、距离和技能筛选", iconPath: "../../assets/icons/source/technician.svg", action: "navigate", target: "/search" }
];

export { repairShortcuts };
