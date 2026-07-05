const AlbumModule = {
    currentAlbumId: null,
    pendingPhotos: [],

    render() {
        const container = document.getElementById('page-album');
        const albums = Storage.getAlbums();
        const allPhotos = Storage.getPhotos();

        container.innerHTML = `
            <div id="albumListView">
                <div class="card">
                    <div class="card-title">
                        全部照片
                        <span class="more" onclick="AlbumModule.openCreateAlbumModal()">+ 新建相册</span>
                    </div>
                    <div class="photo-grid">
                        ${allPhotos.slice(0, 9).map(photo => `<div class="photo-item" onclick="App.viewImage('${photo.url}')"><img src="${photo.url}"></div>`).join('')}
                        ${allPhotos.length === 0 ? '<div style="grid-column:1/-1;text-align:center;padding:var(--spacing-xxl) 0;color:var(--text-hint)"><div style="font-size:48px;opacity:0.5;margin-bottom:var(--spacing-md)">📷</div>还没有照片，快去上传吧</div>' : ''}
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">我的相册</div>
                    ${albums.length === 0 ? `
                        <div class="empty-state" style="padding:var(--spacing-lg) 0">
                            <div class="empty-text">还没有创建相册</div>
                            <button class="btn btn-primary" onclick="AlbumModule.openCreateAlbumModal()">创建相册</button>
                        </div>
                    ` : `
                        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--spacing-md)">
                            ${albums.map(album => {
                                const photos = Storage.getPhotos(album.id);
                                const cover = photos.length > 0 ? photos[0].url : '';
                                return `
                                    <div onclick="AlbumModule.openAlbum('${album.id}')" style="cursor:pointer">
                                        <div style="aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:var(--bg-color);margin-bottom:var(--spacing-sm);position:relative">
                                            ${cover ? `<img src="${cover}" style="width:100%;height:100%;object-fit:cover">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;opacity:0.3">📁</div>`}
                                            <div style="position:absolute;bottom:0;left:0;right:0;padding:var(--spacing-sm);background:linear-gradient(transparent,rgba(0,0,0,0.5));color:white;font-size:var(--font-xs)">
                                                ${photos.length} 张
                                            </div>
                                        </div>
                                        <div style="font-size:var(--font-md);font-weight:500;text-align:center">${App.escapeHtml(album.name)}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
            </div>

            <div id="albumDetailView" style="display:none">
                <div class="back-btn" onclick="AlbumModule.backToList()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                    返回相册列表
                </div>
                <div class="card" style="padding:0;overflow:hidden">
                    <div style="padding:var(--spacing-lg);border-bottom:1px solid var(--border-color)">
                        <div style="font-size:var(--font-lg);font-weight:600;margin-bottom:var(--spacing-xs)" id="albumDetailName"></div>
                        <div style="display:flex;gap:var(--spacing-sm)">
                            <button class="btn btn-sm btn-primary" onclick="AlbumModule.openUploadModal()">📤 上传照片</button>
                            <button class="btn btn-sm btn-outline" onclick="AlbumModule.deleteAlbum()">删除相册</button>
                        </div>
                    </div>
                    <div style="padding:var(--spacing-lg)">
                        <div class="photo-grid" id="albumPhotoGrid"></div>
                    </div>
                </div>
            </div>

            <button class="fab" onclick="AlbumModule.openUploadModal()">📷</button>
        `;

        this.currentAlbumId = null;
        document.getElementById('albumListView').style.display = 'block';
        document.getElementById('albumDetailView').style.display = 'none';
        App.updateHeader('家庭相册');
    },

    backToList() {
        this.render();
    },

    openAlbum(albumId) {
        this.currentAlbumId = albumId;
        const albums = Storage.getAlbums();
        const album = albums.find(a => a.id === albumId);
        if (!album) return;

        const photos = Storage.getPhotos(albumId);
        document.getElementById('albumDetailName').textContent = album.name;
        const grid = document.getElementById('albumPhotoGrid');

        grid.innerHTML = photos.length === 0 ? 
            '<div style="grid-column:1/-1;text-align:center;padding:var(--spacing-xxl) 0;color:var(--text-hint)"><div style="font-size:48px;opacity:0.5;margin-bottom:var(--spacing-md)">📭</div>相册是空的</div>' :
            photos.map(photo => `
                <div class="photo-item" style="position:relative">
                    <img src="${photo.url}" onclick="App.viewImage('${photo.url}')">
                    <div style="position:absolute;top:var(--spacing-xs);right:var(--spacing-xs);background:rgba(0,0,0,0.5);color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;z-index:10" onclick="event.stopPropagation();AlbumModule.deletePhoto('${photo.id}')">×</div>
                </div>
            `).join('');

        document.getElementById('albumListView').style.display = 'none';
        document.getElementById('albumDetailView').style.display = 'block';
        App.updateHeader(album.name);
    },

    deleteAlbum() {
        if (!this.currentAlbumId) return;
        if (confirm('确定删除这个相册吗？相册里的照片也会被删除。')) {
            const photos = Storage.getPhotos(this.currentAlbumId);
            photos.forEach(p => Storage.deletePhoto(p.id));
            const albums = Storage.getAlbums().filter(a => a.id !== this.currentAlbumId);
            Storage.saveAlbums(albums);
            this.render();
            App.showToast('相册已删除');
        }
    },

    deletePhoto(photoId) {
        if (confirm('确定删除这张照片吗？')) {
            Storage.deletePhoto(photoId);
            this.openAlbum(this.currentAlbumId);
            App.showToast('照片已删除');
        }
    },

    openCreateAlbumModal() {
        const html = `
            <div class="modal-header">
                <div class="modal-title">新建相册</div>
                <div class="modal-close" onclick="App.closeModal()">×</div>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label class="input-label">相册名称</label>
                    <input class="input" id="albumName" placeholder="例如：宝宝成长" autofocus>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-block" onclick="AlbumModule.saveAlbum()">创建</button>
            </div>
        `;
        App.showModal(html);
        setTimeout(() => document.getElementById('albumName').focus(), 100);
    },

    saveAlbum() {
        const name = document.getElementById('albumName').value.trim();
        if (!name) {
            App.showToast('请输入相册名称');
            return;
        }
        const album = Storage.addAlbum({ name, cover: '' });
        App.closeModal();
        App.showToast('相册创建成功');
        this.openAlbum(album.id);
    },

    openUploadModal() {
        const albums = Storage.getAlbums();
        if (albums.length === 0) {
            if (confirm('还没有相册，先创建一个相册吧？')) {
                this.openCreateAlbumModal();
            }
            return;
        }

        const html = `
            <div class="modal-header">
                <div class="modal-title">上传照片</div>
                <div class="modal-close" onclick="App.closeModal()">×</div>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label class="input-label">选择相册</label>
                    <select class="select" id="uploadAlbum">
                        ${albums.map(a => `<option value="${a.id}" ${this.currentAlbumId === a.id ? 'selected' : ''}>${App.escapeHtml(a.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="input-group">
                    <label class="input-label">选择照片</label>
                    <input type="file" id="photoFiles" accept="image/*" multiple style="display:none" onchange="AlbumModule.previewPhotos(this.files)">
                    <button class="btn btn-secondary btn-block" onclick="document.getElementById('photoFiles').click()">📷 选择照片</button>
                    <div id="photoPreviewList" style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--spacing-sm);margin-top:var(--spacing-md)"></div>
                </div>
                <div class="input-group">
                    <label class="input-label">描述（选填）</label>
                    <input class="input" id="photoDesc" placeholder="说点什么...">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-block" onclick="AlbumModule.savePhotos()">上传</button>
            </div>
        `;
        App.showModal(html);
        this.pendingPhotos = [];
    },

    previewPhotos(files) {
        const preview = document.getElementById('photoPreviewList');
        Array.from(files).slice(0, 9).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.pendingPhotos.push(e.target.result);
                preview.innerHTML = this.pendingPhotos.map(src => `<img src="${src}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--radius-sm)">`).join('');
            };
            reader.readAsDataURL(file);
        });
    },

    savePhotos() {
        const albumId = document.getElementById('uploadAlbum').value;
        const desc = document.getElementById('photoDesc').value.trim();
        const currentMember = App.currentMember;

        if (this.pendingPhotos.length === 0) {
            App.showToast('请选择照片');
            return;
        }

        this.pendingPhotos.forEach(url => {
            Storage.addPhoto({
                albumId,
                url,
                description: desc,
                uploadedBy: currentMember ? currentMember.id : null
            });
        });

        App.closeModal();
        App.showToast(`成功上传${this.pendingPhotos.length}张照片`);
        this.pendingPhotos = [];
        if (this.currentAlbumId) {
            this.openAlbum(this.currentAlbumId);
        } else {
            this.render();
        }
    }
};

App.registerModule('album', AlbumModule);