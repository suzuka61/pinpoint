# Pinpoint

设计稿验收 + 样式修正 → 精确指令输出

在已部署网页上直接调整样式，一键导出结构化修改指令，粘贴到 Trae 等 AI 编码工具自动改代码。

## 核心流程

1. 打开网页 → 点击插件图标 → 启动选取
2. 鼠标悬停高亮元素 → 点击选中
3. 在浮动面板中调整样式（排版/间距/边框/外观等）
4. 点击「导出指令」→ 粘贴到 AI 编码工具

## 功能

### 元素选取
- Hover 绿色虚线高亮 + tooltip 显示标签和尺寸
- 点击选中，显示间距可视化（margin 橙色 / padding 青色）
- 键盘 Escape 取消选中

### 样式调整面板（右侧浮动，可拖拽）
- **内容** — 文字编辑
- **图片** — 本地上传替换（img / 背景图）
- **排版** — 字体（系统全部字体）、大小、粗细、行高、颜色、对齐、装饰、变换
- **尺寸** — 宽度、高度、偏移 X/Y
- **间距** — 内间距/外间距四向输入 + 页面可视化
- **外观** — 背景色、圆角、透明度、阴影
- **边框** — 宽度、样式、颜色

### 间距可视化
- 选中元素时，页面直接显示 margin（橙色）和 padding（青色）区域
- 每个区域标注像素值
- 修改间距数值时实时更新可视化

### 撤销 / 重做
- 完整的修改历史记录
- 支持 Ctrl+Z 撤销 / Ctrl+Shift+Z 重做
- 面板内置撤销/重做按钮

### 导出指令
- 所有修改 → 结构化 Prompt
- 特殊属性格式：文字内容、图片替换、背景图替换
- 一键复制到剪贴板，显示 Toast 提示

## 开发

```bash
npm install
node build.js
```

在 Chrome 加载 `dist/` 目录（chrome://extensions → 开发者模式 → 加载已解压的扩展程序）。

## 技术栈

- Chrome Extension Manifest V3
- 原生 JS + CSS（无框架）
- Shadow DOM（closed）隔离面板样式
- esbuild 打包（content script IIFE）
- `queryLocalFonts()` API 读取系统字体
- `URL.createObjectURL()` 图片替换

## 项目结构

```
src/
  content/
    index.js      — 入口，激活/退出生命周期
    overlay.js    — hover/选中 overlay + 间距可视化
    panel.js      — 浮动面板 UI + 所有属性编辑
    selector.js   — CSS 选择器生成（过滤随机 class）
    changes.js    — 修改记录存储 + 撤销/重做
    exporter.js   — 修改记录 → 结构化 Prompt
    styles/
      global.css  — 注入宿主页面的基础样式
  popup/
    popup.html    — 弹出页面
    popup.js      — 启动/关闭切换
background.js     — Service worker
build.js          — esbuild 构建
gen-icon.py       — Python 生成 PNG 图标
manifest.json     — Manifest V3 配置
```
