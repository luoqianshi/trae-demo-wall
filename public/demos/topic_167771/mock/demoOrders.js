import { serviceCatalog, materialNote } from "./serviceCatalog.js";

const orderTemplates = [
  { issue: "厨房水槽下方持续渗水，需要检查软管和接口。", address: "演示地址 · 阳光花园 1 栋", status: "awaiting_acceptance" },
  { issue: "客厅插座偶尔断电，希望排查线路接触问题。", address: "演示地址 · 金桂家园 2 栋", status: "repairing" },
  { issue: "卧室吸顶灯闪烁，需要更换驱动并检查开关。", address: "演示地址 · 春江小区 3 栋", status: "quoting" },
  { issue: "卫生间龙头关闭后滴水，需要更换阀芯。", address: "演示地址 · 青云里 5 栋", status: "arriving" },
  { issue: "热水器加热速度变慢，并伴有异常响声。", address: "演示地址 · 湖畔新城 6 栋", status: "matched" },
  { issue: "厨房下水排水缓慢，使用时出现返水现象。", address: "演示地址 · 梧桐公馆 7 栋", status: "submitted" },
  { issue: "书房需要新增两个五孔插座并整理走线。", address: "演示地址 · 云栖苑 8 栋", status: "awaiting_acceptance" },
  { issue: "阳台墙角雨天渗水，需要定位并进行防水修补。", address: "演示地址 · 星河湾 9 栋", status: "repairing" },
  { issue: "入户网络信号不稳定，需要检查弱电箱和网线。", address: "演示地址 · 锦绣城 10 栋", status: "quoting" },
  { issue: "老房水电线路需要整体巡检并给出改造建议。", address: "演示地址 · 和风里 12 栋", status: "arriving" }
];

function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

function formatDateTime(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function createDemoOrders(entities, now = new Date()) {
  const workers = entities.filter((item) => item.type === "worker").slice(0, 10);

  return orderTemplates.map((template, index) => {
    const service = serviceCatalog[index % serviceCatalog.length];
    const provider = workers[index % workers.length];
    const createdAt = new Date(now.getTime() - index * 86400 * 1000);
    const datePart = `${createdAt.getFullYear()}${pad(createdAt.getMonth() + 1)}${pad(createdAt.getDate())}`;

    return {
      id: `DEMO${datePart}${pad(index + 1, 4)}`,
      serviceType: service.id,
      issueDescription: template.issue,
      address: template.address,
      appointment: index < 2 ? "今天 18:00-20:00" : "本周内可上门",
      contactPhone: "138****8000",
      providerId: provider.id,
      providerType: provider.type,
      priceEstimate: {
        visitFee: service.visitFee,
        laborMin: service.laborMin,
        laborMax: service.laborMax,
        materialNote
      },
      status: template.status,
      createdAt: formatDateTime(createdAt),
      isDemo: true
    };
  });
}

export { createDemoOrders };
