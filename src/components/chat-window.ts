// Import LitElement base class, html, and css.
import { LitElement, html, css } from 'lit';
// Import decorators for defining custom elements and properties.
import { customElement, property } from 'lit/decorators.js';

// Import the <message-bubble> component so we can use it in this component's template.
// This establishes the parent-child relationship between <chat-window> and <message-bubble>.
import './message-bubble';

// Define a TypeScript interface for the shape of a single message object.
// This helps with type safety and code completion.
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

@customElement('chat-window')
export class ChatWindow extends LitElement {
  // Define a public property 'messages' which will be an array of Message objects.
  // The parent component (<chat-app>) will pass the array of messages to this component
  // via this property.
  @property({ type: Array })
  messages: Message[] = [];

  static styles = css`
    :host {
      display: block; /* Make the component a block-level element. */
      height: 100%; /* Allow it to fill the vertical space given by its parent. */
      overflow-y: auto; /* If content overflows, show a vertical scrollbar. */
      padding: 16px;
      box-sizing: border-box; /* Ensures padding is included in the total height/width. */
    }
  `;

  // The render method describes the component's DOM structure.
  render() {
    // We use the .map() method to iterate over the 'messages' array.
    // For each message object in the array, we create a <message-bubble> component.
    return html`
      ${this.messages.map(
        (msg) => html`
          <message-bubble
            .role=${msg.role}
            .content=${msg.content}
          ></message-bubble>
        `
      )}
    `;
  }
}
