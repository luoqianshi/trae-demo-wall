const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: '学智云学习平台',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'icon.ico')
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    const menu = Menu.buildFromTemplate([
        {
            label: '文件',
            submenu: [
                {
                    label: '刷新',
                    accelerator: 'F5',
                    click: () => {
                        mainWindow.reload();
                    }
                },
                {
                    label: '退出',
                    accelerator: 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: '查看',
            submenu: [
                {
                    label: '开发者工具',
                    accelerator: 'Ctrl+Shift+I',
                    click: () => {
                        mainWindow.webContents.openDevTools();
                    }
                },
                {
                    label: '全屏',
                    accelerator: 'F11',
                    click: () => {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '关于',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox({
                            title: '关于学智云学习平台',
                            message: '学智云学习平台 v3.0\n\n面向1-9年级学生的在线学习平台\n包含题库练习、视频课程、AI辅导等功能',
                            type: 'info'
                        });
                    }
                }
            ]
        }
    ]);

    Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});