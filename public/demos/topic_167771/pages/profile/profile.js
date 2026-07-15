import { NavigationBar } from '../../components/navigation-bar.js';
import { BottomNavigation } from '../../components/bottom-navigation.js';
import { getOrderList, clearRepairOrders } from '../../mock/mockApi.js';
import { navigateTo } from '../../router.js';

const dialogs = {
  address: ['常用地址', '演示版暂不保存真实地址。正式版本将支持地址簿与家庭成员代报修。'],
  guarantees: ['平台保障', '先看预估价、师傅资质可核验、报价确认后施工、订单留痕并提供售后入口。'],
  guide: ['使用说明', '从“报修”选择故障类型，填写问题和上门信息，确认预估价后即可生成本地模拟订单。'],
  about: ['关于水电到家', '面向普通家庭的可信上门维修 Demo。本版本使用本地模拟数据，不产生真实交易。']
};

async function refreshCount() {
  const orders = await getOrderList();
  document.getElementById('order-count').textContent = String(orders.length);
  document.getElementById('clear-orders').disabled = orders.length === 0;
}

document.addEventListener('DOMContentLoaded', () => {
  new NavigationBar(document.getElementById('navigation-bar'), { title: '我的', back: false, background: '#FFFDF9' });
  new BottomNavigation(document.getElementById('bottom-navigation'), 'profile');
  document.getElementById('open-orders').addEventListener('click', () => navigateTo('/orders'));
  document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => {
    const [title, content] = dialogs[button.dataset.dialog];
    window.alert(`${title}\n\n${content}`);
  }));
  document.getElementById('clear-orders').addEventListener('click', async () => {
    if (!window.confirm('仅删除本机保存的模拟订单，删除后无法恢复。确认清除？')) return;
    await clearRepairOrders();
    await refreshCount();
  });
  refreshCount();
});
