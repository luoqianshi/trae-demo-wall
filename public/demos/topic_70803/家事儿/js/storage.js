const Storage = {
    PREFIX: 'family_hub_v3_',

    getKey(key) {
        return this.PREFIX + key;
    },

    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(this.getKey(key));
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(this.getKey(key), JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    clearAll() {
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith(this.PREFIX));
            keys.forEach(k => localStorage.removeItem(k));
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    getMembers() {
        return this.get('members', []);
    },

    saveMembers(members) {
        return this.set('members', members);
    },

    addMember(member) {
        const members = this.getMembers();
        member.id = this.generateId();
        member.createdAt = Date.now();
        if (!member.fontSize) {
            member.fontSize = ['爷爷', '奶奶', '外公', '外婆'].includes(member.role) ? 'large' : 'normal';
        }
        members.push(member);
        this.saveMembers(members);
        return member;
    },

    updateMember(id, data) {
        const members = this.getMembers();
        const index = members.findIndex(m => m.id === id);
        if (index !== -1) {
            members[index] = { ...members[index], ...data };
            this.saveMembers(members);
            return members[index];
        }
        return null;
    },

    deleteMember(id) {
        const members = this.getMembers();
        const filtered = members.filter(m => m.id !== id);
        this.saveMembers(filtered);
        return true;
    },

    getCurrentMemberId() {
        return this.get('current_member_id', null);
    },

    setCurrentMemberId(id) {
        return this.set('current_member_id', id);
    },

    getCurrentMember() {
        const id = this.getCurrentMemberId();
        if (!id) return null;
        const members = this.getMembers();
        return members.find(m => m.id === id) || null;
    },

    getAlbums() {
        return this.get('albums', []);
    },

    saveAlbums(albums) {
        return this.set('albums', albums);
    },

    addAlbum(album) {
        const albums = this.getAlbums();
        album.id = this.generateId();
        album.createdAt = Date.now();
        albums.push(album);
        this.saveAlbums(albums);
        return album;
    },

    getPhotos(albumId = null) {
        const photos = this.get('photos', []);
        return albumId ? photos.filter(p => p.albumId === albumId) : photos;
    },

    savePhotos(photos) {
        return this.set('photos', photos);
    },

    addPhoto(photo) {
        const photos = this.getPhotos();
        photo.id = this.generateId();
        photo.likes = [];
        photo.createdAt = Date.now();
        photos.unshift(photo);
        this.savePhotos(photos);
        return photo;
    },

    togglePhotoLike(photoId, memberId) {
        const photos = this.getPhotos();
        const photo = photos.find(p => p.id === photoId);
        if (photo) {
            const idx = photo.likes.indexOf(memberId);
            if (idx === -1) {
                photo.likes.push(memberId);
            } else {
                photo.likes.splice(idx, 1);
            }
            this.savePhotos(photos);
        }
        return photo;
    },

    deletePhoto(photoId) {
        const photos = this.getPhotos();
        const filtered = photos.filter(p => p.id !== photoId);
        this.savePhotos(filtered);
        return true;
    },

    getBooks() {
        return this.get('books', []);
    },

    saveBooks(books) {
        return this.set('books', books);
    },

    addBook(book) {
        const books = this.getBooks();
        book.id = this.generateId();
        book.createdAt = Date.now();
        book.status = book.status || 'want';
        books.push(book);
        this.saveBooks(books);
        return book;
    },

    updateBook(id, data) {
        const books = this.getBooks();
        const index = books.findIndex(b => b.id === id);
        if (index !== -1) {
            books[index] = { ...books[index], ...data };
            this.saveBooks(books);
            return books[index];
        }
        return null;
    },

    deleteBook(id) {
        const books = this.getBooks();
        const filtered = books.filter(b => b.id !== id);
        this.saveBooks(filtered);
        return true;
    },

    getShoppingItems() {
        return this.get('shopping_items', []);
    },

    saveShoppingItems(items) {
        return this.set('shopping_items', items);
    },

    addShoppingItem(item) {
        const items = this.getShoppingItems();
        item.id = this.generateId();
        item.createdAt = Date.now();
        item.status = item.status || 'want';
        item.priority = item.priority || 'medium';
        items.push(item);
        this.saveShoppingItems(items);
        return item;
    },

    updateShoppingItem(id, data) {
        const items = this.getShoppingItems();
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...data };
            if (data.status === 'bought' && !items[index].boughtAt) {
                items[index].boughtAt = Date.now();
            }
            this.saveShoppingItems(items);
            return items[index];
        }
        return null;
    },

    deleteShoppingItem(id) {
        const items = this.getShoppingItems();
        const filtered = items.filter(i => i.id !== id);
        this.saveShoppingItems(filtered);
        return true;
    },

    getTodos(date = null) {
        const todos = this.get('todos', []);
        if (date) {
            return todos.filter(t => t.date === date);
        }
        return todos;
    },

    saveTodos(todos) {
        return this.set('todos', todos);
    },

    addTodo(todo) {
        const todos = this.getTodos();
        todo.id = this.generateId();
        todo.completed = todo.completed !== undefined ? todo.completed : false;
        todo.createdAt = todo.createdAt || Date.now();
        if (!todo.date) {
            todo.date = new Date().toISOString().split('T')[0];
        }
        todos.push(todo);
        this.saveTodos(todos);
        return todo;
    },

    updateTodo(id, data) {
        const todos = this.getTodos();
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
            todos[index] = { ...todos[index], ...data };
            if (data.completed && !todos[index].completedAt) {
                todos[index].completedAt = Date.now();
            }
            this.saveTodos(todos);
            return todos[index];
        }
        return null;
    },

    toggleTodo(id) {
        const todos = this.getTodos();
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.completedAt = todo.completed ? Date.now() : null;
            this.saveTodos(todos);
            return todo;
        }
        return null;
    },

    deleteTodo(id) {
        const todos = this.getTodos();
        const filtered = todos.filter(t => t.id !== id);
        this.saveTodos(filtered);
        return true;
    },

    getTodayTodos() {
        const today = new Date().toISOString().split('T')[0];
        return this.getTodos(today).sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return b.createdAt - a.createdAt;
        });
    },

    getEvents() {
        return this.get('events', []);
    },

    saveEvents(events) {
        return this.set('events', events);
    },

    addEvent(event) {
        const events = this.getEvents();
        event.id = this.generateId();
        event.createdAt = Date.now();
        event.repeatYearly = event.repeatYearly !== false;
        event.remindDaysBefore = event.remindDaysBefore || 3;
        events.push(event);
        this.saveEvents(events);
        return event;
    },

    updateEvent(id, data) {
        const events = this.getEvents();
        const index = events.findIndex(e => e.id === id);
        if (index !== -1) {
            events[index] = { ...events[index], ...data };
            this.saveEvents(events);
            return events[index];
        }
        return null;
    },

    deleteEvent(id) {
        const events = this.getEvents();
        const filtered = events.filter(e => e.id !== id);
        this.saveEvents(filtered);
        return true;
    },

    getMoments() {
        return this.get('moments', []).sort((a, b) => b.createdAt - a.createdAt);
    },

    saveMoments(moments) {
        return this.set('moments', moments);
    },

    addMoment(moment) {
        const moments = this.getMoments();
        moment.id = this.generateId();
        moment.likes = moment.likes || [];
        moment.comments = moment.comments || [];
        moment.readBy = moment.readBy || [];
        moment.createdAt = moment.createdAt || Date.now();
        moments.unshift(moment);
        this.saveMoments(moments);
        return moment;
    },

    toggleMomentLike(momentId, memberId) {
        const moments = this.getMoments();
        const moment = moments.find(m => m.id === momentId);
        if (moment) {
            const idx = moment.likes.indexOf(memberId);
            if (idx === -1) {
                moment.likes.push(memberId);
            } else {
                moment.likes.splice(idx, 1);
            }
            this.saveMoments(moments);
        }
        return moment;
    },

    addMomentComment(momentId, memberId, content) {
        const moments = this.getMoments();
        const moment = moments.find(m => m.id === momentId);
        if (moment) {
            const comment = {
                id: this.generateId(),
                memberId,
                content,
                createdAt: Date.now()
            };
            moment.comments.push(comment);
            this.saveMoments(moments);
            return comment;
        }
        return null;
    },

    markMomentRead(momentId, memberId) {
        const moments = this.getMoments();
        const moment = moments.find(m => m.id === momentId);
        if (moment && !moment.readBy.includes(memberId)) {
            moment.readBy.push(memberId);
            this.saveMoments(moments);
        }
        return moment;
    },

    deleteMoment(id) {
        const moments = this.getMoments();
        const filtered = moments.filter(m => m.id !== id);
        this.saveMoments(filtered);
        return true;
    },

    exportData() {
        return {
            members: this.getMembers(),
            albums: this.getAlbums(),
            photos: this.getPhotos(),
            books: this.getBooks(),
            shoppingItems: this.getShoppingItems(),
            todos: this.getTodos(),
            events: this.getEvents(),
            moments: this.getMoments(),
            exportTime: new Date().toISOString()
        };
    }
};
