# 前端开发详细计划 (Lit UI 优先)

使用 Lit 构建聊天应用前端的步骤，优先完成 UI 的静态搭建和内部交互，最后再集成后端 API。

## 1. 环境搭建与项目初始化

- **工具**: 使用 `Vite` 作为构建工具，因为它对 Lit 和 TypeScript 有着出色的支持。
- **命令**: 执行 `npm create vite@latest . -- --template lit-ts` 在当前目录初始化一个 Lit + TypeScript 项目。
- **依赖安装**: 执行 `npm install` 安装所有基础依赖。

## 2. 项目结构规划与清理

- **清理**: 删除 Vite 模板中自带的示例代码（例如 `src/my-element.ts` 和相关的样式及 HTML 内容）。
- **目录创建**:
    - 创建 `src/components/` 目录，用于存放所有独立的 UI 组件。
    - 创建 `src/styles/` 目录，用于存放全局样式、CSS 变量等。
    - 创建 `src/assets/` 目录，用于存放静态资源（如图标、图片）。

## 3. 编写 Cloud Build CI/CD 流水线 (部署到 GKE)

- **目标**: 创建 `cloudbuild.yaml`, `Dockerfile`, 以及 Kubernetes 清单文件，用于将前端应用容器化并自动部署到 GKE (Google Kubernetes Engine)。
- **Dockerfile**:
    - **多阶段构建**:
        - **构建阶段**: 使用 `node` 镜像，复制源代码，安装依赖并运行 `npm run build`。
        - **服务阶段**: 使用 `nginx` 镜像，从构建阶段复制 `dist` 目录下的产物和自定义的 `nginx.conf` 配置文件。
- **Kubernetes 清单 (`k8s/`)**:
    - **`deployment.yaml`**: 定义一个 Deployment，指定容器镜像、副本数量等。
    - **`service.yaml`**: 定义一个 Service，将流量导向 Deployment 中的 Pod。
    - **`gateway.yaml`**: 定义一个 gateway 允许外部对Service 的访问。
- **cloudbuild.yaml**:
    - **Build**: 构建 Docker 镜像。
    - **Push**: 将镜像推送到 Artifact Registry。
    - **Deploy**: 获取 GKE 集群的凭据，然后使用 `kubectl apply` 命令应用 `k8s/` 目录下的所有清单文件，以完成部署或更新。

## 4. 静态 UI 组件开发 (无逻辑)

- **目标**: 专注于使用 Lit 和 CSS 构建纯静态的、可视化的组件。
- **组件列表**:
    - `conversation-list.ts`: 渲染一个静态的对话列表，包含几个假数据项，用于展示选中和未选中的状态。
    - `message-bubble.ts`: 创建一个能根据 `role` 属性（'user' 或 'assistant'）显示不同背景颜色和对齐方式的消息气泡。
    - `chat-window.ts`: 渲染一个包含多个静态 `message-bubble` 组件的聊天记录窗口。
    - `chat-input.ts`: 创建一个包含文本输入框和“发送”按钮的表单。
- **CSS 样式**: 为每个组件编写独立的样式，定义在组件的 `static styles` 块中，以实现样式封装。

## 5. 根组件与应用布局组装

- **创建 `chat-app.ts`**: 这是我们的主应用组件。
- **布局**: 在 `chat-app.ts` 的 `render` 方法中，使用 CSS (如 Flexbox 或 Grid) 将 `conversation-list` 和 `chat-window` / `chat-input` 组合成一个经典的聊天应用布局（左侧边栏，右侧主区域）。
- **集成**: 将所有静态组件导入到 `chat-app.ts` 中并进行渲染，此时整个应用应该是一个纯静态的、但看起来完整的界面。

## 6. 实现 Google IAP 登录流程

- **目标**: 集成 Google IAP (Identity-Aware Proxy) 以保护应用，并实现用户登录/登出流程。
- **工作原理**: IAP 会在应用外部自动拦截未登录的用户，并展示 Google 的标准登录页面。我们的前端应用**不需要自己构建登录页面**。
- **前端任务**:
    - **创建登录/登出组件 (`auth-component.ts`)**:
        - 如果用户未登录，显示一个“登录”按钮。点击该按钮会**刷新页面或跳转到应用根 URL**，从而触发 IAP 的登录拦截。
        - 如果用户已登录，显示用户的邮箱（从后端获取）和一个“登出”按钮。
    - **获取用户信息**: 创建一个后端 API 调用（例如 `GET /api/v1/userinfo`），该调用会返回由 IAP 注入到请求头中的用户信息。
    - **条件渲染**: 在主应用组件 (`chat-app.ts`) 中，调用 `userinfo` API。只有在成功获取用户信息后，才渲染核心的聊天界面。否则，只显示登录组件。
    - **登出流程**: “登出”按钮需要链接到一个特定的 URL，格式为 `/_gcp_iap/clear_login_cookie`，以便清除 IAP 的登录会话，然后将用户重定向回主页。

## 7. 前端内部交互逻辑实现

- **状态管理**: 在 `chat-app.ts` 中使用 `@state` 装饰器来管理应用级的状态，例如 `messages` 数组和 `conversations` 数组（此时仍使用假数据）。
- **事件处理**:
    - 在 `chat-input.ts` 中，当用户点击发送按钮时，派发一个 `message-sent` 自定义事件，并将输入框的内容作为事件的 `detail`。
    - 在 `chat-app.ts` 中监听这个事件，接收到新消息后，将其添加到 `messages` 数组中，Lit 的响应式系统会自动更新 `chat-window` 的显示。
    - 在 `conversation-list.ts` 中，为对话项添加点击事件，派发 `conversation-selected` 事件。`chat-app` 监听到后，可以更新主窗口的显示内容（例如显示一个标题）。

## 8. 后端 API 集成

- **服务层创建**: 创建 `src/services/api.ts` 文件。
- **函数定义**:
    - `fetchConversations()`: 实现 `GET /api/v1/conversations` 的调用。
    - `fetchMessages(conversationId)`: 实现 `GET /api/v1/conversations/{id}` 的调用。
    - `streamChat(messages)`: 实现 `POST /api/v1/chat` 的调用，并处理流式响应。
- **数据替换**:
    - 在 `chat-app.ts` 中，将之前使用的假数据替换为通过调用 `api.ts` 中的函数从后端获取的真实数据。
    - 修改 `message-sent` 事件的处理逻辑，使其调用 `streamChat` 函数，并将返回的流式数据块实时更新到界面上。

## 9. 最终优化与完善

- **加载状态**: 在进行 API 调用时，显示加载指示器。
- **错误处理**: 为 API 请求失败添加用户提示。
- **滚动行为**: 确保新消息出现时，聊天窗口能自动滚动到底部。
- **样式微调**: 对整体 UI 进行最后的样式打磨。
