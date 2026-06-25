    // ===== 3. 路由 =====
    function router() {
      const hash = window.location.hash || '#/garden';
      state.currentRoute = hash;

      const ocMatch = hash.match(/^#\/oc\/(.+)$/);
      const editorMatch = hash.match(/^#\/editor(?:\/(.+))?$/);
      const chatMatch = hash.match(/^#\/chat\/(.+)$/);
      const topicMatch = hash.match(/^#\/topic\/(.+)$/);

      updateNavActive(hash);

      if (hash === '#/garden' || hash === '#/') {
        renderGarden();
      } else if (ocMatch) {
        renderProfile(ocMatch[1]);
      } else if (editorMatch) {
        renderEditor(editorMatch[1] || null);
      } else if (chatMatch) {
        renderChat(chatMatch[1]);
      } else if (hash === '#/nurture') {
        renderNurture();
      } else if (hash === '#/commissions') {
        renderCommissions();
      } else if (hash === '#/community') {
        renderCommunity();
      } else if (hash === '#/plaza') {
        renderPlaza();
      } else if (hash === '#/adopt-market') {
        renderAdoptMarket();
      } else if (topicMatch) {
        renderTopicDetail(topicMatch[1]);
      } else if (hash === '#/events') {
        renderEvents();
      } else if (hash === '#/settings') {
        renderSettings();
      } else {
        renderGarden();
      }

      window.scrollTo(0, 0);
    }

    function updateNavActive(hash) {
      document.querySelectorAll('.nav-link').forEach(link => {
        const route = link.dataset.route;
        let isActive = false;
        if (route === '#/garden' && (hash === '#/garden' || hash === '#/' || hash.startsWith('#/oc') || hash.startsWith('#/editor'))) {
          isActive = true;
        } else if (route === '#/community' && (hash === '#/community' || hash.startsWith('#/topic') || hash === '#/events')) {
          isActive = true;
        } else if (route === '#/plaza' && hash === '#/plaza') {
          isActive = true;
        } else if (route === '#/adopt-market' && hash === '#/adopt-market') {
          isActive = true;
        } else if (route === hash) {
          isActive = true;
        }
        link.classList.toggle('active', isActive);
      });
    }

    function navigate(route) {
      window.location.hash = route;
    }
