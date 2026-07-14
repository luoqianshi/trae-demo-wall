const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const { initDB, Notes, Tags, ScanHistory, inferTag, extractTitle } = require('./database');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.get('/api/notes', (req, res) => {
    const { tag, time, search } = req.query;

    if (search) {
        Notes.search(search, (err, notes) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(notes);
        });
        return;
    }

    if (tag && tag !== 'all') {
        Notes.getByTag(tag, (err, notes) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(notes);
        });
        return;
    }

    if (time && time !== 'all') {
        if (time === 'today') {
            const today = new Date();
            const startDate = today.toISOString().split('T')[0] + ' 00:00:00';
            const endDate = today.toISOString().split('T')[0] + ' 23:59:59';
            Notes.getByTimeRange(startDate, endDate, (err, notes) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(notes);
            });
        } else if (time === 'week') {
            const endDate = new Date();
            const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            Notes.getByTimeRange(
                startDate.toISOString().split('T')[0] + ' 00:00:00',
                endDate.toISOString().split('T')[0] + ' 23:59:59',
                (err, notes) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json(notes);
                }
            );
        } else {
            Notes.getAll((err, notes) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(notes);
            });
        }
        return;
    }

    Notes.getAll((err, notes) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(notes);
    });
});

app.get('/api/notes/:id', (req, res) => {
    Notes.getById(parseInt(req.params.id), (err, note) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!note) return res.status(404).json({ error: '笔记不存在' });
        res.json(note);
    });
});

app.delete('/api/notes/:id', (req, res) => {
    Notes.deleteById(parseInt(req.params.id), (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/notes/scan', (req, res) => {
    const { directory } = req.body;

    if (!directory) {
        return res.status(400).json({ error: '请提供目录路径' });
    }

    try {
        const notes = scanDirectory(directory);
        const scanTime = new Date().toISOString();

        notes.forEach(note => {
            Notes.createOrUpdate({
                title: note.title,
                content: note.content,
                tag: note.tag,
                filePath: note.filePath,
                size: note.size,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
                scanTime: scanTime
            });
        });

        ScanHistory.add(directory, notes.length, () => {});

        res.json({
            success: true,
            count: notes.length,
            notes: notes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/stats', (req, res) => {
    Notes.getStats((err, stats) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(stats);
    });
});

app.get('/api/tags', (req, res) => {
    Notes.getTags((err, tags) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(tags);
    });
});

app.delete('/api/notes', (req, res) => {
    Notes.clearAll((err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.put('/api/notes/:id', (req, res) => {
    const { title, content, tag } = req.body;
    Notes.update(parseInt(req.params.id), { title, content, tag }, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/notes/:id/favorite', (req, res) => {
    Notes.toggleFavorite(parseInt(req.params.id), (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/notes/favorites', (req, res) => {
    Notes.getFavorites((err, notes) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(notes);
    });
});

app.delete('/api/notes/batch', (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: '请提供要删除的笔记ID列表' });
    }
    Notes.batchDelete(ids, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, count: ids.length });
    });
});

app.get('/api/notes/export', (req, res) => {
    const { format } = req.query;
    
    Notes.getAll((err, notes) => {
        if (err) return res.status(500).json({ error: err.message });
        
        let content, contentType, filename;
        
        if (format === 'json') {
            content = JSON.stringify(notes, null, 2);
            contentType = 'application/json';
            filename = 'learnnote-export.json';
        } else {
            content = notes.map(note => `# ${note.title}\n\n**标签**: ${note.tag}\n**创建时间**: ${note.created_at}\n\n${note.content}\n\n---\n`).join('\n');
            contentType = 'text/markdown';
            filename = 'learnnote-export.md';
        }
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
    });
});

app.put('/api/notes/:id/tag', (req, res) => {
    const { tag } = req.body;
    if (!tag) {
        return res.status(400).json({ error: '请提供标签名称' });
    }
    Notes.update(parseInt(req.params.id), { tag }, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/tags', (req, res) => {
    const { name, color } = req.body;
    if (!name) {
        return res.status(400).json({ error: '请提供标签名称' });
    }
    Tags.add(name, color, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/tags/:name', (req, res) => {
    Tags.delete(req.params.name, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.put('/api/tags/:name', (req, res) => {
    const { newName, color } = req.body;
    if (!newName) {
        return res.status(400).json({ error: '请提供新的标签名称' });
    }
    Tags.update(req.params.name, newName, color, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/notes/upload', (req, res) => {
    const form = new formidable.IncomingForm({
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024
    });

    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const noteFiles = Array.isArray(files.notes) ? files.notes : (files.notes ? [files.notes] : []);
        const notes = [];
        const scanTime = new Date().toISOString();
        const skippedFiles = [];

        noteFiles.forEach(file => {
            try {
                const ext = path.extname(file.originalFilename).toLowerCase();
                if (ext !== '.md' && ext !== '.markdown') {
                    skippedFiles.push(file.originalFilename);
                    return;
                }

                const content = fs.readFileSync(file.filepath, 'utf-8');
                const title = extractTitle(content) || path.basename(file.originalFilename, path.extname(file.originalFilename));
                const tag = inferTag(file.originalFilename, content);

                notes.push({
                    title: title,
                    content: content,
                    tag: tag,
                    filePath: file.originalFilename,
                    size: file.size,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    scanTime: scanTime
                });
            } catch (e) {
                console.error('读取文件失败:', file.originalFilename, e.message);
            }
        });

        notes.forEach(note => {
            Notes.createOrUpdate(note, () => {});
        });

        res.json({
            success: true,
            count: notes.length,
            skipped: skippedFiles.length,
            skippedFiles: skippedFiles,
            notes: notes
        });
    });
});

function scanDirectory(dir) {
    const notes = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && !file.startsWith('.') && !file.startsWith('_')) {
                notes.push(...scanDirectory(filePath));
            }
        } else if (file.toLowerCase() === 'readme.md') {
            const content = fs.readFileSync(filePath, 'utf-8');
            const title = extractTitle(content) || path.basename(path.dirname(filePath));
            const tag = inferTag(filePath, content);

            notes.push({
                title: title,
                content: content,
                tag: tag,
                filePath: filePath,
                size: stat.size,
                createdAt: stat.birthtime.toISOString(),
                updatedAt: stat.mtime.toISOString()
            });
        }
    }

    return notes;
}

async function startServer() {
    await initDB();
    app.listen(port, () => {
        console.log(`📚 LearnNote 服务已启动`);
        console.log(`📍 访问地址: http://localhost:${port}`);
    });
}

startServer();