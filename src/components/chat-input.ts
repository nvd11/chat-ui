// Import LitElement base class, html, and css from the 'lit' library.
import { LitElement, html, css } from 'lit';
// Import decorators. @state is used for internal component state that, when changed,
// triggers a component update/re-render.
import { customElement, state } from 'lit/decorators.js';

// Import the Shoelace components we are going to use in this component's template.
// This is how you make other web components available to use.
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

@customElement('chat-input')
export class ChatInput extends LitElement {
  // The @state decorator defines '_inputValue' as internal, private state for the component.
  // Unlike @property, @state is not meant to be set from the outside.
  // When '_inputValue' changes, Lit will automatically re-render the component.
  @state()
  private _inputValue = '';

  static styles = css`
    :host {
      display: block;
      padding: 8px;
      /* Add a subtle border on top of the input area */
      border-top: 1px solid var(--sl-color-neutral-200);
    }

    /* Shoelace components expose 'parts' that can be styled from the outside.
       Here, we are targeting the 'base' part of the <sl-input> component
       to customize its appearance. */
    sl-input::part(base) {
      border-radius: 0;
    }
    sl-button::part(base) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
    sl-input::part(input) {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  `;

  // A private method to handle the 'sl-input' event from the Shoelace input component.
  // This event fires whenever the input's value changes.
  private _handleInput(e: Event) {
    // We get the new value from the event's target and update our internal state.
    this._inputValue = (e.target as HTMLInputElement).value;
  }

  // A private method to handle the submission logic.
  private _handleSubmit() {
    // Ignore empty messages.
    if (this._inputValue.trim() === '') return;

    // Dispatch a custom event named 'message-sent'.
    // Parent components can listen for this event to know when the user has sent a message.
    // The 'detail' property carries the payload of the event.
    // 'bubbles: true' and 'composed: true' allow the event to travel up the DOM tree,
    // even out of the Shadow DOM.
    this.dispatchEvent(
      new CustomEvent('message-sent', {
        detail: { content: this._inputValue },
        bubbles: true,
        composed: true,
      })
    );
    // Clear the input field after sending.
    this._inputValue = '';
  }

  // A private method to handle keyboard events on the input field.
  private _handleKeydown(e: KeyboardEvent) {
    // If the user presses 'Enter' (and not Shift+Enter for a new line),
    // we prevent the default action (like a form submission) and call our submit handler.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this._handleSubmit();
    }
  }

  // The render method defines the component's HTML structure.
  render() {
    return html`
      <div style="display: flex;">
        <sl-input
          style="flex-grow: 1;"
          placeholder="Type a message..."
          .value=${this._inputValue}
          @sl-input=${this._handleInput}
          @keydown=${this._handleKeydown}
          clearable
        ></sl-input>
        <sl-button
          variant="primary"
          @click=${this._handleSubmit}
        >Send</sl-button>
      </div>
    `;
  }
}
