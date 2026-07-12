(function () {
  const STORAGE_KEY = "scenecart_city_channel";
  const cities = [
    { id: "national", name: "全国", note: "平台统一撮合", partner: "平台运营" },
    { id: "beijing", name: "北京", note: "品牌商家密集", partner: "城市合伙人" },
    { id: "shanghai", name: "上海", note: "消费品牌与内容团队", partner: "城市合伙人" },
    { id: "hangzhou", name: "杭州", note: "电商商家与直播供应链", partner: "城市合伙人" },
    { id: "guangzhou", name: "广州", note: "美妆服饰与供应链", partner: "城市合伙人" },
    { id: "shenzhen", name: "深圳", note: "数码硬件与出海品牌", partner: "城市合伙人" },
    { id: "chengdu", name: "成都", note: "短剧团队与文旅消费", partner: "城市合伙人" },
    { id: "wuhan", name: "武汉", note: "高校创作团队与本地商家", partner: "城市合伙人" }
  ];

  function getCity() {
    const id = localStorage.getItem(STORAGE_KEY) || "national";
    return cities.find((city) => city.id === id) || cities[0];
  }

  function saveCity(id) {
    localStorage.setItem(STORAGE_KEY, id);
  }

  function updateCityText() {
    const city = getCity();
    document.querySelectorAll("[data-city-name]").forEach((node) => {
      node.textContent = city.name;
    });
    document.querySelectorAll("[data-city-note]").forEach((node) => {
      node.textContent = city.note;
    });
    document.querySelectorAll("[data-city-partner]").forEach((node) => {
      node.textContent = city.partner;
    });
    document.querySelectorAll(".city-trigger-name").forEach((node) => {
      node.textContent = city.name;
    });
    document.querySelectorAll(".city-option").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.cityId === city.id);
    });
  }

  function injectCitySwitch() {
    document.querySelectorAll(".topbar").forEach((topbar) => {
      if (topbar.querySelector(".city-switch")) return;
      const brand = topbar.querySelector(".brand");
      if (!brand) return;

      const switcher = document.createElement("div");
      switcher.className = "city-switch";
      switcher.innerHTML = `
        <button class="city-trigger" type="button" aria-label="切换城市频道">
          <span class="city-dot"></span>
          <span class="city-trigger-name">${getCity().name}</span>
          <span>频道</span>
        </button>
        <div class="city-menu">
          ${cities.map((city) => `
            <button class="city-option" type="button" data-city-id="${city.id}">
              <span><b>${city.name}</b><span>${city.note}</span></span>
              <em class="city-partner-badge">${city.partner}</em>
            </button>
          `).join("")}
        </div>
      `;
      brand.insertAdjacentElement("afterend", switcher);
    });
    updateCityText();
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest(".city-trigger");
      if (trigger) {
        const switcher = trigger.closest(".city-switch");
        document.querySelectorAll(".city-switch").forEach((node) => {
          if (node !== switcher) node.classList.remove("is-open");
        });
        switcher.classList.toggle("is-open");
        return;
      }

      const option = event.target.closest(".city-option");
      if (option) {
        saveCity(option.dataset.cityId);
        updateCityText();
        document.querySelectorAll(".city-switch").forEach((node) => node.classList.remove("is-open"));
        window.dispatchEvent(new CustomEvent("scenecart:city-change", { detail: getCity() }));
        return;
      }

      if (!event.target.closest(".city-switch")) {
        document.querySelectorAll(".city-switch").forEach((node) => node.classList.remove("is-open"));
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectCitySwitch();
    bindEvents();
  });
})();
