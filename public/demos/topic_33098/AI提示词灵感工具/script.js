const recentList = [];
const STORAGE_KEY = 'aiPromptTemplates';

function showToast(message) {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

function addToRecent(name) {
    const index = recentList.indexOf(name);
    if (index > -1) {
        recentList.splice(index, 1);
    }
    recentList.unshift(name);
    if (recentList.length > 3) {
        recentList.pop();
    }
    renderRecent();
}

function renderRecent() {
    const recentTags = document.getElementById('recentTags');
    if (recentList.length === 0) {
        recentTags.innerHTML = '<span class="tag">暂无记录</span>';
        return;
    }
    recentTags.innerHTML = recentList.map(name => 
        `<span class="tag" onclick="jumpToCard('${name}')">${name}</span>`
    ).join('');
}

function jumpToCard(name) {
    const card = document.querySelector(`.card[data-name="${name}"]`);
    if (card) {
        toggleCard(card);
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function toggleCard(card) {
    const name = card.getAttribute('data-name');
    if (name) {
        addToRecent(name);
    }
    
    card.classList.toggle('expanded');
    const template = card.querySelector('.card-template');
    if (template.style.display === 'none') {
        template.style.display = 'block';
    } else {
        template.style.display = 'none';
    }
}

function filterCards() {
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        const name = card.getAttribute('data-name') || '';
        const desc = card.querySelector('.card-desc').textContent || '';
        const template = card.querySelector('.template-textarea').value || '';
        
        const match = name.toLowerCase().includes(keyword) ||
                      desc.toLowerCase().includes(keyword) ||
                      template.toLowerCase().includes(keyword);
        
        card.style.display = match ? 'block' : 'none';
    });
}

function loadCustomTemplates() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return [];
    
    try {
        return JSON.parse(savedData);
    } catch (e) {
        return [];
    }
}

function saveCustomTemplates(templates) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function createTemplateCard(name, content) {
    const cardsGrid = document.getElementById('cardsGrid');
    const newCard = document.createElement('div');
    newCard.className = 'card';
    newCard.setAttribute('data-name', name);
    newCard.onclick = function() { toggleCard(this); };
    newCard.innerHTML = `
        <div class="card-header">
            <h3><span class="card-icon">✨</span>${name}</h3>
            <span class="expand-icon">▼</span>
        </div>
        <div class="card-body">
            <p class="card-desc">自定义模板</p>
            <div class="card-template" style="display: none;">
                <h4>提示词模板</h4>
                <textarea readonly class="template-textarea">${content}</textarea>
                <button class="copy-btn">一键复制</button>
            </div>
        </div>
    `;
    cardsGrid.appendChild(newCard);
}

function addCustomTemplate() {
    const templateName = document.getElementById('templateName');
    const templateContent = document.getElementById('templateContent');
    
    const name = templateName.value.trim();
    const content = templateContent.value.trim();
    
    if (!name || !content) {
        showToast('⚠️ 请填写完整信息');
        return;
    }
    
    const templates = loadCustomTemplates();
    templates.push({ name, content, timestamp: Date.now() });
    saveCustomTemplates(templates);
    
    createTemplateCard(name, content);
    
    templateName.value = '';
    templateContent.value = '';
    
    showToast('✅ 模板保存成功');
}

document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('saveBtn');
    const searchInput = document.getElementById('searchInput');
    
    const customTemplates = loadCustomTemplates();
    customTemplates.forEach(template => {
        createTemplateCard(template.name, template.content);
    });
    
    searchInput.addEventListener('input', filterCards);
    
    saveBtn.addEventListener('click', addCustomTemplate);
    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('copy-btn')) {
            const textarea = e.target.previousElementSibling;
            textarea.select();
            textarea.setSelectionRange(0, 99999);
            
            navigator.clipboard.writeText(textarea.value).then(function() {
                showToast('✅ 已复制到剪贴板');
            }).catch(function(err) {
                document.execCommand('copy');
                showToast('✅ 已复制到剪贴板');
            });
        }
    });
});