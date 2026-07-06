const Community = {
    render() {
        const posts = Storage.getPosts();
        const username = Storage.getCurrentUser();
        const container = document.getElementById('view-community');

        container.innerHTML = `
            <div class="card">
                <div class="card-title">✍️ 发布新帖</div>
                <textarea id="new-post-content" placeholder="分享你的学习心得、提问或建议..." style="width: 100%; min-height: 80px; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-family: inherit; font-size: 14px; resize: vertical;"></textarea>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; gap: 12px;">
                    <input type="text" id="new-post-tags" placeholder="标签 (用逗号分隔，如: 英语, 语法)" style="flex: 1; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;">
                    <button class="btn btn-primary" onclick="Community.submitPost()">📢 发布</button>
                </div>
            </div>

            <div class="card">
                <div class="card-title">💬 社区动态 (${posts.length} 条帖子)</div>
                ${posts.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">💬</div>
                        <h3>还没有帖子</h3>
                        <p>成为第一个发帖的人吧！</p>
                    </div>
                ` : posts.map(post => this.renderPost(post, username)).join('')}
            </div>
        `;
    },

    renderPost(post, currentUser) {
        const tags = (post.tags || []).map(tag => `<span class="post-tag">${tag}</span>`).join('');
        const likes = post.likes || 0;
        const replies = (post.replies || []).map(r => `
            <div class="reply-item">
                <div style="font-size: 14px;"><strong>${r.username}:</strong> ${r.content}</div>
                <div class="reply-meta">${r.time}</div>
            </div>
        `).join('');

        return `
            <div class="community-post" style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #818cf8); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600;">${post.username.charAt(0).toUpperCase()}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 15px;">${post.username}</div>
                        <div style="font-size: 12px; color: #64748b;">${post.time}</div>
                    </div>
                </div>
                <div style="margin-bottom: 12px; line-height: 1.7; color: #1e293b;">${post.content}</div>
                ${tags ? `<div style="display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;">${tags}</div>` : ''}
                <div style="display: flex; gap: 20px;">
                    <button class="post-action" onclick="Community.likePost('${post.id}', '${currentUser}')">
                        ❤️ <span>${likes}</span>
                    </button>
                    <button class="post-action" onclick="Community.toggleReply('${post.id}')">
                        💬 <span>回复</span>
                    </button>
                </div>
                <div id="reply-${post.id}" style="display: none; margin-top: 16px; padding: 16px; background: #f8fafc; border-radius: 8px;">
                    <textarea id="reply-content-${post.id}" placeholder="写下你的回复..." style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px; font-family: inherit; font-size: 14px; resize: vertical; margin-bottom: 8px;"></textarea>
                    <button class="btn btn-primary" style="padding: 8px 16px; font-size: 14px;" onclick="Community.submitReply('${post.id}', '${currentUser}')">回复</button>
                    ${replies}
                </div>
            </div>
        `;
    },

    submitPost() {
        const content = document.getElementById('new-post-content').value.trim();
        const tagsInput = document.getElementById('new-post-tags').value.trim();
        const username = Storage.getCurrentUser();

        if (!content) {
            UI.showToast('请输入帖子内容', 'warning');
            return;
        }

        const tags = tagsInput ? tagsInput.split(/[,，]/).map(t => t.trim()).filter(t => t) : [];
        const newPost = {
            id: 'post_' + Date.now(),
            username,
            content,
            tags,
            time: '刚刚',
            likes: 0,
            replies: []
        };

        Storage.addPost(newPost);
        Storage.incrementStat(username, 'postsMade', 1);
        Storage.checkAchievements(username);
        UI.showToast('✓ 帖子发布成功', 'success');
        this.render();
    },

    likePost(postId, username) {
        const result = Storage.likePost(postId, username);
        if (result.liked) {
            UI.showToast('+1 ❤️', 'success');
            this.render();
        } else {
            UI.showToast('你已经点赞过了', 'info');
        }
    },

    toggleReply(postId) {
        const replyDiv = document.getElementById('reply-' + postId);
        if (replyDiv) {
            replyDiv.style.display = replyDiv.style.display === 'none' ? 'block' : 'none';
        }
    },

    submitReply(postId, username) {
        const replyContent = document.getElementById('reply-content-' + postId).value.trim();
        if (!replyContent) {
            UI.showToast('请输入回复内容', 'warning');
            return;
        }

        const posts = Storage.getPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
            if (!post.replies) post.replies = [];
            post.replies.push({
                username,
                content: replyContent,
                time: '刚刚'
            });
            Storage.savePosts(posts);
            UI.showToast('✓ 回复成功', 'success');
            this.render();
        }
    }
};
