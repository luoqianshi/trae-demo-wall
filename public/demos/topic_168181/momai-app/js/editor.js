// 墨脉 MoMai - 编辑器模块
// 包含笔记编辑逻辑：selectNote, createNewNote, block操作, filteredNotes, 文件夹管理
window.MoMaiModules = window.MoMaiModules || {};
window.MoMaiModules.editor = function(Vue, deps) {
    const { ref, computed, nextTick } = Vue;
    const {
        notes, activeNoteId, activeFolder,
        javaFolders, customFolders, isAddingFolder, newFolderName, newFolderInput,
        addingFolderParentId, expandedFolders, folderContextMenu,
        selectedBigTag, selectedSubTags,
        bigTags, subTagsMap,
        codeTemplates, codeLanguages,
        filteredSubTags
    } = deps;

    // 使用占位符，后续由 app.js 注入
    let _refreshGraphSoon = () => {};
    let _togglePlugin = () => {};

    // 设置回调
    const setRefreshGraphSoon = (fn) => { _refreshGraphSoon = fn; };
    const setTogglePlugin = (fn) => { _togglePlugin = fn; };

    const folderMatches = (note, folderId) => {
        if (folderId === 'all') return true;
        const noteFolder = note.folder || '';
        if (noteFolder === folderId) return true;
        // Support parent folder matching (e.g., 'java' matches 'java/basic', 'java/se')
        if (noteFolder.startsWith(folderId + '/')) return true;
        return false;
    };

    const getDescendantFolderIds = (folderId) => {
        const ids = [folderId];
        const stack = [folderId];
        while (stack.length) {
            const current = stack.pop();
            customFolders.value.forEach(f => {
                if (f.parentId === current) {
                    ids.push(f.id);
                    stack.push(f.id);
                }
            });
        }
        return ids;
    };

    const childFoldersOf = (parentId) => {
        return customFolders.value.filter(f => f.parentId === parentId);
    };

    const rootCustomFolders = computed(() => {
        return customFolders.value.filter(f => !f.parentId);
    });

    const toggleFolderExpand = (folderId) => {
        expandedFolders.value[folderId] = !expandedFolders.value[folderId];
    };

    const javaNoteCount = computed(() => notes.value.filter(note => folderMatches(note, 'java')).length);

    const noteCountByFolder = (folderId) => {
        return notes.value.filter(note => folderMatches(note, folderId)).length;
    };

    const activeFolderTitle = computed(() => {
        if (activeFolder.value === 'all') return '全部笔记';
        if (activeFolder.value === 'java') return 'Java 笔记';
        const javaFolder = javaFolders.find(folder => folder.id === activeFolder.value);
        if (javaFolder) return javaFolder.title;
        const customFolder = customFolders.value.find(folder => folder.id === activeFolder.value);
        if (customFolder) return customFolder.title;
        return '当前笔记';
    });

    const folderLevelOf = (folderId) => {
        const folder = customFolders.value.find(f => f.id === folderId);
        if (!folder) return 0;
        return folder.level || 1;
    };

    const sortByCreatedAt = (list) => {
        return [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    };

    const formatNoteTime = (timestamp) => {
        if (!timestamp) return '未知时间';
        const date = new Date(timestamp);
        const pad = (num) => String(num).padStart(2, '0');
        return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const stripHtml = (html = '') => {
        const div = document.createElement('div');
        div.innerHTML = html;
        return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
    };

    const notePreviewText = (note) => {
        const text = (note.blocks || [])
            .map(block => stripHtml(block.content || ''))
            .filter(Boolean)
            .join(' ');
        return text || '暂无正文内容';
    };

    const selectFolder = (folderId) => {
        closeFolderContextMenu();
        activeFolder.value = folderId;
        selectedBigTag.value = '';
        selectedSubTags.value = [];
        const firstNote = sortByCreatedAt(notes.value.filter(note => folderMatches(note, folderId)))[0];
        if (firstNote) {
            activeNoteId.value = firstNote.id;
        }
        _refreshGraphSoon();
    };

    const selectNote = (noteId) => {
        activeNoteId.value = noteId;
        if (activeFolder.value === 'all') {
            const note = notes.value.find(n => n.id === noteId);
            if (note && note.folder) {
                activeFolder.value = note.folder;
            }
        }
        _refreshGraphSoon();
    };

    const selectAllNotes = () => {
        selectFolder('all');
    };

    const makeFolderId = (name) => {
        return 'custom/' + name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\u4e00-\u9fa5-]/g, '') + '-' + Date.now().toString(36);
    };

    const startAddingFolder = (parentId = null) => {
        closeFolderContextMenu();
        addingFolderParentId.value = parentId;
        isAddingFolder.value = true;
        newFolderName.value = '';
        if (parentId) {
            expandedFolders.value[parentId] = true;
        }
        nextTick(() => {
            const input = document.querySelector('[data-new-folder-input="true"]');
            if (input && typeof input.focus === 'function') {
                input.focus();
            }
        });
    };

    const cancelAddFolder = () => {
        isAddingFolder.value = false;
        newFolderName.value = '';
        addingFolderParentId.value = null;
    };

    const confirmAddFolder = () => {
        const name = newFolderName.value;
        if (!name || !name.trim()) return;
        const parentId = addingFolderParentId.value;
        const parentLevel = parentId ? folderLevelOf(parentId) : 0;
        if (parentLevel >= 3) {
            // 已到第 3 层，不允许再嵌套
            cancelAddFolder();
            return;
        }
        const folder = {
            id: makeFolderId(name),
            title: name.trim(),
            parentId: parentId,
            level: parentLevel + 1,
            createdAt: Date.now()
        };
        customFolders.value.unshift(folder);
        if (parentId) {
            expandedFolders.value[parentId] = true;
        }
        isAddingFolder.value = false;
        newFolderName.value = '';
        addingFolderParentId.value = null;
        selectFolder(folder.id);
    };

    const isCustomFolder = (folderId) => {
        return customFolders.value.some(folder => folder.id === folderId);
    };

    const openFolderContextMenu = (event, folderId = null) => {
        event.preventDefault();
        isAddingFolder.value = false;
        newFolderName.value = '';
        addingFolderParentId.value = null;
        folderContextMenu.value = {
            visible: true,
            x: Math.min(event.clientX, window.innerWidth - 150),
            y: Math.min(event.clientY, window.innerHeight - 120),
            targetFolderId: folderId
        };
    };

    const closeFolderContextMenu = () => {
        folderContextMenu.value.visible = false;
    };

    const canAddFolderFromContext = () => {
        const targetId = folderContextMenu.value.targetFolderId;
        if (!targetId) return true;
        return isCustomFolder(targetId) && folderLevelOf(targetId) < 3;
    };

    const contextFolderActionLabel = () => {
        const targetId = folderContextMenu.value.targetFolderId;
        if (!targetId) return '添加大目录';
        const nextLevel = folderLevelOf(targetId) + 1;
        if (nextLevel === 2) return '添加子目录';
        if (nextLevel === 3) return '添加孙目录';
        return '添加目录';
    };

    const addFolderFromContextMenu = () => {
        const targetId = folderContextMenu.value.targetFolderId;
        if (!canAddFolderFromContext()) {
            closeFolderContextMenu();
            return;
        }
        startAddingFolder(targetId || null);
    };

    const createNoteFromContextMenu = () => {
        const targetId = folderContextMenu.value.targetFolderId;
        closeFolderContextMenu();
        createNewNote(targetId || activeFolder.value);
    };

    // Filter notes based on folder and tags
    const filteredNotes = computed(() => {
        const list = notes.value.filter(note => {
            if (!folderMatches(note, activeFolder.value)) {
                return false;
            }
            if (selectedBigTag.value && note.category !== selectedBigTag.value) {
                return false;
            }
            if (selectedSubTags.value.length > 0) {
                const match = note.tags.some(t => selectedSubTags.value.includes(t));
                if (!match) return false;
            }
            return true;
        });
        return sortByCreatedAt(list);
    });

    const activeNote = computed(() => {
        return notes.value.find(n => n.id === activeNoteId.value) || notes.value[0];
    });

    // Slash menu tracking state
    const slashMenu = ref({
        visible: false,
        top: 0,
        left: 0,
        activeBlockIdx: -1,
        currentText: ''
    });

    const slashMenuItems = [
        { type: 'h1', icon: '📝', title: '一级大标题', desc: '用于创建国风核心主标题' },
        { type: 'h2', icon: '🧱', title: '二级小标题', desc: '用于划分二级文章段落' },
        { type: 'todo', icon: '✅', title: '待办任务', desc: '实时记录并勾选心流进度' },
        { type: 'code', icon: '💻', title: '开发者沙箱', desc: '提供HTML/JS代码片段呈现' },
        { type: 'callout', icon: '💡', title: '中式高亮块', desc: '对重点创意思路进行高亮渲染' }
    ];

    // Block Operations
    const onBlockInput = (event, idx) => {
        const text = event.target.innerText;

        // Slash menu pop up tracking
        if (text.endsWith('/')) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                const container = event.target.getBoundingClientRect();

                slashMenu.value.visible = true;
                // Calculate absolute positioning in scroll container
                slashMenu.value.top = rect.bottom - container.top + event.target.offsetTop + 10;
                slashMenu.value.left = rect.left - container.left + event.target.offsetLeft;
                slashMenu.value.activeBlockIdx = idx;
                slashMenu.value.currentText = text;
            }
        } else {
            slashMenu.value.visible = false;
            slashMenu.value.currentText = '';
        }
    };

    const insertBlockType = (type) => {
        const idx = slashMenu.value.activeBlockIdx;
        if (idx !== -1) {
            // Remove the "/"
            let text = slashMenu.value.currentText || '';
            if (text.endsWith('/')) {
                text = text.substring(0, text.length - 1);
            }
            activeNote.value.blocks[idx].content = text;
            activeNote.value.blocks[idx].type = type;
            if (type === 'todo') {
                activeNote.value.blocks[idx].checked = false;
            }
            if (type === 'code') {
                activeNote.value.blocks[idx].language = 'javascript';
                activeNote.value.blocks[idx].isTemplate = !text.trim();
                if (!text.trim()) {
                    activeNote.value.blocks[idx].content = codeTemplates.javascript;
                }
            }
        }
        slashMenu.value.visible = false;
    };

    const onBlockKeydown = (event, idx) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            slashMenu.value.visible = false;
            activeNote.value.blocks[idx].content = event.target.innerHTML;
            // Insert new paragraph block
            const newBlock = { id: 'b_new_' + Date.now(), type: 'paragraph', content: '' };
            activeNote.value.blocks.splice(idx + 1, 0, newBlock);

            nextTick(() => {
                const blocks = document.querySelectorAll('[contenteditable="true"]');
                if (blocks[idx + 1]) {
                    blocks[idx + 1].focus();
                }
            });
        } else if (event.key === 'Backspace' && event.target.innerText.trim() === '') {
            if (activeNote.value.blocks.length > 1) {
                event.preventDefault();
                activeNote.value.blocks.splice(idx, 1);
                nextTick(() => {
                    const blocks = document.querySelectorAll('[contenteditable="true"]');
                    if (blocks[idx - 1]) {
                        blocks[idx - 1].focus();
                        // move cursor to end
                        const range = document.createRange();
                        const sel = window.getSelection();
                        range.selectNodeContents(blocks[idx - 1]);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                });
            }
        }
    };

    const onBlockBlur = (event, idx) => {
        const block = activeNote.value.blocks[idx];
        if (block.type === 'code') {
            block.content = event.target.innerText;
            block.isTemplate = false;
        } else {
            block.content = event.target.innerHTML;
        }
        // Auto close slash menu with minor delay to allow clicks
        setTimeout(() => {
            slashMenu.value.visible = false;
        }, 200);
    };

    const applyCodeLanguage = (block) => {
        if (!block.language) {
            block.language = 'javascript';
        }
        const current = (block.content || '').trim();
        if (!current || block.isTemplate) {
            block.content = codeTemplates[block.language] || codeTemplates.javascript;
            block.isTemplate = true;
        }
    };

    const moveBlock = (idx, dir) => {
        if (idx + dir < 0 || idx + dir >= activeNote.value.blocks.length) return;
        const temp = activeNote.value.blocks[idx];
        activeNote.value.blocks[idx] = activeNote.value.blocks[idx + dir];
        activeNote.value.blocks[idx + dir] = temp;
    };

    const deleteBlock = (idx) => {
        if (activeNote.value.blocks.length > 1) {
            activeNote.value.blocks.splice(idx, 1);
        }
    };

    const noteDraft = ref({
        visible: false,
        title: '',
        icon: '✨',
        targetFolder: null,
        bigTag: '',
        subTags: [],
        newBigTagText: '',
        newTagText: '',
        newIconText: ''
    });

    // 笔记图标库（与已有笔记前缀风格一致）
    const iconPalette = ref(['🖥️', '🧩', '🧺', '📘', '☕', '🔌', '🕸️', '🧱', '✨', '📝', '🏷️', '🎨', '🚀', '💡', '📌']);

    const draftAvailableSubTags = computed(() => {
        if (noteDraft.value.bigTag) {
            return subTagsMap.value[noteDraft.value.bigTag] || [];
        }
        return [];
    });

    const openNoteDraft = (targetFolder = null) => {
        closeFolderContextMenu();
        const target = targetFolder || activeFolder.value;
        const isJavaFolder = (target || '').startsWith('java');
        noteDraft.value = {
            visible: true,
            title: '',
            icon: '✨',
            targetFolder: target,
            bigTag: selectedBigTag.value || (isJavaFolder && bigTags.value.includes('编程学习') ? '编程学习' : (bigTags.value[0] || '')),
            subTags: [],
            newBigTagText: '',
            newTagText: '',
            newIconText: ''
        };
    };

    const closeNoteDraft = () => {
        noteDraft.value.visible = false;
    };

    const selectDraftBigTag = (tag) => {
        if (noteDraft.value.bigTag === tag) return;
        noteDraft.value.bigTag = tag;
        noteDraft.value.subTags = [];
    };

    // ---- 笔记图标管理 ----
    const selectDraftIcon = (icon) => {
        noteDraft.value.icon = icon;
    };
    const addDraftNewIcon = () => {
        const ic = (noteDraft.value.newIconText || '').trim();
        if (!ic) return;
        if (!iconPalette.value.includes(ic)) {
            iconPalette.value.push(ic);
        }
        noteDraft.value.icon = ic;
        noteDraft.value.newIconText = '';
    };
    const removeIconFromPalette = (icon) => {
        const idx = iconPalette.value.indexOf(icon);
        if (idx > -1) iconPalette.value.splice(idx, 1);
        if (noteDraft.value.icon === icon) {
            noteDraft.value.icon = iconPalette.value[0] || '✨';
        }
    };

    const addDraftNewBigTag = () => {
        const name = (noteDraft.value.newBigTagText || '').trim();
        if (!name) return;
        if (!bigTags.value.includes(name)) {
            bigTags.value.push(name);
        }
        if (!subTagsMap.value[name]) {
            subTagsMap.value[name] = [];
        }
        noteDraft.value.bigTag = name;
        noteDraft.value.subTags = [];
        noteDraft.value.newBigTagText = '';
    };

    const removeDraftBigTag = (tag) => {
        const idx = bigTags.value.indexOf(tag);
        if (idx > -1) bigTags.value.splice(idx, 1);
        delete subTagsMap.value[tag];
        notes.value.forEach(n => {
            if (n.category === tag) {
                n.category = '未分类';
            }
        });
        if (selectedBigTag.value === tag) {
            selectedBigTag.value = '';
            selectedSubTags.value = [];
        }
        if (noteDraft.value.bigTag === tag) {
            noteDraft.value.bigTag = bigTags.value[0] || '';
            noteDraft.value.subTags = [];
        }
    };

    const toggleDraftSubTag = (sub) => {
        const list = noteDraft.value.subTags;
        const idx = list.indexOf(sub);
        if (idx > -1) list.splice(idx, 1);
        else list.push(sub);
    };

    const addDraftNewTag = () => {
        const name = (noteDraft.value.newTagText || '').trim();
        if (!name) return;
        const bigTag = noteDraft.value.bigTag;
        if (!bigTag) return;
        if (!subTagsMap.value[bigTag]) subTagsMap.value[bigTag] = [];
        if (!subTagsMap.value[bigTag].includes(name)) {
            subTagsMap.value[bigTag].push(name);
        }
        if (!noteDraft.value.subTags.includes(name)) {
            noteDraft.value.subTags.push(name);
        }
        noteDraft.value.newTagText = '';
    };

    const removeSubTagFromLibrary = (sub) => {
        const bigTag = noteDraft.value.bigTag;
        if (!bigTag) return;
        const list = subTagsMap.value[bigTag];
        if (!list) return;
        const idx = list.indexOf(sub);
        if (idx > -1) list.splice(idx, 1);
        const dIdx = noteDraft.value.subTags.indexOf(sub);
        if (dIdx > -1) noteDraft.value.subTags.splice(dIdx, 1);
        // 同步从已存在笔记里移除该标签
        notes.value.forEach(n => {
            if (Array.isArray(n.tags)) {
                const i = n.tags.indexOf(sub);
                if (i > -1) n.tags.splice(i, 1);
            }
        });
    };

    const removeTagFromActiveNote = (tag) => {
        if (!activeNote.value || !Array.isArray(activeNote.value.tags)) return;
        const idx = activeNote.value.tags.indexOf(tag);
        if (idx > -1) activeNote.value.tags.splice(idx, 1);
    };

    const confirmCreateNote = () => {
        const draft = noteDraft.value;
        const target = draft.targetFolder || activeFolder.value;
        const isJavaFolder = (target || '').startsWith('java');
        const folderId = target && target !== 'all' ? target : 'mm/new';
        const bigTag = draft.bigTag || (isJavaFolder && bigTags.value.includes('编程学习') ? '编程学习' : (bigTags.value[0] || '未分类'));
        const subTags = draft.subTags.length ? [...draft.subTags] : (isJavaFolder ? ['Java'] : ['双链交互']);
        const titleInput = (draft.title || '').trim();
        const icon = (draft.icon || '').trim();
        const baseTitle = titleInput || '新建空白墨脉笔记';
        const title = icon ? `${icon} ${baseTitle}` : baseTitle;
        const newId = 'note_' + Date.now();
        const newNote = {
            id: newId,
            title: title,
            category: bigTag,
            folder: folderId,
            createdAt: Date.now(),
            tags: subTags,
            blocks: [
                { id: 'bn_1_' + newId, type: 'h2', content: title },
                { id: 'bn_2_' + newId, type: 'paragraph', content: '点击开始在这里记录您的思绪...' }
            ]
        };
        notes.value.unshift(newNote);
        if (target && target !== 'all') {
            activeFolder.value = target;
        } else {
            selectedBigTag.value = '';
            selectedSubTags.value = [];
        }
        activeNoteId.value = newId;
        _refreshGraphSoon();
        closeNoteDraft();
    };

    const createNewNote = (targetFolder = null) => {
        openNoteDraft(targetFolder);
    };

    // Hierarchy tag operations
    const toggleBigTag = (tag) => {
        if (selectedBigTag.value === tag) {
            selectedBigTag.value = '';
        } else {
            selectedBigTag.value = tag;
        }
        selectedSubTags.value = [];
    };

    const toggleSubTag = (sub) => {
        const idx = selectedSubTags.value.indexOf(sub);
        if (idx > -1) {
            selectedSubTags.value.splice(idx, 1);
        } else {
            selectedSubTags.value.push(sub);
        }
    };

    const resetFilters = () => {
        selectedBigTag.value = '';
        selectedSubTags.value = [];
    };

    return {
        // 文件夹管理
        folderMatches,
        getDescendantFolderIds,
        childFoldersOf,
        rootCustomFolders,
        toggleFolderExpand,
        javaNoteCount,
        noteCountByFolder,
        activeFolderTitle,
        folderLevelOf,
        sortByCreatedAt,
        formatNoteTime,
        stripHtml,
        notePreviewText,
        selectFolder,
        selectAllNotes,
        makeFolderId,
        startAddingFolder,
        cancelAddFolder,
        confirmAddFolder,
        isCustomFolder,
        openFolderContextMenu,
        closeFolderContextMenu,
        canAddFolderFromContext,
        contextFolderActionLabel,
        addFolderFromContextMenu,
        createNoteFromContextMenu,

        // 笔记筛选与编辑
        filteredNotes,
        activeNote,
        selectNote,

        // Block 操作
        slashMenu,
        slashMenuItems,
        onBlockInput,
        insertBlockType,
        onBlockKeydown,
        onBlockBlur,
        applyCodeLanguage,
        moveBlock,
        deleteBlock,

        // 新建笔记
        noteDraft,
        iconPalette,
        draftAvailableSubTags,
        openNoteDraft,
        closeNoteDraft,
        selectDraftBigTag,
        selectDraftIcon,
        addDraftNewIcon,
        removeIconFromPalette,
        addDraftNewBigTag,
        removeDraftBigTag,
        toggleDraftSubTag,
        addDraftNewTag,
        removeSubTagFromLibrary,
        removeTagFromActiveNote,
        confirmCreateNote,
        createNewNote,

        // 标签操作
        toggleBigTag,
        toggleSubTag,
        resetFilters,

        // 回调设置
        setRefreshGraphSoon,
        setTogglePlugin
    };
};
