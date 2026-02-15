const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const WEB = path.join(ROOT, 'web');
const PACK_BACKEND = path.join(__dirname, 'pack-resources', 'backend');

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
}

console.log('Preparing pack resources...');

fs.mkdirSync(PACK_BACKEND, { recursive: true });

copyFile(path.join(ROOT, 'server.js'), path.join(PACK_BACKEND, 'server.js'));
copyFile(path.join(ROOT, 'db.js'), path.join(PACK_BACKEND, 'db.js'));
copyDir(path.join(ROOT, 'routes'), path.join(PACK_BACKEND, 'routes'));

const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const backendPkg = {
  name: 'sfr-cloud-backend',
  version: rootPkg.version || '1.0.0',
  type: 'module',
  main: 'server.js',
  dependencies: rootPkg.dependencies || {},
};
fs.writeFileSync(path.join(PACK_BACKEND, 'package.json'), JSON.stringify(backendPkg, null, 2));

console.log('Installing backend dependencies...');
execSync('npm install --production', { cwd: PACK_BACKEND, stdio: 'inherit' });

console.log('Building web app...');
execSync('npm run build', { cwd: WEB, stdio: 'inherit' });

console.log('Pack resources ready.');
