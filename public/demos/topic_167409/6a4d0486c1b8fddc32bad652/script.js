const STORAGE_KEY = 'recipe_app_data';

let recipes = [];
let currentCategory = 'all';
let searchKeyword = '';

const exampleRecipes = [
    { id: '1', name: '红烧肉', category: '荤', ingredients: '五花肉,生姜,葱,料酒,生抽,老抽,冰糖' },
    { id: '2', name: '糖醋排骨', category: '荤', ingredients: '排骨,生姜,大蒜,醋,白糖,生抽,料酒' },
    { id: '3', name: '宫保鸡丁', category: '荤', ingredients: '鸡胸肉,花生米,干辣椒,花椒,葱,生姜,大蒜' },
    { id: '4', name: '炒青菜', category: '素', ingredients: '青菜,大蒜,盐,食用油' },
    { id: '5', name: '番茄炒蛋', category: '素', ingredients: '番茄,鸡蛋,葱,盐,糖,食用油' },
    { id: '6', name: '凉拌黄瓜', category: '素', ingredients: '黄瓜,大蒜,香油,醋,盐,生抽' },
    { id: '7', name: '鱼香肉丝', category: '荤', ingredients: '猪肉丝,胡萝卜,木耳,青椒,豆瓣酱,糖,醋' },
    { id: '8', name: '蒜蓉西兰花', category: '素', ingredients: '西兰花,大蒜,盐,食用油' }
];

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        recipes = JSON.parse(data);
    } else {
        recipes = [...exampleRecipes];
        saveData();
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function addRecipe(recipe) {
    const newRecipe = {
        id: generateId(),
        ...recipe
    };
    recipes.push(newRecipe);
    saveData();
}

function updateRecipe(id, updatedRecipe) {
    const index = recipes.findIndex(r => r.id === id);
    if (index !== -1) {
        recipes[index] = { ...recipes[index], ...updatedRecipe };
        saveData();
    }
}

function deleteRecipe(id) {
    recipes = recipes.filter(r => r.id !== id);
    saveData();
}

function renderRecipes() {
    const container = document.getElementById('recipe-list');
    
    let filteredRecipes = recipes;
    
    if (currentCategory !== 'all') {
        filteredRecipes = filteredRecipes.filter(r => r.category === currentCategory);
    }
    
    if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        filteredRecipes = filteredRecipes.filter(r => 
            r.name.toLowerCase().includes(keyword) || 
            r.ingredients.toLowerCase().includes(keyword)
        );
    }

    if (filteredRecipes.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #999;">暂无菜谱</div>';
        return;
    }

    container.innerHTML = filteredRecipes.map(recipe => `
        <div class="recipe-card" data-id="${recipe.id}">
            <h3>${recipe.name}</h3>
            <span class="category-tag ${recipe.category === '荤' ? 'meat' : 'vegetable'}">
                ${recipe.category === '荤' ? '荤菜' : '素菜'}
            </span>
            <div class="ingredients">
                ${recipe.ingredients.split(',').map(ing => 
                    `<span class="ingredient-tag">${ing.trim()}</span>`
                ).join('')}
            </div>
            <div class="recipe-actions">
                <button class="edit-btn" data-id="${recipe.id}">编辑</button>
                <button class="delete-btn" data-id="${recipe.id}">删除</button>
            </div>
        </div>
    `).join('');
}

function handleRandom搭配() {
    const meatRecipes = recipes.filter(r => r.category === '荤');
    const vegRecipes = recipes.filter(r => r.category === '素');
    
    const resultContainer = document.getElementById('random-result');
    
    if (meatRecipes.length === 0 || vegRecipes.length === 0) {
        resultContainer.innerHTML = '<div style="color: #ff6b6b; padding: 1rem;">' +
            (meatRecipes.length === 0 ? '荤菜数量不足！' : '') +
            (vegRecipes.length === 0 ? '素菜数量不足！' : '') +
            '</div>';
        return;
    }
    
    const randomMeat = meatRecipes[Math.floor(Math.random() * meatRecipes.length)];
    const randomVeg = vegRecipes[Math.floor(Math.random() * vegRecipes.length)];
    
    resultContainer.innerHTML = `
        <div class="random-result-card">
            <h3>今日午餐推荐</h3>
            <div class="random-items">
                <div class="random-item meat">
                    <span class="category-tag meat">荤菜</span>
                    <span class="item-name">${randomMeat.name}</span>
                </div>
                <div class="random-item vegetable">
                    <span class="category-tag vegetable">素菜</span>
                    <span class="item-name">${randomVeg.name}</span>
                </div>
            </div>
        </div>
    `;
}

function handleSearch() {
    searchKeyword = document.getElementById('search-input').value.trim();
    renderRecipes();
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('recipe-id').value;
    const name = document.getElementById('recipe-name').value.trim();
    const category = document.getElementById('recipe-category').value;
    const ingredients = document.getElementById('recipe-ingredients').value.trim();

    if (!name || !category || !ingredients) return;

    if (id) {
        updateRecipe(id, { name, category, ingredients });
        document.getElementById('form-title').textContent = '添加菜谱';
    } else {
        addRecipe({ name, category, ingredients });
    }

    resetForm();
    renderRecipes();
}

function resetForm() {
    document.getElementById('recipe-form').reset();
    document.getElementById('recipe-id').value = '';
    document.getElementById('form-title').textContent = '添加菜谱';
}

function handleEditClick(id) {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;

    document.getElementById('recipe-id').value = recipe.id;
    document.getElementById('recipe-name').value = recipe.name;
    document.getElementById('recipe-category').value = recipe.category;
    document.getElementById('recipe-ingredients').value = recipe.ingredients;
    document.getElementById('form-title').textContent = '编辑菜谱';
}

function handleDeleteClick(id) {
    if (confirm('确定要删除这个菜谱吗？')) {
        deleteRecipe(id);
        renderRecipes();
    }
}

function handleCategoryFilter(category) {
    currentCategory = category;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });

    renderRecipes();
}

function init() {
    loadData();
    renderRecipes();

    document.getElementById('recipe-form').addEventListener('submit', handleFormSubmit);
    
    document.getElementById('cancel-btn').addEventListener('click', resetForm);

    document.getElementById('recipe-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            handleEditClick(e.target.dataset.id);
        } else if (e.target.classList.contains('delete-btn')) {
            handleDeleteClick(e.target.dataset.id);
        }
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            handleCategoryFilter(btn.dataset.category);
        });
    });

    document.getElementById('random-btn').addEventListener('click', handleRandom搭配);

    document.getElementById('search-btn').addEventListener('click', handleSearch);
    
    document.getElementById('search-input').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

document.addEventListener('DOMContentLoaded', init);