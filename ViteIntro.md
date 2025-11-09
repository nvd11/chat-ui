# Vite.js 快速入门指南 (React + JavaScript 版)

Vite (法语单词，意为 "快速"，发音 /vit/) 是一个现代化的前端构建工具，它极大地提升了前端的开发体验。本指南将通过一个简单的 React 项目，介绍 Vite 的核心概念，并将其与传统的 `create-react-app` (CRA) 进行对比。

## 什么是 Vite？

在前端开发中，我们通常会使用 JSX、Sass 等需要“编译”的语言，并会安装很多依赖包。构建工具的作用就是处理这些代码，让它们能在浏览器中运行，并在部署前将它们打包优化。

Vite 就是这样一个构建工具，但它通过两种方式带来了革命性的体验：

1.  **极速的开发服务器**：在开发时，它利用浏览器原生支持的 ES 模块，实现了几乎瞬时的冷启动和热更新。
2.  **高效的生产构建**：在部署时，它使用高度优化的打包器 Rollup，将你的应用打包成小而快的静态文件。

## Vite vs. Create React App (CRA)

`create-react-app` 是过去几年 React 官方推荐的脚手架，它底层使用的是 Webpack。Vite 的出现正是为了解决 CRA/Webpack 在大型项目中遇到的性能瓶颈。

| 特性 | Vite | Create React App (Webpack) |
| :--- | :--- | :--- |
| **核心原理** | **按需编译** (利用原生 ESM) | **打包优先** (先打包所有文件再服务) |
| **冷启动速度** | **极快** (毫秒级) | **慢** (随项目增大而变慢，可达分钟级) |
| **热更新 (HMR)** | **极快** (只更新被修改的模块) | **较慢** (需要重新计算依赖并打包) |
| **配置** | **简单**，开箱即用，`vite.config.js` 易于理解 | **复杂**，默认配置被隐藏，自定义需 `eject` |
| **底层工具** | esbuild + Rollup (更快) | Babel + Terser (更慢) |

**一句话总结：Vite 通过一种更现代、更高效的方式解决了 Webpack 的性能问题，为开发者带来了革命性的体验提升。**

## 快速上手：创建一个 Vite + React (JS) 项目

让我们通过一个实际例子来感受 Vite。

### 1. 初始化项目

打开你的终端，运行以下命令：

```bash
# "my-vite-app" 是你的项目名，可以自定义
# 我们选择 "react" 模板，这是一个纯 JavaScript 的模板
npm create vite@latest my-vite-app -- --template react
```

### 2. 进入并安装依赖

```bash
cd my-vite-app
npm install
```

### 3. 启动开发服务器

这是体验 Vite 魔力的第一步！

```bash
npm run dev
```

你会看到终端立即输出类似下面的信息，整个过程几乎不需要等待：

```
  VITE v5.x.x  ready in 180ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

现在，在浏览器中打开 `http://localhost:5173/`，你就能看到一个 React 的欢迎页面。

## 代码解析：Vite 是如何工作的？

让我们看看 Vite 生成的核心文件，以理解其工作原理。

### `index.html`

这是你应用的入口。与 Webpack 将 JS 作为入口不同，Vite 将 `index.html` 作为应用的中心。

```html
<!-- index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Vite + React</title>
  </head>
  <body>
    <!-- 1. 浏览器首先加载这个 HTML，并找到一个挂载点 -->
    <div id="root"></div>
    
    <!-- 2. 然后，浏览器看到这个 script 标签，并将其作为原生 ES 模块加载 -->
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### `src/main.jsx`

这是 React 应用的入口文件。

```javascript
// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // 4. 浏览器解析到 import 后，会再次向 Vite 服务器请求 App.jsx 文件

// 3. Vite 拦截到对 main.jsx 的请求后，发现它是一个 .jsx 文件，
//    于是使用超高速的 esbuild 将其 JSX 语法即时编译成浏览器可以理解的普通 JavaScript，然后返回给浏览器。
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

## 生产构建

当你准备好部署你的应用时，运行以下命令：

```bash
npm run build
```

Vite 会调用 Rollup，将你所有的代码打包、优化、压缩成一堆静态文件，并放入一个 `dist` 目录中。这个 `dist` 目录就是你最终需要部署到服务器上的全部内容。

## 总结

*   Vite 是一个现代化的前端构建工具，它通过**按需编译**和利用**原生浏览器特性**，提供了无与伦比的开发体验。
*   相比于 `create-react-app` (Webpack)，Vite 在**开发速度**上有压倒性的优势。
*   它可以与 **React, Vue, Lit, Svelte** 等所有主流框架无缝集成，并且**不强制**你使用 TypeScript。
