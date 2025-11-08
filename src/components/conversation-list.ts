import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Import the Shoelace components used in this component.
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

// TypeScript interface for a single conversation object.
interface Conversation {
  id: string;
  name: string;
}

@customElement('conversation-list')
export class ConversationList extends LitElement {
  // Public property to receive the list of all conversations from the parent.
  @property({ type: Array })
  conversations: Conversation[] = [];

  // Public property to receive the ID of the currently selected conversation.
  // This is used to apply a 'selected' style.
  @property({ type: String })
  selectedConversationId = '';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column; /* Stack children vertically. */
      height: 100%;
      background-color: #f7f7f7;
    }
    sl-button {
      margin: 8px; /* Add some space around the button. */
    }
    sl-menu {
      flex-grow: 1; /* Allow the menu to take up all available vertical space. */
    }
    /* Custom style for the selected menu item. */
    /* We use a data-attribute selector for better semantics and to avoid conflicts. */
    sl-menu-item[data-selected] {
      background-color: var(--sl-color-primary-100);
      color: var(--sl-color-primary-700);
    }
  `;

  // Private method to handle clicks on a conversation item.
  private _handleConversationClick(id: string) {
    // It dispatches a custom event 'conversation-selected' to notify the parent component.
    this.dispatchEvent(
      new CustomEvent('conversation-selected', {
        detail: { id }, // The event payload contains the ID of the clicked conversation.
        bubbles: true,
        composed: true,
      })
    );
  }

  // Private method to handle clicks on the 'New Chat' button.
  private _handleNewChatClick() {
    // Dispatches a 'new-conversation' event to the parent.
    this.dispatchEvent(
      new CustomEvent('new-conversation', {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <sl-button variant="primary" @click=${this._handleNewChatClick}>
        <sl-icon slot="prefix" name="plus-lg"></sl-icon>
        New Chat
      </sl-button>
      <sl-menu>
        ${this.conversations.map(
          (convo) => html`
            <sl-menu-item
              ?data-selected=${this.selectedConversationId === convo.id}
              @click=${() => this._handleConversationClick(convo.id)}
            >
              ${convo.name}
            </sl-menu-item>
          `
        )}
      </sl-menu>
    `;
  }
}
