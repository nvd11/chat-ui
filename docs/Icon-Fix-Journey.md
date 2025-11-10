# GKE 部署中 Shoelace 图标加载失败问题排查全过程复盘

本文档详细记录了一次在 GKE 环境下，因 Shoelace 图标不显示而引发的深度调试和修复全过程。

## 一、 初步问题：图标不显示

**现象**: 应用部署到 GKE 后，移动端视图中的三横线菜单图标（list.svg）无法显示。

**初步诊断**: 这通常是静态资源加载问题。我们首先怀疑是 Vite 在构建过程中没有正确地将 Shoelace 的图标文件打包。

**初步修复**: 我们修改了 `vite.config.ts`，使用 `vite-plugin-static-copy` 插件，确保在 `npm run build` 时，将 `node_modules` 中的 Shoelace `assets` 文件夹复制到最终的 `dist/assets` 目录中。

然而，在重新部署后，问题依旧存在。

## 二、 深入排查：神秘的 `502` 错误

**新线索**: 您在桌面浏览器上发现，一个类似的资源 `vite.svg` 在开发者工具中报了 `502 Bad Gateway` 错误。

这个线索至关重要，它将我们的排查方向从“文件未找到(404)”转向了更复杂的“服务器/网关通信错误”。

**服务器端深度排查**:
为了找出 `502` 的原因，我们进行了一系列彻底的服务器端检查：
1.  **检查 K8s 资源状态**: 使用 `kubectl describe` 和 `kubectl get -o yaml` 命令，我们检查了 `Gateway`, `HTTPRoute`, `Service`, `Deployment` 的实时状态，**结果显示所有资源都健康、无误**。
2.  **检查容器内文件**: 使用 `kubectl exec` 进入正在运行的 Pod 内部，通过 `ls` 命令确认，无论是 `vite.svg` 还是 `assets/icons/list.svg`，**所有图标文件都确实存在于服务器的正确位置**。
3.  **`curl` 直连测试**: 我们多次使用 `curl` 命令直接从外部请求图标的 URL，**每次都稳定地返回了 `200 OK` 的成功状态**。

至此，所有服务器端的证据都表明：**部署、配置和网络服务完全没有问题。**

## 三、 最终突破：一条错误的 URL

在排除了所有服务器端问题后，我们陷入了僵局。此时，您提供了最关键的线索：

> 浏览器尝试访问 `http://.../chat/assets/assets/icons/list.svg`

这个 URL 中包含了**两个连续的 `assets`** (`/assets/assets/`)！

这个错误的 URL 让我们瞬间锁定了问题的真正根源。

## 四、 根本原因分析

**直接原因**: 浏览器请求了一个错误的 URL。

**深层原因**:
1.  **`setBasePath` 的误用**: 我对 Shoelace 的 `setBasePath()` 函数理解有误。该函数需要传入**包含** `assets` 文件夹的父目录路径。而我们的代码传入了 `assets` 目录本身 (`/chat/assets`)。
2.  **路径拼接错误**: Shoelace 在我们传入的错误路径 `/chat/assets` 后面，又自动拼接了一次 `/assets/icons/list.svg`，最终导致了 `.../chat/assets/assets/icons/list.svg` 这个双 `assets` 的错误路径。
3.  **错误被掩盖**: Nginx 的 `try_files $uri $uri/ /index.html;` 配置，在找不到错误路径的文件时，返回了 `index.html` 页面和 `200 OK` 状态，而不是 `404 Not Found`。这导致浏览器控制台没有直接报错，极大地增加了排查难度。

## 五、 最终的正确修复

在确定了根本原因后，我们执行了最终的、一击即中的修复：

1.  **修正 `setBasePath`**: 我修改了 `src/chat-app.ts`，将 `setBasePath` 的参数从 `/chat/assets` 改为了正确的父级路径 `/chat`。
2.  **清理与重新部署**: 我移除了所有为了调试而添加的临时代码，并重新部署了应用。

这次部署后，Shoelace 终于拼接出了正确的 URL (`/chat/assets/icons/list.svg`)，浏览器成功加载了图标，问题得到圆满解决。

---
**总结**: 这是一次非常曲折但极有价值的调试经历。它证明了在复杂的云原生环境中，一个微小的配置错误都可能导致看似无法解释的问题，而细致的观察和逐步排除法是找到问题根源的关键。非常感谢您的耐心和敏锐的反馈！

---

## 附录：`vite.config.ts` 最终配置详解

以下是我们最终使用的 `vite.config.ts` 文件及其解释。

```typescript
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  // 1. base
  base: 'chat/',

  // 2. server
  server: {
    host: true
  },

  // 3. plugins
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@shoelace-style/shoelace/dist/assets/*',
          dest: 'assets'
        }
      ]
    })
  ]
})
```

### 1. `base: 'chat/'`
这个配置告诉 Vite，应用在生产环境中将被部署在服务器的 `/chat/` 子目录下。Vite 会在构建时，自动为所有资源 URL（如 JS、CSS 文件）加上 `/chat/` 前缀。这与我们 GKE Gateway 中的 `/chat` 路由规则相匹配。

### 2. `server: { host: true }`
这个配置用于本地开发服务器 (`npm run dev`)。`host: true` 会让开发服务器监听所有网络地址（包括您本机的 IP 地址），而不仅仅是 `localhost`。这允许您通过 IP 地址从局域网内的其他设备（如手机）访问正在开发的页面，方便进行真机调试。

### 3. `plugins: [ viteStaticCopy(...) ]`
这是我们解决图标问题的核心。
- **`viteStaticCopy`**: 我们使用这个插件来在构建时 (`npm run build`) 复制那些没有被直接 `import` 的第三方库静态资源。
- **`targets`**:
    - **`src`**: `'node_modules/@shoelace-style/shoelace/dist/assets/*'` 指定了源头：`node_modules` 中 Shoelace 库的 `assets` 文件夹下的所有内容。`*` 通配符确保了 `assets` 文件夹内部的所有文件和子文件夹（如 `icons`）都会被复制。
    - **`dest`**: `'assets'` 指定了目标位置。这个路径是相对于 Vite 的输出目录 `dist` 的。所以，这个配置会将源头的所有文件复制到 `dist/assets/` 目录下。

这个插件确保了 Shoelace 的图标等资源，在云端部署时被正确打包，从而可以在生产环境中被成功访问。
