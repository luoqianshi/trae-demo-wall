// AED 地图逻辑
(function() {
  function init() {
    JLCommon.renderBottomNav(1);
    renderMap();
    renderList();
  }

  function renderMap() {
    const map = document.getElementById('aed-map');
    let html = '<div class="aed-user-location"></div>';
    
    JLData.aedDevices.forEach(device => {
      html += `<div class="aed-map-pin" data-id="${device.id}" style="top:${device.lat}%;left:${device.lng}%;" onclick="selectAed(${device.id})"><span>${device.pin}</span></div>`;
    });
    
    map.innerHTML = html;
  }

  function renderList() {
    const list = document.getElementById('aed-list');
    list.innerHTML = JLData.aedDevices.map(device => `
      <div class="aed-item" data-id="${device.id}" onclick="selectAed(${device.id})">
        <div class="aed-item-header">
          <div class="aed-item-name">${device.name}</div>
          <div class="aed-item-distance">${device.distance}m</div>
        </div>
        <div class="aed-item-address">${device.address}</div>
        <div class="aed-item-status">
          <span class="tag tag-available">可用</span>
          ${device.is24h ? '<span class="tag tag-24h">24小时</span>' : ''}
          <span class="tag ${device.type === 'public' ? 'tag-public' : 'tag-private'}">${device.type === 'public' ? '公共' : '个人'}</span>
        </div>
      </div>
    `).join('');
  }

  window.selectAed = function(id) {
    document.querySelectorAll('.aed-item').forEach(item => item.classList.remove('selected'));
    document.querySelectorAll('.aed-map-pin').forEach(pin => pin.classList.remove('active'));
    
    const item = document.querySelector('.aed-item[data-id="' + id + '"]');
    const pin = document.querySelector('.aed-map-pin[data-id="' + id + '"]');
    
    if (item) item.classList.add('selected');
    if (pin) pin.classList.add('active');
    if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  init();
})();
