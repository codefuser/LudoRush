#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const clientDir = path.resolve(rootDir, 'client');
const androidDir = path.resolve(clientDir, 'android');
const releasesDir = path.resolve(rootDir, 'releases');

// 1. Read root package.json
const rootPkgPath = path.resolve(rootDir, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));

const clientPkgPath = path.resolve(clientDir, 'package.json');
const clientPkg = JSON.parse(fs.readFileSync(clientPkgPath, 'utf8'));

// 2. Parse version bump argument
const bumpArg = (process.argv[2] || '').toLowerCase(); // e.g. 'patch', 'minor', 'major', or explicit version '1.0.1'

let [major, minor, patch] = (rootPkg.version || '1.0.0')
  .split('.')
  .map((n) => parseInt(n, 10) || 0);

if (bumpArg === 'patch') {
  patch += 1;
} else if (bumpArg === 'minor') {
  minor += 1;
  patch = 0;
} else if (bumpArg === 'major') {
  major += 1;
  minor = 0;
  patch = 0;
} else if (/^\d+\.\d+\.\d+$/.test(bumpArg)) {
  [major, minor, patch] = bumpArg.split('.').map((n) => parseInt(n, 10) || 0);
}

const newVersion = `${major}.${minor}.${patch}`;

// Calculate a monotonically increasing versionCode: e.g. major*10000 + minor*100 + patch
const versionCode = major * 10000 + minor * 100 + patch;

console.log(`\n======================================================`);
console.log(`🎮 LUDO RUSH — AUTOMATED ANDROID APK BUILDER`);
console.log(`   Target Version: v${newVersion} (versionCode: ${versionCode})`);
console.log(`======================================================\n`);

// 3. Update root and client package.json
rootPkg.version = newVersion;
fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n', 'utf8');

clientPkg.version = newVersion;
fs.writeFileSync(clientPkgPath, JSON.stringify(clientPkg, null, 2) + '\n', 'utf8');

// 4. Update android/app/build.gradle
const buildGradlePath = path.resolve(androidDir, 'app', 'build.gradle');
if (fs.existsSync(buildGradlePath)) {
  let gradleContent = fs.readFileSync(buildGradlePath, 'utf8');
  gradleContent = gradleContent.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  gradleContent = gradleContent.replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`);
  fs.writeFileSync(buildGradlePath, gradleContent, 'utf8');
}

// 5. Build Web Client
console.log('📦 Step 1/3: Building client web bundle for production...');
execSync('npm run build -w client', { cwd: rootDir, stdio: 'inherit' });

// 6. Sync Capacitor
console.log('\n📲 Step 2/3: Syncing web assets to native Android project...');
execSync('npx cap sync android', { cwd: clientDir, stdio: 'inherit' });

// 7. Ensure local.properties has sdk.dir
const localPropPath = path.resolve(androidDir, 'local.properties');
if (!fs.existsSync(localPropPath)) {
  const defaultSdk = 'C:\\\\Users\\\\josep\\\\AppData\\\\Local\\\\Android\\\\Sdk';
  fs.writeFileSync(localPropPath, `sdk.dir=${defaultSdk}\n`, 'utf8');
}

// 8. Assemble Debug APK with Gradle
console.log('\n🔨 Step 3/3: Compiling Android APK with Gradle...');
const isWindows = process.platform === 'win32';
const gradlewCmd = isWindows ? 'gradlew.bat' : './gradlew';
execSync(`${gradlewCmd} assembleDebug`, { cwd: androidDir, stdio: 'inherit' });

// 9. Copy APK to releases/
if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
}

const builtApkPath = path.resolve(
  androidDir,
  'app',
  'build',
  'outputs',
  'apk',
  'debug',
  'app-debug.apk'
);

if (fs.existsSync(builtApkPath)) {
  const versionedApkPath = path.resolve(releasesDir, `LudoRush-v${newVersion}.apk`);
  const latestApkPath = path.resolve(releasesDir, 'LudoRush-latest.apk');

  fs.copyFileSync(builtApkPath, versionedApkPath);
  fs.copyFileSync(builtApkPath, latestApkPath);

  const stats = fs.statSync(versionedApkPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`\n======================================================`);
  console.log(`✅ BUILD SUCCESSFUL!`);
  console.log(`   Version:       v${newVersion} (Code: ${versionCode})`);
  console.log(`   File Size:     ${sizeMb} MB`);
  console.log(`   APK Location:  ${versionedApkPath}`);
  console.log(`   Latest Alias:  ${latestApkPath}`);
  console.log(`======================================================\n`);
} else {
  console.error('❌ Error: APK output file not found at expected path:', builtApkPath);
  process.exit(1);
}
