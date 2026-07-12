(function () {
  const STORAGE_KEY = "scenecart_auth_user";
  const roles = {
    merchant: "带货商家",
    studio: "漫剧团队",
    writer: "编剧/策划",
    designer: "角色设计师"
  };

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function saveUser(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  function clearUser() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function getInitial(name) {
    return (name || "用").trim().slice(0, 1).toUpperCase();
  }

  function showToast(text) {
    let toast = document.querySelector(".auth-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "auth-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }

  function renderTopActions() {
    const user = getUser();
    document.querySelectorAll(".top-actions").forEach((actions) => {
      actions.querySelectorAll(".auth-entry, .auth-user").forEach((node) => node.remove());

      if (user) {
        const wrap = document.createElement("div");
        wrap.className = "auth-user";
        wrap.innerHTML = `
          <button class="auth-user-main" type="button" data-auth-open>
            <span class="auth-avatar">${getInitial(user.name)}</span>
            <span>${user.name}</span>
            <span class="auth-role">${roles[user.role] || user.role}</span>
          </button>
          <button class="auth-logout" type="button">退出</button>
        `;
        wrap.querySelector(".auth-logout").addEventListener("click", () => {
          clearUser();
          renderTopActions();
          showToast("已退出登录");
        });
        actions.appendChild(wrap);
      } else {
        const button = document.createElement("button");
        button.className = "btn ghost auth-entry";
        button.type = "button";
        button.textContent = "登录 / 注册";
        button.setAttribute("data-auth-open", "true");
        actions.appendChild(button);
      }
    });
  }

  function injectModal() {
    if (document.querySelector(".auth-overlay")) return;
    const modal = document.createElement("div");
    modal.className = "auth-overlay";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="auth-dialog" role="dialog" aria-modal="true" aria-label="登录注册">
        <aside class="auth-panel">
          <span class="tag hot">SceneCart 账户</span>
          <h2>一个账户，连接商家、团队、剧本和角色资产。</h2>
          <p>登录后可以发布带货项目、投递制作方案、收藏剧本、授权角色模型和模拟进入工作台。</p>
          <div class="auth-points">
            <div class="auth-point">商家：发布商品需求、设置制作费和分佣规则。</div>
            <div class="auth-point">团队：投递项目、管理作品集和收益结算。</div>
            <div class="auth-point">编剧：上架剧本、授权买断、接受品牌植入。</div>
            <div class="auth-point">设计师：上传角色模型，按集数、项目或买断授权收费。</div>
          </div>
        </aside>
        <section class="auth-form-wrap">
          <button class="auth-close" type="button" aria-label="关闭">×</button>
          <div class="auth-tabs">
            <button class="auth-tab is-active" type="button" data-auth-tab="login">登录</button>
            <button class="auth-tab" type="button" data-auth-tab="register">注册</button>
          </div>

          <form class="auth-form is-active" data-auth-form="login">
            <div class="auth-field">
              <label for="login-account">手机号 / 邮箱</label>
              <input id="login-account" name="account" autocomplete="username" placeholder="例如：brand@demo.com" />
            </div>
            <div class="auth-field">
              <label for="login-password">密码</label>
              <input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="输入任意 6 位以上密码" />
            </div>
            <div class="auth-message" data-auth-message></div>
            <button class="auth-submit" type="submit">登录 Demo 账户</button>
            <p class="auth-note">这是前端 Demo 登录，不连接真实后端。登录状态会保存在当前浏览器本地。</p>
          </form>

          <form class="auth-form" data-auth-form="register">
            <div class="auth-field">
              <label for="register-name">名称</label>
              <input id="register-name" name="name" autocomplete="name" placeholder="例如：某某品牌 / 墨河工作室" />
            </div>
            <div class="auth-field">
              <label for="register-account">手机号 / 邮箱</label>
              <input id="register-account" name="account" autocomplete="username" placeholder="用于登录 Demo" />
            </div>
            <div class="auth-field">
              <label for="register-password">密码</label>
              <input id="register-password" name="password" type="password" autocomplete="new-password" placeholder="至少 6 位" />
            </div>
            <div class="auth-field">
              <label>选择身份</label>
              <div class="role-options" data-role-options>
                <button class="role-option is-selected" type="button" data-role="merchant"><b>带货商家</b><span>发布商品和预算</span></button>
                <button class="role-option" type="button" data-role="studio"><b>漫剧团队</b><span>接项目和交付作品</span></button>
                <button class="role-option" type="button" data-role="writer"><b>编剧/策划</b><span>出售剧本和植入位</span></button>
                <button class="role-option" type="button" data-role="designer"><b>角色设计师</b><span>上传模型并授权收费</span></button>
              </div>
            </div>
            <div class="auth-message" data-auth-message></div>
            <button class="auth-submit" type="submit">创建 Demo 账户</button>
            <p class="auth-note">注册完成后，顶部会显示你的名称和身份。你可以随时退出并重新注册其他角色。</p>
          </form>
        </section>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function openModal(mode = "login") {
    injectModal();
    switchTab(mode);
    const overlay = document.querySelector(".auth-overlay");
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    const firstInput = overlay.querySelector(".auth-form.is-active input");
    if (firstInput) firstInput.focus();
  }

  function closeModal() {
    const overlay = document.querySelector(".auth-overlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function switchTab(mode) {
    document.querySelectorAll(".auth-tab").forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.authTab === mode);
    });
    document.querySelectorAll(".auth-form").forEach((form) => {
      form.classList.toggle("is-active", form.dataset.authForm === mode);
      const message = form.querySelector("[data-auth-message]");
      if (message) message.textContent = "";
    });
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const openButton = event.target.closest("[data-auth-open]");
      if (openButton) openModal("login");

      if (event.target.closest(".auth-close")) closeModal();

      const overlay = event.target.classList && event.target.classList.contains("auth-overlay");
      if (overlay) closeModal();

      const tab = event.target.closest("[data-auth-tab]");
      if (tab) switchTab(tab.dataset.authTab);

      const roleButton = event.target.closest(".role-option");
      if (roleButton) {
        document.querySelectorAll(".role-option").forEach((item) => item.classList.remove("is-selected"));
        roleButton.classList.add("is-selected");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });

    document.addEventListener("submit", (event) => {
      const form = event.target.closest(".auth-form");
      if (!form) return;
      event.preventDefault();
      const message = form.querySelector("[data-auth-message]");
      const data = new FormData(form);
      const account = String(data.get("account") || "").trim();
      const password = String(data.get("password") || "").trim();

      if (!account || password.length < 6) {
        message.textContent = "请填写账号，并输入至少 6 位密码。";
        return;
      }

      if (form.dataset.authForm === "register") {
        const name = String(data.get("name") || "").trim();
        const selectedRole = document.querySelector(".role-option.is-selected");
        if (!name) {
          message.textContent = "请填写名称。";
          return;
        }
        const user = {
          name,
          account,
          role: selectedRole ? selectedRole.dataset.role : "merchant",
          createdAt: new Date().toISOString()
        };
        saveUser(user);
        closeModal();
        renderTopActions();
        showToast(`注册成功，欢迎 ${name}`);
        return;
      }

      const existing = getUser();
      const user = existing && existing.account === account
        ? existing
        : {
            name: account.includes("@") ? account.split("@")[0] : "Demo 用户",
            account,
            role: "merchant",
            createdAt: new Date().toISOString()
          };
      saveUser(user);
      closeModal();
      renderTopActions();
      showToast(`欢迎回来，${user.name}`);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectModal();
    renderTopActions();
    bindEvents();
  });
})();
