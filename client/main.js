const { app, BrowserWindow } = require('electron');

function createWindow () {
  // 创建浏览器窗口
  let win = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    }
  });
  // 加载index.html文件
  win.loadFile(process.resourcesPath+'/index.html');
  // win.loadURL('http://localhost:8088/index.html');
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'; // 关闭ELECTRON警告
