/**
 * 首页 - 课程地图
 * 顶部用户信息栏 + 垂直路径式关卡地图
 */

window.Pages.Home = {
  render() {
    const user = Store.getUser();
    const settings = Store.getSettings();
    const progress = Store.getProgress();
    const courses = window.APP_DATA.COURSES;

    // 构建关卡地图 HTML
    let mapHtml = '';
    courses.forEach((unit, unitIdx) => {
      const unitCompleted = unit.lessons.every(l => progress.completedLessons.includes(l.id));
      mapHtml += `
        <div class="unit-banner" style="background:${unit.color}">
          <div class="unit-banner__title">${unit.title}</div>
          ${unitCompleted ? '<div class="unit-banner__trophy">🏆</div>' : ''}
        </div>
      `;
      mapHtml += '<div class="lesson-path">';
      unit.lessons.forEach((lesson, i) => {
        const completed = progress.completedLessons.includes(lesson.id);
        const unlocked = Store.isLessonUnlocked(lesson.id);
        const isCurrent = !completed && unlocked;
        const stars = progress.lessonStars[lesson.id] || 0;

        let nodeClass = 'lesson-node';
        let icon = '';
        if (completed) {
          nodeClass += ' lesson-node--done';
          icon = lesson.type === 'boss' ? '👑' : (lesson.type === 'review' ? '🔄' : '⭐');
        } else if (isCurrent) {
          nodeClass += ' lesson-node--current';
          icon = lesson.type === 'boss' ? '👑' : (lesson.type === 'review' ? '🔄' : '📖');
        } else {
          nodeClass += ' lesson-node--locked';
          icon = '🔒';
        }

        // 交错布局（左右摆动路径），首个节点居中便于点击
        const offset = i % 4 === 1 ? -36 : (i % 4 === 3 ? 36 : 0);
        mapHtml += `
          <div class="${nodeClass}" style="margin-left:${offset}px" data-lesson="${lesson.id}" data-unlocked="${unlocked}">
            <div class="lesson-node__circle">
              ${icon}
              ${completed && stars ? `<div class="lesson-node__stars">${'⭐'.repeat(stars)}</div>` : ''}
            </div>
            <div class="lesson-node__label">${lesson.title}</div>
            ${isCurrent ? '<div class="lesson-node__bubble">开始</div>' : ''}
          </div>
        `;
        // 连接线
        if (i < unit.lessons.length - 1) {
          mapHtml += '<div class="lesson-path__line"></div>';
        }
      });
      mapHtml += '</div>';
    });

    document.getElementById('app').innerHTML = `
      <div class="page page--home">
        ${Components.userBar()}
        <div class="home-goal">
          ${Components.dailyGoal()}
          <div class="home-goal__text">
            <div class="home-goal__title">每日目标</div>
            <div class="home-goal__desc">${user.todayXp >= user.dailyGoal ? '已完成今日目标！🎉' : '坚持就是胜利！'}</div>
          </div>
        </div>
        <div class="lesson-map">
          ${mapHtml}
        </div>
        <div class="home-bottom-spacer"></div>
        ${Components.bottomNav('#/home')}
      </div>
    `;

    // 绑定事件
    this.bindEvents();
  },

  bindEvents() {
    // 用户栏点击进入个人中心
    const userBarLeft = document.querySelector('.user-bar__left');
    if (userBarLeft) {
      userBarLeft.addEventListener('click', () => {
        AudioEngine.playClick();
        window.location.hash = '/profile';
      });
    }

    // 关卡点击
    document.querySelectorAll('.lesson-node').forEach(node => {
      node.addEventListener('click', () => {
        const lessonId = node.getAttribute('data-lesson');
        const unlocked = node.getAttribute('data-unlocked') === 'true';
        AudioEngine.playClick();
        if (unlocked) {
          window.location.hash = `/lesson/${lessonId}`;
        } else {
          Utils.toast('🔒 请先完成前面的关卡', 'warn');
        }
      });
    });

    Components.bindBottomNav();
  }
};
