// Import necessary parts from the 'lit' library.
// LitElement is the base class for creating Lit components.
// html is a template literal tag used to write HTML templates.
// css is a template literal tag for writing component-specific CSS.
import { LitElement, html, css } from 'lit';

// Import decorators from 'lit/decorators.js'. Decorators are a special kind of declaration
// that can be attached to a class declaration, method, accessor, property, or parameter.
// @customElement defines a new custom element (e.g., <message-bubble>).
// @property defines a public property for the component that can receive data from its parent.
import { customElement, property } from 'lit/decorators.js';

// The @customElement decorator registers the class as a custom element with the browser.
// The tag name 'message-bubble' can now be used in HTML.
@customElement('message-bubble')
export class MessageBubble extends LitElement {
  // The @property decorator defines 'role' as a public property.
  // When a parent component uses <message-bubble .role=${'user'} ...>, this property will be set.
  // It has a type of either 'user' or 'assistant', with 'user' as the default.
  @property({ type: String })
  role: 'user' | 'assistant' = 'user';

  // Defines 'content' as another public property to hold the message text.
  @property({ type: String })
  content = '';

  // 'static styles' is a special static property where you define the CSS for this component.
  // The styles are scoped to this component, meaning they won't leak out and affect other elements.
  static styles = css`
    /* ':host' is a pseudo-class that selects the component itself (the <message-bubble> element). */
    :host {
      display: block; /* Makes the custom element behave like a block-level element (like a <div>). */
      margin-bottom: 12px;
    }

    .bubble-container {
      display: flex; /* Use flexbox for easy alignment. */
      width: 100%;
    }

    .bubble {
      padding: 10px 14px;
      border-radius: 18px;
      max-width: 75%;
      word-wrap: break-word; /* Ensures long words without spaces will wrap. */
    }

    /* Style for messages sent by the user. */
    .user {
      background-color: #0b93f6;
      color: white;
      margin-left: auto; /* This is the key to right-aligning the bubble. */
    }

    /* Style for messages from the assistant. */
    .assistant {
      background-color: #e5e5ea;
      color: black;
      margin-right: auto; /* This is the key to left-aligning the bubble. */
    }
  `;

  // The 'render()' method is a required part of a Lit component.
  // It returns a template (created with the 'html' tag) that defines the component's internal structure.
  // This method is automatically called by Lit whenever a property decorated with @property or @state changes.
  render() {
    // The 'html' template literal tag processes the HTML.
    // We use a template expression '${this.role}' to dynamically add a class to the div.
    // This will result in either class="bubble user" or class="bubble assistant".
    return html`
      <div class="bubble-container">
        <div class="bubble ${this.role}">
          ${this.content}
        </div>
      </div>
    `;
  }
}
