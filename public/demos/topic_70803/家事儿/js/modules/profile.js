const ProfileModule = {
    editingMemberId: null,
    tempAvatar: null,

    render() {
        const container = document.getElementById('page-profile');
        const members = Storage.getMembers();
        const currentMember = App.currentMember;

        container.innerHTML = `
            <div class="card">
                <div style="text-align:center;padding:var(--spacing-lg) 0">
                    <div class="member-avatar" style="width:72px;height:72px;font-size:var(--font-xxl);margin:0 auto var(--spacing-md);background:var(--primary-light)">
                        ${currentMember && currentMember.avatar && currentMember.avatar.startsWith('data:') ? `<img src="${currentMember.avatar}">` : (currentMember ? (currentMember.avatar || currentMember.name.charAt(0)) : '?')}
                    </div>
                    <div style="font-size:var(--font-lg);font-weight:600;margin-bottom:var(--spacing-xs)">${currentMember ? App.escapeHtml(currentMember.name) : '未选择'}</div>
                    <div style="font-size:var(--font-sm);color:var(--text-secondary);margin-bottom:var(--spacing-md)">${currentMember ? App.escapeHtml(currentMember.role) : ''}</div>
                    <div style="display:flex;gap:var(--spacing-sm);justify-content:center;align-items:center">
                        <span style="font-size:var(--font-sm);color:var(--text-secondary)">字体大小：</span>
                        <button class="btn btn-sm ${currentMember && currentMember.fontSize === 'normal' ? 'btn-primary' : 'btn-outline'}" onclick="ProfileModule.toggleFontSize('normal')">正常</button>
                        <button class="btn btn-sm ${currentMember && currentMember.fontSize === 'large' ? 'btn-primary' : 'btn-outline'}" onclick="ProfileModule.toggleFontSize('large')">大字</button>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-title">
                    家庭成员
                    <span class="more" onclick="ProfileModule.openAddMemberModal()">+ 添加成员</span>
                </div>
                ${members.map(member => `
                    <div class="list-item">
                        <div class="avatar-sm">${member.avatar && member.avatar.startsWith('data:') ? `<img src="${member.avatar}">` : (member.avatar || member.name.charAt(0))}</div>
                        <div class="list-item-content">
                            <div class="list-item-title">${App.escapeHtml(member.name)}</div>
                            <div class="list-item-desc">
                                ${App.escapeHtml(member.role)} · 
                                <span style="color:${member.fontSize === 'large' ? 'var(--primary-color)' : 'var(--text-hint)'}">${member.fontSize === 'large' ? '大字模式' : '正常字体'}</span>
                            </div>
                        </div>
                        <div class="list-item-action" style="display:flex;gap:var(--spacing-xs)">
                            <button class="btn btn-sm btn-outline" onclick="ProfileModule.openEditMemberModal('${member.id}')">编辑</button>
                            ${members.length > 1 ? `<button class="btn btn-sm btn-outline" style="color:var(--danger-color);border-color:var(--danger-color)" onclick="ProfileModule.deleteMember('${member.id}')">删除</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="card">
                <div class="card-title">功能入口</div>
                <div class="list-item" onclick="App.navigate('album')" style="cursor:pointer">
                    <div style="font-size:var(--font-lg);width:40px">📷</div>
                    <div class="list-item-content">
                        <div class="list-item-title">家庭相册</div>
                        <div class="list-item-desc">管理家庭照片视频</div>
                    </div>
                </div>
                <div class="list-item" onclick="App.navigate('books')" style="cursor:pointer">
                    <div style="font-size:var(--font-lg);width:40px">📚</div>
                    <div class="list-item-content">
                        <div class="list-item-title">家庭书库</div>
                        <div class="list-item-desc">管理纸质书、电子书</div>
                    </div>
                </div>
                <div class="list-item" onclick="App.navigate('shopping')" style="cursor:pointer">
                    <div style="font-size:var(--font-lg);width:40px">🛒</div>
                    <div class="list-item-content">
                        <div class="list-item-title">购物清单</div>
                        <div class="list-item-desc">想买、待购、已买物品</div>
                    </div>
                </div>
                <div class="list-item" onclick="App.navigate('events')" style="cursor:pointer">
                    <div style="font-size:var(--font-lg);width:40px">📅</div>
                    <div class="list-item-content">
                        <div class="list-item-title">大事件</div>
                        <div class="list-item-desc">生日、节日、纪念日</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-title">数据管理</div>
                <div class="list-item" onclick="ProfileModule.exportData()" style="cursor:pointer">
                    <div style="font-size:var(--font-lg);width:40px">📤</div>
                    <div class="list-item-content">
                        <div class="list-item-title">导出数据</div>
                        <div class="list-item-desc">导出所有数据备份</div>
                    </div>
                </div>
                <div class="list-item" onclick="ProfileModule.clearData()" style="cursor:pointer">
                    <div style="font-size:var(--font-lg);width:40px">🗑️</div>
                    <div class="list-item-content">
                        <div class="list-item-title" style="color:var(--danger-color)">清空所有数据</div>
                        <div class="list-item-desc">谨慎操作，数据不可恢复</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-title">关于</div>
                <div style="text-align:center;color:var(--text-hint);padding:var(--spacing-md) 0;font-size:var(--font-sm);line-height:2">
                    <div style="font-size:40px;margin-bottom:var(--spacing-md)">🏠</div>
                    <div style="font-size:var(--font-md);color:var(--text-primary);font-weight:500">家庭助手</div>
                    <div>让家更温暖</div>
                    <div style="margin-top:var(--spacing-sm)">HTML Demo 版本</div>
                </div>
            </div>
        `;

        App.updateHeader('我的');
    },

    toggleFontSize(size) {
        const currentMember = App.currentMember;
        if (!currentMember) return;

        Storage.updateMember(currentMember.id, { fontSize: size });
        App.currentMember = Storage.getCurrentMember();
        App.applyFontSize();
        this.render();
        App.showToast(size === 'large' ? '已切换到大字模式' : '已切换到正常字体');
    },

    openAddMemberModal() {
        this.editingMemberId = null;
        this.tempAvatar = null;
        this.showMemberModal('添加成员');
    },

    openEditMemberModal(id) {
        const member = Storage.getMembers().find(m => m.id === id);
        if (!member) return;

        this.editingMemberId = id;
        this.tempAvatar = member.avatar || null;
        this.showMemberModal('编辑成员', member);
    },

    showMemberModal(title, member = null) {
        const roles = ['爸爸', '妈妈', '儿子', '女儿', '爷爷', '奶奶', '外公', '外婆', '其他'];
        const html = `
            <div class="modal-header">
                <div class="modal-title">${title}</div>
                <div class="modal-close" onclick="App.closeModal()">×</div>
            </div>
            <div class="modal-body">
                <div style="text-align:center;margin-bottom:var(--spacing-lg)">
                    <div id="avatarPreview" class="member-avatar" style="width:80px;height:80px;font-size:var(--font-xxl);margin:0 auto var(--spacing-md);cursor:pointer;background:var(--primary-light)" onclick="document.getElementById('avatarInput').click()">
                        ${this.tempAvatar ? (this.tempAvatar.startsWith('data:') ? `<img src="${this.tempAvatar}">` : this.tempAvatar) : (member ? (member.avatar || App.escapeHtml(member.name.charAt(0))) : '👤')}
                    </div>
                    <input type="file" id="avatarInput" accept="image/*" style="display:none" onchange="ProfileModule.handleAvatar(this.files[0])">
                    <div style="font-size:var(--font-sm);color:var(--text-hint)">点击头像上传照片</div>
                </div>
                <div class="input-group">
                    <label class="input-label">姓名/昵称</label>
                    <input class="input" id="memberName" value="${member ? App.escapeHtml(member.name) : ''}" placeholder="例如：妈妈">
                </div>
                <div class="input-group">
                    <label class="input-label">身份</label>
                    <select class="select" id="memberRole">
                        ${roles.map(r => `<option value="${r}" ${member && member.role === r ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>
                </div>
                <div class="input-group">
                    <label class="input-label">字体大小</label>
                    <div style="display:flex;gap:var(--spacing-sm)">
                        <button class="btn ${(!member || member.fontSize === 'normal') ? 'btn-primary' : 'btn-outline'}" style="flex:1" onclick="ProfileModule.selectFontSize('normal', this)">正常</button>
                        <button class="btn ${member && member.fontSize === 'large' ? 'btn-primary' : 'btn-outline'}" style="flex:1" onclick="ProfileModule.selectFontSize('large', this)">大字（老人）</button>
                    </div>
                    <input type="hidden" id="memberFontSize" value="${member ? member.fontSize : 'normal'}">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-block" onclick="ProfileModule.saveMember()">保存</button>
            </div>
        `;

        App.showModal(html);

        setTimeout(() => {
            document.getElementById('memberName').focus();
        }, 100);
    },

    handleAvatar(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.tempAvatar = e.target.result;
            const preview = document.getElementById('avatarPreview');
            preview.innerHTML = `<img src="${this.tempAvatar}">`;
        };
        reader.readAsDataURL(file);
    },

    selectFontSize(size, btn) {
        document.getElementById('memberFontSize').value = size;
        btn.parentElement.querySelectorAll('.btn').forEach(b => {
            b.classList.remove('btn-primary');
            b.classList.add('btn-outline');
        });
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
    },

    saveMember() {
        const name = document.getElementById('memberName').value.trim();
        const role = document.getElementById('memberRole').value;
        const fontSize = document.getElementById('memberFontSize').value;

        if (!name) {
            App.showToast('请输入姓名');
            return;
        }

        const data = {
            name,
            role,
            fontSize,
            avatar: this.tempAvatar
        };

        if (this.editingMemberId) {
            Storage.updateMember(this.editingMemberId, data);
            App.showToast('修改成功');
        } else {
            Storage.addMember(data);
            App.showToast('添加成功');
        }

        App.closeModal();

        if (App.currentMember && this.editingMemberId === App.currentMember.id) {
            App.currentMember = Storage.getCurrentMember();
            App.applyFontSize();
        }

        App.renderMemberSwitcher();
        this.render();
    },

    deleteMember(id) {
        const members = Storage.getMembers();
        if (members.length <= 1) {
            App.showToast('至少保留一个家庭成员');
            return;
        }

        if (confirm('确定删除这个成员吗？')) {
            Storage.deleteMember(id);
            if (App.currentMember && App.currentMember.id === id) {
                const remaining = Storage.getMembers();
                if (remaining.length > 0) {
                    Storage.setCurrentMemberId(remaining[0].id);
                    App.currentMember = remaining[0];
                    App.applyFontSize();
                    App.renderMemberSwitcher();
                }
            }
            this.render();
            App.showToast('已删除');
        }
    },

    exportData() {
        const data = Storage.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `家庭助手备份_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        App.showToast('数据已导出');
    },

    clearData() {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            if (confirm('再次确认：真的要清空所有数据吗？')) {
                Storage.clearAll();
                App.initDefaultData();
                App.currentMember = Storage.getCurrentMember();
                App.applyFontSize();
                App.renderMemberSwitcher();
                App.navigate('home');
                App.showToast('数据已清空，已重置为初始状态');
            }
        }
    }
};

App.registerModule('profile', ProfileModule);