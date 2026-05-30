# 伴作 / Novel Copilot

> AI 辅助小说写作工具。辅助，而非替代。

[English](#novel-copilot) | 中文版

---

## 简介

**伴作**（Novel Copilot）是一款面向中文小说作者的 AI 辅助写作工具。核心理念是 **"辅助而非替代"** —— AI 负责润色、扩写、审查等重复性工作，作者始终掌控创作本身。

采用**双栏实时协作编辑器**：左侧是**原始输入**（你的创作），右侧是**AI 成品**（AI 处理后的结果）。段落级处理，精确到每一段文字。

---

## 核心功能

### 双栏实时协作编辑器

| 左栏 — 原始输入                       | 右栏 — AI 成品               |
| ------------------------------------- | ---------------------------- |
| 自由写作，不受干扰                    | 段落级 AI 处理               |
| Enter 新建段落，Backspace（空段）删除 | 鼠标悬停显示 AI 操作浮层     |
| 支持框选 / Shift 范围 / Ctrl 多选     | 同步按钮：一键重置为原始输入 |

### 三种 AI 模式

| 模式       | Temperature | Max Tokens | 推理 | 适用场景                   |
| ---------- | ----------- | ---------- | ---- | -------------------------- |
| **高质量** | 0.3         | 可调       | 开启 | 关键段落深度润色、重要扩写 |
| **均衡**   | 0.7         | 可调       | 关闭 | 日常写作，平衡质量与速度   |
| **快速**   | 0.9         | 可调       | 关闭 | 草拟、快速生成             |

每个模式可独立绑定 API 配置、调节参数。支持 **Max Tokens 无上限** 选项。

### Prompt 模板系统

- 内置模板：润色、扩写、审查
- 支持自定义模板，可指定 AI 模式
- 模板覆盖：修改内置模板直接生效，不产生副本

### 文风管理

- 粘贴参考文本，AI 自动分析文风特征
- 保存为文风配置，润色/扩写时自动注入

### 小说管理

- 多小说管理，章节组织
- 人物设定、世界观设定
- 大纲编辑

### 数据安全

- **所有数据保存在浏览器本地**（localStorage + IndexedDB）
- API Key 仅保存在本地，不上传任何服务器

---

## 快速开始

```bash
# 1. 克隆仓库
git clone <repo-url>
cd novel-copilot

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器访问 http://localhost:5173
```

### 配置 AI

1. 点击右上下 **设置** → **AI 配置**
2. 添加你的 API Key（兼容 OpenAI 接口协议）
3. 点击 **测试连接**，获取可用模型列表
4. 选择模型，保存配置
5. 在 **AI 模式设置** 中为不同质量模式分配配置和参数

---

## 界面与快捷键

| 快捷键             | 功能                                           |
| ------------------ | ---------------------------------------------- |
| Enter              | 新建段落                                       |
| Backspace（空段）  | 删除段落                                       |
| Ctrl/Cmd + Click   | 多选段落                                       |
| Shift + Click      | 范围选择                                       |
| 鼠标拖拽           | 框选段落                                       |
| 鼠标悬停 AI 成品段 | 显示 AI 操作浮层（润色/扩写/审查/同步/自定义） |

---

## 技术栈

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS 4** — 原子化样式
- **Zustand + persist** — 状态管理与本地持久化
- **Framer Motion** — 动画
- **OpenAI-compatible API** — 直接调用 LLM API

---

## 项目结构

```
novel-copilot/
├── src/
│   ├── components/
│   │   ├── editor/          # 编辑器组件（Paragraph、EditorPane、AIFloatingBar）
│   │   ├── layout/          # 布局组件（TopBar、LeftPanel、SplitEditor、StatusBar）
│   │   ├── panels/          # 左侧面板（Chapter、Outline、Character、Setting）
│   │   ├── common/          # 通用弹窗（SettingsModal、AIConfigModal）
│   │   └── novel/           # 小说创建
│   ├── store/               # Zustand 状态管理
│   ├── lib/                 # 工具函数与类型定义
│   └── index.css            # 全局样式与主题变量
├── public/                  # 静态资源
├── index.html
├── package.json
└── vite.config.ts
```

---

## 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录，可直接部署为静态站点。

---

## License

MIT

---

---

# Novel Copilot

> An AI-assisted novel writing tool. Assists, never replaces.

中文版 | [English](#novel-copilot)

---

## Introduction

**Novel Copilot** (伴作) is an AI-assisted writing tool for Chinese novel authors. The core philosophy is **"assist, never replace"** — AI handles repetitive tasks like polishing, expanding, and reviewing, while the author always remains in full creative control.

It features a **dual-pane real-time collaborative editor**: the left pane is your **original input** (your writing), and the right pane is the **AI output** (AI-processed results). Processing happens at the paragraph level, down to each individual paragraph.

---

## Core Features

### Dual-Pane Real-Time Collaborative Editor

| Left — Original Input                                      | Right — AI Output                              |
| ---------------------------------------------------------- | ---------------------------------------------- |
| Distraction-free writing                                   | Paragraph-level AI processing                  |
| Enter to create new paragraph, Backspace (empty) to delete | Hover to reveal AI action floating bar         |
| Drag / Shift range / Ctrl multi-select                     | Sync button: one-click reset to original input |

### Three AI Modes

| Mode             | Temperature | Max Tokens | Reasoning | Best For                             |
| ---------------- | ----------- | ---------- | --------- | ------------------------------------ |
| **High Quality** | 0.3         | Adjustable | On        | Critical paragraphs, deep polishing  |
| **Balanced**     | 0.7         | Adjustable | Off       | Daily writing, quality-speed balance |
| **Fast**         | 0.9         | Adjustable | Off       | Drafting, quick generation           |

Each mode can bind to a different API config and parameter set. Supports **unlimited Max Tokens** option.

### Prompt Template System

- Built-in templates: Polish, Expand, Review
- Custom templates with AI mode assignment
- Template override: editing built-in templates updates them directly, no duplicates

### Writing Style Management

- Paste reference text, AI analyzes its stylistic features
- Save as a style profile, auto-injected during Polish/Expand

### Novel Management

- Multi-novel support with chapter organization
- Character profiles and world-building settings
- Outline editor

### Data Security

- **All data stored locally in your browser** (localStorage + IndexedDB)
- API Key stored locally only, never uploaded to any server

---

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd novel-copilot

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open browser at http://localhost:5173
```

### Configure AI

1. Click **Settings** at bottom-left → **AI Config**
2. Add your API Key (supports OpenAI / DeepSeek / SiliconFlow / Custom)
3. Click **Test Connection** to fetch available models
4. Select a model and save the config
5. In **AI Mode Settings**, assign configs and parameters to each quality mode

---

## UI & Shortcuts

| Shortcut                    | Function                                                       |
| --------------------------- | -------------------------------------------------------------- |
| Enter                       | Create new paragraph                                           |
| Backspace (empty paragraph) | Delete paragraph                                               |
| Ctrl/Cmd + Click            | Multi-select paragraphs                                        |
| Shift + Click               | Range select                                                   |
| Mouse drag                  | Box select paragraphs                                          |
| Hover AI output paragraph   | Show AI action floating bar (Polish/Expand/Review/Sync/Custom) |

---

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS 4** — Atomic styling
- **Zustand + persist** — State management & local persistence
- **Framer Motion** — Animations
- **OpenAI-compatible API** — Direct LLM API calls

---

## Project Structure

```
novel-copilot/
├── src/
│   ├── components/
│   │   ├── editor/          # Editor components (Paragraph, EditorPane, AIFloatingBar)
│   │   ├── layout/          # Layout components (TopBar, LeftPanel, SplitEditor, StatusBar)
│   │   ├── panels/          # Left panels (Chapter, Outline, Character, Setting)
│   │   ├── common/          # Common modals (SettingsModal, AIConfigModal)
│   │   └── novel/           # Novel creation
│   ├── store/               # Zustand state management
│   ├── lib/                 # Utilities & type definitions
│   └── index.css            # Global styles & theme variables
├── public/                  # Static assets
├── index.html
├── package.json
└── vite.config.ts
```

---

## Build

```bash
npm run build
```

Output goes to `dist/`, ready for static site deployment.

---

## License

MIT
