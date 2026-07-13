/**
 * 饭泛之交 - Invite 邀请码
 * 模块化拆分自单文件原型
 */

// ==================== INVITATION CODES ====================
function renderInvitePage() {
  const codes = Store.invitationCodes;
  const container = document.getElementById('invite-list');
  const availableCount = codes.filter(c => !c.used).length;
  document.getElementById('invite-available-count').textContent = availableCount;
  if(codes.length === 0) {
    container.innerHTML = '<p class="text-center text-light text-sm" style="padding:20px;">还没有邀请码，完成约饭后可获得更多</p>';
  } else {
    container.innerHTML = codes.map(c => `
      <div class="invite-card">
        <div class="invite-code-row">
          <div class="invite-code-text">${c.code}</div>
          <button class="invite-code-copy" onclick="copyInviteCode('${c.code}')">📋 复制</button>
        </div>
        <div class="invite-meta">
          <span>创建于 ${c.createdAt}</span>
          <span class="invite-status ${c.used ? 'used' : 'available'}">${c.used ? '已使用' : '可用'}</span>
        </div>
      </div>
    `).join('');
  }
  // Update tree
  if(Store.user) {
    document.getElementById('tree-root-avatar').textContent = Store.user.avatar || '😊';
    document.getElementById('tree-root-name').textContent = Store.user.name + '（我）';
    document.getElementById('tree-root-meta').textContent = '邀请码来源: ' + (Store.invitedBy || '种子用户');
  }
}

function copyInviteCode(code) {
  // 模拟复制
  showToast('已复制邀请码：' + code);
}