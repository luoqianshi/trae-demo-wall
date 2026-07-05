const MomentsModule = {
    selectedImages: [],

    render() {
        const container = document.getElementById('page-moments');
        const moments = Storage.getMoments();
        const members = Storage.getMembers();
        const currentMember = App.currentMember;

        container.innerHTML = `
            ${moments.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon">💬</div>
                    <div class="empty-text">还没有动态，分享点什么吧</div>
                </div>
            ` : moments.map(moment => {
                const author = members.find(m => m.id === moment.authorId);
                const isLiked = currentMember && moment.likes.includes(currentMember.id);
                return `
                    <div class="card" style="margin-bottom:var(--spacing-md);padding:var(--spacing-lg)">
                        <div style="display:flex;align-items:center;gap:var(--spacing-sm);margin-bottom:var(--spacing-md)">
                            <div class="avatar-sm">${author && author.avatar && author.avatar.startsWith('data:') ? `<img src="${author.avatar}">` : (author ? (author.avatar || author.name.charAt(0)) : '?')}</div>
                            <div style="flex:1">
                                <div style="font-size:var(--font-md);font-weight:500">${author ? App.escapeHtml(author.name) : '家人'}</div>
                                <div style="font-size:var(--font-xs);color:var(--text-hint)">${this.formatTime(moment.createdAt)}</div>
                            </div>
                            ${currentMember && moment.authorId === currentMember.id ? `
                                <button class="btn btn-sm btn-outline" onclick="MomentsModule.deleteMoment('${moment.id}')" style="color:var(--danger-color);border-color:var(--danger-color)">删除</button>
                            ` : ''}
                        </div>
                        <div style="font-size:var(--font-md);line-height:1.6;margin-bottom:var(--spacing-md);white-space:pre-wrap">${App.escapeHtml(moment.content)}</div>
                        ${moment.images && moment.images.length > 0 ? `
                            <div class="moment-images count-${Math.min(moment.images.length, 9)}">
                                ${moment.images.map(img => `<img src="${img}" onclick="App.viewImage('${img}')">`).join('')}
                            </div>
                        ` : ''}
                        <div style="display:flex;gap:var(--spacing-xl);margin-top:var(--spacing-md);padding-top:var(--spacing-md);border-top:1px solid var(--border-color)">
                            <div style="display:flex;align-items:center;gap:var(--spacing-xs);cursor:pointer;color:${isLiked ? 'var(--primary-color)' : 'var(--text-secondary)'}" onclick="MomentsModule.toggleLike('${moment.id}')">
                                <span style="font-size:var(--font-lg)">${isLiked ? '❤️' : '🤍'}</span>
                                <span style="font-size:var(--font-sm)">${moment.likes.length > 0 ? moment.likes.length : '点赞'}</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:var(--spacing-xs);cursor:pointer;color:var(--text-secondary)" onclick="MomentsModule.focusComment('${moment.id}')">
                                <span style="font-size:var(--font-lg)">💬</span>
                                <span style="font-size:var(--font-sm)">${moment.comments.length > 0 ? moment.comments.length : '评论'}</span>
                            </div>
                        </div>
                        ${moment.comments.length > 0 ? `
                            <div style="margin-top:var(--spacing-md);padding:var(--spacing-md);background:var(--bg-color);border-radius:var(--radius-md)">
                                ${moment.comments.map(comment => {
                                    const commenter = members.find(m => m.id === comment.memberId);
                                    return `
                                        <div style="margin-bottom:var(--spacing-sm);font-size:var(--font-sm);line-height:1.5">
                                            <span style="color:var(--primary-color);font-weight:500">${commenter ? App.escapeHtml(commenter.name) : '家人'}：</span>
                                            <span>${App.escapeHtml(comment.content)}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : ''}
                        <div style="display:flex;gap:var(--spacing-sm);margin-top:var(--spacing-md)">
                            <input class="input" style="flex:1" id="commentInput-${moment.id}" placeholder="写评论..." onkeypress="if(event.key==='Enter')MomentsModule.addComment('${moment.id}')">
                            <button class="btn btn-primary btn-sm" onclick="MomentsModule.addComment('${moment.id}')">发送</button>
                        </div>
                    </div>
                `;
            }).join('')}

            <button class="fab" onclick="MomentsModule.openAddModal()">✏️</button>
        `;

        App.updateHeader('家庭圈');
    },

    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
        const date = new Date(timestamp);
        return `${date.getMonth()+1}月${date.getDate()}日`;
    },

    toggleLike(momentId) {
        const currentMember = App.currentMember;
        if (!currentMember) {
            App.showToast('请先选择家庭成员');
            return;
        }
        Storage.toggleMomentLike(momentId, currentMember.id);
        this.render();
    },

    addComment(momentId) {
        const currentMember = App.currentMember;
        if (!currentMember) {
            App.showToast('请先选择家庭成员');
            return;
        }
        const input = document.getElementById(`commentInput-${momentId}`);
        const content = input.value.trim();
        if (!content) return;

        Storage.addMomentComment(momentId, currentMember.id, content);
        this.render();
    },

    focusComment(momentId) {
        const input = document.getElementById(`commentInput-${momentId}`);
        if (input) input.focus();
    },

    deleteMoment(id) {
        if (confirm('确定删除这条动态吗？')) {
            Storage.deleteMoment(id);
            this.render();
            App.showToast('已删除');
        }
    },

    openAddModal() {
        const currentMember = App.currentMember;
        if (!currentMember) {
            App.showToast('请先选择家庭成员');
            return;
        }

        this.selectedImages = [];

        const html = `
            <div class="modal-header">
                <div class="modal-title">发布动态</div>
                <div class="modal-close" onclick="App.closeModal()">×</div>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <textarea class="textarea" id="momentContent" placeholder="分享点什么给家人吧..." style="min-height:120px" autofocus></textarea>
                </div>
                <div class="input-group">
                    <label class="input-label">添加图片（可选）</label>
                    <input type="file" id="momentImages" accept="image/*" multiple style="display:none" onchange="MomentsModule.handleImages(this.files)">
                    <button class="btn btn-secondary btn-block" onclick="document.getElementById('momentImages').click()">📷 选择图片</button>
                    <div id="imagePreview" style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--spacing-sm);margin-top:var(--spacing-md)"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-block" onclick="MomentsModule.saveMoment()">发布</button>
            </div>
        `;

        App.showModal(html);

        setTimeout(() => {
            document.getElementById('momentContent').focus();
        }, 100);
    },

    handleImages(files) {
        const preview = document.getElementById('imagePreview');
        Array.from(files).slice(0, 9).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.selectedImages.push(e.target.result);
                this.renderImagePreview();
            };
            reader.readAsDataURL(file);
        });
    },

    renderImagePreview() {
        const preview = document.getElementById('imagePreview');
        if (!preview) return;
        preview.innerHTML = this.selectedImages.map((img, idx) => `
            <div style="position:relative;aspect-ratio:1">
                <img src="${img}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm)">
                <div style="position:absolute;top:-8px;right:-8px;width:24px;height:24px;background:var(--danger-color);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer" onclick="MomentsModule.removeImage(${idx})">×</div>
            </div>
        `).join('');
    },

    removeImage(idx) {
        this.selectedImages.splice(idx, 1);
        this.renderImagePreview();
    },

    saveMoment() {
        const currentMember = App.currentMember;
        const content = document.getElementById('momentContent').value.trim();

        if (!content && this.selectedImages.length === 0) {
            App.showToast('请输入内容或添加图片');
            return;
        }

        Storage.addMoment({
            content,
            images: this.selectedImages,
            authorId: currentMember.id
        });

        App.closeModal();
        App.showToast('发布成功');
        this.render();
        if (App.currentPage === 'home') {
            App.modules.home.render();
        }
    }
};

App.registerModule('moments', MomentsModule);