/**
 * 商店 - 用金币购买心、双倍卡、皮肤
 */

window.Pages.Shop = {
  render() {
    const user = Store.getUser();
    const items = window.APP_DATA.SHOP_ITEMS;
    const itemsHtml = items.map(item => {
      const canAfford = user.gems >= item.price;
      return `
        <div class="shop-item" data-id="${item.id}">
          <div class="shop-item__icon">${item.icon}</div>
          <div class="shop-item__info">
            <div class="shop-item__name">${item.name}</div>
            <div class="shop-item__desc">${item.desc}</div>
          </div>
          <button class="shop-item__btn ${canAfford ? '' : 'shop-item__btn--disabled'}" 
                  data-id="${item.id}" data-price="${item.price}" data-type="${item.type}" ${item.value ? `data-value="${item.value}"` : ''}>
            <span class="shop-item__price">💎 ${item.price}</span>
          </button>
        </div>
      `;
    }).join('');

    document.getElementById('app').innerHTML = `
      <div class="page page--shop">
        <header class="page-header">
          <button class="page-header__back" data-route="#/home">←</button>
          <h1 class="page-header__title">商店</h1>
        </header>

        <div class="shop-balance">
          <div class="shop-balance__item">
            <span class="shop-balance__icon">💎</span>
            <span class="shop-balance__value" id="gem-balance">${user.gems}</span>
          </div>
          <div class="shop-balance__item">
            <span class="shop-balance__icon">❤️</span>
            <span class="shop-balance__value">${user.hearts}/${user.maxHearts}</span>
          </div>
        </div>

        <div class="shop-list">
          ${itemsHtml}
        </div>

        <div class="home-bottom-spacer"></div>
        ${Components.bottomNav('#/shop')}
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    document.querySelector('.page-header__back').addEventListener('click', () => {
      AudioEngine.playClick();
      window.location.hash = '/home';
    });

    document.querySelectorAll('.shop-item__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('shop-item__btn--disabled')) {
          Utils.toast('💎 宝石不足', 'warn');
          return;
        }
        AudioEngine.playClick();
        const id = btn.getAttribute('data-id');
        const price = parseInt(btn.getAttribute('data-price'));
        const type = btn.getAttribute('data-type');
        const value = btn.getAttribute('data-value');

        if (Store.spendGems(price)) {
          this.applyPurchase(type, value, id);
          // 更新余额显示
          const user = Store.getUser();
          document.getElementById('gem-balance').textContent = user.gems;
          Utils.toast('✅ 购买成功！', 'success');
        } else {
          Utils.toast('💎 宝石不足', 'warn');
        }
      });
    });

    Components.bindBottomNav();
  },

  applyPurchase(type, value, id) {
    const user = Store.getUser();
    switch (type) {
      case 'heart':
        Store.addHeart(1);
        AudioEngine.playHeartRecover();
        break;
      case 'full_heart':
        Store.addHeart(user.maxHearts);
        AudioEngine.playHeartRecover();
        break;
      case 'double_xp':
        user.doubleXpActive = true;
        Store.setUser(user);
        break;
      case 'streak_freeze':
        // 简化处理：直接加 1 天连胜保护
        user.streak += 1;
        Store.setUser(user);
        break;
      case 'avatar':
        // 解锁特殊头像：添加到 AVATARS
        if (value && !window.APP_DATA.AVATARS.includes(value)) {
          window.APP_DATA.AVATARS.push(value);
          Utils.toast(`解锁新头像：${value}`, 'success');
        }
        break;
    }
  }
};
