# 指南：使用 Vite + Lit + Shoelace 构建静态聊天窗口

本指南将详细介绍如何使用 Vite 和 Lit 从零开始，一步步构建一个功能完整、外观专业的静态聊天应用界面。我们将采用组件化的思想，并集成 Shoelace UI 框架来美化组件。

## 第 1 步：项目初始化

首先，我们使用 Vite 的 Lit 模板来快速搭建一个开发环境。

```bash
# 创建项目目录并初始化
npm create vite@latest chat-ui -- --template lit-ts

# 进入项目目录
cd chat-ui

# 安装依赖
npm install
```

## 第 2 步：集成 Shoelace UI 框架

为了让我们的应用更美观，我们集成一个优秀的 Web Components UI 框架 Shoelace。

**1. 安装 Shoelace:**
```bash
npm install @shoelace-style/shoelace
```

**2. 配置资源路径:**
我们需要告诉 Lit/Vite 在哪里可以找到 Shoelace 的静态资源（主要是图标）。在你的主应用组件（例如 `src/chat-app.ts`）的顶部添加以下代码：
```typescript
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

// 这段代码会根据开发或生产环境，动态设置正确的资源路径
const basePath = import.meta.env.DEV ? 'node_modules/@shoelace-style/shoelace/dist' : 'assets';
setBasePath(basePath);
```
为了让生产环境的路径生效，我们还需要配置 Vite，在构建时将 Shoelace 的资源复制到输出目录。

**`vite.config.ts`**
```typescript
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@shoelace-style/shoelace/dist/assets',
          dest: '.'
        }
      ]
    })
  ]
})
```
(别忘了安装 `npm install -D vite-plugin-static-copy`)

## 第 3 步：构建组件

现在，我们来构建聊天界面的各个部分。

**1. `<message-bubble>`:**
这个组件保持不变，它不直接使用 Shoelace。

**`src/components/message-bubble.ts`**
```typescript
// ... (代码和之前一样) ...
```

**2. `<chat-input>` (使用 Shoelace):**
我们用 `<sl-input>` 和 `<sl-button>` 来创建一个更美观的输入框。

**`src/components/chat-input.ts`**
```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

@customElement('chat-input')
export class ChatInput extends LitElement {
  @state() private _inputValue = '';

  // ... (事件处理器逻辑和之前一样) ...

  render() {
    return html`
      <div style="display: flex;">
        <sl-input style="flex-grow: 1;" .value=${this._inputValue} @sl-input=${(e: any) => this._inputValue = e.target.value}></sl-input>
        <sl-button variant="primary" @click=${this._handleSubmit}>Send</sl-button>
      </div>
    `;
  }
}
```

**3. `<conversation-list>` (使用 Shoelace):**
我们用 `<sl-button>` 和 `<sl-menu>` 来创建侧边栏。

**`src/components/conversation-list.ts`**
```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import logoUrl from '/logo.png'; // 导入 Logo

@customElement('conversation-list')
export class ConversationList extends LitElement {
  @property({ type: Array }) conversations: {id: string, name: string}[] = [];
  @property({ type: String }) selectedConversationId = '';

  // ... (事件处理器逻辑和之前一样) ...

  render() {
    return html`
      <div class="logo-container"><img src=${logoUrl} alt="Logo" class="logo" /></div>
      <sl-button variant="primary" @click=${this._handleNewChatClick}>
        <sl-icon slot="prefix" name="plus-lg"></sl-icon> New Chat
      </sl-button>
      <sl-menu>
        ${this.conversations.map(
          (convo) => html`
            <sl-menu-item ?data-selected=${this.selectedConversationId === convo.id} @click=${() => this._handleConversationClick(convo.id)}>
              ${convo.name}
            </sl-menu-item>
          `
        )}
      </sl-menu>
    `;
  }
}
```

## 第 4 步：组装主应用 `<chat-app>`

最后，我们用 Shoelace 的 `<sl-split-panel>` 来组装整个应用，并添加一些样式来美化布局。

**`src/chat-app.ts`**
```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import '@shoelace-style/shoelace/dist/components/split-panel/split-panel.js';
import '@shoelace-style/shoelace/dist/themes/light.css';
// ... (设置 basePath 和导入子组件) ...

@customElement('chat-app')
export class ChatApp extends LitElement {
  // ... (状态和事件处理器和之前一样) ...

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      background-color: #f0f2f5;
      padding: 16px;
      box-sizing: border-box;
    }
    sl-split-panel {
      height: 100%;
      max-width: 1200px;
      margin: 0 auto;
      border: 1px solid #dcdcdc;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    /* ... (其他样式) ... */
  `;

  render() {
    return html`
      <sl-split-panel position="25">
        <conversation-list slot="start" ... ></conversation-list>
        <div slot="end" class="main-content">
          <chat-window ... ></chat-window>
          <chat-input ... ></chat-input>
        </div>
      </sl-split-panel>
    `;
  }
}
```

通过以上步骤，我们就构建了一个使用了现代化 UI 框架、结构清晰、外观专业的静态聊天应用。
