import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pkgPath = path.join(root, 'package.json');
const backupPath = path.join(root, 'package.json.__backup__');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

const original = readJson(pkgPath);

// GitHub Packages requires scoped packages.
const githubPkg = {
  ...original,
  name: '@iuzairaslam/react-native-chuck-interceptor',
  publishConfig: {
    registry: 'https://npm.pkg.github.com',
  },
};

try {
  fs.writeFileSync(backupPath, JSON.stringify(original, null, 2) + '\n', 'utf8');
  writeJson(pkgPath, githubPkg);

  execSync('npm publish --registry=https://npm.pkg.github.com', {
    stdio: 'inherit',
  });
} finally {
  if (fs.existsSync(backupPath)) {
    const restore = readJson(backupPath);
    writeJson(pkgPath, restore);
    fs.unlinkSync(backupPath);
  } else {
    // fallback restore if backup was somehow removed
    writeJson(pkgPath, original);
  }
}

