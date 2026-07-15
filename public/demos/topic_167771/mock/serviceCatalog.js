const serviceCatalog = [
  {
    id: "pipe_leak",
    name: "水管漏水",
    icon: "水",
    summary: "水槽、管道、阀门渗漏",
    matchKeywords: ["水管", "管道", "漏水", "维修"],
    visitFee: 30,
    laborMin: 80,
    laborMax: 180
  },
  {
    id: "circuit_fault",
    name: "电路故障",
    icon: "电",
    summary: "跳闸、断电、插座异常",
    matchKeywords: ["电工", "强电", "弱电", "开关", "插座"],
    visitFee: 30,
    laborMin: 100,
    laborMax: 260
  },
  {
    id: "light_install",
    name: "灯具安装",
    icon: "灯",
    summary: "吸顶灯、吊灯、开关安装",
    matchKeywords: ["电工", "安装", "灯具", "开关"],
    visitFee: 0,
    laborMin: 50,
    laborMax: 120
  },
  {
    id: "bathroom_repair",
    name: "卫浴维修",
    icon: "卫",
    summary: "龙头、马桶、淋浴故障",
    matchKeywords: ["卫浴安装", "厨卫改造", "水管", "维修"],
    visitFee: 30,
    laborMin: 80,
    laborMax: 220
  },
  {
    id: "appliance_check",
    name: "家电检修",
    icon: "检",
    summary: "热水器及常用家电排查",
    matchKeywords: ["热水器安装", "电工", "检修", "维修"],
    visitFee: 50,
    laborMin: 100,
    laborMax: 300
  },
  {
    id: "drain_unblock",
    name: "管道疏通",
    icon: "疏",
    summary: "厨房、卫生间下水排堵",
    matchKeywords: ["管道疏通", "下水", "堵塞", "水管"],
    visitFee: 30,
    laborMin: 80,
    laborMax: 240
  },
  {
    id: "socket_install",
    name: "开关插座安装",
    icon: "插",
    summary: "开关、插座更换与增设",
    matchKeywords: ["开关", "插座", "电工", "安装"],
    visitFee: 0,
    laborMin: 40,
    laborMax: 160
  },
  {
    id: "waterproof_repair",
    name: "防水补漏",
    icon: "防",
    summary: "厨卫、阳台渗水定位修复",
    matchKeywords: ["防水", "补漏", "渗水", "厨卫改造"],
    visitFee: 50,
    laborMin: 180,
    laborMax: 680
  },
  {
    id: "smart_home",
    name: "弱电智能家居",
    icon: "智",
    summary: "网络、门铃与智能设备安装",
    matchKeywords: ["弱电", "布线", "智能家居", "网络"],
    visitFee: 30,
    laborMin: 100,
    laborMax: 420
  },
  {
    id: "other",
    name: "其他需求",
    icon: "其",
    summary: "描述问题后安排检测",
    matchKeywords: ["水电", "维修", "安装"],
    visitFee: 30,
    laborMin: null,
    laborMax: null
  }
];

const materialNote = "材料费按实际使用明细结算，施工前由用户确认";

function findService(serviceType) {
  return serviceCatalog.find(item => item.id === serviceType) || null;
}

export {
  serviceCatalog,
  materialNote,
  findService
};
