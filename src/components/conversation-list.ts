import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

// Import the logo image. Vite will handle the path correctly.
import logoUrl from '/logo.png';

interface Conversation {
  id: string;
  name: string;
}

@customElement('conversation-list')
export class ConversationList extends LitElement {
  @property({ type: Array })
  conversations: Conversation[] = [];

  @property({ type: String })
  selectedConversationId = '';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: #f7f7f7;
    }
    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .logo {
      height: 40px;
    }
    sl-button {
      margin: 8px;
    }
    sl-menu {
      flex-grow: 1;
    }
  `;

  private _handleConversationSelect(e: CustomEvent) {
    const selectedItem = e.detail.item;
    this.dispatchEvent(
      new CustomEvent('conversation-selected', {
        detail: { id: selectedItem.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleNewChatClick() {
    this.dispatchEvent(
      new CustomEvent('new-conversation', {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="logo-container">
        <img src=${logoUrl} alt="Logo" class="logo" />
      </div>
      <sl-button variant="primary" @click=${this._handleNewChatClick}>
        <sl-icon slot="prefix" name="plus-lg"></sl-icon>
        New Chat
      </sl-button>
      <sl-menu .value=${this.selectedConversationId} @sl-select=${this._handleConversationSelect}>
        ${this.conversations.map(
          (convo) => html`
            <sl-menu-item .value=${convo.id}>
              ${convo.name}
            </sl-menu-item>
          `
        )}
      </sl-menu>
    `;
  }
}
