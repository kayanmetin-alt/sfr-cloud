const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const isPackaged = app.isPackaged;
const ROOT = path.join(__dirname, '..');
const WEB_ROOT = path.join(ROOT, 'web');
const API_PORT = 3001;
const WEB_PORT = 5173;

const RESOURCES = isPackaged ? process.resourcesPath : ROOT;
const BACKEND_CWD = isPackaged ? path.join(RESOURCES, 'backend') : ROOT;
const WEB_DIST = isPackaged ? path.join(RESOURCES, 'web-dist') : null;
const APP_URL = isPackaged ? `http://localhost:${API_PORT}` : `http://localhost:${WEB_PORT}`;

let mainWindow = null;
let backendProcess = null;
let webProcess = null;

function tryGet(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 2000 }, (res) => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function waitForPort(port, label) {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 60;
    const interval = setInterval(async () => {
      attempts++;
      const ok = await tryGet(port === API_PORT ? `http://localhost:${port}/api/health` : `http://localhost:${port}/`);
      if (ok) {
        clearInterval(interval);
        resolve(true);
        return;
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        resolve(false);
      }
    }, 500);
  });
}

function startBackend() {
  return new Promise((resolve) => {
    const env = { ...process.env, PORT: String(API_PORT) };
    if (isPackaged && WEB_DIST) {
      env.SERVE_WEB_STATIC = WEB_DIST;
      env.SQLITE_PATH = path.join(app.getPath('userData'), 'sfr.db');
    }
    backendProcess = spawn('node', ['server.js'], {
      cwd: BACKEND_CWD,
      stdio: 'pipe',
      shell: process.platform === 'win32',
      env,
    });
    backendProcess.stderr?.on('data', (d) => process.stderr.write(d));
    backendProcess.stdout?.on('data', (d) => process.stdout.write(d));
    backendProcess.on('error', (err) => console.error('Backend start error:', err));
    resolve();
  });
}

function startWeb() {
  if (isPackaged) return Promise.resolve();
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    webProcess = spawn(cmd, ['vite'], {
      cwd: WEB_ROOT,
      stdio: 'pipe',
      shell: process.platform === 'win32',
      env: { ...process.env, FORCE_COLOR: '1' },
    });
    webProcess.stderr?.on('data', (d) => process.stderr.write(d));
    webProcess.stdout?.on('data', (d) => process.stdout.write(d));
    webProcess.on('error', (err) => console.error('Web start error:', err));
    resolve();
  });
}

function killChildren() {
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
  if (webProcess) {
    webProcess.kill('SIGTERM');
    webProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 400,
    minHeight: 400,
    title: 'Şifre Kasası',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.loadURL(APP_URL);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  const apiUp = await tryGet(`http://localhost:${API_PORT}/api/health`);
  const webUp = !isPackaged && (await tryGet(`http://localhost:${WEB_PORT}/`));

  if (isPackaged) {
    await startBackend();
    const apiOk = await waitForPort(API_PORT, 'API');
    if (apiOk) createWindow();
    else { console.error('Backend başlatılamadı.'); app.quit(); }
    return;
  }

  if (apiUp && webUp) {
    createWindow();
    return;
  }

  if (!apiUp) await startBackend();
  if (!webUp) await startWeb();

  const apiOk = await waitForPort(API_PORT, 'API');
  const webOk = await waitForPort(WEB_PORT, 'Web');
  if (apiOk && webOk) {
    createWindow();
  } else {
    console.error('Sunucular başlatılamadı. Lütfen terminalde backend ve web\'i ayrı ayrı çalıştırın.');
    app.quit();
  }
});

app.on('window-all-closed', () => {
  killChildren();
  app.quit();
});

app.on('quit', killChildren);
