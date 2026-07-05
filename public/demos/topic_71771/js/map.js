/**
 * 今天吃什么 - 商家地图模块
 * 基于 Leaflet + OpenStreetMap + Nominatim 搜索
 * 无需 API Key，开箱即用
 */

(function() {
  'use strict';

  var map = null;
  var markers = [];
  var userMarker = null;
  var currentKeywords = [];
  var defaultCenter = [39.9042, 116.4074]; // 北京天安门（fallback）
  var userLocation = null;

  /**
   * 初始化地图
   * @param {string} containerId - 地图容器元素ID
   */
  function initMap(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    if (map) {
      map.remove();
      map = null;
    }

    var center = userLocation || defaultCenter;

    map = L.map(containerId, {
      zoomControl: false,
      attributionControl: false
    }).setView(center, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 用户位置标记
    if (userLocation) {
      addUserMarker(userLocation);
    }
  }

  /**
   * 添加用户位置标记
   */
  function addUserMarker(latlng) {
    if (userMarker) map.removeLayer(userMarker);

    var icon = L.divIcon({
      className: 'user-location-marker',
      html: '<div class="user-location-dot"></div><div class="user-location-pulse"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    userMarker = L.marker(latlng, { icon: icon, zIndexOffset: 1000 }).addTo(map);
  }

  /**
   * 获取用户当前位置
   * @returns {Promise<[lat, lng]>}
   */
  function getUserLocation() {
    return new Promise(function(resolve) {
      if (userLocation) {
        resolve(userLocation);
        return;
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function(pos) {
            userLocation = [pos.coords.latitude, pos.coords.longitude];
            resolve(userLocation);
          },
          function() {
            resolve(defaultCenter);
          },
          { timeout: 8000, enableHighAccuracy: false }
        );
      } else {
        resolve(defaultCenter);
      }
    });
  }

  // 菜系 -> 英文搜索关键词映射（Nominatim 对英文支持更好）
  var cuisineKeywords = {
    '中餐': 'Chinese restaurant',
    '西餐': 'restaurant',
    '日料': 'Japanese restaurant',
    '韩料': 'Korean restaurant',
    '东南亚': 'restaurant',
    '快餐': 'fast food',
    '小吃': 'food',
    '甜品': 'cafe'
  };

  /**
   * 搜索附近商家（使用 Nominatim）
   * @param {string[]} keywords - 搜索关键词列表
   * @param {string} cuisine - 菜系类型
   * @returns {Promise<Array>}
   */
  function searchNearby(keywords, cuisine) {
    currentKeywords = keywords || [];

    return getUserLocation().then(function(center) {
      if (!map) return [];

      map.setView(center, 14);
      if (userMarker) {
        userMarker.setLatLng(center);
      } else {
        addUserMarker(center);
      }

      // 优先使用英文关键词（Nominatim 对英文 POI 支持更好）
      var query = cuisineKeywords[cuisine] || 'restaurant';
      if (keywords && keywords.length > 0) {
        var enKeywords = cuisineKeywords[cuisine];
        if (enKeywords) query = enKeywords;
      }

      // Nominatim 搜索（添加 viewbox 优先返回附近结果）
      var lat = center[0];
      var lon = center[1];
      var viewbox = (lon - 0.05) + ',' + (lat + 0.05) + ',' + (lon + 0.05) + ',' + (lat - 0.05);
      var url = 'https://nominatim.openstreetmap.org/search?q=' +
        encodeURIComponent(query) +
        '&format=json&limit=15&viewbox=' + viewbox +
        '&bounded=0&accept-language=zh-CN';

      return fetch(url, {
        headers: { 'User-Agent': 'WhatToEatApp/1.0' }
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var results = (data || []).map(function(item) {
          return {
            name: item.display_name.split(',')[0],
            fullName: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            type: item.type,
            distance: calcDistance(lat, lon, parseFloat(item.lat), parseFloat(item.lon))
          };
        });

        // 按距离排序
        results.sort(function(a, b) { return a.distance - b.distance; });
        return results;
      })
      .catch(function() { return []; });
    });
  }

  /**
   * 计算两点间距离（km）
   */
  function calcDistance(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 在地图上渲染商家标记
   */
  function renderMarkers(shops) {
    clearMarkers();

    shops.forEach(function(shop, index) {
      var num = index + 1;
      var icon = L.divIcon({
        className: 'shop-marker',
        html: '<div class="shop-marker-num">' + num + '</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      var popupContent =
        '<div class="shop-popup">' +
          '<div class="shop-popup-name">' + escapeHtml(shop.name) + '</div>' +
          '<div class="shop-popup-addr">' + escapeHtml(shop.fullName) + '</div>' +
          '<div class="shop-popup-dist">' + formatDistance(shop.distance) + '</div>' +
        '</div>';

      var marker = L.marker([shop.lat, shop.lon], { icon: icon })
        .addTo(map)
        .bindPopup(popupContent);

      markers.push(marker);
    });

    // 自动调整视野包含所有标记
    if (markers.length > 0 && userMarker) {
      var group = new L.featureGroup(markers.concat([userMarker]));
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }

  /**
   * 清除所有商家标记
   */
  function clearMarkers() {
    markers.forEach(function(m) { map.removeLayer(m); });
    markers = [];
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDistance(km) {
    if (km < 1) return Math.round(km * 1000) + 'm';
    return km.toFixed(1) + 'km';
  }

  /**
   * 渲染商家列表到侧边栏
   */
  function renderShopList(shops, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    if (shops.length === 0) {
      container.innerHTML = '<div class="map-shop-empty">附近未找到相关商家 😅</div>';
      return;
    }

    container.innerHTML = shops.map(function(shop, index) {
      return (
        '<div class="map-shop-item" data-index="' + index + '">' +
          '<div class="map-shop-num">' + (index + 1) + '</div>' +
          '<div class="map-shop-info">' +
            '<div class="map-shop-name">' + escapeHtml(shop.name) + '</div>' +
            '<div class="map-shop-addr">' + escapeHtml(shop.fullName) + '</div>' +
            '<div class="map-shop-dist">' + formatDistance(shop.distance) + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    // 点击列表项定位到地图标记
    container.querySelectorAll('.map-shop-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var idx = parseInt(this.dataset.index);
        if (markers[idx]) {
          markers[idx].openPopup();
          map.panTo(markers[idx].getLatLng());
        }
      });
    });
  }

  // ========== 对外接口 ==========
  window.FoodMap = {
    init: initMap,
    getUserLocation: getUserLocation,
    searchNearby: searchNearby,
    renderMarkers: renderMarkers,
    renderShopList: renderShopList,
    clearMarkers: clearMarkers,
    formatDistance: formatDistance
  };

})();
