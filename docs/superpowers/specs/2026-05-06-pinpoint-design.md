# Pinpoint — AI 编程定位、网页样式编辑与批注工具

## 产品定位

Pinpoint 是一个 Chrome 浏览器扩展，定位为"AI 编程定位、网页样式编辑与批注"工具。它允许用户直接在任意网页上选中元素，像在 Figma 中一样调整样式，汇总所有修改，并导出结构化 Prompt 或 JSON 给开发者或 AI 使用。

核心痛点：非技术人员用自然语言描述样式调整，反复改都不对。Pinpoint 让用户直接操作，输出精确指令。

## 技术决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 架构 | Content Script + Minimal Background | DOM 操作实时性 + 页面切换状态恢复 |
| 构建工具 | Vite + CRXJS | 开发体验好、HMR 快、Chrome 扩展专用插件 |
| Manifest | V3 | Chrome 最新标准 |
| UI 技术栈 | 原生 Custom Elements + Shadow DOM | 零框架依赖、隔离最干净、与 VisBug 架构一致 |
| 底层复用 | 参考 VisBug 架构重写 | 复用设计思路而非代码，避免 V2 遗留约束 |
| 导出格式 | 结构化 Prompt 为主 + JSON 为辅 | Prompt 给 AI 用最准确，JSON 给插件恢复状态用 |
| 图片替换 | 仅本地上传 | MVP 无后端，用 ObjectURL 预览 + base64 持久化 |

## 架构

### 数据流

```
用户点击元素
    ↓
selectable.js → findDeepElement(x, y)
    ↓
emit('pinpoint:selected', {el, rect})
    ↓
pinpoint-app (编排器)
    ↓ 通知各模块
editor → 渲染样式字段
overlay → 绘制选中框
overview → 高亮修改
    ↓
用户在 editor 修改样式
    ↓
css-write(el, prop, value) → 页面实时变化
    ↓
emit('pinpoint:style-changed', {el, prop, from, to})
    ↓
overview 聚合修改记录
state-sync → 异步推给 background 缓存
```

### 模块通信

所有模块通过 CustomEvent 全局通信（event-bus.js），不直接引用。

| 事件名 | 数据 | 触发者 | 监听者 |
|--------|------|--------|--------|
| `pinpoint:hover` | `{el, rect}` | selectable | hover-overlay |
| `pinpoint:selected` | `{els, rects}` | selectable | app, selected-overlay, editor |
| `pinpoint:mode` | `{mode}` | toolbar | app |
| `pinpoint:style-changed` | `{el, prop, from, to}` | editor | app, overview |
| `pinpoint:style-reset` | `{el}` | overview | app |
| `pinpoint:overview-toggle` | `{open}` | toolbar | app, editor |
| `pinpoint:editor-pin` | `{pinned, side}` | editor | app |

### 状态模型

单一数据源：`pinpoint-app` 持有全局状态。

```javascript
// 全局状态
pageState = {
  records: Map<id, Record>  // 一个元素一条记录
}

// 一条元素记录
Record = {
  id: String,                    // 基于选择器 hash
  selector: String,              // CSS 选择器
  label: String,                 // 人类可读标签 (如 div.hero-card)
  text: String,                  // 元素文本 (截断)
  frame: {x, y, w, h},          // 位置尺寸

  styleChanges: {                // 只存被改过的属性
    [prop]: {from, to}
  },

  managedColors: {               // 颜色结构化数据
    textColor: {hex, opacity},
    fill: {
      mode: 'solid' | 'gradient',
      hex, opacity, angle,
      stops: [{hex, opacity, position}]
    },
    stroke: {hex, opacity},
    shadow: [{hex, opacity}]
  },

  imageReplace: {                // 图片替换 (可选)
    fileName: String,
    base64: String
  }
}
```

状态管理原则：
1. 惰性记录：只有用户实际修改了样式，才创建条目
2. Background 同步：style-changed 后防抖 500ms 推给 background
3. 恢复：页面加载时从 background 拉缓存，逐条 apply

## 目录结构

```
pinpoint/
├── manifest.json
├── package.json
├── vite.config.js
├── src/
│   ├── background/
│   │   └── index.js                 # 状态缓存 + 跨tab持久化
│   ├── content/
│   │   ├── index.js                 # Content script 入口
│   │   ├── app.element.js           # <pinpoint-app> 总编排器
│   │   ├── app.element.css
│   │   ├── core/
│   │   │   ├── selectable.js        # 元素选择引擎
│   │   │   ├── hover.js             # Hover 高亮
│   │   │   ├── selected.js          # 选中元素管理
│   │   │   ├── overlays.js          # Overlay 视觉层管理
│   │   │   ├── event-bus.js         # CustomEvent 通信
│   │   │   └── utils.js             # 工具函数
│   │   ├── services/
│   │   │   ├── css-write.js         # CSS 写回服务
│   │   │   ├── selector-gen.js      # CSS 选择器生成
│   │   │   ├── style-read.js        # 读取元素计算样式
│   │   │   ├── placement.js         # Overlay 定位计算
│   │   │   └── state-sync.js        # 与 Background 状态同步
│   │   ├── toolbar/
│   │   │   ├── toolbar.element.js   # <pinpoint-toolbar>
│   │   │   └── toolbar.element.css
│   │   ├── editor/
│   │   │   ├── editor.element.js    # <pinpoint-editor>
│   │   │   ├── editor.element.css
│   │   │   ├── editor.js            # 编辑器逻辑
│   │   │   ├── fields/
│   │   │   │   ├── text-field.js
│   │   │   │   ├── dimension-field.js
│   │   │   │   ├── spacing-field.js
│   │   │   │   ├── typography-field.js
│   │   │   │   ├── color-field.js
│   │   │   │   ├── number-field.js
│   │   │   │   ├── border-field.js
│   │   │   │   ├── shadow-field.js
│   │   │   │   └── image-field.js
│   │   │   └── code-tab.js
│   │   ├── color/
│   │   │   ├── color-popover.element.js
│   │   │   ├── color-popover.element.css
│   │   │   ├── color-engine.js
│   │   │   ├── sv-panel.js
│   │   │   ├── hue-slider.js
│   │   │   ├── alpha-slider.js
│   │   │   ├── gradient-editor.js
│   │   │   └── eyedropper.js
│   │   ├── overview/
│   │   │   ├── overview.element.js  # <pinpoint-overview>
│   │   │   └── overview.element.css
│   │   ├── overlay/
│   │   │   ├── hover-overlay.element.js
│   │   │   ├── selected-overlay.element.js
│   │   │   └── overlay.css
│   │   └── styles/
│   │       └── pinpoint.css
│   └── popup/
│       ├── popup.html
│       ├── popup.js
│       └── popup.css
```

## MVP 功能详细设计

### 1. 顶部工具栏

**布局**：
- 左侧拖动手柄 `⋮⋮`
- 模式按钮：设计(默认)、标尺、评论(MVP预留)、布局、配置列表
- 更多菜单 `···`：仅固定编辑器选项

**行为**：
- 拖动：mousedown 在拖手柄 → 跟随鼠标 → mouseup 吸附最近边缘
- 吸附：距顶部/底部 < 40px 吸附
- 收起：双击拖手柄 → 缩小为圆形按钮 `P`，点击展开
- 模式切换：点击按钮 → `emit('pinpoint:mode', modeName)`
- 快捷键：D=设计, R=标尺, C=评论, L=布局, V=配置列表
- 不被裁剪：`position: fixed; z-index: 2147483647`
- 不误触：选择引擎过滤 `pinpoint-*` 元素

### 2. 样式编辑器

**布局**：
- 样式 tab / 代码 tab 切换 + 固定按钮 `📌`
- 样式 tab 分组：文本、尺寸、间距、字体、颜色、外观(圆角/填充/描边/投影/图片)
- 默认浮在选中元素右侧，固定模式吸附页面左/右侧

**字段列表**：
- 文本：内容编辑
- 尺寸：宽/高 + 模式切换(固定/自适应/填充)
- 间距：gap、padding(盒模型可视化输入)
- 字体：字体、字重、字号、行高、字距、对齐
- 颜色：文字颜色(打开颜色弹窗)、透明度
- 外观：圆角、填充(打开颜色弹窗)、描边、投影、图片(本地上传)

**数值输入交互**：
- 点击聚焦，手动输入
- ↑/↓键 ±1，Shift+↑/↓ ±10
- 拖拽图标左右调值
- padding 拖动时元素上叠加半透明色块预览间距
- 透明度限制 0-100
- 松手后输入框值 = 最终样式值

**固定编辑器模式**：
- 点击 `📌` → 固定到页面右侧
- 固定后可拖动到左侧
- 拖动时靠近左/右边缘显示吸附提示浮层
- 松手在吸附区 → 切换侧

**代码 tab**：
- 显示当前元素所有被修改的 CSS 属性，纯文本可编辑

**防失焦**：
- 编辑器输入框 mousedown 时 stopPropagation()
- Tab 在编辑器内循环输入框
- 编辑器外部点击 → 收起(非固定模式)

### 3. 颜色编辑器

**弹窗布局**：
- SV 面板(饱和度-明度)
- 色相条
- 透明度条
- 格式切换：Hex / RGB / HSL
- 吸管取色(MVP 后期补)
- 渐变编辑(仅填充字段)：模式切换(实色/渐变)、渐变条+stop拖动、角度输入

**纯色模式**：
- SV 面板：X=饱和度(0→100)，Y=明度(100→0)
- 色相条：0→360°
- 透明度条：0→100%
- 拖动实时更新：页面元素实时变色 + 编辑器字段值实时同步

**渐变模式(仅填充)**：
- 渐变条：stop 可拖动改变 position
- 点击空白添加 stop，双击删除(最少2个)
- 点击 stop → SV/色相面板切换为该 stop 颜色
- 角度输入：可拖拽或键盘调值
- 编辑器字段显示"渐变填充"

**交互约束**：
- color-popover 挂 document.body，position: fixed，计算位置不超出视口
- 拖动实时更新 css-write + editor 字段
- 松手后值 = 最终值，不回退

### 4. 图片替换

- 选中 `<img>` 元素时编辑器显示图片字段
- 点击"选择文件" → 本地文件选择器 → URL.createObjectURL 替换 src
- 导出 JSON 保存 base64
- 导出 Prompt 记录意图：`图片: 替换为 [文件名]`

### 5. 配置列表

**布局**：
- 右侧全高面板
- 三个 tab：全部、配置、评论(MVP预留) — tab 平分宽度 + 显示数量
- 每条记录：选择器、标签、修改项摘要、操作按钮(定位/重置/复制Prompt)
- 底部：复制整页 Prompt、导出 JSON、导入 JSON

**操作**：
- 定位：选中该元素并滚动到位置
- 重置：撤销该元素所有修改，恢复原始样式
- 复制P：复制该元素单条 Prompt
- 复制整页P：复制所有元素完整 Prompt
- 导出JSON：下载含所有修改+base64图片的 JSON
- 导入JSON：选择 JSON 文件恢复页面状态

**联动**：
- 打开配置列表 → 固定编辑器临时取消固定
- 关闭配置列表 → 编辑器恢复固定

### 6. 元素选择引擎 + Overlay

**选择引擎**：
- `document.elementsFromPoint(x, y)` 获取层叠元素
- 过滤 `pinpoint-*` 元素和 `[data-pinpoint-ui]`
- 取最深有效元素
- 单击替换选中，Shift+点击追加多选，Escape 清空

**Overlay**：
- `<pinpoint-hover>`：蓝色虚线框 + 元素标签
- `<pinpoint-selected>`：蓝色实线框 + 尺寸标注 + 盒模型可视化
- `<pinpoint-guides>`：标尺模式对齐参考线
- 全部 Shadow DOM，position: fixed，z-index: 2147483646

### 7. 撤回栈

- 每次 style-changed 推入栈：`{el, prop, from, to, timestamp}`
- Ctrl+Z / Cmd+Z 弹出栈顶 → css-write 恢复
- 最多 50 条

## 导出格式

### Prompt 示例

```
## Pinpoint 页面修改指令

### 元素 1
- 选择器: `.hero-card`
- 标签: div.hero-card
- 文本内容: "欢迎使用 Pinpoint"
- 修改项:
  1. 文字颜色: #1a1a2e → #ffffff
  2. 圆角: 0px → 12px
  3. padding: 20px → 32px
  4. 填充: 无 → linear-gradient(135deg, #667eea 0%, #764ba2 100%)

### 元素 2
- 选择器: `#submit-btn`
- 标签: button#submit-btn
- 文本内容: "提交"
- 修改项:
  1. 宽度: 120px → 200px
  2. 投影: 无 → 0 4px 12px rgba(0,0,0,0.15)

### 元素 3
- 选择器: `.logo-img`
- 标签: img.logo-img
- 修改项:
  1. 图片: 替换为 [new-logo.png]

请根据以上修改指令更新对应元素的 CSS 和 HTML 属性。
```

### JSON 示例

```json
{
  "version": 1,
  "url": "https://example.com/page",
  "timestamp": "2026-05-06T12:00:00Z",
  "records": [
    {
      "id": "el-abc123",
      "selector": ".hero-card",
      "label": "div.hero-card",
      "text": "欢迎使用 Pinpoint",
      "frame": {"x": 100, "y": 200, "w": 300, "h": 150},
      "styleChanges": {
        "color": {"from": "#1a1a2e", "to": "#ffffff"},
        "border-radius": {"from": "0px", "to": "12px"},
        "padding": {"from": "20px", "to": "32px"}
      },
      "managedColors": {
        "fill": {
          "mode": "gradient",
          "angle": 135,
          "stops": [
            {"hex": "#667eea", "opacity": 100, "position": 0},
            {"hex": "#764ba2", "opacity": 100, "position": 100}
          ]
        }
      }
    },
    {
      "id": "el-def456",
      "selector": ".logo-img",
      "label": "img.logo-img",
      "styleChanges": {},
      "imageReplace": {
        "fileName": "new-logo.png",
        "base64": "data:image/png;base64,..."
      }
    }
  ]
}
```

## 不被页面裁剪 / 不误触的核心规则

1. 所有 Pinpoint UI 挂在 `document.body`，`position: fixed`
2. 选择引擎过滤：`!el.localName.startsWith('pinpoint-')` 且 `!el.closest('[data-pinpoint-ui]')`
3. 编辑器输入框 `mousedown` 时 `stopPropagation()`
4. 所有 Popover/弹窗计算位置时检测视口边界，超出则翻转方向

## 后续迭代（MVP 不做）

- 评论系统（单元素评论、批量评论、评论锚点）
- 共享元素（开关、同类同步、配置列表聚合）
- React Fiber 增强（Component Tree、Source 读取）
- 吸管取色
- 问题反馈 / 小红书 / 推特链接
