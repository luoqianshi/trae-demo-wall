(function() {
  const recipes = (window.RECIPES || []).map((recipe) => ({
    ...recipe,
    cover: normalizeCover(recipe.cover)
  }))

  const days = [
    ['monday', '周一'],
    ['tuesday', '周二'],
    ['wednesday', '周三'],
    ['thursday', '周四'],
    ['friday', '周五'],
    ['saturday', '周六'],
    ['sunday', '周日']
  ]
  const meals = [
    ['breakfast', '早餐'],
    ['lunch', '午餐'],
    ['dinner', '晚餐']
  ]
  const roleLabels = {
    drink: '喝的',
    breakfastFood: '吃的',
    bigMeat: '大荤',
    smallMeat: '小荤',
    vegetable: '素菜',
    soup: '汤'
  }
  const mealLabels = Object.fromEntries(meals)
  const state = {
    todayPlans: {},
    picker: null
  }

  function normalizeCover(cover) {
    if (!cover) return '../assets/covers/lunch.png'
    if (/^(https?:|cloud:|data:)/.test(cover)) return cover
    return `..${cover}`
  }

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(`eat_demo_${key}`)
      return value ? JSON.parse(value) : fallback
    } catch (error) {
      return fallback
    }
  }

  function write(key, value) {
    localStorage.setItem(`eat_demo_${key}`, JSON.stringify(value))
  }

  function toast(message) {
    const node = document.querySelector('#toast')
    node.textContent = message
    node.classList.add('show')
    clearTimeout(toast.timer)
    toast.timer = setTimeout(() => node.classList.remove('show'), 1800)
  }

  function getSettings() {
    return {
      familySize: 3,
      weeklyBudget: 500,
      avoidFoods: '',
      region: '',
      ...read('settings', {})
    }
  }

  function emptyMenu() {
    return Object.fromEntries(days.map(([day]) => [day, { breakfast: [], lunch: [], dinner: [] }]))
  }

  function getMenu() {
    return read('weeklyMenu', null) || createWeeklyMenu()
  }

  function saveMenu(menu) {
    write('weeklyMenu', menu)
    localStorage.removeItem('eat_demo_excluded')
  }

  function getFavorites() {
    return read('favorites', [])
  }

  function saveFavorites(ids) {
    write('favorites', ids)
  }

  function recipeById(id) {
    return recipes.find((recipe) => recipe.id === id)
  }

  function recipesByIds(ids) {
    return (ids || []).map(recipeById).filter(Boolean)
  }

  function getRole(recipe) {
    if (!recipe) return ''
    if (recipe.planRole) return recipe.planRole
    if (recipe.mealType === 'breakfast') return recipe.dishType === 'drink' ? 'drink' : 'breakfastFood'
    if (recipe.dishType === 'soup') return 'soup'
    return 'smallMeat'
  }

  function budgetAdvice() {
    const settings = getSettings()
    const familySize = Number(settings.familySize) || 1
    const weeklyBudget = Number(settings.weeklyBudget) || 0
    const minimum = familySize * 7 * 20
    const premium = familySize * 7 * 50
    if (weeklyBudget < minimum) {
      return { level: 'economy', label: '经济', text: '当前预算偏低，建议优先选择鸡蛋、豆制品、鸡肉、猪肉和应季蔬菜。' }
    }
    if (weeklyBudget >= premium) {
      return { level: 'premium', label: '品质', text: '预算较充足，可以加入牛肉、鱼虾、排骨等更丰富菜品。' }
    }
    return { level: 'standard', label: '标准', text: '预算合理，按标准家常菜单生成。' }
  }

  function poolByRole(mealType, role) {
    const advice = budgetAdvice()
    let pool = recipes.filter((recipe) => {
      if (getRole(recipe) !== role) return false
      if (role === 'drink' || role === 'breakfastFood') return recipe.mealType === 'breakfast'
      return recipe.mealType === mealType || role === 'vegetable' || role === 'soup'
    })
    if (advice.level === 'economy') {
      const budgeted = pool.filter((recipe) => Number(recipe.price || 0) <= (role === 'bigMeat' ? 30 : 18))
      pool = budgeted.length ? budgeted : pool
    }
    return pool
  }

  function pick(pool, excludeIds, usedCounts) {
    const sorted = pool.slice().sort((a, b) => (usedCounts[a.id] || 0) - (usedCounts[b.id] || 0))
    const candidates = sorted.filter((recipe) => !excludeIds.includes(recipe.id) && (usedCounts[recipe.id] || 0) < 2)
    const fallback = sorted.filter((recipe) => !excludeIds.includes(recipe.id))
    const list = candidates.length ? candidates : (fallback.length ? fallback : sorted)
    return list[Math.floor(Math.random() * list.length)]
  }

  function buildMealPlan(mealType, excludeIds = [], usedCounts = {}) {
    const roles = mealType === 'breakfast'
      ? ['drink', 'breakfastFood']
      : ['bigMeat', 'smallMeat', 'vegetable', 'soup']
    const picked = []
    roles.forEach((role) => {
      const recipe = pick(poolByRole(mealType, role), excludeIds.concat(picked.map((item) => item.id)), usedCounts)
      if (recipe) {
        picked.push(recipe)
        usedCounts[recipe.id] = (usedCounts[recipe.id] || 0) + 1
      }
    })
    return picked
  }

  function createWeeklyMenu() {
    const menu = emptyMenu()
    const usedCounts = {}
    days.forEach(([day]) => {
      meals.forEach(([meal]) => {
        menu[day][meal] = buildMealPlan(meal, [], usedCounts).map((recipe) => recipe.id)
      })
    })
    write('weeklyMenu', menu)
    return menu
  }

  function currentMeal() {
    const hour = new Date().getHours()
    if (hour < 9) return 'breakfast'
    if (hour < 14) return 'lunch'
    return 'dinner'
  }

  function renderHome() {
    if (!Object.keys(state.todayPlans).length) {
      meals.forEach(([meal]) => {
        state.todayPlans[meal] = buildMealPlan(meal)
      })
    }
    const active = currentMeal()
    document.querySelector('#currentMealHint').textContent = `当前重点：${mealLabels[active]}`
    document.querySelector('#todayMeals').innerHTML = meals.map(([meal, label]) => mealCard(meal, label, state.todayPlans[meal], active)).join('')
  }

  function mealCard(meal, label, plan, active) {
    const first = plan[0] || {}
    return `
      <article class="meal-card ${meal === active ? 'current' : ''}">
        <div class="meal-cover" style="background-image:url('${first.cover || '../assets/covers/lunch.png'}')"></div>
        <div class="meal-content">
          <div class="meal-label">${label}${meal === active ? '<span class="chip">当前</span>' : ''}</div>
          <div class="meal-title">${meal === 'breakfast' ? '暖心早餐' : `${label}三菜一汤`}</div>
          <div class="dish-list">
            ${plan.map((recipe) => dishRow(recipe)).join('')}
          </div>
          <div class="card-actions">
            <button class="ghost" data-action="shuffle-meal" data-meal="${meal}">换一组</button>
            ${meal !== 'breakfast' ? `<button class="symbol" data-action="add-dish" data-meal="${meal}">+</button><button class="ghost" data-action="change-soup" data-meal="${meal}">换汤</button>` : ''}
            <button class="primary" data-action="add-plan-to-week" data-meal="${meal}">加入本周</button>
          </div>
        </div>
      </article>
    `
  }

  function dishRow(recipe) {
    return `
      <div class="dish-row">
        <span class="dish-role">${roleLabels[getRole(recipe)] || '菜品'}</span>
        <button class="recipe-name-btn" data-action="detail" data-id="${recipe.id}">${recipe.name}</button>
        <span class="dish-meta">${recipe.time || 10}分钟</span>
      </div>
    `
  }

  function renderWeek() {
    const menu = getMenu()
    document.querySelector('#weekMenu').innerHTML = days.map(([day, dayLabel]) => `
      <article class="day-card">
        <div class="day-title"><span>${dayLabel}</span><span class="shopping-meta">${countDay(menu[day])}道</span></div>
        <div class="day-meals">
          ${meals.map(([meal, label]) => renderMealPanel(day, meal, label, recipesByIds(menu[day][meal]))).join('')}
        </div>
      </article>
    `).join('')
  }

  function renderMealPanel(day, meal, label, list) {
    return `
      <div class="meal-panel">
        <div class="meal-panel-head">
          <div class="meal-panel-title">${label}</div>
          <div class="row-actions">
            <button class="symbol" data-action="open-picker" data-day="${day}" data-meal="${meal}">+</button>
            <button class="ghost" data-action="reselect-slot" data-day="${day}" data-meal="${meal}">换一道</button>
          </div>
        </div>
        ${list.length ? list.map((recipe, index) => `
          <div class="slot-recipe">
            <button class="recipe-name-btn" data-action="detail" data-id="${recipe.id}">${recipe.name}</button>
            <div class="row-actions">
              <button class="symbol" data-action="remove-recipe" data-day="${day}" data-meal="${meal}" data-index="${index}">-</button>
              <button class="ghost" data-action="reselect-recipe" data-day="${day}" data-meal="${meal}" data-index="${index}">换一道</button>
            </div>
          </div>`).join('') : `<button class="ghost" data-action="open-picker" data-day="${day}" data-meal="${meal}">添加${label}</button>`}
      </div>
    `
  }

  function countDay(dayMenu) {
    return meals.reduce((sum, [meal]) => sum + (dayMenu[meal] || []).length, 0)
  }

  function renderShopping() {
    const list = generateShoppingGroups()
    const node = document.querySelector('#shoppingList')
    if (!list.length) {
      node.innerHTML = '<div class="empty">购物清单还未生成，先去一周菜单添加菜品吧。</div>'
      return
    }
    node.innerHTML = list.map((item) => `
      <article class="shopping-card ${item.selectedAmount === 0 ? 'muted' : ''}">
        <div class="shopping-head">
          <div>
            <div class="shopping-name">${item.name}</div>
            <div class="shopping-meta">${item.category} · 涉及${item.usageCount}顿 · 总需${round(item.totalAmount)}克</div>
          </div>
          <div class="amount">待买 ${round(item.selectedAmount)}克</div>
        </div>
        <div class="usage-list">
          ${item.usages.map((usage) => `
            <label class="usage ${usage.selected ? '' : 'unselected'}">
              <input type="checkbox" ${usage.selected ? 'checked' : ''} data-action="toggle-usage" data-id="${usage.id}">
              <strong>${usage.dayLabel}</strong>
              <span class="usage-detail">${usage.recipeText}</span>
              <span>${round(usage.amount)}克</span>
            </label>
          `).join('')}
        </div>
      </article>
    `).join('')
  }

  function shouldExcludeIngredient(name) {
    const text = String(name || '').trim()
    return /^(清水|温水|水)$/.test(text) ||
      /^(大米|小米|黑米|紫米|糯米|糙米|香米|杂粮米|米饭)$/.test(text) ||
      /^(鸡蛋|鸭蛋|鹅蛋|蛋液|蛋清|蛋黄)$/.test(text) ||
      /盐|糖|冰糖|食用油|香油|猪油|橄榄油|生抽|老抽|豉油|酱|醋|蚝油|料酒|淀粉|鸡精|味精|胡椒|花椒|青花椒|红花椒|八角|桂皮|香叶|孜然|咖喱|虾皮|葱|姜|^蒜$|蒜末|蒜蓉|干辣椒|小米椒/.test(text)
  }

  function generateShoppingGroups() {
    const menu = getMenu()
    const excluded = read('excluded', {})
    const map = {}
    days.forEach(([day, dayLabel]) => {
      meals.forEach(([meal]) => {
        recipesByIds(menu[day][meal]).forEach((recipe) => {
          ;(recipe.ingredients || []).filter((item) => !shouldExcludeIngredient(item.name)).forEach((item) => {
            const amount = toGrams(item)
            const key = item.name
            if (!map[key]) {
              map[key] = { name: item.name, category: categoryOf(item.name), totalAmount: 0, selectedAmount: 0, usageCount: 0, usages: [] }
            }
            const id = `${day}::${recipe.id}::${item.name}`
            const selected = !excluded[id]
            map[key].totalAmount += amount
            map[key].selectedAmount += selected ? amount : 0
            map[key].usageCount += 1
            map[key].usages.push({ id, dayLabel, recipeText: recipe.name, amount, selected })
          })
        })
      })
    })
    return Object.values(map).sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name, 'zh-Hans-CN'))
  }

  function toGrams(item) {
    const amount = Number(item.amount) || 0
    if (item.unit === '克' || item.unit === '毫升') return amount
    const weights = { 鸡翅中: 70, 鸡腿: 250, 鲈鱼: 600, 土豆: 200, 娃娃菜: 250, 香菇: 20, 油条: 100 }
    return amount * (weights[item.name] || 100)
  }

  function categoryOf(name) {
    if (/虾|鱼|鲈/.test(name)) return '水产类'
    if (/肉|牛|鸡|排骨|猪|肥牛/.test(name)) return '肉禽类'
    if (/豆腐|豆浆|黄豆/.test(name)) return '豆制品类'
    if (/牛奶|酸奶|饮/.test(name)) return '饮品类'
    if (/面|粉|馄饨|饼|油条|包|馒头|燕麦|面包/.test(name)) return '主食类'
    return '蔬菜类'
  }

  function renderFavorites() {
    const ids = getFavorites()
    const list = recipesByIds(ids)
    const node = document.querySelector('#favoriteList')
    node.innerHTML = list.length ? list.map(recipeCard).join('') : '<div class="empty">还没有收藏菜谱，去详情页点一下收藏吧。</div>'
  }

  function recipeCard(recipe) {
    return `
      <article class="recipe-card">
        <div class="recipe-thumb" style="background-image:url('${recipe.cover}')"></div>
        <div>
          <div class="shopping-name">${recipe.name}</div>
          <div class="recipe-meta">${mealLabels[recipe.mealType]} · ${roleLabels[getRole(recipe)] || '菜品'} · ${recipe.time}分钟 · 难度${recipe.difficulty}星</div>
        </div>
        <button class="secondary" data-action="detail" data-id="${recipe.id}">详情</button>
      </article>
    `
  }

  function renderProfile() {
    const settings = getSettings()
    const advice = budgetAdvice()
    document.querySelector('#familySizeInput').value = settings.familySize
    document.querySelector('#budgetInput').value = settings.weeklyBudget
    document.querySelector('#avoidInput').value = settings.avoidFoods || ''
    document.querySelector('#regionInput').value = settings.region || ''
    document.querySelector('#favoriteCount').textContent = getFavorites().length
    const menu = getMenu()
    document.querySelector('#menuCount').textContent = days.reduce((sum, [day]) => sum + countDay(menu[day]), 0)
    document.querySelector('#budgetLevel').textContent = advice.label
    document.querySelector('#budgetAdvice').textContent = advice.text
  }

  function showDetail(id) {
    const recipe = recipeById(id)
    if (!recipe) return
    const favorites = getFavorites()
    const isFavorite = favorites.includes(id)
    document.querySelector('#recipeDetail').innerHTML = `
      <div class="detail-cover" style="background-image:url('${recipe.cover}')"></div>
      <h2 class="detail-title">${recipe.name}</h2>
      <div class="detail-tags">
        <span class="tag">${mealLabels[recipe.mealType]}</span>
        <span class="tag">${roleLabels[getRole(recipe)] || '菜品'}</span>
        <span class="tag">${recipe.time}分钟</span>
        <span class="tag">难度${recipe.difficulty}星</span>
        <span class="tag">${recipe.people}人份</span>
      </div>
      <div class="card-actions">
        <button class="${isFavorite ? 'ghost danger' : 'primary'}" data-action="favorite" data-id="${id}">${isFavorite ? '取消收藏' : '收藏'}</button>
        <button class="secondary" data-action="open-picker-for-detail" data-id="${id}">加入本周菜单</button>
      </div>
      <div class="detail-cols">
        <div>
          <h3>食材清单</h3>
          <ul>${(recipe.ingredients || []).map((item) => `<li>${item.name} ${item.amount}${item.unit}</li>`).join('')}</ul>
        </div>
        <div>
          <h3>制作步骤</h3>
          <ol>${(recipe.steps || []).map((step) => `<li>${step}</li>`).join('')}</ol>
        </div>
      </div>
    `
    document.querySelector('#recipeDialog').showModal()
  }

  function openPicker(config) {
    state.picker = config
    const meal = config.meal || 'lunch'
    const role = config.role
    let list = recipes.filter((recipe) => recipe.mealType === meal)
    if (role) list = poolByRole(meal, role)
    document.querySelector('#pickerTitle').textContent = `选择${mealLabels[meal]}菜品`
    document.querySelector('#pickerDesc').textContent = config.day ? `添加到 ${dayLabel(config.day)} · ${mealLabels[meal]}` : '选择后加入本周菜单'
    document.querySelector('#recipeSearch').value = ''
    renderPickerList(list)
    document.querySelector('#pickerDialog').showModal()
  }

  function renderPickerList(list) {
    document.querySelector('#pickerList').innerHTML = list.map((recipe) => `
      <button class="picker-item" data-action="choose-recipe" data-id="${recipe.id}">
        <span class="picker-thumb" style="background-image:url('${recipe.cover}')"></span>
        <span>
          <strong>${recipe.name}</strong><br>
          <span class="recipe-meta">${roleLabels[getRole(recipe)] || '菜品'} · ${recipe.time}分钟 · ${(recipe.ingredients || []).slice(0, 3).map((item) => item.name).join('、')}</span>
        </span>
        <span class="tag">选择</span>
      </button>
    `).join('')
  }

  function dayLabel(dayKey) {
    return (days.find(([key]) => key === dayKey) || [dayKey, dayKey])[1]
  }

  function round(number) {
    return Math.round(Number(number || 0) * 100) / 100
  }

  function refreshAll() {
    renderHome()
    renderWeek()
    renderShopping()
    renderFavorites()
    renderProfile()
  }

  function switchView(id) {
    document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active-view', view.id === id))
    document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === id))
    refreshAll()
  }

  function handleAction(target) {
    const action = target.dataset.action
    if (!action) return
    if (action === 'detail') showDetail(target.dataset.id)
    if (action === 'shuffle-meal') {
      state.todayPlans[target.dataset.meal] = buildMealPlan(target.dataset.meal, (state.todayPlans[target.dataset.meal] || []).map((recipe) => recipe.id))
      renderHome()
    }
    if (action === 'add-dish') {
      const meal = target.dataset.meal
      const ids = state.todayPlans[meal].map((recipe) => recipe.id)
      const next = pick(recipes.filter((recipe) => recipe.mealType === meal && getRole(recipe) !== 'soup'), ids, {})
      if (next) state.todayPlans[meal].push(next)
      renderHome()
    }
    if (action === 'change-soup') {
      const meal = target.dataset.meal
      const ids = state.todayPlans[meal].map((recipe) => recipe.id)
      const soup = pick(poolByRole(meal, 'soup'), ids, {})
      if (soup) state.todayPlans[meal] = state.todayPlans[meal].filter((recipe) => getRole(recipe) !== 'soup').concat([soup])
      renderHome()
    }
    if (action === 'add-plan-to-week') {
      const menu = getMenu()
      menu.monday[target.dataset.meal] = state.todayPlans[target.dataset.meal].map((recipe) => recipe.id)
      saveMenu(menu)
      toast('已加入周一对应餐次，可在一周菜单继续调整')
      refreshAll()
    }
    if (action === 'open-picker') openPicker({ day: target.dataset.day, meal: target.dataset.meal })
    if (action === 'remove-recipe') {
      const menu = getMenu()
      menu[target.dataset.day][target.dataset.meal].splice(Number(target.dataset.index), 1)
      saveMenu(menu)
      refreshAll()
    }
    if (action === 'reselect-slot') {
      const menu = getMenu()
      const oldIds = menu[target.dataset.day][target.dataset.meal]
      menu[target.dataset.day][target.dataset.meal] = buildMealPlan(target.dataset.meal, oldIds).map((recipe) => recipe.id)
      saveMenu(menu)
      refreshAll()
    }
    if (action === 'reselect-recipe') {
      const menu = getMenu()
      const ids = menu[target.dataset.day][target.dataset.meal]
      const current = recipeById(ids[Number(target.dataset.index)])
      const next = pick(poolByRole(target.dataset.meal, getRole(current)), [current && current.id].filter(Boolean), {})
      if (next) ids[Number(target.dataset.index)] = next.id
      saveMenu(menu)
      refreshAll()
    }
    if (action === 'toggle-usage') {
      const excluded = read('excluded', {})
      excluded[target.dataset.id] = !excluded[target.dataset.id]
      if (!excluded[target.dataset.id]) delete excluded[target.dataset.id]
      write('excluded', excluded)
      renderShopping()
    }
    if (action === 'favorite') {
      const ids = getFavorites()
      const id = target.dataset.id
      const index = ids.indexOf(id)
      if (index > -1) ids.splice(index, 1)
      else ids.push(id)
      saveFavorites(ids)
      showDetail(id)
      refreshAll()
    }
    if (action === 'open-picker-for-detail') {
      const recipe = recipeById(target.dataset.id)
      document.querySelector('#recipeDialog').close()
      openPicker({ day: 'monday', meal: recipe.mealType })
    }
    if (action === 'choose-recipe') {
      const picker = state.picker || {}
      const menu = getMenu()
      if (picker.day && picker.meal) {
        menu[picker.day][picker.meal].push(target.dataset.id)
        saveMenu(menu)
        document.querySelector('#pickerDialog').close()
        toast('已加入本周菜单')
        refreshAll()
      }
    }
  }

  document.addEventListener('click', (event) => {
    const jump = event.target.closest('[data-jump]')
    if (jump) switchView(jump.dataset.jump)
    const nav = event.target.closest('.nav-item')
    if (nav) switchView(nav.dataset.view)
    const actionTarget = event.target.closest('[data-action]')
    if (actionTarget) handleAction(actionTarget)
  })

  document.querySelector('#shuffleTodayBtn').addEventListener('click', () => {
    state.todayPlans = {}
    renderHome()
  })
  document.querySelector('#regenWeekBtn').addEventListener('click', () => {
    if (confirm('确定重新生成本周菜单吗？')) {
      saveMenu(createWeeklyMenu())
      refreshAll()
      toast('已重新生成本周菜单')
    }
  })
  document.querySelector('#clearWeekBtn').addEventListener('click', () => {
    if (confirm('确定清空本周菜单吗？')) {
      saveMenu(emptyMenu())
      refreshAll()
    }
  })
  document.querySelector('#resetShoppingBtn').addEventListener('click', () => {
    localStorage.removeItem('eat_demo_excluded')
    renderShopping()
  })
  document.querySelector('#clearAllBtn').addEventListener('click', () => {
    if (confirm('确定清空所有本地演示数据吗？')) {
      Object.keys(localStorage).filter((key) => key.startsWith('eat_demo_')).forEach((key) => localStorage.removeItem(key))
      state.todayPlans = {}
      refreshAll()
    }
  })
  document.querySelector('#saveProfileBtn').addEventListener('click', () => {
    write('settings', {
      familySize: Number(document.querySelector('#familySizeInput').value) || 3,
      weeklyBudget: Number(document.querySelector('#budgetInput').value) || 0,
      avoidFoods: document.querySelector('#avoidInput').value,
      region: document.querySelector('#regionInput').value
    })
    toast('档案已保存')
    renderProfile()
  })
  document.querySelector('#closeRecipeDialog').addEventListener('click', () => document.querySelector('#recipeDialog').close())
  document.querySelector('#closePickerDialog').addEventListener('click', () => document.querySelector('#pickerDialog').close())
  document.querySelector('#recipeSearch').addEventListener('input', (event) => {
    const keyword = event.target.value.trim().toLowerCase()
    const picker = state.picker || {}
    let list = recipes.filter((recipe) => recipe.mealType === (picker.meal || 'lunch'))
    if (picker.role) list = poolByRole(picker.meal, picker.role)
    if (keyword) {
      list = list.filter((recipe) => [recipe.name, (recipe.tags || []).join(' '), (recipe.ingredients || []).map((item) => item.name).join(' ')].join(' ').toLowerCase().includes(keyword))
    }
    renderPickerList(list)
  })

  refreshAll()
})()
