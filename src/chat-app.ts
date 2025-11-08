// Import the LitElement base class and core templating functions.
import { LitElement, html, css } from 'lit';
// Import decorators for defining custom elements and reactive properties.
import { customElement, state } from 'lit/decorators.js';
// Import the setBasePath utility from Shoelace to configure asset paths.
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

// Import Shoelace components that will be used in this component's template.
import '@shoelace-style/shoelace/dist/components/split-panel/split-panel.js';

// Import the light theme for Shoelace. This will be applied globally.
import '@shoelace-style/shoelace/dist/themes/light.css';

// Set the base path for all Shoelace assets (like icons).
// This tells Shoelace where to load its assets from.
// The path is relative to the root of the application.
setBasePath('node_modules/@shoelace-style/shoelace/dist/');

// Import our child components. This registers them and makes them available
// to be used in this component's template.
import './components/chat-window';
import './components/chat-input';
import './components/conversation-list';

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
    sl-split-panel {
      height: 100%;
      max-width: 1200px;
      margin: 0 auto; /* Center the panel horizontally */
      border: 1px solid #dcdcdc;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      /* CSS Custom Properties to style the Shoelace split panel */
      --min: 200px; /* Minimum width of the start panel */
      --max: 400px; /* Maximum width of the start panel */
    }
    .main-content {
      display: flex;
      flex-direction: column;
      height: 100%;
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
    // Update the state with the new selected ID, which will trigger a re-render.
    this._selectedConversationId = e.detail.id;
  }

  // Event handler for the 'message-sent' event dispatched by <chat-input>.
  private _handleMessageSent(e: CustomEvent) {
    const newMessage: Message = {
      role: 'user',
      content: e.detail.content,
    };
    
    const currentConvo = this._selectedConversation;
    if (currentConvo) {
      // Add the new message to the messages array of the current conversation.
      // It's important to create new array references (...) to ensure Lit's reactive system
      // detects the change. Directly pushing to the array might not trigger an update.
      currentConvo.messages = [...currentConvo.messages, newMessage];
      this._conversations = [...this._conversations]; 
    }
  }

  // The render method defines the component's DOM structure.
  render() {
    const selectedConvo = this._selectedConversation;

    return html`
      <sl-split-panel position="25">
        {/* The 'start' slot is for the left/top panel of the split panel. */}
        <conversation-list
          slot="start"
          .conversations=${this._conversations.map(c => ({id: c.id, name: c.name}))}
          .selectedConversationId=${this._selectedConversationId}
          @conversation-selected=${this._handleConversationSelected}
        ></conversation-list>
        
        {/* The 'end' slot is for the right/bottom panel. */}
        <div slot="end" class="main-content">
          <chat-window .messages=${selectedConvo?.messages || []}></chat-window>
          <chat-input @message-sent=${this._handleMessageSent}></chat-input>
        </div>
      </sl-split-panel>
    `;
  }
}
