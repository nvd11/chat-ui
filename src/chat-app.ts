// Import the LitElement base class and core templating functions.
import { LitElement, html, css } from 'lit';
// Import decorators for defining custom elements and reactive properties.
import { customElement, state } from 'lit/decorators.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

// Import Shoelace components that will be used in this component's template.
import '@shoelace-style/shoelace/dist/components/split-panel/split-panel.js';
import '@shoelace-style/shoelace/dist/components/drawer/drawer.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

// Import the light theme for Shoelace. This will be applied globally.
import '@shoelace-style/shoelace/dist/themes/light.css';

// Set the base path for Shoelace assets.
// In development, we point to the node_modules folder.
// In production, we point to the new, local assets folder.
const basePath = import.meta.env.DEV ? 'node_modules/@shoelace-style/shoelace/dist' : '/chat/shoelace';
setBasePath(basePath);

// Import our child components. This registers them and makes them available
// to be used in this component's template.
import './components/chat-window';
import './components/chat-input';
import './components/conversation-list';

// Import our new API function.
import { streamChat } from './services/api';

// Define TypeScript interfaces for our data structures to ensure type safety.
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  name: string;
  messages: Message[];
}

// Register this class as a custom element named 'chat-app'.
@customElement('chat-app')
export class ChatApp extends LitElement {
  // The @state decorator is used for internal, private reactive properties.
  // When any of these properties change, Lit will automatically re-render the component.
  
  // This holds the mock data for all conversations. In a real app, this would be fetched from an API.
  @state()
  private _conversations: Conversation[] = [
    {
      id: '1',
      name: 'First Chat',
      messages: [
        { role: 'user', content: 'Hello, assistant!' },
        { role: 'assistant', content: 'Hello! How can I help you today?' },
      ],
    },
    {
      id: '2',
      name: 'Deployment Debug',
      messages: [
        { role: 'user', content: 'Why is my deployment failing?' },
        { role: 'assistant', content: 'It seems to be a cache issue.' },
      ],
    },
  ];

  // This tracks the ID of the currently selected conversation.
  @state()
  private _selectedConversationId = '1';

  // This state controls the visibility of the drawer on mobile.
  @state()
  private _isDrawerOpen = false;

  // Scoped CSS for the component.
  static styles = css`
    :host {
      display: block;
      height: 100vh;
      font-family: sans-serif;
      background-color: #f0f2f5;
      padding: 16px;
      box-sizing: border-box;
    }
    .desktop-layout {
      display: none; /* Hidden on mobile by default */
    }
    .mobile-layout {
      display: flex; /* Shown on mobile by default */
      flex-direction: column;
      height: 100%;
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      border: 1px solid #dcdcdc;
    }
    .mobile-header {
      display: flex;
      align-items: center;
      padding: 0 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    .main-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      flex-grow: 1;
    }
    /* Media query for desktop screens */
    @media (min-width: 768px) {
      .desktop-layout {
        display: block; /* Show split panel on desktop */
        height: 100%;
      }
      .mobile-layout {
        display: none; /* Hide mobile layout on desktop */
      }
      sl-split-panel {
        height: 100%;
        max-width: 1200px;
        margin: 0 auto;
        border: 1px solid #dcdcdc;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        --min: 200px;
        --max: 400px;
      }
    }
    chat-window {
      flex-grow: 1; /* Make the chat window fill the available space */
      overflow-y: auto;
    }
  `;

  // A "getter" property to easily find the currently selected conversation object.
  private get _selectedConversation() {
    return this._conversations.find(
      (c) => c.id === this._selectedConversationId
    );
  }

  // Event handler for the 'conversation-selected' event dispatched by <conversation-list>.
  private _handleConversationSelected(e: CustomEvent) {
    this._selectedConversationId = e.detail.id;
    // Close the drawer after a selection is made on mobile.
    this._isDrawerOpen = false;
  }

  // Event handler for the 'message-sent' event dispatched by <chat-input>.
  private async _handleMessageSent(e: CustomEvent) {
    console.log('Received message-sent event:', e.detail.content);

    const userMessage: Message = {
      role: 'user',
      content: e.detail.content,
    };

    // Find the index of the current conversation
    const convoIndex = this._conversations.findIndex(
      (c) => c.id === this._selectedConversationId
    );
    if (convoIndex === -1) return;

    // Create a new messages array with the user's message added.
    const updatedMessages = [...this._conversations[convoIndex].messages, userMessage];
    
    // Create a new conversations array with the updated messages.
    // This ensures Lit detects the change.
    this._conversations = this._conversations.map((convo, index) => 
      index === convoIndex ? { ...convo, messages: updatedMessages } : convo
    );
    
    // Add a placeholder for the assistant's response
    const assistantMessagePlaceholder: Message = { role: 'assistant', content: '' };
    this._conversations = this._conversations.map((convo, index) => 
      index === convoIndex ? { ...convo, messages: [...convo.messages, assistantMessagePlaceholder] } : convo
    );

    try {
      console.log('Starting to stream chat...');
      for await (const chunk of streamChat(userMessage.content)) {
        console.log('Received chunk:', chunk);
        
        // To update the streaming message, we need to find it and update its content
        // immutably.
        this._conversations = this._conversations.map((convo, index) => {
          if (index === convoIndex) {
            // Get the last message (our placeholder)
            const lastMessage = convo.messages[convo.messages.length - 1];
            // Create a new message object with the appended chunk
            const updatedAssistantMessage = { ...lastMessage, content: lastMessage.content + chunk };
            // Return a new messages array with the last message replaced
            return { ...convo, messages: [...convo.messages.slice(0, -1), updatedAssistantMessage] };
          }
          return convo;
        });
      }
      console.log('Streaming finished.');
    } catch (error) {
      console.error('Error during streaming:', error);
      // Handle error by updating the placeholder message
      this._conversations = this._conversations.map((convo, index) => {
        if (index === convoIndex) {
          const lastMessage = convo.messages[convo.messages.length - 1];
          const updatedAssistantMessage = { ...lastMessage, content: 'Error: Could not get a response.' };
          return { ...convo, messages: [...convo.messages.slice(0, -1), updatedAssistantMessage] };
        }
        return convo;
      });
    }
  }

  // The render method defines the component's DOM structure.
  render() {
    const selectedConvo = this._selectedConversation;

    const conversationList = html`
      <conversation-list
        .conversations=${this._conversations.map(c => ({id: c.id, name: c.name}))}
        .selectedConversationId=${this._selectedConversationId}
        @conversation-selected=${this._handleConversationSelected}
      ></conversation-list>
    `;

    const mainContent = html`
      <div class="main-content">
        <chat-window .messages=${selectedConvo?.messages || []}></chat-window>
        <chat-input @message-sent=${this._handleMessageSent}></chat-input>
      </div>
    `;

    return html`
      <!-- Desktop Layout -->
      <div class="desktop-layout">
        <sl-split-panel position="25">
          <div slot="start">${conversationList}</div>
          <div slot="end">${mainContent}</div>
        </sl-split-panel>
      </div>

      <!-- Mobile Layout -->
      <div class="mobile-layout">
        <div class="mobile-header">
          <sl-icon-button 
            name="list" 
            label="Conversations"
            @click=${() => this._isDrawerOpen = true}
          ></sl-icon-button>
          <h3>${selectedConvo?.name || 'Chat'}</h3>
        </div>
        ${mainContent}
      </div>

      <sl-drawer 
        label="Conversations" 
        placement="start" 
        .open=${this._isDrawerOpen}
        @sl-hide=${() => this._isDrawerOpen = false}
      >
        ${conversationList}
      </sl-drawer>
    `;
  }
}
