# 指南：将 Vite + Lit 单页应用部署到 GKE 的子路径

本文档提供了一个全面的指南，介绍如何使用 Vite 初始化一个 Lit 单页应用（SPA），构建第一个页面，使用 Docker 和 Nginx 将其容器化，并最终部署到 Google Kubernetes Engine (GKE)。本文将重点详细介绍如何解决一个常见且棘手的问题：如何使用 GKE Gateway API 将应用部署在网站的子路径下（例如 `http://example.com/chat/`）。

## 先决条件

*   已配置并认证的 `gcloud` 命令行工具。
*   已安装 `kubectl` 命令行工具。
*   已安装 `node` 和 `npm`。
*   一个已启用 Gateway API 的 GKE 集群。
*   一个用于存放 Docker 镜像的 Google Artifact Registry 仓库。

## 第 1 步：项目初始化 (Vite + Lit)

首先，我们使用 Vite 初始化一个新的 Lit 项目。Vite 提供了极佳的开发体验和性能。

```bash
# 在一个新目录中创建项目
npm create vite@latest chat-ui -- --template lit-ts

# 进入项目目录
cd chat-ui

# 安装依赖
npm install
```

## 第 2 步：构建第一个页面

在我们将应用容器化之前，先在本地构建一个简单的 "Hello World" 页面，以确保开发环境正常工作。

**1. 清理模板文件:**
Vite 模板自带了一些示例文件，我们先将它们删除。

```bash
rm src/my-element.ts src/index.css
```

**2. 创建主应用组件 (`src/chat-app.ts`):**
这是我们应用的根组件。

```typescript
// src/chat-app.ts
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('chat-app')
export class ChatApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
    }
  `;

  render() {
    return html`
      <h1>Hello, Lit!</h1>
      <p>Your first page is working.</p>
    `;
  }
}
```

**3. 更新 `index.html`:**
修改项目根目录下的 `index.html`，让它加载我们刚刚创建的 `chat-app` 组件。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Chat UI</title>
    <!-- 加载我们的主组件 -->
    <script type="module" src="/src/chat-app.ts"></script>
  </head>
  <body>
    <!-- 使用我们的主组件 -->
    <chat-app></chat-app>
  </body>
</html>
```

**4. 启动本地开发服务器:**
运行以下命令来启动 Vite 的开发服务器。

```bash
npm run dev
```

Vite 会启动一个本地服务器（通常在 `http://localhost:5173`），并自动在浏览器中打开。您应该能看到 "Hello, Lit!" 的标题。Vite 的热模块替换 (HMR) 功能非常强大，当您修改并保存任何源文件时，浏览器中的页面都会自动更新，无需手动刷新。

## 第 3 步：容器化 (Dockerfile & Nginx)

为了在 Kubernetes 中运行我们的应用，需要将其打包成一个容器。我们将使用多阶段 Docker 构建来确保最终镜像的体积足够小。

**1. `Dockerfile`:**
此文件首先使用一个 Node.js 镜像来构建应用，然后将构建产生的静态文件复制到一个轻量级的 Nginx 镜像中。

```dockerfile
# 阶段 1: 构建应用
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 阶段 2: 使用 Nginx 提供服务
FROM nginx:1.25-alpine

# 复制自定义的 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制构建好的文件
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**2. `nginx.conf`:**
此配置告诉 Nginx 如何为我们的单页应用提供服务。`try_files` 指令是关键，它确保所有对不存在的文件的请求都会返回 `index.html`，从而让前端路由能够接管。

```nginx
server {
  listen 80;
  server_name localhost;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    # 尝试提供请求的文件，如果找不到则返回 index.html
    try_files $uri $uri/ /index.html;
  }
}
```

## 第 4 步：解决子路径部署的核心问题

这是本指南最关键的部分。当我们将一个单页应用部署到像 `/chat/` 这样的子路径时，会面临一个核心矛盾：

*   **浏览器的视角:** 浏览器需要知道所有的静态资源 (JS, CSS) 都应该从 `/chat/assets/...` 这样的路径去请求。
*   **服务器的视角:** 在我们 Pod 中运行的 Nginx 服务器，其文件根目录是 `/usr/share/nginx/html`。它认为所有的资源都在根路径下（例如 `/assets/...`），它对外部的 `/chat` 前缀一无所知。

### “双管齐下”的解决方案

正确的解决方案需要前端构建工具和 Gateway 路由规则的协同工作。

**1. 前端 (Vite 配置):**

我们必须配置 Vite，让它在构建时生成带有正确前缀的资源路径。这通过在 `vite.config.ts` 中设置 `base` 选项来实现。这个配置会告诉 Vite 在所有生成的资源 URL 前面加上 `/chat/`。

**`vite.config.ts`**
```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  base: 'chat/', // 注意：这里的 'chat/' 等同于 '/chat/'
})
```
这会构建出一个 `index.html` 文件，其中的脚本引用会是：
`<script src="/chat/assets/index.js"></script>`

**2. Gateway (路由配置):**

现在浏览器会正确地请求 `/chat/...` 路径了。我们需要告诉 Gateway，在将请求转发给后端的 Nginx 服务之前，先把这个 `/chat` 前缀“剥离”掉。这通过在 `HTTPRoute` 资源中添加一个 `URLRewrite` 过滤器来实现。

**`k8s/gateway.yaml` (相关部分)**
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
# ... metadata ...
spec:
  # ... parentRefs, hostnames ...
  rules:
    - matches:
      - path:
          type: PathPrefix
          value: /chat
      filters:
      - type: URLRewrite
        urlRewrite:
          path:
            type: ReplacePrefixMatch
            replacePrefixMatch: / # 这一行是关键！
      backendRefs:
        - name: chat-ui-frontend-service
          port: 80
```
**工作流程解析:**
1.  一个对 `http://jpgcp.shop/chat/assets/index.js` 的请求到达 Gateway。
2.  Gateway 匹配了 `/chat` 的路由规则。
3.  `URLRewrite` 过滤器生效。它将匹配到的前缀 (`/chat`) 替换为 `/`。
4.  请求的内部路径现在变成了 `/assets/index.js`。
5.  Gateway 将这个被修改过的请求转发给 `chat-ui-frontend-service`。
6.  Nginx 收到一个对 `/assets/index.js` 的请求，并在其根目录中正确地找到了文件。

## 第 5 步：Kubernetes 与 Cloud Build 清单

解决了核心问题后，我们可以设置我们的 K8s 清单和 CI/CD 流水线。

**1. `k8s/deployment.yaml`:**
注意 `IMAGE_PLACEHOLDER`，它将在 CI/CD 过程中被动态替换。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-ui-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: chat-ui-frontend
  template:
    metadata:
      labels:
        app: chat-ui-frontend
    spec:
      containers:
        - name: chat-ui-frontend
          image: IMAGE_PLACEHOLDER # 将被 Cloud Build 替换
          ports:
            - containerPort: 80
```

**2. `k8s/service.yaml`:**
一个简单的 `ClusterIP` 类型的服务。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: chat-ui-frontend-service
spec:
  type: ClusterIP
  selector:
    app: chat-ui-frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
```

**3. `cloudbuild.yaml`:**
这个文件将所有步骤串联起来，并使用 `$BUILD_ID` 来确保每次部署的镜像是唯一的，从而强制 GKE 进行滚动更新。

```yaml
substitutions:
  _APP_NAME: chat-ui-frontend
  _REPO_NAME: my-docker-repo
  _CLUSTER_NAME: my-cluster2
  _CLUSTER_LOCATION: europe-west2

steps:
  # 1. 构建带有唯一标签的 Docker 镜像
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--no-cache'
      - '-t'
      - '${_CLUSTER_LOCATION}-docker.pkg.dev/$PROJECT_ID/${_REPO_NAME}/${_APP_NAME}:$BUILD_ID'
      - '.'

  # 2. 推送镜像到 Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '${_CLUSTER_LOCATION}-docker.pkg.dev/$PROJECT_ID/${_REPO_NAME}/${_APP_NAME}:$BUILD_ID'

  # 3. 在 K8s 清单中替换镜像标签
  - name: 'gcr.io/cloud-builders/gcloud'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        sed -i "s|IMAGE_PLACEHOLDER|${_CLUSTER_LOCATION}-docker.pkg.dev/$PROJECT_ID/${_REPO_NAME}/${_APP_NAME}:$BUILD_ID|g" k8s/deployment.yaml

  # 4. 部署到 GKE
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args: [ 'container', 'clusters', 'get-credentials', '${_CLUSTER_NAME}', '--zone', '${_CLUSTER_LOCATION}', '--project', '$PROJECT_ID' ]
  - name: 'gcr.io/cloud-builders/kubectl'
    args: [ 'apply', '-f', 'k8s/' ]
    env:
      - 'CLOUDSDK_COMPUTE_ZONE=${_CLUSTER_LOCATION}'
      - 'CLOUDSDK_CONTAINER_CLUSTER=${_CLUSTER_NAME}'

images:
  - '${_CLUSTER_LOCATION}-docker.pkg.dev/$PROJECT_ID/${_REPO_NAME}/${_APP_NAME}:$BUILD_ID'
# ... (serviceAccount, logsBucket, etc.)
```

## 第 6 步：部署

最后，触发部署流程：

```bash
gcloud builds submit . --config=cloudbuild.yaml
```

部署成功后，您就可以通过 `http://<您的域名>/chat/` 访问您的应用了。
