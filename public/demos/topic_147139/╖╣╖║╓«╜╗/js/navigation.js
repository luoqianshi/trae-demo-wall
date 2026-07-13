/**
 * 饭泛之交 - Navigation 导航
 * 模块化拆分自单文件原型
 */

// ==================== NAVIGATION ====================
function goTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if(pageId === 'home-page') renderHome();
  if(pageId === 'rank-page') renderRank('recommend');
  if(pageId === 'chat-page') renderChatList();
  if(pageId === 'profile-page') renderProfile();
  if(pageId === 'meal-page') renderEvents();
  if(pageId === 'verify-page') renderVerifyPage();
  if(pageId === 'invite-page') renderInvitePage();
  if(pageId === 'credit-page') renderCreditPage();
  if(pageId === 'applications-page') renderPostsPage();
  if(pageId === 'vouchers-page') renderVouchersPage();
}

function switchTab(tab) {
  Store.data.currentTab = tab;
  Store.save();
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-tab="${tab}"]`)?.classList.add('active');
  const map = {home:'home-page',rank:'rank-page',meal:'meal-page',chat:'chat-page',profile:'profile-page'};
  goTo(map[tab]);
}