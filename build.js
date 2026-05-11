const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const isWatch = process.argv.includes('--watch');
const outDir = path.join(__dirname, 'dist');

// 清空 dist
if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

// 复制静态文件
const staticFiles = [
  ['manifest.json', 'manifest.json'],
  ['background.js', 'background.js'],
  ['src/popup/popup.html', 'popup/popup.html'],
  ['src/popup/popup.js', 'popup/popup.js'],
  ['src/content/styles/global.css', 'content/styles/global.css'],
  ['前端/images/pinpoint-icon-p.svg', 'icons/pinpoint-icon-p.svg'],
];

for (const [src, dest] of staticFiles) {
  const destPath = path.join(outDir, dest);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(path.join(__dirname, src), destPath);
}

// 生成占位图标
generateIcons();

// bundle content script
const buildOpts = {
  entryPoints: [path.join(__dirname, 'src/content/index.js')],
  bundle: true,
  outfile: path.join(outDir, 'content/index.js'),
  format: 'iife',
  target: 'chrome110',
  minify: !isWatch,
};

if (isWatch) {
  esbuild.context(buildOpts).then(ctx => ctx.watch());
  console.log('Watching for changes...');
} else {
  esbuild.buildSync(buildOpts);
  console.log('Build complete → dist/');
}

function generateIcons() {
  const iconDir = path.join(outDir, 'icons');
  fs.mkdirSync(iconDir, { recursive: true });

  const srcDir = path.join(__dirname, 'icons');
  const sizes = [16, 48, 128];
  for (const size of sizes) {
    const src = path.join(srcDir, `icon${size}.png`);
    const dest = path.join(iconDir, `icon${size}.png`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    } else {
      fs.writeFileSync(dest, Buffer.alloc(0));
      console.log(`⚠️  icon${size}.png not found in icons/, run gen-icon.py first`);
    }
  }
}