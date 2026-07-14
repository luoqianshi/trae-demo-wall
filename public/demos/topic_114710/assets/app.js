(function () {
  const samples = {
    "隐世修所": [
      { name: "幽影 Omen", avatar: "omen.png", role: "控场 / 烟位", score: "92%", reason: "能快速封锁近点与交叉火力，适合帮助队友进入包点。" },
      { name: "铁臂 Breach", avatar: "breach.png", role: "先手 / 控制", score: "87%", reason: "适合用震荡和闪光清理狭窄区域，降低新手进点压力。" },
      { name: "奇乐 Killjoy", avatar: "killjoy.png", role: "防守 / 信息", score: "81%", reason: "适合守包和回防后置，能提醒队伍处理绕后风险。" }
    ],
    "源工重镇": [
      { name: "猎枭 Sova", avatar: "sova.png", role: "信息 / 侦查", score: "94%", reason: "能用侦查箭快速确认点内站位，适合进攻前建立信息优势。" },
      { name: "幽影 Omen", avatar: "omen.png", role: "控场 / 烟位", score: "89%", reason: "中路和包点烟位需求高，能帮助队伍切割视野。" },
      { name: "捷风 Jett", avatar: "jett.png", role: "决斗 / 突破", score: "82%", reason: "适合抢首杀和创造进点空间，但需要队友道具配合。" }
    ],
    "霓虹町": [
      { name: "雷兹 Raze", avatar: "raze.png", role: "决斗 / 清点", score: "91%", reason: "适合处理近距离拐角和狭窄通道，清点效率高。" },
      { name: "蝰蛇 Viper", avatar: "viper.png", role: "控场 / 毒幕", score: "86%", reason: "能长期切割视野，适合包点控制和拖延回防。" },
      { name: "斯凯 Skye", avatar: "skye.png", role: "信息 / 闪光", score: "80%", reason: "能边探点边辅助进攻，适合新手理解团队配合节奏。" }
    ]
  };

  const resultList = document.getElementById("resultList");
  const mapSelect = document.getElementById("mapSelect");
  const positionInput = document.getElementById("positionInput");
  const recommendBtn = document.getElementById("recommendBtn");

  function renderResults() {
    const map = mapSelect.value;
    const position = positionInput.value.trim() || "当前输入位置";
    const roles = samples[map] || samples["隐世修所"];
    resultList.innerHTML = `
      <div class="tag">查询：${map} · ${position}</div>
      ${roles.map(role => `
        <div class="role-card">
          <img class="avatar" src="./assets/agents/${role.avatar}" alt="${role.name} 角色头像" loading="lazy">
          <div>
            <h3>${role.name}</h3>
            <p>${role.role} · ${role.reason}</p>
          </div>
          <div class="score">${role.score}</div>
        </div>
      `).join("")}
    `;
  }

  recommendBtn.addEventListener("click", renderResults);
  mapSelect.addEventListener("change", renderResults);

  document.querySelectorAll("[data-scroll]").forEach(button => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const courseTabs = document.querySelectorAll("[data-course-tab]");
  const coursePanels = document.querySelectorAll("[data-course-panel]");

  courseTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.courseTab;

      courseTabs.forEach(item => {
        const isActive = item === tab;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-selected", String(isActive));
      });

      coursePanels.forEach(panel => {
        panel.classList.toggle("active", panel.dataset.coursePanel === target);
      });
    });
  });

  renderResults();
})();
