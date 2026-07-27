const { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage, session, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const { StorageService } = require('./services/storageService');
const { SettingsService } = require('./services/settingsService');
const { SnippetService } = require('./services/snippetService');
const { AIService } = require('./services/aiService');
const { CaptureService } = require('./services/captureService');
const { UpdaterService } = require('./services/updaterService');

const { registerSnippetsIPC } = require('./ipc/snippets');
const { registerSettingsIPC } = require('./ipc/settings');
const { registerAIIPC } = require('./ipc/ai');

// Crash logs configuration
process.on('uncaughtException', (error) => {
  fs.appendFileSync('crash.log', 'Uncaught Exception: ' + error.stack + '\n');
});
process.on('unhandledRejection', (reason, promise) => {
  fs.appendFileSync('crash.log', 'Unhandled Rejection: ' + reason + '\n');
});

// Single instance lock check
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    openDashboard();
  });
}

// Instantiate core modular services
const storageService = new StorageService();
const settingsService = new SettingsService(storageService);
const snippetService = new SnippetService(storageService);
const aiService = new AIService(storageService);
const captureService = new CaptureService();
const updaterService = new UpdaterService();

// Window instances
let tray = null;
let dashboardWindow = null;
let snipperWindow = null;

// Manager wrapper passed to IPC layers
const windowsManager = {
  closeSnipper: () => {
    if (snipperWindow) {
      snipperWindow.close();
      snipperWindow = null;
    }
  },
  notifyDashboard: (channel, data) => {
    if (dashboardWindow) {
      dashboardWindow.webContents.send(channel, data);
    }
  }
};

app.on('ready', () => {
  createTray();
  registerShortcuts();
  setupCSP();
  
  // Register modular IPC routes
  registerSnippetsIPC(snippetService, aiService, windowsManager);
  registerSettingsIPC(settingsService, windowsManager);
  registerAIIPC(aiService);
  
  // Start auto-updates
  updaterService.init();

  if (app.dock) app.dock.hide();
});

function setupCSP() {
  const isDev = !app.isPackaged;
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const connectSrc = isDev
      ? "connect-src 'self' data: ws: wss: http://localhost:3000 http://localhost:5173 https://generativelanguage.googleapis.com https://api.openai.com https://api.anthropic.com https://api.groq.com;"
      : "connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com https://api.anthropic.com https://api.groq.com;";
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' data: blob:;"
      : "script-src 'self';";
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          `default-src 'self' data: blob:; ` +
          `${scriptSrc} ` +
          `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ` +
          `font-src 'self' https://fonts.gstatic.com; ` +
          `img-src 'self' data: blob: https:; ` +
          `${connectSrc}`
        ]
      }
    });
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Take Snippet (Ctrl+Shift+C)', click: startSnipping },
    { label: 'Dashboard', click: openDashboard },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]);
  
  tray.setToolTip('CaptureFlow');
  tray.setContextMenu(contextMenu);
  tray.on('click', openDashboard);
}

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+C', startSnipping);
  globalShortcut.register('CommandOrControl+Shift+F', openDashboard);
}

async function startSnipping() {
  if (snipperWindow) {
    try {
      if (snipperWindow.isMinimized()) snipperWindow.restore();
      snipperWindow.focus();
    } catch (e) {}
    return;
  }

  try {
    const screenshotDataUrl = await captureService.capturePrimaryDisplay();
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: fullWidth, height: fullHeight } = primaryDisplay.bounds;

    snipperWindow = new BrowserWindow({
      x: 0,
      y: 0,
      width: fullWidth,
      height: fullHeight,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      enableLargerThanScreen: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });

    snipperWindow.setFullScreen(true);

    snipperWindow.on('closed', () => {
      snipperWindow = null;
    });

    snipperWindow.webContents.on('did-finish-load', () => {
      if (snipperWindow && !snipperWindow.isDestroyed()) {
        snipperWindow.webContents.send('start-snipping', screenshotDataUrl);
      }
    });

    await snipperWindow.loadFile(path.join(__dirname, '../src/snipper/index.html'));

    if (snipperWindow && !snipperWindow.isDestroyed() && !snipperWindow.webContents.isLoading()) {
      snipperWindow.webContents.send('start-snipping', screenshotDataUrl);
    }
  } catch (err) {
    console.error('Failed to start snipping overlay:', err);
    if (snipperWindow) {
      try {
        snipperWindow.close();
      } catch (e) {}
      snipperWindow = null;
    }
  }
}

function openDashboard() {
  if (dashboardWindow) {
    if (dashboardWindow.isMinimized()) dashboardWindow.restore();
    dashboardWindow.focus();
    return;
  }

  dashboardWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    autoHideMenuBar: true,
    title: "CaptureFlow Dashboard"
  });

  dashboardWindow.maximize();
  dashboardWindow.once('ready-to-show', () => {
    if (dashboardWindow) dashboardWindow.show();
  });

  dashboardWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.warn(`Failed to load ${validatedURL} (${errorCode}: ${errorDescription}). Falling back to local dashboard.`);
    loadLocalDashboard();
  });

  const startUrl = process.env.ELECTRON_START_URL;

  if (startUrl) {
    dashboardWindow.loadURL(startUrl).catch((err) => {
      console.warn(`Failed to load development URL ${startUrl}, falling back to local files.`, err);
      loadLocalDashboard();
    });
  } else {
    loadLocalDashboard();
  }
  
  dashboardWindow.on('closed', () => {
    dashboardWindow = null;
  });
}

function loadLocalDashboard() {
  const localPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(localPath)) {
    dashboardWindow.loadFile(localPath);
  } else {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CaptureFlow Dashboard</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #050507;
              color: #e0e0e0;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .container {
              max-width: 600px;
              padding: 40px;
              background: rgba(255, 255, 255, 0.03);
              border: 1px solid rgba(255, 255, 255, 0.05);
              border-radius: 16px;
            }
            h1 { color: #fff; margin-bottom: 20px; font-weight: 500; }
            p { font-size: 1.1em; line-height: 1.6; color: #a0a0a0; }
            code {
              background-color: rgba(255, 255, 255, 0.07);
              color: #38bdf8;
              padding: 4px 8px;
              border-radius: 6px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Dashboard Build Needed</h1>
            <p>To view the React dashboard, please run:</p>
            <p><code>npm run build:frontend</code></p>
            <p>Or start the development server:</p>
            <p><code>npm run dev</code></p>
          </div>
        </body>
      </html>
    `;
    dashboardWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  }
}

app.on('window-all-closed', () => {
  // Stay alive in tray
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
